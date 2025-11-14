from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from django.db import transaction
from .models import Sale, SaleItem
from .serializers import SaleSerializer, CreateSaleSerializer
from inventory.models import Product
from services.models import Service


class CreateSaleView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @transaction.atomic
    def post(self, request):
        serializer = CreateSaleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        try:
            # First, calculate totals from items
            subtotal = Decimal('0')
            items_data = validated_data['items']
            
            for item in items_data:
                item_type = item.get('item_type')
                quantity = int(item.get('quantity', 1))
                unit_price = Decimal(str(item.get('unit_price', '0')))
                
                subtotal += unit_price * quantity
            
            # Calculate totals BEFORE creating the sale
            discount = Decimal(str(validated_data.get('discount', '0')))
            subtotal_after_discount = subtotal - discount
            tax = subtotal_after_discount * Decimal('0.12')  # 12% VAT
            total = subtotal_after_discount + tax
            amount_paid = Decimal(str(validated_data['amount_paid']))
            change = amount_paid - total
            
            # Debug logging
            print(f"DEBUG: subtotal={subtotal}, discount={discount}, tax={tax}, total={total}, amount_paid={amount_paid}, change={change}")
            print(f"DEBUG: total type={type(total)}, total value={repr(total)}")
            
            # Now create sale with all calculated fields
            sale = Sale.objects.create(
                customer_name=validated_data['customer_name'],
                customer_phone=validated_data.get('customer_phone', ''),
                customer_email=validated_data.get('customer_email', ''),
                branch=validated_data['branch'],
                cashier=request.user,
                payment_method=validated_data['payment_method'],
                amount_paid=amount_paid,
                subtotal=subtotal,
                discount=discount,
                tax=tax,
                total=total,
                change=change,
                notes=validated_data.get('notes', ''),
                status='completed'
            )
            
            # Process items and create sale items
            for item in items_data:
                item_type = item.get('item_type')
                quantity = int(item.get('quantity', 1))
                unit_price = Decimal(item.get('unit_price', '0'))
                
                if item_type == 'product':
                    product_id = int(item.get('product_id'))
                    product = Product.objects.get(id=product_id)
                    
                    # Create sale item
                    SaleItem.objects.create(
                        sale=sale,
                        item_type='product',
                        product=product,
                        item_name=product.name,
                        quantity=quantity,
                        unit_price=unit_price,
                        subtotal=unit_price * quantity
                    )
                    
                    # Reduce inventory
                    product.quantity -= quantity
                    product.save()
                
                elif item_type == 'service':
                    service_id = int(item.get('service_id'))
                    service = Service.objects.get(id=service_id)
                    service_size = item.get('service_size', '')
                    
                    # Create sale item
                    SaleItem.objects.create(
                        sale=sale,
                        item_type='service',
                        service=service,
                        item_name=service.service_name,
                        quantity=quantity,
                        unit_price=unit_price,
                        subtotal=unit_price * quantity,
                        service_size=service_size
                    )
            
            # Serialize and return
            serializer = SaleSerializer(sale)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SaleListView(generics.ListAPIView):
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        queryset = Sale.objects.all().prefetch_related('items').order_by('-sale_date')
        
        # Filters
        branch = self.request.query_params.get('branch')
        if branch and branch != 'all':
            queryset = queryset.filter(branch=branch)
        
        date_filter = self.request.query_params.get('date')
        if date_filter:
            queryset = queryset.filter(sale_date__date=date_filter)
        
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        return queryset


class SaleDetailView(generics.RetrieveAPIView):
    queryset = Sale.objects.all().prefetch_related('items')
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


class SaleStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Get filters
        branch = request.query_params.get('branch', 'all')
        date_filter = request.query_params.get('date')
        
        # Build query
        queryset = Sale.objects.filter(status='completed')
        
        if branch != 'all':
            queryset = queryset.filter(branch=branch)
        
        if date_filter:
            queryset = queryset.filter(sale_date__date=date_filter)
        
        # Calculate stats
        total_sales = queryset.count()
        total_revenue = sum(sale.total for sale in queryset)
        total_discount = sum(sale.discount for sale in queryset)
        avg_transaction = total_revenue / total_sales if total_sales > 0 else 0
        
        # Top products
        products_sold = {}
        for sale in queryset:
            for item in sale.items.filter(item_type='product'):
                if item.product:
                    key = item.product.name
                    if key not in products_sold:
                        products_sold[key] = {'quantity': 0, 'revenue': 0}
                    products_sold[key]['quantity'] += item.quantity
                    products_sold[key]['revenue'] += float(item.subtotal)
        
        top_products = sorted(
            [{'name': k, **v} for k, v in products_sold.items()],
            key=lambda x: x['revenue'],
            reverse=True
        )[:5]
        
        return Response({
            'total_sales': total_sales,
            'total_revenue': float(total_revenue),
            'total_discount': float(total_discount),
            'avg_transaction': float(avg_transaction),
            'top_products': top_products,
        })
