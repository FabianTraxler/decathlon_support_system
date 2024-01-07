use actix_web::{get, web, HttpResponse, Responder, post, put};
use super::parse_json_body;
use crate::certificate_generation::{Athlete, AthleteID, PersistentStorage};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_athlete);
    cfg.service(post_athlete);
    cfg.service(update_athlete);
}

#[get("/athlete")]
async fn get_athlete(
    data: web::Data<Box<dyn PersistentStorage + Send + Sync>>,
    query: web::Query<AthleteID>,
) -> impl Responder {
    let athlete_id = query.into_inner();
    let athlete = data.get_athlete(&athlete_id);

    match athlete {
        Some(athlete) => HttpResponse::Ok().body(serde_json::to_string(&athlete).expect("Athlete should be serializable")),
        None => HttpResponse::NotFound().body("Not found")
    }
}

#[post("/athlete")]
async fn post_athlete(
    data: web::Data<Box<dyn PersistentStorage + Send + Sync>>,
    body: web::Payload,
) -> impl Responder {
    let json_string = parse_json_body(body).await;
    let athlete = Athlete::from_json(json_string.as_str());
    match athlete {
        Ok(athlete) => {
            match data.write_athlete(AthleteID::from_athlete(&athlete), athlete) {
                Ok(msg) => {
                    HttpResponse::Ok().body(msg)
                }
                Err(e) => HttpResponse::InternalServerError().body(format!("Error inserting Athlete: {}", e))
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error parsing Athlete JSON: {}", e))
    }
}

#[put("/athlete")]
async fn update_athlete(
    data: web::Data<Box<dyn PersistentStorage + Send + Sync>>,
    body: web::Payload,
    athlete_id: web::Query<AthleteID>,
) -> impl Responder {
    let json_string = parse_json_body(body).await;

    match data.update_athlete(athlete_id.into_inner(), json_string.as_str()) {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error updating Athlete: {}", e))
    }
}
