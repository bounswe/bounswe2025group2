# Mobile App API Configuration Update

## Overview
After setting up the load balancer with SSL, the mobile app needs to be updated to use the new HTTPS API endpoint.

## Current Configuration
The mobile app currently uses:
```
http://164.90.166.81:8000
```

## New Configuration
Update to use:
```
https://api.genfit.website
```

## Files to Update

### Option 1: If using a constants file

Look for a file like `mobile_frontend/src/constants/api.ts` or similar:

```typescript
// Before
export const API_BASE_URL = 'http://164.90.166.81:8000';

// After
export const API_BASE_URL = 'https://api.genfit.website';
```

### Option 2: If hardcoded in files

Search for all occurrences of `http://164.90.166.81:8000` in the mobile app:

```bash
cd mobile_frontend
grep -r "164.90.166.81:8000" src/
```

Example from `Register.tsx`:

```typescript
// Before
await fetch('http://164.90.166.81:8000/api/quotes/random/', { 
  method: 'GET',
  credentials: 'include',
});

// After
await fetch('https://api.genfit.website/api/quotes/random/', { 
  method: 'GET',
  credentials: 'include',
});
```

### Option 3: Using environment variables

If using `.env` file:

```bash
# .env
API_BASE_URL=https://api.genfit.website
```

Then in code:
```typescript
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.genfit.website';
```

## Search and Replace Command

To find all occurrences in the mobile app:

```bash
cd mobile_frontend
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "164.90.166.81" {} \;
```

## Important Notes

1. **HTTPS is required**: The new endpoint uses HTTPS, not HTTP
2. **No port number**: The API is now accessible on standard HTTPS port (443), so no `:8000` needed
3. **Credentials**: Keep `credentials: 'include'` for session cookies
4. **Testing**: Test thoroughly after updating, especially:
   - Login/Registration
   - API calls with authentication
   - File uploads (profile pictures)
   - WebSocket connections (if any)

## Android Network Security Configuration

If you encounter SSL/HTTPS issues on Android, you may need to update `android/app/src/main/AndroidManifest.xml`:

```xml
<application
  android:usesCleartextTraffic="false"
  ...>
```

And ensure `android/app/src/main/res/xml/network_security_config.xml` allows HTTPS:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <!-- For development only, remove in production -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

## iOS App Transport Security

For iOS, ensure `ios/mobile_frontend/Info.plist` doesn't have exceptions that would block HTTPS:

```xml
<!-- Remove or comment out NSAllowsArbitraryLoads if present -->
<!-- HTTPS should work by default -->
```

## Testing Checklist

After updating the API endpoint:

- [ ] App builds successfully
- [ ] Login works
- [ ] Registration works
- [ ] Profile picture upload works
- [ ] All API calls return data
- [ ] No SSL/certificate errors
- [ ] Session persistence works
- [ ] Logout works

## Rollback Plan

If issues occur, you can temporarily rollback by:

1. Keeping the old IP-based endpoint as fallback:
```typescript
const API_BASE_URL = 'https://api.genfit.website';
const FALLBACK_API_URL = 'http://164.90.166.81:8000';
```

2. Or use a feature flag to switch between endpoints during testing

## Support

If you encounter issues:
1. Check browser/app console for specific errors
2. Verify DNS is resolving: `nslookup api.genfit.website`
3. Test API directly: `curl https://api.genfit.website/api/health/`
4. Check backend logs: `docker logs genfit_backend`

