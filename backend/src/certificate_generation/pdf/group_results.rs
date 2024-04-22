use std::cmp::Reverse;
use std::collections::HashMap;
use std::fs::File;
use printpdf::{IndirectFontRef, Line, Mm, PdfDocumentReference, PdfLayerIndex, PdfLayerReference, PdfPageIndex, Point, TextRenderingMode};
use printpdf::BuiltinFont::HelveticaBold;
use crate::certificate_generation::{competition_order, CompetitionType, Group};
use crate::certificate_generation::pdf::pdf_generation::{add_logo, LEFT_PAGE_EDGE, setup_pdf};
use crate::certificate_generation::pdf::{COMPETITION_NUMBER, DATE};
use chrono::Datelike;

const DEFAULT_DISCIPLINE_WIDTH: f32 = 11.5;
const POINTS_WIDTH: f32 = 8.;

pub fn new_group_result(group: &Group) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Ergebniss {}", group.name()).as_str(),
                                                                                           true);

    let comic_font = pdf.add_external_font(File::open("assets/fonts/comic_sans/regular.TTF")
        .expect("Comic Sans regular font not available"))
        .expect("Comic Sans regular  could not be added");
    let comic_font_bold = pdf.add_external_font(File::open("assets/fonts/comic_sans/bold.ttf")
        .expect("Comic Sans bold font not available"))
        .expect("Comic Sans bold  could not be added");

    // Add result heading
    let mut alignments: HashMap<&str, f32> = HashMap::new();
    alignments.insert("place", 6.);
    alignments.insert("sex", 8.);
    alignments.insert("name", 38.);
    alignments.insert("birthyear", 7.);
    alignments.insert("total_points", 13.);

    alignments.insert("Decathlon: 110 Meter Hürden", 15.);
    alignments.insert("Decathlon: Diskuswurf", 14.);
    alignments.insert("Decathlon: 1500 Meter Lauf", 17.);

    alignments.insert("Pentathlon: 60 Meter Hürdern", 76.);
    alignments.insert("Pentathlon: Hochsprung", 76.);
    alignments.insert("Pentathlon: 60 Meter Lauf", 76.);
    alignments.insert("Pentathlon: Vortexwurf", 76.);
    alignments.insert("Pentathlon: 1200 Meter Crosslauf", 76.);

    alignments.insert("Triathlon: 60 Meter Lauf", 76.);
    alignments.insert("Triathlon: Weitsprung", 76.);
    alignments.insert("Triathlon: Schlagballwurf", 76.);

    alignments.insert("Hepathlon: 100 Meter Lauf", 76.);
    alignments.insert("Hepathlon: Weitsprung", 76.);
    alignments.insert("Hepathlon: Kugelstoß", 76.);
    alignments.insert("Hepathlon: Hochsprung", 76.);
    alignments.insert("Hepathlon: 100 Meter Hürden", 76.);
    alignments.insert("Hepathlon: Speerwurf", 76.);
    alignments.insert("Hepathlon: 1000 Meter Lauf", 76.);


    let current_layer = setup_new_page(&pdf, page, layer, group, &alignments);

    // Add athletes
    add_group_athletes(current_layer, &comic_font, &comic_font_bold, &alignments, group, &pdf);
    pdf
}

fn setup_new_page(pdf: &PdfDocumentReference, page: PdfPageIndex, layer: PdfLayerIndex, group: &Group, alignments: &HashMap<&str, f32>) -> PdfLayerReference {
    let current_layer = pdf.get_page(page).get_layer(layer);

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

    // Add heading
    add_group_result_heading(&current_layer, &comic_font_bold, &alignments, group);

    current_layer
}

fn add_group_result_heading(pdf_layer: &PdfLayerReference, font: &IndirectFontRef, alignments: &HashMap<&str, f32>, group: &Group) {
    let font_size = 10.0;
    let y_coord = 175.;
    let mut x_coord = LEFT_PAGE_EDGE;
    pdf_layer.use_text("#", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments.get("place").expect("Value defined before");

    pdf_layer.use_text("Sex", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments.get("sex").expect("Value defined before");

    pdf_layer.use_text("Name", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments.get("name").expect("Value defined before");

    pdf_layer.use_text("JG", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments.get("birthyear").expect("Value defined before");

    pdf_layer.use_text("Summe", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments.get("total_points").expect("Value defined before");

    for discipline_name in competition_order(&CompetitionType::Decathlon) {
        let discipline_width = alignments.get(format!("{}: {}", group.competition_type(), discipline_name).as_str()).unwrap_or(&DEFAULT_DISCIPLINE_WIDTH);
        let short_name = discipline_name
            .replace(" Meter Lauf", "m")
            .replace("sprung", "")
            .replace("wurf", "")
            .replace("hoch", "")
            .replace("stoß", "")
            .replace("110 Meter ", "");
        pdf_layer.use_text(short_name, font_size, Mm(x_coord), Mm(y_coord), font);

        x_coord += discipline_width;
        pdf_layer.use_text("", font_size, Mm(x_coord), Mm(y_coord), font);
        x_coord += POINTS_WIDTH;
    }

    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(crate::certificate_generation::pdf::pdf_generation::LEFT_PAGE_EDGE - 1.), Mm(174.)), false),
            (Point::new(Mm(x_coord - 1.), Mm(174.)), false),
        ],
        is_closed: true,
    });
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(crate::certificate_generation::pdf::pdf_generation::LEFT_PAGE_EDGE - 1.), Mm(179.)), false),
            (Point::new(Mm(x_coord - 1.), Mm(179.)), false),
        ],
        is_closed: true,
    });
}

