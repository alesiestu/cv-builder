// types/cv.ts

// Linguaggi (CEFR) + Madrelingua
export type LangLevel = 'A1'|'A2'|'B1'|'B2'|'C1'|'C2'|'Madrelingua';

export interface Language {
  name: string;
  level: LangLevel;
}

export interface Profile {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  summary?: string;
  // Patente (es. "B")
  license?: string;
}

export interface Experience {
  company: string;
  role: string;
  start: string; // YYYY-MM o anno
  end: string;   // YYYY-MM, "Presente", ecc.
  desc?: string;
  // stringa separata da virgole, es. "Kubernetes, Terraform"
  stack?: string;
}

export interface Education {
  school: string;
  degree: string;
  start?: string; // anno
  end?: string;   // anno
  desc?: string;
}

export interface Project {
  name: string;
  link?: string;
  desc?: string;
}

export type Theme = 'violet' | 'slate' | 'emerald' | 'rose';
export type Layout = 'sidebar' | 'classic' | 'timeline';

// Struttura dati principale usata da tutta l’app
export interface Data {
  profile: Profile;
  exp: Experience[];
  edu: Education[];
  skills: string[];
  proj: Project[];
  // opzionale per retrocompatibilità con vecchi JSON
  languages?: Language[];
  layout: Layout;
  theme: Theme;
}
