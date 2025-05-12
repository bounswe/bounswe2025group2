from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Quote
from django.utils import timezone
import requests
import json
from datetime import timedelta

ZENQUOTES_API_URL = "https://zenquotes.io/api"

def fetch_and_cache_quote():
    """Fetch a random quote from ZenQuotes API and cache it"""
    try:
        # Check if we have a recent quote (less than 15 seconds ago)
        recent_quote = Quote.objects.filter(
            fetched_at__gte=timezone.now() - timedelta(seconds=15)
        ).first()
        
        if recent_quote:
            return recent_quote
        
        # Fetch new quote from ZenQuotes
        response = requests.get(f"{ZENQUOTES_API_URL}/random")
        if response.status_code == 200:
            quote_data = response.json()[0]  # ZenQuotes returns an array
            
            # Create and save the new quote
            quote = Quote.objects.create(
                text=quote_data['q'],
                author=quote_data['a']
            )
            return quote
            
    except Exception as e:
        # If API call fails, return the most recent quote if available
        return Quote.objects.first()
    
    return None

def fetch_daily_quote():
    """Fetch the daily quote from ZenQuotes API and cache it"""
    try:
        # Check if we already have today's quote
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        daily_quote = Quote.objects.filter(fetched_at__gte=today_start).first()
        
        if daily_quote:
            return daily_quote
        
        # Fetch new daily quote from ZenQuotes
        response = requests.get(f"{ZENQUOTES_API_URL}/today")
        if response.status_code == 200:
            quote_data = response.json()[0]  # ZenQuotes returns an array
            
            # Create and save the new quote
            quote = Quote.objects.create(
                text=quote_data['q'],
                author=quote_data['a']
            )
            return quote
            
    except Exception as e:
        # If API call fails, return the most recent quote if available
        return Quote.objects.first()
    
    return None

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_random_quote(request):
    """Get a random motivational quote"""
    quote = fetch_and_cache_quote()
    if quote:
        return Response({
            'text': quote.text,
            'author': quote.author
        })
    return Response(
        {'error': 'Unable to fetch quote'}, 
        status=status.HTTP_503_SERVICE_UNAVAILABLE
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_daily_quote(request):
    """Get the quote of the day"""
    quote = fetch_daily_quote()
    if quote:
        return Response({
            'text': quote.text,
            'author': quote.author
        })
    return Response(
        {'error': 'Unable to fetch quote'}, 
        status=status.HTTP_503_SERVICE_UNAVAILABLE
    )