use crate::certificate_generation::{Achievement, AchievementID, AgeGroup, AgeGroupID, AgeGroupSelector, Athlete, AthleteID, Group, GroupID, GroupStore};
use std::collections::HashMap;
use std::error::Error;
use std::fs::File;
use std::io::{Read, Write};
use std::sync::Mutex;
use log::warn;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use bincode;

use crate::{AchievementStorage, Storage};
use crate::database::db_errors::ItemNotFound;
use crate::time_planner::{TimeGroup, TimeGroupID, TimePlanStorage};

#[derive(Debug, Serialize, Deserialize)]
pub struct InMemoryDB {
    athlete_store: Mutex<HashMap<AthleteID, Athlete>>,
    group_store: Mutex<HashMap<GroupID, GroupStore>>,
    time_group_store: Mutex<HashMap<TimeGroupID, TimeGroup>>,
}

unsafe impl Send for InMemoryDB {}

unsafe impl Sync for InMemoryDB {}

impl InMemoryDB {
    pub fn new() -> Self {
        InMemoryDB {
            athlete_store: Mutex::new(HashMap::new()),
            group_store: Mutex::new(HashMap::new()),
            time_group_store: Mutex::new(HashMap::new()),
        }
    }

    fn select_age_group_athletes(&self, age_group_selector: AgeGroupSelector) -> Vec<Athlete> {
        let mut result: Vec<Athlete> = Vec::new();

        for athlete in self.athlete_store.lock().expect("Mutex Lock posied").values() {
            if age_group_selector == *athlete {
                result.push(athlete.clone());
            }
        }

        result
    }
}
impl AchievementStorage for InMemoryDB {
    fn get_athlete(&self, athlete_id: &AthleteID) -> Option<Athlete> {
        self.athlete_store.lock().expect("Mutex Lox poised").get(athlete_id).cloned()
    }

    fn write_athlete(&self, athlete_id: AthleteID, athlete: Athlete) -> Result<String, Box<dyn Error>> {
        match self.athlete_store.lock().expect("Mutex Lox poised").insert(athlete_id, athlete) {
            Some(_) => Ok(String::from("Old athlete overwritten")),
            None => Ok(String::from("New athlete inserted"))
        }
    }

    fn update_athlete(&self, athlete_id: AthleteID, json_string: &str) -> Result<String, Box<dyn Error>> {
        // TODO: Implement check if key is updated and then update key also
        let mut athlete = self.get_athlete(&athlete_id).ok_or(ItemNotFound::new("Key not found", "404"))?;

        match athlete.update_values(json_string) {
            Ok(_) => {
                self.write_athlete(athlete_id, athlete)?;
                Ok(String::from("Athlete updated"))
            }
            Err(e) => Err(e)
        }
    }

    fn get_group(&self, group_id: &GroupID) -> Option<Group> {
        let group_store = self.group_store.lock().expect("Mutex Lox poised").get(group_id).cloned();
        match group_store {
            Some(group_store) => {
                let mut athletes = Vec::new();
                for athlete_id in group_store.athlete_ids {
                    let athlete = self.get_athlete(&athlete_id);
                    match athlete {
                        Some(athlete) => { athletes.push(athlete); }
                        None => warn!("Athlete in Group not in athlete store")
                    }
                }
                Some(Group::new(group_store.name.as_str(), athletes))
            }
            None => None
        }
    }

    fn write_group_store(&self, group_id: GroupID, group: GroupStore) -> Result<String, Box<dyn Error>> {
        {
            // Check if all athletes exists
            for athlete_id in &group.athlete_ids {
                if !self.athlete_store.lock().expect("Mutex Lock posed").contains_key(athlete_id) {
                    return Err(Box::from(format!("Athlete with ID {:?} not found", athlete_id)));
                }
            }
        }
        match self.group_store.lock().expect("Mutex Lock poised").insert(group_id, group) {
            Some(_) => Ok(String::from("Old group overwritten")),
            None => Ok(String::from("New group inserted"))
        }
    }

    fn write_group(&self, group_id: GroupID, group: Group) -> Result<String, Box<dyn Error>> {
        let group_store = GroupStore {
            name: group.name().to_string(),
            athlete_ids: group.athlete_ids(),
        };

        self.write_group_store(group_id, group_store)
    }

    fn update_group(&self, group_id: GroupID, json_string: &str) -> Result<String, Box<dyn Error>> {
        // TODO: Implement check if key is updated and then update key also
        let mut group = self.get_group(&group_id).ok_or(ItemNotFound::new("Key not found", "404"))?;

        match group.update_values(json_string, Box::new(self)) {
            Ok(_) => {
                self.write_group(group_id, group)?;
                Ok(String::from("Group updated"))
            }
            Err(e) => Err(e)
        }
    }

