import Overview from "./overview"
import Sidebar from "../lib/sidebar" 

export default function Admin() {
  return (
    <main className="flex min-h-screen flex-col sm:flex-row">
        <Sidebar showGroups={true} showAgeGroups={false} showLateRegister={false}></Sidebar>
        <Overview></Overview>
    </main>
  )
}
