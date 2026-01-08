// Admin Dashboard Logic - Real-time with Firebase
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let users = [];
let currentUser = null;

// 1. Protection & Auth Listeners
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    // Subscribe to real-time user data
    onSnapshot(doc(db, "users", user.uid), async (snapshot) => {
        if (!snapshot.exists()) {
            if (user.email === 'admin@gamestation.com') {
                const username = user.displayName || 'Admin';
                await setDoc(doc(db, "users", user.uid), {
                    id: user.uid,
                    username: username,
                    email: user.email,
                    nickname: username,
                    isAdmin: true,
                    isOnline: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    warnings: [],
                    notifications: []
                });
                return;
            }
        }

        const userData = snapshot.data();
        if (!userData || !userData.isAdmin) {
            window.location.href = '../index.html';
            return;
        }

        currentUser = userData;
        initDashboard();
    }, (error) => {
        console.error("Admin check failed:", error);
        // If it's a permission error, it's likely because Firestore is disabled
        if (error.code === 'permission-denied') {
            alert("⚠️ Firestore Database not enabled. Please enable it in Firebase Console to use the Admin Dashboard.");
            window.location.href = '../index.html';
        }
    });
});

function initDashboard() {
    // 2. Real-time Users Listener
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));

    onSnapshot(usersQuery, (snapshot) => {
        users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderDashboard();
    }, (error) => {
        console.error("User list listener failed:", error);
    });
}

// 3. Render Dashboard
function renderDashboard() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let onlineCount = 0;

    users.forEach(user => {
        const tr = document.createElement('tr');
        const isSelf = user.id === auth.currentUser?.uid;

        const isAdminBadge = user.isAdmin ? '<span class="badge-type admin">Admin</span>' : '<span class="badge-type user">User</span>';
        const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';

        // Real Online Status from Firestore
        const isOnline = user.isOnline || false;
        if (isOnline) onlineCount++;

        const statusBadge = isOnline
            ? '<span class="status-badge online"><span class="dot"></span> Online</span>'
            : '<span class="status-badge offline"><span class="dot"></span> Offline</span>';

        const warningBadge = user.warnings && user.warnings.length > 0
            ? `<span class="status-badge warning" title="${user.warnings.length} Warnings">⚠️ ${user.warnings.length}</span>`
            : '';

        tr.innerHTML = `
            <td>
                <div class="user-cell">
                    <div class="user-avatar" style="background-color: ${stringToColor(user.username || 'U')}">${(user.username || 'U')[0].toUpperCase()}</div>
                    <div class="user-info">
                        <span class="username">${user.username || 'Unknown'} ${isSelf ? '(You)' : ''}</span>
                        ${isAdminBadge}
                    </div>
                </div>
            </td>
            <td>${user.email || 'N/A'}</td>
            <td>${createdDate}</td>
            <td>
                <div class="status-cell">
                    ${statusBadge}
                    ${warningBadge}
                </div>
            </td>
            <td>
                ${!isSelf ? `
                    <div class="action-buttons">
                        <button class="action-btn btn-warn" onclick="warnUser('${user.id}')" title="Warn User">⚠️</button>
                        ${!user.isAdmin ? `<button class="action-btn btn-delete" onclick="deleteUser('${user.id}')" title="Delete User">🗑️</button>` : ''}
                    </div>
                ` : '<span class="current-user-tag">Current Session</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Update Stats
    const totalUsersEl = document.getElementById('totalUsers');
    if (totalUsersEl) totalUsersEl.innerText = users.length;

    const onlineStat = document.getElementById('onlineUsers');
    if (onlineStat) {
        onlineStat.innerText = onlineCount;
    } else {
        const statsOverview = document.querySelector('.stats-overview');
        if (statsOverview) {
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            statCard.innerHTML = `
                <h4>Online Friends</h4>
                <span id="onlineUsers">${onlineCount}</span>
            `;
            statsOverview.appendChild(statCard);
        }
    }
}

// 4. Admin Actions
window.warnUser = async (userId) => {
    const reason = await Modal.prompt('Enter warning message for this user:', '', 'Issue Warning');
    if (reason) {
        const userRef = doc(db, "users", userId);
        const user = users.find(u => u.id === userId);
        const updatedWarnings = [...(user.warnings || []), {
            message: reason,
            date: new Date().toISOString(),
            by: currentUser.username
        }];

        await updateDoc(userRef, { warnings: updatedWarnings });
        await Modal.alert('Warning sent to user.', 'Success');
    }
};

window.deleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    const confirmed = await Modal.confirm(
        `Are you sure you want to PERMANENTLY delete user "${user.username}"? This will only remove their profile data.`,
        'Delete User'
    );

    if (confirmed) {
        await deleteDoc(doc(db, "users", userId));
        await Modal.alert('User profile deleted from database.', 'Deleted');
    }
};

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}
