use crate::certificate_generation::pdf::pdf_generation::{add_logo, setup_pdf, LEFT_PAGE_EDGE};
use crate::certificate_generation::pdf::{COMPETITION_NUMBER, DATE};
use crate::certificate_generation::{athletes, competition_order, CompetitionType, Group};
use crate::teams::Team;
use chrono::Datelike;
use printpdf::rectangle::Rect;
use printpdf::BuiltinFont::HelveticaBold;
use printpdf::{
    IndirectFontRef, Line, Mm, PdfDocumentReference, PdfLayerIndex, PdfLayerReference,
    PdfPageIndex, Point, TextRenderingMode,
};
use std::cmp::Reverse;
use std::collections::HashMap;
use std::fs::File;


const DEFAULT_DISCIPLINE_WIDTH: f32 = 11.5;
const POINTS_WIDTH: f32 = 8.;

pub fn new_team_result(teams: &Vec<Team>) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf("Ergebnis Teams", true);
    add_team_result_to_page(teams, pdf, page, layer)
}

pub fn add_team_result_to_page(
    teams: &Vec<Team>,
    pdf: PdfDocumentReference,
    page: PdfPageIndex,
    layer: PdfLayerIndex,
) -> PdfDocumentReference {
    let comic_font = pdf
        .add_external_font(
            File::open("assets/fonts/comic_sans/regular.TTF")
                .expect("Comic Sans regular font not available"),
        )
        .expect("Comic Sans regular  could not be added");
    let comic_font_bold = pdf
        .add_external_font(
            File::open("assets/fonts/comic_sans/bold.ttf")
                .expect("Comic Sans bold font not available"),
        )
        .expect("Comic Sans bold  could not be added");

    // Add result heading
    let mut alignments: HashMap<&str, f32> = HashMap::new();
    alignments.insert("place", 7.);
    alignments.insert("name", 140.);
    alignments.insert("members", 115.);
    alignments.insert("total_points", 17.);
    alignments.insert("member_name_points", 90.);


    let current_layer = setup_new_page(&pdf, page, layer, &alignments);

    // Add athletes
    add_teams(
        current_layer,
        &comic_font,
        &comic_font_bold,
        &alignments,
        teams,
        &pdf
    );
    pdf
}

fn setup_new_page(
    pdf: &PdfDocumentReference,
    page: PdfPageIndex,
    layer: PdfLayerIndex,
    alignments: &HashMap<&str, f32>,
) -> PdfLayerReference {
    let current_layer = pdf.get_page(page).get_layer(layer);

    let comic_font_bold = pdf
        .add_external_font(
            File::open("assets/fonts/comic_sans/bold.ttf")
                .expect("Comic Sans bold font not available"),
        )
        .expect("Comic Sans bold  could not be added");
    let helvetica_font_bold = pdf
        .add_builtin_font(HelveticaBold)
        .expect("Builtin Font should be available");

    // Write Heading
    current_layer.set_text_rendering_mode(TextRenderingMode::Fill);
    current_layer.begin_text_section();
    let font_size = 18.0;
    current_layer.use_text(
        format!("{COMPETITION_NUMBER}. Favoritner Jedermann - Zehnkampf {DATE}"),
        font_size,
        Mm(65.0),
        Mm(195.0),
        &helvetica_font_bold,
    );
    let group_name = "Teams".to_string();
    current_layer.use_text(
        format!("{}", group_name),
        font_size,
        Mm(148.5),
        Mm(185.),
        &helvetica_font_bold,
    );
    current_layer.end_text_section();
    // Add Logo
    add_logo(pdf.get_page(page).get_layer(layer), true);

    // Add heading
    add_team_result_heading(&current_layer, &comic_font_bold, &alignments);

    current_layer
}

