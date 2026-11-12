# Backend setup

1. Create a virtual environment and install dependencies:
   `python -m venv .venv`, then `.venv\Scripts\python.exe -m pip install -r requirements.txt`.
2. Copy `.env.example` to `.env`.
3. Replace `DJANGO_SECRET_KEY` with a unique secret. Generate one with:
   `python -c "import secrets; print(secrets.token_urlsafe(50))"`.
4. Keep `DJANGO_DEBUG=True` only for local development. Set it to `False` in
   deployed environments and configure the allowed hosts and CORS origins.
   Production defaults enforce HTTPS redirects, HSTS, and secure cookies; serve
   the application behind HTTPS before deployment. The example allows both
   `localhost:5173` and `127.0.0.1:5173`, matching the Vite development server.
5. Run `.venv\Scripts\python.exe manage.py migrate`, then
   `.venv\Scripts\python.exe manage.py runserver`.

During local development, password-reset links are printed to the backend
console. The Contact Support form validates its fields and emails the message
directly to `SUPPORT_EMAIL`; new support submissions are not saved to the
database. The person submitting a request never needs to provide an email
password. Configure SMTP credentials privately on the backend and restart it;
without SMTP credentials the email cannot be delivered.

For Gmail, set `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`,
`EMAIL_USE_TLS=True`, and configure `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`
with the support sender account and its Google App Password. Set
`DEFAULT_FROM_EMAIL` to the sender address and `SUPPORT_EMAIL` to the inbox.
Do not use a regular Gmail password or commit SMTP credentials. Support
requests submitted before email-only handling was restored remain in the
database.

The local `.env`, SQLite database, media uploads, and resume files should not be
committed.

## Free demo deployment

The root `render.yaml` deploys the API to Render. The API is configured to use
Neon PostgreSQL for records and a private Cloudflare R2 bucket for uploaded
resumes and profile images. Render's free filesystem is ephemeral, so the app
intentionally refuses to start in this deployment unless `DATABASE_URL` and
the R2 settings are configured.

Set `DATABASE_URL`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_ENDPOINT_URL`,
`AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` in Render's environment
settings. Use a Cloudflare R2 S3 API token limited to the bucket; the bucket
should remain private. Also set `DJANGO_CORS_ALLOWED_ORIGINS` and
`FRONTEND_BASE_URL` to the deployed frontend origin. Add SMTP settings there
only if support email delivery is required. Never add any of these values to
`.env.example` or commit them.

Free hosting is for demos, not production. Render's API may sleep, and Neon and
R2 have free-tier quotas. Review current limits before storing real candidate
data.
