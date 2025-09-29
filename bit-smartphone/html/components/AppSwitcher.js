const AppSwitcher = {
	name: "AppSwitcher",
	props: {
		openApps: {
			type: Array,
			default: () => [],
		},
		allApps: {
			type: Array,
			default: () => [],
		},
		visible: {
			type: Boolean,
			default: false,
		},
	},
	emits: ["close", "open-app", "close-app"],
	data() {
		return {
			currentIndex: 0,
			isDragging: false,
			startX: 0,
			currentX: 0,
			offsetX: 0,
			draggedAppId: null,
			isLocked: false,
			lockTimer: null,
			isMounted: false,
		};
	},
	mounted() {
		this.isMounted = true;
	},
	beforeUnmount() {
		this.clearLockTimer();
		this.isMounted = false;
	},
	computed: {
		openAppsWithData() {
			if (!Array.isArray(this.openApps) || !Array.isArray(this.allApps)) {
				return [];
			}

			return this.openApps
				.filter((openApp) => openApp && openApp.id)
				.map((openApp) => {
					const appData = this.allApps.find((app) => app && app.id === openApp.id);
					return {
						...openApp,
						...appData,
					};
				});
		},

		currentApp() {
			if (!this.openAppsWithData || this.openAppsWithData.length === 0) {
				return null;
			}
			if (this.currentIndex < 0 || this.currentIndex >= this.openAppsWithData.length) {
				return null;
			}
			return this.openAppsWithData[this.currentIndex];
		},

		currentAppDisplayName() {
			if (!this.openAppsWithData || this.openAppsWithData.length === 0) {
				return "";
			}
			if (this.currentIndex < 0 || this.currentIndex >= this.openAppsWithData.length) {
				return "";
			}
			const app = this.openAppsWithData[this.currentIndex];
			if (!app) return "";
			try {
				if (typeof app.name === "function") {
					return app.name() || "";
				}
				return app.name || "";
			} catch (error) {
				console.warn("[AppSwitcher] Error getting app name:", error);
				return "";
			}
		},

		appsTransform() {
			if (!this.openAppsWithData || this.openAppsWithData.length === 0) {
				return [];
			}

			return this.openAppsWithData.map((app, index) => {
				if (!app) {
					return {
						transform: "translateX(0px) scale(0) rotateY(0deg)",
						zIndex: 0,
						opacity: 0,
					};
				}

				const distance = index - this.currentIndex;
				let translateX, scale, rotateY, zIndex, opacity;

				if (index === this.currentIndex) {
					translateX = this.offsetX || 0;
					scale = 1;
					rotateY = (this.offsetX || 0) / 20;
					zIndex = 20;
					opacity = 1;
				} else {
					const direction = distance > 0 ? 1 : -1;
					translateX = direction * 55 + (this.offsetX || 0);
					scale = 0.8;
					rotateY = -direction * 45;
					zIndex = Math.max(0, 10 - Math.abs(distance));
					opacity = Math.abs(distance) < 3 ? 1 : 0;
				}

				return {
					transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
					zIndex,
					opacity,
				};
			});
		},

		t() {
			return (key, params = {}) => {
				if (window.phoneTranslations && window.phoneTranslations[key]) {
					return window.phoneTranslations[key];
				}
				const lang = (window.setupData && window.setupData.language) || "es";
				if (window.translations && window.translations[lang]) {
					const value = key.split(".").reduce((obj, k) => obj && obj[k], window.translations[lang]);
					if (typeof value === "string") {
						return Object.entries(params).reduce((str, [pKey, pValue]) => str.replace(new RegExp("\\{" + pKey + "\\}", "g"), pValue), value);
					}
					if (value) return value;
				}
				return key;
			};
		},
	},
	watch: {
		visible(newVal) {
			if (newVal && this.openAppsWithData.length > 0) {
				this.$nextTick(() => {
					this.currentIndex = Math.min(this.openAppsWithData.length - 1, Math.max(0, this.currentIndex));
					this.offsetX = 0;
					this.startLockTimer();
				});
			} else {
				this.clearLockTimer();
				this.isLocked = false;
			}
		},
		openAppsWithData(newApps) {
			if (newApps.length === 0) {
				this.currentIndex = 0;
			} else if (this.currentIndex >= newApps.length) {
				this.currentIndex = newApps.length - 1;
			}
		},
	},
	methods: {
		handleTouchStart(e) {
			if (!e.touches || !e.touches[0]) return;
			this.isDragging = true;
			this.startX = e.touches[0].clientX;
			this.currentX = e.touches[0].clientX;
		},

		handleTouchMove(e) {
			if (!this.isDragging || !e.touches || !e.touches[0]) return;

			this.currentX = e.touches[0].clientX;
			this.offsetX = this.currentX - this.startX;
		},

		handleTouchEnd() {
			if (!this.isDragging) return;

			const threshold = 80;

			if (this.offsetX > threshold && this.currentIndex > 0) {
				this.currentIndex--;
			} else if (this.offsetX < -threshold && this.currentIndex < this.openAppsWithData.length - 1) {
				this.currentIndex++;
			}

			this.isDragging = false;
			this.offsetX = 0;
			this.startX = 0;
			this.currentX = 0;
		},

		selectApp(index) {
			if (index >= 0 && index < this.openAppsWithData.length) {
				this.currentIndex = index;
			}
		},

		openCurrentApp() {
			const currentApp = this.openAppsWithData[this.currentIndex];
			if (currentApp && currentApp.id) {
				this.$emit("open-app", currentApp.id);
			}
		},

		closeCurrentApp() {
			const currentApp = this.openAppsWithData[this.currentIndex];
			if (currentApp && currentApp.id) {
				const closedAppId = currentApp.id;

				if (this.currentIndex >= this.openAppsWithData.length - 1 && this.currentIndex > 0) {
					this.currentIndex--;
				}

				this.$emit("close-app", closedAppId);
			}
		},

		closeAppSwitcher() {
			this.$emit("close");
		},

		startLockTimer() {
			if (!this.isMounted) return;
			this.clearLockTimer();
			this.lockTimer = setTimeout(() => {
				if (this.isMounted) {
					this.isLocked = true;
				}
			}, 1500);
		},

		clearLockTimer() {
			if (this.lockTimer) {
				clearTimeout(this.lockTimer);
				this.lockTimer = null;
			}
		},

		toggleLock() {
			if (!this.isMounted) return;
			if (this.isLocked) {
				this.isLocked = false;
				this.$emit("close");
			} else {
				this.startLockTimer();
			}
		},
	},
	template: `
    <div v-if="visible" 
	    class="app-switcher-ios absolute inset-0 z-[55] bg-black/60 backdrop-blur-lg transition-opacity duration-300"
	    :class="{ 'cursor-pointer': !isLocked }"
	    @click="!isLocked && closeAppSwitcher()">
      
      <div class="relative w-full h-full flex flex-col items-center justify-center overflow-hidden" 
           style="perspective: 1000px;" 
           @click.stop>
        
        
        <div v-if="openAppsWithData.length > 0" class="flex-1 flex flex-col items-center justify-center w-full">
            
            
		  <div class="flex items-center space-x-2 mb-4 h-8 transition-opacity duration-300" 
			  :class="isDragging ? 'opacity-0' : 'opacity-100'"
			  @mousedown.prevent="startLockTimer"
			  @mouseup="clearLockTimer"
			  @mouseleave="clearLockTimer"
			  @touchstart.prevent="startLockTimer"
			  @touchend.prevent="clearLockTimer">
							<div v-if="openAppsWithData[currentIndex] && openAppsWithData[currentIndex].id" 
							     class="app-icon-small w-6 h-6 rounded-lg flex items-center justify-center" 
							     :class="openAppsWithData[currentIndex].color || 'bg-gray-500'">
								<img :src="'./assets/icons/apps/' + openAppsWithData[currentIndex].id + '.svg'" 
								     :alt="currentAppDisplayName" 
								     class="w-4 h-4" 
								     @error="$event.target.style.display='none'" />
							</div>
							<span class="text-white font-semibold text-lg">{{ currentAppDisplayName }}</span>
            </div>

            
            <div class="app-stack-container relative w-full h-[450px]"
                 @touchstart="handleTouchStart"
                 @touchmove="handleTouchMove"
                 @touchend="handleTouchEnd">
              
              <div 
                v-for="(app, index) in openAppsWithData" 
                :key="app.id || 'app-' + index"
                v-if="app && appsTransform[index]"
                class="app-stack-card absolute w-64 h-[450px] top-0 left-0 right-0 mx-auto transform-gpu"
                :style="{
                  transform: appsTransform[index] ? appsTransform[index].transform : 'translateX(0px) scale(0) rotateY(0deg)',
                  zIndex: appsTransform[index] ? appsTransform[index].zIndex : 0,
                  opacity: appsTransform[index] ? appsTransform[index].opacity : 0,
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
                      <div class="w-20 h-20 rounded-3xl flex items-center justify-center" :class="app.color || 'bg-gray-500'">
                        <img :src="'./assets/icons/apps/' + app.id + '.svg'" 
                             :alt="(typeof app.name === 'function' ? app.name() : app.name) || 'App'" 
                             class="w-10 h-10" 
                             @error="$event.target.style.display='none'" />
                      </div>
                    </div>
                    <div v-else class="w-full h-full">
                      <img :src="app.preview" 
                           class="w-full h-full object-cover" 
                           @error="$event.target.style.display='none'" />
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
          <p class="text-xl font-semibold">{{ t('appSwitcher.noRecentApps') }}</p>
        </div>
        
        
        <div class="w-full h-28 flex-shrink-0 flex items-center justify-center space-x-6">
            <button 
                @click="$emit('close-app', 'all')"
                class="text-white/60 hover:text-white font-medium transition-colors text-sm"
              >
                {{ t('appSwitcher.closeAllApps') }}
              </button>
              
              <button 
                v-if="isLocked"
                @click="toggleLock"
                class="flex items-center space-x-2 text-white/60 hover:text-white font-medium transition-colors text-sm"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                </svg>
                <span>{{ t('appSwitcher.locked') }}</span>
              </button>
        </div>
      </div>
    </div>
  `,
};
