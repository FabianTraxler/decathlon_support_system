import { useContext } from "react";
import { NavigationContext } from "./navigation";

export default function Footer() {
  const nav = useContext(NavigationContext)

  return (
    <div onClick={() => {nav.tab_navigation_function({name: "overview", reset_function: () => {}})}} 
    className="flex font-bold w-full items-center justify-center text-center
      active:font-bold hover:font-bold hover:cursor-pointer hover:text-slate-400 ">
      <svg className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z" />
      </svg>
    </div>
  );
}
