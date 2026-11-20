from django.urls import path
from .views import (
    EventListView, EventDetailView, TicketHoldView,
    BookingConfirmView, BookingDetailView, MyBookingsView,
    BookingCancelView, ChatView, NewsletterView,
    FavoritesView, AdminStatsView, AuthView
)

urlpatterns = [
    path('events/', EventListView.as_view(), name='event-list'),
    path('events/<str:pk_or_slug>/', EventDetailView.as_view(), name='event-detail'),
    path('bookings/hold/', TicketHoldView.as_view(), name='booking-hold'),
    path('bookings/confirm/', BookingConfirmView.as_view(), name='booking-confirm'),
    path('bookings/my/', MyBookingsView.as_view(), name='my-bookings'),
    path('bookings/<str:reference>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<str:reference>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('chat/', ChatView.as_view(), name='chat-api'),
    path('newsletter/subscribe/', NewsletterView.as_view(), name='newsletter-subscribe'),
    path('favorites/', FavoritesView.as_view(), name='favorites'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('auth/', AuthView.as_view(), name='auth'),
]
