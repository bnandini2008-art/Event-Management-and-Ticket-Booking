import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventix_backend.settings')
django.setup()

from django.test import Client

client = Client()

# 1. Index
r_index = client.get('/')
print('GET / status:', r_index.status_code, 'Content-Type:', r_index.get('Content-Type'))
assert r_index.status_code == 200, f'Index failed: {r_index.status_code}'

# 2. Events API
r_events = client.get('/api/events/')
print('GET /api/events/ status:', r_events.status_code, 'Count:', len(r_events.json()))
assert r_events.status_code == 200, f'Events failed: {r_events.status_code}'

# 3. Chat API
r_chat = client.post('/api/chat/', {'message': "What's the ticket price for Neon Nights Concert?"}, content_type='application/json')
print('POST /api/chat/ status:', r_chat.status_code, 'Reply:', r_chat.json().get('reply'))
assert r_chat.status_code == 200, f'Chat failed: {r_chat.status_code}'

# 4. Hold & Booking API test
event = r_events.json()[0]
cat = event['ticket_categories'][0]
r_booking = client.post('/api/bookings/confirm/', {
    'event_id': event['id'],
    'items': [{'category_id': cat['id'], 'quantity': 1}],
    'customer_name': 'Test Attendee',
    'customer_email': 'test@eventix.in',
    'customer_phone': '9876543210',
    'payment_method': 'UPI'
}, content_type='application/json')
print('POST /api/bookings/confirm/ status:', r_booking.status_code, 'Ref:', r_booking.json().get('booking_reference'))
assert r_booking.status_code == 201, f'Booking failed: {r_booking.status_code}'

# 5. Asset test
r_asset = client.get('/assets/neon_nights.jpg')
print('GET /assets/neon_nights.jpg status:', r_asset.status_code)
assert r_asset.status_code == 200, f'Asset failed: {r_asset.status_code}'

print('\nALL SERVER PIPELINE TESTS PASSED 100% SUCCESSFULLY!')
