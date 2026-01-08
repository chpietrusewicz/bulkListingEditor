// Firebase Configuration
// Follow these steps to set up Firebase:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Click "Add app" and select "Web"
// 4. Copy your Firebase config and paste it below
// 5. Enable Firestore Database in Firebase Console

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase (will be called from main config)
let db = null;
let isFirebaseEnabled = false;

function initializeFirebase() {
    // Check if Firebase config is set up
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
        console.warn("Firebase not configured. Using localStorage only. See js/firebase-config.js for setup instructions.");
        isFirebaseEnabled = false;
        return;
    }

    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        isFirebaseEnabled = true;
        console.log("Firebase initialized successfully");

        // Sync data from cloud on startup
        syncFromFirebase();
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        isFirebaseEnabled = false;
    }
}

// Save batches to Firebase
async function saveBatchesToFirebase(batchesData) {
    if (!isFirebaseEnabled || !db) return;

    try {
        // Use a fixed document ID so we overwrite the same document each time
        await db.collection('listings').doc('batches').set({
            batches: batchesData,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Batches saved to Firebase");
    } catch (error) {
        console.error("Error saving to Firebase:", error);
    }
}

// Load batches from Firebase
async function syncFromFirebase() {
    if (!isFirebaseEnabled || !db) return;

    try {
        const doc = await db.collection('listings').doc('batches').get();
        if (doc.exists) {
            const data = doc.data();
            batches = data.batches || [];
            localStorage.setItem('batches', JSON.stringify(batches));
            console.log("Synced batches from Firebase");

            // Re-render batches if on batches screen
            const batchesScreen = document.getElementById('batches-screen');
            if (batchesScreen && batchesScreen.classList.contains('active')) {
                renderBatches();
            }
        }
    } catch (error) {
        console.error("Error loading from Firebase:", error);
    }
}

// Listen for real-time updates from Firebase
function enableRealtimeSync() {
    if (!isFirebaseEnabled || !db) return;

    db.collection('listings').doc('batches').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            batches = data.batches || [];
            localStorage.setItem('batches', JSON.stringify(batches));
            console.log("Batches updated from Firebase in real-time");

            // Re-render batches if on batches screen
            const batchesScreen = document.getElementById('batches-screen');
            if (batchesScreen && batchesScreen.classList.contains('active')) {
                renderBatches();
            }
        }
    }, (error) => {
        console.error("Error listening to Firebase updates:", error);
    });
}
