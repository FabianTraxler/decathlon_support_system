pub use printpdf::PdfDocumentReference;
use printpdf::{Mm, PdfDocument, PdfLayerIndex, PdfPageIndex, image_crate, Image, ImageTransform, PdfLayerReference};
use printpdf::BuiltinFont::TimesRoman;
use std::fs::File;
use std::io::BufReader;

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


pub fn new_triathlon_certificate(athlete: &Athlete) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Urkunde {}", athlete.name()).as_str(),
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

    // Add Logo
    add_logo(pdf.get_page(page).get_layer(layer), false);

    // Write Name
    current_layer.begin_text_section();
    current_layer.set_font(&font, 36.0);
    current_layer.set_text_cursor(Mm(90.0), Mm(180.0));
    current_layer.write_text(athlete.name(), &font);
    current_layer.add_line_break();
    current_layer.end_text_section();

    pdf
}

pub fn new_pentathlon_certificate(athlete: &Athlete) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Urkunde {}", athlete.name()).as_str(),
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

    // Add Logo
    add_logo(pdf.get_page(page).get_layer(layer), false);

    // Write Name
    current_layer.begin_text_section();
    current_layer.set_font(&font, 36.0);
    current_layer.set_text_cursor(Mm(90.0), Mm(180.0));
    current_layer.write_text(athlete.name(), &font);
    current_layer.add_line_break();
    current_layer.end_text_section();

    pdf
}

pub fn new_decathlon_certificate(athlete: &Athlete) -> PdfDocumentReference {
    let (pdf, page, layer) = setup_pdf(format!("Urkunde {}", athlete.name()).as_str(),
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

    // Add Logo
    add_logo(pdf.get_page(page).get_layer(layer), false);

    // Write Name
    current_layer.begin_text_section();
    current_layer.set_font(&font, 36.0);
    current_layer.set_text_cursor(Mm(90.0), Mm(180.0));
    current_layer.write_text(athlete.name(), &font);
    current_layer.add_line_break();
    current_layer.end_text_section();

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

    pdf
}