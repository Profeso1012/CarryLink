## PART TWO: DATABASE SCHEMA

---

### Design Principles

Every primary key is a UUID generated at the application layer using `uuid_generate_v4()`. This enables distributed ID generation without DB coordination. All timestamps are `TIMESTAMPTZ` (timestamp with timezone), stored in UTC, never VARCHAR. Monetary amounts are `NUMERIC(15,2)` — never FLOAT, which is imprecise for money. Soft deletes are preferred over hard deletes for user-generated content; instead of a `deleted_at` column proliferating everywhere, status enums are used to represent cancelled/removed state, and the admin action log is the audit trail. Junction tables use composite primary keys, not surrogate UUIDs, since the combination is already the identity.

---

### ENUM Definitions

```
user_status:        pending_verification | active | suspended | banned
user_role:          user | admin | superadmin
kyc_status:         not_started | pending | under_review | approved | rejected | expired
id_type:            passport | national_id | drivers_license
kyc_provider:       smile_identity | onfido | manual
listing_status:     draft | active | matched | completed | cancelled | expired
shipment_status:    draft | open | matched | in_transit | delivered | cancelled | disputed
match_status:       suggested | sender_interested | traveler_accepted | traveler_rejected | expired | converted_to_booking
match_suggested_by: system | sender | traveler
booking_status:     pending_payment | payment_held | traveler_confirmed_pickup | in_transit | delivered | completed | cancelled | disputed
escrow_status:      pending | funded | held | released | refunded | partially_refunded | frozen
payment_provider:   stripe | paystack | flutterwave | wallet
transaction_cat:    escrow_hold | escrow_release | platform_fee | refund | withdrawal | deposit | bonus
message_type:       text | image | system
notification_type:  booking_request | payment_received | delivery_confirmed | dispute_opened | dispute_resolved | kyc_approved | kyc_rejected | review_received | system
dispute_type:       item_not_delivered | item_damaged | item_different | fraud | other
dispute_status:     open | under_review | resolved | closed
resolution_type:    full_refund | partial_refund | no_refund | traveler_favor
otp_type:           email_verification | phone_verification | password_reset | login_2fa
push_platform:      ios | android | web
badge_type:         verified_traveler | top_rated | frequent_flyer | trusted_sender | elite
severity_type:      auto_block | review_required | flag
admin_target:       user | booking | listing | shipment | dispute | escrow | kyc
admin_action_type:  freeze | unfreeze | ban | approve | reject | note | export | resolve
oauth_provider:     google | apple
flight_verify_status: pending | verified | failed | skipped
evidence_type:      image | document | text_statement
review_role:        sender_reviewing_traveler | traveler_reviewing_sender
ledger_type:        credit | debit
```

---

### Table: `item_categories`

Seeded once. Supports parent-child hierarchy for subcategories (e.g., Electronics → Smartphones). The full-text search vector on `name` and `keywords` powers the prohibited item screening.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | UNIQUE NOT NULL | URL-safe identifier |
| description | TEXT | | |
| keywords | TEXT[] | DEFAULT '{}' | For search matching |
| is_prohibited | BOOLEAN | DEFAULT false | |
| requires_review | BOOLEAN | DEFAULT false | |
| parent_id | UUID | FK → item_categories(id), NULL | NULL = top-level |
| icon_url | VARCHAR(500) | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(is_prohibited)`, `(requires_review)`, `(parent_id)`, GIN index on `keywords`

---

### Table: `prohibited_items`

Seeded with a master list. Keywords are used in `ts_vector` full-text search against shipment descriptions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(200) | NOT NULL | Human-readable name |
| keywords | TEXT[] | NOT NULL | Array of trigger words |
| category_id | UUID | FK → item_categories(id), NULL | Optional category linkage |
| severity | severity_type | NOT NULL DEFAULT 'review_required' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** GIN index on `keywords`, `(severity)`

---

### Table: `corridors`

Defines supported country-pair routes. Also used to scope commission rules.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| origin_country_code | CHAR(2) | NOT NULL | ISO 3166-1 alpha-2 |
| destination_country_code | CHAR(2) | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| customs_notes | TEXT | | Displayed to travelers |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(origin_country_code, destination_country_code)` UNIQUE

---

### Table: `commission_rules`

Corridor-specific commission rates. If no corridor rule matches, the fallback rule (corridor_id IS NULL) is used.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| corridor_id | UUID | FK → corridors(id), NULL | NULL = global default |
| min_amount | NUMERIC(15,2) | NOT NULL DEFAULT 0 | |
| max_amount | NUMERIC(15,2) | | NULL = no upper bound |
| commission_percentage | NUMERIC(5,2) | NOT NULL | e.g. 15.00 for 15% |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(corridor_id, is_active)`, `(min_amount, max_amount)`

---

### Table: `users`

Core identity record. Minimal — everything else lives in related tables.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| email | VARCHAR(320) | UNIQUE NOT NULL | Lowercased on insert |
| phone_number | VARCHAR(20) | UNIQUE NOT NULL | E.164 format |
| password_hash | VARCHAR(72) | | NULL for OAuth-only accounts |
| role | user_role | NOT NULL DEFAULT 'user' | |
| status | user_status | NOT NULL DEFAULT 'pending_verification' | |
| is_email_verified | BOOLEAN | DEFAULT false | |
| is_phone_verified | BOOLEAN | DEFAULT false | |
| failed_login_attempts | SMALLINT | DEFAULT 0 | Reset on successful login |
| locked_until | TIMESTAMPTZ | | Set after 5 failed attempts |
| last_login_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(email)`, `(phone_number)`, `(status)`, `(role)`, `(created_at)`

---

### Table: `user_profiles`

One-to-one with users. Contains display and demographic data.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | UNIQUE FK → users(id) ON DELETE CASCADE | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| display_name | VARCHAR(100) | | |
| avatar_url | VARCHAR(500) | | |
| country_of_residence | CHAR(2) | | ISO 3166-1 alpha-2 |
| city | VARCHAR(100) | | |
| bio | TEXT | | Max 500 chars enforced at app layer |
| date_of_birth | DATE | | Used for age verification |
| trust_score | NUMERIC(5,2) | DEFAULT 50.00 | 0.00–100.00 |
| total_deliveries_as_traveler | INT | DEFAULT 0 | Denormalized count |
| total_deliveries_as_sender | INT | DEFAULT 0 | Denormalized count |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(country_of_residence)`, `(trust_score)`

---

### Table: `kyc_verifications`

One-to-one with users. Tracks the lifecycle of identity verification.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | UNIQUE FK → users(id) | |
| status | kyc_status | DEFAULT 'not_started' | |
| id_type | id_type | | |
| id_number | VARCHAR(50) | | Masked in most API responses |
| id_country | CHAR(2) | | |
| id_front_url | VARCHAR(500) | | Cloudinary URL |
| id_back_url | VARCHAR(500) | | |
| selfie_url | VARCHAR(500) | | |
| liveness_score | NUMERIC(5,4) | | From provider |
| provider | kyc_provider | | |
| provider_reference | VARCHAR(200) | | Provider's job/check ID |
| reviewed_by | UUID | FK → users(id), NULL | Admin who manually reviewed |
| rejection_reason | TEXT | | |
| submitted_at | TIMESTAMPTZ | | |
| reviewed_at | TIMESTAMPTZ | | |
| expires_at | TIMESTAMPTZ | | 2 years from approval |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(status)`, `(provider, provider_reference)`

---

### Table: `oauth_accounts`

