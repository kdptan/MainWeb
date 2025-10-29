from django.urls import path
from .views import ProductListCreateAPIView

urlpatterns = [
    path('products/', ProductListCreateAPIView.as_view(), name='inventory-products'),
]
