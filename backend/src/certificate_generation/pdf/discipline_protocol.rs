use std::collections::HashMap;
use printpdf::{IndirectFontRef, Line, Mm, PdfDocumentReference, PdfLayerReference, Point, TextRenderingMode};
use printpdf::BuiltinFont::{Helvetica, HelveticaBold};
use crate::certificate_generation::{Achievement, Athlete, CompetitionType, Float, Group};
use crate::certificate_generation::pdf::{DATE, COMPETITION_NUMBER};
use crate::certificate_generation::pdf::pdf_generation::{add_pdf_page, LEFT_PAGE_EDGE, setup_pdf};
use crate::time_planner::{Discipline, DisciplineType, Run, StartingOrder};

pub fn get_discipline_protocol(group: &Group, discipline: &Discipline) -> PdfDocumentReference {
    let landscape = match discipline.discipline_type() {
        DisciplineType::Height => true,
        _ => false
    };
    let (pdf, page, layer) = setup_pdf(format!("Protokoll {}", discipline.name()).as_str(),
                                       landscape);
    let current_layer = pdf.get_page(page).get_layer(layer);

    let font = pdf.add_builtin_font(Helvetica)
        .expect("Builtin Font should be available");
    let font_bold = pdf.add_builtin_font(HelveticaBold)
        .expect("Builtin Font should be available");

    add_header(&current_layer, &font_bold, group, discipline, landscape);


    match discipline.discipline_type() {
        DisciplineType::Track => {
            add_track_discipline(&pdf, current_layer, &font, &font_bold, group, discipline);
        }
        DisciplineType::Time => {
            add_time_discipline(&current_layer, &font, &font_bold, group, discipline);
        }
        DisciplineType::Height => {
            add_height_discipline(&pdf, current_layer, &font, &font_bold, group, discipline);
        }
        DisciplineType::Distance => {
            add_distance_discipline(&current_layer, &font, &font_bold, group, discipline);
        }
    };

    pdf
}

fn add_header(current_layer: &PdfLayerReference, font: &IndirectFontRef, group: &Group,
              discipline: &Discipline, landscape: bool) {

    // Write JZK Heading
    current_layer.set_text_rendering_mode(TextRenderingMode::Fill);
    let font_size = 16.0;

    let x;
    let mut y;
    if landscape {
        x = 50.;
        y = 193.;
    } else {
        x = LEFT_PAGE_EDGE;
        y = 280.;
    }
    current_layer.use_text(format!("{COMPETITION_NUMBER}. Favoritner Jedermann Zehnkampf - {DATE}"),
                           font_size, Mm(x), Mm(y), &font);

    let font_size = 10.0;
    y = y - 10.;
    current_layer.use_text(format!("{} - {}", group.name(), discipline.name()),
                           font_size, Mm(x), Mm(y), &font);
}

