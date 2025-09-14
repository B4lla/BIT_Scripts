const Business = {
  name: 'Business',
  props: ['userSettings', 'photos', 't'],
  emits: ['close', 'add-notification'],
  
  data() {
    return {
      businesses: [],
      isLoading: false,
      loadingMessage: ''
    };
  },

  mounted() {
    this.loadBusinessData();
  },

  methods: {
    async loadBusinessData() {
      this.isLoading = true;
      this.loadingMessage = 'Cargando negocios...';

      try {
        const response = await fetch('https://bit-smartphone/loadBusinesses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });
        
        const data = await response.json();
        
        
        if (data && data.success) {
          this.businesses = data.businesses || [];
        } else {
          this.businesses = [];
        }
      } catch (error) {
        this.businesses = [];
      } finally {
        this.isLoading = false;
      }
    },

    async businessAction(business) {
      try {
        await fetch('https://bit-smartphone/businessAction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            business: business,
            action: business.action
          })
        });
      } catch (error) {
        console.error('Error executing business action:', error);
      }
    },

    async showOnMap(business) {
      try {
        await fetch('https://bit-smartphone/showBusinessOnMap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: business.name,
            location: business.location
          })
        });
      } catch (error) {
        console.error('Error showing business on map:', error);
      }
    }
  },

  template: `
    <div class="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative flex flex-col">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      </div>

      <transition name="fade">
        <div v-if="isLoading" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div class="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 flex flex-col items-center">
            <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-white font-medium">{{ loadingMessage }}</p>
          </div>
        </div>
      </transition>

      <div class="sticky top-0 z-40 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div class="flex items-center justify-between px-6 py-4">
          <button @click="$emit('close')" 
                  class="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-white">Directorio Comercial</h1>
              <p class="text-sm text-white/60">Encuentra todos los negocios de la ciudad</p>
            </div>
          </div>
          
          <div class="w-12"></div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div class="p-6">
          <div class="max-w-4xl mx-auto">
            <div class="space-y-4 pb-20">
              <div v-for="business in businesses" 
                   :key="business.id"
                   class="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                
                <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <div class="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl overflow-hidden">
                    <img v-if="business.image" :src="business.image" :alt="business.name" 
                         class="w-full h-full object-cover">
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="text-xl font-bold text-white mb-2">{{ business.name }}</h3>
                  <p class="text-white/70 text-sm leading-relaxed mb-4">{{ business.description }}</p>
                  
                  <div class="flex items-center space-x-2 text-white/50 text-xs mb-4">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>{{ Math.floor(business.location.x) }}, {{ Math.floor(business.location.y) }}</span>
                  </div>

                  <div class="flex items-center space-x-3">
                    <button @click="businessAction(business)" 
                            class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl transition-all duration-300 flex items-center space-x-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span>{{ business.buttonText || 'Visitar' }}</span>
                    </button>

                    <button @click="showOnMap(business)" 
                            class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all duration-300 flex items-center space-x-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                      </svg>
                      <span>Mapa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="businesses.length === 0 && !isLoading" 
                 class="text-center py-16">
              <div class="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-white mb-2">No hay negocios disponibles</h3>
              <p class="text-white/60">Los negocios aparecerán aquí cuando estén configurados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};