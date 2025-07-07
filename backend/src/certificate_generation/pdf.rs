mod pdf_generation;
mod group_results;
mod certificates;
mod discipline_protocol;

use std::collections::HashSet;
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
use printpdf::{Mm, PdfDocumentReference, PdfPageIndex};
use lopdf::content::{Content, Operation};
use lopdf::{Document, Object, ObjectId, Stream, Bookmark};
use std::collections::BTreeMap;
use crate::certificate_generation::pdf::pdf_generation::{add_pdf_page, setup_pdf};
use crate::certificate_generation::{CompetitionType, Athlete, Group, AgeGroup};
use crate::certificate_generation::pdf::certificates::{get_certificate, all_group_certificates};
use crate::certificate_generation::pdf::discipline_protocol::get_discipline_protocol;
use crate::certificate_generation::pdf::group_results::new_group_result;
use crate::time_planner::Discipline;

//const FONT_DIR: &'static str = "assets/fonts";
//const DEFAULT_FONT: &'static str = "times_new_roman";
const COMPETITION_NUMBER: &'static str = "29";
const DATE: &'static str = "28. / 29. September 2024";

pub struct PDFMessage {
    body: Vec<u8>,
    sent: bool,
}

impl PDFMessage {
    pub fn new(body: Vec<u8>) -> Self {
        PDFMessage {
            body,
            sent: false,
        }
    }
}

impl MessageBody for PDFMessage {
    type Error = printpdf::Error;
    fn size(&self) -> BodySize {
        BodySize::Sized(self.body.len() as u64)
    }

    fn poll_next(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<Option<Result<Bytes, Self::Error>>> {
        if self.sent {
            Poll::Ready(None)
        } else {
            self.sent = true;
            let bytes = Bytes::from(self.body.clone());
            Poll::Ready(Some(Ok(bytes)))
        }
    }
}

pub struct PDF {
    content: PdfDocumentReference,
}

impl PDF {
    pub fn new_certificate(athlete: &Athlete) -> Self {
        let doc = get_certificate(athlete);

        PDF { content: doc }
    }

    pub fn new_empty_pdf(name: &str, landscape: bool) -> Self {
        let ( doc, _, _) =  setup_pdf(name, landscape);

        PDF { content: doc }
    }

    pub fn new_group_result(group: &Group, disciplines: Option<Vec<String>>) -> Self {
        let doc = new_group_result(group, disciplines);
        PDF { content: doc }
    }

    pub fn new_group_certificates(group: &Group) -> Self {
        let doc = all_group_certificates(group);
        PDF { content: doc }
    }

    pub fn new_discipline_protocol(group: &Group, discipline: &Discipline) -> Self {
        let doc = get_discipline_protocol(group, discipline);
        PDF { content: doc }
    }

    pub fn build_from_age_group_result(age_group: &AgeGroup) -> Result<Self, Box<dyn Error>> {
        let mut athlete_competition_types: HashSet<&CompetitionType> = HashSet::new();
        let mut competition_type = CompetitionType::Decathlon; // decathlon as default
        for athlete in age_group.athletes() {
            athlete_competition_types.insert(athlete.competition_type());
            competition_type = athlete.competition_type().clone();
        }
        if athlete_competition_types.len() != 1 {
            return Err(Box::from("Not all athletes in same competition"));
        }
        let group = Group::from_age_group(age_group, competition_type);
        let doc = new_group_result(&group, None);
        Ok(PDF { content: doc })
    }

    pub fn _write_pdf(self, path: &str) -> Result<(), Box<dyn Error>> {
        let parent = Path::new(path).parent();
        match parent {
            Some(value) => fs::create_dir_all(value)?,
            None => info!("Parent folder does not exists")
        }
        self.content.save(&mut BufWriter::new(File::create(path)?))?;
        Ok(())
    }

