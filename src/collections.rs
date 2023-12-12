pub mod athlete;

pub trait DataHandler {
    fn get(key: String) -> Self
    where
        Self: Sized;
    fn put(&self);
    fn update(&self);
}

pub trait Serializable {
    fn to_json(&self) -> String;
}

pub trait Storage {
    fn get(&self, key: String) -> Box<dyn DataHandler>;
    fn save(&self, data: Box<dyn Serializable>);
    fn update(&self, data: Box<dyn Serializable>);
}
