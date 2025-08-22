use crate::authenticate::{AuthenticateStorage, LoginInfo, Role};
use crate::certificate_generation::{Achievement, AchievementID, AchievementStorage, AgeGroup, AgeGroupID,
    AgeGroupSelector, Athlete, AthleteID, Group, GroupID, GroupStore, SwitchGroupID
};
use crate::database::db_errors::ItemNotFound;
use crate::notes::{NoteID, NoteStorage};
use crate::teams::{Team, TeamID, TeamStorage};
use crate::time_planner::{TimeGroup, TimeGroupID, TimePlanStorage};
use crate::{time_planner, Storage};
use async_trait::async_trait;
use aws_sdk_dynamodb::types::{AttributeValue, KeysAndAttributes};
use aws_sdk_dynamodb::Client;
use serde_json::Value;
use std::collections::HashMap;
use std::error::Error;
use log::error;

pub struct DynamoDB {
    client: Client,
}

impl DynamoDB {
    pub fn new() -> Self {
        let config = futures::executor::block_on(aws_config::load_from_env());
        let client = Client::new(&config);
        DynamoDB { client }
    }

    async fn overwrite_achievement(
        &self,
        achievement_id: AchievementID,
        achievement: Achievement,
    ) -> Result<String, Box<dyn Error>> {
        let athlete_name = achievement_id
            .athlete_name
            .ok_or("Athlete name not given")?;

        let mut update_call = self
            .client
            .update_item()
            .table_name(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()))
            .key("athlete_id", AttributeValue::S(athlete_name));

        update_call = update_call
            .update_expression(String::from("SET achievements.#achievement_name = :a"))
            .expression_attribute_names(String::from("#achievement_name"), achievement.name())
            .expression_attribute_values(
                String::from(":a"),
                AttributeValue::M(
                    serde_dynamo::to_item(achievement)
                        .or(Err("Achievement could not be converted to dynamoDB json"))?,
                ),
            );

        update_call.send().await?;

        Ok(String::from("Achievement added"))
    }
}

#[async_trait]
impl AchievementStorage for DynamoDB {
    async fn get_athlete(&self, athlete_id: &AthleteID) -> Option<Athlete> {
        let athlete_name = athlete_id.full_name();
        let item = self
            .client
            .get_item()
            .table_name(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()))
            .key("athlete_id", AttributeValue::S(athlete_name))
            .send()
            .await;

