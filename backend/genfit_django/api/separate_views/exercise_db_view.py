"""
ExerciseDB API Integration with Rate Limiting
Allows users to search exercises from ExerciseDB API with controlled rate limiting
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from django.conf import settings
import requests
import logging
import time

logger = logging.getLogger(__name__)

# Rate limiting configuration: 5 requests per hour per user
RATE_LIMIT_REQUESTS = 5
RATE_LIMIT_PERIOD = 3600  # 1 hour in seconds


def check_rate_limit(user_id):
    """
    Check if user has exceeded rate limit
    Returns (allowed, remaining, reset_time)
    """
    cache_key = f'exercisedb_rate_limit_{user_id}'
    cache_time_key = f'exercisedb_rate_limit_time_{user_id}'
    
    # Get current request count and timestamp from cache
    request_data = cache.get(cache_key)
    start_time = cache.get(cache_time_key)
    
    if request_data is None:
        # First request, initialize counter and timestamp
        current_time = time.time()
        cache.set(cache_key, 1, RATE_LIMIT_PERIOD)
        cache.set(cache_time_key, current_time, RATE_LIMIT_PERIOD)
        return True, RATE_LIMIT_REQUESTS - 1, RATE_LIMIT_PERIOD
    
    if request_data >= RATE_LIMIT_REQUESTS:
        # Rate limit exceeded - calculate remaining time
        current_time = time.time()
        elapsed = current_time - (start_time or current_time)
        ttl = max(0, int(RATE_LIMIT_PERIOD - elapsed))
        return False, 0, ttl
    
    # Increment counter
    cache.incr(cache_key)
    
    # Calculate remaining time
    current_time = time.time()
    elapsed = current_time - (start_time or current_time)
    ttl = max(0, int(RATE_LIMIT_PERIOD - elapsed))
    
    return True, RATE_LIMIT_REQUESTS - request_data - 1, ttl


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_exercises(request):
    """
    Search exercises from ExerciseDB API
    
    Query parameters:
    - name: Filter by exercise name (fuzzy search)
    - bodyParts: Filter by body parts (comma-separated)
    - equipments: Filter by equipment (comma-separated)
    - keywords: Filter by keywords (comma-separated)
    - limit: Maximum results to return (1-25, default: 10)
    """
    
    # Check rate limit
    allowed, remaining, reset_time = check_rate_limit(request.user.id)
    
    if not allowed:
        return Response({
            'error': 'Rate limit exceeded',
            'message': f'You have exceeded the rate limit. Please try again in {reset_time} seconds.',
            'remaining_requests': 0,
            'reset_in_seconds': reset_time
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    # Get API credentials from settings
    api_key = getattr(settings, 'EXERCISEDB_API_KEY', None)
    api_host = getattr(settings, 'EXERCISEDB_API_HOST', 'exercisedb-api1.p.rapidapi.com')
    
    # TEMPORARY DEBUG LOGGING - REMOVE AFTER FIXING (LOGS SENSITIVE DATA)
    import os
    env_key = os.environ.get('EXERCISEDB_API_KEY', 'NOT_SET')
    logger.warning(f"DEBUG: Environment EXERCISEDB_API_KEY = '{env_key}'")
    logger.warning(f"DEBUG: Settings EXERCISEDB_API_KEY = '{api_key}'")
    logger.warning(f"DEBUG: GROQ_API_KEY for comparison = '{os.environ.get('GROQ_API_KEY', 'NOT_SET')[:10]}...'")
    
    if not api_key:
        logger.error("EXERCISEDB_API_KEY not configured in settings")
        return Response({
            'error': 'API configuration error',
            'message': 'Exercise database service is not properly configured'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    # Log API key status for debugging (only first/last chars for security)
    logger.info(f"Using ExerciseDB API - Key length: {len(api_key)}, First 4: {api_key[:4]}..., Last 4: ...{api_key[-4:]}")
    
    # Build query parameters from request
    query_params = {}
    
    if 'name' in request.query_params:
        query_params['name'] = request.query_params['name']
    
    if 'bodyParts' in request.query_params:
        query_params['bodyParts'] = request.query_params['bodyParts']
    
    if 'equipments' in request.query_params:
        query_params['equipments'] = request.query_params['equipments']
    
    if 'keywords' in request.query_params:
        query_params['keywords'] = request.query_params['keywords']
    
    # Limit results (enforce maximum of 25)
    limit = request.query_params.get('limit', '10')
    try:
        limit = min(int(limit), 25)
    except ValueError:
        limit = 10
    query_params['limit'] = str(limit)
    
    # Make request to ExerciseDB API
    url = "https://exercisedb-api1.p.rapidapi.com/api/v1/exercises"
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": api_host
    }
    
    try:
        logger.info(f"Making ExerciseDB API request to: {url}")
        response = requests.get(url, headers=headers, params=query_params, timeout=10)
        
        # Log response status for debugging
        logger.info(f"ExerciseDB API response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"ExerciseDB API returned status {response.status_code}: {response.text[:500]}")
        
        response.raise_for_status()
        
        data = response.json()
        
        # Add rate limit info to response
        return Response({
            'success': True,
            'data': data.get('data', []),
            'meta': data.get('meta', {}),
            'rate_limit': {
                'remaining_requests': remaining,
                'reset_in_seconds': reset_time
            }
        }, status=status.HTTP_200_OK)
        
    except requests.exceptions.Timeout:
        logger.error("ExerciseDB API request timeout")
        return Response({
            'error': 'Request timeout',
            'message': 'The exercise database is taking too long to respond. Please try again.'
        }, status=status.HTTP_504_GATEWAY_TIMEOUT)
        
    except requests.exceptions.RequestException as e:
        # Enhanced error logging with response details
        error_msg = f"ExerciseDB API request failed: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" | Status: {e.response.status_code} | Response: {e.response.text[:500]}"
        logger.error(error_msg)
        
        return Response({
            'error': 'External API error',
            'message': 'Failed to fetch exercises. Please try again later.'
        }, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        logger.error(f"Unexpected error in search_exercises: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercise_filters(request):
    """
    Get available filters for exercise search (body parts, equipment, etc.)
    This endpoint doesn't count against rate limit as it returns static data
    """
    
    # Cache filter data for 24 hours to avoid unnecessary API calls
    cache_key = 'exercisedb_filters'
    cached_filters = cache.get(cache_key)
    
    if cached_filters:
        return Response(cached_filters, status=status.HTTP_200_OK)
    
    api_key = getattr(settings, 'EXERCISEDB_API_KEY', None)
    api_host = getattr(settings, 'EXERCISEDB_API_HOST', 'exercisedb-api1.p.rapidapi.com')
    
    if not api_key:
        return Response({
            'error': 'API configuration error'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": api_host
    }
    
    try:
        # Fetch all filter options
        bodyparts_url = "https://exercisedb-api1.p.rapidapi.com/api/v1/bodyparts"
        equipments_url = "https://exercisedb-api1.p.rapidapi.com/api/v1/equipments"
        
        bodyparts_response = requests.get(bodyparts_url, headers=headers, timeout=10)
        equipments_response = requests.get(equipments_url, headers=headers, timeout=10)
        
        bodyparts_response.raise_for_status()
        equipments_response.raise_for_status()
        
        filter_data = {
            'bodyParts': bodyparts_response.json().get('data', []),
            'equipments': equipments_response.json().get('data', [])
        }
        
        # Cache for 24 hours (86400 seconds)
        cache.set(cache_key, filter_data, 86400)
        
        return Response(filter_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Failed to fetch exercise filters: {str(e)}")
        return Response({
            'error': 'Failed to fetch filters',
            'message': 'Could not load filter options'
        }, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exercise_detail(request, exercise_id):
    """
    Get detailed information for a specific exercise by ID
    This endpoint is also rate-limited
    
    Path parameter:
    - exercise_id: The unique identifier for the exercise
    """
    
    # Check rate limit
    allowed, remaining, reset_time = check_rate_limit(request.user.id)
    
    if not allowed:
        return Response({
            'error': 'Rate limit exceeded',
            'message': f'You have exceeded the rate limit. Please try again in {reset_time} seconds.',
            'remaining_requests': 0,
            'reset_in_seconds': reset_time
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    # Get API credentials from settings
    api_key = getattr(settings, 'EXERCISEDB_API_KEY', None)
    api_host = getattr(settings, 'EXERCISEDB_API_HOST', 'exercisedb-api1.p.rapidapi.com')
    
    if not api_key:
        logger.error("EXERCISEDB_API_KEY not configured in settings")
        return Response({
            'error': 'API configuration error',
            'message': 'Exercise database service is not properly configured'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    # Log API key status for debugging (only first/last chars for security)
    logger.info(f"Using ExerciseDB API for detail - Key length: {len(api_key)}, First 4: {api_key[:4]}..., Last 4: ...{api_key[-4:]}")
    
    # Make request to ExerciseDB API for specific exercise
    url = f"https://exercisedb-api1.p.rapidapi.com/api/v1/exercises/{exercise_id}"
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": api_host
    }
    
    try:
        logger.info(f"Making ExerciseDB API detail request to: {url}")
        response = requests.get(url, headers=headers, timeout=10)
        
        # Log response status for debugging
        logger.info(f"ExerciseDB API detail response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"ExerciseDB API returned status {response.status_code}: {response.text[:500]}")
        
        response.raise_for_status()
        
        data = response.json()
        
        # Add rate limit info to response
        return Response({
            'success': True,
            'data': data.get('data', {}),
            'rate_limit': {
                'remaining_requests': remaining,
                'reset_in_seconds': reset_time
            }
        }, status=status.HTTP_200_OK)
        
    except requests.exceptions.Timeout:
        logger.error("ExerciseDB API request timeout")
        return Response({
            'error': 'Request timeout',
            'message': 'The exercise database is taking too long to respond. Please try again.'
        }, status=status.HTTP_504_GATEWAY_TIMEOUT)
        
    except requests.exceptions.RequestException as e:
        # Enhanced error logging with response details
        error_msg = f"ExerciseDB API detail request failed: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_msg += f" | Status: {e.response.status_code} | Response: {e.response.text[:500]}"
        logger.error(error_msg)
        
        return Response({
            'error': 'External API error',
            'message': 'Failed to fetch exercise details. Please try again later.'
        }, status=status.HTTP_502_BAD_GATEWAY)
    except Exception as e:
        logger.error(f"Unexpected error in get_exercise_detail: {str(e)}")
        return Response({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rate_limit_status(request):
    """
    Get current rate limit status for the authenticated user
    """
    cache_key = f'exercisedb_rate_limit_{request.user.id}'
    cache_time_key = f'exercisedb_rate_limit_time_{request.user.id}'
    
    request_count = cache.get(cache_key, 0)
    start_time = cache.get(cache_time_key)
    
    # Calculate remaining time
    if start_time:
        current_time = time.time()
        elapsed = current_time - start_time
        ttl = max(0, int(RATE_LIMIT_PERIOD - elapsed))
    else:
        ttl = RATE_LIMIT_PERIOD
    
    return Response({
        'requests_made': request_count,
        'requests_remaining': max(0, RATE_LIMIT_REQUESTS - request_count),
        'limit': RATE_LIMIT_REQUESTS,
        'reset_in_seconds': ttl,
        'period_hours': RATE_LIMIT_PERIOD / 3600
    }, status=status.HTTP_200_OK)

