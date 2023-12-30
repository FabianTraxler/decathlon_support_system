mod achievements;
mod age_group_utils;
mod athletes;
mod groups;
mod pdf;

pub use age_group_utils::AgeGroupSelector;
pub use athletes::{Athlete, AthleteID};
pub use groups::{AgeGroup, AgeGroupID, Group, GroupID};

pub trait PersistantStorage {
    fn get_athlete(&self, athlete_id: &AthleteID) -> Option<Athlete>;
    fn write_athlete(&mut self, athlete_id: AthleteID, athlete: Athlete);
    fn get_group(&self, group_id: &GroupID) -> Option<Group>;
    fn write_group(&mut self, group_id: GroupID, group: Group);
    fn get_age_group(&self, age_group_id: &AgeGroupID) -> Option<AgeGroup>;
}

#[derive(Clone, Debug, Eq, PartialEq, Hash)]
pub enum CompetitionType {
    Decathlon,
    Triathlon,
    Pentathlon
}
