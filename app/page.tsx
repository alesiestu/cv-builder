"use client";
import React, { useEffect, useRef, useState } from "react";

import type { Data } from "@/types/cv";
import { exportPdfFromHtmlTemplate } from "@/lib/pdf";
import { cvHtmlTemplate } from "@/lib/pdf/html-template";


// ---------------- Types locali per UI ----------------
interface Profile { name: string; title: string; location?: string; email?: string; phone?: string; website?: string; summary?: string; license?: string; }
interface Experience { company: string; role: string; start: string; end: string; desc?: string; stack?: string; }
interface Education { school: string; degree: string; start?: string; end?: string; desc?: string; }
interface Project { name: string; link?: string; desc?: string; }
interface Language { name: string; level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|"Madrelingua" }

const KEY = "cvbuilder.next.v1";

// palette (tenuta per i badge della preview)
const palette: Record<Data["theme"], { bg: string; accent: string; badge: string; border: string; textMuted: string }>= {
  violet: { bg: "from-violet-600 to-indigo-600", accent: "violet-600", badge: "bg-violet-50 text-violet-700 border-violet-200", border: "border-violet-200", textMuted: "text-slate-500" },
  slate: { bg: "from-slate-700 to-slate-900", accent: "slate-800", badge: "bg-slate-100 text-slate-700 border-slate-200", border: "border-slate-200", textMuted: "text-slate-500" },
  emerald: { bg: "from-emerald-600 to-teal-600", accent: "emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-emerald-200", textMuted: "text-slate-500" },
  rose: { bg: "from-rose-500 to-fuchsia-600", accent: "rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200", border: "border-rose-200", textMuted: "text-slate-500" },
};

// ---------- migratore dati (gestisce JSON vecchi) ----------
function migrateData(raw: any): Data {
  const safeArray = (x:any) => Array.isArray(x) ? x : [];
  return {
    profile: {
      name: raw?.profile?.name ?? "",
      title: raw?.profile?.title ?? "",
      email: raw?.profile?.email ?? "",
      phone: raw?.profile?.phone ?? "",
      location: raw?.profile?.location ?? "",
      website: raw?.profile?.website ?? "",
      summary: raw?.profile?.summary ?? "",
      license: raw?.profile?.license ?? "",
    },
    exp: safeArray(raw?.exp),
    edu: safeArray(raw?.edu),
    skills: safeArray(raw?.skills),
    proj: safeArray(raw?.proj),
    languages: safeArray(raw?.languages).map((l:any)=>({
      name: l?.name ?? "",
      level: (l?.level ?? "B1") as Language["level"],
    })),
    layout: (raw?.layout ?? "sidebar"),
    theme: (raw?.theme ?? "violet"),
  } as Data;
}

