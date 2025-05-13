import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import requests

logger = logging.getLogger(__name__)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_local_hour(request, lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
        # Step 3: Get local time using timezone
        time_res = requests.get(f"https://timeapi.io/api/time/current/coordinate?latitude={lat}&longitude={lon}")
        time_data = time_res.json()
        logger.debug(f"time res: {time_res} time data: {time_data}")

        if 'dateTime' not in time_data:
            return Response({'error': 'Could not fetch time data.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        result = {
            'latitude': lat,
            'longitude': lon,
            'timezone': time_data['timeZone'],
            'local_time': time_data['dateTime']
        }

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

