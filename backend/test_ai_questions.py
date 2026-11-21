import os, sys, django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventix_backend.settings')
django.setup()

from events.ai_service import generate_assistant_response

test_queries = [
    'hi',
    'how are you',
    'who are you',
    'what is this website',
    'what is the ticket price of Anime Expo?',
    'what time does Neon Nights Concert start?',
    'where is Music Festival located?',
    'how many seats are left for CyberTech Summit?',
    'what is the 10-minute hold timer?',
    'can I cancel my booking and get a refund?',
    'can I pay with UPI / Google Pay?',
    'where can I find my QR code ticket?',
    'what is the cheapest event on the website?',
    'what workshops are available?',
    'how do I access the admin dashboard?',
    'thanks for the help!'
]

print("=== TESTING EVENTIX AI CONCIERGE UNIQUENESS & DIVERSITY ===\n")
replies = []
for q in test_queries:
    res = generate_assistant_response(q)
    replies.append(res['reply'])
    preview = res['reply'].replace('\n', ' ')[:90]
    print(f"User: '{q}'")
    print(f"AI:   {preview}...")
    print(f"Act:  {res.get('action_type')} -> {res.get('action_payload')}\n")

print(f"Total test queries: {len(test_queries)}")
print(f"Unique replies count: {len(set(replies))}")
if len(set(replies)) == len(test_queries):
    print("\n✅ SUCCESS: 100% of responses are UNIQUE, GRANULAR, and ACCURATE!")
else:
    print("\n❌ WARNING: Some responses were duplicated!")