fn add_athlete_info<'a>(current_layer: &PdfLayerReference, col_widths: &HashMap<&str, f32>,
                    i: usize, athletes: &'a Vec<Athlete>, discipline: &Discipline,
                    font_size: f32, y_coord: f32, line_height: f32,
                    font: &IndirectFontRef, font_bold: &IndirectFontRef) -> (f32, f32, Option<&'a Achievement>){
    let max_name_char_len = 50;
    let mut age_group = "".to_string();
    let mut starting_number = "".to_string();
    let mut name = "".to_string();
    let mut achievements = None;

    if i < athletes.len() {
        let athlete = &athletes[i];
        name = format!("{} {}", athlete.name(), athlete.surname());
        starting_number = match athlete.starting_number(){
            Some(number) => number.to_string(),
            None => "".to_string()
        };
        age_group = athlete.age_group();
        achievements = athlete.get_achievement(discipline.name());
    }
    let mut x_coord = LEFT_PAGE_EDGE;
    let mut num_lines = 1.;

    current_layer.use_text((i + 1).to_string(), font_size, Mm(x_coord), Mm(y_coord), font_bold);
    x_coord += *col_widths.get("position").expect("Value defined before");

    current_layer.use_text(age_group, font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("age_group").expect("Value defined before");

    current_layer.use_text(starting_number, font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("starting_number").expect("Value defined before");

    // Split in multiple lines if text larger than 20 chars
    let mut athlete_part = name.as_str();
    while athlete_part.len() > max_name_char_len {
        let name_line = &athlete_part[..max_name_char_len];
        current_layer.use_text(name_line, font_size, Mm(x_coord), Mm(y_coord - line_height * (num_lines - 1.)), &font_bold);

        athlete_part = &athlete_part[max_name_char_len..];
        num_lines += 1.;
    }
    current_layer.use_text(athlete_part, font_size, Mm(x_coord), Mm(y_coord - line_height * (num_lines - 1.)), &font_bold);
    x_coord += *col_widths.get("name").expect("Value defined before");

    (x_coord, num_lines, achievements)
}

fn add_distance_discipline(current_layer: &PdfLayerReference, font: &IndirectFontRef, font_bold: &IndirectFontRef, group: &Group,
                           discipline: &Discipline) {
    let font_size = 10.0;
    let line_height = font_size * 0.6;
    let initial_y_coord = 260.;

    let mut col_widths = HashMap::new();
    col_widths.insert("position", 10.);
    col_widths.insert("age_group", 13.);
    col_widths.insert("starting_number", 13.);
    col_widths.insert("name", 60.);
    col_widths.insert("try", 20.);
    col_widths.insert("best_try", 30.);

    let mut athletes = group.athletes().clone();

    match discipline.starting_order() {
        StartingOrder::Default(athlete_order) => {
            athletes.sort_by_key(|item| athlete_order.iter().position(|x| *x.full_name() == *item.full_name()).unwrap_or(0));
        }
        _ => {} // leave it the way it is
    };

    let mut y_coord = initial_y_coord;
    let mut x_coord = LEFT_PAGE_EDGE;

    current_layer.use_text("".to_string(), font_size, Mm(x_coord), Mm(y_coord), font_bold);
    x_coord += *col_widths.get("position").expect("Value defined before");
    current_layer.use_text("AG", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("age_group").expect("Value defined before");
    current_layer.use_text("#", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("starting_number").expect("Value defined before");
    current_layer.use_text("Name", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("name").expect("Value defined before");
    current_layer.use_text("1. Versuch", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("try").expect("Value defined before");
    current_layer.use_text("2. Versuch", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("try").expect("Value defined before");
    current_layer.use_text("3. Versuch", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("try").expect("Value defined before");
    current_layer.use_text("Bester Versuch", font_size, Mm(x_coord), Mm(y_coord), font_bold);
    x_coord += *col_widths.get("best_try").expect("Value defined before");

    current_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(y_coord - 1.)), false),
            (Point::new(Mm(x_coord - 1.), Mm(y_coord - 1.)), false),
        ],
        is_closed: true,
    });
    y_coord -= line_height;

    for i in 0..31{

        let (mut x_coord, num_lines, achievements) = add_athlete_info(current_layer, &col_widths, i, &athletes, discipline, font_size, y_coord,
                         line_height, font, font_bold);


        match achievements {
            Some(achievement) => {
                match achievement {
                    Achievement::Distance(result) => {
                        for try_result in result.tries() {
                            let achievement_string = match try_result {
                                Some(val) => {
                                    if val == &Float::new(-1, 0){
                                        "X".to_string()
                                    } else{
                                        format!("{}", val)
                                    }
                                },
                                None => "X".to_string()
                            };
                            current_layer.use_text(achievement_string, font_size, Mm(x_coord), Mm(y_coord), font);
                            x_coord += *col_widths.get("try").expect("Value defined before");
                        }
                        current_layer.use_text(format!("{}", result.compute_best_result()), font_size, Mm(x_coord), Mm(y_coord), font_bold);
                        x_coord += *col_widths.get("best_try").expect("Value defined before");
                    }
                    _ => {
                        x_coord += *col_widths.get("try").expect("Value defined before") * 3.;
                        x_coord += *col_widths.get("best_try").expect("Value defined before");
                    }
                }
            }
            None => {
                x_coord += *col_widths.get("try").expect("Value defined before") * 3.;
                x_coord += *col_widths.get("best_try").expect("Value defined before");
            }
        }

        current_layer.set_outline_thickness(0.5);
        current_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(y_coord - 1. - line_height * (num_lines - 1.))), false),
                (Point::new(Mm(x_coord - 1.), Mm(y_coord - 1. - line_height * (num_lines - 1.))), false),
            ],
            is_closed: true,
        });
        current_layer.set_outline_thickness(1.);
        y_coord = y_coord - line_height * num_lines;
    }

    add_vertical_lines(&current_layer, &col_widths, initial_y_coord + line_height,
                       y_coord + line_height - 1.,
                       vec!["position", "age_group", "starting_number", "name", "try", "try", "try", "best_try"]);
}

