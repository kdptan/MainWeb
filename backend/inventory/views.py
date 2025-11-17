from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import ProductSerializer, ProductHistorySerializer, SupplierSerializer
from .models import Product, ProductHistory, Supplier
from datetime import datetime
from decimal import Decimal


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
            
            # Create history entries for newly added products
            if many:
                for instance in instances:
                    total_cost = Decimal(str(instance.unit_cost)) * Decimal(str(instance.quantity))
                    ProductHistory.objects.create(
                        product=instance,
                        user=request.user if request.user.is_authenticated else None,
                        transaction_type='addition',
                        quantity_change=instance.quantity,
                        old_quantity=0,
                        new_quantity=instance.quantity,
                        supplier=instance.supplier,
                        unit_cost=instance.unit_cost,
                        total_cost=total_cost,
                        reason='Product added to inventory'
                    )
            else:
                total_cost = Decimal(str(instances.unit_cost)) * Decimal(str(instances.quantity))
                ProductHistory.objects.create(
                    product=instances,
                    user=request.user if request.user.is_authenticated else None,
                    transaction_type='addition',
                    quantity_change=instances.quantity,
                    old_quantity=0,
                    new_quantity=instances.quantity,
                    supplier=instances.supplier,
                    unit_cost=instances.unit_cost,
                    total_cost=total_cost,
                    reason='Product added to inventory'
                )
            
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


