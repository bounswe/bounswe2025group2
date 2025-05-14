from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import requests

@api_view(['POST'])
def parse_food(request):
    APP_ID = "57eefa2c"
    APP_KEY = "3f4e4b38dcc594441858a7811ebcb747"

    user_input = request.data.get('query')
    
    # ✅ Validate input
    if not user_input:
        return Response({'error': 'Missing query'}, status=status.HTTP_400_BAD_REQUEST)

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
        return Response(response.json(), status=response.status_code)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
