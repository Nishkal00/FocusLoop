/* ==========================================================
   Firebase Project Config
   ==========================================================
   Fill this in with YOUR Firebase project's values.
   Get them from: Firebase Console -> Project Settings ->
   General tab -> "Your apps" -> Web app -> SDK setup and
   configuration -> Config.

   Note: unlike a typical API key, this is safe to be public /
   committed to GitHub. Firebase's client config is not a secret -
   it just tells the SDK which project to talk to. Actual access
   control is enforced by the Firestore Security Rules you set in
   the console (see SETUP NOTES at the bottom of firebase-init.js),
   not by hiding this file.
   ========================================================== */
// Placeholder values: without a real config the assessment still works and
// saves results locally in the browser; it just skips the Firestore upload.
window.ADHD_FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
