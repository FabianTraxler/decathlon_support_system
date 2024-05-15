use std::collections::HashMap;
use std::error::Error;
use async_trait::async_trait;
use serde_json::Value;
use crate::certificate_generation::{Achievement, AchievementID, AchievementStorage, AgeGroup, AgeGroupID, AgeGroupSelector, Athlete, AthleteID, Group, GroupID, GroupStore};
use crate::time_planner::{TimeGroup, TimeGroupID, TimePlanStorage};
use aws_sdk_dynamodb::{Client};
use aws_config::{BehaviorVersion};
use aws_sdk_dynamodb::types::{AttributeValue};
use crate::database::db_errors::ItemNotFound;
use crate::{Storage, time_planner};


pub struct DynamoDB {
    client: Client,
}

impl DynamoDB {
    pub fn new() -> Self {
        let config = futures::executor::block_on(aws_config::load_from_env());
        let client = Client::new(&config);
        DynamoDB {
            client
        }
    }
}

#[async_trait]
impl AchievementStorage for DynamoDB {
    async fn get_athlete(&self, athlete_id: &AthleteID) -> Option<Athlete> {
        let athlete_name = athlete_id.full_name();
        let item = self.client
            .get_item()
            .table_name("athlete_store")
            .key(
                "athlete_id",
                AttributeValue::S(athlete_name),
            )
            .send()
            .await;

        match item {
            Ok(item) => {
                let item_map = item.item()?;
                let athlete: Athlete = serde_dynamo::from_item(item_map.clone()).unwrap_or(None)?;
                Some(athlete)
            },
            Err(_) => {
                None
            }
        }
    }

    async fn get_athletes(&self) -> HashMap<String, Vec<Athlete>> {
        let results = self.client
            .scan()
            .table_name("group_store")
            .send()
            .await;

        let group_ids: Vec<GroupID> = match results {
            Ok(items) => {
                if let Some(items) = items.items {
                    items.iter().map(|v| {
                        let group_name = v.get("name")
                            .expect("Name should be available since it is primary key")
                            .as_s()
                            .expect("Name should be convertable to string");
                        GroupID::new(group_name)
                    } ).collect()
                } else {
                    vec![]
                }
            },
            Err(_) => vec![]
        };

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
        let athlete_name = athlete_id.full_name();
        let item = serde_dynamo::to_item(athlete)?;
        self.client
            .put_item()
            .table_name("athlete_store")
            .set_item(Some(item))
            .item(
                "athlete_id",
                AttributeValue::S(athlete_name),
            )
            .send()
            .await?;

        Ok(String::from("New athlete inserted or old athlete overwritten"))
    }

