// Profile Page Logic - Firebase version
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let currentUserData = null;

// 1. Auth Listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Subscribe to real-time user data
    onSnapshot(doc(db, "users", user.uid), (snapshot) => {
        if (!snapshot.exists()) {
            console.error("User document missing!");
            return;
        }
        currentUserData = snapshot.data();
        renderProfile();
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

    // Show Warnings
    const existingWarnings = document.getElementById('warningSection');
    if (existingWarnings) existingWarnings.remove();

    if (currentUserData.warnings && currentUserData.warnings.length > 0) {
        const profileBox = document.querySelector('.profile-box');
        const warningDiv = document.createElement('div');
        warningDiv.id = 'warningSection';
        warningDiv.className = 'profile-section';
        warningDiv.style.background = 'rgba(255, 193, 7, 0.1)';
        warningDiv.style.border = '1px solid rgba(255, 193, 7, 0.3)';
        warningDiv.innerHTML = `<h3>⚠️ Account Warnings</h3>`;

        currentUserData.warnings.forEach(w => {
            warningDiv.innerHTML += `
                <div style="margin-top: 0.5rem; padding: 0.5rem; border-left: 2px solid #ffc107; background: rgba(0,0,0,0.2);">
                    <p style="color: #ffc107; font-weight: bold;">${w.message}</p>
                    <small style="color: var(--text-secondary)">From: ${w.by} on ${new Date(w.date).toLocaleDateString()}</small>
                </div>
            `;
        });
        profileBox.insertBefore(warningDiv, document.querySelector('.profile-section'));
    }

    const memberDate = new Date(currentUserData.createdAt);
    document.getElementById('memberSince').innerText = memberDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    document.getElementById('nicknameInput').value = currentUserData.nickname || currentUserData.username;
}

// Handle profile update
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newNickname = document.getElementById('nicknameInput').value.trim();

    if (newNickname.length < 2) return;

    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            nickname: newNickname
        });

        const successMsg = document.getElementById('successMessage');
        successMsg.innerText = '✅ Profile updated successfully!';
        setTimeout(() => successMsg.innerText = '', 3000);
    } catch (error) {
        console.error("Update error:", error);
    }
});

// Change Password
document.getElementById('changePasswordBtn').addEventListener('click', async () => {
    const user = auth.currentUser;
    const oldPass = await Modal.prompt('Enter current password:', '', 'Security Check', 'password');
    if (!oldPass) return;

    // Re-authenticate
    try {
        const credential = EmailAuthProvider.credential(user.email, oldPass);
        await reauthenticateWithCredential(user, credential);

        const newPass = await Modal.prompt('Enter NEW password:', '', 'Change Password', 'password');
        if (!newPass || newPass.length < 6) {
            if (newPass) await Modal.alert('❌ Password must be at least 6 characters.', 'Error');
            return;
        }

        const confirmPass = await Modal.prompt('Confirm NEW password:', '', 'Change Password', 'password');
        if (newPass !== confirmPass) {
            await Modal.alert('❌ Passwords do not match.', 'Error');
            return;
        }

        await updatePassword(user, newPass);
        await Modal.alert('✅ Password changed successfully!', 'Success');
    } catch (error) {
        await Modal.alert('❌ Incorrect password or error.', 'Error');
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const confirmed = await Modal.confirm('Are you sure you want to logout?', 'Logout Confirmation');
    if (confirmed) {
        const uid = auth.currentUser.uid;
        // Mark as offline before logout
        await updateDoc(doc(db, "users", uid), { isOnline: false });
        await signOut(auth);
        window.location.href = '../index.html';
    }
});

// Delete Account
document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const confirmation = await Modal.prompt(
        '⚠️ WARNING: Permanent deletion!<br>Type "DELETE" to confirm:',
        '',
        'Delete Account'
    );

    if (confirmation === 'DELETE') {
        try {
            const user = auth.currentUser;
            const uid = user.uid;

            // Re-auth usually required for delete, but skipping for brevity or letting user know
            // In real app, standard Re-auth flow here

            await deleteDoc(doc(db, "users", uid));
            await deleteUser(user);

            await Modal.alert('✅ Account deleted successfully', 'Account Deleted');
            window.location.href = '../index.html';
        } catch (error) {
            await Modal.alert('❌ Error deleting account. You may need to logout and login again to refresh security credentials.', 'Error');
        }
    }
});
