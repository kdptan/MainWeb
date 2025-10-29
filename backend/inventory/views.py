from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import ProductSerializer
from .models import Product


class ProductListCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        qs = Product.objects.all()
        branch = request.query_params.get('branch')
        if branch:
            qs = qs.filter(branch=branch)
        qs = qs.order_by('-created_at')
        serializer = ProductSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Accept either a list of items or a single item
        data = request.data
        many = isinstance(data, list)
        serializer = ProductSerializer(data=data, many=many)
        if serializer.is_valid():
            instances = serializer.save()
            # When many=True, serializer.save() returns list
            out_ser = ProductSerializer(instances, many=many)
            return Response(out_ser.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
