## PreLeave Backend API Documentation

### Overview

- **Base URL (dev)**: `http://localhost:3000`
- **Transport**: HTTPS/HTTP REST (JSON)
- **Global response shape**: all endpoints try to follow

```json
{
  "success": true,
  "data": { },
  "error": "Error message if any"
}
```

- **Auth model**:
  - On **register** and **login**, backend returns a short‑lived **access token** (JWT) in the JSON response.
  - It also sets a long‑lived **refresh token** JWT in an `httpOnly` cookie named `refreshToken`.
  - Protected endpoints require an `Authorization: Bearer <accessToken>` header.
  - There is currently **no explicit `/auth/refresh` endpoint**.

---

## Authentication

### POST `/auth/register`

Create a new user and immediately log them in.

- **Request body**

```json
{
  "email": "user@example.com",
  "password": "at-least-6-chars"
}
```

- **Validation**
  - `email`: must be a valid email.
  - `password`: min length 6.

- **Success (201)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com"
    },
    "accessToken": "jwt-access-token"
  }
}
```

- **Side effects**
  - Sets `refreshToken` cookie with:
    - `httpOnly: true`
    - `secure: true`
    - `sameSite: "none"`
    - `maxAge: 7 days`

- **Error responses**
  - `400` – validation failed (`details` is Zod errors array).
  - `409` – user already exists.
  - `500` – database or internal error.

---

### POST `/auth/login`

Log in an existing user.

- **Request body**

```json
{
  "email": "user@example.com",
  "password": "non-empty"
}
```

- **Validation**
  - `email`: valid email.
  - `password`: required, non-empty.

- **Success (200)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com"
    },
    "accessToken": "jwt-access-token"
  }
}
```

- **Side effects**
  - Sets `refreshToken` cookie with:
    - `httpOnly: true`
    - `secure: process.env.NODE_ENV === "production"`
    - `sameSite: "strict"`
    - `maxAge: 7 days`

- **Error responses**
  - `400` – validation failed.
  - `401` – invalid credentials (generic message; does not reveal which field).
  - `500` – internal server error.

---

### POST `/auth/logout`

Log out user by clearing the refresh token cookie.

- **Request body**: none.
- **Headers**: none required.
- **Success (200)**

