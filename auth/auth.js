// Authentication System
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');

// Setup persistence
setPersistence(auth, browserLocalPersistence).catch(error => {
    console.error("Persistence error:", error);
});

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

signupPassword?.addEventListener('input', (e) => {
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

// Handle Login
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        errorEl.innerText = '';
        const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
        const user = userCredential.user;

        // Update Online Status
        await updateDoc(doc(db, "users", user.uid), {
            isOnline: true,
            lastLogin: new Date().toISOString()
        });

        window.location.href = '../index.html';
    } catch (error) {
        console.error("Login Error:", error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorEl.innerText = '❌ Invalid email or password';
        } else if (error.code === 'auth/invalid-email') {
            errorEl.innerText = '❌ Invalid email format';
        } else {
            errorEl.innerText = '❌ ' + error.message;
        }
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

    // Validation
    if (password !== confirm) {
        errorEl.innerText = '❌ Passwords do not match';
        return;
    }

    if (password.length < 6) {
        errorEl.innerText = '❌ Password must be at least 6 characters';
        return;
    }

    try {
        errorEl.innerText = '';
        // Create Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Profile
        await updateProfile(user, {
            displayName: username
        });

        // Determine if Admin (First admin hardcoded or by email)
        const isAdmin = email === 'admin@gamestation.com';

        // Create User Document in Firestore
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

        // Redirect to home
        window.location.href = '../index.html';

    } catch (error) {
        console.error("Signup Error:", error);
        if (error.code === 'auth/email-already-in-use') {
            errorEl.innerText = '❌ Email already registered';
        } else {
            errorEl.innerText = '❌ ' + error.message;
        }
    }
});

// Password toggle functionality
document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);

        if (input.type === 'password') {
            input.type = 'text';
            button.classList.add('visible');
            button.innerText = '🙈';
        } else {
            input.type = 'password';
            button.classList.remove('visible');
            button.innerText = '👁️';
        }
    });
});
