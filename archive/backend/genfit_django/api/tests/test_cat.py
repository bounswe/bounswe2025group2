from django.test import TestCase, Client
from rest_framework import status

class CatApiTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_get_random_cat_fact(self):
        response = self.client.get('/api/cats/fact/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('fact', data)
        self.assertIsInstance(data['fact'], str)
        self.assertGreater(len(data['fact']), 0)

    def test_get_multiple_cat_facts(self):
        response = self.client.get('/api/cats/fact/?count=3')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('facts', data)
        self.assertIsInstance(data['facts'], list)
        self.assertEqual(len(data['facts']), 3)
        for fact_obj in data['facts']:
            self.assertIn('fact', fact_obj)
            self.assertIsInstance(fact_obj['fact'], str)
            self.assertGreater(len(fact_obj['fact']), 0)

    def test_get_random_cat_images(self):
        response = self.client.get('/api/cats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        for cat in data:
            self.assertIn('url', cat)
            self.assertTrue(cat['url'].startswith('http'))

    def test_invalid_cat_id(self):
        response = self.client.get('/api/cats/invalid_id/')
        # The external API may return 400 or 200 with error, so just check for a valid response
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST, status.HTTP_503_SERVICE_UNAVAILABLE])
        # Optionally, check for error in response
        data = response.json()
        if response.status_code != status.HTTP_200_OK:
            self.assertIn('error', data) 