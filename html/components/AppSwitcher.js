const AppSwitcher = {
  name: 'AppSwitcher',
  props: {
    openApps: {
      type: Array,
      default: () => []
    },
    allApps: {
      type: Array,
      default: () => []
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'open-app', 'close-app'],
  data() {
    return {
      currentIndex: 0,
      isDragging: false,
      startX: 0,
      currentX: 0,
      offsetX: 0,
      draggedAppId: null
    };
  },
  computed: {
    openAppsWithData() {
      return this.openApps.map(openApp => {
        const appData = this.allApps.find(app => app.id === openApp.id);
        return {
          ...openApp,
          ...appData
        };
      });
    },
    
    
    appsTransform() {
      return this.openAppsWithData.map((app, index) => {
        const distance = index - this.currentIndex;
        
        let translateX, scale, rotateY, zIndex, opacity;
        
        if (index === this.currentIndex) {
          translateX = this.offsetX;
          scale = 1;
          rotateY = this.offsetX / 20; 
          zIndex = 20;
          opacity = 1;
        } else {
          
          const direction = distance > 0 ? 1 : -1;
          translateX = direction * 55 + this.offsetX;
          scale = 0.8;
          rotateY = -direction * 45;
          zIndex = 10 - Math.abs(distance);
          opacity = Math.abs(distance) < 3 ? 1 : 0;
        }
        
        return {
          transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
          zIndex,
          opacity
        };
      });
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.openAppsWithData.length > 0) {
        this.currentIndex = this.openApps.length -1;
        this.offsetX = 0;
      }
    }
  },
  methods: {
    handleTouchStart(e) {
      this.isDragging = true;
      this.startX = e.touches[0].clientX;
      this.currentX = e.touches[0].clientX;
    },
    
    handleTouchMove(e) {
      if (!this.isDragging) return;
      
      this.currentX = e.touches[0].clientX;
      this.offsetX = this.currentX - this.startX;
    },
    
    handleTouchEnd() {
      if (!this.isDragging) return;
      
      const threshold = 80; 
      
      if (this.offsetX > threshold && this.currentIndex > 0) {
        
        this.currentIndex
      } else if (this.offsetX < -threshold && this.currentIndex < this.openAppsWithData.length - 1) {
        
        this.currentIndex++;
      }
      
      this.isDragging = false;
      this.offsetX = 0;
      this.startX = 0;
      this.currentX = 0;
    },
    
    selectApp(index) {
      this.currentIndex = index;
    },
    
    openCurrentApp() {
      if (this.openAppsWithData[this.currentIndex]) {
        this.$emit('open-app', this.openAppsWithData[this.currentIndex].id);
      }
    },
    
    closeCurrentApp() {
      if (this.openAppsWithData[this.currentIndex]) {
        const closedAppId = this.openAppsWithData[this.currentIndex].id;
        
        
        if (this.currentIndex >= this.openAppsWithData.length - 1 && this.currentIndex > 0) {
           this.currentIndex--;
        }

        this.$emit('close-app', closedAppId);
      }
    },
    
    closeAppSwitcher() {
      this.$emit('close');
    }
  },
  template: `
    <div v-if="visible" 
         class="app-switcher-ios absolute inset-0 z-[55] bg-black/60 backdrop-blur-lg transition-opacity duration-300"
         @click="closeAppSwitcher">
      
      <div class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden" 
           style="perspective: 1000px;" 
           @click.stop>
        
        
        <div v-if="openAppsWithData.length > 0" class="flex-1 flex flex-col items-center justify-center w-full">
            
            
            <div class="flex items-center space-x-2 mb-4 h-8 transition-opacity duration-300" 
                 :class="isDragging ? 'opacity-0' : 'opacity-100'">
              <div v-if="openAppsWithData[currentIndex]" class="app-icon-small w-6 h-6 rounded-lg flex items-center justify-center" :class="openAppsWithData[currentIndex].color">
                <img :src="'./assets/icons/apps/' + openAppsWithData[currentIndex].id + '.svg'" :alt="openAppsWithData[currentIndex].name" class="w-4 h-4" />
              </div>
              <span class="text-white font-semibold text-lg">{{ openAppsWithData[currentIndex]?.name }}</span>
            </div>

            
            <div class="app-stack-container relative w-full h-[450px]"
                 @touchstart="handleTouchStart"
                 @touchmove="handleTouchMove"
                 @touchend="handleTouchEnd">
              
              <div 
                v-for="(app, index) in openAppsWithData" 
                :key="app.id"
                class="app-stack-card absolute w-64 h-[450px] top-0 left-0 right-0 mx-auto transform-gpu"
                :style="{
                  transform: appsTransform[index].transform,
                  zIndex: appsTransform[index].zIndex,
                  opacity: appsTransform[index].opacity,
                  transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }"
                @click="index === currentIndex ? openCurrentApp() : selectApp(index)"
              >
                
                <div class="w-full h-full bg-gray-800 rounded-[40px] overflow-hidden shadow-2xl border-2 border-white/10 relative">
                  
                  
                  <button v-if="index === currentIndex" @click.stop="closeCurrentApp"
                          class="absolute top-3 left-3 w-7 h-7 bg-gray-600/80 rounded-full flex items-center justify-center z-30
                                 hover:bg-gray-500/80 transition-all scale-100 hover:scale-110 active:scale-95 backdrop-blur-sm">
                     <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"></path></svg>
                  </button>

                  
                  <div class="app-preview-area w-full h-full">
                    <div v-if="!app.preview" class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                      <div class="w-20 h-20 rounded-3xl flex items-center justify-center" :class="app.color">
                        <img :src="'./assets/icons/apps/' + app.id + '.svg'" :alt="app.name" class="w-10 h-10" />
                      </div>
                    </div>
                    <div v-else class="w-full h-full">
                      <img :src="app.preview" class="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
        
        
        <div v-else class="text-center text-white py-20" @click.stop>
          <div class="w-24 h-24 rounded-3xl bg-white/10 mx-auto mb-6 flex items-center justify-center border border-white/20">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="4" ry="4" stroke-width="1.5"/>
            </svg>
          </div>
          <p class="text-xl font-semibold">No hay apps recientes</p>
        </div>
        
        
        <div class="w-full h-28 flex-shrink-0 flex items-center justify-center">
            <button 
                @click="$emit('close-app', 'all')"
                class="text-white/60 hover:text-white font-medium transition-colors text-sm"
              >
                Cerrar todas las aplicaciones
              </button>
        </div>
      </div>
    </div>
  `
};