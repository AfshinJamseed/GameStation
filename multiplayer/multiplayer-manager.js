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
    addDoc,
    query,
    where,
    getDocs,
    limit,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/**
 * Manages real-time game state synchronization using Firestore
 */
export class MultiplayerManager {
    constructor(gameId) {
        this.gameId = gameId; // Name of the game (e.g., 'duel')
        this.roomRef = null;
        this.roomId = null;
        this.roomCode = null;
        this.isHost = false;
        this.onUpdateCallback = null;
    }

    /**
     * Generate a user-friendly 6-character room code
     */
    generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    /**
     * Create a new match room
     */
    async createRoom(hostData) {
        try {
            const roomCode = this.generateRoomCode();
            const roomData = {
                game: this.gameId,
                roomCode: roomCode,
                host: hostData,
                guest: null,
                state: 'lobby', // lobby, playing, finished
                gameState: {},
                lastUpdate: serverTimestamp(),
                events: []
            };

            const docRef = await addDoc(collection(db, "rooms"), roomData);
            this.roomId = docRef.id;
            this.roomCode = roomCode;
            this.roomRef = docRef;
            this.isHost = true;

            this.listenToRoom();
            return this.roomCode;
        } catch (error) {
            console.error("Failed to create room:", error);
            throw error;
        }
    }

    /**
     * Join an existing match room using a 6-character room code
     */
    async joinRoom(roomCode, guestData) {
        try {
            const q = query(
                collection(db, "rooms"),
                where("roomCode", "==", roomCode.toUpperCase()),
                where("game", "==", this.gameId),
                where("state", "==", "lobby"),
                limit(1)
            );

            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                throw new Error("Room not found or already started");
            }

            const roomDoc = querySnapshot.docs[0];
            const docRef = roomDoc.ref;
            const data = roomDoc.data();

            if (data.guest) throw new Error("Room is full");

            await updateDoc(docRef, {
                guest: guestData,
                state: 'playing',
                lastUpdate: serverTimestamp()
            });

            this.roomId = roomDoc.id;
            this.roomCode = roomCode.toUpperCase();
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
            try {
                await deleteDoc(this.roomRef);
            } catch (e) { }
            this.roomRef = null;
        }
    }
}
