"""
URL configuration for chonkyweb_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # include accounts API endpoints (register, etc.)
    path('', include('accounts.urls')),
    # inventory API (products)
    path('api/inventory/', include('inventory.urls')),
    # services API
    path('api/', include('services.urls')),
    # pets API
    path('api/', include('pets.urls')),
    # orders API
    path('api/orders/', include('orders.urls')),
    # appointments API
    path('api/appointments/', include('appointments.urls')),
    # sales API
    path('api/sales/', include('sales.urls')),
    # JWT token refresh endpoint (login is now handled in accounts.urls)
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
