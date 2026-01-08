// Authentication System - Simplified with Debugging
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

console.log("TEST: Auth Script Loaded Successfully!");

const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');

// Toggle between login and signup
loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    authTitle.innerText = 'Welcome Back';
    authSubtitle.innerText = 'Sign in to continue';
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authTitle.innerText = 'Join GameStation';
    authSubtitle.innerText = 'Create your account';
});

// Password strength indicator
const signupPassword = document.getElementById('signupPassword');
const strengthIndicator = document.getElementById('passwordStrength');

if (signupPassword) {
    signupPassword.addEventListener('input', (e) => {
        const password = e.target.value;
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        strengthIndicator.className = 'password-strength';
        if (strength <= 2) strengthIndicator.classList.add('weak');
        else if (strength <= 4) strengthIndicator.classList.add('medium');
        else strengthIndicator.classList.add('strong');
    });
}

// Handle Login
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Attempting login...");

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

        // Update Online Status
        await updateDoc(doc(db, "users", user.uid), {
            isOnline: true,
            lastLogin: new Date().toISOString()
        });

        window.location.href = '../index.html';
    } catch (error) {
        console.error("Detailed Login Error:", error);
        submitBtn.innerText = 'Sign In';
        submitBtn.disabled = false;
        errorEl.innerText = '❌ ' + error.message;
    }
});

// Handle Signup
signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log("Attempting signup...");

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

        window.location.href = '../index.html';
    } catch (error) {
        console.error("Detailed Signup Error:", error);
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
