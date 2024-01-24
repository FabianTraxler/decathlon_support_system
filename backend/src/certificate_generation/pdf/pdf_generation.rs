use std::cmp::Reverse;
use std::collections::HashMap;
pub use printpdf::PdfDocumentReference;
use printpdf::{Mm, PdfDocument, PdfLayerIndex, PdfPageIndex, image_crate, Image, ImageTransform, PdfLayerReference, IndirectFontRef, TextRenderingMode, Line, Point};
use printpdf::BuiltinFont::{HelveticaBold, TimesRoman};
use std::fs::File;
use std::io::BufReader;
use chrono::Datelike;
use crate::certificate_generation::{competition_order, CompetitionType};

use crate::certificate_generation::athletes::Athlete;
use crate::certificate_generation::groups::Group;
use super::{COMPETITION_NUMBER, DATE};

fn setup_pdf(
    name: &str,
    landscape: bool,
) -> (PdfDocumentReference, PdfPageIndex, PdfLayerIndex) {
    let width;
    let height;
    if landscape {
        width = 297.0;
        height = 210.0;
    } else {
        width = 210.0;
        height = 297.0;
    }
    PdfDocument::new(name, Mm(width), Mm(height), "Layer 1")
}

fn add_logo(layer: PdfLayerReference, landscape: bool) {
    let image_file = File::open("assets/img/Logo_STW.jpg")
        .expect("Logo should be available");
    let mut image_file = BufReader::new(image_file);

    let image = Image::try_from(image_crate::codecs::jpeg::JpegDecoder::new(&mut image_file)
        .expect("Image should be png"))
        .expect("Image should be convertible to Image class");

    let mut image_transform = ImageTransform::default();
    if landscape {
        image_transform.translate_x = Some(Mm(267.0));
        image_transform.translate_y = Some(Mm(180.0));
        image_transform.scale_x = Some(0.08);
        image_transform.scale_y = Some(0.08);
    } else {
        image_transform.translate_x = Some(Mm(160.0));
        image_transform.translate_y = Some(Mm(247.0));
        image_transform.scale_x = Some(0.13);
        image_transform.scale_y = Some(0.13);
    }


    //image_transform.dpi = Some(1000.);

    image.add_to_layer(layer, image_transform);
}

fn add_name(pdf_layer: &PdfLayerReference, font: &IndirectFontRef, athlete: &Athlete) {
    // Define font metrics
    let font_size = 36.0;
    let avg_font_width = 5.5; // Manually measured
    let name = athlete.full_name();
    let x_pos = 105.0 - name.len() as f32 / 2.0 * avg_font_width;

    pdf_layer.begin_text_section();
    pdf_layer.set_font(font, font_size);
    pdf_layer.set_text_cursor(Mm(x_pos), Mm(170.0));
    pdf_layer.write_text(name, font);
    pdf_layer.add_line_break();
    pdf_layer.end_text_section();
}

fn add_achievements(pdf_layer: &PdfLayerReference,font: &IndirectFontRef, athlete: &Athlete) {
    // Define font metrics
    let font_size = 12.0;
    let line_height = font_size * 0.5;
    let name_align = 30.0;
    let achievement_align = 100.0;
    let point_align = 160.0;
    let start_height = 130.0;

    pdf_layer.begin_text_section();
    pdf_layer.set_font(font, font_size);

    for (i, discipline_name) in competition_order(athlete.competition_type()).iter().enumerate() {
        let current_height = start_height - line_height * i as f32;
        pdf_layer.use_text(discipline_name.to_string(), font_size, Mm(name_align), Mm(current_height), font);
        match athlete.get_achievement(discipline_name) {
            Some(achievement) => {
                pdf_layer.use_text(format!("{} {}", achievement.final_result(), achievement.unit()), font_size, Mm(achievement_align), Mm(current_height), font);

                pdf_layer.use_text(achievement.points(athlete).to_string(), font_size, Mm(point_align), Mm(current_height), font);
            },
            None => {
                pdf_layer.use_text("DNF", font_size, Mm(achievement_align), Mm(current_height), font);

                pdf_layer.use_text("0.0", font_size, Mm(point_align), Mm(current_height), font);
            }
        }
    }

    pdf_layer.end_text_section();
}

