from django.test.runner import DiscoverRunner
from django.conf import settings
from django.test.utils import get_runner
import sys
import django

def run_tests():
    # Setup Django settings
    django.setup()
    
    # Get the test runner class from settings
    TestRunner = get_runner(settings)
    
    # Instantiate the test runner
    test_runner = TestRunner(verbosity=2, interactive=True)
    
    # Run the tests
    failures = test_runner.run_tests(['api.tests'])
    
    # Return the number of failures
    return failures

if __name__ == '__main__':
    failures = run_tests()
    sys.exit(bool(failures))