
import { Peer, MediaConnection } from 'peerjs';

export class CallService {
    private peer: Peer | null = null;
    private myStream: MediaStream | null = null;
    private calls: Map<string, MediaConnection> = new Map();
    public peerId: string | null = null;

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
            
            // Use a deterministic ID for The Professor demo so users can find each other easier
            // In prod, this would be just `cleanId`. 
            // For now, we append a suffix only if collision, but PeerJS throws error on collision.
            // Let's rely on the Auth ID being unique.
            const finalId = cleanId;

            this.peer = new Peer(finalId, {
                debug: 1,
            });

            this.peer.on('open', (id) => {
                console.log('My PeerJS ID is:', id);
                this.peerId = id;
                resolve(id);
            });

            this.peer.on('call', (call) => {
                console.log("Incoming call from:", call.peer);
                if (this.onIncomingCall) {
                    this.onIncomingCall(call);
                } else {
                    // Fallback: Reject if no UI handler
                    call.close();
                }
            });

            this.peer.on('error', (err) => {
                console.warn('PeerJS Error (Non-Fatal):', err.type);
                if (err.type === 'unavailable-id') {
                    // ID taken, maybe we are already connected or tab refresh
                    resolve(finalId);
                }
            });
        });
    }

    /**
     * Start Local Media Stream (Mic/Cam)
     */
    async getMedia(video: boolean = false, audio: boolean = true): Promise<MediaStream> {
        try {
            if (this.myStream) return this.myStream;
            
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
     * Toggle Audio (Enabled = Unmuted)
     */
    toggleAudio(enabled: boolean) {
        if (this.myStream) {
            this.myStream.getAudioTracks().forEach(track => track.enabled = enabled);
        }
    }

    /**
     * Toggle Video (Enabled = Visible)
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
        // Don't destroy peer ID on hangup, just the calls
        this.calls.forEach(call => call.close());
        this.calls.clear();
    }
}

export const callService = new CallService();
