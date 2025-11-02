from django.urls import path
from .views import (
    NormalUsersListAPIView,
    UserPetsListAPIView,
    PetProfileListCreateAPIView,
    PetProfileRetrieveUpdateDestroyAPIView
)

urlpatterns = [
    path('users/normal/', NormalUsersListAPIView.as_view(), name='normal-users'),
    path('pets/my-pets/', UserPetsListAPIView.as_view(), name='my-pets'),
    path('pets/', PetProfileListCreateAPIView.as_view(), name='pets-list'),
    path('pets/<int:pk>/', PetProfileRetrieveUpdateDestroyAPIView.as_view(), name='pet-detail'),
]
