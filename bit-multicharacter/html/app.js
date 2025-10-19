function waitForVueAndInit() {
    let attempts = 0;
    const maxAttempts = 50; 
    
    function checkVue() {
        attempts++;
        
        if (typeof Vue !== 'undefined') {
            initializeVueApp();
            return;
        }
        
        if (attempts >= maxAttempts) {
            document.getElementById('app').innerHTML = `
                <div style="color: red; text-align: center; margin-top: 50px; font-family: Arial; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px;">
                    <h2>Error: Vue.js no se pudo cargar</h2>
                    <p>El sistema no pudo conectarse a los CDN de Vue.js</p>
                    <p>Intentos: ${attempts}/${maxAttempts}</p>
                    <p>Contacta al administrador del servidor</p>
                </div>
            `;
            return;
        }
        
        setTimeout(checkVue, 100);
    }
    
    checkVue();
}

function initializeVueApp() {
    const { createApp, ref, computed, onMounted, nextTick } = Vue;

    const performanceOptimizer = {
    preloadElements() {
        const criticalElements = [
            '.neo-panel',
            '.neo-button', 
            '.character-card',
            '.cyber-grid'
        ];
        
        criticalElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el) {
                    el.offsetHeight;
                }
            });
        });
    },

    optimizeAnimations() {
        const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-slide-up, .animate-float');
        animatedElements.forEach(el => {
            el.style.transform = 'translateZ(0)';
            el.style.backfaceVisibility = 'hidden';
            el.style.perspective = '1000px';
        });
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    performanceOptimizer.preloadElements();
    setTimeout(() => performanceOptimizer.optimizeAnimations(), 100);
});

