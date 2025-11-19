"""
Test script to manually verify mentor relationship API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_mentor_api():
    # Step 1: Get CSRF token
    print("1. Getting CSRF token...")
    session = requests.Session()
    response = session.get(f"{BASE_URL}/quotes/random/")
    csrf_token = session.cookies.get('csrftoken')
    print(f"   CSRF token: {csrf_token[:20]}..." if csrf_token else "   No CSRF token")
    
    # Step 2: Login
    print("\n2. Logging in...")
    login_data = {
        "username": "ali1",
        "password": "ali12345",
        "remember_me": True
    }
    headers = {
        'X-CSRFToken': csrf_token,
        'Content-Type': 'application/json'
    }
    response = session.post(f"{BASE_URL}/login/", json=login_data, headers=headers)
    print(f"   Login status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {response.json()}")
    else:
        print(f"   Error: {response.text}")
        return
    
    # Step 3: Get current user
    print("\n3. Getting current user...")
    response = session.get(f"{BASE_URL}/user/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        current_user = response.json()
        print(f"   Current user: {current_user}")
    else:
        print(f"   Error: {response.text}")
        return
    
    # Step 4: Get all users
    print("\n4. Getting all users...")
    response = session.get(f"{BASE_URL}/users/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        users = response.json()
        print(f"   Total users: {len(users)}")
        for u in users[:3]:
            print(f"   - {u.get('id')}: {u.get('username')}")
    else:
        print(f"   Error: {response.text}")
    
    # Step 5: Get existing mentor relationships
    print("\n5. Getting existing mentor relationships...")
    response = session.get(f"{BASE_URL}/mentor-relationships/user/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        relationships = response.json()
        print(f"   Total relationships: {len(relationships)}")
        for rel in relationships:
            print(f"   - ID {rel['id']}: {rel['mentor_username']} -> {rel['mentee_username']} ({rel['status']})")
    else:
        print(f"   Error: {response.text}")
    
    # Step 6: Try to create a mentor relationship (if we have another user)
    if response.status_code == 200 and len(users) > 1:
        # Find a user other than current user
        other_user = next((u for u in users if u['id'] != current_user['id']), None)
        if other_user:
            print(f"\n6. Creating mentor relationship with {other_user['username']}...")
            csrf_token = session.cookies.get('csrftoken')
            mentor_data = {
                "mentor": current_user['id'],
                "mentee": other_user['id']
            }
            headers = {
                'X-CSRFToken': csrf_token,
                'Content-Type': 'application/json'
            }
            response = session.post(
                f"{BASE_URL}/mentor-relationships/",
                json=mentor_data,
                headers=headers
            )
            print(f"   Status: {response.status_code}")
            if response.status_code == 201:
                rel = response.json()
                print(f"   Created relationship: ID {rel['id']}")
                print(f"   Mentor: {rel['mentor_username']} (ID {rel['mentor']})")
                print(f"   Mentee: {rel['mentee_username']} (ID {rel['mentee']})")
                print(f"   Status: {rel['status']}")
            else:
                print(f"   Error: {response.text}")

if __name__ == "__main__":
    test_mentor_api()
