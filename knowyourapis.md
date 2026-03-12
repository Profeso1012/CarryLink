# CarryLink API Documentation - Phase 5 & 6

## Base URL
`http://localhost:5000/api/v1`

All responses include `success: true/false` and `data` or `error` fields.

---

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "display_name": "John Doe",
  "phone_number": "+234802000000",
  "country": "NG"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### POST /auth/login
Login to an existing account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### POST /auth/logout
Logout from current session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### GET /users/:id
Fetch public user profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "display_name": "Adaeze O.",
    "phone_number": "+234802000000",
    "country": "NG",
    "profile_picture_url": "https://...",
    "trust_score": 82.5,
    "is_verified_traveler": true,
    "kyc_status": "approved",
    "total_trips_as_traveler": 12,
    "total_shipments_as_sender": 8,
    "average_rating": 4.8,
    "badges": ["verified_traveler", "top_rated"],
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### GET /users/me
Fetch current authenticated user's full profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@example.com",
    "display_name": "Adaeze O.",
    "phone_number": "+234802000000",
    "country": "NG",
    "profile_picture_url": "https://...",
    "trust_score": 82.5,
    "kyc_status": "approved",
    "total_trips_as_traveler": 12,
    "total_shipments_as_sender": 8,
    "wallet_balance": 150.50,
    "wallet_currency": "USD",
    "badges": ["verified_traveler", "top_rated"]
  }
}
```

### PUT /users/me
Update current user's profile.

**Request:**
```json
{
  "display_name": "Adaeze Okafor",
  "phone_number": "+234802000001",
  "profile_picture_url": "https://..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "display_name": "Adaeze Okafor"
  }
}
```

---

## KYC Endpoints

### POST /kyc/start-verification
Initiate KYC verification process (using Didit).

**Request:**
```json
{
  "first_name": "Adaeze",
  "last_name": "Okafor",
  "id_type": "passport",
  "country": "NG"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "verification_url": "https://didit-verification-link.com",
    "kyc_request_id": "uuid"
  }
}
```

### GET /kyc/status
Get current KYC verification status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "approved",
    "id_type": "passport",
    "verified_name": "ADAEZE OKAFOR",
    "verified_at": "2024-01-20T10:00:00Z",
    "expires_at": "2026-01-20T10:00:00Z"
  }
}
```

---

## Categories Endpoints

### GET /categories
Get all available item categories.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "documents",
        "requires_approval": false,
        "restricted": false
      },
      {
        "id": "uuid",
        "name": "electronics",
        "requires_approval": false,
        "restricted": false
      },
      {
        "id": "uuid",
        "name": "alcohol",
        "requires_approval": true,
        "restricted": false
      },
      {
        "id": "uuid",
        "name": "weapons",
        "requires_approval": false,
        "restricted": true
      }
    ]
  }
}
```

---

## Travel Listings Endpoints

### POST /travel-listings
Create a new travel listing.

**Request:**
```json
{
  "origin_city": "Lagos",
  "origin_country": "NG",
  "destination_city": "Toronto",
  "destination_country": "CA",
  "departure_date": "2025-04-15T14:00:00Z",
  "arrival_date": "2025-04-16T10:00:00Z",
  "available_capacity_kg": 12,
  "price_per_kg": 11.00,
  "flat_fee": null,
  "currency": "USD",
  "airline": "Air Peace",
  "flight_number": "P71234",
  "allowed_categories": ["documents", "clothing", "electronics"],
  "notes": "Safe traveler, careful with items"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "listing_id": "uuid",
    "user_id": "uuid",
    "status": "active",
    "origin_city": "Lagos",
    "destination_city": "Toronto",
    "departure_date": "2025-04-15T14:00:00Z",
    "available_capacity_kg": 12,
    "price_per_kg": 11.00,
    "currency": "USD",
    "created_at": "2024-03-10T10:00:00Z"
  }
}
```

### GET /travel-listings/browse
Browse travel listings with filters.

**Query Params:**
- `origin_city` (string)
- `destination_city` (string)
- `departure_from` (date)
- `departure_to` (date)
- `min_capacity` (number)
- `max_price_per_kg` (number)
- `currency` (string)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "listing_id": "uuid",
        "user_id": "uuid",
        "traveler": {
          "display_name": "Adaeze O.",
          "profile_picture_url": "https://...",
          "trust_score": 82.5,
          "badges": ["verified_traveler"]
        },
        "origin_city": "Lagos",
        "destination_city": "Toronto",
        "departure_date": "2025-04-15T14:00:00Z",
        "available_capacity_kg": 12,
        "price_per_kg": 11.00,
        "flat_fee": null,
        "currency": "USD",
        "allowed_categories": ["documents", "clothing"],
        "is_verified_flight": true,
        "notes": "Safe traveler"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### GET /travel-listings/:id
Get a specific listing details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listing_id": "uuid",
    "user_id": "uuid",
    "traveler": {
      "display_name": "Adaeze O.",
      "profile_picture_url": "https://...",
      "trust_score": 82.5,
      "total_deliveries": 12,
      "badges": ["verified_traveler"]
    },
    "origin_city": "Lagos",
    "origin_country": "NG",
    "destination_city": "Toronto",
    "destination_country": "CA",
    "departure_date": "2025-04-15T14:00:00Z",
    "arrival_date": "2025-04-16T10:00:00Z",
    "available_capacity_kg": 12,
    "price_per_kg": 11.00,
    "flat_fee": null,
    "currency": "USD",
    "airline": "Air Peace",
    "flight_number": "P71234",
    "is_verified_flight": true,
    "allowed_categories": ["documents", "clothing", "electronics"],
    "reserved_capacity_kg": 3.5,
    "notes": "Safe traveler",
    "status": "active",
    "created_at": "2024-03-10T10:00:00Z"
  }
}
```

