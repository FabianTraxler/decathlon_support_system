use crate::PersistantStorage;
use actix_web::{get, web, HttpResponse, Responder, post, put};
use actix_web::web::{Query};
use crate::api_server::parse_json_body;

use crate::certificate_generation::{GroupID, GroupStore};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_group);
    cfg.service(post_group);
    cfg.service(update_group);
}

#[get("/group")]
async fn get_group(
    data: web::Data<Box<dyn PersistantStorage + Send + Sync>>,
    query: Query<GroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_group(&group_id);
    match group {
        Some(group) => HttpResponse::Ok()
            .body(serde_json::to_string(&group)
                .expect("Group should be serializable")),
        None => HttpResponse::NotFound().body("Not found")
    }
}

#[post("/group")]
async fn post_group(
    data: web::Data<Box<dyn PersistantStorage + Send + Sync>>,
    body: web::Payload,
) -> impl Responder {
    let json_string = parse_json_body(body).await;

    let group_store = GroupStore::from_json(json_string.as_str());
    match group_store {
        Ok(group_store) => {
            match data.write_group_store(GroupID::from_group_store(&group_store), group_store) {
                Ok(msg) => {
                    HttpResponse::Ok().body(msg)
                }
                Err(e) => HttpResponse::InternalServerError().body(format!("Error inserting Group: {}", e))
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error parsing Athlete JSON: {}", e))
    }
}


#[put("/group")]
async fn update_group(
    data: web::Data<Box<dyn PersistantStorage + Send + Sync>>,
    body: web::Payload,
    query: Query<GroupID>
) -> impl Responder {
    let json_string = parse_json_body(body).await;

    let group_id = query.into_inner();

    match data.update_group(group_id, json_string.as_str()) {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error updating Group: {}", e))
    }
}