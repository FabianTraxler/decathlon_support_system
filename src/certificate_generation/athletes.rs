use super::achievements::Achievement;
use chrono::{DateTime, Utc};
use chrono::serde::ts_seconds_option;
use serde::{Deserialize, Serialize};
use super::CompetitionType;
pub use super::Float;

#[derive(Clone, Debug, PartialEq, Eq, Hash, Deserialize, Serialize)]
pub struct Athlete {
    name: String,
    surname: String,
    #[serde(with = "ts_seconds_option")]
    birth_date: Option<DateTime<Utc>>,
    gender: String,
    achievements: Vec<Achievement>,
    competition_type: CompetitionType
}

impl Athlete {
    pub fn new(
        name: &str,
        surname: &str,
        birth_date: Option<DateTime<Utc>>,
        gender: &str,
        achievements: Vec<Achievement>,
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
}

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
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