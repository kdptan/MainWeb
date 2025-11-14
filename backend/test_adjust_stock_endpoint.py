#!/usr/bin/env python
"""
Test script for the adjust-stock endpoint
Run this from the backend directory: python test_adjust_stock_endpoint.py
"""

import os
import sys
import django
import json
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chonkyweb_backend.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from inventory.models import Product, ProductHistory

def test_adjust_stock_endpoint():
    """Test the adjust-stock endpoint"""
    
    client = APIClient()
    
    # Create or get a test admin user
    admin_user, created = User.objects.get_or_create(
        username='test_admin',
        defaults={'is_staff': True, 'is_superuser': True}
    )
    if created:
        admin_user.set_password('testpassword123')
        admin_user.save()
        print(f"✓ Created test admin user: {admin_user.username}")
    
    # Get or create token
    token, created = Token.objects.get_or_create(user=admin_user)
    print(f"✓ Admin token: {token.key}")
    
    # Create or get a test product
    product, created = Product.objects.get_or_create(
        id=1,
        defaults={
            'name': 'Test Product',
            'category': 'Pet Food & Treats',
            'unit_cost': Decimal('50.00'),
            'quantity': 100,
            'branch': 'Matina'
        }
    )
    if created:
        print(f"✓ Created test product: {product.name} (ID: {product.id})")
    else:
        print(f"✓ Using existing test product: {product.name} (ID: {product.id})")
    
    print(f"  Current stock: {product.quantity}")
    
    # Test 1: ADD operation
    print("\n[Test 1] Testing ADD operation...")
    response = client.post(
        '/api/inventory/adjust-stock/',
        {
            'product_id': product.id,
            'operation': 'ADD',
            'transaction_type': 'addition',
            'quantity': 20,
            'reason': 'Test addition'
        },
        format='json',
        HTTP_AUTHORIZATION=f'Bearer {token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success: {data.get('message')}")
        print(f"  New stock: {data['product']['quantity']}")
    else:
        print(f"✗ Error: {response.json()}")
    
    # Refresh product from DB
    product.refresh_from_db()
    
    # Test 2: DEDUCT operation
    print("\n[Test 2] Testing DEDUCT operation...")
    response = client.post(
        '/api/inventory/adjust-stock/',
        {
            'product_id': product.id,
            'operation': 'DEDUCT',
            'transaction_type': 'sale',
            'quantity': 15,
            'reason': 'Test sale'
        },
        format='json',
        HTTP_AUTHORIZATION=f'Bearer {token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Success: {data.get('message')}")
        print(f"  New stock: {data['product']['quantity']}")
    else:
        print(f"✗ Error: {response.json()}")
    
    # Test 3: Invalid operation (negative result)
    print("\n[Test 3] Testing DEDUCT with insufficient stock...")
    product.refresh_from_db()
    response = client.post(
        '/api/inventory/adjust-stock/',
        {
            'product_id': product.id,
            'operation': 'DEDUCT',
            'transaction_type': 'sale',
            'quantity': 1000,
            'reason': 'Test overdraft'
        },
        format='json',
        HTTP_AUTHORIZATION=f'Bearer {token.key}'
    )
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"✓ Correctly rejected: {response.json().get('detail')}")
    else:
        print(f"✗ Should have failed but succeeded")
    
    # Check history
    print("\n[History] Recent product history:")
    history = ProductHistory.objects.filter(product=product).order_by('-timestamp')[:5]
    for entry in history:
        print(f"  {entry.transaction_type:15} | Change: {entry.quantity_change:+4d} | Stock: {entry.old_quantity} → {entry.new_quantity} | {entry.timestamp.strftime('%H:%M:%S')}")
    
    print("\n✓ All tests completed!")

if __name__ == '__main__':
    test_adjust_stock_endpoint()