Allows multiple OAuth providers per user. Tokens stored encrypted at rest using AES-256-GCM via the crypto.util.js.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| provider | oauth_provider | NOT NULL | |
| provider_user_id | VARCHAR(200) | NOT NULL | |
| provider_email | VARCHAR(320) | | |
| access_token_encrypted | TEXT | | AES-256-GCM encrypted |
| refresh_token_encrypted | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(provider, provider_user_id)` UNIQUE, `(user_id)`

---

### Table: `refresh_tokens`

Each row represents one active session. Token stored as a SHA-256 hash — the raw token is never persisted.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| token_hash | VARCHAR(64) | UNIQUE NOT NULL | SHA-256 of raw token |
| family_id | UUID | NOT NULL | Groups tokens in rotation chain |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| is_revoked | BOOLEAN | DEFAULT false | |
| device_fingerprint | VARCHAR(64) | | |
| ip_address | INET | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(token_hash)`, `(user_id, is_revoked)`, `(family_id)`, `(expires_at)`

---

### Table: `otp_codes`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| type | otp_type | NOT NULL | |
| code_hash | VARCHAR(64) | NOT NULL | SHA-256 of 6-digit code |
| expires_at | TIMESTAMPTZ | NOT NULL | 10 minutes |
| is_used | BOOLEAN | DEFAULT false | |
| attempts | SMALLINT | DEFAULT 0 | Max 3 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(user_id, type, is_used)`, `(expires_at)` for cleanup job

---

### Table: `device_fingerprints`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| fingerprint_hash | VARCHAR(64) | NOT NULL | Hash of UA + IP + other signals |
| ip_address | INET | | |
| ip_country | CHAR(2) | | From IP geolocation |
| user_agent | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| last_seen_at | TIMESTAMPTZ | | |

**Indexes:** `(user_id)`, `(fingerprint_hash)`, `(ip_address)`

---

### Table: `push_tokens`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| token | TEXT | NOT NULL | FCM / APNs token |
| platform | push_platform | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(user_id, is_active)`, `(token)` UNIQUE

---

### Table: `user_wallets`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | UNIQUE FK → users(id) | |
| balance | NUMERIC(15,2) | DEFAULT 0 NOT NULL | Denormalized cache of ledger |
| currency | CHAR(3) | DEFAULT 'USD' | |
| is_frozen | BOOLEAN | DEFAULT false | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### Table: `traveler_badges`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| badge_type | badge_type | NOT NULL | |
| awarded_at | TIMESTAMPTZ | DEFAULT NOW() | |
| expires_at | TIMESTAMPTZ | | NULL = permanent |

**Indexes:** `(user_id)`, `(user_id, badge_type)` UNIQUE

---

### Table: `travel_listings`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| traveler_id | UUID | FK → users(id) | |
| status | listing_status | DEFAULT 'draft' | |
| origin_country | CHAR(2) | NOT NULL | |
| origin_city | VARCHAR(100) | NOT NULL | |
| destination_country | CHAR(2) | NOT NULL | |
| destination_city | VARCHAR(100) | NOT NULL | |
| departure_date | DATE | NOT NULL | |
| arrival_date | DATE | NOT NULL | |
| airline | VARCHAR(100) | | |
| flight_number | VARCHAR(20) | | |
| total_capacity_kg | NUMERIC(6,2) | NOT NULL | |
| available_capacity_kg | NUMERIC(6,2) | NOT NULL | Decremented on booking |
| price_per_kg | NUMERIC(10,2) | | |
| flat_fee | NUMERIC(10,2) | | |
| currency | CHAR(3) | DEFAULT 'USD' | |
| notes | TEXT | | |
| is_verified_flight | BOOLEAN | DEFAULT false | |
| flight_verification_doc_url | VARCHAR(500) | | |
| view_count | INT | DEFAULT 0 | |
| is_boosted | BOOLEAN | DEFAULT false | |
| boost_expires_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| expires_at | TIMESTAMPTZ | | Set to departure_date + 1 day |

**Indexes:** `(origin_country, destination_country, status)`, `(departure_date)`, `(traveler_id, status)`, `(status, expires_at)`, `(is_boosted, boost_expires_at)`

---

### Table: `travel_listing_accepted_categories`

Junction table — what item categories a traveler is willing to carry.

| Column | Type | Constraints |
|--------|------|-------------|
| travel_listing_id | UUID | FK → travel_listings(id) ON DELETE CASCADE |
| category_id | UUID | FK → item_categories(id) |
| PRIMARY KEY | | (travel_listing_id, category_id) |

---

### Table: `flight_verifications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| travel_listing_id | UUID | UNIQUE FK → travel_listings(id) | |
| flight_number | VARCHAR(20) | NOT NULL | |
| flight_date | DATE | NOT NULL | |
| origin_iata | CHAR(3) | | |
| destination_iata | CHAR(3) | | |
| verification_status | flight_verify_status | DEFAULT 'pending' | |
| api_provider | VARCHAR(50) | | |
| api_response | JSONB | | Raw provider response |
| verified_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

---

### Table: `shipment_requests`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| sender_id | UUID | FK → users(id) | |
| status | shipment_status | DEFAULT 'draft' | |
| origin_country | CHAR(2) | NOT NULL | |
| origin_city | VARCHAR(100) | NOT NULL | |
| destination_country | CHAR(2) | NOT NULL | |
| destination_city | VARCHAR(100) | NOT NULL | |
| pickup_deadline | DATE | NOT NULL | |
| delivery_deadline | DATE | NOT NULL | |
| item_description | TEXT | NOT NULL | |
| item_category_id | UUID | FK → item_categories(id) | |
| declared_weight_kg | NUMERIC(6,2) | NOT NULL | |
| offered_price | NUMERIC(10,2) | NOT NULL | |
| currency | CHAR(3) | DEFAULT 'USD' | |
| recipient_name | VARCHAR(200) | NOT NULL | |
| recipient_phone | VARCHAR(20) | NOT NULL | |
| recipient_email | VARCHAR(320) | | |
| pickup_address | TEXT | | |
| delivery_address | TEXT | NOT NULL | |
| is_prohibited_check_passed | BOOLEAN | DEFAULT false | |
| prohibited_check_result | JSONB | | Keywords matched if any |
| requires_admin_review | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(origin_country, destination_country, status)`, `(sender_id, status)`, `(item_category_id)`, `(requires_admin_review)`, `(pickup_deadline)`

Full-text search index: `CREATE INDEX shipment_fts_idx ON shipment_requests USING GIN(to_tsvector('english', item_description));`

---

### Table: `shipment_images`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| shipment_request_id | UUID | FK → shipment_requests(id) ON DELETE CASCADE |
| url | VARCHAR(500) | NOT NULL |
| uploaded_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes:** `(shipment_request_id)`

---

### Table: `matches`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| travel_listing_id | UUID | FK → travel_listings(id) | |
| shipment_request_id | UUID | FK → shipment_requests(id) | |
| status | match_status | DEFAULT 'suggested' | |
| suggested_by | match_suggested_by | DEFAULT 'system' | |
| match_score | NUMERIC(5,2) | | 0–100 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| expires_at | TIMESTAMPTZ | | 48 hours from creation |

**Constraints:** `UNIQUE (travel_listing_id, shipment_request_id)`

**Indexes:** `(travel_listing_id, status)`, `(shipment_request_id, status)`, `(status, expires_at)`, `(match_score DESC)`

---

### Table: `bookings`

Central transaction record tying everything together.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| match_id | UUID | UNIQUE FK → matches(id) | |
| traveler_id | UUID | FK → users(id) | Denormalized for fast query |
| sender_id | UUID | FK → users(id) | Denormalized |
| travel_listing_id | UUID | FK → travel_listings(id) | Denormalized |
| shipment_request_id | UUID | FK → shipment_requests(id) | Denormalized |
| status | booking_status | DEFAULT 'pending_payment' | |
| agreed_price | NUMERIC(10,2) | NOT NULL | |
| platform_commission_pct | NUMERIC(5,2) | NOT NULL | Snapshot at time of booking |
| platform_commission_amount | NUMERIC(10,2) | NOT NULL | |
| traveler_payout_amount | NUMERIC(10,2) | NOT NULL | |
| currency | CHAR(3) | NOT NULL | |
| pickup_confirmed_at | TIMESTAMPTZ | | |
| delivery_confirmed_at | TIMESTAMPTZ | | |
| cancellation_reason | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(traveler_id, status)`, `(sender_id, status)`, `(status)`, `(travel_listing_id)`, `(shipment_request_id)`

