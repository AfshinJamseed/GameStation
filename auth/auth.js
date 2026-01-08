// Authentication System
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

console.log("Auth System Initialized");

const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');

// Toggle between login and signup
loginTab?.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    authTitle.innerText = 'Welcome Back';
    authSubtitle.innerText = 'Sign in to continue';
});

signupTab?.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authTitle.innerText = 'Join GameStation';
    authSubtitle.innerText = 'Create your account';
});

// Handle Login
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    try {
        errorEl.innerText = '';
        submitBtn.innerText = 'Logging in...';
        submitBtn.disabled = true;

        const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
        const user = userCredential.user;

        // Smart database update (non-blocking)
        try {
            updateDoc(doc(db, "users", user.uid), {
                isOnline: true,
                lastLogin: new Date().toISOString()
            }).catch(err => console.warn("Database status update failed:", err));
        } catch (dbErr) {
            console.warn("Firestore access ignored.");
        }

        window.location.href = '/index.html';
    } catch (error) {
        console.error("Login Error:", error);
        submitBtn.innerText = 'Sign In';
        submitBtn.disabled = false;
        errorEl.innerText = '❌ ' + (error.message || 'Login failed');
    }
});

// Handle Signup
signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const errorEl = document.getElementById('signupError');
    const submitBtn = signupForm.querySelector('button[type="submit"]');

    if (password !== confirm) {
        errorEl.innerText = '❌ Passwords do not match';
        return;
    }

    try {
        errorEl.innerText = '';
        submitBtn.innerText = 'Creating Account...';
        submitBtn.disabled = true;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: username });
        const isAdmin = email === 'admin@gamestation.com';

        try {
            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                username: username,
                email: email,
                nickname: username,
                isAdmin: isAdmin,
                isOnline: true,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                warnings: [],
                notifications: []
            });
        } catch (dbError) {
            console.error("Database setup failed on signup:", dbError);
        }

        window.location.href = '/index.html';
    } catch (error) {
        console.error("Signup Error:", error);
        submitBtn.innerText = 'Create Account';
        submitBtn.disabled = false;
        errorEl.innerText = '❌ ' + error.message;
    }
});

// Password toggle
document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
            input.type = 'text';
            button.innerText = '🙈';
        } else {
            input.type = 'password';
            button.innerText = '👁️';
        }
    });
});
