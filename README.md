# AcademiaConnect

**One home for everything a university student does: learn, join, pay and talk.**

AcademiaConnect is a full-stack university platform. Students follow courses with video lectures and notes, register for the next semester, pay tuition and bus fees, evaluate their courses, join clubs and events and message each other in real time. An admin panel manages all of it.

| | |
|---|---|
| **Live site** | https://YOUR-PROJECT.vercel.app *(replace with your deployed URL)* |
| **API (Render)** | https://YOUR-SERVER.onrender.com *(replace with your deployed URL)* |
| **Server repository** | `academiaconnect-server` (the sibling folder of this repository) |

## Features

- **Student dashboard.** Today's class routine, GPA trend chart, fees due, unread messages, upcoming events, latest notices, clubs and bus pass status on one page.
- **Courses with video lectures and notes.** YouTube lectures with per-student watch progress, written notes, PDFs, slides, links, assessment breakdown, learning outcomes and related courses.
- **Clubs and events.** Join or leave clubs, reserve event seats and get a QR ticket. Seat counts update as people reserve.
- **University-wide notices.** Pinned, important and urgent notices with attachments. A new notice notifies every student.
- **Real-time messaging.** Direct and group chats over Socket.io with typing indicators, read receipts, online presence and instant notifications.
- **Student directory and profiles.** Editable profiles with photo, bio, department, batch, interests and social links, plus profile pages for classmates and a one-click message button.
- **Semester registration.** Section picker that checks prerequisites, schedule clashes, seat limits and the credit range, with a live fee estimate and weekly timetable preview.
- **Semester-wise courses taken.** Every semester with grades, grade points, GPA and CGPA. Results of a finished semester unlock once its course evaluations are done.
- **Anonymous course evaluation.** Eight-question star rating per course with an optional comment. Admins only ever see combined results, never who wrote what.
- **Tuition and fee payments.** Itemised bills, tuition waivers, three installments, a sandbox payment gateway (wallet, card, bank) and printable receipts.
- **Transportation fee payments.** Browse bus routes and stops, request a pass, pay the fee and show a QR bus pass.
- **Admin panel.** Overview charts, full CRUD for courses (lectures, notes, assessment), clubs, events, notices, semesters, sections and bus routes, user roles and waivers, grade entry, invoices, cash payments and refunds, bus passes, anonymous evaluation results and the contact inbox.
- **Authentication.** BetterAuth with the MongoDB adapter and JWT. Email and password or Google. Visitors are sent to login and brought back to the page they wanted.
- **Design.** Dark and light themes, Framer Motion animation, fully responsive from 360px phones to wide desktops.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + DaisyUI 5 · Framer Motion · BetterAuth (MongoDB adapter, JWT plugin) · TanStack Query · Socket.io client · Recharts · Sonner toasts · React Icons (FaXTwitter) and Lucide.

The Express and MongoDB API lives in the companion `server` repository.

## Getting started

You need Node.js 20.9 or newer and a MongoDB database (local or Atlas).

```bash
# 1. Start the API first (see the server README), then:
cd client
npm install
cp .env.example .env.local     # fill in the values, see below
npm run dev                    # http://localhost:3000
```

Useful scripts: `npm run dev`, `npm run build`, `npm start`, `npm run typecheck`.

### Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI`, `MONGODB_DB` | Database used by BetterAuth. Use the **same** database as the server. |
| `BETTER_AUTH_SECRET` | Long random string (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | Public URL of this site (`http://localhost:3000` locally). |
| `NEXT_PUBLIC_API_URL` | Base URL of the Express API. |
| `NEXT_PUBLIC_SOCKET_URL` | Base URL of the Socket.io server (same as the API). |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google login. Redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`. Leave empty and the Google button shows a friendly message while email login keeps working. |
| `ADMIN_EMAILS` | Comma separated emails that become admins when they sign up. |
| `TRUSTED_ORIGINS` | Optional. Extra origins BetterAuth should trust (comma separated), for example a Vercel preview URL. |
| `SMTP_*` | Optional. Without SMTP the password reset link is printed in the Next.js server console. |

### Demo accounts

After the server's `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Student | `student@academiaconnect.test` | `Student@123` |
| Admin | `admin@academiaconnect.test` | `Admin@123` |

Sandbox payments accept the verification code `123456`. Use an 11-digit wallet number starting with `01`, the last 4 digits of any card, or any bank reference of 4 or more characters.

## Project structure

```
src/
  app/
    (auth)/        login, register, forgot and reset password
    (main)/        public pages and every signed-in page, including /admin
    api/auth/      BetterAuth route handler
  components/      shell, UI kit, chat, admin toolkit, checkout, timetable
  hooks/           data fetching, actions and URL state helpers
  lib/             auth, API client, validation, formatting, types
  proxy.ts         protects private routes and keeps the desired route for after login
```

## Deployment

Deploy this folder to **Vercel** as a Next.js project and set the environment variables above. Deploy the server to Render first so you have its URL. The full walkthrough, including Google OAuth and seeding, is in `DEPLOYMENT.md` at the root of the project bundle.

## Credits

Photos are hosted by [Pexels](https://www.pexels.com) and shown with their free licence. Lecture videos are embedded from YouTube.
