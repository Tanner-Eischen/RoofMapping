# Deployment Guide

## Easiest Path: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications with zero configuration.

### Steps:

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with your Git provider
   - Click "Add New Project"
   - Import your repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables:**
   In Vercel project settings → Environment Variables, add:
   ```
   DATABASE_URL=your_database_url
   REDIS_URL=your_redis_url (optional)
   SQS_QUEUE_URL=your_sqs_url (optional)
   EXTERNAL_API_URL=your_external_api (optional)
   EXTERNAL_API_KEY=your_api_key (optional)
   SENTINEL_HUB_CLIENT_ID=your_client_id (optional)
   SENTINEL_HUB_CLIENT_SECRET=your_secret (optional)
   SENTINEL_HUB_INSTANCE_ID=your_instance_id (optional)
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be live at `your-project.vercel.app`

### Benefits:
- ✅ Zero configuration needed
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push
- ✅ Preview deployments for PRs
- ✅ Free tier available

---

## Alternative: Docker Deployment

If you prefer Docker or need more control:

### Build Docker Image:
```bash
# Create a proper Dockerfile for Next.js
docker build -t roof-mapping .
```

### Run Locally:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=your_db_url \
  -e REDIS_URL=your_redis_url \
  roof-mapping
```

### Deploy to:
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Azure Container Instances**
- **DigitalOcean App Platform**
- **Railway**
- **Render**

---

## Alternative: Traditional VPS

For a traditional server deployment:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "roof-mapping" -- start
   pm2 save
   pm2 startup
   ```

4. **Set up reverse proxy (Nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Environment Variables Checklist

Make sure these are set in your deployment environment:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string

**Optional (for full functionality):**
- `REDIS_URL` - For caching
- `SQS_QUEUE_URL` - For async processing
- `EXTERNAL_API_URL` - External API endpoint
- `EXTERNAL_API_KEY` - External API key
- `SENTINEL_HUB_CLIENT_ID` - For Sentinel-2 imagery
- `SENTINEL_HUB_CLIENT_SECRET` - For Sentinel-2 imagery
- `SENTINEL_HUB_INSTANCE_ID` - For Sentinel-2 imagery

---

## Quick Deploy Commands

### Vercel CLI (Alternative to Web UI):
```bash
npm i -g vercel
vercel
```

### Railway (Another easy option):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render:
1. Connect GitHub repo
2. Select "Web Service"
3. Build command: `npm run build`
4. Start command: `npm start`
5. Add environment variables
6. Deploy!

---

## Recommended: Vercel

For Next.js apps, **Vercel is the easiest and most optimized** deployment option. It's built by the Next.js team and requires zero configuration.

