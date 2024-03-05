"use client";

import { german_discipline_states } from '@/app/lib/config';
import { LoadingButton } from '@/app/lib/loading_button';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { StartingOrderEditButton } from './discipline_edit';
import { StartingOrder, Discipline } from '@/app/lib/interfaces';
import { convert_date } from '@/app/lib/parsing';

export default function Disciplines() {
  const [showDisciplines, set_showDisciplines] = useState(false);
  const [Disciplines, setDisciplines] = useState<Discipline[]>([])

  let searchParams = useSearchParams();
  let group_name = searchParams.get('group') ?? "";

  useEffect(() => {
    let api_url = `/api/disciplines?name=${group_name}`

    fetch(api_url)
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
        }
      })
      .then(res => {
        setDisciplines(res)
      })
      .catch((e) => {
        console.error(e)
        setDisciplines([])
      })
  }, [group_name])

  let print_protocol = function (discipline_name: string, stop_load: () => void) {
    fetch(`/api/discipline_protocol?name=${group_name}&discipline_name=${discipline_name}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create a blob URL for the PDF
        const pdfBlobUrl = URL.createObjectURL(blob);
        stop_load()
        // Open the PDF in a new window
        window.open(pdfBlobUrl, '_blank');
      })
      .catch(error => {
        console.error('Error fetching or opening the PDF:', error);
      });
  }

  const update_starting_order = function (discipline_index: number, order: StartingOrder) {
    let new_discipline = Disciplines[discipline_index]

    new_discipline.starting_order = order
    Disciplines[discipline_index] = new_discipline
    setDisciplines(Disciplines)
  }

  return (
    <div className="items-center justify-between p-1 w-full">
      <div className='text-2xl font-bold p-2 border rounded-lg mt-5'>
        <div className='flex justify-between hover:cursor-pointer' onClick={(_) => set_showDisciplines(!showDisciplines)}>
          <span>Disziplinen</span>
          <button
            className="focus:outline-none text-right  text-black flex justify-between items-center">
            <svg id="icon1" className={"rotate-180" + (showDisciplines ? "rotate-180" : "")} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className={"text-sm font-normal max-h-100 overflow-scroll " + (showDisciplines ? "max-h-100" : "max-h-0 overflow-hidden")}>
          <table className="table-auto border-collapse w-full text-[1rem] sm:text-[0.8rem] 2xl:text-sm">
            <thead>
              <tr>
                <th className="border border-slate-600 p-1 pl-2 pr-2">#</th>
                <th className="border border-slate-600 p-1 pl-2 pr-2">Name</th>
                <th className="border border-slate-600 p-1 pl-2 pr-2">Status</th>
                <th className="border border-slate-600 p-1 pl-2 pr-2">Ort</th>
                <th className="border border-slate-600 p-1 pl-2 pr-2">Startzeit</th>
                <th className="border border-slate-600 p-1 pl-2 pr-2">Startreihenfolge</th>
                <th className="border border-slate-600 p-1 pl-2 pr-2">Protokol</th>
              </tr>
            </thead>
            <tbody>
              {Disciplines.map((discipline, i) => {
                return <tr key={discipline.name}>
                  <td className='border border-slate-800 p-1 pl-2 pr-2 text-center'>{i + 1}.</td>
                  <td className='border border-slate-800 p-1 pl-2 pr-2 text-center font-bold'>{discipline.name}</td>
                  <td className='border border-slate-800 p-1 pl-2 pr-2 text-center'>{german_discipline_states.get(discipline.state)}</td>
                  <td className='border border-slate-800 p-1 pl-2 pr-2 text-center'>{discipline.location}</td>
                  <td className='border border-slate-800 p-1 pl-2 pr-2 text-center'>{convert_date(discipline.start_time)}</td>
                  <StartingOrderEditButton group_name={group_name} discipline={discipline} updateStartingOrder={(order) => update_starting_order(i, order)}>
                    <span className='flex'>Ändern</span>
                    <span className='pl-2 hidden group-hover:flex'>&#9998;</span>
                  </StartingOrderEditButton>
                  <td className='border border-slate-800 group hover:bg-slate-600'>
                    <LoadingButton size="1.5" onclick={(stop_load) => print_protocol(discipline.name, stop_load)}>
                      <svg className="text-slate-600 fill-current group-hover:text-slate-50" xmlns="http://www.w3.org/2000/svg" height="25" width="25" viewBox="0 0 512 512">
                        <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
                      </svg>
                    </LoadingButton>
                  </td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>

  )
}

