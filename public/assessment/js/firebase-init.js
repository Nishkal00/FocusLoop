/* ==========================================================
   Firebase Cloud Storage
   ==========================================================
   Sends each completed profile to Firestore so you can view
   every submission from the Firebase console, instead of it
   only living in that one person's browser.

   This fails silently (with a console message) if the config
   in firebase-config.js hasn't been filled in yet, or if the
   network/Firestore call fails for any reason - the app must
   keep working locally either way.
   ========================================================== */
(function () {
    window.ADHD = window.ADHD || {};

    let db = null;
    let ready = false;

    function isConfigured() {
        const cfg = window.ADHD_FIREBASE_CONFIG;
        return !!(cfg && cfg.apiKey && cfg.apiKey !== 'YOUR_API_KEY' && cfg.projectId && cfg.projectId !== 'YOUR_PROJECT_ID');
    }

    function init() {
        if (!isConfigured()) {
            console.info('[ADHD Planner] Firebase not configured yet - submissions will only save locally. Fill in js/firebase-config.js to enable cloud storage.');
            return;
        }
        if (typeof firebase === 'undefined') {
            console.warn('[ADHD Planner] Firebase SDK did not load - check the script tags in index.html and your network connection.');
            return;
        }
        try {
            firebase.initializeApp(window.ADHD_FIREBASE_CONFIG);
            db = firebase.firestore();
            ready = true;
        } catch (e) {
            console.warn('[ADHD Planner] Firebase init failed:', e);
        }
    }

    function getOrCreateAnonId() {
        // A random per-browser id so you can tell repeat visits apart
        // in the data without collecting anything identifying.
        let id = localStorage.getItem('adhd_anon_id');
        if (!id) {
            id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
            localStorage.setItem('adhd_anon_id', id);
        }
        return id;
    }

    async function saveProfile(profileData) {
        if (!ready || !db) return; // not configured - local save already happened, nothing more to do

        try {
            await db.collection('submissions').add({
                ...profileData,
                anonId: getOrCreateAnonId(),
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent
            });
            console.info('[ADHD Planner] Profile saved to Firestore.');
        } catch (e) {
            // Never let a failed cloud save break the local experience
            console.warn('[ADHD Planner] Could not save profile to Firestore:', e);
        }
    }

    window.ADHD.cloud = { saveProfile };

    init();
})();

/* ==========================================================
   SETUP NOTES

   1. Create a project at https://console.firebase.google.com
   2. Build > Firestore Database > Create database (start in
      "production mode" - we set explicit rules below).
   3. Project settings (gear icon) > General > "Your apps" >
      add a Web app > copy the config object into
      js/firebase-config.js.
   4. Firestore > Rules, paste this and Publish:

        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /submissions/{doc} {
              allow create: if true;
              allow read, update, delete: if false;
            }
          }
        }

      This lets anyone taking the assessment ADD a submission,
      but nobody can read, edit, or delete existing ones from
      the browser - only you, viewing as the project owner in
      the Firebase console (Firestore Database > Data tab), can
      see the collected responses.
   5. Open your GitHub Pages site and complete an assessment -
      a "submissions" collection should appear in the console
      within a few seconds.
   ========================================================== */
