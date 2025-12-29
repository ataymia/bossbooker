# Boss Booker Admin Portal - Setup Guide

## Overview

The Boss Booker Admin Portal is a password-protected administrative interface that allows you to manage contact submissions, service requests, and client information. All data is stored locally in the browser's localStorage.

## Accessing the Admin Portal

Navigate to: `https://yourdomain.com/admin.html`

## First-Time Setup

Before you can log in, you need to set your admin credentials:

### Setting Admin Credentials

1. Open the admin portal page (`admin.html`) in your browser
2. Open the browser's Developer Console:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: Enable Developer menu in Preferences, then press `Cmd+Option+C`

3. In the Console tab, type the following command and press Enter:
   ```javascript
   localStorage.setItem('ADMIN_USER', 'yourusername:yourpassword')
   ```
   
   **Example:**
   ```javascript
   localStorage.setItem('ADMIN_USER', 'admin:MySecurePassword123!')
   ```

4. Refresh the page
5. You can now log in with the username and password you just set

### Recommended Credential Format

- **Username**: Use a simple, memorable username (e.g., 'admin', 'bossbooker', your name)
- **Password**: Use a strong password with a mix of letters, numbers, and symbols
- **Format**: Always use the format `username:password` (with a colon separator)

### Security Notes

⚠️ **Important Security Considerations:**

- Credentials are stored in plain text in localStorage
- This setup is suitable for development or low-security internal use
- For production use, consider implementing:
  - Backend authentication with encrypted passwords
  - Session management
  - HTTPS for all connections
  - Rate limiting on login attempts

## Admin Portal Features

### 1. Contact Submissions
- View all contact form submissions from the website
- Accept contacts and automatically add them to the client list
- Delete unwanted submissions
- Export to CSV for backup or external processing

### 2. Service Requests
- View plan submission requests from users who filled out the service request form
- See complete details: company info, selected plan, pricing, contact details
- Accept requests to convert them into active clients
- Export to CSV

### 3. Client List
- Running list of all accepted clients
- Maintains historical data including original submission date
- Shows plan details and monthly value
- Export capability for CRM integration

### 4. Site Content Management
- Placeholder for managing site content
- Update hero text, features, and other content
- Note: Currently stores changes locally; backend integration needed for production

## Data Storage

All data is stored in the browser's localStorage:

- **Contact Submissions**: `bossbooker_contacts`
- **Service Requests**: `bossbooker_requests`
- **Client List**: `bossbooker_clients`
- **Authentication**: `bossbooker_admin_auth`

### Backing Up Data

To export all data:
1. Log into the admin portal
2. Use the "Export CSV" button on each tab
3. Save the CSV files to a secure location

### Clearing Data

To reset all data, open the browser console and run:
```javascript
localStorage.removeItem('bossbooker_contacts');
localStorage.removeItem('bossbooker_requests');
localStorage.removeItem('bossbooker_clients');
```

## Integration with Website

### Contact Form
When visitors submit the contact form on `/contact.html`, their information is automatically saved to localStorage and appears in the admin portal's "Contact Submissions" tab.

### Service Requests
When visitors configure a plan on `/plans.html` and click "Submit Plan for Review", a modal popup collects their information. Upon submission, it's saved to localStorage and appears in the admin portal's "Service Requests" tab.

### Client Conversion
When you click "Accept & Add to Clients" on either a contact submission or service request:
1. The item is marked as "accepted"
2. The contact information is added to the Client List
3. The original submission data is preserved for reference

## Email Configuration

The site uses the following contact email: **help@bossbooker.com**

This email is displayed on:
- Contact page
- Contact form success messages
- Service request confirmations

To change the contact email:
1. Update `/contact.html` where the email is displayed
2. Update success messages in `/contact.js` and `/plans.js`

## Troubleshooting

### Can't Log In
- Make sure you've set the `ADMIN_USER` credential in localStorage
- Check that you're using the correct format: `username:password`
- Verify there are no extra spaces in the credential string
- Try setting it again using the console commands above

### Data Not Appearing
- Check that localStorage is enabled in your browser
- Make sure you're on the same domain as the main site
- Clear browser cache and try again
- Check browser console for JavaScript errors

### Lost Admin Password
If you forget your password:
1. Open browser console
2. Run: `localStorage.removeItem('ADMIN_USER')`
3. Set a new credential using the setup steps above

## Production Deployment

For production use, consider:

1. **Backend Integration**: Implement a proper backend API to store data in a database
2. **Authentication**: Use secure authentication (OAuth, JWT, etc.)
3. **Email Notifications**: Set up email notifications when new submissions arrive
4. **Database**: Move from localStorage to a proper database (PostgreSQL, MongoDB, etc.)
5. **Access Control**: Implement role-based access control for multiple admin users
6. **Audit Logs**: Track all admin actions for security
7. **HTTPS**: Ensure all traffic is encrypted
8. **Backups**: Implement automated database backups

## Support

For questions or issues:
- Email: help@bossbooker.com
- Review the code in `admin.js` for implementation details
- Check browser console for error messages

## Files

- `/admin.html` - Admin portal page structure
- `/admin.css` - Admin portal styling
- `/admin.js` - Admin portal functionality
- `/contact.js` - Contact form integration
- `/plans.js` - Service request integration
