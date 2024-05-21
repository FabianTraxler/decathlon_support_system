import Footer from "./footer";
import Title from "./title";

export default function Title_Footer_Layout({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="grid grid-rows-10 h-[95%] w-full p-2 sm:p-8">
            <div className="flex items-center row-span-1">
                <Title title={title}></Title>
            </div>
            <div className="row-span-8 sm:row-span-9 flex flex-col items-top justify-top pb-4">
                {children}
            </div>
            <div className="flex items-center justify-center row-span-1">
                <Footer></Footer>
            </div>
        </div>
    )
}