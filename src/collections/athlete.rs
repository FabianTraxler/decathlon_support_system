pub struct Athlete;

impl super::Serializable for Athlete {
    fn to_json(&self) -> String {
        String::from("{id: athlete}")
    }
}
