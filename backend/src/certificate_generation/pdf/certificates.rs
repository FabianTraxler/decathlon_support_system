use std::fs::File;
use printpdf::{IndirectFontRef, Mm, PdfDocumentReference, PdfLayerIndex, PdfLayerReference, PdfPageIndex, TextRenderingMode};
use printpdf::BuiltinFont::TimesRoman;
use crate::certificate_generation::{Athlete, competition_order, CompetitionType, Group};
use crate::certificate_generation::pdf::pdf_generation::{add_logo, add_pdf_page, setup_pdf};
use crate::certificate_generation::pdf::{COMPETITION_NUMBER, DATE};

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

fn add_achievements(pdf_layer: &PdfLayerReference, font: &IndirectFontRef, athlete: &Athlete) {
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
            }
            None => {
                pdf_layer.use_text("DNF", font_size, Mm(achievement_align), Mm(current_height), font);

                pdf_layer.use_text("0.0", font_size, Mm(point_align), Mm(current_height), font);
            }
        }
    }

    pdf_layer.end_text_section();
}

pub fn new_group_certificates(group: &Group) -> PdfDocumentReference {
    let (mut pdf, mut page, mut layer) = setup_pdf(format!("Ergebnisse {}", group.name()).as_str(),
                                       false);

    for athlete in group.athletes(){
        pdf = match athlete.competition_type() {
            CompetitionType::Decathlon => new_decathlon_certificate(athlete, pdf, page, layer),
            CompetitionType::Heptathlon => new_heptathlon_certificate(athlete, pdf, page, layer),
            CompetitionType::Triathlon => new_triathlon_certificate(athlete, pdf, page, layer),
            CompetitionType::Pentathlon => new_pentathlon_certificate(athlete, pdf, page, layer)
        };
        (page, layer) = add_pdf_page(&pdf, "", false);
    };

    pdf
}

pub fn get_certificate(athlete: &Athlete) -> PdfDocumentReference {
    let (mut pdf, page, layer) = setup_pdf(format!("Urkunde {}", athlete.full_name()).as_str(),
                                       false);
    pdf = match athlete.competition_type() {
        CompetitionType::Decathlon => new_decathlon_certificate(athlete, pdf, page, layer),
        CompetitionType::Heptathlon => new_heptathlon_certificate(athlete, pdf, page, layer),
        CompetitionType::Triathlon => new_triathlon_certificate(athlete, pdf, page, layer),
        CompetitionType::Pentathlon => new_pentathlon_certificate(athlete, pdf, page, layer)
    };

    pdf
}

fn new_triathlon_certificate(athlete: &Athlete, pdf: PdfDocumentReference, page: PdfPageIndex,
                                 layer: PdfLayerIndex) -> PdfDocumentReference {
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

fn new_pentathlon_certificate(athlete: &Athlete, pdf: PdfDocumentReference, page: PdfPageIndex,
                                  layer: PdfLayerIndex) -> PdfDocumentReference {

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

fn new_heptathlon_certificate(athlete: &Athlete, pdf: PdfDocumentReference, page: PdfPageIndex,
                                  layer: PdfLayerIndex) -> PdfDocumentReference {
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

fn new_decathlon_certificate(athlete: &Athlete, pdf: PdfDocumentReference, page: PdfPageIndex,
                                 layer: PdfLayerIndex) -> PdfDocumentReference {

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
    add_logo(current_layer.clone(), false);

    // Write JZK Heading
    current_layer.set_text_rendering_mode(TextRenderingMode::Fill);
    let font_size = 36.0;
    current_layer.use_text(format!("{COMPETITION_NUMBER}. Favoritner"), font_size, Mm(60.0), Mm(230.0), &font_bold);
    current_layer.use_text("Jedermann Zehnkampf", font_size, Mm(40.0), Mm(215.0), &font_bold);
    current_layer.use_text(format!("{DATE}"), 20.0, Mm(65.0), Mm(205.0), &font);

    add_logo(current_layer.clone(), false);
    add_name(&current_layer, &font_bold, &athlete);
    add_achievements(&current_layer, &font, &athlete);

    // Write JZK Footer
    let font_size = 12.0;
    current_layer.use_text("Veranstalter: STW Favoriten", font_size, Mm(75.0), Mm(25.0), &font);
    current_layer.use_text("www.jedermannzehnkampf.at", font_size, Mm(75.0), Mm(20.0), &font);
    current_layer.use_text("office@jedermannzehnkampf.at", font_size, Mm(75.0), Mm(15.0), &font);

    pdf
}

