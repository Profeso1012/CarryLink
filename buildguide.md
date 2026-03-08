CarryLink — Complete Frontend Architecture Plan

The Frontend Philosophy
Before any structure, understand the mental model. The frontend is not just "pages with forms." It is a state machine that mirrors the backend's booking lifecycle. Every screen a user sees reflects the current state of one or more backend entities — a booking's status, a KYC verification's status, an escrow's status — and the UI must respond to those states in real time. Some state changes happen because a user clicked a button. Others happen because a webhook fired on the backend and a WebSocket event arrived. Your component architecture must be designed around this reality from day one.
The existing HTML files (landing page, account dashboard, innovation grid) are your design system. They define the visual language: the cyan and dark teal color palette, the glassmorphic header, the card styles, the typography. Every new page you build inherits from them. The conversion job is to make them dynamic, data-connected, and reactive — not to redesign them.

Tech Stack Decisions for the frontend build
React 18 with Vite as the build tool (Builder.io AI works best with this setup). React Router v6 for client-side routing. Axios for API calls — not bare fetch — because Axios allows you to configure interceptors globally (one place to attach the Authorization header to every request, one place to catch 401 responses and trigger token refresh). Zustand for global state management — it is far lighter than Redux and requires almost no boilerplate, which means Builder.io AI can scaffold it cleanly. Socket.IO client for real-time messaging and notifications. React Query (TanStack Query) for all data fetching that needs caching, background refetching, and loading/error states — this is the library that makes your API calls feel live without you manually managing loading booleans everywhere.

Project Folder Structure
carrylink-frontend/
├── public/
│   └── assets/
│       ├── airbus-carbon-grid-cropped-lg.png   (footer background)
│       └── favicon.ico
├── src/
│   ├── api/                    ← All backend API calls live here
│   │   ├── client.js           ← Axios instance with interceptors
│   │   ├── auth.api.js
│   │   ├── kyc.api.js
│   │   ├── users.api.js
│   │   ├── listings.api.js
│   │   ├── shipments.api.js
│   │   ├── matches.api.js
│   │   ├── bookings.api.js
│   │   ├── payments.api.js
│   │   ├── wallet.api.js
│   │   ├── messaging.api.js
│   │   ├── notifications.api.js
│   │   ├── reviews.api.js
│   │   ├── disputes.api.js
│   │   ├── flights.api.js
│   │   └── admin.api.js
│   ├── store/                  ← Zustand global state stores
│   │   ├── auth.store.js
│   │   ├── notifications.store.js
│   │   └── socket.store.js
│   ├── hooks/                  ← Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useSocket.js
│   │   ├── useNotifications.js
│   │   ├── useKYCStatus.js
│   │   ├── useBookingUpdates.js
│   │   └── useDebounce.js
│   ├── components/             ← Reusable UI pieces
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── AccountLayout.jsx
│   │   ├── auth/
│   │   │   ├── AuthModal.jsx
│   │   │   ├── EmailScreen.jsx
│   │   │   ├── OTPScreen.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── StatusPill.jsx
│   │   │   ├── TrustScore.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   └── Pagination.jsx
│   │   ├── cards/
│   │   │   ├── TravelerCard.jsx
│   │   │   ├── ListingCard.jsx
│   │   │   ├── ShipmentCard.jsx
│   │   │   ├── BookingCard.jsx
│   │   │   ├── MatchCard.jsx
│   │   │   └── ReviewCard.jsx
│   │   ├── forms/
│   │   │   ├── ListingForm.jsx
│   │   │   ├── ShipmentForm.jsx
│   │   │   ├── ProhibitedItemChecker.jsx
│   │   │   └── FlightSearchInput.jsx
│   │   ├── kyc/
│   │   │   ├── KYCStatusBanner.jsx
│   │   │   └── KYCInitiateForm.jsx
│   │   ├── messaging/
│   │   │   ├── ConversationList.jsx
│   │   │   ├── MessageThread.jsx
│   │   │   └── MessageBubble.jsx
│   │   ├── payments/
│   │   │   ├── StripePaymentWidget.jsx
│   │   │   └── PaystackPaymentButton.jsx
│   │   └── notifications/
│   │       ├── NotificationBell.jsx
│   │       └── NotificationDropdown.jsx
│   ├── pages/
│   │   ├── public/             ← No auth required
│   │   │   ├── Landing.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── ForTravelers.jsx
│   │   │   ├── ForSenders.jsx
│   │   │   ├── BrowseListings.jsx
│   │   │   ├── BrowseShipments.jsx
│   │   │   ├── ListingDetail.jsx
│   │   │   ├── ShipmentDetail.jsx
│   │   │   └── PublicProfile.jsx
│   │   ├── auth/               ← Only unauthenticated users
│   │   │   ├── OAuthCallback.jsx
│   │   │   └── VerifyEmailCallback.jsx
│   │   ├── account/            ← Authenticated users
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyShipments.jsx
│   │   │   ├── MyTrips.jsx
│   │   │   ├── PostTrip.jsx
│   │   │   ├── SendPackage.jsx
│   │   │   ├── MyMatches.jsx
│   │   │   ├── BookingDetail.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── WalletPage.jsx
│   │   │   ├── KYCPage.jsx
│   │   │   ├── KYCReturnPage.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Reviews.jsx
│   │   │   ├── Disputes.jsx
│   │   │   ├── DisputeDetail.jsx
│   │   │   └── Settings.jsx
│   │   └── admin/              ← Admin role only
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminUsers.jsx
│   │       ├── AdminKYCQueue.jsx
│   │       ├── AdminShipmentsQueue.jsx
│   │       ├── AdminDisputes.jsx
│   │       ├── AdminEscrow.jsx
│   │       └── AdminReports.jsx
│   ├── utils/
│   │   ├── formatters.js       ← Date, currency, weight formatting
│   │   ├── validators.js       ← Client-side form validation
│   │   ├── constants.js        ← Corridor list, status labels, etc.
│   │   └── errorParser.js      ← Converts API error responses to user messages
│   ├── App.jsx                 ← Router and global providers
│   └── main.jsx                ← Entry point
├── .env.example
└── package.json


SECTION 1: THE API CLIENT — The Single Bridge to the Backend

src/api/client.js
This is the most important file in the entire frontend. Everything else calls through it. It is one Axios instance configured once, and every API function in every other .api.js file imports from it.
What it does and how:
It creates an Axios instance with baseURL set to your backend server URL (from the environment variable VITE_API_BASE_URL). It attaches a request interceptor — a function that runs before every outgoing request — that reads the access token from localStorage and injects Authorization: Bearer <token> into the headers automatically. This means no single API function ever has to manually attach the auth header.
It attaches a response interceptor — a function that runs when any response comes back — that specifically watches for 401 Unauthorized responses. When it catches one, it checks if the error is TOKEN_EXPIRED (as opposed to INVALID_TOKEN). If expired, it calls the refresh token endpoint to get a new access token, saves the new token, and retries the original failed request transparently. The user never sees the expiry. If the refresh itself fails (refresh token is also expired), it clears all stored tokens and redirects to the landing page, forcing re-login.
Functions exported:
apiClient — the configured Axios instance, used directly by all .api.js files
setAccessToken(token) — saves the token to localStorage and updates the Axios instance header
clearTokens() — removes all stored tokens (used on logout and on auth failure)
getAccessToken() — reads the current token from localStorage
Why this matters for debugging: If you hit any endpoint and get a mysterious network error, check here first. If you get responses but no Authorization header is being sent, the interceptor is broken. If token refresh isn't working, the 401 interceptor logic is the culprit.