### GET /travel-listings/me
Get current user's travel listings.

**Query Params:**
- `status` (active, closed, expired, cancelled)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "listing_id": "uuid",
        "origin_city": "Lagos",
        "destination_city": "Toronto",
        "departure_date": "2025-04-15T14:00:00Z",
        "available_capacity_kg": 12,
        "reserved_capacity_kg": 3.5,
        "status": "active"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### PUT /travel-listings/:id
Update a travel listing.

**Request (any of these fields):**
```json
{
  "departure_date": "2025-04-15T14:00:00Z",
  "available_capacity_kg": 15,
  "price_per_kg": 12.00,
  "flat_fee": null,
  "currency": "USD",
  "airline": "Air Peace",
  "flight_number": "P71234",
  "allowed_categories": ["documents", "clothing"],
  "notes": "Updated notes"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listing_id": "uuid",
    "departure_date": "2025-04-15T14:00:00Z",
    "available_capacity_kg": 15,
    "price_per_kg": 12.00,
    "updated_at": "2024-03-10T11:00:00Z"
  }
}
```

### DELETE /travel-listings/:id
Close/cancel a travel listing.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "listing_id": "uuid",
    "status": "cancelled"
  }
}
```

---

## Shipment Endpoints

### POST /shipments
Create a new shipment request.

**Request:**
```json
{
  "origin_city": "Lagos",
  "origin_country": "NG",
  "destination_city": "Toronto",
  "destination_country": "CA",
  "sender_location": "Lekki, Lagos",
  "recipient_location": "Downtown, Toronto",
  "pickup_deadline": "2025-04-15T14:00:00Z",
  "delivery_deadline": "2025-04-20T14:00:00Z",
  "weight_kg": 3.5,
  "value_usd": 150.00,
  "description": "Traditional clothing and accessories",
  "categories": ["clothing"],
  "special_handling": "Fragile items, keep dry",
  "budget": 42.00,
  "currency": "USD"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "shipment_id": "uuid",
    "user_id": "uuid",
    "status": "open",
    "origin_city": "Lagos",
    "destination_city": "Toronto",
    "weight_kg": 3.5,
    "budget": 42.00,
    "currency": "USD",
    "created_at": "2024-03-10T10:00:00Z"
  }
}
```

### GET /shipments/browse
Browse shipment requests with filters.

**Query Params:**
- `origin_city` (string)
- `destination_city` (string)
- `min_weight` (number)
- `max_weight` (number)
- `status` (open, matched, etc.)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shipments": [
      {
        "shipment_id": "uuid",
        "user_id": "uuid",
        "sender": {
          "display_name": "Chukwuemeka J.",
          "profile_picture_url": "https://...",
          "trust_score": 75.0
        },
        "origin_city": "Lagos",
        "destination_city": "Toronto",
        "weight_kg": 3.5,
        "budget": 42.00,
        "currency": "USD",
        "categories": ["clothing"],
        "status": "open",
        "description": "Traditional clothing"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 32
  }
}
```

