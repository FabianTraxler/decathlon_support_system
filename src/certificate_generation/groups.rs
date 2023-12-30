use std::collections::HashSet;

use serde::Deserialize;

use super::Athlete;

/// Group representing all athletes that compete in the same group
/// Used to generate Group results, and certificates for all athletes
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Group {
    name: String,
    athletes: HashSet<Athlete>,
}

impl Group {
    pub fn new(groupname: &str, athletes: HashSet<Athlete>) -> Self {
        Group {
            name: groupname.to_string(),
            athletes: athletes,
        }
    }

    pub fn name(&self) -> &str {
        self.name.as_str()
    }
}

/// GroupID Object used to access the persitent storage and get access to a specfifc group by its
/// name
#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct GroupID {
    name: Option<String>,
}

impl GroupID {
    pub fn new(groupname: &str) -> Self {
        GroupID {
            name: Some(groupname.to_string()),
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
