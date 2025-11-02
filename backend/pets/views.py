from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import PetProfileSerializer, OwnerSerializer
from .models import PetProfile
from django.contrib.auth.models import User


class NormalUsersListAPIView(APIView):
    """Get list of normal users (non-admin) for owner dropdown"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        # Get all users who are not superusers and not staff
        normal_users = User.objects.filter(is_superuser=False, is_staff=False)
        serializer = OwnerSerializer(normal_users, many=True)
        return Response(serializer.data)


class UserPetsListAPIView(APIView):
    """Get pets for the authenticated user (customer view)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get only pets that belong to the authenticated user
        pets = PetProfile.objects.filter(owner=request.user)
        serializer = PetProfileSerializer(pets, many=True)
        return Response(serializer.data)


class PetProfileListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        pets = PetProfile.objects.all()
        serializer = PetProfileSerializer(pets, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PetProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PetProfileRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_object(self, pk):
        try:
            return PetProfile.objects.get(pk=pk)
        except PetProfile.DoesNotExist:
            return None

    def get(self, request, pk):
        pet = self.get_object(pk)
        if not pet:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = PetProfileSerializer(pet)
        return Response(serializer.data)

    def put(self, request, pk):
        pet = self.get_object(pk)
        if not pet:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = PetProfileSerializer(pet, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        pet = self.get_object(pk)
        if not pet:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        pet.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
