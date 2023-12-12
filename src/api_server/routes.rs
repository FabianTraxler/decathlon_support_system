use crate::DataBase;
use actix_web::{get, web, HttpResponse, Responder};
use serde::Deserialize;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_athlete);
}

#[derive(Deserialize, Debug)]
struct AthleteID {
    name: Option<String>,
    surname: Option<String>,
    athlete_number: Option<u16>,
}

#[get("/athlete")]
async fn get_athlete(data: web::Data<DataBase>, query: web::Query<AthleteID>) -> impl Responder {
    println!("{:?}", query);
    HttpResponse::Ok().body("Test")
}
