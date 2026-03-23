export interface Project {
  id: string;
  title: string;
  award: string;
  subtitle: string;
  desc: string;
  longDesc: string[];
  tech: string[];
  metrics: { k: string; v: string }[];
  color: string;
  iconName: string;
  github: string;
  live?: string;
  cat: string;
  team: string;
  arch: string;
}

export interface Experience {
  role: string;
  org: string;
  period: string;
  type: string;
  loc: string;
  bullets: string[];
}

export interface Skill {
  cat: string;
  iconName: string;
  items: string[];
}

export interface Award {
  place: string;
  event: string;
  what: string;
  scope: string;
}
