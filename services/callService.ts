
import { Peer, MediaConnection } from 'peerjs';

export class CallService {
    private peer: Peer | null = null;
    private myStream: MediaStream | null = null;
    private calls: Map<string, MediaConnection> = new Map();
    private peerId: string | null = null;

    // Events
    public onIncomingCall: ((call: MediaConnection) => void) | null = null;
    public onStream: ((remotePeerId: string, stream: MediaStream) => void) | null = null;
    public onPeerClose: ((remotePeerId: string) => void) | null = null;

    constructor() {}

    /**
     * Initialize PeerJS connection
     * @param userId Unique ID for this user (must be sanitized for URL safety)
     */
    async initialize(userId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            // Clean ID: Remove spaces and special chars
            const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
            
            // Generate a slightly random ID to prevent collisions in same-name test cases
            // But ideally, it should be deterministic if we want people to call by name
            // For now, we rely on the caller knowing the ID or broadcasting it via Firebase/Hub
            const finalId = `${cleanId}_${Math.floor(Math.random() * 10000)}`;

            this.peer = new Peer(finalId, {
                debug: 2,
            });

            this.peer.on('open', (id) => {
                console.log('My PeerJS ID is:', id);
                this.peerId = id;
                resolve(id);
            });

            this.peer.on('call', (call) => {
                // Handle incoming call
                console.log("Incoming call from:", call.peer);
                if (this.onIncomingCall) {
                    this.onIncomingCall(call);
                } else {
                    // Auto-answer if no handler (fallback)
                    if (this.myStream) call.answer(this.myStream);
                }
                this.setupCallEvents(call);
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS Error:', err);
                reject(err);
            });
        });
    }

    /**
     * Start Local Media Stream (Mic/Cam)
     */
    async getMedia(video: boolean = false, audio: boolean = true): Promise<MediaStream> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video, audio });
            this.myStream = stream;
            return stream;
        } catch (err) {
            console.error("Failed to get media:", err);
            throw err;
        }
    }

    /**
     * Call a remote peer
     */
    callUser(remotePeerId: string) {
        if (!this.peer || !this.myStream) {
            console.warn("Peer not ready or no stream.");
            return;
        }
        
        const call = this.peer.call(remotePeerId, this.myStream);
        this.setupCallEvents(call);
    }

    /**
     * Answer an incoming call
     */
    answerCall(call: MediaConnection) {
        if (this.myStream) {
            call.answer(this.myStream);
            this.setupCallEvents(call);
        }
    }

    /**
     * Toggle Mute
     */
    toggleAudio(enabled: boolean) {
        if (this.myStream) {
            this.myStream.getAudioTracks().forEach(track => track.enabled = enabled);
        }
    }

    /**
     * Toggle Video
     */
    toggleVideo(enabled: boolean) {
        if (this.myStream) {
            this.myStream.getVideoTracks().forEach(track => track.enabled = enabled);
        }
    }

    /**
     * Clean up specific call events
     */
    private setupCallEvents(call: MediaConnection) {
        this.calls.set(call.peer, call);

        call.on('stream', (remoteStream) => {
            console.log("Received stream from:", call.peer);
            if (this.onStream) {
                this.onStream(call.peer, remoteStream);
            }
        });

        call.on('close', () => {
            console.log("Call closed with:", call.peer);
            this.calls.delete(call.peer);
            if (this.onPeerClose) this.onPeerClose(call.peer);
        });

        call.on('error', (err) => {
            console.error("Call error:", err);
            this.calls.delete(call.peer);
        });
    }

    /**
     * Destroy connection
     */
    disconnect() {
        if (this.myStream) {
            this.myStream.getTracks().forEach(track => track.stop());
            this.myStream = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.calls.clear();
    }
}

export const callService = new CallService();
