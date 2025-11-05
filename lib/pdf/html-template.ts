// lib/pdf/html-template.ts
import type { Data } from "@/types/cv";

// esc ora accetta string | undefined | null
const esc = (s?: string | null) =>
  (s ?? "").replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]!));

export function cvHtmlTemplate(data: Data) {
  const exp = (data.exp ?? []).map(e => `
    <div class="item">
      <div class="row">
        <div class="role"><strong>${esc(e.role)}</strong> — ${esc(e.company)}</div>
        <div class="dates">${esc(e.start)} – ${esc(e.end)}</div>
      </div>
      ${e.desc ? `<div class="desc">${esc(e.desc)}</div>` : ""}
      ${
        e.stack
          ? `<div class="skills">
               <div class="skills-title">Competenze acquisite:</div>
               <ul class="skills-list">
                 ${e.stack.split(",").map(s => `<li>${esc(s.trim())}</li>`).join("")}
               </ul>
             </div>`
          : ""
      }
    </div>
  `).join("");

  const edu = (data.edu ?? []).map(e => `
    <div class="row">
      <div><strong>${esc(e.degree)}</strong> — ${esc(e.school)}</div>
      <div class="dates">${esc(e.start||"")} – ${esc(e.end||"")}</div>
    </div>
    ${e.desc ? `<div class="desc">${esc(e.desc)}</div>` : ""}
  `).join("");

  const langs = (data.languages && data.languages.length)
    ? `<div class="section">
         <h2>Lingue</h2>
         <ul class="ul">
           ${data.languages.map(l => `<li>${esc(l.name)} — <span class="muted">${esc(l.level)}</span></li>`).join("")}
         </ul>
       </div>`
    : "";

  const license = data.profile.license
    ? `<div class="section">
         <h2>Patente</h2>
         <div class="text">${esc(data.profile.license!)}</div>
       </div>`
    : "";

  const skills = (data.skills && data.skills.length)
    ? `<div class="section">
         <h2>Competenze</h2>
         <ul class="ul">
           ${data.skills.map(s => `<li>${esc(s)}</li>`).join("")}
         </ul>
       </div>`
    : "";

  // Type guard per far capire a TS che dopo il filter sono string
  const contacts = [data.profile.email, data.profile.phone, data.profile.location, data.profile.website]
    .filter((x): x is string => Boolean(x))
    .map(esc)
    .join(" • ");

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:0;background:#ffffff;color:#111;font-family:Arial,Helvetica,sans-serif}
  .page{width:794px;min-height:1123px;background:#fff;padding:32px}
  h1{margin:0 0 6px 0;font-size:28px;color:#111}
  h2{margin:20px 0 8px 0;font-size:12px;letter-spacing:.08em;color:#666;text-transform:uppercase}
  .title{font-size:14px;color:#444;margin-bottom:6px}
  .contacts{font-size:11px;color:#666;margin-bottom:12px}
  .sep{height:1px;background:#ddd;margin:12px 0 16px 0}
  .section{margin-bottom:14px}
  .text{font-size:12px;line-height:1.5;color:#222}
  .muted{color:#666}
  .ul{list-style:disc;padding-left:18px;margin:0;color:#222;font-size:12px;line-height:1.5}
  .item{border:1px solid #e5e5e5;border-radius:8px;padding:10px;margin-bottom:10px}
  .row{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px}
  .role{color:#111}
  .dates{font-size:11px;color:#666;white-space:nowrap}
  .desc{margin-top:6px;font-size:12px;color:#222}

  .skills{margin-top:8px}
  .skills-title{font-size:11px;color:#666;margin-bottom:4px}
  .skills-list{
    display:flex; flex-wrap:wrap; gap:6px 16px;
    list-style:disc; padding-left:18px; margin:0;
    font-size:11px; line-height:1.4; color:#333;
  }
</style>
</head>
<body>
  <div class="page noshadow">
    <h1>${esc(data.profile.name)}</h1>
    <div class="title">${esc(data.profile.title || "")}</div>
    <div class="contacts">${contacts}</div>
    <div class="sep"></div>

    ${data.profile.summary ? `
    <div class="section">
      <h2>Profilo</h2>
      <div class="text">${esc(data.profile.summary)}</div>
    </div>` : ""}

    ${(data.exp && data.exp.length) ? `
    <div class="section">
      <h2>Esperienza (Timeline)</h2>
      ${exp}
    </div>` : ""}

    ${(data.edu && data.edu.length) ? `
    <div class="section">
      <h2>Istruzione</h2>
      ${edu}
    </div>` : ""}

    ${langs}
    ${license}
    ${skills}
  </div>
</body>
</html>`;
}