        match item {
            Ok(item) => {
                let item_map: &HashMap<String, AttributeValue> = item.item()?;
                let athlete: Athlete = serde_dynamo::from_item(item_map.clone()).unwrap_or(None)?;
                Some(athlete)
            }
            Err(_) => None,
        }
    }

    async fn get_athletes(&self) -> HashMap<String, Vec<Athlete>> {
        let results = self.client.scan().table_name(std::env::var("DB_NAME_GROUP").unwrap_or("group_store".to_string())).send().await;

        let group_ids: Vec<GroupID> = match results {
            Ok(items) => {
                if let Some(items) = items.items {
                    items
                        .iter()
                        .map(|v| {
                            let group_name = v
                                .get("name")
                                .expect("Name should be available since it is primary key")
                                .as_s()
                                .expect("Name should be convertable to string");
                            GroupID::new(group_name)
                        })
                        .collect()
                } else {
                    vec![]
                }
            }
            Err(_) => vec![],
        };

        let mut groups = HashMap::new();
        for group_id in group_ids {
            match self.get_group(&group_id).await {
                Some(group) => {
                    groups.insert(group.name().to_string(), group.athletes().clone());
                }
                None => {}
            }
        }
        groups
    }

    async fn write_athlete(
        &self,
        athlete_id: AthleteID,
        athlete: Athlete,
    ) -> Result<String, Box<dyn Error>> {
        let athlete_name = athlete_id.full_name();
        let item = serde_dynamo::to_item(athlete)?;
        self.client
            .put_item()
            .table_name(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()))
            .set_item(Some(item))
            .item("athlete_id", AttributeValue::S(athlete_name))
            .send()
            .await?;

        Ok(String::from(
            "New athlete inserted or old athlete overwritten",
        ))
    }

    async fn update_athlete(
        &self,
        athlete_id: AthleteID,
        json_string: &str,
    ) -> Result<String, Box<dyn Error>> {
        if let None = self.get_athlete(&athlete_id).await {
            return Err(Box::from("Athlete not found. Insert new athlete"));
        }

        let athlete_name = athlete_id.full_name();
        let mut update_call = self
            .client
            .update_item()
            .table_name(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()))
            .key("athlete_id", AttributeValue::S(athlete_name));

        let json_value: Value = serde_json::from_str(json_string)?;

        let mut update_expressions: Vec<String> = vec![];

        if let Some(_) = json_value.get("achievements").and_then(Value::as_i64) {
            return Err(
                "Achievements not updated. Please use /achievement routes to update achievements",
            )?;
        }
        if let Some(timestamp) = json_value.get("birth_date").and_then(Value::as_i64) {
            update_expressions.push(String::from(" birth_date = :b"));
            update_call = update_call.expression_attribute_values(
                String::from(":b"),
                AttributeValue::N(timestamp.to_string()),
            );
        }

        // Update specific fields from JSON to struct
        if let Some(name) = json_value.get("name") {
            // TODO: Check behavior if name if updated and does not match athlete_id anymore
            let name_str =
                Value::as_str(name).ok_or("Invalid format for gender. Expected string")?;
            update_expressions.push(String::from(" name = :n"));

            update_call = update_call.expression_attribute_values(
                String::from(":n"),
                AttributeValue::S(name_str.to_string()),
            );
        }
        if let Some(surname) = json_value.get("surname") {
            // TODO: Check behavior if name if updated and does not match athlete_id anymore
            let surname_str =
                Value::as_str(surname).ok_or("Invalid format for gender. Expected string")?;
            update_expressions.push(String::from(" surname = :s"));

            update_call = update_call.expression_attribute_values(
                String::from(":s"),
                AttributeValue::S(surname_str.to_string()),
            );
        }
        if let Some(gender) = json_value.get("gender") {
            let gender_str =
                Value::as_str(gender).ok_or("Invalid format for gender. Expected string")?;
            update_expressions.push(String::from(" gender=:g"));

            update_call = update_call.expression_attribute_values(
                String::from(":g"),
                AttributeValue::S(gender_str.to_string()),
            );
        }
        if let Some(competition_type) = json_value.get("competition_type") {
            let competition_type_str =
                Value::as_str(competition_type).ok_or("Invalid format for competition_type.")?;
            update_expressions.push(String::from(" competition_type=:c"));

            update_call = update_call.expression_attribute_values(
                String::from(":c"),
                AttributeValue::S(competition_type_str.to_string()),
            );
        }
        if let Some(starting_number) = json_value.get("starting_number") {
            update_expressions.push(String::from(" starting_number = :st"));

            match Value::as_i64(starting_number) {
                Some(val) => {
                    update_call = update_call.expression_attribute_values(
                        String::from(":st"),
                        AttributeValue::N(val.to_string()),
                    );
                }
                None => {
                    update_call = update_call.expression_attribute_values(
                        String::from(":st"),
                        AttributeValue::Null(true),
                    );
                }
            }
        }
        if let Some(starting_number) = json_value.get("deregistered") {
            update_expressions.push(String::from(" deregistered = :de"));

            match Value::as_bool(starting_number) {
                Some(val) => {
                    update_call = update_call.expression_attribute_values(
                        String::from(":de"),
                        AttributeValue::Bool(val),
                    );
                }
                None => {
                    update_call = update_call.expression_attribute_values(
                        String::from(":st"),
                        AttributeValue::Null(true),
                    );
                }
            }
        }
        if update_expressions.len() > 0 {
            update_call =
                update_call.update_expression(format!("SET {}", update_expressions.join(",")));
        }

        update_call.send().await?;

        Ok(String::from("Athlete updated"))
    }

    async fn delete_athlete(&self, athlete_id: AthleteID) -> Result<String, Box<dyn Error>> {
        let athlete = self.get_athlete(&athlete_id).await.ok_or("Athlete not found")?;
        // Delete Athlete from athlete_store
        // self.client
        //     .delete_item()
        //     .table_name(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()))
        //     .key("athlete_id", AttributeValue::S(athlete_id.full_name().into()))
        //     .send().await?;

        // Delete athlete from group_store
        // First get all groups
        let mut athlete_map: HashMap<String, AttributeValue> = HashMap::new();
        athlete_map.insert("name".to_string(), AttributeValue::S(athlete_id.name()));
        athlete_map.insert("surname".to_string(), AttributeValue::S(athlete_id.surname()));

        let groups = match self.client
            .scan()
            .table_name(std::env::var("DB_NAME_GROUP").unwrap_or("group_store".to_string()))
            .send()
            .await{
                Ok(groups) => {
                    match groups.items{
                        Some(groups) => Ok(groups),
                        None => Err(format!("No groups found"))
                    }
                },
                Err(e) => Err(format!("Error loading groups: {}", e))
            }?;

        // Iterate over groups until athlete is found
        for group_map in groups {
            let mut group: GroupStore = serde_dynamo::from_item(group_map.clone())?;
            let group_name = group.name.clone();
            // delete athlete from group 
            if group.athlete_ids.remove(&athlete_id){
                // store updated group to db
                let group_id = GroupID::from_group_store(&group);
                self.write_group_store(group_id, group).await?;


                // delete athlete from time_group_store in athlete_orders of all disciplines and defaults
                match self.get_time_group(&TimeGroupID::new(group_name)).await {
                    Some(mut time_group) => {
                        // Time group already available -> Update athletes
                        let time_athlete = time_planner::Athlete::new(
                            athlete_id.name().to_string(),
                            athlete_id.surname().to_string(),
                            Some(athlete.age_group())
                        );
                        time_group.delete_athlete(time_athlete)?;
                        self.store_time_group(time_group).await
                    }
                    None => Ok(String::from("Time Group not found")), // Do nothing
                }?;

                return Ok("Athelte deleted".to_string())
            }
        }

        Err(Box::from("Athlete not found in any group".to_string()))


    }

    async fn get_group(&self, group_id: &GroupID) -> Option<Group> {
        let group_name = group_id.name.clone()?;
        let item = self
            .client
            .get_item()
            .table_name(std::env::var("DB_NAME_GROUP").unwrap_or("group_store".to_string()))
            .key("name", AttributeValue::S(group_name))
            .send();
        
        match item.await {
            Ok(item) => {
                let item_map = item.item()?;
                let group_store: GroupStore =
                    serde_dynamo::from_item(item_map.clone()).unwrap_or(None)?;
                
                if group_store.athlete_ids.len() == 0 {
                    return Some(Group::new(
                        group_store.name.as_str(),
                        Vec::new(),
                        group_store.competition_type,
                    ))
                }

                let mut group_athletes_keys = KeysAndAttributes::builder();
                for athlete_id in &group_store.athlete_ids{
                    group_athletes_keys = group_athletes_keys.keys(HashMap::from([(
                        "athlete_id".to_string(),
                        AttributeValue::S(
                            athlete_id.full_name().clone()
                        ),
                    )]));
                };

                let athlete_result = self.client
                .batch_get_item()
                .request_items(
                    std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()),
                    group_athletes_keys.build().ok()?,
                )
                .send().await.ok()?;

                let athlete_items = athlete_result.responses()?.get(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()).as_str())?; 
                let mut athletes = Vec::new();

                for athlete_data in athlete_items{
                    let athlete: serde_dynamo::Result<Athlete> =
                             serde_dynamo::from_item(athlete_data.clone());
                    match athlete.ok() {
                        Some(athlete) => athletes.push(athlete),
                        None => {
                            error!("Error parsing athlete {:?}", athlete_data);
                        }
                    }
                }

                Some(Group::new(
                    group_store.name.as_str(),
                    athletes,
                    group_store.competition_type,
                ))
            }
            Err(e) => {
                error!("Group not found {}", e);
                None
            }
        }
    }

    async fn write_group_store(
        &self,
        _: GroupID,
        group_store: GroupStore,
    ) -> Result<String, Box<dyn Error>> {
        // Check if all athletes exists
        for athlete_id in &group_store.athlete_ids {
            if let None = self.get_athlete(athlete_id).await {
                return Err(Box::from(format!(
                    "Athlete with ID {:?} not found",
                    athlete_id
                )));
            }
        }
        let item = serde_dynamo::to_item(group_store)?;
        self.client
            .put_item()
            .table_name(std::env::var("DB_NAME_GROUP").unwrap_or("group_store".to_string()))
            .set_item(Some(item))
            .send()
            .await?;

        Ok(String::from("Group inserted or available"))
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

    async fn update_group(
        &self,
        group_id: GroupID,
        json_string: &str,
    ) -> Result<String, Box<dyn Error>> {
        let mut group = self
            .get_group(&group_id)
            .await
            .ok_or(ItemNotFound::new("Key not found", "404"))?;

        let group_name = match group_id.name.clone() {
            Some(name) => Ok(name),
            None => Err("Group name not suuplied"),
        }?;

        let mut update_call = self
            .client
            .update_item()
            .table_name(std::env::var("DB_NAME_GROUP").unwrap_or("group_store".to_string()))
            .key("name", AttributeValue::S(group_name));

        let json_value: Value = serde_json::from_str(json_string)?;

        let mut update_expressions: Vec<String> = vec![];

        let mut new_athletes: Vec<Athlete> = vec![];
        let mut deleted_athletes: Vec<Athlete> = vec![];

        // Update specific fields from JSON to struct
        if let Some(name) = json_value.get("name").and_then(Value::as_str) {
            update_expressions.push(String::from(" name = :n"));

            update_call = update_call.expression_attribute_values(
                String::from(":n"),
                AttributeValue::S(name.to_string()),
            );
        }
        if let Some(athletes) = json_value.get("athletes").and_then(Value::as_array) {
            for athlete_value in athletes {
                match serde_json::from_value::<Athlete>(athlete_value.clone()) {
                    Ok(athlete) => {
                        group.add_athlete(athlete.clone());
                        new_athletes.push(athlete);
                    }
                    Err(e) => {
                        return Err(Box::try_from(e).expect("Parsing Error should be convertible"));
                    }
                }
            }

        }
        if let Some(athlete_ids) = json_value.get("athlete_ids").and_then(Value::as_array) {
            for athlete_id_value in athlete_ids {
                match serde_json::from_value(athlete_id_value.clone()) {
                    Ok(athlete_id) => {
                        match self.get_athlete(&athlete_id).await {
                            Some(athlete) => {
                                group.add_athlete(athlete.clone());
                                new_athletes.push(athlete);
                            }
                            None => {
                                return Err(Box::from(format!(
                                    "Athlete with ID {:?} not found",
                                    athlete_id
                                )));
                            }
                        };
                    }
                    Err(e) => {
                        return Err(Box::try_from(e).expect("Parsing Error should be convertible"));
                    }
                }
            }
        }
        if let Some(athlete_ids) = json_value.get("delete_athlete_ids").and_then(Value::as_array){
            for athlete_id_value in athlete_ids {
                match serde_json::from_value(athlete_id_value.clone()) {
                    Ok(athlete_id) => {
                        match self.get_athlete(&athlete_id).await {
                            Some(athlete) => {
                                group.delete_athlete(athlete.clone());
                                deleted_athletes.push(athlete);
                            }
                            None => {
                                return Err(Box::from(format!(
                                    "Athlete with ID {:?} not found",
                                    athlete_id
                                )));
                            }
                        };
                    }
                    Err(e) => {
                        return Err(Box::try_from(e).expect("Parsing Error should be convertible"));
                    }
                }
            }
        }
        
        if deleted_athletes.len() > 0 || new_athletes.len() > 0 {
            update_expressions.push(String::from(" athletes = :a"));

            let mut athlete_values = vec![];
            for athlete in group.athletes() {
                let mut athlete_map = HashMap::new();
                athlete_map.insert(
                    "name".to_string(),
                    AttributeValue::S(athlete.name().to_string()),
                );
                athlete_map.insert(
                    "surname".to_string(),
                    AttributeValue::S(athlete.surname().to_string()),
                );
                athlete_values.push(AttributeValue::M(athlete_map));
            }

            update_call = update_call
                .expression_attribute_values(String::from(":a"), AttributeValue::L(athlete_values));
        }

        if update_expressions.len() > 0 {
            update_call =
                update_call.update_expression(format!("SET {}", update_expressions.join(",")));
        }

        update_call.send().await?;

        let group_name = group.name().to_string();
        self.write_group(group_id, group).await?;
        if new_athletes.len() > 0 {
            match self.get_time_group(&TimeGroupID::new(group_name.clone())).await {
                Some(mut time_group) => {
                    // Time group already available -> Update athletes
                    let time_group_athletes = &new_athletes
                        .iter()
                        .map(|athlete| {
                            time_planner::Athlete::new(
                                athlete.name().to_string(),
                                athlete.surname().to_string(),
                                Some(athlete.age_group()),
                            )
                        })
                        .collect();
                    time_group.update_athletes(time_group_athletes)?;
                    self.store_time_group(time_group).await
                }
                None => Ok(String::from("")), // Do nothing
            }?;
        }
        if deleted_athletes.len() > 0{
            match self.get_time_group(&TimeGroupID::new(group_name)).await {
                Some(mut time_group) => {
                    // Time group already available -> Update athletes
                    for athlete in deleted_athletes{
                        let time_group_athlete = time_planner::Athlete::new(
                            athlete.name().to_string(),
                            athlete.surname().to_string(),
                            Some(athlete.age_group()),
                        );
                        time_group.delete_athlete(time_group_athlete)?;
                    }

                    self.store_time_group(time_group).await
                }
                None => Ok(String::from("")), // Do nothing
            }?;
        }

        Ok(String::from("Group updated"))
    }

    async fn switch_group(
        &self,
        group_info: SwitchGroupID,
        json_string: &str,
    ) -> Result<String, Box<dyn Error>> {

        let from_group_id = GroupID::new(group_info.from.ok_or("From group not given")?.as_str());
        let to_group_id = GroupID::new(group_info.to.ok_or("To group not given")?.as_str());

        self.update_group(to_group_id, json_string).await?;

        let delete_json_string = json_string.replace("athlete_ids", "delete_athlete_ids");
        self.update_group(from_group_id, &delete_json_string).await?;

        Ok(String::from("Group updated"))
    }

    async fn get_age_group(&self, age_group_id: &AgeGroupID) -> Option<AgeGroup> {
        if let Some(age_identifier) = &age_group_id.age_identifier {
            if let Ok(age_group_selector) = AgeGroupSelector::build(age_identifier) {
                let mut athletes: Vec<Athlete> = Vec::new();

                let all_athletes: Vec<Option<Athlete>> =
                    match self.client.scan().table_name(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string())).send().await {
                        Ok(items) => {
                            if let Some(items) = items.items {
                                Some(
                                    items
                                        .iter()
                                        .map(|v| {
                                            let athlete: Option<Athlete> =
                                                serde_dynamo::from_item(v.clone()).unwrap_or(None);
                                            athlete
                                        })
                                        .collect(),
                                )
                            } else {
                                None
                            }
                        }
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
        let athlete = self
            .get_athlete(
                &achievement_id
                    .athlete_id()
                    .expect("Athlete ID should be available."),
            )
            .await?;
        athlete
            .get_achievement(achievement_id.name.as_str())
            .cloned()
    }

    async fn delete_achievement(
        &self,
        achievement_id: &AchievementID,
    ) -> Result<String, Box<dyn Error>> {
        let athlete_name = achievement_id
            .clone()
            .athlete_name
            .ok_or("Athlete name not given")?;

        let mut update_call = self
            .client
            .update_item()
            .table_name(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()))
            .key("athlete_id", AttributeValue::S(athlete_name));

        update_call = update_call
            .update_expression(String::from("REMOVE achievements.#name"))
            .expression_attribute_names(String::from("#name"), achievement_id.name.clone());

        update_call.send().await?;

        Ok(String::from("Achievement deleted"))
    }

    async fn write_achievement(
        &self,
        achievement_id: AchievementID,
        achievement: Achievement,
    ) -> Result<String, Box<dyn Error>> {
        if let Some(_) = self.get_achievement(&achievement_id).await {
            return Err(Box::from("Achievement already exists"));
        }

        self.overwrite_achievement(achievement_id, achievement)
            .await
    }

    async fn update_achievement(
        &self,
        achievement_id: AchievementID,
        json_string: &str,
    ) -> Result<String, Box<dyn Error>> {
        let mut achievement = self
            .get_achievement(&achievement_id)
            .await
            .ok_or(ItemNotFound::new("Key not found", "404"))?;
        achievement.update_values(json_string)?;

        self.overwrite_achievement(achievement_id, achievement)
            .await?;
        Ok(String::from("Achievement updated"))
    }
}

#[async_trait]
impl TimePlanStorage for DynamoDB {
    async fn get_time_group(&self, group_id: &TimeGroupID) -> Option<TimeGroup> {
        let group_name = group_id.name.clone()?;
        let item = self
            .client
            .get_item()
            .table_name(std::env::var("DB_NAME_TIMEGROUP").unwrap_or("time_group_store".to_string()))
            .key("name", AttributeValue::S(group_name))
            .send()
            .await;

        match item {
            Ok(item) => {
                let item_map = item.item()?;
                let group: TimeGroup = serde_dynamo::from_item(item_map.clone()).unwrap_or(None)?;
                Some(group)
            }
            Err(_) => None,
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
                        _ => return Err(Box::from("Dates information in invalid format")),
                    },
                    None => return Err(Box::from("Dates information not found")),
                };

                let discipline_info = match time_table_map.get("DisciplineTypes") {
                    Some(discipline_value) => match discipline_value {
                        Value::Object(discipline_info_value) => discipline_info_value
                            .into_iter()
                            .map(|(k, v)| (k.clone(), v.to_string().replace("\"", "")))
                            .collect(),
                        _ => return Err(Box::from("Discipline information in invalid format")),
                    },
                    None => return Err(Box::from("Discipline information not found")),
                };

                let group_pwds: HashMap<String, Value> = match time_table_map.get("Passwords") {
                    Some(pwds) => match pwds {
                        Value::Object(group_passwords) => group_passwords
                            .into_iter()
                            .map(|(k, v)| (k.clone(), v.clone()))
                            .collect(),
                        _ => return Err(Box::from("Group passwords in invalid format")),
                    },
                    None => return Err(Box::from("Group passwords not found")),
                };

                for (pwd, role) in group_pwds {
                    let role_info: HashMap<String, String> = match role {
                        Value::Object(group_passwords) => group_passwords
                            .into_iter()
                            .map(|(k, v)| (k.clone(), v.to_string().replace("\"", "").clone()))
                            .collect(),
                        _ => return Err(Box::from("Group passwords in invalid format")),
                    };
                    let role_name = match role_info.get("role") {
                        Some(role_name) => role_name,
                        None => return Err(Box::from("Group role not given")),
                    };
                    let role_group = match role_info.get("group") {
                        Some(role_group) => role_group,
                        None => return Err(Box::from("Group name not given")),
                    };

                    let login_info = Role::build(role_name.clone(), role_group.clone(), pwd);

                    self.store_role(login_info).await?;
                }

                match time_table_map.get("Groups") {
                    Some(group_value) => {
                        if let Value::Object(group_map) = group_value {
                            for (group_name, times) in group_map {
                                let mut group_athletes = None;
                                if let Some(group) = self.get_group(&GroupID::new(group_name)).await
                                {
                                    let athletes = group.athletes();
                                    if athletes.len() > 0 {
                                        let time_athletes = athletes
                                            .iter()
                                            .map(|athlete| {
                                                time_planner::Athlete::new(
                                                    athlete.name().to_string(),
                                                    athlete.surname().to_string(),
                                                    Some(athlete.age_group()),
                                                )
                                            })
                                            .collect();
                                        group_athletes = Some(time_athletes);
                                    }
                                }

                                let group = TimeGroup::build(
                                    group_name,
                                    times,
                                    &date_info,
                                    &discipline_info,
                                    group_athletes,
                                )?;
                                self.store_time_group(group).await?;
                            }
                        } else {
                            return Err(Box::from("Group information in invalid format"));
                        }
                    }
                    None => return Err(Box::from("Group information not found")),
                }

                Ok(String::from("Time table stored"))
            }
            _ => Err(Box::from("Invalid format")),
        }
    }

    async fn store_time_group(&self, group: TimeGroup) -> Result<String, Box<dyn Error>> {
        let item = serde_dynamo::to_item(group)?;
        self.client
            .put_item()
            .table_name(std::env::var("DB_NAME_TIMEGROUP").unwrap_or("time_group_store".to_string()))
            .set_item(Some(item))
            .send()
            .await?;

        Ok(String::from("New group stored"))
    }
    
    async fn get_all_athlete_states(&self) -> Result<HashMap<String, bool>, Box<dyn Error>>{
        let items = self
            .client
            .scan()
            .table_name(std::env::var("DB_NAME_ATHLETE").unwrap_or("athlete_store".to_string()))
            .send()
            .await;
        let item_map = items?.items().to_vec();
        let athletes: Vec<Athlete> = serde_dynamo::from_items(item_map)?;

        let mut athlete_states: HashMap<String, bool> = HashMap::new();
        for athlete in athletes {
            athlete_states.insert(athlete.athlete_id(), athlete.is_active());
        }

        return Ok(athlete_states);
    }
}


