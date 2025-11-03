from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django.db.models import Avg, Count
from .models import Order, OrderItem, PurchaseFeedback, ProductFeedback
from inventory.models import Product
from services.models import Service
from .serializers import (
    OrderSerializer, 
    CreateOrderSerializer, 
    PurchaseFeedbackSerializer,
    OrderItemSerializer,
    ProductFeedbackSerializer
)

# Keep backward compatibility
FeedbackSerializer = PurchaseFeedbackSerializer


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        items_data = validated_data['items']
        
        # Calculate total price
        total_price = 0
        order_items = []
        
        for item_data in items_data:
            item_type = item_data['item_type']
            item_id = item_data['id']
            quantity = item_data['quantity']
            
            if item_type == 'product':
                try:
                    product = Product.objects.get(id=item_id)
                    
                    # Check if enough stock is available
                    if product.quantity < quantity:
                        return Response(
                            {'error': f'Insufficient stock for {product.name}. Available: {product.quantity}, Requested: {quantity}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    price = float(product.unit_cost) * quantity
                    order_items.append({
                        'item_type': 'product',
                        'product': product,
                        'quantity': quantity,
                        'price': price
                    })
                    total_price += price
                except Product.DoesNotExist:
                    return Response(
                        {'error': f'Product with id {item_id} not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            elif item_type == 'service':
                try:
                    service = Service.objects.get(id=item_id)
                    price = float(service.price) * quantity
                    order_items.append({
                        'item_type': 'service',
                        'service': service,
                        'quantity': quantity,
                        'price': price
                    })
                    total_price += price
                except Service.DoesNotExist:
                    return Response(
                        {'error': f'Service with id {item_id} not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            branch=validated_data['branch'],
            total_price=total_price,
            notes=validated_data.get('notes', ''),
            status='pending'
        )
        
        # Create order items
        for item in order_items:
            OrderItem.objects.create(
                order=order,
                item_type=item['item_type'],
                product=item.get('product'),
                service=item.get('service'),
                quantity=item['quantity'],
                price=item['price']
            )
            
            # Deduct stock for products
            if item['item_type'] == 'product' and item.get('product'):
                product = item['product']
                product.quantity -= item['quantity']
                product.save()
        
        # Return created order
        order_serializer = OrderSerializer(order)
        return Response(order_serializer.data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # All users (including admins) can ONLY see their own orders
        queryset = Order.objects.filter(user=self.request.user)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by branch if provided
        branch_filter = self.request.query_params.get('branch')
        if branch_filter:
            queryset = queryset.filter(branch=branch_filter)
        
        return queryset


class AdminOrderListView(generics.ListAPIView):
    """Admin-only view to see all orders from all users"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        # Admins can see all orders
        queryset = Order.objects.all().select_related('user').prefetch_related('items')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by branch if provided
        branch_filter = self.request.query_params.get('branch')
        if branch_filter:
            queryset = queryset.filter(branch=branch_filter)
        
        # Filter by user if provided
        user_filter = self.request.query_params.get('user')
        if user_filter:
            queryset = queryset.filter(user_id=user_filter)
        
        return queryset.order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # All users (including admins) can ONLY see their own orders
        return Order.objects.filter(user=self.request.user)


class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            # Users can only update their own orders
            order = Order.objects.get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found or does not belong to you'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        if new_status not in ['pending', 'available_for_pickup', 'completed', 'cancelled']:
            return Response(
                {'error': 'Invalid status. Must be pending, available_for_pickup, completed, or cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only allow users to cancel their own pending orders
        if new_status == 'cancelled' and order.status == 'pending':
            # Restore stock for cancelled orders
            order_items = OrderItem.objects.filter(order=order, item_type='product')
            for order_item in order_items:
                if order_item.product:
                    product = order_item.product
                    product.quantity += order_item.quantity
                    product.save()
            
            order.status = new_status
            order.save()
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        else:
            return Response(
                {'error': 'You can only cancel pending orders'},
                status=status.HTTP_403_FORBIDDEN
            )


class AdminUpdateOrderStatusView(APIView):
    """Admin-only endpoint to update order status"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        if new_status not in ['pending', 'available_for_pickup', 'completed', 'cancelled']:
            return Response(
                {'error': 'Invalid status. Must be pending, available_for_pickup, completed, or cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store old status to check if we need to restore stock
        old_status = order.status
        
        # If cancelling an order that was not previously cancelled, restore stock
        if new_status == 'cancelled' and old_status != 'cancelled':
            order_items = OrderItem.objects.filter(order=order, item_type='product')
            for order_item in order_items:
                if order_item.product:
                    product = order_item.product
                    product.quantity += order_item.quantity
                    product.save()
        
        # If un-cancelling an order (changing from cancelled to pending/completed), deduct stock again
        elif old_status == 'cancelled' and new_status in ['pending', 'completed']:
            order_items = OrderItem.objects.filter(order=order, item_type='product')
            for order_item in order_items:
                if order_item.product:
                    product = order_item.product
                    # Check if enough stock is available
                    if product.quantity < order_item.quantity:
                        return Response(
                            {'error': f'Insufficient stock for {product.name}. Available: {product.quantity}, Needed: {order_item.quantity}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
            
            # If stock check passed, deduct stock
            for order_item in order_items:
                if order_item.product:
                    product = order_item.product
                    product.quantity -= order_item.quantity
                    product.save()
        
        order.status = new_status
        if new_status == 'completed':
            order.completed_at = timezone.now()
        order.save()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)


class CreatePurchaseFeedbackView(generics.CreateAPIView):
    """Create overall purchase/order feedback"""
    serializer_class = PurchaseFeedbackSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        order_id = self.request.data.get('order')
        
        try:
            order = Order.objects.get(id=order_id, user=self.request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found or does not belong to you'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if order.status != 'completed':
            return Response(
                {'error': 'Can only give feedback for completed orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if hasattr(order, 'feedback'):
            return Response(
                {'error': 'Feedback already exists for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(user=self.request.user)


class PurchaseFeedbackListView(generics.ListAPIView):
    """Admin-only view for purchase feedback"""
    serializer_class = PurchaseFeedbackSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        # Admin can see all purchase feedback
        return PurchaseFeedback.objects.all().select_related('user', 'order')


# Keep backward compatibility
FeedbackListView = PurchaseFeedbackListView
CreateFeedbackView = CreatePurchaseFeedbackView


class CreateProductFeedbackView(generics.CreateAPIView):
    serializer_class = ProductFeedbackSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        order = serializer.validated_data['order']
        product = serializer.validated_data['product']
        
        # Verify order belongs to user
        if order.user != self.request.user:
            return Response(
                {'error': 'You can only give feedback for your own orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verify order is completed
        if order.status != 'completed':
            return Response(
                {'error': 'Can only give feedback for completed orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify product was in the order
        order_has_product = OrderItem.objects.filter(
            order=order,
            product=product,
            item_type='product'
        ).exists()
        
        if not order_has_product:
            return Response(
                {'error': 'Product was not in this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save(user=self.request.user)


class ProductFeedbackListView(APIView):
    """Get all feedback for a specific product - Public endpoint for product page display"""
    permission_classes = [AllowAny]  # Public endpoint - anyone can view product reviews
    
    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        feedbacks = ProductFeedback.objects.filter(product=product).select_related('user', 'order')
        serializer = ProductFeedbackSerializer(feedbacks, many=True)
        
        # Calculate average rating
        avg_rating = feedbacks.aggregate(Avg('rating'))['rating__avg']
        total_reviews = feedbacks.count()
        
        return Response({
            'product_id': product_id,
            'product_name': product.name,
            'average_rating': round(avg_rating, 1) if avg_rating else 0,
            'total_reviews': total_reviews,
            'feedbacks': serializer.data
        })


class ProductRatingsView(APIView):
    """Get ratings for all products - Public endpoint for product page display"""
    permission_classes = [AllowAny]  # Public endpoint - anyone can view product ratings
    
    def get(self, request):
        # Get all products with their ratings
        products = Product.objects.annotate(
            avg_rating=Avg('feedbacks__rating'),
            review_count=Count('feedbacks')
        ).values('id', 'avg_rating', 'review_count')
        
        ratings = {}
        for product in products:
            ratings[product['id']] = {
                'average_rating': round(product['avg_rating'], 1) if product['avg_rating'] else 0,
                'review_count': product['review_count']
            }
        
        return Response(ratings)

