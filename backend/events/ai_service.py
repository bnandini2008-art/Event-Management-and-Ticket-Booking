import os
import re
import json
import warnings
from django.utils import timezone
from .models import Event, TicketCategory, ChatMessage

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
    except Exception:
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
            "end_date": ev.end_date.strftime("%b %d, %Y at %I:%M %p") if ev.end_date else None,
            "starting_price": format_price(ev.starting_price),
            "starting_price_num": float(ev.starting_price),
            "description": ev.description,
            "tiers": tiers_list,
            "tiers_str": ", ".join([f"{t['name']}: {t['price']} ({t['quota']} seats left)" for t in tiers_list])
        })
    return data

def find_context_event(session_id, events):
    """Inspects recent messages in the session to identify the active event context."""
    if not session_id:
        return None
    try:
        recent_msgs = ChatMessage.objects.filter(session_id=session_id).order_by('-id')[:6]
        for m in recent_msgs:
            text = (m.message or '').lower()
            for ev in events:
                if ev['title'].lower() in text or ev['slug'] in text or ev['title'].split()[0].lower() in text:
                    return ev
    except Exception:
        pass
    return None

def detect_event_in_text(text, events):
    """Detects which event is explicitly named in the text, avoiding category-level queries."""
    t = text.lower()
    # If the user is asking about a plural category or browsing, don't pin to a single event
    if any(phrase in t for phrase in [
        "what workshops", "workshops available", "any workshop", "workshops are", "list workshops",
        "what concerts", "concerts available", "any concert", "concerts are", "list concerts",
        "what conferences", "conferences available", "any conference", "conferences are", "list conferences",
        "what festivals", "festivals available", "any festival", "festivals are", "list festivals",
        "what exhibitions", "exhibitions available", "any exhibition", "exhibitions are", "list exhibitions",
        "what sports", "sports available", "any sport", "all events", "what events"
    ]):
        return None

    # Direct title / specific key terms matching
    for ev in events:
        title_lower = ev['title'].lower()
        if title_lower in t:
            return ev
        # Specific terms unique to single events
        if ('neon nights' in t or ('neon' in t and not 'light' in t)) and 'neon' in title_lower:
            return ev
        if ('anime expo' in t or 'cosplay' in t or 'otaku' in t) and 'anime' in title_lower:
            return ev
        if ('music festival' in t or 'ymca' in t) and 'music' in title_lower:
            return ev
        if ('cybertech' in t or 'grand chola' in t) and 'cyber' in title_lower:
            return ev
        if ('cosmic' in t or 'lalit kala' in t) and 'cosmic' in title_lower:
            return ev
        if ('pro gaming' in t or 'esports' in t or 'valorant' in t) and 'gaming' in title_lower:
            return ev
        if ('generative ai workshop' in t or 'genai workshop' in t or 'iit madras' in t) and 'workshop' in title_lower:
            return ev
    return None

