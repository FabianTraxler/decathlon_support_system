"use client";

import Overview from "./group_overview/group_overview"
import Sidebar from "../lib/sidebar" 
import { useState} from "react"
import { SearchQuery } from "../lib/search"
import { useSearchParams } from 'next/navigation';


export default function Admin() {
  let searchParams = useSearchParams();
  let athlete_query = searchParams.get('athlete_query') ?? "";

  let current_query: SearchQuery = {
    global: false, 
    queries: []
  }
  if (athlete_query) {

    athlete_query.split(";").forEach(q => {
      let [column, query] = q.split(":")
      current_query.queries.push({column: column, query: query})
    })
  }
  const [searchQuery, setSearchQuery] = useState<SearchQuery>(current_query)

  return (
    <main className="flex min-h-screen flex-col sm:flex-row">
        <Sidebar showGroups={true} showAgeGroups={true} showLateRegister={false} showTeams={true} updateSearchQuery={setSearchQuery} searchQuery={searchQuery}></Sidebar>
        <Overview searchQuery={searchQuery}></Overview>
    </main>
  )
}
