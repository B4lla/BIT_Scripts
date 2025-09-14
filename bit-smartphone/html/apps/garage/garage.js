const Garage = {
  props: [
    "userSettings",
    "t",
  ],
  emits: ["close", "add-notification"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted, nextTick } = Vue;
    
    const currentView = ref('garage') 
    const selectedVehicle = ref(null)
    const searchQuery = ref('')
    const filterType = ref('all') 
    const isLoading = ref(false)
    const sortBy = ref('name') 
    const vehicles = ref([])
    const locations = ref([])
    const selectedLocation = ref(null)

    
    const filteredVehicles = computed(() => {
      let filtered = vehicles.value

      
      if (filterType.value !== 'all') {
        filtered = filtered.filter(vehicle => vehicle.type === filterType.value)
      }

      
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(vehicle => 
          vehicle.label.toLowerCase().includes(query) ||
          vehicle.plate.toLowerCase().includes(query)
        )
      }

      
      filtered.sort((a, b) => {
        switch (sortBy.value) {
          case 'name':
            return a.label.localeCompare(b.label)
          case 'lastUsed':
            return new Date(b.lastUsed) - new Date(a.lastUsed)
          case 'type':
            return a.type.localeCompare(b.type)
          default:
            return 0
        }
      })

      return filtered
    })

    const vehicleStats = computed(() => {
      const total = vehicles.value.length
      const stored = vehicles.value.filter(v => v.stored).length
      const outOfGarage = vehicles.value.filter(v => !v.stored && !v.pound).length
      const impounded = vehicles.value.filter(v => v.pound).length

      return { total, stored, outOfGarage, impounded }
    })

    
    const loadVehicles = async () => {
      isLoading.value = true
      try {
  const response = await fetch('https://bit-smartphone/bit-smartphone:garage:loadVehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        
        const result = await response.json()
        
        if (result.ok) {
          vehicles.value = result.vehicles || []
        } else {
          throw new Error('Error al cargar vehículos')
        }
      } catch (error) {
        console.error('Error loading vehicles:', error)
        emit('add-notification', {
          appId: 'garage',
          title: 'Garage',
          message: 'Error al cargar vehículos',
          icon: 'alert-triangle'
        })
      }
      isLoading.value = false
    }

    const spawnVehicle = async (vehicle) => {
      if (!vehicle.stored) {
        emit('add-notification', {
          appId: 'garage',
          title: 'Garage',
          message: 'Este vehículo no está guardado',
          icon: 'alert-triangle'
        })
        return
      }

      if (vehicle.pound) {
        emit('add-notification', {
          appId: 'garage',
          title: 'Garage',
          message: 'Este vehículo está incautado',
          icon: 'alert-triangle'
        })
        return
      }

      isLoading.value = true
      try {
  const response = await fetch('https://bit-smartphone/bit-smartphone:garage:spawnVehicle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plate: vehicle.plate,
            model: vehicle.model,
            props: vehicle.props
          })
        })
        
        const result = await response.json()
        
        if (result.ok) {
          
          const vehicleIndex = vehicles.value.findIndex(v => v.plate === vehicle.plate)
          if (vehicleIndex !== -1) {
            vehicles.value[vehicleIndex].stored = false
            vehicles.value[vehicleIndex].status = "Fuera del garaje"
          }

          emit('add-notification', {
            appId: 'garage',
            title: 'Garage',
            message: result.message,
            icon: 'car'
          })

          currentView.value = 'garage'
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        console.error('Error spawning vehicle:', error)
        emit('add-notification', {
          appId: 'garage',
          title: 'Garage',
          message: error.message || 'Error al sacar vehículo',
          icon: 'alert-triangle'
        })
      }
      isLoading.value = false
    }

    const storeVehicle = async (vehicle) => {
      if (vehicle.stored) {
        emit('add-notification', {
          appId: 'garage',
          title: 'Garage',
          message: 'Este vehículo ya está guardado',
          icon: 'alert-triangle'
        })
        return
      }

      isLoading.value = true
      try {
  const response = await fetch('https://bit-smartphone/bit-smartphone:garage:storeVehicle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plate: vehicle.plate
          })
        })
        
        const result = await response.json()
        
        if (result.ok) {
          
          const vehicleIndex = vehicles.value.findIndex(v => v.plate === vehicle.plate)
          if (vehicleIndex !== -1) {
            vehicles.value[vehicleIndex].stored = true
            vehicles.value[vehicleIndex].status = "Guardado"
          }

          emit('add-notification', {
            appId: 'garage',
            title: 'Garage',
            message: result.message,
            icon: 'car'
          })
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        console.error('Error storing vehicle:', error)
        emit('add-notification', {
          appId: 'garage',
          title: 'Garage',
          message: error.message || 'Error al guardar vehículo',
          icon: 'alert-triangle'
        })
      }
      isLoading.value = false
    }

    const viewDetails = (vehicle) => {
      selectedVehicle.value = vehicle
      currentView.value = 'details'
    }

    const goBack = () => {
      if (currentView.value === 'details') {
        currentView.value = 'garage'
        selectedVehicle.value = null
      } else if (currentView.value === 'locations') {
        currentView.value = 'garage'
      }
    }

    const getVehicleIcon = (type) => {
      switch (type) {
        case 'boat': return 'anchor'
        case 'aircraft': return 'plane'
        case 'bike':
        case 'bicycle': return 'bike'
        default: return 'car'
      }
    }

    const getStatusColor = (vehicle) => {
      if (vehicle.pound) return 'text-red-500'
      if (!vehicle.stored) return 'text-yellow-500'
      return 'text-green-500'
    }

    const getStatusIcon = (vehicle) => {
      if (vehicle.pound) return 'alert-triangle'
      if (!vehicle.stored) return 'map-pin'
      return 'check-circle'
    }

    const getStatusText = (vehicle) => {
      if (!vehicle) return 'Desconocido'
      if (vehicle.pound) return 'Incautado'
      if (vehicle.stored == false) return 'Fuera del garaje'
      return 'Guardado'
    }

    
    const filterOptions = ref([
      { id: 'all', name: 'Todos' },
      { id: 'car', name: 'Coches' },
      { id: 'bike', name: 'Bicis' }
    ])

    const selectVehicle = (vehicle) => {
      
      viewDetails(vehicle)
    }

    const requestVehicle = async (vehicle) => {
      
      await spawnVehicle(vehicle)
    }

    const payImpoundFee = (vehicle) => {
      emit('add-notification', {
        appId: 'garage',
        title: 'Garage',
        message: 'Pago de multa no implementado en el cliente',
        icon: 'alert-triangle'
      })
    }

    const trackVehicle = (vehicle) => {
      emit('add-notification', {
        appId: 'garage',
        title: 'Garage',
        message: 'Localizando vehículo...',
        icon: 'map-pin'
      })
    }

    const spawnPoints = ref([])

    const formatLastUsed = (timestamp) => {
      if (!timestamp) return 'Nunca'
      
      const now = Date.now() / 1000
      const diff = now - timestamp
      
      if (diff < 60) return 'Hace unos momentos'
      if (diff < 3600) return 'Hace ' + Math.floor(diff / 60) + ' min'
      if (diff < 86400) return 'Hace ' + Math.floor(diff / 3600) + ' h'
      if (diff < 604800) return 'Hace ' + Math.floor(diff / 86400) + ' días'
      
      return new Date(timestamp * 1000).toLocaleDateString()
    }

    
    onMounted(async () => {
      await loadVehicles()
    })

    return {
      currentView,
      selectedVehicle,
      searchQuery,
      filterType,
      sortBy,
      isLoading,
      vehicles,
      filteredVehicles,
      vehicleStats,
      
      loadVehicles,
      spawnVehicle,
      storeVehicle,
      viewDetails,
      selectVehicle,
      filterOptions,
      requestVehicle,
      payImpoundFee,
      trackVehicle,
      spawnPoints,
      getStatusText,
      goBack,
      getVehicleIcon,
      getStatusColor,
      getStatusIcon,
      formatLastUsed,
      
      userSettings: props.userSettings,
      t: props.t
    }
  },
  
  template:  `
    <div class="garage-app h-full w-full flex flex-col overflow-hidden"
         :class="userSettings.darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-b from-blue-50 to-white text-gray-900'">

      
      <header class="relative backdrop-blur-xl border-b p-4 pt-16"
              :class="userSettings.darkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-blue-200/50'">
        
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button @click="goBack" v-if="currentView !== 'garage'" 
                    class="p-2 rounded-xl transition-all"
                    :class="userSettings.darkMode ? 'bg-gray-800/60 hover:bg-gray-700/60 text-white' : 'bg-white/60 hover:bg-white/80 text-gray-700'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5m-11 0A1.5 1.5 0 0 1 5 14.5 1.5 1.5 0 0 1 6.5 13 1.5 1.5 0 0 1 8 14.5 1.5 1.5 0 0 1 6.5 16M18.92 6c-.2-.58-.76-1-1.42-1H6.5c-.66 0-1.22.42-1.42 1L3 12v8a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h12v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-8l-2.08-6z"/>
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold">Garage</h1>
                <p class="text-xs opacity-70">Gestiona tus vehículos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      
      <main class="flex-1 overflow-hidden">
        
        
        <div v-if="currentView === 'garage'" class="h-full flex flex-col">
          
          
          <div class="p-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 rounded-2xl border transition-all"
                   :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200/50'">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-2xl font-bold text-blue-600">{{ vehicleStats.total }}</p>
                    <p class="text-sm font-medium" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-600'">
                      Total
                    </p>
                  </div>
                </div>
              </div>
              
              <div class="p-4 rounded-2xl border transition-all"
                   :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200/50'">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-2xl font-bold text-green-600">{{ vehicleStats.available }}</p>
                    <p class="text-sm font-medium" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-600'">
                      Disponibles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          <div class="p-4 space-y-4">
            <div class="flex space-x-2 overflow-x-auto pb-2">
              <button v-for="filter in filterOptions" 
                      :key="filter.id"
                      @click="filterType = filter.id"
                      class="flex items-center space-x-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all"
                      :class="filterType === filter.id 
                        ? 'bg-blue-600 text-white' 
                        : (userSettings.darkMode 
                          ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60' 
                          : 'bg-white/80 text-gray-700 hover:bg-white')">
                <span class="text-sm font-medium">{{ filter.name }}</span>
              </button>
            </div>
          </div>

          
          <div class="flex-1 overflow-y-auto px-4 pb-4">
            <div class="space-y-4">
              <div v-for="vehicle in filteredVehicles" 
                   :key="vehicle.id"
                   @click="selectVehicle(vehicle)"
                   class="p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]"
                   :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50 hover:border-blue-500/50' : 'bg-white/80 border-gray-200/50 hover:border-blue-400/50'">
                
                <div class="flex items-center">
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <h3 class="font-bold text-lg"
                            :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                          {{ vehicle.displayName }}
                        </h3>
                        <div class="flex items-center space-x-3 mt-1">
                          <span class="text-sm font-medium px-2 py-1 rounded-lg"
                                :class="userSettings.darkMode ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'">
                            {{ vehicle.plate }}
                          </span>
                          <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                            {{ vehicle.location }}
                          </span>
                        </div>
                      </div>
                      
                      
                      <span class="px-3 py-1 rounded-full text-xs font-semibold"
                            :class="vehicle.impounded 
                              ? 'bg-red-100 text-red-600' 
                              : (vehicle.engine < 50 || vehicle.body < 50 
                                ? 'bg-yellow-100 text-yellow-600' 
                                : 'bg-green-100 text-green-600')">
                        {{ getStatusText(vehicle) }}
                      </span>
                    </div>
                    
                    
                    <div class="grid grid-cols-3 gap-3 mt-3">
                      <div class="space-y-1">
                        <div class="flex justify-between text-xs font-medium"
                             :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                          <span>Combustible</span>
                          <span>{{ vehicle.fuel }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                               :style="{ width: vehicle.fuel + '%' }"></div>
                        </div>
                      </div>
                      
                      <div class="space-y-1">
                        <div class="flex justify-between text-xs font-medium"
                             :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                          <span>Motor</span>
                          <span>{{ vehicle.engine }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="h-2 rounded-full transition-all duration-500" 
                               :class="vehicle.engine > 75 ? 'bg-green-500' : vehicle.engine > 50 ? 'bg-yellow-500' : 'bg-red-500'"
                               :style="{ width: vehicle.engine + '%' }"></div>
                        </div>
                      </div>
                      
                      <div class="space-y-1">
                        <div class="flex justify-between text-xs font-medium"
                             :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                          <span>Carrocería</span>
                          <span>{{ vehicle.body }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="h-2 rounded-full transition-all duration-500" 
                               :class="vehicle.body > 75 ? 'bg-green-500' : vehicle.body > 50 ? 'bg-yellow-500' : 'bg-red-500'"
                               :style="{ width: vehicle.body + '%' }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div class="ml-4">
                    <button v-if="!vehicle.impounded"
                            @click.stop="requestVehicle(vehicle)"
                            class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold text-sm">
                      Pedir
                    </button>
                    <button v-else
                            @click.stop="payImpoundFee(vehicle)"
                            class="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold text-sm">
                      Pagar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div v-if="currentView === 'details' && selectedVehicle" class="h-full overflow-y-auto">
          <div class="space-y-6 p-4">
            
            
            <div class="space-y-4">
              <div class="text-center">
                <h1 class="text-3xl font-bold text-blue-600">{{ selectedVehicle.displayName }}</h1>
                <p class="text-lg font-medium mt-1" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-600'">
                  {{ selectedVehicle.plate }}
                </p>
              </div>
              
              
              <div class="grid grid-cols-2 gap-3">
                <div class="p-4 rounded-2xl border"
                     :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200/50'">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs font-medium" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                        Ubicación
                      </p>
                      <p class="font-semibold" :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                        {{ selectedVehicle.location }}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div class="p-4 rounded-2xl border"
                     :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200/50'">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 11l1.5-4.5h11L19 11m-1.5 5a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5m-11 0A1.5 1.5 0 0 1 5 14.5 1.5 1.5 0 0 1 6.5 13 1.5 1.5 0 0 1 8 14.5 1.5 1.5 0 0 1 6.5 16"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs font-medium" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                        Tipo
                      </p>
                      <p class="font-semibold capitalize" :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                        {{ selectedVehicle.type }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              
              <div class="p-6 rounded-2xl border space-y-6"
                   :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200/50'">
                <h3 class="text-xl font-bold text-center" :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                  Estado del vehículo
                </h3>
                
                <div class="space-y-5">
                  
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="font-semibold" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                        Combustible
                      </span>
                      <span class="text-2xl font-bold text-blue-600">{{ selectedVehicle.fuel }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div class="bg-blue-500 h-3 rounded-full transition-all duration-700" 
                           :style="{ width: selectedVehicle.fuel + '%' }"></div>
                    </div>
                  </div>
                  
                  
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="font-semibold" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                        Motor
                      </span>
                      <span class="text-2xl font-bold"
                            :class="selectedVehicle.engine > 75 ? 'text-green-600' : selectedVehicle.engine > 50 ? 'text-yellow-600' : 'text-red-600'">
                        {{ selectedVehicle.engine }}%
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div class="h-3 rounded-full transition-all duration-700" 
                           :class="selectedVehicle.engine > 75 ? 'bg-green-500' : selectedVehicle.engine > 50 ? 'bg-yellow-500' : 'bg-red-500'"
                           :style="{ width: selectedVehicle.engine + '%' }"></div>
                    </div>
                  </div>
                  
                  
                  <div class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="font-semibold" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                        Carrocería
                      </span>
                      <span class="text-2xl font-bold"
                            :class="selectedVehicle.body > 75 ? 'text-green-600' : selectedVehicle.body > 50 ? 'text-yellow-600' : 'text-red-600'">
                        {{ selectedVehicle.body }}%
                      </span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div class="h-3 rounded-full transition-all duration-700" 
                           :class="selectedVehicle.body > 75 ? 'bg-green-500' : selectedVehicle.body > 50 ? 'bg-yellow-500' : 'bg-red-500'"
                           :style="{ width: selectedVehicle.body + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              
              <div class="space-y-4">
                <button v-if="!selectedVehicle.impounded"
                        @click="requestVehicle(selectedVehicle)"
                        class="w-full py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold text-lg">
                  <div class="flex items-center justify-center space-x-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    <span>Pedir vehículo</span>
                  </div>
                </button>
                
                <button v-else
                        @click="payImpoundFee(selectedVehicle)"
                        class="w-full py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-bold text-lg">
                  <div class="flex items-center justify-center space-x-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    <span>Pagar multa</span>
                  </div>
                </button>
                
                <button @click="trackVehicle(selectedVehicle)"
                        class="w-full py-4 border-2 rounded-2xl transition-all font-bold text-lg"
                        :class="userSettings.darkMode 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'">
                  <div class="flex items-center justify-center space-x-2">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>Localizar en mapa</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        
        <div v-if="currentView === 'spawn'" class="h-full flex flex-col">
          <div class="p-4 space-y-6">
            <div class="text-center">
              <h2 class="text-2xl font-bold text-blue-600">Selecciona ubicación</h2>
              <p class="text-sm mt-2" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                Elige donde quieres que aparezca tu vehículo
              </p>
            </div>
            
            <div class="space-y-4">
              <div v-for="point in spawnPoints" 
                   :key="point.id"
                   @click="spawnVehicle(point)"
                   class="p-6 rounded-2xl border transition-all"
                   :class="point.available 
                     ? (userSettings.darkMode 
                       ? 'border-gray-700/50 hover:border-blue-500/50 bg-gray-800/60 hover:bg-gray-700/60 cursor-pointer' 
                       : 'border-gray-200/50 hover:border-blue-400/50 bg-white/80 hover:bg-blue-50/50 cursor-pointer') 
                     : (userSettings.darkMode
                       ? 'border-red-500/30 bg-red-900/20 cursor-not-allowed opacity-60'
                       : 'border-red-300/50 bg-red-50/50 cursor-not-allowed opacity-60')">
                
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                         :class="point.available 
                           ? 'bg-blue-600' 
                           : 'bg-gray-500'">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    
                    
                    <div>
                      <h3 class="text-lg font-bold" :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                        {{ point.name }}
                      </h3>
                      <div class="flex items-center space-x-1 text-sm" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7"></path>
                        </svg>
                        <span>X: {{ point.coords.x }}, Y: {{ point.coords.y }}</span>
                      </div>
                    </div>
                  </div>
                  
                  
                  <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-2">
                      <div class="w-3 h-3 rounded-full"
                           :class="point.available ? 'bg-green-500' : 'bg-red-500'"></div>
                      <span class="text-sm font-semibold"
                            :class="point.available ? 'text-green-600' : 'text-red-600'">
                        {{ point.available ? 'Disponible' : 'Ocupado' }}
                      </span>
                    </div>
                    
                    
                    <svg v-if="point.available" class="w-5 h-5" 
                         :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      
      <div v-if="isLoading" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="p-8 rounded-3xl border"
             :class="userSettings.darkMode ? 'bg-gray-900/90 border-gray-700/50' : 'bg-white/90 border-gray-200/50'">
          
          <div class="flex flex-col items-center space-y-6">
            
            <div class="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            
            
            <div class="text-center space-y-2">
              <p class="text-xl font-bold text-blue-600">Preparando vehículo...</p>
              <p class="text-sm" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                Esto puede tomar unos segundos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
                   
}