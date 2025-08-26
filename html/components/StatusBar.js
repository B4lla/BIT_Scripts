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
    <div class="status-bar status-bar-element" :class="[textColor]">
      <div class="status-bar-left">
        <div class="time-display status-interactive" @click="$emit('time-tap')">
          {{ currentTime }}
        </div>
      </div>

      <div class="status-bar-right" @click="$emit('status-tap')">

        <div class="network-type" :class="{ 'no-service': signalStrength === 0 }">
          {{ networkDisplayText }}
        </div>
        
        <div class="flex items-end gap-0.5 mx-1">
          <div 
            v-for="bar in signalBars" 
            :key="'signal-' + bar.index"
            class="signal-bar w-0.5 rounded-full transition-all duration-300"
            :class="{
              'weak': bar.isWeak && bar.isActive,
              'no-service': bar.noService
            }"
            :style="{ 
              height: bar.height + 'px',
              opacity: bar.isActive ? (bar.noService ? 0.2 : 0.9) : 0.2,
              backgroundColor: bar.noService ? '#ff3b30' : 'currentColor'
            }"
          ></div>
        </div>
        
        <svg class="status-icon wifi" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
        </svg>
        
        <div class="battery-container">
          <div class="battery-body">
            <div 
              class="battery-fill"
              :class="batteryColorClass"
              :style="{ 
                width: batteryFillWidth + '%',
                backgroundColor: isCharging ? '#34c759' : 
                               batteryLevel <= 5 ? '#ff3b30' :
                               batteryLevel <= 20 ? '#ff9500' : 
                               'currentColor'
              }"
            >
              <div v-if="isCharging" class="absolute inset-0 flex items-center justify-center">
                <svg class="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11,21H9L13,2H15M12.5,11H15L11,21V13.5H9L12.5,11V11Z"/>
                </svg>
              </div>
            </div>
            <div class="battery-terminal"></div>
          </div>
          
          <div class="battery-percentage">
            {{ Math.floor(batteryLevel) }}%
          </div>
        </div>
        
      </div>
    </div>
  `
};

if (typeof window !== 'undefined' && window.Vue) {
  window.StatusBar = StatusBar;
}