### GET /shipments/:id
Get a specific shipment details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shipment_id": "uuid",
    "user_id": "uuid",
    "sender": {
      "display_name": "Chukwuemeka J.",
      "profile_picture_url": "https://...",
      "trust_score": 75.0,
      "total_shipments": 8
    },
    "origin_city": "Lagos",
    "origin_country": "NG",
    "destination_city": "Toronto",
    "destination_country": "CA",
    "sender_location": "Lekki, Lagos",
    "recipient_location": "Downtown, Toronto",
    "weight_kg": 3.5,
    "value_usd": 150.00,
    "budget": 42.00,
    "currency": "USD",
    "categories": ["clothing"],
    "description": "Traditional clothing and accessories",
    "special_handling": "Fragile items, keep dry",
    "pickup_deadline": "2025-04-15T14:00:00Z",
    "delivery_deadline": "2025-04-20T14:00:00Z",
    "status": "open",
    "created_at": "2024-03-10T10:00:00Z"
  }
}
```

### GET /shipments/me
Get current user's shipments.

**Query Params:**
- `status` (open, matched, in_transit, etc.)
- `page` (number)
- `limit` (number)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shipments": [
      {
        "shipment_id": "uuid",
        "origin_city": "Lagos",
        "destination_city": "Toronto",
        "weight_kg": 3.5,
        "budget": 42.00,
        "status": "open"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

### PUT /shipments/:id
Update a shipment request.

**Request (any of these fields):**
```json
{
  "origin_city": "Lagos",
  "destination_city": "Toronto",
  "sender_location": "Lekki, Lagos",
  "recipient_location": "Downtown, Toronto",
  "weight_kg": 4.0,
  "budget": 45.00,
  "currency": "USD",
  "categories": ["clothing", "accessories"],
  "description": "Updated description",
  "special_handling": "Fragile items",
  "pickup_deadline": "2025-04-15T14:00:00Z",
  "delivery_deadline": "2025-04-20T14:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shipment_id": "uuid",
    "weight_kg": 4.0,
    "budget": 45.00,
    "updated_at": "2024-03-10T11:00:00Z"
  }
}
```

### DELETE /shipments/:id
Cancel a shipment request.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shipment_id": "uuid",
    "status": "cancelled"
  }
}
```

---

## Matching Endpoints (Phase 5)

### POST /matches/sender-request
Sender initiates a match with a traveler.

**Auth:** Required (sender must own shipment)

**Request:**
```json
{
  "listing_id": "uuid-of-the-listing",
  "shipment_id": "uuid-of-my-shipment",
  "message": "Hi, I have 3.5kg of clothing going to Toronto. Are you available?"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "status": "sender_requested",
    "listing": {
      "id": "uuid",
      "traveler_display_name": "Adaeze O.",
      "departure_date": "2025-04-15"
    },
    "message": "Your request has been sent to the traveler."
  }
}
```

### POST /matches/traveler-offer
Traveler initiates a match with a sender.

**Auth:** Required (KYC must be approved)

**Request:**
```json
{
  "shipment_id": "uuid-of-the-shipment",
  "listing_id": "uuid-of-my-listing",
  "message": "I can carry this for you. My price is $38 for 3.5kg."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "status": "traveler_offered",
    "shipment": {
      "id": "uuid",
      "sender_display_name": "Chukwuemeka J.",
      "destination_city": "Toronto"
    },
    "message": "Your offer has been sent to the sender."
  }
}
```

### POST /matches/:id/accept
Accept a match request/offer.

**Auth:** Required (must be the correct counterparty)