#[async_trait]
impl NoteStorage for DynamoDB {
    async fn get_note(&self, note_id: NoteID) -> Result<Option<String>, Box<dyn Error>> {
        let group_name = note_id.group_name.clone();
        let discipline = note_id.discipline.clone();
        let item = self
            .client
            .get_item()
            .table_name(std::env::var("DB_NAME_GROUP").unwrap_or("group_store".to_string()))
            .key("name", AttributeValue::S(group_name))
            .projection_expression("notes")
            .send()
            .await?;

        let item_map = item.item().ok_or(ItemNotFound::new("Key not found", "404"))?;
        // The field is "note" -> which is a map, and discipline is the key inside it
        match item_map.get("notes") {
            Some(note_map) => {
                match note_map {
                    AttributeValue::M(note_map) => {
                        match note_map.get(&discipline) {
                            Some(AttributeValue::S(note)) => return Ok(Some(note.clone())),
                            _ => return Ok(None),
                        }
                    }
                    _ => return Ok(None)
                }
            }
            None => return Ok(None)
        }
    }

    async fn save_note(&self, note_id: NoteID, note: String) -> Result<String, Box<dyn Error>> {
        let mut update_call = self
            .client
            .update_item()
            .table_name(std::env::var("DB_NAME_GROUP").unwrap_or("group_store".to_string()))
            .key("name", AttributeValue::S(note_id.group_name.clone()));

        update_call = update_call.expression_attribute_values(
                String::from(":n"),
                AttributeValue::S(note)
        );
        update_call = update_call.expression_attribute_names(
                String::from("#noteName"),
                note_id.discipline
        );
        update_call = update_call.update_expression("SET notes.#noteName = :n");

        update_call.send().await?;
        Ok(String::from("Note added"))
    }
}


