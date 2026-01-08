// Multiplayer Room Manager - Firebase Firestore Version
import { db } from "../auth/firebase-config.js";
import {
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    deleteDoc,
    getDoc,
    serverTimestamp,
    collection,
    addDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/**
 * Manages real-time game state synchronization using Firestore
 */
export class MultiplayerManager {
    constructor(gameId) {
        this.gameId = gameId; // Name of the game (e.g., 'duel')
        this.roomRef = null;
        this.roomId = null;
        this.isHost = false;
        this.onUpdateCallback = null;
    }

    /**
     * Create a new match room
     */
    async createRoom(hostData) {
        try {
            const roomData = {
                game: this.gameId,
                host: hostData,
                guest: null,
                state: 'lobby', // lobby, playing, finished
                gameState: {},
                lastUpdate: serverTimestamp(),
                events: [] // Temporary events like 'shoot'
            };

            const docRef = await addDoc(collection(db, "rooms"), roomData);
            this.roomId = docRef.id;
            this.roomRef = docRef;
            this.isHost = true;

            this.listenToRoom();
            return this.roomId;
        } catch (error) {
            console.error("Failed to create room:", error);
            throw error;
        }
    }

    /**
     * Join an existing match room
     */
    async joinRoom(roomId, guestData) {
        try {
            const docRef = doc(db, "rooms", roomId);
            const snap = await getDoc(docRef);

            if (!snap.exists()) throw new Error("Room not found");
            const data = snap.data();
            if (data.guest) throw new Error("Room is full");

            await updateDoc(docRef, {
                guest: guestData,
                state: 'playing',
                lastUpdate: serverTimestamp()
            });

            this.roomId = roomId;
            this.roomRef = docRef;
            this.isHost = false;

            this.listenToRoom();
            return data.host;
        } catch (error) {
            console.error("Failed to join room:", error);
            throw error;
        }
    }

    /**
     * Sync game state
     */
    async updateGameState(state) {
        if (!this.roomRef) return;
        try {
            // Only update if playing or finished
            await updateDoc(this.roomRef, {
                gameState: state,
                lastUpdate: serverTimestamp()
            });
        } catch (e) {
            // Silently fail if session ended
        }
    }

    /**
     * Send instant event (like jump or shoot)
     */
    async sendEvent(event) {
        if (!this.roomRef) return;
        // In this simple version, we add events to an array
        // In a high-perf version we'd use separate docs
        await updateDoc(this.roomRef, {
            events: arrayUnion(event)
        });
    }

    /**
     * Listen for room changes
     */
    listenToRoom() {
        onSnapshot(this.roomRef, (snapshot) => {
            if (!snapshot.exists()) {
                if (this.onRoomClosed) this.onRoomClosed();
                return;
            }

            const data = snapshot.data();
            if (this.onUpdateCallback) {
                this.onUpdateCallback(data);
            }
        });
    }

    onUpdate(callback) {
        this.onUpdateCallback = callback;
    }

    async closeRoom() {
        if (this.roomRef) {
            await deleteDoc(this.roomRef);
            this.roomRef = null;
        }
    }
}
