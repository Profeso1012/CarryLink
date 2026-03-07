CarryLink Backend — The Plain English Architecture Guide

First, The Big Picture: What Is This Backend Actually Doing?
Before anything else, think of the backend as a government ministry building. It has a front door where visitors (API requests) come in, a reception desk that checks everyone's ID before they go anywhere, different departments that handle different jobs (payments, identity verification, messaging, etc.), a filing system where everything is recorded (the database), and a security office that watches everything and can shut things down.
Every time your React frontend — or Postman during testing — sends a request like "register this user" or "initiate payment for this booking," it is a visitor walking into that building. The backend's job is to receive that visitor, check who they are, route them to the right department, do the work, and send them back a response.
Now let me walk you through every part of that building.

The Concept of "Request Flow" — How Every API Call Travels Through the System
This is the single most important thing to understand before looking at any file. When Postman sends POST /api/v1/auth/login to your server, here is the exact journey that request takes, in order:
Step 1 — The request arrives at server.js. Your server is running and listening for HTTP traffic on a port (say, port 3000).
Step 2 — It enters app.js. The app applies global middleware to every single request before anything else happens. These are like checkpoints in a hallway that every visitor must pass through regardless of where they're going: get stamped with a request ID, get logged, get security headers attached, get their identity token checked.
Step 3 — It hits the right router. Once through the hallway checkpoints, the request is directed to the right department. A login request goes to the auth router. A shipment request goes to the shipments router.
Step 4 — It goes through route-specific middleware. Some departments have their own security checks before you can speak to anyone. The auth department checks reCAPTCHA. The KYC department checks that you have a valid JWT token. These are the middlewares defined per-route in each module's routes file.
Step 5 — It reaches the controller. The controller is the receptionist at the department. Its only job is to take the information out of the request (the body, the URL parameters, the headers) and hand it to the service.
Step 6 — The service does the actual work. This is the expert in the back office. It applies all the business rules, checks things, calls the database through the repository, sends emails, fires notifications, etc.
Step 7 — The repository talks to the database. The service never writes SQL directly. It calls the repository, which contains all the SQL queries. The repository runs the query and returns data.
Step 8 — The response travels back up. The service returns a result to the controller. The controller formats it into the standard response envelope and sends it back as JSON.
Step 9 — If anything goes wrong at any step, an error is thrown and the global error handler (the last middleware in app.js) catches it, formats it into the standard error envelope, and sends it back.
Every single API endpoint in this project follows this exact journey. Once you understand this flow, you can trace any bug by asking: which step in this journey is breaking?

SECTION 1: THE ROOT FILES

src/server.js — The Building's Main Entrance
Think of this as the moment the lights turn on in the whole building. This file is what Node.js actually runs when you type npm start. It is the starting gun.
Here is what startServer() does in plain English:
It first tells the app.js file to build and configure the Express application. Then it wraps that application in a standard Node.js HTTP server (this is just how Node.js creates a web server that can receive internet traffic). Then it attaches Socket.IO to that same HTTP server — Socket.IO is the technology that allows real-time two-way communication for the in-app chat, so it needs to sit on the same server as the rest of the app. Then it runs a quick test to confirm the database connection is alive (if the database is unreachable at startup, there is no point continuing). Then it starts all the background jobs — the automated timers that run on a schedule, like the one that expires old travel listings every hour. Finally, it tells the server to start listening on a port number, meaning it is now open for business and accepting requests.
The two process.on lines at the bottom are the building's emergency protocol. uncaughtException and unhandledRejection are Node.js's way of saying "something crashed that nobody caught." This file intercepts those disasters, logs them, and gracefully shuts down rather than leaving the server in a broken half-alive state.
How to verify it's working: When you run npm start, your terminal should show a log line like Server running on port 3000 and Database connected successfully. If either of those doesn't appear, the problem is in this file or in the database config.