fn add_time_discipline(current_layer: &PdfLayerReference, font: &IndirectFontRef, font_bold: &IndirectFontRef, group: &Group,
                           discipline: &Discipline) {
    let font_size = 10.0;
    let line_height = font_size * 0.6;
    let initial_y_coord = 260.;

    let mut col_widths = HashMap::new();
    col_widths.insert("position", 10.);
    col_widths.insert("age_group", 13.);
    col_widths.insert("starting_number", 13.);
    col_widths.insert("name", 60.);
    col_widths.insert("time", 30.);
    col_widths.insert("empty_col", 10.);
    col_widths.insert("race_position", 40.);

    let athletes = group.athletes().clone();

    let mut y_coord = initial_y_coord;
    let mut x_coord = LEFT_PAGE_EDGE;

    current_layer.use_text("".to_string(), font_size, Mm(x_coord), Mm(y_coord), font_bold);
    x_coord += *col_widths.get("position").expect("Value defined before");
    current_layer.use_text("AG", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("age_group").expect("Value defined before");
    current_layer.use_text("#", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("starting_number").expect("Value defined before");
    current_layer.use_text("Name", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("name").expect("Value defined before");
    current_layer.use_text("Zeit", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("time").expect("Value defined before");
    x_coord += *col_widths.get("empty_col").expect("Value defined before");
    current_layer.use_text("Einlauf Startnummer", font_size, Mm(x_coord), Mm(y_coord), font_bold);
    x_coord += *col_widths.get("race_position").expect("Value defined before");

    current_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(y_coord - 1.)), false),
            (Point::new(Mm(x_coord - 1.), Mm(y_coord - 1.)), false),
        ],
        is_closed: true,
    });
    y_coord -= line_height;

    for i in 0..31{

        let (mut x_coord, num_lines, achievements) = add_athlete_info(current_layer,
                                                                      &col_widths, i, &athletes,
                                                                      discipline, font_size, y_coord,
                                                                      line_height, font, font_bold);


        match achievements {
            Some(achievement) => {
                match achievement {
                    Achievement::Time(result) => {
                        let (time, _) = result.fmt_final_result();
                        current_layer.use_text(format!("{}", time), font_size, Mm(x_coord), Mm(y_coord), font_bold);
                    }
                    _ => {}
                }
            }
            None => {}
        }
        x_coord += *col_widths.get("time").expect("Value defined before");
        x_coord += *col_widths.get("empty_col").expect("Value defined before");
        x_coord += *col_widths.get("race_position").expect("Value defined before");

        current_layer.set_outline_thickness(0.5);
        current_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(y_coord - 1. - line_height * (num_lines - 1.))), false),
                (Point::new(Mm(x_coord - 1.), Mm(y_coord - 1. - line_height * (num_lines - 1.))), false),
            ],
            is_closed: true,
        });
        current_layer.set_outline_thickness(1.);
        y_coord = y_coord - line_height * num_lines;
    }

    add_vertical_lines(&current_layer, &col_widths, initial_y_coord + line_height,
                       y_coord + line_height - 1.,
                       vec!["position", "age_group", "starting_number", "name", "time", "empty_col", "race_position" ]);
}

