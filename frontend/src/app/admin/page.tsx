import Overview from "./group_overview/group_overview"
import Sidebar from "../lib/sidebar" 

export default function Admin() {
  return (
    <main className="flex min-h-screen flex-col sm:flex-row">
        <Sidebar showGroups={true} showAgeGroups={true} showLateRegister={false}></Sidebar>
        <Overview></Overview>
    </main>
  )
}
