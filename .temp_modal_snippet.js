// ... existing profile code above...

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const confirmed = await Modal.confirm('Are you sure you want to logout?', 'Logout Confirmation');
    if (confirmed) {
        localStorage.removeItem('gamestation_currentUser');
        window.location.href = '../index.html';
    }
});

// Delete Account
document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const confirmation = await Modal.prompt(
        '⚠️ WARNING: This will permanently delete your account and all data!\n\nType "DELETE" to confirm:',
        '',
        'Delete Account'
    );

    if (confirmation === 'DELETE') {
        const userIndex = users.findIndex(u => u.id === currentUserId);
        if (userIndex !== -1) {
            users.splice(userIndex, 1);
            localStorage.setItem('gamestation_users', JSON.stringify(users));
        }

        localStorage.removeItem('gamestation_currentUser');

        await Modal.alert('✅ Account deleted successfully', 'Success');
        window.location.href = '../index.html';
    } else if (confirmation !== null) {
        await Modal.alert('❌ Account deletion cancelled - incorrect confirmation', 'Cancelled');
    }
});
