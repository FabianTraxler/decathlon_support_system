use actix_web::{get, web, HttpResponse, Responder};
use crate::certificate_generation::{PDF, AthleteID, GroupID};
use crate::Storage;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_certificate);
    cfg.service(get_group_results);
}

#[get("/certificate")]
async fn get_certificate(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
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

#[get("/group_results")]
async fn get_group_results(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: web::Query<GroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_group(&group_id);

    match group {
        Some(group) => {
            let certificate = PDF::new_group_result(&group);
            let pdf_message = certificate.to_http_message();
            match pdf_message {
                Ok(pdf_message) => HttpResponse::Ok()
                    .content_type("application/pdf")
                    .body(pdf_message),
                Err(e) => HttpResponse::InternalServerError().body(format!("Error generating PDF: {}", e))
            }

        },
        None => HttpResponse::NotFound().body("Group not found")
    }
}