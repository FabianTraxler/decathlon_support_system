use super::achievements::Achievement;
use chrono::naive::NaiveDate;
use serde::Deserialize;
use super::CompetitionType;
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct Athlete {
    name: String,
    surname: String,
    birth_date: Option<NaiveDate>,
    gender: String,
    achievements: Vec<Achievement>,
    competition_type: CompetitionType
}

impl Athlete {
    pub fn new(
        name: &str,
        surname: &str,
        birth_date: Option<NaiveDate>,
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

    pub fn birth_date(&self) -> Option<NaiveDate> {
        self.birth_date
    }

    pub fn name(&self) -> &str {
        self.name.as_str()
    }

    pub fn competition_type(&self) -> &CompetitionType {
        &self.competition_type
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

