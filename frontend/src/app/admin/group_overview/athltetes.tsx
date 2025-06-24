"use client";

import { useEffect, useState } from 'react';
import Achievement from './achievement';
import { LoadingAnimation, LoadingButton } from '@/app/lib/loading';
import { decathlon_disciplines, groups, hepathlon_disciplines, pentathlon_disciplines, triathlon_discplines, youth_groups } from '@/app/lib/config';
import { Athlete, fetch_age_group_athletes, fetch_group_athletes, sort_athletes, fetch_all_athletes } from '@/app/lib/athlete_fetching';
import { PopUp } from '@/app/lib/achievement_edit/popup';
import { AthleteID, Discipline } from '@/app/lib/interfaces';
import { useSearchParams } from 'next/navigation';
import { AthleteQuery, SearchQuery } from '@/app/lib/search';

export default function Athletes({ group_name, query, show_athletes = false }: { group_name: string,  query?: SearchQuery, show_athletes?: boolean}) {
  const [showAthletes, set_showAthletes] = useState(show_athletes);

  return (
    <div className="items-center justify-between p-1 w-full ">
      <div className='text-2xl font-bold p-4 border rounded-lg shadow-lg '>
        <div className='flex justify-between hover:cursor-pointer' onClick={(_) => set_showAthletes(!showAthletes)}>
          <span>Athlet:innen</span>

          <button
            className="text-right  text-black flex justify-between items-center">
            <svg id="icon1" className={"rotate-180" + (showAthletes ? "rotate-180" : "")} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className={"text-sm 2xl:text-md font-normal overflow-x-scroll " + (showAthletes ? " h-full" : "max-h-0 overflow-hidden")}>
          <GroupAthletes group_name={group_name} query={query}></GroupAthletes>
        </div>
      </div>
    </div>

  )
}


