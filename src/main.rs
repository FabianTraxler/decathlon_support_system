use std::error::Error;

use decathlon_support_system;

fn main() -> Result<(), Box<dyn Error>> {
    decathlon_support_system::run()?;
    Ok(())
}
