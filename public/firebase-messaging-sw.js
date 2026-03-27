
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Note: These values should match your src/firebase/config.ts
firebase.initializeApp({
  "projectId": "studio-3747808795-e1fe5",
  "appId": "1:832259040213:web:996b2a23a2462d9eae135c",
  "apiKey": "AIzaSyBPfjHSlK6-BDa1_GickhXA68f6CWyRD-o",
  "authDomain": "studio-3747808795-e1fe5.firebaseapp.com",
  "messagingSenderId": "832259040213"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'Bhartiya Swad Update';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new update regarding your order.',
    icon: '/favicon.ico', // Ensure you have an icon or use a generic one
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
