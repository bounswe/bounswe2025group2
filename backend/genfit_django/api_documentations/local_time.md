
# Loacl Time API Documentation

This document provides comprehensive details about the Fitness Goals API for front-end integration.

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Table of Contents
- [Get Local Time](#get-local-time)


### Get Local Time

Returns the info related to local time of caller

- **URL**: `/localtime/<latitude>/<longitude>`
- **Method**: `GET`
- **Auth Required**: No

**Request Body**: _None_

**Response**:

- **Success (200)**
```json
{
    "latitude": 41.0267, //your latitude according to ip address
    "longitude": 29.0125, //your longitude according to ip address
    "timezone": "Europe/Istanbul", //your timezone
    "local_time": "2025-05-13T12:23:50.4535226" // local time of yours
}
```