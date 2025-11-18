from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from decimal import Decimal
from inventory.models import ProductHistory
from django.db import transaction
from django.db.models import Avg, Count
from django.core.mail import send_mail
from django.conf import settings
from .models import Order, OrderItem, PurchaseFeedback, ProductFeedback, Notification
from inventory.models import Product
from services.models import Service
from .serializers import (
    OrderSerializer, 
    CreateOrderSerializer, 
    PurchaseFeedbackSerializer,
    OrderItemSerializer,
    ProductFeedbackSerializer,
    NotificationSerializer
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
                    
                    # Store unit price, not total price
                    unit_price = float(product.unit_cost)
                    total_item_price = unit_price * quantity
                    order_items.append({
                        'item_type': 'product',
                        'product': product,
                        'quantity': quantity,
                        'price': unit_price  # Store only unit price
                    })
                    total_price += total_item_price
                except Product.DoesNotExist:
                    return Response(
                        {'error': f'Product with id {item_id} not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            elif item_type == 'service':
                try:
                    service = Service.objects.get(id=item_id)
                    # Store unit price, not total price
                    unit_price = float(service.price)
                    total_item_price = unit_price * quantity
                    order_items.append({
                        'item_type': 'service',
                        'service': service,
                        'quantity': quantity,
                        'price': unit_price  # Store only unit price
                    })
                    total_price += total_item_price
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
            amount_paid=validated_data.get('amount_paid', 0),
            change=validated_data.get('change', 0),
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
                old_quantity = product.quantity
                product.quantity -= item['quantity']
                product.save()
                
                # Create ProductHistory entry for sale
                total_cost = Decimal(str(product.unit_cost)) * Decimal(str(item['quantity']))
                ProductHistory.objects.create(
                    product=product,
                    user=request.user,
                    transaction_type='sale',
                    quantity_change=-item['quantity'],
                    old_quantity=old_quantity,
                    new_quantity=product.quantity,
                    supplier=product.supplier,
                    unit_cost=product.unit_cost,
                    total_cost=total_cost,
                    reason=f'Sold in order {order.order_id}'
                )
        
        # Create notification for the user
        notification_message = f"Order #{order.order_id} is ready to be picked up at {order.branch} branch."
        Notification.objects.create(
            user=request.user,
            order=order,
            message=notification_message
        )
        
        # Send email notification to user
        try:
            user_email = request.user.email
            if user_email:
                subject = f"Order #{order.order_id} Ready for Pickup"
                message = f"""
Hello {request.user.first_name or request.user.username},

Your order #{order.order_id} has been placed successfully and is ready to be picked up!

Pickup Location: {order.branch} Branch
Total Amount: ₱{order.total_price}

Please bring this order number when picking up your order.

Thank you for shopping with Chonky Boi Pet Store!

Best regards,
Chonky Boi Team
                """.strip()
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user_email],
                    fail_silently=True,  # Don't fail order creation if email fails
                )
        except Exception as e:
            # Log error but don't fail the order creation
            print(f"Failed to send email notification: {str(e)}")
        
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
        # Admins can see all orders, regular users can only see their own
        if self.request.user.is_staff:
            return Order.objects.all()
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
                    old_quantity = product.quantity
                    product.quantity += order_item.quantity
                    product.save()
                    
                    # Create ProductHistory entry for cancellation
                    total_cost = Decimal(str(product.unit_cost)) * Decimal(str(order_item.quantity))
                    ProductHistory.objects.create(
                        product=product,
                        user=request.user,
                        transaction_type='restock',
                        quantity_change=order_item.quantity,
                        old_quantity=old_quantity,
                        new_quantity=product.quantity,
                        supplier=product.supplier,
                        unit_cost=product.unit_cost,
                        total_cost=total_cost,
                        reason=f'Order {order.order_id} cancelled - stock restored'
                    )
            
            order.status = new_status
            order.save()
            # Mark related notifications as read if order is completed
            if new_status == 'completed':
                order.notifications.filter(is_read=False).update(is_read=True)
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
        
        print(f"DEBUG: Request data received: {request.data}")
        print(f"DEBUG: amount_paid in request: {'amount_paid' in request.data}")
        print(f"DEBUG: change in request: {'change' in request.data}")
        
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
                    old_quantity = product.quantity
                    product.quantity += order_item.quantity
                    product.save()
                    
                    # Create ProductHistory entry for cancellation
                    total_cost = Decimal(str(product.unit_cost)) * Decimal(str(order_item.quantity))
                    ProductHistory.objects.create(
                        product=product,
                        user=request.user,
                        transaction_type='restock',
                        quantity_change=order_item.quantity,
                        old_quantity=old_quantity,
                        new_quantity=product.quantity,
                        supplier=product.supplier,
                        unit_cost=product.unit_cost,
                        total_cost=total_cost,
                        reason=f'Order {order.order_id} cancelled - stock restored'
                    )
        
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
                    old_quantity = product.quantity
                    product.quantity -= order_item.quantity
                    product.save()
                    
                    # Create ProductHistory entry for sale
                    total_cost = Decimal(str(product.unit_cost)) * Decimal(str(order_item.quantity))
                    ProductHistory.objects.create(
                        product=product,
                        user=request.user,
                        transaction_type='sale',
                        quantity_change=-order_item.quantity,
                        old_quantity=old_quantity,
                        new_quantity=product.quantity,
                        supplier=product.supplier,
                        unit_cost=product.unit_cost,
                        total_cost=total_cost,
                        reason=f'Order {order.order_id} un-cancelled - stock deducted'
                    )
        
        # Update payment information if provided
        if 'amount_paid' in request.data:
            amount_paid_value = request.data.get('amount_paid', 0)
            print(f"DEBUG: Setting amount_paid to {amount_paid_value}")
            order.amount_paid = amount_paid_value
        if 'change' in request.data:
            change_value = request.data.get('change', 0)
            print(f"DEBUG: Setting change to {change_value}")
            order.change = change_value
        
        order.status = new_status
        if new_status == 'completed':
            order.completed_at = timezone.now()
        print(f"DEBUG: Before save - order.amount_paid={order.amount_paid}, order.change={order.change}")
        order.save()
        # Mark related notifications as read if order is completed
        if new_status == 'completed':
            order.notifications.filter(is_read=False).update(is_read=True)
        print(f"DEBUG: After save - order.amount_paid={order.amount_paid}, order.change={order.change}")
        
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


class NotificationListView(generics.ListAPIView):
    """Get all notifications for the authenticated user - only for pending orders"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only return unread notifications for orders that are pending or available for pickup
        return Notification.objects.filter(
            user=self.request.user,
            is_read=False,
            order__status__in=['pending', 'available_for_pickup']
        )


class MarkNotificationReadView(APIView):
    """Mark a notification as read"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'message': 'Notification marked as read'}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(
                {'error': 'Notification not found'},
                status=status.HTTP_404_NOT_FOUND
            )

