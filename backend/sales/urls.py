from django.urls import path
from .views import CreateSaleView, SaleListView, SaleDetailView, SaleStatsView

urlpatterns = [
    path('', SaleListView.as_view(), name='sale-list'),
    path('create/', CreateSaleView.as_view(), name='sale-create'),
    path('<int:pk>/', SaleDetailView.as_view(), name='sale-detail'),
    path('stats/', SaleStatsView.as_view(), name='sale-stats'),
]
