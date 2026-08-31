# Digital Bystander Effect Experimental Chat Platform

This is a functional, deployable web application for conducting psychology experiments on the digital bystander effect. It mimics a WhatsApp Web-style group chat to create a convincing simulated social environment.

## Features
- **Join Flow**: Participants can join an active experiment using a group code.
- **Simulated Group Chat**: Real-time Socket.io powered chat interface.
- **Bot Engine**: Deterministic, seed-based bot conversation engine that mimics human interaction, typing indicators, and randomized delays.
- **Experimental Control**: Researchers can configure bystander count (e.g. 10 bots, 5 bots) and scenario triggers.
- **Admin Dashboard**: View experiments and export session data as CSV.

## Stack
- Next.js (App Router, React, TypeScript)
- Tailwind CSS
- Prisma ORM + SQLite (Zero-config local development; can be easily swapped to PostgreSQL for production)
- Socket.io (Custom Next.js Express server)

## Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

3. **Seed Demo Data**
   ```bash
   npm run postinstall
   npx tsx prisma/seed.ts
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Test the Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Enter the demo group code: `DEMO123`
   - Complete the registration form
   - Observe the bots interacting and eventually triggering the experimental scenario.
   - Go to [http://localhost:3000/admin](http://localhost:3000/admin) to view the dashboard and export data.

## Deployment
For free-tier deployment, use a service that supports a custom Node.js server (e.g., Render, Railway, or Fly.io) since Vercel's serverless functions do not natively support Socket.io without third-party services. Change the Prisma `provider` to `postgresql` and provide the `DATABASE_URL` for the production database.
