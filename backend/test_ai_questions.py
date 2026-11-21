import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventix_backend.settings')
django.setup()

from events.ai_service import generate_assistant_response

queries = [
    'What is this website about?',
    'How do I book tickets?',
    'What is the 10-minute hold reservation?',
    'How do I cancel and get a refund?',
    'What payment methods are supported?',
    'Where is my ticket / QR code?',
    'What are the ticket prices for Neon Nights Concert?',
    'Where is Anime Expo 2026 located?',
    'What tech conferences do you have?',
    'How can I contact customer support?'
]

print("=== TESTING ENHANCED EVENTIX AI CONCIERGE ===\n")
for q in queries:
    res = generate_assistant_response(q)
    print(f"User: '{q}'")
    print(f"AI: {res['reply'][:140]}...")
    print(f"Action: {res.get('action_type')} -> {res.get('action_payload')}\n")
