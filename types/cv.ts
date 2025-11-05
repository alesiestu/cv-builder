// ---------------- Types ----------------
interface Profile {
  name: string; title: string; location?: string; email?: string; phone?: string; website?: string; summary?: string;
  license?: string; // ✅ patente (es. "B")
}
interface Experience { company: string; role: string; start: string; end: string; desc?: string; stack?: string; }
interface Education { school: string; degree: string; start?: string; end?: string; desc?: string; }
interface Project { name: string; link?: string; desc?: string; }
interface Language { name: string; level: "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|"Madrelingua"; }  // ✅ lingue

// Se usi Data da "@/types/cv", estendilo lì allo stesso modo:
type Data = {
  profile: Profile;
  exp: Experience[];
  edu: Education[];
  skills: string[];
  proj: Project[];
  languages: Language[];   // ✅
  layout: "classic" | "sidebar" | "timeline";
  theme: "violet" | "slate" | "emerald" | "rose";
};
