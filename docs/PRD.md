# Relay - Product Requirements Document

## Executive Summary

Relay is a private, verified career network for current and former NCAA student-athletes. It converts shared athletic experience into trusted career advice, referrals, and opportunities.

**Mission**: Help athletes navigate careers with clarity and confidence through a trusted network where shared athletic experience turns into meaningful opportunities.

**Core Value Proposition**: Where student-athletes meet to network. A private room where athletes help athletes win after sports.

---

## Problem Statement

### Current State
- Career platforms like LinkedIn don't verify athletic backgrounds
- Outreach is cold, slow, and often ignored
- Former athletes want to help, but only when they trust the person asking
- High school and college athletes don't know who to contact or how to ask

### Impact
- Opportunities are missed and hard to find
- Athletes with pre-existing strong networks win; others have no way to expand
- Alumni support is underutilized despite strong willingness to help

---

## Target Users

### Primary: Student-Athletes
- Current NCAA D1/D2/D3 athletes
- Seeking career advice, internships, jobs
- Need structured way to reach out to alumni

### Secondary: Alumni/Former Athletes
- Former NCAA athletes now in professional careers
- Want to give back but need trust signals
- Limited time, need efficient interactions

---

## Core Features

### 1. Verified Athlete Profiles (Trust Layer)

**Fields**:
- NCAA school, sport, level (D1/D2/D3)
- Years active
- Verification status (visible, binary)

**Verification Tiers**:

| Tier | Method | Automation |
|------|--------|------------|
| 1 | .edu email validation | Automated |
| 1 | Roster matching | Automated |
| 1 | LinkedIn cross-reference | Automated |
| 2 | Proof upload (team photo, roster, commitment letter) | Human review |
| 2 | Peer vouching (verified teammate) | Semi-automated |

### 2. Structured Requests (Primary Interaction)

**Design Principle**: No open DMs. All interactions are structured.

**Request Fields**:
| Field | Options |
|-------|---------|
| Request Type | Advice, Internship, Full-time, Referral |
| Career Context | Free-form with sport + career stage |
| Time Commitment | 15min call, 30min call, email exchange, ongoing mentorship |
| Offer in Return | What requester provides (e.g., "I'll send a follow-up summary") |

**Behavior**:
- Requests auto-expire if unanswered (7 days default)
- AI assists in drafting within locked structure
- No bulk messaging capability

### 3. AI-Guided Outreach (Quality Control)

**AI Capabilities**:
- Rewrite requests for clarity, concision, professionalism
- Enforce brevity and specificity
- Prevent generic or spam-like language

**AI Limitations**:
- Cannot generate bulk messages
- Cannot send messages automatically
- Cannot override required fields

**Goal**: Raise request quality without increasing volume.

### 4. Vouching & Referrals

- Alumni can refer requests they can't fulfill
- Referral carries full context + trust signal
- Referral chains tracked internally

### 5. Outcome Tracking

**Trackable Outcomes**:
- Advice given
- Intro made
- Interview secured
- Offer received

**Privacy**: Aggregated insights only (no public rankings)

---

## Sports Supported (Top 20 Schools)

Initial launch sports:
- Football
- Basketball
- Baseball
- Swimming
- Track & Field
- Tennis
- Golf
- Wrestling
- Gymnastics
- Fencing
- Squash

---

## Monetization

### Freemium Model

| Feature | Free | Premium ($15/mo) |
|---------|------|------------------|
| Send requests | 2/month | Unlimited |
| Basic search | ✓ | ✓ |
| Advanced filters | ✗ | ✓ |
| Priority placement | ✗ | ✓ |
| Exclusive events | ✗ | ✓ |

---

## Non-Negotiables

1. **No open direct messaging** - All interactions are structured
2. **No feeds, likes, or social metrics** - This is not social media
3. **AI is assistive, not generative spam** - Quality over quantity
4. **Optimize for response rate, not volume** - Trust > growth
5. **Alumni experience = Student experience** - Both must be respected

---

## Technical Architecture

### Stack
- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Backend/Auth**: Supabase
- **Database**: PostgreSQL (via Supabase)

### Database Schema

```
users
├── id (uuid, FK to auth.users)
├── name
├── email
├── role (student | alum | admin)
├── premium_status
└── created_at

athlete_profiles
├── user_id (FK to users)
├── school
├── sport
├── ncaa_level (D1 | D2 | D3)
├── years_active
└── verification_status

verification_requests
├── id
├── user_id
├── verification_type
├── uploaded_proof_url
├── status
├── reviewed_by
└── reviewed_at

requests
├── id
├── requester_id
├── request_type
├── context
├── time_commitment
├── offer_in_return
├── ai_assisted
├── status
├── expires_at
└── created_at

responses
├── id
├── request_id
├── responder_id
├── response_type (accept | decline | refer)
├── message
└── created_at

referrals
├── id
├── request_id
├── from_user_id
├── to_user_id
└── created_at

outcomes
├── id
├── request_id
├── outcome_type
├── logged_by
└── created_at
```

### Security
- Row Level Security (RLS) enabled on all tables
- Users only see their own data
- Verification status verified server-side

---

## Brand Guidelines

### Colors
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary | Slate 900 | Slate 50 |
| Secondary | Sky 500 | Sky 600 |
| Accent | Teal 500 | Teal 600 |

### Design Principles
- No default purple gradients
- No sparkles/emojis in headings
- Consistent typography hierarchy
- Subtle hover states (2-4px lift max)
- Every animation serves a purpose

### Logo
![Relay Logo](file:///Users/coreyshen/.gemini/antigravity/brain/dba8d0e4-408c-46d7-968b-8525b425d63c/uploaded_image_1769180646156.png)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Request Response Rate | >70% |
| Positive Outcome Rate | >30% |
| Verification Completion | >80% |
| Alumni Monthly Active Rate | >40% |

---

## Roadmap

### Phase 1: MVP (Current)
- Authentication & verification flow
- Structured request system
- Basic profiles & dashboard

### Phase 2: Intelligence
- AI-assisted request drafting
- Smart matching (sport/school/industry)
- Outcome tracking

### Phase 3: Scale
- Premium features
- Event integration
- Advisory board onboarding

---

*Last Updated: January 23, 2026*
