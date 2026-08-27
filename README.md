# Toolshed â€” authentication flow

Task 04 of the Neurofive Solutions Full Stack Web Development internship:
*Authentication flow (signup, login, protected pages).*

```
04-auth-flow/
â”œâ”€â”€ server/   Express + SQLite + bcryptjs + jsonwebtoken
â””â”€â”€ client/   React 19 + React Router 7
```

---

## The decision the brief is really testing

"Store the token securely on the frontend" is where most implementations quietly
do the wrong thing: put a JWT in `localStorage` and move on. **Any XSS on the
page can read `localStorage`**, and one stolen long-lived JWT cannot be revoked
before it expires.

So I split the token in two:

| | Access token | Refresh token |
|---|---|---|
| **Lives** | a module-scope variable in `client/src/auth/api.js` | httpOnly cookie |
| **Readable by JS** | only by my own module â€” never written to any storage API | no, not by anything |
| **Lifetime** | 15 minutes | 7 days |
| **Sent** | `Authorization: Bearer` on protected calls | automatically, and only to `/api/auth` (cookie `path`) |
| **Revocable** | no, but it expires in 15 min | **yes** â€” stored as a SHA-256 hash in `refresh_tokens`, revoked on logout |

The consequences, which are the point:

- **XSS cannot steal the session.** It could use the access token while the page
  is open, but it cannot exfiltrate a durable credential.
- **Refresh tokens rotate.** Every `/refresh` revokes the token it just used and
  issues a new one, so a captured token is single-use.
- **Logout genuinely ends the session** server-side, not just client-side.
- **A database leak is not a session leak** â€” the table holds hashes, not tokens.
- **Reload does not sign you out.** On boot the app calls `/refresh` once; the
  cookie proves who you are and a fresh access token comes back.

The cost: a silent-refresh round trip on every page load, and `sameSite: 'none'`
plus `credentials: 'include'` when the API is on a different origin. Worth it.

## Flow

```
signup / login â”€â”€â–¶ 201/200 { user, accessToken }  + Set-Cookie: toolshed_rt (httpOnly)
                          â”‚
                   access token â†’ memory only
                          â”‚
GET /api/loans  â”€â”€â–¶ Authorization: Bearer â€¦
                          â”‚
                   401 "expired"?
                          â”‚
                   POST /api/auth/refresh (cookie) â”€â”€â–¶ new access token, cookie rotated
                          â”‚                                    â”‚
                   replay original request              refresh fails â†’ clear + /login
                          â”‚
logout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ revoke row, clear cookie, drop in-memory token
```

Concurrent 401s share one in-flight refresh promise, so five parallel requests
do not fire five refreshes.

## Protected routes

`ProtectedRoute` has **three** states, and the middle one is the bug everyone
ships:

```jsx
if (status === 'booting')        return <Checking sessionâ€¦ />   // â† not signed out yet
if (status !== 'authenticated')  return <Navigate to="/login" state={{ from }} />
if (role && user.role !== role)  return <Navigate to="/dashboard" />
return <Outlet />
```

Without the `booting` branch, every hard reload flashes the login page before
the silent refresh lands. `state.from` is what lets login return you to the page
you originally asked for.

| Route | Access |
|---|---|
| `/`, `/login`, `/signup` | public |
| `/dashboard` | any signed-in user |
| `/keeper` | `role === 'keeper'` only |

**The client guard is convenience, not security.** `/api/loans` runs
`requireAuth` and `/api/loans/all` runs `requireRole('keeper')` independently â€”
deleting the client guard in devtools gets you a blank page and a 403.

## Password handling

- **bcrypt, cost 12** (~250 ms). Slow on purpose.
- **Length first**: minimum 10 characters, one letter, one number. No forced
  symbol-and-uppercase rule, because those push people toward `Passw0rd!` rather
  than toward length. A small leaked-password list is rejected outright.
- **Same rules on both ends** â€” `client/src/auth/rules.js` mirrors
  `server/src/lib/validate.js`, and server field errors overwrite client ones in
  the same error object, so both render in the same place.
- **Login is timing-safe about which emails exist**: a missing account is still
  compared against a dummy hash, so response time does not leak membership.
- Wrong email and wrong password give the *same* message.
- 20 auth requests per IP per minute â†’ **429**.

## Run it

```bash
cd server
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # Ã—2, paste into .env
npm install && npm run dev        # :4000

cd ../client
npm install && npm run dev        # :5173
```

`SLOW_MODE=1 npm run dev` on the server makes every button spinner visible.

To make yourself a keeper and see the role gate:
```bash
cd server && node -e "
const D=require('better-sqlite3'); const d=new D('./data/auth.db');
d.prepare(\"UPDATE users SET role='keeper' WHERE email=?\").run('you@example.com');
console.log('done â€” sign out and back in');"
```

## Verification

Run against a live server:

| Case | Result |
|---|---|
| signup, 3 bad fields | **400** with all three messages |
| signup valid | **201**, access token returned, `HttpOnly` cookie set |
| duplicate email (different case) | **409** |
| `/loans` with no token | **401** "Missing access token." |
| `/loans` with token | **200** |
| `/loans/all` as a member | **403** naming the required role |
| login, wrong password | **401**, same message as unknown email |
| login, correct | **200** |
| `/refresh` with cookie | **200**, new token |
| **replay the same refresh token** | **401** â€” it was rotated |
| after logout, replay | **401** |
| tampered token | **401** |
| 25 rapid logins | **429** |
| stored password hash | `$2a$12$â€¦` â€” bcrypt, cost 12 |
| stored refresh tokens | SHA-256 hex, not raw JWTs |

Client builds clean at 78 KB gzipped.

## Deploy

API on Render/Railway with `NODE_ENV=production` (turns on `secure` cookies and
`sameSite: 'none'`), real secrets, `CORS_ORIGIN` set to the client origin, and a
mounted disk for `DATABASE_PATH`. Client on Netlify/Vercel with `VITE_API_URL`
and an SPA rewrite. **Both must be HTTPS** or the cookie will not be set.