---

### Table: `escrow_accounts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| booking_id | UUID | UNIQUE FK → bookings(id) | |
| status | escrow_status | DEFAULT 'pending' | |
| amount | NUMERIC(15,2) | NOT NULL | Total charged to sender |
| currency | CHAR(3) | NOT NULL | |
| platform_fee | NUMERIC(15,2) | NOT NULL | |
| net_payout | NUMERIC(15,2) | NOT NULL | To traveler |
| payment_provider | payment_provider | NOT NULL | |
| payment_intent_id | VARCHAR(200) | | Provider's transaction ID |
| funded_at | TIMESTAMPTZ | | |
| released_at | TIMESTAMPTZ | | |
| refunded_at | TIMESTAMPTZ | | |
| freeze_reason | TEXT | | If frozen |
| frozen_by | UUID | FK → users(id), NULL | Admin who froze |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(booking_id)`, `(status)`, `(payment_provider, payment_intent_id)`

---

### Table: `wallet_ledger`

Immutable append-only ledger. Rows are never updated or deleted.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| booking_id | UUID | FK → bookings(id), NULL | |
| type | ledger_type | NOT NULL | credit or debit |
| category | transaction_cat | NOT NULL | |
| amount | NUMERIC(15,2) | NOT NULL | Always positive |
| currency | CHAR(3) | NOT NULL | |
| balance_after | NUMERIC(15,2) | NOT NULL | Running balance snapshot |
| reference | VARCHAR(200) | | Payment provider reference |
| description | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(user_id, created_at)`, `(booking_id)`, `(category)`

---

### Table: `conversations`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| booking_id | UUID | UNIQUE FK → bookings(id), NULL | |
| match_id | UUID | UNIQUE FK → matches(id), NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| last_message_at | TIMESTAMPTZ | | Updated on each message |

**Indexes:** `(booking_id)`, `(match_id)`, `(last_message_at DESC)`

---

### Table: `conversation_participants`

| Column | Type | Constraints |
|--------|------|-------------|
| conversation_id | UUID | FK → conversations(id) ON DELETE CASCADE |
| user_id | UUID | FK → users(id) |
| joined_at | TIMESTAMPTZ | DEFAULT NOW() |
| last_read_at | TIMESTAMPTZ | |
| is_muted | BOOLEAN | DEFAULT false |
| PRIMARY KEY | | (conversation_id, user_id) |

---

### Table: `messages`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| conversation_id | UUID | FK → conversations(id) | |
| sender_id | UUID | FK → users(id) | NULL for system messages |
| content | TEXT | | |
| type | message_type | DEFAULT 'text' | |
| image_url | VARCHAR(500) | | |
| is_deleted | BOOLEAN | DEFAULT false | Soft delete |
| sent_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(conversation_id, sent_at)` — the primary query pattern is always "all messages in conversation X, ordered by time"

---

### Table: `notifications`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → users(id) | |
| type | notification_type | NOT NULL | |
| title | VARCHAR(200) | NOT NULL | |
| body | TEXT | NOT NULL | |
| data | JSONB | DEFAULT '{}' | Deeplink or entity IDs |
| is_read | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(user_id, is_read, created_at DESC)` — partial index on `WHERE is_read = false` for unread count queries

---

### Table: `reviews`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| booking_id | UUID | FK → bookings(id) | |
| reviewer_id | UUID | FK → users(id) | |
| reviewee_id | UUID | FK → users(id) | |
| role | review_role | NOT NULL | Which party is reviewing which |
| rating | SMALLINT | NOT NULL CHECK (rating BETWEEN 1 AND 5) | |
| comment | TEXT | | Max 1000 chars |
| is_flagged | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Constraints:** `UNIQUE (booking_id, reviewer_id)` — one review per reviewer per booking

**Indexes:** `(reviewee_id, created_at)`, `(booking_id)`

---

### Table: `disputes`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| booking_id | UUID | UNIQUE FK → bookings(id) | One dispute per booking |
| raised_by | UUID | FK → users(id) | |
| against | UUID | FK → users(id) | |
| type | dispute_type | NOT NULL | |
| status | dispute_status | DEFAULT 'open' | |
| description | TEXT | NOT NULL | |
| resolution | TEXT | | Admin's written decision |
| resolution_type | resolution_type | | |
| refund_amount | NUMERIC(15,2) | | If partial refund |
| assigned_admin_id | UUID | FK → users(id), NULL | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| resolved_at | TIMESTAMPTZ | | |

**Indexes:** `(status)`, `(assigned_admin_id)`, `(raised_by)`, `(against)`

---

### Table: `dispute_evidence`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| dispute_id | UUID | FK → disputes(id) ON DELETE CASCADE |
| submitted_by | UUID | FK → users(id) |
| type | evidence_type | NOT NULL |
| url | VARCHAR(500) | |
| text_content | TEXT | |
| submitted_at | TIMESTAMPTZ | DEFAULT NOW() |

**Indexes:** `(dispute_id, submitted_by)`

---

### Table: `admin_actions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| admin_id | UUID | FK → users(id) | |
| target_type | admin_target | NOT NULL | |
| target_id | UUID | NOT NULL | |
| action | admin_action_type | NOT NULL | |
| reason | TEXT | | |
| metadata | JSONB | DEFAULT '{}' | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(admin_id)`, `(target_type, target_id)`, `(created_at)`

---

### Table: `audit_logs`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| actor_id | UUID | FK → users(id), NULL | NULL for system actions |
| action | VARCHAR(100) | NOT NULL | e.g. 'booking.status.updated' |
| entity_type | VARCHAR(50) | NOT NULL | |
| entity_id | UUID | NOT NULL | |
| old_values | JSONB | | |
| new_values | JSONB | | |
| ip_address | INET | | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |

**Indexes:** `(entity_type, entity_id)`, `(actor_id)`, `(created_at)` — partition by month in production

---

## PART THREE: COMPLETE API DOCUMENTATION

---

### Standard Response Envelope

Every API response — success or error — uses this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 450 }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested booking does not exist.",
    "details": []
  }
}
```

### Standard Request Headers

Every authenticated endpoint expects:
`Authorization: Bearer <access_token>`
`Content-Type: application/json`
`X-Request-ID: <uuid>` (optional; generated by middleware if absent)
`X-Recaptcha-Token: <token>` (on registration, login, forgot-password endpoints only)

---

### AUTH MODULE

---

**POST `/api/v1/auth/register`**

Registers a new user account. Triggers email OTP. Does not complete registration until OTP is verified.

Auth: None. Bot protection: reCAPTCHA required. Rate limit: 5 requests/hour/IP.

Request Body:
```json
{
  "email": "user@example.com",
  "phone_number": "+2348012345678",
  "password": "SecurePass123!",
  "first_name": "Adaeze",
  "last_name": "Okafor",
  "country_of_residence": "NG",
  "_gotcha": ""
}
```

Success Response `201`:
```json
{
  "success": true,
  "data": {
    "message": "Registration initiated. Please verify your email.",
    "user_id": "uuid",
    "email": "user@example.com"
  }
}
```