    fn get_age_group(&self, age_group_id: &AgeGroupID) -> Option<AgeGroup> {
        // Implement correct age group getter
        if let Some(age_identifier) = &age_group_id.age_identifier {
            if let Ok(age_group_selector) = AgeGroupSelector::build(age_identifier) {
                let athletes = self.select_age_group_athletes(age_group_selector);
                Some(AgeGroup::new(&age_identifier, athletes))
            } else {
                None
            }
        } else {
            None
        }
    }

    fn get_achievement(&self, achievement_id: &AchievementID) -> Option<Achievement> {
        let athlete = self.get_athlete(&achievement_id.athlete_id().expect("Athlete ID should be available."))?;
        athlete.get_achievement(achievement_id.name.as_str()).cloned()
    }

    fn write_achievement(&self, achievement_id: AchievementID, achievement: Achievement) -> Result<String, Box<dyn Error>> {
        let mut athlete = self.get_athlete(&achievement_id.athlete_id().expect("Athlete ID should be available."))
            .ok_or(ItemNotFound::new("Athlete not found", "404"))?;
        athlete.add_achievement(achievement)?;
        self.write_athlete(AthleteID::from_athlete(&athlete), athlete)?;
        Ok(String::from("Achievement added"))
    }

    fn update_achievement(&self, achievement_id: AchievementID, json_string: &str) -> Result<String, Box<dyn Error>> {
        let mut achievement = self.get_achievement(&achievement_id).ok_or(ItemNotFound::new("Key not found", "404"))?;
        match achievement.update_values(json_string) {
            Ok(_) => {
                let mut athlete = self.get_athlete(&achievement_id.athlete_id().expect("Athlete ID should be available."))
                    .ok_or(ItemNotFound::new("Athlete not found", "404"))?;
                athlete.update_achievement(achievement)?;
                self.write_athlete(AthleteID::from_athlete(&athlete), athlete)?;
                Ok(String::from("Achievement updated"))
            }
            Err(e) => Err(e)
        }
    }
}


impl TimePlanStorage for InMemoryDB {
    fn get_time_group(&self, group_id: &TimeGroupID) -> Option<TimeGroup> {
        self.time_group_store.lock().expect("Mutex Lox poised").get(group_id).cloned()
    }

    fn store_time_plan(&self, time_table: Value) -> Result<String, Box<dyn Error>> {
        match time_table {
            Value::Object(time_table_map) => {
                let date_info = match time_table_map.get("Dates") {
                    Some(date_value) => match date_value {
                        Value::Object(date_info_value) => date_info_value
                            .into_iter()
                            .map(|(k, v)| (k.clone(), v.to_string()))
                            .collect(),
                        _ => return Err(Box::from("Dates information in invalid format"))
                    },
                    None => return Err(Box::from("Dates information not found"))
                };

                match time_table_map.get("Groups") {
                    Some(group_value) => {
                        if let Value::Object(group_map) = group_value {
                            for (group_name, times) in group_map {
                                let group_athletes = None; // TODO: Find if already athletes are registered to group
                                let group = TimeGroup::build(group_name, times, &date_info, group_athletes)?;
                                self.time_group_store.lock().expect("Mutex Lox poised")
                                    .insert(TimeGroupID::from_time_group(&group), group);
                            }
                        } else {
                            return Err(Box::from("Group information in invalid format"));
                        }

                    }
                    None => return Err(Box::from("Group information not found"))
                }

                Ok(String::from("Time table stored"))
            }
            _ => Err(Box::from("Invalid format"))
        }
    }
    fn update_time_group(&self, group: TimeGroup) -> Result<String, Box<dyn Error>> {
        self.time_group_store.lock().expect("Mutex Lox poised")
            .insert(TimeGroupID::from_time_group(&group), group);
        Ok(String::from("New group stored"))
    }
}

impl Storage for InMemoryDB {
    fn serialize(&self) {
        let mut f = File::options()
            .read(true)
            .write(true)
            .open("tests/db_serialize.bin")
            .unwrap();
        let bytes = bincode::serialize(self).unwrap();
        let _ = f.write_all(&bytes);
    }

