mod achievements;
mod age_group_utils;
mod athletes;
mod groups;
mod pdf;

use std::cmp::Ordering;
use std::fmt;
use serde::{Deserialize, Serialize};
pub use age_group_utils::AgeGroupSelector;
pub use athletes::{Athlete, AthleteID};
pub use groups::{AgeGroup, AgeGroupID, Group, GroupID};

pub trait PersistantStorage {
    fn get_athlete(&self, athlete_id: &AthleteID) -> Option<Athlete>;
    fn write_athlete(&mut self, athlete_id: AthleteID, athlete: Athlete);
    fn get_group(&self, group_id: &GroupID) -> Option<Group>;
    fn write_group(&mut self, group_id: GroupID, group: Group);
    fn get_age_group(&self, age_group_id: &AgeGroupID) -> Option<AgeGroup>;
}

#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub enum CompetitionType {
    Decathlon,
    Triathlon,
    Pentathlon
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub struct Float {
    integral: u32,
    fractional: u32,
}

impl Float {
    fn new(i: u32, f: u32) -> Self {
        Float {
            integral: i,
            fractional: f,
        }
    }
}
impl PartialOrd for Float {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        if self.integral > other.integral {
            Some(Ordering::Greater)
        } else if self.integral == other.integral {
            if self.fractional > other.fractional {
                Some(Ordering::Greater)
            } else if self.fractional == other.fractional {
                Some(Ordering::Equal)
            } else {
                Some(Ordering::Less)
            }
        } else {
            Some(Ordering::Less)
        }
    }
}
impl Ord for Float {
    fn cmp(&self, other: &Self) -> Ordering {
        if self.integral > other.integral {
            Ordering::Greater
        } else if self.integral == other.integral {
            if self.fractional > other.fractional {
                Ordering::Greater
            } else if self.fractional == other.fractional {
                Ordering::Equal
            } else {
                Ordering::Less
            }
        } else {
            Ordering::Less
        }
    }
}
impl fmt::Display for Float {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{},{}", self.integral, self.fractional)
    }
}


fn preprocess_json(json_string: &str) -> String {
    let json_fields: Vec<&str> = json_string.split(",").collect();
    let mut new_json: Vec<String> = vec![];

    for field in json_fields {
        if field.contains(".") {
            let key_value: Vec<&str> = field.split(":").collect();
            let key = key_value[0];
            let value = key_value[1];
            let integral_fractional: Vec<&str> = value.split(".").collect();
            let integral = integral_fractional[0];
            let fractional = integral_fractional[1];
            let new_field = vec![key, ":", r#"{"integral":"#, integral, r#", "fractional":"#, fractional, "}"];
            new_json.push(new_field.join(" "));

        } else {
            new_json.push(field.to_string());
        }
    }

    new_json.join(",").to_string()

}
