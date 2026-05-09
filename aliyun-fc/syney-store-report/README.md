# Syney store report Aliyun FC Web function

Upload this folder as the code package for an Aliyun Function Compute Web
function.

Recommended function settings:

- Runtime: Node.js 20 or Node.js 18
- Startup command: `node server.js`
- Listen port: `9000`
- Request methods: `POST`, `OPTIONS`, `GET`
- Internet access: enabled

Environment variables:

```env
SYNEY_SCM_USERNAME=gy0045
SYNEY_SCM_PASSWORD_MD5=e10adc3949ba59abbe56e057f20f883e
ALLOWED_ORIGIN=https://wumalu.top
SYNEY_SCM_REQUEST_TIMEOUT_MS=15000
```

Request:

```json
{"storeInNo":"K202604270032"}
```

Diagnostic request:

```json
{"diagnose":true}
```
