const Weather = {
  name: 'Weather',
  props: {
    t: {
      type: Function,
      default: () => (key) => key,
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, computed, onMounted } = Vue;

    const weatherData = ref({
      condition: 'clear',
      inGameTime: '--:--',
      rawWeatherType: 'CLEAR',
      real_weather: '',
      real_weather_description: '',
      city: '',
      country: '',
      temperature: null,
      windSpeed: null,
      windDirection: null,
    });
    const isLoading = ref(true);
    const lastUpdate = ref(new Date());

    const showCityPanel = ref(false);
    const newCity = ref('');
    const newCountry = ref('');
    const cityMessage = ref('');
    const citySuccess = ref(false);
    const citySuggestions = ref([
      { city: 'London', country: 'GB' },
      { city: 'Madrid', country: 'ES' },
      { city: 'Los Angeles', country: 'US' },
      { city: 'Buenos Aires', country: 'AR' },
      { city: 'Paris', country: 'FR' },
      { city: 'Berlin', country: 'DE' },
    ]);

    const weatherIcon = computed(() => {
      const map = {
        extrasunny: 'brightness-high',
        clear: 'sun',
        sunny: 'sun',
        clouds: 'cloud',
        overcast: 'clouds',
        smog: 'cloud-haze2',
        foggy: 'cloud-fog',
        rain: 'cloud-rain-heavy',
        drizzle: 'cloud-drizzle',
        thunder: 'cloud-lightning-rain',
        clearing: 'cloud-sun',
        snow: 'cloud-snow',
        blizzard: 'snow3',
      };
      return map[(weatherData.value.condition || '').toLowerCase()] || 'sun';
    });

    const weatherIconColor = computed(() => {
      const colors = {
        extrasunny: 'text-yellow-300',
        clear: 'text-yellow-400',
        sunny: 'text-yellow-400',
        clouds: 'text-gray-300',
        overcast: 'text-gray-400',
        smog: 'text-yellow-600',
        foggy: 'text-gray-300',
        rain: 'text-blue-400',
        drizzle: 'text-blue-300',
        thunder: 'text-purple-400',
        clearing: 'text-blue-300',
        snow: 'text-blue-100',
        blizzard: 'text-white',
      };
      return colors[(weatherData.value.condition || '').toLowerCase()] || 'text-yellow-400';
    });

    const conditionName = computed(() => {
      return (
        weatherData.value.real_weather_description ||
        weatherData.value.real_weather ||
        weatherData.value.rawWeatherType ||
        weatherData.value.condition ||
        '...'
      );
    });

    const temperatureCelsius = computed(() =>
      weatherData.value.temperature != null ? Math.round(weatherData.value.temperature) : '--'
    );
    const temperatureFahrenheit = computed(() =>
      weatherData.value.temperature != null
        ? Math.round((weatherData.value.temperature * 9) / 5 + 32)
        : '--'
    );
    const windSpeedKmh = computed(() =>
      weatherData.value.windSpeed != null ? Math.round(weatherData.value.windSpeed * 3.6) : '--'
    );
    const windSpeedMph = computed(() =>
      weatherData.value.windSpeed != null ? Math.round(weatherData.value.windSpeed * 2.237) : '--'
    );
    const windDirection = computed(() => {
      if (typeof weatherData.value.windDirection !== 'number') return '...';
      const t = (k, d) => (props.t && props.t(k)) || d;
      const dirs = [
        t('weather.directions.n', 'N'),
        t('weather.directions.ne', 'NE'),
        t('weather.directions.e', 'E'),
        t('weather.directions.se', 'SE'),
        t('weather.directions.s', 'S'),
        t('weather.directions.sw', 'SW'),
        t('weather.directions.w', 'W'),
        t('weather.directions.nw', 'NW'),
      ];
      return dirs[Math.round(weatherData.value.windDirection / 45) % 8];
    });

    const weatherGradient = computed(() => {
      const gradients = {
        extrasunny: 'from-orange-400 via-red-500 to-pink-600',
        clear: 'from-blue-400 via-sky-500 to-cyan-600',
        sunny: 'from-yellow-400 via-orange-400 to-red-400',
        clouds: 'from-gray-400 via-slate-500 to-blue-600',
        overcast: 'from-gray-600 via-slate-700 to-gray-800',
        smog: 'from-yellow-600 via-orange-600 to-red-700',
        foggy: 'from-gray-300 via-slate-400 to-blue-500',
        rain: 'from-blue-600 via-slate-700 to-blue-900',
        drizzle: 'from-blue-400 via-slate-500 to-blue-700',
        thunder: 'from-purple-800 via-slate-800 to-indigo-900',
        clearing: 'from-slate-500 via-blue-500 to-yellow-500',
        snow: 'from-blue-200 via-white to-cyan-300',
        blizzard: 'from-slate-700 via-blue-300 to-white',
      };
      const key = (weatherData.value.condition || '').toLowerCase();
      return gradients[key] || gradients.clear;
    });

    const backgroundEffects = computed(() => {
      const effects = {
        rain: 'rain-effect',
        drizzle: 'drizzle-effect',
        thunder: 'lightning-effect',
        snow: 'snow-effect',
        blizzard: 'blizzard-effect',
        foggy: 'fog-effect',
        smog: 'smog-effect',
      };
      return effects[(weatherData.value.condition || '').toLowerCase()] || '';
    });

    const backgroundElements = computed(() => {
      const condition = (weatherData.value.condition || '').toLowerCase();
      const elements = [];
      if (condition === 'rain' || condition === 'drizzle') {
        elements.push(
          { icon: 'bi-cloud-rain-heavy', position: 'top-1/4 left-1/4', size: '12rem', opacity: '0.1' },
          { icon: 'bi-droplet', position: 'top-1/2 right-1/4', size: '8rem', opacity: '0.08' },
          { icon: 'bi-cloud-rain', position: 'bottom-1/3 left-1/3', size: '10rem', opacity: '0.12' }
        );
      } else if (condition === 'thunder') {
        elements.push(
          { icon: 'bi-cloud-lightning-rain', position: 'top-1/3 left-1/2', size: '15rem', opacity: '0.15' },
          { icon: 'bi-lightning', position: 'top-1/2 right-1/3', size: '10rem', opacity: '0.1' }
        );
      } else if (condition === 'snow' || condition === 'blizzard') {
        elements.push(
          { icon: 'bi-snow', position: 'top-1/4 left-1/4', size: '10rem', opacity: '0.12' },
          { icon: 'bi-snow2', position: 'top-1/2 right-1/4', size: '8rem', opacity: '0.1' },
          { icon: 'bi-snow3', position: 'bottom-1/3 left-1/2', size: '12rem', opacity: '0.08' }
        );
      } else if (condition === 'clouds' || condition === 'overcast') {
        elements.push(
          { icon: 'bi-clouds', position: 'top-1/4 left-1/3', size: '14rem', opacity: '0.1' },
          { icon: 'bi-cloud', position: 'top-1/2 right-1/4', size: '10rem', opacity: '0.08' }
        );
      } else if (condition === 'foggy') {
        elements.push(
          { icon: 'bi-cloud-fog', position: 'top-1/3 left-1/2', size: '16rem', opacity: '0.12' },
          { icon: 'bi-cloud-fog2', position: 'bottom-1/3 right-1/3', size: '12rem', opacity: '0.08' }
        );
      } else {
        elements.push(
          { icon: 'bi-sun', position: 'top-1/4 right-1/4', size: '14rem', opacity: '0.1' },
          { icon: 'bi-brightness-high', position: 'bottom-1/3 left-1/4', size: '10rem', opacity: '0.08' }
        );
      }
      return elements;
    });

    const fetchWeatherData = async () => {
      try {
        isLoading.value = true;
        const res = await fetch('https://bit-smartphone/weather:getInitialData', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.weatherData) {
            weatherData.value = { ...weatherData.value, ...data.weatherData };
            newCity.value = data.weatherData.city || '';
            newCountry.value = data.weatherData.country || '';
          }
          lastUpdate.value = new Date();
        }
      } catch (e) {
      } finally {
        isLoading.value = false;
      }
    };
    const refreshWeather = async () => {
      await fetchWeatherData();
    };

    const openCityPanel = () => {
      cityMessage.value = '';
      citySuccess.value = false;
      showCityPanel.value = true;
    };
    const closeCityPanel = () => {
      showCityPanel.value = false;
    };
    const applyCity = async () => {
      if (!newCity.value || newCity.value.trim() === '') {
        cityMessage.value = (props.t && props.t('weather.city_required')) || 'Ciudad requerida';
        citySuccess.value = false;
        return;
      }
      try {
        const res = await fetch('https://bit-smartphone/weather:setCity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: newCity.value, country: newCountry.value }),
        });
        if (!res.ok) throw new Error('nui_error');
      } catch (e) {
        cityMessage.value = (props.t && props.t('weather.change_failed')) || 'No se pudo cambiar la ciudad';
        citySuccess.value = false;
      }
    };
    const selectSuggestion = async (s) => {
      newCity.value = s.city;
      newCountry.value = s.country;
      await applyCity();
    };

    onMounted(() => {
      fetchWeatherData();
      window.addEventListener('message', (event) => {
        if (!event || !event.data) return;
        if (event.data.type === 'weather:update') {
          if (event.data.weatherData) {
            weatherData.value = { ...weatherData.value, ...event.data.weatherData };
          }
          lastUpdate.value = new Date();
        } else if (event.data.type === 'weather:initialData') {
          const payload = event.data.data || {};
          if (payload.weatherData) {
            weatherData.value = { ...weatherData.value, ...payload.weatherData };
            newCity.value = payload.weatherData.city || '';
            newCountry.value = payload.weatherData.country || '';
          }
          lastUpdate.value = new Date();
          isLoading.value = false;
        } else if (event.data.type === 'weather:citySet') {
          const ok = !!event.data.success;
          citySuccess.value = ok;
          const errorMsg = (event.data.info && event.data.info.error) || '';
          cityMessage.value = ok
            ? (props.t && props.t('weather.city_changed')) || 'Ciudad actualizada'
            : errorMsg || (props.t && props.t('weather.change_failed')) || 'No se pudo cambiar la ciudad';
          if (ok) {
            showCityPanel.value = false;
            refreshWeather();
          }
        }
      });
    });

    return {
      emit,
      weatherData,
      isLoading,
      lastUpdate,
      weatherIcon,
      weatherIconColor,
      conditionName,
      temperatureCelsius,
      temperatureFahrenheit,
      windSpeedKmh,
      windSpeedMph,
      windDirection,
      weatherGradient,
      backgroundEffects,
      backgroundElements,
      refreshWeather,
      showCityPanel,
      newCity,
      newCountry,
      cityMessage,
      citySuccess,
      citySuggestions,
      openCityPanel,
      closeCityPanel,
      applyCity,
      selectSuggestion,
    };
  },
  template: `
    <div class="weather-app h-full w-full relative overflow-hidden">
      <div class="absolute inset-0 transition-all duration-1000" :class="'bg-gradient-to-br ' + weatherGradient">
        <div class="absolute inset-0 bg-black/25 backdrop-blur-sm"></div>
        <div v-if="backgroundEffects" class="absolute inset-0" :class="backgroundEffects"></div>
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div v-for="(element, index) in backgroundElements" :key="index" class="absolute transition-all duration-700" :class="element.position" :style="'transform: translate(-50%, -50%); font-size: ' + element.size + '; opacity: ' + element.opacity + '; filter: blur(2px);'">
            <i :class="['bi', element.icon, 'text-white drop-shadow-2xl']"></i>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="text-center text-white">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-lg font-medium">{{ $t('weather.loading') }}</p>
        </div>
      </div>

      <div class="relative z-10 h-full flex flex-col">
        <div class="flex justify-between items-center pt-12 pb-6 px-6 bg-black/20 backdrop-blur-sm">
          <h1 class="text-xl font-bold text-white">{{ $t('weather.title') }}</h1>
          <div class="flex gap-2">
            <button @click="refreshWeather" :disabled="isLoading" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 disabled:opacity-50">
              <i class="bi bi-arrow-clockwise" :class="{ 'animate-spin': isLoading }"></i>
            </button>
            <button @click="openCityPanel" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200">
              <i class="bi bi-geo-alt"></i>
            </button>
            <button @click="emit('close')" class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        <div class="flex-1 flex items-center justify-center p-6">
          <div class="text-center text-white max-w-sm">
            <div class="mb-6 flex items-center justify-center">
              <div class="weather-orb">
                <div class="glow-ring"></div>
                <i :class="['bi', 'bi-' + weatherIcon, weatherIconColor]" class="text-8xl opacity-90 filter drop-shadow-2xl relative z-10"></i>
              </div>
            </div>
            <div class="mb-4">
              <div class="text-7xl font-thin tracking-tighter">{{ temperatureCelsius }}°</div>
              <div class="text-lg text-white/80">{{ temperatureFahrenheit }}°F</div>
            </div>
            <div class="mb-6">
              <h2 class="text-2xl font-semibold capitalize mb-1 flex items-center justify-center gap-2">
                <span>{{ conditionName }}</span>
                <span v-if="weatherData.real_weather || weatherData.real_weather_description" class="text-xs px-2 py-0.5 rounded-full bg-white/10 border border-white/20 uppercase tracking-wider">Real</span>
              </h2>
              <div class="flex items-center justify-center gap-2 mb-2">
                <div :class="weatherIconColor" class="w-2 h-2 rounded-full animate-pulse"></div>
                <span class="text-sm text-white/80 uppercase tracking-wide">{{ weatherData.rawWeatherType || 'LIVE' }}</span>
                <div :class="weatherIconColor" class="w-2 h-2 rounded-full animate-pulse"></div>
              </div>
              <p class="text-white/70">{{ $t('weather.source') }} {{ weatherData.real_weather_description || weatherData.real_weather || weatherData.rawWeatherType }}</p>
            </div>
            <div class="mb-4">
              <p class="text-lg font-medium">{{ (weatherData.city || '') + (weatherData.country ? ', ' + weatherData.country : '') || $t('weather.no_city') }}</p>
            </div>
            <div class="flex justify-center gap-6 text-sm text-white/80">
              <div class="flex items-center gap-2">
                <i class="bi bi-clock"></i>
                <span>{{ weatherData.inGameTime }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-black/30 backdrop-blur-sm relative">
          <div class="grid grid-cols-2 gap-3">
            <div v-if="windSpeedKmh !== '--'" class="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white border-l-4 border-cyan-400 card-glow">
              <div class="flex items-center gap-2 mb-2">
                <i class="bi bi-wind text-cyan-300"></i>
                <span class="text-sm font-medium">{{ $t('weather.wind') }}</span>
              </div>
              <div class="text-lg font-semibold">{{ windSpeedKmh }} km/h</div>
              <div class="text-xs text-white/70">{{ windSpeedMph }} mph {{ windDirection }}</div>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-white/10 text-center">
            <p class="text-xs text-white/60"><i class="bi bi-arrow-clockwise mr-1"></i>{{ $t('weather.lastUpdate') }}: {{ lastUpdate.toLocaleTimeString() }}</p>
            <p class="text-xs text-white/50 mt-1">{{ $t('weather.poweredBy') }} cd_easytime</p>
          </div>
          <div class="waves"><div class="wave wave1"></div><div class="wave wave2"></div><div class="wave wave3"></div></div>
        </div>
      </div>

      <div v-if="showCityPanel" class="absolute inset-0 z-50">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeCityPanel"></div>
        <div class="absolute left-0 right-0 bottom-0 bg-white/10 backdrop-blur-xl rounded-t-2xl p-5 border border-white/15 mx-2 mb-2 shadow-2xl animate-[slideUp_0.25s_ease]">
          <div class="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-4"></div>
          <div class="text-white mb-3">
            <h3 class="text-lg font-semibold mb-1">{{ $t('weather.choose_city') || 'Selecciona ciudad real' }}</h3>
            <p class="text-sm text-white/70">{{ $t('weather.city_hint') || 'Esto afectará la meteo y hora reales vía cd_easytime' }}</p>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <input v-model="newCity" class="bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50" :placeholder="$t('weather.city') || 'Ciudad'" />
            <input v-model="newCountry" class="bg-white/10 border border-white/20 rounded-lg p-2 text-white placeholder-white/50" :placeholder="$t('weather.country') || 'País (código)'" />
          </div>
          <div class="flex flex-wrap gap-2 mb-4">
            <button v-for="s in citySuggestions" :key="s.city + s.country" @click="selectSuggestion(s)" class="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 active:scale-95">{{ s.city }}, {{ s.country }}</button>
          </div>
          <div v-if="cityMessage" :class="['mb-3 text-sm', citySuccess ? 'text-emerald-300' : 'text-red-300']">{{ cityMessage }}</div>
          <div class="flex gap-2">
            <button @click="closeCityPanel" class="flex-1 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 active:scale-95">{{ $t('common.cancel') || 'Cancelar' }}</button>
            <button @click="applyCity" class="flex-1 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95">{{ $t('common.apply') || 'Aplicar' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
};

window.Weather = window.Weather || Weather;