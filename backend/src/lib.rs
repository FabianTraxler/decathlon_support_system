use actix_web::web;
use authenticate::AuthenticateStorage;
use env_logger;
use log::info;
use std::error::Error;

mod api_server;
mod certificate_generation;
mod database;
mod time_planner;
mod authenticate;
mod notes;
mod teams;

use certificate_generation::AchievementStorage;
use time_planner::TimePlanStorage;
use database::Store;
use notes::NoteStorage;
use teams::TeamStorage;

pub trait Storage: AchievementStorage + TimePlanStorage + AuthenticateStorage + NoteStorage + TeamStorage{
    fn serialize(&self);
    fn load(&self);
}

pub fn run() -> Result<(), Box<dyn Error>> {
    env_logger::init();

    info!("Connecting to Database...");
    let db = Store::new();
    //db.load();
    info!("DB State loaded from disk");
    let db_state = web::Data::new(Box::new(db) as Box<dyn Storage + Send + Sync>);
    info!("DB connection successfully!");

    info!("Starting Rust API server...");
    let _server = api_server::start_server(db_state);

    info!("Server shut down! Exiting Program");
    Ok(())
}
