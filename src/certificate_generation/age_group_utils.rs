use super::Athlete;
use chrono::prelude::{Datelike, Utc};
use log::error;

fn parse_age_group(age_identifier: &str) -> Result<i32, ()> {
    // Check if the string is not empty and has more than one character
    if let Some(rest) = age_identifier.get(1..) {
        // Parse the remaining characters to an integer
        if let Ok(parsed) = rest.parse::<i32>() {
            Ok(parsed)
        } else {
            error!("Could not parse remaining characters to an integer");
            Err(())
        }
    } else {
        error!("String is empty or has only one character");
        Err(())
    }
}

pub struct AgeGroupSelector {
    pub gender: Option<String>,
    pub start_year: i32,
    pub end_year: i32,
    pub athlete_type: String,
}

impl AgeGroupSelector {
    pub fn build(age_identifier: &str) -> Result<Self, ()> {
        let current_year = Utc::now().year();

        if age_identifier.contains("U") {
            let max_age = parse_age_group(age_identifier)?;
            let start_year = current_year - max_age + 1;
            let end_year = start_year + 1;
            Ok(AgeGroupSelector {
                gender: None,
                start_year,
                end_year,
                athlete_type: String::from("Jugend"),
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
                    start_year = end_year - 10;
                }
                Err(_) => {
                    start_year = current_year - 16;
                    end_year = current_year - 40;
                }
            };

            Ok(AgeGroupSelector {
                gender: Some(gender.to_string()),
                start_year,
                end_year,
                athlete_type: String::from("Erwachsen"),
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
                if self.start_year <= birth_year && birth_year <= self.end_year {
                    true
                } else {
                    false
                }
            } else {
                false
            }
        } else {
            false
        }
    }
}