src/api/auth.api.js
Every function here maps directly to one endpoint in the Auth module of the API documentation.
register({ email, phone_number, password, first_name, last_name, country_of_residence }) — POSTs to /auth/register. On success, the response just says "check your email." Nothing is stored yet — no token is returned at this stage.
verifyEmail({ email, otp }) — POSTs to /auth/verify-email. On success, triggers the phone OTP flow. Still no token.
sendPhoneOTP({ email }) — POSTs to /auth/send-phone-otp.
verifyPhone({ email, otp }) — POSTs to /auth/verify-phone. This is the function that returns tokens. On success, the caller saves access_token and refresh_token to localStorage and updates the auth store.
login({ email, password, device_info }) — POSTs to /auth/login. On success, same token-saving pattern.
loginWithGoogle({ id_token }) — POSTs to /auth/login/google. The id_token comes from Google's JavaScript SDK that runs in the browser.
loginWithApple({ identity_token, authorization_code, given_name, family_name }) — POSTs to /auth/login/apple.
refreshToken({ refresh_token }) — POSTs to /auth/refresh-token. This is called by the Axios interceptor automatically — it is never called directly from a component.
logout({ refresh_token }) — POSTs to /auth/logout.
forgotPassword({ email }) — POSTs to /auth/forgot-password.
resetPassword({ email, otp, new_password }) — POSTs to /auth/reset-password.
changePassword({ current_password, new_password }) — POSTs to /auth/change-password.

src/api/kyc.api.js
initiateKYC({ id_type, id_country, id_number }) — POSTs to /kyc/initiate. Returns { kyc_id, session_id, verification_url }. The caller stores session_id and immediately redirects the user's browser to verification_url — this takes them to Didit's hosted verification page.
getKYCStatus() — GETs /kyc/status. Returns the current status. This is called when the user returns from Didit's page (via the callback URL), and also polled periodically while a KYC is pending.

src/api/users.api.js
getMyProfile() — GETs /users/me. Returns the full authenticated user object including profile, KYC status, wallet balance, and badges. Called on every app load after authentication.
updateMyProfile(updates) — PUTs /users/me.
getAvatarUploadURL() — POSTs /users/me/avatar. Returns Cloudinary signed upload parameters.
getPublicProfile(userId) — GETs /users/:userId.
registerPushToken({ token, platform }) — POSTs /users/push-token.

src/api/listings.api.js
createListing(data) — POSTs /travel-listings.
getListings(filters) — GETs /travel-listings with query parameters built from the filters object.
getMyListings(params) — GETs /travel-listings/mine.
getListingById(id) — GETs /travel-listings/:id.
updateListing(id, updates) — PUTs /travel-listings/:id.
cancelListing(id) — DELETEs /travel-listings/:id.
verifyListingFlight(id) — POSTs /travel-listings/:id/verify-flight.
boostListing(id, payment_provider) — POSTs /travel-listings/:id/boost.

src/api/shipments.api.js
checkProhibitedItem({ item_description, category_id }) — POSTs /items/check-prohibited. Called as the user types the item description (debounced) to give real-time feedback before form submission.
createShipment(data) — POSTs /shipments.
getShipments(filters) — GETs /shipments.
getMyShipments(params) — GETs /shipments/mine.
getShipmentById(id) — GETs /shipments/:id.
updateShipment(id, updates) — PUTs /shipments/:id.
cancelShipment(id) — DELETEs /shipments/:id.
generateImageUploadURLs(id, count) — POSTs /shipments/:id/images.
confirmImageURLs(id, urls) — POSTs /shipments/:id/images/confirm.

src/api/matches.api.js
getMatchesForShipment(shipmentId, params) — GETs /matches/for-shipment/:shipmentId.
getMatchesForListing(listingId, params) — GETs /matches/for-listing/:listingId.
expressInterest(matchId) — POSTs /matches/:matchId/express-interest.
acceptMatch(matchId, { agreed_price, currency }) — POSTs /matches/:matchId/accept. Returns the new booking object.
rejectMatch(matchId, { reason }) — POSTs /matches/:matchId/reject.

src/api/bookings.api.js
getBookings(params) — GETs /bookings.
getBookingById(id) — GETs /bookings/:id.
confirmPickup(id, { pickup_photo_url }) — POSTs /bookings/:id/confirm-pickup.
confirmDelivery(id, { delivery_otp, delivery_photo_url }) — POSTs /bookings/:id/confirm-delivery.
cancelBooking(id, { reason }) — POSTs /bookings/:id/cancel.

src/api/payments.api.js
initiatePayment(bookingId, { payment_provider, return_url }) — POSTs /payments/initiate/:bookingId. Returns either a Stripe client_secret or a Paystack payment_url.

src/api/wallet.api.js
getWalletBalance() — GETs /wallet/balance.
getWalletTransactions(params) — GETs /wallet/transactions.
initiateWithdrawal(data) — POSTs /wallet/withdraw.

src/api/messaging.api.js
getConversations() — GETs /conversations.
getMessages(conversationId, params) — GETs /conversations/:id/messages.
sendMessageHTTP(conversationId, { content, type }) — POSTs /conversations/:id/messages. This is the HTTP fallback; real-time sending happens via Socket.IO.
markConversationRead(conversationId) — PUTs /conversations/:id/read.

src/api/notifications.api.js
getNotifications(params) — GETs /notifications.
markNotificationRead(id) — PUTs /notifications/:id/read.
markAllRead() — PUTs /notifications/read-all.

src/api/reviews.api.js
submitReview(bookingId, { rating, comment }) — POSTs /reviews/:bookingId.
getUserReviews(userId, params) — GETs /reviews/user/:userId.
getMyReviews(params) — GETs /reviews/mine.

src/api/disputes.api.js
openDispute(bookingId, { type, description }) — POSTs /disputes/:bookingId.
getDispute(disputeId) — GETs /disputes/:disputeId.
submitEvidence(disputeId, { type, url, text_content }) — POSTs /disputes/:disputeId/evidence.
getMyDisputes(params) — GETs /disputes/mine.

src/api/flights.api.js
searchFlight({ flight_number, date }) — GETs /flights/search. Called when a traveler types their flight number while creating a listing.

SECTION 2: GLOBAL STATE — What Lives Everywhere

src/store/auth.store.js
This Zustand store is the single source of truth for the authenticated user across the entire app. Every component that needs to know "who is logged in" reads from here.
State it holds: user (the full profile object from GET /users/me), isAuthenticated (boolean), isLoading (true while the initial auth check runs on page load).
Functions it exposes:
setUser(user) — called after login, token refresh, or profile update
clearUser() — called on logout
updateKYCStatus(status) — called when the KYC status changes (from polling or WebSocket event), updates just the kyc_status field in the stored user without refetching everything
updateWalletBalance(balance) — called when a payment is received or released
initialize() — called once when the app loads. It reads the stored access token, if present calls GET /users/me to verify the session is still valid and hydrate the user state, and sets isLoading = false when done. If GET /users/me returns 401, it calls clearUser().

