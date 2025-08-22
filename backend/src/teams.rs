use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::error::Error;


#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct TeamID {
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct Team {
    pub team_name: Option<String>,
    pub paid: Option<bool>,
    pub athletes: Option<Vec<String>>
}

impl Team {
    pub fn from_json(json_str: &str) -> Result<Self, Box<dyn Error>> {
        Ok(serde_json::from_str(json_str)?)
    }    
    pub fn update_values(&mut self, json_str: &str) -> Result<bool, Box<dyn Error>> {
        let updates: Team = serde_json::from_str(json_str)?;
        let mut team_name_changed = false;
        if let Some(new_name) = updates.team_name.clone(){
            self.team_name = Some(new_name);
            team_name_changed = true;
        }
        if let Some(new_paid) = updates.paid {
            self.paid = Some(new_paid);
        }
        if let Some(new_athletes) = updates.athletes.clone() {
            self.athletes = Some(new_athletes);
        }
        Ok(team_name_changed)
    }
}

#[async_trait]
pub trait TeamStorage {
    async fn get_teams(&self) -> Result<Vec<Team>, Box<dyn Error>> ;
    async fn get_team(&self, team_id: &TeamID) ->  Result<Option<Team>, Box<dyn Error>>;
    async fn save_team(&self, team: &Team) ->  Result<String, Box<dyn Error>>;
    async fn update_team(&self, team_id: &TeamID, team_update: &String) ->  Result<String, Box<dyn Error>>;
    async fn delete_team(&self, team_id: &TeamID) -> Result<(), Box<dyn Error>>;
}
