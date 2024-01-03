use std::sync::Mutex;
use actix_web::{get, web, HttpResponse, Responder, post, put};
use futures::StreamExt;
use crate::certificate_generation::{Athlete, AthleteID, PersistantStorage};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_athlete);
    cfg.service(post_athlete);
    cfg.service(update_athlete);
}

#[get("/athlete")]
async fn get_athlete(
    data: web::Data<Mutex<Box<dyn PersistantStorage + Send + Sync>>>,
    query: web::Query<AthleteID>,
) -> impl Responder {
    let athlete_id = query.into_inner();
    let athlete = data.lock().expect("Mutex Lock poised").get_athlete(&athlete_id);

    match athlete {
        Some(athlete) => HttpResponse::Ok().body(serde_json::to_string(&athlete).expect("Athlete should be serializable")),
        None => HttpResponse::NotFound().body("Not found")
    }
}

#[post("/athlete")]
async fn post_athlete(
    mut data: web::Data<Mutex<Box<dyn PersistantStorage + Send + Sync>>>,
    mut body: web::Payload,
) -> impl Responder {
    // Read the request body as bytes
    let mut bytes = web::BytesMut::new();
    while let Some(item) = body.next().await {
        let chunk = item.unwrap();
        bytes.extend_from_slice(&chunk);
    }
    let json_string = String::from_utf8_lossy(&bytes).to_string();
    let athlete = Athlete::from_json(json_string.as_str());
    match athlete {
        Ok(athlete) => {
            match data.lock().unwrap().write_athlete(AthleteID::from_athlete(&athlete), athlete) {
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
    mut data: web::Data<Mutex<Box<dyn PersistantStorage + Send + Sync>>>,
    mut body: web::Payload,
    athlete_id: web::Query<AthleteID>,
) -> impl Responder {
    // Read the request body as bytes
    let mut bytes = web::BytesMut::new();
    while let Some(item) = body.next().await {
        let chunk = item.unwrap();
        bytes.extend_from_slice(&chunk);
    }
    let json_string = String::from_utf8_lossy(&bytes).to_string();

    match data.lock().unwrap().update_athlete(athlete_id.into_inner(), json_string.as_str()) {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error updating Athlete: {}", e))
    }
}
