"""
Health check endpoint for load balancer monitoring
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Simple health check endpoint for load balancer.
    Returns 200 OK if the service is running.
    """
    return JsonResponse({
        "status": "healthy",
        "service": "genfit-backend"
    }, status=200)

