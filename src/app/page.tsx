'use client'

import { useState, useEffect, useCallback } from "react";
import { MapPin, GraduationCap, Trophy, Award, Package, FlaskConical, Star, Github, FileText, Mail, Linkedin, Phone, ChevronLeft, ExternalLink, Sun, Moon, Brain, BarChart3, Baseline as Baseball, TrendingUp, Hospital, UtensilsCrossed, Users, Briefcase, Send, Download, CircleDot, Boxes, BookOpen, Code2, Cloud, Terminal, Cpu, Database, Globe, Container, GitBranch, Layers, Rocket, Zap, ArrowRight, Check, Sparkles, Activity, Building2, ScrollText, TestTube2, Hash, Music } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════════════════════════════════════
   SHAW TESFAYE — FULL PORTFOLIO
   Pages: Home · About · Projects · Detail · Research · Experience · Contact
   ═══════════════════════════════════════════════════ */

interface Project {
  id: string;
  title: string;
  award: string;
  awardIcon?: LucideIcon;
  subtitle: string;
  desc: string;
  longDesc: string[];
  tech: string[];
  metrics: { k: string; v: string }[];
  color: string;
  Icon: LucideIcon;
  github: string;
  live?: string;
  cat: string;
  team: string;
  arch: string;
}

const PROJECTS: Project[] = [
  {
    id: "prodbykaine", title: "PRODBYKAINE", award: "",
    subtitle: "Full-Stack Beat Store for Music Producer",
    desc: "Built a complete e-commerce beat store for my roommate, a music producer. Next.js 16 + Supabase + Stripe with audio player, licensing system, admin dashboard, email notifications, and free download gating. A personal platform to market beats and showcase his portfolio.",
    longDesc: [
      "Designed and built a full-stack beat store from scratch for my roommate — a music producer who wanted a personal platform to market his work beyond generic marketplaces.",
      "Next.js 16 with App Router, Supabase for auth/database/storage, Stripe for payments with webhook-based order fulfillment, and Resend for transactional emails (purchase receipts, free download links, new drop alerts).",
      "Custom audio player with waveform visualization, sticky playback controls, and seamless page navigation. License system with PDF generation for MP3 Lease, WAV Lease, and Exclusive rights.",
      "Admin dashboard with beat upload (drag-and-drop with tag previews), order management, customer analytics, and real-time sales tracking. Free download email gating for lead generation.",
      "Rate limiting via Upstash Redis, responsive design matching Figma mockups pixel-for-pixel, SEO-optimized with OpenGraph metadata."
    ],
    tech: ["Next.js 16", "TypeScript", "React 19", "Supabase", "Stripe", "Resend", "Upstash Redis", "Tailwind CSS"],
    metrics: [{ k: "Pages", v: "12+" }, { k: "API Routes", v: "14" }, { k: "Stack", v: "Full" }, { k: "Emails", v: "3 Types" }],
    color: "#E8B84B", Icon: Music, github: "https://github.com/shawtes/prodbykaine", live: "", cat: "SWE",
    team: "Solo", arch: "Next.js 16 App Router → Supabase (Auth + DB + Storage) → Stripe Checkout + Webhooks → Resend Emails → Upstash Rate Limiting",
  },
  {
    id: "wdym86", title: "WDYM86", award: "UGA Hacks '26 Runner-Up", awardIcon: Award,
    subtitle: "AI-Powered Restaurant Intelligence Platform",
    desc: "Full-stack restaurant management: ground-up NumPy TCN for demand forecasting, 3 AI agents, Gemini 2.5 with function calling/vision/code exec, check-first POS (7 payment methods), BOHPOS kitchen display, NCR Voyix BSP, Stripe + Solana Pay. 25 pages, 28 routers, 130+ endpoints. Runner-up out of 500+ hackers.",
    longDesc: [
      "Built a ground-up Temporal Convolutional Network in pure NumPy with Negative Binomial output for probabilistic demand prediction. Adam optimizer, dilated causal convolutions (rates 1, 2, 4), residual connections, 14-dimensional input features.",
      "3 autonomous AI agents: Inventory Risk (stockout probability via Normal approximation for NB sum), Reorder Optimization (service-level safety stock with MOQ/shelf-life constraints), Supplier Strategy (weather/traffic/reliability-aware procurement).",
      "Google Gemini 2.5 Flash: 6 function-calling tools, vision analysis for food photos/invoices, code execution for live charts, Google Search grounding with source citations. AI Insight Cards on Dashboard, Menu, and Procurement pages.",
      "Check-first POS with 7 payment methods, BOHPOS kitchen display with real-time POS bridge, end-of-day checkout, delivery mode with status tracking. NCR Voyix BSP integration with HMAC-SHA512 auth, live catalog sync, transaction logs.",
      "6 demo restaurants across USA with location-aware disruption engine. 132 backend tests, Alembic migrations, role-based access, Docker deployment, AWS RDS/S3/Cognito."
    ],
    tech: ["React 18", "TypeScript", "FastAPI", "NumPy", "Gemini 2.5", "Stripe", "Solana Pay", "Docker", "AWS", "PostgreSQL"],
    metrics: [{ k: "Endpoints", v: "130+" }, { k: "Pages", v: "25" }, { k: "Routers", v: "28" }, { k: "Hackers", v: "500+" }, { k: "Stars", v: "10" }, { k: "Tests", v: "132" }],
    color: "#F59E0B", Icon: UtensilsCrossed, github: "https://github.com/ibeeeees/wdym86", live: "https://wdym86.tech", cat: "SWE",
    team: "Ibe Mohammed Ali, Carter Tierney, Shaw Tesfaye",
    arch: "React 18 + TS + Vite \u2192 FastAPI (28 routers) \u2192 NumPy TCN + Gemini 2.5 + AI Agents \u2192 AWS RDS / S3 / Cognito + Stripe + Solana",
  },
  {
    id: "emoryhacks", title: "EmoryHacks", award: "1st Place", awardIcon: Trophy,
    subtitle: "Voice-Based Dementia Detection ML Pipeline",
    desc: "End-to-end speech-based dementia screening: 153 engineered features (142 traditional + 11 2024 voice biomarkers). Enhanced Gradient Boosting F1=0.6154 (+41.9% over baseline). FastAPI inference + React/TypeScript UI.",
    longDesc: [
      "Engineered 153 audio features: sound objects, advanced prosody (pitch contour, jitter, shimmer, HNR), voice-quality metrics, and 11 novel 2024 voice biomarkers from clinical literature.",
      "Complete scikit-learn pipeline: preprocessing, feature selection, model comparison (LR, RF, SVM, GB, XGBoost), hyperparameter tuning, ensembles. Enhanced GB reached F1=0.6154 vs baseline 0.4338 \u2014 +41.9% lift.",
      "Clinically relevant: 64% sensitivity, 59% precision. Production-ready pipeline with trained model artifacts and comparison reports for reproducible evaluation.",
      "Full-stack deployment: FastAPI inference service (audio upload \u2192 preprocessing \u2192 feature extraction \u2192 prediction) and React/TypeScript UI for file upload + results visualization."
    ],
    tech: ["Python", "scikit-learn", "FastAPI", "React", "TypeScript", "XGBoost"],
    metrics: [{ k: "F1 Score", v: "0.6154" }, { k: "Baseline Lift", v: "+41.9%" }, { k: "Sensitivity", v: "64%" }, { k: "Precision", v: "59%" }, { k: "Features", v: "153" }, { k: "Accuracy", v: "61.3%" }],
    color: "#22D3EE", Icon: Brain, github: "https://github.com/shawtes/emoryhacks", cat: "ML",
    team: "Team of 2", arch: "Audio \u2192 Preprocessing \u2192 153 Features \u2192 scikit-learn Pipeline \u2192 Gradient Boosting \u2192 FastAPI \u2192 React/TS UI",
  },
  {
    id: "lsu-research", title: "LSU Alexandria Research", award: "1st Place", awardIcon: Trophy,
    subtitle: "Multi-Granularity Crypto Ensemble Framework",
    desc: "Professor-sponsored research: OHLCV + TA, GARCH(1,1) volatility, Kalman smoothing across 1m/5m/15m. Walk-forward eval: 85.47% win rate, 3.21 Sharpe, R\u00B2=0.9984.",
    longDesc: [
      "Authored 'A Multi-Granularity Ensemble Learning Framework for Cryptocurrency Market Prediction and Algorithmic Trading' \u2014 1st Place at LSU Alexandria, Mathematics & Computer Science.",
      "OHLCV features + technical indicators, GARCH(1,1) volatility modeling, Kalman filter trend smoothing across 1m/5m/15m horizons.",
      "Walk-forward results: 1m MAE=18.37, RMSE=25.55, R\u00B2=0.9984; 5m MAE=41.10, RMSE=56.08, R\u00B2=0.9921; 15m MAE=76.00, RMSE=102.42, R\u00B2=0.9733.",
      "30-day backtest (1h windows): $1,117 profit, 475 trades, 85.47% win rate, 3.21 Sharpe, $20.19 max drawdown via confidence-gated execution (p>0.75)."
    ],
    tech: ["Python", "XGBoost", "SciPy", "statsmodels", "GARCH", "Kalman Filter", "pandas"],
    metrics: [{ k: "R\u00B2 (1m)", v: "0.9984" }, { k: "R\u00B2 (5m)", v: "0.9921" }, { k: "Win Rate", v: "85.47%" }, { k: "Sharpe", v: "3.21" }, { k: "Profit", v: "$1,117" }, { k: "Max DD", v: "$20.19" }],
    color: "#A78BFA", Icon: BarChart3, github: "https://github.com/shawtes/lsu_at_alexandria_undergraduate_symposium", cat: "Research",
    team: "Solo (Professor-Sponsored)", arch: "OHLCV \u2192 TA Features \u2192 GARCH(1,1) \u2192 Kalman Smoothing \u2192 Ensemble ML \u2192 Confidence-Gated Execution \u2192 Walk-Forward Backtest",
  },
  {
    id: "ursim", title: "UrSim", award: "",
    subtitle: "DFS Optimizer \u2014 NBA/NFL/MLB Projections",
    desc: "MILP + genetic algorithms + StackingRegressor/XGBoost ensembles. 500+ features, multiprocessing 4-8x speedup. MAE 3.907, R\u00B2 0.67 on 171k MLB samples. 40% cash rate.",
    longDesc: [
      "DFS projections pipeline for NBA/NFL/MLB using MILP for lineup optimization and genetic algorithms for constraint exploration.",
      "StackingRegressor + XGBoost ensembles with 500+ engineered features (rolling averages, matchup adjustments, park factors, weather, platoon splits).",
      "Multiprocessing via concurrent.futures for 4-8x faster training. MAE 3.907 and R\u00B2 0.67 on 171k MLB samples.",
      "React/Node.js frontend (with grad student). Modular design: +45% NFL score lift, 40% cash rate."
    ],
    tech: ["Python", "XGBoost", "MILP", "Genetic Algorithms", "React", "Node.js", "multiprocessing"],
    metrics: [{ k: "MAE", v: "3.907" }, { k: "R\u00B2", v: "0.67" }, { k: "NFL Lift", v: "+45%" }, { k: "Cash Rate", v: "40%" }, { k: "Features", v: "500+" }, { k: "Samples", v: "171k" }],
    color: "#34D399", Icon: Baseball, github: "https://github.com/shawtes/draftkings-mlb-optimizer", cat: "ML",
    team: "Shaw + Graduate Student", arch: "Data Ingestion \u2192 500+ Features \u2192 Multiprocessing \u2192 Stacking/XGBoost \u2192 MILP Optimization \u2192 React/Node.js",
  },
  {
    id: "urtrade", title: "UrTrade", award: "",
    subtitle: "Automated ML-Driven Crypto Trading",
    desc: "Automated crypto trading: engineered features, time-series ML forecasts, paper-trading ledger, PnL tracking, risk controls. Azure ML for scalable deployment.",
    longDesc: [
      "Automated cryptocurrency trading system with custom feature engineering for time-series data.",
      "ML-driven forecasting for entry/exit signals with configurable risk controls and position sizing.",
      "Paper-trading ledger with real-time PnL tracking and portfolio analytics (Flask + Dash).",
      "Azure ML integration for scalable model deployment and real-time prediction serving."
    ],
    tech: ["Python", "Azure ML", "Flask", "Dash", "Docker", "Time-Series ML"],
    metrics: [{ k: "Deploy", v: "Azure ML" }, { k: "Trading", v: "Automated" }, { k: "Risk", v: "Controlled" }],
    color: "#FBBF24", Icon: TrendingUp, github: "https://github.com/shawtes/coinbase-trading-portfolio", cat: "Systems",
    team: "Solo", arch: "Coinbase API \u2192 Feature Engineering \u2192 Time-Series ML \u2192 Azure ML \u2192 Flask/Dash \u2192 Paper-Trading Ledger",
  },
  {
    id: "ezyzip", title: "EzyZip-2", award: "Azalea Health Hackathon", awardIcon: Award,
    subtitle: "Secure Patient Portal (Solo Build)",
    desc: "Messaging, video calling (WebRTC), medication refills, search-enabled notes. Solo build under hackathon constraints.",
    longDesc: [
      "Secure patient portal built solo under hackathon time constraints at Valdosta State University.",
      "Secure messaging, WebRTC video calling for telehealth, medication refill requests, search-enabled clinical notes.",
      "Flask backend with SQLite, session auth, responsive frontend."
    ],
    tech: ["Flask", "Python", "WebRTC", "SQLite", "HTML/CSS"],
    metrics: [{ k: "Place", v: "2nd" }, { k: "Build", v: "Solo" }, { k: "Features", v: "5+" }],
    color: "#F87171", Icon: Hospital, github: "https://github.com/shawtes/hackton", cat: "SWE",
    team: "Solo", arch: "Flask \u2192 SQLite \u2192 WebRTC Video \u2192 Messaging \u2192 Refills \u2192 Notes Search",
  },
];

