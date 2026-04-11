

## Plan: Import AgentB Frontend Code from GitHub

### Summary

The AgentB-SeniorProjectGroup4 repo is a large adaptive learning platform built with the same Lovable stack (React + Vite + Tailwind + shadcn/ui + Supabase). The GitHub repo code hasn't synced into this project, so I need to manually fetch and recreate every source file.

### Scope of the Codebase

**10 Pages**: Index, Auth, CalendarPage, Profile, ReadAloudDemo, CoursePage, TransitPage, RubricsPage, NotificationsPage, AnalyticsPage, NotFound

**~40 Custom Components**: Dashboard, ChatInterface, CourseHub, TransitMap, LearningStyleQuiz, PlacementQuiz, SyllabusUpload, AssignmentUpload, BiasAudit, BloomTaxonomy, RubricCard, NotificationBell, and many more

**~20 Custom Hooks**: useAgentBChat, useProfile, useRubrics, useNotifications, useLearningVelocity, useConsent, useCourseMastery, etc.

**2 Lib files**: utils.ts, uploadEngine.ts

**13 Edge Functions**: agent-b-chat, generate-course, generate-rubric, transit-feed, predictive-coaching, milestone-notifications, etc.

**~30 Database Migrations**

**Extra dependencies**: next-themes, leaflet, react-leaflet (not in current project), katex, recharts

### Implementation Plan

#### Step 1: Update package.json with missing dependencies
Add: `next-themes`, `leaflet`, `@types/leaflet`, `katex`, `recharts`, `@tailwindcss/typography`, and any other deps from the source repo not already present.

#### Step 2: Fetch and recreate all source files
I will fetch each file from GitHub's raw content URL and write it into this project. This will be done in batches:
- **Batch 1**: Core files (App.tsx, index.css, index.html, tsconfig files)
- **Batch 2**: All 10 pages
- **Batch 3**: All ~40 components (non-UI custom ones)
- **Batch 4**: All ~20 hooks
- **Batch 5**: Lib files (uploadEngine.ts)
- **Batch 6**: Supabase integration files (types.ts, client.ts)
- **Batch 7**: All 13 edge functions
- **Batch 8**: Config files (tailwind.config.ts if different)

#### Step 3: Fix the existing build error
The current `@supabase/supabase-js` import error will be resolved by updating package.json with the dependency.

### What will NOT be done (backend -- for your document)
- **Database migrations** will not be run. The ~30 migration files define tables, RLS policies, triggers, etc. that need to be applied to the new Supabase project. This is the backend work you mentioned you'll address via a document.
- **Edge function secrets** (like OpenAI API keys) need to be configured in the new Supabase project.
- **Supabase project URL/keys** in the client will point to this project's Supabase instance, not the old one.

### Backend Issues to Expect
Once the frontend is up, these will be the backend gaps:
1. **No database tables exist** -- all ~30 migrations need to be applied to create tables (profiles, courses, assignments, quiz results, notifications, transit data, rubrics, etc.)
2. **Edge functions need deployment** -- 13 functions need to be deployed to the new Supabase project
3. **Edge function secrets** -- API keys (likely OpenAI) need to be configured
4. **Storage buckets** -- if any exist in the old project (for syllabus/assignment uploads)
5. **Auth providers** -- need to be configured in the new Supabase dashboard

### Estimated Effort
This is a large migration requiring fetching and writing 80+ files. It will take multiple rounds of implementation.

