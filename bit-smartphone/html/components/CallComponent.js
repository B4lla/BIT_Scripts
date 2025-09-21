const CallIcons = {
  Phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  PhoneOff: '<path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45m-10.83-5.5L1 1m22 22l-4-4"/>',
  Video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
  VideoOff: '<path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/>',
  Mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  MicOff: '<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  Volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>',
  VolumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
  Minimize: '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>',
  X: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  User: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
};

const CallIcon = {
  props: ['name', 'size'],
  template: '<svg :class="\'w-\' + (size || \'6\') + \' h-\' + (size || \'6\')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="icons[name]"></svg>',
  data: () => ({ icons: CallIcons })
};

const CallComponent = {
  name: 'CallComponent',
  components: { CallIcon },
  props: {
    callData: {
      type: Object,
      required: true
    },
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['end-call', 'toggle-mute', 'toggle-speaker', 'toggle-video', 'minimize'],
  mounted() {
    
    this.initializeCall();
    window.addEventListener('message', this.handleNUIMessage);
  },
  watch: {
    isVisible(newVal) {
      
      if (newVal) {
        
        this.endCall();
        this.initializeCall();
      }
    }
  },
  data() {
    return {
      isIncoming: false,
      callStatus: 'connecting',
      callDuration: 0,
      durationInterval: null,
      isMinimized: false,
      ringAudio: null,
      
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      iceCandidatesQueue: [],
      
      controls: {
        muted: false,
        speaker: false,
        videoEnabled: false,
        videoMuted: false
      },
      
      turnConfig: null
    }
  },
  
  computed: {
    formattedDuration() {
      const minutes = Math.floor(this.callDuration / 60);
      const seconds = this.callDuration % 60;
      return minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    },
    
    isVideoCall() {
      return this.callData.type === 'video';
    },
    
    statusText() {
      switch (this.callStatus) {
        case 'incoming': return 'Llamada entrante...';
        case 'ringing': return 'Llamando...';
        case 'connecting': return 'Conectando...';
        case 'connected': return this.formattedDuration;
        case 'ended': return 'Llamada terminada';
        case 'failed': return 'Llamada fallida';
        default: return '';
      }
    }
  },
  
  methods: {
    sendNUICallback(action, data) {
      
      fetch(`https://bit-smartphone/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(err => console.error('[CallComponent] NUI callback error:', err));
    },

    async initializeCall() {
      console.log('[CallComponent] Initializing call:', this.callData);
      
      try {
        this.turnConfig = window.phoneConfig?.videoCalls?.rtcConfig || {
          iceServers: [
            { urls: 'stun:stun.relay.metered.ca:80' },
            {
              urls: 'turn:global.relay.metered.ca:80',
              username: '8236c324acc46422b0c2a481',
              credential: 'wIgbfMWQ3LJUBuHN'
            },
            {
              urls: 'turn:global.relay.metered.ca:80?transport=tcp',
              username: '8236c324acc46422b0c2a481', 
              credential: 'wIgbfMWQ3LJUBuHN'
            }
          ]
        };
        
        if (this.callData.direction === 'incoming' || this.callData.isIncoming === true) {
          this.isIncoming = true;
          this.callStatus = 'incoming';
          this.playRingTone();
          console.log('[CallComponent] Incoming call setup complete');
        } else {
          this.isIncoming = false;
          this.callStatus = 'ringing';
          this.playRingTone();
          await this.startCall();
          console.log('[CallComponent] Outgoing call setup complete');
        }
      } catch (error) {
        console.error('[CallComponent] Error initializing call:', error);
        this.callStatus = 'failed';
        this.stopRingTone();
      }
    },

    playRingTone() {
      try {
        
        this.stopRingTone();
        
        const audioSrc = this.callData.direction === 'incoming' 
          ? './assets/sounds/calls/1.mp3' 
          : './assets/sounds/calls/2.mp3';
        
        this.ringAudio = new Audio(audioSrc);
        this.ringAudio.loop = true;
        this.ringAudio.volume = 0.7;
        this.ringAudio.play().catch(e => console.warn('Could not play ring tone:', e));
        
        
        window.currentCallAudio = this.ringAudio;
      } catch (error) {
        console.error('Error playing ring tone:', error);
      }
    },

    stopRingTone() {
      
      
      
      if (this.ringAudio) {
        this.ringAudio.pause();
        this.ringAudio.currentTime = 0;
        this.ringAudio = null;
        
      }
      
      
      try {
        if (window.currentCallAudio && typeof window.currentCallAudio.pause === 'function') {
          window.currentCallAudio.pause();
          window.currentCallAudio.currentTime = 0;
          window.currentCallAudio = null;
          
        }
      } catch (e) {
        console.warn('Error clearing global call audio:', e);
      }
      
      
      try {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
          if (audio.src && (audio.src.includes('calls/') || audio.loop)) {
            audio.pause();
            audio.currentTime = 0;
            
          }
        });
      } catch (e) {
        console.warn('Error stopping page audio elements:', e);
      }
    },

    async startCall() {
      try {
        console.log('[CallComponent] Starting call, type:', this.callData.type);
        
        this.sendNUICallback('call:start', {
          targetId: this.callData.targetId,
          type: this.callData.type
        });
        
        console.log('[CallComponent] Call initiation sent to server');
        
      } catch (error) {
        console.error('Error starting call:', error);
        this.callStatus = 'failed';
        this.stopRingTone();
      }
    },
    
    async initializeWebRTC() {
      try {
        console.log('[CallComponent] Initializing WebRTC with config:', this.turnConfig);
        this.peerConnection = new RTCPeerConnection(this.turnConfig);
        
        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('[CallComponent] Sending ICE candidate');
            this.sendWebRTCMessage('webrtc-ice-candidate', event.candidate);
          }
        };
        
        this.peerConnection.ontrack = (event) => {
          console.log('[CallComponent] Remote track received');
          this.remoteStream = event.streams[0];
          if (this.$refs.remoteVideo) {
            this.$refs.remoteVideo.srcObject = this.remoteStream;
          }
        };
        
        this.peerConnection.onconnectionstatechange = () => {
          const state = this.peerConnection.connectionState;
          console.log('[CallComponent] Connection state changed:', state);
          if (state === 'connected') {
            this.callStatus = 'connected';
            this.startDurationTimer();
          } else if (state === 'disconnected' || state === 'failed') {
            console.error('[CallComponent] WebRTC connection failed');
            this.endCall();
          }
        };
        
        this.peerConnection.onicegatheringstatechange = () => {
          console.log('[CallComponent] ICE gathering state:', this.peerConnection.iceGatheringState);
        };
        
        console.log('[CallComponent] WebRTC initialized successfully');
        
      } catch (error) {
        console.error('[CallComponent] Error initializing WebRTC:', error);
        this.callStatus = 'failed';
        throw error;
      }
    },
    
    async getUserMedia() {
      try {
        const constraints = {
          audio: true,
          video: this.isVideoCall && !this.controls.videoMuted
        };
        
        console.log('[CallComponent] Requesting getUserMedia with constraints:', constraints);
        console.log('[CallComponent] Is video call:', this.isVideoCall);
        console.log('[CallComponent] Video muted:', this.controls.videoMuted);
        
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[CallComponent] Successfully got user media stream');
        
        if (this.$refs.localVideo && this.isVideoCall) {
          this.$refs.localVideo.srcObject = this.localStream;
          console.log('[CallComponent] Set local video element source');
        }
        
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
          console.log('[CallComponent] Added track to peer connection:', track.kind);
        });
        
        this.controls.videoEnabled = this.isVideoCall;
        console.log('[CallComponent] Video enabled control set to:', this.controls.videoEnabled);
        
      } catch (error) {
        console.error('[CallComponent] Error accessing media devices:', error);
        console.error('[CallComponent] Error name:', error.name);
        console.error('[CallComponent] Error message:', error.message);
        
        if (error.name === 'NotAllowedError') {
          console.error('[CallComponent] Permission denied for camera/microphone');
        } else if (error.name === 'NotFoundError') {
          console.error('[CallComponent] Camera/microphone not found');
        } else if (error.name === 'NotReadableError') {
          console.error('[CallComponent] Camera/microphone already in use');
        }
        
        if (this.isVideoCall) {
          this.controls.videoMuted = true;
          console.log('[CallComponent] Video muted due to error');
        }
      }
    },
    
    async acceptCall() {
      try {
        this.stopRingTone();
        this.isIncoming = false;
        this.callStatus = 'connecting';
        
        console.log('[CallComponent] Sending call:accept with data:', {
          callId: this.callData.id,
          targetId: this.callData.targetId
        });
        
        this.sendNUICallback('call:accept', {
          callId: this.callData.id,
          targetId: this.callData.targetId
        });
        
        console.log('[CallComponent] Call accepted, waiting for WebRTC negotiation...');
        
      } catch (error) {
        console.error('Error accepting call:', error);
        this.endCall();
      }
    },
    
    rejectCall() {
      this.stopRingTone();
      
      this.sendNUICallback('call:reject', {
        callId: this.callData.id,
        targetId: this.callData.targetId
      });
      
      this.endCall();
    },
    
    endCall() {
      this.callStatus = 'ended';
      this.stopRingTone();
      
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }
      
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }
      
      this.iceCandidatesQueue = [];
      
      this.sendNUICallback('call:end', {
        callId: this.callData.id
      });
      
      setTimeout(() => {
        this.$emit('end-call');
      }, 1000);
    },
    
    toggleMute() {
      if (this.localStream) {
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          this.controls.muted = !audioTrack.enabled;
          this.$emit('toggle-mute', this.controls.muted);
        }
      } else {
        
        this.controls.muted = !this.controls.muted;
        this.$emit('toggle-mute', this.controls.muted);
        
        
        this.sendNUICallback('call:mute', {
          callId: this.callData.id,
          muted: this.controls.muted
        });
      }
    },
    
    toggleSpeaker() {
      this.controls.speaker = !this.controls.speaker;
      this.$emit('toggle-speaker', this.controls.speaker);
    },
    
    async toggleVideo() {
      if (!this.isVideoCall) return;
      
      try {
        if (this.controls.videoMuted) {
          const videoConstraints = { video: true };
          const newStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
          const videoTrack = newStream.getVideoTracks()[0];
          
          const sender = this.peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          } else {
            this.peerConnection.addTrack(videoTrack, this.localStream);
          }
          
          if (this.$refs.localVideo) {
            this.$refs.localVideo.srcObject = this.localStream;
          }
          
          this.controls.videoMuted = false;
        } else {
          const videoTrack = this.localStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            this.localStream.removeTrack(videoTrack);
          }
          this.controls.videoMuted = true;
        }
        
        this.$emit('toggle-video', !this.controls.videoMuted);
      } catch (error) {
        console.error('Error toggling video:', error);
      }
    },
    
    minimizeCall() {
      this.isMinimized = !this.isMinimized;
      this.$emit('minimize', this.isMinimized);
    },
    
    startDurationTimer() {
      
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }
      this.durationInterval = setInterval(() => {
        this.callDuration++;
      }, 1000);
    },
    
    sendSignalingMessage(type, data = null) {
      let outType = type;
      if (type === 'offer' || type === 'answer' || type === 'ice-candidate') {
        outType = 'webrtc-' + type;
      }
      
      this.sendWebRTCMessage(outType, data);
    },

    getCallId() {
      try {
        if (!this.callData) return null;
        return this.callData.id || this.callData.callId || null;
      } catch (e) {
        return null;
      }
    },
    
    sendNUICallback(action, data) {
      fetch(`https://bit-smartphone/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(error => console.error('NUI callback error:', error));
    },
    
    async handleSignalingMessage(message) {
      try {
        switch (message.type) {
          case 'webrtc-offer':
          case 'offer':
            await this.handleOffer(message.data);
            break;
          case 'webrtc-answer':
          case 'answer':
            await this.handleAnswer(message.data);
            break;
          case 'webrtc-ice-candidate':
          case 'ice-candidate':
            await this.handleIceCandidate(message.data);
            break;
          case 'call-accepted':
            console.log('[CallComponent] Call accepted');
            this.stopRingTone();
            if (this.isVideoCall) {
              this.callStatus = 'connecting';
              try {
                await this.initializeWebRTC();
              } catch (e) {
                console.error('Error initializing WebRTC after accept:', e);
                this.callStatus = 'failed';
              }
            } else {
              this.callStatus = 'connected';
              this.startDurationTimer();
              console.log('[CallComponent] Audio call connected');
            }
            break;
          case 'call-rejected':
          case 'call-ended':
            this.endCall();
            break;
          case 'mute-status':
            break;
        }
      } catch (error) {
        console.error('Error handling signaling message:', error);
      }
    },
    
    async handleOffer(offer) {
      if (!this.isVideoCall) {
        return;
      }

      try {
        if (!this.peerConnection) {
          await this.initializeWebRTC();
          await this.getUserMedia();
        }

        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.sendSignalingMessage('answer', answer);

        this.iceCandidatesQueue.forEach(candidate => {
          this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
        this.iceCandidatesQueue = [];
      } catch (error) {
        console.error('Error handling offer:', error);
        this.callStatus = 'failed';
      }
    },
    
    async handleAnswer(answer) {
      if (!this.isVideoCall) {
        return;
      }

      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

        this.iceCandidatesQueue.forEach(candidate => {
          this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
        this.iceCandidatesQueue = [];
      } catch (error) {
        console.error('Error handling answer:', error);
        this.callStatus = 'failed';
      }
    },
    
    async handleIceCandidate(candidate) {
      if (!this.isVideoCall) {
        return;
      }

      try {
        if (this.peerConnection && this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          this.iceCandidatesQueue.push(candidate);
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    },
    
    handleNUIMessage(event) {
      const { action, data } = event.data;
      
      console.log('[CallComponent] NUI Message:', action, data);
      
      const localCallId = this.getCallId();
      
      if (action === 'call:signaling' && data.callId === localCallId) {
        this.handleSignalingMessage(data);
      } else if (action === 'call:connected' && data.callId === localCallId) {
        console.log('[CallComponent] Call connected from NUI');
        this.callStatus = 'connected';
        this.stopRingTone();
        this.startDurationTimer();
      } else if (action === 'call:ended' && data.callId === localCallId) {
        console.log('[CallComponent] Call ended from NUI');
        this.endCall();
      } else if (action === 'webrtc:start-negotiation' && data.callId === localCallId) {
        console.log('[CallComponent] Starting WebRTC negotiation, isInitiator:', data.isInitiator);
        this.startWebRTCNegotiation(data.isInitiator, data.rtcConfig, data.constraints);
      } else if (action === 'webrtc:message' && data.callId === localCallId) {
        console.log('[CallComponent] WebRTC message received:', data.type);
        this.handleWebRTCMessage(data.type, data.data);
      }
    },

    async startWebRTCNegotiation(isInitiator, rtcConfig, constraints) {
      try {
        console.log('[CallComponent] Starting WebRTC with config:', rtcConfig);
        
        this.turnConfig = rtcConfig || this.turnConfig;
        
        if (!this.peerConnection) {
          await this.initializeWebRTC();
        }
        
        const mediaConstraints = {
          audio: constraints?.audio || { echoCancellation: true, noiseSuppression: true },
          video: this.isVideoCall ? (constraints?.video || { width: 640, height: 480 }) : false
        };
        
        this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        
        if (this.$refs.localVideo && this.isVideoCall) {
          this.$refs.localVideo.srcObject = this.localStream;
        }
        
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
        
        if (isInitiator) {
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          
          this.sendWebRTCMessage('webrtc-offer', offer);
        }
        
      } catch (error) {
        console.error('[CallComponent] Error in WebRTC negotiation:', error);
        this.callStatus = 'failed';
      }
    },

    async handleWebRTCMessage(type, data) {
      try {
        if (!this.peerConnection) {
          console.warn('[CallComponent] No peer connection for WebRTC message:', type);
          return;
        }
        
        switch (type) {
          case 'webrtc-offer':
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            this.sendWebRTCMessage('webrtc-answer', answer);
            break;
            
          case 'webrtc-answer':
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data));
            break;
            
          case 'webrtc-ice-candidate':
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(data));
            break;
            
          default:
            console.warn('[CallComponent] Unknown WebRTC message type:', type);
        }
      } catch (error) {
        console.error('[CallComponent] Error handling WebRTC message:', error);
      }
    },

    sendWebRTCMessage(type, data) {
      fetch('https://bit-smartphone/call:signaling', {
        method: 'POST',
        body: JSON.stringify({
          callId: this.getCallId(),
          type: type,
          data: data
        })
      }).catch(console.error);
    },

    handleMessage(message) {
      
      
      if (!message || !message.action) return;
      
      if (message.data) {
        this.callData = { ...this.callData, ...message.data };
        console.log('[CallComponent] Updated callData:', this.callData);
      }
      
      switch (message.action) {
        case 'call:incoming':
          this.isIncoming = true;
          this.callStatus = 'incoming';
          break;
          
        case 'call:outgoing':
          this.isIncoming = false;
          this.callStatus = 'ringing';
          break;
          
        case 'call:signaling':
          this.handleSignalingMessage(message.data);
          break;
          
        case 'call:accepted':
          this.callStatus = 'connected';
          this.stopRingTone();
          this.startDurationTimer();
          break;
          
        case 'call:connected':
          this.callStatus = 'connected';
          this.stopRingTone();
          this.startDurationTimer();
          break;
          
        case 'call:ended':
        case 'call:timeout':
        case 'call:failed':
          this.endCall();
          break;
      }
    }
  },
  
  async mounted() {

  },
  
  beforeUnmount() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    this.stopRingTone();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    window.removeEventListener('message', this.handleNUIMessage);
  },
  
  template: `
    <div v-if="isVisible" class="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-slate-800 to-black flex items-center justify-center">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      </div>

      <div :class="[
        'relative backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-500',
        isMinimized ? 'w-80 h-20 rounded-2xl bg-black/60' : (isVideoCall ? 'w-full h-full max-w-4xl max-h-3xl rounded-3xl bg-black/70' : 'w-96 rounded-3xl bg-black/70')
      ]">
        
        <div v-if="isVideoCall && !isMinimized" class="relative h-full">
          <video
            ref="remoteVideo"
            autoplay
            playsinline
            muted
            class="absolute inset-0 w-full h-full object-cover rounded-3xl"
          />
          
          <div class="absolute top-6 right-6 w-40 h-32 bg-gray-900/90 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
            <video
              ref="localVideo"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
            />
          </div>
          
          <div class="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6">
            <div class="flex items-center justify-between text-white">
              <div class="flex items-center space-x-4">
                <div class="w-14 h-14 bg-white/10 rounded-full overflow-hidden ring-2 ring-white/30">
                  <img :src="callData.avatar" :alt="callData.name" class="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 class="font-bold text-xl">{{ callData.name }}</h3>
                  <p class="text-sm text-white/90">{{ statusText }}</p>
                </div>
              </div>
              
              <button @click="minimizeCall" class="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all duration-200">
                <CallIcon name="Minimize" size="5" />
              </button>
            </div>
          </div>
          
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
            <div class="flex items-center justify-center space-x-6">
              <button
                @click="toggleMute"
                :class="[
                  'p-4 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg',
                  controls.muted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                ]"
              >
                <CallIcon :name="controls.muted ? 'MicOff' : 'Mic'" size="6" />
              </button>
              
              <button
                @click="toggleVideo"
                :class="[
                  'p-4 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg',
                  controls.videoMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                ]"
              >
                <CallIcon :name="controls.videoMuted ? 'VideoOff' : 'Video'" size="6" />
              </button>
              
              <button
                @click="toggleSpeaker"
                :class="[
                  'p-4 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg',
                  controls.speaker ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                ]"
              >
                <CallIcon :name="controls.speaker ? 'Volume' : 'VolumeX'" size="6" />
              </button>
              
              <button
                @click="endCall"
                class="p-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl"
              >
                <CallIcon name="PhoneOff" size="7" />
              </button>
            </div>
          </div>
        </div>
        
        <div v-else-if="!isVideoCall && !isMinimized" class="relative">
          <div class="relative p-8 text-center text-white min-h-[500px] flex flex-col justify-between">
            <div class="flex-1 flex flex-col justify-center items-center">
              <div :class="[
                'relative mb-8 transition-all duration-500',
                isIncoming && callStatus === 'incoming' ? 'animate-pulse' : ''
              ]">
                <div :class="[
                  'w-32 h-32 rounded-full overflow-hidden shadow-2xl transition-all duration-300',
                  isIncoming && callStatus === 'incoming' ? 'ring-4 ring-green-400 ring-opacity-60' : 'ring-2 ring-white/30'
                ]">
                  <img :src="callData.avatar" :alt="callData.name" class="w-full h-full object-cover" />
                </div>
                
                <div v-if="isIncoming && callStatus === 'incoming'" class="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                <div v-if="isIncoming && callStatus === 'incoming'" class="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-50" style="animation-delay: 0.5s;"></div>
              </div>
              
              <h2 class="text-3xl font-bold mb-3">{{ callData.name }}</h2>
              <p class="text-xl text-white/80 mb-8">{{ statusText }}</p>
              
              <div v-if="callStatus === 'connecting'" class="flex items-center space-x-2 mb-6">
                <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
              </div>
              
              <div v-if="callStatus === 'connected'" class="flex items-center space-x-3 mb-6">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-green-400 font-medium">Conectado</span>
              </div>
            </div>
            
            <div v-if="isIncoming && callStatus === 'incoming'" class="flex justify-center space-x-12 mb-8">
              <button
                @click="rejectCall"
                class="group p-6 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl"
              >
                <CallIcon name="PhoneOff" size="8" class="group-hover:rotate-12 transition-transform" />
              </button>
              
              <button
                @click="acceptCall"
                class="group p-6 bg-green-500 hover:bg-green-600 rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl"
              >
                <CallIcon name="Phone" size="8" class="group-hover:-rotate-12 transition-transform" />
              </button>
            </div>
            
            <div v-else-if="callStatus === 'connected'" class="flex items-center justify-center space-x-6 mb-4">
              <button
                @click="toggleMute"
                :class="[
                  'p-4 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg',
                  controls.muted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                ]"
              >
                <CallIcon :name="controls.muted ? 'MicOff' : 'Mic'" size="6" />
              </button>
              
              <button
                @click="toggleSpeaker"
                :class="[
                  'p-4 rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg',
                  controls.speaker ? 'bg-blue-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                ]"
              >
                <CallIcon :name="controls.speaker ? 'Volume' : 'VolumeX'" size="6" />
              </button>
              
              <button
                @click="minimizeCall"
                class="p-4 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all duration-300 transform hover:scale-110 shadow-lg"
              >
                <CallIcon name="Minimize" size="6" />
              </button>
              
              <button
                @click="endCall"
                class="p-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl"
              >
                <CallIcon name="PhoneOff" size="7" />
              </button>
            </div>
            
            <div v-else-if="callStatus === 'ringing'" class="flex justify-center mb-4">
              <button
                @click="endCall"
                class="p-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl"
              >
                <CallIcon name="PhoneOff" size="7" />
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="isMinimized" class="flex items-center justify-between p-4 text-white">
          <div class="flex items-center space-x-3 cursor-pointer" @click="minimizeCall">
            <div class="w-12 h-12 bg-white/10 rounded-full overflow-hidden ring-2 ring-white/30">
              <img :src="callData.avatar" :alt="callData.name" class="w-full h-full object-cover" />
            </div>
            <div>
              <p class="font-semibold text-sm">{{ callData.name }}</p>
              <p class="text-xs text-white/80">{{ statusText }}</p>
            </div>
            <div v-if="callStatus === 'connected'" class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              v-if="callStatus === 'connected'"
              @click="toggleMute"
              :class="[
                'p-2 rounded-xl transition-all duration-200',
                controls.muted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              ]"
            >
              <CallIcon :name="controls.muted ? 'MicOff' : 'Mic'" size="4" />
            </button>
            
            <button
              @click="endCall"
              class="p-2 bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-200"
            >
              <CallIcon name="PhoneOff" size="4" />
            </button>
          </div>
        </div>
        
        <div v-if="callStatus === 'connecting' && !isMinimized" class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
          <div class="text-center text-white">
            <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-lg font-medium">Conectando...</p>
          </div>
        </div>
      </div>
    </div>
  `
};
