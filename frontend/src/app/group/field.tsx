import Image from "next/image";
import Title_Footer_Layout from "./subpage_layout";

export default function Field() {
    return (
        <Title_Footer_Layout title="Platzübersicht">
            <div className="flex mt-12 w-screen items-center justify-center">
                <Image
                    src="/images/Platz_klein.jpg"
                    width={200}
                    height={800}
                    alt="Sportplatz Übersicht"
                    objectFit="contain"
                    className="w-full h-fit"
                ></Image>
            </div>
        </Title_Footer_Layout>
    )
}