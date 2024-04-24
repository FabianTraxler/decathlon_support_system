import { createContext, useContext, useEffect, useState } from "react";

export interface NavigationItem {
    name: string,
    reset_function: () => void
}

let empty_nav_item = { name: "", reset_function: () => { } } as NavigationItem

export interface Navigation {
    history: NavigationItem[],
    max_history: number,
    tab_navigation_function: (tab: NavigationItem) => void
}
let empty_nav = { history: [], max_history: 0, tab_navigation_function: (empty_nav_item) => { } } as Navigation
export const NavigationContext = createContext<Navigation>(empty_nav)