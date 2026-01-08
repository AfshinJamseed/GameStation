// Auth Utilities - Real-time with Firebase
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Global auth state listener for the header indicator
onAuthStateChanged(auth, (user) => {
    const userLink = document.getElementById('userLink');
    if (!userLink) return;

    if (user) {
        // Subscribe to user doc for real-time nickname updates
        onSnapshot(doc(db, "users", user.uid), (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.data();
                const nickname = userData.nickname || userData.username || user.displayName || 'Player';
                userLink.innerHTML = `
                    <span class="user-greeting">👤 ${nickname}</span>
                `;
                userLink.href = 'auth/profile.html';
                userLink.style.color = 'var(--accent-cyan)';
            }
        });
    } else {
        userLink.innerText = 'Login';
        userLink.href = 'auth/login.html';
        userLink.style.color = '';
    }
});