**Request:** No body required.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "status": "negotiating",
    "conversation_id": "uuid",
    "message": "Match accepted. Chat is now open."
  }
}
```

### POST /matches/:id/reject
Reject a match request/offer.

**Auth:** Required

**Request:**
```json
{
  "reason": "I have found another arrangement."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "status": "rejected_by_sender"
  }
}
```

### GET /matches/for-shipment/:id
Get all matches for a shipment (sender view).

**Auth:** Required

**Query Params:**
- `page` (number)
- `limit` (number)
- `min_score` (number)
- `status` (string)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "match_id": "uuid",
        "match_score": 87.5,
        "status": "negotiating",
        "conversation_id": "uuid",
        "expires_at": "2025-03-10T15:00:00Z",
        "initiated_by": "system",
        "travel_listing": {
          "id": "uuid",
          "traveler": {
            "id": "uuid",
            "display_name": "Adaeze O.",
            "trust_score": 82.5,
            "total_deliveries_as_traveler": 12,
            "badges": ["verified_traveler"]
          },
          "departure_date": "2025-04-15",
          "origin_city": "Lagos",
          "destination_city": "Toronto",
          "available_capacity_kg": 8.5,
          "price_per_kg": 11.00,
          "flat_fee": null,
          "currency": "USD",
          "is_verified_flight": true
        },
        "payment_requested_amount": null
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

### GET /matches/for-listing/:id
Get all matches for a listing (traveler view).

**Auth:** Required

**Query Params:**
- `page` (number)
- `limit` (number)
- `status` (string)

**Response (200):**
Same structure as above, but with shipment_request instead of travel_listing.

### POST /matches/:id/request-payment
Traveler sends payment request.

**Auth:** Required (traveler only)

**Request:**
```json
{
  "amount": 38.00,
  "currency": "USD"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "booking_id": "uuid",
    "conversation_id": "uuid",
    "amount": 38.00,
    "currency": "USD",
    "status": "payment_requested",
    "message": "Payment request sent. Waiting for sender to pay."
  }
}
```

### POST /matches/:id/cancel
Cancel a match before pickup.

**Auth:** Required (either participant)

**Request:**
```json
{
  "reason": "I found a better price elsewhere."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "status": "cancelled"
  }
}
```

---

## Payments & Wallet Endpoints (Phase 6)

### POST /payments/initiate/:bookingId
Initiate payment for a booking.

**Auth:** Required (sender only)

**Request:**
```json
{
  "payment_provider": "paystack",
  "return_url": "https://carrylink.app/account/booking/uuid/payment-return"
}
```

**Paystack Response (200):**
```json
{
  "success": true,
  "data": {
    "provider": "paystack",
    "payment_url": "https://checkout.paystack.com/lhckjd8",
    "reference": "CL-booking-uuid-1709503200",
    "amount": 38.00,
    "currency": "USD"
  }
}
```

**Stripe Response (200):**
```json
{
  "success": true,
  "data": {
    "provider": "stripe",
    "client_secret": "pi_3OvABC123_secret_xyz456",
    "publishable_key": "pk_live_51O...",
    "amount": 3800,
    "currency": "usd"
  }
}
```

### POST /payout-accounts/verify
Verify a bank account before saving.

**Auth:** Required

**Request (Nigerian bank):**
```json
{
  "provider": "paystack",
  "bank_code": "058",
  "account_number": "0123456789",
  "currency": "NGN",
  "country": "NG"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "account_name": "ADAEZE OKAFOR",
    "bank_name": "GT Bank"
  }
}
```

### POST /payout-accounts
Save a verified payout account.

**Auth:** Required

**Request:**
```json
{
  "provider": "paystack",
  "bank_code": "058",
  "account_number": "0123456789",
  "account_name": "ADAEZE OKAFOR",
  "bank_name": "GT Bank",
  "currency": "NGN",
  "country": "NG"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "payout-account-uuid",
    "provider": "paystack",
    "bank_name": "GT Bank",
    "account_number_masked": "****6789",
    "account_name": "ADAEZE OKAFOR",
    "currency": "NGN",
    "country": "NG",
    "is_default": true,
    "is_verified": true
  }
}
```

### GET /payout-accounts
Get all saved payout accounts.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "uuid",
        "provider": "paystack",
        "bank_name": "GT Bank",
        "account_number_masked": "****6789",
        "account_name": "ADAEZE OKAFOR",
        "currency": "NGN",
        "country": "NG",
        "is_default": true,
        "is_verified": true
      }
    ]
  }
}
```

### GET /wallet/balance
Get wallet balance.

