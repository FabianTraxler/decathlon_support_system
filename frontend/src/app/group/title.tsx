export default function Title({title}:{title:string}){
    return (
        <div className="text-4xl sm:text-6xl font-bold p-2 text-center w-full">
            {title}
        </div>
    )
}