function GroupAthletes({ group_name, query }: { group_name: string, query?: SearchQuery }) {
  const [athleteState, set_athleteState] = useState<{ 
    allAthletes: Athlete[], 
    selectedAthletes?: Athlete[] |  null, 
    disciplines: [string, string, string][],
    sort_by: string,
    sort_ascending: boolean
  }>({ 
    allAthletes: [], 
    selectedAthletes: null, 
    disciplines: [],
    sort_by: "Name",
    sort_ascending: true
  });
  const [disciplineEdit, setDisciplineEdit] = useState<{ discipline: string, athlete_order: string[] }>({ discipline: "", athlete_order: [] })
  //const [sorted, setSorted] = useState({ name: "Name", ascending: true })

  const discipline_edit_mode = function (selected_discipline: string) {
    if (selected_discipline != disciplineEdit.discipline) {
      if (group_name.startsWith("G") || group_name.startsWith("U")) {
        let athlete_order: string[] = []
        fetch(`/api/discipline?group_name=${group_name}&discipline_name=${selected_discipline}`)
          .then(res => {
            if (res.ok) {
              return res.json()
            } else {
              throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
            }
          })
          .then(res => {
            let discipline: Discipline = res;
            let starting_order = discipline.starting_order;
            if (typeof starting_order != "string") {
              if (starting_order.Track) {
                let runs = starting_order.Track
                runs.forEach(run => {
                  run.athletes.forEach(athlete =>
                    athlete_order.push(athlete?.name + "_" + athlete?.surname)
                  )
                })
              } else if (starting_order.Default) {
                starting_order.Default.forEach(athlete =>
                  athlete_order.push(athlete.name + "_" + athlete.surname)
                )
              }
            }
            setDisciplineEdit({
              discipline: selected_discipline,
              athlete_order: athlete_order
            })
          })
          .catch(e => {
            console.error(e)
          })
      } else {
        setDisciplineEdit({
          discipline: selected_discipline,
          athlete_order: []
        })
      }
    } else {
      setDisciplineEdit({
        discipline: "",
        athlete_order: []
      })
    }
  }

  useEffect(() => {
    const getData = function () {
      if (group_name.startsWith("Gruppe")) {
        fetch_group_athletes(group_name, (athletes: Athlete[]) => {
          set_athleteState((prevState) => ({ ...prevState, allAthletes: sortAthletes(athletes, prevState.sort_by, prevState.sort_ascending), disciplines: decathlon_disciplines }))
        })
      } else if (group_name.startsWith("U")) {
        var disciplines: [string, string, string][] = [];
        if (group_name == "U16") {
          disciplines = hepathlon_disciplines;
        } else if (["U14/U16", "U14"].includes(group_name)) {
          disciplines = pentathlon_disciplines;
        } else {
          disciplines = triathlon_discplines
        }
        fetch_group_athletes(group_name, (athletes: Athlete[]) => {
          set_athleteState((prevState) => ({ ...prevState, allAthletes: sortAthletes(athletes, prevState.sort_by, prevState.sort_ascending), disciplines: disciplines }))
        })

      }else if (group_name == "all") 
      {
        fetch_all_athletes((athletes: Athlete[]) => {
          set_athleteState((prevState) => ({ ...prevState, allAthletes: sortAthletes(athletes, prevState.sort_by, prevState.sort_ascending), disciplines: [] }))
        })
      } else {
        fetch_age_group_athletes(group_name, (athletes: Athlete[]) => {
          set_athleteState((prevState) => ({ ...prevState, allAthletes: sortAthletes(athletes, prevState.sort_by, prevState.sort_ascending), disciplines: decathlon_disciplines }))
        })
      }
    }

    getData()
    const interval = setInterval(() => getData(), 2000)

    return () => clearInterval(interval)
  }, [group_name])
  

  const sortColumn = function (col_name: string) {
    if (athleteState.sort_by == col_name) {
      set_athleteState((prevState) => ({ ...prevState, sort_by: col_name, sort_ascending: !athleteState.sort_ascending }))
    } else {
      set_athleteState((prevState) => ({ ...prevState, sort_by: col_name, sort_ascending: false }))
    }
  }

  const sortAthletes = function (athletes: Athlete[], sort_by: string, sort_ascending: boolean): Athlete[] {
    if (disciplineEdit.discipline == "" || disciplineEdit.athlete_order.length == 0) {
      athletes.sort((a, b) => sort_athletes(a, b, {name: sort_by, ascending: sort_ascending}));
    } else {
      // sort athletes like the discipline athlete order for easier manual input
      athletes.sort((a, b) => disciplineEdit.athlete_order.indexOf(a.name + "_" + a.surname) - disciplineEdit.athlete_order.indexOf(b.name + "_" + b.surname))
    }
    return athletes
  }

  let selectedAthletes = [];

  if(query != null){
    let athlete_query = new AthleteQuery(query)
    let selected_athletes: Athlete[] = [];

    athleteState.allAthletes.forEach(athlete => {
        if (athlete_query.matchAthlete(athlete)) {
            selected_athletes.push(athlete)
        } 
      });
      
    selectedAthletes = sortAthletes(selected_athletes, athleteState.sort_by, athleteState.sort_ascending)
  }else{
    selectedAthletes = sortAthletes(athleteState.allAthletes, athleteState.sort_by, athleteState.sort_ascending)
  }

  return (
    <table className="table-auto border-collapse w-full text-[1rem] sm:text-[0.8rem] 2xl:text-sm">
      <thead>
        <tr>
          <th onClick={() => sortColumn("#")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>#</span>
            {athleteState.sort_by != "#" && <span>&#x25b4;&#x25be;</span>}
            {(athleteState.sort_by == "#" && athleteState.sort_ascending) && <span>&#x25b4;</span>}
            {(athleteState.sort_by == "#" && !athleteState.sort_ascending) && <span>&#x25be;</span>}
          </th>
          <th onClick={() => sortColumn("age_group")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>Klasse</span>
            {athleteState.sort_by != "age_group" && <span>&#x25b4;&#x25be;</span>}
            {(athleteState.sort_by == "age_group" && athleteState.sort_ascending) && <span>&#x25b4;</span>}
            {(athleteState.sort_by == "age_group" && !athleteState.sort_ascending) && <span>&#x25be;</span>}
          </th>
          <th onClick={() => sortColumn("Name")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>Name</span>
            {athleteState.sort_by != "Name" && <span>&#x25b4;&#x25be;</span>}
            {(athleteState.sort_by == "Name" && athleteState.sort_ascending) && <span>&#x25b4;</span>}
            {(athleteState.sort_by == "Name" && !athleteState.sort_ascending) && <span>&#x25be;</span>}
          </th>
          <th onClick={() => sortColumn("JG")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>JG</span>
            {athleteState.sort_by != "JG" && <span>&#x25b4;&#x25be;</span>}
            {(athleteState.sort_by == "JG" && athleteState.sort_ascending) && <span>&#x25b4;</span>}
            {(athleteState.sort_by == "JG" && !athleteState.sort_ascending) && <span>&#x25be;</span>}
          </th>
          <th onClick={() => sortColumn("Summe")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>Summe</span>
            {athleteState.sort_by != "Summe" && <span>&#x25b4;&#x25be;</span>}
            {(athleteState.sort_by == "Summe" && athleteState.sort_ascending) && <span>&#x25b4;</span>}
            {(athleteState.sort_by == "Summe" && !athleteState.sort_ascending) && <span>&#x25be;</span>}
          </th>
          {athleteState.disciplines.map((info) => {
            return <th key={info[0]} onClick={(_) => {
              discipline_edit_mode(info[0])
            }}
              className="border hover:cursor-pointer hover:bg-slate-400 border-slate-600 p-1 pl-2 pr-2">{info[2]}
              <span className='pl-2 '>&#9998;</span></th>

          })}
          <th className="border border-slate-600 p-1 pl-2 pr-2">Urkunde</th>
        </tr>
      </thead>
      <tbody>
        {
          selectedAthletes.map((athlete, i) => {
                return <AthleteTableRow key={i} index={i} athlete={athlete} disciplines={athleteState.disciplines}
                  disciplineEdit={disciplineEdit.discipline}></AthleteTableRow>
          })
        }
          
      </tbody>
    </table>
  )
}


function AthleteTableRow({ index, athlete, disciplines, disciplineEdit }:
  { index: number, athlete: Athlete, disciplines: [string, string, string][], disciplineEdit: string }) {
  const [popupOpen, setPopupOpen] = useState(false)
  var achievements = new Map(Object.entries(athlete.achievements));
  const birthdate = new Date(athlete.birth_date * 1000);
  let age_group_number: number | string = Math.floor((new Date().getFullYear() - birthdate.getUTCFullYear()) / 10) * 10;
  age_group_number = age_group_number < 40 ? "" : age_group_number
  const full_name = athlete.name + "_" + athlete.surname;
  const age_group = athlete.gender + age_group_number

  const athlete_certificate_print = function (onStop: () => void) {
    fetch(`/api/certificate?name=${athlete.name}&surname=${athlete.surname}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create a blob URL for the PDF
        const pdfBlobUrl = URL.createObjectURL(blob);

        // Open the PDF in a new window
        //window.open(pdfBlobUrl, '_blank');

        var link = document.createElement("a");
        link.href = pdfBlobUrl;
        link.download = `Urkunde: ${athlete.name} ${athlete.surname}`
        link.click();

        onStop()
      })
      .catch(error => {
        console.error('Error fetching or opening the PDF:', error);
      });
  }

  return (
    <tr key={full_name}>
      <td className='border border-slate-800 p-1 pl-2 pr-2'>{athlete.starting_number}</td>
      <td className='border border-slate-800 p-1 pl-2 pr-2'>{age_group}</td>
      <td className='border border-slate-800 p-1 pl-2 pr-2 hover:bg-slate-400 hover:cursor-pointer' onClick={() => setPopupOpen(true)}>{athlete.name + " " + athlete.surname}</td>
      <td className='border border-slate-800 p-1 pl-2 pr-2'>{birthdate.getUTCFullYear() || ""}</td>
      <td className='border border-slate-800 pl-2 pr-2 text-center'><div className='p-1'>{athlete.total_points}</div></td>
      {disciplines.map(([name, type]) => {
        return (
          <Achievement key={name} index={index} name={name}
            athleteName={full_name} achievement={achievements.get(name)} achievement_type={type}
            editMode={disciplineEdit == name}></Achievement>
        )
      })}
      <td className='border border-slate-800'>
        <LoadingButton size="1.5" onclick={athlete_certificate_print}>
          <svg className="text-slate-600 fill-current " xmlns="http://www.w3.org/2000/svg" height="25" width="25" viewBox="0 0 512 512">
            <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
          </svg>
        </LoadingButton>
        {
          popupOpen &&
          <PopUp title="Athleten Einstellungen" onClose={() => setPopupOpen(false)}>
            <AthleteEditPopup athlete={athlete} onClose={() => setPopupOpen(false)}></AthleteEditPopup>

          </PopUp>
        }
      </td>
    </tr>
  )
}

function AthleteEditPopup({ athlete, onClose }: { athlete: Athlete, onClose: () => void }) {
  const birthdate = new Date(athlete.birth_date * 1000);
  const [birthyear, changeBirthyear] = useState<number | string>(birthdate.getFullYear())
  const [startingNumber, changeStartingNumber] = useState<number | string>(athlete.starting_number)

  let searchParams = useSearchParams();
  const groupName = searchParams.get('group') ?? "";
  const [newGroup, changeNewGroup] = useState<string>(groupName)

  const deleteAthlete = function () {
    if (confirm("Athlet:in löschen?")) {
      fetch(`/api/athlete?name=${athlete.name}&surname=${athlete.surname}`, {
        method: "DELETE"
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
          }
          alert("Athlet:in gelöscht")
        })
        .catch(error => {
          console.error('Error deleting Athlete:', error);
        });
    }
  }
  const handleStartingNumberChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value.length == 0) {
      changeStartingNumber("")
    } else {
      let starting_number = parseInt(e.target.value);
      if (starting_number) {
        changeStartingNumber(starting_number)
      } else {
        alert("Invalid format")
        changeStartingNumber("")
      }
    }

  }
  const handleBirthyearChange = function (e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value.length == 0) {
      changeBirthyear("")
    } else {
      let birth_year = parseInt(e.target.value);
      if (birth_year) {
        changeBirthyear(birth_year)
      } else {
        alert("Invalid format")
        changeBirthyear("")
      }
    }
  }
  const handleGroupChange = function (e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value.length == 0) {
      changeNewGroup("")
    }
     else {
      changeNewGroup(e.target.value)
    }
  }

  const saveStartingNumber = function (stop_load: () => void) {
    fetch(`/api/athlete?name=${athlete.name}&surname=${athlete.surname}`, {
      method: "PUT",
      body: JSON.stringify({
        starting_number: startingNumber
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        stop_load()
      })
      .catch(error => {
        console.error('Error deleting Athlete:', error);
      });
  }

  const saveBirhyear = function (stop_load: () => void) {
    let birth_year = birthyear;
    if (typeof birth_year == "string") {
      birth_year = 0
    }
    birthdate.setFullYear(birth_year)
    let birth_date_utc_sec = birthdate.getTime() / 1000;
    fetch(`/api/athlete?name=${athlete.name}&surname=${athlete.surname}`, {
      method: "PUT",
      body: JSON.stringify({
        birth_date: birth_date_utc_sec
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        stop_load()
      })
      .catch(error => {
        console.error('Error deleting Athlete:', error);
      });
  }

  const switchGroup = function (stop_load: () => void) {
    if (newGroup.includes("U")){
      // Yotuh group
            // 2. Check if group matches birth year
      let max_age;
      if(newGroup == "U4/U6"){
        max_age = 6
      }else {
        max_age = parseInt(newGroup.replace("U", "")) || 16
      }
      
      let age = new Date().getFullYear() - ((typeof birthyear == "string") ? parseInt(birthyear) : birthyear)
      if (age >= max_age || age < max_age - 2){
        alert("Falsche Alterklasse ausgewählt")
        stop_load()
        return
      }
    }

    fetch(`/api/switch_group?to=${newGroup}&from=${groupName}`, {
      method: "PUT",
      body: JSON.stringify({
        athlete_ids: [
          {
            name: athlete.name,
            surname: athlete.surname
          }
        ]
      })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        stop_load()
        onClose()
      })
      .catch(error => {
        console.error('Error deleting Athlete:', error);
      });
  }


  return (
    <div className='p-2'>
      <div className='flex flex-row'>
        <div className='mr-2 font-bold'>Name:</div>
        <div>{athlete.name} {athlete.surname}</div>
      </div>
      <div className='grid grid-cols-3'>
        <div className='mr-2 font-bold'>Startnummer:</div>
        <input
          className={'border-black border rounded w-16 text-center shadow-md ' + (startingNumber == "-" && "bg-red-200")}
          value={startingNumber}
          onChange={handleStartingNumberChange}
        ></input>
        <div className='text-lg'>
          <LoadingButton size={"2"} onclick={saveStartingNumber} >&#9989;</LoadingButton>
        </div>
      </div>
      <div className='grid grid-cols-3'>
        <div className='mr-2 font-bold'>Geburtsjahr:</div>
        <input
          className='border-black border rounded w-16 text-center shadow-md'
          value={birthyear}
          onChange={handleBirthyearChange}
        ></input>
        <div className='text-lg'>
          <LoadingButton size={"2"} onclick={saveBirhyear} >&#9989;</LoadingButton>
        </div>
      </div>
      <div className='grid grid-cols-3'>
        <div className='mr-2 font-bold'>Gruppe wechseln:</div>
        <select
          className='border-black border rounded w-24 text-center shadow-md'
          onChange={handleGroupChange}
          defaultValue={groupName}
        >
          {groupName.includes("Gruppe") &&
            groups.map(group_number => {
              return (
                <option key={group_number}>Gruppe {group_number}</option>
              )
            })
          }
          {groupName.includes("U") &&
            youth_groups.map(group_name => {
              return (
                <option key={group_name}>{group_name}</option>
              )
            })
          }
        </select>
        <div className='text-lg'>
          <LoadingButton size={"2"} onclick={switchGroup} >&#9989;</LoadingButton>
        </div>
      </div>
      <div className='flex justify-end mt-5'>
        <div
          className='p-2 font-bold shadow-lg bg-red-500 rounded-md'
          onClick={deleteAthlete}
        >
          Löschen
        </div>
      </div>

    </div>
  )
}


