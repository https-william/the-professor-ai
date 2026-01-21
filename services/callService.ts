import Peer from 'peerjs';

export interface CallState {
    status: 'IDLE' | 'INCOMING' | 'CONNECTING' | 'CONNECTED' | 'ENDED';
    remoteStream?: MediaStream;
    remotePeerId?: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    error?: string;
}

class CallService {
    private peer: Peer | null = null;
    private localStream: MediaStream | null = null;
    private currentCall: any = null;
    
    // Callbacks
    private onStateChange: ((state: CallState) => void) | null = null;
    private onIncomingCall: ((callerId: string, answer: () => Promise<void>) => void) | null = null;

    private state: CallState = {
        status: 'IDLE',
        isAudioEnabled: true,
        isVideoEnabled: true
    };

    constructor() {}

    public initialize(userId: string, onStateChange: (state: CallState) => void, onIncomingCall: (callerId: string, answer: () => Promise<void>) => void) {
        // Clean up inputs
        const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        
        console.log("Initializing Peer with ID:", cleanId);

        if (this.peer) this.peer.destroy();

        this.onStateChange = onStateChange;
        this.onIncomingCall = onIncomingCall;

        this.peer = new Peer(cleanId, {
            debug: 2,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        this.peer.on('open', (id) => {
            console.log('Peer Setup Complete. ID:', id);
        });

        this.peer.on('call', (call) => {
            console.log("Incoming Call from:", call.peer);
            this.updateState({ status: 'INCOMING', remotePeerId: call.peer });
            
            // Trigger UI prompt
            if (this.onIncomingCall) {
                this.onIncomingCall(call.peer, async () => {
                    await this.answerCall(call);
                });
            }
        });

        this.peer.on('error', (err) => {
            console.error("Peer Error:", err);
            this.updateState({ error: "Connection Error: " + err.type });
        });
    }

    private updateState(partial: Partial<CallState>) {
        this.state = { ...this.state, ...partial };
        if (this.onStateChange) this.onStateChange(this.state);
    }

    public async startCall(remotePeerId: string) {
        if (!this.peer) return;

        this.updateState({ status: 'CONNECTING', remotePeerId });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.localStream = stream;

            const cleanRemoteId = remotePeerId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const call = this.peer.call(cleanRemoteId, stream);
            this.handleCall(call);
        } catch (e: any) {
            console.error("Start Call Failed:", e);
            this.updateState({ status: 'IDLE', error: "Could not access camera/mic." });
        }
    }

    private async answerCall(call: any) {
        try {
            this.updateState({ status: 'CONNECTING' });
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            this.localStream = stream;
            
            call.answer(stream);
            this.handleCall(call);
        } catch (e) {
            console.error("Answer Call Failed:", e);
            this.updateState({ status: 'IDLE', error: "Could not access camera/mic." });
        }
    }

    private handleCall(call: any) {
        this.currentCall = call;

        call.on('stream', (remoteStream: MediaStream) => {
            console.log("Remote Stream Received");
            this.updateState({ status: 'CONNECTED', remoteStream });
        });

        call.on('close', () => {
            this.endCall();
        });

        call.on('error', (e: any) => {
            console.error("Call Error:", e);
            this.endCall();
        });
    }

    public endCall() {
        if (this.currentCall) this.currentCall.close();
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
        }
        this.currentCall = null;
        this.localStream = null;
        this.updateState({ status: 'IDLE', remoteStream: undefined, remotePeerId: undefined });
    }

    public toggleAudio() {
        if (this.localStream) {
            const track = this.localStream.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                this.updateState({ isAudioEnabled: track.enabled });
            }
        }
    }

    public toggleVideo() {
        if (this.localStream) {
            const track = this.localStream.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                this.updateState({ isVideoEnabled: track.enabled });
            }
        }
    }

    public getLocalStream() {
        return this.localStream;
    }
}

export const callService = new CallService();
