pub(crate) mod achievements;
mod age_group_utils;
mod athletes;
mod groups;
mod pdf;

use std::cmp::Ordering;
use std::collections::HashMap;
use std::fmt;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fmt::{Display, Formatter};
use std::str::FromStr;
use serde_json::{Map, Value};
pub use age_group_utils::AgeGroupSelector;
pub use athletes::{Athlete, AthleteID};
pub use groups::{AgeGroup, AgeGroupID, Group, GroupID, GroupStore, SwitchGroupID};
pub use achievements::{Achievement, AchievementID};
pub use pdf::PDF;
use async_trait::async_trait;

#[async_trait]
pub trait AchievementStorage {
    async fn get_athlete(&self, athlete_id: &AthleteID) -> Option<Athlete>;
    async fn get_athletes(&self) -> HashMap<String, Vec<Athlete>>;
    async fn write_athlete(&self, athlete_id: AthleteID, athlete: Athlete) -> Result<String, Box<dyn Error>>;
    async fn update_athlete(&self, athlete_id: AthleteID, json_string: &str) -> Result<String, Box<dyn Error>>;
    async fn delete_athlete(&self, athlete_id: AthleteID) -> Result<String, Box<dyn Error>>;
    async fn get_group(&self, group_id: &GroupID) -> Option<Group>;
    async fn write_group_store(&self, group_id: GroupID, group_store: GroupStore) -> Result<String, Box<dyn Error>>;
    async fn write_group(&self, group_id: GroupID, group: Group) -> Result<String, Box<dyn Error>>;
    async fn update_group(&self, group_id: GroupID, json_string: &str) -> Result<String, Box<dyn Error>>;
    async fn switch_group(&self, group_info: SwitchGroupID, json_string: &str) -> Result<String, Box<dyn Error>>;
    async fn get_age_group(&self, age_group_id: &AgeGroupID) -> Option<AgeGroup>;
    async fn get_achievement(&self, achievement_id: &AchievementID) -> Option<Achievement>;
    async fn delete_achievement(&self, achievement_id: &AchievementID) -> Result<String, Box<dyn Error>>;
    async fn write_achievement(&self, achievement_id: AchievementID, achievement: Achievement) -> Result<String, Box<dyn Error>>;
    async fn update_achievement(&self, achievement_id: AchievementID, json_string: &str) -> Result<String, Box<dyn Error>>;
}

#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub enum CompetitionType {
    Decathlon,
    Triathlon,
    Pentathlon,
    Heptathlon,
}

impl Display for CompetitionType{
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        match self {
            CompetitionType::Decathlon => write!(f, "{}", "Decathlon"),
            CompetitionType::Triathlon => write!(f, "{}", "Triathlon"),
            CompetitionType::Heptathlon => write!(f, "{}", "Heptathlon"),
            CompetitionType::Pentathlon => write!(f, "{}", "Pentathlon"),
        }
    }
}

pub fn competition_order(competition_type: &CompetitionType) -> Vec<&str> {
    match competition_type {
        CompetitionType::Decathlon => vec!["100 Meter Lauf", "Weitsprung", "Kugelstoß", "Hochsprung", "400 Meter Lauf",
                                           "110 Meter Hürden", "Diskuswurf", "Stabhochsprung", "Speerwurf", "1500 Meter Lauf"],
        CompetitionType::Pentathlon => vec!["60 Meter Hürden", "Hochsprung", "60 Meter Lauf", "Vortex", "1200 Meter Cross Lauf"],
        CompetitionType::Triathlon => vec!["60 Meter Lauf", "Weitsprung", "Schlagball"],
        CompetitionType::Heptathlon => vec!["100 Meter Lauf", "Weitsprung", "Kugelstoßen", "Hochsprung", "100 Meter Hürden",
                                            "Speerwurf", "1000 Meter Lauf"]
    }
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub struct Float {
    integral: i32,
    fractional: i32,
}

impl Float {
    fn new(i: i32, f: i32) -> Self {
        Float {
            integral: i,
            fractional: f,
        }
    }

    fn from_i32(value: i32) -> Self {
        let integral = value;
        let fractional = value - integral;

        Float {
            integral,
            fractional
        }
    }

    fn from_f64(value: f64) -> Self {
        let integral = value as i32;
        let fractional = ((value - integral as f64) * 100.).round() as i32;

        Float {
            integral,
            fractional
        }
    }


    fn from_str(value: &str) -> Result<Self, Box<dyn Error>> {
        let integral: i32;
        let fractional: i32;

        if value.contains(".") {
            let str_split: Vec<&str> = value.split(".").collect();
            if str_split.len() != 2 {
                return Err("Too many '.' in float")?;
            }
            integral = i32::from_str(str_split[0])?;
            fractional = i32::from_str(str_split[1])?;
        } else if value.contains(",") {
            let str_split: Vec<&str> = value.split(",").collect();
            if str_split.len() != 2 {
                return Err("Too many ',' in float")?;
            }
            integral = i32::from_str(str_split[0])?;
            fractional = i32::from_str(str_split[1])?;
        } else {
            return Err("Invalid format for Float")?;
        }

        Ok(Float {
            integral,
            fractional,
        })
    }

    fn from_map(value: &Map<String, Value>) -> Result<Self, Box<dyn Error>> {
        let integral: i32;
        let fractional: i32;

        match value.get("integral") {
            Some(integral_val) => {
                match integral_val.as_i64() {
                    Some(integral_num) => integral = integral_num as i32,
                    None => return Err("Invalid format for Float. Integral not an integer")?
                }
            }
            None => return Err("Invalid format for Float. Integral not found in map")?
        }

        match value.get("fractional") {
            Some(fractional_val) => {
                match fractional_val.as_i64() {
                    Some(fractional_num) => fractional = fractional_num as i32,
                    None => return Err("Invalid format for Float. Fractional not an integer")?
                }
            }
            None => return Err("Invalid format for Float. Fractional not found in map")?
        }

        Ok(Float {
            integral,
            fractional,
        })
    }

    fn to_f32(&self) -> f32 {
        self.integral as f32 + (self.fractional as f32 / 100.)
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

impl Display for Float {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.integral == -1 {
            write!(f, "")
        }else{
            write!(f, "{},{:0>2}", self.integral, self.fractional)
        }
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
            let integral = integral_fractional[0].trim_start_matches('0');
            let mut fractional = integral_fractional[1].to_string();
            if fractional.len() == 1 && fractional != "0"{
                fractional = format!("{fractional}0");
            } else if fractional.len() >= 2 {
                fractional = fractional.trim_start_matches('0').to_string()
            } else {
                fractional = String::from("0");
            }
            let new_field = vec![key, ":", r#"{"integral":"#, integral, r#", "fractional":"#, fractional.as_str(), "}"];
            new_json.push(new_field.join(" "));
        } else {
            new_json.push(field.to_string());
        }
    }

    new_json.join(",").to_string()
}