    async fn update_athlete(&self, athlete_id: AthleteID, json_string: &str) -> Result<String, Box<dyn Error>> {

        if let None = self.get_athlete(&athlete_id).await {
            return Err(Box::from("Athlete not found. Insert new athlete"));
        }

        let athlete_name = athlete_id.full_name();
        let mut update_call = self.client
            .update_item()
            .table_name("athlete_store")
            .key(
                "athlete_id",
                AttributeValue::S(athlete_name)
            );

        let json_value: Value = serde_json::from_str(json_string)?;

        let mut update_expressions: Vec<String> = vec![];

        if let Some(_) = json_value.get("achievements").and_then(Value::as_i64) {
            return Err("Achievements not updated. Please use /achievement routes to update achievements")?;
        }
        if let Some(timestamp) = json_value.get("birth_date").and_then(Value::as_i64) {
            update_expressions.push(String::from(" birth_date = :b"));
            update_call = update_call
                .expression_attribute_values(
                    String::from(":b"),
                    AttributeValue::N(timestamp.to_string())
                );
        }

        // Update specific fields from JSON to struct
        if let Some(name) = json_value.get("name") {
            // TODO: Check behavior if name if updated and does not match athlete_id anymore
            let name_str = Value::as_str(name)
                .ok_or("Invalid format for gender. Expected string")?;
            update_expressions.push(String::from(" name = :n"));

            update_call = update_call
                .expression_attribute_values(
                    String::from(":n"),
                    AttributeValue::S(name_str.to_string())
                );
        }
        if let Some(surname) = json_value.get("surname") {
            // TODO: Check behavior if name if updated and does not match athlete_id anymore
            let surname_str = Value::as_str(surname)
                .ok_or("Invalid format for gender. Expected string")?;
            update_expressions.push(String::from(" surname = :s"));

            update_call = update_call
                .expression_attribute_values(
                    String::from(":s"),
                    AttributeValue::S(surname_str.to_string())
                );
        }
        if let Some(gender) = json_value.get("gender") {
            let gender_str = Value::as_str(gender)
                .ok_or("Invalid format for gender. Expected string")?;
            update_expressions.push(String::from(" gender=:g"));

            update_call = update_call
                .expression_attribute_values(
                    String::from(":g"),
                    AttributeValue::S(gender_str.to_string())
                );
        }
        if let Some(competition_type) = json_value.get("competition_type") {
            let competition_type_str = Value::as_str(competition_type)
                .ok_or("Invalid format for competition_type.")?;
            update_expressions.push(String::from(" competition_type=:c"));

            update_call = update_call
                .expression_attribute_values(
                    String::from(":c"),
                    AttributeValue::S(competition_type_str.to_string())
                );
        }
        if let Some(starting_number) = json_value.get("starting_number") {
            update_expressions.push(String::from(" starting_number = :st"));

            match Value::as_i64(starting_number) {
                Some(val) => {
                    update_call = update_call
                        .expression_attribute_values(
                            String::from(":st"),
                            AttributeValue::N(val.to_string())
                        );
                },
                None => {
                    update_call = update_call
                        .expression_attribute_values(
                            String::from(":st"),
                            AttributeValue::Null(true)
                        );
                }
            }
        }

        if update_expressions.len() > 0 {
            update_call = update_call
                .update_expression(format!("SET {}", update_expressions.join(",")));
        }

        update_call
            .send()
            .await?;

        Ok(String::from("Athlete updated"))
    }

    async fn get_group(&self, group_id: &GroupID) -> Option<Group> {
        let athlete_name = group_id.name.clone()?;
        let item = self.client
            .get_item()
            .table_name("group_store")
            .key(
                "name",
                AttributeValue::S(athlete_name),
            )
            .send();

        let all_athletes = self.client
            .scan()
            .table_name("athlete_store")
            .send();


        match item.await {
            Ok(item) => {
                let item_map = item.item()?;
                let group_store: GroupStore = serde_dynamo::from_item(item_map.clone()).unwrap_or(None)?;
                let mut athletes = Vec::new();
                for athlete_data in all_athletes.await.ok()?.items() {
                    let athlete_name = athlete_data.get(&"name".to_string())?.as_s().ok()?;
                    let athlete_surname = athlete_data.get(&"surname".to_string())?.as_s().ok()?;
                    let athlete_id = AthleteID::new(athlete_name, athlete_surname);
                    if group_store.athlete_ids.contains(&athlete_id) {
                        let athlete: Athlete = serde_dynamo::from_item(athlete_data.clone()).ok()?;
                        athletes.push(athlete);
                    }
                }

                Some(Group::new(group_store.name.as_str(), athletes, group_store.competition_type))
            },
            Err(_) => {
                None
            }
        }
    }

    async fn write_group_store(&self, _: GroupID, group_store: GroupStore) -> Result<String, Box<dyn Error>> {
        // Check if all athletes exists
        for athlete_id in &group_store.athlete_ids {
            if let None = self.get_athlete(athlete_id).await {
                return Err(Box::from(format!("Athlete with ID {:?} not found", athlete_id)));
            }
        }
        let item = serde_dynamo::to_item(group_store)?;
        self.client
            .put_item()
            .table_name("group_store")
            .set_item(Some(item))
            .send()
            .await?;

        Ok(String::from("Group inserted or available"))
    }

    async fn write_group(&self, group_id: GroupID, group: Group) -> Result<String, Box<dyn Error>> {
        let group_store = GroupStore {
            name: group.name().to_string(),
            athlete_ids: group.athlete_ids(),
            competition_type: group.competition_type()
        };

        self.write_group_store(group_id, group_store).await
    }

