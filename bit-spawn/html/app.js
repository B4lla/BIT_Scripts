Vue.createApp({
    data() {
        return {
            showMap: true,
            selectedLocation: null,
            locations: [],
            uiActive: false,
            buttonHold: {
                isHolding: false,
                progress: 0,
                timeNeeded: 2000, 
                interval: null
            },
            markerPulse: {
                scale: 'scale(1)',
                shadow: '0 0 0 0 rgba(16, 185, 129, 0.6)'
            },
            texts: {} 
        }
    },
    mounted() {
        window.addEventListener('message', (event) => {
            const d = event.data;
            if (d.action === 'open') {
                if (d.locations && Array.isArray(d.locations)) {
                    this.locations = d.locations.map(loc => {
                        return {
                            id: loc.id || `loc_${Math.random().toString(36).substr(2, 9)}`,
                            name: loc.name || 'Unknown',
                            description: loc.description || '',
                            x: Number(loc.x || 0),
                            y: Number(loc.y || 0),
                            z: Number(loc.z || 0),
                            icon: loc.icon || 'fa-map-marker'
                        };
                    });
                }

                this.texts = d.texts || {};
                this.uiActive = true;
                                this.$nextTick(() => {
                    const img = document.getElementById('mapImage');
                    if (img) {
                        img.onload = () => {
                            this.$forceUpdate();
                        };
                        setTimeout(() => {
                            this.$forceUpdate();
                        }, 500);
                    } 
                });
            } else if (d.action === 'close') {
                this.uiActive = false;
            }
        });

        window.addEventListener('resize', () => {
            this.$forceUpdate();
        });
        
        if (this.selectedLocation) {
            this.startPulseAnimation();
        }
    },
    methods: {
        selectLocation(location) {
            this.selectedLocation = location;

            fetch('https://bit-spawn/previewLocation', {
                method: 'POST',
                body: JSON.stringify({ locationId: location.id })
            });
        },
        toggleMap() {
            this.showMap = !this.showMap;
            // Forzar actualización de la UI después de cambiar la visibilidad
            this.$nextTick(() => {
                this.$forceUpdate();
            });
        },
        startHolding() {
            if (!this.selectedLocation) return;
            
            this.buttonHold.isHolding = true;
            this.buttonHold.progress = 0;
            
            const startTime = Date.now();
            
            this.buttonHold.interval = setInterval(() => {
                const elapsedTime = Date.now() - startTime;
                this.buttonHold.progress = (elapsedTime / this.buttonHold.timeNeeded) * 100;
                
                if (this.buttonHold.progress >= 100) {
                    this.confirmSpawn();
                    clearInterval(this.buttonHold.interval);
                }
            }, 10);
        },
        stopHolding() {
            this.buttonHold.isHolding = false;
            this.buttonHold.progress = 0;
            clearInterval(this.buttonHold.interval);
        },
        confirmSpawn() {
            fetch('https://bit-spawn/confirmSpawn', {
                method: 'POST',
                body: JSON.stringify({ locationId: this.selectedLocation.id })
            });
            this.uiActive = false;
        },
        startPulseAnimation() {
            let growing = true;
            setInterval(() => {
                if (growing) {
                    this.markerPulse.scale = 'scale(1.2)';
                    this.markerPulse.shadow = '0 0 15px rgba(16, 185, 129, 0.7)';
                } else {
                    this.markerPulse.scale = 'scale(1)';
                    this.markerPulse.shadow = '0 0 0 0 rgba(16, 185, 129, 0)';
                }
                growing = !growing;
            }, 1000);
        },
        getProgressBarStyle() {
            return {
                width: `${this.buttonHold.progress}%`
            };
        },
getMarkerStyle(location) {
    if (!location) return { display: 'none' };
     const loc = {
        x: Number(location.x),
        y: Number(location.y),
        name: location.name || 'desconocido'
    };
    
    if (isNaN(loc.x) || isNaN(loc.y)) return { display: 'none' };
    
    // Si el mapa está oculto, no renderizar los marcadores
    if (!this.showMap) return { display: 'none' };
    
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return { display: 'none' };

    const mapImage = document.getElementById('mapImage');
    if (!mapImage) return { display: 'none' };
    
    const containerRect = mapContainer.getBoundingClientRect();
    const imageRect = mapImage.getBoundingClientRect();
    
    // Si la imagen del mapa no tiene dimensiones, esperar a que cargue
    if (imageRect.width === 0 || imageRect.height === 0) {
        // Volver a calcular en el siguiente frame
        requestAnimationFrame(() => this.$forceUpdate());
        return { display: 'none' };
    }

    const MIN_X = -4000;
    const MAX_X = 8100; 
    const MIN_Y = -3750;
    const MAX_Y = 4500; 

    const normY = (loc.x - MIN_Y) / (MAX_Y - MIN_Y); 
    const normX = 1 - ((MAX_X - loc.y) / (MAX_X - MIN_X));
    
    const effectiveWidth = imageRect.width;
    const effectiveHeight = imageRect.height;

    const pixelX = normX * effectiveWidth;
    const pixelY = normY * effectiveHeight;
    
    const finalX = pixelX + imageRect.left - containerRect.left;
    const finalY = pixelY + imageRect.top - containerRect.top;
    
    return {
        left: `${finalX}px`,
        top: `${finalY}px`,
        zIndex: '100',
        display: this.showMap ? 'block' : 'none'
    };
}

    },
    template: `
        <div v-if="uiActive" class="flex h-screen w-screen overflow-hidden p-0 m-0">
            <div class="w-full h-full relative overflow-hidden bg-black/50 p-0 m-0">
                <div 
                  v-show="showMap" 
                  class="map-container absolute inset-0 w-full h-full p-0 m-0"
                  style="background-color: #26385f; padding: 0; margin: 0; overflow: visible;"
                >
                  <div class="map-image-container relative w-full h-full p-0 m-0 flex items-center justify-center">
                    <img 
                      id="mapImage"
                      ref="mapImage"
                      src="./assets/map.png" 
                      class="absolute top-0 left-0 w-[80%] h-auto object-contain mx-auto"
                      style="transform-origin: top left; margin: 0; padding: 0; left: 10%;"
                      @load="$forceUpdate()"
                    />
                  </div>

                  <div 
                    v-for="location in locations" 
                    :key="location.id"
                    @click="selectLocation(location)"
                    class="absolute w-4 h-4 sm:w-5 sm:h-5 z-50 cursor-pointer hover:scale-125 transition-all duration-300"
                    :style="[getMarkerStyle(location), {transform: 'translate(-50%, -50%) rotate(45deg)'}]"
                  >
                    <div class="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 border border-emerald-300"></div>
                    <div class="absolute inset-0 shadow-inner opacity-70"></div>

                    <div 
                      class="absolute inset-0 transition-all duration-300"
                      :class="{
                        'shadow-[0_0_8px_2px_rgba(16,185,129,0.7)]': selectedLocation && selectedLocation.id === location.id,
                        'shadow-[0_0_5px_1px_rgba(16,185,129,0.4)]': !(selectedLocation && selectedLocation.id === location.id)
                      }"
                    ></div>

                    <div class="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-white/30 to-transparent"></div>
                    <div class="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-black/20 to-transparent"></div>

                    <div class="relative w-full h-full flex items-center justify-center transform -rotate-45">
                      <i v-if="location.icon" :class="['fas', location.icon, 'text-white text-xs sm:text-xs drop-shadow-md']"></i>
                    </div>

                    <div 
                      v-if="selectedLocation && selectedLocation.id === location.id"
                      class="absolute -inset-1 border-2 border-white/50 animate-pulse"
                      style="transform: rotate(0deg);"
                    ></div>
                  </div>
                </div>


                <div class="relative w-full h-full z-10 flex flex-col">
                    <div class="pt-4 px-4 sm:pt-6 sm:px-8 md:pt-8">
                        <div class="flex justify-between items-center py-3 px-4 sm:px-6 bg-black/40 z-50">
                            <div class="flex items-center">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center mr-3">
                                    <i class="fas fa-map-marked-alt text-emerald-400 text-base sm:text-lg"></i>
                                </div>
                                <div>
                                    <span class="text-white font-medium tracking-wide text-base sm:text-lg uppercase">{{ texts.title }}</span>
                                    <div class="h-0.5 w-12 sm:w-16 bg-emerald-500/30 mt-1"></div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 sm:gap-4">
                                <button
                                    @click="toggleMap"
                                    class="h-8 w-8 sm:h-10 sm:w-10 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center cursor-pointer transition-all duration-300 hover:border-emerald-500 border border-transparent"
                                    :title="texts.toggleMapTooltip"
                                >
                                    <i :class="['fas', showMap ? 'fa-eye-slash' : 'fa-map']" :style="{ color: showMap ? '#ffffff' : '#10b981' }"></i>
                                </button>

                                <button
                                    @mousedown="startHolding"
                                    @mouseup="stopHolding"
                                    @mouseleave="stopHolding"
                                    @touchstart="startHolding"
                                    @touchend="stopHolding"
                                    :disabled="!selectedLocation"
                                    class="relative overflow-hidden h-8 sm:h-10 bg-emerald-600/80 hover:bg-emerald-500/90 text-white border-l-4 border-emerald-400 flex items-center justify-center cursor-pointer transition-all duration-300 disabled:bg-black/40 disabled:border-gray-600 disabled:cursor-not-allowed disabled:opacity-60 px-4 sm:px-6"
                                    :title="texts.holdTooltip"
                                >
                                    <span class="hidden sm:inline-block mr-2 text-sm uppercase tracking-wider font-medium">{{ selectedLocation ? texts.confirmButton : texts.selectButton }}</span>
                                    <i class="fas fa-check"></i>

                                    <div v-if="buttonHold.isHolding" 
                                        class="absolute bottom-0 left-0 h-0.5 bg-white/70" 
                                        :style="getProgressBarStyle()">
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col relative">
                        <div v-if="selectedLocation" class="absolute top-24 sm:top-28 right-4 sm:right-8 bg-black/20 border-l-4 border-emerald-500 p-3 sm:p-5 max-w-[90%] sm:max-w-[300px] z-30 shadow-2xl">
                            <div class="flex items-center mb-2">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mr-3 sm:mr-4">
                                    <i :class="['fas', selectedLocation.icon, 'text-emerald-400', 'text-base sm:text-lg']"></i>
                                </div>
                                <div>
                                    <h3 class="text-white font-semibold text-base sm:text-lg tracking-wide">{{ selectedLocation.name }}</h3>
                                    <div class="h-0.5 w-10 sm:w-12 bg-emerald-500/40 mt-1"></div>
                                </div>
                            </div>
                            <p class="text-gray-300 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">{{ selectedLocation.description }}</p>
                        </div>

                        <div class="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-auto">
                            <div class="flex justify-center items-center">
                                <div class="bg-black/40 px-2 py-1 sm:px-3 sm:py-1.5 inline-flex items-center space-x-1 sm:space-x-2 overflow-x-auto max-w-[95vw]">
                                    <div 
                                        v-for="location in locations" 
                                        :key="location.id"
                                        @click="selectLocation(location)"
                                        class="px-3 sm:px-5 py-2 sm:py-2.5 cursor-pointer transition-all duration-200 flex items-center gap-2 sm:gap-2.5 border-b-2 mx-0.5 sm:mx-1 whitespace-nowrap"
                                        :class="{
                                            'border-emerald-500': selectedLocation && selectedLocation.id === location.id,
                                            'border-transparent hover:border-emerald-500/30': !(selectedLocation && selectedLocation.id === location.id)
                                        }"
                                    >
                                        <div class="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center"
                                            :class="{'bg-emerald-500/20': selectedLocation && selectedLocation.id === location.id}">
                                            <i :class="['fas text-base sm:text-lg', location.icon, 
                                                selectedLocation && selectedLocation.id === location.id ? 'text-emerald-400' : 'text-gray-400']"></i>
                                        </div>
                                        <span :class="[selectedLocation && selectedLocation.id === location.id ? 'text-white' : 'text-gray-300']" 
                                            class="font-medium tracking-wide text-sm sm:text-base">{{ location.name }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
}).mount('#app');