pub fn new_triathlon_certificate(athlete: &Athlete) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Urkunde {}", athlete.full_name()).as_str(),
                                       false);
    let current_layer = pdf.get_page(page).get_layer(layer);

    let font = pdf.add_builtin_font(TimesRoman)
        .expect("Builtin Font should be available");

    // Write Heading
    current_layer.begin_text_section();
    current_layer.set_font(&font, 42.0);
    current_layer.set_text_cursor(Mm(80.0), Mm(267.0));
    current_layer.write_text("Urkunde", &font);
    current_layer.add_line_break();
    current_layer.end_text_section();

    add_logo(pdf.get_page(page).get_layer(layer), false);
    add_name(&current_layer, &font, &athlete);

    pdf
}

pub fn new_pentathlon_certificate(athlete: &Athlete) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Urkunde {}", athlete.full_name()).as_str(),
                                       false);
    let current_layer = pdf.get_page(page).get_layer(layer);

    let font = pdf.add_builtin_font(TimesRoman)
        .expect("Builtin Font should be available");

    // Write Heading
    current_layer.begin_text_section();
    current_layer.set_font(&font, 42.0);
    current_layer.set_text_cursor(Mm(80.0), Mm(267.0));
    current_layer.write_text("Urkunde", &font);
    current_layer.add_line_break();
    current_layer.end_text_section();

    add_logo(pdf.get_page(page).get_layer(layer), false);
    add_name(&current_layer, &font, &athlete);

    pdf
}

pub fn new_heptathlon_certificate(athlete: &Athlete) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Urkunde {}", athlete.full_name()).as_str(),
                                       false);
    let current_layer = pdf.get_page(page).get_layer(layer);

    let font = pdf.add_builtin_font(TimesRoman)
        .expect("Builtin Font should be available");

    // Write Heading
    current_layer.begin_text_section();
    current_layer.set_font(&font, 42.0);
    current_layer.set_text_cursor(Mm(80.0), Mm(267.0));
    current_layer.write_text("Urkunde", &font);
    current_layer.add_line_break();
    current_layer.end_text_section();

    add_logo(pdf.get_page(page).get_layer(layer), false);
    add_name(&current_layer, &font, &athlete);

    pdf
}

pub fn new_decathlon_certificate(athlete: &Athlete) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Urkunde {}", athlete.full_name()).as_str(),
                                       false);

    let current_layer = pdf.get_page(page).get_layer(layer);

    let font = pdf.add_external_font(File::open("assets/fonts/comic_sans/regular.TTF")
        .expect("Comic Sans regular font not available"))
        .expect("Comic Sans regular  could not be added");
    let font_bold = pdf.add_external_font(File::open("assets/fonts/comic_sans/bold.ttf")
        .expect("Comic Sans bold font not available"))
        .expect("Comic Sans bold  could not be added");

    // Write Main Heading
    current_layer.begin_text_section();
        current_layer.set_text_rendering_mode(TextRenderingMode::Stroke);
        current_layer.set_font(&font, 100.0);
        current_layer.set_text_cursor(Mm(20.0), Mm(260.0));
        current_layer.write_text("Urkunde", &font_bold);
        current_layer.add_line_break();
    current_layer.end_text_section();
    add_logo(pdf.get_page(page).get_layer(layer), false);

    // Write JZK Heading
    current_layer.set_text_rendering_mode(TextRenderingMode::Fill);
    let font_size = 36.0;
    current_layer.use_text(format!("{COMPETITION_NUMBER}. Favoritner"), font_size, Mm(60.0), Mm(230.0), &font_bold);
    current_layer.use_text("Jedermann Zehnkampf", font_size, Mm(40.0), Mm(215.0), &font_bold);
    current_layer.use_text(format!("{DATE}"), 20.0, Mm(65.0), Mm(205.0), &font);

    add_logo(pdf.get_page(page).get_layer(layer), false);
    add_name(&current_layer, &font_bold, &athlete);
    add_achievements(&current_layer, &font, &athlete);

    // Write JZK Footer
    let font_size = 12.0;
    current_layer.use_text("Veranstalter: STW Favoriten", font_size, Mm(75.0), Mm(25.0), &font);
    current_layer.use_text("www.jedermannzehnkampf.at", font_size, Mm(75.0), Mm(20.0), &font);
    current_layer.use_text("office@jedermannzehnkampf.at", font_size, Mm(75.0), Mm(15.0), &font);

    pdf
}

