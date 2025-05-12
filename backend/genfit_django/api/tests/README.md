# GenFit Backend Tests

This directory contains the test suite for the GenFit backend API. The tests are written using Django's test framework and ensure the proper functioning of our API endpoints.

## Prerequisites

Before running the tests, make sure you have:

1. Python 3.x installed
2. Python venv module installed (usually comes with Python 3.x)
3. Django and required packages installed
4. Backend server properly configured

## Setting Up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend/genfit_django
   ```

2. Create and activate a virtual environment:
   ```bash
   # Create a new virtual environment
   python -m venv venv

   # Activate the virtual environment
   # On Windows:
   .\venv\Scripts\activate
   # On Unix or MacOS:
   # source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply migrations:
   ```bash
   python manage.py migrate
   ```

Note: Always ensure your virtual environment is activated when working with the project. You'll know it's activated when you see `(venv)` at the beginning of your command prompt.

## Running Tests

To run all tests:
```bash
python manage.py test api.tests
```

To run a specific test file:
```bash
python manage.py test api.tests.test_profile
```

To run a specific test class:
```bash
python manage.py test api.tests.test_profile.ProfileTests
```

To run a specific test method:
```bash
python manage.py test api.tests.test_profile.ProfileTests.test_get_profile
```

## Test Structure

Our tests are organized by feature/functionality. Each test file focuses on a specific aspect of the API:

- `test_auth.py`: Authentication-related tests (registration, login, logout)
- `test_profile.py`: User profile management tests

## Writing New Tests

### Test File Structure

1. Create a new test file with the prefix `test_` (e.g., `test_feature.py`)
2. Import required modules:
   ```python
   from django.test import TestCase, Client
   from django.urls import reverse
   from rest_framework import status
   from api.models import YourModel
   ```

3. Create a test class inheriting from TestCase:
   ```python
   class YourFeatureTests(TestCase):
       def setUp(self):
           # Setup test data
           self.client = Client()
           
       def test_your_feature(self):
           # Your test code here
           pass
   ```

### Best Practices

1. Use descriptive test method names that explain what is being tested
2. Add docstrings to test methods explaining the test scenario
3. Setup required test data in the `setUp` method
4. Use Django's test client for making HTTP requests
5. Use appropriate assertions to verify expected outcomes
6. Test both successful and error scenarios

### Example Test

```python
def test_feature_success(self):
    """Test successful feature operation"""
    # Setup test data if needed
    test_data = {
        'field1': 'value1',
        'field2': 'value2'
    }
    
    # Make the API request
    response = self.client.post(
        reverse('your-endpoint'),
        test_data,
        content_type='application/json'
    )
    
    # Assert the response
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data['field1'], 'value1')
```

## Common Assertions

- `assertEqual(a, b)`: Verify that a equals b
- `assertTrue(x)`: Verify that x is True
- `assertFalse(x)`: Verify that x is False
- `assertIn(a, b)`: Verify that a is in b
- `assertRaises(exception)`: Verify that an exception is raised


## Troubleshooting

1. Make sure the backend server is properly configured
2. Check that all required dependencies are installed
3. Ensure database migrations are up to date
4. Verify that test database settings are correct