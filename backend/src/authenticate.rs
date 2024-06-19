use std::error::Error;

use serde::{Deserialize, Serialize};
use async_trait::async_trait;



#[async_trait]
pub trait AuthenticateStorage {
    async fn get_role_and_group(&self, login_info: LoginInfo) -> Option<Role>;
    async fn store_role(&self, role: Role) -> Result<String, Box<dyn Error>>;
}


#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LoginInfo {
    pub pwd: String
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Role {
    role: String,
    group: String,
    password: String
}

impl Role {
    pub fn build(role: String, group: String, pwd: String) -> Role {
        Role{
            role,
            group,
            password: pwd
        }
    }
}

