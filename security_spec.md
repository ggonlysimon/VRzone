# VRzone Firestore Security Specification

## 1. Data Invariants
1. **Member Account Ownership & PII Isolation (`/members/{userId}`)**: Every member document belongs to `request.auth.uid`, contains PII (`email`, `phone`), and can only be read or created by the owning verified user or an admin. Users cannot self-activate `membershipStatus: "active"` or alter `membershipFeePkr` away from `1300`.
2. **Booking Identity & Lifecycle (`/bookings/{bookingId}`)**: Every booking must have `userId == request.auth.uid`, start with `status == "pending"`, and enforce `createdAt == request.time`. Non-admin owners can only transition their own `"pending"` booking to `"cancelled"`; `"confirmed"` and `"cancelled"` are terminal states for non-admins.
3. **Closed Days (`/schedule_closures/{dateStr}`)**: Publicly readable so visitors can see studio off-days, but strictly writable only by verified admins.
4. **Strict Keys & Types**: All collections enforce `hasAll` + `hasOnly`, strict type checks, string `.size()` bounds, bounded arrays (`snacks.size() <= 10`), and server timestamps (`request.time`).

## 2. Adversarial "Dirty Dozen" Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated Member Create**: Creating `/members/user1` with `request.auth == null`.
2. **Identity Spoofing on Member Create**: User A (`uid: "userA"`) creating `/members/userB` or setting `uid: "userB"`.
3. **Self-Privilege Escalation on Member Create**: User setting `membershipStatus: "active"` instead of `"pending_payment"`.
4. **Shadow Field Injection on Member Update**: Adding `isAdmin: true` or `isVerified: true` to `/members/userA`.
5. **PII Cross-Read**: User A attempting `get` on `/members/userB`.
6. **Blanket List Scraping on Bookings**: User A issuing `list` query on `/bookings` without filtering `where("userId", "==", "userA")`.
7. **Booking State Shortcutting**: User A creating a booking with `status: "confirmed"` instead of `"pending"`.
8. **Terminal State Mutation**: User A attempting to change a `"confirmed"` or `"cancelled"` booking back to `"pending"`.
9. **Resource Poisoning**: Injecting a 2KB `bookingId` or a 500-character `customerName` or 25-item `snacks` array.
10. **Timestamp Forgery**: Providing a client-side `createdAt` timestamp not equal to `request.time`.
11. **Email Spoofing Admin Bypass**: Token claiming `email: "linksundas981@gmail.com"` with `email_verified: false`.
12. **Unauthorized Closure Write**: Non-admin user attempting to create or delete `/schedule_closures/2026-12-25`.
