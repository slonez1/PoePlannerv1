<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally with **Firebase Authentication** enabled.

View your app in AI Studio: https://ai.studio/apps/drive/1c1otsfnIIlp2p9dt2qAoxKAuAjhZVYXG

## Features

- 🔐 **Secure Authentication**: Firebase Authentication with email/password
- 📦 **Recipe Management**: Store and organize your favorite recipes
- 🔄 **Cloud Sync**: Automatic synchronization across devices using Firestore
- 🤖 **AI-Powered**: Recipe extraction using Google Gemini AI
- 📱 **Cross-Browser Access**: Access your recipes from any browser or device
- 💾 **Offline Support**: Works offline with local storage fallback

## Run Locally

**Prerequisites:**  Node.js (v16 or higher)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase Authentication and Firestore

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

#### Enable Email/Password Authentication

1. In your Firebase project, navigate to **Authentication** > **Sign-in method**
2. Click on **Email/Password**
3. Enable the provider and click **Save**

#### Enable Firestore Database

1. In your Firebase project, navigate to **Firestore Database**
2. Click **"Create database"**
3. Choose production mode or test mode
4. Select a location for your database
5. Click **"Enable"**

#### Set Up Security Rules

In Firestore Database, go to the **Rules** tab and add:

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

#### Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Poe's Menu Planner")
5. Copy the Firebase configuration values

#### Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```bash
   # Gemini API Key
   API_KEY=your_gemini_api_key_here
   
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

3. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Run the app

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Authentication System

### How It Works

The application uses **Firebase Authentication** and **Firestore Database** from Google Cloud Platform:

1. **Sign Up**: New users create an account with email and password
2. **Sign In**: Existing users authenticate with their credentials
3. **Session Management**: Firebase automatically manages user sessions
4. **Cloud Sync**: Recipe data is automatically synced to Firestore
5. **Cross-Device Access**: Access your recipes from any browser or device
6. **Sign Out**: Secure logout clears the session

### Demo Mode

If Firebase is not configured, the app runs in **demo mode** with:
- Simulated authentication
- Local storage only (no cloud sync)
- Good for development and testing
- Recipes not accessible across browsers

To use demo mode, simply run the app without configuring Firebase environment variables.

### Security Features

- ✅ Password validation (minimum 6 characters)
- ✅ Email format validation
- ✅ Secure password hashing (handled by Firebase)
- ✅ Session token management
- ✅ Automatic session refresh
- ✅ User-friendly error messages
- ✅ Network error handling

## Architecture

### Authentication Flow

```
User Input → Firebase Auth → Session Token → Cloud Sync → Local Storage
```

### File Structure

- `services/firebase.ts` - Firebase Authentication service
- `services/firestore.ts` - Firestore Database service for cloud sync
- `services/gemini.ts` - Gemini AI integration
- `App.tsx` - Main application component with auth logic
- `types.ts` - TypeScript type definitions

## Troubleshooting

### Firebase Not Working

1. Verify all environment variables are set correctly in `.env.local`
2. Ensure Email/Password provider is enabled in Firebase Console
3. Ensure Firestore Database is created and enabled
4. Check Firestore security rules allow authenticated users to access their data
5. Check browser console for error messages
6. Restart the development server after changing `.env.local`

### Common Issues

- **"Firebase is not configured"**: Add Firebase credentials to `.env.local`
- **"Firestore is not configured"**: Enable Firestore Database in Firebase Console
- **"Recipes not syncing"**: Check that "Cloud Sync Active" shows on login screen
- **"Permission denied"**: Verify Firestore security rules are properly configured
- **"Email already in use"**: Use the Sign In tab instead of Create Account
- **"Invalid email"**: Check email format (must include @ and domain)
- **"Weak password"**: Use at least 6 characters

## Deployment

When deploying to production:

1. Set environment variables in your hosting platform
2. Ensure Firebase project has proper domain configuration
3. Add your production domain to Firebase authorized domains:
   - Go to Firebase Console > Authentication > Settings
   - Add your domain to "Authorized domains"

## License

This project is built with Google AI Studio and Firebase.
