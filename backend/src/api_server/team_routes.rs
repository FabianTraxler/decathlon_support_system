use crate::Storage;
use actix_web::{get, web, HttpResponse, Responder, post};
use actix_web::web::Query;
use crate::api_server::parse_json_body;
use crate::notes::{NoteID};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_team);
    cfg.service(post_team);
    cfg.service(update_team);
    cfg.service(get_teams);
}

#[get("/teams")]
async fn get_teams(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
) -> impl Responder {
    match data.get_teams().await {
        Ok(note) => {
            match(note) {
                Some(note) => {
                    HttpResponse::Ok()
                            .body(note)
                    }
                None => HttpResponse::NotFound().body("")
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error retrieving note: {}", e))
    }    
}

#[get("/team")]
async fn get_team(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TeamID>,
) -> impl Responder {
    let team_id: TeamID = query.into_inner();

    match data.get_team(team_id).await {
        Ok(note) => {
            match(note) {
                Some(note) => {
                    HttpResponse::Ok()
                            .body(note)
                    }
                None => HttpResponse::NotFound().body("")
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error retrieving note: {}", e))
    }    
}

#[post("/team")]
async fn post_team(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
    query: Query<TeamID>,
) -> impl Responder {
    let json_string = parse_json_body(body).await;
    let team_id: TeamID = query.into_inner();

    match data.save_team(team_id, json_string).await {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error saving note: {}", e))
    }
}


#[put("/team")]
async fn update_team(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
    query: Query<TeamID>,
) -> impl Responder {
    let json_string = parse_json_body(body).await;
    let team_id: TeamID = query.into_inner();

    match data.update_team(team_id, json_string).await {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error saving note: {}", e))
    }
}
