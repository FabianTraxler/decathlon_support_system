use crate::certificate_generation::{
    AgeGroup, AgeGroupID, AgeGroupSelector, Athlete, AthleteID, Group, GroupID, GroupStore
};
use std::collections::{HashMap, HashSet};
use log::{debug, warn};

use crate::{PersistantStorage};
use crate::database::db_errors::ItemNotFound;


pub struct InMemoryDB {
    athlete_store: HashMap<AthleteID, Athlete>,
    group_store: HashMap<GroupID, GroupStore>,
}

unsafe impl Send for InMemoryDB {}

unsafe impl Sync for InMemoryDB {}

impl InMemoryDB {
    pub fn new() -> Self {
        InMemoryDB {
            athlete_store: HashMap::new(),
            group_store: HashMap::new(),
            // result_store: HashMap::new(),
        }
    }

    fn select_age_group_athletes(&self, age_group_selector: AgeGroupSelector) -> HashSet<Athlete> {
        let mut result: HashSet<Athlete> = HashSet::new();

        for athlete in self.athlete_store.values() {
            if age_group_selector == *athlete {
                result.insert(athlete.clone());
            }
        }

        result
    }
}

impl PersistantStorage for InMemoryDB {
    fn get_athlete(&self, athlete_id: &AthleteID) -> Option<Athlete> {
        self.athlete_store.get(athlete_id).cloned()
    }

    fn write_athlete(&mut self, athlete_id: AthleteID, athlete: Athlete) -> Result<String, Box<dyn std::error::Error>> {
        match self.athlete_store.insert(athlete_id, athlete) {
            Some(_) => Ok(String::from("Old athlete overwritten")),
            None => Ok(String::from("New athlete inserted"))
        }
    }

    fn update_athlete(&mut self, athlete_id: AthleteID, json_string: &str) -> Result<String, Box<dyn std::error::Error>> {
        // TODO: Implement check if key is updated and then update key also
        let mut athlete = self.get_athlete(&athlete_id).ok_or(ItemNotFound::new("Key not found", "404"))?;

        match athlete.update_values(json_string) {
            Ok(_) => {
                self.write_athlete(athlete_id, athlete)?;
                Ok(String::from("Athlete updated"))
            },
            Err(e) => Err(e)
        }
    }

    fn get_group(&self, group_id: &GroupID) -> Option<Group> {
        let group_store = self.group_store.get(group_id).cloned();
        debug!("{:?}", group_id);
        match group_store {
            Some(group_store) => {
                let mut athletes= HashSet::new();
                for athlete_id in group_store.athlete_ids {
                    let athlete = self.get_athlete(&athlete_id);
                    match athlete {
                        Some(athlete) => {athletes.insert(athlete);},
                        None => warn!("Athlete in Group not in athlete store")
                    }
                }
                Some(Group::new(group_store.name.as_str(), athletes))
            },
            None => None
        }
    }

    fn write_group_store(&mut self, group_id: GroupID, group: GroupStore) -> Result<String, Box<dyn std::error::Error>> {
        match self.group_store.insert(group_id, group) {
            Some(_) => Ok(String::from("Old group overwritten")),
            None => Ok(String::from("New group inserted"))
        }
    }

    fn write_group(&mut self, group_id: GroupID, group: Group) -> Result<String, Box<dyn std::error::Error>> {
        let group_store = GroupStore{
            name: group.name().to_string(),
            athlete_ids: group.athlete_ids()
        };
        match self.group_store.insert(group_id, group_store) {
            Some(_) => Ok(String::from("Old group overwritten")),
            None => Ok(String::from("New group inserted"))
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
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;

    use crate::certificate_generation::{AgeGroup, AgeGroupID, Athlete, AthleteID, CompetitionType, Group, GroupID, PersistantStorage};

    use super::InMemoryDB;
    use chrono::{Utc, NaiveDateTime, TimeZone};

    fn get_athletes() -> HashSet<Athlete> {
        let athletes: Vec<Athlete> = vec![
            Athlete::new(
                "Person",
                "1",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1997.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "2",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1962.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "3",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1961.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "W",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "4",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1973.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "W",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "5",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1959.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "6",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1974.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "7",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1983.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "8",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1976.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "9",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "10",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "11",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2021.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "12",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
        ];

        HashSet::from_iter(athletes.iter().cloned())
    }

    fn get_m40_athletes() -> HashSet<Athlete> {
        let athletes: Vec<Athlete> = vec![
            Athlete::new(
                "Person",
                "6",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1974.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "7",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1983.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "8",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("1976.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
        ];

        HashSet::from_iter(athletes.iter().cloned())
    }

    fn get_u6_athletes() -> HashSet<Athlete> {
        let athletes: Vec<Athlete> = vec![
            Athlete::new(
                "Person",
                "9",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "10",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
            Athlete::new(
                "Person",
                "12",
                Some(Utc.from_utc_datetime(&NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap())),
                "M",
                Vec::new(),
                CompetitionType::Decathlon,
            ),
        ];

        HashSet::from_iter(athletes.iter().cloned())
    }

    #[test]
    fn insert_and_access_athlete() {
        let mut db = InMemoryDB::new();
        let new_athlete = Athlete::new("fabian_traxler", "Traxler", None, "M", Vec::new(), CompetitionType::Decathlon);
        let athlete_key = AthleteID::new("fabian_traxler", "Traxler");

        db.write_athlete(athlete_key.clone(), new_athlete.clone());

        let accessed_athlete = db.get_athlete(&athlete_key);

        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(new_athlete, accessed_athlete);
        } else {
            panic!("Previously stored athlete not found");
        }
    }

    #[test]
    fn insert_and_access_group() {
        let mut db = InMemoryDB::new();
        let athletes = get_athletes();

        let new_group = Group::new("Gruppe 1", athletes);
        let group_key = GroupID::new("Gruppe 1");

        db.write_group(group_key.clone(), new_group.clone());

        let accessed_group = db.get_group(&group_key);

        if let Some(accessed_group) = accessed_group {
            assert_eq!(new_group, accessed_group);
        } else {
            panic!("Previously stored group not found");
        }
    }

    #[test]
    fn access_age_group() {
        let mut db = InMemoryDB::new();
        let athletes = get_athletes();
        for athlete in &athletes {
            let athlete_key = AthleteID::from_athlete(&athlete);
            db.write_athlete(athlete_key, athlete.clone());
        }

        assert_eq!(athletes.len(), db.athlete_store.len());

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
            assert_eq!(age_group, accessed_age_group);
        } else {
            panic!("Previously stored age group not found");
        }

        let age_group = AgeGroup::new("U6", get_u6_athletes());

        let age_group_key = AgeGroupID::new("U6");
        let accessed_age_group = db.get_age_group(&age_group_key);

        if let Some(accessed_age_group) = accessed_age_group {
            assert_eq!(age_group, accessed_age_group);
        } else {
            panic!("Previously stored age group not found");
        }
    }
}