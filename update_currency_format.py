import os
import re

# List of files to update with their relative import paths
files_to_update = [
    ('frontend/src/pages/CartPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/MyOrdersPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/ProductsPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/AdminOrdersPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/FeedbackPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/AppointmentPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/EndOfDayReportsPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/ServicesPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/AdminServicesPage.jsx', '../utils/formatters'),
    ('frontend/src/pages/management/Products.jsx', '../../utils/formatters'),
    ('frontend/src/pages/management/Services.jsx', '../../utils/formatters'),
    ('frontend/src/components/ProductHistoryModal.jsx', '../utils/formatters'),
]

def update_file(filepath, import_path):
    full_path = os.path.join(r'C:\Users\Kyle\Documents\GitHub\MainWeb', filepath)
    
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        return False
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Check if formatCurrency is already imported
    if 'formatCurrency' not in content:
        # Find the last import statement
        import_pattern = r"(import\s+.*?from\s+['\"].*?['\"];?\n)"
        imports = list(re.finditer(import_pattern, content))
        
        if imports:
            last_import = imports[-1]
            insert_pos = last_import.end()
            new_import = f"import {{ formatCurrency }} from '{import_path}';\n"
            content = content[:insert_pos] + new_import + content[insert_pos:]
        else:
            # Add at the beginning if no imports found
            content = f"import {{ formatCurrency }} from '{import_path}';\n" + content
    
    # Replace all ₱{...toFixed(2)} patterns with {formatCurrency(...)}
    # Pattern 1: ₱{Number(...).toFixed(2)}
    content = re.sub(
        r'₱\{Number\(([^)]+)\)\.toFixed\(2\)\}',
        r'{formatCurrency(\1)}',
        content
    )
    
    # Pattern 2: ₱{parseFloat(...).toFixed(2)}
    content = re.sub(
        r'₱\{parseFloat\(([^)]+)\)\.toFixed\(2\)\}',
        r'{formatCurrency(\1)}',
        content
    )
    
    # Pattern 3: ₱{(...).toFixed(2)}
    content = re.sub(
        r'₱\{([^}]+)\.toFixed\(2\)\}',
        r'{formatCurrency(\1)}',
        content
    )
    
    # Pattern 4: `₱${...toFixed(2)}` (template literals)
    content = re.sub(
        r'`₱\$\{([^}]+)\.toFixed\(2\)\}`',
        r'formatCurrency(\1)',
        content
    )
    
    if content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ Updated: {filepath}")
        return True
    else:
        print(f"○ No changes needed: {filepath}")
        return False

# Update all files
print("Updating currency formatting in JSX files...\n")
updated_count = 0
for filepath, import_path in files_to_update:
    if update_file(filepath, import_path):
        updated_count += 1

print(f"\n✓ Complete! Updated {updated_count} files.")
