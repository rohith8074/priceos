# PriceOS Dashboard - MVP/POC Product Requirements Document

**Version:** 1.0
**Last Updated:** February 10, 2026
**Status:** MVP - Ready for Demo & User Testing

---

## 1. Executive Summary

PriceOS is a revenue management dashboard for Dubai short-term rental properties. This MVP demonstrates the core capabilities of an AI-powered pricing engine that helps property managers optimize rental rates based on market demand, competitor analysis, and upcoming events.

**Key Value Proposition:**
- Real-time pricing recommendations from AI agents
- Market intelligence integration (events, competitor signals)
- Simple, intuitive dashboard for property management
- Seamless authentication and secure session management

---

## 2. Product Overview

### 2.1 Vision
Enable Dubai short-term rental hosts to maximize revenue through intelligent, data-driven pricing while maintaining operational simplicity.

### 2.2 Target Users
- **Primary:** Property managers with 1-5 rental units in Dubai
- **Secondary:** Individual property owners looking to optimize pricing
- **Tertiary:** Hospitality investors monitoring portfolio performance

### 2.3 Success Metrics
- **MVP Phase:** Successful authentication → dashboard access → data visibility
- **POC Phase:** User engagement with pricing proposals → feedback collection
- **Production Phase:** Revenue impact measurement → proposal adoption rate

---

## 3. Features & Functionality

### 3.1 Authentication System

#### Requirements
- **Dummy Authentication (POC):**
  - Pre-configured credentials (demo/demo123, admin/admin123)
  - No external dependency (no Clerk/Supabase for MVP)
  - Session persistence via localStorage
  - Logout functionality with redirect to login

- **Security:**
  - Protected dashboard routes
  - Session expiration on logout
  - Middleware-based route protection

#### User Stories
- US-1: As a user, I can log in with demo credentials and access the dashboard
- US-2: As a user, I can see my username in the header and log out
- US-3: As a user, my session persists across page refreshes
- US-4: As an unauthenticated user, I cannot access dashboard pages

---

### 3.2 Dashboard Overview

#### Features
- **Portfolio Metrics (4 KPIs)**
  - Total Properties: Count of active rental units
  - Average Base Price: Mean nightly rate across portfolio
  - Occupancy Rate: Estimated portfolio-wide occupancy %
  - 30-Day Revenue: Projected revenue with trend indicator

- **Property Grid Display**
  - 3-column responsive layout (mobile → tablet → desktop)
  - Property cards showing:
    - Name, location (area), property type
    - Bedrooms, bathroom count
    - Base price per night
    - Max guests capacity
    - Estimated occupancy rate

#### Technical Implementation
- Server-rendered async page loading PMS data
- Dynamic stat calculations from property dataset
- Responsive Tailwind CSS grid layout

#### User Stories
- US-5: As a property manager, I can see high-level portfolio health metrics
- US-6: As a property manager, I can browse all my properties at a glance
- US-7: As a property manager, I can filter/sort properties (future iteration)

---

### 3.3 Properties Management

#### Features
- **Property List View**
  - All 5 Dubai properties displayed with full details
  - Comprehensive property information:
    - Property ID, name, address (area)
    - Type (Studio, Apartment, Villa)
    - Bedrooms, bathrooms, max guests
    - Base price, price floor/ceiling
    - Amenities list

- **Property Detail View (Future)**
  - Individual property metrics
  - Historical pricing data
  - Reservation history
  - Performance analytics

#### User Stories
- US-8: As a property manager, I can see all property details in one view
- US-9: As a property manager, I can identify property amenities and features
- US-10: As a property manager, I can compare pricing across properties

---

### 3.4 Calendar & Availability

#### Features
- **90-Day Calendar View**
  - Grid layout showing daily availability status
  - Color-coded status indicators:
    - Green: Available for booking
    - Red: Booked/Reserved
    - Gray: Blocked/Unavailable

- **Daily Pricing Display**
  - Current nightly rate shown on each day
  - Price trends visible across calendar

- **Summary Statistics**
  - Total available days count
  - Total booked days count
  - Total blocked days count
  - Occupancy percentage

#### Technical Implementation
- Server-rendered calendar with async PMS data fetch
- CSS-based color coding (no external calendar library)
- Responsive grid layout (7 columns = 1 week)

#### User Stories
- US-11: As a property manager, I can see 90-day availability at a glance
- US-12: As a property manager, I can identify booking patterns and gaps
- US-13: As a property manager, I can view current pricing for each date

