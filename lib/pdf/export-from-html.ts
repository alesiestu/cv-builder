// lib/pdf/export-from-html.ts
"use client";

import type { Data } from "@/types/cv";
import { cvHtmlTemplate } from "./html-template";

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

export async function exportPdfFromHtmlTemplate(filename: string, data: Data) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  // @ts-ignore
  const html2canvas = (window as any).html2canvas;
  // @ts-ignore
  const jsPDF = (window as any).jspdf?.jsPDF;

  if (!html2canvas || !jsPDF) { alert("Librerie PDF non disponibili (CSP/CDN bloccato?)"); return; }

  // --- Monta il template off-screen a larghezza A4 (96dpi ≈ 794px) ---
  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.width = "794px";          // A4 in px a ~96dpi
  container.style.background = "#ffffff";
  container.innerHTML = cvHtmlTemplate(data);
  document.body.appendChild(container);

  const pageEl = container.querySelector(".page") as HTMLElement;

  // IMPORTANT: disattiva la min-height del template per evitare extra pixel
  const prevMinH = pageEl.style.minHeight;
  pageEl.style.minHeight = "0";

  try {
    const canvas: HTMLCanvasElement = await html2canvas(pageEl, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWmm = pdf.internal.pageSize.getWidth();   // 210
    const pageHmm = pdf.internal.pageSize.getHeight();  // 297

    // Dimensioni immagine che inseriamo nel PDF (in mm)
    const imgWmm = pageWmm;
    const imgHmm = (canvas.height * imgWmm) / canvas.width;

    // Quante pagine servono? Togli un epsilon per evitare pagina vuota
    const EPS = 0.001;
    const totalPages = Math.ceil((imgHmm - EPS) / pageHmm);

    // Prima pagina
    pdf.addImage(imgData, "JPEG", 0, 0, imgWmm, imgHmm);

    // Pagine successive (se necessarie), riposizionando verticalmente l’immagine
    for (let i = 1; i < totalPages; i++) {
      pdf.addPage();
      const y = -(i * pageHmm); // offset negativo per “scorrere” l’immagine
      pdf.addImage(imgData, "JPEG", 0, y, imgWmm, imgHmm);
    }

    // Safety net: se per qualsiasi motivo è stata aggiunta un’ultima pagina vuota
    // (può capitare con alcuni viewer), eliminala.
    const n = (pdf as any).getNumberOfPages?.() ?? 1;
    if (n > 1) {
      // prova a capire se l'ultima è vuota confrontando l’altezza totale vs pagine
      if (imgHmm <= pageHmm + EPS) {
        // contenuto 1 pagina → se abbiamo 2 pagine, rimuovi l'ultima
        (pdf as any).deletePage?.(n);
      }
    }

    pdf.save(filename);
  } finally {
    // ripristina stile e pulizia
    pageEl.style.minHeight = prevMinH;
    container.remove();
  }
}