Error Responses: `409 EMAIL_ALREADY_EXISTS`, `409 PHONE_ALREADY_EXISTS`, `422 VALIDATION_ERROR`, `429 RATE_LIMIT_EXCEEDED`, `403 BOT_DETECTED`

---

**POST `/api/v1/auth/verify-email`**

Verifies the 6-digit OTP sent to the user's email during registration.

Auth: None. Rate limit: 10 requests/hour/IP.

Request Body:
```json
{
  "email": "user@example.com",
  "otp": "847291"
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "message": "Email verified. Please verify your phone number.",
    "is_email_verified": true
  }
}
```

Error Responses: `400 INVALID_OTP`, `400 OTP_EXPIRED`, `400 OTP_MAX_ATTEMPTS`, `404 USER_NOT_FOUND`

---

**POST `/api/v1/auth/send-phone-otp`**

Sends a 6-digit OTP via SMS to the user's registered phone number.

Auth: None. Rate limit: 3 requests/10 minutes/user.

Request Body:
```json
{
  "email": "user@example.com"
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "message": "OTP sent via SMS."
  }
}
```

Error Responses: `404 USER_NOT_FOUND`, `429 RATE_LIMIT_EXCEEDED`

---

**POST `/api/v1/auth/verify-phone`**

Verifies phone OTP and activates the account.

Auth: None.

Request Body:
```json
{
  "email": "user@example.com",
  "otp": "391847"
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "message": "Phone verified. Account is now active.",
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "is_email_verified": true,
      "is_phone_verified": true
    }
  }
}
```

---

**POST `/api/v1/auth/login`**

Authenticates an existing user.

Auth: None. reCAPTCHA required. Rate limit: 10 requests/hour/IP.

Request Body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "device_info": {
    "platform": "web",
    "user_agent": "Mozilla/5.0..."
  }
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "status": "active",
      "kyc_status": "approved",
      "profile": {
        "first_name": "Adaeze",
        "last_name": "Okafor",
        "avatar_url": "https://...",
        "trust_score": 72.5
      }
    }
  }
}
```

Error Responses: `401 INVALID_CREDENTIALS`, `401 ACCOUNT_SUSPENDED`, `401 ACCOUNT_BANNED`, `401 EMAIL_NOT_VERIFIED`, `429 ACCOUNT_LOCKED` (with `retry_after` seconds)

---

**POST `/api/v1/auth/login/google`**

Verifies a Google ID token and returns session tokens. Creates an account if none exists for this Google account.

Auth: None.

Request Body:
```json
{
  "id_token": "Google-issued ID token from client"
}
```

Success Response `200` (same structure as login success).

Error Responses: `400 INVALID_GOOGLE_TOKEN`, `409 EMAIL_EXISTS_WITH_PASSWORD` (if user has a password account with same email — prompt to link)

---

**POST `/api/v1/auth/login/apple`**

Request Body:
```json
{
  "identity_token": "Apple-issued JWT",
  "authorization_code": "Apple auth code",
  "given_name": "Adaeze",
  "family_name": "Okafor"
}
```

Success/Error: Same pattern as Google login.

---

**POST `/api/v1/auth/refresh-token`**

Exchanges a valid refresh token for a new access token and a new refresh token (token rotation). The old refresh token is immediately revoked.

Auth: None. Rate limit: 30 requests/hour/user.

Request Body:
```json
{
  "refresh_token": "eyJ..."
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900
  }
}
```

Error Responses: `401 INVALID_REFRESH_TOKEN`, `401 REFRESH_TOKEN_REVOKED`, `401 REFRESH_TOKEN_EXPIRED`, `401 TOKEN_THEFT_DETECTED` (if a previously used token in the family is submitted — revokes all tokens in the family)

---

**POST `/api/v1/auth/logout`**

Auth: Bearer token required.

Request Body:
```json
{
  "refresh_token": "eyJ..."
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": { "message": "Logged out successfully." }
}
```

---

**POST `/api/v1/auth/forgot-password`**

Initiates password reset by sending an OTP to the user's email.

Auth: None. reCAPTCHA required. Rate limit: 3 requests/hour/email.

Request Body:
```json
{
  "email": "user@example.com"
}
```

Success Response `200`: Always returns success (to prevent email enumeration):
```json
{
  "success": true,
  "data": { "message": "If that email exists, a reset code has been sent." }
}
```

---

**POST `/api/v1/auth/reset-password`**

Auth: None.

Request Body:
```json
{
  "email": "user@example.com",
  "otp": "293847",
  "new_password": "NewSecurePass456!"
}
```

Success Response `200`: Returns success and revokes all existing refresh tokens for the user.

Error Responses: `400 INVALID_OTP`, `400 OTP_EXPIRED`, `422 PASSWORD_TOO_WEAK`

---

**POST `/api/v1/auth/change-password`**

Auth: Bearer token required (active account, verified).

Request Body:
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

Success Response `200`: Returns success and revokes all other sessions (all refresh tokens except the current session's family).

---

### KYC MODULE

---

**POST `/api/v1/kyc/initiate`**

Creates or resets the KYC record and returns Cloudinary signed upload parameters for document images.

Auth: Bearer token required. KYC status must be `not_started` or `rejected`.

Request Body:
```json
{
  "id_type": "passport",
  "id_country": "NG"
}
```

Success Response `201`:
```json
{
  "success": true,
  "data": {
    "kyc_id": "uuid",
    "upload_config": {
      "id_front": {
        "url": "https://api.cloudinary.com/v1_1/...",
        "signature": "...",
        "timestamp": 1700000000,
        "api_key": "...",
        "folder": "kyc/id_front",
        "public_id": "uuid-front"
      },
      "id_back": { "..." },
      "selfie": { "..." }
    }
  }
}
```

---

**POST `/api/v1/kyc/submit`**

After the user has uploaded documents directly to Cloudinary and received back their secure URLs, this endpoint is called to record the URLs and trigger provider verification.

Auth: Bearer token required.

Request Body:
```json
{
  "id_front_url": "https://res.cloudinary.com/...",
  "id_back_url": "https://res.cloudinary.com/...",
  "selfie_url": "https://res.cloudinary.com/..."
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "kyc_status": "pending",
    "message": "Your documents have been submitted and are under review.",
    "estimated_review_time": "2-4 hours"
  }
}
```

Error Responses: `400 INVALID_CLOUDINARY_URLS`, `409 KYC_ALREADY_SUBMITTED`

---

**GET `/api/v1/kyc/status`**

Auth: Bearer token required.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "status": "approved",
    "id_type": "passport",
    "id_country": "NG",
    "submitted_at": "2025-01-15T10:00:00Z",
    "reviewed_at": "2025-01-15T14:30:00Z",
    "expires_at": "2027-01-15T14:30:00Z",
    "rejection_reason": null
  }
}
```

---

**POST `/api/v1/kyc/webhook/smile-identity`**

Internal webhook. Not exposed in consumer API docs.

Headers: `X-Smile-Signature: HMAC-SHA256 of payload`

Request Body: Raw Smile Identity webhook payload (JSONB).

Success Response `200`: Returns `{ "success": true }` immediately — processing is async.

---

**POST `/api/v1/kyc/webhook/onfido`**

Headers: `X-SHA2-Signature: HMAC-SHA256`

Same async processing pattern as Smile Identity.

---

### USER PROFILE MODULE

---

**GET `/api/v1/users/me`**