fn add_team_result_heading(
    pdf_layer: &PdfLayerReference,
    font: &IndirectFontRef,
    alignments: &HashMap<&str, f32>
) {
    let font_size = 10.0;
    let y_coord = 175.;
    let mut x_coord = LEFT_PAGE_EDGE;
    

    // Add background color
    x_coord += *alignments.get("place").expect("Value defined before");
    x_coord += *alignments.get("name").expect("Value defined before");
    x_coord += *alignments.get("members").expect("Value defined before");
    x_coord += *alignments.get("total_points").expect("Value defined before");

    pdf_layer.set_fill_color(printpdf::Color::Rgb(
        printpdf::color::Rgb::new(74./256., 181./256., 226./256., None))
    );
    let background_color = Rect::new(
        Mm(LEFT_PAGE_EDGE - 1.),
        Mm(174.),
        Mm(x_coord - 1.),
        Mm(179.),
    )
    .with_mode(printpdf::path::PaintMode::Fill);
    pdf_layer.add_rect(background_color);


    pdf_layer.set_fill_color(printpdf::Color::Rgb(
        printpdf::color::Rgb::new(0.,0.,0., None))
    );

    x_coord = LEFT_PAGE_EDGE;

    pdf_layer.use_text("#", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments.get("place").expect("Value defined before");

    pdf_layer.use_text("Name", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments.get("name").expect("Value defined before");

    pdf_layer.use_text("Mitglieder", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments.get("members").expect("Value defined before");

    pdf_layer.use_text("Punkte", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *alignments
        .get("total_points")
        .expect("Value defined before");

    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(174.)), false),
            (Point::new(Mm(x_coord - 1.), Mm(174.)), false),
        ],
        is_closed: true,
    });
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(179.)), false),
            (Point::new(Mm(x_coord - 1.), Mm(179.)), false),
        ],
        is_closed: true,
    });


}