#[async_trait]
impl AuthenticateStorage for DynamoDB {
    async fn get_role_and_group(&self, login_info: LoginInfo) -> Option<Role> {
        let item = self
            .client
            .get_item()
            .table_name(std::env::var("DB_NAME_AUTHENTICATION").unwrap_or("authentication".to_string()))
            .key("password", AttributeValue::S(login_info.pwd))
            .send()
            .await;

        match item {
            Ok(item) => {
                let item_map = item.item()?;
                let role: Role = serde_dynamo::from_item(item_map.clone()).unwrap_or(None)?;
                Some(role)
            }
            Err(_) => None,
        }
    }

    async fn store_role(&self, role: Role) -> Result<String, Box<dyn Error>> {
        let item = serde_dynamo::to_item(role)?;
        self.client
            .put_item()
            .table_name(std::env::var("DB_NAME_AUTHENTICATION").unwrap_or("authentication".to_string()))
            .set_item(Some(item))
            .send()
            .await?;
        Ok(String::from("Role inserted or available"))
    }
}

#[async_trait]
impl TeamStorage for DynamoDB {
    async fn get_team(&self, team_id: &TeamID) -> Result<Option<Team>, Box<dyn Error>> {
        let team_name = team_id.name.clone();
        let item = self
            .client
            .get_item()
            .table_name(std::env::var("DB_NAME_TEAM").unwrap_or("team_store".to_string()))
            .key("team_name", AttributeValue::S(team_name))
            .send()
            .await?;
        let item_map = item.item().ok_or(ItemNotFound::new("Key not found", "404"))?;
        let team: Team = serde_dynamo::from_item(item_map.clone())?;
        Ok(Some(team))
    }

    
    async fn get_teams(&self) -> Result<Vec<Team>, Box<dyn Error>> {
        let items = self
            .client
            .scan()
            .table_name(std::env::var("DB_NAME_TEAM").unwrap_or("team_store".to_string()))
            .send()
            .await;
        let item_map = items?.items().to_vec();
        let teams: Vec<Team> = serde_dynamo::from_items(item_map)?;

        return Ok(teams);
    }

