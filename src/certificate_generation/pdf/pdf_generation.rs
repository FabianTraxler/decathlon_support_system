pub use printpdf::PdfDocumentReference;
use printpdf::{Mm, PdfDocument, PdfLayerIndex, PdfPageIndex, image_crate, Image, ImageTransform, PdfLayerReference, IndirectFontRef};
use printpdf::BuiltinFont::TimesRoman;
use std::fs::File;
use std::io::BufReader;
use crate::certificate_generation::competition_order;

use crate::certificate_generation::athletes::Athlete;
use crate::certificate_generation::groups::Group;


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
        image_transform.translate_x = Some(Mm(247.0));
        image_transform.translate_y = Some(Mm(160.0));
    } else {
        image_transform.translate_x = Some(Mm(160.0));
        image_transform.translate_y = Some(Mm(247.0));
    }

    image_transform.scale_x = Some(0.13);
    image_transform.scale_y = Some(0.13);
    //image_transform.dpi = Some(1000.);

    image.add_to_layer(layer, image_transform);
}


fn add_name(pdf_layer: &PdfLayerReference, font: &IndirectFontRef, athlete: &Athlete) {
    // Define font metrics
    let font_size = 36.0;
    let avg_font_width = 5.33; // Manually measured
    let name = athlete.full_name();
    let x_pos = 105.0 - name.len() as f32 / 2.0 * avg_font_width;

    pdf_layer.begin_text_section();
    pdf_layer.set_font(font, font_size);
    pdf_layer.set_text_cursor(Mm(x_pos), Mm(240.0));
    pdf_layer.write_text(name, font);
    pdf_layer.add_line_break();
    pdf_layer.end_text_section();
}

fn add_achievements(pdf_layer: &PdfLayerReference,font: &IndirectFontRef, athlete: &Athlete) {
    // Define font metrics
    let font_size = 20.0;
    let line_height = font_size * 0.5;
    let name_align = 20.0;
    let achievement_align = 100.0;
    let point_align = 180.0;
    let start_height = 200.0;

    pdf_layer.begin_text_section();
    pdf_layer.set_font(font, font_size);

    for (i, discipline_name) in competition_order(athlete.competition_type()).iter().enumerate() {
        let current_height = start_height - line_height * i as f32;
        pdf_layer.use_text(discipline_name.to_string(), font_size, Mm(name_align), Mm(current_height), font);
        match athlete.get_achievement(discipline_name) {
            Some(achievement) => {
                pdf_layer.use_text(achievement.final_result().to_string(), font_size, Mm(achievement_align), Mm(current_height), font);

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
    add_achievements(&current_layer, &font, &athlete);
    pdf
}

pub fn new_group_result(group: &Group) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Ergebniss {}", group.name()).as_str(),
                                       true);

    let current_layer = pdf.get_page(page).get_layer(layer);

    let font = pdf.add_builtin_font(TimesRoman)
        .expect("Builtin Font should be available");

    // Write Heading
    current_layer.begin_text_section();
    current_layer.set_font(&font, 42.0);
    current_layer.set_text_cursor(Mm(90.0), Mm(180.0));
    current_layer.write_text(format!("Ergebnisse {} ", group.name()).as_str(), &font);
    current_layer.add_line_break();
    current_layer.end_text_section();

    // Add Logo
    add_logo(pdf.get_page(page).get_layer(layer), true);

    current_layer.begin_text_section();
    let font_size = 14.0;
    let line_height = font_size * 0.5;
    let name_align = 20.0;
    let start_height = 160.0;

    current_layer.set_font(&font, font_size);

    for (i, athlete) in group.athletes().iter().enumerate() {
        let current_height = start_height - line_height * i as f32;
        current_layer.use_text(athlete.full_name(), font_size, Mm(name_align), Mm(current_height), &font);
    }
    current_layer.end_text_section();


    pdf
}