const NotchNotification = {
  name: 'NotchNotification',
  props: {
    musicState: {
      type: Object,
      required: true
    },
    notifications: {
      type: Array,
      default: () => []
    },
    t: {
      type: Function,
      required: true
    }
  },
  emits: ['dismiss-notification', 'tap-notification'],
  data() {
    return {
      currentNotification: null,
      notificationQueue: [],
      showNotification: false,
      waveHeights: [3, 8, 5, 12, 7, 15, 4, 10, 6, 13, 9, 11],
      animationFrame: null
    };
  },
  computed: {
    notchWidth() {
      if (this.musicState.isPlaying && this.musicState.track && !this.showNotification) {
        return 'w-56'; 
      }
      return this.showNotification ? 'w-64' : 'w-40'; 
    },
    notchHeight() {
      if (this.musicState.isPlaying && this.musicState.track && !this.showNotification) {
        return 'h-10'; 
      }
      return this.showNotification ? 'h-12' : 'h-8'; 
    },
    shouldShowWaves() {
      return this.musicState.isPlaying && this.musicState.track && !this.showNotification;
    },
    shouldShowMusicInfo() {
      return this.musicState.track && !this.showNotification;
    }
  },
  watch: {
    notifications: {
      handler(newNotifications) {
        if (newNotifications.length > 0) {
          this.processNotifications(newNotifications);
        }
      },
      deep: true
    },
    'musicState.isPlaying'(isPlaying) {
      if (isPlaying) {
        this.startWaveAnimation();
      } else {
        this.stopWaveAnimation();
      }
    }
  },
  methods: {
    processNotifications(notifications) {
      const unprocessed = notifications.filter(n => !n.processed);
      if (unprocessed.length > 0) {
        this.notificationQueue.push(...unprocessed);
        if (!this.showNotification) {
          this.showNextNotification();
        }
      }
    },
    
    showNextNotification() {
      if (this.notificationQueue.length === 0) return;
      this.currentNotification = this.notificationQueue.shift();
      this.showNotification = true;
      
      const soundUrl = window.notificationSoundUrl || './assets/sounds/ding.mp3';
      const audio = new Audio(soundUrl);
      audio.play().catch(e => console.warn('Error al reproducir sonido de notificación:', e));
      
      setTimeout(() => {
        this.dismissCurrentNotification();
      }, 4000);
    },
    
    dismissCurrentNotification() {
      if (this.currentNotification) {
        this.$emit('dismiss-notification', this.currentNotification.id);
        this.showNotification = false;
        this.currentNotification = null;
        
        
        setTimeout(() => {
          this.showNextNotification();
        }, 500);
      }
    },
    
    handleNotificationTap() {
      if (this.currentNotification) {
        this.$emit('tap-notification', this.currentNotification);
        this.dismissCurrentNotification();
      }
    },
    
    startWaveAnimation() {
      const animate = () => {
        this.waveHeights = this.waveHeights.map(() => 
          Math.random() * 12 + 3 
        );
        this.animationFrame = requestAnimationFrame(animate);
      };
      animate();
    },
    
    stopWaveAnimation() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      
      this.waveHeights = this.waveHeights.map(() => 3);
    },
    
    formatTrackInfo(track) {
      if (!track) return '';
      return track.title + ' - ' + track.artist;
    },
    
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return mins + ':' + secs.toString().padStart(2, '0');
    }
  },
  
  mounted() {
    if (this.musicState.isPlaying) {
      this.startWaveAnimation();
    }
  },
  
  beforeUnmount() {
    this.stopWaveAnimation();
  },
  
  template: `
    <div class="absolute inset-x-0 top-14 z-50 flex flex-col items-center pointer-events-none">
      
      <div v-if="shouldShowWaves" class="flex items-center gap-0.5 mb-2 pointer-events-auto">
        <div v-for="(height, index) in waveHeights.slice(0, 4)" :key="index"
             class="bg-gradient-to-b from-green-400 to-green-600 rounded-full transition-all duration-150 ease-in-out shadow-sm"
             :style="{ width: '1.5px', height: height * 0.8 + 'px', opacity: 0.8 + (Math.random() * 0.2) }">
        </div>
      </div>

      
      <transition name="notification-slide" appear>
        <div v-if="showNotification && currentNotification"
             @click="handleNotificationTap"
             class="flex items-center px-4 py-2 bg-black/90 rounded-full shadow-xl border border-white/10 w-fit pointer-events-auto cursor-pointer hover:bg-gray-800/80 transition-colors backdrop-blur-[2px]">
          
          <div class="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden mr-3 bg-white/10 flex items-center justify-center">
            <img v-if="currentNotification.icon" 
                 :src="currentNotification.icon" 
                 :alt="currentNotification.app"
                 class="w-full h-full object-cover">
            <div v-else 
                 class="w-full h-full bg-blue-500 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="text-white text-sm font-semibold truncate">
              {{ currentNotification.title }}
            </div>
            <div class="text-gray-300 text-xs truncate mt-0.5">
              {{ currentNotification.message }}
            </div>
          </div>
          
          <div class="flex-shrink-0 ml-2">
            <div class="text-gray-400 text-xs font-mono">
              {{ currentNotification.time || 'now' }}
            </div>
          </div>
        </div>
      </transition>

      
      <div v-if="shouldShowMusicInfo && !showNotification" class="flex items-center gap-1 pointer-events-auto">
        <div class="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
        <div class="text-white text-sm font-semibold truncate pointer-events-none">{{ formatTrackInfo(musicState.track) }}</div>
        <div class="text-gray-400 text-xs font-mono ml-2 pointer-events-none">{{ formatTime(musicState.currentTime) }}</div>
      </div>
    </div>
  `
};