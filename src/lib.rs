use actix_web::web;
use env_logger;
use log::info;
use std::error::Error;

mod api_server;
mod certificate_generation;
mod database;

use certificate_generation::PersistantStorage;
use database::Store;

pub fn run() -> Result<(), Box<dyn Error>> {
    env_logger::init();

    info!("Connecting to Database...");
    let db = Store::new();
    let db_state = web::Data::new(Box::new(db) as Box<dyn PersistantStorage + Send + Sync>);
    info!("DB connection successfully!");

    info!("Starting Rust API server...");
    let _server = api_server::start_server(db_state);

    info!("Server shut down! Exiting Program");
    Ok(())
}