class RestockProductAPIView(APIView):
    """Handle restocking of products with history tracking"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request):
        """
        Restock a product
        Expected data:
        {
            "product_id": 1,
            "quantity": 50,
            "supplier": "Supplier Name",
            "unit_cost": 100.00,
            "reason": "Regular restocking"
        }
        """
        try:
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 0))
            supplier = request.data.get('supplier', '')
            unit_cost = request.data.get('unit_cost')
            reason = request.data.get('reason', 'Restock')
            
            if not product_id or quantity <= 0:
                return Response(
                    {"detail": "Invalid product_id or quantity"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            product = Product.objects.get(pk=product_id)
            
            # Record old quantity
            old_quantity = product.quantity
            
            # Update product quantity and supplier
            product.quantity += quantity
            if supplier:
                product.supplier = supplier
            if unit_cost:
                product.unit_cost = Decimal(str(unit_cost))
            product.save()
            
            # Create history entry - ensure all values are Decimal for calculation
            unit_cost_decimal = Decimal(str(unit_cost)) if unit_cost else product.unit_cost
            total_cost = unit_cost_decimal * Decimal(str(quantity))
            ProductHistory.objects.create(
                product=product,
                user=request.user,
                transaction_type='restock',
                quantity_change=quantity,
                old_quantity=old_quantity,
                new_quantity=product.quantity,
                supplier=supplier or product.supplier,
                unit_cost=unit_cost_decimal,
                total_cost=total_cost,
                reason=reason
            )
            
            serializer = ProductSerializer(product)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProductHistoryAPIView(APIView):
    """Get product history/inventory logs"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        """Get all product history, optionally filtered by product"""
        product_id = request.query_params.get('product_id')
        branch = request.query_params.get('branch')
        transaction_type = request.query_params.get('transaction_type')
        
        queryset = ProductHistory.objects.all()
        
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        if branch:
            queryset = queryset.filter(product__branch=branch)
        
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        serializer = ProductHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdjustStockQuantityAPIView(APIView):
    """Handle one-by-one stock quantity adjustments with history tracking"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request):
        """
        Adjust stock quantity for a single product
        Expected data:
        {
            "product_id": 1,
            "operation": "ADD" or "DEDUCT",
            "transaction_type": "addition|restock|sale|adjustment|damaged|return",
            "quantity": 10,
            "supplier": "Optional supplier name",
            "reason": "Optional reason for adjustment"
        }
        """
        try:
            product_id = request.data.get('product_id')
            operation = request.data.get('operation', 'ADD').upper()
            transaction_type = request.data.get('transaction_type', 'adjustment')
            quantity = int(request.data.get('quantity', 0))
            supplier = request.data.get('supplier', '')
            reason = request.data.get('reason', '')
            amount_paid = request.data.get('amount_paid')
            
            # Validation
            if not product_id:
                return Response(
                    {"detail": "product_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if operation not in ['ADD', 'DEDUCT']:
                return Response(
                    {"detail": "operation must be 'ADD' or 'DEDUCT'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if quantity <= 0:
                return Response(
                    {"detail": "quantity must be greater than 0"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            valid_transaction_types = ['addition', 'restock', 'sale', 'adjustment', 'damaged', 'return']
            if transaction_type not in valid_transaction_types:
                return Response(
                    {"detail": f"transaction_type must be one of {valid_transaction_types}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the product
            product = Product.objects.get(pk=product_id)
            
            # Record old quantity
            old_quantity = product.quantity
            
            # Calculate new quantity
            if operation == 'ADD':
                quantity_change = quantity
                new_quantity = old_quantity + quantity
            else:  # DEDUCT
                quantity_change = -quantity
                new_quantity = old_quantity - quantity
                
                # Prevent negative stock
                if new_quantity < 0:
                    return Response(
                        {"detail": f"Cannot deduct {quantity}. Current stock is {old_quantity}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Update product quantity
            product.quantity = new_quantity
            product.save()
            
            # Calculate unit_cost and total_cost for history
            unit_cost_decimal = Decimal(str(product.unit_cost)) if product.unit_cost else Decimal('0')
            total_cost = unit_cost_decimal * Decimal(str(abs(quantity_change)))
            
            # Convert amount_paid to Decimal if provided
            amount_paid_decimal = None
            if amount_paid is not None:
                try:
                    amount_paid_decimal = Decimal(str(amount_paid))
                except (ValueError, TypeError):
                    amount_paid_decimal = None
            
            # Create history entry
            ProductHistory.objects.create(
                product=product,
                user=request.user,
                transaction_type=transaction_type,
                quantity_change=quantity_change,
                old_quantity=old_quantity,
                new_quantity=new_quantity,
                supplier=supplier or product.supplier,
                unit_cost=unit_cost_decimal,
                total_cost=total_cost,
                amount_paid=amount_paid_decimal,
                reason=reason or f"{operation}ED {quantity} unit(s)"
            )
            
            # Return updated product data
            serializer = ProductSerializer(product)
            return Response({
                'success': True,
                'message': f"Successfully {operation.lower()}ED {quantity} unit(s) for {product.name}",
                'product': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {"detail": f"Invalid input: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class SupplierListCreateAPIView(APIView):
    """List all suppliers or create a new supplier"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        suppliers = Supplier.objects.filter(is_active=True).order_by('name')
        serializer = SupplierSerializer(suppliers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SupplierSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SupplierUpdateDeleteAPIView(APIView):
    """Update or delete a supplier"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get_object(self, pk):
        try:
            return Supplier.objects.get(pk=pk)
        except Supplier.DoesNotExist:
            return None

    def put(self, request, pk):
        supplier = self.get_object(pk)
        if not supplier:
            return Response(
                {"detail": "Supplier not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = SupplierSerializer(supplier, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        supplier = self.get_object(pk)
        if not supplier:
            return Response(
                {"detail": "Supplier not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        # Soft delete: mark as inactive instead of deleting
        supplier.is_active = False
        supplier.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdatePaymentAPIView(APIView):
    """Update amount_paid for multiple transactions"""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request):
        transaction_ids = request.data.get('transaction_ids', [])
        amount_paid = request.data.get('amount_paid')

        print(f"[UPDATE PAYMENT] Received request")
        print(f"[UPDATE PAYMENT] transaction_ids: {transaction_ids}")
        print(f"[UPDATE PAYMENT] amount_paid: {amount_paid}")

        if not transaction_ids:
            return Response(
                {"error": "transaction_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount_paid is None:
            return Response(
                {"error": "amount_paid is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            amount_paid = Decimal(str(amount_paid))
            if amount_paid < 0:
                return Response(
                    {"error": "amount_paid must be non-negative"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid amount_paid value"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update all transactions with the same amount_paid
        updated_count = ProductHistory.objects.filter(
            id__in=transaction_ids
        ).update(amount_paid=amount_paid)

        print(f"[UPDATE PAYMENT] Updated {updated_count} transaction(s)")
        
        # Verify the update
        updated_txns = ProductHistory.objects.filter(id__in=transaction_ids)
        for txn in updated_txns:
            print(f"[UPDATE PAYMENT] Transaction ID {txn.id} now has amount_paid: {txn.amount_paid}")

        return Response(
            {
                "message": f"Successfully updated {updated_count} transaction(s)",
                "updated_count": updated_count
            },
            status=status.HTTP_200_OK
        )
