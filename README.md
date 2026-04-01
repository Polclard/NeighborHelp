# System Requirements Document
## NeighborHelp — Community Service Request & Offering Platform

**Version:** 1.0.0  
**Date:** April 2026  
**Status:** Draft — Ready for Development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals & Objectives](#2-goals--objectives)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Functional Requirements](#4-functional-requirements)
    - 4.1 Authentication & Registration
    - 4.2 User Profile
    - 4.3 Map & Location
    - 4.4 Service Posts (Requests & Offers)
    - 4.5 Real-Time Messaging / Chat
    - 4.6 Service Status Lifecycle
    - 4.7 Reviews & Ratings
    - 4.8 Search
    - 4.9 Admin Panel
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Technology Stack](#6-technology-stack)
7. [Architecture Overview](#7-architecture-overview)
    - 7.1 Onion Architecture (Backend)
    - 7.2 Frontend Architecture
    - 7.3 Real-Time Communication
    - 7.4 Database Schema Overview
8. [Database Design](#8-database-design)
9. [API Endpoints Overview](#9-api-endpoints-overview)
10. [Flyway Migrations Strategy](#10-flyway-migrations-strategy)
11. [Security Requirements](#11-security-requirements)
12. [File Upload & Storage](#12-file-upload--storage)
13. [Third-Party Integrations](#13-third-party-integrations)
14. [Development Phases & Milestones](#14-development-phases--milestones)
15. [Open Questions & Future Enhancements](#15-open-questions--future-enhancements)

---

## 1. Project Overview

**NeighborHelp** is a location-based community platform where users can post requests for help (e.g., "my fridge broke, can someone help?") or advertise services they offer (e.g., "I am an electrician available in this area"). Other users can then discover these posts through an interactive map, communicate in real time, and ultimately connect to solve everyday problems within a local community.

The platform supports a full service lifecycle: from initial posting and discovery, through real-time negotiation via chat, to service completion and a star-based review system.

---

## 2. Goals & Objectives

- Allow community members to ask for and offer services in a hyper-local, map-centric way.
- Provide seamless real-time communication between users to facilitate agreement and coordination.
- Give admins full oversight and moderation capabilities.
- Be extensible — built on clean, layered architecture that is easy to maintain and extend.
- Be secure — JWT-based authentication, role enforcement, input validation throughout.

---

## 3. User Roles & Permissions

The system will have three distinct roles. Roles are stored in the database and enforced on every request server-side.

### 3.1 ROLE_USER (Default)

All registered users receive this role. Within this role, a user can act as a **Requester** or an **Offerer** — not based on a permanent role, but based on what kind of post they create. That will be determined(chosen) by a dropdown when creating the post.

| Permission                               | Allowed |
| ---------------------------------------- | ------- |
| Register / Login                         | ✅       |
| View map and all posts                   | ✅       |
| Create a SERVICE_REQUEST post            | ✅       |
| Create a SERVICE_OFFER post              | ✅       |
| Edit own posts                           | ✅       |
| Delete own posts                         | ✅       |
| Send/receive messages                    | ✅       |
| Upload photos to own post                | ✅       |
| Accept a service offer on their request  | ✅       |
| Mark a service as DONE                   | ✅       |
| Leave a review for the helper            | ✅       |
| Edit/delete other users' content         | ❌       |
| See another profiles to see their rating | ✅       |

### 3.2 ROLE_ADMIN

A single superuser role. Admins have all capabilities of ROLE_USER, plus:

| Permission                       | Allowed |
| -------------------------------- | ------- |
| Delete any user account          | ✅       |
| Delete any post                  | ✅       |
| Delete any message               | ✅       |
| Edit any post                    | ✅       |
| View all users and their details | ✅       |
| Ban/suspend users                | ✅       |
| Access admin dashboard           | ✅       |
| Manage reported content          | ✅       |
Only one superuser will be created at the beginning  and he can change in the (all users list) who can be admin. So certain user can become admin if the already added admins add them as admin.

### 3.3 Unauthenticated Visitor

| Permission                                                                                       | Allowed |
| ------------------------------------------------------------------------------------------------ | ------- |
| View the map (read-only)                                                                         | ✅       |
| Register                                                                                         | ✅       |
| Login                                                                                            | ✅       |
| Create posts / message users                                                                     | ❌       |
| He can see posts of other people and the detailed information but cannot interact only read only | ✅       |

---

## 4. Functional Requirements

### 4.1 Authentication & Registration

#### FR-AUTH-01: User Registration
- A user can register with: **first name, last name, email, password, phone number (optional)**.
- Email must be unique across the system.
- Password must be hashed using **BCrypt** before storage.
- Upon successful registration, the system assigns ROLE_USER.
- A welcome email may be sent (optional in Phase 1, required in Phase 2).

#### FR-AUTH-02: User Login
- Users log in with email + password.
- On success, the server returns a **JWT access token** and a **refresh token**.
- The access token is short-lived (e.g., 15 minutes). The refresh token is long-lived (e.g., 7 days).
- The frontend stores the JWT in memory or a secure cookie (not localStorage for security).

#### FR-AUTH-03: Token Refresh
- A dedicated endpoint (`POST /api/auth/refresh`) accepts the refresh token and issues a new access token without requiring re-login.

#### FR-AUTH-04: Logout
- On logout, the refresh token is invalidated server-side (stored in DB or Redis with a revocation list).

#### FR-AUTH-05: Password Reset (Phase 2)
- User requests a password reset by email.
- A time-limited token is emailed.
- User visits a reset link and sets a new password.

---

### 4.2 User Profile

#### FR-PROFILE-01: View Profile
- Any authenticated user can view any other user's public profile.
- Public profile displays: name, profile picture, average rating, number of services completed, list of reviews received, and offered services (if any).

#### FR-PROFILE-02: Edit Own Profile
- User can update: first name, last name, phone number, profile picture, short bio, and a list of services they offer (free text tags, e.g., "Plumbing", "Electrician", "Furniture Assembly").
- Email changes must be re-verified (Phase 2).

#### FR-PROFILE-03: Profile Picture Upload
- Users can upload a profile picture (JPEG or PNG, max 5 MB).
- The image is stored on the server filesystem or in an object store (S3-compatible in Phase 2).
- A default avatar is shown if no picture is uploaded.

#### FR-PROFILE-04: Account Deactivation
- A user can request deletion of their account.
- All their posts are anonymized (not deleted, to preserve service history integrity). Their chat messages may be soft-deleted.

---

### 4.3 Map & Location

#### FR-MAP-01: Main Map View
- The main page shows an interactive **Leaflet.js** map.
- The map occupies approximately **2/3 of the screen width** on the left.
- The remaining **1/3 on the right** is a sidebar showing posts, search, and filters.

#### FR-MAP-02: Map Centering & Initial View
- On first load, the map attempts to use the **browser's Geolocation API** to center on the user's current position.
- If geolocation is denied, the map defaults to a configurable city center (set in app config).

#### FR-MAP-03: Map Pins / Markers
- Each active post (REQUEST or OFFER) is displayed as a **custom-styled pin** on the map.
- REQUEST pins and OFFER pins have visually distinct colors and icons (e.g., orange for requests, green for offers).
- Pins for posts with status SERVICE_DONE are hidden by default (togglable via filter).

#### FR-MAP-04: Pin Hover Card
- Hovering over a pin shows a **popup card** with:
    - Post title / short description
    - Post type (REQUEST or OFFER)
    - User's name and avatar
    - Current status badge
    - Distance from the user (if geolocation is available)
    - A "View Details" button

#### FR-MAP-05: Pin Click — Detail Page
- Clicking the "View Details" button (or the pin) navigates to the full **Post Detail Page**.

#### FR-MAP-06: Route to Location
- On the Post Detail page, there is a **"Get Directions"** button.
- Clicking it opens a route on the map from the user's current location to the post's pinned location, using **Leaflet Routing Machine** or the **OpenRouteService API**.

#### FR-MAP-07: Post Location Selection
- When creating a post, the user can:
    1. **Use current location** (detected via browser geolocation), OR
    2. **Click a point on the map** to pinpoint a custom location (e.g., if the service is needed at a different address).
- The selected coordinates (latitude, longitude) and optional address label are stored with the post.

---

### 4.4 Service Posts (Requests & Offers)

#### FR-POST-01: Post Types
- Every post has a `postType` field: either **SERVICE_REQUEST** or **SERVICE_OFFER**.
- This is chosen by the user at creation time, not dictated by their account role.

#### FR-POST-02: Create a Post
A user can create a post with the following fields:

| Field | Type | Required |
|---|---|---|
| Title | String (max 100 chars) | ✅ |
| Description | Text (max 2000 chars) | ✅ |
| Post Type | Enum (REQUEST / OFFER) | ✅ |
| Category | Enum or free tag (e.g., Plumbing, Electronics) | ✅ |
| Location | Lat/Lng + optional address label | ✅ |
| Contact Info Override | Phone / Email (optional, if different from profile) | ❌ |
| Photos | Up to 5 images | ❌ |

#### FR-POST-03: Edit Post
- The post author can edit any field of their post as long as it is in status **REQUESTING** or **OFFERING**.
- Once a service is **ACCEPTED**, editing is restricted (title/description only, no location change).

#### FR-POST-04: Delete Post
- The post author or an admin can delete a post.
- Deletion is a **soft delete** (a `deleted_at` timestamp is set; the record remains in the DB).

#### FR-POST-05: Post Detail Page
The post detail page includes:
- Full title, description, category, status badge.
- All uploaded photos in a gallery.
- Author's profile card (name, avatar, average rating, contact info if provided).
- Map widget zoomed to the post's location.
- "Contact / Message" button — opens a chat thread with the post author.
- "Get Directions" button.
- Status history timeline (e.g., Posted → Accepted → Done).
- Reviews section (visible once status = SERVICE_DONE).

#### FR-POST-06: Photo Upload on Post
- Up to **5 photos** per post (JPEG/PNG, max 5 MB each).
- Photos can be added at creation time or later (in edit mode).
- Photos are displayed as a scrollable gallery on the detail page.

#### FR-POST-07: Contact Information on Post
- Each post can optionally display the requester's **phone number** and/or **email**.
- These are pulled from the user profile but can be overridden per-post.
- The offering user can use these to call or email directly without using the in-app chat.

---

### 4.5 Real-Time Messaging / Chat

This is a critical feature. The implementation uses **WebSockets** via the **STOMP protocol** on top of Spring's `spring-boot-starter-websocket`. Messages are persisted to PostgreSQL so chat history is available on page reload.

#### FR-CHAT-01: Starting a Conversation
- A user opens a chat with another user by clicking "Message" on their post or profile.
- A **Conversation** is created (if one doesn't already exist between these two users for this post).
- Each Conversation is linked to: `user_a_id`, `user_b_id`, and optionally `post_id`.

#### FR-CHAT-02: Real-Time Message Exchange
- Messages are sent via **WebSocket (STOMP)**.
- On connect, the client subscribes to their private channel: `/user/{userId}/queue/messages`.
- When a user sends a message, the backend:
    1. Persists it to the `messages` table.
    2. Pushes it to the recipient's private subscription.
- If the recipient is offline, messages are still persisted and delivered when they reconnect.

#### FR-CHAT-03: Message Content
- Text messages (plain text, max 2000 characters).
- Image sharing: user can upload a photo within the chat (stored server-side, URL sent as message payload).
- Timestamps (sent at) are stored and displayed.
- Read receipts (Phase 2): `read_at` timestamp on each message.

#### FR-CHAT-04: Chat UI
- The chat UI resembles a modern messenger:
    - Messages from self appear on the right (blue bubble), from the other party on the left (grey bubble).
    - Timestamps shown beneath each message.
    - Scroll-to-latest-message on new incoming message.
    - Typing indicator (Phase 2).
    - Unread message badge on the chat list.

#### FR-CHAT-05: Chat List
- Users can access a **Conversations** page listing all their active chats.
- Each row shows: other user's avatar, name, last message preview, last message timestamp, and unread count.

#### FR-CHAT-06: WebSocket Technology Detail (Implementation Guidance)

**Backend:**
```
Dependencies: spring-boot-starter-websocket
Config: WebSocketMessageBrokerConfigurer
  - enableSimpleBroker("/queue", "/topic")
  - setApplicationDestinationPrefixes("/app")
  - setUserDestinationPrefix("/user")

Message flow:
  Client sends to: /app/chat.send
  Server @MessageMapping("/chat.send") → saves to DB → sends to /user/{recipientId}/queue/messages
```

**Frontend:**
```
Library: @stomp/stompjs + sockjs-client
Flow:
  1. Connect with SockJS fallback
  2. Authenticate connection using JWT in STOMP CONNECT headers
  3. Subscribe to /user/queue/messages
  4. On message: dispatch to Redux store → render in chat component
```

**Persistence:** Every message is written to the `messages` table before being pushed over the WebSocket. On page load, the chat history is fetched via REST (`GET /api/conversations/{id}/messages`).

---

### 4.6 Service Status Lifecycle

Each SERVICE_REQUEST post follows a defined lifecycle. SERVICE_OFFER posts have a simpler lifecycle.

#### FR-STATUS-01: Status Definitions

**For SERVICE_REQUEST posts:**

| Status | Description | Who Can Set It |
|---|---|---|
| `REQUESTING` | Post is live, visible on map, awaiting offers of help | System (on creation) |
| `SERVICE_ACCEPTED` | A helper has been chosen, service is in progress | Requester (accepts an offer from a helper) |
| `SERVICE_DONE` | Service is complete | Requester |
| `CANCELLED` | Post was cancelled before completion | Requester or Admin |

**For SERVICE_OFFER posts:**

| Status | Description | Who Can Set It |
|---|---|---|
| `OFFERING` | Post is live and visible | System (on creation) |
| `UNAVAILABLE` | Offerer is temporarily unavailable | Offerer |
| `CLOSED` | Offer is permanently closed | Offerer or Admin |

#### FR-STATUS-02: Status Transition Flow (Requests)

```
[REQUESTING] ──(requester accepts a helper)──▶ [SERVICE_ACCEPTED]
                                                        │
                                             (requester marks done)
                                                        │
                                                        ▼
                                               [SERVICE_DONE]
                                             (review unlocked)

[REQUESTING or SERVICE_ACCEPTED] ──(requester or admin cancels)──▶ [CANCELLED]
```

#### FR-STATUS-03: Accepting a Helper
- A helper sends a message expressing interest (or clicks an "I can help" button on a REQUEST post).
- The requester sees a notification / indicator in the chat or on their post dashboard.
- The requester clicks **"Accept this helper"** on the post detail page (this lists users who have messaged them).
- The post status changes to `SERVICE_ACCEPTED`.
- The post pin on the map changes color to reflect the new status.
- The post remains visible on the map for transparency but is marked as accepted.

#### FR-STATUS-04: Marking Service as Done
- Only the **requester** can mark the service as done.
- A confirmation dialog is shown: "Are you sure you want to mark this service as completed?"
- On confirm, status → `SERVICE_DONE`.
- The review flow is immediately triggered (optional for the user).

---

### 4.7 Reviews & Ratings

#### FR-REVIEW-01: Who Can Review
- Only the **requester** can leave a review.
- A review can only be left after the post status is `SERVICE_DONE`.
- Only one review per completed service per requester.

#### FR-REVIEW-02: Review Content
- **Star rating:** 1–5 stars (integer, required).
- **Text review:** optional, max 1000 characters.
- **Timestamp:** automatically recorded.

#### FR-REVIEW-03: Displaying Reviews
- All reviews received by a user are shown on their **public profile page**.
- The profile displays: average star rating (1 decimal) and total review count.
- Each review shows: reviewer's name, avatar, star rating, text, and date.

#### FR-REVIEW-04: Review Moderation
- Admin can delete any review that violates platform terms.
- Users can **report** a review (sends a flag to the admin dashboard).

---

### 4.8 Search

#### FR-SEARCH-01: Global Keyword Search
- A search bar is available on the main page (spotlight-style, triggered on focus or keyboard shortcut).
- The user types keywords and sees a **dropdown of matching posts** in real time (debounced, 300ms).
- Results show: post title, type badge (REQUEST/OFFER), category, distance.
- Clicking a result closes the dropdown and **flies the map** to that post's pin, opening the hover card.

#### FR-SEARCH-02: Search Fields
- Search is performed across: post **title**, **description**, and **category**.
- Backend: PostgreSQL full-text search (`tsvector` / `tsquery`) or simple `ILIKE` pattern matching for Phase 1.

#### FR-SEARCH-03: Sidebar Filters
- The sidebar (right panel) includes filter controls:
    - **Post type:** All / Requests only / Offers only
    - **Category:** Multi-select dropdown
    - **Status:** Active only (default) / All
    - **Distance radius:** Slider (e.g., 1 km, 5 km, 10 km, 50 km)
- Filters update the map pins and sidebar list in real time.

---

### 4.9 Admin Panel

#### FR-ADMIN-01: Admin Dashboard
- A protected route accessible only to users with ROLE_ADMIN.
- Dashboard shows: total users, total active posts, total completed services, flagged/reported content count.

#### FR-ADMIN-02: User Management
- Admin can view a paginated list of all users.
- Admin can search users by name, email.
- Admin can **ban** a user (sets `is_banned = true`, prevents login).
- Admin can **delete** a user account (soft delete).
- Admin can view any user's profile and their posts.

#### FR-ADMIN-03: Post Management
- Admin can view all posts (including soft-deleted).
- Admin can **edit** or **hard-delete** any post.
- Admin can change the status of any post.

#### FR-ADMIN-04: Reported Content
- Users can report a post or a review using a "Report" button.
- Reports appear in the admin dashboard with: reporter, reported content preview, reason, timestamp.
- Admin marks a report as "resolved" (with or without taking action).

---

## 5. Non-Functional Requirements

### 5.1 Performance
- The map and sidebar must load within **3 seconds** on a standard broadband connection.
- API endpoints must respond within **500ms** for standard requests under normal load.
- WebSocket message delivery latency must be under **200ms** under normal conditions.
- Full-text search results must return within **1 second**.

### 5.2 Scalability
- The backend is stateless (JWT-based auth) and should be horizontally scalable.
- WebSocket sessions should be manageable by a single server in Phase 1. For multi-instance scaling in Phase 2, use a message broker like **RabbitMQ** or **Redis Pub/Sub** as the STOMP broker.

### 5.3 Availability
- Target: **99.5% uptime** for Phase 1 (single server deployment).
- Database backups every 24 hours.

### 5.4 Security
- All endpoints are HTTPS-only (TLS enforced in production).
- JWT tokens are signed with RS256 or HS256 (configurable).
- Role-based access enforced at the service layer (not just controller).
- SQL injection prevented by JPA parameterized queries.
- XSS prevention in frontend (React escapes by default; no `dangerouslySetInnerHTML`).
- File uploads validated for MIME type and size.
- Rate limiting on auth endpoints (e.g., max 10 login attempts per IP per minute).

### 5.5 Usability
- The application must be fully responsive (mobile-friendly).
- The map experience on mobile should use the full screen with a collapsible sidebar.
- WCAG 2.1 Level AA accessibility guidelines followed where practical.

### 5.6 Maintainability
- All database changes managed exclusively via **Flyway migrations** (no manual schema changes).
- Code follows clear Onion Architecture layers with no cross-layer leakage.
- All REST endpoints documented via **Swagger/OpenAPI 3** (using `springdoc-openapi`).
- Unit tests for service layer (JUnit 5 + Mockito). Integration tests for REST controllers.

---

## 6. Technology Stack

### 6.1 Backend

| Component | Technology | Notes |
|---|---|---|
| Framework | Spring Boot 3.x | Java 21 (LTS) |
| Architecture | Onion (Layered) | See Section 7.1 |
| ORM | Spring Data JPA + Hibernate | |
| Database | PostgreSQL 15+ | |
| Migrations | Flyway | All schema changes via migration scripts |
| Authentication | Spring Security + JWT | Access token + refresh token |
| WebSockets | Spring WebSocket (STOMP) | SockJS fallback for HTTP polling |
| File Storage | Local filesystem (Phase 1) | S3-compatible object store (Phase 2) |
| API Docs | springdoc-openapi (Swagger UI) | |
| Testing | JUnit 5, Mockito, Spring Boot Test | |
| Build Tool | Maven or Gradle | Team preference |

### 6.2 Frontend

| Component | Technology | Notes |
|---|---|---|
| Framework | React 18 | Functional components + Hooks |
| State Management | Redux Toolkit | `createSlice`, `createAsyncThunk` |
| Routing | React Router v6 | `BrowserRouter` |
| Map | Leaflet.js + React-Leaflet | Custom markers, popups |
| Routing on Map | Leaflet Routing Machine or OpenRouteService | Directions feature |
| WebSocket Client | @stomp/stompjs + sockjs-client | Real-time chat |
| HTTP Client | Axios | Interceptors for JWT refresh |
| Styling | Tailwind CSS or CSS Modules | Team preference |
| Forms | React Hook Form + Yup | Validation |
| Testing | Jest + React Testing Library | |

### 6.3 Infrastructure (Phase 1 — Dev/Staging)

| Component | Technology |
|---|---|
| Database | PostgreSQL (local or Docker) |
| Server | Single VPS / EC2 instance |
| Reverse Proxy | Nginx |
| Containerization | Docker + Docker Compose |

---

## 7. Architecture Overview

### 7.1 Onion Architecture (Backend)

The backend is organized into concentric layers. Dependency direction is always **inward** — outer layers depend on inner layers, never the reverse.

```
┌──────────────────────────────────────────────────────────┐
│                  REST Controllers (API Layer)            │
│         Spring MVC @RestController classes               │
│      Handles HTTP, validates input, calls Services       │
├──────────────────────────────────────────────────────────┤
│              Application / Service Layer                 │
│    Interfaces (e.g., UserService, PostService)          │
│    + Implementations (e.g., UserServiceImpl)            │
│      Contains business logic, orchestrates entities     │
├──────────────────────────────────────────────────────────┤
│                   Domain / Model Layer                   │
│    JPA Entities (User, Post, Message, Review, etc.)     │
│    Domain enums (PostType, PostStatus, Role)            │
├──────────────────────────────────────────────────────────┤
│                 Repository Layer (Data Access)           │
│    Spring Data JPA Repository interfaces                │
│    Custom JPQL or native queries where needed           │
└──────────────────────────────────────────────────────────┘
```

**Package structure:**
```
com.neighborhelp
├── config/                    # Spring configs (Security, WebSocket, Flyway, etc.)
├── controller/                # REST controllers
├── dto/                       # Request/Response DTOs (never expose entities directly)
├── exception/                 # Global exception handler, custom exceptions
├── model/                     # JPA entities + enums
├── repository/                # Spring Data JPA interfaces
├── service/                   # Service interfaces
│   └── impl/                  # Service implementations
├── security/                  # JWT filter, UserDetailsService, token utils
├── websocket/                 # STOMP message handlers
└── util/                      # Utility classes
```

**Rules:**
- Controllers never talk directly to repositories.
- Entities are never returned directly from controllers — always use DTOs.
- DTOs are mapped using MapStruct or manual mapping in the service layer.
- All `@Transactional` annotations go on the service implementation, not the controller.

### 7.2 Frontend Architecture

```
src/
├── app/
│   ├── store.js               # Redux store configuration
│   └── rootReducer.js
├── features/
│   ├── auth/                  # Login, Register, token management
│   ├── map/                   # Leaflet map, pins, filters
│   ├── posts/                 # Post list, post detail, create/edit post
│   ├── chat/                  # Conversation list, chat window, WebSocket
│   ├── profile/               # User profile view and edit
│   ├── admin/                 # Admin dashboard and management
│   └── reviews/               # Review submission and display
├── components/                # Shared/reusable UI components
├── services/                  # Axios API client, WebSocket client setup
├── hooks/                     # Custom React hooks (useGeolocation, useDebounce, etc.)
├── utils/                     # Helper functions
└── constants/                 # Enums, config values
```

**Redux slices:** `authSlice`, `postsSlice`, `mapSlice`, `chatSlice`, `profileSlice`, `adminSlice`.

**Axios interceptor** attaches the JWT to every request and handles 401 responses by attempting token refresh before retrying.

### 7.3 Real-Time Communication Architecture

```
Browser (React)                    Spring Boot Backend
      │                                    │
      │  HTTP POST /api/auth/login         │
      │──────────────────────────────────▶│
      │◀─────────────── JWT + refreshToken─│
      │                                    │
      │  WS Connect (SockJS)               │
      │  STOMP CONNECT headers: {JWT}      │
      │──────────────────────────────────▶│ ─▶ JwtChannelInterceptor validates token
      │                                    │
      │  SUBSCRIBE /user/queue/messages    │
      │──────────────────────────────────▶│
      │                                    │
      │  SEND /app/chat.send               │
      │  {toUserId, content, conversationId}│
      │──────────────────────────────────▶│
      │                          @MessageMapping("/chat.send")
      │                          1. Validate sender
      │                          2. Persist to DB (messages table)
      │                          3. messagingTemplate.convertAndSendToUser(
      │                               recipientId, "/queue/messages", messageDTO)
      │                                    │
      │  MESSAGE /user/queue/messages      │
      │◀──────────────────────────────────│
      │  (Redux dispatched, UI updated)    │
```

### 7.4 Database Schema Overview

See Section 8 for full details.

---

## 8. Database Design

All tables use UUID primary keys to avoid sequential ID guessing.

### 8.1 Table: `users`

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone_number    VARCHAR(50),
    bio             TEXT,
    profile_picture VARCHAR(500),
    role            VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    is_banned       BOOLEAN NOT NULL DEFAULT FALSE,
    average_rating  DECIMAL(3,2) DEFAULT 0.00,
    review_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP
);
```

### 8.2 Table: `service_posts`

```sql
CREATE TABLE service_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    title           VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    post_type       VARCHAR(30) NOT NULL,   -- SERVICE_REQUEST | SERVICE_OFFER
    status          VARCHAR(30) NOT NULL,   -- REQUESTING | OFFERING | SERVICE_ACCEPTED | SERVICE_DONE | CANCELLED | CLOSED
    category        VARCHAR(100) NOT NULL,
    latitude        DECIMAL(10,8) NOT NULL,
    longitude       DECIMAL(11,8) NOT NULL,
    address_label   VARCHAR(255),
    contact_phone   VARCHAR(50),
    contact_email   VARCHAR(255),
    accepted_user_id UUID REFERENCES users(id),  -- Helper who was accepted
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP
);
```

### 8.3 Table: `post_photos`

```sql
CREATE TABLE post_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID NOT NULL REFERENCES service_posts(id) ON DELETE CASCADE,
    file_path   VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 8.4 Table: `conversations`

```sql
CREATE TABLE conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id   UUID NOT NULL REFERENCES users(id),
    user_b_id   UUID NOT NULL REFERENCES users(id),
    post_id     UUID REFERENCES service_posts(id),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_a_id, user_b_id, post_id)
);
```

### 8.5 Table: `messages`

```sql
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT,
    image_url       VARCHAR(500),
    sent_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMP,
    deleted_at      TIMESTAMP
);
```

### 8.6 Table: `reviews`

```sql
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES service_posts(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    reviewed_user_id UUID NOT NULL REFERENCES users(id),
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    UNIQUE(post_id, reviewer_id)
);
```

### 8.7 Table: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    revoked_at  TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 8.8 Table: `reports`

```sql
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    reported_post_id    UUID REFERENCES service_posts(id),
    reported_review_id  UUID REFERENCES reviews(id),
    reason          TEXT NOT NULL,
    resolved        BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by     UUID REFERENCES users(id),
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 9. API Endpoints Overview

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer {JWT}` header. Admin-only endpoints additionally require ROLE_ADMIN.

### 9.1 Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register a new user |
| POST | `/api/auth/login` | None | Login, returns JWT + refresh token |
| POST | `/api/auth/refresh` | None | Exchange refresh token for new access token |
| POST | `/api/auth/logout` | User | Revoke refresh token |

### 9.2 Users / Profile

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | User | Get own profile |
| PUT | `/api/users/me` | User | Update own profile |
| POST | `/api/users/me/avatar` | User | Upload profile picture |
| GET | `/api/users/{id}` | User | Get any user's public profile |
| GET | `/api/users/{id}/reviews` | User | Get reviews for a user |
| DELETE | `/api/users/{id}` | Admin | Delete a user |
| PATCH | `/api/users/{id}/ban` | Admin | Ban/unban a user |

### 9.3 Posts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | None/User | List posts (with filters: type, status, category, lat/lng/radius) |
| GET | `/api/posts/{id}` | None/User | Get single post detail |
| POST | `/api/posts` | User | Create a new post |
| PUT | `/api/posts/{id}` | User/Admin | Update a post |
| DELETE | `/api/posts/{id}` | User/Admin | Soft-delete a post |
| POST | `/api/posts/{id}/photos` | User | Upload photo(s) to a post |
| PATCH | `/api/posts/{id}/status` | User/Admin | Change post status |
| PATCH | `/api/posts/{id}/accept/{helperId}` | User | Accept a specific helper |
| GET | `/api/posts/search?q={keyword}` | None/User | Search posts (for dropdown) |

### 9.4 Conversations & Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/conversations` | User | Get all conversations for current user |
| POST | `/api/conversations` | User | Start a new conversation (with postId) |
| GET | `/api/conversations/{id}/messages` | User | Get message history (paginated) |
| WebSocket | `/app/chat.send` | User (JWT) | Send a real-time message |

### 9.5 Reviews

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/posts/{id}/review` | User | Leave a review after service done |
| DELETE | `/api/reviews/{id}` | Admin | Delete a review |
| POST | `/api/reviews/{id}/report` | User | Report a review |

### 9.6 Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | Paginated user list |
| GET | `/api/admin/reports` | Admin | List flagged content |
| PATCH | `/api/admin/reports/{id}/resolve` | Admin | Resolve a report |

---

## 10. Flyway Migrations Strategy

- All migrations live in `src/main/resources/db/migration/`.
- Naming convention: `V{version}__{description}.sql`  
  Examples: `V1__create_users_table.sql`, `V2__create_service_posts_table.sql`
- Migrations are **never modified** after they have been run. New changes require new migration files.
- Each migration is idempotent where possible (use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).
- Migrations run automatically at application startup via Spring Boot's Flyway auto-configuration.

**Suggested migration order:**
```
V1__create_users_table.sql
V2__create_service_posts_table.sql
V3__create_post_photos_table.sql
V4__create_conversations_table.sql
V5__create_messages_table.sql
V6__create_reviews_table.sql
V7__create_refresh_tokens_table.sql
V8__create_reports_table.sql
V9__add_indexes.sql
V10__insert_admin_user.sql
```

---

## 11. Security Requirements

### 11.1 JWT Configuration
- JWT signed with HMAC-SHA256 (HS256) using a secret stored in environment variables (never in code).
- Access token expiry: 15 minutes.
- Refresh token expiry: 7 days, stored in `refresh_tokens` table.
- The refresh token is a random opaque string (UUID or SecureRandom), not a JWT, to allow server-side revocation.

### 11.2 Authorization Rules (enforced in Service layer)
- `@PreAuthorize("hasRole('ADMIN')")` on admin service methods.
- Ownership checks: before editing/deleting a post, verify `post.getUserId().equals(currentUserId)`.
- Never trust the client for role claims beyond what the JWT contains.

### 11.3 Input Validation
- All DTOs annotated with Jakarta Bean Validation (`@NotNull`, `@Size`, `@Email`, etc.).
- A global `@RestControllerAdvice` exception handler returns standardized error responses.

### 11.4 CORS
- CORS configured to allow only the frontend origin (not `*` in production).
- WebSocket endpoint also CORS-restricted.

### 11.5 Rate Limiting (Phase 2)
- Use **Bucket4j** or a custom filter to rate-limit `/api/auth/login` and `/api/auth/register`.

---

## 12. File Upload & Storage

### Phase 1: Local Filesystem
- Uploaded files stored in a configurable directory on the server (e.g., `/var/neighborhelp/uploads/`).
- Files served via a Spring `ResourceHttpRequestHandler` or Nginx static file serving.
- File path stored in the database as a relative path.
- Validation: MIME type whitelist (`image/jpeg`, `image/png`), max size 5 MB per file.

### Phase 2: S3-Compatible Object Storage
- Migrate to AWS S3 or MinIO.
- Backend generates a pre-signed URL for direct browser upload, or proxies the upload.
- CDN (CloudFront or similar) for serving images fast.

---

## 13. Third-Party Integrations

| Integration | Purpose | Phase |
|---|---|---|
| Leaflet.js | Interactive map rendering | 1 |
| OpenStreetMap | Map tile provider (free) | 1 |
| Leaflet Routing Machine | Route display between two points | 1 |
| OpenRouteService API | Routing backend (geocoding + directions) | 1 |
| SockJS + STOMP | WebSocket fallback and messaging protocol | 1 |
| Nominatim (OSM Geocoding) | Convert lat/lng to human-readable addresses | 1 |
| SMTP (JavaMailSender) | Password reset & welcome emails | 2 |
| AWS S3 / MinIO | File storage at scale | 2 |
| RabbitMQ / Redis Pub/Sub | Multi-instance WebSocket broker | 2 |
| Firebase Cloud Messaging | Push notifications (mobile) | 3 |

---

## 14. Development Phases & Milestones

### Phase 1 — Core MVP

**Goal:** A working application demonstrating all primary flows.

- [ ] Backend project scaffold (Spring Boot, Onion architecture, Flyway)
- [ ] Database schema (V1–V10 migrations)
- [ ] Auth (register, login, JWT, refresh token, logout)
- [ ] User profile (view, edit, avatar upload)
- [ ] Post CRUD (create, read, update, soft-delete, photo upload)
- [ ] Map integration (Leaflet, custom pins, hover card, filter)
- [ ] Post detail page (gallery, author card, contact info, status)
- [ ] Service status lifecycle (REQUESTING → ACCEPTED → DONE)
- [ ] Reviews (create, display on profile)
- [ ] Real-time chat (WebSocket, message persistence, chat list)
- [ ] Search (keyword dropdown, fly-to on map)
- [ ] Routing on map (get directions)
- [ ] Admin panel (user management, post management, reports)
- [ ] Swagger/OpenAPI documentation
- [ ] Docker Compose setup for local development

### Phase 2 — Polish & Scalability

- [ ] Email verification on registration
- [ ] Password reset via email
- [ ] Read receipts in chat
- [ ] Typing indicators in chat
- [ ] Push notifications (browser notifications API)
- [ ] S3 file storage migration
- [ ] Rate limiting (Bucket4j)
- [ ] Pagination and infinite scroll on post lists
- [ ] Full-text search with PostgreSQL `tsvector`
- [ ] Unit and integration test suite (target ≥ 70% coverage)

### Phase 3 — Advanced Features

- [ ] Mobile app (React Native) or PWA
- [ ] Multi-language support (i18n)
- [ ] Payment integration for paid services
- [ ] Premium membership tiers
- [ ] Advanced analytics for admins

---

## 15. Open Questions & Future Enhancements

1. **Moderation Automation:** Should reported content be auto-hidden after a threshold of reports, or always require admin action?
2. **Anonymous Browsing:** Should unauthenticated users be able to view the map and posts, or must they register first?
3. **Category Management:** Should categories be a fixed enum (managed in code) or dynamic (admin-managed in the database)? Recommended: start with a fixed enum, migrate to DB-managed in Phase 2.
4. **Notification System:** Real-time in-app notifications (new message, offer accepted) should use the same WebSocket infrastructure — a separate `/user/queue/notifications` topic.
5. **Geolocation Privacy:** Users' exact home address is never stored. Only the coordinates they pin for a specific post are stored. This should be clearly communicated in the Terms of Service.
6. **Multi-image Chat:** Sending multiple images in a single chat message — defer to Phase 2.
7. **Post Expiry:** Should old posts (e.g., older than 30 days with no activity) auto-archive? Recommended: implement a scheduled Spring `@Scheduled` task.
8. **Service Categories:** Recommended initial set: *Appliance Repair, Plumbing, Electrical, Moving & Transport, Cleaning, Tutoring, Gardening, Pet Care, IT Support, Construction, Other*.

---

*End of System Requirements Document — NeighborHelp v1.0.0*








### Reference Documentation

For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.0.5/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.0.5/maven-plugin/build-image.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/4.0.5/reference/data/sql.html#data.sql.jpa-and-spring-data)
* [Spring Security](https://docs.spring.io/spring-boot/4.0.5/reference/web/spring-security.html)
* [Spring Web](https://docs.spring.io/spring-boot/4.0.5/reference/web/servlet.html)

### Guides

The following guides illustrate how to use some features concretely:

* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
* [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
* [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
* [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)
* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the
parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

