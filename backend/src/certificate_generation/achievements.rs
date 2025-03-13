use crate::certificate_generation::{preprocess_json, Athlete, AthleteID, Float};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::error::Error;

use super::CompetitionType;

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
            Achievement::Time(r) => r.name.clone(),
        }
    }

    pub fn update_values(&mut self, json_string: &str) -> Result<(), Box<dyn Error>> {
        match self {
            Achievement::Distance(r) => r.update_values(json_string)?,
            Achievement::Height(r) => r.update_values(json_string)?,
            Achievement::Time(r) => r.update_values(json_string)?,
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
            Achievement::Time(r) => format!("{}", r.final_result()),
        }
    }

    pub fn fmt_final_result(&self) -> (String, String) {
        match self {
            Achievement::Distance(r) => r.fmt_final_result(),
            Achievement::Height(r) => r.fmt_final_result(),
            Achievement::Time(r) => r.fmt_final_result(),
        }
    }

    pub fn unit(&self) -> String {
        match self {
            Achievement::Distance(r) => format!("{}", r.unit),
            Achievement::Height(r) => format!("{}", r.unit),
            Achievement::Time(r) => format!("{}", r.unit), // TODO Change to min if more than 3min
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
        let mut achievement: Achievement = serde_json::from_str(processed_content.as_str())?;
        achievement.compute_final_result();
        Ok(achievement)
    }
}

#[derive(Debug, Clone, Hash, PartialEq, Eq, Deserialize, Serialize)]
pub struct AchievementID {
    pub athlete_id: Option<AthleteID>,
    pub name: String,
    pub athlete_name: Option<String>,
}

impl AchievementID {
    pub fn build(athlete_id: AthleteID, achievement: &Achievement) -> AchievementID {
        AchievementID {
            athlete_id: Some(athlete_id.clone()),
            name: achievement.name(),
            athlete_name: Some(athlete_id.full_name()),
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
            Err(e) => Err(e),
        }
    }

    pub fn start_height(&self) -> i32 {
        self.start_height
    }
    pub fn tries(&self) -> String {
        self.tries.clone()
    }

    pub fn get_points(&self, athlete: &Athlete) -> u32 {
        if self.final_result() < 0 {
            0
        } else if *athlete.competition_type() == CompetitionType::Decathlon {
            let a: f32;
            let b: f32;
            let c: f32;
            let age_factor: f32 = get_age_factor(athlete, self.name.as_str());

            let mut leistung: f32 = self.final_result() as f32;
            match self.name.as_str() {
                "Hochsprung" => match athlete.gender().replace("S-", "").as_str() {
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
                },
                "Stabhochsprung" => match athlete.gender().replace("S-", "").as_str() {
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
                },
                _ => {
                    a = 0.;
                    b = 0.;
                    c = 1.;
                    leistung = 0.;
                }
            }
            (a * ((leistung * age_factor) - b).powf(c)) as u32
        } else {
            // Youth disciplines
            let a: f32;
            let b: f32;
            let c: f32;
            let mut m: f32 = self.final_result() as f32;
            match self.name.as_str() {
                "Hochsprung" => match athlete.gender().replace("S-", "").as_str() {
                    "W" => {
                        a = 855.310049;
                        b = 62.;
                        c = 1.;
                    }
                    _ => {
                        a = 690.05175;
                        b = 65.;
                        c = 1.;
                    }
                },
                _ => {
                    a = 0.;
                    b = 0.;
                    c = 1.;
                    m = 0.;
                }
            }
            (a * ((m - b) / 100.).powf(c)) as u32
        }
    }

    pub fn final_result(&self) -> i32 {
        match &self.final_result {
            Some(value) => *value,
            None => self.compute_final_result(),
        }
    }

    pub fn fmt_final_result(&self) -> (String, String) {
        let result = match &self.final_result {
            Some(value) => *value,
            None => self.compute_final_result(),
        };

        let m_result = result as f64 / 100.; // convert from cm to m

        (format!("{}", Float::from_f64(m_result)), "m".to_string())
    }

    fn compute_final_result(&self) -> i32 {
        let mut jumped_height = 0;

        for (i, height) in self.tries.split("-").enumerate() {
            if height.contains("O") {
                jumped_height = self.start_height
                    + i32::try_from(i).expect("Enumeration should be convertible")
                        * self.height_increase;
            }
        }

        jumped_height
    }

