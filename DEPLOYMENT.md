# Deployment Guide

This guide covers deploying GPTees to production.

## Backend Deployment (Heroku)

### 1. Prerequisites
- Heroku CLI installed
- Heroku account
- Production database (Supabase recommended)

### 2. Prepare for Deployment
```bash
cd backend
```

### 3. Create Heroku App
```bash
heroku create 2026gptees-api
```

### 4. Configure Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL="your-production-database-url"
heroku config:set CLERK_SECRET_KEY="your-clerk-key"
heroku config:set STRIPE_SECRET_KEY="your-stripe-key"
heroku config:set STRIPE_WEBHOOK_SECRET="your-webhook-secret"
heroku config:set OPENAI_API_KEY="your-openai-key"
heroku config:set AWS_ACCESS_KEY_ID="your-aws-key"
heroku config:set AWS_SECRET_ACCESS_KEY="your-aws-secret"
heroku config:set AWS_S3_BUCKET="your-bucket-name"
heroku config:set PRINTFUL_API_KEY="your-printful-key"
heroku config:set RESEND_API_KEY="your-resend-key"
heroku config:set FRONTEND_URL="https://your-frontend-domain.com"
```

### 5. Deploy
```bash
git push heroku main
```

### 6. Run Migrations
```bash
heroku run npx prisma migrate deploy
```

### 7. Configure Webhooks
- **Stripe**: Set webhook URL to `https://your-api.herokuapp.com/api/webhooks/stripe`
- **Clerk**: Set webhook URL to `https://your-api.herokuapp.com/api/webhooks/clerk`
- **Printful**: Set webhook URL to `https://your-api.herokuapp.com/api/webhooks/printful`

## Frontend Deployment (Vercel)

### 1. Prerequisites
- Vercel CLI or GitHub integration
- Vercel account

### 2. Prepare for Deployment
```bash
cd frontend
```

### 3. Configure Environment Variables
In Vercel dashboard or via CLI:
```bash
vercel env add VITE_API_URL production
# Enter: https://your-api.herokuapp.com

vercel env add VITE_CLERK_PUBLISHABLE_KEY production
# Enter: your-clerk-publishable-key
```

### 4. Deploy
```bash
vercel --prod
```

Or connect GitHub repository in Vercel dashboard for automatic deployments.

## Post-Deployment Checklist

- [ ] Test user registration and authentication
- [ ] Test product browsing and cart
- [ ] Test Stripe checkout (use test mode first)
- [ ] Test AI design generation
- [ ] Test email notifications
- [ ] Test order fulfillment webhook
- [ ] Verify all environment variables
- [ ] Check error logging and monitoring
- [ ] Test on mobile devices
- [ ] Enable HTTPS (should be automatic)
- [ ] Configure custom domain (optional)

## Monitoring

### Recommended Tools
- **Heroku Logs**: `heroku logs --tail`
- **Sentry**: Error tracking (optional)
- **LogRocket**: Session replay (optional)
- **Uptime Robot**: Uptime monitoring

### Health Check
Backend provides health check endpoint:
```
GET https://your-api.herokuapp.com/api/health
```

## Troubleshooting

### Backend Issues
- Check Heroku logs: `heroku logs --tail`
- Verify environment variables: `heroku config`
- Check database connection
- Verify webhook signatures

### Frontend Issues
- Check Vercel deployment logs
- Verify environment variables in Vercel dashboard
- Check browser console for errors
- Verify API URL is correct

## Scaling

### Backend
```bash
# Scale dynos
heroku ps:scale web=2

# Enable autoscaling
heroku autoscale:enable web --min 1 --max 4
```

### Database
- Upgrade Supabase plan as needed
- Consider connection pooling
- Monitor query performance

## Backup

### Database Backups
```bash
# Heroku Postgres (if using)
heroku pg:backups:capture
heroku pg:backups:download

# Supabase (automatic backups included)
```

### S3 Backups
Enable S3 versioning and lifecycle policies.

## Security

- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Use strong webhook secrets
- [ ] Rotate API keys regularly
- [ ] Enable rate limiting
- [ ] Configure CSP headers
- [ ] Enable Heroku SSL
- [ ] Monitor failed login attempts

## Cost Optimization

- Use Heroku eco dynos for development
- Scale down during low traffic
- Optimize S3 storage with lifecycle policies
- Monitor OpenAI API usage
- Use Printful test mode during development

---

For issues, see [Support](README.md#support)
