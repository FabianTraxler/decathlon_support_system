use std::collections::HashMap;
use super::achievements::Achievement;
use chrono::{DateTime, LocalResult, TimeZone, Utc};
use chrono::serde::ts_seconds_option;
use serde::{Deserialize, Serialize};
use std::error::Error;
use serde_json::Value;
use super::{CompetitionType, preprocess_json};

/// Athlete struct that contains all information for an athlete as well as all their achievements
#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct Athlete {
    name: String,
    surname: String,
    #[serde(default)]
    #[serde(with = "ts_seconds_option")]
    #[serde(skip_serializing_if = "Option::is_none")]
    birth_date: Option<DateTime<Utc>>,
    gender: String,
    achievements: HashMap<String, Achievement>,
    competition_type: CompetitionType,
    #[serde(skip_serializing_if = "Option::is_none")]
    starting_number: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    total_points: Option<u32>
}

impl Athlete {
    pub fn new(
        name: &str,
        surname: &str,
        birth_date: Option<DateTime<Utc>>,
        gender: &str,
        achievements: HashMap<String, Achievement>,
        competition_type: CompetitionType,
        starting_number: Option<u16>,
        total_points: Option<u32>
    ) -> Self {
        Athlete {
            name: name.trim().to_string(),
            surname: surname.trim().to_string(),
            birth_date,
            gender: gender.to_string(),
            achievements,
            competition_type,
            starting_number,
            total_points
        }
    }

    pub fn from_json(json_string: &str) -> Result<Athlete, serde_json::error::Error> {
        let processed_content = preprocess_json(json_string);
        let mut athlete: Athlete = serde_json::from_str(processed_content.as_str())?;
        athlete.name = athlete.name.trim().to_string();
        athlete.surname = athlete.surname.trim().to_string();

        Ok(athlete)
    }

    pub fn name(&self) -> &str {
        &self.name
    }
    pub fn surname(&self) -> &str {
        &self.surname
    }
    pub fn starting_number(&self) -> &Option<u16> {
        &self.starting_number
    }

    pub fn gender(&self) -> &String {
        &self.gender
    }

    pub fn birth_date(&self) -> Option<DateTime<Utc>> {
        self.birth_date
    }

    pub fn full_name(&self) -> String {
        format!("{} {}", self.name, self.surname)
    }

    pub fn competition_type(&self) -> &CompetitionType {
        &self.competition_type
    }

    pub fn age_group(&self) -> String {
        match self.competition_type {
            CompetitionType::Decathlon => {
                let mut age_group = self.gender.clone();
                if let Some(birth_date) = self.birth_date() {
                    let years = Utc::now().years_since(birth_date).unwrap_or(0);
                    match years {
                        age if age < 40 => age_group += "",
                        age if age < 50 => age_group += "40",
                        age if age < 60 => age_group += "50",
                        _ => age_group += "60"
                    }
                }
                age_group
            },
            _ => {
                let mut age_group = self.gender.clone();
                if let Some(birth_date) = self.birth_date() {
                    let years = Utc::now().years_since(birth_date).unwrap_or(0);
                    match years {
                        age if age < 4 => age_group += "-U4",
                        age if age < 6 => age_group += "-U6",
                        age if age < 8 => age_group += "-U8",
                        age if age < 10 => age_group += "-U10",
                        age if age < 12 => age_group += "-U12",
                        age if age < 14 => age_group += "-U14",
                        age if age < 16 => age_group += "-U16",
                        _ => age_group += ""
                    }
                }
                age_group
            }
        }
    }

    pub fn total_point(&self) -> u32 {
        let mut total_points = 0;
        for achievement in self.achievements.values() {
            total_points += achievement.points(self)
        }
        total_points
    }

    pub fn compute_total_points(&mut self) {
        let mut total_points = 0;
        for achievement in self.achievements.values() {
            total_points += achievement.points(self)
        }
        self.total_points = Some(total_points);
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
        if let Some(name) = json_value.get("name") {
            let name_str = Value::as_str(name)
                .ok_or("Invalid format for gender. Expected string")?;
            self.name = name_str.to_string();
        }
        if let Some(surname) = json_value.get("surname") {
            let surname_str = Value::as_str(surname)
                .ok_or("Invalid format for gender. Expected string")?;
            self.surname = surname_str.to_string();
        }
        if let Some(gender) = json_value.get("gender") {
            let gender_str = Value::as_str(gender)
                .ok_or("Invalid format for gender. Expected string")?;
            self.gender = gender_str.to_string();
        }
        if let Some(competition_type) = json_value.get("competition_type") {
            let competition_type_str = Value::as_str(competition_type)
                .ok_or("Invalid format for competition_type.")?;
            self.competition_type = serde_json::from_str(competition_type_str)?;
        }
        if let Some(starting_number) = json_value.get("starting_number") {
            match Value::as_i64(starting_number) {
                Some(val) => self.starting_number = Some(val as u16),
                None => self.starting_number = None
            }
        }

        Ok(())
    }

    pub fn get_achievement(&self, query_name: &str) -> Option<&Achievement> {
        self.achievements.get(&query_name.to_string())
    }

    pub fn delete_achievement(&mut self, query_name: &str) -> Option<Achievement> {
        self.achievements.remove(&query_name.to_string())
    }

    pub fn add_achievement(&mut self, mut achievement: Achievement) -> Result<String, Box<dyn Error>> {
        if self.achievements.contains_key(&achievement.name()) {
            return Err(Box::from("Achievement exists. Please update existing one!"));
        }
        achievement.compute_final_result();

        self.achievements.insert(achievement.name().clone(), achievement);
        Ok(String::from("Achievement inserted"))
    }

    pub fn update_achievement(&mut self, mut achievement: Achievement) -> Result<String, Box<dyn Error>> {
        achievement.compute_final_result();

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

    pub fn full_name(&self) -> String {
        format!("{}_{}",
                self.name.clone().unwrap_or("".to_string()),
                self.surname.clone().unwrap_or("".to_string()))
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