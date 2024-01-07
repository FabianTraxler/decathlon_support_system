use actix_web::{web, App, HttpServer, Responder};
use std::io::Result;
use futures::StreamExt;
use crate::certificate_generation::PersistentStorage;

mod athlete_routes;
mod group_routes;
mod achievement_routes;

#[actix_web::main]
pub async fn start_server(db_handler: web::Data<Box<dyn PersistentStorage + Send + Sync>>) -> Result<()> {
    HttpServer::new(move || {
        App::new().app_data(db_handler.clone()).service(
            web::scope("/api")
                .configure(athlete_routes::configure_routes)
                .configure(group_routes::configure_routes)
                .configure(achievement_routes::configure_routes)
                .route("/status", web::get().to(status)),
        )
    })
    .bind(("0.0.0.0", 8081))?
    .run()
    .await
}

async fn status() -> impl Responder {
    "Ok"
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