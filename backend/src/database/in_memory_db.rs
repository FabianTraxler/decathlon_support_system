use crate::authenticate::{AuthenticateStorage, LoginInfo, Role};
use crate::certificate_generation::{Achievement, AchievementID, AgeGroup, AgeGroupID, AgeGroupSelector, Athlete, AthleteID, Group, GroupID, GroupStore, SwitchGroupID};
use crate::notes::{NoteID, NoteStorage};
use crate::teams::{TeamStorage, Team, TeamID};
use std::collections::HashMap;
use std::error::Error;
use std::fs::File;
use std::io::{Read, Write};
use std::sync::Mutex;
use actix_web::web::to;
use async_trait::async_trait;
use log::warn;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use bincode;

use crate::{AchievementStorage, Storage, time_planner};
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
    pub fn _new() -> Self {
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

#[async_trait]
impl AchievementStorage for InMemoryDB {
    async fn get_athlete(&self, athlete_id: &AthleteID) -> Option<Athlete> {
        self.athlete_store.lock().expect("Mutex Lox poised").get(athlete_id).cloned()
    }

    async fn get_athletes(&self) -> HashMap<String, Vec<Athlete>> {
        let group_ids: Vec<GroupID> = self.group_store.lock().expect("Mutex Lox poised").keys().cloned().collect();

        let mut groups = HashMap::new();

        for group_id in group_ids {
            match self.get_group(&group_id).await {
                Some(group) => {
                    groups.insert(group.name().to_string(), group.athletes().clone());
                },
                None => {}
            }

        }
        groups
    }

    async fn write_athlete(&self, athlete_id: AthleteID, athlete: Athlete) -> Result<String, Box<dyn Error>> {
        match self.athlete_store.lock().expect("Mutex Lox poised").insert(athlete_id, athlete) {
            Some(_) => Ok(String::from("Old athlete overwritten")),
            None => Ok(String::from("New athlete inserted"))
        }
    }

    async fn delete_athlete(&self, _athlete_id: AthleteID) -> Result<String, Box<dyn Error>>{
        todo!("Implement method")
    }

    async fn update_athlete(&self, athlete_id: AthleteID, json_string: &str) -> Result<String, Box<dyn Error>> {
        // TODO: Implement check if key is updated and then update key also
        let mut athlete = self.get_athlete(&athlete_id).await.ok_or(ItemNotFound::new("Key not found", "404"))?;
        athlete.update_values(json_string)?;
        self.write_athlete(athlete_id, athlete).await?;
        Ok(String::from("Athlete updated"))
    }

    async fn get_group(&self, group_id: &GroupID) -> Option<Group> {
        let group_store = self.group_store.lock().expect("Mutex Lox poised").get(group_id).cloned();
        match group_store {
            Some(group_store) => {
                let mut athletes = Vec::new();
                for athlete_id in group_store.athlete_ids {
                    let athlete = self.get_athlete(&athlete_id).await;
                    match athlete {
                        Some(athlete) => {
                            athletes.push(athlete);
                        }
                        None => warn!("Athlete in Group not in athlete store")
                    }
                }

                Some(Group::new(group_store.name.as_str(), athletes, group_store.competition_type))
            }
            None => None
        }
    }

    async fn write_group_store(&self, group_id: GroupID, group: GroupStore) -> Result<String, Box<dyn Error>> {
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

    async fn write_group(&self, group_id: GroupID, group: Group) -> Result<String, Box<dyn Error>> {
        let group_store = GroupStore {
            name: group.name().to_string(),
            athlete_ids: group.athlete_ids(),
            competition_type: group.competition_type(),
            notes: group.notes().clone(),
        };

        self.write_group_store(group_id, group_store).await
    }

    async fn update_group(&self, group_id: GroupID, json_string: &str, only_time_group: bool) -> Result<String, Box<dyn Error>> {
        // TODO: Implement check if key is updated and then update key also
        let mut group = self.get_group(&group_id).await.ok_or(ItemNotFound::new("Key not found", "404"))?;

        let old_athletes = group.athletes().clone();

        let json_value: Value = serde_json::from_str(json_string)?;

        // Update specific fields from JSON to struct
        if let Some(name) = json_value.get("name").and_then(Value::as_str) {
            group.set_name(name.to_string());
        }
        if let Some(athletes) = json_value.get("athletes").and_then(Value::as_array) {
            for athlete_value in athletes {
                match serde_json::from_value(athlete_value.clone()) {
                    Ok(athlete) => { group.add_athlete(athlete); }
                    Err(e) => { return Err(Box::try_from(e).expect("Parsing Error should be convertible")); }
                }
            }
        }
        if let Some(athlete_ids) = json_value.get("athlete_ids").and_then(Value::as_array) {
            for athlete_id_value in athlete_ids {
                match serde_json::from_value(athlete_id_value.clone()) {
                    Ok(athlete_id) => {
                        match self.get_athlete(&athlete_id).await {
                            Some(athlete) => { group.add_athlete(athlete); }
                            None => { return Err(Box::from(format!("Athlete with ID {:?} not found", athlete_id))); }
                        };
                    }
                    Err(e) => { return Err(Box::try_from(e).expect("Parsing Error should be convertible")); }
                }
            }
        }


        let all_athletes = group.athletes().clone();
        let group_name = group.name().to_string();
        self.write_group(group_id, group).await?;
        let num_new_athletes = all_athletes.len() - old_athletes.len();
        if num_new_athletes > 0 {
            match self.get_time_group(&TimeGroupID::new(group_name)).await {
                Some(mut time_group) => {
                    // Time group already available -> Update athletes
                    let new_athletes = all_athletes[old_athletes.len()..].to_vec();
                    let a = &new_athletes
                        .iter()
                        .map(|athlete| time_planner::Athlete::new(athlete.name().to_string(),
                                                                  athlete.surname().to_string(),
                                                                  Some(athlete.age_group())))
                        .collect();
                    time_group.update_athletes(a)?;
                    self.store_time_group(time_group).await
                }
                None => Ok(String::from("")) // Do nothing
            }?;
        }

        Ok(String::from("Group updated"))

    }

    async fn switch_group(&self, group_info: SwitchGroupID, json_string: &str) -> Result<String, Box<dyn Error>> {
        todo!("Implement")
    }


    async fn get_age_group(&self, age_group_id: &AgeGroupID) -> Option<AgeGroup> {
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

    async fn get_achievement(&self, achievement_id: &AchievementID) -> Option<Achievement> {
        let athlete = self.get_athlete(&achievement_id.athlete_id().expect("Athlete ID should be available.")).await?;
        athlete.get_achievement(achievement_id.name.as_str()).cloned()
    }

    async fn delete_achievement(&self, achievement_id: &AchievementID) -> Result<String, Box<dyn Error>> {
        let mut athlete = self.get_athlete(&achievement_id.athlete_id().expect("Athlete ID should be available.")).await.ok_or("Athlete not found")?;
        athlete.delete_achievement(achievement_id.name.as_str());
        self.write_athlete(AthleteID::from_athlete(&athlete), athlete).await?;
        Ok(String::from("Achievement deleted"))
    }

    async fn write_achievement(&self, achievement_id: AchievementID, achievement: Achievement) -> Result<String, Box<dyn Error>> {
        let mut athlete = self.get_athlete(&achievement_id.athlete_id().expect("Athlete ID should be available."))
            .await
            .ok_or(ItemNotFound::new("Athlete not found", "404"))?;
        athlete.add_achievement(achievement)?;
        self.write_athlete(AthleteID::from_athlete(&athlete), athlete).await?;
        Ok(String::from("Achievement added"))
    }

    async fn update_achievement(&self, achievement_id: AchievementID, json_string: &str) -> Result<String, Box<dyn Error>> {
        let mut achievement = self.get_achievement(&achievement_id)
            .await
            .ok_or(ItemNotFound::new("Key not found", "404"))?;
        achievement.update_values(json_string)?;
        let mut athlete = self.get_athlete(&achievement_id.athlete_id().expect("Athlete ID should be available."))
            .await
            .ok_or(ItemNotFound::new("Athlete not found", "404"))?;
        athlete.update_achievement(achievement)?;
        self.write_athlete(AthleteID::from_athlete(&athlete), athlete).await?;
        Ok(String::from("Achievement updated"))
    }

    async fn get_athlete_group(&self, athlete_id: &AthleteID) -> Option<GroupID>{
        !todo!("Implement method to get athlete group")
    }

}

#[async_trait]
impl TimePlanStorage for InMemoryDB {
    async fn get_time_group(&self, group_id: &TimeGroupID) -> Option<TimeGroup> {
        self.time_group_store.lock().expect("Mutex Lox poised").get(group_id).cloned()
    }

    async fn store_time_plan(&self, time_table: Value) -> Result<String, Box<dyn Error>> {
        match time_table {
            Value::Object(time_table_map) => {
                let date_info = match time_table_map.get("Dates") {
                    Some(date_value) => match date_value {
                        Value::Object(date_info_value) => date_info_value
                            .into_iter()
                            .map(|(k, v)| (k.clone(), v.to_string().replace("\"", "")))
                            .collect(),
                        _ => return Err(Box::from("Dates information in invalid format"))
                    },
                    None => return Err(Box::from("Dates information not found"))
                };

                let discipline_info = match time_table_map.get("DisciplineTypes") {
                    Some(discipline_value) => match discipline_value {
                        Value::Object(discipline_info_value) => discipline_info_value
                            .into_iter()
                            .map(|(k, v)| (k.clone(), v.to_string().replace("\"", "")))
                            .collect(),
                        _ => return Err(Box::from("Discipline information in invalid format"))
                    },
                    None => return Err(Box::from("Discipline information not found"))
                };

                match time_table_map.get("Groups") {
                    Some(group_value) => {
                        if let Value::Object(group_map) = group_value {
                            for (group_name, times) in group_map {
                                let mut group_athletes = None;
                                if let Some(group) = self.get_group(&GroupID::new(group_name)).await {
                                    let athletes = group.athletes();
                                    if athletes.len() > 0 {
                                        let time_athletes = athletes.iter().map(|athlete|
                                            time_planner::Athlete::new(
                                                athlete.name().to_string(),
                                                athlete.surname().to_string(),
                                                Some(athlete.age_group()))
                                        ).collect();
                                        group_athletes = Some(time_athletes);
                                    }
                                }

                                let group = TimeGroup::build(group_name, times, &date_info, &discipline_info, group_athletes)?;
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
    async fn store_time_group(&self, group: TimeGroup) -> Result<String, Box<dyn Error>> {
        self.time_group_store.lock().expect("Mutex Lox poised")
            .insert(TimeGroupID::from_time_group(&group), group);
        Ok(String::from("New group stored"))
    }
    async fn get_all_athlete_states(&self) -> Result<HashMap<String, bool>, Box<dyn Error>>{
        !todo!("Implement method to get all athlete states")
    }
}

#[async_trait]
impl AuthenticateStorage for InMemoryDB {
    async fn get_role_and_group(&self, _login_info: LoginInfo) -> Option<Role>{
        None
    }

    async fn store_role(&self, _role: Role) -> Result<String, Box<dyn Error>>{
        Err(Box::from("Not implemented"))
    }
}

#[async_trait]
impl NoteStorage for InMemoryDB {
    async fn get_note(&self, note_id: NoteID) -> Result<Option<String>, Box<dyn Error>> {
        todo!("Implement")
    }

    async fn save_note(&self, note_id: NoteID, note: String) -> Result<String, Box<dyn Error>> {
        todo!("Implement")
    }
}

#[async_trait]
impl TeamStorage for InMemoryDB {
    async fn get_teams(&self) -> Result<Vec<Team>, Box<dyn Error>> {
        todo!("Implement method to get all teams")
    }
    async fn get_team(&self, team_id: &TeamID) ->  Result<Option<Team>, Box<dyn Error>>{
        todo!("Implement method to get all teams")
    }
    async fn save_team(&self, team: &Team) ->  Result<String, Box<dyn Error>>{
        todo!("Implement method to get all teams")
    }
    async fn update_team(&self, team_id: &TeamID, team_update: &String) ->  Result<String, Box<dyn Error>>{
        todo!("Implement method to get all teams")
    }
    async fn delete_team(&self, team_id: &TeamID) ->  Result<(), Box<dyn Error>>{
        todo!("Implement method to get all teams")
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
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "2",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1962.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "3",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1961.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "W",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "4",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1973.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "W",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "5",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1959.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "6",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1974.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "7",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1983.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "8",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1976.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "9",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "10",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "11",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2021.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "12",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
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
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "7",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1983.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "8",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1976.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
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
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "10",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
            Athlete::new(
                "Person",
                "12",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None
            ),
        ];

        athletes
    }

    #[actix_rt::test]
    async fn insert_and_access_athlete() {
        let db = InMemoryDB::_new();
        let new_athlete = Athlete::new("fabian_traxler", "Traxler", None, "M", HashMap::new(), CompetitionType::Decathlon, None, None, None);
        let athlete_key = AthleteID::new("fabian_traxler", "Traxler");

        db.write_athlete(athlete_key.clone(), new_athlete.clone()).await.expect("Write should not fail in this test");

        let accessed_athlete = db.get_athlete(&athlete_key).await;

        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(new_athlete, accessed_athlete);
        } else {
            panic!("Previously stored athlete not found");
        }
    }

    #[actix_rt::test]
    async fn insert_and_access_group() {
        let db = InMemoryDB::_new();
        let athletes = get_athletes();
        for athlete in &athletes {
            match db.write_athlete(AthleteID::from_athlete(&athlete), athlete.clone()).await {
                Ok(_) => {}
                Err(e) => { panic!("Failed to write athlete: {e}"); }
            }
        }

        let new_group = Group::new("Gruppe 1", athletes, CompetitionType::Decathlon);
        let group_key = GroupID::new("Gruppe 1");

        db.write_group(group_key.clone(), new_group.clone()).await.expect("Write should not fail in this test");

        let accessed_group = db.get_group(&group_key).await;

        if let Some(accessed_group) = accessed_group {
            assert!(new_group.athlete_ids().iter().all(|item| accessed_group.athlete_ids().contains(item)));
        } else {
            panic!("Previously stored group not found");
        }
    }

    #[actix_rt::test]
    async fn access_age_group() {
        let db = InMemoryDB::_new();
        let athletes = get_athletes();
        for athlete in &athletes {
            let athlete_key = AthleteID::from_athlete(&athlete);
            db.write_athlete(athlete_key, athlete.clone()).await.expect("Write should not fail in this test");
        }

        assert_eq!(athletes.len(), db.athlete_store.lock().expect("Mutex Lock poised").len());

        for athlete in &athletes {
            let athlete_key = AthleteID::from_athlete(&athlete);
            let accessed_athlete = db.get_athlete(&athlete_key).await;
            if let Some(accessed_athlete) = accessed_athlete {
                assert_eq!(athlete, &accessed_athlete);
            } else {
                panic!("Previously stored athlete not found");
            }
        }

        let age_group = AgeGroup::new("M40", get_m40_athletes());

        let age_group_key = AgeGroupID::new("M40");
        let accessed_age_group = db.get_age_group(&age_group_key).await;

        if let Some(accessed_age_group) = accessed_age_group {
            assert!(age_group.athletes().iter().all(|item| accessed_age_group.athletes().contains(item)));
        } else {
            panic!("Previously stored age group not found");
        }

        let age_group = AgeGroup::new("U6", get_u6_athletes());

        let age_group_key = AgeGroupID::new("U6");
        let accessed_age_group = db.get_age_group(&age_group_key).await;

        if let Some(accessed_age_group) = accessed_age_group {
            assert!(age_group.athletes().iter().all(|item| accessed_age_group.athletes().contains(item)));
        } else {
            panic!("Previously stored age group not found");
        }
    }
}