    async fn update_group(&self, group_id: GroupID, json_string: &str) -> Result<String, Box<dyn Error>> {
        let mut group = self.get_group(&group_id).await.ok_or(ItemNotFound::new("Key not found", "404"))?;

        let old_athletes = group.athletes().clone();
        let group_name = match group_id.name.clone(){
            Some(name) => Ok(name),
            None => Err("Group name not suuplied")
        }?;

        let mut update_call = self.client
            .update_item()
            .table_name("group_store")
            .key(
                "name",
                AttributeValue::S(group_name)
            );

        let json_value: Value = serde_json::from_str(json_string)?;

        let mut update_expressions: Vec<String> = vec![];

        // Update specific fields from JSON to struct
        if let Some(name) = json_value.get("name").and_then(Value::as_str) {
            update_expressions.push(String::from(" name = :n"));

            update_call = update_call
                .expression_attribute_values(
                    String::from(":n"),
                    AttributeValue::S(name.to_string())
                );
        }
        if let Some(athletes) = json_value.get("athletes").and_then(Value::as_array) {
            for athlete_value in athletes {
                match serde_json::from_value(athlete_value.clone()) {
                    Ok(athlete) => {group.add_athlete(athlete); }
                    Err(e) => { return Err(Box::try_from(e).expect("Parsing Error should be convertible")); }
                }
            }
            update_expressions.push(String::from(" athletes = :a"));

            let mut athlete_values = vec![];
            for athlete in group.athletes(){
                let mut athlete_map = HashMap::new();
                athlete_map.insert("name".to_string(), AttributeValue::S(athlete.name().to_string()));
                athlete_map.insert("surname".to_string(), AttributeValue::S(athlete.surname().to_string()));
                athlete_values.push(AttributeValue::M(athlete_map));
            }

            update_call = update_call
                .expression_attribute_values(
                    String::from(":a"),
                    AttributeValue::L(athlete_values)
                );
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
            update_expressions.push(String::from(" athletes = :a"));

            let mut athlete_values = vec![];
            for athlete in group.athletes(){
                let mut athlete_map = HashMap::new();
                athlete_map.insert("name".to_string(), AttributeValue::S(athlete.name().to_string()));
                athlete_map.insert("surname".to_string(), AttributeValue::S(athlete.surname().to_string()));
                athlete_values.push(AttributeValue::M(athlete_map));
            }

            update_call = update_call
                .expression_attribute_values(
                    String::from(":a"),
                    AttributeValue::L(athlete_values)
                );
        }

        if update_expressions.len() > 0 {
            update_call = update_call
                .update_expression(format!("SET {}", update_expressions.join(",")));
        }

        update_call
            .send()
            .await?;

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

    async fn get_age_group(&self, age_group_id: &AgeGroupID) -> Option<AgeGroup> {
        if let Some(age_identifier) = &age_group_id.age_identifier {
            if let Ok(age_group_selector) = AgeGroupSelector::build(age_identifier) {
                let mut athletes: Vec<Athlete> = Vec::new();

                let all_athletes: Vec<Option<Athlete>> = match self.client
                    .scan()
                    .table_name("athlete_store")
                    .send()
                    .await{
                    Ok(items) => {
                        if let Some(items) = items.items {
                            Some(items.iter().map(|v| {
                                let athlete: Option<Athlete> = serde_dynamo::from_item(v.clone()).unwrap_or(None);
                                athlete
                            }).collect())
                        } else {
                            None
                        }
                    },
                    Err(e) => {
                        println!("{:?}", e);
                        None
                    }
                }?;

                for athlete_option in all_athletes {
                    if let Some(athlete) = athlete_option {
                        if age_group_selector == athlete {
                            athletes.push(athlete.clone());
                        }
                    }

                }
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
        let athlete_name = achievement_id.clone().athlete_name.ok_or("Athlete name not given")?;

        let mut update_call = self.client
            .update_item()
            .table_name("athlete_store")
            .key(
                "athlete_id",
                AttributeValue::S(athlete_name)
            );

        update_call = update_call
            .update_expression(String::from("REMOVE achievements.#name"))
            .expression_attribute_names(
                String::from("#name"),
                achievement_id.name.clone()
            );

        update_call
            .send()
            .await?;

        Ok(String::from("Achievement deleted"))
    }

    async fn write_achievement(&self, achievement_id: AchievementID, achievement: Achievement) -> Result<String, Box<dyn Error>> {
        let athlete_name = achievement_id.athlete_name.ok_or("Athlete name not given")?;
        let mut update_call = self.client
            .update_item()
            .table_name("athlete_store")
            .key(
                "athlete_id",
                AttributeValue::S(athlete_name)
            );

        update_call = update_call
            .update_expression(String::from("SET achievements.#achievement_name = :a"))
            .expression_attribute_names(
                String::from("#achievement_name"),
                achievement.name()
            )
            .expression_attribute_values(
                String::from(":a"),
                AttributeValue::M(serde_dynamo::to_item(achievement)
                    .or(Err("Achievement could not be converted to dynamoDB json"))?)
            );

        update_call
            .send()
            .await?;

        Ok(String::from("Achievement added"))
    }

    async fn update_achievement(&self, achievement_id: AchievementID, json_string: &str) -> Result<String, Box<dyn Error>> {
        let mut achievement = self.get_achievement(&achievement_id)
            .await
            .ok_or(ItemNotFound::new("Key not found", "404"))?;
        achievement.update_values(json_string)?;

        self.write_achievement(achievement_id, achievement).await?;
        Ok(String::from("Achievement updated"))
    }
}

#[async_trait]
impl TimePlanStorage for DynamoDB {
    async fn get_time_group(&self, group_id: &TimeGroupID) -> Option<TimeGroup> {
        let group_name = group_id.name.clone()?;
        let item = self.client
            .get_item()
            .table_name("time_group_store")
            .key(
                "name",
                AttributeValue::S(group_name),
            )
            .send()
            .await;

        match item {
            Ok(item) => {
                let item_map = item.item()?;
                let group: TimeGroup = serde_dynamo::from_item(item_map.clone()).unwrap_or(None)?;
                Some(group)
            },
            Err(_) => {
                None
            }
        }
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
                                self.store_time_group(group).await?;
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
        let item = serde_dynamo::to_item(group)?;
        self.client
            .put_item()
            .table_name("time_group_store")
            .set_item(Some(item))
            .send()
            .await?;

        Ok(String::from("New group stored"))
    }
}


impl Storage for DynamoDB {
    fn serialize(&self) {
    }

    fn load(&self) {
    }
}
#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use crate::certificate_generation::{AgeGroup, AgeGroupID, Athlete, AthleteID, CompetitionType, Group, GroupID, AchievementStorage, Achievement, AchievementID};

    use super::DynamoDB;
    use chrono::{Utc, NaiveDateTime, TimeZone};
    use crate::certificate_generation::Achievement::{Distance, Height, Time};
    use crate::certificate_generation::achievements::{DistanceResult, HeightResult, TimeResult};

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
                None
            ),
        ];

