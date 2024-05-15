pub use printpdf::PdfDocumentReference;
use printpdf::{Mm, Pt, PdfDocument, PdfLayerIndex, PdfPageIndex, PdfLayerReference, SvgTransform};

const A4_HEIGHT: f32 = 297.0;
const A4_WIDTH: f32 = 210.0;

pub const LEFT_PAGE_EDGE: f32 = 10.;

pub fn setup_pdf(
    name: &str,
    landscape: bool,
) -> (PdfDocumentReference, PdfPageIndex, PdfLayerIndex) {
    let width;
    let height;
    if landscape {
        width = A4_HEIGHT;
        height = A4_WIDTH;
    } else {
        width = A4_WIDTH;
        height = A4_HEIGHT;
    }
    PdfDocument::new(name, Mm(width), Mm(height), "Layer 1")
}

pub fn add_pdf_page(
    pdf: &PdfDocumentReference,
    name: &str,
    landscape: bool,
) -> (PdfPageIndex, PdfLayerIndex) {
    let width;
    let height;
    if landscape {
        width = A4_HEIGHT;
        height = A4_WIDTH;
    } else {
        width = A4_WIDTH;
        height = A4_HEIGHT;
    }
    pdf.add_page(Mm(width), Mm(height), name)
}

pub fn add_logo(layer: PdfLayerReference, landscape: bool) {
    // let image_file = File::open("assets/img/Logo_STW.jpg")
    //     .expect("Logo should be available");
    // let mut image_file = BufReader::new(image_file);
    //
    // let image = Image::try_from(image_crate::codecs::jpeg::JpegDecoder::new(&mut image_file)
    //     .expect("Image should be png"))
    //     .expect("Image should be convertible to Image class");

    let logo_svg_string = std::fs::read_to_string("assets/img/logo_stw.svg")
        .expect("Logo should be available");
    let logo = printpdf::svg::Svg::parse(&logo_svg_string).
        expect("Logo should be readable");

    let mut image_transform = SvgTransform::default();
    if landscape {
        image_transform.translate_x = Some(Pt(750.0));
        image_transform.translate_y = Some(Pt(515.0));
        image_transform.scale_x = Some(0.08);
        image_transform.scale_y = Some(0.08);
    } else {
        image_transform.translate_x = Some(Pt(460.0));
        image_transform.translate_y = Some(Pt(710.0));
        image_transform.scale_x = Some(0.13);
        image_transform.scale_y = Some(0.13);
    }

    logo.add_to_layer(&layer, image_transform);
    //image_transform.dpi = Some(1000.);

    //image.add_to_layer(layer, image_transform);
}