const EXPERIENCE = [
  { role: "Founder & Lead Architect", org: "UrSim", period: "Jan 2024 \u2014 Present", type: "v", loc: "Atlanta, GA", bullets: ["DFS optimizer + projections pipeline (NBA/NFL/MLB) using MILP, genetic algorithms, ensemble ML", "MAE 3.907 / R\u00B2 0.67 on 171k MLB samples; 500+ features; multiprocessing 4-8x speedup", "React/Node.js frontend with grad student; +45% NFL score lift, 40% cash rate"] },
  { role: "Founder & Lead Architect", org: "UrTrade", period: "Jan 2024 \u2014 Present", type: "v", loc: "Atlanta, GA", bullets: ["Automated crypto trading: time-series ML forecasts, paper-trading ledger, PnL tracking, risk controls", "Azure ML integration for scalable deployment and real-time inference dashboard"] },
  { role: "Executive Board \u2014 Outreach & Build", org: "ProgSU @ Georgia State", period: "Aug 2025 \u2014 Present", type: "l", loc: "Atlanta, GA", bullets: ["Co-launched student incubator supporting 10+ startups", "Led outreach for builders, mentors, and speakers"] },
  { role: "Re-establishment Lead", org: "IEEE @ Georgia State", period: "Aug 2025 \u2014 Present", type: "l", loc: "Atlanta, GA", bullets: ["Co-led chapter revival; formalized governance/onboarding", "Partnered with ProgSU on funding for large-scale GSU hackathon"] },
];

