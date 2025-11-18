from django.urls import path
from .views import (
    CreateOrderView,
    OrderListView,
    AdminOrderListView,
    OrderDetailView,
    UpdateOrderStatusView,
    AdminUpdateOrderStatusView,
    CreateFeedbackView,
    FeedbackListView,
    CreateProductFeedbackView,
    ProductFeedbackListView,
    ProductRatingsView,
    NotificationListView,
    MarkNotificationReadView
)

urlpatterns = [
    # Order endpoints
    path('', OrderListView.as_view(), name='order-list'),
    path('admin/all/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('create/', CreateOrderView.as_view(), name='order-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/status/', UpdateOrderStatusView.as_view(), name='order-update-status'),
    path('admin/<int:pk>/status/', AdminUpdateOrderStatusView.as_view(), name='admin-order-update-status'),
    
    # Purchase Feedback endpoints (Overall order review - Admin access only)
    path('feedback/', CreateFeedbackView.as_view(), name='purchase-feedback-create'),
    path('feedback/list/', FeedbackListView.as_view(), name='purchase-feedback-list-admin'),
    
    # Product Feedback endpoints (Individual product reviews - Public display)
    path('product-feedback/', CreateProductFeedbackView.as_view(), name='product-feedback-create'),
    path('product-feedback/<int:product_id>/', ProductFeedbackListView.as_view(), name='product-feedback-list-public'),
    path('product-ratings/', ProductRatingsView.as_view(), name='product-ratings-public'),
    
    # Notification endpoints
    path('notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/<int:notification_id>/read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
]
