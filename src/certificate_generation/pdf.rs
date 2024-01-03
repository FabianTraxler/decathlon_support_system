mod pdf_generation;
use pdf_generation::{new_group_result, new_decathlon_certificate, new_pentathlon_certificate, new_triathlon_certificate, PdfDocumentReference};
use std::error::Error;
use std::fs;
use std::fs::File;
use std::io::BufWriter;
use std::path::Path;
use log::info;
use crate::certificate_generation::{CompetitionType, Athlete, Group};

//const FONT_DIR: &'static str = "assets/fonts";
//const DEFAULT_FONT: &'static str = "times_new_roman";

struct PDF {
    content: PdfDocumentReference,
}

impl PDF {
    pub fn new_certificate(athlete: &Athlete) -> Self {
        let doc = match athlete.competition_type() {
            CompetitionType::Decathlon => new_decathlon_certificate(athlete),
            CompetitionType::Triathlon => new_triathlon_certificate(athlete),
            CompetitionType::Pentathlon => new_pentathlon_certificate(athlete),
        };

        PDF { content: doc }
    }

    pub fn new_group_result(group: &Group) -> Self {
        let doc = new_group_result(group);
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

    pub fn to_binary(self) -> Result<Vec<u8>, printpdf::Error> {
        self.content.save_to_bytes()
    }
}

#[cfg(test)]
mod tests {
    use std::collections::HashSet;
    use chrono::{NaiveDateTime, TimeZone, Utc};
    use crate::certificate_generation::{Athlete, CompetitionType, Group};
    use super::PDF;

    #[test]
    fn write_group_resutt() {
        let group = Group::new("Gruppe 1", HashSet::new());
        let pdf = PDF::new_group_result(&group);
        let pdf_write_result = pdf.write_pdf("tests/output/write_group_result.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_group_result(&group);
        match pdf.to_binary() {
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
            Vec::new(),
            CompetitionType::Decathlon
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf.write_pdf("tests/output/write_decathlon_certificate.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_certificate(&athlete);
        match pdf.to_binary() {
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
            Vec::new(),
            CompetitionType::Triathlon
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf.write_pdf("tests/output/write_triathlon_certificate.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_certificate(&athlete);
        match pdf.to_binary() {
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
            Vec::new(),
            CompetitionType::Pentathlon
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf.write_pdf("tests/output/write_pentathlon_certificate.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_certificate(&athlete);
        match pdf.to_binary() {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF to bytes: {err}"),
        }
    }

}