Auth: Bearer token required.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "phone_number": "+2348012345678",
    "role": "user",
    "status": "active",
    "is_email_verified": true,
    "is_phone_verified": true,
    "profile": {
      "first_name": "Adaeze",
      "last_name": "Okafor",
      "display_name": "Ada",
      "avatar_url": "https://...",
      "country_of_residence": "NG",
      "city": "Lagos",
      "bio": "Frequent Lagos-London flyer.",
      "trust_score": 72.5,
      "total_deliveries_as_traveler": 8,
      "total_deliveries_as_sender": 3
    },
    "kyc_status": "approved",
    "badges": ["verified_traveler", "top_rated"],
    "wallet": {
      "balance": 45.00,
      "currency": "USD",
      "is_frozen": false
    }
  }
}
```

---

**PUT `/api/v1/users/me`**

Auth: Bearer token required.

Request Body (all fields optional):
```json
{
  "display_name": "Ada O.",
  "bio": "Updated bio.",
  "city": "London",
  "country_of_residence": "GB"
}
```

Success Response `200`: Returns updated `data.profile` object.

Error Responses: `422 VALIDATION_ERROR`

---

**POST `/api/v1/users/me/avatar`**

Returns a signed Cloudinary upload URL for the avatar image. The client uploads to Cloudinary directly, then calls `PUT /api/v1/users/me` with the resulting URL.

Auth: Bearer token required.

Request Body: None.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "upload_url": "https://api.cloudinary.com/v1_1/...",
    "signature": "...",
    "timestamp": 1700000000,
    "api_key": "...",
    "public_id": "avatars/uuid"
  }
}
```

---

**GET `/api/v1/users/:userId`**

Public profile. Strips sensitive data.

Auth: None required (but auth is parsed if present for blocking/reporting context).

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "display_name": "Ada O.",
    "avatar_url": "https://...",
    "country_of_residence": "NG",
    "trust_score": 72.5,
    "total_deliveries_as_traveler": 8,
    "total_deliveries_as_sender": 3,
    "badges": ["verified_traveler"],
    "review_summary": {
      "average_rating": 4.8,
      "total_reviews": 11
    },
    "member_since": "2024-09-01"
  }
}
```

Error Responses: `404 USER_NOT_FOUND`

---

**POST `/api/v1/users/push-token`**

Registers or updates a device push notification token.

Auth: Bearer token required.

Request Body:
```json
{
  "token": "FCM-or-APNs-token",
  "platform": "android"
}
```

Success Response `200`.

---

**GET `/api/v1/users/me/badges`**

Auth: Bearer token required.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "badge_type": "verified_traveler",
        "awarded_at": "2025-01-15T14:30:00Z",
        "expires_at": "2027-01-15T14:30:00Z"
      }
    ]
  }
}
```

---

### TRAVEL LISTINGS MODULE

---

**POST `/api/v1/travel-listings`**

Auth: Bearer token required. KYC must be `approved`. Rate limit: 10 listings/day/user.

Request Body:
```json
{
  "origin_country": "NG",
  "origin_city": "Lagos",
  "destination_country": "GB",
  "destination_city": "London",
  "departure_date": "2025-03-15",
  "arrival_date": "2025-03-15",
  "airline": "British Airways",
  "flight_number": "BA0076",
  "total_capacity_kg": 10.0,
  "price_per_kg": 12.00,
  "currency": "USD",
  "accepted_category_ids": ["uuid-electronics", "uuid-documents", "uuid-clothing"],
  "notes": "No liquids. Items must be pre-packed."
}
```

Success Response `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "available_capacity_kg": 10.0,
    "is_verified_flight": false,
    "created_at": "..."
  }
}
```

Error Responses: `403 KYC_REQUIRED`, `422 VALIDATION_ERROR`, `422 DEPARTURE_DATE_IN_PAST`, `400 INVALID_CORRIDOR`

---

**GET `/api/v1/travel-listings`**

Public browse. Auth not required.

Query Parameters:
- `origin_country` (required): e.g. `NG`
- `destination_country` (required): e.g. `GB`
- `departure_from` (date): e.g. `2025-03-10`
- `departure_to` (date): e.g. `2025-03-20`
- `min_capacity_kg` (number): e.g. `5`
- `max_price_per_kg` (number): e.g. `15`
- `verified_only` (boolean)
- `page` (number, default 1)
- `limit` (number, default 20, max 50)
- `sort` (`newest` | `departure_soon` | `price_asc` | `trust_score_desc`)

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "uuid",
        "traveler": {
          "id": "uuid",
          "display_name": "Ada O.",
          "avatar_url": "...",
          "trust_score": 72.5,
          "badges": ["verified_traveler"]
        },
        "origin_country": "NG",
        "origin_city": "Lagos",
        "destination_country": "GB",
        "destination_city": "London",
        "departure_date": "2025-03-15",
        "available_capacity_kg": 10.0,
        "price_per_kg": 12.00,
        "currency": "USD",
        "is_verified_flight": false,
        "is_boosted": false,
        "accepted_categories": ["Electronics", "Documents", "Clothing"]
      }
    ]
  },
  "meta": { "page": 1, "limit": 20, "total": 87 }
}
```

---

**GET `/api/v1/travel-listings/mine`**

Auth: Bearer token required.

Query Parameters: `status` (optional filter), `page`, `limit`

Success Response `200`: Returns paginated list of the authenticated user's listings with full detail.

---

**GET `/api/v1/travel-listings/:id`**

Auth: Not required. View count is incremented on each call.

Success Response `200`: Full listing detail including traveler public profile, accepted categories with full category objects, flight verification status.

Error Responses: `404 LISTING_NOT_FOUND`

---

**PUT `/api/v1/travel-listings/:id`**

Auth: Bearer token required. Only listing owner. Listing must be in `draft` or `active` status with no confirmed bookings.

Request Body: Same fields as POST, all optional.

Success Response `200`: Updated listing object.

Error Responses: `403 NOT_OWNER`, `409 LISTING_HAS_ACTIVE_BOOKINGS`, `422 VALIDATION_ERROR`

---

**DELETE `/api/v1/travel-listings/:id`**

Auth: Bearer token required. Only owner. Only cancellable if no active bookings.

Success Response `200`: `{ "message": "Listing cancelled." }`

Error Responses: `403 NOT_OWNER`, `409 LISTING_HAS_ACTIVE_BOOKINGS`

---

**POST `/api/v1/travel-listings/:id/verify-flight`**

Triggers async flight verification via the flight API provider.

Auth: Bearer token required. Only listing owner.

Request Body: None (uses flight_number and departure_date from the listing).

Success Response `202`:
```json
{
  "success": true,
  "data": {
    "message": "Flight verification initiated. You will be notified of the result.",
    "verification_id": "uuid"
  }
}
```

---

**POST `/api/v1/travel-listings/:id/boost`**

Initiates a payment to boost the listing's visibility for 7 days.

Auth: Bearer token required. Only listing owner. Listing must be `active`.

Request Body:
```json
{
  "payment_provider": "paystack"
}
```

Success Response `200`: Returns payment initiation data (same pattern as booking payment initiation).

---

### SHIPMENT REQUESTS MODULE

---

**POST `/api/v1/items/check-prohibited`**

Standalone prohibited item check for frontend pre-validation before form submission.

Auth: Bearer token required.

Request Body:
```json
{
  "item_description": "A small bottle of perfume and some clothing items",
  "category_id": "uuid-clothing-accessories"
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "is_prohibited": false,
    "requires_review": false,
    "matched_keywords": [],
    "message": "No prohibited items detected."
  }
}
```

Or if flagged:
```json
{
  "success": true,
  "data": {
    "is_prohibited": true,
    "severity": "auto_block",
    "matched_keywords": ["substance"],
    "message": "This item cannot be shipped through CarryLink."
  }
}
```

---

**POST `/api/v1/shipments`**

Auth: Bearer token required. Email and phone must be verified. No KYC required.

Request Body:
```json
{
  "origin_country": "NG",
  "origin_city": "Lagos",
  "destination_country": "CA",
  "destination_city": "Toronto",
  "pickup_deadline": "2025-03-20",
  "delivery_deadline": "2025-04-05",
  "item_description": "A small package of dry Nigerian spices and a traditional fabric",
  "item_category_id": "uuid-food-and-groceries",
  "declared_weight_kg": 2.5,
  "offered_price": 45.00,
  "currency": "USD",
  "recipient_name": "Chukwuemeka Johnson",
  "recipient_phone": "+14165559001",
  "recipient_email": "c.johnson@example.com",
  "pickup_address": "12 Marina Street, Lagos Island",
  "delivery_address": "55 Finch Avenue W, Toronto, ON M3H 5W9"
}
```

Success Response `201`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "open",
    "is_prohibited_check_passed": true,
    "requires_admin_review": false
  }
}
```