fn add_track_discipline(pdf: &PdfDocumentReference, mut current_layer: PdfLayerReference, font: &IndirectFontRef, font_bold: &IndirectFontRef, group: &Group,
                       discipline: &Discipline) {
    let font_size = 10.0;
    let line_height = font_size * 0.5;
    let initial_y_coord = 260.;

    let mut col_widths = HashMap::new();
    col_widths.insert("position", 20.);
    col_widths.insert("age_group", 13.);
    col_widths.insert("starting_number", 13.);
    col_widths.insert("name", 80.);
    col_widths.insert("time", 40.);

    let all_athletes = group.athletes();
    let empty_runs = vec![];
    let starting_order = discipline.starting_order().clone();
    let mut runs: Vec<Run> = match starting_order {
        StartingOrder::Track(runs) => runs,
        _ => empty_runs
    };

    let mut y_coord = initial_y_coord;
    // Add header
    let mut x_coord = LEFT_PAGE_EDGE;
    current_layer.use_text("Bahn".to_string(), font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("position").expect("Value defined before");
    current_layer.use_text("AG", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("age_group").expect("Value defined before");
    current_layer.use_text("#", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("starting_number").expect("Value defined before");
    current_layer.use_text("Name", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("name").expect("Value defined before");
    current_layer.use_text("Zeit", font_size, Mm(x_coord), Mm(y_coord), font);
    y_coord -= line_height;

    while runs.len() > 0 {
        for run_id in 0..6{
            let track_run;
            if run_id < runs.len() {
                track_run = Some(&runs[run_id]);
            } else{
                track_run = None;
            }
            y_coord -= line_height * 1.2;
            let x_coord = LEFT_PAGE_EDGE;
            current_layer.use_text(format!("Lauf {}", run_id + 1), font_size, Mm(x_coord), Mm(y_coord), font_bold);
            y_coord -= line_height;
            let initial_y_coord = y_coord - 1.;

            for i in 0..6{
                let run_athletes = match track_run {
                    Some(track_run) => {
                        let athletes_tuple = track_run.athletes().clone();
                        let athletes = vec![athletes_tuple.0, athletes_tuple.1, athletes_tuple.2, athletes_tuple.3, athletes_tuple.4, athletes_tuple.5];
                        let run_names: Vec<String> = athletes.iter().map(|athlete| {
                            if let Some(athlete) = athlete{
                                athlete.full_name()
                            }else{
                                "".to_string()
                            }
                        }).collect();

                        let mut run_athletes: Vec<Athlete> = vec![];

                        for athlete_name in run_names {
                            let index = all_athletes.iter().position(|r| r.full_name() == athlete_name);
                            match index {
                                Some(idx) => {
                                    run_athletes.push(all_athletes[idx].clone())
                                },
                                None => {
                                    run_athletes.push(Athlete::new("", "", None, "", HashMap::new(), CompetitionType::Decathlon, None, None, None))
                                }
                            }
                            
                        
                        }
                        run_athletes
                    },
                    None => {
                        vec![]
                    }
                };

                let (mut x_coord, num_lines, achievements) = add_athlete_info(&current_layer,
                                                                              &col_widths, i, &run_athletes,
                                                                              discipline, font_size, y_coord,
                                                                              line_height, font, font_bold);


                match achievements {
                    Some(achievement) => {
                        match achievement {
                            Achievement::Time(result) => {
                                let (time, _) = result.fmt_final_result();
                                current_layer.use_text(format!("{}", time), font_size, Mm(x_coord), Mm(y_coord), font_bold);
                            }
                            _ => {}
                        }
                    }
                    None => {}
                }
                x_coord += *col_widths.get("time").expect("Value defined before");
                current_layer.set_outline_thickness(0.5);
                current_layer.add_line(Line {
                    points: vec![
                        (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(y_coord - 1. - line_height * (num_lines - 1.))), false),
                        (Point::new(Mm(x_coord - 1.), Mm(y_coord - 1. - line_height * (num_lines - 1.))), false),
                    ],
                    is_closed: true,
                });
                current_layer.set_outline_thickness(1.);
                y_coord = y_coord - line_height * num_lines;
                add_vertical_lines(&current_layer, &col_widths, initial_y_coord + line_height,
                                   y_coord + line_height - 1.,
                                   vec!["position", "age_group", "starting_number", "name", "time"]);
            }

        }
        if runs.len() >= 6 {
            runs.drain(0..6);
            let (new_page_index, new_layer_index) = add_pdf_page(pdf, "", false);
            current_layer = pdf.get_page(new_page_index).get_layer(new_layer_index);
            y_coord = initial_y_coord;
            // Add header
            x_coord = LEFT_PAGE_EDGE;
            current_layer.use_text("Bahn".to_string(), font_size, Mm(x_coord), Mm(y_coord), font);
            x_coord += *col_widths.get("position").expect("Value defined before");
            current_layer.use_text("AG", font_size, Mm(x_coord), Mm(y_coord), font);
            x_coord += *col_widths.get("age_group").expect("Value defined before");
            current_layer.use_text("#", font_size, Mm(x_coord), Mm(y_coord), font);
            x_coord += *col_widths.get("starting_number").expect("Value defined before");
            current_layer.use_text("Name", font_size, Mm(x_coord), Mm(y_coord), font);
            x_coord += *col_widths.get("name").expect("Value defined before");
            current_layer.use_text("Zeit", font_size, Mm(x_coord), Mm(y_coord), font);
            y_coord -= line_height;
        } else {
            runs.drain(..);
        }
    }
}

fn add_height_discipline(pdf: &PdfDocumentReference, current_layer: PdfLayerReference, font: &IndirectFontRef, font_bold: &IndirectFontRef, group: &Group,
                        discipline: &Discipline) {
    let font_size = 10.0;
    let line_height = font_size * 0.5;
    let initial_y_coord = 175.;

    let mut col_widths = HashMap::new();
    col_widths.insert("position", 6.);
    col_widths.insert("age_group", 12.);
    col_widths.insert("starting_number", 10.);
    col_widths.insert("name", 60.);
    col_widths.insert("height", 15.);
    col_widths.insert("height_try", 5.);
    col_widths.insert("final_result", 25.);

    let columns = vec!["position", "age_group", "starting_number", "name"];

    let (mut start_height , height_increase) = match discipline.name(){ // TODO: Get starting heights from config
        "Hochsprung" => (80, 4),
        "Stabhochsprung" => (120, 20),
        _ => (0, 0)
    };
    add_height_page(current_layer, &col_widths, font_size, line_height, font, font_bold, group,
    discipline, initial_y_coord, columns.clone(), start_height, height_increase);

    // Add second page
    let (page_idx, layer_idx) = add_pdf_page(pdf, "Page 2", true);
    let current_layer = pdf.get_page(page_idx).get_layer(layer_idx);
    add_header(&current_layer, &font_bold, group, discipline, true);
    start_height = start_height + 10 * height_increase;
    add_height_page(current_layer, &col_widths, font_size, line_height, font, font_bold, group,
                    discipline, initial_y_coord, columns.clone(), start_height, height_increase)
}

fn add_height_page(current_layer: PdfLayerReference, col_widths: &HashMap<&str, f32>,
                   font_size: f32, line_height: f32, font: &IndirectFontRef, font_bold: &IndirectFontRef,
                   group: &Group, discipline: &Discipline, initial_y_coord: f32,
                   mut columns: Vec<&str>, start_height: i32, height_increase: i32){
    let mut y_coord = initial_y_coord;
    let mut x_coord = LEFT_PAGE_EDGE;
    current_layer.use_text("".to_string(), font_size, Mm(x_coord), Mm(y_coord), font_bold);
    x_coord += *col_widths.get("position").expect("Value defined before");
    current_layer.use_text("AG", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("age_group").expect("Value defined before");
    current_layer.use_text("#", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("starting_number").expect("Value defined before");
    current_layer.use_text("Name", font_size, Mm(x_coord), Mm(y_coord), font);
    x_coord += *col_widths.get("name").expect("Value defined before");


    let start_height_tries = x_coord;
    let mut num_heights = 0;
    for height_idx in 0..10 {
        let current_height = start_height + height_increase * height_idx;
        current_layer.use_text(format!("{}cm", current_height.to_string()), font_size, Mm(x_coord), Mm(y_coord), font);
        x_coord += *col_widths.get("height").expect("Value defined before");
        columns.push("height");
        num_heights += 1;
    }
    current_layer.use_text("Erreichte Höhe", font_size, Mm(x_coord), Mm(y_coord), font);
    columns.push("final_result");

    y_coord -= line_height + 1.;

    // Add athletes
    let mut athletes = group.athletes().clone();

    match discipline.starting_order() {
        StartingOrder::Default(athlete_order) => {
            athletes.sort_by_key(|item| athlete_order.iter().position(|x| *x.full_name() == *item.full_name()).unwrap());
        }
        _ => {} // leave it the way it is
    };

    for athlete_idx in 0..31{
        let (mut x_coord, num_lines, achievements) = add_athlete_info(&current_layer, &col_widths, athlete_idx, &athletes, discipline, font_size, y_coord,
                                                                      line_height, font, font_bold);

        let mut athlete_start_height = start_height;
        let athlete_tries;
        let mut athlete_tries_vec = vec![];
        let mut athlete_final_result = "".to_string();
        match achievements {
            Some(achievement) => {
                match achievement {
                    Achievement::Height(result) => {
                        athlete_start_height = result.start_height();
                        athlete_tries = result.tries();
                        athlete_tries_vec = athlete_tries.split("-").collect();
                        let (final_result, unit) = result.fmt_final_result();
                        athlete_final_result = format!("{} {}", final_result, unit);
                    }
                    _ => {}
                }
            }
            None => {}
        }

        for height_idx in 0..10{
            let current_height = start_height + height_increase * height_idx;
            let tries_until_height;
            if athlete_tries_vec.len() == 0{
                tries_until_height = 0;
            }else{
                tries_until_height = athlete_start_height + (athlete_tries_vec.len() - 1) as i32 * height_increase;
            }
            let mut height_results;
            if current_height < athlete_start_height  {
                height_results = vec!['-', '-', '-'];
            }else if current_height > tries_until_height {
                height_results = vec![' ', ' ', ' '];
            }else {
                let tries_index = (current_height - athlete_start_height) / height_increase;
                height_results = athlete_tries_vec[tries_index as usize].chars().collect();
                for _ in height_results.len()..3{
                    height_results.push(' ');
                }
            }
            for (_, height_result) in height_results.iter().enumerate(){
                current_layer.use_text(height_result.to_string(), font_size, Mm(x_coord), Mm(y_coord), font);
                x_coord += *col_widths.get("height_try").expect("Value defined before");
            }
        }

        current_layer.use_text(athlete_final_result, font_size, Mm(x_coord), Mm(y_coord), font);
        x_coord += *col_widths.get("final_result").expect("Value defined before");

        current_layer.set_outline_thickness(0.5);
        current_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(y_coord - 1. - line_height * (num_lines - 1.))), false),
                (Point::new(Mm(x_coord - 1.), Mm(y_coord - 1. - line_height * (num_lines - 1.))), false),
            ],
            is_closed: true,
        });
        current_layer.set_outline_thickness(1.);
        y_coord = y_coord - line_height * num_lines;
    }

    current_layer.set_outline_thickness(1.8);
    add_vertical_lines(&current_layer, &col_widths, initial_y_coord - 1.,
                       y_coord + line_height - 1.,
                       columns);

    // add try lines
    current_layer.set_outline_thickness(0.1);
    let mut x_coord = start_height_tries;
    for _ in 0..num_heights * 3 {
        current_layer.add_line(Line {
            points: vec![
                (Point::new(Mm(x_coord - 1.), Mm(initial_y_coord - 1.)), false),
                (Point::new(Mm(x_coord - 1.), Mm(y_coord + line_height - 1.)), false),
            ],
            is_closed: true,
        });
        x_coord += *col_widths.get("height_try").expect("Value defined before");
    }
}

