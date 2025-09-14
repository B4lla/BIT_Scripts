var WeatherWidget = {
  name: 'WeatherWidget',
  props: {
    weatherData: { type: Object, required: true },
    t: { type: Function, required: true },
    size: { type: String, default: '2x2' } 
  },
  computed: {
    widgetClasses() {
      const sizeClasses = {
        '2x2': 'col-span-2 row-span-2',
        '4x2': 'col-span-4 row-span-2'
      };
      return sizeClasses[this.size] + ' bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-xl border border-white/20 rounded-3xl p-4 text-white shadow-xl';
    },
    
    weatherIcon() {
      const icons = {
        sunny: '☀️',
        cloudy: '☁️',
        rainy: '🌧️',
        snowy: '❄️'
      };
      return icons[this.weatherData.forecast[0].condition] || '☀️';
    }
  },
  template: `
    <div :class="widgetClasses">
      <div v-if="size === '2x2'" class="flex flex-col h-full justify-between">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-75">{{ weatherData.location }}</span>
          <span class="text-lg">{{ weatherIcon }}</span>
        </div>
        <div class="flex flex-col items-center">
          <span class="text-2xl font-light">{{ weatherData.temperature }}°</span>
          <span class="text-xs opacity-75">{{ weatherData.condition }}</span>
        </div>
      </div>
      
      <div v-else-if="size === '4x2'" class="flex h-full">
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-lg">{{ weatherIcon }}</span>
              <span class="text-sm opacity-75">{{ weatherData.location }}</span>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-light">{{ weatherData.temperature }}°</span>
              <span class="text-sm opacity-75">{{ weatherData.condition }}</span>
            </div>
          </div>
          <div class="flex gap-2 text-xs opacity-75">
            <span>H:{{ weatherData.forecast[0].high }}°</span>
            <span>L:{{ weatherData.forecast[0].low }}°</span>
          </div>
        </div>
        
        <div class="flex-1 flex justify-around items-center">
          <div v-for="day in weatherData.forecast.slice(1, 4)" :key="day.day" 
               class="flex flex-col items-center gap-1">
            <span class="text-xs opacity-75">{{ day.day.slice(0, 3) }}</span>
            <span class="text-sm">{{ day.condition === 'sunny' ? '☀️' : day.condition === 'cloudy' ? '☁️' : '🌧️' }}</span>
            <span class="text-xs">{{ day.high }}°</span>
          </div>
        </div>
      </div>
    </div>
  `
};
window.WeatherWidget = WeatherWidget;