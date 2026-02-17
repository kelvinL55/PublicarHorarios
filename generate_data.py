import json
import random
from datetime import datetime, timedelta

# Configuration
NUM_NEW_EMPLOYEES = 50
START_DATE = datetime(2026, 1, 27)
END_DATE = datetime(2026, 2, 26)
ROLES = ['Operario', 'Supervisor', 'Empaquetador', 'Mantenimiento', 'Control de Calidad', 'Almacenero']
SHIFT_TYPES = ['M', 'T', 'N', 'L', 'L'] # Added more 'L' to simulate weekends/breaks

# Helper to generate dates
def date_range(start, end):
    delta = end - start
    for i in range(delta.days + 1):
        yield start + timedelta(days=i)

# Load existing data
try:
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except FileNotFoundError:
    data = {"users": [], "employees": [], "shifts": []}

# Existing IDs to avoid conflicts
existing_ids = {e['id'] for e in data.get('employees', [])}
next_id = max(existing_ids) + 1 if existing_ids else 200

first_names = ["Alejandro", "Beatriz", "Carlos", "Diana", "Eduardo", "Fernanda", "Gabriel", "Hilda", "Ignacio", "Julia", "Kevin", "Laura", "Manuel", "Natalia", "Oscar", "Patricia", "Quintin", "Rosa", "Sergio", "Teresa", "Ulises", "Veronica", "Walter", "Ximena", "Yolanda", "Zacarias", "Andres", "Berta", "Cesar", "Daniela"]
last_names = ["Garcia", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Torres", "Flores", "Rivera", "Gomez", "Diaz", "Cruz", "Reyes", "Morales", "Ortiz", "Gutierrez", "Chavez"]

new_employees = []
new_shifts = []

for i in range(NUM_NEW_EMPLOYEES):
    emp_id = next_id + i
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    code = f"EMP{emp_id}"
    
    emp = {
        "id": emp_id,
        "name": name,
        "code": code,
        "joinDate": f"202{random.randint(3, 5)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
        "role": random.choice(ROLES)
    }
    new_employees.append(emp)

    # Generate shifts for this employee
    # Simple logic: 6 days work, 1 day rest, or random
    # Let's do completely random for now as requested "horarios aleatorios"
    # but ensuring full coverage
    
    for date in date_range(START_DATE, END_DATE):
        date_str = date.strftime("%Y-%m-%d")
        
        # Determine shift
        # 80% chance of work, 20% free
        shift_type = random.choice(SHIFT_TYPES)
        
        shift = {
            "employeeId": emp_id,
            "date": date_str,
            "type": shift_type
        }
        new_shifts.append(shift)

# Append to existing data
data['employees'].extend(new_employees)
data['shifts'].extend(new_shifts)

# Save back to file
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Added {NUM_NEW_EMPLOYEES} employees and {len(new_shifts)} shifts.")
