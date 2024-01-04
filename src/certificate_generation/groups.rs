use std::collections::HashSet;
use std::error::Error;
use std::fmt::format;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::{Athlete, AthleteID, PersistantStorage};

/// Group representing the group and links to the athletes in the group
/// Mainly used for separate storage of Groups and Athletes
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct GroupStore {
    pub name: String,
    pub athlete_ids: HashSet<AthleteID>
}
impl GroupStore {
    pub fn from_json(json_string: &str) -> Result<GroupStore, serde_json::error::Error> {
        let group_store: GroupStore = serde_json::from_str(json_string)?;
        Ok(group_store)
    }
}

/// Group representing all athletes that compete in the same group
/// Used to generate Group results, and certificates for all athletes
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Group {
    name: String,
    athletes: HashSet<Athlete>,
}

impl Group {
    pub fn new(groupname: &str, athletes: HashSet<Athlete>) -> Self {
        Group {
            name: groupname.to_string(),
            athletes,
        }
    }

    pub fn name(&self) -> &str {
        self.name.as_str()
    }

    pub fn athlete_ids(&self) -> HashSet<AthleteID> {
        self.athletes.iter().map(AthleteID::from_athlete).collect()
    }

    pub fn update_values(&mut self, json_str: &str, db: Box<&dyn PersistantStorage>) -> Result<(), Box<dyn Error>>{
        let json_value: Value = serde_json::from_str(json_str)?;

        // Update specific fields from JSON to struct
        if let Some(name) = json_value.get("name").and_then(Value::as_str) {
            self.name = name.to_string();
        }
        if let Some(athletes) = json_value.get("athletes").and_then(Value::as_array) {
            for athlete_value in athletes {
                match serde_json::from_value(athlete_value.clone()) {
                    Ok(athlete) => {self.athletes.insert(athlete);},
                    Err(e) => {return Err(Box::try_from(e).expect("Parsing Error should be convertible"));}
                }
            }
        }
        if let Some(athlete_ids) = json_value.get("athlete_ids").and_then(Value::as_array) {
            for athlete_id_value in athlete_ids {
                match serde_json::from_value(athlete_id_value.clone()) {
                    Ok(athlete_id) => {
                        match db.get_athlete(&athlete_id){
                            Some(athlete) => {self.athletes.insert(athlete);}
                            None => {return Err(Box::from(format!("Athlete with ID {:?} not found", athlete_id)));}
                        };
                    },
                    Err(e) => {return Err(Box::try_from(e).expect("Parsing Error should be convertible"));}
                }
            }
        }

        Ok(())
    }
}

/// GroupID Object used to access the persistent storage and get access to a specific group by its
/// name
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct GroupID {
    name: Option<String>,
}

impl GroupID {
    pub fn new(groupname: &str) -> Self {
        GroupID {
            name: Some(groupname.to_string()),
        }
    }
    pub fn from_group(group: &Group) -> Self {
        GroupID {
            name: Some(group.name.clone())
        }
    }
    pub fn from_group_store(group: &GroupStore) -> Self {
        GroupID {
            name: Some(group.name.clone())
        }
    }
}

/// Age group representing all athletes that compete with each other for the total overall score
/// Used to generate the final results for the competition
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AgeGroup {
    age_identifier: String,
    athletes: HashSet<Athlete>,
}
impl AgeGroup {
    pub fn new(age_identifier: &str, athletes: HashSet<Athlete>) -> Self {
        AgeGroup {
            age_identifier: age_identifier.to_string(),
            athletes,
        }
    }
}

/// AgeGroupID to access the persitent storage and get all results for an age/gender group
#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct AgeGroupID {
    pub age_identifier: Option<String>,
}

impl AgeGroupID {
    pub fn new(age_identifier: &str) -> Self {
        AgeGroupID {
            age_identifier: Some(age_identifier.to_string()),
        }
    }
}
