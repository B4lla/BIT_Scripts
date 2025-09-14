const Lockscreen = {
  name: 'Lockscreen',
  components: {
    NotchNotification: NotchNotification,
    LockscreenNotifications: LockscreenNotifications
  },
  props: {
    phoneState: String,
    currentWallpaperStyle: Object,
    currentDate: String,
    currentTime: String,
    t: Function,
    lockscreenSettings: {
      type: Object,
      default: () => ({
        clockStyle: 'default',
        clockColor: '#ffffff',
        clockSize: 'large',
        dateStyle: 'default', 
        dateColor: '#ffffff',
        dateSize: 'medium',
        widgets: []
      })
    },
    weatherData: Object,
    musicState: Object,
    batteryLevel: Number,
    photos: Array,
    notifications: {
      type: Array,
      default: () => []
    }
  },
  emits: ['unlock-phone', 'update-lockscreen-settings', 'dismiss-notification', 'tap-notification', 'expand-notification', 'clear-all-notifications'],
  data() {
    return {
      isCustomizing: false,
      customizeMode: null, 
      longPressTimer: null,
      pressStartTime: 0,
      flashlightOn: false,              
      flashTimer: null,                
      availableWidgets: [],
      clockStyles: [],
      sizes: [],
      colors: [],
      prevPhoneState: null
    };
  },
  created() {
    try {
      this.availableWidgets = [
        { id: 'weather', name: (this.t && this.t('lockscreen.widget.weather')) || 'Weather', icon: 'cloud-sun' },
        { id: 'music', name: (this.t && this.t('lockscreen.widget.music')) || 'Music', icon: 'music' },
        { id: 'battery', name: (this.t && this.t('lockscreen.widget.battery')) || 'Battery', icon: 'battery' },
        { id: 'photos', name: (this.t && this.t('lockscreen.widget.photos')) || 'Photos', icon: 'image' }
      ];

      this.clockStyles = [
        { id: 'default', name: (this.t && this.t('lockscreen.style.default')) || 'Default', class: 'font-bold tracking-tighter' },
        { id: 'thin', name: (this.t && this.t('lockscreen.style.thin')) || 'Thin', class: 'font-thin tracking-wide' },
        { id: 'rounded', name: (this.t && this.t('lockscreen.style.rounded')) || 'Rounded', class: 'font-black tracking-normal rounded-3xl' },
        { id: 'modern', name: (this.t && this.t('lockscreen.style.modern')) || 'Modern', class: 'font-light tracking-widest' }
      ];

      this.sizes = [
        { id: 'small', name: (this.t && this.t('settings.sizes.small')) || 'Small', clockClass: 'text-6xl', dateClass: 'text-lg' },
        { id: 'medium', name: (this.t && this.t('settings.sizes.medium')) || 'Medium', clockClass: 'text-7xl', dateClass: 'text-xl' },
        { id: 'large', name: (this.t && this.t('settings.sizes.large')) || 'Large', clockClass: 'text-8xl', dateClass: 'text-2xl' },
        { id: 'xl', name: (this.t && this.t('settings.sizes.xlarge')) || 'Extra Large', clockClass: 'text-9xl', dateClass: 'text-3xl' }
      ];

      this.colors = [
        { id: '#ffffff', name: 'White', color: '#ffffff' },
        { id: '#000000', name: 'Black', color: '#000000' },
        { id: '#3b82f6', name: 'Blue', color: '#3b82f6' },
        { id: '#ef4444', name: 'Red', color: '#ef4444' },
        { id: '#10b981', name: 'Green', color: '#10b981' },
        { id: '#f59e0b', name: 'Yellow', color: '#f59e0b' },
        { id: '#8b5cf6', name: 'Purple', color: '#8b5cf6' },
        { id: '#ec4899', name: 'Pink', color: '#ec4899' }
      ];
    } catch (e) {
    }
  },
  computed: {
    clockClasses() {
      const style = this.clockStyles.find(s => s.id === this.lockscreenSettings.clockStyle) || this.clockStyles[0];
      const size = this.sizes.find(s => s.id === this.lockscreenSettings.clockSize) || this.sizes[2];
      return style.class + ' ' + size.clockClass;
    },
    dateClasses() {
      const style = this.clockStyles.find(s => s.id === this.lockscreenSettings.dateStyle) || this.clockStyles[0];
      const size = this.sizes.find(s => s.id === this.lockscreenSettings.dateSize) || this.sizes[1];
      return style.class + ' ' + size.dateClass;
    },
    clockStyle() {
      return {
        color: this.lockscreenSettings.clockColor,
        textShadow: '0 2px 8px rgba(0,0,0,0.5)'
      };
    },
    dateStyle() {
      return {
        color: this.lockscreenSettings.dateColor,
        textShadow: '0 1px 4px rgba(0,0,0,0.5)'
      };
    }
    ,
    transitionName() {
      if (this.phoneState === 'LOCKED_PREVIEW') return 'slide-down';
      if (this.prevPhoneState === 'LOCKED_PREVIEW') return 'slide-down';
      return 'fade';
    }
  },
  methods: {
    unlockPhone() {
      if (!this.isCustomizing) {
        this.$emit('unlock-phone');
      }
    },
    
    startLongPress(event) {
      if (this.isCustomizing) return;
      
      this.pressStartTime = Date.now();
      this.longPressTimer = setTimeout(() => {
        this.isCustomizing = true;
        this.customizeMode = 'main';
        
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 800);
    },
    
    endLongPress() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      
      
      if (!this.isCustomizing && Date.now() - this.pressStartTime < 500) {
        this.unlockPhone();
      }
    },
    
    exitCustomization() {
      this.isCustomizing = false;
      this.customizeMode = null;
    },
    
    updateClockStyle(styleId) {
      this.$emit('update-lockscreen-settings', {
        ...this.lockscreenSettings,
        clockStyle: styleId
      });
    },
    
    updateClockColor(color) {
      this.$emit('update-lockscreen-settings', {
        ...this.lockscreenSettings,
        clockColor: color
      });
    },
    
    updateClockSize(size) {
      this.$emit('update-lockscreen-settings', {
        ...this.lockscreenSettings,
        clockSize: size
      });
    },
    
    updateDateStyle(styleId) {
      this.$emit('update-lockscreen-settings', {
        ...this.lockscreenSettings,
        dateStyle: styleId
      });
    },
    
    updateDateColor(color) {
      this.$emit('update-lockscreen-settings', {
        ...this.lockscreenSettings,
        dateColor: color
      });
    },
    
    updateDateSize(size) {
      this.$emit('update-lockscreen-settings', {
        ...this.lockscreenSettings,
        dateSize: size
      });
    },
    
    addWidget(widgetId) {
      const newWidget = {
        id: widgetId + '_' + Date.now(),
        type: widgetId,
        position: { x: 50, y: 300 }, 
        size: 'medium'
      };
      
      const updatedWidgets = [...this.lockscreenSettings.widgets, newWidget];
      this.$emit('update-lockscreen-settings', {
        ...this.lockscreenSettings,
        widgets: updatedWidgets
      });
    },
    
    removeWidget(widgetId) {
      const updatedWidgets = this.lockscreenSettings.widgets.filter(w => w.id !== widgetId);
      this.$emit('update-lockscreen-settings', {
        ...this.lockscreenSettings,
        widgets: updatedWidgets
      });
    },
    
    startFlashToggle(event) {
      event.stopPropagation();
      if (this.flashTimer) return;
      this.flashTimer = setTimeout(() => {
        this.toggleFlashlight();
        this.flashTimer = null;
      }, 800);
    },
    
    endFlashToggle(event) {
      event.stopPropagation();
      if (this.flashTimer) {
        clearTimeout(this.flashTimer);
        this.flashTimer = null;
      }
    },
    
    toggleFlashlight() {
      this.flashlightOn = !this.flashlightOn;

      fetch('https://bit-smartphone/toggleFlashlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          state: this.flashlightOn,
          range: 15.0,
          brightness: 2.0,
          angle: 45.0
        })
      }).catch(console.error);

      this.$emit('flashlight-toggle', this.flashlightOn);
    },

    handleDismissNotification(notificationId) {
      this.$emit('dismiss-notification', notificationId);
    },

    handleTapNotification(notification) {
      this.$emit('tap-notification', notification);
      this.unlockPhone();
    },

    handleExpandNotification(notification) {
      this.$emit('expand-notification', notification);
    },

    handleClearAllNotifications() {
      this.$emit('clear-all-notifications');
    }
  },
  watch: {
    phoneState(newVal, oldVal) {
      this.prevPhoneState = oldVal;
      setTimeout(() => {
        if (this.prevPhoneState === oldVal) {
          this.prevPhoneState = null;
        }
      }, 600);
    }
  },
  
  template: `
    <transition :name="transitionName">
      <div v-if="phoneState === 'LOCKED' || phoneState === 'LOCKED_PREVIEW'" 
           class="absolute inset-0 z-40 flex flex-col text-white bg-cover bg-center overflow-hidden"
           :style="currentWallpaperStyle"
           @touchstart="startLongPress"
           @touchend="endLongPress"
           @mousedown="startLongPress"
           @mouseup="endLongPress">
        
        <div class="absolute inset-0 bg-black/10"></div>
        
        <NotchNotification
          :musicState="musicState || {}"
          :notifications="[]"
          :t="t"
          class="pointer-events-none select-none"
        />

        <LockscreenNotifications
          :notifications="notifications"
          :t="t"
          @dismiss-notification="handleDismissNotification"
          @tap-notification="handleTapNotification"
          @expand-notification="handleExpandNotification"
          @clear-all-notifications="handleClearAllNotifications"
          class="pointer-events-auto"
        />
        
        <div class="relative z-10 flex-1 flex flex-col items-center pt-24 px-8">
          
          <div class="relative" :class="{ 'ring-2 ring-white/50 rounded-lg p-2': isCustomizing && customizeMode === 'date' }">
            <p :class="dateClasses" :style="dateStyle" 
               @click="isCustomizing && (customizeMode = 'date')">
              {{ currentDate }}
            </p>
          </div>
          
          <div class="relative mt-2" :class="{ 'ring-2 ring-white/50 rounded-lg p-4': isCustomizing && customizeMode === 'clock' }">
            <h1 :class="clockClasses" :style="clockStyle"
                @click="isCustomizing && (customizeMode = 'clock')">
              {{ currentTime }}
            </h1>
          </div>

          
          <div class="flex flex-col items-center mt-8 mb-2 select-none">
            
            <div class="w-14 h-14 bg-gradient-to-b from-white/70 via-white/30 to-white/10 rounded-full shadow-[0_4px_24px_0_rgba(0,0,0,0.18)] border border-white/40 flex items-center justify-center mb-2 relative overflow-hidden">
              <div class="absolute inset-0 rounded-full bg-gradient-to-t from-white/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>
              <svg class="w-7 h-7 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                <path d="M12 8v4l2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            
            <div class="w-16 h-2 rounded-full bg-gradient-to-r from-white/80 via-white/95 to-white/80 opacity-90 shadow-[0_2px_8px_0_rgba(0,0,0,0.10)] border border-white/30"></div>
          </div>

          
          
          <div v-if="lockscreenSettings && lockscreenSettings.widgets && lockscreenSettings.widgets.some(w => w && w.type === 'music') && musicState && musicState.track" class="w-full flex justify-center mb-4">
            <div class="w-full max-w-2xl bg-black/40 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center min-h-[170px] relative shadow-2xl">
              <div class="flex items-center w-full gap-6 mb-3">
                <img v-if="musicState.track.cover" :src="musicState.track.cover" class="w-20 h-20 object-cover rounded-xl shadow-md" />
                <div v-else class="w-20 h-20 bg-gray-300 rounded-xl flex items-center justify-center">
                  <svg class="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-lg truncate">{{ musicState.track.title }}</p>
                  <p class="text-sm opacity-80 truncate">{{ musicState.track.artist }}</p>
                </div>
              </div>
              <input type="range" min="0" :max="musicState.track.duration || 100" :value="musicState.progress || 0"
                @input="$emit('set-music-progress', $event.target.value)"
                class="w-full accent-blue-500 h-2 rounded-full bg-white/30 mb-2" />
              <div class="flex items-center justify-center gap-8 mt-2">
                <button @click="$emit('pause-music')" class="text-white/80 hover:text-blue-400"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></button>
                <button @click="$emit('play-track')" class="text-white/80 hover:text-blue-400"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
                <button @click="$emit('stop-music')" class="text-white/80 hover:text-blue-400"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg></button>
              </div>
              <button v-if="isCustomizing && lockscreenSettings && lockscreenSettings.widgets" @click="removeWidget((lockscreenSettings.widgets.find(w => w && w.type === 'music') || {}).id)"
                      class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs">
                ×
              </button>
            </div>
          </div>
          
              <div class="w-full flex flex-row justify-center items-center gap-4 mt-2" v-if="lockscreenSettings && lockscreenSettings.widgets && lockscreenSettings.widgets.length > 0">
                <div v-for="widget in (lockscreenSettings.widgets || []).filter(w => w && w.type !== 'music')" :key="widget.id" class="w-16 h-16 bg-black/40 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center relative shadow-md">
                  <template v-if="widget.type === 'weather'">
                    <svg class="w-8 h-8 mb-1 text-gray-200" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM3 9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
                    </svg>
                    <span class="text-xs font-semibold text-gray-100">
                      {{ weatherData && weatherData.temperature ? weatherData.temperature + '°' : '' }}
                    </span>
                  </template>
                  <template v-else-if="widget.type === 'photos' && photos && photos.length > 0">
                    <img :src="photos[0].url || photos[0]" class="w-10 h-10 object-cover rounded-lg mb-1 shadow-sm" />
                    <span class="text-xs font-semibold text-gray-100">Photos</span>
                  </template>
                  <template v-else-if="widget.type === 'battery'">
                    <svg class="w-8 h-8 mb-1 text-gray-200" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.67 4H14V2c0-1.1-.9-2-2-2s-2 .9-2 2v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                    </svg>
                    <span class="text-xs font-semibold text-gray-100">
                      {{ batteryLevel ? batteryLevel + '%' : '' }}
                    </span>
                  </template>
                  <button v-if="isCustomizing" @click="removeWidget(widget.id)"
                          class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
                    ×
                  </button>
                </div>
              </div>
        </div>
        
        
        <div class="relative z-10 flex justify-between items-center w-full px-8 pb-12">
          
          <button 
            class="w-14 h-14 backdrop-blur-md rounded-full flex items-center justify-center transition-colors"
            :class="flashlightOn ? 'bg-white text-black' : 'bg-black/30 text-white'"
            @mousedown.stop="startFlashToggle" 
            @mouseup.stop="endFlashToggle">
            
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H10v2h4V2zm-5 4h6v2H9V6zm2 4l-1 8h4l-1-8h-2zm-1 10h4v2h-4v-2z"/>
            </svg>
          </button>
          
          <div class="flex flex-col items-center">
            <div class="w-8 h-1 bg-white/60 rounded-full mb-2"></div>
            <p class="text-base font-semibold">{{ t('lockscreen.unlock') }}</p>
          </div>
          
          <button class="w-14 h-14 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 15.2c1.25 0 2.27-.92 2.27-2.2 0-1.28-1.02-2.2-2.27-2.2S9.73 11.72 9.73 13c0 1.28 1.02 2.2 2.27 2.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
          </button>
        </div>
        
        
        <transition name="slide-up">
          <div v-if="isCustomizing" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
            
            <div class="w-full bg-black/10 backdrop-blur-2xl rounded-t-3xl border-t border-white/20 text-white shadow-2xl max-h-[70vh] flex flex-col">
              
              <div class="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 class="text-xl font-semibold">{{ customizeMode === 'main' ? 'Personalizar Pantalla de Bloqueo' : customizeMode === 'clock' ? 'Estilo del Reloj' : customizeMode === 'date' ? 'Estilo de la Fecha' : 'Widgets' }}</h2>
                  <p class="text-sm opacity-70 mt-1">{{ customizeMode === 'main' ? 'Personaliza la apariencia de tu pantalla de bloqueo' : customizeMode === 'widgets' ? 'Añade información útil a tu pantalla' : 'Configura el estilo visual' }}</p>
                </div>
                <button @click="exitCustomization" 
                        class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              
              <div class="flex-1 overflow-y-auto p-6">
                
                <div v-if="customizeMode === 'main'" class="space-y-6">
                  <div>
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Opciones de Personalización</h3>
                    <div class="grid grid-cols-2 gap-3">
                      <div @click="customizeMode = 'clock'" 
                           class="bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-95">
                        <div class="flex items-center gap-3 mb-2">
                          <span class="text-2xl">🕒</span>
                          <div class="flex-1">
                            <div class="text-sm font-medium">Reloj</div>
                            <div class="text-xs opacity-60">Estilo, color y tamaño</div>
                          </div>
                        </div>
                        <p class="text-xs opacity-70">Personaliza cómo se ve la hora</p>
                      </div>
                      
                      <div @click="customizeMode = 'date'" 
                           class="bg-gradient-to-br from-green-400/20 to-green-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-95">
                        <div class="flex items-center gap-3 mb-2">
                          <span class="text-2xl">📅</span>
                          <div class="flex-1">
                            <div class="text-sm font-medium">Fecha</div>
                            <div class="text-xs opacity-60">Estilo, color y tamaño</div>
                          </div>
                        </div>
                        <p class="text-xs opacity-70">Personaliza cómo se ve la fecha</p>
                      </div>
                      
                      <div @click="customizeMode = 'widgets'" 
                           class="bg-gradient-to-br from-purple-400/20 to-pink-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-95 col-span-2">
                        <div class="flex items-center gap-3 mb-2">
                          <span class="text-2xl">📱</span>
                          <div class="flex-1">
                            <div class="text-sm font-medium">Widgets</div>
                            <div class="text-xs opacity-60">Información útil</div>
                          </div>
                        </div>
                        <p class="text-xs opacity-70">Añade widgets con información del tiempo, música, batería y más</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                
                <div v-else-if="customizeMode === 'clock'" class="space-y-6">
                  <div class="flex items-center gap-4 mb-4">
                    <button @click="customizeMode = 'main'" class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                      </svg>
                    </button>
                  </div>
                  
                  
                  <div>
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Estilo de Fuente</h3>
                    <div class="grid grid-cols-2 gap-3">
                      <div v-for="style in clockStyles" :key="style.id"
                           @click="updateClockStyle(style.id)"
                           class="backdrop-blur-xl border rounded-2xl p-4 cursor-pointer transition-all active:scale-95"
                           :class="lockscreenSettings.clockStyle === style.id ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 bg-white/10 hover:bg-white/20'">
                        <div class="text-white text-center">
                          <div :class="'text-2xl ' + style.class + ' mb-2'">12:34</div>
                          <p class="text-sm opacity-70">{{ style.name }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div>
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Tamaño</h3>
                    <div class="grid grid-cols-2 gap-3">
                      <div v-for="size in sizes" :key="size.id"
                           @click="updateClockSize(size.id)"
                           class="backdrop-blur-xl border rounded-2xl p-4 cursor-pointer transition-all active:scale-95"
                           :class="lockscreenSettings.clockSize === size.id ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 bg-white/10 hover:bg-white/20'">
                        <div class="text-white text-center">
                          <div :class="'font-bold ' + size.clockClass.replace('text-', 'text-').replace('xl', 'lg').replace('9xl', '2xl').replace('8xl', 'xl') + ' mb-2'">12:34</div>
                          <p class="text-sm opacity-70">{{ size.name }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div>
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Color</h3>
                    <div class="flex flex-wrap gap-3">
                      <button v-for="color in colors" :key="color.id"
                              @click="updateClockColor(color.id)"
                              class="w-12 h-12 rounded-full border-4 transition-all hover:scale-110 active:scale-95"
                              :style="{ backgroundColor: color.color }"
                              :class="lockscreenSettings.clockColor === color.id ? 'border-white scale-110 ring-2 ring-white/50' : 'border-white/30'">
                      </button>
                    </div>
                  </div>
                </div>
                
                
                <div v-else-if="customizeMode === 'date'" class="space-y-6">
                  <div class="flex items-center gap-4 mb-4">
                    <button @click="customizeMode = 'main'" class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                      </svg>
                    </button>
                  </div>
                  
                  
                  <div>
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Estilo de Fuente</h3>
                    <div class="grid grid-cols-2 gap-3">
                      <div v-for="style in clockStyles" :key="style.id"
                           @click="updateDateStyle(style.id)"
                           class="backdrop-blur-xl border rounded-2xl p-4 cursor-pointer transition-all active:scale-95"
                           :class="lockscreenSettings.dateStyle === style.id ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 bg-white/10 hover:bg-white/20'">
                        <div class="text-white text-center">
                          <div :class="'text-lg ' + style.class + ' mb-2'">12 Aug 2025</div>
                          <p class="text-sm opacity-70">{{ style.name }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div>
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Tamaño</h3>
                    <div class="grid grid-cols-2 gap-3">
                      <div v-for="size in sizes" :key="size.id"
                           @click="updateDateSize(size.id)"
                           class="backdrop-blur-xl border rounded-2xl p-4 cursor-pointer transition-all active:scale-95"
                           :class="lockscreenSettings.dateSize === size.id ? 'border-blue-500 bg-blue-500/20' : 'border-white/20 bg-white/10 hover:bg-white/20'">
                        <div class="text-white text-center">
                          <div :class="'font-bold ' + size.dateClass + ' mb-2'">{{ currentDate }}</div>
                          <p class="text-sm opacity-70">{{ size.name }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div>
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Color</h3>
                    <div class="flex flex-wrap gap-3">
                      <button v-for="color in colors" :key="color.id"
                              @click="updateDateColor(color.id)"
                              class="w-12 h-12 rounded-full border-4 transition-all hover:scale-110 active:scale-95"
                              :style="{ backgroundColor: color.color }"
                              :class="lockscreenSettings.dateColor === color.id ? 'border-white scale-110 ring-2 ring-white/50' : 'border-white/30'">
                      </button>
                    </div>
                  </div>
                </div>
                
                
                <div v-else-if="customizeMode === 'widgets'" class="space-y-6">
                  <div class="flex items-center gap-4 mb-4">
                    <button @click="customizeMode = 'main'" class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div>
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Widgets Disponibles</h3>
                    <div class="grid grid-cols-2 gap-3">
                      <div v-for="widget in availableWidgets.filter(w => lockscreenSettings && lockscreenSettings.widgets ? !lockscreenSettings.widgets.some(existing => existing.type === w.id) : true)" :key="widget.id"
                           @click="addWidget(widget.id)"
                           class="backdrop-blur-xl border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-95">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                            <svg class="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                              <path v-if="widget.icon === 'cloud-sun'" d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2zM3 9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z"/>
                              <path v-else-if="widget && widget.icon === 'music'" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                              <path v-else-if="widget.icon === 'battery'" d="M15.67 4H14V2c0-1.1-.9-2-2-2s-2 .9-2 2v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                              <path v-else-if="widget.icon === 'image'" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                              <path v-else d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 class="font-semibold text-white">{{ widget.name }}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div v-if="lockscreenSettings && lockscreenSettings.widgets && lockscreenSettings.widgets.length > 0">
                    <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Widgets Actuales</h3>
                    <div class="space-y-2">
                      <div v-for="widget in lockscreenSettings.widgets" :key="widget ? widget.id : 'empty'"
                           class="flex items-center justify-between backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-3">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                            <svg class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                              <path v-if="widget && widget.type === 'weather'" d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
                              <path v-else-if="widget && widget.type === 'music'" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4z"/>
                              <path v-else-if="widget && widget.type === 'battery'" d="M15.67 4H14V2c0-1.1-.9-2-2-2s-2 .9-2 2v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                              <path v-else d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                            </svg>
                          </div>
                          <span class="text-white font-medium">{{ widget ? widget.name : 'Widget' }}</span>
                        </div>
                        <button @click="removeWidget(widget.id)"
                                class="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  `
};
window.Lockscreen = Lockscreen;