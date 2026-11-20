from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from events.models import UserProfile, Event, TicketCategory, Booking, BookingItem, ChatMessage

class Command(BaseCommand):
    help = 'Seed initial Eventix database with accounts, events, and sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding Eventix database...")

        # 1. Admin user
        admin_user, created = User.objects.get_or_create(username='admin', defaults={'email': 'admin@eventix.in', 'first_name': 'Eventix Admin'})
        if created:
            admin_user.set_password('admin123')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
        UserProfile.objects.get_or_create(user=admin_user, defaults={'role': 'admin', 'phone': '+91 98888 12345'})

        # 2. Demo user
        demo_user, created = User.objects.get_or_create(username='demo_user', defaults={'email': 'alex@example.com', 'first_name': 'Alex Morgan'})
        if created:
            demo_user.set_password('password123')
            demo_user.save()
        UserProfile.objects.get_or_create(user=demo_user, defaults={'role': 'user', 'phone': '+91 97777 54321'})

        # 3. Events with Dedicated High-Definition Imagery
        now = timezone.now()

        events_data = [
            {
                "title": "Neon Nights Concert",
                "slug": "neon-nights-concert-2026",
                "category": "concerts",
                "badge": "hot",
                "banner_image": "/assets/neon_nights_hd.jpg",
                "venue": "Chennai Indoor Stadium",
                "city": "Chennai",
                "start_date": now.replace(month=12, day=20, hour=19, minute=0, second=0, microsecond=0) if now.month <= 12 else now + timedelta(days=30),
                "starting_price": 999.00,
                "description": "Experience an electrifying night of synthwave, neon lasers, and world-class electronic music artists. Featuring state-of-the-art immersive audio, holographic visuals, and an unforgettable crowd energy.",
                "trailer_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "tiers": [
                    {"name": "Standard Admission", "price": 999.00, "quota": 250, "description": "Access to main standing arena and neon merch zone."},
                    {"name": "VIP Platinum Pass", "price": 1999.00, "quota": 80, "description": "Elevated viewing deck, expedited entry, complimentary drinks."},
                    {"name": "Backstage Pass + Meet & Greet", "price": 3499.00, "quota": 25, "description": "Full access backstage, artist photo op, exclusive gift package."}
                ]
            },
            {
                "title": "Anime Expo 2026",
                "slug": "anime-expo-2026",
                "category": "festivals",
                "badge": "trending",
                "banner_image": "/assets/anime_expo_hd.jpg",
                "venue": "Chennai Trade Centre",
                "city": "Chennai",
                "start_date": now.replace(month=12, day=27, hour=10, minute=0, second=0, microsecond=0) if now.month <= 12 else now + timedelta(days=37),
                "end_date": now.replace(month=12, day=28, hour=20, minute=0, second=0, microsecond=0) if now.month <= 12 else now + timedelta(days=38),
                "starting_price": 499.00,
                "description": "The largest celebration of Japanese pop culture, anime, manga, and gaming in South India! Cosplay championships, international voice actor panels, artist alleys, and arcade battles.",
                "trailer_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "tiers": [
                    {"name": "Day 1 Single Pass", "price": 499.00, "quota": 400, "description": "General admission for Saturday Dec 27."},
                    {"name": "Two-Day Weekend Pass", "price": 899.00, "quota": 250, "description": "Full weekend entry with priority artist alley lane."},
                    {"name": "Otaku Gold VIP Pass", "price": 1499.00, "quota": 100, "description": "Early 9 AM hall entry, autographed poster, cosplay greenroom access."}
                ]
            },
            {
                "title": "Music Festival 2026",
                "slug": "music-festival-2026",
                "category": "festivals",
                "badge": "limited",
                "banner_image": "/assets/music_festival_hd.jpg",
                "venue": "YMCA Grounds, Chennai",
                "city": "Chennai",
                "start_date": (now + timedelta(days=56)).replace(hour=17, minute=0, second=0, microsecond=0),
                "starting_price": 1499.00,
                "description": "An open-air festival bringing together legendary indie, rock, and fusion artists under the stars with grand fireworks displays, food trucks, and art installations.",
                "trailer_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "tiers": [
                    {"name": "Early Bird Standing", "price": 1499.00, "quota": 150, "description": "Discounted admission tier for early festival enthusiasts."},
                    {"name": "Stagefront Fan Pit", "price": 2499.00, "quota": 80, "description": "Up-close stage access with prime acoustic positioning."},
                    {"name": "VIP Sky Lounge", "price": 4999.00, "quota": 30, "description": "All-inclusive buffet, private bar, premium elevated seating."}
                ]
            },
            {
                "title": "CyberTech Global Summit 2026",
                "slug": "cybertech-global-summit-2026",
                "category": "conferences",
                "badge": "new",
                "banner_image": "/assets/cybertech_summit_hd.jpg",
                "venue": "ITC Grand Chola, Chennai",
                "city": "Chennai",
                "start_date": (now + timedelta(days=25)).replace(hour=9, minute=0, second=0, microsecond=0),
                "starting_price": 1299.00,
                "description": "Join 1,000+ tech leaders, software architects, and AI researchers exploring the next generation of cloud scale, generative computing, and cybersecurity defenses.",
                "trailer_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "tiers": [
                    {"name": "Conference Delegate", "price": 1299.00, "quota": 120, "description": "Full access to keynotes, breakout sessions, and exhibition floor."},
                    {"name": "Executive VIP Pass", "price": 2999.00, "quota": 40, "description": "Includes networking dinner, speaker lounge, and session recordings."}
                ]
            },
            {
                "title": "Cosmic Light & Digital Art Expo",
                "slug": "cosmic-light-art-expo-2026",
                "category": "exhibitions",
                "badge": "trending",
                "banner_image": "/assets/cosmic_light_hd.jpg",
                "venue": "Lalit Kala Akademi, Chennai",
                "city": "Chennai",
                "start_date": (now + timedelta(days=15)).replace(hour=11, minute=0, second=0, microsecond=0),
                "starting_price": 399.00,
                "description": "Immersive 360-degree projection mapping, interactive digital mirrors, and cosmic kinetic sculptures that respond to touch and sound.",
                "trailer_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "tiers": [
                    {"name": "Standard Entry", "price": 399.00, "quota": 300, "description": "One-hour walkthrough of the 7 cosmic light galleries."},
                    {"name": "Guided Curator Experience", "price": 799.00, "quota": 50, "description": "Expert artist commentary and exclusive souvenir book."}
                ]
            },
            {
                "title": "Pro Gaming & Esports Championship",
                "slug": "pro-gaming-esports-2026",
                "category": "sports",
                "badge": "hot",
                "banner_image": "/assets/pro_gaming_hd.jpg",
                "venue": "Jawaharlal Nehru Stadium, Chennai",
                "city": "Chennai",
                "start_date": (now + timedelta(days=40)).replace(hour=14, minute=0, second=0, microsecond=0),
                "starting_price": 699.00,
                "description": "Top gaming teams compete live in front of thousands for a ₹50,00,000 prize pool in Valorant, Street Fighter 6, and BGMI.",
                "trailer_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "tiers": [
                    {"name": "Stadium Bowl Pass", "price": 699.00, "quota": 300, "description": "Grandstand seating with giant screen viewing."},
                    {"name": "Gamer Pit VIP", "price": 1599.00, "quota": 60, "description": "Front stage seats, goodie bag with tournament jersey and gaming mousepad."}
                ]
            },
            {
                "title": "Mastering Generative AI Hands-on Workshop",
                "slug": "genai-hands-on-workshop",
                "category": "workshops",
                "badge": "limited",
                "banner_image": "/assets/genai_workshop_hd.jpg",
                "venue": "IIT Madras Research Park",
                "city": "Chennai",
                "start_date": (now + timedelta(days=45)).replace(hour=10, minute=0, second=0, microsecond=0),
                "starting_price": 899.00,
                "description": "A comprehensive deep dive into building production LLM applications, multimodal agents, and vector search systems with live coding.",
                "trailer_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "tiers": [
                    {"name": "Workshop Participant", "price": 899.00, "quota": 70, "description": "Interactive coding sessions, cloud lab credits, and certificate."},
                    {"name": "VIP Mentorship Pass", "price": 1799.00, "quota": 20, "description": "Includes 1-on-1 portfolio review and private Q&A lunch."}
                ]
            }
        ]

        for ed in events_data:
            tiers = ed.pop('tiers')
            event, _ = Event.objects.update_or_create(slug=ed['slug'], defaults=ed)
            for t in tiers:
                TicketCategory.objects.update_or_create(
                    event=event,
                    name=t['name'],
                    defaults={
                        'price': t['price'],
                        'total_quota': t['quota'],
                        'available_quota': t['quota'],
                        'description': t['description']
                    }
                )
            event.update_starting_price()

        # Seed sample booking for demo user
        neon_ev = Event.objects.filter(slug='neon-nights-concert-2026').first()
        if neon_ev:
            first_tier = neon_ev.ticket_categories.first()
            if first_tier and not Booking.objects.filter(user=demo_user).exists():
                ref = "EVX-2026-N74A9"
                b = Booking.objects.create(
                    booking_reference=ref,
                    user=demo_user,
                    customer_name="Alex Morgan",
                    customer_email="alex@example.com",
                    customer_phone="+91 97777 54321",
                    event=neon_ev,
                    status="CONFIRMED",
                    total_amount=first_tier.price * 2,
                    payment_method="UPI",
                    payment_id="PAY-NEON789123",
                    qr_code_data=f"EVENTIX-TICKET|REF:{ref}|EVT:{neon_ev.title}|NAME:Alex Morgan|DATE:{neon_ev.start_date.isoformat()}"
                )
                BookingItem.objects.create(
                    booking=b,
                    ticket_category=first_tier,
                    quantity=2,
                    unit_price=first_tier.price,
                    subtotal=first_tier.price * 2
                )
                first_tier.available_quota -= 2
                first_tier.save()

        self.stdout.write(self.style.SUCCESS("Eventix database seeded with dedicated HD assets successfully!"))