pub fn new_group_result(group: &Group) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Ergebniss {}", group.name()).as_str(),
                                       true);

    let current_layer = pdf.get_page(page).get_layer(layer);


    let comic_font = pdf.add_external_font(File::open("assets/fonts/comic_sans/regular.TTF")
        .expect("Comic Sans regular font not available"))
        .expect("Comic Sans regular  could not be added");
    let comic_font_bold = pdf.add_external_font(File::open("assets/fonts/comic_sans/bold.ttf")
        .expect("Comic Sans bold font not available"))
        .expect("Comic Sans bold  could not be added");
    let helvetica_font_bold = pdf.add_builtin_font(HelveticaBold)
        .expect("Builtin Font should be available");


    // Write Heading
    current_layer.set_text_rendering_mode(TextRenderingMode::Fill);
    current_layer.begin_text_section();
    let font_size = 18.0;
    current_layer.use_text(format!("{COMPETITION_NUMBER}. Favoritner Jedermann - Zehnkampf {DATE}"), font_size, Mm(65.0), Mm(195.0), &helvetica_font_bold);
    current_layer.use_text(format!("{}", group.name()), font_size, Mm(148.5), Mm(185.), &helvetica_font_bold);
    current_layer.end_text_section();
    // Add Logo
    add_logo(pdf.get_page(page).get_layer(layer), true);

    // Add result heading
    let mut alignments: HashMap<&str, f32> = HashMap::new();
    alignments.insert("place",4.);
    alignments.insert("sex", 10.);
    alignments.insert("name", 19.);
    alignments.insert("birthyear", 55.);
    alignments.insert("total_points", 62.);
    alignments.insert("hundred_meter", 76.);

    // Add heading
    add_group_result_heading(&current_layer, &comic_font_bold, &alignments);

    // Add athletes
    add_group_athletes(&current_layer, &comic_font, &comic_font_bold, &alignments, group);
    pdf
}

fn add_group_result_heading(pdf_layer: &PdfLayerReference,font: &IndirectFontRef, alignments: &HashMap<&str, f32>) {

    let font_size = 10.0;
    let y_coord = 175.;
    pdf_layer.use_text("#", font_size, Mm(*alignments.get("place").expect("Value defined before")), Mm(y_coord), font);
    pdf_layer.use_text("Sex", font_size, Mm(*alignments.get("sex").expect("Value defined before")), Mm(y_coord), font);
    pdf_layer.use_text("Name", font_size, Mm(*alignments.get("name").expect("Value defined before")), Mm(y_coord), font);
    pdf_layer.use_text("JG", font_size, Mm(*alignments.get("birthyear").expect("Value defined before")), Mm(y_coord), font);
    pdf_layer.use_text("Summe", font_size, Mm(*alignments.get("total_points").expect("Value defined before")), Mm(y_coord), font);

    let mut x_coord = *alignments.get("hundred_meter").expect("Value defined before");
    for discipline_name in competition_order(&CompetitionType::Decathlon) {
        let short_name = discipline_name
            .replace(" Meter Lauf", "m")
            .replace("sprung", "")
            .replace("wurf", "")
            .replace("hoch", "")
            .replace("stoß", "")
            .replace("110 Meter ", "");
        pdf_layer.use_text(short_name, font_size, Mm(x_coord), Mm(y_coord), font);

        x_coord += 14.;
        pdf_layer.use_text("Pkt", font_size, Mm(x_coord), Mm(y_coord), font);
        x_coord += 8.;
    }

    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(3.), Mm(174.),), false),
            (Point::new(Mm(295.), Mm(174.),), false)
        ],
        is_closed: true
    });
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(3.), Mm(179.),), false),
            (Point::new(Mm(295.), Mm(179.),), false)
        ],
        is_closed: true
    });
}

