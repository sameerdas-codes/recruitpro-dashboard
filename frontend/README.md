# RecruitPro frontend

The frontend is a React application built with Vite.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the backend API.
3. Start the Django backend first (see `../backend/README.md`).
4. In a separate terminal, start the frontend from this directory with
   `npm run dev`, then open the URL Vite prints (usually
   `http://localhost:5173`).

The Django backend must be running separately. See `../backend/README.md` for
backend configuration, including the required secret key and local email setup.

## Validation

- `npm run build` creates the production bundle.
- `npm run lint` runs Oxlint.

## Vercel demo deployment

Import this directory as the Vercel project root. The included `vercel.json`
supports client-side routes. Set `VITE_API_BASE_URL` to the deployed Django API
base URL, including `/api`, then redeploy. The API must allow the deployed
frontend origin in `DJANGO_CORS_ALLOWED_ORIGINS`.
