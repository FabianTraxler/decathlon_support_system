use async_trait::async_trait;
use chrono::{DateTime, TimeZone, Utc};
use env_logger::filter;
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::error::Error;
use std::hash::Hash;

use crate::run;

#[async_trait]
pub trait TimePlanStorage {
    async fn get_time_group(&self, group_id: &TimeGroupID) -> Option<TimeGroup>;

    async fn store_time_plan(&self, time_table: Value) -> Result<String, Box<dyn Error>>;

    async fn store_time_group(&self, group: TimeGroup) -> Result<String, Box<dyn Error>>;

    async fn get_all_athlete_states(&self) -> Result<HashMap<String, bool>, Box<dyn Error>>;
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct Athlete {
    name: Option<String>,
    surname: Option<String>,
    age_group: Option<String>,
}

impl Athlete {
    pub fn new(name: String, surname: String, age_group: Option<String>) -> Athlete {
        Athlete {
            name: Some(name),
            surname: Some(surname),
            age_group,
        }
    }

    pub fn full_name(&self) -> String {
        format!(
            "{} {}",
            self.name.clone().unwrap_or("".to_string()),
            self.surname.clone().unwrap_or("".to_string())
        )
    }
    pub fn athlete_id(&self) -> String {
        format!(
            "{}_{}",
            self.name.clone().unwrap_or("".to_string()),
            self.surname.clone().unwrap_or("".to_string())
        )
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum DisciplineType {
    Height,
    Distance,
    Track,
    Time,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Discipline {
    name: String,
    location: String,
    start_time: DateTime<Utc>,
    state: DisciplineState,
    starting_order: StartingOrder,
    discipline_type: DisciplineType,
    #[serde(skip_serializing_if = "Option::is_none")]
    time_started: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    time_finished: Option<DateTime<Utc>>
}

impl Discipline {
    fn change_state(&mut self, new_state: DisciplineState) {
        match new_state {
            DisciplineState::Active => {
                self.time_started = Some(chrono::offset::Utc::now())
            },
            DisciplineState::BeforeStart => {},
            DisciplineState::Finished => {
                self.time_finished = Some(chrono::offset::Utc::now())
            }
        }
        self.state = new_state;

    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn discipline_type(&self) -> &DisciplineType {
        &self.discipline_type
    }

    pub fn starting_order(&self) -> &StartingOrder {
        &self.starting_order
    }

    pub fn is_finished(&self) -> bool{
        &self.state == &DisciplineState::Finished
    }
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
enum DisciplineState {
    BeforeStart,
    Active,
    Finished,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum StartingOrder {
    Track(Vec<Run>),
    Default(Vec<Athlete>),
    NoOrder,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Run {
    name: String,
    athletes: (
        Option<Athlete>,
        Option<Athlete>,
        Option<Athlete>,
        Option<Athlete>,
        Option<Athlete>,
        Option<Athlete>,
    ),
}

impl Run {
    pub fn athletes(
        &self,
    ) -> &(
        Option<Athlete>,
        Option<Athlete>,
        Option<Athlete>,
        Option<Athlete>,
        Option<Athlete>,
        Option<Athlete>,
    ) {
        &self.athletes
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TimeGroup {
    name: String,
    default_athlete_order: Vec<Athlete>,
    default_run_order: Vec<Run>,
    disciplines: Vec<Discipline>,
    current_discipline: usize,
}

impl TimeGroup {
    pub fn build(
        group_name: &String,
        group_info: &Value,
        date_info: &HashMap<String, String>,
        discipline_starting_order_type: &HashMap<String, String>,
        athletes: Option<Vec<Athlete>>,
    ) -> Result<Self, Box<dyn Error>> {
        let youth_group = !group_name.contains("Gruppe"); // Sort by gender for youth groups
        let (default_athlete_order, default_run_order, default_hurdle_order) =
            create_default_athlete_order(athletes, youth_group);

        let mut disciplines = vec![];
        match group_info {
            Value::Object(map) => {
                for (discipline_name, discipline_info) in map {
                    let discipline_info = match discipline_info {
                        Value::Object(map) => map,
                        _ => return Err(Box::from("Discipline information not parsable as Map")),
                    };
                    let start_time = match discipline_info.get("time") {
                        Some(time_value) => match time_value {
                            Value::String(time_str) => {
                                let time_infos: Vec<&str> = time_str.split(",").collect();
                                if time_infos.len() != 2 {
                                    return Err(Box::from("Wrong format of time information. Too few or too many commas (,)"));
                                }
                                let time = time_infos[0];
                                let day_name = time_infos[1].trim().to_string();
                                let day = date_info
                                    .get(&day_name)
                                    .ok_or(Box::from("Day not found in dates") as Box<dyn Error>)?;

                                let date_str = format!("{day} {time}:00 +0200");

                                match DateTime::parse_from_str(
                                    date_str.as_str(),
                                    "%d.%m.%Y %H:%M:%S %z",
                                ) {
                                    Ok(parsed) => Utc.from_utc_datetime(&parsed.naive_utc()),
                                    Err(e) => {
                                        return Err(Box::from(format!(
                                            "Time string ({date_str}) could not be parsed: {e}"
                                        )))
                                    }
                                }
                            }
                            _ => return Err(Box::from("Time information not parsable as String")),
                        },
                        None => return Err(Box::from("Time information not available")),
                    };

                    let location = match discipline_info.get("location") {
                        Some(location_value) => match location_value {
                            Value::String(location_str) => location_str.clone(),
                            _ => {
                                return Err(Box::from(
                                    "Location information not parsable as String",
                                ))
                            }
                        },
                        None => return Err(Box::from("Location information not available")),
                    };

                    let starting_order_type =
                        match discipline_starting_order_type.get(discipline_name) {
                            Some(starting_order_type) => starting_order_type,
                            None => {
                                return Err(Box::from(format!(
                                    "Starting order for discipline not found: {discipline_name}"
                                )))
                            }
                        };

                    let starting_order: StartingOrder = match starting_order_type.trim() {
                        "Track" => {
                            if discipline_name.as_str() == "110 Meter Hürden" {
                                StartingOrder::Track(default_hurdle_order.clone())
                            } else {
                                StartingOrder::Track(default_run_order.clone())
                            }
                        }
                        "Default" => StartingOrder::Default(default_athlete_order.clone()),
                        "None" => StartingOrder::NoOrder,
                        x => {
                            return Err(Box::from(format!(
                                "Invalid Starting order given for {discipline_name}: {x}"
                            )))
                        }
                    };

                    let discipline_type: DisciplineType = match starting_order_type.trim() {
                        "Track" => DisciplineType::Track,
                        "Default" => {
                            if vec!["Hochsprung", "Stabhochsprung"]
                                .contains(&discipline_name.as_str())
                            {
                                DisciplineType::Height
                            } else {
                                DisciplineType::Distance
                            }
                        }
                        "None" => DisciplineType::Time,
                        x => {
                            return Err(Box::from(format!(
                                "Invalid Starting order given for {discipline_name}: {x}"
                            )))
                        }
                    };

                    let discipline = Discipline {
                        name: discipline_name.clone(),
                        location,
                        start_time,
                        state: DisciplineState::BeforeStart,
                        starting_order,
                        discipline_type,
                        time_finished: None,
                        time_started: None
                    };

                    disciplines.push(discipline)
                }
            }
            _ => return Err(Box::from("Wrong format of discipline information")),
        }

        disciplines.sort_by(|a, b| a.start_time.cmp(&b.start_time));

        let group = TimeGroup {
            name: group_name.clone(),
            default_athlete_order,
            default_run_order,
            disciplines,
            current_discipline: 0,
        };

        Ok(group)
    }
    pub fn name(&self) -> &str {
        &self.name
    }
    pub fn get_disciplines(&self) -> &Vec<Discipline> {
        &self.disciplines
    }
    pub fn get_next_discipline(&self) -> &Discipline {
        &self.disciplines[self.current_discipline + 1]
    }
    pub fn get_discipline(&self, discipline_name: &str) -> Option<&Discipline> {
        let mut selected_discipline = None;
        for discipline in &self.disciplines {
            if discipline_name == discipline.name {
                selected_discipline = Some(discipline)
            }
        }
        selected_discipline
    }
    pub fn get_current_discipline(&mut self) -> &Discipline {
        while self.current_discipline < self.disciplines.len() -1 {
            let active_discipline: &Discipline = &self.disciplines[self.current_discipline];
            match active_discipline.state {
                DisciplineState::Active => break,
                DisciplineState::BeforeStart => break,
                DisciplineState::Finished => {
                    self.current_discipline += 1;
                }
            }
        }
        &self.disciplines[self.current_discipline]
    }
    pub fn get_mut_current_discipline(&mut self) -> &mut Discipline {
        match self.disciplines[self.current_discipline].state {
            DisciplineState::Active => &mut self.disciplines[self.current_discipline],
            DisciplineState::BeforeStart => &mut self.disciplines[self.current_discipline],
            DisciplineState::Finished => {
                if self.current_discipline < self.disciplines.len() - 1 {
                    self.current_discipline += 1;
                }
                &mut self.disciplines[self.current_discipline]
            }
        }
    }
    pub fn change_discipline_state(&mut self, json_body: &str) -> Result<String, Box<dyn Error>> {
        let info = serde_json::from_str(json_body)?;
        let discipline_name: String;
        let new_state: DisciplineState;

        match info {
            Value::Object(map) => {
                discipline_name = map
                    .get("name")
                    .ok_or(Box::from("Discipline name not given") as Box<dyn Error>)?
                    .to_string()
                    .replace("\"", "");
                let state_value = map
                    .get("state")
                    .ok_or(Box::from("Discipline name not given") as Box<dyn Error>)?;
                new_state = serde_json::from_value(state_value.clone())?;
            }
            _ => return Err(Box::from("Could not parse new state information")),
        }

        let mut discipline_updated = false;
        if self.get_current_discipline().name == discipline_name {
            // most likely the current discipline is changed
            let discipline = self.get_mut_current_discipline();
            discipline.change_state(new_state);
            discipline_updated = true;
        } else {
            // Changing state of a different discipline
            for discipline in &mut self.disciplines {
                if discipline.name == discipline_name {
                    discipline.change_state(new_state);
                    discipline_updated = true;
                    break;
                }
            }
        }
        if discipline_updated {
            Ok(String::from("Discipline state updated"))
        } else {
            Err(Box::from("No discipline updated"))
        }
    }
    pub fn get_default_starting_order(&self) -> StartingOrder {
        StartingOrder::Default(self.default_athlete_order.clone())
    }
    pub fn get_default_track_order(&self) -> StartingOrder {
        StartingOrder::Track(self.default_run_order.clone())
    }
    pub fn change_starting_order(&mut self, new_order: StartingOrder, change_only_hurdle: Option<bool>) {
        // Do not change default starting order!
        // match new_order.clone() {
        //     StartingOrder::Default(athletes) => self.default_athlete_order = athletes,
        //     StartingOrder::Track(runs) => self.default_run_order = runs,
        //     StartingOrder::NoOrder => {}
        // }

        for discipline in &mut self.disciplines {
            if discipline.name().contains("Hürden") && !change_only_hurdle.unwrap_or(false) {
                // If the discipline is 110 Meter Hürden, we do not change the starting order
                // unless change_hurdle is set to true
                continue;
            }else if (change_only_hurdle.unwrap_or(false) && !discipline.name().contains("Hürden")) {
                // If change_hurdle is set to true, we only change the starting order for hurdles
                continue;
            }
            match discipline.state {
                DisciplineState::Finished => continue,
                _ => {
                    if std::mem::discriminant(&discipline.starting_order)
                        == std::mem::discriminant(&new_order)
                    {
                        discipline.starting_order = new_order.clone();
                    }
                }
            }
        }
    }
    pub fn update_athletes(&mut self, new_athletes: &Vec<Athlete>) -> Result<(), Box<dyn Error>> {
        let all_athletes = &mut self.default_athlete_order;

        let mut new_athletes = new_athletes.clone();
        all_athletes.append(&mut new_athletes);

        let youth_group = self.disciplines.len() < 10;
        let (default_athlete_order, default_run_order, default_hurdle_order) =
            create_default_athlete_order(Some(all_athletes.clone()), youth_group);

        self.default_athlete_order = default_athlete_order.clone();
        self.default_run_order = default_run_order.clone();

        for discipline in &mut self.disciplines {
            discipline.starting_order = match discipline.starting_order {
                StartingOrder::NoOrder => StartingOrder::NoOrder,
                StartingOrder::Default(_) => StartingOrder::Default(default_athlete_order.clone()),
                StartingOrder::Track(_) => {
                    if discipline.name() == "110 Meter Hürden" {
                        StartingOrder::Track(default_hurdle_order.clone())
                    } else {
                        StartingOrder::Track(default_run_order.clone())
                    }
                }
            }
        }

        Ok(())
    }
    pub fn delete_athlete(&mut self, athlete: Athlete) -> Result<(), Box<dyn Error>> {
        let index = self.default_athlete_order
            .iter()
            .position(|x| x == &athlete)
            .ok_or("Athlete not found")?;
        self.default_athlete_order.remove(index);

        let run_index = self.default_run_order.iter().position(|run| {
            run.athletes.0.as_ref() == Some(&athlete)
                || run.athletes.1.as_ref() == Some(&athlete)
                || run.athletes.2.as_ref() == Some(&athlete)
                || run.athletes.3.as_ref() == Some(&athlete)
                || run.athletes.4.as_ref() == Some(&athlete)
                || run.athletes.5.as_ref() == Some(&athlete)
        });
        match run_index {
            Some(run_index) => {
                let run: &mut Run = self.default_run_order.get_mut(run_index).expect("Run should exist");
                if run.athletes.0.as_ref() == Some(&athlete) {
                    run.athletes.0 = None;
                } else if run.athletes.1.as_ref() == Some(&athlete) {
                    run.athletes.1 = None;
                } else if run.athletes.2.as_ref() == Some(&athlete) {
                    run.athletes.2 = None;
                } else if run.athletes.3.as_ref() == Some(&athlete) {
                    run.athletes.3 = None;
                } else if run.athletes.4.as_ref() == Some(&athlete) {
                    run.athletes.4 = None;
                } else if run.athletes.5.as_ref() == Some(&athlete) {
                    run.athletes.5 = None;
                }
            }
            None => (),
        };
        
        for discipline in &mut self.disciplines {
            discipline.starting_order = match &discipline.starting_order {
                StartingOrder::NoOrder => StartingOrder::NoOrder,
                StartingOrder::Default(current_order) => {
                    let mut new_order = current_order.clone();
                    let index = current_order
                        .iter()
                        .position(|x| x == &athlete)
                        .ok_or("Athlete not found")?;
                    new_order.remove(index);
                    StartingOrder::Default(new_order)
                    },
                StartingOrder::Track(current_order) => {
                    let mut new_order = current_order.clone();
                    let run_index = new_order.iter().position(|run| {
                        run.athletes.0.as_ref() == Some(&athlete)
                            || run.athletes.1.as_ref() == Some(&athlete)
                            || run.athletes.2.as_ref() == Some(&athlete)
                            || run.athletes.3.as_ref() == Some(&athlete)
                            || run.athletes.4.as_ref() == Some(&athlete)
                            || run.athletes.5.as_ref() == Some(&athlete)
                    });
                    match run_index {
                        Some(run_index) => {
                            let run: &mut Run = new_order.get_mut(run_index).expect("Run should exist");
                            if run.athletes.0.as_ref() == Some(&athlete) {
                                run.athletes.0 = None;
                            } else if run.athletes.1.as_ref() == Some(&athlete) {
                                run.athletes.1 = None;
                            } else if run.athletes.2.as_ref() == Some(&athlete) {
                                run.athletes.2 = None;
                            } else if run.athletes.3.as_ref() == Some(&athlete) {
                                run.athletes.3 = None;
                            } else if run.athletes.4.as_ref() == Some(&athlete) {
                                run.athletes.4 = None;
                            } else if run.athletes.5.as_ref() == Some(&athlete) {
                                run.athletes.5 = None;
                            }
                        }
                        None => (),
                    };
                    StartingOrder::Track(new_order)
                }
            }
        }

        Ok(())
    }
    pub fn reshuffle_athlete_order(&mut self, group_name: String, only_registered_athletes: bool, athlete_states: HashMap<String, bool>) -> Result<String, Box<dyn Error>> {
        let youth_group = !group_name.contains("Gruppe"); // Sort by gender for youth groups
        let mut athletes = self.default_athlete_order.clone();
        
        if only_registered_athletes {
            athletes.retain(|athlete: &Athlete| {
                if let Some(state) = athlete_states.get(&athlete.athlete_id()) {
                    *state
                } else {
                    false
                }
            });
        }

        let (default_order, run_order, hurdle_order) =
            create_default_athlete_order(Some(athletes), youth_group);

        self.change_starting_order(StartingOrder::Track(run_order), Some(false));
        self.change_starting_order(StartingOrder::Track(hurdle_order), Some(true));
        self.change_starting_order(StartingOrder::Default(default_order), None);

        Ok("Updated".to_string())
    }
}

// Create default order, default run order and default order for hurdles
// hurdels need in 1. track: M60,W40,W50,W60 and in 2.3. track: AK-W, M40, M50 and in 4.5.6. track: AK-M
fn create_default_athlete_order(
    athletes: Option<Vec<Athlete>>,
    sort_gender: bool,
) -> (Vec<Athlete>, Vec<Run>, Vec<Run>) {
    let mut default_athlete_order = athletes.unwrap_or_else(|| vec![]);
    if sort_gender {
        default_athlete_order.sort_by_key(|athlete| athlete.age_group.clone())
    }

    let mut track_athletes_map: HashMap<String, Vec<Athlete>> = default_athlete_order
        .clone()
        .into_iter()
        .map(|athlete| {
            (
                athlete.age_group.clone().unwrap_or("M".to_string()),
                athlete,
            )
        })
        .into_group_map();

    let mut default_run_order: Vec<Run> = vec![];
    let mut i = 0;
    let mut run_number = 1;
    let num_tracks = 6;
    while i < default_athlete_order.len() {
        let mut athletes: Vec<Athlete>;

        if sort_gender {
            athletes = vec![];
            for athlete in &default_athlete_order[i..] {
                if athletes.len() == 0 || athletes[0].age_group == athlete.age_group {
                    athletes.push(athlete.clone())
                }
                if athletes.len() >= num_tracks {
                    break;
                }
            }
        } else {
            let mut j: usize = i + num_tracks;
            if j >= default_athlete_order.len() {
                j = default_athlete_order.len();
            }
            athletes = default_athlete_order[i..j].to_vec().clone()
        }
        i += athletes.len();


        let mut run_athletes: Vec<Option<Athlete>> = athletes
            .into_iter()
            .map(|athlete| Some(athlete)).collect();

        if run_athletes.len() < 6{
            let missing_fields = 6 - run_athletes.len();
            for _ in 0..missing_fields {
                run_athletes.push(None)
            }
        }

        let tuple_athletes = run_athletes.into_iter().collect_tuple().unwrap();

        let run = Run {
            name: format!("Lauf {}", run_number),
            athletes: tuple_athletes,
        };
        default_run_order.push(run);
        run_number += 1;
    }

    let mut default_hurdle_order: Vec<Run> = vec![];
    let mut i = 0;
    let mut run_number = 1;
    while i < default_athlete_order.len() {
        let mut athletes: (
            Option<Athlete>,
            Option<Athlete>,
            Option<Athlete>,
            Option<Athlete>,
            Option<Athlete>,
            Option<Athlete>,
        ) = (None, None, None, None, None, None);

        let mut j = 0;
        while j < 6 {
            if j == 0 && athletes.0.is_none(){
                for age_group in vec!["M70", "M60", "W70", "W60", "W50", "W40"] {
                    if let Some(track_athletes) = track_athletes_map.get_mut(age_group) {
                        if track_athletes.len() > 0 {
                            athletes.0 = track_athletes.pop();
                            i += 1;
                            break;
                        }
                    }
                }
            } else if (j == 1 || j == 2) && (athletes.1.is_none() || athletes.2.is_none()) {
                for age_group in vec!["M50", "M40", "W"] {
                    if let Some(track_athletes) = track_athletes_map.get_mut(age_group) {
                        if track_athletes.len() > 0 {
                            if athletes.1.is_none() {
                                athletes.1 = track_athletes.pop();
                                i += 1;
                                break;
                            } else if athletes.2.is_none() {
                                athletes.2 = track_athletes.pop();
                                i += 1;
                                break;
                            }
                        }
                    }
                }
            } else if j == 3 || j == 4 || j == 5 {
                for age_group in vec!["M", "S-M", "S-W"] {
                    if let Some(track_athletes) = track_athletes_map.get_mut(age_group) {
                        if track_athletes.len() > 0 {
                            if athletes.3.is_none() {
                                athletes.3 = track_athletes.pop();
                                i += 1;
                                break;
                            } else if athletes.4.is_none() {
                                athletes.4 = track_athletes.pop();
                                i += 1;
                                break;
                            }else if athletes.5.is_none() {
                                athletes.5 = track_athletes.pop();
                                i+= 1;
                                break;
                            }
                        }
                    }
                }
            }

            j += 1;
        }

        if athletes == (None, None, None, None, None, None){
            // Break out of loop if no athletes could be assigned to a track
            break
        }

        let run = Run {
            name: format!("Lauf {}", run_number),
            athletes,
        };
        default_hurdle_order.push(run);
        run_number += 1;
    }

    (
        default_athlete_order,
        default_run_order,
        default_hurdle_order,
    )
}


#[derive(Serialize, Deserialize, Debug, Clone, Eq, Hash, PartialEq)]
pub struct TimeGroupID {
    pub name: Option<String>,
}

impl TimeGroupID {
    pub fn from_time_group(time_group: &TimeGroup) -> Self {
        TimeGroupID {
            name: Some(time_group.name.clone()),
        }
    }
    pub fn new(name: String) -> Self {
        TimeGroupID { name: Some(name) }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone, Eq, Hash, PartialEq)]
pub struct DisciplineUpdateId {
    pub group_name: String,
    pub change_hurdle: Option<bool>
}

#[derive(Serialize, Deserialize, Debug, Clone, Eq, Hash, PartialEq)]
pub struct DisciplineID {
    group_name: Option<String>,
    discipline_name: Option<String>,
}

impl DisciplineID {
    pub fn group_name(&self) -> String {
        self.group_name.clone().unwrap_or("".to_string())
    }

    pub fn discipline_name(&self) -> Option<String> {
        self.discipline_name.clone()
    }
}
