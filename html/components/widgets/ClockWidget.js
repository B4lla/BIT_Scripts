

const ClockWidget = {
  name: 'ClockWidget',
  props: {
    t: { type: Function, required: true },
    size: { type: String, default: '2x2' }
  },
  data() {
    return {
      currentTime: '',
      currentDate: '',
      timer: null
    };
  },
  computed: {
    widgetClasses() {
      const sizeClasses = {
        '2x2': 'col-span-2 row-span-2',
        '2x1': 'col-span-2 row-span-1'
      };
      return sizeClasses[this.size] + ' bg-gradient-to-br from-gray-900/40 to-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-4 text-white shadow-xl';
    }
  },
  methods: {
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: this.size === '2x2' ? '2-digit' : undefined
      });
      this.currentDate = now.toLocaleDateString('es-ES', { 
        weekday: 'long',
        day: 'numeric', 
        month: this.size === '2x2' ? 'long' : 'short'
      });
    }
  },
  mounted() {
    this.updateTime();
    this.timer = setInterval(this.updateTime, 1000);
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  template: `
    <div :class="widgetClasses">
      <div v-if="size === '2x2'" class="flex flex-col h-full justify-center items-center text-center">
        <div class="text-3xl font-light mb-2">{{ currentTime }}</div>
        <div class="text-sm opacity-75 capitalize">{{ currentDate }}</div>
      </div>
      
      <div v-else-if="size === '2x1'" class="flex items-center justify-between h-full">
        <div>
          <div class="text-xl font-light">{{ currentTime.slice(0, 5) }}</div>
          <div class="text-xs opacity-75 capitalize">{{ currentDate }}</div>
        </div>
        <div class="text-2xl opacity-60">🕐</div>
      </div>
    </div>
  `
};
window.ClockWidget = ClockWidget;