fn add_vertical_lines(pdf_layer: &PdfLayerReference, alignments: &HashMap<&str, f32>, start_y_coord: f32,
                          bottom_y_coord: f32, col_keys: Vec<&str>) {
    // Add Vertical lines and closing line to current page
    let mut x_coord = LEFT_PAGE_EDGE;

    for col_key in col_keys {
        if let Some(alignment_width) = alignments.get(col_key) {
            pdf_layer.add_line(Line {
                points: vec![
                    (Point::new(Mm(x_coord - 1.), Mm(start_y_coord)), false),
                    (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
                ],
                is_closed: true,
            });
            x_coord += alignment_width;
        }
    }

    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(x_coord - 1.), Mm(start_y_coord)), false),
            (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
        ],
        is_closed: true,
    });

    // Add horizontal closing line
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(bottom_y_coord)), false),
            (Point::new(Mm(x_coord - 1.), Mm(bottom_y_coord)), false),
        ],
        is_closed: true,
    });

    // Add horizontal starting line
    pdf_layer.add_line(Line {
        points: vec![
            (Point::new(Mm(LEFT_PAGE_EDGE - 1.), Mm(start_y_coord)), false),
            (Point::new(Mm(x_coord - 1.), Mm(start_y_coord)), false),
        ],
        is_closed: true,
    });
}