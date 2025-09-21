const BikeRent = {
  setup() {
    const selectedFilter = ref("all");
    const searchTerm = ref("");
    const selectedBike = ref(null);
    const showFilters = ref(false);
    const selectedDuration = ref(1);
    const showModal = ref(false);

    const vehicles = ref([]);

    window.__bikerent_message_handler = (event) => {
      try {
        if (!event || !event.data) return;
        const { action, data } = event.data;
        if (action === 'bikerent:vehicles' && data && Array.isArray(data.vehicles)) {
          const uniqueVehicles = [];
          const seenIds = new Set();
          
          data.vehicles.forEach((v) => {
            if (!seenIds.has(v.id)) {
              seenIds.add(v.id);
              uniqueVehicles.push({
                id: v.id,
                name: v.name || v.label || '',
                type: v.category || 'bike',
                price: v.price || 0,
                status: 'available',
                battery: v.battery || 100,
                location: v.location || 'Centro',
                rating: v.rating || 4.5,
                image: v.image || '',
                features: v.features || [],
                model: v.model || null
              });
            }
          });
          
          vehicles.value = uniqueVehicles;
        }
      } catch (e) {
        
      }
    };

    window.addEventListener('message', window.__bikerent_message_handler);
    setTimeout(() => {
      fetch('https://bit-smartphone/bikerent:getVehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }).catch(() => {});
    }, 50);

    onUnmounted(() => {
      if (window.__bikerent_message_handler) {
        window.removeEventListener('message', window.__bikerent_message_handler);
        window.__bikerent_message_handler = null;
      }
    });

    const filters = [
      { id: "all", name: "Todos" },
      { id: "bike", name: "Bicicletas" },
      { id: "scooter", name: "Scooters" },
      { id: "motorcycle", name: "Motos" },
      { id: "available", name: "Disponibles" },
    ];

    const filteredVehicles = computed(() => {
      return vehicles.value.filter((vehicle) => {
        const matchesSearch = vehicle.name
          .toLowerCase()
          .includes(searchTerm.value.toLowerCase());
        const matchesFilter =
          selectedFilter.value === "all" ||
          vehicle.type === selectedFilter.value ||
          vehicle.status === selectedFilter.value;
        return matchesSearch && matchesFilter;
      });
    });

    const getStatusColor = (status) => {
      switch (status) {
        case "available":
          return "bg-emerald-500";
        case "rented":
          return "bg-amber-500";
        case "maintenance":
          return "bg-red-500";
        default:
          return "bg-gray-500";
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case "available":
          return "Disponible";
        case "rented":
          return "Alquilado";
        case "maintenance":
          return "Mantenimiento";
        default:
          return "Desconocido";
      }
    };

    const handleRent = async (vehicle) => {
      if (vehicle.status !== 'available') return;
      
      try {
        const response = await fetch('https://bit-smartphone/bikerent:rentVehicle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            duration: selectedDuration.value
          })
        });
      } catch (error) {
        
      }
    };

    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
    };

    const selectVehicle = (vehicle) => {
      selectedBike.value = vehicle;
      showModal.value = true;
    };

    const closeModal = () => {
      selectedBike.value = null;
      showModal.value = false;
    };

    return {
      selectedFilter,
      searchTerm,
      selectedBike,
      showFilters,
      showModal,
      selectedDuration,
      vehicles,
      filters,
      filteredVehicles,
      getStatusColor,
      getStatusText,
      handleRent,
      toggleFilters,
      selectVehicle,
      closeModal,
    };
  },

  template: `
        <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
          <div class="absolute inset-0 opacity-30">
            <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>

                <pattern id="modernGrid" width="60" height="60" patternUnits="userSpaceOnUse">

                  <line x1="0" y1="30" x2="60" y2="30" stroke="rgb(168, 203, 61)" stroke-width="0.5" opacity="0.7"/>

                  <line x1="30" y1="0" x2="30" y2="60" stroke="rgb(168, 203, 61)" stroke-width="0.5" opacity="0.7"/>

                  <circle cx="30" cy="30" r="1.5" fill="rgb(255, 235, 59)" opacity="0.8"/>

                  <circle cx="0" cy="0" r="1" fill="rgb(168, 203, 61)" opacity="0.4"/>
                  <circle cx="60" cy="60" r="1" fill="rgb(168, 203, 61)" opacity="0.4"/>
                </pattern>
                

                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="rgba(168, 203, 61, 0.1)"/>
                  <stop offset="70%" stop-color="rgba(168, 203, 61, 0.05)"/>
                  <stop offset="100%" stop-color="transparent"/>
                </radialGradient>
              </defs>
              

              <rect width="100%" height="100%" fill="url(#modernGrid)"/>
              

              <rect width="100%" height="100%" fill="url(#centerGlow)"/>
              

              <g opacity="0.6">
                <circle cx="10%" cy="20%" r="2" fill="rgb(255, 235, 59)">
                  <animate attributeName="cy" values="20%;25%;20%" dur="4s" repeatCount="indefinite"/>
                </circle>
                <circle cx="90%" cy="80%" r="1.5" fill="rgb(168, 203, 61)">
                  <animate attributeName="cx" values="90%;85%;90%" dur="6s" repeatCount="indefinite"/>
                </circle>
                <circle cx="70%" cy="30%" r="1" fill="rgb(255, 235, 59)" opacity="0.8">
                  <animate attributeName="r" values="1;2;1" dur="3s" repeatCount="indefinite"/>
                </circle>
              </g>
            </svg>
          </div>
          

          <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-gray-900/50"></div>

          <div class="relative z-10 h-screen flex flex-col">
            
            <header class="bg-gray-900/90 backdrop-blur-xl border-b border-lime-400/20 px-6 py-6 sticky top-0 z-20 flex-shrink-0 shadow-lg">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h1 class="text-3xl font-bold bg-gradient-to-r from-lime-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
                    BikeRent
                  </h1>
                  <p class="text-gray-300 text-sm mt-1 font-medium">🚴 Movilidad urbana inteligente</p>
                </div>
                <div class="w-14 h-14 bg-gradient-to-br from-lime-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-xl shadow-lime-400/25 border border-lime-300/20">
                  <svg class="w-8 h-8 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V5C15 3.34 13.66 2 12 2S9 3.34 9 5V5.5L3 7V9L9 7.5V19C9 20.66 10.34 22 12 22S15 20.66 15 19V7.5L21 9Z"/>
                  </svg>
                </div>
              </div>
              <div class="relative mb-4">
                <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 text-lime-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="🔍 Buscar vehículos..."
                  class="w-full bg-gray-800/90 border border-gray-600/50 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/30 focus:bg-gray-800/95 transition-all duration-300 shadow-lg"
                />
              </div>

              <div class="flex items-center justify-between">
                <button
                  @click="toggleFilters"
                  class="flex items-center gap-3 bg-gray-800/90 border border-gray-600/50 rounded-xl px-4 py-3 text-gray-300 hover:bg-gray-700/90 hover:border-lime-400/50 hover:text-lime-300 transition-all duration-300 shadow-lg"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"/>
                  </svg>
                  <span class="font-medium">Filtros</span>
                  <svg 
                    class="w-4 h-4 transform transition-transform duration-200"
                    :class="showFilters ? 'rotate-180' : ''"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <span class="text-sm text-lime-300 bg-gray-800/70 px-4 py-2 rounded-xl font-medium border border-gray-600/50">
                  ⚡ {{ filteredVehicles.length }} vehículos
                </span>
              </div>

              <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="transform opacity-0 -translate-y-4"
                enter-to-class="transform opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="transform opacity-100 translate-y-0"
                leave-to-class="transform opacity-0 -translate-y-4"
              >
                <div v-show="showFilters" class="mt-4 p-4 bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-600/50 shadow-xl">
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      v-for="filter in filters"
                      :key="filter.id"
                      @click="selectedFilter = filter.id"
                      class="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105"
                      :class="selectedFilter === filter.id
                        ? 'bg-gradient-to-r from-lime-400 to-yellow-400 text-gray-900 shadow-lg shadow-lime-400/30 font-bold'
                        : 'bg-gray-700/60 border border-gray-600 text-gray-300 hover:bg-gray-600/60 hover:border-lime-400/50 hover:text-lime-300'"
                    >
                      {{ filter.name }}
                    </button>
                  </div>
                </div>
              </Transition>
            </header>

            <main class="flex-1 overflow-y-auto px-6 py-6">
              <div v-if="filteredVehicles.length === 0" class="flex flex-col items-center justify-center py-16">
                <div class="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-2 text-gray-300">No hay vehículos</h3>
                <p class="text-gray-500 text-center">No se encontraron vehículos que coincidan con tu búsqueda</p>
              </div>

              <div class="space-y-4">
                <TransitionGroup
                  enter-active-class="transition duration-500 ease-out"
                  enter-from-class="opacity-0 transform scale-90 translate-y-8"
                  enter-to-class="opacity-100 transform scale-100 translate-y-0"
                  leave-active-class="transition duration-300 ease-in"
                  leave-from-class="opacity-100 transform scale-100"
                  leave-to-class="opacity-0 transform scale-90"
                >
                  <div
                    v-for="(vehicle, index) in filteredVehicles"
                    :key="vehicle.id"
                    class="group bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-600/40 rounded-3xl p-6 cursor-pointer hover:from-gray-700/80 hover:to-gray-800/80 hover:border-lime-400/50 transition-all duration-500 hover:transform hover:scale-[1.03] hover:shadow-2xl hover:shadow-lime-400/20 relative overflow-hidden"
                    :style="{ animationDelay: index * 100 + 'ms' }"
                  >

                    <div class="absolute inset-0 bg-gradient-to-r from-lime-400/5 to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                    <div class="relative z-10 flex gap-5">
                      <div class="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-800 flex-shrink-0 group-hover:scale-110 transition-all duration-500 border border-gray-600/50 group-hover:border-lime-400/30 shadow-lg">
                        <img 
                          :src="vehicle.image" 
                          :alt="vehicle.name"
                          class="w-full h-full object-cover group-hover:brightness-110 transition-all duration-500"
                        />
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between mb-3">
                          <div class="min-w-0 flex-1">
                            <h3 class="text-lg font-bold text-white group-hover:text-lime-300 transition-colors duration-300 truncate mb-1">
                              {{ vehicle.name }}
                            </h3>
                            <div class="flex items-center gap-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                              <svg class="w-4 h-4 flex-shrink-0 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              <span class="truncate font-medium">{{ vehicle.location }}</span>
                            </div>
                          </div>
                          
                          <div class="text-right ml-3">
                            <div class="text-xl font-bold bg-gradient-to-r from-lime-400 to-yellow-400 bg-clip-text text-transparent">
                              {{ vehicle.price }}$
                            </div>
                            <div class="text-xs text-gray-400 font-medium">por hora</div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between mb-4">
                          <div class="flex items-center gap-3">
                            <div class="flex items-center gap-2 bg-gray-700/50 rounded-full px-3 py-1">
                              <div :class="'w-2 h-2 rounded-full ' + getStatusColor(vehicle.status)" class="animate-pulse"></div>
                              <span class="text-xs text-gray-300 font-medium">{{ getStatusText(vehicle.status) }}</span>
                            </div>
                          </div>
                          
                          <div class="flex items-center gap-4 text-xs">
                            <div class="flex items-center gap-1 bg-yellow-400/10 rounded-full px-2 py-1">
                              <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.2 3L13 10.9L21 12L13 13.1L11.2 21L9.4 13.1L1.4 12L9.4 10.9L11.2 3Z"/>
                              </svg>
                              <span class="text-yellow-300 font-medium">{{ vehicle.battery }}%</span>
                            </div>
                            <div class="flex items-center gap-1 bg-lime-400/10 rounded-full px-2 py-1">
                              <svg class="w-3 h-3 text-lime-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z"/>
                              </svg>
                              <span class="text-lime-300 font-medium">{{ vehicle.rating }}</span>
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between">
                          <div class="flex flex-wrap gap-2">
                            <span
                              v-for="(feature, i) in vehicle.features.slice(0, 2)"
                              :key="i"
                              class="px-2 py-1 bg-lime-400/10 border border-lime-400/20 rounded-lg text-xs text-lime-300 font-medium"
                            >
                              {{ feature }}
                            </span>
                          </div>
                          

                          <button
                            @click.stop="handleRent(vehicle)"
                            :disabled="vehicle.status !== 'available'"
                            class="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                            :class="vehicle.status === 'available'
                              ? 'bg-gradient-to-r from-lime-400 to-yellow-400 text-gray-900 hover:shadow-lg hover:shadow-lime-400/30 border border-lime-300/30'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'"
                          >
                            {{ vehicle.status === 'available' ? '🚲 Alquilar' : '❌ No disponible' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </main>


            <Transition
              enter-active-class="transition duration-500 ease-out"
              enter-from-class="transform translate-y-full opacity-0"
              enter-to-class="transform translate-y-0 opacity-100"
              leave-active-class="transition duration-300 ease-in"
              leave-from-class="transform translate-y-0 opacity-100"
              leave-to-class="transform translate-y-full opacity-0"
            >
              <div v-if="selectedBike && showModal" class="absolute inset-0 z-30 bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl flex flex-col overflow-hidden min-h-0">

                <div class="absolute inset-0 opacity-20">
                  <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="modalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="20" x2="40" y2="20" stroke="rgb(168, 203, 61)" stroke-width="0.3" opacity="0.5"/>
                        <line x1="20" y1="0" x2="20" y2="40" stroke="rgb(168, 203, 61)" stroke-width="0.3" opacity="0.5"/>
                        <circle cx="20" cy="20" r="1" fill="rgb(255, 235, 59)" opacity="0.6"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#modalGrid)"/>
                  </svg>
                </div>

                <div class="relative z-10 flex items-center justify-between p-6 border-b border-lime-400/20 flex-shrink-0 bg-gray-900/80 backdrop-blur-xl">
                  <div>
                    <h2 class="text-2xl font-bold bg-gradient-to-r from-lime-400 via-yellow-400 to-amber-400 bg-clip-text text-transparent drop-shadow-lg">
                      {{ selectedBike.name }}
                    </h2>
                    <p class="text-sm text-gray-300 mt-1">🚀 Detalles del vehículo</p>
                  </div>
                  <button
                    @click="closeModal"
                    class="w-12 h-12 bg-gray-800/80 hover:bg-lime-400/20 rounded-2xl flex items-center justify-center transition-all duration-300 border border-gray-600 hover:border-lime-400/50 shadow-lg hover:shadow-lime-400/20"
                  >
                    <svg class="w-6 h-6 text-white hover:text-lime-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </div>


                <div class="relative z-10 flex-1 overflow-y-auto px-6 py-6 min-h-0">
                  <div class="w-full h-56 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600/50 mb-6 shadow-2xl relative group">
                    <div class="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent z-10"></div>
                    <img 
                      :src="selectedBike.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNEY0RjRGIi8+CjxwYXRoIGQ9Ik0xNTAgMTAwTDEyNSA4NUwxNzUgNzVMMTc1IDEyNUwxMjUgMTI1WiIgZmlsbD0iIzEwYjk4MSIvPgo8L3N2Zz4='" 
                      :alt="selectedBike.name"
                      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div class="absolute bottom-4 left-4 z-20">
                      <div class="bg-lime-400/90 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                        💚 {{ selectedBike.status === 'available' ? 'Disponible' : 'No disponible' }}
                      </div>
                    </div>
                  </div>

                  <div class="space-y-4 mb-6">
                    <div class="flex justify-between items-center py-3 border-b border-gray-700/50">
                      <span class="text-gray-400">Precio por hora</span>
                      <span class="text-2xl font-bold text-emerald-400">{{ selectedBike.price }}$</span>
                    </div>
                          
                    <div class="flex justify-between items-center py-3 border-b border-gray-700/50">
                      <span class="text-gray-400">Ubicación</span>
                      <span class="text-white flex items-center gap-2">
                        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        {{ selectedBike.location }}
                      </span>
                    </div>
                    
                    <div class="flex justify-between items-center py-3 border-b border-gray-700/50">
                      <span class="text-gray-400">Batería</span>
                      <span class="text-white flex items-center gap-2">
                        <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.2 3L13 10.9L21 12L13 13.1L11.2 21L9.4 13.1L1.4 12L9.4 10.9L11.2 3Z"/>
                        </svg>
                        {{ selectedBike.battery }}%
                      </span>
                    </div>
                    
                    <div class="flex justify-between items-center py-3 border-b border-gray-700/50">
                      <span class="text-gray-400">Valoración</span>
                      <span class="text-white flex items-center gap-2">
                        <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z"/>
                        </svg>
                        {{ selectedBike.rating }}
                      </span>
                    </div>


                    <div class="py-4">
                      <span class="text-gray-300 block mb-4 font-semibold text-lg">⏱️ Duración del alquiler</span>
                      <div class="grid grid-cols-3 gap-3">
                        <button
                          v-for="duration in [1, 3, 6]"
                          :key="duration"
                          @click="selectedDuration = duration"
                          class="px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                          :class="selectedDuration === duration
                            ? 'bg-gradient-to-r from-lime-400 to-yellow-400 text-gray-900 shadow-lg shadow-lime-400/30 border border-lime-300/50'
                            : 'bg-gray-700/60 border border-gray-600 text-gray-300 hover:border-lime-400/50 hover:bg-gray-600/60'"
                        >
                          {{ duration }}h
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="mb-6">
                    <h4 class="text-lg font-semibold text-gray-300 mb-4">⭐ Características</h4>
                    <div class="flex flex-wrap gap-3">
                      <span
                        v-for="(feature, i) in selectedBike.features"
                        :key="i"
                        class="px-4 py-2 bg-lime-400/15 border border-lime-400/30 rounded-2xl text-sm text-lime-300 font-medium hover:bg-lime-400/20 transition-all duration-300"
                      >
                        {{ feature }}
                      </span>
                    </div>
                  </div>
                </div>


                <div class="relative z-10 border-t border-lime-400/20 p-4 flex-shrink-0 bg-gray-900/90 backdrop-blur-xl">
                  <div class="flex justify-between items-center mb-4 p-3 bg-gray-800/60 rounded-xl border border-gray-600/50">
                    <span class="text-gray-300 font-semibold">💰 Total</span>
                    <span class="text-xl font-bold bg-gradient-to-r from-lime-400 to-yellow-400 bg-clip-text text-transparent">
                      {{ (selectedBike.price * selectedDuration) }}$
                    </span>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      @click="closeModal"
                      class="py-3 px-4 rounded-xl font-semibold bg-gray-700/60 border border-gray-600 text-gray-300 hover:bg-gray-600/60 hover:border-gray-500 transition-all duration-300 text-sm"
                    >
                      ❌ Cancelar
                    </button>
                    <button
                      @click="handleRent(selectedBike); closeModal();"
                      :disabled="selectedBike.status !== 'available'"
                      class="py-3 px-4 rounded-xl font-semibold transition-all duration-300 text-sm"
                      :class="selectedBike.status === 'available'
                        ? 'bg-gradient-to-r from-lime-400 to-yellow-400 text-gray-900 hover:shadow-lg hover:shadow-lime-400/30 border border-lime-300/50'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600'"
                    >
                      {{ selectedBike.status === 'available' ? '🚲 Alquilar' : '❌ No Disponible' }}
                    </button>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      `,
};

// Exponer el componente globalmente
window.BikeRent = BikeRent;
window.BikeRent = window.BikeRent || BikeRent;
