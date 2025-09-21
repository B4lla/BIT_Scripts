const NotchNotification = {
  name: 'NotchNotification',
  props: {
    musicState: { type: Object, required: true },
    notifications: { type: Array, default: () => [] },
    t: { type: Function, required: true }
  },
  emits: ['dismiss-notification', 'tap-notification'],
  data() {
    return {
      currentNotification: null,
      notificationQueue: [],
      showNotification: false,
      waveHeights: [3,8,5,12,7,15,4,10,6,13,9,11],
      animationFrame: null
    };
  },
  computed: {
    shouldShowWaves() {
      return this.musicState && this.musicState.isPlaying && this.musicState.track && !this.showNotification;
    },
    shouldShowMusicInfo() {
      return this.musicState && this.musicState.track && !this.showNotification;
    }
  },
  watch: {
    notifications: {
      handler(newNotifications) {
        if (Array.isArray(newNotifications) && newNotifications.length) this.processNotifications(newNotifications);
      },
      deep: true
    },
    'musicState.isPlaying'(isPlaying) {
      if (isPlaying) this.startWaveAnimation(); else this.stopWaveAnimation();
    }
  },
  methods: {
    processNotifications(notifications) {
      const unprocessed = notifications.filter(n => !n.processed);
      if (unprocessed.length) {
        this.notificationQueue.push(...unprocessed);
        if (!this.showNotification) this.showNextNotification();
      }
    },
    showNextNotification() {
      if (!this.notificationQueue.length) return;
      this.currentNotification = this.notificationQueue.shift();
      this.showNotification = true;
      const soundUrl = window.notificationSoundUrl || './assets/sounds/ding.mp3';

      const enqueueSoundForGesture = (src, vol) => {
        try {
          window.notificationPlayQueue = window.notificationPlayQueue || [];
          window.notificationPlayQueue.push({ src, volume: vol });
          if (!window.__bit_smartphone_notification_gesture_registered) {
            window.__bit_smartphone_notification_gesture_registered = true;
            window.__bit_smartphone_notification_gesture = () => {
              try {
                const q = window.notificationPlayQueue || [];
                while (q.length) {
                  const item = q.shift();
                  try {
                    const a = document.createElement('audio');
                    a.src = item.src;
                    a.volume = (typeof item.volume !== 'undefined') ? Number(item.volume) : 0.6;
                    a.autoplay = true; a.playsInline = true; a.style.display = 'none';
                    document.body.appendChild(a);
                    a.addEventListener('ended', () => { try { a.remove(); } catch(e){} });
                    setTimeout(() => { try { a.remove(); } catch(e){} }, 8000);
                    a.play().catch(() => {});
                  } catch (e) {}
                }
              } catch (e) {}
            };
            document.addEventListener('click', window.__bit_smartphone_notification_gesture);
            document.addEventListener('touchstart', window.__bit_smartphone_notification_gesture);
          }
        } catch (e) {}
      };

      try {
        const audio = new Audio(); audio.src = soundUrl; audio.preload = 'auto';
        audio.volume = (typeof window.notificationVolume !== 'undefined') ? Number(window.notificationVolume) : 0.6;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            try {
              const el = document.createElement('audio');
              el.src = soundUrl; el.volume = audio.volume; el.autoplay = true; el.playsInline = true; el.style.display = 'none';
              document.body.appendChild(el);
              el.play().catch(() => { enqueueSoundForGesture(soundUrl, audio.volume); });
              el.addEventListener('ended', () => { try { el.remove(); } catch(e){} });
              setTimeout(() => { try { el.remove(); } catch(e){} }, 8000);
            } catch (e3) { enqueueSoundForGesture(soundUrl, audio.volume); }
          });
        }
      } catch (e) { enqueueSoundForGesture(soundUrl, (typeof window.notificationVolume !== 'undefined') ? Number(window.notificationVolume) : 0.6); }

      setTimeout(() => { this.dismissCurrentNotification(); }, 4000);
    },
    dismissCurrentNotification() {
      if (!this.currentNotification) return;
      try { this.$emit('dismiss-notification', this.currentNotification.id); } catch (e) {}
      this.showNotification = false; this.currentNotification = null;
      setTimeout(() => { this.showNextNotification(); }, 500);
    },
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60) || 0;
      const secs = seconds % 60 || 0;
      return mins + ':' + secs.toString().padStart(2, '0');
    },
    startWaveAnimation() {
      if (this.animationFrame) return;
      const animate = () => {
        if (this.musicState && this.musicState.isPlaying) {
          this.waveHeights = this.waveHeights.map(() => Math.random() * 15 + 3);
          this.animationFrame = requestAnimationFrame(animate);
        }
      };
      animate();
    },
    stopWaveAnimation() { if (this.animationFrame) { cancelAnimationFrame(this.animationFrame); this.animationFrame = null; } this.waveHeights = [3,8,5,12,7,15,4,10,6,13,9,11]; },
    formatTrackInfo(track) {
      if (!track) return '';
      try {
        if (track.artist && track.title) return `${track.artist} - ${track.title}`;
        if (track.title) return track.title;
        if (track.name) return track.name;
        return 'Unknown Track';
      } catch (error) {
        console.warn('[NotchNotification] Error formatting track info:', error);
        return 'Unknown Track';
      }
    },
    handleNotificationTap() {
      if (this.currentNotification) {
        try { this.$emit('tap-notification', this.currentNotification); } catch (e) {}
        this.dismissCurrentNotification();
      }
    }
  },
  mounted() { if (this.musicState && this.musicState.isPlaying) this.startWaveAnimation(); try { window.notificationPlayQueue = window.notificationPlayQueue || []; } catch (e) {} },
  beforeUnmount() { this.stopWaveAnimation(); },
  template: `
    <div class="absolute left-0 right-0 top-0 mt-20 z-50 flex items-center justify-center pointer-events-none">

      <transition name="notification-fade" appear>
        <div v-if="showNotification && currentNotification"
             @click="handleNotificationTap"
             class="flex items-center px-4 py-2 bg-black/90 rounded-full shadow-xl border border-white/10 w-fit pointer-events-auto cursor-pointer hover:bg-gray-800/80 transition-colors backdrop-blur-[2px] transform -translate-y-6">

          <div class="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden mr-3 bg-white/10 flex items-center justify-center">
            <img v-if="currentNotification.icon" :src="currentNotification.icon" :alt="currentNotification.app" class="w-full h-full object-cover">
            <div v-else class="w-full h-full bg-blue-500 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-gray-300 text-xs truncate">{{ currentNotification.message }}</div>
          </div>

          <div class="flex-shrink-0 ml-2"><div class="text-gray-400 text-xs font-mono">{{ currentNotification.time || 'now' }}</div></div>
        </div>
      </transition>

      <div v-if="shouldShowMusicInfo && !showNotification" class="flex items-center w-64 pointer-events-auto transform -translate-y-6">
        <div class="flex items-center gap-2 bg-black/90 rounded-full px-3 py-2 shadow-xl backdrop-blur-sm flex-1 mr-2">
          <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          <div class="text-white text-sm font-medium truncate pointer-events-none flex-1">{{ (musicState.track && musicState.track.artist) ? musicState.track.artist : '' }}</div>
        </div>

        <div class="flex items-end gap-1 px-2 py-1 bg-black/90 rounded-full shadow-xl backdrop-blur-sm">
          <div v-for="(h, i) in waveHeights.slice(0,6)" :key="i" class="bg-gradient-to-b from-green-400 to-green-600 rounded-sm" :style="{ width: '3px', height: (musicState.isPlaying ? (h * 1.2) : 6) + 'px', transition: 'height 140ms linear' }"></div>
        </div>
      </div>
    </div>
  `
};

window.NotchNotification = NotchNotification;