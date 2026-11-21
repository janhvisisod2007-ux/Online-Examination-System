# ExamPortal – Online Examination System

A full-stack MERN application for creating, publishing and taking online exams. Teachers build exams (manually, from a built-in question bank, or with AI), and students take them in a distraction-free exam screen with a server-synced timer, automatic grading and a detailed answer review.

**Live demo:** `online-examination-system-beige.vercel.app` &nbsp;|&nbsp; **API:** `https://online-examination-system-53xq.onrender.com`

---

## Features

### Teacher
- Create, edit, publish/unpublish and delete exams (title, subject, duration, negative marking, optional start/end window)
- Question manager with **single choice**, **multiple choice** and **true/false** questions, marks and explanations
- **Auto-generate questions** in two ways:
  - **Question bank** – pick a topic and how many questions you want; random questions with shuffled options, instantly and without any API
  - **AI generation** – enter any topic (optionally paste study material), choose count, difficulty and type, review a preview and add only the questions you like
- Results and analytics per exam: submissions, average, highest score, pass rate, score distribution, question-wise accuracy, leaderboard and CSV export

### Student
- Dashboard with available exams, in-progress attempts and past results
- Exam screen with a **server-synced countdown timer**, question palette, mark for review, clear response and autosave
- Refresh-safe: answers and remaining time are restored when the page is reloaded
- Automatic submission when time runs out
- Instant result with score ring, correct/wrong/skipped counts and a full answer review with explanations

### Security and quality
- JWT authentication with role-based access (student / teacher)
- Teacher registration protected by an invite code
- Passwords hashed with bcrypt
- Correct answers are never sent to the student during an exam
- One attempt per student per exam (enforced by a unique database index)
- Rate limiting on the AI endpoint
- Custom confirmation dialogs and toast notifications for a consistent UI

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS, Framer Motion, Lucide icons, React Hot Toast, Axios |
| Backend | Node.js, Express, JSON Web Tokens, bcryptjs, express-rate-limit |
| Database | MongoDB Atlas with Mongoose |
| AI | Google Gemini API (Anthropic Claude API supported through a provider switch) |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

---

## Project structure

```
.
├── client/                     # React frontend
│   ├── src/
│   │   ├── api/                # Axios instance
│   │   ├── components/         # Navbar, modals, confirm dialog, route guards
│   │   ├── context/            # Auth context
│   │   └── pages/
│   │       ├── teacher/        # Dashboard, exam detail, results
│   │       └── student/        # Dashboard, exam screen, result
│   └── vercel.json
└── server/                     # Express backend
    ├── config/                 # Database connection
    ├── controllers/            # Auth, exam and student logic
    ├── data/                   # Built-in question bank
    ├── middleware/             # JWT auth and role checks
    ├── models/                 # User, Exam, Question, Attempt
    ├── routes/
    └── server.js
```

---

## Getting started

### Prerequisites
- Node.js 20 or later
- A MongoDB Atlas cluster (or a local MongoDB instance)
- Optional: a Google AI Studio API key for AI question generation

### 1. Clone the repository

```bash
git clone https://github.com/janhvisisod2007-ux/Online-Examination-System

```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret
TEACHER_CODE=invite_code_required_to_register_as_teacher
CLIENT_URL=http://localhost:5173

# AI question generation (optional)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.8-flash
```

Start the server:

```bash
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

| Variable | Where | Description |
|---|---|---|
| `MONGO_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Secret used to sign tokens |
| `TEACHER_CODE` | server | Invite code required to register as a teacher |
| `CLIENT_URL` | server | Allowed frontend origin for CORS |
| `AI_PROVIDER` | server | `gemini` or `anthropic` |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL` | server | Gemini settings (the fallback model is used if the primary is overloaded) |
| `ANTHROPIC_API_KEY`, `AI_MODEL` | server | Settings when `AI_PROVIDER=anthropic` |
| `VITE_API_URL` | client | Base URL of the backend API |

Model names change over time. List the models available to your key and update `GEMINI_MODEL` if a model is retired.

---

## How grading works

- A correct answer awards the full marks of that question
- A wrong answer subtracts the exam's negative marking value
- Skipped questions score zero
- Multiple-choice questions require an exact match of all correct options
- The final score never drops below zero

The timer is controlled by the server. Each attempt stores an expiry time, so changing the browser clock has no effect, and expired attempts are graded automatically from the answers saved so far.

---

## API overview

### Auth – `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register a student (teachers need the invite code) |
| POST | `/login` | Log in and receive a JWT |
| GET | `/me` | Current user |

### Teacher – `/api/exams` (teacher role)
| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `/` | List own exams / create an exam |
| GET / PUT / DELETE | `/:id` | Read, update or delete an exam |
| PATCH | `/:id/publish` | Publish or unpublish |
| GET | `/:id/results` | Results and analytics |
| POST | `/:id/questions` | Add a question |
| POST | `/:id/questions/bulk` | Add many questions at once |
| PUT / DELETE | `/:id/questions/:qid` | Update or delete a question |
| POST | `/:id/generate-questions` | Generate questions with AI (preview only) |
| POST | `/:id/generate-from-bank` | Pick questions from the built-in bank (preview only) |
| GET | `/question-bank/topics` | Available question bank topics |

### Student – `/api/student` (student role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/exams` | Published exams with attempt status |
| POST | `/exams/:id/start` | Start or resume an attempt |
| GET | `/attempts` | Submitted attempts |
| GET | `/attempts/:id` | Attempt in progress, or the result with review |
| PUT | `/attempts/:id/answer` | Save an answer |
| POST | `/attempts/:id/submit` | Submit and grade |

---

## Extending the question bank

Questions live in `server/data/questionBank.js`. Add a new topic with the helper functions:

```js
"My Topic": [
  S("Single choice question?", ["A", "B", "C", "D"], 1, "Optional explanation"),
  M("Multiple choice question?", ["A", "B", "C", "D"], [0, 2]),
  TF("A true/false statement.", true),
],
```

`S(text, options, correctIndex)`, `M(text, options, [correctIndexes])` and `TF(text, true | false)`. Indexes start at 0.

---

## Deployment

| Service | Setting | Value |
|---|---|---|
| Render (backend) | Root Directory | `server` |
| | Build / Start command | `npm install` / `npm start` |
| | Environment | all server variables listed above |
| Vercel (frontend) | Root Directory | `client` |
| | Environment | `VITE_API_URL=https://<your-render-url>/api` |
| MongoDB Atlas | Network Access | allow the Render server (for example `0.0.0.0/0`) |

`client/vercel.json` rewrites all routes to `index.html` so deep links such as `/teacher` work after a refresh. Set `CLIENT_URL` on Render to the Vercel URL (without a trailing slash).

Note: the free Render tier sleeps after a period of inactivity, so the first request can take up to a minute.

---

## Roadmap

- Tab-switch detection with warnings and auto-submit
- Dark mode
- Question images and subjective questions with manual grading
- Email notifications and exam scheduling reminders

---

## Author

Built by **JANHVI SISODIYA**.
