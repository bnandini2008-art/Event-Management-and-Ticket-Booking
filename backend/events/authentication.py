from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Custom DRF session authentication that bypasses CSRF check for single-page app API calls.
    """
    def enforce_csrf(self, request):
        return  # CSRF check bypassed for API endpoints