**Auth:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": 71.40,
    "pending_release": 35.70,
    "held_in_dispute": 0.00,
    "currency": "USD"
  }
}
```

### POST /wallet/withdraw
Withdraw funds from wallet.

**Auth:** Required (KYC must be approved)

**Request:**
```json
{
  "amount": 60.00,
  "payout_account_id": "uuid-of-saved-account"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "withdrawal_reference": "WD-uuid",
    "amount": 60.00,
    "currency": "NGN",
    "new_balance": 11.40,
    "status": "processing",
    "estimated_arrival": "1-2 business days"
  }
}
```

### POST /bookings/:id/confirm-pickup
Confirm package pickup (traveler).

**Auth:** Required (traveler only)

**Request:**
```json
{
  "pickup_photo_url": "https://res.cloudinary.com/..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "in_transit",
    "pickup_confirmed_at": "2025-04-15T18:00:00Z",
    "message": "Pickup confirmed. A delivery code has been sent to the recipient's phone."
  }
}
```

### POST /bookings/:id/confirm-delivery
Confirm delivery (recipient via OTP).

**Auth:** Required (sender only)

**Request:**
```json
{
  "delivery_otp": "839271",
  "delivery_photo_url": null
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "completed",
    "traveler_credited": 32.30,
    "currency": "USD",
    "message": "Delivery confirmed and funds released. Please leave a review."
  }
}
```

### POST /bookings/:id/cancel
Cancel a booking.

**Auth:** Required (either participant)

**Request:**
```json
{
  "reason": "I found another arrangement."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "cancelled",
    "refunded_to_sender": 38.00,
    "trust_score_penalty": -10,
    "message": "Booking cancelled. Sender has been refunded. Your trust score has been adjusted."
  }
}
```

### GET /bookings/:id
Get booking details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "match_id": "uuid",
    "shipment_id": "uuid",
    "listing_id": "uuid",
    "sender_id": "uuid",
    "traveler_id": "uuid",
    "amount": 38.00,
    "currency": "USD",
    "status": "payment_held",
    "escrow_status": "funded",
    "payment_provider": "paystack",
    "pickup_deadline": "2025-04-15T14:00:00Z",
    "delivery_deadline": "2025-04-20T14:00:00Z",
    "pickup_confirmed_at": null,
    "delivery_confirmed_at": null,
    "created_at": "2024-03-10T10:00:00Z"
  }
}
```

---

## Match Status Enum

- `suggested` - System auto-matched, no action taken
- `sender_requested` - Sender clicked "Request This Traveler"
- `traveler_offered` - Traveler clicked "Offer to Carry This Package"
- `negotiating` - Both accepted, conversation open, price being discussed
- `payment_requested` - Traveler sent formal payment request with agreed amount
- `payment_pending` - Sender initiated payment, waiting for gateway webhook
- `confirmed` - Payment received in escrow, booking is live
- `rejected_by_traveler` - Rejected by traveler
- `rejected_by_sender` - Rejected by sender
- `expired` - 48h passed with no action from the approached party
- `cancelled` - Cancelled before pickup (after confirmation)

## Listing Status Enum

- `active` - Currently available
- `closed` - Manually closed by user
- `expired` - Departure date passed
- `cancelled` - Cancelled by user

## Shipment Status Enum

- `under_review` - Awaiting admin review for restricted items
- `open` - Available for matching
- `matched` - Matched with traveler(s)
- `in_transit` - Collected by traveler
- `delivered` - Delivered to recipient
- `completed` - Post-delivery complete
- `cancelled` - Cancelled by sender
- `disputed` - Under dispute

## Booking Status Enum

- `pending_payment` - Match confirmed, waiting for sender to pay
- `payment_processing` - Sender hit Pay, gateway processing
- `payment_held` - Escrow funded, both parties waiting for pickup
- `in_transit` - Traveler confirmed package collection
- `delivered` - Recipient confirmed receipt (OTP validated)
- `completed` - Post-delivery window done, funds released
- `cancelled` - Cancelled before pickup, escrow refunded
- `disputed` - Dispute open, escrow frozen

## Currency Codes

- `USD` - US Dollar
- `NGN` - Nigerian Naira
- `GBP` - British Pound
- `CAD` - Canadian Dollar
