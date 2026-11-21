import os
import re
import json
import warnings
from django.utils import timezone
from .models import Event, TicketCategory

# Configure Gemini API Key from environment or .env file (excluded from git)
def _load_api_key():
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key.strip()
    for env_path in [
        os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
        os.path.join(os.getcwd(), ".env"),
        ".env"
    ]:
        if os.path.exists(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("GEMINI_API_KEY="):
                            return line.split("=", 1)[1].strip().strip('"').strip("'")
            except Exception:
                pass
    return ""

GEMINI_API_KEY = _load_api_key()

def format_price(amount):
    try:
        val = float(amount)
        if val.is_integer():
            return f"₹{int(val):,}"
        return f"₹{val:,.2f}"
    except:
        return f"₹{amount}"

def get_events_context():
    events = Event.objects.filter(is_published=True).prefetch_related('ticket_categories')
    data = []
    for ev in events:
        tiers_list = []
        for tc in ev.ticket_categories.all():
            tiers_list.append({
                "id": tc.id,
                "name": tc.name,
                "price": format_price(tc.price),
                "price_num": float(tc.price),
                "quota": tc.available_quota,
                "description": tc.description
            })
        data.append({
            "id": ev.id,
            "title": ev.title,
            "slug": ev.slug,
            "category": ev.category,
            "badge": ev.badge,
            "venue": ev.venue,
            "city": ev.city,
            "date": ev.start_date.strftime("%b %d, %Y at %I:%M %p"),
            "starting_price": format_price(ev.starting_price),
            "starting_price_num": float(ev.starting_price),
            "description": ev.description,
            "tiers": tiers_list,
            "tiers_str": ", ".join([f"{t['name']}: {t['price']} ({t['quota']} left)" for t in tiers_list])
        })
    return data

def generate_assistant_response(user_message, session_id=None):
    user_msg_lower = user_message.lower().strip()
    events = get_events_context()
    
    # 1. Try Gemini API first (if key is valid and network responds)
    if GEMINI_API_KEY and not GEMINI_API_KEY.startswith("YOUR_"):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                
                system_context = f"""You are Eventix Assistant, the official AI concierge for Eventix (a premier event discovery and ticket reservation platform built in accordance with IEEE 830).

Complete Live Event Catalog:
{json.dumps(events, indent=2)}

Eventix Platform Features:
- 10-Minute Hold Reservation: During checkout, seats are temporarily locked with a 10-minute countdown to guarantee availability.
- Cancellation & 100% Refund: Users can cancel anytime up to 24 hours before event start under 'My Bookings' for an immediate 100% refund.
- E-Tickets & QR Codes: Instant verifiable QR codes, unique reference IDs (e.g. EVX-2026-XXXX), printable tickets, and .ics calendar sync.
- Payment Options: 256-bit SSL encrypted gateway supporting UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking.
- Roles & Access: Guest (browsing & inquiries), User (booking, holds, history), Admin (real-time analytics, event creation, revenue tracking).
- Support: 24/7 Priority Hotline at +91 (044) 4800-EVENTIX, email support@eventix.in, headquarters at Eventix Tower, OMR IT Expressway, Chennai.

Guidelines:
1. Answer all user questions clearly, accurately, and politely.
2. If asking about ticket prices or booking, mention the exact price in ₹ and venue.
3. Keep answers concise, natural, and helpful (2-4 sentences)."""

                reply_text = None
                try:
                    from google import genai
                    client = genai.Client(api_key=GEMINI_API_KEY)
                    resp = client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[f"{system_context}\n\nUser Question: {user_message}"]
                    )
                    reply_text = resp.text
                except Exception:
                    import google.generativeai as legacy_genai
                    legacy_genai.configure(api_key=GEMINI_API_KEY)
                    model = legacy_genai.GenerativeModel("gemini-1.5-flash")
                    resp = model.generate_content([system_context, f"User Question: {user_message}"])
                    reply_text = resp.text

                if reply_text:
                    # Determine action payload
                    action_type = ""
                    action_payload = {}
                    for ev in events:
                        if ev["title"].lower() in user_msg_lower or ev["title"].lower() in reply_text.lower():
                            action_type = "book_event"
                            action_payload = {
                                "event_id": ev["id"],
                                "event_title": ev["title"],
                                "starting_price": ev["starting_price"]
                            }
                            break
                    
                    return {
                        "reply": reply_text,
                        "action_type": action_type,
                        "action_payload": action_payload
                    }
        except Exception:
            # Fall through to comprehensive knowledge engine
            pass

    # 2. Comprehensive Eventix Knowledge Engine & NLP Intent Handler
    # ---------------------------------------------------------------

    # A. WEBSITE IDENTITY & PLATFORM OVERVIEW
    if any(q in user_msg_lower for q in [
        "what is this website", "about this website", "what does this website do", 
        "what is eventix", "who made this", "tell me about eventix", "overview", "what can i do here"
    ]):
        return {
            "reply": "✨ Eventix is an event discovery and ticket reservation web platform developed in accordance with IEEE 830 / ISO/IEC/IEEE 29148 standards.\n\nHere you can:\n• Discover & search trending concerts, anime expos, tech conferences, and festivals.\n• Reserve tickets with a 10-Minute Hold countdown guarantee.\n• Pay securely via UPI, Card, or Net Banking.\n• Instantly download QR-coded E-Tickets & manage 100% refund cancellations.",
            "action_type": "view_catalog",
            "action_payload": {"category": "all"}
        }

    # B. HOW TO BOOK / BOOKING PROCESS
    if any(q in user_msg_lower for q in [
        "how to book", "how do i book", "booking process", "how does booking work", 
        "steps to book", "buy tickets", "purchase ticket"
    ]):
        return {
            "reply": "Booking on Eventix takes just 4 easy steps ⚡:\n1. Browse events and click 'Book Now'.\n2. Select your ticket tiers & quantities.\n3. Your tickets are held for 10 minutes while you enter your details.\n4. Complete payment via UPI, Card, or Net Banking to receive your instant QR E-Ticket!",
            "action_type": "view_catalog",
            "action_payload": {}
        }

    # C. 10-MINUTE HOLD RESERVATION MECHANISM
    if any(q in user_msg_lower for q in ["hold", "ticket hold", "reservation hold", "countdown", "timer", "temporary reservation"]):
        return {
            "reply": "🛡️ The Eventix 10-Minute Hold Reservation guarantees that when you select tickets, they are temporarily locked for you with an active countdown timer. This prevents anyone else from buying your seats while you enter attendee info and finalize payment!",
            "action_type": "info",
            "action_payload": {}
        }

    # D. REFUND & CANCELLATION POLICY
    if any(q in user_msg_lower for q in [
        "refund", "cancel", "cancellation", "how to cancel", "money back", 
        "return ticket", "cancellation policy", "refund policy"
    ]):
        return {
            "reply": "🔄 Eventix 100% Refund Policy:\n• You can cancel any booking up to 24 hours prior to the event start time.\n• Go to 'My Bookings' in the top menu and click 'Cancel Booking'.\n• A 100% full refund is instantly credited back to your original payment method, and ticket inventory is automatically restored.",
            "action_type": "navigate",
            "action_payload": {"target": "my_bookings"}
        }

    # E. PAYMENT METHODS & PCI DSS SECURITY
    if any(q in user_msg_lower for q in [
        "payment", "payment methods", "how to pay", "upi", "credit card", 
        "debit card", "net banking", "is it safe", "security", "pci dss"
    ]):
        return {
            "reply": "💳 Eventix supports all major payment methods with 256-Bit SSL encryption:\n• Instant UPI & QR Code (Google Pay, PhonePe, Paytm, BHIM)\n• Credit & Debit Cards (Visa, MasterCard, RuPay, Amex)\n• Net Banking across 50+ banks\nAll transactions comply with PCI DSS scope guidelines.",
            "action_type": "info",
            "action_payload": {}
        }

    # F. MY BOOKINGS / VIEW TICKETS / QR CODES
    if any(q in user_msg_lower for q in [
        "my booking", "my ticket", "view ticket", "where is my ticket", 
        "download ticket", "qr code", "print ticket", "ticket confirmation"
    ]):
        return {
            "reply": "🎟️ You can view all your confirmed tickets anytime by clicking 'My Bookings' in the navigation bar! From there, you can view your digital QR code for venue check-in, print your e-ticket, download a .ics calendar invite, or initiate a refund cancellation.",
            "action_type": "navigate",
            "action_payload": {"target": "my_bookings"}
        }

    # G. FAVORITES / WISHLIST
    if any(q in user_msg_lower for q in ["favorite", "wishlist", "saved events", "save event", "heart"]):
        return {
            "reply": "❤️ You can save any event by tapping the heart icon on its card! Access all your saved events anytime under 'Favorites' in the top menu to easily track ticket availability and book later.",
            "action_type": "navigate",
            "action_payload": {"target": "favorites"}
        }

    # H. ADMIN DASHBOARD & STAFF FEATURES
    if any(q in user_msg_lower for q in ["admin", "dashboard", "analytics", "organizer", "staff", "create event", "manage event"]):
        return {
            "reply": "⚙️ Eventix includes a comprehensive Admin Operations Dashboard! Staff members can track real-time revenue, total bookings, and tickets sold, create and edit events with custom pricing and quotas, and manage user bookings. Click your profile avatar to switch to 'Admin Staff'.",
            "action_type": "navigate",
            "action_payload": {"target": "admin"}
        }

    # I. USER ROLES / HOW TO SWITCH ROLES
    if any(q in user_msg_lower for q in ["role", "switch role", "guest", "demo user", "login", "account", "profile"]):
        return {
            "reply": "👤 Eventix features 3 distinct roles: Guest (anonymous browsing), User (booking, holds, history), and Admin Staff. You can instantly toggle between these roles anytime by clicking your profile avatar in the top right corner and selecting a test role!",
            "action_type": "info",
            "action_payload": {}
        }

    # J. CONTACT & CUSTOMER SUPPORT
    if any(q in user_msg_lower for q in ["contact", "support", "help", "phone", "email", "hotline", "office", "address", "customer care"]):
        return {
            "reply": "📞 24/7 Eventix Customer Support Concierge:\n• Hotline: +91 (044) 4800-EVENTIX / 1800-383-6849\n• Email: support@eventix.in\n• Headquarters: Eventix Tower, OMR IT Expressway, Chennai\n• Live Chat: Right here anytime!",
            "action_type": "info",
            "action_payload": {}
        }

    # K. EVENT TIMINGS & VENUE CHECK-IN
    if any(q in user_msg_lower for q in ["timing", "schedule", "gates open", "check in", "when does it start", "venue rules"]):
        schedules = [f"• {e['title']}: {e['date']} @ {e['venue']}" for e in events[:3]]
        return {
            "reply": "⏰ Upcoming Event Timings:\n" + "\n".join(schedules) + "\n\n💡 Note: Venue gates open 1 hour prior to the show for QR code check-in.",
            "action_type": "info",
            "action_payload": {}
        }

    # L. SPECIFIC EVENT NAME MATCHING (PRIORITIZED BEFORE GENERAL CATEGORY MATCHING)
    # Check Neon Nights
    if "neon nights" in user_msg_lower or "neon" in user_msg_lower:
        neon_ev = next((e for e in events if "neon" in e["title"].lower()), None)
        price_str = neon_ev["starting_price"] if neon_ev else "₹999"
        ev_id = neon_ev["id"] if neon_ev else 1
        return {
            "reply": f"The ticket price for Neon Nights Concert starts from {price_str}. Would you like to book now?",
            "action_type": "book_event",
            "action_payload": {
                "event_id": ev_id,
                "event_title": "Neon Nights Concert",
                "starting_price": price_str
            }
        }

    # Check Anime Expo
    if "anime" in user_msg_lower or "anime expo" in user_msg_lower or "cosplay" in user_msg_lower:
        anime_ev = next((e for e in events if "anime" in e["title"].lower()), None)
        price_str = anime_ev["starting_price"] if anime_ev else "₹499"
        ev_id = anime_ev["id"] if anime_ev else 2
        return {
            "reply": f"Anime Expo 2026 takes place on Dec 27–28, 2026 at Chennai Trade Centre. Tickets start from {price_str} onwards. Would you like to reserve your pass?",
            "action_type": "book_event",
            "action_payload": {
                "event_id": ev_id,
                "event_title": "Anime Expo 2026",
                "starting_price": price_str
            }
        }

    # Check Music Festival
    if "music festival" in user_msg_lower or "ymca" in user_msg_lower:
        music_ev = next((e for e in events if "music festival" in e["title"].lower()), None)
        price_str = music_ev["starting_price"] if music_ev else "₹1,499"
        ev_id = music_ev["id"] if music_ev else 3
        return {
            "reply": f"Music Festival 2026 is scheduled for Jan 15, 2027 at YMCA Grounds, Chennai with limited seats starting at {price_str}. Open-air music under the stars with fireworks! Would you like to book?",
            "action_type": "book_event",
            "action_payload": {
                "event_id": ev_id,
                "event_title": "Music Festival 2026",
                "starting_price": price_str
            }
        }

    # Check CyberTech Summit
    if "cybertech" in user_msg_lower or "cyber" in user_msg_lower:
        tech_ev = next((e for e in events if "cybertech" in e["title"].lower()), None)
        price_str = tech_ev["starting_price"] if tech_ev else "₹1,299"
        ev_id = tech_ev["id"] if tech_ev else 4
        return {
            "reply": f"🎙️ CyberTech Global Summit 2026 brings together 1,000+ tech leaders at ITC Grand Chola, Chennai on Dec 15, 2026. Passes start from {price_str}. Would you like to attend?",
            "action_type": "book_event",
            "action_payload": {
                "event_id": ev_id,
                "event_title": "CyberTech Global Summit 2026",
                "starting_price": price_str
            }
        }

    # Check Cosmic Light
    if "cosmic" in user_msg_lower or "light expo" in user_msg_lower or "digital art" in user_msg_lower:
        art_ev = next((e for e in events if "cosmic" in e["title"].lower()), None)
        price_str = art_ev["starting_price"] if art_ev else "₹399"
        ev_id = art_ev["id"] if art_ev else 5
        return {
            "reply": f"🎨 Cosmic Light & Digital Art Expo features 360-degree immersive projections and kinetic mirrors at Lalit Kala Akademi, Chennai from Dec 22, 2026. Entry starts from {price_str}. Shall we book your entry pass?",
            "action_type": "book_event",
            "action_payload": {
                "event_id": ev_id,
                "event_title": "Cosmic Light & Digital Art Expo",
                "starting_price": price_str
            }
        }

    # Check Pro Gaming
    if "gaming" in user_msg_lower or "esports" in user_msg_lower:
        game_ev = next((e for e in events if "gaming" in e["title"].lower()), None)
        price_str = game_ev["starting_price"] if game_ev else "₹699"
        ev_id = game_ev["id"] if game_ev else 6
        return {
            "reply": f"🏆 Pro Gaming & Esports Championship is happening on Jan 05, 2027 at Jawaharlal Nehru Stadium, Chennai for a ₹50 Lakh prize pool! Passes start from {price_str}.",
            "action_type": "book_event",
            "action_payload": {
                "event_id": ev_id,
                "event_title": "Pro Gaming & Esports Championship",
                "starting_price": price_str
            }
        }

    # Check AI Workshop
    if "workshop" in user_msg_lower or "ai workshop" in user_msg_lower or "learn" in user_msg_lower:
        ws_ev = next((e for e in events if "workshop" in e["title"].lower() or "genai" in e["slug"]), None)
        price_str = ws_ev["starting_price"] if ws_ev else "₹899"
        ev_id = ws_ev["id"] if ws_ev else 7
        return {
            "reply": f"💻 Mastering Generative AI Hands-on Workshop is scheduled for Jan 10, 2027 at IIT Madras Research Park. Hands-on coding with cloud credits, starting from {price_str}.",
            "action_type": "book_event",
            "action_payload": {
                "event_id": ev_id,
                "event_title": "Mastering Generative AI Hands-on Workshop",
                "starting_price": price_str
            }
        }

    # Any other event by title search
    for ev in events:
        if ev["title"].lower() in user_msg_lower or (ev["title"].split()[0].lower() in user_msg_lower and len(ev["title"].split()[0]) > 3):
            if any(w in user_msg_lower for w in ["price", "ticket", "cost", "how much", "rate", "tier", "vip"]):
                return {
                    "reply": f"The ticket price for {ev['title']} starts from {ev['starting_price']}. Available categories: {ev['tiers_str']}. Would you like to book now?",
                    "action_type": "book_event",
                    "action_payload": {
                        "event_id": ev["id"],
                        "event_title": ev["title"],
                        "starting_price": ev["starting_price"]
                    }
                }
            if any(w in user_msg_lower for w in ["where", "venue", "location", "address", "place"]):
                return {
                    "reply": f"{ev['title']} will take place at {ev['venue']} in {ev['city']}. Date: {ev['date']}. Tickets from {ev['starting_price']}.",
                    "action_type": "book_event",
                    "action_payload": {
                        "event_id": ev["id"],
                        "event_title": ev["title"],
                        "starting_price": ev["starting_price"]
                    }
                }
            return {
                "reply": f"✨ {ev['title']}:\n• Date: {ev['date']}\n• Venue: {ev['venue']}, {ev['city']}\n• Starting from: {ev['starting_price']}\n• Overview: {ev['description']}\nWould you like to reserve tickets?",
                "action_type": "book_event",
                "action_payload": {
                    "event_id": ev["id"],
                    "event_title": ev["title"],
                    "starting_price": ev["starting_price"]
                }
            }

    # M. GENERAL CATEGORY MATCHING (Concerts, Conferences, Festivals, Exhibitions)
    if "concert" in user_msg_lower:
        concerts = [e for e in events if e["category"] == "concerts"]
        res = ", ".join([f"{c['title']} ({c['starting_price']})" for c in concerts])
        return {
            "reply": f"🎵 We have top concert experiences available: {res}! Neon laser light shows, synthwave, and live bands. Which one would you like to explore?",
            "action_type": "view_catalog",
            "action_payload": {"category": "concerts"}
        }

    if "conference" in user_msg_lower:
        return {
            "reply": "🎙️ Our featured conference is CyberTech Global Summit 2026 at ITC Grand Chola, Chennai. Keynotes on generative AI, cybersecurity, and cloud architecture.",
            "action_type": "view_catalog",
            "action_payload": {"category": "conferences"}
        }

    # N. GENERAL CATALOG / BROWSE
    if any(q in user_msg_lower for q in ["all events", "what events", "list events", "show events", "browse", "catalog"]):
        ev_list = [f"• {e['title']} ({e['date']}, from {e['starting_price']})" for e in events[:5]]
        return {
            "reply": "Here are our highlight events open for reservation:\n" + "\n".join(ev_list) + "\n\nAsk me about any event, or click below to browse all!",
            "action_type": "view_catalog",
            "action_payload": {"category": "all"}
        }

    # O. DEFAULT COMPREHENSIVE INTELLIGENT CONCIERGE RESPONSE
    return {
        "reply": "I'm your Eventix AI Assistant! You can ask me anything about our platform:\n• Ticket prices & seat availability\n• Event dates, venues & directions\n• How booking & 10-minute hold works\n• 100% Refund and cancellation policy\n• Payment methods & customer support\n\nWhich event or detail can I help you with?",
        "action_type": "quick_options",
        "action_payload": {}
    }