---

### 3.5 AI-Generated Pricing Proposals

#### Features
- **Proposal Overview Statistics**
  - Total proposals generated (~324 for 5 properties)
  - Approved proposals count
  - High-risk proposals requiring review
  - Approval percentage

- **Proposal Cards Display**
  - Date of proposal (YYYY-MM-DD format)
  - Current price vs. Proposed price
  - Price change indicator (AED & %)
  - Risk level badge (Low/Medium/High)
  - AI reasoning explanation
  - Approval status indicator

- **Risk Classification**
  - **Low Risk:** Conservative increases, stable market conditions
  - **Medium Risk:** Moderate changes, mixed signals
  - **High Risk:** Aggressive pricing, volatile conditions

#### Pricing Logic (AI Agent)
- **Inputs:**
  - Property characteristics (type, location, amenities)
  - Historical occupancy and pricing
  - Demand signals (booking velocity)
  - Market competition analysis
  - Upcoming Dubai events (13 major events)
  - Competitor price positioning

- **Outputs:**
  - Recommended nightly rate
  - Risk assessment (low/medium/high)
  - Reasoning explanation
  - Supporting signals

#### User Stories
- US-14: As a property manager, I can see all AI pricing recommendations
- US-15: As a property manager, I can understand the reasoning behind recommendations
- US-16: As a property manager, I can assess risk before implementing proposals
- US-17: As a property manager, I can filter proposals by risk level (future)

---

### 3.6 Market Insights & Intelligence

#### 3.6.1 Dubai Events Calendar

**Features:**
- 13 Major 2026 Dubai Events displayed
- For each event:
  - Event name and description
  - Date range (start → end date)
  - Location
  - Category: Festival, Conference, Sports, Cultural, Religious
  - Demand impact level: Low, Medium, High, Extreme
  - Confidence score (0-100%)
  - Impact notes explaining market effects

**Event Examples:**
- Dubai Shopping Festival (Dec 5 - Jan 11): Extreme demand
- Art Dubai (Apr 15-19): High demand
- Dubai World Cup (Mar 28): High demand
- Ramadan (Feb 28 - Mar 30): Medium demand

#### 3.6.2 Competitor Market Signals

**Features:**
- 10 Market signals across Dubai areas
- For each signal:
  - Area name (Marina, Downtown, etc.)
  - Signal type: Compression (📉) or Release (📈)
  - Date range of signal
  - Confidence level
  - Market data:
    - Available units count
    - Average price in AED
    - Price change % (from baseline)
    - Occupancy rate %
  - Reasoning/insight explaining the signal

**Signal Interpretation:**
- **Compression:** Market tightening, fewer units available, price pressure upward
- **Release:** Market loosening, more availability, price pressure downward

#### User Stories
- US-18: As a property manager, I can see major Dubai events affecting demand
- US-19: As a property manager, I understand the impact of events on pricing
- US-20: As a property manager, I can track competitor market movements
- US-21: As a property manager, I understand price compression/release patterns

---

### 3.7 Navigation & Layout

#### Features
- **Persistent Sidebar Navigation**
  - Logo/branding (PriceOS)
  - 5 main navigation links:
    1. Overview (Dashboard home)
    2. Properties (All properties)
    3. Calendar (Availability view)
    4. Proposals (Pricing recommendations)
    5. Insights (Events & market signals)
  - Active route highlighting
  - Mobile-responsive collapse (future)

- **Header**
  - Page title display
  - User profile dropdown:
    - Username display
    - User role (admin/user)
    - Logout button

- **Dark Mode Support**
  - Automatic system preference detection
  - Tailwind CSS dark: prefix support
  - Consistent color scheme across all pages

#### User Stories
- US-22: As a user, I can navigate between all dashboard sections
- US-23: As a user, I can see my current location in the navigation
- US-24: As a user, I can see my profile and log out from any page

---

## 4. Data Architecture

### 4.1 Data Sources

#### Mock Data Layer
- **5 Dubai Properties:**
  - Marina Heights 1BR (1001)
  - Downtown Residences 2BR (1002)
  - JBR Beach Studio (1003)
  - Palm Villa 3BR (1004)
  - Bay View 1BR (1005)

- **90-Day Calendar:**
  - Status: available/booked/blocked
  - Price per day
  - Min/max stay requirements

- **324 Price Proposals:**
  - Per-property, per-day recommendations
  - Risk classification
  - AI reasoning explanations

