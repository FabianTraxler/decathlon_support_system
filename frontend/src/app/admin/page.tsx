"use client";

import Overview from "./group_overview/group_overview"
import Sidebar from "../lib/sidebar" 
import { useState} from "react"
import { SearchQuery } from "../lib/search"


export default function Admin() {
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({global: false, queries: []})
  
  return (
    <main className="flex min-h-screen flex-col sm:flex-row">
        <Sidebar showGroups={true} showAgeGroups={true} showLateRegister={false} updateSearchQuery={setSearchQuery}></Sidebar>
        <Overview searchQuery={searchQuery}></Overview>
    </main>
  )
}
