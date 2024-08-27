import { signOut } from "@/auth";
import { useContext, useState } from "react";
import { NavigationContext } from "./navigation";
import { LoadingAnimation } from "../lib/loading";

export default function Header({ homescreen }: { homescreen: boolean }) {
  const nav = useContext(NavigationContext)
  const [signingOut, setSigningOut] = useState(false);

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
    <div className="w-full  h-[8%]">
      {homescreen &&
        <div className="flex flex-row items-center justify-end w-full pr-6 pl-6 text-4xl h-full">
          <div onClick={(_) => { setSigningOut(true); signOut() }}
            className="h-fit stroke-black stroke-2 active:stroke-slate-200 active:stroke-3 hover:stroke-3 hover:cursor-pointer flex items-bottom">
            {signingOut ?
              <div className="flex items-center justify-center h-10 w-10">
                <LoadingAnimation></LoadingAnimation>
              </div>
              :
              <svg className="h-10 stroke-inherit" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g strokeWidth="0"></g>
                <g strokeLinecap="round" strokeLinejoin="round"></g>
                <g >
                  <path d="M12 3V12M18.3611 5.64001C19.6195 6.8988 20.4764 8.50246 20.8234 10.2482C21.1704 11.994 20.992 13.8034 20.3107 15.4478C19.6295 17.0921 18.4759 18.4976 16.9959 19.4864C15.5159 20.4752 13.776 21.0029 11.9961 21.0029C10.2162 21.0029 8.47625 20.4752 6.99627 19.4864C5.51629 18.4976 4.36274 17.0921 3.68146 15.4478C3.00019 13.8034 2.82179 11.994 3.16882 10.2482C3.51584 8.50246 4.37272 6.8988 5.6311 5.64001" strokeLinecap="round" strokeLinejoin="round"></path>
                </g>
              </svg>
            }

          </div>
        </div>
      }
      {(!homescreen && nav.history.length > 0) &&
        <div className="flex flex-row items-center justify-between w-full pr-6 pl-6 text-4xl h-full">
          <div onClick={handleBackArrow} className="active:font-bold hover:font-bold hover:cursor-pointer hover:text-slate-400 font-bold">
            <span>&#8592;</span>
          </div>
        </div>
      }
      <div>

      </div>
    </div>
  );
}
