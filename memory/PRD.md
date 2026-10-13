# BrandGuard (hackathon prototype)
Digital Risk Protection demo for fictional brand Zenvyra: fake profiles, scam messages, fake apps. Simulated data, rule-based engines, no backend.
Stack: Next.js 15 App Router + Tailwind + lucide-react + sonner in /app/frontend.
Done (Jun 2026): landing search + scan animation, Dashboard, Profiles table + drawer, Scam Analyzer, App Checker, footer, 3D threat network, count-ups, Send to Analyzer, example chips.
Multi-brand: Paynest, Bytebite, Learnova in src/data/seed_more.json (from user file; ages vs 2026-10-06; logo similarity + apps fictional). Engine extended: misspelt-brand handles, Scam bait in bio (max 25), follow-heavy +5; analyzer adds Advance Fee Scam category and safety-guidance rule.
Backlog: P0 Evidence Report PDF; P1 real platform APIs in src/data/provider.js; P2 LLM-backed analyzeMessage.
