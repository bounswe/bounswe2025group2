import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

GIPHY_API_URL = "https://api.giphy.com/v1/gifs/random"
GIPHY_API_KEY = "hE7mbxjW2XiXu3VsKHgerDDrWjBk1yzG" # Rate limited so can't really be misused

@api_view(['GET'])
@permission_classes([AllowAny])
def random_fitness_gif(request):
    """
    Returns a random fitness GIF from GIPHY.
    """
    params = {
        "api_key": GIPHY_API_KEY,
        "tag": "fitness"
    }
    try:
        response = requests.get(GIPHY_API_URL, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            gif_url = data.get('data', {}).get('images', {}).get('fixed_width', {}).get('url')
            if gif_url:
                return Response({"gif_url": gif_url}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "GIF not found in response."}, status=status.HTTP_502_BAD_GATEWAY)
        else:
            return Response({"error": "Failed to fetch GIF from GIPHY."}, status=status.HTTP_502_BAD_GATEWAY)
    except requests.Timeout:
        return Response({"error": "GIPHY API request timed out."}, status=status.HTTP_504_GATEWAY_TIMEOUT)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)