from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import ProductSerializer
from .models import Product
from datetime import datetime


class ProductListCreateAPIView(APIView):
    def get_permissions(self):
        # Allow anyone to view products (GET), but only admins can create (POST)
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), permissions.IsAdminUser()]

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


class ProductRetrieveUpdateDestroyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None

    def put(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # Log the incoming data for debugging
        print(f"Incoming PUT data: {request.data}")
        
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        # Log validation errors for debugging
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        product = self.get_object(pk)
        if not product:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AuditLogAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        # Return audit logs from database or file storage
        # For now, return stored logs in memory (you should use a database model for production)
        audit_logs = getattr(self.__class__, '_audit_logs', [])
        return Response(audit_logs, status=status.HTTP_200_OK)
    
    def post(self, request):
        # Save audit log entry
        audit_entry = {
            'timestamp': datetime.now().isoformat(),
            'username': request.user.username,
            'item_id': request.data.get('item_id'),
            'field_changed': request.data.get('field_changed'),
            'old_value': request.data.get('old_value'),
            'new_value': request.data.get('new_value'),
            'remarks': request.data.get('remarks', '')
        }
        
        # Store in class variable (in production, use a database model)
        if not hasattr(self.__class__, '_audit_logs'):
            self.__class__._audit_logs = []
        self.__class__._audit_logs.insert(0, audit_entry)
        
        return Response(audit_entry, status=status.HTTP_201_CREATED)
