# Search Challenges API

Query your challenge catalogue with flexible filters for activity status, user participation, age range and geographical proximity.

---

## Endpoints

| Method | Path                      | Description                                                           |
| ------ | ------------------------- | --------------------------------------------------------------------- |
| `GET`  | `/api/challenges/search/` | Search challenges with the filters below. *(Requires authentication)* |

---

## Query Parameters

| Name                 | Type    | Default | Description                                                                                                                   |
| -------------------- | ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `is_active`          | boolean | —       | `true` → only challenges currently in progress (`start_date ≤ now ≤ end_date`).`false` → upcoming or past challenges.         |
| `user_participating` | boolean | —       | `true` → challenges that **include** the authenticated user in `participants`.`false` → challenges that **exclude** the user. |
| `min_age`            | integer | —       | Lower age bound; returns challenges whose `min_age ≥` this value.                                                             |
| `max_age`            | integer | —       | Upper age bound; returns challenges whose `max_age ≤` this value.                                                             |
| `location`           | string  | —       | Free‑form place or address; server geocodes to lat/lon, then applies radius filter.                                           |
| `radius_km`          | number  | `10`    | Search radius *in kilometres* around `location`. Ignored if `location` is not supplied.                                       |

---

## Filtering Logic (server‑side)

1. **Activity status** is evaluated against the server’s current time (`timezone.now()`).
2. **Participation** checks the many‑to‑many relation `participants__user`.
3. **Age** filters compare `min_age`, `max_age` fields defined on each `Challenge`.
4. **Proximity**:

   * `location` → geocoded to `(lat, lon)`.
   * An initial bounding box (≈ `radius_km / 111.32` degrees) prunes DB results.
   * Each candidate is validated with a Haversine distance check (`≤ radius_km`).

---

## Successful Response – `200 OK`

```jsonc
[
  {
    "id": 42,
    "title": "10K Spring Run",
    "description": "Run 10 km every day for a month.",
    "start_date": "2025-04-01T00:00:00Z",
    "end_date": "2025-04-30T23:59:59Z",
    "min_age": 16,
    "max_age": 60,
    "latitude": 41.0082,
    "longitude": 28.9784,
    "is_user_participating": true
    // …additional fields from `ChallengeSerializer`
  }
]
```

### Error Codes

| Status             | Meaning                                                        | Common Causes |
| ------------------ | -------------------------------------------------------------- | ------------- |
| `400 Bad Request`  | Malformed or invalid parameter (e.g. non‑numeric `radius_km`). |               |
| `401 Unauthorized` | Missing or invalid auth credentials.                           |               |

---

## Examples

### Fetch active challenges within 5 km of Kadıköy that the user is already joining (ages 18‑30)

```bash
curl -G https://api.example.com/api/challenges/search/ \
  -H "Authorization: Bearer <token>" \
  --data-urlencode "is_active=true" \
  --data-urlencode "user_participating=true" \
  --data-urlencode "min_age=18" \
  --data-urlencode "max_age=30" \
  --data-urlencode "location=Kadıköy, Istanbul" \
  --data-urlencode "radius_km=5"
```

### Django URLConf snippet

```python
from django.urls import path
from .views import search_challenges

urlpatterns = [
    path('api/challenges/search/', search_challenges, name='search-challenges'),
]
```

---

## Notes & Tips

* The endpoint is read‑only (`GET`)—trying to POST/PUT will return `405 Method Not Allowed`.
* `radius_km` values much larger than \~50 km may slow the Haversine pass; consider a dedicated geospatial index if proximity queries are critical.
* Internally the helper `geocode_location()` should cache or rate‑limit calls to your geocoding provider.
* Extend `ChallengeSerializer` to inject computed fields (e.g. `distance_km`) if the client needs to display how far each challenge is from the searched location.

---

*Last updated: 12 May 2025*