    pub fn to_http_message(self) -> Result<PDFMessage, printpdf::Error> {
        let http_message = PDFMessage::new(self.content.save_to_bytes()?);
        Ok(http_message)
    }
    pub fn to_bytes(self) -> Result<Vec<u8>, printpdf::Error> {
        Ok(self.content.save_to_bytes()?)
    }
}

pub fn merge_pdfs(inputs: Vec<PDF>) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let mut documents = Vec::new();
    for input in inputs {
        let content = input.to_bytes()?;
        let doc = Document::load_mem(&content)?;
        documents.push(doc);
    }

    // Define a starting max_id (will be used as start index for object_ids)
    let mut max_id = 1;
    let mut pagenum = 1;
    // Collect all Documents Objects grouped by a map
    let mut documents_pages = BTreeMap::new();
    let mut documents_objects = BTreeMap::new();
    let mut document = Document::with_version("1.5");

    for mut doc in documents {
        let mut first = false;
        doc.renumber_objects_with(max_id);

        max_id = doc.max_id + 1;

        documents_pages.extend(
            doc
                    .get_pages()
                    .into_iter()
                    .map(|(_, object_id)| {
                        if !first {
                            let bookmark = Bookmark::new(String::from(format!("Page_{}", pagenum)), [0.0, 0.0, 1.0], 0, object_id);
                            document.add_bookmark(bookmark, None);
                            first = true;
                            pagenum += 1;
                        }

                        (
                            object_id,
                            doc.get_object(object_id).unwrap().to_owned(),
                        )
                    })
                    .collect::<BTreeMap<ObjectId, Object>>(),
        );
        documents_objects.extend(doc.objects);
    }

    // Catalog and Pages are mandatory
    let mut catalog_object: Option<(ObjectId, Object)> = None;
    let mut pages_object: Option<(ObjectId, Object)> = None;

    // Process all objects except "Page" type
    for (object_id, object) in documents_objects.iter() {
        // We have to ignore "Page" (as are processed later), "Outlines" and "Outline" objects
        // All other objects should be collected and inserted into the main Document
        match object.type_name().unwrap_or("") {
            "Catalog" => {
                // Collect a first "Catalog" object and use it for the future "Pages"
                catalog_object = Some((
                    if let Some((id, _)) = catalog_object {
                        id
                    } else {
                        *object_id
                    },
                    object.clone(),
                ));
            }
            "Pages" => {
                // Collect and update a first "Pages" object and use it for the future "Catalog"
                // We have also to merge all dictionaries of the old and the new "Pages" object
                if let Ok(dictionary) = object.as_dict() {
                    let mut dictionary = dictionary.clone();
                    if let Some((_, ref object)) = pages_object {
                        if let Ok(old_dictionary) = object.as_dict() {
                            dictionary.extend(old_dictionary);
                        }
                    }

                    pages_object = Some((
                        if let Some((id, _)) = pages_object {
                            id
                        } else {
                            *object_id
                        },
                        Object::Dictionary(dictionary),
                    ));
                }
            }
            "Page" => {}     // Ignored, processed later and separately
            "Outlines" => {} // Ignored, not supported yet
            "Outline" => {}  // Ignored, not supported yet
            _ => {
                document.objects.insert(*object_id, object.clone());
            }
        }
    }

    // If no "Pages" found abort
    if pages_object.is_none() {
        println!("Pages root not found.");

        return Err(Box::from("No üages found"));
    }

    // Iter over all "Page" and collect with the parent "Pages" created before
    for (object_id, object) in documents_pages.iter() {
        if let Ok(dictionary) = object.as_dict() {
            let mut dictionary = dictionary.clone();
            dictionary.set("Parent", pages_object.as_ref().unwrap().0);

            document
                    .objects
                    .insert(*object_id, Object::Dictionary(dictionary));
        }
    }

    // If no "Catalog" found abort
    if catalog_object.is_none() {
        println!("Catalog root not found.");

        return Err(Box::from("No catalog found"));
    }

    let catalog_object = catalog_object.unwrap();
    let pages_object = pages_object.unwrap();

