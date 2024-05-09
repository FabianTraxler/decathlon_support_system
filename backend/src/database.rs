mod db_errors;
mod in_memory_db;
mod dynamo_db;

pub use dynamo_db::DynamoDB as Store;