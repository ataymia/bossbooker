# Cloudflare Workers KV Setup Guide for Boss Booker

This guide will walk you through setting up Cloudflare Workers KV storage for the Boss Booker admin portal, replacing the localStorage implementation with a secure, cloud-based solution.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Step 1: Create Cloudflare Account](#step-1-create-cloudflare-account)
- [Step 2: Install Wrangler CLI](#step-2-install-wrangler-cli)
- [Step 3: Create KV Namespace](#step-3-create-kv-namespace)
- [Step 4: Configure Worker](#step-4-configure-worker)
- [Step 5: Set Admin Password Secret](#step-5-set-admin-password-secret)
- [Step 6: Deploy Worker](#step-6-deploy-worker)
- [Step 7: Update Frontend Configuration](#step-7-update-frontend-configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- A Cloudflare account (free tier is sufficient)
- Node.js 16+ installed on your machine
- npm or yarn package manager
- Basic command line knowledge

## Step 1: Create Cloudflare Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/sign-up)
2. Sign up for a free account
3. Verify your email address
4. Once logged in, you'll see your Cloudflare dashboard

## Step 2: Install Wrangler CLI

Wrangler is Cloudflare's official CLI tool for managing Workers.

### Installation

```bash
npm install -g wrangler

# Or using yarn
yarn global add wrangler
```

### Verify Installation

```bash
wrangler --version
```

### Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate. Click "Allow" to grant access.

## Step 3: Create KV Namespace

KV (Key-Value) namespaces are where your data will be stored.

### Create the Namespace

```bash
cd worker
wrangler kv:namespace create "BOSSBOOKER_KV"
```

This command will output something like:

```
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "BOSSBOOKER_KV", id = "abc123def456..." }
```

### Update wrangler.toml

Copy the namespace ID from the output and update `worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "BOSSBOOKER_KV"
id = "YOUR_ACTUAL_KV_NAMESPACE_ID_HERE"  # Replace with the ID from the command output
```

### Create Preview Namespace (Optional, for Development)

```bash
wrangler kv:namespace create "BOSSBOOKER_KV" --preview
```

Update `wrangler.toml` with the preview ID:

```toml
[[kv_namespaces]]
binding = "BOSSBOOKER_KV"
id = "abc123def456..."
preview_id = "xyz789ghi012..."  # Add this line with your preview namespace ID
```

## Step 4: Configure Worker

The worker configuration is already set up in `worker/wrangler.toml`. Review and customize if needed:

```toml
name = "bossbooker-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "BOSSBOOKER_KV"
id = "YOUR_KV_NAMESPACE_ID"  # Update this with your namespace ID

[vars]
CORS_ORIGIN = "*"  # Change to your domain in production (e.g., "https://yourdomain.com")
```

## Step 5: Set Admin Password Secret

Secrets are encrypted environment variables that are not visible in your code or configuration files.

### Set the Admin Password

```bash
cd worker
wrangler secret put ADMIN_PASSWORD
```

When prompted, enter a strong password for your admin portal. This password will be used to authenticate admin API requests.

**Important Security Notes:**
- Choose a strong, unique password
- Never commit this password to version control
- The password is encrypted and stored securely by Cloudflare
- You cannot retrieve the password after setting it (you can only overwrite it)

### Verify Secret is Set

```bash
wrangler secret list
```

You should see `ADMIN_PASSWORD` in the list.

## Step 6: Deploy Worker

### Test Locally First (Optional)

```bash
cd worker
npm install  # or yarn install
wrangler dev
```

This starts a local development server. You can test API endpoints at `http://localhost:8787`

### Deploy to Cloudflare

```bash
cd worker
wrangler deploy
```

After deployment, you'll see output like:

```
✨ Success! Uploaded bossbooker-api
  https://bossbooker-api.YOUR-SUBDOMAIN.workers.dev
```

**Save this URL!** You'll need it for the frontend configuration.

### Get Your Worker URL

If you need to find your worker URL later:

```bash
wrangler deployments list
```

Or check the Cloudflare dashboard:
1. Go to [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers)
2. Click on your worker (`bossbooker-api`)
3. The URL is shown at the top

## Step 7: Update Frontend Configuration

Now that your worker is deployed, you need to update the frontend to use it.

### Create API Configuration File

Create a new file `api-config.js` in the root directory of your project:

```javascript
// api-config.js
const API_CONFIG = {
  // Replace with your actual worker URL from Step 6
  WORKER_URL: 'https://bossbooker-api.YOUR-SUBDOMAIN.workers.dev',
  
  // API endpoints
  ENDPOINTS: {
    CONTACT: '/api/contact',
    REQUEST: '/api/request',
    ADMIN_AUTH: '/api/admin/auth',
    ADMIN_CONTACTS: '/api/admin/contacts',
    ADMIN_REQUESTS: '/api/admin/requests',
    ADMIN_CLIENTS: '/api/admin/clients',
  }
};
```

### Update HTML Files

Add this script tag to the `<head>` section of:
- `admin.html`
- `contact.html`
- `plans.html`

```html
<script src="/api-config.js"></script>
```

### Verify Contact Form Integration

The updated `contact.js` should now send data to your worker:

```javascript
// This is already implemented in the updated contact.js
fetch(`${API_CONFIG.WORKER_URL}/api/contact`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(contactData)
})
```

### Verify Plans Form Integration

The updated `plans.js` should send data to your worker:

```javascript
// This is already implemented in the updated plans.js
fetch(`${API_CONFIG.WORKER_URL}/api/request`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData)
})
```

### Verify Admin Portal Integration

The updated `admin.js` should authenticate and fetch data from your worker.

## Testing

### Test Contact Form

1. Open your website in a browser
2. Navigate to the Contact page
3. Fill out the contact form and submit
4. You should see a success message

### Test Plans Submission

1. Navigate to the Plans page
2. Select a plan and click "Submit Plan for Review"
3. Fill out the modal form and submit
4. You should see a success message

### Test Admin Portal

1. Navigate to `admin.html`
2. Enter the password you set in Step 5
3. You should be able to log in and see submitted contacts and requests

### Verify Data in KV

Check your data is being stored:

```bash
cd worker

# List all keys
wrangler kv:key list --namespace-id=YOUR_KV_NAMESPACE_ID

# Get a specific value
wrangler kv:key get "index:contacts" --namespace-id=YOUR_KV_NAMESPACE_ID
```

## Monitoring and Management

### View Worker Logs

```bash
cd worker
wrangler tail
```

This shows real-time logs from your worker, useful for debugging.

### View KV Data

To see what's stored in your KV namespace:

```bash
# List all keys
wrangler kv:key list --namespace-id=YOUR_KV_NAMESPACE_ID

# Get a specific key's value
wrangler kv:key get "contact:contact_1234567890" --namespace-id=YOUR_KV_NAMESPACE_ID
```

### Update Admin Password

If you need to change the admin password:

```bash
cd worker
wrangler secret put ADMIN_PASSWORD
```

Enter the new password when prompted, then redeploy:

```bash
wrangler deploy
```

## Troubleshooting

### Issue: "Error: No namespace with ID..."

**Solution:** Make sure you've updated the namespace ID in `wrangler.toml` with the actual ID from Step 3.

### Issue: "Unauthorized" when accessing admin portal

**Solution:** 
1. Verify the admin password secret is set: `wrangler secret list`
2. Make sure you're using the correct password
3. Check browser console for error messages
4. Verify the worker is deployed: `wrangler deployments list`

### Issue: CORS errors in browser console

**Solution:** 
1. Check that the worker URL is correct in `api-config.js`
2. Verify CORS headers are being sent (check Network tab in browser DevTools)
3. Make sure you're using HTTPS if your site is on HTTPS

### Issue: Forms not submitting

**Solution:**
1. Check browser console for errors
2. Verify `api-config.js` is loaded (check Network tab)
3. Check that the worker URL is correct
4. View worker logs: `wrangler tail`

### Issue: Data not appearing in admin portal

**Solution:**
1. Check that authentication is working
2. Verify data was saved (use `wrangler kv:key list`)
3. Check worker logs for errors
4. Make sure the Bearer token is being sent in API requests

### Issue: Worker deployment fails

**Solution:**
1. Run `wrangler whoami` to verify you're logged in
2. Check that your Cloudflare account is active
3. Verify `wrangler.toml` syntax is correct
4. Try `wrangler logout` then `wrangler login` again

## Production Checklist

Before going live, make sure you:

- [ ] Updated `CORS_ORIGIN` in `wrangler.toml` to your actual domain
- [ ] Set a strong admin password using `wrangler secret put ADMIN_PASSWORD`
- [ ] Updated `API_CONFIG.WORKER_URL` in `api-config.js` with your actual worker URL
- [ ] Tested contact form submission
- [ ] Tested service request submission
- [ ] Tested admin portal login and data viewing
- [ ] Verified data is being stored in KV (use `wrangler kv:key list`)
- [ ] Set up monitoring (view logs with `wrangler tail`)
- [ ] Added your custom domain to the worker (optional, via Cloudflare dashboard)

## Security Best Practices

1. **Use HTTPS Only:** Ensure your website uses HTTPS in production
2. **Restrict CORS:** Update `CORS_ORIGIN` to your specific domain (not `*`)
3. **Strong Password:** Use a strong, unique admin password
4. **Regular Monitoring:** Check worker logs regularly for suspicious activity
5. **Backup Data:** Periodically export data from KV using the wrangler CLI
6. **Rate Limiting:** Consider adding rate limiting to prevent abuse (advanced)

## Cost Considerations

Cloudflare Workers free tier includes:
- 100,000 requests per day
- 1GB KV storage
- 1,000 KV writes per day
- 100,000 KV reads per day

For most small to medium businesses, the free tier is sufficient. Monitor usage in the Cloudflare dashboard.

## Support

If you encounter issues:
1. Check the [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
2. Visit the [Cloudflare Community](https://community.cloudflare.com/)
3. Check worker logs: `wrangler tail`
4. Review this guide's troubleshooting section

## Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Workers KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Examples](https://developers.cloudflare.com/workers/examples/)

---

**Last Updated:** January 2025

For questions or issues specific to Boss Booker, contact: bossbookerinfo@gmail.com
