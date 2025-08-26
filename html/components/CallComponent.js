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
    console.log('[CallComponent] mounted, initial callData:', this.callData, 'isVisible:', this.isVisible);
    this.initializeCall();
    window.addEventListener('message', this.handleNUIMessage);
  },
  watch: {
    isVisible(newVal) {
      console.log('[CallComponent] watch isVisible:', newVal);
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
      console.log('[CallComponent] sendNUICallback:', action, data);
      fetch(`https://bit-smartphone/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(err => console.error('[CallComponent] NUI callback error:', err));
    },

    async initializeCall() {
      console.log('[CallComponent] initializeCall called, callData:', this.callData);
      try {
        this.turnConfig = window.phoneConfig?.videoCalls?.rtcConfig || {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            {
              urls: 'turn:global.relay.metered.ca:80',
              username: window.phoneConfig?.videoCalls?.rtcConfig?.iceServers?.[1]?.username || 'your_username',
              credential: window.phoneConfig?.videoCalls?.rtcConfig?.iceServers?.[1]?.credential || 'your_credential'
            }
          ]
        };
        
        
        if (this.callData.direction === 'incoming' || this.callData.isIncoming === true) {
          this.isIncoming = true;
          this.callStatus = 'incoming';
          this.playRingTone();
        } else {
          this.isIncoming = false;
          this.callStatus = 'ringing';
          this.playRingTone();
          await this.startCall();
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
      console.log('[CallComponent] stopRingTone called');
      
      
      if (this.ringAudio) {
        this.ringAudio.pause();
        this.ringAudio.currentTime = 0;
        this.ringAudio = null;
        console.log('[CallComponent] Component ring audio stopped');
      }
      
      
      try {
        if (window.currentCallAudio && typeof window.currentCallAudio.pause === 'function') {
          window.currentCallAudio.pause();
          window.currentCallAudio.currentTime = 0;
          window.currentCallAudio = null;
          console.log('[CallComponent] Global call audio stopped');
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
            console.log('[CallComponent] Stopped audio element:', audio.src);
          }
        });
      } catch (e) {
        console.warn('Error stopping page audio elements:', e);
      }
    },

    async startCall() {
      try {
        if (this.isVideoCall) {
          await this.initializeWebRTC();
        } else {
          this.sendNUICallback('call:start', {
            targetId: this.callData.targetId,
            type: 'audio'
          });
        }
      } catch (error) {
        console.error('Error starting call:', error);
        this.callStatus = 'failed';
        this.stopRingTone();
      }
    },
    
    async initializeWebRTC() {
      try {
        this.peerConnection = new RTCPeerConnection(this.turnConfig);
        
        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendSignalingMessage('webrtc-ice-candidate', event.candidate);
          }
        };
        
        this.peerConnection.ontrack = (event) => {
          this.remoteStream = event.streams[0];
          if (this.$refs.remoteVideo) {
            this.$refs.remoteVideo.srcObject = this.remoteStream;
          }
        };
        
        this.peerConnection.onconnectionstatechange = () => {
          const state = this.peerConnection.connectionState;
          if (state === 'connected') {
            this.callStatus = 'connected';
            this.startDurationTimer();
          } else if (state === 'disconnected' || state === 'failed') {
            this.endCall();
          }
        };
        
        await this.getUserMedia();
        
        if (this.callData.direction === 'outgoing') {
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          this.sendSignalingMessage('offer', offer);
        }
        
      } catch (error) {
        console.error('Error starting call:', error);
        this.callStatus = 'failed';
      }
    },
    
    async getUserMedia() {
      try {
        const constraints = {
          audio: true,
          video: this.isVideoCall && !this.controls.videoMuted
        };
        
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (this.$refs.localVideo && this.isVideoCall) {
          this.$refs.localVideo.srcObject = this.localStream;
        }
        
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
        
        this.controls.videoEnabled = this.isVideoCall;
        
      } catch (error) {
        console.error('Error accessing media devices:', error);
        if (this.isVideoCall) {
          this.controls.videoMuted = true;
        }
      }
    },
    
    async acceptCall() {
      try {
        this.stopRingTone();
        this.isIncoming = false;
        this.callStatus = 'connecting';
        
        
        if (this.isVideoCall) {
          await this.startCall();
        }
        this.sendSignalingMessage('call-accepted');
      } catch (error) {
        console.error('Error accepting call:', error);
        this.endCall();
      }
    },
    
    rejectCall() {
      this.stopRingTone();
      this.sendSignalingMessage('call-rejected');
      this.endCall();
    },
    
    endCall() {
      this.callStatus = 'ended';
      this.stopRingTone();
      
      
      if (this.durationInterval) {
        console.log('[CallComponent] clearing durationInterval');
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
      
      this.sendSignalingMessage('call-ended');
      
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
      
      
      this.sendNUICallback('call:signaling', {
        callId: this.callData.id,
        type: outType,
        data: data,
        targetId: this.callData.targetId
      });
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
            // Stop ringtone when the other side accepts
            this.stopRingTone();
            // If video call, initialize WebRTC and stay in 'connecting' until negotiated.
            if (this.isVideoCall) {
              this.callStatus = 'connecting';
              try {
                await this.initializeWebRTC();
              } catch (e) {
                console.error('Error initializing WebRTC after accept:', e);
                this.callStatus = 'failed';
              }
            } else {
              // For audio calls, the server handles voice channel setup (pma-voice / saltychat)
              // Mark the UI as connected and start duration timer.
              this.callStatus = 'connected';
              this.startDurationTimer();
            }
            break;
          case 'call-rejected':
          case 'call-ended':
            this.endCall();
            break;
          case 'mute-status':
            // Handle remote mute status
            break;
        }
      } catch (error) {
        console.error('Error handling signaling message:', error);
      }
    },
    
    async handleOffer(offer) {
      // Only process WebRTC offers for video calls
      if (!this.isVideoCall) {
        console.warn('[CallComponent] Received WebRTC offer for non-video call, ignoring');
        return;
      }

      if (!this.peerConnection) {
        await this.startCall();
      }

      await this.peerConnection.setRemoteDescription(offer);

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendSignalingMessage('answer', answer);

      this.iceCandidatesQueue.forEach(candidate => {
        this.peerConnection.addIceCandidate(candidate);
      });
      this.iceCandidatesQueue = [];
    },
    
    async handleAnswer(answer) {
      if (!this.isVideoCall) {
        console.warn('[CallComponent] Received WebRTC answer for non-video call, ignoring');
        return;
      }

      await this.peerConnection.setRemoteDescription(answer);

      this.iceCandidatesQueue.forEach(candidate => {
        this.peerConnection.addIceCandidate(candidate);
      });
      this.iceCandidatesQueue = [];
    },
    
    async handleIceCandidate(candidate) {
      if (!this.isVideoCall) {
        // Ignore ICE candidates for audio calls
        return;
      }

      if (this.peerConnection && this.peerConnection.remoteDescription) {
        await this.peerConnection.addIceCandidate(candidate);
      } else {
        this.iceCandidatesQueue.push(candidate);
      }
    },
    
    handleNUIMessage(event) {
      const { action, data } = event.data;
      
      if (action === 'call:signaling' && data.callId === this.callData.id) {
        this.handleSignalingMessage(data);
      } else if (action === 'call:connected' && data.callId === this.callData.id) {
        this.callStatus = 'connected';
        this.stopRingTone();
        this.startDurationTimer();
      }
    },

    handleMessage(message) {
      console.log('[CallComponent] handleMessage received:', message);
      
      if (!message || !message.action) return;
      
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
    // Remove the empty mounted hook
    // Components should only have one mounted hook
  },
  
  beforeUnmount() {
    console.log('[CallComponent] beforeUnmount - cleaning up');
    // Clear timer and cleanup resources
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
      <!-- Animated Background -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      </div>

      <div :class="[
        'relative backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-500',
        isMinimized ? 'w-80 h-20 rounded-2xl bg-black/60' : (isVideoCall ? 'w-full h-full max-w-4xl max-h-3xl rounded-3xl bg-black/70' : 'w-96 rounded-3xl bg-black/70')
      ]">
        
        <!-- Video Call Layout -->
        <div v-if="isVideoCall && !isMinimized" class="relative h-full">
          <!-- Remote Video -->
          <video
            ref="remoteVideo"
            autoplay
            playsinline
            muted
            class="absolute inset-0 w-full h-full object-cover rounded-3xl"
          />
          
          <!-- Local Video PiP -->
          <div class="absolute top-6 right-6 w-40 h-32 bg-gray-900/90 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl">
            <video
              ref="localVideo"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
            />
          </div>
          
          <!-- Header Info -->
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
          
          <!-- Video Call Controls -->
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
        
        <!-- Audio Call Layout -->
        <div v-else-if="!isVideoCall && !isMinimized" class="relative">
          <div class="relative p-8 text-center text-white min-h-[500px] flex flex-col justify-between">
            <!-- Contact Info -->
            <div class="flex-1 flex flex-col justify-center items-center">
              <!-- Avatar with animated ring for incoming calls -->
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
                
                <!-- Animated ripple effect for incoming calls -->
                <div v-if="isIncoming && callStatus === 'incoming'" class="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-75"></div>
                <div v-if="isIncoming && callStatus === 'incoming'" class="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-50" style="animation-delay: 0.5s;"></div>
              </div>
              
              <h2 class="text-3xl font-bold mb-3">{{ callData.name }}</h2>
              <p class="text-xl text-white/80 mb-8">{{ statusText }}</p>
              
              <!-- Call status indicator -->
              <div v-if="callStatus === 'connecting'" class="flex items-center space-x-2 mb-6">
                <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                <div class="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
              </div>
              
              <!-- Connected indicator -->
              <div v-if="callStatus === 'connected'" class="flex items-center space-x-3 mb-6">
                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span class="text-green-400 font-medium">Conectado</span>
              </div>
            </div>
            
            <!-- Incoming Call Controls -->
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
            
            <!-- Active Call Controls -->
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
            
            <!-- Outgoing/Ringing Call Controls -->
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
        
        <!-- Minimized Call Bar -->
        <div v-if="isMinimized" class="flex items-center justify-between p-4 text-white">
          <div class="flex items-center space-x-3 cursor-pointer" @click="minimizeCall">
            <div class="w-12 h-12 bg-white/10 rounded-full overflow-hidden ring-2 ring-white/30">
              <img :src="callData.avatar" :alt="callData.name" class="w-full h-full object-cover" />
            </div>
            <div>
              <p class="font-semibold text-sm">{{ callData.name }}</p>
              <p class="text-xs text-white/80">{{ statusText }}</p>
            </div>
            <!-- Active call indicator -->
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
        
        <!-- Loading Overlay (only for connecting state) -->
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
