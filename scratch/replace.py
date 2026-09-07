import os
import re

files_to_modify = [
    "src/components/products/ProductManager.tsx",
    "src/app/supplier/orders/page.tsx",
    "src/app/supplier/finance/page.tsx",
    "src/app/supplier/messages/page.tsx",
    "src/app/supplier/drivers/page.tsx",
    "src/app/supplier/invoices/SupplierInvoicesClient.tsx",
    "src/app/supplier/tenants/page.tsx",
    "src/app/supplier/payments/SupplierPaymentsClient.tsx"
]

for filepath in files_to_modify:
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
    with open(filepath, 'r') as f:
        content = f.read()

    # check if userData is extracted
    if 'useAuth()' in content:
        auth_line = re.search(r'const\s+\{[^\}]*\}\s*=\s*useAuth\(\);', content)
        if auth_line:
            match_str = auth_line.group(0)
            new_match = match_str
            if 'userData' not in match_str:
                new_match = match_str.replace('user', 'user, userData')
            
            if 'activeSupplierId' not in content:
                new_match += '\n  const activeSupplierId = userData?.parentSupplierId || user?.uid;'
                
            content = content.replace(match_str, new_match)
            
            parts = content.split('const activeSupplierId = userData?.parentSupplierId || user?.uid;')
            if len(parts) >= 2:
                parts[1] = parts[1].replace('user.uid', 'activeSupplierId').replace('user?.uid', 'activeSupplierId')
                content = parts[0] + 'const activeSupplierId = userData?.parentSupplierId || user?.uid;' + parts[1]
                
                with open(filepath, 'w') as f:
                    f.write(content)
                print(f"Modified {filepath}")
            else:
                print(f"Could not split properly: {filepath}")
        else:
            print(f"Could not find useAuth() destructuring in: {filepath}")
