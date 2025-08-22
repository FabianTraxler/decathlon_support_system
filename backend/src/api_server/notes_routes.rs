use crate::Storage;
use actix_web::{get, web, HttpResponse, Responder, post};
use actix_web::web::Query;
use crate::api_server::parse_json_body;
use crate::notes::{NoteID};

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_note);
    cfg.service(post_note);
}

#[get("/notes")]
async fn get_note(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    query: Query<NoteID>,
) -> impl Responder {
    let note_id: NoteID = query.into_inner();
    match data.get_note(note_id).await {
        Ok(note) => {
            match(note) {
                Some(note) => {
                    HttpResponse::Ok()
                            .body(note)
                    }
                None => HttpResponse::NotFound().body("")
            }
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error retrieving note: {}", e))
    }    
}

#[post("/notes")]
async fn post_note(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
    query: Query<NoteID>,
) -> impl Responder {
    let json_string = parse_json_body(body).await;
    let note_id: NoteID = query.into_inner();

    match data.save_note(note_id, json_string).await {
        Ok(msg) => {
            HttpResponse::Ok().body(msg)
        }
        Err(e) => HttpResponse::InternalServerError().body(format!("Error saving note: {}", e))
    }
}

