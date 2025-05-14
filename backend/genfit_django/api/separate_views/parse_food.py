import requests
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt
import os

@csrf_exempt
@api_view(['POST'])
def parse_food(request):
    APP_ID = "57eefa2c" #os.getenv("NUTRITIONIX_APP_ID")
    APP_KEY = "3f4e4b38dcc594441858a7811ebcb747" #os.getenv("NUTRITIONIX_APP_KEY")
   

    user_input = request.data.get('query')

    try:
        response = requests.post(
            'https://trackapi.nutritionix.com/v2/natural/nutrients',
            json={'query': user_input},
            headers={
                'x-app-id': APP_ID,
                'x-app-key': APP_KEY,
                'Content-Type': 'application/json'
            }
        )
        return JsonResponse(response.json(), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
