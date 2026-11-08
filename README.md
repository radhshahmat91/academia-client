# AcademiaConnect

**One home for everything a university student does: learn, join, pay and talk.**

AcademiaConnect is a full-stack university platform. Students follow courses with video lectures and notes, register for the next semester, pay tuition and bus fees, evaluate their courses, join clubs and events and message each other in real time. An admin panel manages all of it.

| | |
|---|---|
| **Live site** | https://YOUR-PROJECT.vercel.app *(replace with your deployed URL)* |
| **API (Render)** | https://YOUR-SERVER.onrender.com *(replace with your deployed URL)* |
| **Server repository** | https://github.com/YOUR-NAME/academiaconnect-server *(replace with your repository link)* |

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
- **Tuition and fee payments.** Itemised bills, tuition waivers, three installments, a sandbox payment gateway (bKash, Nagad, Rocket, bank card or bank transfer) and printable receipts.
- **Transportation fee payments.** Browse bus routes and stops, request a pass, pay the fee and show a QR bus pass.
- **Admin panel.** Overview charts, full CRUD for courses (lectures, notes, assessment), clubs, events, notices, semesters, sections and bus routes, user roles and waivers, grade entry, invoices, cash payments and refunds, bus passes, anonymous evaluation results and the contact inbox.
- **Authentication.** BetterAuth with the MongoDB adapter and JWT. Email and password or Google. Visitors are sent to login and brought back to the page they wanted.
- **Design.** Dark and light themes, Framer Motion animation, fully responsive from 360px phones to wide desktops.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + DaisyUI 5 · Framer Motion · BetterAuth (MongoDB adapter, JWT plugin) · TanStack Query · Socket.io client · Recharts · Sonner toasts · React Icons (FaXTwitter) and Lucide.

The Express and MongoDB API lives in the companion `server` repository.

## Getting started

You need Node.js 20.9 or newer (`node -v`) and a MongoDB database: a free [Atlas](https://www.mongodb.com/atlas) cluster or one on your computer.

```bash
# 1. Set up and seed the API first (see the server README), then:
cd client
npm install
cp .env.example .env.local     # Windows PowerShell: Copy-Item .env.example .env.local
```

Open `.env.local` and set `MONGODB_URI` and `MONGODB_DB` to the **same values as in the server's `.env`**, and give `BETTER_AUTH_SECRET` any long random text (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` prints one). Then:

```bash
npm run dev                    # http://localhost:3000
```

When the site starts, the terminal prints `[AcademiaConnect] MongoDB connected (database "...")`. If the database cannot be reached it says why, in plain words, right there, instead of letting sign up fail later.

Useful scripts: `npm run dev`, `npm run build`, `npm start`, `npm run typecheck`.

### Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI`, `MONGODB_DB` | Database used by BetterAuth. Atlas (`mongodb+srv://...`) or a local MongoDB. Use the **same** string and database name as the server. |
| `DNS_SERVERS` | Optional. Only for Atlas addresses: the DNS servers to fall back on when this computer's own DNS cannot look the address up. Default `1.1.1.1,8.8.8.8`. Write `system` to turn the fallback off. |
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

Sandbox payments accept the verification code `123456`. For bKash or Nagad use an 11-digit number starting with `01` (a Rocket number may have 12 digits). For a bank card use the last 4 digits of any card. For a bank transfer use any reference of 4 or more characters.

### Troubleshooting

| What you see | What to do |
|---|---|
| Sign up or login says "The website could not reach its database" | Look at the terminal that runs `npm run dev`. It explains the reason and what to change in `.env.local`. |
| Terminal shows `querySrv ECONNREFUSED` | This computer's DNS cannot answer the lookup an Atlas `mongodb+srv://` address needs (common on Windows, VPNs and some routers). The site already retries with Cloudflare and Google DNS. If it still fails, try a phone hotspot or set your DNS servers to `1.1.1.1` and `8.8.8.8`. Or in Atlas choose *Connect, Drivers*, pick Node.js and version "2.2.12 or later" and use the longer `mongodb://` address. |
| "rejected the user name or password" | Check the database user under *Database Access* in Atlas. Write symbols in the password as `%` codes (`@` becomes `%40`). |
| "Atlas did not answer" | Under *Network Access* in Atlas add your current IP address (or `0.0.0.0/0` while developing). |
| Login works but the demo accounts do not exist | Run `npm run seed` in the server folder. It must use the same `MONGODB_URI` and `MONGODB_DB` as this site. |
| Signed-in pages say the session expired | The API is not running, or its `AUTH_URL` is not this site's address (`http://localhost:3000` locally). |
| "Too many requests" at login | Sign-in is limited to 3 attempts per 10 seconds. Wait a few seconds. |

## Project structure

```
src/
  app/
    (auth)/        login, register, forgot and reset password
    (main)/        public pages and every signed-in page, including /admin
    api/auth/      BetterAuth route handler
  components/      shell, UI kit, chat, admin toolkit, checkout, timetable
  hooks/           data fetching, actions and URL state helpers
  lib/             auth, API client, validation, formatting, types, MongoDB help (DNS fallback, plain-language errors)
  instrumentation.ts  runs once at start-up: DNS fallback and a database check while developing
  proxy.ts         protects private routes and keeps the desired route for after login
```

## Deployment

Deploy this folder to **Vercel** as a Next.js project and set the environment variables above. Deploy the server to Render first so you have its URL. The full walkthrough, including Google OAuth and seeding, is in `DEPLOYMENT.md` at the root of the project bundle.

## Credits

Photos are hosted by [Pexels](https://www.pexels.com) and shown with their free licence. Lecture videos are embedded from YouTube.
