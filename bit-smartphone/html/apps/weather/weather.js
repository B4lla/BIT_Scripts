const Weather = {
  name: 'Weather',
  
  
  
  props: {
    t: {
      type: Function,
      default: () => (key) => key
    },
    weatherData: {
      type: Object,
      default: () => ({
        temperature: 0,
        condition: 'clear',
        conditionFriendlyName: 'Cargando...',
        windSpeed: 0,
        windDirection: 0,
        inGameTime: '',
        inGameDate: 'Recibiendo datos...'
      })
    },
    playerData: {
      type: Object,
      default: () => ({
        serverName: 'Los Santos',
        street: 'Buscando señal GPS...',
        zone: '...',
        heading: 0
      })
    }
  },
  emits: ["close"],
  setup(props, { emit }) {
    const getWeatherIcon = (condition) => {
      const icons = {
        extrasunny: "sun", clear: "sun", sunny: "sun",
        clouds: "cloud", overcast: "cloud-sun",
        smog: "cloud-fog", foggy: "cloud-fog",
        rain: "cloud-rain", drizzle: "cloud-drizzle",
        thunder: "cloud-lightning", clearing: "cloud-sun-rain",
        snow: "cloud-snow", blizzard: "wind-snow",
      };
      return icons[props.weatherData?.condition?.toLowerCase()] || "sun";
    };

    const getWindDirection = (degrees) => {
      if (typeof degrees !== 'number') return '...';
      const directions = [
        props.t('weather.directions.n'),
        props.t('weather.directions.ne'),
        props.t('weather.directions.e'),
        props.t('weather.directions.se'),
        props.t('weather.directions.s'),
        props.t('weather.directions.sw'),
        props.t('weather.directions.w'),
        props.t('weather.directions.nw')
      ];
      return directions[Math.round(degrees / 45) % 8];
    };

    const getConditionName = (condition) => {
      const conditionKey = 'weather.conditions.' + condition?.toLowerCase();
      const translated = props.t(conditionKey);
      return translated !== conditionKey ? translated : props.weatherData.conditionFriendlyName;
    };

    return {
      emit,
      getWeatherIcon,
      getWindDirection,
      getConditionName,
    };
  },

  
  template: `
  
  <div class="h-full w-full relative text-white font-sans overflow-hidden">
    
    
    <div class="absolute inset-0 bg-cover bg-center z-0 transition-all duration-1000" 
         style="background-image: url('./assets/background.jpg'); transform: scale(1.05);">
    </div>
    
    <div class="absolute inset-0 bg-sky-400/60 backdrop-blur blur-sm z-0"></div>

    
    <div class="relative z-10 flex items-center justify-center h-full pl-8">
      <div class="w-96">
        <div class="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          
          <header class="p-6 border-b border-white/10">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-2xl font-bold tracking-tight">{{ playerData.serverName }}</h1>
                <p class="text-blue-300/80">{{ weatherData.inGameDate }}</p>
              </div>
              <p class="text-xl font-medium bg-black/30 rounded-lg px-3 py-1">{{ weatherData.inGameTime }}</p>
            </div>
            
            <div class="text-center my-6">
              <p class="text-8xl font-thin tracking-tighter">{{ Math.round(weatherData.temperature) }}°</p>
              <p class="text-xl text-white/80 capitalize">{{ getConditionName(weatherData.condition) }}</p>
            </div>
          </header>
          
          <section class="p-6 space-y-5">
            <div>
              <p class="text-xs text-white/50 tracking-widest uppercase">{{ t('weather.location') }}</p>
              <p class="text-lg font-semibold">{{ playerData.street }}</p>
              <p class="text-md text-white/80">{{ playerData.zone }}</p>
            </div>

            <div>
              <p class="text-xs text-white/50 tracking-widest uppercase">{{ t('weather.wind_direction') }}</p>
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center space-x-2">
                  <svg class="w-8 h-8 text-blue-400 transition-transform duration-500" :style="{ transform: 'rotate(' + playerData.heading + 'deg)' }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 17 10-17L12 2z"/><path d="M12 22V12"/></svg>
                  <span class="text-2xl font-bold">{{ Math.round(playerData.heading) }}°</span>
                </div>
                <div class="text-right">
                  <p class="text-2xl font-bold">{{ Math.round(weatherData.windSpeed * 3.6) }} <span class="text-lg font-normal">km/h</span></p>
                  <p class="text-md text-white/80">{{ t('weather.wind_from') }} {{ getWindDirection(weatherData.windDirection) }}</p>
                </div>
              </div>
            </div>
          </section>

          <button @click="emit('close')" class="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
};

window.Weather = window.Weather || Weather;