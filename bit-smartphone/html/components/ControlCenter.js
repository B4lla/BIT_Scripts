const ControlCenter = {
  name: 'ControlCenter',
  props: {
    userSettings: {
      type: Object,
      required: false,
      default: () => ({ brightness: 75, volume: 60, darkMode: false, wifi: false, bluetooth: false, flashlight: false })
    },
    t: {
      type: Function,
      required: false,
      default: () => ((k, d) => d || k)
    },
    allApps: {
      type: Array,
      required: false,
      default: () => []
    },
    musicState: {
      type: Object,
      required: false,
      default: () => ({ isPlaying: false, track: null })
    }
  },
  emits: ["close", "play-track", "pause-music", "resume-music", "stop-music", "update-setting", "open-app", "toggle-dark-mode"],
  data() {
    return {
      isDraggingBrightness: false,
      isDraggingVolume: false,
      swipeStartY: 0,
      isSwipingToClose: false,
      settings: {
        brightness: 75,
        volume: 60
      }
    };
  },
  watch: {
    userSettings: {
      handler(newSettings) {
        if (newSettings) {
          this.settings.brightness = newSettings.brightness || 75;
          this.settings.volume = newSettings.volume || 60;
        }
      },
      immediate: true,
      deep: true
    }
  },
  computed: {
    brightnessPercentage() {
  return Math.round((this.userSettings && typeof this.userSettings.brightness === 'number') ? this.userSettings.brightness : 75);
    },
    volumePercentage() {
  return Math.round((this.userSettings && typeof this.userSettings.volume === 'number') ? this.userSettings.volume : 60);
    },
  },
  methods: {
    getPointerY(event) {
      return event.touches ? event.touches[0].clientY : event.clientY;
    },

    handleSliderInteraction(event, sliderType) {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const clientY = this.getPointerY(event);
        let yInElement = clientY - rect.top;
        
        let percentage = 100 - (yInElement / rect.height) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        
        this.$emit('update-setting', sliderType, percentage);
    },

    startDrag(event, sliderType) {
      event.preventDefault();
      event.stopPropagation();
      document.body.style.overflow = 'hidden';
      document.body.style.userSelect = 'none';
      
      if (sliderType === 'brightness') this.isDraggingBrightness = true;
      if (sliderType === 'volume') this.isDraggingVolume = true;
      
      this.handleSliderInteraction(event, sliderType);
    },

    onDrag(event) {
      if (!this.isDraggingBrightness && !this.isDraggingVolume) return;
      
      event.preventDefault();
      event.stopPropagation();
      
      const sliderType = this.isDraggingBrightness ? 'brightness' : 'volume';
      const sliderElement = this.$refs[sliderType + 'Slider'];
      if (!sliderElement) return;

      this.handleSliderInteraction({ currentTarget: sliderElement, clientY: this.getPointerY(event), preventDefault: () => {} }, sliderType);
    },

    stopDrag() {
      this.isDraggingBrightness = false;
      this.isDraggingVolume = false;
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
    },

    handleSwipeStart(event) {
      this.swipeStartY = this.getPointerY(event);
      this.isSwipingToClose = true;
    },
    handleSwipeMove(event) {
      if (!this.isSwipingToClose) return;
      const currentY = this.getPointerY(event);
      const deltaY = this.swipeStartY - currentY;

      if (deltaY > 50) {
        this.closeControlCenter();
        this.isSwipingToClose = false;
      }
    },
    handleSwipeEnd() {
      this.isSwipingToClose = false;
    },

    toggleSetting(setting) {
      this.$emit('update-setting', setting, !this.userSettings[setting]);
    },
    
    toggleDarkMode() {
        this.$emit('toggle-dark-mode');
    },

    openAppById(appId) {
      const app = this.allApps.find(a => a.id === appId);
      if (app) {
        this.$emit('open-app', app);
        this.closeControlCenter();
      }
    },

    closeControlCenter() {
      this.$emit('close');
    },

    playPauseMusic() {
      if (this.musicState.isPlaying) {
        this.$emit('pause-music');
      } else if (this.musicState.track) {
        this.$emit('resume-music');
      } else {
        
        this.$emit('play-track', { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '5:55', currentTime: '0:00' });
      }
    },

    updateBrightness(e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const newBrightness = Math.max(0, Math.min(100, (x / width) * 100));
      this.settings.brightness = newBrightness;
      this.$emit('update-setting', 'brightness', newBrightness);
    },

    updateVolume(e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const newVolume = Math.max(0, Math.min(100, (x / width) * 100));
      this.settings.volume = newVolume;
      this.$emit('update-setting', 'volume', newVolume);
    },
  },
  errorCaptured(err, instance, info) {
    return false; 
  },
  mounted() {
    window.addEventListener('mousemove', this.onDrag, { passive: false });
    window.addEventListener('mouseup', this.stopDrag, { passive: true });
    window.addEventListener('touchmove', this.onDrag, { passive: false });
    window.addEventListener('touchend', this.stopDrag, { passive: true });
    window.addEventListener('touchcancel', this.stopDrag, { passive: true });
    window.addEventListener('touchend', this.handleSwipeEnd, { passive: true });
    window.addEventListener('touchcancel', this.handleSwipeEnd, { passive: true });
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onDrag);
    window.removeEventListener('mouseup', this.stopDrag);
    window.removeEventListener('touchmove', this.onDrag);
    window.removeEventListener('touchend', this.stopDrag);
    window.removeEventListener('touchcancel', this.stopDrag);
    window.removeEventListener('touchend', this.handleSwipeEnd);
    window.removeEventListener('touchcancel', this.handleSwipeEnd);
  },
  template: `
    <div class="fixed inset-0 z-50" @click.self="closeControlCenter">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"></div>

      <div 
        class="absolute top-0 left-0 right-0 mx-3 mt-12 text-white animate-[slideDown_0.4s_cubic-bezier(0.25,0.46,0.45,0.94)]"
        @touchstart.prevent="handleSwipeStart" 
        @touchmove.prevent="handleSwipeMove"
      >
        
        <div class="bg-white/10 backdrop-blur-xl rounded-[22px] p-6 shadow-2xl border border-white/20">
          <div class="mb-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                  <div 
                    :class="[
                      'relative h-16 rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-95 flex flex-col justify-between overflow-hidden border border-white/15 hover:bg-white/10',
                      userSettings.bluetooth ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-black/40'
                    ]"
                    @click="toggleSetting('bluetooth')"
                  >
                    <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.71,7.71L12,2H11V9.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L11,14.41V22H12L17.71,16.29L13.41,12L17.71,7.71M13,5.83L15.17,8L13,10.17V5.83M13,13.83L15.17,16L13,18.17V13.83Z"/>
                    </svg>
                    <p class="text-[11px] text-white font-medium">Bluetooth</p>
                  </div>

                  <div 
                    :class="[
                      'relative h-16 rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-95 flex flex-col justify-between overflow-hidden border border-white/15 hover:bg-white/10',
                      userSettings.cellular ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-black/40'
                    ]"
                    @click="toggleSetting('cellular')"
                  >
                    <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2,17H4V24H2V17M6,14H8V24H6V14M10,11H12V24H10V11M14,8H16V24H14V8M18,5H20V24H18V5M22,2H24V24H22V2Z"/>
                    </svg>
                    <p class="text-[11px] text-white font-medium">Cellular</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div 
                    :class="[
                      'relative h-16 rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-95 flex flex-col justify-between overflow-hidden border border-white/15 hover:bg-white/10 col-span-2',
                      userSettings.hotspot ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-black/40'
                    ]"
                    @click="toggleSetting('hotspot')"
                  >
                    <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,3C7.79,3 4.25,6.54 4.25,10.75C4.25,13.22 5.31,15.45 7,17L12,22L17,17C18.69,15.45 19.75,13.22 19.75,10.75C19.75,6.54 16.21,3 12,3M12,8A2.5,2.5 0 0,1 14.5,10.5A2.5,2.5 0 0,1 12,13A2.5,2.5 0 0,1 9.5,10.5A2.5,2.5 0 0,1 12,8Z"/>
                    </svg>
                    <p class="text-[11px] text-white font-medium">Hotspot</p>
                  </div>
                </div>
              </div>

              <div>
                <div 
                  :class="[
                    'relative h-[140px] rounded-xl p-4 cursor-pointer transition-all duration-200 active:scale-95 flex flex-col justify-between overflow-hidden',
                    userSettings.airdrop ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-black/40'
                  ]"
                  @click="toggleSetting('airdrop')"
                >
                  <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,1L8,5H11V14H13V5H16M18,23H6C4.89,23 4,22.1 4,21V9C4,7.89 4.89,7 6,7H7V9H6V21H18V9H17V7H18C19.1,7 20,7.89 20,9V21C20,22.1 19.1,23 18,23Z"/>
                  </svg>
                  <div>
                    <p class="text-sm text-white font-medium mb-1">AirDrop</p>
                    <p class="text-[11px] text-white/70">{{ userSettings.airdrop ? 'Everyone' : 'Off' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-6 grid grid-cols-2 gap-4">
            <div 
              class="bg-black/30 rounded-xl h-20 cursor-pointer relative overflow-hidden transition-all duration-200 active:scale-95"
              @click="updateBrightness"
            >
              <div 
                class="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-400/10 transition-all duration-300"
                :style="{ width: settings.brightness + '%' }"
              ></div>
              
              <div class="relative h-full flex items-center justify-between p-4">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"/>
                    </svg>
                  </div>
                  <div class="text-white text-sm font-medium">{{ Math.round(settings.brightness) }}%</div>
                </div>
              </div>
            </div>

            <div 
              class="bg-black/30 rounded-xl h-20 cursor-pointer relative overflow-hidden transition-all duration-200 active:scale-95"
              @click="updateVolume"
            >
              <div 
                class="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-400/10 transition-all duration-300"
                :style="{ width: settings.volume + '%' }"
              ></div>
              
              <div class="relative h-full flex items-center justify-between p-4">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
                    </svg>
                  </div>
                  <div class="text-white text-sm font-medium">{{ Math.round(settings.volume) }}%</div>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <div class="bg-black/30 rounded-xl p-4">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg">
                  <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/>
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white truncate">
                    {{ musicState.track?.title || 'No Music Playing' }}
                  </p>
                  <p class="text-xs text-white/60 truncate">
                    {{ musicState.track?.artist || 'Select a song to play' }}
                  </p>
                </div>

                <div class="flex items-center space-x-2">
                  <button class="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors active:scale-90">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6,5.75L10.25,10H7V16H13.5L15.5,18H7A2,2 0 0,1 5,16V10H1.75L6,5.75M18,18.25L13.75,14H17V8H10.5L8.5,6H17A2,2 0 0,1 19,8V14H22.25L18,18.25Z"/>
                    </svg>
                  </button>
                  
                  <button 
                    @click="playPauseMusic"
                    class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all active:scale-90"
                  >
                    <svg v-if="!musicState.isPlaying" class="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                    </svg>
                    <svg v-else class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
                    </svg>
                  </button>

                  <button class="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors active:scale-90">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13,6V18L21.5,12M4,18L12.5,12L4,6V18Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-3">
            <div 
              :class="[
                'aspect-square rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center',
                userSettings.flashlight ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30' : 'bg-black/40'
              ]"
              @click="toggleSetting('flashlight')"
            >
              <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8,2H16L15,3H17V8L14.5,12.5V22H9.5V12.5L7,8V3H9L8,2M9,4V7.5L11.5,12V20H12.5V12L15,7.5V4H9Z"/>
              </svg>
            </div>

            <div 
              class="aspect-square rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center bg-black/40"
              @click="openAppById('clock')"
            >
              <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.7L16.2,16.2Z"/>
              </svg>
            </div>

            <div 
              class="aspect-square rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center bg-black/40"
              @click="openAppById('calculator')"
            >
              <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7,2H17A2,2 0 0,1 19,4V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V4A2,2 0 0,1 7,2M7,4V8H17V4H7M7,10V12H9V10H7M11,10V12H13V10H11M15,10V12H17V10H15M7,14V16H9V14H7M11,14V16H13V14H11M15,14V16H17V14H15M7,18V20H9V18H7M11,18V20H13V18H11M15,18V20H17V18H15Z"/>
              </svg>
            </div>

            <div 
              class="aspect-square rounded-xl p-3 cursor-pointer transition-all duration-200 active:scale-95 flex items-center justify-center bg-black/40"
              @click="openAppById('camera')"
            >
              <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
window.ControlCenter = ControlCenter;