- **13 Major Events:**
  - Complete 2026 Dubai events calendar
  - Demand impact predictions
  - Confidence scores

- **10 Market Signals:**
  - Competitor analysis per area
  - Compression/release indicators
  - Market price trends

### 4.2 API Integration Points

#### Current (MVP)
- PMS Client (Mock): Returns property and calendar data
- Agent System (Mock): Generates pricing proposals
- Event/Signal Data (Mock): Hardcoded event and competitor data

#### Future (Production)
- Real Hostaway API integration
- Live competitive intelligence service
- Real-time event data feed
- Multi-currency support

---

## 5. UI/UX Design

### 5.1 Design System

#### Color Palette
- **Primary:** Slate-900 (Dark) / White (Light)
- **Secondary:** Slate-100 (Light) / Slate-900 (Dark)
- **Status Colors:**
  - Success/Available: Green (#10b981)
  - Danger/Booked: Red (#ef4444)
  - Warning: Orange (#f97316)
  - Info: Blue (#3b82f6)

#### Typography
- **Font Family:** Geist Sans (primary), Geist Mono (code)
- **Heading Sizes:** H1 (3xl), H2 (2xl), H3 (xl)
- **Body Text:** Base (16px), Small (14px), Extra Small (12px)

#### Component Library
- Custom shadcn/ui-style components:
  - Button, Card, Input, Label
  - Badge, Alert, Dropdown Menu, Avatar
  - Risk Badge (custom color variants)
  - Stat Card (metric display)

### 5.2 Responsive Breakpoints
- **Mobile:** < 640px (1 column layout)
- **Tablet:** 640px - 1024px (2 column layout)
- **Desktop:** > 1024px (3+ column layout)

### 5.3 Accessibility
- WCAG 2.1 Level AA compliance target
- Keyboard navigation support
- Semantic HTML structure
- Color contrast ratios ≥ 4.5:1 for text

---

## 6. Technical Specifications

### 6.1 Tech Stack

#### Frontend
- **Framework:** Next.js 16.1.6 (App Router)
- **Runtime:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **State Management:** React Context API
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Utilities:** clsx, tailwind-merge

#### Backend (Mock)
- **Language:** TypeScript
- **Async Operations:** Native async/await
- **Data Generation:** Deterministic mock data

#### Deployment
- **Platform:** Vercel (recommended)
- **Environment:** Node.js 18+
- **CI/CD:** GitHub Actions (future)

### 6.2 Folder Structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication routes
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── properties/
│   │   │   ├── calendar/
│   │   │   ├── proposals/
│   │   │   ├── insights/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx       # Root layout with AuthProvider
│   │   ├── page.tsx         # Home redirect
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Layout components
│   │   ├── properties/      # Property display
│   │   ├── calendar/        # Calendar components
│   │   ├── proposals/       # Proposal display
│   │   ├── insights/        # Event/signal components
│   │   └── ui/              # Base UI components
│   ├── lib/
│   │   ├── auth-context.tsx # Authentication state
│   │   ├── pms/             # Property management system
│   │   ├── agents/          # AI pricing logic
│   │   ├── utils/           # Utility functions
│   │   └── utils.ts         # Class merging utilities
│   ├── data/
│   │   ├── mock-properties.ts
│   │   ├── mock-calendar.ts
│   │   ├── mock-events.ts
│   │   └── mock-competitors.ts
│   └── types/
│       └── hostaway.ts      # Type definitions
```

### 6.3 Build & Deployment

#### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
```

#### Production
```bash
npm run build         # Build for production
npm start             # Start production server
```

#### Performance Targets
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Bundle Size: < 200KB (gzipped)

---

## 7. Authentication & Security

### 7.1 MVP Authentication

#### Dummy Credentials (POC Only)
```
User 1:
- Username: demo
- Password: demo123
- Role: user

User 2:
- Username: admin
- Password: admin123
- Role: admin
```

#### Security Notes
- ⚠️ **NOT FOR PRODUCTION**: Hardcoded credentials for testing only
- Session stored in localStorage (development convenience)
- Middleware protects `/dashboard/*` routes
- Unauthenticated users redirected to `/login`

### 7.2 Session Management
- **Persistence:** localStorage (demo-only solution)
- **Duration:** Until explicit logout
- **Logout:** Clears session + redirects to login page

### 7.3 Future Production Security
- Replace with Clerk or Supabase authentication
- JWT tokens with secure httpOnly cookies
- Role-based access control (RBAC)
- Audit logging for sensitive operations
- Two-factor authentication (2FA)

---

## 8. Success Criteria

### MVP Completion
- [x] Dummy authentication working
- [x] Dashboard renders with mock data
- [x] All 5 pages accessible and functional
- [x] Properties data displayed correctly
- [x] Calendar showing 90-day availability
- [x] Pricing proposals generated and displayed
- [x] Events and market signals visible
- [x] Responsive design on mobile/tablet/desktop
- [x] No TypeScript errors in strict mode
- [x] Production build successful

### POC Validation
- [ ] User testing with 5+ property managers
- [ ] Feedback collection on proposal usefulness
- [ ] Event impact visibility assessment
- [ ] Navigation intuitiveness validation
- [ ] Data accuracy verification
- [ ] Performance metrics baseline established

### Next Phase (Production)
- [ ] Real Hostaway API integration
- [ ] Live competitive intelligence
- [ ] User authentication (Clerk/Supabase)
- [ ] Database for user accounts and settings
- [ ] Proposal approval/rejection workflow
- [ ] Historical pricing analytics
- [ ] Performance optimization and scaling

---

## 9. Known Limitations & Assumptions

### MVP Limitations
1. **Authentication:** Hardcoded credentials (demo only, not secure)
2. **Data:** All data is mocked (not real properties or bookings)
3. **Proposals:** Generated deterministically (not truly AI, template-based)
4. **Events:** Static 2026 Dubai events (no real-time updates)
5. **Competitors:** Simulated market signals (not real competitor data)
6. **Session:** Stored in localStorage (no server-side validation)

### Design Assumptions
1. Users are familiar with property management concepts
2. Dubai-only market scope (V1)
3. Short-term rental focus (Airbnb, Booking.com style)
4. English language interface (V1)
5. USD pricing display (with AED support)

---

## 10. Roadmap

### Phase 1: MVP (Current) ✅
**Focus:** Core dashboard with mock data and dummy auth
- Demo-ready interface
- All key features visible
- User feedback collection

### Phase 2: POC Enhancements (1-2 weeks)
**Focus:** Real data integration and validation
- Hostaway API integration
- User testing with property managers
- Proposal refinement based on feedback
- Performance optimization

### Phase 3: Beta (4-6 weeks)
**Focus:** Production readiness
- Real authentication system (Clerk/Supabase)
- Database implementation (PostgreSQL)
- Approval workflow for proposals
- Analytics and performance tracking
- Security hardening

### Phase 4: Launch (3 months)
**Focus:** Market readiness
- Multi-property scaling
- Advanced analytics dashboard
- API integrations (calendars, OTA channels)
- Customer support system
- Marketing and user acquisition

---

## 11. Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| **PMS** | Property Management System - handles properties, calendars, reservations |
| **OTA** | Online Travel Agency (Airbnb, Booking.com, Expedia) |
| **Occupancy** | Percentage of days booked vs. total available days |
| **Base Price** | Default nightly rate for a property |
| **Compression** | Market tightening with limited availability and upward price pressure |
| **Release** | Market loosening with more availability and downward price pressure |
| **Proposal** | AI-recommended nightly rate for a specific date and property |

### B. Demo Property Details

| Property | Type | Location | Bedrooms | Base Price |
|----------|------|----------|----------|------------|
| Marina Heights 1BR | Apartment | Dubai Marina | 1 | AED 550 |
| Downtown Residences 2BR | Apartment | Downtown Dubai | 2 | AED 850 |
| JBR Beach Studio | Studio | JBR | 0 | AED 400 |
| Palm Villa 3BR | Villa | Palm Jumeirah | 3 | AED 2000 |
| Bay View 1BR | Apartment | Business Bay | 1 | AED 500 |

### C. Demo Event Examples

| Event | Dates | Impact | Confidence |
|-------|-------|--------|-----------|
| Dubai Shopping Festival | Dec 5 - Jan 11 | Extreme | 100% |
| Art Dubai | Apr 15-19 | High | 85% |
| Dubai World Cup | Mar 28 | High | 95% |
| Ramadan | Feb 28 - Mar 30 | Medium | 100% |
| Ultra Music Festival | Mar 1-3 | High | 90% |

---

## 12. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 10, 2026 | Claude | Initial MVP PRD |
| - | - | - | - |

---

**Document Prepared For:** PriceOS MVP/POC Demo
**Approval Status:** Ready for Stakeholder Review
**Last Review Date:** February 10, 2026
