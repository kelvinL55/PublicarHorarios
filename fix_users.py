import json
import random
import time

def generate_random_id():
    # Use current timestamp + random as ID simulation
    return int(time.time() * 1000) + random.randint(0, 10000)

try:
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except FileNotFoundError:
    print("data.json not found")
    exit()

users = data.get('users', [])
employees = data.get('employees', [])

# Map existing users to employees to avoid duplication
existing_user_employee_ids = {u['employeeId'] for u in users if 'employeeId' in u}

# Create users for employees that don't have one
new_users = []
for emp in employees:
    if emp['id'] in existing_user_employee_ids:
        continue

    # Generate username/password
    username = emp['name'].lower().replace(" ", ".")
    password = f"{random.randint(1000, 9999)}" # Simple 4 digit password

    new_user = {
        "id": generate_random_id(),
        "username": username,
        "password": password,
        "role": "employee", # Default to employee role
        "employeeId": emp['id'],
        "employeeName": emp['name'],
        "employeeCode": emp['code'],
        "status": "Active"
    }
    
    # Avoid ID collision just in case
    time.sleep(0.001) 
    
    new_users.append(new_user)

# Update users list
data['users'].extend(new_users)

# Save back to file
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Generated {len(new_users)} new user accounts for existing employees.")
