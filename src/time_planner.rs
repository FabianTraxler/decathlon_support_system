use std::collections::HashMap;
use chrono::{DateTime, Utc};

pub trait TimePlanStorage {

}

struct Athlete {
    name: Option<String>,
    surname: Option<String>,
    starting_number: Option<u16>
}
pub struct Discipline {
    name: String,
    location: Option<String>,
    start_time: Option<DateTime<Utc>>,
}
pub struct Group {
    name: String,
    athlete_order: Vec<Athlete>,
    run_order: Vec<Vec<Athlete>>,
    disciplines: HashMap<String, Discipline>
}

impl Group {
    pub fn get_next_discipline(&self) -> Discipline {
        todo!()
    }
    pub fn get_starting_order(&self, discipline: Discipline) -> Vec<Athlete>{
        todo!()
    }
    pub fn get_run_starting_order(&self, discipline: Discipline) -> HashMap<String, Vec<Athlete>> {
        todo!()
    }
    pub fn change_starting_order(&self, discipline: Discipline, new_order: Vec<Athlete>){
        todo!()
    }

    pub fn change_run_starting_order(&self, discipline: Discipline, new_order: HashMap<String, Vec<Athlete>>) {
        todo!()
    }
}