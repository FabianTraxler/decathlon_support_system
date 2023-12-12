use actix_web::web;
use env_logger;
use log::info;
use std::error::Error;

mod api_server;
mod collections;

pub struct DataBase;

pub fn run() -> Result<(), Box<dyn Error>> {
    env_logger::init();

    info!("Connection to Database");
    let db = DataBase {};
    let db_state = web::Data::new(db);

    info!("Starting Rust API server...");
    let _server = api_server::start_server(db_state);
    Ok(())
}
