// Friends & Social Logic - Firebase Version
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
    doc,
    onSnapshot,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    arrayUnion,
    arrayRemove,
    getDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

let currentUserData = null;

// Tab Management
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    });
});

// Auth Listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Subscribe to current user's social data
    onSnapshot(doc(db, "users", user.uid), (snapshot) => {
        if (!snapshot.exists()) return;
        currentUserData = snapshot.data();

        renderFriendsList();
        renderPendingRequests();
        updateBadges();
    });
});

// --- Friends List ---
async function renderFriendsList() {
    const list = document.getElementById('friendsList');
    if (!list) return;

    if (!currentUserData.friends || currentUserData.friends.length === 0) {
        list.innerHTML = '<p class="empty-state">No friends added yet. Start searching in the Search tab!</p>';
        return;
    }

    list.innerHTML = '';

    // Fetch live data for each friend
    for (const friendId of currentUserData.friends) {
        onSnapshot(doc(db, "users", friendId), (docSnap) => {
            if (!docSnap.exists()) return;
            const friend = docSnap.data();

            // Render or update friend card
            const existingCard = document.getElementById(`friend-${friendId}`);
            const cardHtml = `
                <div class="friend-avatar" style="background-color: ${stringToColor(friend.username)}">
                    ${friend.username[0].toUpperCase()}
                    <span class="status-dot ${friend.isOnline ? 'online' : ''}"></span>
                </div>
                <div class="friend-info">
                    <span class="friend-name">${friend.nickname || friend.username}</span>
                    <span class="friend-status-text">${friend.isOnline ? 'Active Now' : 'Last seen ' + formatDate(friend.lastSeen)}</span>
                </div>
                <div class="friend-actions">
                    <button class="action-icon-btn" onclick="inviteToPlay('${friendId}')" title="Invite to Play">🎮</button>
                    <button class="action-icon-btn" onclick="removeFriend('${friendId}')" title="Remove Friend">🗑️</button>
                </div>
            `;

            if (existingCard) {
                existingCard.innerHTML = cardHtml;
            } else {
                const tr = document.createElement('div');
                tr.id = `friend-${friendId}`;
                tr.className = 'friend-card';
                tr.innerHTML = cardHtml;
                list.appendChild(tr);
            }
        });
    }
}