export default function Page() {
  const [data, setData] = useState<Data>({
    profile: { name: "", title: "", email: "", phone: "", location: "", website: "", summary: "", license: "" },
    exp: [], edu: [], skills: [], proj: [],
    languages: [],
    layout: "sidebar", theme: "violet"
  });

  // ---------- persistence ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(migrateData(JSON.parse(raw)));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(data)); }, [data]);

  // ---------- helpers ----------
  const add = {
    exp: () => setData(d => ({ ...d, exp: [...d.exp, { company: "", role: "", start: "", end: "", desc: "", stack: "" }] })),
    edu: () => setData(d => ({ ...d, edu: [...d.edu, { school: "", degree: "", start: "", end: "", desc: "" }] })),
    proj: () => setData(d => ({ ...d, proj: [...d.proj, { name: "", link: "", desc: "" }] })),
    skill: (s: string) => s && setData(d => ({ ...d, skills: Array.from(new Set([...(d.skills||[]), s])) })),
    lang: () => setData(d => ({ ...d, languages: [ ...(d.languages||[]), { name: "", level: "B1" as Language["level"] } ] })),
  };
  const removeAt = (key: "exp"|"edu"|"proj", i: number) => setData(d => ({ ...d, [key]: (d as any)[key].filter((_:any,k:number)=>k!==i) } as Data));
  const move = (key: "exp"|"edu"|"proj", i: number, dir: -1|1) => setData(d => {
    const arr = [...(d as any)[key]] as any[]; const j=i+dir; if(j<0||j>=arr.length) return d; [arr[i],arr[j]]=[arr[j],arr[i]]; return { ...d, [key]: arr } as Data;
  });
  const removeLangAt = (i:number) => setData(d => ({ ...d, languages: (d.languages||[]).filter((_,k)=>k!==i) }));

  const fileInput = useRef<HTMLInputElement>(null);
  const onImport = async (f: File) => {
    const txt = await f.text();
    try {
      const j = JSON.parse(txt);
      setData(migrateData(j));  // ✅ migrazione all'import
    } catch {
      alert("JSON non valido");
    }
  };
  const onExport = () => {
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="cv-data.json"; a.click(); URL.revokeObjectURL(a.href);
  };

  const fillExample = () => setData(example());
  const clearAll = () => { if(confirm("Sicuro di azzerare?")){ localStorage.removeItem(KEY); setData(exampleEmpty()); }};

  // ---------- render ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 backdrop-blur border-b border-white/10 bg-black/30">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-2">
          <strong className="mr-auto text-sm tracking-wide uppercase text-slate-300">Easy FREE CV Builder — Write from Iannacone Alessandro</strong>
         

          <button
            onClick={() =>
              exportPdfFromHtmlTemplate(
                (data.profile.name ? data.profile.name.replace(/\s+/g, "_") + "_CV" : "cv") + ".pdf",
                data
              )
            }
            className="px-3 py-1.5 rounded-lg bg-white text-black text-sm"
          >
            Genera PDF
          </button>
        </div>
      </div>

      {/* Grid: editor + preview */}
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[420px,1fr] gap-4 p-4">
        {/* Editor */}
        <div className="space-y-4">
          <Panel title="Dati personali" actions={<>
            <Ghost onClick={clearAll}>Azzera</Ghost>
            <Ghost onClick={fillExample}>Esempio</Ghost>
          </>}>
            <Two>
              <Field label="Nome e Cognome" value={data.profile.name} onChange={v=>setData(d=>({...d, profile:{...d.profile, name:v}}))} />
              <Field label="Titolo professionale" value={data.profile.title} onChange={v=>setData(d=>({...d, profile:{...d.profile, title:v}}))} />
            </Two>
            <Two>
              <Field label="Email" value={data.profile.email||""} onChange={v=>setData(d=>({...d, profile:{...d.profile, email:v}}))} />
              <Field label="Telefono" value={data.profile.phone||""} onChange={v=>setData(d=>({...d, profile:{...d.profile, phone:v}}))} />
            </Two>
            <Two>
              <Field label="Città" value={data.profile.location||""} onChange={v=>setData(d=>({...d, profile:{...d.profile, location:v}}))} />
              <Field label="Sito / LinkedIn" value={data.profile.website||""} onChange={v=>setData(d=>({...d, profile:{...d.profile, website:v}}))} />
            </Two>
            <Area label="Bio / Summary" rows={3} value={data.profile.summary||""} onChange={v=>setData(d=>({...d, profile:{...d.profile, summary:v}}))} />
          </Panel>

          <Panel title="Esperienza" actions={<Primary onClick={add.exp}>+ Aggiungi</Primary>}>
            {(data.exp||[]).map((e:any,i:number)=> (
              <Block key={i}>
                <Two>
                  <Field label="Azienda" value={e.company} onChange={v=>mut(i,"exp","company",v,setData)} />
                  <Field label="Ruolo" value={e.role} onChange={v=>mut(i,"exp","role",v,setData)} />
                </Two>
                <Two>
                  <Field label="Inizio (YYYY-MM)" value={e.start} onChange={v=>mut(i,"exp","start",v,setData)} />
                  <Field label="Fine (YYYY-MM / Presente)" value={e.end} onChange={v=>mut(i,"exp","end",v,setData)} />
                </Two>
                <Area label="Descrizione" rows={3} value={e.desc||""} onChange={v=>mut(i,"exp","desc",v,setData)} />
                <Field label="Stack (virgole)" value={e.stack||""} onChange={v=>mut(i,"exp","stack",v,setData)} />
                <Row className="justify-end gap-2">
                  <Ghost onClick={()=>move("exp",i,-1)}>▲</Ghost>
                  <Ghost onClick={()=>move("exp",i,1)}>▼</Ghost>
                  <Danger onClick={()=>removeAt("exp",i)}>Elimina</Danger>
                </Row>
              </Block>
            ))}
          </Panel>

          <Panel title="Istruzione" actions={<Primary onClick={add.edu}>+ Aggiungi</Primary>}>
            {(data.edu||[]).map((e:any,i:number)=> (
              <Block key={i}>
                <Two>
                  <Field label="Istituto" value={e.school} onChange={v=>mut(i,"edu","school",v,setData)} />
                  <Field label="Titolo" value={e.degree} onChange={v=>mut(i,"edu","degree",v,setData)} />
                </Two>
                <Two>
                  <Field label="Anno inizio" value={e.start||""} onChange={v=>mut(i,"edu","start",v,setData)} />
                  <Field label="Anno fine" value={e.end||""} onChange={v=>mut(i,"edu","end",v,setData)} />
                </Two>
                <Area label="Note" rows={2} value={e.desc||""} onChange={v=>mut(i,"edu","desc",v,setData)} />
                <Row className="justify-end gap-2">
                  <Ghost onClick={()=>move("edu",i,-1)}>▲</Ghost>
                  <Ghost onClick={()=>move("edu",i,1)}>▼</Ghost>
                  <Danger onClick={()=>removeAt("edu",i)}>Elimina</Danger>
                </Row>
              </Block>
            ))}
          </Panel>

          <Panel title="Competenze (tag)">
            <Row className="gap-2">
              <input id="skill" className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700" placeholder="Aggiungi competenza" onKeyDown={(e)=>{ if(e.key==="Enter"){ const v=(e.target as HTMLInputElement).value.trim(); add.skill(v); (e.target as HTMLInputElement).value=''; }}} />
              <Primary onClick={()=>{ const el=document.getElementById("skill") as HTMLInputElement; add.skill(el.value.trim()); el.value=''; }}>Aggiungi</Primary>
            </Row>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data.skills||[]).map((s,i)=> (
                <span key={i} onClick={()=>setData(d=>({...d, skills: (d.skills||[]).filter((_,k)=>k!==i)}))} className={`cursor-pointer text-xs border px-2.5 py-1 rounded-full ${palette[data.theme].badge}`}>{s}</span>
              ))}
            </div>
          </Panel>

          <Panel title="Progetti" actions={<Primary onClick={add.proj}>+ Aggiungi</Primary>}>
            {(data.proj||[]).map((p:any,i:number)=> (
              <Block key={i}>
                <Two>
                  <Field label="Nome" value={p.name} onChange={v=>mut(i,"proj","name",v,setData)} />
                  <Field label="Link" value={p.link||""} onChange={v=>mut(i,"proj","link",v,setData)} />
                </Two>
                <Area label="Descrizione" rows={2} value={p.desc||""} onChange={v=>mut(i,"proj","desc",v,setData)} />
                <Row className="justify-end gap-2">
                  <Ghost onClick={()=>move("proj",i,-1)}>▲</Ghost>
                  <Ghost onClick={()=>move("proj",i,1)}>▼</Ghost>
                  <Danger onClick={()=>removeAt("proj",i)}>Elimina</Danger>
                </Row>
              </Block>
            ))}
          </Panel>

          <Panel title="Lingue" actions={<Primary onClick={add.lang}>+ Aggiungi</Primary>}>
            {(data.languages||[]).map((l,i)=>(
              <Block key={i}>
                <Two>
                  <Field label="Lingua" value={l.name} onChange={v=>setData(d=>{
                    const arr=[...(d.languages||[])]; arr[i]={...arr[i], name:v}; return {...d, languages:arr};
                  })} />
                  <label className="block text-sm">
                    <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">Livello</span>
                    <select
                      value={l.level}
                      onChange={e=>setData(d=>{
                        const arr=[...(d.languages||[])]; arr[i]={...arr[i], level:e.target.value as Language["level"]}; return {...d, languages:arr};
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-700"
                    >
                      {["A1","A2","B1","B2","C1","C2","Madrelingua"].map(x=><option key={x} value={x}>{x}</option>)}
                    </select>
                  </label>
                </Two>
                <Row className="justify-end gap-2">
                  <Danger onClick={()=>removeLangAt(i)}>Elimina</Danger>
                </Row>
              </Block>
            ))}
          </Panel>

          <Panel title="Patente">
            <Field
              label="Categoria patente (es. B)"
              value={data.profile.license || ""}
              onChange={v=>setData(d=>({...d, profile:{...d.profile, license:v}}))}
            />
          </Panel>

          <Panel title="Backup / Import & Export">
            <Row className="gap-2 flex-wrap">
              <Primary onClick={onExport}>Esporta JSON</Primary>
              <Ghost onClick={()=>fileInput.current?.click()}>Importa JSON</Ghost>
              <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e)=>{const f=e.target.files?.[0]; if(f) onImport(f); }} />
            </Row>
          </Panel>
        </div>

        {/* Preview */}
     {/*    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 overflow-auto print:p-0 print:border-0 print:bg-white">
          <CVPreview data={data} />
        </div>*/}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 overflow-auto">
          <CVPreviewStatic data={data} />
        </div>
      </div>
    </div>
  );
}

