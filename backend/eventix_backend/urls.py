import os
from pathlib import Path
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.http import HttpResponse, Http404

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR.parent / 'frontend' / 'dist'
FRONTEND_PUBLIC = BASE_DIR.parent / 'frontend' / 'public'

def combined_assets_serve(request, path):
    # Check in frontend/dist/assets first
    dist_asset = FRONTEND_DIST / 'assets' / path
    if dist_asset.exists():
        return serve(request, path, document_root=FRONTEND_DIST / 'assets')
    
    # Check in frontend/public/assets
    public_asset = FRONTEND_PUBLIC / 'assets' / path
    if public_asset.exists():
        return serve(request, path, document_root=FRONTEND_PUBLIC / 'assets')
        
    raise Http404(f"Asset {path} not found")

def index_view(request):
    index_file = FRONTEND_DIST / 'index.html'
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())
    return HttpResponse("Frontend dist not found. Please run 'npm run build' inside frontend/ directory.", status=404)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('events.urls')),
    
    # Combined assets server
    re_path(r'^assets/(?P<path>.*)$', combined_assets_serve),

    # Catch-all frontend
    re_path(r'^(?!api|admin).*$', index_view),
]
