import requests
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_location_from_ip(request):
    """
    Get region name from an IP address using ip-api.com
    If no IP is provided, the request's IP address will be used
    If the IP is private, use the server's public IP instead.
    
    Authentication required: This endpoint requires a valid user session or token authentication
    """
    ip_address = request.GET.get('ip', request.META.get('REMOTE_ADDR'))
    private_prefixes = (
        '127.', '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.',
        '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.'
    )
    if ip_address.startswith(private_prefixes):
        try:
            ip_address = requests.get('https://api.ipify.org').text.strip()
        except Exception as e:
            return JsonResponse({'error': 'Could not determine server public IP', 'details': str(e)}, status=500)
    try:
        # Call the ip-api.com API
        response = requests.get(f'http://ip-api.com/json/{ip_address}')
        
        # Check if the request was successful
        if response.status_code == 200:
            data = response.json()
            # Check if the API returned a successful response
            if data.get('status') == 'success':
                # Only return the region name
                region_name = data.get('regionName', '')
                return JsonResponse({'region': region_name})
            else:
                return JsonResponse({
                    'error': 'Could not get location data',
                    'message': data.get('message', 'Unknown error')
                }, status=400)
        else:
            return JsonResponse({
                'error': 'API request failed',
                'status_code': response.status_code
            }, status=500)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 