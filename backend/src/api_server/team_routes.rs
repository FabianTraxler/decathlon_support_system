use crate::Storage;
use actix_web::{get, web, HttpResponse, Responder, post, put, delete};
use actix_web::web::Query;
use crate::api_server::parse_json_body;
use crate::teams::{TeamID, Team};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_team);
    cfg.service(post_team);
    cfg.service(update_team);
    cfg.service(get_teams);
    cfg.service(delete_team);
}

#[get("/teams")]
async fn get_teams(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
) -> impl Responder {
    match data.get_teams().await {
        Ok(teams) => HttpResponse::Ok().body(serde_json::to_string(&teams).expect("Teams should be serializable")),
        Err(e) => HttpResponse::InternalServerError().body(format!("Error getting teams: {}", e))
    }
}

#[get("/team")]
async fn get_team(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TeamID>,
) -> impl Responder {
    let team_id: TeamID = query.into_inner();

    match data.get_team(&team_id).await {
        Ok(team) => {
            match team {
                Some(team) => {
                    HttpResponse::Ok()
                        .body(serde_json::to_string(&team).expect("Team should be serializable"))
                }
                None => HttpResponse::NotFound().body("")
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error getting team: {}", e))
    }
}

#[post("/team")]
async fn post_team(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
) -> impl Responder {
    let json_string = parse_json_body(body).await;

    match Team::from_json(&json_string){
        Ok(team) => {
            match data.save_team(&team).await {
                Ok(msg) => {
                    HttpResponse::Ok().body(msg)
                }
                Err(e) => HttpResponse::InternalServerError().body(format!("Error saving team: {}", e))
            }
        }
        Err(e) => HttpResponse::BadRequest().body(format!("Invalid team data: {}", e))
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

    match data.update_team(&team_id, &json_string).await {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error saving nteamote: {}", e))
    }
}


#[delete("/team")]
async fn delete_team(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<TeamID>,
) -> impl Responder {
    let team_id: TeamID = query.into_inner();
    match data.delete_team(&team_id).await {
        Ok(_) => HttpResponse::Ok().body("Team deleted"),
        Err(e) => HttpResponse::InternalServerError().body(format!("Error deleting team: {}", e))
    }
}