src/app.js — The Building's Interior Layout
While server.js turns the lights on, app.js is what designs the interior of the building — it sets up the hallways, the checkpoints, and the signposts that direct visitors to the right department.
createApp() does the following in order:
It creates the Express application instance (think: it initializes the empty building shell). Then it lines up the global middleware in a specific order — and the order matters enormously here. Every request must pass through all of these in sequence before reaching any route:
The requestId middleware stamps every incoming request with a unique ID (like giving every visitor a numbered ticket). This means when you look at your logs and see an error, you can search for that ticket number and see every single thing that happened during that request's journey.
The logger middleware records every incoming request: what URL it was, what method (GET, POST, etc.), what time, and eventually what response it got back. This is your paper trail.
The Helmet middleware is a security expert standing at the door. It adds invisible security headers to every response that tell the browser things like "don't let this page be embedded in an iframe" and "only load scripts from trusted sources." Browsers understand and enforce these headers. Helmet is a well-known library that handles about 11 different security headers automatically.
The CORS middleware decides which websites are allowed to talk to your API. CORS stands for Cross-Origin Resource Sharing. Without this, a random website could make API calls to your backend pretending to be your frontend. You configure it with a list of allowed origins (your React app's domain) and it blocks everyone else.
The bodyParser middleware is the translator. When the frontend sends a JSON body like { "email": "user@example.com" }, it arrives as raw text bytes. bodyParser reads those bytes and converts them into a JavaScript object that your code can work with as req.body.email.
After all middleware is applied, the app mounts all the module routers under /api/v1/. This is the building's directory: "auth department is down this hallway, shipments department is over there." Each module's router file is what handles the routes for that specific feature area.
Finally, it registers the global error handler as the very last thing. In Express, the order middleware is registered determines the order it runs, so the error handler must come last because it only needs to catch errors that bubble up from everything else.
How to verify it's working: If you hit GET /api/v1/health in Postman and get a 200 OK response with { "status": "ok" }, app.js is doing its job. If you hit a route that doesn't exist and get a clean 404 JSON response (not an HTML Express error page), the notFoundHandler at the bottom is working.

SECTION 2: THE CONFIG FOLDER — The Building's Utility Rooms
The src/config/ folder contains files that connect your application to external services. Think of these as the utility rooms in the basement — electricity, water, phone lines. The rest of the building uses these services constantly but doesn't need to know how they work.

src/config/database.js — The File Archive Room
This file manages the connection to your Neon PostgreSQL database. Because databases are slow and network connections are expensive to open and close, this file creates a pool of connections — imagine 10 phone lines that stay open all the time. When a service needs to query the database, it picks up one of those open lines, makes its call, and puts the line back.
createPool() opens those phone lines at startup.
query(text, params) is the function that almost every repository in the system calls. You pass it a SQL string and the values to plug in (the params), and it executes the query and gives you back the rows. The reason params are passed separately (instead of just concatenating them into the string) is SQL injection prevention — if a user types '; DROP TABLE users; -- into a form field, and you naively concatenate it into your SQL string, you've just let them delete your database. Parameterized queries treat the user's input as data, never as code.
withTransaction(callback) is critically important for operations where multiple database changes must all succeed or all fail together. For example, when confirming a delivery: you must release the escrow AND credit the traveler's wallet AND update the booking status. If the first two succeed but the third crashes, you'd have released money but have a booking still showing as "in transit." withTransaction wraps all of these in a database transaction — if anything fails, the entire thing is rolled back as if none of it happened.
How to verify it's working: The testConnection() function is called at startup. If it fails, you'll see a database error log. Also, if any API endpoint returns a 500 Internal Server Error with a message about a database connection, this is where to look first.

src/config/redis.js — The Whiteboard Room
Redis is a very fast in-memory database. Your PostgreSQL database stores your permanent data (users, bookings, etc.). Redis is used for temporary fast-access data.
In this project, Redis is used for two things: rate limiting (keeping count of how many times an IP address has tried to log in in the last hour — this counter needs to be checked and updated on every login attempt, so it must be extremely fast) and session management (optionally caching things like a user's role so you don't have to query PostgreSQL on every API call).
getClient() just returns the single Redis connection that was established at startup.
How to verify it's working: Rate limiting is the most observable test. Try hitting the login endpoint 11 times in a row from the same IP. On the 11th attempt, you should get a 429 Too Many Requests response. If you're still getting 401 Invalid Credentials on the 11th, Redis rate limiting isn't wired up correctly.

src/config/cloudinary.js — The Document Storage Room
Cloudinary is a cloud service for storing images and files. This file configures the connection to Cloudinary.
The interesting part here is generateSignedUploadParams. Here is why this exists: you never want binary file data (images) flowing through your Express server. It would be slow, expensive on memory, and a security risk. Instead, the flow works like this:
Your API server generates a signed upload token — basically a temporary permission slip
It sends that permission slip to the frontend
The frontend uploads the image directly to Cloudinary, never touching your server
Cloudinary stores the image and gives the frontend a URL
The frontend sends that URL back to your API
generateSignedUploadParams is step 1. It creates that permission slip with a cryptographic signature, a timestamp, a folder path, and a Cloudinary API key. Cloudinary will only accept uploads that carry this signature.
How to verify it's working: Call POST /api/v1/kyc/initiate — it should return a response with upload configuration including a signature and URL. Try uploading an image to that URL with any HTTP client. Cloudinary should accept it.

src/config/mailer.js — The Post Office
This file connects to SendGrid (email delivery service) via their SMTP settings.
sendEmail() is what everything in the system calls when it needs to send an email — OTP codes, KYC approval notifications, dispute updates, etc. The template system means you pre-define HTML email templates (with placeholders for dynamic content like a user's name or an OTP code), and this function fills in those placeholders and sends the final email.

src/config/sms.js — The SMS Dispatch Desk
This connects to Twilio, which is a service that can send SMS messages to any phone number in the world. Twilio handles the complex work of routing through different carrier networks in different countries.
sendSMS() is called every time you need to send a 6-digit OTP to a phone number for verification. Notice the note in the function: SMS failures are logged but don't crash the request. That's intentional — if Twilio has a temporary outage, the user gets an error about SMS not arriving, but your server doesn't crash.

src/config/firebase.js — The Push Notification Transmitter
Firebase Cloud Messaging (FCM) is Google's service for sending push notifications to mobile phones and browsers. When a traveler's booking gets funded, they should see a notification on their phone even if the app isn't open. FCM makes that possible.
getMessaging() returns the messaging instance. The notifications service uses this to send pushes to devices by their FCM token (a unique string that identifies a user's specific device installation of your app).

src/config/environment.js — The Building's Key Safe
This file manages your environment variables — the sensitive configuration values (API keys, database passwords, JWT secrets) that live in your .env file and never get committed to GitHub.
validateEnvironment() runs at startup and checks that every required environment variable is present. If you accidentally deploy to production without setting STRIPE_SECRET_KEY, this function catches it immediately at startup rather than letting your app run for hours before a payment attempt fails mysteriously.
getConfig() returns all your config values organized by domain, so instead of writing process.env.STRIPE_SECRET_KEY everywhere in your code (which is messy and error-prone), you write config.stripe.secretKey and it's cleaner and predictable.

SECTION 3: THE MIDDLEWARE FOLDER — The Security Checkpoints
Middleware is one of Express's most important concepts and also one of the least intuitively understood. Here is the plain English definition:
Middleware is a function that runs before your actual route handler, and it can either let the request continue or stop it dead.
Every middleware function receives three things: req (the incoming request), res (the response you'll eventually send back), and next (a function you call to say "I'm done, let the next thing run"). If middleware doesn't call next(), the request stops there. If it does call next(), the request continues to the next middleware or the route handler.
Think of middleware as the series of checkpoints a visitor passes through in a government building: security scanner, ID check, visitor badge, department-specific clearance. Each checkpoint can wave you through (next()) or stop you (return res.status(401).json(...)).

src/middleware/auth.middleware.js — The ID Badge Checker
This is the most used file in the entire backend. Almost every route that does anything meaningful passes through one of these functions.
authenticate does this in plain English: it looks at the Authorization header of the incoming request. That header should contain Bearer eyJ... — a JWT (JSON Web Token) access token. It takes that token, verifies it cryptographically (meaning: confirms it was signed by your server using the secret key, and hasn't expired or been tampered with), and if valid, looks up the user's current status in the database (because the token might be valid but the user could have been suspended since it was issued). It then attaches the user's information to req.user so every subsequent function in the chain knows who is making this request.
If the token is missing, expired, or forged, authenticate calls next(error) with a 401 Unauthorized error. The request goes no further — it bounces back to the error handler.
optionalAuthenticate is the same but gentler. It's used on public routes like "browse travel listings" — most visitors can see this without logging in, but if they are logged in, you want to know who they are (so you can show them different UI or track their view). If no token is present, it just sets req.user = null and continues.
requireKYC is a gate that only allows users who have passed identity verification to proceed. It checks req.user.kyc_status === 'approved'. This is applied to routes like "post a travel listing" — you can't offer to carry items for strangers unless CarryLink has verified your identity.
How to verify it's working:
Hit a protected route in Postman without any Authorization header. You should get 401 Unauthorized.
Log in first (POST /api/v1/auth/login), copy the access_token from the response, set Authorization: Bearer <token> in Postman headers, and hit the same protected route. You should now get through.
Manually expire a token (either wait 15 minutes or test with a dummy expired token string) and hit a protected route. You should get 401 Token Expired.

src/middleware/admin.middleware.js — The Executive Floor Access Gate
This builds on top of authenticate. After you've verified who someone is, this checks if they are an admin or superadmin. It reads req.user.role (which was set by authenticate). If the role is not admin or superadmin, the request is stopped with 403 Forbidden.
This is always chained after authenticate in the admin routes, never used alone — because you must first know who someone is before you can check if they have executive access.

src/middleware/rateLimit.middleware.js — The Traffic Controller
This prevents abuse. Without rate limiting, a bot could hit your login endpoint 10,000 times per second trying to guess passwords. Rate limiting says "you can only make X requests from the same IP address within Y time window."
createRateLimiter is a factory — you tell it the rules (max 10 requests per hour per IP) and it creates a middleware function that enforces those rules. The enforcement state is stored in Redis, so it works even if you run multiple server instances (unlike an in-memory counter that would reset per instance).
The pre-configured limiters:
registrationLimiter — only 5 registrations per hour per IP (to prevent mass fake account creation)
loginLimiter — 10 login attempts per hour per IP (to slow down brute force)
otpLimiter — 3 OTP requests per 10 minutes (to prevent SMS/email bombing)
When the limit is exceeded, the response includes a Retry-After header telling the client how many seconds until the limit resets.
How to verify it's working: As described in the Redis section — hammer an endpoint past its limit and observe the 429 response.

src/middleware/botDetection.middleware.js — The Bot Scanner
There are three layers here, each catching a different type of bot:
verifyRecaptcha — When a user submits the registration form, the frontend invisibly runs Google's reCAPTCHA v3 in the background. reCAPTCHA analyzes browser behavior (how did the mouse move? is there a real browser environment?) and gives back a score from 0 to 1. Your backend middleware takes that score and rejects anything below 0.5 as likely automated. This stops scripts from just calling your API directly.
checkHoneypot — There's a hidden form field called _gotcha that legitimate users will never see or fill in (it's hidden with CSS). But bots that programmatically fill all form fields will fill it in. If _gotcha has any value, the request is fake. Rather than returning an error (which tells the bot it's been detected and to try differently), it returns a fake success response. The bot thinks it worked. This is called a honeypot trap.
validateUserAgent — Real browsers always send a User-Agent header that identifies themselves (Chrome, Firefox, Safari, etc.). Scripts and bots often use obvious identifiers like python-requests, curl, or HeadlessChrome. This middleware checks the User-Agent against a list of suspicious patterns.

src/middleware/deviceFingerprint.middleware.js — The Security Camera
This doesn't block anything — it just observes and records. Every time an authenticated user makes a request, this middleware takes the User-Agent, IP address, and a few other signals, hashes them together into a fingerprint, and saves that fingerprint against the user's account in the database.
Why? Security and fraud detection. If a user account suddenly starts being accessed from a new device in a different country right after a login, that's suspicious. Admins can see the device history in the admin panel. Also useful for detecting token theft — if the same refresh token is suddenly being used from a different device fingerprint than when it was issued, that's a red flag.

src/middleware/webhookSignature.middleware.js — The Package Authenticator
When Stripe or Paystack sends a webhook to your server to say "this payment was successful," how do you know that request is actually from Stripe and not from someone faking a "payment successful" message to trigger a fraudulent escrow release?
Every payment provider signs their webhooks using HMAC (Hash-based Message Authentication Code). They take the request body, run it through a hash function using a shared secret key (that only you and Stripe know), and include the resulting hash in the request header. Your server does the same computation independently and compares the results. If they match, the message is authentic.
Each provider does this slightly differently (Stripe uses SHA-256, Paystack uses SHA-512, etc.), which is why there's a separate function per provider. This middleware is one of the most security-critical pieces of the entire system — if it's wrong or bypassed, someone can fake payment confirmations.

src/middleware/errorHandler.middleware.js — The Emergency Response Team
Every time any code anywhere in the system throws an error and calls next(error), Express skips all remaining middleware and route handlers and goes straight to this function.
errorHandler is an Express middleware with four parameters instead of three (err, req, res, next) — that's how Express knows it's an error handler. It checks what kind of error it is:
If it's an AppError (a controlled error you threw deliberately, like "USER_NOT_FOUND"), it uses that error's status code and message to send a clean JSON response.
If it's a database error (pg library threw an error), it maps it to an appropriate HTTP response without leaking database internals to the client.
If it's something totally unexpected (a bug in your code), it logs the full stack trace (so you can debug it) but sends back a generic 500 Internal Server Error to the client (so you don't leak internal code details).
notFoundHandler is a simpler function registered separately that catches any request that fell through all your routes without matching anything. It returns 404 Route Not Found as a clean JSON response instead of the default ugly Express HTML error page.

src/middleware/validate.middleware.js — The Form Checker
This is a factory that takes a Joi schema (a definition of what a valid request body looks like — which fields are required, what types they should be, what format they should follow) and returns middleware that validates incoming requests against that schema.
For example, the registration schema might say: email is required and must be a valid email format; password is required, must be at least 8 characters, and must contain at least one number; phone_number is required and must match E.164 format. If the request body doesn't satisfy these rules, the middleware rejects the request with a 422 Unprocessable Entity response listing exactly which fields are wrong.
This means your service functions never need to validate their input — they can trust that what they receive has already been validated. If the service receives a request, the data is clean.

SECTION 4: THE MODULES FOLDER — The Departments
Each folder under src/modules/ is one department of the building. Every module follows the same internal structure:
*.routes.js — the department's directory (which room handles what)
*.controller.js — the department's receptionist (takes requests, hands them off)
*.service.js — the department's expert (does the actual work)
*.validator.js — the department's intake form (what information must you provide)
*.repository.js (in shared/repositories) — the department's file clerk (talks to the database)
*.providers/ — the department's external contractors (third-party services)
Let me walk through the most complex modules in enough detail that you can understand any bug or test.

The Auth Module — src/modules/auth/
What it does in plain English: Manages who can enter the building and gives them a badge (JWT token) if they're allowed in.

auth.routes.js
This file is purely organizational. It creates an Express Router (a mini-app that handles only auth-related URLs) and maps each URL to the right controller function with the right middleware chain applied.
For example, the registration route has this chain: botDetection.checkHoneypot → botDetection.verifyRecaptcha → rateLimit.registrationLimiter → validate.validate(registerSchema) → authController.register. That means every registration request must pass a honeypot check, then reCAPTCHA check, then rate limit check, then form validation — and only if all four pass does it reach the actual registration logic.
Reading a routes file is how you understand what protection wraps each endpoint. If you see a bug where "users can register without valid data," you check the routes file to see if the validation middleware is actually wired up.

auth.controller.js
The controller's only job is to be the interface between HTTP and your business logic. It extracts data from req.body, req.params, req.headers, and req.user, calls the service function, and formats the response.
Controllers never contain business logic. They should be thin enough that you can look at them and understand the API surface at a glance. If you see database calls or complex if/else logic in a controller, something is in the wrong place.

auth.service.js — The Most Important File to Understand
This is where all the authentication logic lives. Let me walk through register() step by step in plain English:
Check if the email already exists in the database (call user.repository.findByEmail). If it does, throw AppError(409, 'EMAIL_ALREADY_EXISTS').
Check if the phone already exists (call user.repository.findByPhone). If it does, throw AppError(409, 'PHONE_ALREADY_EXISTS').
Hash the password using bcrypt with 12 rounds. Bcrypt is a one-way function — you can never recover the original password from the hash, but you can verify a candidate password against the stored hash. 12 rounds means it takes about 300ms to compute, which is slow enough to deter automated guessing but fast enough for real users.
Inside a single database transaction: create the users row, create the user_profiles row (same transaction so if either fails, neither is saved), create the user_wallets row.
Call otp.util.createOTPRecord() to generate a 6-digit code and save its hash to the database.
Call mailerConfig.sendEmail() to send that code to the user's email.
Return a response indicating that email verification is pending.
The generateTokenPair() function is the key to understanding sessions: it creates two tokens. The access token is a short-lived (15-minute) JWT containing the user's ID and role. It's like a day pass — it expires quickly for security. The refresh token is a long-lived (30-day) random string that is hashed and stored in the database. It's like a membership card that you use to get new day passes. When the access token expires, instead of logging in again, the client sends the refresh token and gets a new access token. This is why you can stay "logged in" for 30 days without your session expiring every 15 minutes.
Token theft detection: If someone steals your refresh token and uses it, and then the real user tries to use the same token again, the system detects that a previously-used token in that "family" is being submitted again, concludes theft has occurred, and revokes all tokens in that family — logging out both the real user and the thief.

auth.validator.js
This file exports Joi schemas. Joi is a validation library. Think of a Joi schema as a form template with strict rules. Here's what registerSchema says in plain English: "email must be present and be a valid email address; phone_number must be present and must match the international phone format; password must be present, at least 8 characters long, and contain at least one uppercase letter, one number; first_name and last_name must be present and be strings."
If the incoming request body doesn't match these rules, the validate.middleware.js catches it and returns an error before the controller is ever called.

The KYC Module — Understanding Providers
KYC (Know Your Customer) is the system that verifies a user's real-world identity by checking their government ID and face. The tricky part is that different countries use different verification providers.
kyc.service.js orchestrates the whole flow. When submitKYC() is called, it looks at the id_country field and selects the appropriate provider (Smile Identity for Nigeria, Onfido for UK/US). Then it calls that provider's verify function.
kyc.providers/smileIdentity.js is a wrapper around the Smile Identity API. "Wrapper" means: instead of your service needing to know the exact format of Smile Identity's API, headers, authentication method, etc., this file hides all those details. The service just says "submit verification" and the wrapper handles the translation.
The webhook handler is the most complex part. When Smile Identity finishes checking the ID, they don't wait for your server to ask — they push the result to your server by calling your webhook URL. Your server must receive that webhook, verify it's genuinely from Smile Identity (using HMAC signature verification), and process the result. This is why webhook URLs are registered in your dashboard with each provider.
How to test KYC: Most providers have a "sandbox mode" where you can submit test documents and get back controlled responses. Call POST /api/v1/kyc/initiate with a test user's token, upload a test image to the Cloudinary URL returned, then call POST /api/v1/kyc/submit. In sandbox mode, the provider will call your webhook endpoint with a simulated result. You can also use ngrok (a tool that exposes your local development server to the internet) so Smile Identity's sandbox can actually reach your localhost.

The Payments Module — The Hardest Part to Debug
This module has the most moving pieces because it involves external providers, webhooks, and state transitions across multiple tables.
payments.service.js
initiatePayment() creates a payment "intent" with the chosen provider and returns data to the frontend. For Stripe, this returns a client_secret which the frontend uses with Stripe's JavaScript library to show the payment form. For Paystack, it returns a payment_url that you redirect the user to. The payment itself happens on the provider's UI — not yours.
The important thing to understand: your backend does not know a payment was successful until the provider tells it via a webhook. The user might complete payment on Stripe's page, but your database still shows the booking as pending_payment until Stripe's webhook arrives at POST /api/v1/payments/webhook/stripe and your handler processes it.
The state machine for payments is: Booking is pending_payment → Sender initiates payment → Escrow is pending → Provider calls webhook with success → onPaymentSuccess() runs → Escrow becomes funded → Booking becomes payment_held → Traveler is notified.
If a bug appears where "payment was made but booking still shows pending," the issue is almost certainly in the webhook handler — either the signature verification is failing, or the booking lookup is failing, or the state transition isn't being saved.
escrow.service.js
The escrow is the trust mechanism. Once a sender pays, the money doesn't go to the traveler — it goes into escrow (held by the platform). This service manages that holding and releasing.
holdFunds() is called when pickup is confirmed. It transitions the escrow from funded to held. The distinction: funded means money arrived; held means the traveler has physically taken the package and the obligation is now in motion.
initiateRelease() is the payoff. It transitions escrow to released, computes the net payout (total amount minus commission), and credits the traveler's wallet via walletService.credit(). Critically, this happens inside a withTransaction() call — the escrow status update and the wallet credit happen in the same database transaction. If either fails, neither is committed. This prevents money from appearing in a wallet without the escrow properly closed, or vice versa.
How to test payments: Use Stripe's test card numbers (like 4242 4242 4242 4242 with any future expiry and any CVC) and Paystack's test credentials in test mode. For webhooks during development, use the Stripe CLI or Paystack's test event feature to manually fire webhook events at your local server.

The Matching Module — The Recommendation Engine
matching.service.js
The matching engine is triggered by an event, not a direct API call. When a travel listing is created, the listing.created event fires. The event handler calls runMatchingForListing(). This function queries the database for open shipment requests that satisfy all four hard filters (route, date, weight, category), then scores each compatible one using computeMatchScore(), and saves the resulting matches records.
computeMatchScore() produces a number from 0 to 100. Here's how it works:
Imagine two compatible matches: both are on the right route and have the right weight. Match A is with a traveler who has a 90/100 trust score, their price is almost exactly what the sender offered, and their flight is in 2 days. Match B is with a traveler who has a 45/100 trust score, their price is much higher than the sender's offer, and their flight is in 3 weeks. Match A will have a score of 92; Match B will have a score of 38. The sender sees these sorted from highest to lowest, so Match A appears first.
How to verify matching works: Create a travel listing and a shipment request on the same corridor (e.g., Lagos → London) with compatible dates, weight, and category. Check GET /api/v1/matches/for-shipment/:shipmentId — you should see the listing appear as a suggested match with a score.

The Messaging Module — Real-Time Chat
This module has two parts working together: REST APIs for history and a WebSocket connection for real-time delivery.
REST side (messaging.service.js): getMessages() is straightforward — it queries the messages table for a given conversation and returns them paginated. Cursor-based pagination means instead of saying "give me page 3," you say "give me messages older than message ID X" — this is more reliable because new messages can arrive between page loads and would shift the page boundaries.
Real-time side (messaging.gateway.js): When a user opens the app, their frontend establishes a WebSocket connection to Socket.IO. Unlike regular HTTP where the connection closes after each request/response, a WebSocket connection stays open. This persistent channel is how messages arrive instantly without the user needing to refresh.
When User A sends a message in a conversation, here's what happens: the frontend emits a send_message event to the Socket.IO server. The gateway's handleSendMessage function receives it, saves the message to the database, and then emits a new_message event to everyone in that conversation's "room." User B, who is also connected and in the same room, receives the new_message event instantly and the message appears in their chat.
If User B is offline (not connected via WebSocket), they don't receive the real-time event. Instead, sendMessage() also calls notificationService.sendPush(), which sends a push notification to User B's phone via Firebase.
How to test: Open two browser tabs, log in as different users in each, connect to Socket.IO using a WebSocket testing tool or a minimal HTML test page, join the same conversation, and send a message. It should appear in both tabs immediately.

The Reviews and Trust Score System
reviews.service.js
updateTrustScore() uses a weighted average formula designed to be resistant to manipulation. If a traveler has 50 deliveries and a trust score of 85, and then gets one bad review (1 star = 20/100 scaled), their new score would be (85 × 0.6) + (20 × 0.4) = 51 + 8 = 59. But then the ±15 cap kicks in — a swing from 85 to 59 is -26 points, which exceeds the cap, so it's capped at 85 - 15 = 70. This means a single bad review can hurt but can't destroy someone's reputation overnight.
Conversely, a newcomer can't just get one 5-star review and jump to a 100 trust score.

The Admin Module
admin.service.js
Every admin action calls recordAdminAction() at the end. This creates a paper trail so you always know which admin did what to which user or entity, with a timestamp. This is your protection against rogue admins or disputes about what actions were taken.
banUser() is the most destructive operation in the system, which is why it calls a cascade of other operations: it cancels all the user's active bookings (which triggers the booking cancellation flow for each, including refunds), freezes their wallet, revokes all their tokens, and sets their status to banned. It's wrapped in withTransaction() so if any step fails, nothing changes.

SECTION 5: THE SHARED FOLDER — Cross-Department Resources

src/shared/repositories/ — The Filing System
Every file here is named [entity].repository.js and contains only SQL queries. No business logic. The reason for this separation:
If you ever need to change your database structure or optimize a query, you only need to change one file — the repository — not hunt through every service that happens to query users. And if you want to test your business logic in isolation, you can mock the repositories.
Each function in a repository takes an optional client parameter. Most of the time you don't pass a client and it uses the pool. But when you need a transaction (multiple queries that must all succeed together), the service calls db.withTransaction(async (client) => { ... }) and passes that client into each repository function, so they all run as part of the same database transaction.

src/shared/utils/jwt.util.js
A JWT (JSON Web Token) is a string that looks like eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1dWlkIn0.SflKxwRJSMeKKF2QT4fwpMeJf36P. It has three parts separated by dots:
Header (algorithm used) + Payload (the data: user ID, role, expiry time) + Signature (cryptographic proof that your server created this, using your secret key).
Anyone can decode the first two parts and read the data inside — they're just base64 encoded, not encrypted. That's okay because the data is not sensitive (just a user ID and role). What they cannot do is forge a valid signature without knowing your secret key.
signAccessToken() creates a new JWT with the user's information and a 15-minute expiry. verifyAccessToken() checks that the signature is valid (made with your secret key), that the token hasn't expired, and returns the decoded payload.

src/shared/utils/crypto.util.js
hashSHA256() is a one-way hash. You give it text, it gives you a fixed-length string. There's no way to reverse it. This is used for OTPs and refresh tokens — you never store the raw value, only the hash. When you need to verify, you hash what was provided and compare hashes.
encryptAES() is a two-way encryption. You can encrypt and decrypt. This is used for OAuth tokens (Google/Apple access tokens) that your system needs to use later to make API calls on the user's behalf.

src/shared/events/ — The Internal PA System
The events system is how different modules communicate without directly calling each other. This is called the event-driven pattern.
Without events, when a delivery is confirmed, the bookings service would have to directly call the escrow service, then the notifications service, then the reviews service, then the wallet service. That creates tight coupling — the bookings service "knows about" all those other services and would break if any of them changed.
With events, the bookings service just announces: "booking.delivered event happened, here is the data." Any other service that cares about that event has registered a listener. The escrow service is listening for booking.delivered and processes the release. The notifications service is listening and sends notifications. Neither the escrow nor the notifications service needs to know about each other — they only know about the events they care about.
shared/events/handlers/booking.handler.js registers all the listeners for booking events at startup time. It says: "when I hear booking.delivered, call these three functions: initiate escrow release, send notifications, trigger review prompts."

src/shared/jobs/ — The Scheduled Staff
Background jobs are processes that run automatically on a schedule, like a cron job on a Linux server.
expireListings.job.js runs every hour and asks: "are there any travel listings whose departure date has passed?" If yes, it marks them as expired. This is necessary because there's no API call that triggers this — listings expire purely based on time.
releaseEscrow.job.js is the safety net. What if a delivery was completed but the sender never confirmed it? After 7 days past the expected arrival, this job flags the booking for admin review instead of leaving it in limbo forever.
These jobs are started in server.js using node-cron, which uses the same syntax as Linux cron jobs (e.g., 0 * * * * means "at minute 0 of every hour").

src/shared/constants/ — The Vocabulary Dictionary
enums.js mirrors your PostgreSQL enum types in JavaScript. Instead of writing if (booking.status === 'pending_payment') as a string literal everywhere (and risking a typo that's hard to find), you write if (booking.status === BookingStatus.PENDING_PAYMENT). If you ever misspell the constant, JavaScript will throw an error immediately at startup rather than a silent bug at runtime.
errors.js does the same for error codes. Instead of throw new AppError(400, 'INVALID_OTP') scattered through files, you use throw new AppError(400, Errors.INVALID_OTP). Consistent, refactorable, and impossible to misspell.

SECTION 6: HOW TO TEST AND DEBUG

Your Testing Layers
Layer 1 — Single Endpoint Testing (Postman): Test each endpoint in isolation. You're verifying that the route exists, the middleware chain is correct, the validation works, and the happy path returns the right response shape.
Layer 2 — Flow Testing (Postman Collections): Test a complete user journey using Postman's collection runner with environment variables. A flow test for "complete delivery" would be: register → verify email → verify phone → login → initiate KYC → submit KYC → create travel listing → create shipment request → check matches → express interest → accept match → initiate payment → (manually trigger webhook) → confirm pickup → confirm delivery → verify escrow released → verify wallet credited.
Layer 3 — Frontend Integration Testing: Have the frontend call the real APIs and observe whether the UI behaves correctly end-to-end.

The Debug Process: How to Trace Any Bug
When an API call fails, ask these questions in order:
Question 1: Did the request reach the server at all? Check your Winston logs. Every request should be logged immediately on arrival. If nothing appears in logs, the problem is in network or server configuration, not in your code.
Question 2: Did it pass middleware? Look at the error code. 401 means auth middleware blocked it. 403 means it got past auth but failed KYC or role check. 429 means rate limiting blocked it. 403 BOT_DETECTED means reCAPTCHA failed. 422 VALIDATION_ERROR means the request body didn't pass schema validation.
Question 3: Did the controller receive it? Put a console.log('controller reached', req.body) at the very first line of the relevant controller function and run the request again. If you see it in logs, the controller was reached.
Question 4: Did the service throw? Put a try/catch in the controller temporarily and log the error from the service. Most service errors are intentional AppErrors with a clear code — the message will tell you exactly what rule was violated.
Question 5: Did the database query fail? Repository errors usually look like PostgreSQL errors: duplicate key value violates unique constraint, null value in column violates not-null constraint, foreign key constraint violation. These are logged at the service level. They tell you exactly what data was wrong.
Question 6 (for webhooks specifically): Did the signature verification pass? Webhook failures are almost always signature mismatches. Check that the raw body is being read before JSON parsing (JSON parsing transforms the body and breaks the signature), that the secret key in your .env matches what's registered in the provider's dashboard, and that you're reading the right header name.

What to Look For When Reading Generated Code
When the AI agent generates code for a service function, here's how to read it:
At the top: What repositories and utilities are imported? This tells you what external dependencies this function has.
The function signature: What parameters does it accept? Do they match what the controller is extracting from req.body?
Is there a withTransaction call? If the function touches multiple tables, there should be. If it's modifying multiple records and there's no transaction, that's a potential data consistency bug.
What events does it emit at the end? Any eventEmitter.emit(...) call means side effects will happen asynchronously. If a notification should fire after an action and it's not firing, check whether the emit is present and whether the handler is registered.
What AppErrors does it throw? These become your API's error responses. Make sure the codes match what's documented in the API spec.
Does it call auditRepository.create() for admin actions? If you're implementing an admin endpoint and there's no audit log call, that's a gap.

The Checklist Before Declaring a Phase Complete
For each endpoint you build, verify:
Starting with the database: does GET /api/v1/health confirm the DB is connected? Do the migration files run without error in sequence?
For each route: does hitting it without a token return 401? Does hitting it with an invalid body return 422 with field-level errors? Does hitting it with a valid token and valid body return the expected success response? Do all the fields in the success response match what the API documentation specifies?
For background jobs: are they running on schedule? Can you manually invoke them and see the log output? Do they correctly modify the database records they're supposed to?
For webhooks: can you fire a test event from the provider's dashboard and see your server receive and process it? Does the database state change correctly after the webhook fires?

This explanation is your map of the building. Every file has a job, every function has a responsibility, and every request follows the same journey through the system. When something breaks, you now have a framework to ask: "which room in the building did this visitor get stuck in, and why?" The answer is almost always findable by reading the logs and tracing the request flow step by step.
