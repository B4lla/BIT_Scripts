const ControlCenter = {
  name: 'ControlCenter',
  props: {
    userSettings: {
      type: Object,
      required: true
    },
    t: {
      type: Function,
      required: true
    },
    allApps: {
      type: Array,
      required: true
    },
    musicState: {
      type: Object,
      required: true
    }
  },
  emits: ["close", "play-track", "pause-music", "resume-music", "stop-music"],
  data() {
    return {
      isDraggingBrightness: false,
      isDraggingVolume: false,
      swipeStartY: 0,
      isSwipingToClose: false,
    };
  },
  computed: {
    brightnessPercentage() {
      return Math.round(this.userSettings.brightness);
    },
    volumePercentage() {
      return Math.round(this.userSettings.volume);
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
  <div class="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>

      <div class="absolute inset-x-4 top-12 bottom-28 flex flex-col gap-6 animate-slide-down">
        <div class="flex-grow grid grid-cols-1 grid-rows-3 gap-6">

          <div class="row-span-2 grid grid-cols-4 grid-rows-4 gap-4">
            
            <div class="col-span-2 row-span-4 flex flex-col gap-4">
              <button @click="toggleSetting('wifi')" class="flex-1 flex items-center justify-start px-6 gap-4 rounded-3xl backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 shadow-xl shadow-black/20" :class="userSettings.wifi ? 'bg-blue-500/80 text-white shadow-blue-500/30' : 'bg-white/15 text-white hover:bg-white/25'">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg" :class="userSettings.wifi ? 'bg-white/30 shadow-white/20' : 'bg-blue-500/80 shadow-blue-500/20'">
                  <svg class="w-5 h-5 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3.5A7.5 7.5 0 002.5 11a.75.75 0 001.5 0A6 6 0 0110 5a6 6 0 016 6 .75.75 0 001.5 0A7.5 7.5 0 0010 3.5z"/><path d="M10 7.5a3.5 3.5 0 00-3.5 3.5.75.75 0 001.5 0A2 2 0 0110 9a2 2 0 012 2 .75.75 0 001.5 0A3.5 3.5 0 0010 7.5z"/><path d="M10 13a1 1 0 100-2 1 1 0 000 2z"/></svg>
                </div>
                <div class="flex flex-col items-start">
                  <span class="text-sm font-semibold drop-shadow-sm">Wi-Fi</span>
                  <span class="text-xs opacity-80">Casa</span>
                </div>
              </button>
              <button @click="toggleSetting('cellular')" class="flex-1 flex items-center justify-start px-6 gap-4 rounded-3xl backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 shadow-xl shadow-black/20" :class="userSettings.cellular ? 'bg-green-500/80 text-white shadow-green-500/30' : 'bg-white/15 text-white hover:bg-white/25'">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg" :class="userSettings.cellular ? 'bg-white/30 shadow-white/20' : 'bg-green-500/80 shadow-green-500/20'">
                  <svg class="w-5 h-5 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M15.5,1h-11C3.12,1,2,2.12,2,3.5v13C2,17.88,3.12,19,4.5,19h11c1.38,0,2.5-1.12,2.5-2.5v-13C18,2.12,16.88,1,15.5,1z"/></svg>
                </div>
                <div class="flex flex-col items-start">
                  <span class="text-sm font-semibold drop-shadow-sm">Datos móviles</span>
                  <span class="text-xs opacity-80">Vodafone</span>
                </div>
              </button>
              <button @click="toggleSetting('bluetooth')" class="flex-1 flex items-center justify-start px-6 gap-4 rounded-3xl backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 shadow-xl shadow-black/20" :class="userSettings.bluetooth ? 'bg-blue-500/80 text-white shadow-blue-500/30' : 'bg-white/15 text-white hover:bg-white/25'">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg" :class="userSettings.bluetooth ? 'bg-white/30 shadow-white/20' : 'bg-blue-500/80 shadow-blue-500/20'">
                  <svg class="w-5 h-5 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/></svg>
                </div>
                <div class="flex flex-col items-start">
                  <span class="text-sm font-semibold drop-shadow-sm">Bluetooth</span>
                  <span class="text-xs opacity-80">Desactivado</span>
                </div>
              </button>
              <button class="flex-1 flex items-center justify-start px-6 gap-4 rounded-3xl backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 bg-white/15 hover:bg-white/25 text-white shadow-xl shadow-black/20">
                <div class="w-10 h-10 rounded-2xl bg-gray-500/80 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-gray-500/20">
                  <svg class="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3 3-3M12 12l0 9"/></svg>
                </div>
                <div class="flex flex-col items-start">
                  <span class="text-sm font-semibold drop-shadow-sm">AirDrop</span>
                  <span class="text-xs opacity-80">Solo contactos</span>
                </div>
              </button>
            </div>
            
            <div class="col-span-2 row-span-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex flex-col justify-between shadow-xl shadow-black/20">
              <div @click="openAppById('music')" class="flex items-center gap-4 cursor-pointer">
                  <div class="w-14 h-14 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-2xl flex-shrink-0 shadow-2xl shadow-purple-500/30 border border-white/10"></div>
                  <div class="flex-1 min-w-0">
                      <p class="text-white font-semibold text-base truncate drop-shadow-sm">{{ musicState.track ? musicState.track.title : 'Sin reproducir' }}</p>
                      <p class="text-white/80 text-sm">{{ musicState.track ? musicState.track.artist : 'Música' }}</p>
                  </div>
              </div>
              <div class="flex items-center justify-around mt-4">
                  <button class="text-white/70 hover:text-white transition-all duration-200 active:scale-90 rounded-full p-3 hover:bg-white/10 backdrop-blur-sm">
                    <svg class="w-6 h-6 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z"/></svg>
                  </button>
                  <button @click="playPauseMusic" class="text-white hover:text-white transition-all duration-200 active:scale-90 rounded-full p-3 hover:bg-white/10 backdrop-blur-sm shadow-lg">
                    <svg v-if="musicState.isPlaying" class="w-8 h-8 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V4zm6 0a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" clip-rule="evenodd"/></svg>
                    <svg v-else class="w-8 h-8 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
                  </button>
                  <button class="text-white/70 hover:text-white transition-all duration-200 active:scale-90 rounded-full p-3 hover:bg-white/10 backdrop-blur-sm">
                    <svg class="w-6 h-6 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M15.445 5.168A1 1 0 0017 6v8a1 1 0 01-1.555.832L10 11.202V14a1 1 0 01-1.555.832l-6-4a1 1 0 010-1.664l6-4A1 1 0 0110 6v2.798l5.445-3.63z"/></svg>
                  </button>
              </div>
            </div>

            <div class="col-span-2 row-span-2 grid grid-cols-2 gap-4">
              <div ref="brightnessSlider" @mousedown="startDrag($event, 'brightness')" @touchstart.prevent="startDrag($event, 'brightness')" class="relative w-full h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden cursor-pointer select-none touch-none shadow-xl shadow-black/20">
                  <div class="absolute inset-x-0 bottom-0 flex justify-center pb-6 pointer-events-none z-0">
                      <svg class="w-6 h-6 text-white/60 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95a1 1 0 010-1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>
                  </div>
                  <div class="absolute bottom-0 left-0 right-0 overflow-hidden z-10 bg-gradient-to-t from-yellow-400 via-orange-400 to-orange-300 rounded-3xl shadow-inner shadow-orange-500/30" :style="{ height: brightnessPercentage + '%' }">
                      <div class="absolute inset-x-0 bottom-0 flex justify-center pb-6 pointer-events-none">
                          <svg class="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95a1 1 0 010-1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>
                      </div>
                  </div>
              </div>
              <div ref="volumeSlider" @mousedown="startDrag($event, 'volume')" @touchstart.prevent="startDrag($event, 'volume')" class="relative w-full h-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden cursor-pointer select-none touch-none shadow-xl shadow-black/20">
                  <div class="absolute inset-x-0 bottom-0 flex justify-center pb-6 pointer-events-none z-0">
                      <svg class="w-6 h-6 text-white/60 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0A5.002 5.002 0 0115 10a5.002 5.002 0 01-1.293 3.293 1 1 0 11-1.414-1.414A3 3 0 0013 10a3 3 0 00-.707-1.707 1 1 0 010-1.414z"/></svg>
                  </div>
                   <div class="absolute bottom-0 left-0 right-0 overflow-hidden z-10 bg-gradient-to-t from-blue-500 via-blue-400 to-cyan-400 rounded-3xl shadow-inner shadow-blue-500/30" :style="{ height: volumePercentage + '%' }">
                      <div class="absolute inset-x-0 bottom-0 flex justify-center pb-6 pointer-events-none">
                          <svg class="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0A5.002 5.002 0 0115 10a5.002 5.002 0 01-1.293 3.293 1 1 0 11-1.414-1.414A3 3 0 0013 10a3 3 0 00-.707-1.707 1 1 0 010-1.414z"/></svg>
                      </div>
                  </div>
              </div>
            </div>
          </div>
          
          <div class="row-span-1 grid grid-cols-4 gap-4">
              <button @click="toggleSetting('flashlight')" class="aspect-square rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 shadow-xl shadow-black/20" :class="userSettings.flashlight ? 'bg-yellow-400/80 text-white shadow-yellow-400/40' : 'bg-white/15 text-white/80 hover:bg-white/25'">
                <svg class="w-7 h-7 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </button>
              <button @click="openAppById('calculator')" class="aspect-square bg-white/15 hover:bg-white/25 text-white/80 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 shadow-xl shadow-black/20">
                <svg class="w-7 h-7 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round"/><path d="M6 5v14a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2z"/></svg>
              </button>
              <button @click="openAppById('clock')" class="aspect-square bg-white/15 hover:bg-white/25 text-white/80 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 shadow-xl shadow-black/20">
                <svg class="w-7 h-7 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
              </button>
              <button @click="toggleDarkMode" class="aspect-square rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all duration-300 active:scale-95 shadow-xl shadow-black/20" :class="userSettings.darkMode ? 'bg-indigo-600/80 text-white shadow-indigo-600/40' : 'bg-white/15 text-white/80 hover:bg-white/25'">
                <svg v-if="userSettings.darkMode" class="w-6 h-6 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                <svg v-else class="w-6 h-6 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95a1 1 0 010-1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>
              </button>
          </div>
        </div>
        
        <div class="flex-grow w-full" @touchstart.prevent="handleSwipeStart" @touchmove.prevent="handleSwipeMove"></div>
      </div>
    </div>
  `
};
window.ControlCenter = ControlCenter;