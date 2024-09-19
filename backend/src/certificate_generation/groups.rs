use serde::{Deserialize, Serialize};
use std::collections::HashSet;

use super::{Athlete, AthleteID, CompetitionType};

/// Group representing the group and links to the athletes in the group
/// Mainly used for separate storage of Groups and Athletes
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct GroupStore {
    pub name: String,
    pub athlete_ids: HashSet<AthleteID>,
    pub competition_type: CompetitionType,
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
    athletes: Vec<Athlete>,
    competition_type: CompetitionType,
}

impl Group {
    pub fn new(groupname: &str, athletes: Vec<Athlete>, competition_type: CompetitionType) -> Self {
        Group {
            name: groupname.to_string(),
            athletes,
            competition_type,
        }
    }

    pub fn from_age_group(age_group: &AgeGroup, competition_type: CompetitionType) -> Self {
        Group {
            name: age_group.age_identifier.clone(),
            athletes: age_group.athletes.clone(),
            competition_type,
        }
    }

    pub fn competition_type(&self) -> CompetitionType {
        self.competition_type.clone()
    }

    pub fn name(&self) -> &str {
        self.name.as_str()
    }

    pub fn set_name(&mut self, name: String) {
        self.name = name
    }

    pub fn add_athlete(&mut self, athlete: Athlete) {
        self.athletes.push(athlete)
    }

    pub fn delete_athlete(&mut self, athlete: Athlete) -> Option<Athlete> {
        match self.athletes.iter().position(|x| *x == athlete){
            Some(index) => Some(self.athletes.remove(index)),
            None => None // Athlete not in vec therefore not deleted
        }
    }

    pub fn athlete_ids(&self) -> HashSet<AthleteID> {
        self.athletes.iter().map(AthleteID::from_athlete).collect()
    }

    pub fn athletes(&self) -> &Vec<Athlete> {
        &self.athletes
    }

    pub fn mut_athletes(&mut self) -> &mut Vec<Athlete> {
        &mut self.athletes
    }
}

/// GroupID Object used to access the persistent storage and get access to a specific group by its
/// name
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct GroupID {
    pub name: Option<String>,
}

impl GroupID {
    pub fn new(groupname: &str) -> Self {
        GroupID {
            name: Some(groupname.to_string()),
        }
    }
    pub fn from_group(group: &Group) -> Self {
        GroupID {
            name: Some(group.name.clone()),
        }
    }
    pub fn from_group_store(group: &GroupStore) -> Self {
        GroupID {
            name: Some(group.name.clone()),
        }
    }
}

/// SwitchGroupID Object used to access the persistent storage and get access two specific groups by
/// their names
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct SwitchGroupID {
    pub from: Option<String>,
    pub to: Option<String>,
}

impl SwitchGroupID {
    pub fn new(group_from: &str, group_to: &str) -> Self {
        SwitchGroupID {
            from: Some(group_from.to_string()),
            to: Some(group_to.to_string()),
        }
    }
}

/// Age group representing all athletes that compete with each other for the total overall score
/// Used to generate the final results for the competition
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct AgeGroup {
    age_identifier: String,
    athletes: Vec<Athlete>,
}

impl AgeGroup {
    pub fn new(age_identifier: &str, athletes: Vec<Athlete>) -> Self {
        AgeGroup {
            age_identifier: age_identifier.to_string(),
            athletes,
        }
    }

    pub fn athletes(&self) -> &Vec<Athlete> {
        &self.athletes
    }

    pub fn mut_athletes(&mut self) -> &mut Vec<Athlete> {
        &mut self.athletes
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