    pub fn update_values(&mut self, json_string: &str) -> Result<(), Box<dyn Error>> {
        let json_value: Value = serde_json::from_str(json_string)?;

        if let Some(_) = json_value.get("start_height").and_then(Value::as_i64) {
            return Err(
                "Start height not updated. Please create new achievement for that kind of change",
            )?;
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
    first_try: Option<Float>,
    second_try: Option<Float>,
    third_try: Option<Float>,
    final_result: Option<Float>,
    unit: String,
}

impl DistanceResult {
    pub fn build(json_string: &str) -> Result<Self, serde_json::error::Error> {
        // Change Float fields to represent Float struct to enable json parsing
        let json_string = preprocess_json(json_string);

        let result: Result<Self, serde_json::error::Error> =
            serde_json::from_str(json_string.as_str());

        match result {
            Ok(mut result) => {
                result.final_result = Some(result.final_result());
                Ok(result)
            }
            Err(e) => Err(e),
        }
    }

    pub fn get_points(&self, athlete: &Athlete) -> u32 {
        if self.final_result().to_f32() < 0. {
            0
        } else if *athlete.competition_type() == CompetitionType::Decathlon {
            let a: f32;
            let b: f32;
            let c: f32;
            let leistung: f32;

            let age_factor: f32 = get_age_factor(athlete, self.name.as_str());

            match self.name.as_str() {
                "Weitsprung" => {
                    leistung = self.final_result().to_f32() * 100.;
                    match athlete.gender().replace("S-", "").as_str() {
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
                    leistung = self.final_result().to_f32();
                    match athlete.gender().replace("S-", "").as_str() {
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
                    leistung = self.final_result().to_f32();
                    match athlete.gender().replace("S-", "").as_str() {
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
                    leistung = self.final_result().to_f32();
                    match athlete.gender().replace("S-", "").as_str() {
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
                    leistung = 0.;
                }
            }
            (a * ((leistung * age_factor) - b).powf(c)) as u32
        } else {
            // Youth disciplines
            let mut a: f32;
            let b: f32;
            let c: f32;
            let m: f32;
            match self.name.as_str() {
                "Weitsprung" => {
                    m = self.final_result().to_f32() * 100.;
                    match athlete.gender().replace("S-", "").as_str() {
                        "W" => {
                            a = 220.628792;
                            b = 180.;
                            c = 1.;
                            if m < 180. {
                                a = 0.
                            }
                        }
                        _ => {
                            a = 180.85908;
                            b = 190.;
                            c = 1.;
                            if m < 190. {
                                a = 0.
                            }
                        }
                    }
                }
                "Schlagball" => {
                    m = self.final_result().to_f32() * 100.;
                    match athlete.gender().replace("S-", "").as_str() {
                        "W" => {
                            a = 22.;
                            b = 100.;
                            c = 0.9;
                            if m < 500. {
                                a = 0.
                            }
                        }
                        _ => {
                            a = 18.;
                            b = 800.;
                            c = 0.9;
                            if m < 800. {
                                a = 0.
                            }
                        }
                    }
                }
                "Vortex" => {
                    m = self.final_result().to_f32() * 100.;
                    match athlete.gender().replace("S-", "").as_str() {
                        "W" => {
                            a = 15.9803;
                            b = 380.;
                            c = 1.04;
                            if m < 380. {
                                a = 0.
                            }
                        }
                        _ => {
                            a = 10.14;
                            b = 700.;
                            c = 1.08;
                            if m < 700. {
                                a = 0.
                            }
                        }
                    }
                }
                "Speerwurf" => { // Heptathlon
                    m = self.final_result().to_f32() * 100.;
                    match athlete.gender().replace("S-", "").as_str() {
                        "W" => {
                            a = 15.9803;
                            b = 380.;
                            c = 1.04;
                            if m < 380. {
                                a = 0.
                            }
                        }
                        _ => {
                            a = 10.14;
                            b = 700.;
                            c = 1.08;
                            if m < 700. {
                                a = 0.
                            }
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
            (a * ((m - b) / 100.).powf(c)) as u32
        }
    }

    pub fn final_result(&self) -> Float {
        self.final_result
            .clone()
            .unwrap_or_else(|| self.compute_best_result())
    }

    pub fn tries(&self) -> Vec<&Option<Float>> {
        vec![&self.first_try, &self.second_try, &self.third_try]
    }

    pub fn fmt_final_result(&self) -> (String, String) {
        let result: Float = self.final_result();
        (format!("{}", result), "m".to_string())
    }

    pub fn compute_best_result(&self) -> Float {
        let all_results = vec![&self.first_try, &self.second_try, &self.third_try];

        let best_result = all_results.iter().max();

        match best_result {
            Some(result) => match result {
                Some(result) => {
                    if result.integral == -1 {
                        return self
                            .final_result
                            .clone()
                            .unwrap_or_else(|| Float::new(0, 0));
                    }
                    result.clone()
                }
                None => Float::new(0, 0),
            },
            None => Float::new(0, 0),
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

        if let Some(first_try) = json_value.get("first_try").and_then(Value::as_str) {
            self.first_try = Float::from_str(first_try).ok();
            new_try = true;
        }
        if let Some(first_try) = json_value.get("first_try").and_then(Value::as_f64) {
            self.first_try = Some(Float::from_f64(first_try));
            new_try = true;
        }
        if let Some(second_try) = json_value.get("second_try").and_then(Value::as_str) {
            self.second_try = Float::from_str(second_try).ok();
            new_try = true;
        }
        if let Some(second_try) = json_value.get("second_try").and_then(Value::as_f64) {
            self.second_try = Some(Float::from_f64(second_try));
            new_try = true;
        }
        if let Some(third_try) = json_value.get("third_try").and_then(Value::as_str) {
            self.third_try = Float::from_str(third_try).ok();
            new_try = true;
        }
        if let Some(third_try) = json_value.get("third_try").and_then(Value::as_f64) {
            self.third_try = Some(Float::from_f64(third_try));
            new_try = true;
        }

        if new_try {
            self.final_result = Some(self.compute_best_result());
        }

        if let Some(final_result) = json_value.get("final_result").and_then(Value::as_str) {
            self.final_result = Float::from_str(final_result).ok();
        }
        if let Some(final_result) = json_value.get("final_result") {
            match final_result {
                Value::String(str_value) => {
                    self.final_result = Float::from_str(str_value).ok();
                }
                Value::Object(map) => {
                    self.final_result = Float::from_map(map).ok();
                }
                _ => {
                    return Err(
                        "Final result not updated. Could not convert final result to string or map",
                    )?
                }
            }
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

        let result: Result<Self, serde_json::error::Error> =
            serde_json::from_str(json_string.as_str());

        match result {
            Ok(result) => Ok(result),
            Err(e) => Err(e),
        }
    }

    pub fn get_points(&self, athlete: &Athlete) -> u32 {
        if self.final_result().to_f32() < 0. {
            0
        } else if *athlete.competition_type() == CompetitionType::Decathlon {
            let a: f32;
            let b: f32;
            let c: f32;
            
            let age_factor: f32 = get_age_factor(athlete, self.name.as_str());
            
            let mut leistung: f32 = self.final_result().to_f32();
            match self.name.as_str() {
                "100 Meter Lauf" => match athlete.gender().replace("S-", "").as_str() {
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
                },
                "400 Meter Lauf" => match athlete.gender().replace("S-", "").as_str() {
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
                },
                "110 Meter Hürden" => match athlete.gender().replace("S-", "").as_str() {
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
                },
                "1500 Meter Lauf" => match athlete.gender().replace("S-", "").as_str() {
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
                },
                _ => {
                    a = 0.;
                    b = 0.;
                    c = 1.;
                    leistung = 0.;
                }
            }
            (a * (b - (leistung * age_factor)).powf(c)) as u32
        } else {
            // Youth disciplines
            let mut a: f32;
            let b: f32;
            let c: f32;
            let m: f32;
            match self.name.as_str() {
                "60 Meter Lauf" => {
                    m = self.final_result().to_f32() * 100.;
                    match athlete.gender().replace("S-", "").as_str() {
                        "W" => {
                            a = 19.742424;
                            b = 1417.;
                            c = 2.1;
                            if m > 1417. {
                                a = 0.
                            }
                        }
                        _ => {
                            a = 17.686955;
                            b = 1397.;
                            c = 2.1;
                            if m > 1397. {
                                a = 0.
                            }
                        }
                    }
                }
                "60 Meter Hürden" => {
                    m = self.final_result().to_f32() * 100.;
                    match athlete.gender().replace("S-", "").as_str() {
                        "W" => {
                            a = 20.0479;
                            b = 1700.;
                            c = 1.835;
                            if m > 1700. {
                                a = 0.
                            }
                        }
                        _ => {
                            a = 20.5173;
                            b = 1550.;
                            c = 1.92;
                            if m > 1550. {
                                a = 0.
                            }
                        }
                    }
                }
                "1200 Meter Cross Lauf" => {
                    m = self.final_result().to_f32();
                    let points = (-6.67 * m + 2400.) as u32;
                    return points;
                }
                _ => {
                    a = 0.;
                    b = 0.;
                    c = 1.;
                    m = 0.;
                }
            }
            (a * ((b - m) / 100.).powf(c)) as u32
        }
    }

    pub fn final_result(&self) -> Float {
        self.final_result.clone()
    }

    pub fn fmt_final_result(&self) -> (String, String) {
        let final_result = self.final_result();

        if [
            "100 Meter Lauf",
            "110 Meter Hürden",
            "400 Meter Lauf",
            "60 Meter Lauf",
            "60 Meter Hürden",
            "100 Meter Hürden",
        ]
        .contains(&self.name.as_str())
        {
            (format!("{}", final_result), "s".to_string())
        } else {
            // convert to min:ss
            let minutes = final_result.integral / 60;
            let seconds =
                (final_result.integral % 60) as f64 + final_result.fractional as f64 / 100.;
            (
                format!("{}:{}", minutes, Float::from_f64(seconds)),
                "min".to_string(),
            )
        }
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
                _ => {
                    return Err(
                        "Final result not updated. Could not convert final result to string or map",
                    )?
                }
            }
        }

        Ok(())
    }
}


fn get_age_factor(athlete: &Athlete, discipline_name: &str) -> f32{
    let age_group = athlete.age_group().replace("S-", "");

    let age_discipline_factor = match age_group.as_str() {
        "M" => 1.0,
        "M40" => {
            match discipline_name {
                "100 Meter Lauf" => 0.9578,
                "400 Meter Lauf" => 0.9354,
                "1500 Meter Lauf" => 0.9519,
                "110 Meter Hürden" => 0.9463,
                "Weitsprung" => 1.0899,
                "Hochsprung" => 1.0486,
                "Stabhochsprung" => 1.0773,
                "Kugelstoß" => 1.1137,
                "Diskuswurf" => 1.1014,
                "Speerwurf" => 1.0863,
                _ => 1.0
            }
        },
        "M50" => {
            match discipline_name {
                "100 Meter Lauf" => 0.8996,
                "400 Meter Lauf" => 0.8754,
                "1500 Meter Lauf" => 0.8731,
                "110 Meter Hürden" => 0.8965,
                "Weitsprung" => 1.2286,
                "Hochsprung" => 1.1617,
                "Stabhochsprung" => 1.2272,
                "Kugelstoß" => 1.1721,
                "Diskuswurf" => 1.0218,
                "Speerwurf" => 1.2278,
                _ => 1.0
            }
        },
        "M60" => {
            match discipline_name {
                "100 Meter Lauf" => 0.8414,
                "400 Meter Lauf" => 0.8154,
                "1500 Meter Lauf" => 0.7939,
                "110 Meter Hürden" => 0.8379,
                "Weitsprung" => 1.4078,
                "Hochsprung" => 1.3025,
                "Stabhochsprung" => 1.4236,
                "Kugelstoß" => 1.2482,
                "Diskuswurf" => 1.0628,
                "Speerwurf" => 1.4140,
                _ => 1.0
            }
        },
        "W" => 1.0,
        "W40" => {
            match discipline_name {
                "100 Meter Lauf" => 0.9548,
                "400 Meter Lauf" => 0.9391,
                "1500 Meter Lauf" => 0.9457,
                "110 Meter Hürden" => 0.9508,
                "Weitsprung" => 1.1101,
                "Hochsprung" => 1.1036,
                "Stabhochsprung" => 1.1451,
                "Kugelstoß" => 1.1100,
                "Diskuswurf" => 1.1150,
                "Speerwurf" => 1.1475,
                _ => 1.0
            }
        },
        "W50" => {
            match discipline_name {
                "100 Meter Lauf" => 0.8844,
                "400 Meter Lauf" => 0.8575,
                "1500 Meter Lauf" => 0.8627,
                "110 Meter Hürden" => 0.8630,
                "Weitsprung" => 1.2538,
                "Hochsprung" => 1.2256,
                "Stabhochsprung" => 1.2961,
                "Kugelstoß" => 1.2607,
                "Diskuswurf" => 1.3128,
                "Speerwurf" => 1.3147,
                _ => 1.0
            }
        },
        "W60" => {
            match discipline_name {
                "100 Meter Lauf" => 0.8140,
                "400 Meter Lauf" => 0.7715,
                "1500 Meter Lauf" => 0.7759,
                "110 Meter Hürden" => 0.7607,
                "Weitsprung" => 1.4400,
                "Hochsprung" => 1.3779,
                "Stabhochsprung" => 1.4932,
                "Kugelstoß" => 1.5015,
                "Diskuswurf" => 1.5961,
                "Speerwurf" => 1.6118,
                _ => 1.0
            }
        },
        _ => 1.0
    };


    age_discipline_factor
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
