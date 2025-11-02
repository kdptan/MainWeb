from django.urls import path
from .views import ProductListCreateAPIView, ProductRetrieveUpdateDestroyAPIView, AuditLogAPIView

urlpatterns = [
    path('products/', ProductListCreateAPIView.as_view(), name='inventory-products'),
    path('products/<int:pk>/', ProductRetrieveUpdateDestroyAPIView.as_view(), name='inventory-product-detail'),
    path('audit-logs/', AuditLogAPIView.as_view(), name='inventory-audit-logs'),
]
