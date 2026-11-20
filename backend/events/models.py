import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
        ('guest', 'Guest'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=20, blank=True)
    avatar_url = models.CharField(max_length=500, blank=True, default='/assets/user_avatar.jpg')

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Event(models.Model):
    CATEGORY_CHOICES = (
        ('all', 'All Events'),
        ('concerts', 'Concerts'),
        ('conferences', 'Conferences'),
        ('festivals', 'Festivals'),
        ('exhibitions', 'Exhibitions'),
        ('sports', 'Sports'),
        ('workshops', 'Workshops'),
        ('more', 'More'),
    )
    BADGE_CHOICES = (
        ('none', 'None'),
        ('hot', 'Hot'),
        ('trending', 'Trending'),
        ('limited', 'Limited Seats'),
        ('new', 'New'),
    )

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='concerts')
    badge = models.CharField(max_length=20, choices=BADGE_CHOICES, default='none')
    banner_image = models.TextField(help_text="URL or path to event banner image")
    description = models.TextField()
    venue = models.CharField(max_length=255)
    city = models.CharField(max_length=100, default='Chennai')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    starting_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_published = models.BooleanField(default=True)
    trailer_url = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return self.title

    def update_starting_price(self):
        cheapest = self.ticket_categories.filter(available_quota__gt=0).order_by('price').first()
        if cheapest:
            self.starting_price = cheapest.price
            self.save(update_fields=['starting_price'])


class TicketCategory(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='ticket_categories')
    name = models.CharField(max_length=100) # e.g. General, VIP, Early Bird
    price = models.DecimalField(max_digits=10, decimal_places=2)
    total_quota = models.PositiveIntegerField(default=100)
    available_quota = models.PositiveIntegerField(default=100)
    description = models.CharField(max_length=255, blank=True)
    perks = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.event.title} - {self.name} (₹{self.price})"


class TicketHold(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    ticket_category = models.ForeignKey(TicketCategory, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.expires_at


class Booking(models.Model):
    STATUS_CHOICES = (
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('PENDING_PAYMENT', 'Pending Payment'),
        ('REFUNDED', 'Refunded'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('CARD', 'Credit/Debit Card'),
        ('UPI', 'UPI / QR Code'),
        ('NETBANKING', 'Net Banking'),
    )

    booking_reference = models.CharField(max_length=32, unique=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    customer_name = models.CharField(max_length=150)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=25)
    event = models.ForeignKey(Event, on_delete=models.PROTECT, related_name='bookings')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CONFIRMED')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='UPI')
    payment_id = models.CharField(max_length=100, blank=True)
    qr_code_data = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking_reference} - {self.customer_name}"


class BookingItem(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='items')
    ticket_category = models.ForeignKey(TicketCategory, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.booking.booking_reference} - {self.ticket_category.name} x {self.quantity}"


class ChatMessage(models.Model):
    session_id = models.CharField(max_length=100, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    sender = models.CharField(max_length=20, choices=(('user', 'User'), ('assistant', 'Assistant')))
    message = models.TextField()
    action_type = models.CharField(max_length=50, blank=True) # e.g. 'book_event', 'view_event', 'faq_links'
    action_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.session_id}] {self.sender}: {self.message[:30]}"


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event')

    def __str__(self):
        return f"{self.user.username} favorited {self.event.title}"
