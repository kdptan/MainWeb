from django.urls import path
from .views import (
    ProductListCreateAPIView,
    ProductRetrieveUpdateDestroyAPIView,
    RestockProductAPIView,
    AdjustStockQuantityAPIView,
    ProductHistoryAPIView,
    SupplierListCreateAPIView,
    SupplierUpdateDeleteAPIView,
    UpdatePaymentAPIView
)

urlpatterns = [
    path('products/', ProductListCreateAPIView.as_view(), name='inventory-products'),
    path('products/<int:pk>/', ProductRetrieveUpdateDestroyAPIView.as_view(), name='inventory-product-detail'),
    path('restock/', RestockProductAPIView.as_view(), name='inventory-restock'),
    path('adjust-stock/', AdjustStockQuantityAPIView.as_view(), name='inventory-adjust-stock'),
    path('history/', ProductHistoryAPIView.as_view(), name='inventory-history'),
    path('suppliers/', SupplierListCreateAPIView.as_view(), name='inventory-suppliers'),
    path('suppliers/<int:pk>/', SupplierUpdateDeleteAPIView.as_view(), name='inventory-supplier-detail'),
    path('update-payment/', UpdatePaymentAPIView.as_view(), name='inventory-update-payment'),
]