Error Responses: `400 ITEM_AUTO_BLOCKED` (with reason), `202 ITEM_PENDING_REVIEW` (if review_required — returns the created shipment in `draft` status, pending admin approval), `400 INVALID_CORRIDOR`, `422 VALIDATION_ERROR`

---

**GET `/api/v1/shipments`**

Public browse.

Query Parameters:
- `origin_country`, `destination_country` (required)
- `pickup_from`, `pickup_to` (date range)
- `min_weight_kg`, `max_weight_kg`
- `min_offered_price`, `max_offered_price`
- `category_id`
- `page`, `limit`, `sort`

Success Response `200`: Paginated list with sender public profile, images (thumbnail only), item category, declared weight, offered price.

---

**GET `/api/v1/shipments/mine`**

Auth: Bearer token required.

Success Response `200`: Full list of authenticated sender's shipment requests.

---

**GET `/api/v1/shipments/:id`**

Auth: Not required for public view. Owner sees full detail. Non-owners see redacted recipient info.

Success Response `200`: Full shipment detail including images, status history implied by status field.

---

**PUT `/api/v1/shipments/:id`**

Auth: Bearer token required. Only owner. Only before the status reaches `matched`.

Request Body: Any updatable fields.

Error Responses: `403 NOT_OWNER`, `409 SHIPMENT_ALREADY_MATCHED`

---

**DELETE `/api/v1/shipments/:id`**

Auth: Bearer token required. Only owner. Only before `matched`.

Success Response `200`.

---

**POST `/api/v1/shipments/:id/images`**

Generates up to 5 signed Cloudinary upload URLs for item images.

Auth: Bearer token required. Only owner.

Request Body:
```json
{
  "count": 3
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "upload_configs": [
      {
        "upload_url": "https://api.cloudinary.com/...",
        "signature": "...",
        "public_id": "shipments/uuid-1"
      }
    ],
    "submit_url": "POST /api/v1/shipments/:id/images/confirm"
  }
}
```

After upload: client calls `POST /api/v1/shipments/:id/images/confirm` with the array of Cloudinary URLs to persist them.

---

### MATCHING MODULE

---

**GET `/api/v1/matches/for-shipment/:shipmentId`**

Returns suggested travel listings that match this shipment, sorted by `match_score` descending.

Auth: Bearer token required. Only shipment owner.

Query Parameters: `page`, `limit`, `min_score` (0–100)

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "match_id": "uuid",
        "match_score": 87.5,
        "status": "suggested",
        "travel_listing": {
          "id": "uuid",
          "traveler": { "..." },
          "departure_date": "2025-03-15",
          "available_capacity_kg": 10.0,
          "price_per_kg": 12.00,
          "is_verified_flight": true
        }
      }
    ]
  },
  "meta": { "..." }
}
```

---

**GET `/api/v1/matches/for-listing/:listingId`**

Returns suggested shipment requests that match this travel listing, sorted by `match_score` descending.

Auth: Bearer token required. Only listing owner.

Success Response `200`: Same structure with shipment data instead of listing data.

---

**POST `/api/v1/matches/:matchId/express-interest`**

Sender expresses interest in a specific match. Transitions match to `sender_interested`. Notifies the traveler.

Auth: Bearer token required. User must be the sender of the shipment in this match.

Request Body: None.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "match_id": "uuid",
    "status": "sender_interested",
    "message": "The traveler has been notified of your interest."
  }
}
```

Error Responses: `403 NOT_SHIPMENT_OWNER`, `409 MATCH_ALREADY_ACTIONED`, `410 MATCH_EXPIRED`

---

**POST `/api/v1/matches/:matchId/accept`**

Traveler accepts the match. Transitions to `converted_to_booking`. Creates a `bookings` record. Reserves the weight on the listing. Transitions the shipment to `matched`. Notifies the sender.

Auth: Bearer token required. User must be the traveler of the listing in this match.

Request Body:
```json
{
  "agreed_price": 30.00,
  "currency": "USD"
}
```

Success Response `201`:
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "pending_payment",
    "agreed_price": 30.00,
    "platform_commission_pct": 15.00,
    "platform_commission_amount": 4.50,
    "traveler_payout_amount": 25.50,
    "currency": "USD",
    "payment_due_by": "2025-03-10T23:59:59Z",
    "conversation_id": "uuid"
  }
}
```

Error Responses: `403 NOT_LISTING_OWNER`, `409 MATCH_NOT_SENDER_INTERESTED`, `409 INSUFFICIENT_CAPACITY`

---

**POST `/api/v1/matches/:matchId/reject`**

Traveler rejects the match.

Auth: Bearer token required. Must be listing owner.

Request Body:
```json
{
  "reason": "I can't carry items this heavy on this trip."
}
```

Success Response `200`.

---

### BOOKINGS MODULE

---

**GET `/api/v1/bookings`**

Auth: Bearer token required.

Query Parameters: `role` (`as_traveler` | `as_sender`), `status`, `page`, `limit`

Success Response `200`: Paginated bookings with summary fields (counterparty info, amount, status, dates).

---

**GET `/api/v1/bookings/:id`**

Auth: Bearer token required. Only booking participants (traveler or sender) or admin.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "payment_held",
    "traveler": { "id": "uuid", "display_name": "...", "trust_score": 72.5 },
    "sender": { "id": "uuid", "display_name": "..." },
    "travel_listing": { "departure_date": "2025-03-15", "flight_number": "BA0076", "origin_city": "Lagos", "destination_city": "London" },
    "shipment": { "item_description": "...", "declared_weight_kg": 2.5, "pickup_address": "...", "delivery_address": "...", "recipient_name": "..." },
    "agreed_price": 30.00,
    "platform_commission_amount": 4.50,
    "traveler_payout_amount": 25.50,
    "currency": "USD",
    "escrow": { "status": "held", "amount": 30.00 },
    "conversation_id": "uuid",
    "created_at": "..."
  }
}
```

---

**POST `/api/v1/bookings/:id/confirm-pickup`**

Traveler confirms they have physically received the item from the sender. Transitions booking to `in_transit`. Notifies sender and recipient.

Auth: Bearer token required. Must be the traveler.

Request Body: None (optionally includes a photo URL of the item received):
```json
{
  "pickup_photo_url": "https://res.cloudinary.com/..."
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "in_transit",
    "pickup_confirmed_at": "2025-03-14T18:00:00Z"
  }
}
```

Error Responses: `403 NOT_TRAVELER`, `409 BOOKING_NOT_IN_PAYMENT_HELD_STATUS`

---

**POST `/api/v1/bookings/:id/confirm-delivery`**