const app = Vue.createApp({
  template: `
    <div class="min-h-screen relative overflow-hidden">
      <div class="cyber-grid"></div>
      <div class="connection-dots"></div>
      <div class="ambient-light"></div>
      <div class="corner-flare top-left-flare"></div>
      <div class="corner-flare bottom-right-flare"></div>
      
      <div v-if="settings.darkFilter" class="absolute inset-0 bg-black opacity-40 z-10 pointer-events-none"></div>
      <div class="vignette-overlay"></div>
      <div class="noise-overlay"></div>
      
      <div v-if="settings.particles" class="absolute inset-0 overflow-hidden pointer-events-none" style="z-index: 10;">
        <div v-for="i in 12" :key="i" class="particle" 
            :style="{
              top: Math.random() * 100 + '%', 
              left: Math.random() * 100 + '%',
              width: (Math.random() * 3 + 1) + 'px',
              height: (Math.random() * 3 + 1) + 'px',
              animationDelay: (Math.random() * 5) + 's',
              animationDuration: (Math.random() * 5 + 3) + 's'
            }">
        </div>
      </div>
      
          <div class="fixed top-5 right-5 z-50 flex flex-col gap-3">
        <button 
          @click="toggleSettings" 
          class="neo-button w-12 h-12 bg-black/80 hover:bg-black/90 border theme-border-primary/30 hover:theme-border-primary/50 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg theme-shadow-primary/20 glowing-border"
          :class="{'theme-bg-primary-dark/80': showSettings}"
          title="Configuracion"
        >
          <svg class="w-6 h-6 theme-text-primary rotate-icon"><use href="#icon-settings"></use></svg>
        </button>
      </div>
      
      <transition name="slide-left">
        <div v-if="showSettings" class="fixed top-0 right-0 z-40 h-full w-80 neo-panel bg-black/90 shadow-xl shadow-black/50 overflow-y-auto">
          <div class="p-5 border-b theme-border-primary/20">
            <div class="deco-line w-full mb-2 opacity-50"></div>
            <div class="flex justify-between items-center">
              <h2 class="font-display text-xl font-bold text-glow title-gradient">{{ t('settings') }}</h2>
              <button @click="toggleSettings" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/50 transition-colors">
                <svg class="w-5 h-5 theme-text-primary"><use href="#icon-x"></use></svg>
              </button>
            </div>
            <div class="deco-line w-full mt-2 opacity-50"></div>
          </div>
          
          <div class="p-5 space-y-6">
            <div class="neo-card p-4 animate-fade-scale">
              <div class="corner-decoration top-left"></div>
              <div class="corner-decoration top-right"></div>
              <div class="corner-decoration bottom-left"></div>
              <div class="corner-decoration bottom-right"></div>
              <h3 class="text-sm font-display font-semibold theme-text-primary-300 mb-3 uppercase tracking-wider flex items-center">
                <span class="status-indicator mr-2"></span>
{{ t('theme_colors') }}
              </h3>
              <div class="flex space-x-3 flex-wrap gap-2">
                <button @click="applyTheme('teal')" class="w-8 h-8 rounded-full bg-teal-500 transition-transform hover:scale-110" :class="{'ring-2 ring-offset-2 ring-offset-slate-900 ring-white': settings.themeColor === 'teal'}"></button>
                <button @click="applyTheme('blue')" class="w-8 h-8 rounded-full bg-blue-500 transition-transform hover:scale-110" :class="{'ring-2 ring-offset-2 ring-offset-slate-900 ring-white': settings.themeColor === 'blue'}"></button>
                <button @click="applyTheme('purple')" class="w-8 h-8 rounded-full bg-purple-500 transition-transform hover:scale-110" :class="{'ring-2 ring-offset-2 ring-offset-slate-900 ring-white': settings.themeColor === 'purple'}"></button>
                <button @click="applyTheme('amber')" class="w-8 h-8 rounded-full bg-amber-500 transition-transform hover:scale-110" :class="{'ring-2 ring-offset-2 ring-offset-slate-900 ring-white': settings.themeColor === 'amber'}"></button>
                <button @click="applyTheme('red')" class="w-8 h-8 rounded-full bg-red-500 transition-transform hover:scale-110" :class="{'ring-2 ring-offset-2 ring-offset-slate-900 ring-white': settings.themeColor === 'red'}"></button>
              </div>
            </div>
            
            <div>
              <h3 class="text-sm font-display font-semibold theme-text-primary-300 mb-3 uppercase tracking-wider flex items-center">
                <span class="status-indicator mr-2"></span>
{{ t('streamer_mode') }}
              </h3>
              <div class="flex items-center">
                <label class="inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="settings.streamerMode" class="sr-only peer">
                  <div class="relative w-11 h-6 bg-black/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:theme-bg-primary/50 after:theme-border-primary/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:theme-bg-primary peer-checked:shadow-[0_0_8px_rgba(var(--theme-primary),0.5)]"></div>
                  <span class="ms-3 text-sm font-medium text-white">{{ settings.streamerMode ? t('enabled') : t('disabled') }}</span>
                </label>
              </div>
            </div>
            
            <div class="neo-card p-4 animate-fade-scale" style="animation-delay: 0.1s;">
              <div class="corner-decoration top-left"></div>
              <div class="corner-decoration top-right"></div>
              <div class="corner-decoration bottom-left"></div>
              <div class="corner-decoration bottom-right"></div>
              <h3 class="text-sm font-display font-semibold theme-text-primary-300 mb-3 uppercase tracking-wider flex items-center">
                <span class="status-indicator mr-2"></span>
                {{ t('dark_filter') }}
              </h3>
              <div class="flex items-center">
                <label class="inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="settings.darkFilter" class="sr-only peer">
                  <div class="relative w-11 h-6 bg-black/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:theme-bg-primary/50 after:theme-border-primary/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:theme-bg-primary peer-checked:shadow-[0_0_8px_rgba(var(--theme-primary),0.5)]"></div>
                  <span class="ms-3 text-sm font-medium text-white">{{ settings.darkFilter ? t('enabled') : t('disabled') }}</span>
                </label>
              </div>
            </div>
            
            <div class="neo-card p-4 animate-fade-scale" style="animation-delay: 0.2s;">
              <div class="corner-decoration top-left"></div>
              <div class="corner-decoration top-right"></div>
              <div class="corner-decoration bottom-left"></div>
              <div class="corner-decoration bottom-right"></div>
              <h3 class="text-sm font-display font-semibold theme-text-primary-300 mb-3 uppercase tracking-wider flex items-center">
                <span class="status-indicator mr-2"></span>
                {{ t('particle_effects') }}
              </h3>
              <div class="flex items-center">
                <label class="inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="settings.particles" class="sr-only peer">
                  <div class="relative w-11 h-6 bg-black/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:theme-bg-primary/50 after:theme-border-primary/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:theme-bg-primary peer-checked:shadow-[0_0_8px_rgba(var(--theme-primary),0.5)]"></div>
                  <span class="ms-3 text-sm font-medium text-white">{{ settings.particles ? t('enabled') : t('disabled') }}</span>
                </label>
              </div>
            </div>
            
            <div class="neo-card p-4 animate-fade-scale" style="animation-delay: 0.3s;">
              <div class="corner-decoration top-left"></div>
              <div class="corner-decoration top-right"></div>
              <div class="corner-decoration bottom-left"></div>
              <div class="corner-decoration bottom-right"></div>
              <h3 class="text-sm font-display font-semibold theme-text-primary-300 mb-3 uppercase tracking-wider flex items-center">
                <span class="status-indicator mr-2"></span>
                {{ t('game_weather') }}
              </h3>
              <div class="relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-[rgba(var(--theme-primary),0)] via-[rgba(var(--theme-primary),0.3)] to-[rgba(var(--theme-primary),0)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button 
                  ref="weatherButton"
                  type="button"
                  @click="toggleWeatherDropdown"
                  class="neo-input relative w-full px-4 py-3 text-base text-white bg-black/50 border theme-border-primary/20 hover:theme-border-primary/50 rounded-md text-left flex items-center justify-between shadow-inner shadow-black/30 transition-all duration-300"
                  :class="showWeatherDropdown ? 'theme-border-primary/70 theme-shadow-sm' : ''"
                >
                  <div class="truncate flex-grow">
                    <span class="text-white font-rajdhani">
                      {{ getWeatherLabel(settings.gameWeather) || t('select_weather') }}
                    </span>
                  </div>
                  <div class="relative">
                    <div class="absolute inset-0 theme-bg-primary/10 rounded-full opacity-0 transition-opacity" :class="{'opacity-100': showWeatherDropdown}"></div>
                    <svg class="w-5 h-5 theme-text-primary ml-2 flex-shrink-0 transition-all duration-300 relative z-10" :class="{ 'transform rotate-180 theme-text-primary-300': showWeatherDropdown }"><use href="#icon-chevron-down"></use></svg>
                  </div>
                </button>
                
                <div 
                  ref="weatherDropdown"
                  v-show="showWeatherDropdown"
                  class="absolute z-50 left-0 right-0 mt-1 bg-black/95 border theme-border-primary/40 rounded-md shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-sm dropdown-custom"
                  style="animation: fadeScale 0.3s ease-out;"
                >
                  <div class="border-t theme-border-primary/20"></div>
                  <div class="max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      v-for="weather in weatherOptions"
                      :key="weather.value"
                      type="button"
                      @click="selectWeather(weather.value)"
                      class="w-full px-4 py-3 text-left text-white/90 hover:bg-gradient-to-r hover:from-[rgba(var(--theme-primary-dark),0.2)] hover:to-[rgba(var(--theme-primary-dark),0.2)] hover:text-white transition-all duration-200 border-b theme-border-primary/10 last:border-0 font-rajdhani text-sm group relative dropdown-item"
                      :class="{'theme-bg-primary-dark/30 text-white': settings.gameWeather === weather.value}"
                    >
                      <div class="absolute left-0 top-0 h-full w-1 theme-bg-primary opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': settings.gameWeather === weather.value}"></div>
                      <span class="relative z-10">{{ t(weather.label) }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="neo-card p-4 animate-fade-scale" style="animation-delay: 0.5s;">
              <div class="corner-decoration top-left"></div>
              <div class="corner-decoration top-right"></div>
              <div class="corner-decoration bottom-left"></div>
              <div class="corner-decoration bottom-right"></div>
              <h3 class="text-sm font-display font-semibold theme-text-primary-300 mb-3 uppercase tracking-wider flex items-center">
                <span class="status-indicator mr-2"></span>
                {{ t('game_scenario') }}
              </h3>
              <div class="relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-[rgba(var(--theme-primary),0)] via-[rgba(var(--theme-primary),0.3)] to-[rgba(var(--theme-primary),0)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button 
                  ref="scenarioButton"
                  type="button"
                  @click="toggleScenarioDropdown"
                  class="neo-input relative w-full px-4 py-3 text-base text-white bg-black/50 border theme-border-primary/20 hover:theme-border-primary/50 rounded-md text-left flex items-center justify-between shadow-inner shadow-black/30 transition-all duration-300"
                  :class="showScenarioDropdown ? 'theme-border-primary/70 theme-shadow-sm' : ''"
                >
                  <div class="truncate flex-grow">
                    <span class="text-white font-rajdhani">
                      {{ getScenarioLabel(settings.gameScenario) || t('select_scenario') }}
                    </span>
                  </div>
                  <div class="relative">
                    <div class="absolute inset-0 theme-bg-primary/10 rounded-full opacity-0 transition-opacity" :class="{'opacity-100': showScenarioDropdown}"></div>
                    <svg class="w-5 h-5 theme-text-primary ml-2 flex-shrink-0 transition-all duration-300 relative z-10" :class="{ 'transform rotate-180 theme-text-primary-300': showScenarioDropdown }"><use href="#icon-chevron-down"></use></svg>
                  </div>
                </button>
                
                <div 
                  ref="scenarioDropdown"
                  v-show="showScenarioDropdown"
                  class="absolute z-50 left-0 right-0 mt-1 bg-black/95 border theme-border-primary/40 rounded-md shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-sm dropdown-custom"
                  style="animation: fadeScale 0.3s ease-out;"
                >
                  <div class="border-t theme-border-primary/20"></div>
                  <div class="max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      v-for="scenario in scenarioOptions"
                      :key="scenario.value"
                      type="button"
                      @click="selectScenario(scenario.value)"
                      class="w-full px-4 py-3 text-left text-white/90 hover:bg-gradient-to-r hover:from-[rgba(var(--theme-primary-dark),0.2)] hover:to-[rgba(var(--theme-primary-dark),0.2)] hover:text-white transition-all duration-200 border-b theme-border-primary/10 last:border-0 font-rajdhani text-sm group relative dropdown-item"
                      :class="{'theme-bg-primary-dark/30 text-white': settings.gameScenario === scenario.value}"
                    >
                      <div class="absolute left-0 top-0 h-full w-1 theme-bg-primary opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': settings.gameScenario === scenario.value}"></div>
                      <span class="relative z-10">{{ scenario.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
      
      <div class="fixed bottom-0 left-0 z-20 p-5" style="z-index: 20;">
        <div class="neo-panel p-4 relative animate-fade-scale" style="border-radius:0; border-left:none; max-width:600px;">
          <div class="corner-decoration top-left"></div>
          <div class="corner-decoration top-right"></div>
          <div class="corner-decoration bottom-left"></div>
          <div class="corner-decoration bottom-right"></div>
          <div class="grid grid-cols-4 gap-4 py-2">
            <div 
              v-for="slot in maxCharacters" 
              :key="slot"
              @click="selectCharacter(slot)"
              class="group relative cursor-pointer transition-all duration-300 hover:scale-105 animate-card-appear"
            >
              <div class="character-slot neo-card h-16 w-16 flex items-center justify-center overflow-hidden transition-all duration-300" style="border-radius:0; position:relative;"
                :class="characters[slot] && characters[slot].firstName ? 'bg-black/80 theme-border-primary/80 shadow-lg theme-shadow-primary/40 neo-glow' : 'bg-black/60 theme-border-primary/20 hover:theme-border-primary/50'">
                <div class="corner-decoration top-left"></div>
                <div class="corner-decoration top-right"></div>
                <div class="corner-decoration bottom-left"></div>
                <div class="corner-decoration bottom-right"></div>
                <div v-if="characters[slot] && characters[slot].gender" class="absolute inset-0 w-full h-full opacity-20 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"></div>
                <template v-if="characters[slot] && characters[slot].firstName">
                  <div class="w-10 h-10 rounded-full bg-black/80 border-2 theme-border-primary flex items-center justify-center shadow-lg relative">
                    <svg class="w-7 h-7 theme-text-primary" style="color: rgb(var(--theme-primary)); fill: rgb(var(--theme-primary));">
                      <use href="#icon-user"></use>
                    </svg>
                    <div class="absolute -top-1 -right-1 w-3 h-3 theme-bg-primary rounded-full border border-black animate-pulse"></div>
                  </div>
                </template>
                <template v-else>
                  <div class="relative w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <div class="relative w-10 h-10 rounded-full bg-black/80 border-2 theme-border-primary/80 group-hover:theme-border-primary flex items-center justify-center border-dashed">
                      <svg class="w-7 h-7 theme-text-primary group-hover:theme-text-primary transition-all duration-300" style="color: rgb(var(--theme-primary)); fill: rgb(var(--theme-primary)); opacity: 0.9; filter: drop-shadow(0 0 6px rgb(var(--theme-primary)));">
                        <use href="#icon-user-plus"></use>
                      </svg>
                      <div class="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse opacity-70"></div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedSlot !== null" class="pointer-events-none" style="z-index: 20;">
        <div v-if="currentView === 'details'">
          <div class="fixed top-0 left-0 pointer-events-auto z-30 p-6 w-[550px]">
            <div class="neo-panel p-6 relative flex flex-col animate-fade-scale bg-black/80" style="border-radius:0; border-left:none;">
              <div class="corner-decoration top-left"></div>
              <div class="corner-decoration top-right"></div>
              <div class="corner-decoration bottom-left"></div>
              <div class="corner-decoration bottom-right"></div>
              
              <button 
                @click="selectedSlot = null" 
                class="w-10 h-10 bg-black/80 hover:bg-black/90 border theme-border-primary/40 hover:theme-border-primary/60 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg theme-shadow-primary/20 mb-2 absolute top-2 right-2"
              >
                <svg class="w-5 h-5 theme-text-primary"><use href="#icon-x"></use></svg>
              </button>
              
              <div class="deco-line w-full mb-5 opacity-70"></div>
              
              <div class="mb-6 fade-in flex items-center">
                <div class="w-14 h-14 rounded-full bg-black/80 border-2 theme-border-primary/80 flex items-center justify-center mr-4 shadow-lg theme-shadow-primary/40">
                  <svg viewBox="0 0 24 24" class="w-8 h-8 text-white" v-if="characters[selectedSlot].sex === 'f' || characters[selectedSlot].gender === 'female'">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 16v5M9.5 18.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg viewBox="0 0 24 24" class="w-8 h-8 text-white" v-else>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 3h3v3M19 6l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                
                <div>
                  <h1 v-if="settings.streamerMode" class="streamer-mode-text streamer-mode--lg"></h1>
                  <h1 v-else class="text-2xl font-bold font-rajdhani tracking-wide text-emerald-300">
                    {{ characters[selectedSlot].firstName }} <span class="text-white">{{ characters[selectedSlot].lastName }}</span>
                  </h1>
                </div>
              </div>

              <div class="flex flex-col">
                <div class="neo-card p-5 animate-card-appear mb-6">
                  <div class="corner-decoration top-left"></div>
                  <div class="corner-decoration top-right"></div>
                  <div class="text-sm font-display font-semibold theme-text-primary-300 mb-4 uppercase tracking-wider flex items-center">
                    <span class="status-indicator mr-2"></span>
{{ t('main_information') }}
                  </div>
                  
                  <div class="grid grid-cols-2 gap-x-8 gap-y-5 text-left">
                    <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-black/80 border theme-border-primary/20 flex items-center justify-center shadow-inner shadow-black/50">
                        <svg class="w-6 h-6 theme-text-primary"><use href="#icon-calendar"></use></svg>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-white/70 text-sm font-exo">{{ t('age') }}</span>
                        <span class="text-white text-base font-medium">{{ calculateAge(characters[selectedSlot].birthDate) }} {{ t('years') }}</span>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-black/80 border theme-border-primary/20 flex items-center justify-center shadow-inner shadow-black/50">
                        <svg class="w-6 h-6 theme-text-primary" v-if="characters[selectedSlot].sex === 'f' || characters[selectedSlot].gender === 'female'">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
                          <path d="M12 16v5M9.5 18.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <svg class="w-6 h-6 theme-text-primary" v-else>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
                          <path d="M16 3h3v3M19 6l-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-white/70 text-sm font-exo">{{ t('gender') }}</span>
                        <span class="text-white text-base font-medium">{{ characters[selectedSlot].gender === 'male' ? t('male') : t('female') }}</span>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-black/80 border theme-border-primary/20 flex items-center justify-center shadow-inner shadow-black/50">
                        <svg class="w-6 h-6 theme-text-primary"><use href="#icon-briefcase"></use></svg>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-white/70 text-sm font-exo">{{ t('profession') }}</span>
                        <span v-if="settings.streamerMode" class="streamer-mode-text streamer-mode--sm"></span>
                        <span v-else class="text-white text-base font-medium">{{ characters[selectedSlot].job || t('unemployed') }}</span>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-black/80 border theme-border-primary/20 flex items-center justify-center shadow-inner shadow-black/50">
                        <svg class="w-6 h-6 theme-text-primary"><use href="#icon-phone"></use></svg>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-white/70 text-sm font-exo">{{ t('phone') }}</span>
                        <span v-if="settings.streamerMode" class="streamer-mode-text streamer-mode--sm"></span>
                        <span v-else class="text-white text-base font-medium">{{ characters[selectedSlot].phone }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="neo-card p-5 animate-card-appear mb-6" style="animation-delay: 0.1s">
                  <div class="corner-decoration top-left"></div>
                  <div class="corner-decoration top-right"></div>
                  <div class="corner-decoration bottom-left"></div>
                  <div class="corner-decoration bottom-right"></div>
                  <div class="text-sm font-display font-semibold theme-text-primary-300 mb-4 uppercase tracking-wider flex items-center">
                    <span class="status-indicator mr-2"></span>
{{ t('finances') }}
                  </div>
                  
                  <div class="flex items-baseline justify-between mb-4 bg-black/50 rounded-md px-4 py-2.5">
                    <span class="text-white/90 text-base font-medium">{{ t('total_balance') }}</span>
                    <span class="text-white text-xl font-bold">\${{ (characters[selectedSlot].bank + characters[selectedSlot].cash).toLocaleString() }}</span>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-6">
                    <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-black/80 border theme-border-primary/20 flex items-center justify-center shadow-inner shadow-black/50">
                        <svg class="w-6 h-6 theme-text-primary"><use href="#icon-landmark"></use></svg>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-white/70 text-sm font-exo">{{ t('bank') }}</span>
                        <span v-if="settings.streamerMode" class="streamer-mode-text streamer-mode--sm"></span>
                        <span v-else class="text-white text-base font-medium">\${{ characters[selectedSlot].bank ? characters[selectedSlot].bank.toLocaleString() : '0' }}</span>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-black/80 border theme-border-primary/20 flex items-center justify-center shadow-inner shadow-black/50">
                        <svg class="w-6 h-6 theme-text-primary"><use href="#icon-wallet"></use></svg>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-white/70 text-sm font-exo">{{ t('cash') }}</span>
                        <span v-if="settings.streamerMode" class="streamer-mode-text streamer-mode--sm"></span>
                        <span v-else class="text-white text-base font-medium">\${{ characters[selectedSlot].cash ? characters[selectedSlot].cash.toLocaleString() : '0' }}</span>
                      </div>
                    </div>
                  </div>
                </div>  
                  <div class="flex items-center justify-end mt-6 px-2 py-3">                    
                    <div class="flex flex-row gap-4 justify-center items-center w-full">
                      <button 
                        @click="deleteCharacterModal = true; characterToDelete = selectedSlot" 
                        class="flex-1 py-3 px-4 mx-2 flex items-center justify-center text-center transition-all hover:scale-105 bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-500/90 hover:to-red-600/90 border border-red-500/40 hover:border-red-400/60 rounded-md text-white font-rajdhani font-semibold tracking-wide shadow-lg shadow-red-500/20 hover:shadow-red-500/40"
                        style="max-width: 220px; min-height: 44px;"
                      >
                        <svg class="w-4 h-4 mr-2"><use href="#icon-trash"></use></svg>
                        <span class="text-base">{{ t('delete') }}</span>
                      </button>
                      <button 
                        @click="playCharacter(selectedSlot)" 
                        class="flex-1 py-3 px-4 mx-2 flex items-center justify-center text-center transition-all hover:scale-105 bg-gradient-to-r from-[rgba(var(--theme-primary-dark),0.8)] to-[rgba(var(--theme-primary-dark),0.8)] hover:from-[rgba(var(--theme-primary),0.9)] hover:to-[rgba(var(--theme-primary-dark),0.9)] border theme-border-primary/40 hover:theme-border-primary/60 rounded-md text-white font-rajdhani font-bold tracking-wide shadow-lg theme-shadow-primary/20 hover:theme-shadow-primary/40"
                        style="max-width: 220px; min-height: 44px;"
                      >
                        <svg class="w-4 h-4 mr-2"><use href="#icon-play"></use></svg>
                        <span class="text-base">{{ t('play') }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentView === 'create'">
          <div class="fixed top-0 left-0 pointer-events-auto z-30 p-6 w-[550px]">
            <div class="neo-panel p-6 relative flex flex-col animate-fade-scale bg-black/80" style="border-radius:0; border-left:none;">
              <div class="corner-decoration top-left"></div>
              <div class="corner-decoration top-right"></div>
              <div class="corner-decoration bottom-left"></div>
              <div class="corner-decoration bottom-right"></div>
              
              <button 
                @click="selectedSlot = null" 
                class="w-10 h-10 bg-black/80 hover:bg-black/90 border theme-border-primary/40 hover:theme-border-primary/60 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg theme-shadow-primary/20 mb-2 absolute top-2 right-2"
              >
                <svg class="w-5 h-5 theme-text-primary"><use href="#icon-x"></use></svg>
              </button>
              
              <div class="deco-line w-full mb-5 opacity-70"></div>
              
              <div class="mb-5 fade-in flex items-center">
                <div class="w-14 h-14 rounded-full bg-black/80 border-2 theme-border-primary/80 flex items-center justify-center mr-4 shadow-lg theme-shadow-primary/40">
                  <svg viewBox="0 0 24 24" class="w-8 h-8 text-white">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <line x1="12" y1="8" x2="12" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <line x1="9" y1="11" x2="15" y2="11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                
                <div>
                  <div class="text-xs text-white/90 uppercase font-syncopate tracking-wider mb-1">{{ t('new_character') }}</div>
                  <h2 class="text-2xl font-bold font-rajdhani tracking-wide text-glow-sm theme-text-primary-100">
                    Slot {{ selectedSlot }}
                  </h2>
                </div>
              </div>
              
              <div class="neo-card p-5 animate-card-appear">
                <div class="text-sm font-display font-semibold theme-text-primary-300 mb-4 uppercase tracking-wider flex items-center">
                  <span class="status-indicator mr-2"></span>
                  {{ t('basic_information') }}
                </div>
              
                <form @submit.prevent="createCharacter" class="space-y-5">
                  <div class="mb-3">
                    <div class="flex flex-col gap-4">
                      <div class="flex flex-col gap-2">
                        <label for="firstName" class="text-sm font-exo text-white/90 tracking-wide">{{ t('name') }}</label>
                        <div class="relative group input-container">
                          <div class="corner-decoration top-left"></div>
                          <div class="corner-decoration top-right"></div>
                          <div class="corner-decoration bottom-left"></div>
                          <div class="corner-decoration bottom-right"></div>
                          <div class="absolute -inset-0.5 bg-gradient-to-r from-[rgba(var(--theme-primary),0)] via-[rgba(var(--theme-primary),0.3)] to-[rgba(var(--theme-primary),0)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <input 
                            id="firstName"
                            v-model="newCharacter.firstName"
                            type="text" 
                            class="neo-input input-gradient-hover relative w-full px-4 py-3 text-base bg-black/80 border theme-border-primary/30 focus:theme-border-primary/70 rounded-md text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner shadow-black/30"
                            :placeholder="t('enter_name')"
                            required
                          >
                        </div>
                      </div>
                      
                      <div class="flex flex-col gap-2">
                        <label for="lastName" class="text-sm font-exo text-white/90 tracking-wide">{{ t('lastname') }}</label>
                        <div class="relative group input-container">
                          <div class="corner-decoration top-left"></div>
                          <div class="corner-decoration top-right"></div>
                          <div class="corner-decoration bottom-left"></div>
                          <div class="corner-decoration bottom-right"></div>
                          <div class="absolute -inset-0.5 bg-gradient-to-r from-[rgba(var(--theme-primary),0)] via-[rgba(var(--theme-primary),0.3)] to-[rgba(var(--theme-primary),0)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <input 
                            id="lastName"
                            v-model="newCharacter.lastName"
                            type="text" 
                            class="neo-input input-gradient-hover relative w-full px-4 py-3 text-base bg-black/80 border theme-border-primary/30 focus:theme-border-primary/70 rounded-md text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner shadow-black/30"
                            :placeholder="t('enter_lastname')"
                            required
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="my-4">
                    <label class="text-sm font-exo text-white/90 tracking-wide mb-3 block">{{ t('gender') }}</label>
                    <div class="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        @click="selectGender('female')"
                        class="neo-button gender-button relative w-full px-4 py-4 rounded-md text-sm transition-all duration-300 shadow-md group"
                        :class="newCharacter.gender === 'female' ? 'bg-black/80 border theme-border-primary/60 text-white shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'bg-black/60 border theme-border-primary/20 text-slate-300 hover:theme-border-primary/40'"
                      >
                        <div class="corner-decoration top-left"></div>
                        <div class="corner-decoration top-right"></div>
                        <div class="corner-decoration bottom-left"></div>
                        <div class="corner-decoration bottom-right"></div>
                        <div class="flex flex-col items-center justify-center gap-2 relative z-10">
                          <div class="relative w-12 h-12">
                            <div class="absolute inset-0 rounded-full theme-bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': newCharacter.gender === 'female'}"></div>
                            <div class="w-12 h-12 rounded-full border-2 relative z-10 overflow-hidden"
                              :class="newCharacter.gender === 'female' ? 'theme-border-primary/60' : 'theme-border-primary/30'">
                              <img src="./assets/woman.webp" class="w-full h-full object-cover">
                            </div>
                          </div>
                          <span class="font-rajdhani font-medium tracking-wide">{{ t('female') }}</span>
                        </div>
                      </button>
                      
                      <button 
                        type="button"
                        @click="selectGender('male')"
                        class="neo-button gender-button relative w-full px-4 py-4 rounded-md text-sm transition-all duration-300 shadow-md group"
                        :class="newCharacter.gender === 'male' ? 'bg-black/80 border theme-border-primary/60 text-white shadow-[0_0_15px_rgba(20,184,166,0.2)]' : 'bg-black/60 border theme-border-primary/20 text-slate-300 hover:theme-border-primary/40'"
                      >
                        <div class="corner-decoration top-left"></div>
                        <div class="corner-decoration top-right"></div>
                        <div class="corner-decoration bottom-left"></div>
                        <div class="corner-decoration bottom-right"></div>
                        <div class="flex flex-col items-center justify-center gap-2 relative z-10">
                          <div class="relative w-12 h-12">
                            <div class="absolute inset-0 rounded-full theme-bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': newCharacter.gender === 'male'}"></div>
                            <div class="w-12 h-12 rounded-full border-2 relative z-10 overflow-hidden"
                              :class="newCharacter.gender === 'male' ? 'theme-border-primary/60' : 'theme-border-primary/30'">
                              <img src="./assets/men.webp" class="w-full h-full object-cover">
                            </div>
                          </div>
                          <span class="font-rajdhani font-medium tracking-wide">{{ t('male') }}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                    
                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <label class="text-sm font-exo text-white/90 tracking-wide">{{ t('height') }}</label>
                        <span class="text-white text-sm font-medium bg-black/70 border theme-border-primary/40 px-3 py-1 rounded-md font-rajdhani">{{ newCharacter.height }} cm</span>
                      </div>
                      
                      <div class="py-3">
                        <input 
                          v-model.number="newCharacter.height"
                          type="range" 
                          min="150" 
                          max="220"
                          class="relative w-full h-6 bg-transparent appearance-none cursor-pointer"
                          style="--range-thumb-size: 18px; --range-track-height: 6px;"
                        >
                      </div>
                      
                      <div class="flex justify-between text-xs text-white/70 px-1">
                        <span>150 cm</span>
                        <span>185 cm</span>
                        <span>220 cm</span>
                      </div>
                    </div>
                  
                  <div class="grid grid-cols-2 gap-5 mt-3">
                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-exo text-white/90 tracking-wide">{{ t('birth_date') }}</label>
                      <div class="relative group">
                        <div class="absolute -inset-0.5 bg-gradient-to-r from-[rgba(var(--theme-primary),0)] via-[rgba(var(--theme-primary),0.3)] to-[rgba(var(--theme-primary),0)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <input 
                          v-model="newCharacter.birthDate"
                          type="date" 
                          class="neo-input relative w-full px-4 py-3 text-base bg-black/80 border theme-border-primary/30 focus:theme-border-primary/70 rounded-md text-white focus:outline-none shadow-inner shadow-black/30"
                          required
                        >
                      </div>
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-exo text-white/90 tracking-wide">{{ t('nationality') }}</label>
                      <div class="relative group">
                        <div class="absolute -inset-0.5 bg-gradient-to-r from-[rgba(var(--theme-primary),0)] via-[rgba(var(--theme-primary),0.3)] to-[rgba(var(--theme-primary),0)] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <button 
                          ref="nationalityButton"
                          type="button"
                          @click="toggleNationalityDropdown"
                          class="neo-input relative w-full px-4 py-3 text-base bg-black/80 border theme-border-primary/30 hover:theme-border-primary/70 rounded-md text-left flex items-center justify-between shadow-inner shadow-black/30 transition-all duration-300"
                          :class="showNationalityDropdown ? 'theme-border-primary/70 theme-shadow-sm' : ''"
                        >
                          <div class="truncate flex-grow">
                            <span :class="newCharacter.nationality ? 'text-white' : 'text-slate-400'" class="font-rajdhani">
                              {{ newCharacter.nationality || t('select_origin') }}
                            </span>
                          </div>
                          <div class="relative">
                            <div class="absolute inset-0 theme-bg-primary/10 rounded-full opacity-0 transition-opacity" :class="{'opacity-100': showNationalityDropdown}"></div>
                            <svg class="w-5 h-5 theme-text-primary ml-2 flex-shrink-0 transition-all duration-300 relative z-10" :class="{ 'transform rotate-180 theme-text-primary-300': showNationalityDropdown }"><use href="#icon-chevron-down"></use></svg>
                          </div>
                        </button>
                        
                        <div 
                          ref="nationalityDropdown"
                          v-show="showNationalityDropdown"
                          class="absolute z-50 left-0 right-0 mt-1 bg-black/95 border theme-border-primary/40 rounded-md shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-sm"
                          style="animation: fadeScale 0.3s ease-out;"
                        >
                          <div class="border-t theme-border-primary/20"></div>
                          <div class="max-h-48 overflow-y-auto">
                            <button
                              v-for="nation in nationalities"
                              :key="nation"
                              type="button"
                              @click="selectNationality(nation)"
                              class="w-full px-4 py-3 text-left text-white/90 hover:bg-gradient-to-r hover:from-[rgba(var(--theme-primary-dark),0.2)] hover:to-[rgba(var(--theme-primary-dark),0.2)] hover:text-white transition-all duration-200 border-b theme-border-primary/10 last:border-0 font-rajdhani text-sm group relative"
                              :class="{'theme-bg-primary-dark/30 text-white': newCharacter.nationality === nation}"
                            >
                              <div class="absolute left-0 top-0 h-full w-1 theme-bg-primary opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': newCharacter.nationality === nation}"></div>
                              <span class="relative z-10">{{ nation }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center justify-end mt-6">
                    <button 
                      type="submit"
                      :disabled="!newCharacter.firstName || !newCharacter.lastName || !newCharacter.nationality || !newCharacter.gender"
                      class="py-3 px-8 transition-all relative overflow-hidden bg-gradient-to-r from-[rgba(var(--theme-primary-dark),0.8)] to-[rgba(var(--theme-primary-dark),0.8)] hover:from-[rgba(var(--theme-primary),0.9)] hover:to-[rgba(var(--theme-primary-dark),0.9)] border theme-border-primary/40 hover:theme-border-primary/60 rounded-md text-white font-rajdhani font-bold tracking-wide shadow-lg theme-shadow-primary/20 hover:theme-shadow-primary/40"
                      :class="!newCharacter.firstName || !newCharacter.lastName || !newCharacter.nationality || !newCharacter.gender ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'"
                    >
                      <div class="flex items-center space-x-2 relative z-10">
                        <div class="relative w-5 h-5 flex items-center justify-center">
                          <div class="absolute inset-0 theme-bg-primary/20 rounded-full animate-ping opacity-75" style="animation-duration: 2s;" :class="{'opacity-0': !newCharacter.firstName || !newCharacter.lastName || !newCharacter.nationality || !newCharacter.gender}"></div>
                          <svg class="w-5 h-5"><use href="#icon-user-plus"></use></svg>
                        </div>
                        <span class="text-base">{{ t('create_character') }}</span>
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="deleteCharacterModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black opacity-80"></div>
        
        <div class="neo-panel p-6 relative z-10 max-w-md animate-fade-scale">
          <div class="corner-decoration top-left"></div>
          <div class="corner-decoration top-right"></div>
          <div class="corner-decoration bottom-left"></div>
          <div class="corner-decoration bottom-right"></div>
          
          <div class="deco-line w-full mb-5 opacity-70"></div>
          
          <div class="mb-6">
            <h3 class="text-xl font-bold text-white/90 mb-2">{{ t('confirm_deletion') }}</h3>
            <p class="text-white/80">{{ t('delete_character_message') }}</p>
          </div>
          
          <div class="flex justify-end space-x-4">
            <button 
              @click="deleteCharacterModal = false" 
              class="delete-modal-button delete-modal-button-cancel py-2 px-4 transition-all hover:scale-105"
            >
              {{ t('cancel_button') }}
            </button>
            <button 
              @click="deleteCharacter(characterToDelete); deleteCharacterModal = false;" 
              class="delete-modal-button delete-modal-button-confirm py-2 px-4 transition-all hover:scale-105"
            >
              {{ t('delete_button') }}
            </button>
          </div>
        </div>
      </div>
  `,
  setup() {
    const characters = ref({})
    const selectedSlot = ref(null)
    const maxCharacters = ref(5)
    const showNationalityDropdown = ref(false)
    const showWeatherDropdown = ref(false)
    const showScenarioDropdown = ref(false)
    const currentView = ref('list')
    const deleteCharacterModal = ref(false)
    const characterToDelete = ref(null)
    const newCharacter = ref({
      firstName: '',
      lastName: '',
      height: 175,
      gender: '',
      nationality: '',
      birthDate: ''
    })

    const nationalities = ref([
      'Argentino/a', 'Boliviano/a', 'BrasileÃ±o/a', 'Chileno/a', 'Colombiano/a',
      'Costarricense', 'Cubano/a', 'Dominicano/a', 'Ecuatoriano/a', 'SalvadoreÃ±o/a',
      'Guatemalteco/a', 'HondureÃ±o/a', 'Mexicano/a', 'NicaragÃ¼ense', 'PanameÃ±o/a',
      'Paraguayo/a', 'Peruano/a', 'PuertorriqueÃ±o/a', 'Uruguayo/a', 'Venezolano/a',
      'EspaÃ±ol/a', 'Estadounidense', 'Canadiense', 'FrancÃ©s/a', 'AlemÃ¡n/a',
      'Italiano/a', 'PortuguÃ©s/a', 'BritÃ¡nico/a', 'Ruso/a', 'JaponÃ©s/a',
      'Chino/a', 'Coreano/a', 'Australiano/a', 'NeozelandÃ©s/a', 'Sudafricano/a'
    ])

    const weatherOptions = ref([
      { value: 'CLEAR', label: 'weather_clear' },
      { value: 'EXTRASUNNY', label: 'weather_extrasunny' },
      { value: 'CLOUDS', label: 'weather_clouds' },
      { value: 'OVERCAST', label: 'weather_overcast' },
      { value: 'RAIN', label: 'weather_rain' },
      { value: 'THUNDER', label: 'weather_thunder' },
      { value: 'SMOG', label: 'weather_smog' },
      { value: 'FOGGY', label: 'weather_foggy' },
      { value: 'XMAS', label: 'weather_xmas' },
      { value: 'SNOWLIGHT', label: 'weather_snowlight' }
    ])

    const scenarioOptions = ref([]) 
    const nationalityButton = ref(null)
    const nationalityDropdown = ref(null)
    const weatherButton = ref(null)
    const weatherDropdown = ref(null)
    const scenarioButton = ref(null)
    const scenarioDropdown = ref(null)

    const createCharacter = () => {
      if (selectedSlot.value !== null && 
          newCharacter.value.firstName && 
          newCharacter.value.lastName && 
          newCharacter.value.nationality &&
          newCharacter.value.gender) {
        
        postData('createCharacter', {
          firstname: newCharacter.value.firstName,
          lastname: newCharacter.value.lastName,
          birthdate: newCharacter.value.birthDate,
          gender: newCharacter.value.gender,
          height: newCharacter.value.height,
          nationality: newCharacter.value.nationality
        }).catch(error => {
          console.error('Error creating character:', error)
        })
        
        newCharacter.value = {
          firstName: '',
          lastName: '',
          height: 175,
          gender: '',
          nationality: '',
          birthDate: ''
        }
      }
    }

    const selectNationality = (nationality) => {
      newCharacter.value.nationality = nationality
      showNationalityDropdown.value = false
    }

    const toggleNationalityDropdown = () => {
      showNationalityDropdown.value = !showNationalityDropdown.value
      if (showNationalityDropdown.value) {
        nextTick(() => positionDropdown(nationalityButton, nationalityDropdown))
      }
    }

    const selectWeather = (weather) => {
      settings.value.gameWeather = weather
      showWeatherDropdown.value = false
      setGameWeather(weather)
    }

    const toggleWeatherDropdown = () => {
      showWeatherDropdown.value = !showWeatherDropdown.value
      if (showWeatherDropdown.value) {
        nextTick(() => positionDropdown(weatherButton, weatherDropdown))
      }
    }

    const selectScenario = (scenario) => {
      settings.value.gameScenario = scenario
      showScenarioDropdown.value = false
      setGameScenario(scenario)
    }

    const toggleScenarioDropdown = () => {
      showScenarioDropdown.value = !showScenarioDropdown.value
      if (showScenarioDropdown.value) {
        nextTick(() => positionDropdown(scenarioButton, scenarioDropdown))
      }
    }

    const positionDropdown = (buttonRef, dropdownRef) => {
      const btn = buttonRef && buttonRef.value
      const dd = dropdownRef && dropdownRef.value
      if (!btn || !dd) return

      dd.classList.remove('dropdown-up')

      const rect = btn.getBoundingClientRect()
      const ddHeight = dd.offsetHeight || dd.scrollHeight || 200
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      if (spaceBelow < ddHeight && spaceAbove > ddHeight) {
        dd.classList.add('dropdown-up')
      } else {
        dd.classList.remove('dropdown-up')
      }
    }

    const getWeatherLabel = (value) => {
      const option = weatherOptions.value.find(w => w.value === value)
      return option ? t(option.label) : value
    }

    const getScenarioLabel = (value) => {
      const option = scenarioOptions.value.find(s => s.value === value)
      return option ? option.label : value
    }

    const playCharacter = () => {
      if (selectedSlot.value && characters.value[selectedSlot.value]) {
        postData('selectCharacter', {
          characterData: {
            identifier: characters.value[selectedSlot.value].identifier,
            citizenid: characters.value[selectedSlot.value].citizenid,
            id: characters.value[selectedSlot.value].id
          }
        }).catch(error => {
          console.error('Error playing character:', error)
        })
      }
    }
    
    const selectCharacter = (slot) => {
      selectedSlot.value = slot
      
      if (characters.value[slot] && characters.value[slot].firstName) {
        currentView.value = 'details'
        
        postData('previewCharacter', {
          characterData: characters.value[slot],
          currentScenario: (settings.value.gameScenario || 'DEFAULT')
        })
      } else {
        showCreateCharacterPanel(slot)
      }
    }

    const deleteCharacter = (slot) => {
      if (characters.value[slot]) {
        postData('deleteCharacter', {
          characterId: characters.value[slot].identifier || characters.value[slot].citizenid || characters.value[slot].id
        }).then(response => {
          delete characters.value[slot]
          selectedSlot.value = null
          currentView.value = 'list'
        }).catch(error => {
          console.error('Error deleting character:', error)
        })
      }
    }

    const selectSlot = (slot) => {
      selectedSlot.value = slot
      showNationalityDropdown.value = false
      
      if (slot === null) {
        currentView.value = 'list'
      } else if (characters.value[slot] && characters.value[slot].firstName) {
        currentView.value = 'details'
      } else {
        currentView.value = 'create'
        if (!characters.value[slot]) {
          characters.value[slot] = {}
        }
      }
    }
    
    const showCreateCharacterPanel = (slot) => {
      selectedSlot.value = slot
      currentView.value = 'create'
      
      createDefaultPed()
    }

    const selectGender = (gender) => {
      newCharacter.value.gender = gender
      updatePedGender(gender)
    }

    const createDefaultPed = () => {
      fetch(`https://bit-multicharacter/createDefaultPed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(() => {})
    }

    const updatePedGender = (gender) => {
      fetch(`https://bit-multicharacter/updatePedGender`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: gender })
      }).catch(() => {})
    }

    const calculateAge = (birthDate) => {
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      return age
    }

    const getOccupiedSlots = () => {
      return Object.keys(characters.value).length
    }



    onMounted(() => {
      const handleClickOutside = (event) => {
        if (showNationalityDropdown.value && 
            nationalityButton.value && 
            nationalityDropdown.value &&
            !nationalityButton.value.contains(event.target) &&
            !nationalityDropdown.value.contains(event.target)) {
          showNationalityDropdown.value = false
        }
        
        if (showWeatherDropdown.value && 
            weatherButton.value && 
            weatherDropdown.value &&
            !weatherButton.value.contains(event.target) &&
            !weatherDropdown.value.contains(event.target)) {
          showWeatherDropdown.value = false
        }
        
        if (showScenarioDropdown.value && 
            scenarioButton.value && 
            scenarioDropdown.value &&
            !scenarioButton.value.contains(event.target) &&
            !scenarioDropdown.value.contains(event.target)) {
          showScenarioDropdown.value = false
        }
      }
      
      document.addEventListener('click', handleClickOutside)
      
      nextTick(() => {
        fetch(`https://bit-multicharacter/nuiReady`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
      })
    })

    const showSettings = ref(false)
    const settings = ref({
      themeColor: 'teal', 
      streamerMode: false,
      darkFilter: false,
      particles: true,
      gameWeather: 'CLEAR', 
      gameScenario: 'DEFAULT' 
    })
    
    const toggleSettings = () => {
      showSettings.value = !showSettings.value
    }
    
    const applyTheme = (color) => {
      settings.value.themeColor = color
      document.body.classList.remove('theme-teal', 'theme-blue', 'theme-purple', 'theme-amber', 'theme-red', 'theme-green', 'theme-pink', 'theme-cyan')
      document.body.classList.add(`theme-${color}`)
    }

    const setGameWeather = (weather) => {
      settings.value.gameWeather = weather
      fetch(`https://bit-multicharacter/setWeather`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weather: weather
        })
      })
    }
    
    const setGameScenario = (scenario) => {
      settings.value.gameScenario = scenario
      fetch(`https://bit-multicharacter/setScenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario: scenario
        })
      })
    }

    const localeData = ref({
      translations: {},
      countries: [],
      scenarios: {}
    })

    const t = (key) => {
      const value = localeData.value[key]
      return value || key
    }

    const postData = (url, data) => {
      return fetch(`https://bit-multicharacter/${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
    }

    const loadLocaleData = () => {
      postData('GetLocaleData', { language: 'es' })
        .then(response => response.json())
        .then(data => {
          localeData.value = data
          nationalities.value = data.countries || []
        })
        .catch(error => {
          console.error('Error loading locale data:', error)
        })
    }

    const setActivity = (activity) => {
      postData('setActivity', {
        activity: activity
      }).catch(error => {
        console.error('Error setting activity:', error)
      })
    }

    const setupNUIListeners = () => {
      
      window.addEventListener('message', function(event) {        
        const data = event.data
        
        if (!data.action) {
          return
        }

        switch(data.action) {
          case 'preload':
            performanceOptimizer.preloadElements();
            performanceOptimizer.optimizeAnimations();
            break;
            
          case 'setupUI':
            if (data.locales) {
              localeData.value = data.locales
            }
            
            if (data.countries) {
              nationalities.value = data.countries
            }
            
            if (data.scenarios) {
              const scenarioList = []
              for (const [key, scenario] of Object.entries(data.scenarios)) {
                scenarioList.push({
                  value: key.toUpperCase(),
                  label: scenario.name
                })
              }
              scenarioOptions.value = scenarioList
            }
            
            if (data.characters && data.characters.length > 0) {
              const characterObj = {}
              
              data.characters.forEach((char, index) => {
                const slot = char.slot || (index + 1)
                
                characterObj[slot] = {
                  firstName: char.firstname || '',
                  lastName: char.lastname || '',
                  height: char.height || 180,
                  gender: char.sex === 'm' || char.sex === 'male' ? 'male' : 'female',
                  nationality: char.nationality || 'Estadounidense',
                  birthDate: char.dateofbirth || '',
                  phone: char.phone_number || '',
                  job: char.job || 'unemployed',
                  bank: char.bank || char.accounts?.bank || 0,
                  cash: char.money || char.accounts?.money || 0,
                  citizenid: char.citizenid || char.identifier || char.id,
                  identifier: char.identifier,
                  id: char.id,
                  skin: char.skin,
                  model: char.model
                }
              })
              
              characters.value = characterObj
            } else {
              characters.value = {}
            }
            maxCharacters.value = data.maxCharacters || 5
            break
            
          case 'showUI':
            document.body.style.display = 'block'
            break
            
          case 'closeUI':
            document.body.style.display = 'none'
            break
        }
      })
    }

    return {
      characters,
      selectedSlot,
      maxCharacters,
      newCharacter,
      nationalities,
      weatherOptions,
      scenarioOptions,
      showNationalityDropdown,
      showWeatherDropdown,
      showScenarioDropdown,
      nationalityButton,
      nationalityDropdown,
      weatherButton,
      weatherDropdown,
      scenarioButton,
      scenarioDropdown,
      deleteCharacterModal,
      characterToDelete,
      currentView,
      createCharacter,
      selectNationality,
      toggleNationalityDropdown,
      selectWeather,
      toggleWeatherDropdown,
      selectScenario,
      toggleScenarioDropdown,
      getWeatherLabel,
      getScenarioLabel,
      playCharacter,
      selectCharacter,
      deleteCharacter,
      showCreateCharacterPanel,
      selectGender,
      createDefaultPed,
      updatePedGender,
      selectSlot,
      calculateAge,
      getOccupiedSlots,
      showSettings,
      settings,
      toggleSettings,
      applyTheme,
      setGameWeather,
      setGameScenario,
      setActivity,
      localeData,
      loadLocaleData,
      t,
      setupNUIListeners
    }
  },
  mounted() {
    this.setupNUIListeners()    
    this.applyTheme(this.settings.themeColor)
  }
}).mount("#app");

} 

waitForVueAndInit();