const SKILLS = [
  { cat: "Languages", Icon: Code2, items: ["Python", "Java", "C"] },
  { cat: "ML / Data Science", Icon: Cpu, items: ["scikit-learn", "XGBoost", "PyTorch (CUDA)", "SciPy", "statsmodels", "pandas", "NumPy", "Matplotlib"] },
  { cat: "Frameworks & Web", Icon: Layers, items: ["Flask", "Dash", "FastAPI", "React", "Next.js", "Node.js", "TypeScript"] },
  { cat: "Infrastructure", Icon: Cloud, items: ["Docker", "Azure ML", "Google Cloud", "Kubernetes", "AWS", "Supabase", "Stripe", "Git", "Linux", "CI/CD"] },
];

const AWARDS = [
  { place: "1st", event: "EmoryHacks", what: "Dementia Detection ML", scope: "Team of 2" },
  { place: "1st", event: "LSU Alexandria Symposium", what: "Crypto Ensemble Framework", scope: "Solo" },
  { place: "2nd", event: "UGA Hacks 2026", what: "WDYM86 Restaurant AI", scope: "Team of 3 \u00B7 500+" },
  { place: "2nd", event: "Azalea Health Hackathon", what: "Secure Patient Portal", scope: "Solo" },
];

const T = {
  dark: { bg: "#060710", card: "rgba(255,255,255,0.025)", border: "rgba(255,255,255,0.06)", accent: "#22D3EE", accent2: "#A78BFA", accent3: "#34D399", text: "#E2E8F0", muted: "#64748B", glow: "rgba(34,211,238,0.10)", hov: "rgba(255,255,255,0.055)", tag: "rgba(34,211,238,0.07)", gold: "#FBBF24", red: "#F87171", grad: "linear-gradient(135deg,#22D3EE,#A78BFA)", navBg: "rgba(6,7,16,0.88)" },
  light: { bg: "#F9FAFB", card: "rgba(255,255,255,0.85)", border: "rgba(0,0,0,0.06)", accent: "#0891B2", accent2: "#7C3AED", accent3: "#059669", text: "#111827", muted: "#6B7280", glow: "rgba(8,145,178,0.06)", hov: "rgba(255,255,255,0.98)", tag: "rgba(8,145,178,0.07)", gold: "#D97706", red: "#DC2626", grad: "linear-gradient(135deg,#0891B2,#7C3AED)", navBg: "rgba(249,250,251,0.88)" },
};

