from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch
import json

class ParseFoodTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('parse_food')  
        self.query = "1 banana and 2 boiled eggs"
        self.mock_response_data = {
            "foods": [
                {
                    "food_name": "banana",
                    "nf_calories": 105,
                    "nf_protein": 1.3,
                    "nf_total_carbohydrate": 27,
                    "nf_total_fat": 0.3
                },
                {
                    "food_name": "boiled egg",
                    "nf_calories": 78,
                    "nf_protein": 6.3,
                    "nf_total_carbohydrate": 0.6,
                    "nf_total_fat": 5.3
                }
            ]
        }

    # Patch the correct path to the 'requests.post' method
    @patch('api.separate_views.parse_food.requests.post')
    def test_parse_food_success(self, mock_post):
        """Test parsing food query with a successful Nutritionix API response"""
        # Mock the response of requests.post
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = self.mock_response_data

        response = self.client.post(
            self.url,
            data=json.dumps({"query": self.query}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('foods', response.json())
        self.assertEqual(len(response.json()['foods']), 2)
        self.assertEqual(response.json()['foods'][0]['food_name'], 'banana')

    def test_parse_food_missing_query(self):
        """Test endpoint with missing query key"""
        response = self.client.post(
            self.url,
            data=json.dumps({}),  # No 'query' field
            content_type='application/json'
        )

       
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())