use std::cmp::Ordering;
use std::fmt;
use serde::de::Error;
use serde::{Deserialize, Serialize};
use crate::certificate_generation::Athlete;

#[derive(Debug, Clone, Hash, PartialEq, Eq)]
pub enum Achievement {
    Height(HeightResult),
    Distance(DistanceResult),
    Time(TimeResult),
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
struct Float {
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

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
struct HeightResult {
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
            Err(E) => Err(E)
        }
    }

    pub fn get_points(&self, athlete: Athlete) -> Float {
        // TODO: Implement point scheme
        Float::new(0,0)
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
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
struct DistanceResult{
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
            Err(E) => Err(E)
        }
    }

    pub fn get_points(&self, athlete: Athlete) -> Float {
        // TODO: Implement point scheme
        Float::new(0,0)
    }

    pub fn final_result(&self) -> Float {
        let all_results = vec![&self.first_try, &self.second_try, &self.third_try];

        let best_result = all_results.iter().max();

        match best_result {
            Some(result) => {
                let result = *result;
                result.clone()
            },
            None => Float::new(0,0)
        }
    }
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
struct TimeResult {
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
            Err(E) => Err(E)
        }
    }

    pub fn get_points(&self, athlete: Athlete) -> Float {
        // TODO: Implement point scheme
        Float::new(0,0)
    }

    pub fn final_result(&self) -> Float {
        self.final_result.clone()
    }
}


fn preprocess_json<'a>(json_string: &'a str) -> String {
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

        assert_eq!(achievement.final_result(), Float::new(1,30));
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

        assert_eq!(achievement.final_result(), Float::new(9,20));
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