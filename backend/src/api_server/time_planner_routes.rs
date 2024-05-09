use crate::Storage;
use actix_web::{get, web, HttpResponse, Responder, post, put};
use actix_web::web::{Query};
use serde_json::Value;
use crate::api_server::parse_json_body;
use crate::certificate_generation::{GroupID, PDF};
use crate::time_planner::{TimeGroupID, StartingOrder, ProtocolID};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_discipline);
    cfg.service(get_disciplines);
    cfg.service(get_next_discipline);
    cfg.service(get_discipline_protocol);
    cfg.service(get_starting_order);
    cfg.service(get_track_starting_order);
    cfg.service(change_starting_order);
    cfg.service(upload_time_table);
    cfg.service(change_discipline_state);
}

#[get("/current_discipline")]
async fn get_discipline(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TimeGroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_time_group(&group_id).await;
    match group {
        Some(mut group) => {
            let discipline = group.get_current_discipline().clone();
            match data.store_time_group(group).await {
                Ok(_) => HttpResponse::Ok()
                    .body(serde_json::to_string(&discipline)
                        .expect("Discipline should be serializable")),
                Err(e) => HttpResponse::BadRequest().body(format!("Error storing updated group: {e}"))
            }
        }
        None => HttpResponse::NotFound().body("Group Not Found")
    }
}

#[get("/next_discipline")]
async fn get_next_discipline(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TimeGroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_time_group(&group_id).await;
    match group {
        Some(group) => {
            let discipline = group.get_next_discipline();
            HttpResponse::Ok()
                .body(serde_json::to_string(&discipline)
                    .expect("Discipline should be serializable"))
        }
        None => HttpResponse::NotFound().body("Group Not Found")
    }
}

#[put("/discipline_state")]
async fn change_discipline_state(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TimeGroupID>,
    body: web::Payload,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_time_group(&group_id).await;
    let json_string = parse_json_body(body).await;

    match group {
        Some(mut group) => {
            match group.change_discipline_state(json_string.as_str()) {
                Ok(msg) => {
                    match data.store_time_group(group).await {
                        Ok(_) => HttpResponse::Ok().body(msg),
                        Err(e) => HttpResponse::BadRequest().body(format!("Error storing updated group: {e}"))
                    }
                }
                Err(e) => HttpResponse::BadRequest().body(format!("Error updating state: {e}"))
            }
        }
        None => HttpResponse::NotFound().body("Group Not Found")
    }
}

#[get("/disciplines")]
async fn get_disciplines(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TimeGroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_time_group(&group_id).await;
    match group {
        Some(group) => {
            let disciplines = group.get_disciplines().clone();
            HttpResponse::Ok()
                .body(serde_json::to_string(&disciplines)
                    .expect("Discipline should be serializable"))
        }
        None => HttpResponse::NotFound().body("Group Not Found")
    }
}

#[get("/discipline_protocol")]
async fn get_discipline_protocol(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<ProtocolID>,
) -> impl Responder {
    let discipline_id = query.into_inner();
    let time_group_id = TimeGroupID::new(discipline_id.group_name());
    let time_group = data.get_time_group(&time_group_id).await;
    match time_group {
        Some(mut time_group) => {
            let discipline = match discipline_id.discipline_name() {
                Some(discipline_name) => {
                    match time_group.get_discipline(&discipline_name){
                        Some(discipline) => discipline,
                        None => return HttpResponse::NotFound().body(format!("Unable to find discipline {} in group", discipline_name))
                    }
                }
                None => {
                    time_group.get_current_discipline()
                }
            };
            let group = match data.get_group(&GroupID::new(&discipline_id.group_name())).await {
                Some(group) => group,
                None => return HttpResponse::NotFound().body(format!("Unable to find group {}", discipline_id.group_name()))
            };
            let certificate = PDF::new_discipline_protocol(&group, &discipline);
            let pdf_message = certificate.to_http_message();
            match pdf_message {
                Ok(pdf_message) => HttpResponse::Ok()
                    .content_type("application/pdf")
                    .body(pdf_message),
                Err(e) => HttpResponse::InternalServerError().body(format!("Error generating PDF: {}", e))
            }
        }
        None => HttpResponse::NotFound().body("Time-Group Not Found")
    }
}


#[get("/starting_order")]
async fn get_starting_order(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TimeGroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_time_group(&group_id).await;
    match group {
        Some(group) => {
            let discipline = group.get_default_starting_order();
            HttpResponse::Ok()
                .body(serde_json::to_string(&discipline)
                    .expect("Discipline should be serializable"))
        }
        None => HttpResponse::NotFound().body("Group Not Found")
    }
}

#[get("/track_starting_order")]
async fn get_track_starting_order(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TimeGroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_time_group(&group_id).await;
    match group {
        Some(group) => {
            let discipline = group.get_default_track_order();
            HttpResponse::Ok()
                .body(serde_json::to_string(&discipline)
                    .expect("Discipline should be serializable"))
        }
        None => HttpResponse::NotFound().body("Group Not Found")
    }
}

#[put("/change_starting_order")]
async fn change_starting_order(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TimeGroupID>,
    body: web::Payload,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_time_group(&group_id).await;

    match group {
        Some(mut group) => {
            let json_string = parse_json_body(body).await;
            let starting_order: serde_json::error::Result<StartingOrder> = serde_json::from_str(json_string.as_str());
            match starting_order {
                Ok(starting_order) => {
                    group.change_starting_order(starting_order);
                    match data.store_time_group(group).await {
                        Ok(_) => HttpResponse::Ok().body("Starting Order changed"),
                        Err(e) => HttpResponse::InternalServerError()
                            .body(format!("Could not store new starting order: {}", e))
                    }
                }
                Err(e) => {
                    HttpResponse::BadRequest().body(format!("Could not parse starting order: {}", e))
                }
            }
        }
        None => HttpResponse::NotFound().body("Group Not Found")
    }
}

#[post("/time_table")]
async fn upload_time_table(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
) -> impl Responder {
    let json_string = parse_json_body(body).await;
    let time_table: serde_json::error::Result<Value> = serde_json::from_str(json_string.as_str());
    match time_table {
        Ok(time_table) => {
            match data.store_time_plan(time_table).await {
                Ok(msg) => HttpResponse::Ok().body(msg),
                Err(e) => HttpResponse::InternalServerError().body(format!("Error storing time table: {}", e))
            }
        }
        Err(e) => {
            HttpResponse::BadRequest().body(format!("Could not parse time table: {}", e))
        }
    }
}