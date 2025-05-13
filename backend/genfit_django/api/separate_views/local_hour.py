import logging
import requests
from datetime import timedelta
from django.core.cache import cache

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_local_hour(request, lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
        
        # Create a cache key based on coordinates (rounded to 2 decimal places for better cache hits)
        cache_key = f"local_time_{round(lat, 2)}_{round(lon, 2)}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            logger.debug(f"Returning cached result for {lat}, {lon}")
            return Response(cached_result, status=status.HTTP_200_OK)
        
        # Set a timeout for the external API request to prevent hanging
        try:
            time_res = requests.get(
                f"https://timeapi.io/api/time/current/coordinate?latitude={lat}&longitude={lon}",
                timeout=5  # 5 seconds timeout
            )
            time_data = time_res.json()
            logger.debug(f"time res: {time_res.status_code} time data: {time_data}")
            
            if 'dateTime' not in time_data:
                return Response({'error': 'Could not fetch time data.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            result = {
                'latitude': lat,
                'longitude': lon,
                'timezone': time_data['timeZone'],
                'local_time': time_data['dateTime']
            }
            
            # Cache the result for 1 hour
            cache.set(cache_key, result, timeout=3600)  # 3600 seconds = 1 hour
            
            return Response(result, status=status.HTTP_200_OK)
            
        except requests.Timeout:
            logger.error(f"Timeout when fetching time data for {lat}, {lon}")
            return Response(
                {'error': 'The time service is currently unavailable. Please try again later.'}, 
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
            
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return Response(
            {'error': 'Error connecting to time service.'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_local_hour: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

