use actix_web::web;
use env_logger;
use log::info;
use std::error::Error;

mod api_server;
mod certificate_generation;
mod database;

use certificate_generation::PersistantStorage;
use database::in_memory_db::InMemoryDB;

trait Storage: PersistantStorage {}

pub fn run() -> Result<(), Box<dyn Error>> {
    env_logger::init();

    info!("Connecting to Database...");
    let db = InMemoryDB::new();
    let db_state = web::Data::new(Box::new(db) as Box<dyn Storage + Send + Sync>);
    info!("DB connection successfull!");

    info!("Starting Rust API server...");
    let _server = api_server::start_server(db_state);

    info!("Server shut down! Exiting Program");
    Ok(())
}
