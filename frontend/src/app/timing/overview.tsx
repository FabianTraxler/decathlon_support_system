"use client";

import { useSearchParams } from 'next/navigation';
import Title from "../lib/title";
import { groups, youth_groups } from '@/app/lib/config';
import { usePathname, useRouter } from 'next/navigation';
import GroupDisciplines from './group';

export default function Overview() {
  let searchParams = useSearchParams();
  let groupName = searchParams.get('group') ?? "Zeitnehmung-Übersicht";

  if (groupName == "Zeitnehmung-Übersicht") {
    return (
      <div className="flex-row w-full">
        <div className="flex flex-col items-center p-4 2xl:p-10 overflow-scroll sm:h-screen">
          <Title title={groupName}></Title>
          <GroupOverview></GroupOverview>
        </div>
      </div>
    )
  } else {
    return (
      <div className="flex flex-col items-center p-4 2xl:p-10 overflow-scroll w-full h-screen">
        <h1 className='text-center font-bold text-4xl xl:text-4xl mt-6'>{groupName}</h1>
        <GroupDisciplines group_name={groupName}></GroupDisciplines>
      </div>
    )
  }
}


function GroupOverview() {
  const { replace } = useRouter();
  const pathname = usePathname();

  return (
    <div className='flex flex-col items-center overflow-scroll'>
      <div className='flex-col border-black bg-slate-300 shadow-lg rounded-md m-8 p-2 2xl:p-5 w-[80%] sm:w-[90%]'>
        <div className='2xl:text-2xl font-bold text-center'>10-Kampf Gruppen</div>
        <div className='flex flex-wrap justify-between p-4 sm:pl-10 sm:pr-10'>
          {groups.map((group_name) => {
            return (
              <div key={group_name} className='flex w-fit shadow-md rounded-md text-center p-2 m-2 sm:m-3 bg-slate-100 hover:bg-slate-600 hover:cursor-pointer'
                onClick={() => {
                  replace(`${pathname}?group=Gruppe ${group_name}`);

                }}>Gruppe {group_name}</div>
            )
          })}
        </div>
      </div>
      <div className='flex-col border-black bg-slate-300 shadow-lg rounded-md m-8 p-2 2xl:p-5 w-[80%] sm:w-[90%]'>
        <div className='w-full 2xl:text-2xl font-bold text-center'>Jugend Gruppen</div> 
        <div className='w-full flex flex-wrap justify-between p-4 sm:pl-10 sm:pr-10'>
          {youth_groups.map((group_name) => {
            return (
              <div key={group_name} className='flex w-fit shadow-md rounded-md text-center p-2 m-2 sm:m-3 bg-slate-100 hover:bg-slate-600 hover:cursor-pointer'
                onClick={() => {
                  replace(`${pathname}?group=${group_name}`);

                }}>{group_name}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}