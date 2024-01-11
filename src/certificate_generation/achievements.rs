use serde::{Deserialize, Serialize};
use std::error::Error;
use serde_json::Value;
use crate::certificate_generation::{Athlete, AthleteID, Float, preprocess_json};

#[derive(Debug, Clone, Hash, PartialEq, Eq, Deserialize, Serialize)]
pub enum Achievement {
    Height(HeightResult),
    Distance(DistanceResult),
    Time(TimeResult),
}

impl Achievement {
    pub fn name(&self) -> String {
        match self {
            Achievement::Distance(r) => r.name.clone(),
            Achievement::Height(r) => r.name.clone(),
            Achievement::Time(r) => r.name.clone()
        }
    }

    pub fn update_values(&mut self, json_string: &str) -> Result<(), Box<dyn Error>> {
        match self {
            Achievement::Distance(r) => r.update_values(json_string)?,
            Achievement::Height(r) => r.update_values(json_string)?,
            Achievement::Time(r) => r.update_values(json_string)?
        }
        Ok(())
    }

    pub fn compute_final_result(&mut self) {
        match self {
            Achievement::Distance(r) => r.final_result = Some(r.final_result()),
            Achievement::Height(r) => r.final_result = Some(r.final_result()),
            Achievement::Time(r) => r.final_result = r.final_result(),
        }
    }

    pub fn final_result(&self) -> String {
        match self {
            Achievement::Distance(r) => format!("{}",r.final_result()),
            Achievement::Height(r) => format!("{}",Float::from_u32(r.final_result())),
            Achievement::Time(r) => format!("{}",r.final_result()) // TODO: Add Minutes if more than 3min (for 1500 M)
        }
    }

    pub fn unit(&self) -> String {
        match self {
            Achievement::Distance(r) => format!("{}", r.unit),
            Achievement::Height(r) => format!("{}", r.unit),
            Achievement::Time(r) => format!("{}", r.unit) // TODO Change to min if more than 3min
        }
    }

    pub fn points(&self, athlete: &Athlete) -> u32 {
        match self {
            Achievement::Distance(r) => r.get_points(athlete),
            Achievement::Height(r) => r.get_points(athlete),
            Achievement::Time(r) => r.get_points(athlete),
        }
    }

    pub fn from_json(json_string: &str) -> Result<Self, serde_json::error::Error> {
        let processed_content = preprocess_json(json_string);
        let achievement: Achievement = serde_json::from_str(processed_content.as_str())?;
        Ok(achievement)
    }}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Deserialize, Serialize)]
pub struct AchievementID {
    pub athlete_id: Option<AthleteID>,
    pub name: String,
    athlete_name: Option<String>,
}

impl AchievementID {
    pub fn build(athlete_id: AthleteID, achievement: &Achievement) -> AchievementID {
        AchievementID {
            athlete_id: Some(athlete_id),
            name: achievement.name(),
            athlete_name: None,
        }
    }


    pub fn athlete_id(&self) -> Option<AthleteID> {
        match &self.athlete_id {
            Some(athlete_id) => Some(athlete_id.clone()),
            None => {
                let athlete_name = self.athlete_name.clone()?;
                let name_parts: Vec<&str> = athlete_name.split("_").collect();
                if name_parts.len() != 2 {
                    None
                } else {
                    let name = name_parts[0];
                    let surname = name_parts[1];
                    Some(AthleteID::new(name, surname))
                }
            }
        }
    }
}


#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub struct HeightResult {
    name: String,
    start_height: u32,
    height_increase: u32,
    tries: String,
    unit: String,
    final_result: Option<u32>,
}

impl HeightResult {
    pub fn build(json_string: &str) -> Result<Self, serde_json::error::Error> {
        let result: Result<Self, serde_json::error::Error> = serde_json::from_str(json_string);

        match result {
            Ok(result) => Ok(result),
            Err(e) => Err(e)
        }
    }

    pub fn get_points(&self, athlete: &Athlete) -> u32 {
        // TODO: Implement point scheme
        0
    }

    pub fn final_result(&self) -> u32 {
        match &self.final_result {
            Some(value) => *value,
            None => self.compute_final_result()
        }
    }

    fn compute_final_result(&self) -> u32 {
        let mut jumped_height = 0;

        for (i, height) in self.tries.split("-").enumerate() {
            if height.contains("O") {
                jumped_height = self.start_height + u32::try_from(i).expect("Enumeration should be convertible") * self.height_increase;
            }
        }

        jumped_height
    }