export default function Portfolio() {
  const [dark, setDark] = useState(true);
  const [pg, setPg] = useState("home");
  const [pid, setPid] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: -999, y: -999 });
  const [vis, setVis] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({ name: "", email: "", msg: "" });
  const [sent, setSent] = useState(false);
  const [typed, setTyped] = useState("");
  const c = T[dark ? "dark" : "light"];

  const go = useCallback((p: string, id: string | null = null) => { setPg(p); setPid(id); setVis(new Set()); window.scrollTo?.({ top: 0 }); }, []);

  useEffect(() => { const h = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY }); window.addEventListener("mousemove", h); return () => window.removeEventListener("mousemove", h); }, []);
  useEffect(() => { const ob = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const s = (e.target as HTMLElement).dataset.s; if (s) setVis((p) => new Set([...p, s])); } }), { threshold: 0.08 }); setTimeout(() => document.querySelectorAll("[data-s]").forEach((el) => ob.observe(el)), 60); return () => ob.disconnect(); }, [pg, pid, filter]);
  useEffect(() => { if (pg !== "home") return; let i = 0; const t = "Software Engineer \u00B7 ML Systems \u00B7 Full-Stack \u00B7 Research"; const iv = setInterval(() => { if (i <= t.length) { setTyped(t.slice(0, i)); i++; } else clearInterval(iv); }, 42); return () => clearInterval(iv); }, [pg]);

  // Shared UI
  const Tag = ({ children }: { children: React.ReactNode }) => <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, fontFamily: "monospace", background: c.tag, color: c.accent, margin: "0 5px 5px 0", border: `1px solid ${c.accent}14`, letterSpacing: ".02em" }}>{children}</span>;
  const Card = ({ children, delay = 0, s, sx = {} }: { children: React.ReactNode; delay?: number; s: string; sx?: React.CSSProperties }) => { const sh = vis.has(s); return (
    <div data-s={s} style={{ background: c.card, backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: `1px solid ${c.border}`, borderRadius: 18, padding: 24, transition: "all .5s cubic-bezier(.16,1,.3,1),opacity .55s ease,transform .55s ease", opacity: sh ? 1 : 0, transform: sh ? "translateY(0)" : "translateY(20px)", transitionDelay: `${delay}ms`, overflow: "hidden", ...sx }}
      onMouseEnter={(e) => { e.currentTarget.style.background = c.hov; e.currentTarget.style.borderColor = c.accent + "28"; e.currentTarget.style.boxShadow = `0 12px 40px ${c.glow}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = c.card; e.currentTarget.style.borderColor = c.border; e.currentTarget.style.boxShadow = "none"; }}
    >{children}</div>); };
  const Sec = ({ children, s }: { children: React.ReactNode; s: string }) => <h2 data-s={s} style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.03em", marginBottom: 28, opacity: vis.has(s) ? 1 : 0, transform: vis.has(s) ? "none" : "translateY(14px)", transition: "all .5s ease" }}>{children}</h2>;
  const Btn = ({ children, href, onClick, primary, sx = {} }: { children: React.ReactNode; href?: string; onClick?: () => void; primary?: boolean; sx?: React.CSSProperties }) => { const st: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: primary ? "10px 22px" : "8px 16px", borderRadius: 10, border: primary ? "none" : `1px solid ${c.border}`, background: primary ? c.grad : "transparent", color: primary ? "#fff" : c.text, fontWeight: 700, fontSize: 13, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", transition: "all .2s", ...sx }; const ev = { onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${c.glow}`; }, onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; } }; return href ? <a href={href} target="_blank" rel="noopener noreferrer" style={st} {...ev}>{children}</a> : <button onClick={onClick} style={st} {...ev}>{children}</button>; };
  const Mono = ({ children, sx = {} }: { children: React.ReactNode; sx?: React.CSSProperties }) => <span style={{ fontFamily: "'IBM Plex Mono',monospace", ...sx }}>{children}</span>;
  const Grad = ({ children }: { children: React.ReactNode }) => <span style={{ background: c.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{children}</span>;

  // Nav
  const Nav = () => (
    <nav style={{ position: "sticky", top: 0, zIndex: 200, padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: c.navBg, backdropFilter: "blur(14px)", borderBottom: `1px solid ${c.border}` }}>
      <div onClick={() => go("home")} style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: c.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>ST</div>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-.02em" }}>shaw<span style={{ color: c.accent }}>tesfaye</span></span>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {([["Home","home"],["About","about"],["Projects","projects"],["Research","research"],["Experience","experience"],["Contact","contact"]] as const).map(([l, p]) => (
          <button key={p} onClick={() => go(p)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: pg === p ? c.accent + "15" : "transparent", color: pg === p ? c.accent : c.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .2s" }}>{l}</button>
        ))}
        <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${c.border}`, background: c.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 6 }}>
          {dark ? <Sun size={15} color={c.gold} /> : <Moon size={15} color={c.accent2} />}
        </button>
      </div>
    </nav>
  );

  const Footer = () => (
    <footer style={{ textAlign: "center", padding: "48px 20px 32px", borderTop: `1px solid ${c.border}`, marginTop: 56 }}>
      <Mono sx={{ fontSize: 12, color: c.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Sparkles size={13} color={c.accent} /> Built by Shaw Tesfaye &middot; Designed in Figma &middot; Next.js + TypeScript</Mono>
      <div style={{ fontSize: 11, color: c.muted + "80", marginTop: 6 }}>&copy; 2026 &middot; Atlanta, GA</div>
    </footer>
  );

  // ══════════════ HOME ══════════════
  const Home = () => (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card s="hero" sx={{ gridRow: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 24 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
            <Mono sx={{ fontSize: 11, color: "#22C55E", fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>Open to Opportunities</Mono>
          </div>
          <h1 style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.0, letterSpacing: "-.045em", marginBottom: 14 }}>Shaw<br /><Grad>Tesfaye</Grad></h1>
          <Mono sx={{ fontSize: 16, color: c.muted, minHeight: 24 }}>{typed}<span style={{ animation: "blink 1s infinite", color: c.accent }}>|</span></Mono>
          <div style={{ display: "flex", gap: 10, marginTop: 16, fontSize: 12, color: c.muted, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> Atlanta, GA</span>
            <span>&middot;</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><GraduationCap size={12} /> B.S. CS &mdash; Georgia State (Dec 2026)</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <Btn primary onClick={() => go("projects")}><Rocket size={14} /> View Projects</Btn>
            <Btn onClick={() => go("contact")}><Mail size={14} /> Contact</Btn>
          </div>
        </Card>
        <Card s="awards" delay={80}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><Trophy size={14} color={c.gold} /><Mono sx={{ fontSize: 10, color: c.gold, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Awards</Mono></div>
          {AWARDS.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <div style={{ minWidth: 28, height: 28, borderRadius: 7, background: a.place === "1st" ? c.gold + "18" : c.muted + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: a.place === "1st" ? c.gold : c.muted, fontFamily: "monospace" }}>{a.place}</div>
              <div><div style={{ fontSize: 12, fontWeight: 600 }}>{a.event}</div><div style={{ fontSize: 10, color: c.muted }}>{a.what}</div></div>
            </div>
          ))}
        </Card>
        <Card s="stats" delay={160}>
          {[{ I: Package, l: "Repos", v: "12+", co: c.accent }, { I: FlaskConical, l: "Research", v: "2", co: c.accent2 }, { I: Trophy, l: "Hackathon Wins", v: "4", co: c.gold }, { I: Star, l: "GitHub Stars", v: "12+", co: c.accent3 }].map((s) => (
            <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <s.I size={18} color={s.co} />
              <div><div style={{ fontSize: 20, fontWeight: 800, color: s.co }}>{s.v}</div><Mono sx={{ fontSize: 10, color: c.muted, letterSpacing: ".05em", textTransform: "uppercase" }}>{s.l}</Mono></div>
            </div>
          ))}
        </Card>
        <Card s="gh" delay={120}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}><Github size={16} color={c.text} /><span style={{ fontWeight: 700, fontSize: 14 }}>GitHub</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 2.5, marginBottom: 10 }}>
            {Array.from({ length: 84 }).map((_, i) => { const s = Math.sin(i * 7.3 + 42) * .5 + .5; return <div key={i} style={{ aspectRatio: "1", borderRadius: 2.5, background: s > .75 ? c.accent : s > .5 ? c.accent + "55" : s > .25 ? c.accent + "20" : c.card }} />; })}
          </div>
          <a href="https://github.com/shawtes" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: c.accent, textDecoration: "none", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4 }}>@shawtes <ArrowRight size={12} /></a>
        </Card>
      </div>
      <Sec s="fp-t">Featured <Grad>Projects</Grad></Sec>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {PROJECTS.slice(0, 3).map((p, i) => (
          <Card key={p.id} s={`fp-${i}`} delay={i * 80}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: p.color + "14", border: `1px solid ${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><p.Icon size={18} color={p.color} /></div>
              <div><div style={{ fontSize: 14, fontWeight: 700 }}>{p.title} {p.award && <span style={{ fontSize: 11, color: c.gold, display: "inline-flex", alignItems: "center", gap: 3 }}>{p.awardIcon && <p.awardIcon size={10} />} {p.award}</span>}</div><div style={{ fontSize: 11, color: c.muted }}>{p.subtitle}</div></div>
            </div>
            <p style={{ fontSize: 12, color: c.muted, lineHeight: 1.6, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.desc}</p>
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 10 }}>{p.tech.slice(0, 4).map((t) => <Tag key={t}>{t}</Tag>)}</div>
            <button onClick={() => go("project-detail", p.id)} style={{ fontSize: 12, color: c.accent, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "monospace", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>Details <ArrowRight size={11} /></button>
          </Card>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 20 }}><Btn onClick={() => go("projects")}>All Projects <ArrowRight size={13} /></Btn></div>
    </>
  );

  // ══════════════ ABOUT ══════════════
  const About = () => (
    <>
      <Sec s="ab-t">About <Grad>Me</Grad></Sec>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr", gap: 14 }}>
        <Card s="ab-bio">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><ScrollText size={14} color={c.accent} /><Mono sx={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Bio</Mono></div>
          <p style={{ fontSize: 15, lineHeight: 1.75, marginBottom: 14 }}>I&apos;m <strong>Shaw Tesfaye</strong>, a senior Computer Science student at Georgia State University (graduating December 2026) based in Atlanta, GA. I build ML-driven systems and full-stack applications with a focus on quantitative methods, data engineering, and production-grade software.</p>
          <p style={{ fontSize: 15, lineHeight: 1.75, marginBottom: 14 }}>My work spans healthcare ML (voice-based dementia detection), quantitative finance (crypto ensemble frameworks, DFS optimization), and full-stack SaaS (restaurant intelligence with 130+ API endpoints). I&apos;ve won or placed in 4 hackathons, authored peer-presented research, and built systems processing hundreds of thousands of data points.</p>
          <p style={{ fontSize: 15, lineHeight: 1.75 }}>Beyond code, I co-launched ProgSU (Georgia State&apos;s student incubator supporting 10+ startups) and re-established the IEEE chapter at GSU. I also build for friends &mdash; like <button onClick={() => go("project-detail", "prodbykaine")} style={{ color: c.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline", padding: 0 }}>PRODBYKAINE</button>, a full beat store I built for my roommate to market his music production.</p>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card s="ab-edu" delay={80}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}><GraduationCap size={14} color={c.accent2} /><Mono sx={{ fontSize: 10, color: c.accent2, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Education</Mono></div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Georgia State University</div>
            <div style={{ fontSize: 13, color: c.accent, fontWeight: 600, marginTop: 4 }}>B.S. Computer Science (Senior)</div>
            <Mono sx={{ fontSize: 11, color: c.muted, marginTop: 4 }}>Expected: December 2026</Mono>
            <div style={{ fontSize: 12, color: c.muted, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> Atlanta, GA</div>
          </Card>
          <Card s="ab-sk" delay={160}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}><Terminal size={14} color={c.accent} /><Mono sx={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Tech Stack</Mono></div>
            {SKILLS.map((g) => (
              <div key={g.cat} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}><g.Icon size={11} color={c.muted} /><Mono sx={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>{g.cat}</Mono></div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>{g.items.map((s) => <Tag key={s}>{s}</Tag>)}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
      <Card s="ab-aw" delay={100} sx={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}><Trophy size={14} color={c.gold} /><Mono sx={{ fontSize: 10, color: c.gold, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Honors & Awards</Mono></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {AWARDS.map((a, i) => (
            <div key={i} style={{ padding: 16, borderRadius: 12, background: a.place === "1st" ? c.gold + "08" : c.card, border: `1px solid ${a.place === "1st" ? c.gold + "18" : c.border}`, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: a.place === "1st" ? c.gold : c.muted, fontFamily: "monospace" }}>{a.place}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{a.event}</div>
              <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>{a.what}</div>
              <Mono sx={{ fontSize: 10, color: c.muted, marginTop: 6, display: "block" }}>{a.scope}</Mono>
            </div>
          ))}
        </div>
      </Card>
    </>
  );

  // ══════════════ PROJECTS ══════════════
  const Projects = () => {
    const fp = filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.cat === filter);
    return (<>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <Sec s="pj-t">All <Grad>Projects</Grad></Sec>
        <div style={{ display: "flex", gap: 5 }}>
          {["All", "SWE", "ML", "Research", "Systems"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 13px", borderRadius: 7, border: `1px solid ${filter === f ? c.accent + "35" : c.border}`, background: filter === f ? c.accent + "10" : "transparent", color: filter === f ? c.accent : c.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "monospace" }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {fp.map((p, i) => (
          <Card key={p.id} s={`pj-${i}`} delay={i * 60}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: p.color + "14", border: `1px solid ${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><p.Icon size={18} color={p.color} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700 }}>{p.title} {p.award && <span style={{ fontSize: 11, color: p.award.includes("1st") ? c.gold : c.accent2, display: "inline-flex", alignItems: "center", gap: 3 }}>{p.awardIcon && <p.awardIcon size={10} />} {p.award}</span>}</div><div style={{ fontSize: 11, color: c.muted }}>{p.subtitle}</div></div>
            </div>
            <p style={{ fontSize: 12, color: c.muted, lineHeight: 1.6, marginBottom: 14 }}>{p.desc}</p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(p.metrics.length, 3)},1fr)`, gap: 8, marginBottom: 14, padding: "10px 12px", borderRadius: 10, background: p.color + "06", border: `1px solid ${p.color}10` }}>
              {p.metrics.slice(0, 3).map((m) => (<div key={m.k} style={{ textAlign: "center" }}><Mono sx={{ fontSize: 14, fontWeight: 800, color: p.color }}>{m.v}</Mono><div style={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>{m.k}</div></div>))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 12 }}>{p.tech.slice(0, 6).map((t) => <Tag key={t}>{t}</Tag>)}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => go("project-detail", p.id)} style={{ fontSize: 12, color: c.accent, background: "none", border: "none", fontWeight: 600, cursor: "pointer", fontFamily: "monospace", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>Details <ArrowRight size={11} /></button>
              {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: c.accent3, textDecoration: "none", fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 4 }}>Live <ExternalLink size={11} /></a>}
            </div>
          </Card>
        ))}
      </div>
    </>);
  };

  // ══════════════ PROJECT DETAIL ══════════════
  const Detail = () => {
    const p = PROJECTS.find((x) => x.id === pid);
    if (!p) return <div>Not found. <button onClick={() => go("projects")} style={{ color: c.accent, background: "none", border: "none", cursor: "pointer" }}>Back</button></div>;
    return (<>
      <button onClick={() => go("projects")} style={{ fontSize: 13, color: c.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 4 }}><ChevronLeft size={14} /> Back to Projects</button>
      <Card s="pd-h">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: p.color + "14", border: `1px solid ${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}><p.Icon size={26} color={p.color} /></div>
          <div><div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" }}>{p.title} {p.award && <span style={{ fontSize: 15, color: p.award.includes("1st") ? c.gold : c.accent2 }}>{p.award}</span>}</div><div style={{ fontSize: 15, color: c.muted }}>{p.subtitle}</div></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Btn href={p.github} primary><Github size={14} /> GitHub</Btn>
          {p.live && <Btn href={p.live}><ExternalLink size={14} /> Live Demo</Btn>}
          {p.team && <Mono sx={{ fontSize: 12, color: c.muted, display: "flex", alignItems: "center", gap: 4 }}><Users size={13} /> {p.team}</Mono>}
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(p.metrics.length, 6)},1fr)`, gap: 10, margin: "14px 0" }}>
        {p.metrics.map((m, i) => (<Card key={m.k} s={`pd-m${i}`} delay={i * 40} sx={{ textAlign: "center", padding: 16 }}><Mono sx={{ fontSize: 22, fontWeight: 800, color: p.color }}>{m.v}</Mono><div style={{ fontSize: 10, color: c.muted, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 4 }}>{m.k}</div></Card>))}
      </div>
      {p.arch && <Card s="pd-ar" delay={100} sx={{ margin: "14px 0" }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Boxes size={14} color={c.accent} /><Mono sx={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Architecture</Mono></div><Mono sx={{ fontSize: 12, color: c.text, lineHeight: 1.7, display: "block" }}>{p.arch}</Mono></Card>}
      <Card s="pd-dd" delay={150}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><BookOpen size={14} color={c.accent} /><Mono sx={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Deep Dive</Mono></div>{p.longDesc.map((t, i) => <p key={i} style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 14 }}>{t}</p>)}</Card>
      <Card s="pd-tc" delay={200} sx={{ marginTop: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Layers size={14} color={c.accent} /><Mono sx={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Tech Stack</Mono></div><div style={{ display: "flex", flexWrap: "wrap" }}>{p.tech.map((t) => <Tag key={t}>{t}</Tag>)}</div></Card>
    </>);
  };

  // ══════════════ RESEARCH ══════════════
  const Research = () => {
    const p = PROJECTS.find((x) => x.id === "lsu-research")!;
    return (<>
      <Sec s="rs-t">Published <Grad>Research</Grad></Sec>
      <Card s="rs-p">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: c.accent2 + "14", display: "flex", alignItems: "center", justifyContent: "center" }}><BookOpen size={22} color={c.accent2} /></div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Trophy size={13} color={c.gold} /><Mono sx={{ fontSize: 10, color: c.accent2, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>1st Place &mdash; LSU Alexandria Research Symposium</Mono></div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>A Multi-Granularity Ensemble Learning Framework for Cryptocurrency Market Prediction and Algorithmic Trading</div>
            <Mono sx={{ fontSize: 11, color: c.muted, marginTop: 4 }}>Solo Author &middot; Professor-Sponsored &middot; Mathematics & Computer Science</Mono>
          </div>
        </div>
        {p.longDesc.map((t, i) => <p key={i} style={{ fontSize: 14, lineHeight: 1.75, marginBottom: 12 }}>{t}</p>)}
      </Card>
      <Card s="rs-fc" delay={80} sx={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><Activity size={14} color={c.accent2} /><Mono sx={{ fontSize: 10, color: c.accent2, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Multi-Granularity Forecasting (Walk-Forward)</Mono></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[{ h: "1-Minute", mae: "18.37", rmse: "25.55", r2: "0.9984" }, { h: "5-Minute", mae: "41.10", rmse: "56.08", r2: "0.9921" }, { h: "15-Minute", mae: "76.00", rmse: "102.42", r2: "0.9733" }].map((r) => (
            <div key={r.h} style={{ padding: 18, borderRadius: 12, background: c.accent2 + "06", border: `1px solid ${c.accent2}10`, textAlign: "center" }}>
              <Mono sx={{ fontSize: 10, color: c.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>{r.h}</Mono>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.accent2, fontFamily: "monospace", marginTop: 6 }}>{r.r2}</div>
              <div style={{ fontSize: 10, color: c.muted, marginTop: 2 }}>R&sup2; Score</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10 }}>
                <div><Mono sx={{ fontSize: 13, fontWeight: 700 }}>{r.mae}</Mono><div style={{ fontSize: 9, color: c.muted }}>MAE</div></div>
                <div><Mono sx={{ fontSize: 13, fontWeight: 700 }}>{r.rmse}</Mono><div style={{ fontSize: 9, color: c.muted }}>RMSE</div></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card s="rs-bt" delay={160} sx={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><Zap size={14} color={c.gold} /><Mono sx={{ fontSize: 10, color: c.gold, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Backtest (30 Days, 1-Hour Windows)</Mono></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {[{ k: "Profit", v: "$1,117", co: c.gold }, { k: "Trades", v: "475", co: c.accent }, { k: "Win Rate", v: "85.47%", co: c.accent3 }, { k: "Sharpe", v: "3.21", co: c.accent2 }, { k: "Max DD", v: "$20.19", co: c.red }].map((m) => (
            <div key={m.k} style={{ textAlign: "center", padding: 14, borderRadius: 10, background: m.co + "06", border: `1px solid ${m.co}10` }}><Mono sx={{ fontSize: 20, fontWeight: 800, color: m.co }}>{m.v}</Mono><div style={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 4 }}>{m.k}</div></div>
          ))}
        </div>
      </Card>
      <Card s="rs-tc" delay={200} sx={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Layers size={14} color={c.accent} /><Mono sx={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Methods & Tools</Mono></div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>{p.tech.map((t) => <Tag key={t}>{t}</Tag>)}</div>
        <div style={{ marginTop: 14 }}><Btn href={p.github} primary><Github size={14} /> View Repository</Btn></div>
      </Card>
    </>);
  };

  // ══════════════ EXPERIENCE ══════════════
  const Exp = () => (
    <>
      <Sec s="ex-t">Experience & <Grad>Leadership</Grad></Sec>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {EXPERIENCE.map((e, i) => (
          <Card key={i} s={`ex-${i}`} delay={i * 60}>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: e.type === "v" ? c.accent : c.accent2, boxShadow: `0 0 10px ${e.type === "v" ? c.accent : c.accent2}35`, flexShrink: 0 }} />
                {i < EXPERIENCE.length - 1 && <div style={{ width: 2, flex: 1, background: c.border, marginTop: 8 }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 700 }}>{e.role}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: e.type === "v" ? c.accent + "10" : c.accent2 + "10", color: e.type === "v" ? c.accent : c.accent2, fontWeight: 600, fontFamily: "monospace", display: "flex", alignItems: "center", gap: 3 }}>
                    {e.type === "v" ? <><Rocket size={10} /> Founder</> : <><Building2 size={10} /> Leadership</>}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: c.accent, fontWeight: 600 }}>{e.org}</div>
                <Mono sx={{ fontSize: 11, color: c.muted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} /> {e.period} &middot; {e.loc}</Mono>
                <ul style={{ marginTop: 10, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                  {e.bullets.map((b, j) => <li key={j} style={{ fontSize: 13, color: c.muted, lineHeight: 1.6 }}>{b}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  // ══════════════ CONTACT ══════════════
  const Contact = () => {
    const submit = () => { if (form.name && form.email && form.msg) { setSent(true); setTimeout(() => setSent(false), 4000); setForm({ name: "", email: "", msg: "" }); } };
    const Inp = ({ label, value, onChange, area }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; area?: boolean }) => {
      const st: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.card, color: c.text, fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border .2s", resize: "vertical" };
      return (<div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: c.muted, fontFamily: "monospace", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>{label}</label>
        {area ? <textarea value={value} onChange={onChange} rows={5} style={st} onFocus={(e) => (e.target as HTMLElement).style.borderColor = c.accent} onBlur={(e) => (e.target as HTMLElement).style.borderColor = c.border} /> : <input value={value} onChange={onChange} style={st} onFocus={(e) => (e.target as HTMLElement).style.borderColor = c.accent} onBlur={(e) => (e.target as HTMLElement).style.borderColor = c.border} />}
      </div>);
    };
    return (<>
      <Sec s="ct-t">Get in <Grad>Touch</Grad></Sec>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card s="ct-f">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}><Send size={14} color={c.accent} /><Mono sx={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Send a Message</Mono></div>
          <Inp label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Inp label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Inp label="Message" value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} area />
          <Btn primary onClick={submit} sx={{ width: "100%", justifyContent: "center" }}>{sent ? <><Check size={14} /> Sent!</> : <><Send size={14} /> Send Message</>}</Btn>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card s="ct-l" delay={80}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><Globe size={14} color={c.accent} /><Mono sx={{ fontSize: 10, color: c.accent, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Connect</Mono></div>
            {[
              { I: Mail, l: "Email", v: "stesfaye4@student.gsu.edu", h: "mailto:stesfaye4@student.gsu.edu" },
              { I: Linkedin, l: "LinkedIn", v: "Sineshaw Tesfaye", h: "https://linkedin.com/in/sineshaw-tesfaye-7bb3ba244" },
              { I: Github, l: "GitHub", v: "@shawtes", h: "https://github.com/shawtes" },
              { I: Phone, l: "Phone", v: "678-863-7789", h: "tel:6788637789" },
            ].map((l) => (
              <a key={l.l} href={l.h} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: c.card, border: `1px solid ${c.border}`, textDecoration: "none", color: c.text, transition: "all .2s", marginBottom: 8 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = c.accent + "30"; e.currentTarget.style.background = c.hov; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = c.card; }}>
                <l.I size={16} color={c.accent} />
                <div><Mono sx={{ fontSize: 9, color: c.muted, letterSpacing: ".08em", textTransform: "uppercase" }}>{l.l}</Mono><div style={{ fontSize: 13, fontWeight: 600, color: c.accent }}>{l.v}</div></div>
              </a>
            ))}
          </Card>
          <Card s="ct-r" delay={160}>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ margin: "0 auto 10px", display: "flex", justifyContent: "center" }}><FileText size={40} color={c.accent} style={{ animation: "float 3s ease-in-out infinite" }} /></div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Resume</div>
              <Btn primary><Download size={14} /> Download PDF</Btn>
            </div>
          </Card>
        </div>
      </div>
    </>);
  };

  // ══════════════ RENDER ══════════════
  const pages: Record<string, React.ComponentType> = { home: Home, about: About, projects: Projects, "project-detail": Detail, research: Research, experience: Exp, contact: Contact };
  const P = pages[pg] || Home;
  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, fontFamily: "'Sora','Segoe UI',sans-serif", transition: "background .35s,color .35s" }}>
      <style>{`
        @keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${c.muted}25;border-radius:99px}
        ::selection{background:${c.accent}25;color:${c.accent}}
      `}</style>
      <div style={{ position: "fixed", width: 650, height: 650, borderRadius: "50%", background: `radial-gradient(circle,${c.glow} 0%,transparent 70%)`, left: mouse.x - 325, top: mouse.y - 325, pointerEvents: "none", zIndex: 0, transition: "left .06s linear,top .06s linear" }} />
      <Nav />
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 20px", position: "relative", zIndex: 1 }}><P /></main>
      <Footer />
    </div>
  );
}
