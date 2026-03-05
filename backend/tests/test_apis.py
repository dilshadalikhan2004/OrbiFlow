import requests

BASE = "http://localhost:8000/api/v1"

# Login
r = requests.post(f"{BASE}/auth/login", json={"email": "dilshadalikhanji123@gmail.com", "password": "Dillu1234"})
print(f"1. Login: {r.status_code}")
token = r.json().get("access_token", "")
headers = {"Authorization": f"Bearer {token}"}

# Organizations
r = requests.get(f"{BASE}/organizations/", headers=headers)
print(f"2. Organizations: {r.status_code} -> {r.text[:200]}")
orgs = r.json()
org_id = orgs[0]["id"] if orgs else None

if org_id:
    # Analytics
    r = requests.get(f"{BASE}/analytics/dashboard?organization_id={org_id}", headers=headers)
    print(f"3. Analytics: {r.status_code} -> {r.text[:300]}")

    # Projects
    r = requests.get(f"{BASE}/projects/?organization_id={org_id}", headers=headers)
    print(f"4. Projects: {r.status_code} -> {r.text[:200]}")

    # Tasks
    r = requests.get(f"{BASE}/tasks/?organization_id={org_id}", headers=headers)
    print(f"5. Tasks: {r.status_code} -> {r.text[:200]}")

    # Notifications
    r = requests.get(f"{BASE}/notifications/", headers=headers)
    print(f"6. Notifications: {r.status_code} -> {r.text[:200]}")

    # Unread count
    r = requests.get(f"{BASE}/notifications/unread-count", headers=headers)
    print(f"7. Unread Count: {r.status_code} -> {r.text[:100]}")

    # Activity
    r = requests.get(f"{BASE}/activity/?organization_id={org_id}", headers=headers)
    print(f"8. Activity: {r.status_code} -> {r.text[:200]}")
else:
    print("No organization found!")

print("\n--- ALL API TESTS DONE ---")
