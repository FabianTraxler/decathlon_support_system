use actix_web::{get, web, HttpResponse, Responder};
use crate::certificate_generation::{PDF, AthleteID, GroupID, AgeGroupID};
use crate::Storage;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_certificate);
    cfg.service(get_group_results);
    cfg.service(get_age_group_results);
    cfg.service(get_certificates);
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
                Ok(pdf) => HttpResponse::Ok()
                    .content_type("application/pdf")
                    .body(pdf),
                Err(e) => HttpResponse::InternalServerError().body(format!("Error generating PDF: {}", e))
            }

        },
        None => HttpResponse::NotFound().body("Athlete not found")
    }
}

#[get("/certificates")]
async fn get_certificates(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: web::Query<GroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let group = data.get_group(&group_id);

    match group {
        Some(group) => {
            let certificates = PDF::new_group_certificates(&group);
            let pdf_message = certificates.to_http_message();
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

#[get("/age_group_results")]
async fn get_age_group_results(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: web::Query<AgeGroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    let age_group = data.get_age_group(&group_id);

    match age_group {
        Some(age_group) => {
            let certificate = match PDF::build_from_age_group_result(&age_group){
                Ok(pdf) => pdf,
                Err(e) => return HttpResponse::InternalServerError().body(format!("Error generating PDF: {}", e))
            };
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