use std::collections::HashSet;

use serde::{Deserialize, Serialize};

use super::{Athlete, AthleteID};

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

    pub fn athletes(&self) -> &HashSet<Athlete> {
        &self.athletes
    }

    pub fn athlete_ids(&self) -> HashSet<AthleteID> {
        self.athletes.iter().map(AthleteID::from_athlete).collect()
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
