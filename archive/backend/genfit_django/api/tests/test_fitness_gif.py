from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status

class FitnessGifAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('get_fitness_gif')

    def test_fitness_gif_success(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('gif_url', response.json())
        self.assertTrue(response.json()['gif_url'].startswith('http'))