    pub fn update_values(&mut self, json_string: &str) -> Result<(), Box<dyn Error>> {
        let json_value: Value = serde_json::from_str(json_string)?;

        if let Some(_) = json_value.get("start_height").and_then(Value::as_i64) {
            return Err("Start height not updated. Please create new achievement for that kind of change")?;
        }
        if let Some(_) = json_value.get("height_increase").and_then(Value::as_i64) {
            return Err("Height increase not updated. Please create new achievement for that kind of change")?;
        }
        if let Some(_) = json_value.get("unit").and_then(Value::as_i64) {
            return Err("Unit not updated. Please create new achievement for that kind of change")?;
        }
        if let Some(_) = json_value.get("name").and_then(Value::as_i64) {
            return Err("Name not updated. Please create new achievement for that kind of change")?;
        }

        if let Some(tries) = json_value.get("tries").and_then(Value::as_str) {
            self.tries = tries.to_string();
            self.final_result = Some(self.compute_final_result());
        }

        if let Some(final_result) = json_value.get("final_result").and_then(Value::as_u64) {
            self.final_result = Some(final_result as u32);
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub struct DistanceResult {
    name: String,
    first_try: Float,
    second_try: Float,
    third_try: Float,
    final_result: Option<Float>,
    unit: String,
}

impl DistanceResult {
    pub fn build(json_string: &str) -> Result<Self, serde_json::error::Error> {
        // Change Float fields to represent Float struct to enable json parsing
        let json_string = preprocess_json(json_string);

        let result: Result<Self, serde_json::error::Error> = serde_json::from_str(json_string.as_str());

        match result {
            Ok(mut result) => {
                result.final_result = Some(result.final_result());
                Ok(result)
            }
            Err(e) => Err(e)
        }
    }

    pub fn get_points(&self, athlete: &Athlete) -> u32 {
        // TODO: Implement point scheme
        0
    }

    pub fn final_result(&self) -> Float {
        let all_results = vec![&self.first_try, &self.second_try, &self.third_try];

        let best_result = all_results.iter().max();

        match best_result {
            Some(result) => {
                let result = *result;
                result.clone()
            }
            None => Float::new(0, 0)
        }
    }

    pub fn update_values(&mut self, json_string: &str) -> Result<(), Box<dyn Error>> {
        let json_value: Value = serde_json::from_str(json_string)?;

        if let Some(_) = json_value.get("unit").and_then(Value::as_i64) {
            return Err("Unit not updated. Please create new achievement for that kind of change")?;
        }
        if let Some(_) = json_value.get("name").and_then(Value::as_i64) {
            return Err("Name not updated. Please create new achievement for that kind of change")?;
        }

        let mut new_try = false;

        if let Some(first_try) = json_value.get("first_try").and_then(Value::as_u64) {
            self.first_try = Float::from_u32(first_try as u32);
            new_try = true;
        }
        if let Some(second_try) = json_value.get("second_try").and_then(Value::as_u64) {
            self.second_try = Float::from_u32(second_try as u32);
            new_try = true;
        }
        if let Some(third_try) = json_value.get("third_try").and_then(Value::as_u64) {
            self.third_try = Float::from_u32(third_try as u32);
            new_try = true;
        }
        if new_try {
            self.final_result = Some(self.final_result());
        }

        if let Some(final_result) = json_value.get("final_result").and_then(Value::as_u64) {
            self.final_result = Some(Float::from_u32(final_result as u32));
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub struct TimeResult {
    name: String,
    final_result: Float,
    unit: String,
}

impl TimeResult {
    pub fn build(json_string: &str) -> Result<Self, serde_json::error::Error> {
        // Change Float fields to represent Float struct to enable json parsing
        let json_string = preprocess_json(json_string);

        let result: Result<Self, serde_json::error::Error> = serde_json::from_str(json_string.as_str());

        match result {
            Ok(result) => Ok(result),
            Err(e) => Err(e)
        }
    }

    pub fn get_points(&self, athlete: &Athlete) -> u32 {
        // TODO: Implement point scheme
        123
    }

    pub fn final_result(&self) -> Float {
        self.final_result.clone()
    }

    pub fn update_values(&mut self, json_string: &str) -> Result<(), Box<dyn Error>> {
        let json_value: Value = serde_json::from_str(json_string)?;

        if let Some(_) = json_value.get("unit").and_then(Value::as_i64) {
            return Err("Unit not updated. Please create new achievement for that kind of change")?;
        }
        if let Some(_) = json_value.get("name").and_then(Value::as_i64) {
            return Err("Name not updated. Please create new achievement for that kind of change")?;
        }
        if let Some(final_result) = json_value.get("final_result").and_then(Value::as_u64) {
            self.final_result = Float::from_u32(final_result as u32);
        }
        Ok(())
    }
}


#[cfg(test)]
mod tests {
    use super::{DistanceResult, Float, HeightResult, TimeResult};

    #[test]
    fn get_distance_results() {
        let achievement_json = r#"
            {
                "name": "Weitsprung",
                "first_try": 1.20,
                "second_try": 1.30,
                "third_try": 1.20,
                "unit": "m"
            }
        "#;
        let achievement = DistanceResult::build(achievement_json).expect("Achievement not loaded");

        assert_eq!(achievement.final_result(), Float::new(1, 30));
    }


    #[test]
    fn get_time_results() {
        let achievement_json = r#"
            {
                "name": "100 Meter Lauf",
                "final_result": 9.20,
                "unit": "s"
            }
        "#;
        let achievement = TimeResult::build(achievement_json).expect("Achievement not loaded");

        assert_eq!(achievement.final_result(), Float::new(9, 20));
    }

    #[test]
    fn get_height_results() {
        let achievement_json = r#"
            {
                "name": "Hochsprung",
                "start_height": 80,
                "height_increase": 4,
                "tries": "///-///-///-O//-XO/-O//-O//-O//-XXX",
                "unit": "cm"
            }
        "#;

        let achievement = HeightResult::build(achievement_json).expect("Achievement not loaded");

        assert_eq!(achievement.final_result(), 108);
    }
}