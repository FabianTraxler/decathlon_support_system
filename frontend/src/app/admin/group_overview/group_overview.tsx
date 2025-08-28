"use client";

import { useSearchParams } from 'next/navigation';
import PrintUtilities from './print_utilities';
import Athletes from './athltetes';
import Title from "../../lib/title";
import { decathlon_age_groups, groups, youth_groups } from '@/app/lib/config';
import { usePathname, useRouter } from 'next/navigation';
import Disciplines from './disciplines/disciplines';
import { SearchQuery } from '@/app/lib/search';
import { LoadingButton } from '@/app/lib/loading';
import { TeamsTable } from '../../lib/teams';

export default function Overview({ searchQuery }: { searchQuery?: SearchQuery }) {
  let searchParams = useSearchParams();
  let groupName = searchParams.get('group') ?? "Admin Übersicht";

  if (searchQuery && searchQuery.global && searchQuery.queries.length > 0) {
    return (
      <div className="flex-row w-full h-[95vh] overflow-scroll sm:h-full">
        <div className="flex flex-col items-center p-4 2xl:p-10 overflow-scroll sm:h-screen">
          <Title title="Globale Suche"></Title>
          <GlobalSearch searchQuery={searchQuery}></GlobalSearch>
        </div>
      </div>
    )
  }
  else if (groupName == "Admin Übersicht") {
    return (
      <div className="flex-row w-full h-[95vh] overflow-scroll sm:h-full">
        <div className="flex flex-col items-center p-4 2xl:p-10 overflow-scroll sm:h-screen">
          <Title title={groupName}></Title>
          <GroupOverview></GroupOverview>
        </div>
      </div>
    )
  } else if (groupName == "teams") {
    return (
      <div className="flex flex-col items-center p-6 pb-10 2xl:p-10 overflow-scroll w-full h-[95vh] sm:h-screen">
        <Title title={"Teams"}></Title>
        <PrintUtilities></PrintUtilities>
        <TeamsTable show_points={true}></TeamsTable>
      </div>
    )
  } else {
    return (
      <div className="flex flex-col items-center p-6 pb-10 2xl:p-10 overflow-scroll w-full h-[95vh] sm:h-screen">
        <Title title={groupName}></Title>
        <PrintUtilities></PrintUtilities>
        <Athletes group_name={groupName} query={searchQuery}></Athletes>

        {(groupName.startsWith("Gruppe") || groupName.startsWith("U")) &&
          <Disciplines group_name={groupName}></Disciplines>
        }
      </div>
    )
  }
}


function GroupOverview() {
  const { replace } = useRouter();
  const pathname = usePathname();

  return (
    <div className='flex flex-col items-center w-screen sm:w-auto'>
      <div className='border-black bg-slate-300 shadow-lg rounded-md m-8 p-2 2xl:p-5 w-[80%] sm:w-[90%]'>
        <div className='w-full 2xl:text-2xl font-bold text-center'>10-Kampf Altersklassen</div>
        <div className='flex flex-wrap justify-between pl-10 pr-10 '>
          {decathlon_age_groups.map((group_name) => {
            return (
              <div key={group_name} className='flex w-fit shadow-md rounded-md text-center p-2 m-3 bg-slate-100 hover:bg-slate-600 hover:cursor-pointer'
                onClick={() => {
                  replace(`${pathname}?group=${group_name}`);

                }}>{group_name}</div>
            )
          })}
        </div>

      </div>
      <div className='flex-col border-black bg-slate-300 shadow-lg rounded-md m-4 p-2 2xl:p-5 w-[80%] sm:w-[90%]'>
        <div className='2xl:text-2xl font-bold text-center'>10-Kampf Gruppen</div>
        <div className='flex flex-wrap justify-between pl-4 sm:pl-10 pr-4 sm:pr-10'>
          {groups.map((group_name) => {
            return (
              <div key={group_name} className='flex w-fit shadow-md rounded-md text-center p-2 m-3 bg-slate-100 hover:bg-slate-600 hover:cursor-pointer'
                onClick={() => {
                  replace(`${pathname}?group=Gruppe ${group_name}`);

                }}>Gruppe {group_name}</div>
            )
          })}
        </div>
      </div>
      <div className='flex-col border-black bg-slate-300 shadow-lg rounded-md m-4 p-2 2xl:p-5 w-[80%] sm:w-[90%]'>
        <div className='2xl:text-2xl font-bold text-center'>Jugend Gruppen</div>
        <div className='flex flex-wrap justify-between pl-10 pr-10'>
          {youth_groups.map((group_name) => {
            return (
              <div key={group_name} className='flex  w-fit shadow-md rounded-md text-center p-2 m-3 bg-slate-100 hover:bg-slate-600 hover:cursor-pointer'
                onClick={() => {
                  replace(`${pathname}?group=${group_name}`);

                }}>{group_name}</div>
            )
          })}
        </div>
      </div>
      <div className='flex-col border-black bg-slate-300 shadow-lg rounded-md m-4 p-2 2xl:p-5 w-[80%] sm:w-[90%]'>
        <FinalResults></FinalResults>
      </div>
    </div>
  )
}

function FinalResults() {
  const { replace } = useRouter();
  const pathname = usePathname();

  const handle_click = function (done: () => void, type: string) {
    let name = type
    let url = ""

    var age_groups = decathlon_age_groups.map((group) => group.replace("AK-", ""))

    if (type == "age_groups") {
      url = "/api/all_age_group_results?age_identifiers=" + age_groups
      name = "Gesamtergebnis"
    }

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create a blob URL for the PDF
        const pdfBlobUrl = URL.createObjectURL(blob);
        done();
        // Open the PDF in a new window
        var link = document.createElement("a");
        link.href = pdfBlobUrl;
        link.download = name
        link.click();
      })
      .catch(error => {
        console.error('Error fetching or opening the PDF:', error);
      });
  }

  const navigateToTeams = function(done: () => void) {
    done();
    replace(`${pathname}?group=teams`);
  }

  return (
    <div>
      <div className='flex flex-wrap justify-center pl-10 pr-10'>
        <div className='flex  w-fit shadow-md rounded-md text-center  m-3 bg-slate-100 hover:bg-slate-600 hover:cursor-pointer'>
          <LoadingButton size="4" onclick={(done) => handle_click(done, "age_groups")}>
            <div className='flex p-8' >
              <div className='mr-3'>Gesamtergebnisse</div>
              <svg className="text-slate-600 fill-current" xmlns="http://www.w3.org/2000/svg" height="30" width="30" viewBox="0 0 512 512">
                <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
              </svg>
            </div>
          </LoadingButton>

        </div>
        <div className='flex  w-fit shadow-md rounded-md text-center  m-3 bg-slate-100 hover:bg-slate-600 hover:cursor-pointer'>
          <LoadingButton size="4" onclick={(done) => navigateToTeams(done)}>
            <div className='flex p-8' >
              <div className='mr-3'>Teams</div>
            </div>
          </LoadingButton>

        </div>
      </div>
    </div>
  )
}

function GlobalSearch({ searchQuery }: { searchQuery?: SearchQuery }) {
  if (searchQuery == null) {
    return (
      <div>
        <p>Keine Suchparameter angegeben</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center p-6 pb-10 2xl:p-10 overflow-scroll w-full h-[95vh] sm:h-screen">
      <Athletes group_name="all" query={searchQuery} show_athletes={true}></Athletes>
    </div>
  )
}
