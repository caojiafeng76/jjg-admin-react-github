# Syney store report Aliyun FC Web function

Upload this folder as the code package for an Aliyun Function Compute Web
function.

Recommended function settings:

- Runtime: Node.js 20 or Node.js 18
- Startup command: `node server.js`
- Listen port: `9000`
- Request methods: `POST`, `OPTIONS`, `GET`
- Internet access: enabled

Configure all variables in the Function Compute environment. Never commit real
credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
ALLOWED_ORIGIN=https://your-frontend.example.com
SYNEY_SCM_USERNAME=your_syney_scm_username
SYNEY_SCM_PASSWORD_MD5=your_syney_scm_password_md5
SYNEY_SCM_REQUEST_TIMEOUT_MS=15000
```

Every request except CORS preflight requires a valid Supabase user access token.
The user must have `page:syney-store-report-list`; diagnostic requests require
an active employee account whose role is strictly `admin`.

```http
Authorization: Bearer <supabase-user-access-token>
Content-Type: application/json
```

Request bodies are limited to 16 KiB and identifiers to 64 trimmed characters.

```json
{ "storeInNo": "STORE-IN-NUMBER" }
```

Diagnostic request:

```json
{ "diagnose": true }
```
