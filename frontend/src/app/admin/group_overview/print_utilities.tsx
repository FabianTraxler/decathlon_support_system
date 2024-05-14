"use client";
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingButton } from '@/app/lib/loading_button';

export default function PrintUtilities() {
  let searchParams = useSearchParams();
  let group_name = searchParams.get('group') ?? "";

  return (
    <div className="flex flex-col sm:flex-row items-left sm:items-center justify-between pb-5 pt-2 w-full 2xl:w-3/4">
      {(group_name.startsWith("G") || group_name.startsWith("U")) &&
        <CurrentDisciplineCard></CurrentDisciplineCard>
      }
      {(group_name.startsWith("G") || group_name.startsWith("U")) &&
        <DisciplineProtocolCard></DisciplineProtocolCard>
      }
      <GroupResultsCard></GroupResultsCard>
      {(group_name.startsWith("G") || group_name.startsWith("U")) &&
        <CertificateCard></CertificateCard>
      }
    </div>
  )
}


function CurrentDisciplineCard() {
  interface DisciplineInfo {
    name: string,
    start_time: string,
    location: string,
    state: string
  }

  const [disciplineInfo, set_disciplineInfo] = useState<DisciplineInfo>({ name: "", start_time: "", location: "", state: "" });
  let searchParams = useSearchParams();
  let group_name = searchParams.get('group') ?? "";

  useEffect(() => {
    fetch(`/api/current_discipline?name=${group_name}`)
      .then(res => {
        if (res.ok) {
          return res.json()
        } else {
          throw new Error(`Network response was not ok: ${res.status} - ${res.statusText}`);
        }
      }).then(res => {
        set_disciplineInfo(res)
      })
      .catch((e) => {
        console.error(e)
        set_disciplineInfo({ name: "", start_time: "", location: "", state: "" })
      })
  }, [group_name])

  let start_time = "";
  if (disciplineInfo.start_time != "") {
    let date = new Date(disciplineInfo.start_time)
    let minutes = date.getMinutes().toString();
    if (minutes.length == 1) {
      minutes += "0"
    }
    start_time = date.getHours().toString() + ":" + minutes;
  }


  return (
    <div className="flex-col  items-center justify-between border-black border rounded-md w-fit p-2 shadow-xl bg-slate-300">
      <div className='xl:text-l font-bold w-fit'><u>Aktuelle Disziplin:</u></div>
      <div className='w-fit'><b>Name:</b> {disciplineInfo.name}, <b>Start:</b> {start_time}</div>
      <div className='w-fit'><b>Ort:</b> {disciplineInfo.location}, <b>Status:</b> {disciplineInfo.state}</div>
    </div>
  )
}

function DisciplineProtocolCard() {
  let searchParams = useSearchParams();
  let group_name = searchParams.get('group') ?? "";
  const handle_click = function (done: () => void) {
    fetch(`/api/discipline_protocol?group_name=${group_name}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create a blob URL for the PDF
        const pdfBlobUrl = URL.createObjectURL(blob);
        // Download PDF
        var link = document.createElement("a");
        link.href = pdfBlobUrl;
        link.download =  `Protokoll: ${group_name}`
        link.click();

        done()

      })
      .catch(error => {
        console.error('Error fetching or opening the PDF:', error);
      });
  }

  return (
    <div className=" border-black border rounded-md w-fit  shadow-xl bg-blue-200 hover:bg-blue-400">
      <LoadingButton size="4" onclick={handle_click}>
        <div className="p-5 flex items-center justify-center">
          <span className='pr-3'>Disziplin-Protokol</span>
          <svg className="text-slate-600 fill-current" xmlns="http://www.w3.org/2000/svg" height="30" width="30" viewBox="0 0 512 512">
            <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
          </svg>

        </div>
      </LoadingButton>

    </div>
  )
}


function GroupResultsCard() {
  let searchParams = useSearchParams();
  let group_name = searchParams.get('group') ?? "";
  let handle_click;
  if (group_name.startsWith("Gruppe")) {
    handle_click = function (done: () => void) {
      fetch(`/api/group_results?name=${group_name}`)
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
          link.download =  `Ergebnisse: ${group_name}`
          link.click();
        })
        .catch(error => {
          console.error('Error fetching or opening the PDF:', error);
        });
    }
  } else if (group_name.startsWith("U")) {
    handle_click = function (done: () => void) {
      fetch(`/api/group_results?name=${group_name}`)
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
          link.download =  `Ergebnisse: ${group_name}`
          link.click();
        })
        .catch(error => {
          console.error('Error fetching or opening the PDF:', error);
        });
    }
  } else {
    handle_click = function (done: () => void) {
      let age_identifier = group_name.replace("AK-", "");
      fetch(`/api/age_group_results?age_identifier=${age_identifier}`)
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
          link.download =  `Ergebnisse: ${group_name}`
          link.click();
        })
        .catch(error => {
          console.error('Error fetching or opening the PDF:', error);
        });
    }
  }


  return (
    <div className=" border-black border rounded-md w-fit  shadow-xl bg-blue-200 hover:bg-blue-400">
      <LoadingButton size="4" onclick={handle_click}>

        <div className="p-5 flex items-center justify-center">
          <span className='pr-3'>Gruppenergebnis</span>
          <svg className="text-slate-600 fill-current" xmlns="http://www.w3.org/2000/svg" height="30" width="30" viewBox="0 0 512 512">
            <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
          </svg>

        </div>
      </LoadingButton>
    </div>
  )
}

function CertificateCard() {
  let searchParams = useSearchParams();
  let group_name = searchParams.get('group') ?? "Test";
  const handle_click = function (done: () => void) {
    fetch(`/api/certificates?name=${group_name}`)
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
        link.download =  `Urkunden: ${group_name}`
        link.click();
      })
      .catch(error => {
        console.error('Error fetching or opening the PDF:', error);
      });
  }

  return (
    <div className=" border-black border rounded-md w-fit  shadow-xl bg-blue-200 hover:bg-blue-400">
      <LoadingButton size="4" onclick={handle_click}>

        <div className="p-5 flex items-center justify-center" >
          <span className='pr-3'>Urkunden</span>
          <svg className="text-slate-600 fill-current" xmlns="http://www.w3.org/2000/svg" height="30" width="30" viewBox="0 0 512 512">
            <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
          </svg>

        </div>
      </LoadingButton>

    </div>
  )
}