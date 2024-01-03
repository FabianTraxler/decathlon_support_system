use std::sync::Mutex;
use crate::PersistantStorage;
use actix_web::{get, web, HttpResponse, Responder, post};
use actix_web::web::post;
use futures::StreamExt;
use log::info;

use crate::certificate_generation::{GroupID, GroupStore};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_group);
    cfg.service(post_group);
}

#[get("/group")]
async fn get_group(
    data: web::Data<Mutex<Box<dyn PersistantStorage + Send + Sync>>>,
    query: web::Query<GroupID>,
) -> impl Responder {
    let group_id = query.into_inner();
    info!("{:?}", group_id);
    let group = data.lock().expect("Mutex Lock poised").get_group(&group_id);
    match group {
        Some(group) => HttpResponse::Ok()
            .body(serde_json::to_string(&group)
                .expect("Group should be serializable")),
        None => HttpResponse::NotFound().body("Not found")
    }
}

#[post("/group")]
async fn post_group(
    data: web::Data<Mutex<Box<dyn PersistantStorage + Send + Sync>>>,
    mut body: web::Payload,
) -> impl Responder {
    // Read the request body as bytes
    let mut bytes = web::BytesMut::new();
    while let Some(item) = body.next().await {
        let chunk = item.unwrap();
        bytes.extend_from_slice(&chunk);
    }
    let json_string = String::from_utf8_lossy(&bytes).to_string();

    let group_store = GroupStore::from_json(json_string.as_str());
    match group_store {
        Ok(group_store) => {
            match data.lock().unwrap().write_group_store(GroupID::from_group_store(&group_store), group_store) {
                Ok(msg) => {
                    HttpResponse::Ok().body(msg)
                }
                Err(e) => HttpResponse::InternalServerError().body(format!("Error inserting Athlete: {}", e))
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error parsing Athlete JSON: {}", e))
    }
}
