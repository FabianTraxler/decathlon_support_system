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
            Achievement::Distance(r) => format!("{}", r.final_result()),
            Achievement::Height(r) => format!("{}", Float::from_i32(r.final_result())),
            Achievement::Time(r) => format!("{}", r.final_result()) // TODO: Add Minutes if more than 3min (for 1500 M)
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
    }
}

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
    start_height: i32,
    height_increase: i32,
    tries: String,
    unit: String,
    final_result: Option<i32>,
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
        if self.final_result() < 0 {
            0
        } else {
            let a: f32;
            let b: f32;
            let c: f32;
            let mut m: f32 = self.final_result() as f32;
            match self.name.as_str() {
                "Hochsprung" => {
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 1.84523;
                            b = 75.;
                            c = 1.348;
                        }
                        _ => {
                            a = 0.8465;
                            b = 75.;
                            c = 1.42;
                        }
                    }
                }
                "Stabhochsprung" => {
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 0.44125;
                            b = 100.;
                            c = 1.35;
                        }
                        _ => {
                            a = 0.2797;
                            b = 100.;
                            c = 1.35;
                        }
                    }
                }
                _ => {
                    a = 0.;
                    b = 0.;
                    c = 1.;
                    m = 0.;
                }
            }
            (a * (m - b).powf(c)) as u32
        }
    }

    pub fn final_result(&self) -> i32 {
        match &self.final_result {
            Some(value) => *value,
            None => self.compute_final_result()
        }
    }

    fn compute_final_result(&self) -> i32 {
        let mut jumped_height = 0;

        for (i, height) in self.tries.split("-").enumerate() {
            if height.contains("O") {
                jumped_height = self.start_height + i32::try_from(i).expect("Enumeration should be convertible") * self.height_increase;
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

        if let Some(final_result) = json_value.get("final_result").and_then(Value::as_i64) {
            self.final_result = Some(final_result as i32);
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
        if self.final_result().to_f32() < 0. {
            0
        } else {
            let a: f32;
            let b: f32;
            let c: f32;
            let m: f32;
            match self.name.as_str() {
                "Weitsprung" => {
                    m = self.final_result().to_f32() * 100.;
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 0.188807;
                            b = 210.;
                            c = 1.41;
                        }
                        _ => {
                            a = 0.14354;
                            b = 220.;
                            c = 1.4;
                        }
                    }
                }
                "Kugelstoß" => {
                    m = self.final_result().to_f32();
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 56.0211;
                            b = 1.5;
                            c = 1.05;
                        }
                        _ => {
                            a = 51.39;
                            b = 1.5;
                            c = 1.05;
                        }
                    }
                }
                "Diskuswurf" => {
                    m = self.final_result().to_f32();
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 12.3311;
                            b = 3.;
                            c = 1.1;
                        }
                        _ => {
                            a = 12.91;
                            b = 4.;
                            c = 1.1;
                        }
                    }
                }
                "Speerwurf" => {
                    m = self.final_result().to_f32();
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 15.9803;
                            b = 3.8;
                            c = 1.04;
                        }
                        _ => {
                            a = 10.14;
                            b = 7.;
                            c = 1.08;
                        }
                    }
                }
                _ => {
                    a = 0.;
                    b = 0.;
                    c = 1.;
                    m = 0.;
                }
            }
            (a * (m - b).powf(c)) as u32
        }
    }

    pub fn final_result(&self) -> Float {
        self.final_result.clone().unwrap_or_else(|| {
            let all_results = vec![&self.first_try, &self.second_try, &self.third_try];

            let best_result = all_results.iter().max();

            match best_result {
                Some(result) => {
                    if result.integral == -1 {
                        return self.final_result.clone().unwrap_or_else(|| Float::new(0, 0));
                    }
                    let result = *result;
                    result.clone()
                }
                None => Float::new(0, 0)
            }
        })
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

        if let Some(first_try) = json_value.get("first_try").and_then(Value::as_i64) {
            self.first_try = Float::from_i32(first_try as i32);
            new_try = true;
        }
        if let Some(second_try) = json_value.get("second_try").and_then(Value::as_i64) {
            self.second_try = Float::from_i32(second_try as i32);
            new_try = true;
        }
        if let Some(third_try) = json_value.get("third_try").and_then(Value::as_i64) {
            self.third_try = Float::from_i32(third_try as i32);
            new_try = true;
        }
        if new_try {
            self.final_result = Some(self.final_result());
        }

        if let Some(final_result) = json_value.get("final_result").and_then(Value::as_u64) {
            self.final_result = Some(Float::from_i32(final_result as i32));
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
        if self.final_result().to_f32() < 0. {
            0
        } else {
            let a: f32;
            let b: f32;
            let c: f32;
            let mut m: f32 = self.final_result().to_f32();
            match self.name.as_str() {
                "100 Meter Lauf" => {
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 17.857;
                            b = 21.;
                            c = 1.81;
                        }
                        _ => {
                            a = 25.4347;
                            b = 18.;
                            c = 1.81;
                        }
                    }
                }
                "400 Meter Lauf" => {
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 1.34285;
                            b = 91.7;
                            c = 1.81;
                        }
                        _ => {
                            a = 1.53775;
                            b = 82.;
                            c = 1.81;
                        }
                    }
                }
                "110 Meter Hürden" => {
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 5.5;
                            b = 31.5;
                            c = 1.85;
                        }
                        _ => {
                            a = 5.74352;
                            b = 28.5;
                            c = 1.92;
                        }
                    }
                }
                "1500 Meter Lauf" => {
                    match athlete.gender().as_str() {
                        "W" => {
                            a = 0.02883;
                            b = 535.;
                            c = 1.88;
                        }
                        _ => {
                            a = 0.03768;
                            b = 480.;
                            c = 1.85;
                        }
                    }
                }
                _ => {
                    a = 0.;
                    b = 0.;
                    c = 1.;
                    m = 0.;
                }
            }
            (a * (b - m).powf(c)) as u32
        }
    }

    pub fn final_result(&self) -> Float {
        self.final_result.clone()
    }

    pub fn update_values(&mut self, json_string: &str) -> Result<(), Box<dyn Error>> {
        let json_value: Value = serde_json::from_str(json_string)?;

        if let Some(_) = json_value.get("unit") {
            return Err("Unit not updated. Please create new achievement for that kind of change")?;
        }
        if let Some(_) = json_value.get("name") {
            return Err("Name not updated. Please create new achievement for that kind of change")?;
        }
        if let Some(final_result) = json_value.get("final_result") {
            match final_result {
                Value::String(str_value) => {
                    self.final_result = Float::from_str(str_value)?;
                }
                Value::Object(map) => {
                    self.final_result = Float::from_map(map)?;
                }
                _ => return Err("Final result not updated. Could not convert final result to string or map")?
            }
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