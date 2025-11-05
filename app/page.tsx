"use client";
import React, { useEffect, useRef, useState } from "react";
// in cima al file
import dynamic from "next/dynamic";



// ---------------- Types ----------------
interface Profile { name: string; title: string; location?: string; email?: string; phone?: string; website?: string; summary?: string; }
interface Experience { company: string; role: string; start: string; end: string; desc?: string; stack?: string; }
interface Education { school: string; degree: string; start?: string; end?: string; desc?: string; }
interface Project { name: string; link?: string; desc?: string; }
interface Data { profile: Profile; exp: Experience[]; edu: Education[]; skills: string[]; proj: Project[]; layout: "classic" | "sidebar" | "timeline"; theme: "violet" | "slate" | "emerald" | "rose" }

const KEY = "cvbuilder.next.v1";

const palette: Record<Data["theme"], { bg: string; accent: string; badge: string; border: string; textMuted: string }>= {
  violet: { bg: "from-violet-600 to-indigo-600", accent: "violet-600", badge: "bg-violet-50 text-violet-700 border-violet-200", border: "border-violet-200", textMuted: "text-slate-500" },
  slate: { bg: "from-slate-700 to-slate-900", accent: "slate-800", badge: "bg-slate-100 text-slate-700 border-slate-200", border: "border-slate-200", textMuted: "text-slate-500" },
  emerald: { bg: "from-emerald-600 to-teal-600", accent: "emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", border: "border-emerald-200", textMuted: "text-slate-500" },
  rose: { bg: "from-rose-500 to-fuchsia-600", accent: "rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200", border: "border-rose-200", textMuted: "text-slate-500" },
};

export default function Page() {
  const [data, setData] = useState<Data>({
    profile: { name: "", title: "", email: "", phone: "", location: "", website: "", summary: "" },
    exp: [], edu: [], skills: [], proj: [], layout: "sidebar", theme: "violet"
  });

  // ---------- persistence ----------
  useEffect(() => { try { const raw = localStorage.getItem(KEY); if (raw) setData(JSON.parse(raw)); } catch {} }, []);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(data)); }, [data]);

  // ---------- helpers ----------
  const add = {
    exp: () => setData(d => ({ ...d, exp: [...d.exp, { company: "", role: "", start: "", end: "", desc: "", stack: "" }] })),
    edu: () => setData(d => ({ ...d, edu: [...d.edu, { school: "", degree: "", start: "", end: "", desc: "" }] })),
    proj: () => setData(d => ({ ...d, proj: [...d.proj, { name: "", link: "", desc: "" }] })),
    skill: (s: string) => s && setData(d => ({ ...d, skills: Array.from(new Set([...d.skills, s])) }))
  };
  const removeAt = (key: "exp"|"edu"|"proj", i: number) => setData(d => ({ ...d, [key]: d[key].filter((_,k)=>k!==i) } as Data));
  const move = (key: "exp"|"edu"|"proj", i: number, dir: -1|1) => setData(d => {
    const arr = [...d[key]] as any[]; const j=i+dir; if(j<0||j>=arr.length) return d; [arr[i],arr[j]]=[arr[j],arr[i]]; return { ...d, [key]: arr } as Data;
  });

  const fileInput = useRef<HTMLInputElement>(null);
  const onImport = async (f: File) => { const txt = await f.text(); try { const j = JSON.parse(txt); setData(j); } catch { alert("JSON non valido"); } };
  const onExport = () => { const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="cv-data.json"; a.click(); URL.revokeObjectURL(a.href); };

  const fillExample = () => setData(example());
  const clearAll = () => { if(confirm("Sicuro di azzerare?")){ localStorage.removeItem(KEY); setData(exampleEmpty()); }};

  // ------- PDF: carica html2pdf e scarica il PDF (no finestra di stampa) -------
  
