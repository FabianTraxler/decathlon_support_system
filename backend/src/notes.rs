use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::error::Error;


#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub struct NoteID {
    pub discipline: String,
    pub group_name: String,
}

#[async_trait]
pub trait NoteStorage {
    async fn get_note(&self, note_id: NoteID) -> Result<Option<String>, Box<dyn Error>>;
    async fn save_note(&self, note_id: NoteID, note: String) ->  Result<String, Box<dyn Error>>;
}