    // Build a new "Pages" with updated fields
    if let Ok(dictionary) = pages_object.1.as_dict() {
        let mut dictionary = dictionary.clone();

        // Set new pages count
        dictionary.set("Count", documents_pages.len() as u32);

        // Set new "Kids" list (collected from documents pages) for "Pages"
        dictionary.set(
            "Kids",
            documents_pages
                    .into_iter()
                    .map(|(object_id, _)| Object::Reference(object_id))
                    .collect::<Vec<_>>(),
        );

        document
                .objects
                .insert(pages_object.0, Object::Dictionary(dictionary));
    }

    // Build a new "Catalog" with updated fields
    if let Ok(dictionary) = catalog_object.1.as_dict() {
        let mut dictionary = dictionary.clone();
        dictionary.set("Pages", pages_object.0);
        dictionary.remove(b"Outlines"); // Outlines not supported in merged PDFs

        document
                .objects
                .insert(catalog_object.0, Object::Dictionary(dictionary));
    }

    document.trailer.set("Root", catalog_object.0);

    // Update the max internal ID as wasn't updated before due to direct objects insertion
    document.max_id = document.objects.len() as u32;

    // Reorder all new Document objects
    document.renumber_objects();

     //Set any Bookmarks to the First child if they are not set to a page
    document.adjust_zero_pages();

    //Set all bookmarks to the PDF Object tree then set the Outlines to the Bookmark content map.
    if let Some(n) = document.build_outline() {
        if let Ok(x) = document.get_object_mut(catalog_object.0) {
            if let Object::Dictionary(ref mut dict) = x {
                dict.set("Outlines", Object::Reference(n));
            }
        }
    }

    document.compress();

    let mut buffer = Vec::new();
    document.save_to(&mut buffer)?;
    Ok(buffer)
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use chrono::{NaiveDateTime, TimeZone, Utc};
    use crate::certificate_generation::{Achievement, Athlete, CompetitionType, Group};
    use crate::certificate_generation::achievements::{DistanceResult, TimeResult};
    use super::PDF;

    fn get_athlete() -> Athlete {
        let birthday = NaiveDateTime::parse_from_str("1997.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap();
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
            Some(12),
            Some(123),
            None
        )
    }

    #[test]
    fn write_group_results() {
        let mut athletes = Vec::new();
        athletes.push(get_athlete());
        athletes.push(get_athlete());
        athletes.push(get_athlete());
        athletes.push(get_athlete());
        let group = Group::new("Gruppe 1", athletes, CompetitionType::Decathlon);
        let pdf = PDF::new_group_result(&group, None);
        let pdf_write_result = pdf._write_pdf("tests/output/write_group_result.pdf");
        match pdf_write_result {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF: {err}"),
        }

        let pdf = PDF::new_group_result(&group, None);
        match pdf.to_http_message() {
            Ok(_) => {}
            Err(err) => panic!("Error while writing PDF to bytes: {err}"),
        }
    }

    #[test]
    fn write_decathlon_certificate() {
        let birthday = NaiveDateTime::parse_from_str("1997.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap();
        let athlete = Athlete::new(
            "Test",
            "Person",
            Some(Utc.from_utc_datetime(&birthday)),
            "M",
            HashMap::new(),
            CompetitionType::Decathlon,
            Some(2),
            Some(123),
            None
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf._write_pdf("tests/output/write_decathlon_certificate.pdf");
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
        let birthday = NaiveDateTime::parse_from_str("1997.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap();
        let athlete = Athlete::new(
            "Test",
            "Person",
            Some(Utc.from_utc_datetime(&birthday)),
            "M",
            HashMap::new(),
            CompetitionType::Triathlon,
            None,
            None,
            None
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf._write_pdf("tests/output/write_triathlon_certificate.pdf");
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
        let birthday = NaiveDateTime::parse_from_str("1997.03.22 0:0:0", "%Y.%m.%d %H:%M:%S").unwrap();
        let athlete = Athlete::new(
            "Test",
            "Person",
            Some(Utc.from_utc_datetime(&birthday)),
            "M",
            HashMap::new(),
            CompetitionType::Pentathlon,
            None,
            None,
            None
        );
        let pdf = PDF::new_certificate(&athlete);
        let pdf_write_result = pdf._write_pdf("tests/output/write_pentathlon_certificate.pdf");
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