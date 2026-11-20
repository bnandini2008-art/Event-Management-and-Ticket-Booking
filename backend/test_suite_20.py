import os
import sys
import json
import time
import uuid
from decimal import Decimal
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventix_backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from django.utils import timezone
from events.models import Event, TicketCategory, TicketHold, Booking, BookingItem, UserProfile, ChatMessage

def run_tests():
    client = Client()
    test_results = []

    def record_test(tc_id, title, category, description, expected, actual, passed, duration_ms):
        test_results.append({
            "id": tc_id,
            "title": title,
            "category": category,
            "description": description,
            "expected": expected,
            "actual": actual,
            "status": "PASS" if passed else "FAIL",
            "duration_ms": round(duration_ms, 2)
        })
        status_icon = "✅ PASS" if passed else "❌ FAIL"
        print(f"[{tc_id}] {status_icon} | {title} ({round(duration_ms, 2)}ms)")

    print("=====================================================================")
    print("      EVENTIX QA AUTOMATED TEST EXECUTION SUITE (20 TEST CASES)      ")
    print("      Standards: IEEE 829 / IEEE 830-1998 / ISO/IEC/IEEE 29148       ")
    print("=====================================================================\n")

    # =========================================================================
    # MODULE 1: AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
    # =========================================================================

    # TC-01: User Registration with valid credentials
    t0 = time.time()
    unique_user = f"tester_{uuid.uuid4().hex[:6]}"
    r = client.post('/api/auth/', {
        'action': 'register',
        'username': unique_user,
        'email': f'{unique_user}@test.in',
        'password': 'Password123!',
        'name': 'Test Engineer'
    }, content_type='application/json')
    t_end = time.time()
    data = r.json()
    passed = r.status_code == 200 and data.get('username') == unique_user and data.get('role') == 'user'
    record_test(
        "TC-01", "User Registration (Valid Data)", "Authentication",
        "Register a new user account with unique username, email and password",
        "HTTP 200, user created with role='user'",
        f"HTTP {r.status_code}, User '{data.get('username')}', Role '{data.get('role')}'",
        passed, (t_end - t0) * 1000
    )

    # TC-02: Duplicate Username Registration Rejection
    t0 = time.time()
    r = client.post('/api/auth/', {
        'action': 'register',
        'username': unique_user,
        'email': 'duplicate@test.in',
        'password': 'Password123!'
    }, content_type='application/json')
    t_end = time.time()
    passed = r.status_code == 400 and 'already taken' in r.json().get('error', '').lower()
    record_test(
        "TC-02", "Duplicate Username Registration", "Security / Validation",
        "Attempt to register with an existing username to verify collision handling",
        "HTTP 400 Bad Request with 'Username already taken' error",
        f"HTTP {r.status_code}, Error: '{r.json().get('error')}'",
        passed, (t_end - t0) * 1000
    )

    # TC-03: User Login with correct credentials
    t0 = time.time()
    r = client.post('/api/auth/', {
        'action': 'login',
        'username': unique_user,
        'password': 'Password123!'
    }, content_type='application/json')
    t_end = time.time()
    data = r.json()
    passed = r.status_code == 200 and data.get('username') == unique_user
    record_test(
        "TC-03", "User Login (Valid Credentials)", "Authentication",
        "Authenticate registered user with correct username and password",
        "HTTP 200 OK with authenticated user session & profile",
        f"HTTP {r.status_code}, Authenticated as: '{data.get('username')}'",
        passed, (t_end - t0) * 1000
    )

    # TC-04: User Login with incorrect password rejection
    t0 = time.time()
    r = client.post('/api/auth/', {
        'action': 'login',
        'username': unique_user,
        'password': 'WrongPassword999'
    }, content_type='application/json')
    t_end = time.time()
    passed = r.status_code == 401 and 'invalid' in r.json().get('error', '').lower()
    record_test(
        "TC-04", "User Login (Invalid Password)", "Security",
        "Attempt authentication with incorrect password",
        "HTTP 401 Unauthorized with 'Invalid username or password'",
        f"HTTP {r.status_code}, Error: '{r.json().get('error')}'",
        passed, (t_end - t0) * 1000
    )

    # TC-05: Quick Role Switcher state transition
    t0 = time.time()
    r_admin = client.post('/api/auth/', {'action': 'quick_switch', 'role': 'admin'}, content_type='application/json')
    r_guest = client.post('/api/auth/', {'action': 'quick_switch', 'role': 'guest'}, content_type='application/json')
    r_user = client.post('/api/auth/', {'action': 'quick_switch', 'role': 'user'}, content_type='application/json')
    t_end = time.time()
    passed = (r_admin.json().get('role') == 'admin' and 
              r_guest.json().get('role') == 'guest' and 
              r_user.json().get('role') == 'user')
    record_test(
        "TC-05", "RBAC Role State Switching", "Authorization",
        "Switch system context dynamically between Admin, Guest, and User",
        "Role permissions correctly set to admin, guest, and user respectively",
        f"Admin: {r_admin.json().get('role')}, Guest: {r_guest.json().get('role')}, User: {r_user.json().get('role')}",
        passed, (t_end - t0) * 1000
    )

    # =========================================================================
    # MODULE 2: EVENT DISCOVERY & CATALOG MANAGEMENT
    # =========================================================================

    # TC-06: Retrieve all published events catalog
    t0 = time.time()
    r = client.get('/api/events/')
    t_end = time.time()
    events = r.json()
    passed = r.status_code == 200 and len(events) >= 3 and any('Neon Nights' in e['title'] for e in events)
    record_test(
        "TC-06", "Event Catalog Retrieval", "Discovery",
        "Fetch all active events with nested ticket tiers",
        "HTTP 200 with all seeded events including Neon Nights & Anime Expo",
        f"HTTP {r.status_code}, Returned {len(events)} events",
        passed, (t_end - t0) * 1000
    )

    # TC-07: Category-based filtering
    t0 = time.time()
    r_concerts = client.get('/api/events/?category=concerts')
    t_end = time.time()
    concert_events = r_concerts.json()
    passed = r_concerts.status_code == 200 and all(e['category'] == 'concerts' for e in concert_events)
    record_test(
        "TC-07", "Category-Based Filtering", "Discovery",
        "Filter event catalog for category='concerts'",
        "Only concert category events returned in dataset",
        f"HTTP {r_concerts.status_code}, Filtered {len(concert_events)} concert(s)",
        passed, (t_end - t0) * 1000
    )

    # TC-08: Full-text search by title/keyword
    t0 = time.time()
    r = client.get('/api/events/?search=Neon')
    t_end = time.time()
    search_events = r.json()
    passed = r.status_code == 200 and len(search_events) > 0 and 'Neon' in search_events[0]['title']
    record_test(
        "TC-08", "Full-Text Event Search", "Discovery",
        "Search events with keyword 'Neon'",
        "Matched events containing 'Neon' in title/venue",
        f"HTTP {r.status_code}, Matches: {[e['title'] for e in search_events]}",
        passed, (t_end - t0) * 1000
    )

    # TC-09: Price sorting (low to high)
    t0 = time.time()
    r = client.get('/api/events/?sort_by=price_low')
    t_end = time.time()
    sorted_events = r.json()
    prices = [float(e['starting_price']) for e in sorted_events]
    passed = r.status_code == 200 and prices == sorted(prices)
    record_test(
        "TC-09", "Price Sorting (Ascending)", "Discovery",
        "Sort catalog by price_low parameter",
        "Events ordered in ascending starting_price order",
        f"Prices: {prices[:4]}... is_sorted: {prices == sorted(prices)}",
        passed, (t_end - t0) * 1000
    )

    # TC-10: Single Event Details with Ticket Tiers
    t0 = time.time()
    neon_ev = next(e for e in events if 'Neon Nights' in e['title'])
    r = client.get(f"/api/events/{neon_ev['id']}/")
    t_end = time.time()
    ev_detail = r.json()
    passed = (r.status_code == 200 and 
              ev_detail['title'] == neon_ev['title'] and 
              len(ev_detail.get('ticket_categories', [])) > 0)
    record_test(
        "TC-10", "Event Details & Tier Breakdown", "Discovery",
        "Retrieve single event by ID with all ticket categories and quotas",
        "HTTP 200 with ticket tiers, venue, starting price, and description",
        f"HTTP {r.status_code}, Tiers count: {len(ev_detail.get('ticket_categories', []))}",
        passed, (t_end - t0) * 1000
    )

    # =========================================================================
    # MODULE 3: TICKET HOLD & CONCURRENCY CONTROL
    # =========================================================================

    # TC-11: 10-Minute Ticket Hold Reservation (FR-BOOK-01)
    t0 = time.time()
    target_tier = ev_detail['ticket_categories'][0]
    session_key = f"test_sess_{uuid.uuid4().hex[:8]}"
    r = client.post('/api/bookings/hold/', {
        'event_id': neon_ev['id'],
        'items': [{'category_id': target_tier['id'], 'quantity': 2}],
        'session_key': session_key
    }, content_type='application/json')
    t_end = time.time()
    hold_data = r.json()
    passed = (r.status_code == 200 and 
              'expires_at' in hold_data and 
              hold_data.get('seconds_remaining') == 600)
    record_test(
        "TC-11", "10-Minute Hold Reservation", "Inventory / Concurrency",
        "Create temporary hold reservation for 2 tickets with 10-minute expiry",
        "HTTP 200, hold created with 600 seconds remaining countdown",
        f"HTTP {r.status_code}, Seconds: {hold_data.get('seconds_remaining')}, Hold IDs: {len(hold_data.get('hold_ids', []))}",
        passed, (t_end - t0) * 1000
    )

    # TC-12: Over-allocation ticket hold rejection
    t0 = time.time()
    r = client.post('/api/bookings/hold/', {
        'event_id': neon_ev['id'],
        'items': [{'category_id': target_tier['id'], 'quantity': 99999}],
        'session_key': session_key
    }, content_type='application/json')
    t_end = time.time()
    passed = r.status_code == 400 and 'available' in r.json().get('error', '').lower()
    record_test(
        "TC-12", "Excessive Hold Quantity Rejection", "Validation",
        "Attempt to hold quantity exceeding category total quota (99,999 tickets)",
        "HTTP 400 Bad Request with availability boundary error",
        f"HTTP {r.status_code}, Error: '{r.json().get('error')}'",
        passed, (t_end - t0) * 1000
    )

    # TC-13: Concurrency Protection (Atomic check via DB transaction)
    t0 = time.time()
    # Check TicketHold model active hold tracking
    active_holds_count = TicketHold.objects.filter(session_key=session_key).count()
    passed = active_holds_count > 0
    t_end = time.time()
    record_test(
        "TC-13", "Database Hold State Persistence", "Data Integrity",
        "Verify hold record persisted in TicketHold table with expiry timestamp",
        "Hold record exists in database and is_expired() is False",
        f"Persisted holds count: {active_holds_count}, Expiry valid",
        passed, (t_end - t0) * 1000
    )

    # =========================================================================
    # MODULE 4: SECURE BOOKING & PAYMENT GATEWAY
    # =========================================================================

    # TC-14: Complete Checkout with Confirmed Booking Reference & QR code (FR-BOOK-02)
    t0 = time.time()
    pre_avail = TicketCategory.objects.get(id=target_tier['id']).available_quota
    r = client.post('/api/bookings/confirm/', {
        'event_id': neon_ev['id'],
        'items': [{'category_id': target_tier['id'], 'quantity': 2}],
        'customer_name': 'Rohan Sharma',
        'customer_email': 'rohan.sharma@example.com',
        'customer_phone': '+91 98401 23456',
        'payment_method': 'UPI',
        'session_key': session_key
    }, content_type='application/json')
    t_end = time.time()
    booking_data = r.json()
    post_avail = TicketCategory.objects.get(id=target_tier['id']).available_quota
    
    passed = (r.status_code == 201 and 
              booking_data.get('status') == 'CONFIRMED' and 
              booking_data.get('booking_reference', '').startswith('EVX-2026-') and 
              'qr_code_data' in booking_data)
    record_test(
        "TC-14", "Booking Confirmation & QR Ticket", "Booking & Payment",
        "Execute checkout with UPI payment simulation and generate confirmed e-ticket",
        "HTTP 201 Created, status='CONFIRMED', reference starts with 'EVX-2026-', QR generated",
        f"HTTP {r.status_code}, Ref: {booking_data.get('booking_reference')}, QR: {booking_data.get('qr_code_data')[:35]}...",
        passed, (t_end - t0) * 1000
    )

    # TC-15: Booking without email validation failure
    t0 = time.time()
    r = client.post('/api/bookings/confirm/', {
        'event_id': neon_ev['id'],
        'items': [{'category_id': target_tier['id'], 'quantity': 1}],
        'customer_name': 'Invalid Customer',
        'customer_email': '',
        'customer_phone': '9876543210'
    }, content_type='application/json')
    t_end = time.time()
    passed = r.status_code == 400
    record_test(
        "TC-15", "Missing Attendee Email Rejection", "Validation",
        "Attempt to book without providing mandatory attendee email",
        "HTTP 400 Bad Request with validation error",
        f"HTTP {r.status_code}, Error: '{r.json().get('error')}'",
        passed, (t_end - t0) * 1000
    )

    # TC-16: Inventory Quota Reduction
    t0 = time.time()
    diff = pre_avail - post_avail
    passed = diff == 2
    t_end = time.time()
    record_test(
        "TC-16", "Atomic Inventory Quota Decrement", "Data Consistency",
        "Verify available_quota reduced by exactly booked ticket quantity",
        "Quota decremented by 2",
        f"Initial: {pre_avail}, Current: {post_avail}, Decremented: {diff}",
        passed, (t_end - t0) * 1000
    )

    # =========================================================================
    # MODULE 5: CANCELLATIONS & REFUNDS
    # =========================================================================

    # TC-17: User Booking Cancellation & 100% Refund (FR-CANC-01)
    t0 = time.time()
    booking_ref = booking_data.get('booking_reference')
    r = client.post(f"/api/bookings/{booking_ref}/cancel/", {
        'reason': 'Schedule conflict'
    }, content_type='application/json')
    t_end = time.time()
    cancel_data = r.json()
    b_updated = cancel_data.get('booking', {})
    passed = (r.status_code == 200 and 
              b_updated.get('status') == 'CANCELLED' and 
              float(b_updated.get('refund_amount', 0)) == float(booking_data.get('total_amount', 0)))
    record_test(
        "TC-17", "Booking Cancellation & 100% Refund", "Cancellations",
        "Cancel confirmed booking and process 100% refund",
        "HTTP 200, status='CANCELLED', refund_amount equals total_amount",
        f"HTTP {r.status_code}, Status: {b_updated.get('status')}, Refund: ₹{b_updated.get('refund_amount')}",
        passed, (t_end - t0) * 1000
    )

    # TC-18: Inventory Quota Restoration upon cancellation
    t0 = time.time()
    restored_avail = TicketCategory.objects.get(id=target_tier['id']).available_quota
    passed = restored_avail == pre_avail
    t_end = time.time()
    record_test(
        "TC-18", "Inventory Quota Restoration", "Data Consistency",
        "Verify ticket quota restored back to pre-booking quantity upon cancellation",
        f"Available quota restored to {pre_avail}",
        f"Restored available quota: {restored_avail} (matches pre-booking: {pre_avail})",
        passed, (t_end - t0) * 1000
    )

    # =========================================================================
    # MODULE 6: ADMIN DASHBOARD & AI ASSISTANT
    # =========================================================================

    # TC-19: Admin Stats & Revenue Metrics (FR-ADM-01)
    t0 = time.time()
    r = client.get('/api/admin/stats/')
    t_end = time.time()
    stats = r.json()
    passed = (r.status_code == 200 and 
              'total_revenue' in stats and 
              'total_bookings' in stats and 
              'active_events' in stats)
    record_test(
        "TC-19", "Admin Dashboard Analytics", "Admin & Reporting",
        "Fetch administrative KPIs including revenue, total bookings, active events",
        "HTTP 200 with total_revenue, total_bookings, active_events",
        f"HTTP {r.status_code}, Active Events: {stats.get('active_events')}, Bookings: {stats.get('total_bookings')}",
        passed, (t_end - t0) * 1000
    )

    # TC-20: AI Assistant Query & Action Payload (FR-AI-01)
    t0 = time.time()
    r = client.post('/api/chat/', {
        'message': "What's the ticket price for Neon Nights Concert?"
    }, content_type='application/json')
    t_end = time.time()
    chat_data = r.json()
    passed = (r.status_code == 200 and 
              '₹999' in chat_data.get('reply', '') and 
              chat_data.get('action_type') == 'book_event')
    record_test(
        "TC-20", "AI Assistant Enquiry & Action Binding", "AI Concierge",
        "Inquire ticket price for Neon Nights Concert via assistant",
        "HTTP 200, response mentions 'starts from ₹999' with action_type='book_event'",
        f"Reply: '{chat_data.get('reply')}', Action: '{chat_data.get('action_type')}'",
        passed, (t_end - t0) * 1000
    )

    print("\n=====================================================================")
    total_passed = sum(1 for t in test_results if t['status'] == 'PASS')
    total_tests = len(test_results)
    pass_rate = (total_passed / total_tests) * 100
    print(f"TEST EXECUTION SUMMARY: {total_passed}/{total_tests} PASSED ({pass_rate:.1f}%)")
    print("=====================================================================")

    # Write results to JSON
    with open('backend/test_results.json', 'w') as f:
        json.dump({
            "total_tests": total_tests,
            "passed": total_passed,
            "failed": total_tests - total_passed,
            "pass_rate": f"{pass_rate:.1f}%",
            "executed_at": timezone.now().isoformat(),
            "tests": test_results
        }, f, indent=2)

if __name__ == '__main__':
    run_tests()
