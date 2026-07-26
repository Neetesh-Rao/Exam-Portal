# HireDesk — Hiring & Assessment Platform

A modern, full-stack hiring and test/exam platform built with Next.js and PostgreSQL.

## Features

### For Recruiters/Admins
- **Question Bank**: Create MCQ, coding, text, fill-in-blank questions with difficulty tags
- **Test Builder**: Multi-step wizard to create assessments with sections
- **Proctoring**: Tab-switch detection, fullscreen enforcement, copy-paste blocking
- **Candidate Management**: Add candidates, bulk invite via email
- **Live Monitoring**: Real-time violation tracking during tests
- **Analytics**: Score distributions, completion rates, hiring funnel
- **Submissions Review**: Auto-scoring + manual grading interface

### For Candidates
- **Test Instructions**: Clear rules and system check before starting
- **Exam Interface**: Question palette, timer, mark-for-review
- **Auto-save**: Answers saved in real-time
- **Proctoring Compliance**: Violation warnings with escalation

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: JWT (access + refresh tokens)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and secrets

# Push database schema
npx drizzle-kit push

# Run development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hiredesk
JWT_SECRET=your-jwt-secret-here
REFRESH_SECRET=your-refresh-secret-here
```

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard pages
│   ├── api/            # API routes
│   ├── candidate/      # Candidate portal
│   ├── take-test/      # Test-taking experience
│   ├── login/          # Authentication
│   └── register/
├── components/
│   ├── ui/             # Design system components
│   └── layout/         # Layout components
├── db/
│   ├── schema.ts       # Drizzle schema
│   └── index.ts        # Database connection
└── lib/
    ├── auth.ts         # JWT utilities
    └── api-utils.ts    # API helpers
```

## User Roles

- **super_admin**: Full access to everything
- **admin**: Company-wide access
- **recruiter**: Create tests, invite candidates, view submissions
- **interviewer**: View and grade submissions only
- **candidate**: Take tests, view results

## API Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Questions
- `GET /api/questions` - List questions
- `POST /api/questions` - Create question
- `PATCH /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Tests
- `GET /api/tests` - List tests
- `POST /api/tests` - Create test
- `PATCH /api/tests/:id` - Update test
- `POST /api/tests/:id/publish` - Publish test

### Candidates & Invites
- `GET /api/candidates` - List candidates
- `POST /api/candidates` - Add candidate
- `POST /api/invites/bulk` - Send bulk invitations
- `GET /api/invites/:token/validate` - Validate invite token

### Submissions
- `POST /api/submissions/start` - Start test
- `PATCH /api/submissions/:id/answer` - Save answer
- `POST /api/submissions/:id/submit` - Submit test
- `POST /api/submissions/:id/violation` - Log violation

## Design System

The platform uses a monochrome design with accent colors:
- **Primary**: Black (#0A0A0A) / White
- **Accent**: Indigo (#4F46E5) for CTAs and active states
- **Status**: Green (success), Amber (warning), Red (danger)
- **Typography**: Inter for UI, monospace for code

## License

MIT