    async fn save_team(&self, team: &Team) -> Result<String, Box<dyn Error>> {
        if let Some(team_name) = team.team_name.clone() {
            let item = serde_dynamo::to_item(team)?;
            self.client
                .put_item()
                .table_name(std::env::var("DB_NAME_TEAM").unwrap_or("team_store".to_string()))
                .set_item(Some(item))
                .item("team_name", AttributeValue::S(team_name))
                .send()
                .await?;

            Ok(String::from("New team stored"))
        } else {
            Err(Box::from("Team name not given"))
        }

    }

    async fn update_team(&self, team_id: &TeamID, team_update: &String) ->  Result<String, Box<dyn Error>>{
        let mut team = self
            .get_team(team_id)
            .await?
            .ok_or(ItemNotFound::new("Team not found", "404"))?;

        let team_name_changed = team.update_values(team_update)?;
        let team_name = if team_name_changed {
            team.team_name.clone().ok_or("Team name not given")?
        } else {
            team_id.name.clone()
        };

        let item = serde_dynamo::to_item(&team)?;
        self.client
            .put_item()
            .table_name(std::env::var("DB_NAME_TEAM").unwrap_or("team_store".to_string()))
            .set_item(Some(item))
            .item("team_name", AttributeValue::S(team_name))
            .send()
            .await?;

        if team_name_changed{
            // Delete old team entry
            self.delete_team(team_id).await?;
        }

        Ok(String::from("Team updated"))
    }

