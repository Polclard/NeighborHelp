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
| `CLOUDINARY_URL` | `cloudinary://key:secret@cloud` | The one value from the Cloudinary dashboard; selects Cloudinary automatically |
| `CLOUDINARY_CLOUD_NAME` | your cloud name | Alternative to `CLOUDINARY_URL`; set all three |
| `CLOUDINARY_API_KEY` | your API key | |
| `CLOUDINARY_API_SECRET` | your API secret | |
| `APP_STORAGE_PROVIDER` | *(leave unset)* | Only to force `local` or `cloudinary`; see [Image storage](#image-storage) |
| `APP_UPLOAD_DIR` | `/var/neighborhelp/uploads` | Only when storage resolves to local; mount a persistent volume |
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

`app.storage.provider` selects where avatars and post photos go. **You normally
do not set it** — supplying the Cloudinary credentials is enough.

| Provider | Behaviour |
| --- | --- |
| `local` (default) | Writes to `app.upload.dir` and serves the files from `/uploads/**`. Fine for development. On a host without a persistent volume **every redeploy deletes all uploads**. |
| `cloudinary` | Uploads to Cloudinary and stores the returned delivery URL. Survives redeploys and serves the images over Cloudinary's CDN. |

Use `cloudinary` in production unless you have a real persistent volume.

### Setting up Cloudinary

1. Create a free account at <https://cloudinary.com/users/register_free>.
2. Copy the **API environment variable** from the dashboard — one line of the
   form `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`.
3. Set it on the backend host:

   ```
   CLOUDINARY_URL=cloudinary://123456789012345:your-api-secret@your-cloud-name
   ```

   Or, if you prefer the three values separately:

   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=your-api-secret
   ```

   That is all. `APP_STORAGE_PROVIDER` does not need to be set: when the
   credentials are present Cloudinary is selected automatically.

   The secret is server-side only — the browser never sees it, because uploads
   go through the existing authenticated endpoints rather than direct from the
   client.

> **Put the URL in `CLOUDINARY_URL`, not in `APP_STORAGE_PROVIDER`.** The
> dashboard offers the credential as a ready-to-paste `NAME=value` line, and a
> host's "add environment variable" form wants the two halves in separate
> boxes. Pasting the whole line into the value of `APP_STORAGE_PROVIDER` makes
> the credential the provider name, and the application refuses to start with
> `Unknown app.storage.provider`. If that has already happened, fix the variable
> **and rotate the API secret** in the Cloudinary console: the failed startup
> wrote it to the deploy log.

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

### How the provider is chosen

Resolved once at startup; exactly one implementation is always created.

| `APP_STORAGE_PROVIDER` | Cloudinary credentials | Result |
| --- | --- | --- |
| unset or blank | all three present | `cloudinary` |
| unset or blank | missing or partial | `local` |
| `cloudinary` | all three present | `cloudinary` |
| `cloudinary` | missing | startup fails, naming the variable |
| `local` | either | `local` (explicit override wins) |
| anything else | either | startup fails, listing valid values |

Matching is case-insensitive and surrounding whitespace is ignored.

The startup log always states the choice, so the running configuration is
visible without opening a dashboard:

```
Image storage: Cloudinary (cloud 'your-cloud-name', folder 'neighborhelp')
```

If it resolved to local, the log carries a warning instead:

```
WARN  Image storage: local disk at './var/uploads'. Uploads do NOT survive a
      redeploy unless this is a persistent volume. Set CLOUDINARY_CLOUD_NAME /
      CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET to store images in Cloudinary
      instead.
```

Two misconfigurations fail fast at startup with a message naming the fix:

- an unrecognised provider — `Unknown app.storage.provider 's3'. Expected one
  of: local, cloudinary`
- `cloudinary` selected with a credential missing — `CLOUDINARY_CLOUD_NAME must
  be set when app.storage.provider=cloudinary`

Switching does not rewrite existing rows: values already stored under one
provider will not resolve under the other. There is no backfill, so switch
before the app has uploads worth keeping.

---

## Moving the database to Neon

Render's free Postgres expires 30 days after it is created. Neon's free tier
does not expire, so it is the better long-term home. The application needs no
code changes: only the three database variables on the backend change.

### 1. Create the Neon project

1. Sign up at <https://neon.tech> and create a project.
2. **Postgres version:** choose the same major version as the Render database
   (shown on the Render database's *Info* page), or a newer one.
3. **Region:** choose the one nearest the backend host (for example, AWS
   Frankfurt `eu-central-1` for a Render service in Frankfurt). Every query
   crosses this link.
4. On the project dashboard, open **Connect**, **turn "Connection pooling"
   off**, and copy the connection string. It looks like:

   ```
   postgresql://neondb_owner:PASSWORD@ep-xxx-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

   Use the **direct** host (no `-pooler` in the name) both for the import and
   for the app. The app already pools connections through Hikari. Flyway also
   takes a session-level lock that PgBouncer's transaction mode does not
   support.

### 2. Copy the data from Render

Do this **before** pointing the backend at Neon. If the app boots against the
empty Neon database first, Flyway creates the tables and the restore conflicts
with them.

Take the **External Database URL** from the Render database's *Connect* menu.
Both commands run the Postgres tools in Docker, so nothing has to be installed
locally. Replace `16` with the Render database's major version.

```bash
# Dump from Render into ./neighborhelp.dump
docker run --rm -v "$PWD:/backup" postgres:16-alpine \
  pg_dump "RENDER_EXTERNAL_DATABASE_URL" \
  --format=custom --no-owner --no-privileges --file=/backup/neighborhelp.dump

# Restore into Neon (direct connection string from step 1)
docker run --rm -v "$PWD:/backup" postgres:16-alpine \
  pg_restore --dbname="NEON_CONNECTION_STRING" \
  --no-owner --no-privileges /backup/neighborhelp.dump
```

`--no-owner --no-privileges` are needed because the Render role
(`neighborhelp_user` or similar) does not exist on Neon. All objects end up
owned by `neondb_owner`. The dump includes `flyway_schema_history`, so Flyway
sees every migration as already applied and does not run them again.

To start over after a failed restore, reset the Neon database and run the
restore again:

```bash
docker run --rm postgres:16-alpine psql "NEON_CONNECTION_STRING" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

Check that the row counts match on both sides:

```bash
for url in "RENDER_EXTERNAL_DATABASE_URL" "NEON_CONNECTION_STRING"; do
  docker run --rm postgres:16-alpine psql "$url" -At -c \
    "SELECT (SELECT count(*) FROM users) AS users,
            (SELECT count(*) FROM service_posts) AS posts,
            (SELECT count(*) FROM messages) AS messages,
            (SELECT max(version) FROM flyway_schema_history) AS flyway;"
done
```

The dump holds password hashes and refresh tokens. Delete `neighborhelp.dump`
once the migration is done, and never commit it.

### 3. Point the backend at Neon

Split the Neon connection string into the three variables Spring reads. Put
`jdbc:` in front, remove the user and password, and drop
`channel_binding=require`:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://ep-xxx-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require` |
| `DB_USERNAME` | `neondb_owner` |
| `DB_PASSWORD` | the password from the connection string |

Save the variables and let the backend redeploy. The startup log should show
Flyway reporting `Schema "public" is up to date. No migration necessary.` Log in
with an existing account to confirm the old data is there. After that, the
Render database can be deleted.

### Things to know about Neon's free tier

- **The compute suspends after ~5 minutes idle.** The first query after that
  wakes it, which takes roughly half a second. Hikari discards the dead
  connections and opens new ones on its own. Do not add a keep-alive ping: an
  always-on compute uses up the free monthly compute hours.
- **0.5 GB storage per project.** Images are stored in Cloudinary, so the
  database only holds rows and this is plenty for now.
- Point-in-time restore on the free tier covers only a short window. For real
  backups, run the `pg_dump` command above against Neon now and then.

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
