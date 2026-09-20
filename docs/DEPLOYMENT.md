# Deploying NeighborHelp

NeighborHelp is two deployable pieces:

| Piece | What it is | Where it goes |
| --- | --- | --- |
| `frontend/` | Vite + React SPA, built to static files | **Vercel** |
| `src/` + `pom.xml` | Spring Boot 4 API (JPA, Flyway, STOMP over WebSocket) | **Not Vercel** — see below |

Vercel serves static files and short-lived serverless functions. It cannot run a
long-lived JVM process, hold JDBC connection pools, or keep the WebSocket
connections the chat feature depends on. The API therefore needs a container
host; the repository already ships a production `Dockerfile` for it.

---

## 1. Deploy the backend first

The frontend build needs the API's public URL, so the API goes up first.

Any host that runs a Docker image works — Render, Railway, Fly.io, Google Cloud
Run, AWS App Runner, or a plain VPS. Point the host at the repository root
`Dockerfile`; it builds the jar and runs it as a non-root user on port 8080.

You also need a **Postgres 16** database. Every managed provider (Render
Postgres, Railway Postgres, Neon, Supabase, RDS) works — the schema is created
on first boot by Flyway.

### Backend environment variables

| Variable | Value | Notes |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | `prod` | Enables the production profile |
| `DATABASE_URL` | `jdbc:postgresql://HOST:5432/DB?sslmode=require` | Must be a **JDBC** URL (see caveat below) |
| `DB_USERNAME` | database user | |
| `DB_PASSWORD` | database password | |
| `JWT_SECRET` | 32+ random characters | Generate with `openssl rand -base64 48` |
| `APP_CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Exact origin, no trailing slash |
| `APP_WEBSOCKET_ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Same value |
| `APP_STORAGE_PROVIDER` | `cloudinary` | See [Image storage](#image-storage). `local` needs a persistent volume |
| `CLOUDINARY_CLOUD_NAME` | your cloud name | Required when the provider is `cloudinary` |
| `CLOUDINARY_API_KEY` | your API key | Required when the provider is `cloudinary` |
| `CLOUDINARY_API_SECRET` | your API secret | Required when the provider is `cloudinary` |
| `APP_UPLOAD_DIR` | `/var/neighborhelp/uploads` | Only for `APP_STORAGE_PROVIDER=local`; mount a persistent volume |
| `OPENROUTESERVICE_API_KEY` | your key | Optional; only used for routing |
| `SERVER_PORT` | provider's port | Only if the host does not use 8080 |

> **JDBC URL caveat.** Many providers expose `DATABASE_URL` in libpq form
> (`postgres://user:pass@host/db`). Spring cannot parse that. Convert it to
> `jdbc:postgresql://host:5432/db?sslmode=require` and move the user and
> password into `DB_USERNAME` / `DB_PASSWORD`, or set the discrete
> `DB_HOST` / `DB_PORT` / `DB_NAME` variables instead and leave `DATABASE_URL`
> unset.

The `prod` profile defaults the refresh-token cookie to `SameSite=None; Secure`,
which is what lets the browser send it from the Vercel origin back to the API.
`APP_REFRESH_COOKIE_SECURE` and `APP_REFRESH_COOKIE_SAME_SITE` can override this
if you later put both behind one domain.

Confirm the API is up before moving on:

```bash
curl -i https://your-api-host/api/posts     # expect HTTP 200 and a JSON array
```

---

## 2. Deploy the frontend to Vercel

### Import the project

1. In Vercel, **Add New… → Project**, import `Polclard/NeighborHelp`.
2. **Set Root Directory to `frontend`.** This is the step people miss — the
   repository root is a Maven project and Vercel's autodetection will fail there.
3. Framework Preset should read **Vite**. Build command, output directory and
   install command already come from `frontend/vercel.json`.

### Frontend environment variables

Under **Settings → Environment Variables**, add both for
Production, Preview and Development:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://your-api-host` |
| `VITE_WS_BASE_URL` | `https://your-api-host` |

No trailing slash. Vite inlines these **at build time**, so after changing them
you must redeploy for the new value to reach the browser.

### Deploy

Push to the branch Vercel tracks, or hit **Deploy**. Vercel runs `npm ci` then
`npm run build` and serves `dist/`.

---

## 3. Close the loop

The two sides reference each other, so one value has to be filled in after the
first deploy:

1. Copy the assigned Vercel domain (`https://your-app.vercel.app`).
2. Set it as `APP_CORS_ALLOWED_ORIGINS` and `APP_WEBSOCKET_ALLOWED_ORIGINS` on
   the backend, then restart the backend.
3. Open the site, register an account, and reload the page. If you stay logged
   in, the cross-site refresh cookie is working.

### Preview deployments

Every Vercel preview gets its own generated subdomain, and the backend rejects
origins it does not know. Either add the preview origins to
`APP_CORS_ALLOWED_ORIGINS` (it accepts a comma-separated list), or point a
stable staging domain at the preview and allow only that.

---

## Image storage

`app.storage.provider` selects where avatars and post photos go.

| Provider | Behaviour |
| --- | --- |
| `local` (default) | Writes to `app.upload.dir` and serves the files from `/uploads/**`. Fine for development. On a host without a persistent volume **every redeploy deletes all uploads**. |
| `cloudinary` | Uploads to Cloudinary and stores the returned delivery URL. Survives redeploys and serves the images over Cloudinary's CDN. |

Use `cloudinary` in production unless you have a real persistent volume.

### Setting up Cloudinary

1. Create a free account at <https://cloudinary.com/users/register_free>.
2. Copy **Cloud Name**, **API Key** and **API Secret** from the dashboard.
3. Set them on the backend host:

   ```
   APP_STORAGE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=your-api-secret
   ```

   The secret is server-side only — the browser never sees it, because uploads
   go through the existing authenticated endpoints rather than direct from the
   client.

`CLOUDINARY_FOLDER` (default `neighborhelp`) prefixes every stored asset, so one
Cloudinary account can host several environments without them colliding.

### Image sizes

The backend stores one untransformed URL per image. The frontend appends a
Cloudinary transformation matching the size the component actually renders —
see `avatarTransform` / `galleryTransform` / `chatImageTransform` in
`frontend/src/utils/buildUploadUrl.js`. Those helpers are no-ops for
non-Cloudinary URLs, so the `local` provider keeps working unchanged.

Keep the size list short. Cloudinary's free tier counts each distinct
transformation once when it is first generated, so a fixed set of sizes costs a
bounded number of transformations no matter how much traffic the images get.

### Switching providers

The two providers are mutually exclusive and are chosen at startup by
`@ConditionalOnProperty`. Switching does not rewrite existing rows: values
already stored under one provider will not resolve under the other. There is no
backfill, so switch before the app has uploads worth keeping.

---

## What is deliberately not solved here

- **Chat message images are not uploaded.** `SendMessageRequest.imageUrl` takes
  an arbitrary client-supplied URL rather than a file, so those images are not
  stored by the app at all. Unlike avatars and post photos, they never reach
  `FileStorageService`.
- **Migration `V10` seeds an admin account** (`admin@neighborhelp.local`) with a
  password hash committed to the repository. Change that password immediately
  after the first deploy, or the account is public.
- **Email is configured but unused.** `app.mail.*` points at Mailpit for local
  development; no production SMTP is wired up because nothing sends mail yet.
- **Swagger is disabled in `prod`** (`springdoc.*.enabled: false`). Re-enable it
  only behind authentication.

---

## Local development is unchanged

```bash
cp .env.example .env
docker compose up --build
```

Frontend on <http://localhost:3000>, API on <http://localhost:8080>, Mailpit UI
on <http://localhost:8025>.
