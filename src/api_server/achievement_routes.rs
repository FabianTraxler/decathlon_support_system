use actix_web::{get, web, HttpResponse, Responder, post, put};
use super::parse_json_body;
use crate::certificate_generation::{Achievement, AchievementID, AthleteID};
use crate::Storage;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_achievement);
    cfg.service(post_achievement);
    cfg.service(update_achievement);
}

#[get("/achievement")]
async fn get_achievement(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: web::Query<AchievementID>,
) -> impl Responder {
    let achievement_id = query.into_inner();
    let achievement = data.get_achievement(&achievement_id);

    match achievement {
        Some(achievement) => HttpResponse::Ok().body(serde_json::to_string(&achievement).expect("Achievement should be serializable")),
        None => HttpResponse::NotFound().body("Not found")
    }
}

#[post("/achievement")]
async fn post_achievement(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
    query: web::Query<AthleteID>,
) -> impl Responder {
    let json_string = parse_json_body(body).await;

    let achievement = Achievement::from_json(json_string.as_str());
    let athlete_id = query.into_inner();
    match achievement {
        Ok(achievement) => {
            match data.write_achievement(AchievementID::build(athlete_id, &achievement), achievement) {
                Ok(msg) => {
                    HttpResponse::Ok().body(msg)
                }
                Err(e) => HttpResponse::InternalServerError().body(format!("Error inserting Achievement: {}", e))
            }
        }
        Err(e) => HttpResponse::BadRequest().body(format!("Error parsing Achievement JSON: {}", e))
    }
}

#[put("/achievement")]
async fn update_achievement(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
    achievement_id: web::Query<AchievementID>,
) -> impl Responder {
    let json_string = parse_json_body(body).await;

    match data.update_achievement(achievement_id.into_inner(), json_string.as_str()) {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error updating Achievement: {}", e))
    }
}
