use actix_web::{web, App, HttpServer, Responder};
use std::io::Result;
use std::sync::Mutex;
use crate::certificate_generation::PersistantStorage;

mod athlete_routes;
mod group_routes;

#[actix_web::main]
pub async fn start_server(db_handler: web::Data<Mutex<Box<dyn PersistantStorage + Send + Sync>>>) -> Result<()> {
    HttpServer::new(move || {
        App::new().app_data(db_handler.clone()).service(
            web::scope("/api")
                .configure(athlete_routes::configure_routes)
                .configure(group_routes::configure_routes)
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