// --- Requests ---
function renderPendingRequests() {
    const list = document.getElementById('requestsList');
    if (!list) return;

    if (!currentUserData.friendRequests || currentUserData.friendRequests.length === 0) {
        list.innerHTML = '<p class="empty-state">No pending requests</p>';
        return;
    }

    list.innerHTML = '';
    currentUserData.friendRequests.forEach(async (req) => {
        const userRef = doc(db, "users", req.fromId);
        const userSnap = await getDoc(userRef);
        const user = userSnap.data();

        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
            <div class="user-snippet">
                <div class="mini-avatar" style="background-color: ${stringToColor(user.username)}">${user.username[0]}</div>
                <div>
                    <span class="friend-name">${user.username}</span>
                    <small style="display:block; color:var(--text-secondary)">Sent ${formatDate(req.date)}</small>
                </div>
            </div>
            <div class="friend-actions">
                <button class="btn btn-primary btn-sm" onclick="acceptRequest('${req.fromId}')">Accept</button>
                <button class="btn btn-danger btn-sm" onclick="declineRequest('${req.fromId}')">Decline</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function updateBadges() {
    const badge = document.getElementById('requestCount');
    const count = (currentUserData.friendRequests || []).length;
    if (count > 0) {
        badge.innerText = count;
        badge.classList.add('active');
    } else {
        badge.classList.remove('active');
    }
}

// --- Search ---
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('userSearchInput');

searchBtn?.addEventListener('click', performSearch);
searchInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });

async function performSearch() {
    const term = searchInput.value.trim().toLowerCase();
    const results = document.getElementById('searchResults');
    if (term.length < 2) return;

    results.innerHTML = '<div class="loading-spinner">Scanning the sector...</div>';

    try {
        const q = query(collection(db, "users"), where("username", ">=", term), where("username", "<=", term + '\uf8ff'));
        const querySnapshot = await getDocs(q);

        results.innerHTML = '';
        let found = 0;

        querySnapshot.forEach((docSnap) => {
            const user = docSnap.data();
            if (user.id === auth.currentUser.uid) return; // Skip self

            found++;
            const isFriend = (currentUserData.friends || []).includes(user.id);
            const isPending = (currentUserData.sentRequests || []).includes(user.id);

            const item = document.createElement('div');
            item.className = 'search-item';
            item.innerHTML = `
                <div class="user-snippet">
                    <div class="mini-avatar" style="background-color: ${stringToColor(user.username)}">${user.username[0]}</div>
                    <span class="friend-name">${user.username}</span>
                </div>
                ${isFriend ? '<span class="badge-type user">Already Friends</span>' :
                    isPending ? '<button class="btn btn-secondary btn-sm" disabled>Request Sent</button>' :
                        `<button class="btn btn-primary btn-sm" onclick="sendFriendRequest('${user.id}', '${user.username}')">Add Friend</button>`}
            `;
            results.appendChild(item);
        });

        if (found === 0) results.innerHTML = '<p class="empty-state">No users found in this coordinates</p>';

    } catch (e) {
        console.error(e);
        results.innerHTML = '<p class="empty-state">Search failed. Try again.</p>';
    }
}

// --- Social Actions ---
window.sendFriendRequest = async (targetId, targetName) => {
    try {
        // 1. Add to target user's requests
        await updateDoc(doc(db, "users", targetId), {
            friendRequests: arrayUnion({
                fromId: auth.currentUser.uid,
                fromName: currentUserData.username,
                date: new Date().toISOString()
            })
        });

        // 2. Add to sender's sent list
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            sentRequests: arrayUnion(targetId)
        });

        // 3. Send Notification
        window.sendNotification(targetId, `${currentUserData.username} sent you a friend request!`, 'social');

        performSearch(); // Refresh search view
        Modal.alert(`Friend request beamed to ${targetName}!`, 'Request Sent');
    } catch (e) { console.error(e); }
};

window.acceptRequest = async (fromId) => {
    try {
        // 1. Add to friends lists (Both users)
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            friends: arrayUnion(fromId),
            friendRequests: arrayRemove(currentUserData.friendRequests.find(r => r.fromId === fromId))
        });

        await updateDoc(doc(db, "users", fromId), {
            friends: arrayUnion(auth.currentUser.uid),
            sentRequests: arrayRemove(auth.currentUser.uid)
        });

        window.sendNotification(fromId, `${currentUserData.username} accepted your friend request!`, 'social');
        Modal.alert("Friendship established!", "Success");
    } catch (e) { console.error(e); }
};

window.declineRequest = async (fromId) => {
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            friendRequests: arrayRemove(currentUserData.friendRequests.find(r => r.fromId === fromId))
        });
        await updateDoc(doc(db, "users", fromId), {
            sentRequests: arrayRemove(auth.currentUser.uid)
        });
    } catch (e) { console.error(e); }
};

window.removeFriend = async (friendId) => {
    const confirmed = await Modal.confirm("Are you sure you want to end this friendship connection?", "Remove Friend");
    if (!confirmed) return;

    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { friends: arrayRemove(friendId) });
        await updateDoc(doc(db, "users", friendId), { friends: arrayRemove(auth.currentUser.uid) });
    } catch (e) { console.error(e); }
};

window.inviteToPlay = async (friendId) => {
    window.sendNotification(friendId, `${currentUserData.username} invited you to play! Go to games to join.`, 'game');
    Modal.alert("Game invitation sent!", "Let's Play");
};

// Helpers
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function formatDate(iso) {
    if (!iso) return 'Long ago';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString();
}