Sender (or recipient via OTP sent to recipient's phone) confirms the item has been delivered. Transitions to `delivered`, then triggers escrow release workflow. Both parties receive a review prompt notification.

Auth: Bearer token required. Must be the sender, OR the request can carry a `delivery_otp` that was sent to the recipient's phone.

Request Body:
```json
{
  "delivery_otp": "829461",
  "delivery_photo_url": "https://res.cloudinary.com/..."
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "delivered",
    "delivery_confirmed_at": "2025-03-15T21:00:00Z",
    "escrow_release_initiated": true,
    "message": "Funds will be released to the traveler within 24 hours."
  }
}
```

---

**POST `/api/v1/bookings/:id/cancel`**

Auth: Bearer token required. Must be a participant. Cancellation rules: before `payment_held`, either party can cancel freely. After `payment_held`, cancellation triggers a refund workflow with a potential cancellation fee.

Request Body:
```json
{
  "reason": "My travel plans changed."
}
```

Success Response `200`: Returns booking status as `cancelled` and escrow refund status.

Error Responses: `409 BOOKING_CANNOT_BE_CANCELLED` (if in_transit or delivered)

---

### PAYMENTS & ESCROW MODULE

---

**POST `/api/v1/payments/initiate/:bookingId`**

Initiates the escrow payment for a booking. Returns provider-specific data for the client to complete payment.

Auth: Bearer token required. Must be the sender.

Request Body:
```json
{
  "payment_provider": "paystack",
  "return_url": "https://carrylink.app/booking/uuid/payment-complete"
}
```

Success Response `200` (Paystack example):
```json
{
  "success": true,
  "data": {
    "provider": "paystack",
    "payment_url": "https://checkout.paystack.com/...",
    "reference": "CL-20250314-uuid",
    "amount": 30.00,
    "currency": "USD",
    "expires_at": "2025-03-14T22:00:00Z"
  }
}
```

Success Response `200` (Stripe example):
```json
{
  "success": true,
  "data": {
    "provider": "stripe",
    "client_secret": "pi_xxx_secret_yyy",
    "publishable_key": "pk_live_...",
    "amount": 3000,
    "currency": "usd"
  }
}
```

Error Responses: `403 NOT_SENDER`, `409 BOOKING_NOT_PENDING_PAYMENT`, `409 ESCROW_ALREADY_FUNDED`, `400 PROVIDER_NOT_AVAILABLE_FOR_REGION`

---

**POST `/api/v1/payments/webhook/stripe`**

Headers: `Stripe-Signature: t=xxx,v1=xxx`

Processes: `payment_intent.succeeded` → fund escrow, `payment_intent.payment_failed` → notify sender, `refund.updated` → update escrow status

Success Response `200`: `{ "received": true }` — always respond 200 immediately.

---

**POST `/api/v1/payments/webhook/paystack`**

Headers: `X-Paystack-Signature: SHA512-HMAC`

Processes: `charge.success` → fund escrow, `refund.processed` → update escrow

Success Response `200`: `{ "status": "ok" }`

---

**POST `/api/v1/payments/webhook/flutterwave`**

Headers: `verif-hash: configured secret`

Processes: `charge.completed` → fund escrow, `Transfer` → payout confirmation

Success Response `200`.

---

### WALLET MODULE

---

**GET `/api/v1/wallet/balance`**

Auth: Bearer token required.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "balance": 45.00,
    "currency": "USD",
    "pending_release": 25.50,
    "is_frozen": false
  }
}
```

---

**GET `/api/v1/wallet/transactions`**

Auth: Bearer token required.

Query Parameters: `type` (credit|debit), `category`, `page`, `limit`, `from_date`, `to_date`

Success Response `200`: Paginated ledger entries.

---

**POST `/api/v1/wallet/withdraw`**

Auth: Bearer token required. KYC must be approved.

Request Body:
```json
{
  "amount": 40.00,
  "currency": "USD",
  "bank_account": {
    "account_number": "0123456789",
    "bank_code": "058",
    "account_name": "Adaeze Okafor"
  },
  "payment_provider": "paystack"
}
```

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "withdrawal_reference": "WD-uuid",
    "amount": 40.00,
    "status": "processing",
    "estimated_arrival": "1-2 business days"
  }
}
```

Error Responses: `400 INSUFFICIENT_BALANCE`, `403 KYC_REQUIRED`, `403 WALLET_FROZEN`

---

### MESSAGING MODULE

---

**GET `/api/v1/conversations`**

Auth: Bearer token required.

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "context_type": "booking",
        "context_id": "booking-uuid",
        "other_participant": {
          "id": "uuid",
          "display_name": "Ada O.",
          "avatar_url": "..."
        },
        "last_message": {
          "content": "I will be at the airport by 6pm.",
          "sent_at": "2025-03-14T17:00:00Z",
          "is_mine": false
        },
        "unread_count": 2
      }
    ]
  }
}
```

---

**GET `/api/v1/conversations/:id/messages`**

Auth: Bearer token required. Must be a conversation participant.

Query Parameters: `before_id` (cursor — ID of oldest message in current view), `limit` (default 50)

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "sender_id": "uuid",
        "is_mine": true,
        "content": "Please make sure to seal the package well.",
        "type": "text",
        "image_url": null,
        "sent_at": "2025-03-14T16:45:00Z"
      }
    ],
    "has_more": true,
    "next_cursor": "uuid-of-oldest-message-in-this-batch"
  }
}
```

---

**POST `/api/v1/conversations/:id/messages`**

HTTP fallback for message sending (real-time via Socket.IO preferred).

Auth: Bearer token required. Must be a participant.

Request Body:
```json
{
  "content": "Will be there at 6pm.",
  "type": "text"
}
```

Success Response `201`: Returns the created message object.

---

**PUT `/api/v1/conversations/:id/read`**

Marks all messages in the conversation as read for the authenticated user.

Auth: Bearer token required.

Success Response `200`.

---

### Socket.IO Events

**Connection:** `io.connect({ auth: { token: "Bearer eyJ..." } })`

**Client → Server Events:**
- `join_conversation` → `{ conversation_id: "uuid" }` — joins the room
- `leave_conversation` → `{ conversation_id: "uuid" }`
- `send_message` → `{ conversation_id: "uuid", content: "...", type: "text" }` — server validates, saves to DB, broadcasts
- `typing_start` → `{ conversation_id: "uuid" }`
- `typing_stop` → `{ conversation_id: "uuid" }`

**Server → Client Events:**
- `new_message` → full message object
- `user_typing` → `{ user_id: "uuid", conversation_id: "uuid" }`
- `user_stopped_typing` → same
- `message_read` → `{ conversation_id: "uuid", user_id: "uuid", read_at: "..." }`
- `notification` → full notification object (real-time in-app notifications)
- `booking_status_changed` → `{ booking_id: "uuid", new_status: "..." }` — triggers UI refresh

---

### NOTIFICATIONS MODULE

---

**GET `/api/v1/notifications`**

Auth: Bearer token required.

Query Parameters: `unread_only` (boolean), `page`, `limit`

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "payment_received",
        "title": "Escrow funded!",
        "body": "Adaeze has paid for your trip. Pickup is confirmed.",
        "data": { "booking_id": "uuid" },
        "is_read": false,
        "created_at": "2025-03-14T12:00:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

---

**PUT `/api/v1/notifications/:id/read`**

Auth: Bearer token required.

Success Response `200`.

---

**PUT `/api/v1/notifications/read-all`**

Auth: Bearer token required.

Success Response `200`: `{ "marked_read": 12 }`

---

### REVIEWS MODULE

---

**POST `/api/v1/reviews/:bookingId`**

Auth: Bearer token required. Must be a booking participant. Booking must be `completed`. Can only review once per booking.

Request Body:
```json
{
  "rating": 5,
  "comment": "Incredibly reliable and communicative. Highly recommend!"
}
```

