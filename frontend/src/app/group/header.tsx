import { signOut } from "@/auth";

export default function Header({ homescreen, TabHistory, setTab }: { homescreen: boolean, TabHistory: string[], setTab: (tabs: string[]) => void }) {

  const handleBackArrow = function(){
    if (TabHistory.length <= 1) {
      TabHistory = ["overview"]
    } else {
      TabHistory.pop()
    }
      setTab([...TabHistory])
  }

  // TODO: Add Loading Animation on Click to logout and Back-Arrow
  return (
    <div className="flex flex-row justify-between w-full h-[5%] p-3 pr-6 pl-6 text-4xl">
      {homescreen &&
        <div onClick={(_) => signOut()} className="active:font-bold hover:font-bold hover:cursor-pointer hover:text-slate-400 ">
          &#x23FB;
        </div>
      }
      {!homescreen &&
        <div onClick={handleBackArrow} className="active:font-bold hover:font-bold hover:cursor-pointer hover:text-slate-400 font-bold">
          <span>&#8592;</span>
        </div>
      }
      <div>
        &#x1F50E;&#xFE0E;
      </div>
    </div>
  );
}
