from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Event, TicketCategory, TicketHold,
    Booking, BookingItem, ChatMessage, NewsletterSubscriber, Favorite
)

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'avatar_url']


class TicketCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCategory
        fields = ['id', 'name', 'price', 'total_quota', 'available_quota', 'description', 'perks']


class EventSerializer(serializers.ModelSerializer):
    ticket_categories = TicketCategorySerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'category', 'badge', 'banner_image',
            'description', 'venue', 'city', 'start_date', 'end_date',
            'starting_price', 'is_published', 'trailer_url', 'ticket_categories',
            'is_favorited', 'created_at', 'updated_at'
        ]

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, event=obj).exists()
        return False


class BookingItemSerializer(serializers.ModelSerializer):
    ticket_category_name = serializers.CharField(source='ticket_category.name', read_only=True)

    class Meta:
        model = BookingItem
        fields = ['id', 'ticket_category', 'ticket_category_name', 'quantity', 'unit_price', 'subtotal']


class BookingSerializer(serializers.ModelSerializer):
    items = BookingItemSerializer(many=True, read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_venue = serializers.CharField(source='event.venue', read_only=True)
    event_start_date = serializers.DateTimeField(source='event.start_date', read_only=True)
    event_banner_image = serializers.CharField(source='event.banner_image', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_reference', 'user', 'customer_name', 'customer_email',
            'customer_phone', 'event', 'event_title', 'event_venue', 'event_start_date',
            'event_banner_image', 'status', 'total_amount', 'payment_method',
            'payment_id', 'qr_code_data', 'cancellation_reason', 'refund_amount',
            'items', 'created_at', 'updated_at'
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'session_id', 'sender', 'message', 'action_type', 'action_payload', 'created_at']


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ['id', 'email', 'created_at']