fn add_group_athletes(pdf_layer: &PdfLayerReference,font: &IndirectFontRef, font_bold: &IndirectFontRef,
                      alignments: &HashMap<&str, f32>, group: &Group) {
    // TODO: Add new page if it overflows
    let font_size = 10.0;
    let line_height = font_size * 0.5;
    let mut y_coord = 170.;

    let mut athletes = group.athletes().clone();
    athletes.sort_by_key(|a| Reverse(a.total_point()));

    for (i, athlete) in athletes.iter().enumerate() {

        pdf_layer.use_text((i + 1).to_string(), font_size, Mm(*alignments.get("place").expect("Value defined before")), Mm(y_coord), font_bold);

        pdf_layer.use_text(athlete.gender(), font_size, Mm(*alignments.get("sex").expect("Value defined before")), Mm(y_coord), font);

        pdf_layer.use_text(athlete.full_name(), font_size, Mm(*alignments.get("name").expect("Value defined before")), Mm(y_coord), &font);

        let birthyear = match athlete.birth_date() {
            Some(date) => date.year().to_string()[2..4].to_string(),
            None => "???".to_string()
        };
        pdf_layer.use_text(birthyear, font_size, Mm(*alignments.get("birthyear").expect("Value defined before")), Mm(y_coord), &font);

        pdf_layer.use_text(athlete.total_point().to_string(), font_size, Mm(*alignments.get("total_points").expect("Value defined before")), Mm(y_coord), font_bold);

        let mut x_coord = *alignments.get("hundred_meter").expect("Value defined before");
        for discipline_name in competition_order(&CompetitionType::Decathlon) {

            let (achievement_string, points_string) = match athlete.get_achievement(discipline_name) {
                Some(achievement) => {

                    (achievement.final_result(), achievement.points(&athlete).to_string())
                },
                None => ("".to_string(), "".to_string())
            };

            pdf_layer.use_text(achievement_string, font_size, Mm(x_coord), Mm(y_coord), font);
            x_coord += 14.;
            pdf_layer.use_text(points_string, font_size, Mm(x_coord), Mm(y_coord), font_bold);
            x_coord += 8.;
        }
        pdf_layer.set_outline_thickness(0.5);
        pdf_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(3.), Mm(y_coord  - 1.)), false),
                (Point::new(Mm(295.), Mm(y_coord - 1.)), false)
            ],
            is_closed: true
        });
        pdf_layer.set_outline_thickness(1.);

        y_coord = y_coord - line_height;

    }

    // Add Vertical lines and closing line
    for (key, alignment) in alignments {
        if *key != "hundred_meter" {
            pdf_layer.add_line(Line {
                points: vec![
                    (Point::new(Mm(alignment.clone() - 1.), Mm(179.),), false),
                    (Point::new(Mm(alignment.clone() - 1.), Mm(y_coord + line_height - 1.),), false)
                ],
                is_closed: true
            })
        }
    }
    let mut x_coord = *alignments.get("hundred_meter").expect("Value defined before");
    for _ in competition_order(&CompetitionType::Decathlon) {
        pdf_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(x_coord - 1.), Mm(179.),), false),
                (Point::new(Mm(x_coord - 1.), Mm(y_coord + line_height - 1.),), false)
            ],
            is_closed: true
        });
        x_coord += 14.;
        pdf_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(x_coord - 1.), Mm(179.),), false),
                (Point::new(Mm(x_coord - 1.), Mm(y_coord + line_height - 1.),), false)
            ],
            is_closed: true
        });
        x_coord += 8.;
    }
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(x_coord - 1.), Mm(179.),), false),
            (Point::new(Mm(x_coord - 1.), Mm(y_coord + line_height - 1.),), false)
        ],
        is_closed: true
    });
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(3.), Mm(y_coord + line_height - 1.),), false),
            (Point::new(Mm(295.), Mm(y_coord + line_height - 1.),), false)
        ],
        is_closed: true
    });

    }