use super::{Athlete, CompetitionType};
use chrono::prelude::{Datelike, Utc};
use log::error;

fn parse_age_group(age_identifier: &str) -> Result<i32, ()> {
    // Check if the string is not empty and has more than one character
    if let Some(rest) = age_identifier.get(1..) {
        // Parse the remaining characters to an integer
        if let Ok(parsed) = rest.parse::<i32>() {
            Ok(parsed)
        } else {
            Err(())
        }
    } else {
        Err(())
    }
}

pub struct AgeGroupSelector {
    pub gender: Option<String>,
    pub start_year: i32,
    pub end_year: i32,
    pub competition_type: CompetitionType
}

impl AgeGroupSelector {
    pub fn build(age_identifier: &str) -> Result<Self, ()> {
        let current_year = Utc::now().year();

        if age_identifier.contains("U") {
            let max_age = parse_age_group(age_identifier)?;
            let start_year = current_year - max_age + 1;
            let end_year = start_year + 1;
            let competition_type: CompetitionType;

            if max_age <= 12 {
                competition_type = CompetitionType::Triathlon
            }else if max_age <= 14 {
                competition_type = CompetitionType::Pentathlon
            }else {
                competition_type = CompetitionType::Heptathlon
            }

            Ok(AgeGroupSelector {
                gender: None,
                start_year,
                end_year,
                competition_type: competition_type
            })
        } else if age_identifier.contains("M") || age_identifier.contains("W") {
            let gender = age_identifier
                .chars()
                .next()
                .expect("Should at least contains one char since if condition ensures it");

            let start_year;
            let end_year;

            let min_age = parse_age_group(age_identifier);
            match min_age {
                Ok(min_age) => {
                    end_year = current_year - min_age;
                    if min_age == 70 {
                        start_year = 0; // All athletes older than 70
                    }else{
                        start_year = end_year - 10;
                    }
                }
                Err(_) => {
                    end_year = current_year;
                    start_year = current_year - 40;
                }
            };

            Ok(AgeGroupSelector {
                gender: Some(gender.to_string()),
                start_year,
                end_year,
                competition_type: CompetitionType::Decathlon
            })
        } else if age_identifier == "Staffel" {
            Ok(AgeGroupSelector {
                gender: Some("S".to_string()),
                start_year:0,
                end_year: 200,
                competition_type: CompetitionType::Decathlon
            })
        } else {
            error!("Neither 'M', 'W' or 'U' in age_identifier string");
            Err(())
        }
    }
}

impl PartialEq<Athlete> for AgeGroupSelector {
    fn eq(&self, other: &Athlete) -> bool {
        if self.gender.is_none()
            || *other.gender() == *self.gender.as_ref().expect("This should always be a value")
        {
            if let Some(birth_date) = other.birth_date() {
                let birth_year = birth_date.year();
                if self.start_year < birth_year && birth_year <= self.end_year && other.competition_type() == &self.competition_type {
                    true
                } else {
                    false
                }
            } else {
                false
            }
        }else if *self.gender.as_ref().expect("Gender should be set or if clause before should be triggered") == "S" {
            if other.gender().contains("S-"){
                true
            }else{
                false
            }
        } else {
            false
        }
    }
}