// --- loader generico per script CDN ---
// loader CDN riusabile
async function loadScript(src: string) {
  if (document.querySelector(`script[data-src="${src}"]`)) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Impossibile caricare ${src}`));
    s.setAttribute("data-src", src);
    document.head.appendChild(s);
  });
}

// HTML minimale per il PDF (nessun Tailwind, solo CSS inline base)
function cvHtmlTemplate(data: Data) {
  const esc = (s: string) => (s || "").replace(/[&<>"]/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"
  }[c]!));

  const exp = data.exp.map(e => `
    <div class="item">
      <div class="row">
        <div class="role"><strong>${esc(e.role)}</strong> — ${esc(e.company)}</div>
        <div class="dates">${esc(e.start)} – ${esc(e.end)}</div>
      </div>
      ${e.desc ? `<div class="desc">${esc(e.desc)}</div>` : ""}
      ${e.stack ? `<div class="stack">${e.stack.split(",").map(s=>`<span class="tag">${esc(s.trim())}</span>`).join(" ")}</div>` : ""}
    </div>
  `).join("");

  const edu = data.edu.map(e => `
    <div class="row">
      <div><strong>${esc(e.degree)}</strong> — ${esc(e.school)}</div>
      <div class="dates">${esc(e.start||"")} – ${esc(e.end||"")}</div>
    </div>
    ${e.desc ? `<div class="desc">${esc(e.desc)}</div>` : ""}
  `).join("");

  const skills = data.skills.map(s => `<span class="tag">${esc(s)}</span>`).join(" ");

  // A4 a ~96dpi ≈ 794x1123 px. Tenere 760 di larghezza interna.
  return `
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:0;background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif}
  .page{width:794px;min-height:1123px;background:#ffffff;padding:32px}
  h1{margin:0 0 6px 0;font-size:28px;color:#111111}
  h2{margin:20px 0 8px 0;font-size:12px;letter-spacing:.08em;color:#666666;text-transform:uppercase}
  .title{font-size:14px;color:#444444;margin-bottom:6px}
  .contacts{font-size:11px;color:#666666;margin-bottom:12px}
  .sep{height:1px;background:#dddddd;margin:12px 0 16px 0}

  .section{margin-bottom:14px}
  .text{font-size:12px;line-height:1.5;color:#222222}

  .item{border:1px solid #e5e5e5;border-radius:8px;padding:10px;margin-bottom:10px}
  .row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px}
  .role{color:#111111}
  .dates{font-size:11px;color:#666666;white-space:nowrap}
  .desc{margin-top:6px;font-size:12px;color:#222222}
  .stack{margin-top:6px}
  .tag{display:inline-block;border:1px solid #dddddd;border-radius:9999px;padding:2px 8px;font-size:10px;color:#444444;margin-right:6px;margin-bottom:4px}

  /* evita che html2canvas inciampi in effetti strani */
  .noshadow{box-shadow:none}
</style>
</head>
<body>
  <div class="page noshadow">
    <h1>${esc(data.profile.name)}</h1>
    <div class="title">${esc(data.profile.title || "")}</div>
    <div class="contacts">
      ${
        [data.profile.email, data.profile.phone, data.profile.location, data.profile.website]
        .filter(Boolean).map(esc).join(" • ")
      }
    </div>
    <div class="sep"></div>

    ${data.profile.summary ? `
    <div class="section">
      <h2>Profilo</h2>
      <div class="text">${esc(data.profile.summary)}</div>
    </div>` : ""}

    ${data.exp.length ? `
    <div class="section">
      <h2>Esperienza (Timeline)</h2>
      ${exp}
    </div>` : ""}

    ${data.edu.length ? `
    <div class="section">
      <h2>Istruzione</h2>
      ${edu}
    </div>` : ""}

    ${data.skills.length ? `
    <div class="section">
      <h2>Competenze</h2>
      <div>${skills}</div>
    </div>` : ""}
  </div>
</body>
</html>`;
}

// Converte il template HTML in PDF multipagina (A4) con html2canvas + jsPDF
async function exportPdfFromHtmlTemplate(filename: string, data: Data) {
  // carica cdn
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  // @ts-ignore
  const html2canvas = (window as any).html2canvas;
  // @ts-ignore
  const jsPDF = (window as any).jspdf?.jsPDF;

  if (!html2canvas || !jsPDF) { alert("Librerie PDF non disponibili (CSP/CDN bloccato?)"); return; }

  // crea container offscreen
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = cvHtmlTemplate(data);
  document.body.appendChild(container);

  // seleziona il nodo da renderizzare (la pagina)
  const pageEl = container.querySelector(".page") as HTMLElement;

  try {
    const canvas: HTMLCanvasElement = await html2canvas(pageEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF("p", "mm", "a4");

    const pageW = pdf.internal.pageSize.getWidth();  // 210
    const pageH = pdf.internal.pageSize.getHeight(); // 297

    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;

    while (heightLeft > 0) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    pdf.save(filename);
  } finally {
    container.remove();
  }
}




  

  // ---------- render ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 backdrop-blur border-b border-white/10 bg-black/30">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-2">
          <strong className="mr-auto text-sm tracking-wide uppercase text-slate-300">Easy FREE CV Builder — Write from Iannacone Alessandro</strong>
          <select value={data.layout} onChange={e=>setData(d=>({...d, layout:e.target.value as Data["layout"]}))} className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm">
            <option value="classic">Layout: Classico</option>
            <option value="sidebar">Layout: Sidebar</option>
            <option value="timeline">Layout: Timeline</option>
          </select>
          <select value={data.theme} onChange={e=>setData(d=>({...d, theme:e.target.value as Data["theme"]}))} className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm">
            <option value="violet">Tema: Violet</option>
            <option value="emerald">Tema: Emerald</option>
            <option value="slate">Tema: Slate</option>
            <option value="rose">Tema: Rose</option>
          </select>
         <button
  onClick={() =>
    exportPdfFromHtmlTemplate(
      (data.profile.name ? data.profile.name.replace(/\s+/g, "_") + "_CV" : "cv") + ".pdf",
      data
    )
  }
  className="px-3 py-1.5 rounded-lg bg-white text-black text-sm"
>
  Genera PDF (template HTML semplice)
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
            {data.exp.map((e,i)=> (
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
            {data.edu.map((e,i)=> (
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
              {data.skills.map((s,i)=> (
                <span key={i} onClick={()=>setData(d=>({...d, skills: d.skills.filter((_,k)=>k!==i)}))} className={`cursor-pointer text-xs border px-2.5 py-1 rounded-full ${palette[data.theme].badge}`}>{s}</span>
              ))}
            </div>
          </Panel>

          <Panel title="Progetti" actions={<Primary onClick={add.proj}>+ Aggiungi</Primary>}>
            {data.proj.map((p,i)=> (
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

          <Panel title="Backup / Import & Export">
            <Row className="gap-2 flex-wrap">
              <Primary onClick={onExport}>Esporta JSON</Primary>
              <Ghost onClick={()=>fileInput.current?.click()}>Importa JSON</Ghost>
              <input ref={fileInput} type="file" accept="application/json" hidden onChange={(e)=>{const f=e.target.files?.[0]; if(f) onImport(f); }} />
            </Row>
          </Panel>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 overflow-auto print:p-0 print:border-0 print:bg-white">
          <CVPreview data={data} />
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

// ---------------- Preview (A4) ----------------
function CVPreview({data}:{data:Data}){
  return (

    <div className="flex justify-center print:block">
      <div
        data-cv-paper
        className="bg-white text-slate-900 w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none rounded-xl print:rounded-none overflow-hidden"
      >
        {data.layout === "sidebar" && <SidebarLayout data={data} />}
        {data.layout === "classic" && <ClassicLayout data={data} />}
        {data.layout === "timeline" && <TimelineLayout data={data} />}
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

// -------- Layout: Sidebar --------
function SidebarLayout({data}:{data:Data}){
  const pal = palette[data.theme];
  return (
    <div className="grid grid-cols-[34%_1fr]">
      {/* Left column */}
      <div className={`p-8 text-white bg-gradient-to-br ${pal.bg}`}>
        <div className="w-28 h-28 rounded-2xl bg-white/10 border border-white/20 mb-6 grid place-items-center text-xs">Foto</div>
        <div className="text-2xl font-bold leading-tight">{data.profile.name||"\u00A0"}</div>
        <div className="opacity-90">{data.profile.title}</div>
        <div className="mt-6 text-sm space-y-1 opacity-90">
          {data.profile.email && <div>{data.profile.email}</div>}
          {data.profile.phone && <div>{data.profile.phone}</div>}
          {data.profile.location && <div>{data.profile.location}</div>}
          {data.profile.website && <div>{data.profile.website}</div>}
        </div>
        {data.skills.length>0 && (
          <div className="mt-8">
            <div className="text-xs uppercase tracking-wider text-white/80 mb-2">Competenze</div>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s,i)=>(<span key={i} className="text-[10px] bg-white/15 border border-white/25 px-2 py-1 rounded-full">{s}</span>))}
            </div>
          </div>
        )}
        {data.proj.length>0 && (
          <div className="mt-8">
            <div className="text-xs uppercase tracking-wider text-white/80 mb-2">Progetti</div>
            <div className="space-y-2 text-sm">
              {data.proj.map((p,i)=>(
                <div key={i} className="">
                  <div className="font-medium">{p.name}{p.link && <span className="opacity-80"> — {p.link}</span>}</div>
                  {p.desc && <div className="opacity-80 text-[12px]">{p.desc}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right column */}
      <div className="p-8">
        <Header profile={data.profile} />
        {data.profile.summary && (
          <Section title="Profilo">
            <p className="text-[13px] leading-6 text-slate-700">{data.profile.summary}</p>
          </Section>
        )}
        {data.exp.length>0 && (
          <Section title="Esperienza">
            <div className="space-y-4">
              {data.exp.map((e,i)=> (
                <div key={i} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{e.role} — {e.company}</div>
                    <div className="text-xs text-slate-500">{e.start} – {e.end}</div>
                  </div>
                  {e.desc && <p className="text-[13px] mt-2 text-slate-700">{e.desc}</p>}
                  {e.stack && (
                    <div className="mt-2 flex flex-wrap gap-2">{e.stack.split(",").map((s,ii)=>(<Tag key={ii}>{s.trim()}</Tag>))}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
        {data.edu.length>0 && (
          <Section title="Istruzione">
            <div className="space-y-2">
              {data.edu.map((e,i)=>(
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <div className="font-medium">{e.degree} — {e.school}</div>
                  <div className="text-xs text-slate-500">{e.start} – {e.end}</div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// -------- Layout: Classic --------
function ClassicLayout({data}:{data:Data}){
  return (
    <div className="p-8">
      <Header profile={data.profile} />
      {data.profile.summary && (
        <Section title="Profilo">
          <p className="text-[13px] leading-6 text-slate-700">{data.profile.summary}</p>
        </Section>
      )}
      {data.exp.length>0 && (
        <Section title="Esperienza">
          {data.exp.map((e,i)=> (
            <div key={i} className="py-3 border-b border-slate-200 last:border-0">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{e.role} — {e.company}</div>
                <div className="text-xs text-slate-500">{e.start} – {e.end}</div>
              </div>
              {e.desc && <p className="text-[13px] mt-1 text-slate-700">{e.desc}</p>}
              {e.stack && (
                <div className="mt-1 flex flex-wrap gap-2">{e.stack.split(",").map((s,ii)=>(<Tag key={ii}>{s.trim()}</Tag>))}</div>
              )}
            </div>
          ))}
        </Section>
      )}
      {data.edu.length>0 && (
        <Section title="Istruzione">
          {data.edu.map((e,i)=>(
            <div key={i} className="text-[13px] py-1 flex items-center justify-between">
              <div className="font-medium">{e.degree} — {e.school}</div>
              <div className="text-xs text-slate-500">{e.start} – {e.end}</div>
            </div>
          ))}
        </Section>
      )}
      {data.skills.length>0 && (
        <Section title="Competenze">
          <div className="flex flex-wrap gap-2">{data.skills.map((s,i)=>(<Tag key={i}>{s}</Tag>))}</div>
        </Section>
      )}
      {data.proj.length>0 && (
        <Section title="Progetti">
          <div className="space-y-2 text-[13px]">
            {data.proj.map((p,i)=>(<div key={i}><span className="font-medium">{p.name}</span>{p.link && <span className="text-slate-600"> — {p.link}</span>} {p.desc && <span>· {p.desc}</span>}</div>))}
          </div>
        </Section>
      )}
    </div>
  );
}

// -------- Layout: Timeline --------
function TimelineLayout({data}:{data:Data}){
  return (
    <div className="p-8">
      <Header profile={data.profile} />
      {data.profile.summary && (
        <Section title="Profilo">
          <p className="text-[13px] leading-6 text-slate-700">{data.profile.summary}</p>
        </Section>
      )}
      {data.exp.length>0 && (
        <Section title="Esperienza (Timeline)">
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200"/>
            {data.exp.map((e,i)=> (
              <div key={i} className="relative mb-5">
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-slate-400 border-2 border-white" />
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{e.role} — {e.company}</div>
                    <div className="text-xs text-slate-500">{e.start} – {e.end}</div>
                  </div>
                  {e.desc && <p className="text-[13px] mt-2 text-slate-700">{e.desc}</p>}
                  {e.stack && (
                    <div className="mt-2 flex flex-wrap gap-2">{e.stack.split(",").map((s,ii)=>(<Tag key={ii}>{s.trim()}</Tag>))}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {data.edu.length>0 && (
        <Section title="Istruzione">
          {data.edu.map((e,i)=>(
            <div key={i} className="text-[13px] py-1 flex items-center justify-between">
              <div className="font-medium">{e.degree} — {e.school}</div>
              <div className="text-xs text-slate-500">{e.start} – {e.end}</div>
            </div>
          ))}
        </Section>
      )}
      {data.skills.length>0 && (
        <Section title="Competenze">
          <div className="flex flex-wrap gap-2">{data.skills.map((s,i)=>(<Tag key={i}>{s}</Tag>))}</div>
        </Section>
      )}
    </div>
  );
}

// ---------------- utils ----------------
// simplify typing for mutation helper to avoid complex indexed access errors
function mut<T extends keyof Data>(i:number, key:T, field: string, value:any, setData:React.Dispatch<React.SetStateAction<Data>>) {
  setData(d => {
    const arr = [...(d[key] as any[])];
    arr[i] = { ...(arr[i] || {}), [field]: value };
    return { ...d, [key]: arr } as Data;
  });
}

function exampleEmpty(): Data {
  return { profile:{ name:"", title:"", email:"", phone:"", location:"", website:"", summary:""}, exp:[], edu:[], skills:[], proj:[], layout:"sidebar", theme:"violet" };
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
      summary: "DevOps con esperienza in Kubernetes, GitOps e sicurezza. Appassionato di automazione e infrastrutture resilienti."
    },
    exp: [
      { company: "Acme S.p.A.", role: "DevOps Engineer", start: "2023-02", end: "Presente", desc: "Gestione Kubernetes, GitOps, osservabilità e hardening.", stack: "Kubernetes, ArgoCD, Prometheus, Grafana, Terraform, AWS" },
      { company: "Contoso", role: "System Administrator", start: "2020-05", end: "2023-01", desc: "Automazione provisioning e monitoring, migrazione a container.", stack: "Ansible, Docker, Zabbix" }
    ],
    edu: [ { school: "Università XYZ", degree: "Informatica", start: "2015", end: "2018", desc: "Triennale" } ],
    skills: ["Kubernetes","Docker","Terraform","AWS","Linux","CI/CD","Networking"],
    proj: [ { name: "PWA eventi", link: "https://example.com", desc: "PWA per gestione eventi e preventivi" } ],
    layout: "sidebar", theme: "violet"
  };
}

// ---------------- print styles ----------------
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `@media print{ body{ background:white } .print\\:p-0{ padding:0 !important } .print\\:border-0{ border-width:0 !important } .print\\:bg-white{ background:white !important } @page{ size:A4; margin:12mm } }`;
  document.head.appendChild(style);
}