// ---------------- UI primitives ----------------
function Panel({title, actions, children}:{title:string; actions?:React.ReactNode; children:React.ReactNode}){
  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-xl shadow-black/30">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm tracking-widest uppercase text-slate-400">{title}</h3>
        <div className="flex gap-2">{actions}</div>
      </div>
      {children}
    </section>
  );
}
function Block({children}:{children:React.ReactNode}){
  return <div className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-3 mb-3">{children}</div>;
}
function Two({children}:{children:React.ReactNode}){ return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>; }
function Row({children,className= ""}:{children:React.ReactNode; className?:string}){ return <div className={`flex items-center ${className}`}>{children}</div>; }
function Field({label, value, onChange}:{label:string; value:string; onChange:(v:string)=>void}){
  return (
    <label className="block text-sm">
      <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">{label}</span>
      <input value={value} onChange={e=>onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
    </label>
  );
}
function Area({label, value, onChange, rows=3}:{label:string; value:string; onChange:(v:string)=>void; rows?:number}){
  return (
    <label className="block text-sm">
      <span className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">{label}</span>
      <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
    </label>
  );
}
function ButtonBase({children, className, ...props}:{children:React.ReactNode; className?:string} & React.ButtonHTMLAttributes<HTMLButtonElement>){
  return <button {...props} className={`px-3 py-2 rounded-xl border text-sm ${className}`} >{children}</button>;
}
function Primary(props:any){ return <ButtonBase {...props} className="bg-white text-black border-white/10 hover:opacity-90"/> }
function Ghost(props:any){ return <ButtonBase {...props} className="bg-transparent text-slate-300 border-slate-700/70 hover:bg-slate-800/50"/> }
function Danger(props:any){ return <ButtonBase {...props} className="bg-rose-600 border-rose-500 text-white hover:brightness-95"/> }



function normalizeDataForTemplate(data: any) {
  return {
    ...data,
    profile: { ...(data.profile || {}), license: data?.profile?.license || "" },
    languages: Array.isArray(data?.languages) ? data.languages : [],
    exp: Array.isArray(data?.exp) ? data.exp : [],
    edu: Array.isArray(data?.edu) ? data.edu : [],
    skills: Array.isArray(data?.skills) ? data.skills : [],
  };
}


function CVPreviewStatic({ data }: { data: Data }) {
  const html = cvHtmlTemplate(normalizeDataForTemplate(data));
  return (
    <div className="flex justify-center">
      {/* cornice opzionale intorno all'iframe */}
      <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-200">
        <iframe
          // NB: srcDoc = HTML del template PDF
          srcDoc={html}
          // 210×297 mm ≈ A4
          style={{
            width: "210mm",
            height: "297mm",
            border: "0",
            background: "#fff",
          }}
          // migliora rendering font
          sandbox=""
          aria-label="Anteprima CV (stesso template del PDF)"
        />
      </div>
    </div>
  );
}


function Header({profile}:{profile:Profile}){
  return (
    <div className="flex items-end justify-between gap-6 pb-4 border-b border-slate-200">
      <div>
        <div className="text-3xl font-extrabold tracking-tight">{profile.name}</div>
        <div className="text-sm text-slate-600">{profile.title}</div>
      </div>
      <div className="text-[11px] text-right leading-5 text-slate-600">
        {[profile.email, profile.phone, profile.location, profile.website].filter(Boolean).join(" • ")}
      </div>
    </div>
  );
}

function Section({title, children}:{title:string; children:React.ReactNode}){
  return (
    <section className="mt-6">
      <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Tag({children}:{children:React.ReactNode}){
  return <span className="text-[10px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">{children}</span>;
}


// ---------------- utils ----------------
function mut<T extends keyof Data>(i:number, key:T, field: string, value:any, setData:React.Dispatch<React.SetStateAction<Data>>) {
  setData(d => {
    const arr = [...((d as any)[key] as any[])];
    arr[i] = { ...(arr[i] || {}), [field]: value };
    return { ...d, [key]: arr } as Data;
  });
}

function exampleEmpty(): Data {
  return {
    profile:{ name:"", title:"", email:"", phone:"", location:"", website:"", summary:"", license:"" },
    exp:[], edu:[], skills:[], proj:[],
    languages: [],
    layout:"sidebar", theme:"violet"
  };
}

function example(): Data {
  return {
    profile: {
      name: "Alessandro Iannacone",
      title: "DevOps • SRE • SysAdmin",
      email: "me@iannaconealessandro.it",
      phone: "+39 ...",
      location: "Roma",
      website: "linkedin.com/in/username",
      summary: "DevOps con esperienza in Kubernetes, GitOps e sicurezza. Appassionato di automazione e infrastrutture resilienti.",
      license: "B"
    },
    exp: [
      { company: "Acme S.p.A.", role: "DevOps Engineer", start: "2023-02", end: "Presente", desc: "Gestione Kubernetes, GitOps, osservabilità e hardening.", stack: "Kubernetes, ArgoCD, Prometheus, Grafana, Terraform, AWS" },
      { company: "Contoso", role: "System Administrator", start: "2020-05", end: "2023-01", desc: "Automazione provisioning e monitoring, migrazione a container.", stack: "Ansible, Docker, Zabbix" }
    ],
    edu: [ { school: "Università XYZ", degree: "Informatica", start: "2015", end: "2018", desc: "Triennale" } ],
    skills: ["Kubernetes","Docker","Terraform","AWS","Linux","CI/CD","Networking"],
    proj: [ { name: "PWA eventi", link: "https://example.com", desc: "PWA per gestione eventi e preventivi" } ],
    languages: [
      { name: "Italiano", level: "Madrelingua" },
      { name: "Inglese", level: "B2" }
    ],
    layout: "sidebar", theme:"violet"
  };
}

// ---------------- print styles ----------------
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `@media print{ body{ background:white } .print\\:p-0{ padding:0 !important } .print\\:border-0{ border-width:0 !important } .print\\:bg-white{ background:white !important } @page{ size:A4; margin:12mm } }`;
  document.head.appendChild(style);
}