fn add_group_athletes(mut pdf_layer: PdfLayerReference, font: &IndirectFontRef, font_bold: &IndirectFontRef,
                      alignments: &HashMap<&str, f32>, group: &Group, pdf: &PdfDocumentReference) {
    let font_size = 10.0;
    let line_height = font_size * 0.5;
    let initial_y_coord = 170.;

    let mut athletes = group.athletes().clone();
    athletes.sort_by_key(|a| Reverse(a.total_point()));

    let mut y_coord = initial_y_coord;
    for (i, athlete) in athletes.iter().enumerate() {
        let mut x_coord = LEFT_PAGE_EDGE;
        let mut num_lines = 1.;

        pdf_layer.use_text((i + 1).to_string(), font_size, Mm(x_coord), Mm(y_coord), font_bold);
        x_coord += *alignments.get("place").expect("Value defined before");

        pdf_layer.use_text(athlete.gender(), font_size, Mm(x_coord), Mm(y_coord), font);
        x_coord += *alignments.get("sex").expect("Value defined before");


        let athlete_name = athlete.full_name();
        // Split in multiple lines if text larger than 20 chars
        let mut athlete_part = athlete_name.as_str();
        while athlete_part.len() > 20 {
            let name_line = &athlete_part[..20];
            pdf_layer.use_text(name_line, font_size, Mm(x_coord), Mm(y_coord - line_height * (num_lines - 1.)), &font);

            athlete_part = &athlete_part[20..];
            num_lines += 1.;
        }
        pdf_layer.use_text(athlete_part, font_size, Mm(x_coord), Mm(y_coord - line_height * (num_lines - 1.)), &font);
        x_coord += *alignments.get("name").expect("Value defined before");

        let birthyear = match athlete.birth_date() {
            Some(date) => date.year().to_string()[2..4].to_string(),
            None => "XX".to_string()
        };
        pdf_layer.use_text(birthyear, font_size, Mm(x_coord), Mm(y_coord), &font);
        x_coord += *alignments.get("birthyear").expect("Value defined before");

        pdf_layer.use_text(athlete.total_point().to_string(), font_size, Mm(x_coord), Mm(y_coord), font_bold);
        x_coord += *alignments.get("total_points").expect("Value defined before");

        for discipline_name in competition_order(&group.competition_type()) {
            let discipline_width = alignments.get(format!("{}: {}", group.competition_type(), discipline_name).as_str()).unwrap_or(&DEFAULT_DISCIPLINE_WIDTH);
            let (achievement_string, points_string) = match athlete.get_achievement(discipline_name) {
                Some(achievement) => {
                    if achievement.final_result() == "-1,0" {
                        ("".to_string(), achievement.points(&athlete).to_string())
                    } else {
                        (achievement.fmt_final_result(), achievement.points(&athlete).to_string())
                    }
                }
                None => ("".to_string(), "".to_string())
            };

            pdf_layer.use_text(achievement_string, font_size, Mm(x_coord), Mm(y_coord), font);
            x_coord += discipline_width;
            pdf_layer.use_text(points_string, font_size, Mm(x_coord), Mm(y_coord), font_bold);
            x_coord += POINTS_WIDTH;
        }
        pdf_layer.set_outline_thickness(0.5);
        pdf_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(crate::certificate_generation::pdf::pdf_generation::LEFT_PAGE_EDGE - 1.), Mm(y_coord - 1.  - line_height * (num_lines - 1.))), false),
                (Point::new(Mm(x_coord - 1.), Mm(y_coord - 1.  - line_height * (num_lines - 1.))), false),
            ],
            is_closed: true,
        });
        pdf_layer.set_outline_thickness(1.);
        y_coord = y_coord - line_height * num_lines;

        if y_coord < 10. {
            add_vertical_lines(&pdf_layer, alignments, group, y_coord + line_height - 1.);

            // Get new page
            let (pdf_page_index, pdf_layer_index) = crate::certificate_generation::pdf::pdf_generation::add_pdf_page(pdf, "New result page", true);

            pdf_layer = setup_new_page(&pdf, pdf_page_index, pdf_layer_index, group, &alignments);
            y_coord = initial_y_coord;
        }
    }

    add_vertical_lines(&pdf_layer, alignments, group, y_coord + line_height - 1.);
}

fn add_vertical_lines(pdf_layer: &PdfLayerReference, alignments: &HashMap<&str, f32>, group: &Group,
                      bottom_y_coord: f32) {
    // Add Vertical lines and closing line to current page
    let mut x_coord = crate::certificate_generation::pdf::pdf_generation::LEFT_PAGE_EDGE;

    for col_key in vec!["place", "sex", "name", "birthyear", "total_points"] {
        if let Some(alignment_width) = alignments.get(col_key) {
            pdf_layer.add_line(Line {
                points: vec![
                    (Point::new(Mm(x_coord - 1.), Mm(179.)), false),
                    (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
                ],
                is_closed: true,
            });
            x_coord += alignment_width;
        }
    }

    for discipline_name in competition_order(&group.competition_type()) {
        let discipline_width = alignments.get(format!("{}: {}", group.competition_type(), discipline_name).as_str()).unwrap_or(&DEFAULT_DISCIPLINE_WIDTH);
        pdf_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(x_coord - 1.), Mm(179.)), false),
                (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
            ],
            is_closed: true,
        });
        x_coord += discipline_width;
        pdf_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(x_coord - 1.), Mm(179.)), false),
                (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
            ],
            is_closed: true,
        });
        x_coord += POINTS_WIDTH;
    }
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(x_coord - 1.), Mm(179.)), false),
            (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
        ],
        is_closed: true,
    });

    // Add horizontal closing line
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(crate::certificate_generation::pdf::pdf_generation::LEFT_PAGE_EDGE - 1.), Mm(bottom_y_coord)), false),
            (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
        ],
        is_closed: true,
    });
}
