from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import requests

@api_view(['POST'])
def parse_food(request):
    API_KEY = "mgalw1GBmLc94pehwQZLKHFIIioHFEf2gQBOJZnI"

    user_input = request.data.get('query')    
   
    if not user_input:
        return Response({'error': 'Missing query'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Make request to USDA FoodData Central API
        response = requests.get(
            'https://api.nal.usda.gov/fdc/v1/foods/search',
            params={
                'api_key': API_KEY,
                'query': user_input,
                'pageSize': 10  # Limit to 10 results to reduce response size
            }
        )
        
        if response.status_code != 200:
            return Response({'error': 'Failed to fetch food data'}, status=response.status_code)
        
        data = response.json()
        
        # Simplify the response to return only essential information
        simplified_foods = []
        for food in data.get('foods', [])[:4]:  # Return only first 5 results
            # Extract key nutrients
            nutrients = {}
            for nutrient in food.get('foodNutrients', []):
                nutrient_name = nutrient.get('nutrientName', '')
                nutrient_value = nutrient.get('value', 0)
                nutrient_unit = nutrient.get('unitName', '')
                
                # Include only commonly needed nutrients
                if nutrient_name in [
                    'Energy', 'Protein', 'Total lipid (fat)', 
                    'Carbohydrate, by difference', 'Fiber, total dietary',
                    'Total Sugars', 'Sodium, Na', 'Potassium, K',
                    'Calcium, Ca', 'Iron, Fe', 'Vitamin C, total ascorbic acid',
                    'Cholesterol', 'Fatty acids, total saturated',
                    'Caffeine', 'Vitamin D (D2 + D3)', 'Vitamin E (alpha-tocopherol)',
                    'Vitamin B-12'
                ]:
                    nutrients[nutrient_name] = {
                        'value': nutrient_value,
                        'unit': nutrient_unit
                    }
            
            simplified_food = {
                'fdcId': food.get('fdcId'),
                'description': food.get('description', ''),
                'brandOwner': food.get('brandOwner', ''),
                'brandName': food.get('brandName', ''),
                'ingredients': food.get('ingredients', ''),
                'servingSize': food.get('servingSize'),
                'servingSizeUnit': food.get('servingSizeUnit', ''),
                'nutrients': nutrients
            }
            simplified_foods.append(simplified_food)
        
        simplified_response = {
            'totalHits': data.get('totalHits', 0),
            'query': user_input,
            'foods': simplified_foods
        }
        
        return Response(simplified_response, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
