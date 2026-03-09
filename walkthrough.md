# Instagram Clone – Walkthrough

## Overview

Built a production-ready Instagram Clone with **61 source files** across three tiers:

| Tier | Tech | Files |
|------|------|-------|
| Database | MySQL 5.7 | 1 ([schema.sql](file:///home/ubuntu/Documents/HieuNMe/IG-Clone-Agent-Project/schema.sql)) |
| Backend | Java 11 + Spring Boot 2.7 | 46 Java files |
| Frontend | React 18 + Vite + Tailwind | 14 source files |

---

## Project Structure

```
IG-Clone-Agent-Project/
├── schema.sql                          # MySQL schema (8 tables)
├── backend/
│   ├── pom.xml                         # Maven config (Java 11, Spring Boot 2.7.18)
│   └── src/main/
│       ├── resources/application.properties
│       └── java/com/instagram/
│           ├── InstagramCloneApplication.java
│           ├── model/          # 12 files (entities + enums + composite keys)
│           ├── repository/     # 8 files (JPA repositories)
│           ├── dto/            # 15 files (request/response DTOs)
│           ├── security/       # 4 files (JWT + Spring Security)
│           ├── config/         # 2 files (WebSocket + RabbitMQ)
│           ├── service/        # 11 files (business logic + messaging)
│           └── controller/     # 10 files (REST + WebSocket)
└── frontend/
    ├── package.json, vite.config.js, tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── api/axios.js                # Axios + JWT interceptor
        ├── context/                    # AuthContext, WebSocketContext
        ├── pages/                      # Login, Register, Feed, Profile, Direct
        └── components/                 # Navbar, PostCard, StoryTray
```

---

## Key Features Implemented

### Backend
- **JWT Auth** – Login/Register with BCrypt password hashing, stateless token auth
- **Newsfeed** – Paginated feed of posts from followed users + self, sorted by `created_at DESC`
- **Stories** – CRUD with strict `expires_at > NOW()` filtering (auto 24h expiry)
- **Chat (WebSocket)** – STOMP over SockJS at `/ws`, supports 1-on-1 and group chat
- **Notifications (RabbitMQ)** – Like/Comment/Follow events published to exchange, consumed → saved to DB → pushed via WebSocket
- **CORS** – Configured for `localhost:3000` and `localhost:5173`

### Frontend
- **Dark theme** with Instagram-inspired gradient color palette
- **Infinite scroll** feed using `IntersectionObserver`
- **Story tray** with gradient ring avatars
- **Post cards** with double-tap like animation and comment section
- **Real-time chat** with STOMP/SockJS WebSocket client
- **Notification badge** with live updates via WebSocket
- **Search** with autocomplete user lookup

---

## How to Run

### 1. Database
```bash
mysql -u root -p < schema.sql
```

### 2. Backend
```bash
cd backend
# Set environment variables (or use defaults in application.properties)
export DB_USERNAME=root
export DB_PASSWORD=yourpassword
mvn spring-boot:run
# Runs on http://localhost:8080
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login (returns JWT) |
| `/api/auth/register` | POST | Register (returns JWT) |
| `/api/feed?page=0&size=10` | GET | Paginated feed |
| `/api/posts` | POST | Create post |
| `/api/posts/{id}` | GET/DELETE | Get/Delete post |
| `/api/posts/{id}/like` | POST | Toggle like |
| `/api/posts/{id}/comments` | GET/POST | List/Add comments |
| `/api/stories` | GET/POST | Feed stories / Create |
| `/api/users/{username}` | GET | User profile |
| `/api/users/me` | GET/PUT | Current user |
| `/api/users/search?q=` | GET | Search users |
| `/api/users/{id}/follow` | POST | Toggle follow |
| `/api/chat/conversations` | GET | Conversation list |
| `/api/chat/messages/{userId}` | GET | Message history |
| `/api/notifications` | GET | Notifications |
| `/api/notifications/unread-count` | GET | Unread count |
| `/api/notifications/mark-read` | POST | Mark all read |
| `/ws` | WS | WebSocket (STOMP) |

## Verification
- ✅ Backend compiles successfully (`mvn compile`)
- ✅ Frontend builds successfully (`npm run build`)
