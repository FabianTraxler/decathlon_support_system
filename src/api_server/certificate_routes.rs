use std::fmt::format;
use actix_web::{get, web, HttpResponse, Responder, post, put};
use super::parse_json_body;
use crate::certificate_generation::{PDF, AchievementID, AthleteID, PersistentStorage};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_certificate);
}

#[get("/certificate")]
async fn get_certificate(
    data: web::Data<Box<dyn PersistentStorage + Send + Sync>>,
    query: web::Query<AthleteID>,
) -> impl Responder {
    let achievement_id = query.into_inner();
    let athlete = data.get_athlete(&achievement_id);

    match athlete {
        Some(athlete) => {
            let certificate = PDF::new_certificate(&athlete);
            let pdf_message = certificate.to_http_message();
            match pdf_message {
                Ok(pdf_message) => HttpResponse::Ok()
                    .content_type("application/pdf")
                    .body(pdf_message),
                Err(e) => HttpResponse::InternalServerError().body(format!("Error generating PDF: {}", e))
            }

        },
        None => HttpResponse::NotFound().body("Athlete not found")
    }
}