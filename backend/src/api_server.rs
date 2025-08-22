use actix_web::{web, App, HttpServer, Responder, HttpResponse};
use std::io::Result;
use futures::StreamExt;
use crate::Storage;

mod athlete_routes;
mod group_routes;
mod achievement_routes;
mod certificate_routes;
mod time_planner_routes;
mod auth_routes;
mod notes_routes;

#[actix_web::main]
pub async fn start_server(db_handler: web::Data<Box<dyn Storage + Send + Sync>>) -> Result<()> {
    HttpServer::new(move || {
        App::new().app_data(db_handler.clone()).service(
            web::scope("/api")
                .configure(athlete_routes::configure_routes)
                .configure(group_routes::configure_routes)
                .configure(achievement_routes::configure_routes)
                .configure(certificate_routes::configure_routes)
                .configure(time_planner_routes::configure_routes)
                .configure(auth_routes::configure_routes)
                .configure(notes_routes::configure_routes)
                .route("/status", web::get().to(status))
                //.route("/save_db", web::get().to(save_db)) // TODO: Remove in deployment
                //.route("/load_db", web::get().to(load_db)), // TODO: Remove in deployment
        )
    })
    .bind(("0.0.0.0", 3001))?
    .run()
    .await
}

async fn status() -> impl Responder {
    "Ok"
}

async fn _save_db(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
) -> impl Responder {
    data.serialize();
    HttpResponse::Ok().body("Saved")
}
async fn _load_db(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
) -> impl Responder {
    data.load();
    HttpResponse::Ok().body("Loaded")
}



async fn parse_json_body(mut body: web::Payload) -> String {
    // Read the request body as bytes
    let mut bytes = web::BytesMut::new();
    while let Some(item) = body.next().await {
        let chunk = item.unwrap();
        bytes.extend_from_slice(&chunk);
    }
    String::from_utf8_lossy(&bytes).to_string()
}