

const BatteryWidget = {
  name: 'BatteryWidget',
  props: {
    batteryLevel: { type: Number, required: true },
    t: { type: Function, required: true },
    size: { type: String, default: '1x1' }
  },
  computed: {
    widgetClasses() {
      const sizeClasses = {
        '1x1': 'col-span-1 row-span-1',
        '2x1': 'col-span-2 row-span-1'
      };
      return `${sizeClasses[this.size]} bg-gradient-to-br from-green-400/20 to-green-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-3 text-white shadow-xl`;
    },
    
    batteryColor() {
      if (this.batteryLevel > 50) return 'bg-green-400';
      if (this.batteryLevel > 20) return 'bg-yellow-400';
      return 'bg-red-400';
    },
    
    batteryIcon() {
      if (this.batteryLevel > 75) return '🔋';
      if (this.batteryLevel > 50) return '🔋';
      if (this.batteryLevel > 25) return '🪫';
      return '🪫';
    }
  },
  template: `
    <div :class="widgetClasses">
      <div v-if="size === '1x1'" class="flex flex-col h-full justify-center items-center">
        <span class="text-lg mb-1">{{ batteryIcon }}</span>
        <span class="text-sm font-medium">{{ batteryLevel }}%</span>
      </div>
      
      <div v-else-if="size === '2x1'" class="flex items-center h-full gap-3">
        <span class="text-xl">{{ batteryIcon }}</span>
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium">Batería</span>
            <span class="text-sm">{{ batteryLevel }}%</span>
          </div>
          <div class="w-full bg-white/20 rounded-full h-2">
            <div :class="batteryColor" 
                 class="h-2 rounded-full transition-all duration-300" 
                 :style="{ width: batteryLevel + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
window.BatteryWidget = BatteryWidget;