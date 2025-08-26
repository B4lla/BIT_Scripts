const AppStore = {
  name: 'AppStore',
  emits: ["close"],
  setup() {
    const { ref, computed, onMounted } = Vue;
    
  const searchQuery = ref("")
  
  const selectedCategory = ref("all")
    const availableApps = ref([])
  const loading = ref(true)
  const downloadingApps = ref({})

    const categories = [
      { id: "all", name: "Todas", icon: "grid" },
      { id: "featured", name: "Destacadas", icon: "star" },
      { id: "games", name: "Juegos", icon: "gamepad-2" },
      { id: "productivity", name: "Productividad", icon: "briefcase" },
      { id: "social", name: "Redes Sociales", icon: "users" },
      { id: "finance", name: "Finanzas", icon: "credit-card" },
      { id: "entertainment", name: "Entretenimiento", icon: "play" },
      { id: "tools", name: "Herramientas", icon: "settings" },
      { id: "transport", name: "Transporte", icon: "car" },
    ]

    const loadAvailableApps = async () => {
      try {
        loading.value = true
        console.log('[App Store] Fetching available apps...');
        
  const response = await fetch('https://bit-smartphone.com/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        console.log('[App Store] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[App Store] Received data:', data);
          availableApps.value = data.apps || data || [];
          console.log('[App Store] Available apps count:', availableApps.value.length);
        } else {
          console.log('[App Store] Response not ok:', response.statusText);
          availableApps.value = [];
        }
      } catch (e) {
        console.log('[App Store] Error fetching available apps:', e);
        availableApps.value = [];
      } finally {
        loading.value = false
      }
    }

    const featuredApps = computed(() => {
      return availableApps.value
        .filter(app => app.rating >= 4.5)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
    })

    const filteredApps = computed(() => {
      let apps = availableApps.value
      if (selectedCategory.value === "all") {
        
        apps = availableApps.value
      } else if (selectedCategory.value === "featured") {
        apps = featuredApps.value
      } else {
        apps = apps.filter((app) => app.category === selectedCategory.value)
      }
      if (searchQuery.value) {
        apps = apps.filter(
          (app) =>
            app.label.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            app.description.toLowerCase().includes(searchQuery.value.toLowerCase()),
        )
      }
      return apps
    })

    const handleInstallApp = async (app) => {
      if (downloadingApps.value[app.id] != null) return;
      
      downloadingApps.value[app.id] = 0;
      const interval = setInterval(() => {
        downloadingApps.value[app.id] += 10;
        if (downloadingApps.value[app.id] >= 100) {
          clearInterval(interval);
          downloadingApps.value[app.id] = null;
          
          try {
            if (window.appInstance && typeof window.appInstance.installApp === 'function') {
              window.appInstance.installApp(app.id).then(success => {
                if (success) loadAvailableApps();
              });
            }
          } catch (e) {
            console.error('[App Store] ', e);
          }
        }
      }, 200);
    }

    const isInstalled = (appId) => {
      if (window.appInstance && typeof window.appInstance.isAppInstalled === 'function') {
        return window.appInstance.isAppInstalled(appId);
      }
      return false;
    }

    const formatPrice = (price) => {
      return price === 0 ? 'Gratis' : `$${price}`;
    }

    onMounted(() => {
      loadAvailableApps();
    })

    return {
      searchQuery,
      selectedCategory,
      categories,
      availableApps,
      featuredApps,
      filteredApps,
      loading,
      downloadingApps,
      handleInstallApp,
      isInstalled,
      formatPrice,
    }
  },
  template: `
    <div class="flex flex-col h-full bg-white text-black">
      <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <h1 class="text-xl font-bold">App Store</h1>
        <button @click="$emit('close')" class="p-2 hover:bg-white/20 rounded-full transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="p-4 bg-gray-50 border-b">
        <div class="relative">
          <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar aplicaciones y juegos..."
            class="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div class="flex overflow-x-auto p-4 space-x-3 bg-white border-b">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectedCategory = category.id"
          :class="[
            'flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200',
            selectedCategory === category.id 
              ? 'bg-blue-500 text-white shadow-md transform scale-105' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          <i :data-lucide="category.icon" class="w-4 h-4"></i>
          <span class="text-sm font-medium">{{ category.name }}</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto bg-gray-50">
        <div v-if="loading" class="flex items-center justify-center p-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p class="text-gray-600">Cargando aplicaciones...</p>
          </div>
        </div>

        <div v-else class="p-4">
          <div v-if="filteredApps.length === 0" class="text-center py-12">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i data-lucide="package" class="w-8 h-8 text-gray-400"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">No se encontraron aplicaciones</h3>
            <p class="text-gray-500">Prueba con otros términos de búsqueda</p>
          </div>
          
          <div v-else class="space-y-4">
            <div
              v-for="app in filteredApps"
              :key="app.id"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200"
            >
              <div class="p-5">
                <div class="flex items-start space-x-4">
                  <div class="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <img v-if="app.image" :src="app.image" alt="{{ app.label }}" class="w-full h-full object-contain">
                    <i v-else :data-lucide="app.icon" class="w-8 h-8 text-blue-600"></i>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <h3 class="text-lg font-semibold text-gray-900 truncate">{{ app.label }}</h3>
                        <p class="text-sm text-gray-500 line-clamp-2 leading-relaxed">{{ app.description }}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-4 mb-3">
                      <div class="flex items-center">
                        <i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>
                        <span class="text-sm font-medium text-gray-700 ml-1">{{ app.rating }}</span>
                      </div>
                      <div class="h-1 w-1 bg-gray-300 rounded-full"></div>
                      <span class="text-sm text-gray-500 capitalize">{{ categories.find(c => c.id === app.category)?.name }}</span>
                      <div class="h-1 w-1 bg-gray-300 rounded-full"></div>
                      <span class="text-sm font-semibold text-green-600">{{ formatPrice(app.price) }}</span>
                    </div>

                    <div class="flex items-center justify-between">
                      <div class="flex space-x-2">
                        <span v-if="app.ageRating" class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{{ app.ageRating }}+</span>
                      </div>
                      
                      <div v-if="downloadingApps[app.id] != null" class="px-6 py-2 text-sm text-gray-700">
                        Descargando... {{ downloadingApps[app.id] }}%
                      </div>
                      
                      <button
                        v-else-if="!isInstalled(app.id)"
                        @click="handleInstallApp(app)"
                        :class="[
                          'px-6 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 transform hover:scale-105',
                          app.price === 0 
                            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md' 
                            : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                        ]"
                      >
                        {{ app.price === 0 ? 'OBTENER' : 'COMPRAR' }}
                      </button>
                      
                      <div
                        v-else
                        class="px-6 py-2.5 bg-gray-100 text-gray-500 text-sm font-semibold rounded-full flex items-center space-x-1"
                      >
                        <i data-lucide="check" class="w-4 h-4"></i>
                        <span>INSTALADO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
}

window.appStore = AppStore