import Title_Footer_Layout from "./subpage_layout";
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/InnerImageZoom/styles.css'

export default function Field() {
    return (
        <Title_Footer_Layout title="Platzübersicht">
            <div className="flex mt-12 w-screen items-center justify-center">
                <InnerImageZoom
                    src="/images/Platz_klein.jpg"
                    width={800}
                    height={800}
                    className="w-full h-fit"
                ></InnerImageZoom>
            </div>
        </Title_Footer_Layout>
    )
}