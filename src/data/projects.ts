import { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: "prodbykaine", title: "PRODBYKAINE", award: "",
    subtitle: "Full-Stack Beat Store for Music Producer",
    desc: "Built a complete e-commerce beat store for my roommate, a music producer. Next.js 16 + Supabase + Stripe with audio player, licensing system, admin dashboard, email notifications, and free download gating.",
    longDesc: [
      "Designed and built a full-stack beat store from scratch for my roommate — a music producer who wanted a personal platform to market his work beyond generic marketplaces.",
      "Next.js 16 with App Router, Supabase for auth/database/storage, Stripe for payments with webhook-based order fulfillment, and Resend for transactional emails.",
      "Custom audio player with waveform visualization, sticky playback controls, and seamless page navigation. License system with PDF generation for MP3 Lease, WAV Lease, and Exclusive rights.",
      "Admin dashboard with beat upload, order management, customer analytics, and real-time sales tracking. Free download email gating for lead generation.",
      "Rate limiting via Upstash Redis, responsive design, SEO-optimized with OpenGraph metadata."
    ],
    tech: ["Next.js 16", "TypeScript", "React 19", "Supabase", "Stripe", "Resend", "Upstash Redis", "Tailwind CSS"],
    metrics: [{ k: "Pages", v: "12+" }, { k: "API Routes", v: "14" }, { k: "Stack", v: "Full" }, { k: "Emails", v: "3 Types" }],
    color: "#E8B84B", iconName: "music", github: "https://github.com/shawtes/prodbykaine", live: "", cat: "SWE",
    team: "Solo", arch: "Next.js 16 App Router → Supabase → Stripe + Webhooks → Resend → Upstash Rate Limiting",
  },
  {
    id: "wdym86", title: "WDYM86", award: "UGA Hacks '26 Runner-Up",
    subtitle: "AI-Powered Restaurant Intelligence Platform",
    desc: "Full-stack restaurant management: ground-up NumPy TCN for demand forecasting, 3 AI agents, Gemini 2.5 with function calling/vision/code exec, check-first POS. Runner-up out of 500+ hackers.",
    longDesc: [
      "Built a ground-up Temporal Convolutional Network in pure NumPy with Negative Binomial output for probabilistic demand prediction.",
      "3 autonomous AI agents: Inventory Risk, Reorder Optimization, Supplier Strategy.",
      "Google Gemini 2.5 Flash: 6 function-calling tools, vision analysis, code execution.",
      "Check-first POS with 7 payment methods, BOHPOS kitchen display, NCR Voyix BSP integration.",
      "6 demo restaurants, 132 backend tests, Alembic migrations, role-based access, Docker deployment."
    ],
    tech: ["React 18", "TypeScript", "FastAPI", "NumPy", "Gemini 2.5", "Stripe", "Solana Pay", "Docker", "AWS", "PostgreSQL"],
    metrics: [{ k: "Endpoints", v: "130+" }, { k: "Pages", v: "25" }, { k: "Routers", v: "28" }, { k: "Hackers", v: "500+" }, { k: "Stars", v: "10" }, { k: "Tests", v: "132" }],
    color: "#F59E0B", iconName: "utensils", github: "https://github.com/ibeeeees/wdym86", live: "https://wdym86.tech", cat: "SWE",
    team: "Ibe Mohammed Ali, Carter Tierney, Shaw Tesfaye",
    arch: "React 18 + TS + Vite → FastAPI → NumPy TCN + Gemini 2.5 → AWS RDS / S3 / Cognito + Stripe + Solana",
  },
  {
    id: "emoryhacks", title: "EmoryHacks", award: "1st Place",
    subtitle: "Voice-Based Dementia Detection ML Pipeline",
    desc: "End-to-end speech-based dementia screening: 153 engineered features. Enhanced Gradient Boosting F1=0.6154 (+41.9% over baseline). FastAPI inference + React/TypeScript UI.",
    longDesc: [
      "Engineered 153 audio features including 11 novel 2024 voice biomarkers from clinical literature.",
      "Complete scikit-learn pipeline with Enhanced GB reaching F1=0.6154 vs baseline 0.4338.",
      "Clinically relevant: 64% sensitivity, 59% precision.",
      "Full-stack deployment: FastAPI inference service and React/TypeScript UI."
    ],
    tech: ["Python", "scikit-learn", "FastAPI", "React", "TypeScript", "XGBoost"],
    metrics: [{ k: "F1 Score", v: "0.6154" }, { k: "Baseline Lift", v: "+41.9%" }, { k: "Sensitivity", v: "64%" }, { k: "Precision", v: "59%" }, { k: "Features", v: "153" }, { k: "Accuracy", v: "61.3%" }],
    color: "#22D3EE", iconName: "brain", github: "https://github.com/shawtes/emoryhacks", cat: "ML",
    team: "Team of 2", arch: "Audio → 153 Features → scikit-learn Pipeline → Gradient Boosting → FastAPI → React/TS UI",
  },
  {
    id: "lsu-research", title: "LSU Alexandria Research", award: "1st Place",
    subtitle: "Multi-Granularity Crypto Ensemble Framework",
    desc: "Professor-sponsored research: OHLCV + TA, GARCH(1,1) volatility, Kalman smoothing. Walk-forward eval: 85.47% win rate, 3.21 Sharpe, R²=0.9984.",
    longDesc: [
      "Authored 'A Multi-Granularity Ensemble Learning Framework for Cryptocurrency Market Prediction and Algorithmic Trading' — 1st Place.",
      "OHLCV features + technical indicators, GARCH(1,1) volatility modeling, Kalman filter trend smoothing.",
      "Walk-forward results: 1m R²=0.9984; 5m R²=0.9921; 15m R²=0.9733.",
      "30-day backtest: $1,117 profit, 475 trades, 85.47% win rate, 3.21 Sharpe."
    ],
    tech: ["Python", "XGBoost", "SciPy", "statsmodels", "GARCH", "Kalman Filter", "pandas"],
    metrics: [{ k: "R² (1m)", v: "0.9984" }, { k: "R² (5m)", v: "0.9921" }, { k: "Win Rate", v: "85.47%" }, { k: "Sharpe", v: "3.21" }, { k: "Profit", v: "$1,117" }, { k: "Max DD", v: "$20.19" }],
    color: "#A78BFA", iconName: "chart", github: "https://github.com/shawtes/lsu_at_alexandria_undergraduate_symposium", cat: "Research",
    team: "Solo (Professor-Sponsored)", arch: "OHLCV → TA Features → GARCH(1,1) → Kalman Smoothing → Ensemble ML → Walk-Forward Backtest",
  },
  {
    id: "ursim", title: "UrSim", award: "",
    subtitle: "DFS Optimizer — NBA/NFL/MLB Projections",
    desc: "MILP + genetic algorithms + StackingRegressor/XGBoost ensembles. 500+ features, multiprocessing 4-8x speedup. MAE 3.907, R² 0.67.",
    longDesc: [
      "DFS projections pipeline for NBA/NFL/MLB using MILP for lineup optimization and genetic algorithms.",
      "StackingRegressor + XGBoost ensembles with 500+ engineered features.",
      "Multiprocessing via concurrent.futures for 4-8x faster training.",
      "React/Node.js frontend. Modular design: +45% NFL score lift, 40% cash rate."
    ],
    tech: ["Python", "XGBoost", "MILP", "Genetic Algorithms", "React", "Node.js", "multiprocessing"],
    metrics: [{ k: "MAE", v: "3.907" }, { k: "R²", v: "0.67" }, { k: "NFL Lift", v: "+45%" }, { k: "Cash Rate", v: "40%" }, { k: "Features", v: "500+" }, { k: "Samples", v: "171k" }],
    color: "#34D399", iconName: "baseball", github: "https://github.com/shawtes/draftkings-mlb-optimizer", cat: "ML",
    team: "Shaw + Graduate Student", arch: "Data → 500+ Features → Multiprocessing → Stacking/XGBoost → MILP → React/Node.js",
  },
  {
    id: "urtrade", title: "UrTrade", award: "",
    subtitle: "Automated ML-Driven Crypto Trading",
    desc: "Automated crypto trading: engineered features, time-series ML forecasts, paper-trading ledger, PnL tracking, risk controls. Azure ML deployment.",
    longDesc: [
      "Automated cryptocurrency trading system with custom feature engineering.",
      "ML-driven forecasting for entry/exit signals with configurable risk controls.",
      "Paper-trading ledger with real-time PnL tracking (Flask + Dash).",
      "Azure ML integration for scalable deployment."
    ],
    tech: ["Python", "Azure ML", "Flask", "Dash", "Docker", "Time-Series ML"],
    metrics: [{ k: "Deploy", v: "Azure ML" }, { k: "Trading", v: "Automated" }, { k: "Risk", v: "Controlled" }],
    color: "#FBBF24", iconName: "trending", github: "https://github.com/shawtes/coinbase-trading-portfolio", cat: "Systems",
    team: "Solo", arch: "Coinbase API → Feature Engineering → Time-Series ML → Azure ML → Flask/Dash → Paper-Trading",
  },
  {
    id: "ezyzip", title: "EzyZip-2", award: "Azalea Health Hackathon",
    subtitle: "Secure Patient Portal (Solo Build)",
    desc: "Messaging, video calling (WebRTC), medication refills, search-enabled notes. Solo build under hackathon constraints.",
    longDesc: [
      "Secure patient portal built solo under hackathon time constraints.",
      "Secure messaging, WebRTC video calling, medication refills, clinical notes.",
      "Flask backend with SQLite, session auth, responsive frontend."
    ],
    tech: ["Flask", "Python", "WebRTC", "SQLite", "HTML/CSS"],
    metrics: [{ k: "Place", v: "2nd" }, { k: "Build", v: "Solo" }, { k: "Features", v: "5+" }],
    color: "#F87171", iconName: "hospital", github: "https://github.com/shawtes/hackton", cat: "SWE",
    team: "Solo", arch: "Flask → SQLite → WebRTC Video → Messaging → Refills → Notes Search",
  },
];
