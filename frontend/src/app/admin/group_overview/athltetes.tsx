"use client";

import { useEffect, useState } from 'react';
import Achievement from './achievement';
import { LoadingButton } from '@/app/lib/loading_button';
import { decathlon_disciplines } from '@/app/lib/config';
import { Athlete, fetch_age_group_athletes, fetch_group_athletes, sort_athletes } from '@/app/lib/athlete_fetching';

export default function Athletes({ group_name }: { group_name: string }) {
  const [showAthletes, set_showAthletes] = useState(true);

  return (
    <div className="items-center justify-between p-1 w-full">
      <div className='text-2xl font-bold p-2 border rounded-lg '>
        <div className='flex justify-between hover:cursor-pointer' onClick={(_) => set_showAthletes(!showAthletes)}>
          <span>Athlet:innen</span>

          <button
            className="text-right  text-black flex justify-between items-center">
            <svg id="icon1" className={"rotate-180" + (showAthletes ? "rotate-180" : "")} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className={"text-sm 2xl:text-md font-normal overflow-scroll " + (showAthletes ? "sm:max-h-[25rem] 2xl:max-h-[35rem] " : "max-h-0 overflow-hidden")}>
          {(group_name.startsWith("Gruppe") || group_name.startsWith("AK") || group_name.startsWith("M") || group_name.startsWith("W")) && <GroupAthletes group_name={group_name}></GroupAthletes>}
          {group_name.startsWith("U") && <YouthAthletes></YouthAthletes>}
        </div>
      </div>
    </div>

  )
}

function AthleteTableRow({ index, athlete, disciplines, disciplineEdit }:
  { index: number, athlete: Athlete, disciplines: [string, string, string][], disciplineEdit: string }) {
  const achievements = new Map(Object.entries(athlete.achievements));
  const birthdate = new Date(athlete.birth_date * 1000);
  const full_name = athlete.name + "_" + athlete.surname;
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
        window.open(pdfBlobUrl, '_blank');
        onStop()
      })
      .catch(error => {
        console.error('Error fetching or opening the PDF:', error);
      });
  }

  return (
    <tr key={full_name}>
      <td className='border border-slate-800 p-1 pl-2 pr-2'>{athlete.starting_number}</td>
      <td className='border border-slate-800 p-1 pl-2 pr-2'>{athlete.name + " " + athlete.surname}</td>
      <td className='border border-slate-800 p-1 pl-2 pr-2'>{birthdate.getUTCFullYear()}</td>
      <td className='border border-slate-800 p-1 pl-2 pr-2 text-center'>{athlete.total_points}</td>
      {disciplines.map(([name, type]) => {
        return (
          <Achievement key={name} index={index} name={name} athleteName={full_name} achievement={achievements.get(name)} achievement_type={type} editMode={disciplineEdit == name}></Achievement>
        )
      })}
      <td className='border border-slate-800'>
        <LoadingButton size="1.5" onclick={athlete_certificate_print}>
          <svg className="text-slate-600 fill-current " xmlns="http://www.w3.org/2000/svg" height="25" width="25" viewBox="0 0 512 512">
            <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
          </svg>
        </LoadingButton>
      </td>
    </tr>
  )
}


function GroupAthletes({ group_name }: { group_name: string }) {
  const [athletes, set_athletes] = useState<Athlete[]>([]);
  const [disciplineEdit, setDisciplineEdit] = useState("")
  const [sorted, setSorted] = useState({ name: "", ascending: false })

  const get_data = function () {
    if (group_name.startsWith("Gruppe")) {
      fetch_group_athletes(group_name, set_athletes)
    } else {
      fetch_age_group_athletes(group_name, set_athletes)
    }
  }

  // useEffect(() => {
  //   const interval = setInterval(() => get_data(), 2000);
  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, []);

  useEffect(() => {
    var current_index = 0
    document.getElementById(current_index.toString())?.focus();

    const handleEnterKey = function (this: Document, evt: any) {

      if (evt.which == 13) {
        evt.preventDefault();
        current_index += 1;
        if (current_index >= athletes.length) {
          current_index = 0;
        }
        document.getElementById(current_index.toString())?.focus();
      }
    }

    document.addEventListener('keydown', handleEnterKey, true);


    return () => {
      document.removeEventListener('keydown', handleEnterKey);
    };

  }, [disciplineEdit]);


  const discipline_edit_mode = function (selected_discipline: string) {
    let new_discipline = (selected_discipline != disciplineEdit) ? selected_discipline : "";
    setDisciplineEdit(new_discipline)
  }

  useEffect(() => {
    get_data()
  }, [group_name])

  const sortColumn = function (col_name: string) {
    if (sorted.name == col_name) {
      setSorted({ name: col_name, ascending: !sorted.ascending })
    } else {
      setSorted({ name: col_name, ascending: false })
    }
  }

  athletes.sort((a,b) => sort_athletes(a,b,sorted));

  return (
    <table className="table-auto border-collapse w-full text-[1rem] sm:text-[0.8rem] 2xl:text-sm">
      <thead>
        <tr>
          <th onClick={() => sortColumn("#")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>#</span>
            {sorted.name != "#" && <span>&#x25b4;&#x25be;</span>}
            {(sorted.name == "#" && sorted.ascending) && <span>&#x25b4;</span>}
            {(sorted.name == "#" && !sorted.ascending) && <span>&#x25be;</span>}
          </th>
          <th onClick={() => sortColumn("Name")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>Name</span>
            {sorted.name != "Name" && <span>&#x25b4;&#x25be;</span>}
            {(sorted.name == "Name" && sorted.ascending) && <span>&#x25b4;</span>}
            {(sorted.name == "Name" && !sorted.ascending) && <span>&#x25be;</span>}
          </th>
          <th onClick={() => sortColumn("JG")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>JG</span>
            {sorted.name != "JG" && <span>&#x25b4;&#x25be;</span>}
            {(sorted.name == "JG" && sorted.ascending) && <span>&#x25b4;</span>}
            {(sorted.name == "JG" && !sorted.ascending) && <span>&#x25be;</span>}
          </th>
          <th onClick={() => sortColumn("Summe")} className="border border-slate-600 p-1 pl-2 pr-2 hover:cursor-pointer"><span className='pr-1'>Summe</span>
            {sorted.name != "Summe" && <span>&#x25b4;&#x25be;</span>}
            {(sorted.name == "Summe" && sorted.ascending) && <span>&#x25b4;</span>}
            {(sorted.name == "Summe" && !sorted.ascending) && <span>&#x25be;</span>}
          </th>
          {decathlon_disciplines.map((info) => {
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
        {athletes.map((athlete, i) => {
          return <AthleteTableRow key={i} index={i} athlete={athlete} disciplines={decathlon_disciplines} disciplineEdit={disciplineEdit}></AthleteTableRow>
        })}
      </tbody>
    </table>
  )
}

function YouthAthletes() {
  return (
    <div></div>
  )
}