        athletes
    }

    fn get_achievements() -> Vec<Achievement>{
        let mut achievements = vec![];
        let achievement_json = r#"
            {
                "name": "Weitsprung",
                "first_try": 1.20,
                "second_try": 1.30,
                "third_try": 1.20,
                "unit": "m"
            }
        "#;
        achievements.push(Distance(DistanceResult::build(achievement_json).expect("Achievement not loaded")));
        let achievement_json = r#"
            {
                "name": "Hochsprung",
                "start_height": 80,
                "height_increase": 4,
                "tries": "///-///-///-O//-XO/-O//-O//-O//-XXX",
                "unit": "cm"
            }
        "#;
        achievements.push(Height(HeightResult::build(achievement_json).expect("Achievement not loaded")));

        let achievement_json = r#"
            {
                "name": "100 Meter Lauf",
                "final_result": 9.20,
                "unit": "s"
            }
        "#;
        achievements.push(Time(TimeResult::build(achievement_json).expect("Achievement not loaded")));

        achievements
    }

    #[actix_rt::test]
    async fn insert_and_access_athlete() {
        let db = DynamoDB::new().await;
        let new_athlete = Athlete::new("Insert",
                                       "Test",
                                       None,
                                       "M", HashMap::new(),
                                       CompetitionType::Decathlon,
                                       None,
                                       None);
        let athlete_key = AthleteID::new("Insert", "Test");

        db.write_athlete(athlete_key.clone(),
                         new_athlete.clone()).await.expect("Write should not fail in this test");

        let accessed_athlete = db.get_athlete(&athlete_key).await;

        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(new_athlete, accessed_athlete);
        } else {
            panic!("Previously stored athlete not found");
        }
    }

    #[actix_rt::test]
    async fn update_athlete() {
        let db = DynamoDB::new().await;
        let mut new_athlete = Athlete::new("Fabian",
                                       "Traxler",
                                       None,
                                       "M", HashMap::new(),
                                       CompetitionType::Decathlon,
                                       None,
                                       None);
        let athlete_key = AthleteID::new("Fabian", "Traxler");

        db.write_athlete(athlete_key.clone(),
                         new_athlete.clone())
            .await
            .expect("Write should not fail in this test");

        let update_string = r#"{"gender": "W", "birth_date": 12345, "starting_number": 12}"#;
        match db.update_athlete(athlete_key.clone(), update_string).await {
            Ok(_) => {},
            Err(e) => panic!("{:?}", e)
        }

        let accessed_athlete = db.get_athlete(&athlete_key).await;

        match new_athlete.update_values(update_string) {
            Ok(_) => {},
            Err(e) => panic!("{:?}", e)
        }
        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(new_athlete, accessed_athlete);
        } else {
            panic!("Previously stored athlete not found");
        }
    }


    #[actix_rt::test]
    async fn insert_and_access_group() {
        let db = DynamoDB::new().await;
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
        let db = DynamoDB::new().await;
        let athletes = get_athletes();
        for athlete in &athletes {
            let athlete_key = AthleteID::from_athlete(&athlete);
            db.write_athlete(athlete_key, athlete.clone()).await.expect("Write should not fail in this test");
        }

        //assert_eq!(athletes.len(), db.athlete_store.lock().expect("Mutex Lock poised").len());

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

    #[actix_rt::test]
    async fn add_delete_and_update_achievements() {
        let db = DynamoDB::new().await;
        let mut new_athlete = Athlete::new("Achievement",
                                       "Test",
                                       None,
                                       "M", HashMap::new(),
                                       CompetitionType::Decathlon,
                                       None,
                                       None);
        let athlete_key = AthleteID::new("Achievement", "Test");

        db.write_athlete(athlete_key.clone(),
                         new_athlete.clone()).await.expect("Write should not fail in this test");

        for mut achievement in get_achievements(){
            achievement.compute_final_result();
            let _ = new_athlete.add_achievement(achievement.clone());
            let achievement_id = AchievementID::build(AthleteID::from_athlete(&new_athlete),
                                                      &achievement);
            if let Err(e) = db.write_achievement(achievement_id, achievement).await {
                panic!("{:?}", e);
            }
        }

        let accessed_athlete = db.get_athlete(&athlete_key).await;

        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(accessed_athlete, new_athlete);
        } else {
            panic!("Previously stored age group not found");
        }

        for mut achievement in &get_achievements()[..1]{
            let _ = new_athlete.delete_achievement(&achievement.name());
            let achievement_id = AchievementID::build(AthleteID::from_athlete(&new_athlete),
                                                      &achievement);
            if let Err(e) = db.delete_achievement(&achievement_id).await {
                panic!("{:?}", e);
            }
        }

        let accessed_athlete = db.get_athlete(&athlete_key).await;

        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(accessed_athlete, new_athlete);
        } else {
            panic!("Previously stored age group not found");
        }

        let achievement_update = r#"
            {
                "tries": "XXO-XXX"
            }
        "#;
        for mut achievement in &mut get_achievements()[1..2]{
            let _ = achievement.update_values(achievement_update);
            let _ = new_athlete.update_achievement(achievement.clone());
            let achievement_id = AchievementID::build(AthleteID::from_athlete(&new_athlete),
                                                      &achievement);
            if let Err(e) = db.update_achievement(achievement_id, achievement_update).await {
                panic!("{:?}", e);
            }
        }

        let accessed_athlete = db.get_athlete(&athlete_key).await;

        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(accessed_athlete, new_athlete);
        } else {
            panic!("Previously stored age group not found");
        }
    }

}