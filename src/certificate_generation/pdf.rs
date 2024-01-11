mod pdf_generation;
use pdf_generation::{new_group_result, new_decathlon_certificate, new_pentathlon_certificate, new_triathlon_certificate,
                     new_heptathlon_certificate, PdfDocumentReference};
use std::error::Error;
use std::fs;
use std::fs::File;
use std::io::BufWriter;
use std::path::Path;
use std::pin::Pin;
use std::task::{Context, Poll};
use actix_web::body::{BodySize, MessageBody};
use actix_web::web::Bytes;
use log::info;
use crate::certificate_generation::{CompetitionType, Athlete, Group, AgeGroup};

//const FONT_DIR: &'static str = "assets/fonts";
//const DEFAULT_FONT: &'static str = "times_new_roman";
const COMPETITION_NUMBER: &'static str = "28";
const DATE: &'static str = "28. / 29. September 2024";

pub struct PDFMessage {
    body: Vec<u8>
}
impl MessageBody for PDFMessage {
    type Error = printpdf::Error;
    fn size(&self) -> BodySize {
        BodySize::Sized(self.body.len() as u64)
    }

    fn poll_next(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Option<Result<Bytes, Self::Error>>> {
        let bytes = Bytes::from(self.body.clone());
        Poll::Ready(Some(Ok(bytes)))    }
}

pub struct PDF {
    content: PdfDocumentReference,
}

impl PDF {
    pub fn new_certificate(athlete: &Athlete) -> Self {
        let doc = match athlete.competition_type() {
            CompetitionType::Decathlon => new_decathlon_certificate(athlete),
            CompetitionType::Triathlon => new_triathlon_certificate(athlete),
            CompetitionType::Pentathlon => new_pentathlon_certificate(athlete),
            CompetitionType::Heptathlon => new_heptathlon_certificate(athlete),
        };

        PDF { content: doc }
    }

    pub fn new_group_result(group: &Group) -> Self {
        let doc = new_group_result(group);
        PDF { content: doc }
    }

    pub fn new_age_group_result(age_group: &AgeGroup) -> Self {
        let group = Group::from_age_group(age_group);
        let doc = new_group_result(&group);
        PDF { content: doc }
    }

    pub fn write_pdf(self, path: &str) -> Result<(), Box<dyn Error>> {
        let parent = Path::new(path).parent();
        match parent {
            Some(value) => fs::create_dir_all(value)?,
            None => info!("Parent folder does not exists")
        }
        self.content.save(&mut BufWriter::new(File::create(path)?))?;
        Ok(())
    }

    pub fn to_http_message(self) -> Result<PDFMessage, printpdf::Error> {
        let http_message = PDFMessage {
            body: self.content.save_to_bytes()?
        };
        Ok(http_message)
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use chrono::{NaiveDateTime, TimeZone, Utc};
    use crate::certificate_generation::{Achievement, Athlete, CompetitionType, Group};
    use crate::certificate_generation::achievements::{DistanceResult, TimeResult};
    use super::PDF;

    fn get_athlete() -> Athlete {
        let birthday = NaiveDateTime::parse_from_str("1997.03.22 0:0:0" , "%Y.%m.%d %H:%M:%S").unwrap();
        let mut achievements = HashMap::new();
        let achievement_json = r#"
            {
                "name": "Weitsprung",
                "first_try": 1.20,
                "second_try": 1.30,
                "third_try": 1.20,
                "unit": "m"
            }
        "#;
        achievements.insert("Weitsprung".to_string(), Achievement::Distance(DistanceResult::build(achievement_json).expect("Achievement not loaded")));

        let achievement_json = r#"
            {
                "name": "100 Meter Lauf",
                "final_result": 9.20,
                "unit": "s"
            }
        "#;
        achievements.insert("100 Meter Lauf".to_string(), Achievement::Time(TimeResult::build(achievement_json).expect("Achievement not loaded")));
        Athlete::new(
            "Test",
            "Person",
            Some(Utc.from_utc_datetime(&birthday)),
            "M",
            achievements,
            CompetitionType::Decathlon,
            Some(12)
        )
    }
    #[test]
    fn write_group_results() {
        let mut athletes = Vec::new();
        athletes.push(get_athlete());
        athletes.push(get_athlete());
        athletes.push(get_athlete());
        athletes.push(get_athlete());
        let group = Group::new("Gruppe 1", athletes);
        let pdf = PDF::new_group_result(&group);
        let pdf_write_result = pdf.write_pdf("tests/output/write_group_result.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_group_result(&group);
        match pdf.to_http_message() {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF to bytes: {err}"),
        }

    }

    #[test]
    fn write_decathlon_certificate() {
        let birthday = NaiveDateTime::parse_from_str("1997.03.22 0:0:0" , "%Y.%m.%d %H:%M:%S").unwrap();
        let athlete = Athlete::new(
            "Test",
            "Person",
            Some(Utc.from_utc_datetime(&birthday)),
            "M",
            HashMap::new(),
            CompetitionType::Decathlon,
            Some(2)
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf.write_pdf("tests/output/write_decathlon_certificate.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_certificate(&athlete);
        match pdf.to_http_message() {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF to bytes: {err}"),
        }

    }

    #[test]
    fn write_triathlon_certificate() {
        let birthday = NaiveDateTime::parse_from_str("1997.03.22 0:0:0" , "%Y.%m.%d %H:%M:%S").unwrap();
        let athlete = Athlete::new(
            "Test",
            "Person",
            Some(Utc.from_utc_datetime(&birthday)),
            "M",
            HashMap::new(),
            CompetitionType::Triathlon,
            None
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf.write_pdf("tests/output/write_triathlon_certificate.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_certificate(&athlete);
        match pdf.to_http_message() {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF to bytes: {err}"),
        }

    }

    #[test]
    fn write_pentathlon_certificate() {
        let birthday = NaiveDateTime::parse_from_str("1997.03.22 0:0:0" , "%Y.%m.%d %H:%M:%S").unwrap();
        let athlete = Athlete::new(
            "Test",
            "Person",
            Some(Utc.from_utc_datetime(&birthday)),
            "M",
            HashMap::new(),
            CompetitionType::Pentathlon,
            None
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf.write_pdf("tests/output/write_pentathlon_certificate.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_certificate(&athlete);
        match pdf.to_http_message() {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF to bytes: {err}"),
        }
    }

}
