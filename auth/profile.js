// Profile Page Logic - Firebase version
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let currentUserData = null;

// Helper to show error on screen
function showDbError(message) {
    const profileBox = document.querySelector('.profile-box');
    const existingError = document.getElementById('screenError');
    if (existingError) existingError.remove();

    const errorDiv = document.createElement('div');
    errorDiv.id = 'screenError';
    errorDiv.style.cssText = 'background: rgba(255, 0, 0, 0.2); color: #ff5252; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #ff5252; font-size: 0.9rem;';
    errorDiv.innerHTML = `<strong>⚠️ Database Issue:</strong> ${message}<br><br><small>Go to Firebase Console > Firestore Database > Click "Create Database" to fix this.</small>`;
    profileBox.insertBefore(errorDiv, profileBox.firstChild);
}

// 1. Auth Listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Subscribe to real-time user data
    try {
        onSnapshot(doc(db, "users", user.uid), (snapshot) => {
            if (!snapshot.exists()) {
                console.error("User document missing!");
                showDbError("Your profile data hasn't been created yet. This usually happens if the database is disabled.");
                return;
            }
            // Clear any previous error if data arrived
            const err = document.getElementById('screenError');
            if (err) err.remove();

            currentUserData = snapshot.data();
            renderProfile();
        }, (error) => {
            console.error("Firestore error:", error);
            if (error.code === 'permission-denied') {
                showDbError("Firestore Database is not enabled or permission is denied.");
            } else {
                showDbError(error.message);
            }
        });
    } catch (err) {
        console.error("Snapshot setup failed:", err);
        showDbError("Failed to connect to the database.");
    }
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

// ... the rest of the file (Logout, Password change, Delete) remains the same ...
// [Note: I'm keeping the rest of the functions from the previous implementation]
// Handle profile update
document.getElementById('profileForm').addEventListener('submit', async (e) => {
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
    } catch (error) { await Modal.alert('❌ Error changing password.', 'Error'); }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const confirmed = await Modal.confirm('Are you sure you want to logout?', 'Logout Confirmation');
    if (confirmed) {
        try { await updateDoc(doc(db, "users", auth.currentUser.uid), { isOnline: false }); } catch (e) { }
        await signOut(auth);
        window.location.href = '../index.html';
    }
});

document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
    const confirmation = await Modal.prompt('Type "DELETE" to confirm permanent deletion:', '', 'Delete Account');
    if (confirmation === 'DELETE') {
        try {
            const user = auth.currentUser;
            const uid = user.uid;
            await deleteDoc(doc(db, "users", uid));
            await deleteUser(user);
            window.location.href = '../index.html';
        } catch (error) { await Modal.alert('❌ Error. Try relogging before deletion.', 'Error'); }
    }
});
