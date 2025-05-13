from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import requests
@api_view(['GET'])
@permission_classes([AllowAny])
def get_local_hour(request):
    try:
        # Step 1: Get user's IP address (fallback for localhost/dev)
        ip = request.META.get('REMOTE_ADDR', '8.8.8.8')  # Use a public IP for testing
        # Optional: override with X-Forwarded-For if behind proxy
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]

        if ip.startswith('127.') or ip == '::1':
            ip = ''  # You can also use your own IP

        # Step 2: Get geolocation from IP
        geo_res = requests.get(f"http://ip-api.com/json/{ip}")
        geo_data = geo_res.json()
        print("geo res data:", geo_data)

        if geo_data['status'] != 'success':
            return Response({'error': 'Could not determine location.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        lat = geo_data['lat']
        lon = geo_data['lon']
        city = geo_data['city']
        timezone = geo_data['timezone']

        # Step 3: Get local time using timezone
        time_res = requests.get(f"https://timeapi.io/api/time/current/coordinate?latitude={lat}&longitude={lon}")
        print(time_res)
        time_data = time_res.json()
        print("time data: ", time_data)

        if 'dateTime' not in time_data:
            return Response({'error': 'Could not fetch time data.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        result = {
            'ip': ip,
            'latitude': lat,
            'longitude': lon,
            'timezone': timezone,
            'local_time': time_data['dateTime']
        }

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