Success Response `201`:
```json
{
  "success": true,
  "data": {
    "review_id": "uuid",
    "reviewee_trust_score_updated_to": 75.2
  }
}
```

Error Responses: `409 ALREADY_REVIEWED`, `403 BOOKING_NOT_COMPLETED`, `403 NOT_PARTICIPANT`

---

**GET `/api/v1/reviews/user/:userId`**

Public endpoint. Returns paginated reviews received by a user.

Query Parameters: `role` (as_traveler | as_sender), `page`, `limit`

Success Response `200`: Paginated reviews with reviewer public info, rating, comment, booking date.

---

**GET `/api/v1/reviews/mine`**

Auth: Bearer token required.

Query Parameters: Same as above.

Success Response `200`: Reviews received by the authenticated user.

---

### DISPUTES MODULE

---

**POST `/api/v1/disputes/:bookingId`**

Auth: Bearer token required. Must be a booking participant. Booking must be `in_transit` or `delivered`.

Request Body:
```json
{
  "type": "item_damaged",
  "description": "The package arrived and the item inside was broken. I have photos."
}
```

Success Response `201`:
```json
{
  "success": true,
  "data": {
    "dispute_id": "uuid",
    "status": "open",
    "escrow_status": "frozen",
    "message": "Your dispute has been opened. Please submit evidence. Our team will review within 48 hours."
  }
}
```

Error Responses: `403 NOT_PARTICIPANT`, `409 DISPUTE_ALREADY_OPEN`, `403 BOOKING_NOT_DISPUTABLE`

---

**GET `/api/v1/disputes/:disputeId`**

Auth: Bearer token required. Only participants or admin.

Success Response `200`: Full dispute detail, evidence list, resolution if resolved.

---

**POST `/api/v1/disputes/:disputeId/evidence`**

Auth: Bearer token required. Must be a dispute participant. Dispute must be `open` or `under_review`.

Request Body:
```json
{
  "type": "image",
  "url": "https://res.cloudinary.com/..."
}
```

Or for text statements:
```json
{
  "type": "text_statement",
  "text_content": "I handed the package to the traveler in perfect condition. I have the WhatsApp chat to prove it."
}
```

Success Response `201`.

---

**GET `/api/v1/disputes/mine`**

Auth: Bearer token required.

Success Response `200`: Paginated list of disputes the user is party to.

---

### FLIGHT VERIFICATION MODULE

---

**GET `/api/v1/flights/search`**

Used by the frontend to pre-verify a flight exists when a traveler is creating a listing.

Auth: Bearer token required.

Query Parameters:
- `flight_number`: e.g. `BA0076`
- `date`: e.g. `2025-03-15`

Success Response `200`:
```json
{
  "success": true,
  "data": {
    "found": true,
    "flight_number": "BA0076",
    "airline": "British Airways",
    "origin_iata": "LOS",
    "destination_iata": "LHR",
    "departure_date": "2025-03-15",
    "departure_time": "23:55",
    "arrival_time": "06:30+1",
    "status": "scheduled"
  }
}
```

Error Responses: `404 FLIGHT_NOT_FOUND`, `502 FLIGHT_API_UNAVAILABLE`

---

### ADMIN MODULE

All admin endpoints require `Authorization: Bearer <access_token>` with a `role` of `admin` or `superadmin`. Every successful admin action is recorded in `admin_actions` and `audit_logs`.

---

**GET `/api/v1/admin/users`**

Query Parameters: `status`, `kyc_status`, `role`, `country`, `search` (email or name), `page`, `limit`

Success Response `200`: Paginated users with full profile, KYC status, wallet balance, dispute count, last login.

---

**GET `/api/v1/admin/users/:userId`**

Full admin view: all profile fields, KYC details, device fingerprints, login history, all bookings, all disputes, wallet ledger summary.

---

**POST `/api/v1/admin/users/:userId/freeze`**

Request Body: `{ "reason": "Suspicious activity detected." }`

Actions: Sets `users.status = suspended`, revokes all refresh tokens, freezes wallet, sends notification to user.

Success Response `200`.

---

**POST `/api/v1/admin/users/:userId/unfreeze`**

Request Body: `{ "reason": "Investigation cleared." }`

Success Response `200`.

---

**POST `/api/v1/admin/users/:userId/ban`**

Request Body: `{ "reason": "Confirmed fraud." }`

Permanent. Sets `users.status = banned`. Cancels all active bookings. Triggers refunds on all held escrows.

Success Response `200`.

---

**GET `/api/v1/admin/kyc/pending`**

Query Parameters: `provider`, `id_country`, `page`, `limit`

Success Response `200`: Paginated KYC submissions in `pending` or `under_review` status with all document URLs.

---

**POST `/api/v1/admin/kyc/:kycId/approve`**

Actions: Sets KYC status to `approved`, sets `expires_at`, awards `verified_traveler` badge, notifies user.

Success Response `200`.

---

**POST `/api/v1/admin/kyc/:kycId/reject`**

Request Body: `{ "rejection_reason": "The submitted ID appears to be expired." }`

Success Response `200`.

---

**GET `/api/v1/admin/shipments/flagged`**

Returns shipments in `draft` status with `requires_admin_review = true`.

Success Response `200`: Paginated with full shipment detail and the matched prohibited keywords.

---

**POST `/api/v1/admin/shipments/:id/approve`**

Sets `requires_admin_review = false`, `is_prohibited_check_passed = true`, `status = open`. Notifies sender.

---

**POST `/api/v1/admin/shipments/:id/reject`**

Request Body: `{ "reason": "Item cannot be shipped." }`

Sets `status = cancelled`. Notifies sender.

---

**GET `/api/v1/admin/disputes`**

Query Parameters: `status`, `type`, `assigned_to_me` (boolean), `page`, `limit`

---

**GET `/api/v1/admin/disputes/:disputeId`**

Full dispute view with all evidence, booking context, escrow state, conversation history (admin can read).

---

**POST `/api/v1/admin/disputes/:disputeId/assign`**

Admin self-assigns or assigns to another admin.

Request Body: `{ "admin_id": "uuid" }`

---

**POST `/api/v1/admin/disputes/:disputeId/resolve`**

Request Body:
```json
{
  "resolution_type": "partial_refund",
  "refund_amount": 15.00,
  "resolution": "Item was delivered but the declared weight was less than stated. Partial refund of 50% issued to sender."
}
```

Actions: Updates dispute to `resolved`. Based on `resolution_type`: executes escrow.releaseFunds or escrow.refundFunds (full or partial), updates wallet ledgers for both parties, notifies both parties, marks booking `completed`.

Success Response `200`.

---

**POST `/api/v1/admin/escrow/:bookingId/freeze`**

Independent escrow freeze action (e.g. suspicious activity outside of a formal dispute).

Request Body: `{ "reason": "..." }`

---

**POST `/api/v1/admin/escrow/:bookingId/release`**

Manual escrow release after investigation.

Request Body: `{ "reason": "..." }`

---

**GET `/api/v1/admin/reports/transactions`**

Query Parameters: `from_date`, `to_date`, `corridor_id`, `payment_provider`, `status`, `format` (`json` | `csv`)

Success Response `200`: Aggregated transaction data with GMV, commission collected, refund totals, by corridor and provider. If `format=csv`, returns a downloadable CSV file.

---

**GET `/api/v1/admin/audit-logs`**

Query Parameters: `actor_id`, `entity_type`, `entity_id`, `action`, `from_date`, `to_date`, `page`, `limit`

Success Response `200`: Paginated audit log entries.

---

**GET `/api/v1/health`**

Public health check.

Success Response `200`:
```json
{
  "status": "ok",
  "db": "connected",
  "uptime_seconds": 86400,
  "version": "1.0.0"
}
```

---
