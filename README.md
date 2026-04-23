# AgentB

**AI-Powered Student Companion for Howard University**

AgentB is a full-stack web application developed as a senior capstone project by Group 4. It provides Howard University students with a personalized academic companion that integrates AI-driven tutoring, adaptive learning tools, and campus logistics into a unified platform.

---

## Features

### AI Chat Assistant
- Persistent AI chat accessible from any page via a fixed bottom bar
- Contextual responses tailored to a student's enrolled courses and identified learning style
- Full Markdown and LaTeX math rendering support

### Adaptive Learning Suite
- **Learning Style Quiz** — onboarding assessment that identifies preferred learning modalities (visual, auditory, kinesthetic, reading/writing)
- **Syllabus Upload & Parsing** — parse a course syllabus to automatically extract assignments, deadlines, and topics
- **AI-Generated Courses** — generate structured lessons, chapter breakdowns, and interactive exercises via GPT-backed Edge Functions
- **Flashcard Builder** — auto-generate or manually build per-course flashcard decks
- **Mini Quizzes & Personalized Practice** — difficulty-aware quiz engine with spaced repetition
- **Bloom's Taxonomy Alignment** — content tagged and organized by cognitive level
- **Knowledge Mastery Progress** — visual per-topic and per-chapter progress tracking
- **Writing Feedback** — AI-scored feedback on essays and short-answer responses
- **Rubric Generator** — produce grading rubrics from assignment descriptions
- **Prerequisite Diagnostic** — identify and surface knowledge gaps before beginning a course
- **Bias Audit** — surface potential bias in AI-generated academic content
- **Structured Study Plan** — automated weekly study plans based on upcoming deadlines
- **Microlearning Scheduler** — short, focused study sessions scheduled around a student's calendar
- **Predictive Coaching** — trend analysis that surfaces at-risk performance signals
- **Learning Velocity Dashboard** — tracks rate of progress through course material

### Calendar & Scheduling
- Personal academic calendar with event creation and deadline tracking
- Daily class schedule surfaced directly on the dashboard
- Configurable test reminder system

### Transit & Campus Navigation
- Interactive campus shuttle map powered by Leaflet with real-time route and stop overlays
- Street-level route polylines via OSRM routing, with `localStorage` caching to minimize API calls
- WMATA Metro data proxied through a Supabase Edge Function for live public transit schedules

### Dining
- Howard University dining hall locations, hours, and menu information
- Data aggregated server-side by a dedicated Edge Function

### Notifications
- In-app notification bell with milestone and deadline alerts
- Weekly digest emails via Resend integration
- Per-user configurable notification preferences

### Safety & Resources
- Immediate access to HU emergency contacts, Title IX resources, and campus support services
- Available without authentication

### Analytics
- Aggregate performance metrics computed by Supabase Edge Functions
- Weekly performance reports and learning velocity trend tracking

### Accessibility
- Read Aloud player for any course content using the Web Speech API
- Selection Listen Tooltip — highlight any text and play it aloud immediately
- Full keyboard navigation and ARIA-compliant component design

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Radix UI (shadcn/ui) |
| Routing | React Router DOM v6 |
| Server State | TanStack Query v5 |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage) |
| Edge Functions | Supabase Deno Edge Functions (19 functions) |
| Maps | Leaflet, OSRM public routing API |
| Transit Data | WMATA API (proxied via Edge Function) |
| Email | Resend |
| Math Rendering | KaTeX |
| Markdown | react-markdown |
| Testing | Vitest, Testing Library |
| CI / Deployment | AWS Amplify |

---

## Getting Started

### Prerequisites

- Node.js >= 18 or Bun
- A [Supabase](https://supabase.com) project with the database migrations applied

### Environment Variables

Copy `.env.example` to `.env` and populate the required values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public API key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project reference ID |

### Installation

```bash
npm install
npm run dev
```

The development server starts at `http://localhost:8080`.

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

---

## Project Structure

```
AgentB-SeniorProjectGroup4/
├── src/
│   ├── components/       # Feature, layout, and shared UI components
│   ├── pages/            # Route-level page components
│   ├── contexts/         # React context providers (Tutorial, Auth)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility modules (OSRM routing, class helpers)
│   ├── data/             # Static shuttle and transit data
│   └── integrations/     # Supabase client configuration
├── supabase/
│   ├── functions/        # 19 Deno Edge Functions
│   └── migrations/       # PostgreSQL schema migrations
├── public/               # Static assets
├── amplify.yml           # AWS Amplify build configuration
└── .env.example          # Environment variable reference
```

---

## Deployment

The application is configured for **AWS Amplify**. Merging to `main` triggers an automatic build and deployment using the included `amplify.yml`. Set all `VITE_*` environment variables in the Amplify Console under **App settings > Environment variables** before deploying.

---

## Team

**Senior Project Group 4** — Howard University, Spring 2026

---

## License

This project is an academic capstone submission and is not licensed for commercial use.
