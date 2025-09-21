const StatusBar = {
  name: 'StatusBar',
  props: {
    currentTime: String,
    batteryLevel: Number,
    signalStrength: Number,
    networkType: String,
    isCharging: Boolean,
    isDarkMode: Boolean,
    isInApp: Boolean,
    theme: {
      type: String,
      default: 'light' 
    }
  },
  emits: ['time-tap', 'status-tap'],
  
  computed: {
    textColor() {
      if (this.isInApp && !this.isDarkMode) {
        return 'text-black';
      }
      return 'text-white';
    },
    
    batteryFillWidth() {
      return Math.max(2, this.batteryLevel * 0.85);
    },
    
    batteryColorClass() {
      if (this.isCharging) return 'charging';
      if (this.batteryLevel <= 5) return 'low';
      if (this.batteryLevel <= 20) return 'medium';
      return 'high';
    },
    
    signalBars() {
      return Array.from({ length: 4 }, (_, i) => ({
        index: i + 1,
        height: (i + 1) * 2.5 + 2,
        isActive: (i + 1) <= this.signalStrength,
        isWeak: this.signalStrength <= 1,
        noService: this.signalStrength === 0
      }));
    },
    
    networkDisplayText() {
      if (this.signalStrength === 0) return 'Sin servicio';
      return this.networkType || '4G';
    },
    
    showNetworkType() {
      return this.networkType && this.signalStrength > 0;
    }
  },
  
  template: `
    <div class="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-6 z-50 pointer-events-none text-white">
      <div class="flex-1 flex items-center pointer-events-auto">
        <div 
          @click="$emit('time-tap')"
          class="group cursor-pointer select-none"
        >
          <span class="text-[15px] font-normal tracking-[-0.41px] ml-2 text-white group-active:text-white/70 transition-colors duration-150">
            {{ currentTime }}
          </span>
        </div>
      </div>
      
      <div class="flex-shrink-0 w-32"></div>
      
      <div class="flex-1 flex items-center justify-end gap-1.5 pointer-events-auto" @click="$emit('status-tap')">
        <div class="flex items-center gap-1">
          <div class="flex items-end gap-[2px]">
            <div 
              v-for="bar in signalBars" 
              :key="'signal-' + bar.index"
              :class="[
                'w-[3px] bg-current rounded-[1px] transition-opacity duration-200',
                \`h-[\${bar.height}px]\`,
                bar.isActive ? 'opacity-100' : 'opacity-30',
                bar.isWeak && bar.isActive ? 'text-orange-400' : bar.noService ? 'text-red-400' : 'text-white'
              ]"
            ></div>
          </div>
          <span class="text-[14px] font-medium tracking-[-0.08px] text-white ml-1">{{ networkDisplayText }}</span>
        </div>
               
        <div class="flex items-center gap-1 ml-1">
          <div class="relative">
            <div class="w-[24px] h-[12px] border-[1px] border-white rounded-[4px] flex items-center p-[1px]">
              <div 
                class="h-full rounded-[3px] transition-all duration-300"
                :style="{width: Math.max(2, batteryFillWidth) + '%'}"
                :class="[
                  isCharging ? 'bg-green-400' : 
                  batteryLevel <= 20 ? 'bg-red-400' : 
                  batteryLevel <= 50 ? 'bg-yellow-400' : 'bg-white'
                ]"
              ></div>
            </div>
            <div class="absolute -right-[2px] top-[3px] w-[1px] h-[6px] bg-white rounded-r-[1px]"></div>
            <div v-if="isCharging" class="absolute inset-0 flex items-center justify-center">
              <svg class="w-[8px] h-[8px] text-black z-10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8,24V16H4L12,0V8H16L8,24Z"/>
              </svg>
            </div>
          </div>
          <span 
            v-if="batteryLevel <= 20 || isCharging" 
            class="text-[14px] font-medium tracking-[-0.08px] text-white ml-1"
          >
            {{ Math.floor(batteryLevel) }}%
          </span>
        </div>
      </div>
    </div>
  `
};

if (typeof window !== 'undefined' && window.Vue) {
  window.StatusBar = StatusBar;
}