src/store/notifications.store.js
State: notifications (array), unreadCount (number).
Functions: addNotification(notification) — prepends a new notification (called when a Socket.IO notification event arrives). setNotifications(list) — replaces the list with the result of GET /notifications. decrementUnread(), resetUnread().

src/store/socket.store.js
State: socket (the Socket.IO client instance or null), isConnected.
Functions: connect(accessToken) — creates the Socket.IO connection, registers all server-side event listeners. disconnect() — disconnects the socket. joinConversation(conversationId), leaveConversation(conversationId) — emits Socket.IO room events.
The socket event listeners registered on connect() are: new_message (calls the messaging store or a message callback), notification (calls notificationsStore.addNotification), booking_status_changed (calls React Query's queryClient.invalidateQueries(['booking', id]) to trigger a refetch of the booking detail), user_typing, user_stopped_typing.

SECTION 3: CUSTOM HOOKS — The Smart Connectors

src/hooks/useAuth.js
Combines the auth store and auth API into a single hook that any component can use.
useAuth() returns: { user, isAuthenticated, isLoading, login, loginWithGoogle, loginWithApple, logout, register, verifyEmail, verifyPhone }. Each of these functions handles both the API call and the store update. For example, login() calls authApi.login(), on success calls setAccessToken() and authStore.setUser(), then initializes the Socket.IO connection.

src/hooks/useSocket.js
Returns { socket, isConnected, joinConversation, leaveConversation, sendMessage, emitTyping }. Components that need real-time messaging use this hook. It reads from the socket store and provides typed wrappers around socket.emit calls.

src/hooks/useKYCStatus.js
This hook handles the KYC polling pattern. When a user has kyc_status === 'pending', their KYC is being processed by Didit asynchronously. The hook polls GET /kyc/status every 30 seconds while the status is pending, and stops once it reaches approved or rejected. On status change, it updates the auth store.
Returns { kycStatus, isPolling, refetchStatus }.

src/hooks/useNotifications.js
Loads notifications on mount, returns the list and unread count from the store, and exposes markRead(id) and markAllRead() functions.

src/hooks/useBookingUpdates.js
Takes a bookingId parameter. Uses React Query to fetch the booking and also listens for the booking_status_changed Socket.IO event for that specific booking ID. When the event arrives, it invalidates the React Query cache for that booking, which triggers a background refetch. Components using this hook always see the freshest booking state.

SECTION 4: LAYOUT COMPONENTS — The Permanent Fixtures

src/components/layout/Header.jsx
This is the glassmorphic header converted from your existing HTML exactly as designed. It receives no props — it reads everything from the auth store.
Behavior:
Always rendered on every page
The scroll effect (adding scrolled class at 80px, hiding when scrolling down fast, reappearing when scrolling up) is implemented using a useEffect with a scroll event listener, exactly as in the existing JavaScript
If isAuthenticated is false: shows "How It Works", "Travelers", "Senders", and "Sign Up" button (which opens AuthModal)
If isAuthenticated is true: shows "How It Works", "Travelers", "Senders", "My Account" link (navigates to /account/dashboard), and the notification bell icon with NotificationBell component instead of "Sign Up"
The AuthModal component is rendered inside the Header component and its open/close state is managed locally with useState

src/components/layout/Footer.jsx
The footer from the existing HTML converted to a static React component. No dynamic data needed. Carbon grid background image, dot pattern, social links, column links. Pure HTML-to-JSX conversion.

src/components/layout/AccountLayout.jsx
Wraps all /account/* pages. Renders the Header, then a two-column layout with Sidebar on the left and the page content on the right (the main content from the existing account dashboard HTML). The Sidebar receives the current path from useLocation() to highlight the active menu item.
Any /account/* page that needs the sidebar layout just wraps itself in <AccountLayout>. The individual page component becomes the children.

src/components/layout/Sidebar.jsx
Converted directly from the sidebar in the existing account dashboard HTML. Dynamic behavior: reads user.kyc_status from the auth store to show either "Verified" (green) or "Pending" (amber) badge next to "KYC Verification". Reads unread message count from the messaging data to show a badge on "Messages". Uses NavLink from React Router to apply the active class automatically based on the current URL.

src/components/auth/AuthModal.jsx
Converted from the modal in the existing HTML. Manages two screens: EmailScreen and OTPScreen. Importantly, this modal handles the full registration flow as a multi-step wizard, not just email capture.
State managed inside this modal: step (which screen is showing), email, registrationData (accumulates data across steps), isLoginMode vs isRegisterMode.
The flow inside the modal:
When in register mode, the user enters their email. On "Continue," it checks if the email already exists (optionally — or just proceed). The OTP screen appears. User enters the 4-digit email OTP. On verification, the modal expands to show the full registration form (phone, password, first name, last name, country). On form submit, it calls register(), then sends phone OTP, then shows the phone OTP screen. On phone OTP verification, verifyPhone() is called, tokens are saved, the modal closes, and the user is now logged in.
When in login mode, the email screen shows a password field instead of OTP, calls login() directly.
Google login button calls loginWithGoogle() after getting the Google ID token from Google's SDK. Apple login similarly.

src/components/auth/ProtectedRoute.jsx
Wraps routes that require authentication. Reads isAuthenticated and isLoading from the auth store. If loading, shows a full-page skeleton. If not authenticated, redirects to the landing page (storing the attempted URL so the user can be redirected back after login). If authenticated, renders the children.
There is also an AdminRoute variant that additionally checks user.role === 'admin' and redirects to the dashboard if the user is authenticated but not an admin.

SECTION 5: KEY PAGES — The Flows That Matter Most

src/pages/public/Landing.jsx
This is the existing landing page HTML, converted to React exactly as designed. The conversion is mostly mechanical — replace <div class> with <div className>, replace raw JavaScript with React useEffect and useRef hooks for the scroll and animation behaviors.
The dynamic parts that connect to APIs:
The hero statistics section (2,400+ travelers, 12,000+ deliveries, 68% savings, 4.9/5 rating) can be either hardcoded as marketing copy for MVP, or fetched from a public stats endpoint if you add one later.
The "Browse Listings" search can be a simple form that on submit navigates to /browse/listings?origin=NG&destination=GB with the selected parameters as query params. No API call on the landing page itself.
The AuthModal is triggered by the "Sign Up" button in the header (which is part of Header.jsx, not this page).
The innovation grid (from your second HTML file) becomes the platform features section. The five images and descriptions are CarryLink-specific content: Escrow & Payments, KYC Verification, Smart Matching, Reputation & Reviews, Dispute Resolution. The JavaScript panorama effect from that file is preserved in a React useEffect that runs after mount.

src/pages/account/KYCPage.jsx
This page has more states to handle than almost any other, because Didit's flow takes users off your site and back again.
State 1 — Not Started: Shows KYCInitiateForm with country selector, document type selector, and optional ID number field. Explains why KYC is needed.
State 2 — Initiated / Pending: User has been redirected to Didit and not yet returned, OR user returned but verification is still processing. Shows a "Verification in Progress" card with status indicator. The useKYCStatus hook is polling in the background every 30 seconds. If the user is currently on this page, they see the status update automatically when it resolves.
State 3 — Approved: Shows a success state with the "Verified Traveler" badge, expiry date, and a call-to-action to post their first trip.
State 4 — Rejected: Shows the rejection reason from the API response and a "Try Again" button that resets to State 1 and allows re-initiation.
The KYC initiation flow in detail:
User fills the form and clicks "Start Verification." KYCInitiateForm calls kycApi.initiateKYC({ id_type, id_country, id_number }). On success, the response contains { kyc_id, session_id, verification_url }. The page stores session_id in localStorage under the key kyc_session_id. Then it does window.location.href = verification_url — this takes the user to Didit's platform entirely.
The return flow: Didit redirects the user back to your app at a URL you configure in the Didit dashboard — something like https://carrylink.app/account/kyc/return. This route renders KYCReturnPage.jsx.

src/pages/auth/KYCReturnPage.jsx
This tiny page renders when the user comes back from Didit. It does three things: shows a "Checking your verification status..." loading spinner, calls kycApi.getKYCStatus(), then redirects to /account/kyc which will now show the correct state based on the returned status. No user interaction needed — it's a pass-through transition page.

src/pages/account/SendPackage.jsx
This is a multi-step form page — the most complex form in the user-facing side of the app.
Step 1 — Route & Timing: Origin country, origin city (dropdown filtered to cities with active corridors), destination country, destination city, pickup deadline, delivery deadline. On step completion, validates that the corridor is active.
Step 2 — Item Details: Item description textarea (with live prohibited item checking as the user types, using the useDebounce hook and checkProhibitedItem API — shows a green checkmark or red warning as they type), category selector, declared weight in kg, offered price with currency selector. The ProhibitedItemChecker component handles this sub-flow.
Step 3 — Recipient Details: Recipient name, phone number, email (optional), pickup address, delivery address.
Step 4 — Photos: Image upload. Calls generateImageUploadURLs(shipmentId, count), gets the Cloudinary signed URLs, uploads images directly to Cloudinary from the browser, then calls confirmImageURLs() with the resulting URLs. Note: the shipment is created at the start of Step 4 (after Step 3 is completed) so there's a shipment ID to attach images to.
Step 5 — Review & Submit: Summary of all entered data. The "Submit" button either goes through if the item check passed, or shows an admin review warning if requires_admin_review is true (telling the user their shipment will be reviewed before going live).
On successful creation, redirect to /account/my-shipments which shows the new shipment in "open" status.

src/pages/account/PostTrip.jsx
A simpler multi-step form than SendPackage.
Step 1 — Route & Flight: Origin country, origin city, destination country, destination city, departure date, arrival date, airline (optional). Flight number field with a live flight search — as the user types the flight number and date is set, flightsApi.searchFlight() is called after a 500ms debounce. If found, shows the verified flight details. If not found, the listing can still be created as unverified.
Step 2 — Capacity & Pricing: Total luggage capacity in kg (slider + number input), price per kg or flat fee toggle, currency selector, accepted item categories (multi-select from the seeded categories list).
Step 3 — Notes: Optional notes to senders. Preview of what the listing will look like publicly.
On submit, calls createListing(). On success, redirects to /account/my-trips.
Requires KYC to be approved. If not, instead of the form, shows KYCStatusBanner component with a link to complete verification first.

src/pages/account/MyMatches.jsx
This is the page where matching comes to life. It shows two tabs: "Matches for My Shipments" and "Interested in My Trips."
For senders: Lists their open shipments, and for each shipment shows the matched travel listings sorted by score. Each match shows the MatchCard component with the traveler's profile, departure date, score, price. The "Express Interest" button calls matchesApi.expressInterest(matchId), updates the match status in the UI, and shows a "Waiting for traveler to accept" state.
For travelers: Lists matches where senders have expressed interest in their listings. Each match shows the MatchCard with the shipment details. "Accept" button opens a confirmation modal asking for the agreed price, then calls matchesApi.acceptMatch(matchId, { agreed_price }). On success, the response includes booking_id, and the user is navigated to /account/booking/:bookingId which shows the new booking in pending_payment state.

src/pages/account/BookingDetail.jsx
The most state-dependent page in the app. It fetches the booking with bookingsApi.getBookingById(id) and uses useBookingUpdates(id) to stay live.
The UI completely changes based on booking.status:
pending_payment — Shows the booking summary and a payment section. The payment section detects the sender's country from their profile and offers the appropriate provider (Paystack for Nigerian accounts, Stripe for others). Clicking "Pay Now" for Paystack calls paymentsApi.initiatePayment(bookingId, { provider: 'paystack', return_url }) and gets back a payment_url, then does window.location.href = payment_url. For Stripe, it gets back a client_secret and renders the Stripe Elements widget (StripePaymentWidget component) embedded inline.
payment_held — For the traveler: shows pickup instructions and a "Confirm Pickup" button with optional photo upload. For the sender: shows "Waiting for traveler to confirm pickup" status. Calls bookingsApi.confirmPickup(id) on button click.
in_transit — For the sender: shows delivery confirmation form with an OTP field (explaining that the OTP was sent to the recipient's phone) and optional delivery photo. Calls bookingsApi.confirmDelivery(id, { delivery_otp }). Also shows an "Open Dispute" button. For the traveler: shows "Delivery in progress" status.
delivered / completed — Shows the completion summary. If the user hasn't left a review for this booking yet, shows the review form inline. Calls reviewsApi.submitReview(bookingId, { rating, comment }).
disputed — Shows the dispute status, a link to the dispute detail page, and the evidence submission interface.
The in-app chat for this booking is always shown as a collapsible panel at the bottom of this page, powered by the MessageThread component and the Socket.IO connection.

src/pages/account/Messages.jsx
Split-pane layout matching the existing dashboard styling. Left pane: ConversationList showing all conversations sorted by last_message_at, each with the other participant's name and avatar, last message preview, and unread count badge. Right pane: MessageThread showing the messages for the selected conversation.
When a conversation is selected, joinConversation(conversationId) is called on the socket. When the user switches conversations, leaveConversation(prevId) is called.
MessageThread loads message history via messagingApi.getMessages() with cursor-based pagination (loads older messages when user scrolls to the top). New messages arrive via the new_message socket event. Typing indicator shows when the user_typing event arrives from the other participant, disappears after 3 seconds of no user_stopped_typing event.
Sending a message emits the send_message socket event. The message is optimistically added to the UI immediately (before server confirmation). If the server rejects it, the optimistic message is removed and an error is shown.

src/pages/account/WalletPage.jsx
Three sections: balance summary card at the top (current balance, pending release amount, currency), transaction history table below (paginated, filterable by type), and a withdrawal form for when balance > 0 and KYC is approved.
The balance card and transaction list both use React Query with a 60-second stale time — they refetch every minute in the background automatically. They also refetch immediately when the booking_status_changed socket event arrives with a completed status, since that triggers an escrow release.
The withdrawal form collects bank account details (bank code, account number — from a searchable dropdown of Nigerian banks if the user is Nigerian, otherwise free-form for international) and calls walletApi.initiateWithdrawal().

src/pages/account/Dashboard.jsx
The account overview page — the exact design from your existing account dashboard HTML, made dynamic.
The page makes four parallel API calls on mount using React Query's useQueries: GET /users/me (to refresh the profile), GET /bookings (to show recent bookings), GET /wallet/balance, and GET /notifications (unread count).
The "Verified Travelers on Your Routes" section (from the existing HTML) becomes dynamic: it calls listingsApi.getListings({ origin_country: user.country_of_residence, destination_country: 'CA', limit: 4 }) (or whichever corridor is relevant to the user) to populate the traveler cards with real data.
The tabs (All Shipments, Pending, In Transit, Delivered, Disputed) filter the shipment list by status. The search bar calls shipmentsApi.getMyShipments({ search: query }) on submit.
The empty state (from the existing HTML) is shown when the shipments list returns an empty array.

SECTION 6: COMPONENT DETAIL — The Building Blocks

src/components/kyc/KYCStatusBanner.jsx
A non-intrusive banner displayed at the top of the account section when user.kyc_status !== 'approved'. Shows different messages per status: "Complete your identity verification to post trips" (not_started), "Your verification is being reviewed" (pending/under_review), "Your verification was rejected: [reason]. Please try again" (rejected). Each has a relevant CTA button.

src/components/forms/ProhibitedItemChecker.jsx
Wraps the item description textarea in the shipment form. Uses useDebounce(value, 600) to wait 600ms after the user stops typing before calling checkProhibitedItem(). Shows three possible states: a spinner while checking, a green "✓ Item looks good" if clear, or a red "✗ This item cannot be shipped" with the matched keywords if blocked. If severity === 'review_required', shows an amber "⚠ This item requires admin review before going live." This component prevents surprise rejections after form submission.

src/components/payments/StripePaymentWidget.jsx
Loads Stripe.js from Stripe's CDN (this is a requirement — you must load Stripe's script from their server, not bundle it). Uses the @stripe/react-stripe-js and @stripe/stripe-js packages. Takes clientSecret and bookingId as props. On successful payment, calls bookingsApi.getBookingById(bookingId) to check the new status (the webhook will have updated it by this point), then redirects to the booking detail page which will show the payment_held state.

src/components/payments/PaystackPaymentButton.jsx
Simpler than Stripe. Takes paymentUrl as a prop and does window.location.href = paymentUrl on click. Paystack handles the payment on their page and redirects back to your return_url. The return URL is a route that calls getBookingById to show the updated state.

src/components/ui/ImageUpload.jsx
A reusable component used in the shipment form, KYC page, and booking confirmation. Takes onUpload(urls) as a callback. It calls the appropriate "generate upload URL" API endpoint (passed as a prop), gets signed Cloudinary parameters, then uses XMLHttpRequest to upload directly to Cloudinary (not through your server), reporting upload progress with a progress bar. On completion, calls onUpload with the resulting Cloudinary URLs.

src/components/notifications/NotificationBell.jsx
Shows a bell icon in the header with an unread count badge. On click, opens NotificationDropdown. Reads from the notifications store for the count — this count is also incremented in real time when a notification socket event arrives.

SECTION 7: THE USER JOURNEY FLOWS — API Calls in Order
These are the complete flows mapped from first user action to final API call, showing exactly which APIs are triggered by user actions versus triggered by the success of another API call.

Flow 1: New User Registration to Active Account
The user sees the landing page and clicks "Sign Up." The AuthModal opens showing the email screen.
User action: Types email, clicks Continue.
Triggered by user action: No API call yet — just client-side email format validation.
User action: The OTP screen appears. User checks their email and sees the 4-digit code. But wait — registration hasn't started yet, so no OTP has been sent. The system needs more information first. The OTP screen in the modal is for email verification, but the actual register call needs the full data. The correct flow is:
The modal should show full registration fields first (name, phone, password) — or alternatively, the email screen should proceed to a full registration form before OTP. On form completion and "Create Account" click:
Triggered by user action → authApi.register() — POSTs to /auth/register. Backend sends OTP to email. Response says "check your email."
Triggered by API success → OTP screen appears for email verification.
User action: Enters 4-digit email OTP, clicks Verify.
Triggered by user action → authApi.verifyEmail() — POSTs to /auth/verify-email. Backend sets email as verified and sends SMS OTP to phone.
Triggered by API success → Phone OTP screen appears in the modal.
User action: Enters phone OTP.
Triggered by user action → authApi.verifyPhone() — POSTs to /auth/verify-phone. Returns access_token, refresh_token, and user object.
Triggered by API success → Four things happen in sequence:
setAccessToken(token) — saves tokens to localStorage
authStore.setUser(user) — populates global state
socketStore.connect(token) — establishes the Socket.IO connection
usersApi.registerPushToken() — registers the device for push notifications (if browser supports it and user grants permission)
The modal closes. The user is now logged in. If they were trying to access a protected route before, they're redirected there. Otherwise, they land on /account/dashboard.

Flow 2: Login
User action: Opens AuthModal in login mode, enters email and password, clicks Sign In.
Triggered by user action → authApi.login() — Returns tokens and user. Same four post-success steps as registration.
Edge case — expired access token during session: User is browsing. They haven't interacted with the app in 16 minutes (access token is now expired). They click "My Shipments."
Triggered by navigation → shipmentsApi.getMyShipments() — The Axios interceptor attaches the expired token. The backend returns 401 TOKEN_EXPIRED.
Triggered by 401 response → the Axios response interceptor calls authApi.refreshToken() — if the refresh succeeds, the interceptor retries the original shipments request with the new token. The user never knows anything happened.

Flow 3: KYC Verification (Didit)
User is in their account, clicks "KYC Verification" in the sidebar. Lands on KYCPage. Status is not_started.
User action: Selects document type (passport), country (NG), optionally enters ID number, clicks "Start Verification."
Triggered by user action → kycApi.initiateKYC() — Returns { kyc_id, session_id, verification_url }.
Triggered by API success:
localStorage.setItem('kyc_session_id', session_id) — saved for reference
window.location.href = verification_url — user leaves your app and goes to Didit
User completes face scan and document upload on Didit's platform. Didit redirects them back to your configured return URL: https://carrylink.app/account/kyc/return.
Triggered by page load at return URL → KYCReturnPage mounts → kycApi.getKYCStatus() — Returns current status (may still be pending if Didit is still processing).
Triggered by API success → redirect to /account/kyc — The KYCPage now shows the current status. If pending, useKYCStatus hook begins polling every 30 seconds.
Meanwhile on the backend, Didit's webhook fires and updates the database. The next poll picks up approved or rejected. The authStore.updateKYCStatus(newStatus) is called, the KYCPage transitions to the approved or rejected state.

Flow 4: Posting a Trip and Getting Matched
User action: Clicks "Post a Trip" in the banner or sidebar.
Triggered by user action → ProtectedRoute check — User must be authenticated and KYC approved. If not KYC approved, KYCStatusBanner is shown instead of the form.
User action: Fills Step 1 — types flight number.
Triggered by typing (debounced 500ms) → flightsApi.searchFlight() — Shows verified flight details or "Flight not found" warning inline.
User action: Completes all steps and clicks Submit.
Triggered by user action → listingsApi.createListing() — Returns the new listing with id and status: 'active'.
Triggered by API success (on the backend, not frontend-visible): The backend fires the listing.created event, which triggers the matching engine to run. New matches records are created in the database. The user doesn't need to know this happened.
User action: Navigates to "My Matches" tab.
Triggered by navigation → matchesApi.getMatchesForListing(listingId) — Returns the list of matched shipments.
A sender, on their side, sees their shipment's matches and clicks "Express Interest" on the traveler's listing.
Backend → Socket.IO event arrives at the traveler's connected socket: notification event with type match_interested. The traveler sees a notification bell badge light up.
Traveler action: Clicks the notification, navigates to "My Matches."
Traveler action: Clicks "Accept" on the match.
Triggered by user action → modal opens asking for agreed price.
User action: Confirms price, clicks Accept.
Triggered by user action → matchesApi.acceptMatch(matchId, { agreed_price }) — Returns { booking_id, status: 'pending_payment', conversation_id, ... }.
Triggered by API success:
Navigate to /account/booking/:booking_id
The sender receives a notification socket event: "Your match was accepted. Payment required."

Flow 5: Payment to Delivery Completion
On BookingDetail page, booking is in pending_payment state.
Triggered by page load → bookingsApi.getBookingById(id) — Shows the booking details.
User action (sender): Selects Paystack, clicks "Pay Now."
Triggered by user action → paymentsApi.initiatePayment(bookingId, { payment_provider: 'paystack', return_url }) — Returns { payment_url }.
Triggered by API success → window.location.href = payment_url — Sender goes to Paystack's checkout.
Sender completes payment on Paystack. Paystack redirects back to return_url (something like /account/booking/:id/payment-return).
A background route handler page at that URL calls bookingsApi.getBookingById(id) to check the current status. Simultaneously, Paystack's webhook has fired and the backend has updated the booking to payment_held and the escrow to funded.
Triggered by return page load → redirect to /account/booking/:id — The booking detail now shows payment_held state.
Traveler receives → booking_status_changed Socket.IO event — useBookingUpdates invalidates the React Query cache, the booking detail refetches and now shows "Confirm Pickup" button for the traveler.
Traveler action: At pickup, clicks "Confirm Pickup," optionally uploads pickup photo.
Triggered by user action → bookingsApi.confirmPickup(id, { pickup_photo_url }) — Status becomes in_transit.
Triggered by API success → Socket.IO event sent to sender — "Traveler has picked up your package." Booking shows tracking view.
After delivery, recipient gets an SMS OTP on their phone (from the backend's SMS service).
Sender action (or recipient via the sender's UI): Enters the delivery OTP.
Triggered by user action → bookingsApi.confirmDelivery(id, { delivery_otp }) — Status becomes delivered. Backend initiates escrow release.
Triggered by API success: Both parties receive booking_status_changed socket events and notification events. The booking shows "Completed" state with a review prompt.
User action: Rates the counterparty with stars and a comment.
Triggered by user action → reviewsApi.submitReview(bookingId, { rating, comment }) — Trust scores update on the backend.

SECTION 8: ADMIN PAGES — The Back Office
The admin section uses the same CarryLink styling but with additional data density. All admin pages use AdminRoute wrapper.
AdminDashboard.jsx — Overview with summary metrics: total users, GMV this month, pending KYC count, open disputes count, flagged shipments count. Each metric links to the relevant queue.
AdminKYCQueue.jsx — Paginated table of KYC submissions in pending or under_review status. Clicking a row opens a side panel with the submitted ID images and selfie (loaded from Cloudinary URLs), and Approve/Reject buttons with a reason textarea.
AdminShipmentsQueue.jsx — Flagged shipments awaiting review. Shows the item description, matched prohibited keywords, and Approve/Reject buttons.
AdminDisputes.jsx — All disputes filterable by status. Clicking opens DisputeDetail page in admin mode — same page component as the user-facing dispute detail, but with an additional "Resolve Dispute" panel for admins that exposes the resolution type selector and refund amount field.
AdminUsers.jsx — Searchable user table with Freeze/Ban actions available from the row context menu.
AdminReports.jsx — Date-range transaction report with corridor and provider filters. Shows GMV, commission, refunds as an aggregated table. A "Download CSV" button calls the reports endpoint with format=csv.

SECTION 9: ENVIRONMENT & ROUTING CONFIGURATION

.env.example
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_SOCKET_URL=http://localhost:5000


src/App.jsx — The Route Map
/                           → Landing (public)
/how-it-works               → HowItWorks (public)
/for-travelers              → ForTravelers (public)
/for-senders                → ForSenders (public)
/browse/listings            → BrowseListings (public)
/browse/shipments           → BrowseShipments (public)
/listings/:id               → ListingDetail (public)
/shipments/:id              → ShipmentDetail (public)
/profile/:userId            → PublicProfile (public)
/auth/callback/google       → OAuthCallback (auth)
/auth/callback/apple        → OAuthCallback (auth)
/account/kyc/return         → KYCReturnPage (auth)
/account/dashboard          → Dashboard (protected)
/account/my-shipments       → MyShipments (protected)
/account/my-trips           → MyTrips (protected)
/account/post-trip          → PostTrip (protected, KYC required)
/account/send-package       → SendPackage (protected)
/account/matches            → MyMatches (protected)
/account/booking/:id        → BookingDetail (protected)
/account/booking/:id/payment-return  → PaymentReturnPage (protected)
/account/payments           → Payments (protected)
/account/wallet             → WalletPage (protected)
/account/kyc                → KYCPage (protected)
/account/messages           → Messages (protected)
/account/messages/:id       → Messages with selected conversation (protected)
/account/notifications      → Notifications (protected)
/account/reviews            → Reviews (protected)
/account/disputes           → Disputes (protected)
/account/disputes/:id       → DisputeDetail (protected)
/account/settings           → Settings (protected)
/admin                      → AdminDashboard (admin only)
/admin/users                → AdminUsers (admin only)
/admin/kyc                  → AdminKYCQueue (admin only)
/admin/shipments            → AdminShipmentsQueue (admin only)
/admin/disputes             → AdminDisputes (admin only)
/admin/reports              → AdminReports (admin only)

All /account/* routes are wrapped in AccountLayout which adds the sidebar. All /admin/* routes are wrapped in a minimal admin layout without the sidebar (a horizontal top nav instead, since admins need screen width for data tables).

The HTML-to-React Conversion Rules for Existing Files
For the landing page and account dashboard HTML that already exist: replace class= with className=, convert <script> tags at the bottom of the HTML into useEffect(() => { ... }, []) hooks inside the component, replace document.getElementById() calls with useRef() hooks, replace window.addEventListener calls with useEffect cleanup patterns (always return () => window.removeEventListener(...) to prevent memory leaks), and replace raw event handler assignments like element.addEventListener('click', fn) with JSX onClick={fn} props.
The innovation grid's JavaScript (the panorama effect, the applyPanorama function, the getBoundingClientRect measurements) goes into a useEffect that runs after mount and adds a useCallback around the resize handler. The data array of five CarryLink features (Escrow, KYC, Matching, Reputation, Disputes) is defined as a constant in the component file.
The account dashboard's sidebar tab switching logic (which was querySelectorAll + classList.toggle) becomes a simple activeTab state variable with conditional className on each tab.

This is the complete frontend architecture. The API layer maps exactly to the backend API documentation. The component tree maps exactly to the existing HTML designs. The state flows map exactly to the booking lifecycle that the backend enforces. Builder.io AI now has everything it needs to build each file knowing exactly what it should do, what APIs it calls, when it calls them, and what state it manages.



A change was made to the kyc api and external implementation.
# KYC API Documentation


## Overview


The KYC (Know Your Customer) system uses **Didit** as the verification provider, supporting 220+ countries including Nigeria, US, UK, and Canada. The system follows a session-based flow where users complete verification on Didit's optimized platform.


## Base URL
```
http://localhost:5000/api/v1/kyc
```


## Authentication
All KYC endpoints (except webhooks) require authentication via Bearer token:
```
Authorization: Bearer <access_token>
```


---


## Endpoints


### 1. Initiate KYC Verification


**Endpoint:** `POST /api/v1/kyc/initiate`


**Purpose:** Creates a Didit verification session and returns the verification URL


**Authentication:** Required (Bearer token)


**Middleware Chain:**
- `authenticate` - Verifies JWT token
- `requireEmailVerified` - Ensures user's email is verified
- `validate(initiateKYCSchema)` - Validates request body


**Request Body:**
```json
{
  "id_type": "passport",           // Required: "passport" | "national_id" | "drivers_license"
  "id_country": "NG",             // Required: 2-letter country code (ISO 3166-1 alpha-2)
  "id_number": "A12345678"        // Optional: Document number
}
```


**Success Response (200):**
```json
{
  "success": true,
  "message": "KYC verification initiated successfully",
  "data": {
    "kyc_id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "9cfb8208-baef-4af5-88d0-899f11ee7d68",
    "verification_url": "https://your-workflow-url.didit.me?session_token=9qaARQk1nXmT",
    "session_token": "9qaARQk1nXmT",
    "supported_countries": [
      {
        "code": "NG",
        "name": "Nigeria",
        "provider": "didit"
      },
      {
        "code": "US",
        "name": "United States",
        "provider": "didit"
      },
      {
        "code": "GB",
        "name": "United Kingdom",
        "provider": "didit"
      },
      {
        "code": "CA",
        "name": "Canada",
        "provider": "didit"
      }
    ]
  }
}
```


**Frontend Implementation:**
```javascript
// After successful initiate call
const initiateKYC = async (idType, idCountry, idNumber) => {
  try {
    const response = await fetch('/api/v1/kyc/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_type: idType,
        id_country: idCountry,
        id_number: idNumber
      })
    });


    const data = await response.json();


    if (data.success) {
      // Store session info for later status checking
      localStorage.setItem('kyc_session_id', data.data.session_id);
      localStorage.setItem('kyc_id', data.data.kyc_id);
     
      // Redirect user to Didit verification page
      window.location.href = data.data.verification_url;
    } else {
      console.error('KYC initiation failed:', data.message);
    }
  } catch (error) {
    console.error('Error initiating KYC:', error);
  }
};
```


**User Flow:**
1. User fills KYC form with document details
2. Frontend calls `/initiate` endpoint
3. User is redirected to `verification_url` (Didit's platform)
4. User completes verification on Didit
5. User returns to your app (via callback URL)
6. Frontend checks verification status using `/status` endpoint
    "supported_countries": [
      {
        "code": "NG",
        "name": "Nigeria",
        "provider": "didit"
      },
      {
        "code": "US",
        "name": "United States",
        "provider": "didit"
      }
    ]
  }
}
```


**Error Responses:**
```json
// 400 - Country not supported
{
  "success": false,
  "error": {
    "code": "COUNTRY_NOT_SUPPORTED",
    "message": "KYC verification is not supported for country: XX"
  }
}


// 400 - KYC already approved
{
  "success": false,
  "error": {
    "code": "KYC_ALREADY_APPROVED",
    "message": "KYC verification is already approved for this user"
  }
}


// 401 - Not authenticated
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Access token required"
  }
}


// 403 - Email not verified
{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Please verify your email address"
  }
}
```


**Postman Test:**
```bash
POST http://localhost:5000/api/v1/kyc/initiate
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Body:
{
  "id_type": "passport",
  "id_country": "NG",
  "id_number": "A12345678"
}
```


---


### 2. Submit KYC Documents


**Endpoint:** `POST /api/v1/kyc/submit`


**Purpose:** For Didit integration, this returns the current session status since users complete verification on Didit's platform


**Authentication:** Required (Bearer token)


**Middleware Chain:**
- `authenticate` - Verifies JWT token
- `requireEmailVerified` - Ensures user's email is verified
- `validate(submitKYCSchema)` - Validates request body


**Request Body:**
```json
{
  "id_type": "passport",
  "id_country": "NG",
  "id_number": "A12345678",
  "id_front_url": "https://res.cloudinary.com/...",  // Optional for Didit
  "id_back_url": "https://res.cloudinary.com/...",   // Optional for Didit
  "selfie_url": "https://res.cloudinary.com/..."     // Optional for Didit
}
```


**Success Response (200):**
```json
{
  "success": true,
  "message": "KYC documents submitted successfully",
  "data": {
    "kyc_id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "didit-session-abc123",
    "status": "pending",
    "message": "KYC verification is being processed",
    "verification_url": "https://verify.didit.me/session/didit-session-abc123"
  }
}
```


**Error Responses:**
```json
// 404 - KYC not initiated
{
  "success": false,
  "error": {
    "code": "KYC_NOT_INITIATED",
    "message": "Please initiate KYC verification first"
  }
}


// 400 - Already approved
{
  "success": false,
  "error": {
    "code": "KYC_ALREADY_APPROVED",
    "message": "KYC is already approved"
  }
}
```


---


### 3. Get KYC Status


**Endpoint:** `GET /api/v1/kyc/status`


**Purpose:** Returns the current KYC verification status for the authenticated user


**Authentication:** Required (Bearer token)


**Middleware Chain:**
- `authenticate` - Verifies JWT token


**Request:** No body required


**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "kyc_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",                    // "not_started" | "pending" | "under_review" | "approved" | "rejected" | "expired"
    "id_type": "passport",
    "id_country": "NG",
    "rejection_reason": null,               // String if status is "rejected"
    "expires_at": "2026-03-03T00:00:00Z",  // Date if approved
    "message": "KYC verification approved",
    "created_at": "2024-03-03T10:00:00Z",
    "updated_at": "2024-03-03T11:00:00Z"
  }
}
```


**Response for Not Started:**
```json
{
  "success": true,
  "data": {
    "status": "not_started",
    "message": "KYC verification not started"
  }
}
```


**Postman Test:**
```bash
GET http://localhost:5000/api/v1/kyc/status
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```


---


### 4. Didit Webhook Handler


**Endpoint:** `POST /api/v1/kyc/webhook/didit`


**Purpose:** Receives status updates from Didit when verification is completed


**Authentication:** None (webhook signature verification)


**Middleware Chain:**
- `express.raw({ type: 'application/json' })` - Raw body for signature verification
- `verifyDiditSignature` - Verifies webhook signature using HMAC-SHA256
- `express.json()` - Parse JSON after signature verification
- `validate(webhookDiditSchema)` - Validates webhook payload


**Request Body (from Didit):**
```json
{
  "event_type": "status.updated",
  "session_id": "didit-session-abc123",
  "status": "Approved",                    // "Approved" | "Declined" | "In Review" | "Not Started" | "In Progress"
  "timestamp": "2024-03-03T12:00:00Z",
  "data": {
    "id_verification": {
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-01",
      "document_number": "A12345678",
      "document_type": "passport",
      "country": "NG",
      "gender": "M",
      "address": "123 Main St, Lagos, Nigeria",
      "expiry_date": "2030-01-01"
    },
    "face_verification": {
      "match_score": 96.5,
      "liveness_score": 98.2
    },
    "aml_screening": {
      "status": "clear",
      "matches": []
    }
  }
}
```


**Success Response (200):**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```


**Error Response (200):** *(Always returns 200 to prevent webhook retries)*
```json
{
  "success": false,
  "message": "Webhook processing failed"
}
```


**Webhook Signature Verification:**
- Header: `x-didit-signature: sha256=<hash>`
- Secret: `DIDIT_WEBHOOK_SECRET` from environment
- Algorithm: HMAC-SHA256 of raw request body


---


## File Structure & Flow


### Core Files


```
src/modules/kyc/
├── kyc.routes.js          # Route definitions and middleware chains
├── kyc.controller.js      # HTTP request handlers
├── kyc.service.js         # Business logic and database operations
├── kyc.validator.js       # Joi validation schemas
└── providers/
    ├── index.js           # Provider factory (routes to Didit)
    └── didit.js           # Didit API integration
```


### Supporting Files


```
src/shared/repositories/
└── kyc.repository.js      # Database queries for KYC records


src/middleware/
├── auth.middleware.js     # JWT authentication
├── validate.middleware.js # Request validation
└── webhookSignature.middleware.js # Webhook signature verification


src/config/
├── environment.js         # Didit configuration
└── cloudinary.js         # Image upload (optional for Didit)
```


### Database Tables


```sql
-- KYC verification records
kyc_verifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  id_type id_type_enum,
  id_country CHAR(2),
  id_number VARCHAR(50),
  provider kyc_provider_enum DEFAULT 'didit',
  provider_reference_id VARCHAR(255), -- Didit session_id
  status kyc_status_enum DEFAULT 'not_started',
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- User badges (awarded on KYC approval)
traveler_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_type badge_type_enum, -- 'verified_traveler'
  awarded_at TIMESTAMPTZ DEFAULT NOW()
);
```


---


## Verification Flow


### 1. **Frontend Initiation**
```javascript
// User clicks "Verify Identity" button
const response = await fetch('/api/v1/kyc/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id_type: 'passport',
    id_country: 'NG'
  })
});


const { verification_url, session_token } = await response.json();
```


### 2. **User Verification (Two Options)**


**Option A: Redirect to Didit**
```javascript
// Redirect user to Didit's platform
window.location.href = verification_url;
```


**Option B: Didit SDK Integration**
```javascript
// Use Didit SDK for embedded experience
import { DiditSdk } from '@didit-protocol/sdk-web';


DiditSdk.shared.onComplete = (result) => {
  if (result.type === 'completed') {
    console.log('KYC Status:', result.session.status);
    // Refresh user profile or redirect to dashboard
  }
};


DiditSdk.shared.startVerification({
  url: verification_url
});
```


### 3. **Backend Processing**
```
User completes verification on Didit
         ↓
Didit sends webhook to /api/v1/kyc/webhook/didit
         ↓
Backend verifies webhook signature
         ↓
Backend updates KYC status in database
         ↓
If approved: Award "verified_traveler" badge
         ↓
Frontend can check status via /api/v1/kyc/status
```


### 4. **Status Checking**
```javascript
// Check KYC status periodically or after webhook
const statusResponse = await fetch('/api/v1/kyc/status', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});


const { status, message } = await statusResponse.json();
```


---


## Status Mapping


| Didit Status | Our Status | Description |
|-------------|------------|-------------|
| `Not Started` | `not_started` | User hasn't begun verification |
| `In Progress` | `pending` | User is actively verifying |
| `In Review` | `under_review` | Manual review required |
| `Approved` | `approved` | Verification successful |
| `Declined` | `rejected` | Verification failed |


---


## Error Handling


### Common Error Codes
- `COUNTRY_NOT_SUPPORTED` - Country not in supported list
- `KYC_ALREADY_APPROVED` - User already has approved KYC
- `KYC_NOT_INITIATED` - User must call /initiate first
- `EMAIL_NOT_VERIFIED` - User must verify email before KYC
- `UNAUTHORIZED` - Invalid or missing access token
- `INVALID_SIGNATURE` - Webhook signature verification failed


### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```


---


## Testing with Postman


### Collection Setup
1. **Environment Variables:**
   ```
   base_url: http://localhost:5000
   access_token: <get from login endpoint>
   ```


2. **Test Sequence:**
   ```
   1. POST /api/v1/auth/login (get access_token)
   2. POST /api/v1/kyc/initiate
   3. Visit verification_url in browser
   4. Complete verification on Didit
   5. GET /api/v1/kyc/status (check result)
   ```


### Sample Postman Collection
```json
{
  "info": {
    "name": "CarryLink KYC API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Initiate KYC",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"id_type\": \"passport\",\n  \"id_country\": \"NG\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/v1/kyc/initiate",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "kyc", "initiate"]
        }
      }
    },
    {
      "name": "Get KYC Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/v1/kyc/status",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "kyc", "status"]
        }
      }
    }
  ]
}
```


---


## Frontend Integration Guide


### Required Pages/Components


1. **KYC Initiation Page**
   - Country selector dropdown
   - Document type selector
   - "Start Verification" button
   - Supported countries list


2. **KYC Status Page**
   - Current status display
   - Progress indicator
   - Action buttons based on status
   - Verification URL link (if pending)


3. **KYC Complete Page**
   - Success/failure message
   - Next steps guidance
   - Badge display (if approved)


### State Management
```javascript
// KYC state in Redux/Context
const kycState = {
  status: 'not_started', // not_started | pending | approved | rejected
  kycId: null,
  sessionId: null,
  verificationUrl: null,
  rejectionReason: null,
  expiresAt: null,
  loading: false,
  error: null
};
```


### API Integration Hooks
```javascript
// React hooks for KYC operations
const useKYC = () => {
  const initiateKYC = async (idType, idCountry) => { /* ... */ };
  const checkKYCStatus = async () => { /* ... */ };
  const submitKYC = async (documents) => { /* ... */ };
 
  return { initiateKYC, checkKYCStatus, submitKYC };
};
```


This documentation provides everything needed for frontend development and API testing. The KYC system is now fully integrated with Didit and ready for production use!
