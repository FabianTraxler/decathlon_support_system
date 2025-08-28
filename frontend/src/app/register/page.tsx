import Sidebar from "../lib/sidebar" 
import Overview from "./overview"


export default function Admin() {
  return (
    <main className="flex min-h-screen max-h-screen flex-col sm:flex-row overflow-scroll">
        <Sidebar showGroups={true} showAgeGroups={false} showLateRegister={false} showTeams={true}></Sidebar>
        <Overview></Overview>
    </main>
  )
}
