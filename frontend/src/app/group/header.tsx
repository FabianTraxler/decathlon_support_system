import { signOut } from "@/auth";
import { useContext } from "react";
import { NavigationContext } from "./page";

export default function Header({ homescreen }: { homescreen: boolean }) {
  const nav = useContext(NavigationContext)

  const handleBackArrow = function () {
    if (nav.history.length <= 1) {
      nav.tab_navigation_function({ name: "overview", reset_function: () => { } })
    } else {
      let item = nav.history.pop()
      if (item) {
        item.reset_function()
      }
    }
  }

  // TODO: Add Loading Animation on Click to logout and Back-Arrow
  return (
    <div className="flex flex-row justify-between w-full h-[5%] p-3 pr-6 pl-6 text-4xl">
      {homescreen &&
        <div onClick={(_) => signOut()} className="active:font-bold hover:font-bold hover:cursor-pointer hover:text-slate-400 flex items-bottom">
          <svg className="h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path d="M12 3V12M18.3611 5.64001C19.6195 6.8988 20.4764 8.50246 20.8234 10.2482C21.1704 11.994 20.992 13.8034 20.3107 15.4478C19.6295 17.0921 18.4759 18.4976 16.9959 19.4864C15.5159 20.4752 13.776 21.0029 11.9961 21.0029C10.2162 21.0029 8.47625 20.4752 6.99627 19.4864C5.51629 18.4976 4.36274 17.0921 3.68146 15.4478C3.00019 13.8034 2.82179 11.994 3.16882 10.2482C3.51584 8.50246 4.37272 6.8988 5.6311 5.64001" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            </g>
          </svg>
        </div>
      }
      {(!homescreen && nav.history.length > 0) &&
        <div onClick={handleBackArrow} className="active:font-bold hover:font-bold hover:cursor-pointer hover:text-slate-400 font-bold">
          <span>&#8592;</span>
        </div>
      }
      <div>

      </div>
    </div>
  );
}
