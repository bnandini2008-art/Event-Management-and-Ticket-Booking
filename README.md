# Eventix – Dream · Book · Experience
> **Version 1.0** · Prepared in accordance with **IEEE 830-1998** & **ISO/IEC/IEEE 29148:2018**
> Complete Full-Stack Event Discovery & Ticket Booking Platform with Gemini AI Concierge

---

## 🌟 Visual UI Fidelity
The application pixel-perfectly replicates the dark-fantasy neon violet cyberpunk aesthetic from the design specification:
- **Hero Atmosphere**: Gothic cathedral towers under an anime moon, cherry blossom silhouette, and glowing lanterns.
- **Top Brand & Navigation**: Eventix 4-pointed glowing star logo, tagline (*Dream · Book · Experience*), glassmorphic pill nav bar, theme toggle, and profile avatar.
- **Scroll Down Indicator**: Left floating vertical pill indicator with mouse scroll glyph.
- **Category Pill Bar**: *All Events*, *Concerts*, *Conferences*, *Festivals*, *Exhibitions*, *Sports*, *Workshops*, *More*.
- **Trending Events Cards**:
  1. **Neon Nights Concert** (`🔥 Hot`, Dec 20, 2026, Chennai Indoor Stadium, ₹999 onwards).
  2. **Anime Expo 2026** (`⚡ Trending`, Dec 27–28, 2026, Chennai Trade Centre, ₹499 onwards).
  3. **Music Festival 2026** (`Limited Seats`, Jan 15, 2027, YMCA Grounds, Chennai, ₹1,499 onwards).
- **Floating Eventix Assistant (Chatbot)**:
  - Docked in bottom-right corner with minimize/close controls.
  - Interactive quick action pills (*Event Details*, *Ticket Booking*, *Refund & Cancellation*, *Event Timings*, *Other Enquiries*).
  - Conversation simulation & real-time messaging with instant `[ 🎟️ Book Tickets ]` action buttons!
- **Footer Value Propositions & Newsletter**:
  - *Instant Booking* in Just a Few Clicks.
  - *Secure Payments* with 100% Safety.
  - *24/7 Support* Always Here.
  - 3D Glowing Gift Box newsletter subscription with real-time feedback.

---

## 🚀 Quick Start Instructions

### Option 1: Unified Production Mode (One Single Command)
Double click `start_app.bat` or run:
```bash
python backend/manage.py runserver 0.0.0.0:8000
```
Open your browser to: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

### Option 2: Full Dev Mode with Vite HMR
Double click `start_dev.bat` or run in two terminals:
- Terminal 1: `cd backend && python manage.py runserver 8000`
- Terminal 2: `cd frontend && npm run dev`
Open your browser to: **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Default Roles & Accounts

| Role | Username | Password | Purpose |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full Event & Ticket CRUD, Bookings Overview, Reports |
| **Demo User** | `demo_user` | `password123` | Ticket booking, hold reservation, cancellations |
| **Guest** | *Unauthenticated* | *N/A* | Browse events, filter categories, search, chat |

*Note: You can instantly switch between Guest, User, and Admin with 1 click in the profile avatar menu dropdown.*

---

## 📋 IEEE 830 Requirements Traceability Matrix

| Requirement ID | Specification | Status | Implementation Details |
|---|---|---|---|
| **FR-AUTH-01** | User registration, login, role-based access | **Compliant** | Django Auth + Profile roles (`admin`, `user`, `guest`) |
| **FR-EVT-01** | Event CRUD & inventory tier management | **Compliant** | `Event` and `TicketCategory` models with quotas and pricing |
| **FR-DISC-01** | Search, filter by category, sort by price/date | **Compliant** | Live filtering with dynamic category bar and query params |
| **FR-BOOK-01** | Timed hold reservation (10-minute hold) | **Compliant** | `TicketHold` model with countdown timer & expiry cleanup |
| **FR-BOOK-02** | Atomic inventory locking | **Compliant** | `select_for_update()` inside `transaction.atomic()` |
| **FR-PAY-01** | PCI DSS compliant payment gateway simulation | **Compliant** | UPI, Credit Card, and Net Banking modal flow |
| **FR-TKT-01** | E-ticket confirmation with QR code & calendar (.ics) | **Compliant** | `QRCodeSVG`, unique `EVX-2026-XXXX` reference, printable PDF |
| **FR-CANC-01** | Cancellation & 100% refund processing | **Compliant** | `POST /api/bookings/<ref>/cancel/`, restores ticket quotas |
| **FR-ADM-01** | Admin dashboard with analytics & reporting | **Compliant** | Real-time revenue, bookings count, ticket sales, event creation |
| **FR-AI-01** | Gemini-powered enquiry chatbot with history | **Compliant** | `/api/chat/`, persistent `ChatMessage` table, Gemini API + fallback |

---

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Canvas Confetti, QRCode.react.
- **Backend**: Python 3.11+, Django 5.2+, Django REST Framework, Django CORS Headers.
- **Database**: SQLite (Development) / PostgreSQL (Configurable).
- **AI Integration**: Google Gemini Generative AI SDK (`google-genai` / `google.generativeai`).
