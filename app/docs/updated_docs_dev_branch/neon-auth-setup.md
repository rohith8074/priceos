# Neon Auth Setup Guide

This guide covers setting up Neon Auth for authentication in PriceOS.

## Overview

PriceOS uses [Neon Auth](https://neon.tech/docs/guides/neon-authorize) for secure, database-native authentication. Neon Auth integrates directly with your Neon Postgres database, eliminating the need for separate auth providers like Supabase Auth or Auth0.

**Key Benefits:**
- Database-native authentication (no external auth service)
- Built-in JWT token management
- Automatic user session handling
- Seamless integration with Drizzle ORM
- Row-level security support

## Prerequisites

Before setting up Neon Auth, ensure you have:

1. **Neon Account** - Sign up at [neon.tech](https://neon.tech)
2. **Neon Project** - Create a project for PriceOS
3. **Database Created** - Your PriceOS database should exist
4. **Node.js 18+** - Required for Next.js and dependencies

## Environment Variables

Add these to `app/.env.local` for local development:

```bash
# Neon Database
DATABASE_URL=postgresql://user:password@host/database

# Neon Auth
NEON_AUTH_ISSUER=https://your-project.neon.tech
NEON_AUTH_SECRET=your-auth-secret-key

# Next.js (for client-side)
NEXT_PUBLIC_NEON_AUTH_ISSUER=https://your-project.neon.tech
```

### How to Obtain Variables

#### 1. DATABASE_URL

From your Neon dashboard:
1. Go to your project
2. Navigate to **Connection Details**
3. Copy the connection string (use **Pooled connection** for serverless)

```
postgresql://user:password@ep-xxx.region.aws.neon.tech/database?sslmode=require
```

#### 2. NEON_AUTH_ISSUER

Format: `https://<project-id>.neon.tech`

Find your project ID in the Neon dashboard URL:
```
https://console.neon.tech/app/projects/ancient-mountain-12345
                                         ^^^^^^^^^^^^^^^^^^^^
                                         This is your project ID
```

Your issuer URL:
```
https://ancient-mountain-12345.neon.tech
```

#### 3. NEON_AUTH_SECRET

Generate a secure random secret:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Important:** Keep this secret secure. Never commit it to version control.

## Local Development Setup

### Step 1: Install Dependencies

```bash
cd app
npm install @neondatabase/auth
```

### Step 2: Create Auth Schema

Add auth tables to your database schema (`app/src/lib/db/schema.ts`):

```typescript
import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table for JWT tokens
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Step 3: Push Schema to Database

```bash
npm run db:push
```

### Step 4: Create Auth Utility

Create `app/src/lib/auth/neon-auth.ts`:

```typescript
import { NeonAuth } from "@neondatabase/auth";

const auth = new NeonAuth({
  issuer: process.env.NEON_AUTH_ISSUER!,
  secret: process.env.NEON_AUTH_SECRET!,
  database: {
    connectionString: process.env.DATABASE_URL!,
  },
});

export default auth;
```

### Step 5: Create Auth API Routes

#### Sign Up (`app/src/app/api/auth/signup/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning();

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    if (error.code === "23505") {
      // Unique constraint violation
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Sign In (`app/src/app/api/auth/signin/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { addDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.NEON_AUTH_SECRET!,
      { expiresIn: "7d", issuer: process.env.NEON_AUTH_ISSUER }
    );

    // Store session
    const expiresAt = addDays(new Date(), 7);
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Sign Out (`app/src/app/api/auth/signout/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  if (token) {
    // Delete session from database
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  // Clear cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete("auth-token");

  return response;
}
```

#### Get Current User (`app/src/app/api/auth/me/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.NEON_AUTH_SECRET!) as {
      userId: number;
      email: string;
    };

    // Check session exists and is valid
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
```

### Step 6: Create Auth Middleware

Create `app/src/middleware.ts` for protected routes:

```typescript
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;

  // Check if accessing protected route
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
      jwt.verify(token, process.env.NEON_AUTH_SECRET!);
    } catch (error) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

### Step 7: Create Client-Side Auth Hook

Create `app/src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  }

  async function signUp(email: string, password: string) {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const data = await response.json();
      return { success: false, error: data.error };
    }
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
  }

  return { user, loading, signIn, signUp, signOut };
}
```

## Vercel Deployment Setup

### Step 1: Add Environment Variables

In Vercel dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add the following:

```
DATABASE_URL=postgresql://user:password@host/database
NEON_AUTH_ISSUER=https://your-project.neon.tech
NEON_AUTH_SECRET=your-auth-secret-key
NEXT_PUBLIC_NEON_AUTH_ISSUER=https://your-project.neon.tech
```

**Important:** Set for all environments (Production, Preview, Development)

### Step 2: Deploy

```bash
git push origin main
```

Vercel will automatically deploy with the new environment variables.

### Step 3: Run Migrations (if needed)

If you haven't pushed schema to production DB:

```bash
# Set DATABASE_URL to production
export DATABASE_URL=postgresql://production-connection-string

# Push schema
npm run db:push
```

## Authentication Flow

```
1. User signs up (/api/auth/signup)
   ↓
2. Password hashed with bcryptjs
   ↓
3. User record created in database
   ↓
4. User signs in (/api/auth/signin)
   ↓
5. Password verified
   ↓
6. JWT token generated
   ↓
7. Session stored in database
   ↓
8. Token set as HTTP-only cookie
   ↓
9. Middleware validates token on protected routes
   ↓
10. User can access dashboard
```

## Troubleshooting

### "Invalid credentials" on Sign In

**Cause:** Password doesn't match or user doesn't exist

**Solution:**
- Verify email is correct
- Check password is correct
- Ensure user was created successfully

### "Session expired" Error

**Cause:** JWT token expired (default: 7 days)

**Solution:**
- Sign in again
- Adjust token expiry in `signin/route.ts`:
  ```typescript
  { expiresIn: "30d" } // 30 days instead of 7
  ```

### Database Connection Errors

**Cause:** Invalid `DATABASE_URL` or network issues

**Solution:**
- Verify connection string in Neon dashboard
- Check database is running
- Ensure IP is allowlisted (if using IP restrictions)

### Middleware Redirect Loop

**Cause:** Middleware redirecting authenticated users

**Solution:**
- Exclude auth pages from middleware matcher:
  ```typescript
  export const config = {
    matcher: ["/dashboard/:path*", "/((?!api|auth|_next/static|_next/image|favicon.ico).*)"],
  };
  ```

### CORS Errors in Production

**Cause:** Cookie not being set due to domain mismatch

**Solution:**
- Ensure `NEXT_PUBLIC_NEON_AUTH_ISSUER` matches your domain
- Set cookie `sameSite: "none"` and `secure: true` for cross-origin

### "jwt malformed" Error

**Cause:** Token format is invalid

**Solution:**
- Clear cookies and sign in again
- Verify `NEON_AUTH_SECRET` is consistent across environments

## API Reference

### Server-Side (API Routes)

```typescript
// Get current user in API route
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const decoded = jwt.verify(token, process.env.NEON_AUTH_SECRET!) as {
    userId: number;
  };

  // Use decoded.userId to fetch user-specific data
}
```

### Client-Side (React Components)

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Resources

- [Neon Auth Documentation](https://neon.tech/docs/guides/neon-authorize)
- [Neon Auth NPM Package](https://www.npmjs.com/package/@neondatabase/auth)
- [JWT Best Practices](https://jwt.io/introduction)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Drizzle ORM with Neon](https://orm.drizzle.team/docs/get-started-postgresql#neon)

## Next Steps

1. Implement email verification
2. Add password reset flow
3. Enable social auth (Google, GitHub)
4. Implement role-based access control (RBAC)
5. Add rate limiting to auth endpoints

---

**Last Updated:** 2026-02-16
