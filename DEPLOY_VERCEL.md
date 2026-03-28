# Deploy Full System on Vercel

This project deploys as two Vercel projects:

- Frontend (Vite React): root directory `FrontEnd`
- Backend (Express API as serverless): root directory `BackEnd`

## 1. Backend Setup (BackEnd)

### Required environment variables
Use values from `BackEnd/.env.example`:

- `MONGODB_URI`
- `FRONTEND_ORIGIN`
- `PUBLIC_TRACK_BASE_URL` (recommended)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Notes

- File upload is now cloud-based (Cloudinary), not local disk.
- QR images are generated and uploaded to Cloudinary.
- API has health endpoint: `/health`.

### Vercel project settings

- Framework Preset: `Other`
- Root Directory: `BackEnd`
- Build/Output: auto (uses `vercel.json`)

## 2. Frontend Setup (FrontEnd)

### Required environment variables
Use values from `FrontEnd/.env.example`:

- `VITE_API_BASE_URL` = backend Vercel URL

### Vercel project settings

- Framework Preset: `Vite`
- Root Directory: `FrontEnd`
- Build Command: `npm run build`
- Output Directory: `dist`

## 3. Deploy Order

1. Deploy backend first and copy its URL.
2. Set `VITE_API_BASE_URL` in frontend project.
3. Deploy frontend.
4. Verify:
   - `GET <backend_url>/health`
   - Login/register
   - Product create with image upload
   - QR display and track page
   - Admin users/audit endpoints

## 4. Local Development

Backend:

```bash
cd BackEnd
npm install
npm run start:local
```

Frontend:

```bash
cd FrontEnd
npm install
npm run dev
```

