// Profile Page Logic - Updated with Auto-Repair
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, onSnapshot, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let currentUserData = null;

function showDbError(message) {
    const profileBox = document.querySelector('.profile-box');
    const existingError = document.getElementById('screenError');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = 'screenError';
    errorDiv.style.cssText = 'background: rgba(255, 0, 0, 0.2); color: #ff5252; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #ff5252; font-size: 0.9rem; text-align: center;';
    errorDiv.innerHTML = `<strong>⚠️ Database Setup Needed</strong><br>${message}<br><br><small>Final Step: Go to <b>Firebase Console > Firestore Database</b> and click <b>"Create Database"</b>.</small>`;
    profileBox.insertBefore(errorDiv, profileBox.firstChild);
}

// 1. Auth Listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const userRef = doc(db, "users", user.uid);

    // Subscribe to real-time user data
    onSnapshot(userRef, async (snapshot) => {
        if (!snapshot.exists()) {
            console.warn("User document missing, attempting auto-repair...");

            // AUTO-REPAIR: If the DB was just enabled, let's create the missing user data
            try {
                const username = user.displayName || user.email.split('@')[0];
                await setDoc(userRef, {
                    id: user.uid,
                    username: username,
                    email: user.email,
                    nickname: username,
                    isAdmin: user.email === 'admin@gamestation.com',
                    isOnline: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    warnings: [],
                    notifications: []
                });
                console.log("Auto-repair successful!");
            } catch (err) {
                console.error("Auto-repair failed:", err);
                showDbError("Could not save your profile. Make sure Firestore is enabled in Test Mode.");
            }
            return;
        }

        // Data received successfully
        const err = document.getElementById('screenError');
        if (err) err.remove();

        currentUserData = snapshot.data();
        renderProfile();
    }, (error) => {
        console.error("Firestore Error:", error);
        if (error.code === 'permission-denied' || error.message.includes('not exist')) {
            showDbError("Firestore is not enabled yet.");
        }
    });
});

function renderProfile() {
    if (!currentUserData) return;

    // Display user info
    document.getElementById('profileUsername').innerText = currentUserData.nickname || currentUserData.username;
    document.getElementById('profileEmail').innerText = currentUserData.email;
    document.getElementById('displayUsername').innerText = currentUserData.username;
    document.getElementById('displayEmail').innerText = currentUserData.email;

    // Admin Dashboard Link
    const existingAdminBtn = document.getElementById('adminDashboardBtn');
    if (currentUserData.isAdmin && !existingAdminBtn) {
        const profileActions = document.querySelector('.profile-actions');
        const adminBtn = document.createElement('button');
        adminBtn.id = 'adminDashboardBtn';
        adminBtn.className = 'btn btn-primary';
        adminBtn.style.background = 'linear-gradient(45deg, #FFD700, #FFA500)';
        adminBtn.style.border = 'none';
        adminBtn.style.marginBottom = '1rem';
        adminBtn.style.color = '#000';
        adminBtn.style.fontWeight = 'bold';
        adminBtn.innerText = '👑 Admin Dashboard';
        adminBtn.onclick = () => window.location.href = 'admin.html';
        profileActions.insertBefore(adminBtn, profileActions.firstChild);
    }

    const memberDate = new Date(currentUserData.createdAt);
    document.getElementById('memberSince').innerText = memberDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    document.getElementById('nicknameInput').value = currentUserData.nickname || currentUserData.username;
}

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const confirmed = await Modal.confirm('Are you sure you want to logout?', 'Logout Confirmation');
    if (confirmed) {
        try {
            if (auth.currentUser) {
                await updateDoc(doc(db, "users", auth.currentUser.uid), { isOnline: false });
            }
        } catch (e) { }
        await signOut(auth);
        window.location.href = '/index.html';
    }
});

// Other handlers (Password, Update)
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newNickname = document.getElementById('nicknameInput').value.trim();
    if (newNickname.length < 2) return;
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { nickname: newNickname });
        const successMsg = document.getElementById('successMessage');
        successMsg.innerText = '✅ Profile updated successfully!';
        setTimeout(() => successMsg.innerText = '', 3000);
    } catch (error) { console.error("Update error:", error); }
});

document.getElementById('changePasswordBtn')?.addEventListener('click', async () => {
    const user = auth.currentUser;
    const oldPass = await Modal.prompt('Enter current password:', '', 'Security Check', 'password');
    if (!oldPass) return;
    try {
        const credential = await EmailAuthProvider.credential(user.email, oldPass);
        await reauthenticateWithCredential(user, credential);
        const newPass = await Modal.prompt('Enter NEW password:', '', 'Change Password', 'password');
        if (!newPass) return;
        await updatePassword(user, newPass);
        await Modal.alert('✅ Password changed successfully!', 'Success');
    } catch (error) { await Modal.alert('❌ Error. Check your connection.', 'Error'); }
});
