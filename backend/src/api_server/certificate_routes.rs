use actix_web::{get, web, HttpResponse, Responder};
use itertools::Itertools;
use crate::certificate_generation::{merge_pdfs, AgeGroupID, AgeGroupIDs, AthleteID, GroupID, PDF, PDFMessage};
use crate::time_planner::{TimeGroupID};
use crate::Storage;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_certificate);
    cfg.service(get_group_results);
    cfg.service(get_age_group_results);
    cfg.service(get_certificates);
    cfg.service(get_all_age_group_results);
}

#[get("/certificate")]
async fn get_certificate(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: web::Query<AthleteID>,
) -> impl Responder {
    let achievement_id = query.into_inner();
    let athlete = data.get_athlete(&achievement_id).await;

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
    let group = data.get_group(&group_id).await;

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
    let group = data.get_group(&group_id).await;

    let time_group_id = TimeGroupID::new(group_id.name.unwrap_or("".to_string()));
    let time_group = data.get_time_group(&time_group_id).await;
    let disciplines = match time_group {
        Some(time_group) => {
            time_group.get_disciplines().clone()
        }
        None => vec![]
    };

    let included_disciplines = Some(disciplines
        .iter()
        .filter(|e| e.is_finished())
        .map(|e| e.name().to_string())
        .collect());
    
    match group {
        Some(group) => {
            let certificate = PDF::new_group_result(&group, included_disciplines);
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
    let age_group = data.get_age_group(&group_id).await;

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

#[get("/all_age_group_results")]
async fn get_all_age_group_results(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: web::Query<AgeGroupIDs>,
) -> impl Responder {

    let mut pdfs: Vec<PDF> = Vec::new();
    let age_group_ids= query.into_inner().convert();
    
    match age_group_ids {
        Ok(age_group_ids) => {
            for age_group_id in age_group_ids {
                let age_group = match data.get_age_group(&age_group_id).await {
                    Some(age_group) => age_group,
                    None =>  {
                        println!("Age group not found");
                        continue;
                    }
                };
                let certificate = match PDF::build_from_age_group_result(&age_group){
                    Ok(pdf) => pdf,
                    Err(e) =>{
                        println!("Not able to generate pdf: {e}");
                        continue;
                    }
                };
                pdfs.push(certificate);
            }
        },
        Err(e) => return HttpResponse::InternalServerError().body(format!("Error converting Age group ids: {}", e))
    };

    let final_pdf = match merge_pdfs(pdfs){
        Ok(content) => {
            PDFMessage::new(content)
        },
        Err(e) => return HttpResponse::InternalServerError().body(format!("Error merging Pdfs: {}", e))
    };


    HttpResponse::Ok()
            .content_type("application/pdf")
            .body(final_pdf)
    
}