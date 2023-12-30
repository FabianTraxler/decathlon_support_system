use serde::{Deserialize, Serialize};
use serde_json::Value;
pub mod athlete;

pub trait DataHandler {
    fn get(key: String) -> Self
    where
        Self: Sized;
    fn put(&self);
    fn update(&self);
    fn to_json(&self) -> String;
}

#[derive(Debug, Deserialize, Serialize)]
pub enum DataObject {
    Athlete(Option<Value>),
    Group(Option<Value>),
}

impl PartialEq for DataObject {
    fn eq(&self, other: &Self) -> bool {
        if std::mem::discriminant(self) != std::mem::discriminant(other) {
            false
        } else {
            match self {
                DataObject::Athlete(value) => {
                    let DataObject::Athlete(other_value) = other else {
                        return false;
                    };
                    value == other_value
                }
                DataObject::Group(value) => {
                    let DataObject::Group(other_value) = other else {
                        return false;
                    };
                    value == other_value
                }
            }
        }
    }
}
impl Eq for DataObject {}

#[derive(Debug)]
pub struct DBEntry {
    pub query: String,
    pub entry: DataObject,
}

impl DBEntry {
    pub fn new(query: String, entry: DataObject) -> Self {
        DBEntry { query, entry }
    }
}

pub trait Storage {
    fn get(&self, key: &mut DBEntry);
    fn save(&mut self, data: &DBEntry);
    fn update(&mut self, data: &DBEntry);
}