fn add_teams(
    mut pdf_layer: PdfLayerReference,
    font: &IndirectFontRef,
    font_bold: &IndirectFontRef,
    alignments: &HashMap<&str, f32>,
    teams: &Vec<Team>,
    pdf: &PdfDocumentReference
) {
    let mut teams = teams.clone();
    let font_size: f32 = 10.0;
    let line_height = font_size * 0.5;
    let initial_y_coord = 170.;

    let mut max_name_char_len = 45;

    teams.sort_by_key(|t| Reverse(t.total_points));

    let mut y_coord = initial_y_coord;
    for (i, team) in teams.iter().enumerate() {
        if team.athlete_infos.is_none() || team.athlete_infos.as_ref().unwrap().is_empty(){
            continue;
        }
        let mut x_coord = LEFT_PAGE_EDGE;
        let mut num_lines = 1.;

        pdf_layer.use_text(
            (i + 1).to_string(),
            font_size,
            Mm(x_coord),
            Mm(y_coord),
            font_bold,
        );
        x_coord += *alignments.get("place").expect("Value defined before");

        let team_name = team.team_name.clone().expect("Team name should be available");
        // Split in multiple lines if text larger than 20 chars
        let mut name_part = team_name.as_str();
        while name_part.len() > max_name_char_len {
            let name_parts: Vec<&str> = name_part.split(" ").collect();
            let name_line: String;
            if name_parts.len() > 1{
                let all_but_last = name_parts[..name_parts.len() - 1].join(" ");
                if all_but_last.len() < max_name_char_len{
                    name_line = all_but_last;
                }else{
                    name_line = name_part[..max_name_char_len].to_string();
                }
            }else{
                name_line = name_part[..max_name_char_len].to_string();
            }
            pdf_layer.use_text(
                name_line.as_str(),
                font_size * 1.5,
                Mm(x_coord),
                Mm(y_coord - line_height * (num_lines - 1.) - 1.),
                &font_bold,
            );

            name_part = &name_part[name_line.len()..];
            num_lines += 1.;
        }
        pdf_layer.use_text(
            name_part,
            font_size * 1.5,
            Mm(x_coord),
            Mm(y_coord - line_height * (num_lines - 1.) - 1.),
            &font_bold,
        );
        x_coord += *alignments.get("name").expect("Value defined before");

        let first_line_y_coord = y_coord;
        
        let athletes = team.athlete_infos.as_ref().expect("Athletes should be available");
        let mut athlete_num_lines = 1.;

        for (i, athlete) in athletes.iter().enumerate() {
            let athlete_name = athlete.full_name();
            let mut athlete_name_part = athlete_name.as_str();
            let member_x_coord: f32 = x_coord;
            while athlete_name_part.len() > max_name_char_len {
                let name_parts: Vec<&str> = athlete_name_part.split(" ").collect();
                let name_line: String;
                if name_parts.len() > 1{
                    let all_but_last = name_parts[..name_parts.len() - 1].join(" ");
                    if all_but_last.len() < max_name_char_len{
                        name_line = all_but_last;
                    }else{
                        name_line = athlete_name_part[..max_name_char_len].to_string();
                    }
                }else{
                    name_line = athlete_name_part[..max_name_char_len].to_string();
                }
                pdf_layer.use_text(
                    name_line.as_str(),
                    font_size,
                    Mm(member_x_coord),
                    Mm(y_coord - line_height * (athlete_num_lines - 1.)),
                    &font,
                );

                athlete_name_part = &athlete_name_part[name_line.len()..];
                athlete_num_lines += 1.;
            }
            pdf_layer.use_text(
                athlete_name_part,
                font_size,
                Mm(member_x_coord),
                Mm(y_coord - line_height * (athlete_num_lines - 1.)),
                &font,
            );

            pdf_layer.use_text(
                format!("({} Pkt.)", athlete.total_point().to_string()),
                font_size,
                Mm(member_x_coord + *alignments.get("member_name_points").expect("Value defined before")),
                Mm(y_coord - line_height * (athlete_num_lines - 1.)),
                &font,
            );
            if i < athletes.len() - 1 {
                athlete_num_lines += 1.; // Add space between athletes
            }

        }
        if athlete_num_lines > num_lines {
            num_lines = athlete_num_lines + 1.;
        }
        x_coord += *alignments.get("members").expect("Value defined before");


        let points = team.total_points.expect("Total points should be available").to_string();
        pdf_layer.use_text(
            points,
            font_size,
            Mm(x_coord),
            Mm(y_coord),
            font_bold,
        );
        x_coord += *alignments
            .get("total_points")
            .expect("Value defined before");

        pdf_layer.set_outline_thickness(0.5);
        pdf_layer.add_line(Line {
            points: vec![
                (
                    Point::new(
                        Mm(LEFT_PAGE_EDGE - 1.),
                        Mm(first_line_y_coord - 1. - line_height * (num_lines - 1.)),
                    ),
                    false,
                ),
                (
                    Point::new(
                        Mm(x_coord - 1.),
                        Mm(first_line_y_coord - 1. - line_height * (num_lines - 1.)),
                    ),
                    false,
                ),
            ],
            is_closed: true,
        });
        pdf_layer.set_outline_thickness(1.);
        y_coord = first_line_y_coord - line_height * num_lines;

        if y_coord < 10. {
            add_vertical_lines(&pdf_layer, alignments,  y_coord + line_height - 1.);

            // Get new page
            let (pdf_page_index, pdf_layer_index) =
                crate::certificate_generation::pdf::pdf_generation::add_pdf_page(
                    pdf,
                    "New result page",
                    true,
                );

            pdf_layer = setup_new_page(&pdf, pdf_page_index, pdf_layer_index, &alignments);
            y_coord = initial_y_coord;
        }
    }

    add_vertical_lines(&pdf_layer, alignments,  y_coord + line_height - 1.);
}

fn add_vertical_lines(
    pdf_layer: &PdfLayerReference,
    alignments: &HashMap<&str, f32>,
    bottom_y_coord: f32,
) {
    // Add Vertical lines and closing line to current page
    let mut x_coord = LEFT_PAGE_EDGE;

    for mut col_key in vec!["place", "name", "members", "total_points"] {
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
            (
                Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(bottom_y_coord)),
                false,
            ),
            (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
        ],
        is_closed: true,
    });
}