def generate_assistant_response(user_message, session_id=None):
    user_msg = user_message.strip()
    user_msg_lower = user_msg.lower()
    events = get_events_context()

    # 1. Try Gemini API ONLY IF standard Gemini API key (starts with AIzaSy)
    if GEMINI_API_KEY and GEMINI_API_KEY.startswith("AIzaSy"):
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                system_context = f"""You are Eventix Assistant, the official AI concierge for Eventix event ticketing platform.
Live Event Catalog:
{json.dumps(events, indent=2)}

Platform Rules:
- 10-Minute Hold: Seats held with live countdown during checkout.
- 100% Refund: Cancellations permitted up to 24 hours prior under 'My Bookings'.
- E-Tickets: Verifiable QR codes and .ics calendar sync.
- Payments: UPI, Cards, Net Banking (256-bit SSL).
- Support: +91 (044) 4800-EVENTIX, support@eventix.in.

Provide concise, friendly, informative answers (2-3 sentences)."""
                from google import genai
                client = genai.Client(api_key=GEMINI_API_KEY)
                resp = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[f"{system_context}\n\nUser: {user_msg}"]
                )
                if resp and resp.text:
                    reply_text = resp.text.strip()
                    # Determine action
                    action_type = ""
                    action_payload = {}
                    for ev in events:
                        if ev["title"].lower() in reply_text.lower():
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
            pass

    # -------------------------------------------------------------------------
    # 2. Comprehensive Eventix Natural Language & Intent Engine
    # -------------------------------------------------------------------------

    # Detect if a specific event is mentioned or active in context
    event_target = detect_event_in_text(user_msg, events)
    if not event_target:
        # Check session context for follow-up questions
        event_target = find_context_event(session_id, events)

    # -------------------------------------------------------------------------
    # INTENT A: GREETINGS & CASUAL CONVERSATION
    # -------------------------------------------------------------------------
    if any(re.search(rf"\b{w}\b", user_msg_lower) for w in ["hi", "hello", "hey", "hola", "sup", "yo", "good morning", "good afternoon", "good evening", "howdy"]):
        return {
            "reply": "Hey there! 👋 Welcome to Eventix! I'm your AI concierge. I can help you check ticket prices, event timings, venue directions, or guide you through booking and our 100% refund policy.\n\nWhich event would you like to explore today?",
            "action_type": "quick_options",
            "action_payload": {}
        }

    if any(q in user_msg_lower for q in ["how are you", "how's it going", "how do you do", "how are u"]):
        return {
            "reply": "I'm doing great, thank you for asking! 🌟 I'm ready to help you discover exciting concerts, expos, and festivals happening across Chennai. What type of event are you in the mood for?",
            "action_type": "view_catalog",
            "action_payload": {"category": "all"}
        }

    if any(q in user_msg_lower for q in ["who are you", "what is your name", "what are you", "what can you do", "introduce yourself"]):
        return {
            "reply": "I'm the Eventix Assistant! 🤖 Here's what I can do for you:\n• Provide instant ticket prices, venue details & timings\n• Reserve tickets with our 10-Minute Hold protection\n• Explain our 100% Full Refund & Cancellation policies\n• Help you find your QR code e-tickets\n• Guide you on UPI & Card payments",
            "action_type": "quick_options",
            "action_payload": {}
        }

    is_asking_question = any(w in user_msg_lower for w in ["?", "how", "what", "where", "when", "who", "which", "can i", "is there", "are there", "why", "refund", "cancel", "hold", "ticket", "book", "pay", "seat", "cost", "price"])
    if not is_asking_question and re.search(r"\b(thank you|thanks|thx|awesome|great|cool|perfect|got it|nice|ok|okay)\b", user_msg_lower):
        return {
            "reply": "You're very welcome! 😊 Feel free to ask if you need anything else or want help reserving tickets. Have a fantastic time at Eventix! ✨",
            "action_type": "view_catalog",
            "action_payload": {"category": "all"}
        }

    # -------------------------------------------------------------------------
    # INTENT B: PLATFORM OVERVIEW & IDENTITY
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "what is this website", "about this website", "what does this website do",
        "what is eventix", "tell me about eventix", "platform overview", "what can i do here",
        "website details", "about event booking", "how does this work"
    ]):
        return {
            "reply": "✨ Eventix is a modern event discovery and ticket reservation web platform developed in accordance with IEEE 830 standards.\n\nKey Highlights:\n• Live Event Discovery: Browse concerts, anime expos, tech conferences, exhibitions, and esports.\n• 10-Minute Seat Hold: Temporary seat lock with live countdown timer during checkout.\n• 100% Refund Guarantee: Cancel anytime up to 24h prior under 'My Bookings'.\n• Digital QR E-Tickets: Verifiable QR codes for smooth venue check-in.",
            "action_type": "view_catalog",
            "action_payload": {"category": "all"}
        }

    # -------------------------------------------------------------------------
    # INTENT C: EVENT-SPECIFIC QUESTIONS (WHEN EVENT IS TARGETED)
    # -------------------------------------------------------------------------
    if event_target:
        ev = event_target
        ev_title = ev["title"]
        ev_price = ev["starting_price"]
        ev_venue = ev["venue"]
        ev_city = ev["city"]
        ev_date = ev["date"]
        ev_tiers = ev["tiers"]
        ev_id = ev["id"]

        # C1. Price / Cost / Tiers Query for this Event
        if any(w in user_msg_lower for w in ["price", "cost", "ticket", "rate", "fee", "tier", "how much", "cheap", "expensive", "vip", "quota", "pass"]):
            tier_lines = "\n".join([f"• {t['name']}: {t['price']} ({t['quota']} available)" for t in ev_tiers])
            return {
                "reply": f"🎟️ Ticket pricing for {ev_title}:\n• Starting from: {ev_price}\n\nAvailable Categories:\n{tier_lines}\n\nAll tickets include 10-Minute Hold protection and instant QR generation. Would you like to reserve now?",
                "action_type": "book_event",
                "action_payload": {
                    "event_id": ev_id,
                    "event_title": ev_title,
                    "starting_price": ev_price
                }
            }

        # C2. Timing / Date / Schedule Query for this Event
        if any(w in user_msg_lower for w in ["time", "timing", "when", "date", "schedule", "hour", "duration", "start", "gates", "day", "month"]):
            end_info = f" until {ev['end_date']}" if ev.get("end_date") else ""
            return {
                "reply": f"⏰ Event Schedule for {ev_title}:\n• Date & Time: {ev_date}{end_info}\n• Venue Gates Open: 1 hour prior for security & QR ticket check-in\n• Venue: {ev_venue}, {ev_city}\n\nWould you like to reserve tickets for this date?",
                "action_type": "book_event",
                "action_payload": {
                    "event_id": ev_id,
                    "event_title": ev_title,
                    "starting_price": ev_price
                }
            }

        # C3. Venue / Location / Directions / Parking Query for this Event
        if any(w in user_msg_lower for w in ["where", "venue", "location", "address", "place", "direction", "metro", "reach", "city", "parking", "stadium", "hall", "centre"]):
            return {
                "reply": f"📍 Location & Venue Details for {ev_title}:\n• Venue: {ev_venue}\n• City: {ev_city}\n• Date: {ev_date}\n• Access: Dedicated parking available on-site and convenient access via Chennai public transport & metro.\n\nTickets start from {ev_price}. Would you like to book?",
                "action_type": "book_event",
                "action_payload": {
                    "event_id": ev_id,
                    "event_title": ev_title,
                    "starting_price": ev_price
                }
            }

        # C4. Lineup / Artists / Performers / Highlights / Theme Query for this Event
        if any(w in user_msg_lower for w in ["who", "artist", "performer", "dj", "singer", "band", "speaker", "guest", "cosplay", "lineup", "theme", "what happens", "about"]):
            return {
                "reply": f"✨ Highlights & Experience for {ev_title}:\n{ev['description']}\n\n• Date: {ev_date}\n• Location: {ev_venue}\n• Admission: Starting from {ev_price}\n\nWould you like to reserve your pass?",
                "action_type": "book_event",
                "action_payload": {
                    "event_id": ev_id,
                    "event_title": ev_title,
                    "starting_price": ev_price
                }
            }

        # C5. Seat Availability / Sold Out Query for this Event
        if any(w in user_msg_lower for w in ["seats", "left", "availability", "available", "sold out", "quota"]):
            total_seats = sum(t['quota'] for t in ev_tiers)
            tier_status = ", ".join([f"{t['name']}: {t['quota']} seats" for t in ev_tiers])
            return {
                "reply": f"📊 Seat Availability for {ev_title}:\nCurrently {total_seats} total seats remain across tiers ({tier_status}). Seats are reserved on a first-come, first-served basis with 10-Minute Hold protection.",
                "action_type": "book_event",
                "action_payload": {
                    "event_id": ev_id,
                    "event_title": ev_title,
                    "starting_price": ev_price
                }
            }

        # C6. Age Limit / Rules / Guidelines for this Event
        if any(w in user_msg_lower for w in ["age", "kid", "child", "children", "rule", "guideline", "food", "drink", "camera", "photography", "dress"]):
            return {
                "reply": f"📋 Entry Guidelines & Venue Policies for {ev_title}:\n• Valid Government ID & digital QR ticket required at check-in\n• Gates open 60 minutes before start time\n• Outside food & beverages are strictly prohibited\n• Age Limit: All ages welcome; children under 5 enter free when accompanied by a ticketed adult.",
                "action_type": "book_event",
                "action_payload": {
                    "event_id": ev_id,
                    "event_title": ev_title,
                    "starting_price": ev_price
                }
            }

        # C7. Default for this Event: Overview + Booking Prompt
        return {
            "reply": f"✨ {ev_title}:\n• Date: {ev_date}\n• Venue: {ev_venue}, {ev_city}\n• Starting Price: {ev_price}\n• Description: {ev['description']}\n\nWould you like to reserve tickets now?",
            "action_type": "book_event",
            "action_payload": {
                "event_id": ev_id,
                "event_title": ev_title,
                "starting_price": ev_price
            }
        }

    # -------------------------------------------------------------------------
    # INTENT D: HOW TO BOOK & STEP-BY-STEP RESERVATION
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "how to book", "how do i book", "booking process", "how does booking work",
        "steps to book", "buy tickets", "purchase ticket", "how to buy", "book a ticket"
    ]):
        return {
            "reply": "Booking on Eventix is fast and secure (4 easy steps) ⚡:\n1. Choose an event and click 'Book Now'.\n2. Select your ticket tier and quantity.\n3. Your tickets are held for 10 minutes while you enter attendee details.\n4. Pay via UPI, Card, or Net Banking to instantly receive your QR-coded E-Ticket!",
            "action_type": "view_catalog",
            "action_payload": {"category": "all"}
        }

    # -------------------------------------------------------------------------
    # INTENT E: 10-MINUTE HOLD RESERVATION MECHANISM
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "hold", "10 minute", "10-minute", "seat lock", "timer", "countdown",
        "temporary reservation", "why timer", "timer expires", "hold ticket"
    ]):
        return {
            "reply": "🛡️ The 10-Minute Hold Reservation guarantees that when you select tickets, they are temporarily locked exclusively for you with an active countdown timer.\n\n• Nobody else can buy your seats while you enter your info.\n• If the timer expires before payment, seats are released back to public inventory.\n• Once paid, your booking is confirmed permanently!",
            "action_type": "info",
            "action_payload": {}
        }

    # -------------------------------------------------------------------------
    # INTENT F: REFUND & CANCELLATION POLICY
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "refund", "cancel", "cancellation", "how to cancel", "money back",
        "return ticket", "cancellation policy", "refund policy", "can i cancel"
    ]):
        return {
            "reply": "🔄 Eventix 100% Full Refund Policy:\n• Cancel anytime up to 24 hours prior to the event start time.\n• Go to 'My Bookings' in the top menu and click 'Cancel Booking'.\n• 100% of your money is refunded immediately to your original payment method.\n• The ticket quota is automatically restored to the event inventory.",
            "action_type": "navigate",
            "action_payload": {"target": "my_bookings"}
        }

    # -------------------------------------------------------------------------
    # INTENT G: PAYMENT METHODS & PCI DSS SECURITY
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "payment", "pay", "how to pay", "upi", "gpay", "google pay", "phonepe",
        "paytm", "credit card", "debit card", "net banking", "bhim", "safe", "security", "ssl"
    ]):
        return {
            "reply": "💳 Supported Payment Methods (Protected with 256-Bit SSL):\n• Instant UPI & QR: Google Pay, PhonePe, Paytm, BHIM\n• Credit / Debit Cards: Visa, MasterCard, RuPay, American Express\n• Net Banking: 50+ major Indian banks supported\n\nAll transactions comply with PCI DSS industry security standards.",
            "action_type": "info",
            "action_payload": {}
        }

    # -------------------------------------------------------------------------
    # INTENT H: MY BOOKINGS / E-TICKETS / QR CODES / CALENDAR
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "my booking", "my ticket", "view ticket", "where is my ticket",
        "qr code", "qr", "download ticket", "print ticket", "calendar", "ics", "confirmation"
    ]):
        return {
            "reply": "🎟️ You can view all confirmed tickets under 'My Bookings' in the top menu!\n\nFrom 'My Bookings', you can:\n• Display your verified QR Code for venue scanner check-in\n• Download .ics Calendar event for Google / Outlook Calendar\n• Print e-ticket confirmation with booking reference (e.g. EVX-2026-XXXX)\n• Request a 100% refund cancellation if plans change.",
            "action_type": "navigate",
            "action_payload": {"target": "my_bookings"}
        }

    # -------------------------------------------------------------------------
    # INTENT I: USER ROLES / HOW TO SWITCH ROLES / DEMO LOGIN
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "role", "switch role", "guest", "demo user", "login", "account",
        "profile", "admin login", "credentials", "password"
    ]):
        return {
            "reply": "👤 Eventix features 3 instant access roles:\n• Guest: Browse events, view trailers & ask the AI Assistant\n• Demo User ('demo_user' / 'password123'): Reserve seats, test checkout & manage bookings\n• Admin ('admin' / 'admin123'): Real-time revenue analytics & event creation\n\n💡 Tip: Click your user profile avatar in the top-right header to switch roles instantly with one click!",
            "action_type": "info",
            "action_payload": {}
        }

    # -------------------------------------------------------------------------
    # INTENT J: ADMIN DASHBOARD & STAFF OPERATIONS
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "admin", "dashboard", "analytics", "revenue", "organizer",
        "staff", "create event", "manage event", "sales"
    ]):
        return {
            "reply": "⚙️ The Eventix Admin Dashboard provides organizers with full operational control:\n• Live Revenue KPI cards & total bookings counter\n• Total tickets sold across categories\n• 'Create Event' modal to publish new events with custom tiers & quotas\n• Real-time booking audit logs\n\nClick below to open the Admin Panel (or switch role to Admin).",
            "action_type": "navigate",
            "action_payload": {"target": "admin"}
        }

    # -------------------------------------------------------------------------
    # INTENT K: FAVORITES / WISHLIST
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in ["favorite", "wishlist", "save event", "saved events", "heart"]):
        return {
            "reply": "❤️ You can save any event to your personal Wishlist by tapping the heart icon on its card! Access all your saved events anytime under 'Favorites' in the top navigation bar to monitor price updates and seat quotas.",
            "action_type": "navigate",
            "action_payload": {"target": "favorites"}
        }

    # -------------------------------------------------------------------------
    # INTENT L: 24/7 CUSTOMER SUPPORT & CONTACT
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in [
        "contact", "support", "help", "phone", "email", "hotline",
        "customer care", "office", "address", "call", "complaint"
    ]):
        return {
            "reply": "📞 24/7 Eventix Customer Support Concierge:\n• Priority Hotline: +91 (044) 4800-EVENTIX / 1800-383-6849\n• Email Support: support@eventix.in\n• Corporate Office: Eventix Tower, OMR IT Expressway, Chennai - 600096\n• Live Chat: Available right here 24/7!",
            "action_type": "info",
            "action_payload": {}
        }

    # -------------------------------------------------------------------------
    # INTENT M: DISCOUNTS / OFFERS / NEWSLETTER
    # -------------------------------------------------------------------------
    if any(q in user_msg_lower for q in ["discount", "offer", "promo", "coupon", "newsletter", "voucher", "deal"]):
        return {
            "reply": "🎁 Exclusive Eventix Offers:\n• Subscribe to our newsletter in the footer banner below to receive a 10% welcome coupon on your next booking!\n• Look out for 'Early Bird' ticket tiers which offer up to 40% savings compared to standard entry passes.",
            "action_type": "info",
            "action_payload": {}
        }

    # -------------------------------------------------------------------------
    # INTENT N: CATEGORY-SPECIFIC EVENT BROWSING
    # -------------------------------------------------------------------------
    if any(w in user_msg_lower for w in ["concert", "music", "sing", "band", "dj", "edm"]):
        concerts = [e for e in events if e["category"] == "concerts" or "concert" in e["title"].lower()]
        names = ", ".join([f"{c['title']} ({c['starting_price']})" for c in concerts])
        return {
            "reply": f"🎵 Featured Concerts in Chennai:\n{names}\n\nExperience neon laser choreography, synthwave, and live bands! Would you like details on Neon Nights Concert?",
            "action_type": "view_catalog",
            "action_payload": {"category": "concerts"}
        }

    if any(w in user_msg_lower for w in ["conference", "summit", "keynote", "talk", "tech"]):
        return {
            "reply": "🎙️ Featured Conferences:\n• CyberTech Global Summit 2026 at ITC Grand Chola, Chennai (Dec 15, 2026)\nKeynotes on Generative AI, cloud infrastructure, and cybersecurity defenses starting from ₹1,299.",
            "action_type": "view_catalog",
            "action_payload": {"category": "conferences"}
        }

    if any(w in user_msg_lower for w in ["festival", "fest", "carnival"]):
        festivals = [e for e in events if e["category"] == "festivals"]
        items = "\n".join([f"• {f['title']}: {f['date']} at {f['venue']} (from {f['starting_price']})" for f in festivals])
        return {
            "reply": f"🎆 Upcoming Festivals:\n{items}\n\nWhich festival would you like to explore?",
            "action_type": "view_catalog",
            "action_payload": {"category": "festivals"}
        }

    if any(w in user_msg_lower for w in ["exhibition", "art", "gallery", "light expo", "museum"]):
        return {
            "reply": "📦 Featured Exhibitions:\n• Cosmic Light & Digital Art Expo at Lalit Kala Akademi, Chennai\nImmersive 360-degree projection mapping, digital mirrors, and kinetic art from ₹399.",
            "action_type": "view_catalog",
            "action_payload": {"category": "exhibitions"}
        }

    if any(w in user_msg_lower for w in ["workshop", "learn", "course", "coding", "hands-on"]):
        return {
            "reply": "💻 Featured Workshops:\n• Mastering Generative AI Hands-on Workshop at IIT Madras Research Park (Jan 10, 2027)\nFull day hands-on coding with multimodal models and cloud credits from ₹899.",
            "action_type": "view_catalog",
            "action_payload": {"category": "workshops"}
        }

    if any(w in user_msg_lower for w in ["sport", "gaming", "esport", "championship", "tournament"]):
        return {
            "reply": "🏆 Featured Sports & Gaming:\n• Pro Gaming & Esports Championship at Jawaharlal Nehru Stadium, Chennai (Jan 05, 2027)\n₹50 Lakh prize pool across Valorant, CS2, and FIFA tournaments from ₹699.",
            "action_type": "view_catalog",
            "action_payload": {"category": "sports"}
        }

    # -------------------------------------------------------------------------
    # INTENT O: CHEAPEST / BUDGET / HIGHEST PRICE / RECOMMENDATIONS
    # -------------------------------------------------------------------------
    if any(w in user_msg_lower for w in ["cheapest", "lowest price", "budget", "affordable", "least expensive"]):
        sorted_ev = sorted(events, key=lambda x: x["starting_price_num"])
        cheapest = sorted_ev[0]
        second = sorted_ev[1]
        return {
            "reply": f"💰 Most Affordable Events on Eventix:\n1. {cheapest['title']} — starts at only {cheapest['starting_price']} ({cheapest['venue']})\n2. {second['title']} — starts at {second['starting_price']} ({second['venue']})\n\nBoth include full 10-Minute Hold protection and instant QR tickets!",
            "action_type": "book_event",
            "action_payload": {
                "event_id": cheapest["id"],
                "event_title": cheapest["title"],
                "starting_price": cheapest["starting_price"]
            }
        }

    if any(w in user_msg_lower for w in ["trending", "popular", "top", "hot", "recommend", "best"]):
        return {
            "reply": "🌟 Top Trending Events on Eventix right now:\n• 🔥 Neon Nights Concert (Dec 20, Chennai Indoor Stadium, from ₹999)\n• ⭐ Anime Expo 2026 (Dec 27–28, Chennai Trade Centre, from ₹499)\n• 🎆 Music Festival 2026 (Jan 15, YMCA Grounds, from ₹1,499)\n\nWhich one would you like to know more about?",
            "action_type": "view_catalog",
            "action_payload": {"category": "all"}
        }

    # -------------------------------------------------------------------------
    # INTENT P: ALL EVENTS / BROWSE CATALOG
    # -------------------------------------------------------------------------
    if any(w in user_msg_lower for w in ["all events", "list events", "what events", "browse", "catalog", "events"]):
        ev_list = [f"• {e['title']} — {e['date']} ({e['starting_price']})" for e in events]
        return {
            "reply": f"Here are the {len(events)} events currently live on Eventix:\n" + "\n".join(ev_list) + "\n\nFeel free to ask me for ticket tiers, timings, or venues for any of these!",
            "action_type": "view_catalog",
            "action_payload": {"category": "all"}
        }

    # -------------------------------------------------------------------------
    # INTENT Q: INTELLIGENT CONTEXTUAL FALLBACK
    # -------------------------------------------------------------------------
    return {
        "reply": f"I'm here to help with all details about Eventix! You can ask me:\n• 'What are the ticket prices for Anime Expo?'\n• 'Where is Neon Nights Concert located?'\n• 'How does the 10-minute hold reservation work?'\n• 'What is the refund and cancellation policy?'\n• 'What payment methods do you support?'\n\nWhich detail can I look up for you?",
        "action_type": "quick_options",
        "action_payload": {}
    }
