use std::collections::HashMap;
use super::achievements::Achievement;
use chrono::{DateTime, LocalResult, TimeZone, Utc};
use chrono::serde::ts_seconds_option;
use serde::{Deserialize, Serialize};
use std::error::Error;
use serde_json::Value;
use super::{CompetitionType, preprocess_json};
pub use super::Float;

/// Athlete struct that contains all information for an athlete as well as all their achievements
#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct Athlete {
    name: String,
    surname: String,
    #[serde(with = "ts_seconds_option")]
    birth_date: Option<DateTime<Utc>>,
    gender: String,
    achievements: HashMap<String, Achievement>,
    competition_type: CompetitionType
}

impl Athlete {
    pub fn new(
        name: &str,
        surname: &str,
        birth_date: Option<DateTime<Utc>>,
        gender: &str,
        achievements: HashMap<String, Achievement>,
        competition_type: CompetitionType
    ) -> Self {
        Athlete {
            name: name.to_string(),
            surname: surname.to_string(),
            birth_date,
            gender: gender.to_string(),
            achievements,
            competition_type
        }
    }

    pub fn from_json(json_string: &str) -> Result<Athlete, serde_json::error::Error> {
        let processed_content = preprocess_json(json_string);
        let athlete: Athlete = serde_json::from_str(processed_content.as_str())?;
        Ok(athlete)
    }

    pub fn gender(&self) -> &String {
        &self.gender
    }

    pub fn birth_date(&self) -> Option<DateTime<Utc>> {
        self.birth_date
    }

    pub fn name(&self) -> &str {
        self.name.as_str()
    }

    pub fn competition_type(&self) -> &CompetitionType {
        &self.competition_type
    }

    pub fn total_point(&self) -> Float {
        // TODO: Sum all points of all achievements
        Float::new(0,0)
    }

    pub fn update_values(&mut self, json_str: &str) -> Result<(), Box<dyn Error>>{
        let json_value: Value = serde_json::from_str(json_str)?;

        if let Some(_) = json_value.get("achievements").and_then(Value::as_i64) {
            return Err("Achievements not updated. Please use /achievement routes to update achievements")?;
        }
        if let Some(timestamp) = json_value.get("birth_date").and_then(Value::as_i64) {
            match Utc.timestamp_opt(timestamp, 0) {
                LocalResult::Single(birth_date) => {
                    self.birth_date = Some(birth_date);
                },
                _ => Err("Invalid timestamp")?
            }
        }

        // Update specific fields from JSON to struct
        if let Some(name) = json_value.get("name").and_then(Value::as_str) {
            self.name = name.to_string();
        }
        if let Some(surname) = json_value.get("surname").and_then(Value::as_str) {
            self.surname = surname.to_string();
        }
        if let Some(gender) = json_value.get("gender").and_then(Value::as_str) {
            self.gender = gender.to_string();
        }

        if let Some(competition_type) = json_value.get("competition_type").and_then(Value::as_str) {
            self.competition_type = serde_json::from_str(competition_type)?;
        }


        Ok(())
    }

    pub fn get_achievement(&self, query_name: &str) -> Option<&Achievement> {
        self.achievements.get(&query_name.to_string())
    }

    pub fn add_achievement(&mut self, achievement: Achievement) -> Result<String, Box<dyn Error>> {
        if self.achievements.contains_key(&achievement.name()) {
            return Err(Box::from("Achievement exists. Please update existing one!"));
        }

        self.achievements.insert(achievement.name().clone(), achievement);
        Ok(String::from("Achievement inserted"))
    }
}

/// AthelteID used as a unique identifier for each athlete
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct AthleteID {
    name: Option<String>,
    surname: Option<String>,
}

impl AthleteID {
    pub fn new(name: &str, surname: &str) -> Self {
        AthleteID {
            name: Some(name.to_string()),
            surname: Some(surname.to_string()),
        }
    }

    pub fn from_athlete(athlete: &Athlete) -> Self {
        AthleteID {
            name: Some(athlete.name.clone()),
            surname: Some(athlete.surname.clone()),
        }
    }

}


#[cfg(test)]
mod tests {
    use std::fs;
    use crate::certificate_generation::{Athlete, preprocess_json};

    #[test]
    fn get_final_points() {
        if let Ok(contents) = fs::read_to_string("tests/athlete.json") {
            let processed_content = preprocess_json(contents.as_str());
            let athlete: Athlete = serde_json::from_str(processed_content.as_str()).unwrap();
            println!("{:?}", athlete);

        } else {
            panic!("Failed to read the file");
        }
    }
}