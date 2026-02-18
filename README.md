# Smart Bookmark App

A simple bookmark manager where users can authenticate using Google OAuth, save bookmarks privately, and see updates in real time across multiple tabs.

This project was built as part of a job application assignment, with a focus on correctness, security, and clear architectural reasoning.

---

## 🚀 Live Demo

- **Live URL:** https://smart-bookmark-gray-seven.vercel.app
- **GitHub Repo:** https://github.com/navu545/smart-bookmark

---

## ✨ Features

- Google OAuth authentication (no email/password)
- Add bookmarks (title + URL)
- Bookmarks are private per user
- Real-time updates across multiple tabs
- Delete your own bookmarks
- Fully deployed on Vercel

---

## 🛠 Tech Stack

- **Next.js** (App Router)
- **Supabase**
  - Authentication (Google OAuth)
  - PostgreSQL database
  - Realtime (Postgres changes over WebSockets)
- **Tailwind CSS** (basic styling)
- **Vercel** (deployment)

---

## 📁 Project Structure

```
smart-bookmark/
├── app/
│ ├── page.tsx # Home page (auth + bookmarks UI)
│ └── auth/
│   └── callback/
│   └── page.tsx # OAuth callback handler
├── lib/
│ └── supabaseClient.ts # Supabase client config
├── public/
├── .gitignore
├── package.json
├── package-lock.json
└── README.md

```
* The project follows Next.js App Router conventions, where routes are derived from the filesystem and each `page.tsx` file represents a route.

---

## 🧠 Architecture Overview

### Authentication

- Authentication is handled entirely by Supabase using Google OAuth.
- The same OAuth flow handles both signup (first-time users) and login (returning users).
- After authentication, Supabase creates a session and stores auth tokens (JWT + refresh token) in browser storage.
- The frontend retrieves the logged-in user using `supabase.auth.getUser()` and stays in sync using `onAuthStateChange`.

### Database & Security

- A `bookmarks` table is created with a foreign key reference to `auth.users`.
- PostgreSQL **Row Level Security (RLS)** is enabled to ensure users can only read, insert, and delete their own bookmarks.
- Security is enforced at the database level, which makes the public (anon) API key safe to use in the frontend.

### Realtime Updates

- Supabase Realtime is used to listen for Postgres changes on the `bookmarks` table.
- Realtime subscriptions are filtered by `user_id`, so users only receive updates for their own data.
- This enables instant updates when bookmarks are added or deleted in another browser tab.

---

## 🧩 Key Challenges & Considerations

### 1. Google OAuth Redirect Configuration

**Challenge:**  
Correctly understanding and configuring the OAuth redirect flow between Google, Supabase, and the Next.js application.

**Solution:**  
- Google OAuth was configured to redirect to Supabase’s OAuth callback endpoint.
- Supabase handles token exchange and session creation, then redirects the user to `/auth/callback` in the Next.js app.
- Both local and production callback URLs were explicitly whitelisted in Supabase Authentication settings to ensure authentication worked across environments.

---

### 2. Designing Secure Access with Row Level Security

**Consideration:**  
Since the frontend communicates directly with Supabase using a public (anon) API key, database-level security was critical to prevent unauthorized access.

**Approach:**  
- Enabled PostgreSQL Row Level Security (RLS) on the `bookmarks` table.
- Defined explicit policies for `SELECT`, `INSERT`, and `DELETE` using `auth.uid() = user_id`.
- This ensured users could only access and modify their own bookmarks, while keeping the database secure by default.

---

### 3. Realtime Updates Not Working on DELETE

**Problem:**  
Realtime updates worked correctly for INSERT operations but did not trigger on DELETE events.

**Root Cause:**  
PostgreSQL does not include deleted row data in replication logs by default, which prevents Supabase Realtime from evaluating row-level filters.

**Solution:**  
- Configured the table to include full row data for delete events:
  ```sql
  ALTER TABLE bookmarks
  REPLICA IDENTITY FULL;

* This allowed realtime DELETE events to propagate correctly across open tabs.  

---

### 4. React Warning About Cascading Renders

**Problem:**  
React warned about calling `setState` synchronously inside a `useEffect`, which can lead to cascading renders and performance issues.

**Solution:**

- Moved dependent state updates (such as clearing bookmarks) into the authentication state change handler.
- Ensured all state updates are driven by external events like authentication changes and realtime callbacks, aligning with React’s recommended patterns.

---

## 🧪 Local Setup & Installation

### Prerequisites
- Node.js (v18 or later recommended)
- A Supabase project
- Google OAuth enabled in Supabase Authentication

### 1️⃣ Clone the repository

```bash
git clone https://github.com/navu545/smart-bookmark.git
cd smart-bookmark
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Create a .env.local file in the root directory and add:

`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url`
`NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`


### 4️⃣ Start the development server:

```bash
npm run dev
```

### 5️⃣ Open the app in your browser:

`http://localhost:3000`

---

## 📦 Deployment

The application is deployed on **Vercel**.

**Environment variables used:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

After deployment, the production OAuth callback URL was added to Supabase Authentication settings to enable Google authentication in production.

---

## ✅ Final Notes

This project intentionally avoids a custom backend server.  
By using Supabase’s Authentication, Row Level Security, and Realtime features, the application remains secure, scalable, and easy to reason about while still being fully client-driven.
