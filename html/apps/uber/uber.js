const UberApp = {
  data() {
    return {
      currentView: 'home', // 'home', 'booking', 'searching', 'found', 'trip', 'completed'
      
      currentTrip: null,
      assignedDriver: null,
      selectedVehicle: null,
      destination: null,
      estimateData: null,
      darkMode: false,
      isSearching: false,
      tripStarted: false,
      searchDots: '',
      searchAnimation: null,
      notifications: [],
      currentLocation: { lat: 37.7749, lng: -122.4194 },
      mapZoom: 14,
      mapScale: 1,
      mapOffsetX: 0,
      mapOffsetY: 0,
      isDragging: false,
      showMapPicker: false,
      clickPosition: { x: 0, y: 0 },
      savedLocations: [],
      recentPlaces: [],
      
      tipPercentages: [5, 10, 15, 20],
      customTip: 0
    };
  },
  
  computed: {
    darkMode() {
      return this.userSettings?.darkMode || false;
    },
    
    themeClasses() {
      return this.darkMode 
        ? 'bg-black text-white' 
        : 'bg-white text-black';
    },
    
    cardClasses() {
      return this.darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200';
    },
    
    vehicleTypes() {
      if (!this.estimateData) return [];
      
      return this.estimateData.vehicles.map(vehicle => ({
        ...vehicle,
        estimatedTime: this.estimateData.estimatedTime
      }));
    },

    allLocations() {
      const mapLocations = this.savedLocations.map(marker => ({
        name: marker.name,
        address: marker.description || 'Ubicación guardada',
        icon: marker.icon || '📍',
        coords: {
          x: (Number(marker.x) / 100) * 4000 - 2000,
          y: (Number(marker.y) / 100) * 8000 - 4000,
          z: 30.0
        },
        source: 'maps'
      }));
      
      return [
        ...this.recentPlaces.map(place => ({ ...place, source: 'recent' })),
        ...mapLocations
      ];
    },

    mapStyle() {
      return {
        transform: `scale(${this.mapScale}) translate(${this.mapOffsetX}px, ${this.mapOffsetY}px)`,
        transformOrigin: 'center center'
      };
    },

    isDarkMode() {
      return this.darkMode;
    }
  },
  
  methods: {
    loadSavedLocations() {
      fetch('https://bit-smartphone/maps:getMarkers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(() => {
        console.log('[Uber] Could not load saved locations from Maps');
      });
    },

    showMapPicker() {
  this.showMapPicker = true;
  this.mapScale = 1;
  this.mapOffsetX = 0;
  this.mapOffsetY = 0;
    },

    openMapPicker() {
      this.showMapPicker();
    },

    closeMapPicker() {
      this.showMapPicker = false;
    },

    onMapClick(event) {
      if (!this.showMapPicker) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const percentX = ((event.clientX - rect.left) / rect.width) * 100;
      const percentY = ((event.clientY - rect.top) / rect.height) * 100;

      const gameX = (percentX / 100) * 4000 - 2000;
      const gameY = (percentY / 100) * 8000 - 4000;

      this.clickPosition = { x: gameX, y: gameY };

      this.destination = {
        name: 'Ubicación personalizada',
        address: `Coords: ${gameX.toFixed(1)}, ${gameY.toFixed(1)}`,
        icon: '📍',
        coords: { x: gameX, y: gameY, z: 30.0 },
        source: 'map'
      };

      this.showMapPicker = false;
      this.showNotification('Ubicación seleccionada en el mapa', 'success');
    },

    setupMapControls() {
      this.$nextTick(() => {
        const mapContainer = this.$refs.mapContainer;
        if (mapContainer) {
          mapContainer.addEventListener('wheel', this.onMapWheel, { passive: false });
        }
      });
    },

    onMapWheel(event) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.mapScale = Math.max(0.5, Math.min(3, this.mapScale + delta));
    },

    makeNUIRequest(route, data = {}) {
      return fetch(`https://bit-smartphone/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(resp => resp.json());
    },
    
    handleTripUpdate(data) {
      if (data.status === 'found') {
        this.assignedDriver = data.driver;
        this.currentView = 'found';
      } else if (data.status === 'started') {
        this.currentView = 'trip';
      } else if (data.status === 'completed') {
        this.currentView = 'completed';
      } else if (data.status === 'cancelled') {
        this.resetToHome();
        this.showNotification('Viaje cancelado', 'error');
      }
    },
    
    handleDriverUpdate(data) {
      if (this.assignedDriver) {
        this.assignedDriver.estimatedArrival = data.estimatedArrival;
      }
    },
    
    setView(view) {
      this.currentView = view;
      
      if (view === 'searching') {
        this.startSearchAnimation();
      } else if (view === 'home') {
        this.resetToHome();
      }
    },
    
    selectVehicle(vehicle) {
      this.selectedVehicle = vehicle;
    },
    
    async setDestination(destination) {
      if (typeof destination === 'string') {
        this.destination = { 
          name: destination, 
          address: destination,
          icon: '📍',
          coords: { x: 0, y: 0, z: 0 }, // Default coords
          source: 'search'
        };
      } else {
        this.destination = destination;
      }
      
      if (this.destination) {
        await this.getEstimate();
      }
    },

    selectLocation(location) {
      this.setDestination(location);
    },

    handleDestinationInput(event) {
      const value = event.target.value;
      this.setDestination(value);
    },
    
    async getEstimate() {
      if (!this.destination) return;
      
      try {
        const result = await this.makeNUIRequest('bit-smartphone:uber:getEstimate', {
          destination: this.destination
        });
        
        if (result.success) {
          this.estimateData = result.estimate;
          this.setView('booking');
        } else {
          this.showNotification(result.message || 'Error al obtener estimación', 'error');
        }
      } catch (error) {
        console.error('Error getting estimate:', error);
        this.showNotification('Error de conexión', 'error');
      }
    },
    
    async requestRide() {
      if (!this.selectedVehicle || !this.destination) {
        this.showNotification('Selecciona un destino y tipo de vehículo', 'error');
        return;
      }
      
      this.setView('searching');
      
      try {
        const result = await this.makeNUIRequest('bit-smartphone:uber:requestRide', {
          vehicleType: this.selectedVehicle.id,
          destination: this.destination
        });
        
        if (result.success) {
          this.currentTrip = result.trip;
          this.showNotification('Buscando conductor...', 'info');
        } else {
          this.showNotification(result.message || 'Error al solicitar viaje', 'error');
          this.resetToHome();
        }
      } catch (error) {
        console.error('Error requesting ride:', error);
        this.showNotification('Error de conexión', 'error');
        this.resetToHome();
      }
    },
    
    startTrip() {
      if (this.currentTrip && this.assignedDriver) {
        this.setView('trip');
      }
    },
    
    async cancelRide() {
      if (!this.currentTrip) {
        this.resetToHome();
        return;
      }
      
      try {
        const result = await this.makeNUIRequest('bit-smartphone:uber:cancelRide', {
          tripId: this.currentTrip.id
        });
        
        if (result.success) {
          this.showNotification('Viaje cancelado', 'info');
        } else {
          this.showNotification(result.message || 'Error al cancelar viaje', 'error');
        }
      } catch (error) {
        console.error('Error cancelling ride:', error);
        this.showNotification('Error de conexión', 'error');
      }
      
      this.resetToHome();
    },
    
    resetToHome() {
      this.currentView = 'home';
      this.selectedVehicle = null;
      this.assignedDriver = null;
      this.currentTrip = null;
      this.destination = null;
      this.estimateData = null;
      this.isSearching = false;
      this.tripStarted = false;
      
      if (this.searchAnimation) {
        clearInterval(this.searchAnimation);
        this.searchAnimation = null;
      }
    },
    
    startSearchAnimation() {
      let dots = 0;
      this.searchAnimation = setInterval(() => {
        dots = (dots + 1) % 4;
        this.searchDots = '.'.repeat(dots);
      }, 500);
    },
    
    selectRecentPlace(place) {
      this.setDestination(place);
    },
    
    simulateLocationUpdate() {
      setInterval(() => {
        if (this.tripStarted) {
          this.mapZoom = 16 + Math.random() * 2;
        }
      }, 30000);
    },
    
    showNotification(message, type = 'info') {
      const notification = {
        id: Date.now(),
        message,
        type,
        timestamp: Date.now()
      };
      
      this.notifications.push(notification);
      
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
      }, 3000);
    },
    
    formatPrice(price) {
      return '$' + price.toFixed(2);
    },
    
    closeApp() {
      this.$emit('close');
    }
  },
  
  mounted() {
    this.simulateLocationUpdate();
    this.loadSavedLocations();
    this.setupMapControls();
    window.addEventListener('message', (event) => {
      const data = event.data;
      
      if (data.type === 'tripUpdate') {
        this.handleTripUpdate(data.data);
      } else if (data.type === 'driverUpdate') {
        this.handleDriverUpdate(data.data);
      } else if (data.action === 'updateMarkers') {
        this.savedLocations = data.data || [];
      }
    });
  },
  
  beforeUnmount() {
    if (this.searchAnimation) {
      clearInterval(this.searchAnimation);
    }
  },
  
  template: `
    <div :class="['uber-app h-full relative overflow-hidden transition-colors duration-300', themeClasses]">
      
      <!-- Home View -->
      <div v-if="currentView === 'home'" class="h-full flex flex-col">
        
        <!-- Header -->
        <div class="relative mt-10 p-6 pb-4">
          <div class="flex items-center justify-between mb-6">
            <button @click="closeApp" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <h1 class="text-2xl font-bold">Uber</h1>
            <button class="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </button>
          </div>
          
          <!-- Map placeholder -->
          <div :class="['relative rounded-2xl h-64 mb-6 overflow-hidden', darkMode ? 'bg-gray-800' : 'bg-blue-50']">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-6xl mb-2">🗺️</div>
                <p :class="['text-lg font-medium', darkMode ? 'text-gray-300' : 'text-gray-600']">
                  Ubicación actual
                </p>
              </div>
            </div>
            
            <!-- Current location pin -->
            <div class="absolute bottom-4 left-4 flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              <span :class="['text-sm font-medium', darkMode ? 'text-white' : 'text-black']">
                Tu ubicación
              </span>
            </div>
          </div>
          
          <!-- Destination input -->
          <div :class="['relative rounded-xl border-2 p-4 mb-4 transition-all duration-200', cardClasses]">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <input 
                :value="destination ? destination.name || destination.address || destination : ''"
                @input="handleDestinationInput"
                type="text" 
                placeholder="¿A dónde quieres ir?" 
                :class="['flex-1 bg-transparent outline-none text-lg placeholder-gray-400', darkMode ? 'text-white' : 'text-black']"
              />
            </div>
          </div>
        </div>
        
        <!-- Recent places and saved locations -->
        <div class="flex-1 px-6 pb-6 overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 :class="['text-lg font-bold', darkMode ? 'text-white' : 'text-black']">
              Ubicaciones
            </h3>
            <button 
              @click="showMapPicker()"
              :class="['px-3 py-1 rounded-lg text-sm font-medium transition-colors', 
                      'bg-blue-500 hover:bg-blue-600 text-white']"
            >
              🗺️ Seleccionar en mapa
            </button>
          </div>
          
          <div class="space-y-3">
            <div
              v-for="location in allLocations"
              :key="location.name + location.source"
              @click="selectLocation(location)"
              :class="['flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200', cardClasses, 'hover:scale-105 transform']"
            >
              <div class="text-2xl mr-4">{{ location.icon }}</div>
              
              <div class="flex-1">
                <h4 :class="['font-bold mb-1', darkMode ? 'text-white' : 'text-black']">
                  {{ location.name }}
                </h4>
                <p :class="['text-sm', darkMode ? 'text-gray-400' : 'text-gray-600']">
                  {{ location.address }}
                </p>
                <span :class="['text-xs px-2 py-1 rounded-full inline-block mt-1',
                              location.source === 'maps' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800']">
                  {{ location.source === 'maps' ? 'Maps guardada' : 'Lugar reciente' }}
                </span>
              </div>
              
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Booking View -->
      <div v-if="currentView === 'booking'" class="h-full flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-6 pb-4">
          <button @click="setView('home')" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 class="text-xl font-bold">Elige tu viaje</h2>
          <div class="w-10"></div>
        </div>
        
        <!-- Destination info -->
        <div class="px-6 pb-4">
          <div :class="['p-4 rounded-xl', cardClasses]">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              </svg>
              <div class="flex-1">
                <p class="text-sm text-gray-500 mb-1">Destino</p>
                <p :class="['font-medium', darkMode ? 'text-white' : 'text-black']">
                  {{ destination }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Vehicle options -->
        <div class="flex-1 px-6 pb-6 overflow-y-auto">
          <div class="space-y-4">
            <div
              v-for="vehicle in vehicleTypes"
              :key="vehicle.id"
              @click="selectVehicle(vehicle)"
              :class="[
                'flex items-center p-4 rounded-xl cursor-pointer transition-all duration-200 border-2',
                selectedVehicle?.id === vehicle.id 
                  ? 'border-black bg-gray-50 scale-105' + (darkMode ? ' border-white bg-gray-800' : '')
                  : 'border-transparent ' + cardClasses,
                'hover:scale-105 transform'
              ]"
            >
              <div class="text-3xl mr-4">{{ vehicle.icon }}</div>
              
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <h3 :class="['font-bold', darkMode ? 'text-white' : 'text-black']">
                    {{ vehicle.name }}
                  </h3>
                  <div class="flex items-center">
                    <svg class="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-sm text-gray-500">{{ vehicle.estimatedTime }}</span>
                  </div>
                </div>
                
                <p :class="['text-sm mb-2', darkMode ? 'text-gray-400' : 'text-gray-600']">
                  {{ vehicle.description }}
                </p>
                
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">{{ vehicle.capacity }}</span>
                  <span :class="['font-bold text-lg', darkMode ? 'text-white' : 'text-black']">
                    {{ formatPrice(vehicle.price) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Request button -->
        <div class="p-6 pt-4">
          <button
            @click="requestRide"
            :disabled="!selectedVehicle || !destination"
            :class="[
              'w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200 transform',
              selectedVehicle && destination
                ? 'bg-black hover:bg-gray-800 active:scale-95' + (darkMode ? ' bg-white text-black hover:bg-gray-200' : '')
                : 'bg-gray-300 cursor-not-allowed'
            ]"
          >
            {{ selectedVehicle && destination ? formatPrice(selectedVehicle.price) + ' • Solicitar ' + selectedVehicle.name : 'Selecciona destino y vehículo' }}
          </button>
        </div>
      </div>
      
      <!-- Searching View -->
      <div v-if="currentView === 'searching'" class="h-full flex flex-col items-center justify-center p-6">
        <div class="text-center mb-8">
          <div class="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6 mx-auto animate-pulse">
            <svg class="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          
          <h2 :class="['text-2xl font-bold mb-4', isDarkMode ? 'text-white' : 'text-black']">
            Buscando conductor{{ searchDots }}
          </h2>
          
          <p :class="['text-lg mb-2', isDarkMode ? 'text-gray-300' : 'text-gray-600']">
            {{ selectedVehicle?.name }}
          </p>
          
          <p :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500']">
            Tiempo estimado: {{ selectedVehicle?.estimatedTime }}
          </p>
        </div>
        
        <!-- Cancel button -->
        <button
          @click="cancelRide"
          :class="[
            'px-8 py-3 rounded-xl border-2 font-medium transition-colors',
            isDarkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          ]"
        >
          Cancelar solicitud
        </button>
      </div>
      
      <!-- Driver Found View -->
      <div v-if="currentView === 'found'" class="h-full flex flex-col">
        
        <!-- Map area -->
        <div :class="['flex-1 relative', isDarkMode ? 'bg-gray-800' : 'bg-blue-50']">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-8xl mb-4">🗺️</div>
              <p :class="['text-lg font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-600']">
                El conductor viene hacia ti
              </p>
            </div>
          </div>
        </div>
        
        <!-- Driver info -->
        <div :class="['p-6 rounded-t-3xl', cardClasses]">
          <div class="flex items-center mb-6">
            <div class="text-6xl mr-4">{{ assignedDriver?.photo }}</div>
            
            <div class="flex-1">
              <h3 :class="['text-xl font-bold', isDarkMode ? 'text-white' : 'text-black']">
                {{ assignedDriver?.name }} {{ assignedDriver?.surname }}
              </h3>
              
              <div class="flex items-center mb-2">
                <div class="flex items-center mr-4">
                  <svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span class="font-medium">{{ assignedDriver?.rating }}</span>
                </div>
                
                <div class="flex items-center">
                  <svg class="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span :class="['font-medium', isDarkMode ? 'text-white' : 'text-black']">
                    {{ assignedDriver?.estimatedArrival }} min
                  </span>
                </div>
              </div>
              
              <div class="flex items-center">
                <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                  {{ assignedDriver?.car }} • {{ assignedDriver?.plate }}
                </span>
              </div>
            </div>
            
            <div class="flex flex-col space-y-2">
              <button :class="[
                'p-3 rounded-full transition-colors',
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              ]">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </button>
              
              <button :class="[
                'p-3 rounded-full transition-colors',
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              ]">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Action buttons -->
          <div class="flex space-x-4">
            <button
              @click="cancelRide"
              :class="[
                'flex-1 py-3 rounded-xl border-2 font-medium transition-colors',
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              ]"
            >
              Cancelar
            </button>
            
            <button
              @click="startTrip"
              :class="[
                'flex-1 py-3 rounded-xl font-bold text-white transition-all duration-200 active:scale-95',
                isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black hover:bg-gray-800'
              ]"
            >
              Iniciar viaje
            </button>
          </div>
        </div>
      </div>
      
      <!-- Trip in Progress View -->
      <div v-if="currentView === 'trip'" class="h-full flex flex-col">
        
        <!-- Map area -->
        <div :class="['flex-1 relative', isDarkMode ? 'bg-gray-800' : 'bg-blue-50']">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-8xl mb-4 animate-bounce">🚗</div>
              <p :class="['text-lg font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-600']">
                En camino al destino...
              </p>
            </div>
          </div>
          
          <!-- Controls -->
          <div class="absolute top-6 right-6">
            <button :class="[
              'p-3 rounded-full mb-2 transition-colors',
              isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'
            ]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Trip info -->
        <div :class="['p-6 rounded-t-3xl', cardClasses]">
          <div class="text-center mb-6">
            <h2 :class="['text-xl font-bold mb-2', isDarkMode ? 'text-white' : 'text-black']">
              Viaje en progreso
            </h2>
            
            <div class="flex items-center justify-center space-x-4 mb-4">
              <div class="text-center">
                <p class="text-sm text-gray-500 mb-1">Tiempo estimado</p>
                <p :class="['font-bold', isDarkMode ? 'text-white' : 'text-black']">12 min</p>
              </div>
              
              <div class="w-px h-8 bg-gray-300"></div>
              
              <div class="text-center">
                <p class="text-sm text-gray-500 mb-1">Distancia</p>
                <p :class="['font-bold', isDarkMode ? 'text-white' : 'text-black']">3.2 km</p>
              </div>
            </div>
            
            <div :class="['w-full bg-gray-200 rounded-full h-2 mb-4', isDarkMode ? 'bg-gray-700' : '']">
              <div class="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full animate-pulse" style="width: 35%"></div>
            </div>
          </div>
          
          <!-- Driver info -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="text-3xl mr-3">{{ assignedDriver?.photo }}</div>
              <div>
                <p :class="['font-medium', isDarkMode ? 'text-white' : 'text-black']">
                  {{ assignedDriver?.name }}
                </p>
                <p class="text-sm text-gray-500">{{ assignedDriver?.car }}</p>
              </div>
            </div>
            
            <div class="flex space-x-2">
              <button :class="[
                'p-2 rounded-full transition-colors',
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              ]">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </button>
              
              <button :class="[
                'p-2 rounded-full transition-colors',
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              ]">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Trip Completed View -->
      <div v-if="currentView === 'completed'" class="h-full flex flex-col items-center justify-center p-6">
        <div class="text-center mb-8">
          <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          
          <h2 :class="['text-2xl font-bold mb-4', isDarkMode ? 'text-white' : 'text-black']">
            ¡Viaje completado!
          </h2>
          
          <p :class="['text-lg mb-6', isDarkMode ? 'text-gray-300' : 'text-gray-600']">
            Esperamos que hayas tenido un buen viaje
          </p>
          
          <!-- Trip summary -->
          <div :class="['rounded-xl p-6 mb-6 text-left', cardClasses]">
            <div class="flex items-center justify-between mb-4">
              <span :class="['font-medium', isDarkMode ? 'text-white' : 'text-black']">Total</span>
              <span :class="['text-xl font-bold', isDarkMode ? 'text-white' : 'text-black']">
                {{ formatPrice(selectedVehicle?.price || 0) }}
              </span>
            </div>
            
            <div class="flex items-center justify-between mb-4">
              <span class="text-gray-500">Vehículo</span>
              <span :class="[isDarkMode ? 'text-white' : 'text-black']">{{ selectedVehicle?.name }}</span>
            </div>
            
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Conductor</span>
              <span :class="[isDarkMode ? 'text-white' : 'text-black']">{{ assignedDriver?.name }}</span>
            </div>
          </div>
          
          <!-- Rating -->
          <div class="mb-6">
            <p :class="['mb-3 font-medium', isDarkMode ? 'text-white' : 'text-black']">
              ¿Cómo estuvo tu viaje?
            </p>
            
            <div class="flex justify-center space-x-2">
              <button
                v-for="star in 5"
                :key="star"
                class="p-1 hover:scale-110 transition-transform"
              >
                <svg class="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Action buttons -->
        <div class="w-full space-y-4">
          <button
            @click="resetToHome"
            :class="[
              'w-full py-3 rounded-xl font-bold text-white transition-all duration-200 active:scale-95',
              isDarkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black hover:bg-gray-800'
            ]"
          >
            Solicitar otro viaje
          </button>
          
          <button
            @click="setView('home')"
            :class="[
              'w-full py-3 rounded-xl border-2 font-medium transition-colors',
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            ]"
          >
            Volver al inicio
          </button>
        </div>
      </div>
      
      <!-- Notifications -->
      <div class="absolute top-4 right-4 z-50 space-y-2">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'px-4 py-3 rounded-xl backdrop-blur-lg border max-w-sm transform transition-all duration-300',
            notification.type === 'success' 
              ? 'bg-green-900/80 border-green-500/50 text-green-300'
              : notification.type === 'error'
              ? 'bg-red-900/80 border-red-500/50 text-red-300'
              : (isDarkMode ? 'bg-gray-800/90 border-gray-600/50 text-white' : 'bg-white/90 border-gray-200/50 text-black')
          ]"
        >
          <p class="text-sm font-medium">{{ notification.message }}</p>
        </div>
      </div>

      <!-- Map Picker Modal -->
      <div v-if="showMapPicker" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="closeMapPicker()"></div>
        
        <div :class="['relative w-full max-w-lg mx-auto rounded-2xl overflow-hidden', cardClasses]">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 :class="['text-lg font-bold', darkMode ? 'text-white' : 'text-black']">
              Seleccionar ubicación
            </h3>
            <button 
              @click="closeMapPicker()"
              :class="['p-2 rounded-lg transition-colors', 
                      darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600']"
            >
              ✕
            </button>
          </div>
          
          <!-- Map Container -->
          <div class="relative w-full h-80 overflow-hidden">
            <div 
              ref="mapContainer"
              class="absolute inset-0 cursor-crosshair"
              @click="onMapClick"
            >
              <!-- GTA Map Background -->
              <div 
                class="w-full h-full bg-gradient-to-br from-green-800 via-yellow-600 to-blue-800 relative"
                :style="mapStyle"
              >
                <!-- Grid overlay to simulate map -->
                <div class="absolute inset-0 opacity-20">
                  <div class="w-full h-full" style="background-image: 
                    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: 20px 20px;">
                  </div>
                </div>
                
                <!-- Fake landmarks -->
                <div class="absolute top-1/4 left-1/3 w-2 h-2 bg-red-500 rounded-full"></div>
                <div class="absolute top-2/3 right-1/4 w-2 h-2 bg-blue-500 rounded-full"></div>
                <div class="absolute bottom-1/4 left-1/2 w-2 h-2 bg-yellow-500 rounded-full"></div>
              </div>
              
              <!-- Click indicator -->
              <div 
                v-if="clickPosition.x && clickPosition.y"
                class="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                :style="{ 
                  left: '50%', 
                  top: '50%'
                }"
              ></div>
            </div>
          </div>
          
          <!-- Instructions -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <p :class="['text-sm text-center', darkMode ? 'text-gray-400' : 'text-gray-600']">
              Haz clic en el mapa para seleccionar una ubicación
            </p>
            <p :class="['text-xs text-center mt-1', darkMode ? 'text-gray-500' : 'text-gray-500']">
              Usa la rueda del ratón para hacer zoom
            </p>
          </div>
        </div>
      </div>
    </div>
  `
};

if (typeof window !== 'undefined') {
  window.Uber = UberApp;
}
