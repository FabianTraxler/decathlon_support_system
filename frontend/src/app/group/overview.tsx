export default function Overview({ groupname, allTabs, changeTab }: { groupname: string, allTabs: string[], changeTab: (name: string) => void }) {
  return (
    <div className="flex flex-col p-4 w-full items-center justify-center">
      <div className="w-fit p-4 rounded border bg-cyan-100 shadow-sm text-4xl font-bold text-center">
        {groupname}
      </div>
      <div className="w-full mt-6">
        {allTabs.map((key) => {
          return (
            <button key={key} onClick={_ => changeTab(key)}
              className="w-full flex justify-between p-4 sm:p-8 mt-4 mb-4 text-2xl border-b-2 
            last:font-bold last:mt-12 last:border-2 last:shadow-lg last:shadow-slate-700 last:rounded-md last:p-6 last:border-none 
            hover:cursor-pointer hover:bg-slate-400 hover:bg-opacity-80">
              <div> {key}</div>
              <div>&gt;</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