    async fn delete_team(&self, team_id: &TeamID) -> Result<(), Box<dyn Error>> {
        self.client
            .delete_item()
            .table_name(std::env::var("DB_NAME_TEAM").unwrap_or("team_store".to_string()))
            .key("team_name", AttributeValue::S(team_id.name.clone()))
            .send()
            .await?;
        Ok(())
    }

}

impl Storage for DynamoDB {
    fn serialize(&self) {}

    fn load(&self) {}
}
#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use crate::certificate_generation::{
        Achievement, AchievementID, AchievementStorage, AgeGroup, AgeGroupID, Athlete, AthleteID,
        CompetitionType, Group, GroupID,
    };

    use super::DynamoDB;
    use crate::certificate_generation::achievements::{DistanceResult, HeightResult, TimeResult};
    use crate::certificate_generation::Achievement::{Distance, Height, Time};
    use chrono::{NaiveDateTime, TimeZone, Utc};

    fn get_athletes() -> Vec<Athlete> {
        let athletes: Vec<Athlete> = vec![
            Athlete::new(
                "Person",
                "1",
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1997.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1962.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1961.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1973.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1959.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1974.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1983.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1976.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("2021.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1974.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1983.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("1976.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
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
                Some(
                    Utc.from_utc_datetime(
                        &NaiveDateTime::parse_from_str("2019.03.22 0:0:0", "%Y.%m.%d %H:%M:%S")
                            .unwrap(),
                    ),
                ),
                "M",
                HashMap::new(),
                CompetitionType::Decathlon,
                None,
                None,
                None,
            ),
        ];

        athletes
    }

    fn get_achievements() -> Vec<Achievement> {
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
        achievements.push(Distance(
            DistanceResult::build(achievement_json).expect("Achievement not loaded"),
        ));
        let achievement_json = r#"
            {
                "name": "Hochsprung",
                "start_height": 80,
                "height_increase": 4,
                "tries": "///-///-///-O//-XO/-O//-O//-O//-XXX",
                "unit": "cm"
            }
        "#;
        achievements.push(Height(
            HeightResult::build(achievement_json).expect("Achievement not loaded"),
        ));

        let achievement_json = r#"
            {
                "name": "100 Meter Lauf",
                "final_result": 9.20,
                "unit": "s"
            }
        "#;
        achievements.push(Time(
            TimeResult::build(achievement_json).expect("Achievement not loaded"),
        ));

        achievements
    }

    #[actix_rt::test]
    async fn insert_and_access_athlete() {
        let db = DynamoDB::new();
        let new_athlete = Athlete::new(
            "Insert",
            "Test",
            None,
            "M",
            HashMap::new(),
            CompetitionType::Decathlon,
            None,
            None,
            None
        );
        let athlete_key = AthleteID::new("Insert", "Test");

        db.write_athlete(athlete_key.clone(), new_athlete.clone())
            .await
            .expect("Write should not fail in this test");

        let accessed_athlete = db.get_athlete(&athlete_key).await;

        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(new_athlete, accessed_athlete);
        } else {
            panic!("Previously stored athlete not found");
        }
    }

    #[actix_rt::test]
    async fn update_athlete() {
        let db = DynamoDB::new();
        let mut new_athlete = Athlete::new(
            "Fabian",
            "Traxler",
            None,
            "M",
            HashMap::new(),
            CompetitionType::Decathlon,
            None,
            None,
            None
        );
        let athlete_key = AthleteID::new("Fabian", "Traxler");

        db.write_athlete(athlete_key.clone(), new_athlete.clone())
            .await
            .expect("Write should not fail in this test");

        let update_string = r#"{"gender": "W", "birth_date": 12345, "starting_number": 12}"#;
        match db.update_athlete(athlete_key.clone(), update_string).await {
            Ok(_) => {}
            Err(e) => panic!("{:?}", e),
        }

        let accessed_athlete = db.get_athlete(&athlete_key).await;

        match new_athlete.update_values(update_string) {
            Ok(_) => {}
            Err(e) => panic!("{:?}", e),
        }
        if let Some(accessed_athlete) = accessed_athlete {
            assert_eq!(new_athlete, accessed_athlete);
        } else {
            panic!("Previously stored athlete not found");
        }
    }

    #[actix_rt::test]
    async fn insert_and_access_group() {
        let db = DynamoDB::new();
        let athletes = get_athletes();
        for athlete in &athletes {
            match db
                .write_athlete(AthleteID::from_athlete(&athlete), athlete.clone())
                .await
            {
                Ok(_) => {}
                Err(e) => {
                    panic!("Failed to write athlete: {e}");
                }
            }
        }

        let new_group = Group::new("Gruppe 1", athletes, CompetitionType::Decathlon);
        let group_key = GroupID::new("Gruppe 1");

        db.write_group(group_key.clone(), new_group.clone())
            .await
            .expect("Write should not fail in this test");

        let accessed_group = db.get_group(&group_key).await;

        if let Some(accessed_group) = accessed_group {
            assert!(new_group
                .athlete_ids()
                .iter()
                .all(|item| accessed_group.athlete_ids().contains(item)));
        } else {
            panic!("Previously stored group not found");
        }
    }

    #[actix_rt::test]
    async fn access_age_group() {
        let db = DynamoDB::new();
        let athletes = get_athletes();
        for athlete in &athletes {
            let athlete_key = AthleteID::from_athlete(&athlete);
            db.write_athlete(athlete_key, athlete.clone())
                .await
                .expect("Write should not fail in this test");
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
            assert!(age_group
                .athletes()
                .iter()
                .all(|item| accessed_age_group.athletes().contains(item)));
        } else {
            panic!("Previously stored age group not found");
        }

        let age_group = AgeGroup::new("U6", get_u6_athletes());

        let age_group_key = AgeGroupID::new("U6");
        let accessed_age_group = db.get_age_group(&age_group_key).await;

        if let Some(accessed_age_group) = accessed_age_group {
            assert!(age_group
                .athletes()
                .iter()
                .all(|item| accessed_age_group.athletes().contains(item)));
        } else {
            panic!("Previously stored age group not found");
        }
    }

    #[actix_rt::test]
    async fn add_delete_and_update_achievements() {
        let db = DynamoDB::new();
        let mut new_athlete = Athlete::new(
            "Achievement",
            "Test",
            None,
            "M",
            HashMap::new(),
            CompetitionType::Decathlon,
            None,
            None,
            None
        );
        let athlete_key = AthleteID::new("Achievement", "Test");

        db.write_athlete(athlete_key.clone(), new_athlete.clone())
            .await
            .expect("Write should not fail in this test");

        for mut achievement in get_achievements() {
            achievement.compute_final_result();
            let _ = new_athlete.add_achievement(achievement.clone());
            let achievement_id =
                AchievementID::build(AthleteID::from_athlete(&new_athlete), &achievement);
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

        for achievement in &get_achievements()[..1] {
            let _ = new_athlete.delete_achievement(&achievement.name());
            let achievement_id =
                AchievementID::build(AthleteID::from_athlete(&new_athlete), &achievement);
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
        for achievement in &mut get_achievements()[1..2] {
            let _ = achievement.update_values(achievement_update);
            let _ = new_athlete.update_achievement(achievement.clone());
            let achievement_id =
                AchievementID::build(AthleteID::from_athlete(&new_athlete), &achievement);
            if let Err(e) = db
                .update_achievement(achievement_id, achievement_update)
                .await
            {
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