```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

- **Side effects**
  - Clears `refreshToken` cookie with:
    - `httpOnly: true`
    - `secure: true`
    - `sameSite: "none"`

---

## User

### GET `/users/profile`

Mocked profile endpoint (currently **not protected by auth**).

- **Request**: no body or headers required.

- **Success (200)**

```json
{
  "success": true,
  "data": {
    "username": "NiceguyLang",
    "email": "niceguy@example.com",
    "trips": [
      {
        "id": "1",
        "startAddress": "123 Main St",
        "destAddress": "456 Market St",
        "arrivalTime": "2026-03-08T10:00:00Z",
        "recommendedTransit": "bus"
      },
      {
        "id": "2",
        "startAddress": "789 Oak Ave",
        "destAddress": "321 Pine Rd",
        "arrivalTime": "2026-03-09T14:30:00Z",
        "recommendedTransit": "uber"
      }
    ]
  }
}
```

- **Notes**
  - Data is currently **hard-coded**, not pulled from DB.
  - Designed to match the `{ success, data, error }` pattern for the frontend while auth/DB are being developed.

---

## Trips (Protected)

All `/trips` routes are protected by `authMiddleware`.

- **Required header for all**:

```http
Authorization: Bearer <accessToken>
```

- If the header is missing or invalid:
  - `401` with `{ success: false, error: "Unauthorized: ..."` }

The common **Trip DTO** format returned by trip endpoints is:

```json
{
  "id": "trip-uuid",
  "userId": "user-uuid",
  "startAddress": "220 Grand Ave, Oakland CA 94610",
  "startLat": 37.8123,
  "startLng": -122.25,
  "destAddress": "5000 MacArthur Blvd, Oakland, CA 94613",
  "destLat": 37.8,
  "destLng": -122.18,
  "requiredArrivalTime": "2026-03-13T17:00:00.000Z",
  "reminderLeadMinutes": 60,
  "status": "pending",
  "recommendedTransit": "bus",
  "selectedTransit": "bus",
  "busEtaMinutes": 25,
  "carEtaMinutes": 15,
  "bufferMinutes": 5,
  "busLeaveBy": "2026-03-13T16:30:00.000Z",
  "carLeaveBy": "2026-03-13T16:40:00.000Z",
  "departureTime": "2026-03-13T16:35:00.000Z",
  "createdAt": "2026-03-13T15:00:00.000Z",
  "busAvailable": true,
  "carAvailable": true,
  "etaUpdatedAt": "2026-03-13T15:30:00.000Z"
}
```

Note: Internally the DB uses fields like `recommended_transit` and `uber_eta_minutes`; the controller maps them into the DTO above.

---

### Shared Trip Input Schema

Used by `/trips/preview` and `/trips` (create):

```json
{
  "startAddress": "220 Grand Ave, Oakland CA 94610",
  "startLat": 37.8123,
  "startLng": -122.25,
  "destAddress": "5000 MacArthur Blvd, Oakland, CA 94613",
  "destLat": 37.8,
  "destLng": -122.18,
  "arrivalTime": "2026-03-13T17:00:00.000Z",
  "reminderLeadMinutes": 60
}
```

- If `startLat`/`startLng` or `destLat`/`destLng` are omitted, the backend will geocode the addresses via HERE.
  - If geocoding fails:
    - `400` and `field` set to `"startAddress"` or `"destAddress"` with a clear message.
- If HERE cannot find any route:
  - `400` with error `"No route found between the two addresses..."`.
- If the computed leave times are already in the past (no option can get there on time):
  - `400` with error `"The arrival time is too soon..."`.

---

### POST `/trips/preview`

Calculate ETAs and recommendations **without saving to DB**.

- **Headers**

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

- **Body**: Trip input schema above.

- **Success (200)**

```json
{
  "success": true,
  "data": {
    "id": "preview",
    "userId": "user-uuid",
    "startAddress": "...",
    "startLat": 37.8123,
    "startLng": -122.25,
    "destAddress": "...",
    "destLat": 37.8,
    "destLng": -122.18,
    "requiredArrivalTime": "2026-03-13T17:00:00.000Z",
    "reminderLeadMinutes": 60,
    "status": "pending",
    "recommendedTransit": "bus",
    "selectedTransit": null,
    "busEtaMinutes": 25,
    "carEtaMinutes": 15,
    "bufferMinutes": 5,
    "busLeaveBy": "2026-03-13T16:30:00.000Z",
    "carLeaveBy": "2026-03-13T16:40:00.000Z",
    "departureTime": "2026-03-13T16:35:00.000Z",
    "createdAt": "2026-03-13T15:00:00.000Z",
    "busAvailable": true,
    "carAvailable": true,
    "etaUpdatedAt": null
  }
}
```

- **Errors**
  - `400` – validation or routing errors (see above).
  - `401` – unauthorized.
  - `500` – internal server error.

---

### POST `/trips`

Create and persist a trip after confirmation.

- **Headers**: same as `/trips/preview`.
- **Body**: same schema as `/trips/preview`.

- **Success (201)**

```json
{
  "success": true,
  "data": { }
}
```

`data` contains a Trip DTO as defined above.

- **Errors**
  - `400` – validation or routing errors.
  - `401` – unauthorized.
  - `500` – internal.

---

### GET `/trips`

Fetch upcoming and historical trips for the authenticated user.

- **Headers**: `Authorization: Bearer <accessToken>`

- **Success (200)**

```json
{
  "success": true,
  "data": {
    "upcoming": [ ],
    "history": [ ]
  }
}
```

`upcoming` and `history` are arrays of Trip DTOs.

- **Behavior**
  - Trips are ordered by `requiredArrivalTime` (soonest first).
  - Trips with `status` `"completed"` or `"cancelled"` always go to `history`.
  - Trips whose arrival time is more than 10 minutes in the past are:
    - Auto-marked as `completed` (DB update in background).
    - Returned under `history`.

---

### GET `/trips/:id`

Fetch a single trip by ID.

- **Headers**: `Authorization: Bearer <accessToken>`
- **Path params**: `id` – trip ID.

- **Success (200)**

```json
{
  "success": true,
  "data": { }
}
```

`data` is a Trip DTO.

- **Errors**
  - `401` – unauthorized (no or invalid token).
  - `404` – trip not found.
  - `403` – trip exists but belongs to another user.
  - `500` – internal error.

---

### PATCH `/trips/:id/complete`

Mark a trip as completed manually.

- **Headers**: `Authorization: Bearer <accessToken>`
- **Path params**: `id`.

- **Request body**: none.

- **Success (200)**

```json
{
  "success": true,
  "data": { }
}
```

`data` is a Trip DTO with `status: "completed"`.

- **Errors**
  - `401` – unauthorized.
  - `404` – trip not found.
  - `403` – forbidden (trip belongs to another user).
  - `500` – internal error.

---

### DELETE `/trips/:id`

Delete a trip.

- **Headers**: `Authorization: Bearer <accessToken>`
- **Path params**: `id`.

- **Request body**: none.

- **Success (200)**

```json
{
  "success": true,
  "data": { "id": "deleted-trip-id" }
}
```

- **Errors**
  - `401` – unauthorized.
  - `404` – trip not found.
  - `403` – forbidden (trip belongs to another user).
  - `500` – internal.

---

### POST `/trips/:id/refresh-eta`

Recalculate ETAs and recommendation for an existing trip.

- **Headers**: `Authorization: Bearer <accessToken>`
- **Path params**: `id`.
- **Body**: none.

- **Success (200)**

```json
{
  "success": true,
  "data": { }
}
```

`data` is an updated Trip DTO with refreshed ETA fields.

- **Behavior**
  - Re-fetches ETAs from HERE.
  - Updates internal fields like `recommendedTransit`, `busEtaMinutes`, `carEtaMinutes`, `busLeaveBy`, `carLeaveBy`, `departureTime`, `etaUpdatedAt`.
  - If recommendation changes, it's logged on the server.

- **Errors**
  - `401` – unauthorized.
  - `404` – trip not found or does not belong to user.
  - `500` – internal error.

---

## Autocomplete

### GET `/autocomplete?q=<query>`

Address autocomplete proxy to HERE API.

- **Query params**
  - `q`: string, **min length 3**. Shorter queries return an empty list without calling HERE.

- **Success (200)** – both in normal and some error conditions

```json
{
  "success": true,
  "data": [
    {
      "label": "220 Grand Ave, Oakland, CA 94610, United States",
      "address": {
        "label": "...",
        "countryCode": "...",
        "city": "...",
        "street": "...",
        "houseNumber": "...",
        "postalCode": "..."
      }
    }
  ]
}
```

- **Behavior**
  - If `q` is missing, not a string, or length < 3:
    - Returns `200` with `data: []`.
  - If HERE API fails (non-2xx):
    - Logs error and returns `200` with `data: []` to fail silently.
  - If `HERE_API_KEY` is missing:
    - `500` with `success: false` and `"Server configuration error"`.

- **Errors**
  - `500` – internal server error (unexpected exceptions).

---

## Push Notifications (Protected)

All `/push` routes require a valid access token.

### POST `/push/subscribe`

Register a web push subscription for the authenticated user.

- **Headers**

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

- **Body**

```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-auth-secret"
    }
  }
}
```

- **Success (201)**

```json
{
  "success": true,
  "data": { "message": "Subscribed successfully" }
}
```

- **Errors**
  - `401` – unauthorized (no or invalid token).
  - `500` – internal server error.

---

### DELETE `/push/unsubscribe`

Unregister web push subscription(s) for the authenticated user.

- **Headers**

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

- **Body options**

To remove a specific endpoint:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

To remove **all** subscriptions for the user:

```json
{ }
```

- **Success (200)**

```json
{
  "success": true,
  "data": { "message": "Unsubscribed successfully" }
}
```

- **Errors**
  - `401` – unauthorized.
  - `500` – internal error.

---

### POST `/push/test`

Send a test push notification to all of the user’s active subscriptions.

- **Headers**

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

- **Body**: none.

- **Success (200)**

```json
{
  "success": true,
  "message": "Test notification sent"
}
```

- **Behavior**
  - Fetches all `pushSubscription` records for the user.
  - Sends a notification with payload:

    ```json
    {
      "title": "🚗 Test Notification",
      "body": "This is a test push notification from PreLeave.",
      "icon": "/logo.png",
      "data": { "url": "/homepage" }
    }
    ```

- **Errors**
  - `401` – unauthorized.
  - `404` – if the user has no active subscriptions.
  - `500` – internal error.

---

## Health Check

### GET `/health`

Simple liveness & readiness probe.

- **Request**: no headers or body required.
- **Success (200)**

```json
{
  "success": true,
  "data": { "status": "ok" }
}
```

