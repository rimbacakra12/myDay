# My Day Planner

Personal planner cloud-first: To-do List, Habit Tracker, Journaling, dan Finansial Planner.

## Stack
- React + Vite
- Supabase Auth + Postgres (cloud)
- Responsive/PWA, nyaman di Android dan PC

## Menjalankan
1. Install Node.js 20+
2. `npm install`
3. Copy `.env.example` menjadi `.env`
4. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
5. Jalankan isi `supabase.sql` di Supabase SQL Editor
6. `npm run dev`

## Deploy
Push project ke GitHub lalu import ke Vercel/Netlify. Tambahkan dua environment variables yang sama saat deploy.

Tanpa Supabase, app tetap bisa dipakai dalam mode lokal memakai localStorage; namun data tidak otomatis sinkron antar perangkat.
