import Overview from "./group_overview/group_overview"
import Sidebar from "./sidebar" 

export default function Admin() {
  return (
    <main className="flex min-h-screen flex-col sm:flex-row">
        <Sidebar></Sidebar>
        <Overview></Overview>
    </main>
  )
}
