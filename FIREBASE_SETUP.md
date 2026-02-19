# Firebase Setup Guide

This guide will help you set up Firebase Authentication and Firestore Database for Poe's Menu Planner.

## Overview

The application uses **Firebase** from Google Cloud Platform to provide:
- **Firebase Authentication**: Secure user authentication and session management
- **Firestore Database**: Cloud storage for recipes, enabling cross-browser/device sync

Firebase handles all the complexity of user management, password security, session management, and cloud data storage.

## Prerequisites

- A Google account
- Node.js installed (v16 or higher)
- The application cloned and dependencies installed

## Step-by-Step Setup

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** (or select an existing project)
3. Enter a project name (e.g., "Poes Menu Planner")
4. Choose whether to enable Google Analytics (optional)
5. Click **"Create project"**

### 2. Enable Email/Password Authentication

1. In your Firebase project dashboard, click on **"Authentication"** in the left sidebar
2. Click on the **"Get started"** button (if this is your first time)
3. Navigate to the **"Sign-in method"** tab
4. Find **"Email/Password"** in the list of providers
5. Click on it to open the configuration
6. Toggle the **"Enable"** switch to ON
7. Click **"Save"**

### 3. Enable Firestore Database

1. In your Firebase project dashboard, click on **"Firestore Database"** in the left sidebar
2. Click on **"Create database"** button
3. Choose a security mode:
   - **Production mode**: Start with secure rules (recommended)
   - **Test mode**: Allow all reads/writes for 30 days (easier for development)
4. Click **"Next"**
5. Select a location for your database (choose one close to your users)
6. Click **"Enable"**

### 4. Set Up Firestore Security Rules

For production use, set up security rules to protect user data:

1. In Firestore Database, go to the **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write only their own vault data
    match /vaults/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

This ensures users can only access their own recipe data.

### 5. Register Your Web App

1. In the Firebase Console, click on the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. Click the **web icon** (`</>`) to add a web app
5. Give your app a nickname (e.g., "Poe's Menu Planner Web")
6. **Do not** check "Also set up Firebase Hosting" (unless you plan to use it)
7. Click **"Register app"**

### 6. Copy Your Firebase Configuration

After registering your app, you'll see a configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### 7. Configure Environment Variables

1. In your project root directory, copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` in your text editor

3. Add your Firebase configuration values:
   ```bash
   # Gemini API Key (for recipe extraction)
   API_KEY=your_gemini_api_key_here
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
   ```

4. Save the file

### 8. Restart Your Development Server

If your development server is running, restart it to load the new environment variables:

```bash
# Stop the server (Ctrl+C)
# Then start it again
npm run dev
```

### 9. Verify Setup Works

1. Open your browser to `http://localhost:3000`
2. You should see both indicators enabled:
   - "Firebase Auth Enabled" 
   - "Cloud Sync Active"
3. Try creating a new account:
   - Click **"Create Account"** tab
   - Enter an email and password (minimum 6 characters)
   - Click **"Initialize Vault"**
4. You should be logged in and see your recipe vault
5. Add a test recipe to verify cloud sync
6. Sign out and sign in again - your recipe should still be there
7. Test cross-browser sync:
   - Open the app in a different browser
   - Sign in with the same account
   - You should see the same recipes

## Demo Mode (No Firebase Configuration)

If you don't configure Firebase environment variables, the application will run in **Demo Mode**:

- Authentication is simulated locally
- Recipes stored only in browser localStorage
- No cross-browser/device sync
- Good for development and testing
- User data is not backed up to cloud

## Security Best Practices

### DO:
✅ Keep your `.env.local` file private and never commit it to version control  
✅ Use strong passwords (minimum 6 characters, but longer is better)  
✅ Enable 2FA on your Firebase Console account  
✅ Regularly review authenticated users in Firebase Console  
✅ Set up authorized domains in Firebase Console for production  

### DON'T:
❌ Share your Firebase API keys publicly  
❌ Commit `.env.local` to Git  
❌ Use weak or common passwords  
❌ Share user credentials  

## Troubleshooting

### "Firebase is not configured" error
- **Cause**: Environment variables are not set or not loaded properly
- **Solution**: 
  1. Verify `.env.local` exists and contains all required variables
  2. Restart your development server
  3. Check that variables start with `VITE_` prefix

### "Firestore is not configured" message
- **Cause**: Firestore database not enabled in Firebase Console
- **Solution**:
  1. Go to Firebase Console > Firestore Database
  2. Click "Create database" if not already created
  3. Restart your development server

### Recipes not syncing across browsers
- **Cause**: Firestore not properly configured or security rules blocking access
- **Solution**:
  1. Verify "Cloud Sync Active" appears on login screen
  2. Check Firestore security rules allow authenticated users to access their data
  3. Open browser console and look for Firestore errors
  4. Verify you're using the same account in both browsers

### "Permission denied" errors in Firestore
- **Cause**: Security rules are too restrictive or user not authenticated
- **Solution**:
  1. Verify you're signed in
  2. Check Firestore security rules match the recommended configuration
  3. Make sure rules allow `request.auth.uid == userId`

### "Email already in use" error
- **Cause**: Trying to create an account with an email that already exists
- **Solution**: Use the "Sign In" tab instead of "Create Account"

### "Invalid email" error
- **Cause**: Email format is incorrect
- **Solution**: Ensure email includes `@` and a domain (e.g., `user@example.com`)

### "Weak password" error
- **Cause**: Password is less than 6 characters
- **Solution**: Use a password with at least 6 characters

### "Network request failed" error
- **Cause**: Cannot reach Firebase servers
- **Solution**: 
  1. Check your internet connection
  2. Verify Firebase project is active in Console
  3. Check browser console for CORS or network errors

### Changes not taking effect
- **Cause**: Environment variables are cached
- **Solution**: 
  1. Stop the dev server (Ctrl+C)
  2. Clear browser cache and localStorage
  3. Restart dev server with `npm run dev`

## Production Deployment

When deploying to production:

### 1. Configure Firestore Security Rules
Ensure your Firestore security rules are set to production mode:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vaults/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. Configure Authorized Domains
1. Go to Firebase Console > Authentication > Settings
2. Scroll to **"Authorized domains"**
3. Add your production domain (e.g., `myapp.com`)

### 3. Set Environment Variables
Configure environment variables in your hosting platform:
- Vercel: Project Settings > Environment Variables
- Netlify: Site Settings > Build & Deploy > Environment
- Railway: Project > Variables
- Other platforms: Follow their specific documentation

### 4. Use Production Firebase Project
Consider creating a separate Firebase project for production to isolate test data from production data.

### 5. Monitor Firestore Usage
- Go to Firebase Console > Firestore Database > Usage tab
- Monitor read/write operations to stay within free tier limits
- Set up billing alerts if needed

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Firebase Tutorial](https://firebase.google.com/docs/auth/web/start)

## Support

If you encounter issues not covered in this guide:
1. Check the browser console for error messages
2. Review Firebase Console > Authentication > Users to verify user creation
3. Check Firebase Console > Firestore Database > Data to verify data is being saved
4. Consult Firebase documentation
5. Open an issue in the GitHub repository

---

**Note**: This application also requires a Gemini API key for AI-powered recipe extraction. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
