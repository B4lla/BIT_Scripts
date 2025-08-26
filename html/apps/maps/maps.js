const Maps = {
    name: 'maps',
    props: {
        t: {
            type: Function,
            default: () => (key) => key
        }
    },
    data() {
        return {
            
            mapScale: 1,
            mapOffsetX: 0,
            mapOffsetY: 0,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0,
            
            
            markers: [],
            
            
            showBottomPanel: false,
            selectedMarker: null,
            showAddMarker: false,
            currentView: 'players', 
            
            
            newMarker: {
                name: '',
                icon: '📍',
                x: 50,
                y: 50,
                description: ''
            },
            
            
            nearbyPlayers: [
                {
                    id: 1,
                    name: 'Player_001',
                    distance: '150m',
                    online: true
                },
                {
                    id: 2,
                    name: 'JohnDoe',
                    distance: '300m',
                    online: true
                },
                {
                    id: 3,
                    name: 'MikeSmith',
                    distance: '500m',
                    online: false
                }
            ],
            
            
            availableIcons: ['📍', '🏠', '🏢', '🏪', '🍔', '⛽', '🏥', '👮', '🚗', '💰', '🎯', '⭐', '❤️', '⚠️'],
            
            
            clickPosition: { x: 0, y: 0 }
        }
    },
    computed: {
        mapStyle() {
            return {
                transform: 'scale(' + this.mapScale + ') translate(' + this.mapOffsetX + 'px, ' + this.mapOffsetY + 'px)',
                transformOrigin: 'center center'
            };
        },
        
        visibleMarkers() {
            return this.markers.map(marker => ({
                ...marker,
                screenX: marker.x,
                screenY: marker.y
            }));
        }
    },
    mounted() {
    this.initializeMap();
    this.setupWheelZoom();
    
    window.addEventListener('message', this.handleNuiMessage.bind(this));
    
    this.loadMarkers();
    },
    methods: {
        
        loadMarkers() {
            fetch('https://bit-smartphone/maps:getMarkers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            }).catch(() => {});
        },
        
        handleNuiMessage(event) {
            const msg = event.data;
            if (!msg || !msg.action) return;
            if (msg.action === 'updateMarkers') {
                this.markers = msg.data || [];
            } else if (msg.action === 'receiveLocation') {
                const { sender, location } = msg.data;
                this.showNotification('Ubicación recibida de ' + sender, 'info');
                
                this.mapScale = 1;
                this.mapOffsetX = 0;
                this.mapOffsetY = 0;
                
                
            }
        },
        initializeMap() {
            
            this.mapScale = 1;
            this.mapOffsetX = 0;
            this.mapOffsetY = 0;
        },
        
        setupWheelZoom() {
            
            this.$nextTick(() => {
                const mapContainer = document.querySelector('.map-container');
                if (mapContainer) {
                    mapContainer.addEventListener('wheel', this.onWheel, { passive: false });
                }
            });
        },
        
        onWheel(event) {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(0.5, Math.min(3, this.mapScale + delta));
            this.mapScale = newScale;
        },
        
        
        startDrag(event) {
            if (event.target.classList.contains('marker')) return;
            
            this.isDragging = true;
            this.dragStartX = event.clientX - this.mapOffsetX;
            this.dragStartY = event.clientY - this.mapOffsetY;
            event.preventDefault();
        },
        
        onDrag(event) {
            if (!this.isDragging) return;
            
            const newOffsetX = event.clientX - this.dragStartX;
            const newOffsetY = event.clientY - this.dragStartY;
            
            
            const mapContainer = document.querySelector('.map-container');
            if (mapContainer) {
                const containerWidth = mapContainer.clientWidth;
                const containerHeight = mapContainer.clientHeight;
                const mapWidth = containerWidth * this.mapScale;
                const mapHeight = containerHeight * this.mapScale;
                
                const maxOffsetX = (mapWidth - containerWidth) / 2;
                const maxOffsetY = (mapHeight - containerHeight) / 2;
                
                this.mapOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX));
                this.mapOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY));
            } else {
                this.mapOffsetX = newOffsetX;
                this.mapOffsetY = newOffsetY;
            }
            
            event.preventDefault();
        },
        
        endDrag() {
            this.isDragging = false;
        },
        
        zoomIn() {
            const oldScale = this.mapScale;
            this.mapScale = Math.min(this.mapScale * 1.2, 3);
            this.adjustOffsetAfterZoom(oldScale);
        },
        
        zoomOut() {
            const oldScale = this.mapScale;
            this.mapScale = Math.max(this.mapScale / 1.2, 0.5);
            this.adjustOffsetAfterZoom(oldScale);
        },
        
        adjustOffsetAfterZoom(oldScale) {
            
            const mapContainer = document.querySelector('.map-container');
            if (mapContainer) {
                const containerWidth = mapContainer.clientWidth;
                const containerHeight = mapContainer.clientHeight;
                const mapWidth = containerWidth * this.mapScale;
                const mapHeight = containerHeight * this.mapScale;
                
                const maxOffsetX = Math.max(0, (mapWidth - containerWidth) / 2);
                const maxOffsetY = Math.max(0, (mapHeight - containerHeight) / 2);
                
                this.mapOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, this.mapOffsetX));
                this.mapOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, this.mapOffsetY));
            }
        },
        
        resetView() {
            this.mapScale = 1;
            this.mapOffsetX = 0;
            this.mapOffsetY = 0;
        },
        
        
        onMapClick(event) {
            if (this.isDragging) return;
            
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            
            this.clickPosition = { x, y };
            this.newMarker.x = x;
            this.newMarker.y = y;
            
            this.showAddMarkerDialog();
        },
        
        onMarkerClick(marker, event) {
            event.stopPropagation();
            this.selectedMarker = marker;
            this.currentView = 'marker-info';
            this.showBottomPanel = true;
        },
        
        addMarker() {
            if (!this.newMarker.name.trim()) {
                this.showNotification('El nombre del marcador es requerido', 'error');
                return;
            }
            
            const marker = {
                id: Date.now(),
                name: this.newMarker.name,
                icon: this.newMarker.icon,
                x: this.newMarker.x,
                y: this.newMarker.y,
                description: this.newMarker.description,
                type: 'custom'
            };
            
            
            fetch('https://bit-smartphone/maps:saveMarker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(marker)
            }).then(() => {
                this.resetNewMarker();
                this.showBottomPanel = false;
                this.showNotification('Marcador añadido correctamente', 'success');
            }).catch(() => {
                this.showNotification('Error al añadir marcador', 'error');
            });
        },
        
        deleteMarker(markerId) {
            
            fetch('https://bit-smartphone/maps:deleteMarker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: markerId })
            }).then(() => {
                this.showBottomPanel = false;
                this.showNotification('Marcador eliminado', 'success');
            }).catch(() => {
                this.showNotification('Error al eliminar marcador', 'error');
            });
        },
        
        resetNewMarker() {
            this.newMarker = {
                name: '',
                icon: '📍',
                x: 50,
                y: 50,
                description: ''
            };
        },
        
        
        showPlayersPanel() {
            this.currentView = 'players';
            this.showBottomPanel = true;
        },
        
        showAddMarkerDialog() {
            this.currentView = 'add-marker';
            this.showBottomPanel = true;
        },
        
        hideBottomPanel() {
            this.showBottomPanel = false;
            this.selectedMarker = null;
        },
        
        
        sendLocationToPlayer(player, marker = null) {
            const location = marker || {
                name: 'Ubicación actual',
                x: 50,
                y: 50
            };
            
            this.showNotification('Ubicación enviada a ' + player.name, 'success');
            
            
            
            fetch('https://bit-smartphone/maps:sendLocation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: player.id, location: location })
            }).catch(() => {});
        },
        
        
        showNotification(message, type = 'info') {
            if (window.postMessage) {
                window.postMessage({
                    type: 'notification',
                    data: {
                        title: 'Maps',
                        message: message,
                        type: type
                    }
                });
            }
        },
        
        
        getMarkerTypeColor(type) {
            const colors = {
                spawn: 'bg-gradient-to-br from-green-400 to-green-600',
                police: 'bg-gradient-to-br from-blue-400 to-blue-600',
                medical: 'bg-gradient-to-br from-red-400 to-red-600',
                custom: 'bg-gradient-to-br from-purple-400 to-purple-600',
                default: 'bg-gradient-to-br from-gray-400 to-gray-600'
            };
            return colors[type] || colors.default;
        }
    },
    template: `
        <div class="maps-app h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            
            <div class="absolute top-0 left-0 right-0 z-20 p-4 mt-10">
                <div class="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl">
                    <div class="flex items-center justify-between">
                        <h1 class="text-white font-bold text-xl tracking-wide">Maps</h1>
                        <div class="flex items-center space-x-3">
                            
                            <button @click="zoomOut" 
                                    class="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:scale-105">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                                </svg>
                            </button>
                            <div class="px-3 py-1 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                <span class="text-white text-sm font-medium">{{ Math.round(mapScale * 100) }}%</span>
                            </div>
                            <button @click="zoomIn" 
                                    class="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:scale-105">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </button>
                            <button @click="resetView" 
                                    class="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:scale-105">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            
            <div class="map-container absolute inset-0 overflow-hidden cursor-grab"
                 :class="{ 'cursor-grabbing': isDragging }"
                 @mousedown="startDrag"
                 @mousemove="onDrag"
                 @mouseup="endDrag"
                 @mouseleave="endDrag"
                 @click="onMapClick">
                
                <div class="w-full h-full relative" :style="mapStyle">
                    
                    <img src="./assets/backgrounds/map.png" 
                         alt="Game Map" 
                         class="w-full h-full object-contain select-none pointer-events-none min-w-full min-h-full"
                         draggable="false">
                    
                    
                    <div v-for="marker in visibleMarkers" 
                         :key="marker.id"
                         class="marker absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                         :style="{ left: marker.screenX + '%', top: marker.screenY + '%' }"
                         @click="onMarkerClick(marker, $event)">
                        
                        <div class="relative group">
                            
                            <div :class="['w-10 h-10 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/80 backdrop-blur-sm transform transition-all duration-200 hover:scale-110', getMarkerTypeColor(marker.type)]"
                                 class="relative">
                                <span class="text-white text-lg font-medium">{{ marker.icon }}</span>
                                
                                <div :class="['absolute inset-0 rounded-full animate-ping opacity-30', getMarkerTypeColor(marker.type)]"></div>
                            </div>
                            
                            
                            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-black/90 backdrop-blur-lg text-white text-xs rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none border border-white/20 shadow-xl">
                                <div class="font-semibold">{{ marker.name }}</div>
                                <div v-if="marker.description" class="text-gray-300 text-xs mt-1">{{ marker.description }}</div>
                                
                                <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/20 rotate-45"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
            <button @click="showPlayersPanel"
                    class="absolute bottom-8 right-6 z-20 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all duration-300 backdrop-blur-sm border border-white/20 hover:scale-105 hover:shadow-blue-500/30">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
            </button>

            
            <div class="absolute bottom-0 left-0 right-0 z-30 transform transition-all duration-500 ease-out"
                 :class="showBottomPanel ? 'translate-y-0' : 'translate-y-full'">
                
                <div class="bg-black/30 backdrop-blur-2xl rounded-t-3xl border-t border-white/20 max-h-[65vh] overflow-hidden shadow-2xl">
                    
                    <div class="flex justify-center py-3">
                        <div class="w-12 h-1.5 bg-white/40 rounded-full"></div>
                    </div>

                    
                    <div v-if="currentView === 'players'" class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-bold text-white">Jugadores Cercanos</h3>
                            <button @click="hideBottomPanel" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="space-y-4 max-h-48 overflow-y-auto">
                            <div v-for="player in nearbyPlayers" :key="player.id" 
                                 class="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-200">
                                <div class="flex items-center space-x-4">
                                    <div :class="['w-3 h-3 rounded-full', player.online ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400']"></div>
                                    <div>
                                        <h4 class="font-semibold text-white">{{ player.name }}</h4>
                                        <p class="text-sm text-gray-300">{{ player.distance }}</p>
                                    </div>
                                </div>
                                <button @click="sendLocationToPlayer(player)"
                                        :disabled="!player.online"
                                        :class="[
                                            'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                                            player.online 
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-105' 
                                                : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                        ]">
                                    Enviar Ubicación
                                </button>
                            </div>
                        </div>
                    </div>

                    
                    <div v-if="currentView === 'add-marker'" class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-bold text-white">Nuevo Marcador</h3>
                            <button @click="hideBottomPanel" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="space-y-5">
                            <div>
                                <label class="block text-sm font-semibold text-white mb-2">Nombre</label>
                                <input v-model="newMarker.name" 
                                       type="text" 
                                       placeholder="Ingresa el nombre del marcador"
                                       class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-white mb-2">Icono</label>
                                <div class="grid grid-cols-7 gap-3">
                                    <button v-for="icon in availableIcons" :key="icon"
                                            @click="newMarker.icon = icon"
                                            :class="[
                                                'w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-200 backdrop-blur-sm',
                                                newMarker.icon === icon 
                                                    ? 'border-blue-400 bg-blue-500/30 text-white shadow-lg shadow-blue-500/30 scale-110' 
                                                    : 'border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15 text-white hover:scale-105'
                                            ]">
                                        <span class="text-lg">{{ icon }}</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-white mb-2">Descripción (opcional)</label>
                                <input v-model="newMarker.description" 
                                       type="text" 
                                       placeholder="Descripción del marcador"
                                       class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200">
                            </div>

                            <div class="flex space-x-4 pt-2">
                                <button @click="addMarker" 
                                        class="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/30 hover:scale-105">
                                    Añadir Marcador
                                </button>
                                <button @click="hideBottomPanel" 
                                        class="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 border border-white/20">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>

                    
                    <div v-if="currentView === 'marker-info' && selectedMarker" class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center space-x-4">
                                <div :class="['w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/40', getMarkerTypeColor(selectedMarker.type)]">
                                    <span class="text-white text-xl">{{ selectedMarker.icon }}</span>
                                </div>
                                <div>
                                    <h3 class="text-xl font-bold text-white">{{ selectedMarker.name }}</h3>
                                    <p v-if="selectedMarker.description" class="text-gray-300 text-sm">{{ selectedMarker.description }}</p>
                                </div>
                            </div>
                            <button @click="hideBottomPanel" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div class="flex space-x-4">
                            <button @click="showPlayersPanel" 
                                    class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/30 hover:scale-105">
                                Enviar a Jugador
                            </button>
                            <button v-if="selectedMarker.type === 'custom'" 
                                    @click="deleteMarker(selectedMarker.id)" 
                                    class="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-red-500/30 hover:scale-105">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}
