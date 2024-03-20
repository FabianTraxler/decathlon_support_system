import Footer from "./footer";
import Title from "./title";

export default function Title_Footer_Layout({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="grid grid-rows-10 sm:grid-rows-12 h-[99%] w-full p-2 sm:p-8">
            <div className="flex items-center">
                <Title title={title}></Title>
            </div>
            <div className="row-span-7 sm:row-span-9 flex flex-col items-top justify-top">
                {children}
            </div>
            <div className="flex items-center justify-center sm:row-span-2">
                <Footer></Footer>
            </div>
        </div>
    )
}