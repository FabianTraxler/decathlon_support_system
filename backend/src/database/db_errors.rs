#[derive(Debug)]
pub struct ItemNotFound {
    message: String,
    code: String,
}

impl ItemNotFound {
    pub fn new(message: &str, code: &str) -> Self {
        ItemNotFound {
            message: message.to_string(),
            code: code.to_string(),
        }
    }
}

// Implement the std::fmt::Display trait for CustomError
impl std::fmt::Display for ItemNotFound {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Item not found: {} (Code: {})",
            self.message, self.code
        )
    }
}

// Implement the std::error::Error trait for CustomError
impl std::error::Error for ItemNotFound {}
