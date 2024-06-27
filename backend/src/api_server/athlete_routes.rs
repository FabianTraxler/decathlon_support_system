use std::error::Error;
use actix_web::{get, web, HttpResponse, Responder, post, put};
use serde_json::Value;
use super::parse_json_body;
use crate::certificate_generation::{Athlete, AthleteID, GroupID};
use crate::Storage;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_athletes);
    cfg.service(get_athlete);
    cfg.service(post_athlete);
    cfg.service(update_athlete);
    cfg.service(post_athlete_with_group);
}

#[get("/athletes")]
async fn get_athletes(
    data: web::Data<Box<dyn Storage + Send + Sync>>
) -> impl Responder {
    let mut group_athletes = data.get_athletes().await;

    for (_, athletes) in group_athletes.iter_mut() {
        for athlete in athletes.iter_mut() {
            athlete.compute_total_points();
        }
    }
    HttpResponse::Ok().body(serde_json::to_string(&group_athletes).expect("Athlete should be serializable"))
}

#[get("/athlete")]
async fn get_athlete(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: web::Query<AthleteID>,
) -> impl Responder {
    let athlete_id = query.into_inner();
    let athlete = data.get_athlete(&athlete_id).await;

    match athlete {
        Some(mut athlete) => {
            athlete.compute_total_points();
            HttpResponse::Ok().body(serde_json::to_string(&athlete).expect("Athlete should be serializable"))
        }
        None => HttpResponse::NotFound().body("Not found")
    }
}

#[post("/athlete")]
async fn post_athlete(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
) -> impl Responder {
    let json_string = parse_json_body(body).await;
    let athlete = Athlete::from_json(json_string.as_str());
    match athlete {
        Ok(athlete) => {
            match data.write_athlete(AthleteID::from_athlete(&athlete), athlete).await {
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
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
    athlete_id: web::Query<AthleteID>,
) -> impl Responder {
    let json_string = parse_json_body(body).await;

    match data.update_athlete(athlete_id.into_inner(), json_string.as_str()).await {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error updating Athlete: {}", e))
    }
}

#[post("/group_athlete")]
async fn post_athlete_with_group(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
) -> impl Responder {
    let json_string = parse_json_body(body).await;

    let athlete = Athlete::from_json(json_string.as_str());

    match athlete {
        Ok(athlete) => {
            match data.write_athlete(AthleteID::from_athlete(&athlete), athlete).await {
                Ok(msg) => {
                    match add_athlete_to_group(json_string.as_str(), data).await{
                        Ok(group_msg) => HttpResponse::Ok().body(msg + " " +group_msg.as_str()),
                        Err(e) => HttpResponse::BadRequest().body(format!("Error inserting Athlete: {}", e))
                    }
                }
                Err(e) => HttpResponse::InternalServerError().body(format!("Error inserting Athlete: {}", e))
            }
        }
        Err(e) => HttpResponse::BadRequest().body(format!("Error parsing Athlete JSON: {}", e))
    }
}


async fn add_athlete_to_group(athlete_str: &str, data: web::Data<Box<dyn Storage + Send + Sync>>) -> Result<String, Box<dyn Error>> {
    let value: Value = serde_json::from_str(athlete_str)?;
    match value {
        Value::Object(map) => {
            let group_name = map.get("group_name").ok_or("Group name not specified")?
                .as_str().ok_or("Group name not string")?;
            let group_id = GroupID::new(group_name);


            let name = map.get("name").ok_or("Athlete name not specified")?;
            let surname = map.get("surname").ok_or("Athlete surname not specified")?;

            let name = match name {
                serde_json::Value::String(a) => a.trim(),
                _ => ""
            };
            let surname = match surname {
                serde_json::Value::String(a) => a.trim(),
                _ => ""
            };

            let json_string = format!(r#"{{"athlete_ids": [{{"name": "{}", "surname": "{}"}}]}}"#, name, surname);

            match data.update_group(group_id, json_string.as_str()).await {
                Ok(msg) => Ok(String::from(msg)),
                Err(e) => Err(Box::from(format!("Error updating Group: {}", e)))
            }
        }
        _ => Err(Box::from("Could not parse map"))
    }
}