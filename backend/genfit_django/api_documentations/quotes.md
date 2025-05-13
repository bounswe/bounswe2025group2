# Motivational Quotes API Documentation

This documentation covers the endpoints for retrieving motivational quotes in the GenFit application.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Get Random Quote](#get-random-quote)
  - [Get Daily Quote](#get-daily-quote)
- [Response Format](#response-format)
- [Error Handling](#error-handling)

## Overview
The Quotes API provides access to motivational quotes that can be used to inspire users during their fitness journey. The API includes two main endpoints:
- Random quote generation with caching
- Daily quote that remains consistent throughout the day

## Endpoints

### Get Random Quote
```http
GET /api/quotes/random/
```

Retrieves a random motivational quote. The quote is cached for 15 seconds to prevent excessive API calls.

**Important:** Due to caching, you may receive the same quote if making multiple requests within the 15-second window.

#### Response
```json
{
    "text": "Your quote text here",
    "author": "Quote Author"
}
```

### Get Daily Quote
```http
GET /api/quotes/daily/
```

Retrieves the quote of the day. This quote remains consistent throughout the day for all users.

**Important:** The daily quote is cached for 24 hours and resets at midnight UTC. All users will receive the same quote during this period.

#### Response
```json
{
    "text": "Your daily quote text here",
    "author": "Quote Author"
}
```

## Response Format
All successful responses return a JSON object with the following structure:
```json
{
    "text": "string",    // The quote text
    "author": "string"  // The author of the quote
}
```

## Error Handling
In case of errors, the API will return appropriate HTTP status codes:

- `401 Unauthorized`: Invalid or missing authentication token
- `503 Service Unavailable`: Unable to fetch quote (usually due to external API issues)

Error Response Format:
```json
{
    "error": "Error message description"
}
```

Note: If the external quote service is unavailable, the system will attempt to return the most recently cached quote to ensure continuous service.