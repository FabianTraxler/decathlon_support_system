use crate::{authenticate::LoginInfo, Storage};
use actix_web::{web, HttpResponse, Responder, post};
use crate::api_server::parse_json_body;

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(get_group_and_role);
}


#[post("/get_group_and_role")]
async fn get_group_and_role(
    data: web::Data<Box<dyn Storage + Send + Sync>>,
    body: web::Payload,
) -> impl Responder {
    let json_string: String = parse_json_body(body).await;
    let body: serde_json::error::Result<LoginInfo> = serde_json::from_str(json_string.as_str());
    match body {
        Ok(login_info) => {
            // Check group login first
            match data.get_role_and_group(login_info).await{
                Some(role_and_group) => HttpResponse::Ok().body(serde_json::to_string(&role_and_group).expect("Role should be serializable")),
                None => HttpResponse::BadRequest().body(format!("Incorrect password"))
            }
        }
        Err(e) => {
            HttpResponse::BadRequest().body(format!("Could not parse login data: {}", e))
        }
    }
}
