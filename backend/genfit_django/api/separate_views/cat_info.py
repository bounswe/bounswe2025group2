import logging
import requests
from django.core.cache import cache

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cat_info(request, cat_id=None):
    """
    Get cat information from an external API.
    If cat_id is provided, returns specific cat information.
    Otherwise, returns a list of random cats.
    """
    try:
        # Create a cache key
        cache_key = f"cat_info_{cat_id}" if cat_id else "cat_info_random"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            logger.debug(f"Returning cached result for cat info")
            return Response(cached_result, status=status.HTTP_200_OK)
        
        # Set the base URL
        base_url = "https://api.thecatapi.com/v1/images/search"
        
        # If cat_id is provided, get specific cat info
        if cat_id:
            url = f"{base_url}/{cat_id}"
        else:
            # Otherwise get random cats (limit to 10)
            url = f"{base_url}?limit=10"
        
        # Set a timeout for the external API request to prevent hanging
        try:
            cat_res = requests.get(
                url,
                timeout=30  # 30 seconds timeout
            )

            if cat_res.status_code != 200:
                return Response({"error": "Unable to fetch cat information"}, status=status.HTTP_400_BAD_REQUEST)
            
            cat_data = cat_res.json()
            logger.debug(f"cat res: {cat_res.status_code}")
            
            # Process the response and create a formatted result
            if cat_id:
                result = {
                    'cat_id': cat_id,
                    'url': cat_data.get('url'),
                    'width': cat_data.get('width'),
                    'height': cat_data.get('height'),
                    'breeds': cat_data.get('breeds', [])
                }
            else:
                result = [{
                    'cat_id': cat.get('id'),
                    'url': cat.get('url'),
                    'width': cat.get('width'),
                    'height': cat.get('height')
                } for cat in cat_data]
            
            # Cache the result for 5 minutes
            cache.set(cache_key, result, timeout=300)  # 300 seconds = 5 minutes
            
            return Response(result, status=status.HTTP_200_OK)
            
        except requests.Timeout:
            logger.error(f"Timeout when fetching cat data")
            return Response(
                {'error': 'The cat service is currently unavailable. Please try again later.'}, 
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
            
    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return Response(
            {'error': 'Error connecting to cat service.'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error in get_cat_info: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cat_fact(request):
    """
    Get random cat facts from cat fact API.
    Accepts optional query parameter 'count' to retrieve multiple facts.
    """
    try:
        # Check if count parameter is provided
        count = request.query_params.get('count', '1')
        try:
            count = int(count)
            if count < 1 or count > 10:  # Limit to reasonable range
                count = 1
        except ValueError:
            count = 1

        use_cache = count > 1
        cache_key = f"cat_fact_random_{count}"
        cached_result = cache.get(cache_key) if use_cache else None

        if use_cache and cached_result:
            logger.debug(f"Returning cached result for {count} cat facts")
            return Response(cached_result, status=status.HTTP_200_OK)

        # Set the URL for cat facts API
        if count == 1:
            url = "https://catfact.ninja/fact"
        else:
            url = f"https://catfact.ninja/facts?limit={count}"

        # Set a timeout for the external API request to prevent hanging
        try:
            fact_res = requests.get(
                url,
                timeout=30  # 30 seconds timeout
            )

            if fact_res.status_code != 200:
                return Response({"error": "Unable to fetch cat fact"}, status=status.HTTP_400_BAD_REQUEST)

            fact_data = fact_res.json()
            logger.debug(f"cat fact res: {fact_res.status_code}")

            if count == 1:
                result = {
                    'fact': fact_data.get('fact'),
                    'length': fact_data.get('length')
                }
            else:
                result = {
                    'facts': fact_data.get('data', []),
                    'count': len(fact_data.get('data', [])),
                    'total': fact_data.get('total')
                }

            # Cache the result for 5 minutes (only for multiple facts)
            if use_cache:
                cache.set(cache_key, result, timeout=300)  # 300 seconds = 5 minutes

            return Response(result, status=status.HTTP_200_OK)

        except requests.Timeout:
            logger.error("Timeout when fetching cat fact")
            return Response(
                {'error': 'The cat fact service is currently unavailable. Please try again later.'}, 
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )

    except requests.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return Response(
            {'error': 'Error connecting to cat fact service.'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error in get_cat_fact: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 