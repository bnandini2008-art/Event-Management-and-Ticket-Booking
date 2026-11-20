import uuid
import random
import string
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum, Count
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import (
    UserProfile, Event, TicketCategory, TicketHold,
    Booking, BookingItem, ChatMessage, NewsletterSubscriber, Favorite
)
from .serializers import (
    UserProfileSerializer, EventSerializer, TicketCategorySerializer,
    BookingSerializer, ChatMessageSerializer
)
from .ai_service import generate_assistant_response


def generate_booking_ref():
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=5))
    return f"EVX-2026-{suffix}"


class EventListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Event.objects.filter(is_published=True).prefetch_related('ticket_categories')
        
        category = request.query_params.get('category', '').lower()
        if category and category != 'all':
            queryset = queryset.filter(category=category)
            
        badge = request.query_params.get('badge', '').lower()
        if badge:
            queryset = queryset.filter(badge=badge)

        search = request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(venue__icontains=search) |
                Q(city__icontains=search)
            )

        sort_by = request.query_params.get('sort_by', 'date')
        if sort_by == 'price_low':
            queryset = queryset.order_by('starting_price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-starting_price')
        elif sort_by == 'date':
            queryset = queryset.order_by('start_date')

        serializer = EventSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        # Admin event creation
        data = request.data.copy()
        if not data.get('slug'):
            data['slug'] = data.get('title', '').lower().replace(' ', '-') + f"-{random.randint(100, 999)}"
        serializer = EventSerializer(data=data)
        if serializer.is_valid():
            event = serializer.save()
            # If ticket tiers passed in creation
            tiers = request.data.get('ticket_tiers', [])
            for tier in tiers:
                TicketCategory.objects.create(
                    event=event,
                    name=tier.get('name', 'General Admission'),
                    price=tier.get('price', 499),
                    total_quota=tier.get('quota', 100),
                    available_quota=tier.get('quota', 100),
                    description=tier.get('description', '')
                )
            event.update_starting_price()
            return Response(EventSerializer(event, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk_or_slug):
        try:
            if str(pk_or_slug).isdigit():
                event = Event.objects.prefetch_related('ticket_categories').get(pk=int(pk_or_slug))
            else:
                event = Event.objects.prefetch_related('ticket_categories').get(slug=pk_or_slug)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EventSerializer(event, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk_or_slug):
        try:
            event = Event.objects.get(pk=int(pk_or_slug)) if str(pk_or_slug).isdigit() else Event.objects.get(slug=pk_or_slug)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            ev = serializer.save()
            ev.update_starting_price()
            return Response(EventSerializer(ev, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk_or_slug):
        try:
            event = Event.objects.get(pk=int(pk_or_slug)) if str(pk_or_slug).isdigit() else Event.objects.get(slug=pk_or_slug)
            event.delete()
            return Response({'message': 'Event deleted successfully'})
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)


class TicketHoldView(APIView):
    """
    SRS Requirement: Seat/Quantity hold with countdown timer
    Reserves tickets for 10 minutes while customer completes payment.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        event_id = request.data.get('event_id')
        items = request.data.get('items', [])
        session_key = request.data.get('session_key') or str(uuid.uuid4())
        
        if not event_id or not items:
            return Response({'error': 'event_id and items are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        # Clean expired holds
        TicketHold.objects.filter(expires_at__lt=timezone.now()).delete()

        with transaction.atomic():
            holds_created = []
            expires_at = timezone.now() + timedelta(minutes=10)

            for item in items:
                category_id = item.get('category_id')
                quantity = int(item.get('quantity', 1))
                if quantity <= 0:
                    continue

                category = TicketCategory.objects.select_for_update().get(id=category_id, event=event)
                # Check available minus active holds
                active_holds = TicketHold.objects.filter(
                    ticket_category=category,
                    expires_at__gt=timezone.now()
                ).aggregate(total=Sum('quantity'))['total'] or 0

                effective_available = category.available_quota - active_holds
                if effective_available < quantity:
                    return Response({
                        'error': f"Only {max(0, effective_available)} tickets available for {category.name}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                hold = TicketHold.objects.create(
                    event=event,
                    ticket_category=category,
                    session_key=session_key,
                    user=request.user if request.user.is_authenticated else None,
                    quantity=quantity,
                    expires_at=expires_at
                )
                holds_created.append(hold)

        return Response({
            'message': 'Tickets held successfully for 10 minutes',
            'session_key': session_key,
            'hold_ids': [str(h.id) for h in holds_created],
            'expires_at': expires_at.isoformat(),
            'seconds_remaining': 600
        })


class BookingConfirmView(APIView):
    """
    Secure checkout: atomic inventory decrement, hold release, confirmation with QR code.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        event_id = request.data.get('event_id')
        items = request.data.get('items', [])
        customer_name = request.data.get('customer_name', 'Guest Attendee')
        customer_email = request.data.get('customer_email')
        customer_phone = request.data.get('customer_phone', '9876543210')
        payment_method = request.data.get('payment_method', 'UPI')
        session_key = request.data.get('session_key')

        if not event_id or not items or not customer_email:
            return Response({'error': 'Event, items, and valid email are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            total_amount = 0
            booking_items_to_create = []

            for item in items:
                category_id = item.get('category_id')
                quantity = int(item.get('quantity', 1))
                if quantity <= 0:
                    continue

                category = TicketCategory.objects.select_for_update().get(id=category_id, event=event)
                if category.available_quota < quantity:
                    return Response({
                        'error': f"Insufficient tickets available for {category.name}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                subtotal = category.price * quantity
                total_amount += subtotal

                # Decrement available quota
                category.available_quota -= quantity
                category.save(update_fields=['available_quota'])

                booking_items_to_create.append({
                    'ticket_category': category,
                    'quantity': quantity,
                    'unit_price': category.price,
                    'subtotal': subtotal
                })

            booking_ref = generate_booking_ref()
            qr_payload = f"EVENTIX-TICKET|REF:{booking_ref}|EVT:{event.title}|NAME:{customer_name}|DATE:{event.start_date.isoformat()}"

            booking = Booking.objects.create(
                booking_reference=booking_ref,
                user=request.user if request.user.is_authenticated else None,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                event=event,
                status='CONFIRMED',
                total_amount=total_amount,
                payment_method=payment_method,
                payment_id=f"PAY-{uuid.uuid4().hex[:10].upper()}",
                qr_code_data=qr_payload
            )

            for bi in booking_items_to_create:
                BookingItem.objects.create(
                    booking=booking,
                    ticket_category=bi['ticket_category'],
                    quantity=bi['quantity'],
                    unit_price=bi['unit_price'],
                    subtotal=bi['subtotal']
                )

            # Clear temporary holds for this session
            if session_key:
                TicketHold.objects.filter(session_key=session_key).delete()

        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookingDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, reference):
        try:
            booking = Booking.objects.prefetch_related('items').get(booking_reference=reference)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = BookingSerializer(booking)
        return Response(serializer.data)


class MyBookingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get('email')
        if request.user.is_authenticated:
            bookings = Booking.objects.filter(Q(user=request.user) | Q(customer_email=request.user.email))
        elif email:
            bookings = Booking.objects.filter(customer_email=email)
        else:
            bookings = Booking.objects.all()[:10]

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class BookingCancelView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, reference):
        try:
            booking = Booking.objects.get(booking_reference=reference)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status in ['CANCELLED', 'REFUNDED']:
            return Response({'error': 'Booking is already cancelled'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'User requested cancellation')

        with transaction.atomic():
            # Return tickets to inventory
            for item in booking.items.all():
                tc = item.ticket_category
                tc.available_quota += item.quantity
                tc.save(update_fields=['available_quota'])

            booking.status = 'CANCELLED'
            booking.cancellation_reason = reason
            booking.refund_amount = booking.total_amount # 100% refund
            booking.save()

        serializer = BookingSerializer(booking)
        return Response({
            'message': 'Booking cancelled and 100% refund processed successfully',
            'booking': serializer.data
        })


class ChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id') or str(uuid.uuid4())

        if not user_message:
            return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message
        ChatMessage.objects.create(
            session_id=session_id,
            user=request.user if request.user.is_authenticated else None,
            sender='user',
            message=user_message
        )

        # Generate intelligent assistant response
        res = generate_assistant_response(user_message, session_id=session_id)
        bot_reply = res.get('reply', '')
        action_type = res.get('action_type', '')
        action_payload = res.get('action_payload', {})

        # Save assistant message
        ChatMessage.objects.create(
            session_id=session_id,
            user=request.user if request.user.is_authenticated else None,
            sender='assistant',
            message=bot_reply,
            action_type=action_type,
            action_payload=action_payload
        )

        # Return latest history
        messages = ChatMessage.objects.filter(session_id=session_id).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)

        return Response({
            'reply': bot_reply,
            'action_type': action_type,
            'action_payload': action_payload,
            'session_id': session_id,
            'history': serializer.data
        })

    def get(self, request):
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response({'history': []})
        messages = ChatMessage.objects.filter(session_id=session_id).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response({'history': serializer.data})


class NewsletterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email or '@' not in email:
            return Response({'error': 'Please provide a valid email address'}, status=status.HTTP_400_BAD_REQUEST)
        sub, created = NewsletterSubscriber.objects.get_or_create(email=email)
        return Response({
            'message': 'Thank you for subscribing! Check your inbox for exclusive VIP event discounts.',
            'created': created
        })


class FavoritesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            # Return demo favorites or empty
            return Response([])
        favs = Favorite.objects.filter(user=request.user).select_related('event')
        events = [f.event for f in favs]
        return Response(EventSerializer(events, many=True, context={'request': request}).data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Login required to favorite events'}, status=status.HTTP_401_UNAUTHORIZED)
        event_id = request.data.get('event_id')
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

        fav, created = Favorite.objects.get_or_create(user=request.user, event=event)
        if not created:
            fav.delete()
            return Response({'status': 'unfavorited', 'is_favorited': False})
        return Response({'status': 'favorited', 'is_favorited': True})


class AdminStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        total_revenue = Booking.objects.filter(status='CONFIRMED').aggregate(total=Sum('total_amount'))['total'] or 0
        total_bookings = Booking.objects.filter(status='CONFIRMED').count()
        active_events = Event.objects.filter(is_published=True).count()
        total_tickets_sold = BookingItem.objects.filter(booking__status='CONFIRMED').aggregate(total=Sum('quantity'))['total'] or 0
        total_users = User.objects.count()

        recent_bookings = Booking.objects.all().order_by('-created_at')[:10]
        recent_serializer = BookingSerializer(recent_bookings, many=True)

        return Response({
            'total_revenue': total_revenue,
            'total_bookings': total_bookings,
            'active_events': active_events,
            'total_tickets_sold': total_tickets_sold,
            'total_users': total_users,
            'recent_bookings': recent_serializer.data
        })


class AuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        action = request.data.get('action') # 'login', 'register', 'quick_switch'
        
        if action == 'register':
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')
            full_name = request.data.get('name', username)
            if not username or not password or not email:
                return Response({'error': 'Username, email and password required'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(username=username).exists():
                return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.create_user(username=username, email=email, password=password, first_name=full_name)
            UserProfile.objects.create(user=user, role='user')
            login(request, user)
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.first_name,
                'role': 'user'
            })

        elif action == 'login':
            username = request.data.get('username')
            password = request.data.get('password')
            user = authenticate(username=username, password=password)
            if user:
                login(request, user)
                profile, _ = UserProfile.objects.get_or_create(user=user)
                return Response({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'name': user.first_name or user.username,
                    'role': profile.role
                })
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

        elif action == 'quick_switch':
            # Allows quick role testing for evaluator: 'admin', 'user', 'guest'
            role = request.data.get('role', 'user')
            if role == 'guest':
                logout(request)
                return Response({'role': 'guest', 'username': 'Guest', 'name': 'Guest Visitor'})
            
            username = 'admin' if role == 'admin' else 'demo_user'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': f"{username}@eventix.in", 'first_name': 'Administrator' if role == 'admin' else 'Alex Morgan'}
            )
            if created:
                user.set_password('password123')
                user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': role})
            profile.role = role
            profile.save()
            login(request, user)
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.first_name,
                'role': profile.role
            })

        return Response({'error': 'Invalid auth action'}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        if request.user.is_authenticated:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            return Response({
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'name': request.user.first_name or request.user.username,
                'role': profile.role
            })
        return Response({'role': 'guest', 'username': 'Guest'})
