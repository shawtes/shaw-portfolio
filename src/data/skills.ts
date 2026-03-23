import { Skill, Award } from './types';

export const SKILLS: Skill[] = [
  { cat: "Languages", iconName: "code", items: ["Python", "Java", "C"] },
  { cat: "ML / Data Science", iconName: "cpu", items: ["scikit-learn", "XGBoost", "PyTorch (CUDA)", "SciPy", "statsmodels", "pandas", "NumPy", "Matplotlib"] },
  { cat: "Frameworks & Web", iconName: "layers", items: ["Flask", "Dash", "FastAPI", "React", "Next.js", "Node.js", "TypeScript"] },
  { cat: "Infrastructure", iconName: "cloud", items: ["Docker", "Azure ML", "Google Cloud", "Kubernetes", "AWS", "Supabase", "Stripe", "Git", "Linux", "CI/CD"] },
];

export const AWARDS: Award[] = [
  { place: "1st", event: "EmoryHacks", what: "Dementia Detection ML", scope: "Team of 2" },
  { place: "1st", event: "LSU Alexandria Symposium", what: "Crypto Ensemble Framework", scope: "Solo" },
  { place: "2nd", event: "UGA Hacks 2026", what: "WDYM86 Restaurant AI", scope: "Team of 3 · 500+" },
  { place: "2nd", event: "Azalea Health Hackathon", what: "Secure Patient Portal", scope: "Solo" },
];
