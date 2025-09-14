const BikeRent = {
  setup() {
    const selectedFilter = ref("all");
    const searchTerm = ref("");
    const selectedBike = ref(null);
    const showFilters = ref(false);

    const vehicles = ref([
      {
        id: 1,
        name: "BMX Thunder",
        type: "bike",
        price: 50,
        status: "available",
        battery: 100,
        location: "Centro",
        rating: 4.8,
        image:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
        features: ["Ligera", "Deportiva", "Todo terreno"],
      },
      {
        id: 2,
        name: "Scooter Eléctrico",
        type: "scooter",
        price: 120,
        status: "available",
        battery: 85,
        location: "Puerto",
        rating: 4.9,
        image:
          "https://images.unsplash.com/photo-1558457775-e5e7b997d1a7?w=300&h=200&fit=crop",
        features: ["Eléctrico", "Rápido", "Ecológico"],
      },
      {
        id: 3,
        name: "Mountain Pro",
        type: "bike",
        price: 75,
        status: "rented",
        battery: 60,
        location: "Montaña",
        rating: 4.7,
        image:
          "https://images.unsplash.com/photo-1544191696-15693072b5a5?w=300&h=200&fit=crop",
        features: ["Resistente", "Suspensión", "Profesional"],
      },
      {
        id: 4,
        name: "Harley Classic",
        type: "motorcycle",
        price: 250,
        status: "available",
        battery: 95,
        location: "Centro",
        rating: 5.0,
        image:
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
        features: ["Potente", "Clásica", "Premium"],
      },
      {
        id: 5,
        name: "City Cruiser",
        type: "bike",
        price: 40,
        status: "maintenance",
        battery: 0,
        location: "Ciudad",
        rating: 4.5,
        image:
          "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=300&h=200&fit=crop",
        features: ["Cómoda", "Urbana", "Económica"],
      },
      {
        id: 6,
        name: "Sport Ninja",
        type: "motorcycle",
        price: 300,
        status: "available",
        battery: 100,
        location: "Aeropuerto",
        rating: 4.9,
        image:
          "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&h=200&fit=crop",
        features: ["Deportiva", "Velocidad", "Agilidad"],
      },
    ]);

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

    const handleRent = (vehicle) => {
      
      selectedBike.value = null;
    };

    const toggleFilters = () => {
      showFilters.value = !showFilters.value;
    };

    const selectVehicle = (vehicle) => {
      selectedBike.value = vehicle;
    };

    const closeModal = () => {
      selectedBike.value = null;
    };

    return {
      selectedFilter,
      searchTerm,
      selectedBike,
      showFilters,
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
        <div class="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900">
          <!
          <div class="absolute inset-0 bg-gradient-to-r from-primary-900/10 via-transparent to-primary-900/10"></div>
          <div class="absolute inset-0 opacity-5">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] bg-[length:20px_20px]"></div>
          </div>

          <div class="relative z-10 max-w-md mx-auto bg-gray-900/80 backdrop-blur-xl min-h-screen border-x border-gray-700/50">
            
            <header class="bg-gray-900/90 backdrop-blur-xl border-b border-gray-700/50 px-6 py-6 sticky top-0 z-20">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h1 class="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-500 bg-clip-text text-transparent">
                    BikeRent
                  </h1>
                  <p class="text-gray-400 text-sm mt-1">Alquila tu vehículo ideal</p>
                </div>
                <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                  </svg>
                </div>
              </div>
              <div class="relative mb-4">
                <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  v-model="searchTerm"
                  type="text"
                  placeholder="Buscar vehículos..."
                  class="w-full bg-gray-800/80 border border-gray-600 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
                />
              </div>

              <div class="flex items-center justify-between">
                <button
                  @click="toggleFilters"
                  class="flex items-center gap-3 bg-gray-800/80 border border-gray-600 rounded-xl px-4 py-3 text-gray-300 hover:bg-gray-700/80 hover:border-primary-500/50 transition-all duration-300"
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
                <span class="text-sm text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg">
                  {{ filteredVehicles.length }} vehículos
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
                <div v-show="showFilters" class="mt-4 p-4 bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50">
                  <div class="grid grid-cols-2 gap-2">
                    <button
                      v-for="filter in filters"
                      :key="filter.id"
                      @click="selectedFilter = filter.id"
                      class="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105"
                      :class="selectedFilter === filter.id
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:border-primary-500/50'"
                    >
                      {{ filter.name }}
                    </button>
                  </div>
                </div>
              </Transition>
            </header>

            <main class="px-6 py-6">
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
                    @click="selectVehicle(vehicle)"
                    class="group bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 cursor-pointer hover:bg-gray-700/60 hover:border-primary-500/50 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary-500/10"
                    :style="{ animationDelay: index * 100 + 'ms' }"
                  >
                    <div class="flex gap-4">
                      <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                        <img 
                          :src="vehicle.image" 
                          :alt="vehicle.name"
                          class="w-full h-full object-cover"
                        />
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between mb-2">
                          <div class="min-w-0 flex-1">
                            <h3 class="font-semibold text-white group-hover:text-primary-400 transition-colors duration-300 truncate">
                              {{ vehicle.name }}
                            </h3>
                            <div class="flex items-center gap-1 text-sm text-gray-400 mt-1">
                              <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              <span class="truncate">{{ vehicle.location }}</span>
                            </div>
                          </div>
                          
                          <div class="text-right ml-2">
                            <div class="text-lg font-bold text-primary-400">
                              {{ vehicle.price }}
                            </div>
                            <div class="text-xs text-gray-500">por hora</div>
                          </div>
                        </div>

                        <div class="flex items-center justify-between mb-3">
                          <div class="flex items-center gap-2">
                            <div :class="'w-2 h-2 rounded-full ' + getStatusColor(vehicle.status)" class="animate-pulse"></div>
                            <span class="text-xs text-gray-400">{{ getStatusText(vehicle.status) }}</span>
                          </div>
                          
                          <div class="flex items-center gap-3 text-xs text-gray-400">
                            <div class="flex items-center gap-1">
                              <svg class="w-3 h-3 text-accent-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.2 3L13 10.9L21 12L13 13.1L11.2 21L9.4 13.1L1.4 12L9.4 10.9L11.2 3Z"/>
                              </svg>
                              <span>{{ vehicle.battery }}%</span>
                            </div>
                            <div class="flex items-center gap-1">
                              <svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z"/>
                              </svg>
                              <span>{{ vehicle.rating }}</span>
                            </div>
                          </div>
                        </div>

                        <div class="flex flex-wrap gap-1">
                          <span
                            v-for="(feature, i) in vehicle.features.slice(0, 3)"
                            :key="i"
                            class="px-2 py-1 bg-primary-500/10 border border-primary-500/20 rounded-lg text-xs text-primary-400"
                          >
                            {{ feature }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </main>

            <Teleport to="body">
              <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div v-if="selectedBike" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
                  <Transition
                    enter-active-class="transition duration-400 ease-out"
                    enter-from-class="transform translate-y-full"
                    enter-to-class="transform translate-y-0"
                    leave-active-class="transition duration-300 ease-in"
                    leave-from-class="transform translate-y-0"
                    leave-to-class="transform translate-y-full"
                  >
                    <div v-if="selectedBike" class="w-full max-w-md mx-auto bg-gradient-to-t from-gray-900 via-gray-800 to-gray-700 rounded-t-3xl">
                      <div class="flex items-center justify-between p-6 border-b border-gray-600/50">
                        <h2 class="text-2xl font-bold text-white">{{ selectedBike.name }}</h2>
                        <button
                          @click="closeModal"
                          class="w-10 h-10 bg-gray-600/50 hover:bg-gray-500/50 rounded-full flex items-center justify-center transition-colors duration-200"
                        >
                          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>

                      <div class="px-6 py-4">
                        <div class="w-full h-48 rounded-2xl overflow-hidden bg-gray-700">
                          <img 
                            :src="selectedBike.image" 
                            :alt="selectedBike.name"
                            class="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      <div class="px-6 pb-6">
                        <div class="space-y-4 mb-6">
                          <div class="flex justify-between items-center py-3 border-b border-gray-600/30">
                            <span class="text-gray-400">Precio por hora</span>
                            <span class="text-2xl font-bold text-primary-400">{{ selectedBike.price }}</span>
                          </div>
                          
                          <div class="flex justify-between items-center py-3 border-b border-gray-600/30">
                            <span class="text-gray-400">Ubicación</span>
                            <span class="text-white flex items-center gap-2">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              </svg>
                              {{ selectedBike.location }}
                            </span>
                          </div>
                          
                          <div class="flex justify-between items-center py-3 border-b border-gray-600/30">
                            <span class="text-gray-400">Batería</span>
                            <span class="text-white flex items-center gap-2">
                              <svg class="w-4 h-4 text-accent-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.2 3L13 10.9L21 12L13 13.1L11.2 21L9.4 13.1L1.4 12L9.4 10.9L11.2 3Z"/>
                              </svg>
                              {{ selectedBike.battery }}%
                            </span>
                          </div>
                          
                          <div class="flex justify-between items-center py-3">
                            <span class="text-gray-400">Valoración</span>
                            <span class="text-white flex items-center gap-2">
                              <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L15.09 8.26L22 9L15.09 9.74L12 16L8.91 9.74L2 9L8.91 8.26L12 2Z"/>
                              </svg>
                              {{ selectedBike.rating }}
                            </span>
                          </div>
                        </div>

                        <div class="mb-8">
                          <h4 class="text-sm font-medium text-gray-400 mb-4">Características</h4>
                          <div class="flex flex-wrap gap-2">
                            <span
                              v-for="(feature, i) in selectedBike.features"
                              :key="i"
                              class="px-3 py-2 bg-primary-500/10 border border-primary-500/30 rounded-xl text-sm text-primary-400"
                            >
                              {{ feature }}
                            </span>
                          </div>
                        </div>

                        <button
                          @click="handleRent(selectedBike)"
                          :disabled="selectedBike.status !== 'available'"
                          class="w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300"
                          :class="selectedBike.status === 'available'
                            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-95'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'"
                        >
                          {{ selectedBike.status === 'available' ? 'Alquilar Ahora' : 'No Disponible' }}
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </Transition>
            </Teleport>
          </div>
        </div>
      `,
};
