use crate::Storage;
use actix_web::{web, App, HttpServer, Responder};
use std::io::Result;

mod athlete_routes;

#[actix_web::main]
pub async fn start_server(db_handler: web::Data<Box<dyn Storage + Send + Sync>>) -> Result<()> {
    HttpServer::new(move || {
        App::new().app_data(db_handler.clone()).service(
            web::scope("/api")
                .configure(athlete_routes::configure_routes)
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