    fn load(&self) {
        let mut f = File::options()
            .read(true)
            .write(true)
            .open("tests/db_serialize.bin")
            .unwrap();
        let mut buffer = Vec::new();
        f.read_to_end(&mut buffer).expect("Failed to read file");

        let db: Self = bincode::deserialize(&buffer).expect("Failed to deserialize");
        *self.athlete_store.lock().unwrap() = db.athlete_store.lock().unwrap().clone();
        *self.group_store.lock().unwrap() = db.group_store.lock().unwrap().clone();
        *self.time_group_store.lock().unwrap() = db.time_group_store.lock().unwrap().clone();

    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use crate::certificate_generation::{AgeGroup, AgeGroupID, Athlete, AthleteID, CompetitionType, Group, GroupID, AchievementStorage};

    use super::InMemoryDB;
    use chrono::{Utc, NaiveDateTime, TimeZone};

    fn get_athletes() -> Vec<Athlete> {
        let athletes: Vec<Athlete> = vec![
            Athlete::new(
                "Person",
                "1",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1997.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "2",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1962.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "3",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1961.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "W",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "4",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1973.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "W",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "5",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1959.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "6",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1974.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "7",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1983.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "8",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1976.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "9",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "10",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "11",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2021.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "12",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
        ];

        athletes
    }

    fn get_m40_athletes() -> Vec<Athlete> {
        let athletes: Vec<Athlete> = vec![
            Athlete::new(
                "Person",
                "6",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1974.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "7",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1983.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "8",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1976.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
        ];

        athletes
    }

    fn get_u6_athletes() -> Vec<Athlete> {
        let athletes: Vec<Athlete> = vec![
            Athlete::new(
                "Person",
                "9",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "10",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "12",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
            ),
        ];

        athletes
    }

    #[test]
    fn insert_and_access_athlete() {
        let db = InMemoryDB::new();
        let new_athlete = Athlete::new("fabian_traxler", "Traxler", None, "M", HashMap::new(), CompetitionType::Decathlon);
        let athlete_key = AthleteID::new("fabian_traxler", "Traxler");

        db.write_athlete(athlete_key.clone(), new_athlete.clone()).expect("Write should not fail in this test");

        let accessed_athlete = db.get_athlete(&athlete_key);

        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(new_athlete, accessed_athlete);
        } else {
            panic!("Previously stored athlete not found");
        }
    }

    #[test]
    fn insert_and_access_group() {
        let db = InMemoryDB::new();
        let athletes = get_athletes();
        for athlete in &athletes {
            match db.write_athlete(AthleteID::from_athlete(&athlete), athlete.clone()) {
                Ok(_) => {}
                Err(e) => { panic!("Failed to write athlete: {e}"); }
            }
        }

        let new_group = Group::new("Gruppe 1", athletes);
        let group_key = GroupID::new("Gruppe 1");

        db.write_group(group_key.clone(), new_group.clone()).expect("Write should not fail in this test");

        let accessed_group = db.get_group(&group_key);

        if let Some(accessed_group) = accessed_group {
            assert!(new_group.athlete_ids().iter().all(|item| accessed_group.athlete_ids().contains(item)));
        } else {
            panic!("Previously stored group not found");
        }
    }

    #[test]
    fn access_age_group() {
        let db = InMemoryDB::new();
        let athletes = get_athletes();
        for athlete in &athletes {
            let athlete_key = AthleteID::from_athlete(&athlete);
            db.write_athlete(athlete_key, athlete.clone()).expect("Write should not fail in this test");
        }

        assert_eq!(athletes.len(), db.athlete_store.lock().expect("Mutex Lock poised").len());

        for athlete in &athletes {
            let athlete_key = AthleteID::from_athlete(&athlete);
            let accessed_athlete = db.get_athlete(&athlete_key);
            if let Some(accessed_athlete) = accessed_athlete {
                assert_eq!(athlete, &accessed_athlete);
            } else {
                panic!("Previously stored athlete not found");
            }
        }

        let age_group = AgeGroup::new("M40", get_m40_athletes());

        let age_group_key = AgeGroupID::new("M40");
        let accessed_age_group = db.get_age_group(&age_group_key);

        if let Some(accessed_age_group) = accessed_age_group {
            assert!(age_group.athletes().iter().all(|item| accessed_age_group.athletes().contains(item)));
        } else {
            panic!("Previously stored age group not found");
        }

        let age_group = AgeGroup::new("U6", get_u6_athletes());

        let age_group_key = AgeGroupID::new("U6");
        let accessed_age_group = db.get_age_group(&age_group_key);

        if let Some(accessed_age_group) = accessed_age_group {
            assert!(age_group.athletes().iter().all(|item| accessed_age_group.athletes().contains(item)));
        } else {
            panic!("Previously stored age group not found");
        }
    }
}
