const Folder = {
	name: "Folder",
	props: {
		folder: {
			type: Object,
			required: true,
		},
		allApps: {
			type: Array,
			required: true,
		},
		position: {
			type: Object,
			required: true,
		},
		t: {
			type: Function,
			required: true,
		},
		isOpen: {
			type: Boolean,
			default: false,
		},
	},
	emits: ["open-app", "update-folder", "close-folder", "request-open"],
	data() {
		return {
			isEditingName: false,
			editingName: "",
			openAnimation: false,
			folderPosition: { x: 0, y: 0 },
			draggedApp: null,
			dragStartPos: { x: 0, y: 0 },
			isDragging: false,
			showDeleteButtons: false,
			deleteButtonTimeout: null,
		};
	},
	computed: {
		folderApps() {
			return this.folder.apps.map((appId) => this.allApps.find((app) => app.id === appId)).filter(Boolean);
		},

		previewApps() {
			return this.folderApps.slice(0, 9);
		},

		folderName() {
			return this.folder.name || this.t("home.folder");
		},

		animationStyle() {
			if (!this.openAnimation) return {};

			const gridCellSize = 80;
			const gridPadding = 24;
			const originX = gridPadding + this.position.col * gridCellSize + 32;
			const originY = 100 + this.position.row * gridCellSize + 32;

			return {
				"--origin-x": `${originX}px`,
				"--origin-y": `${originY}px`,
			};
		},
	},
	watch: {
		isOpen(newVal) {
			if (newVal) {
				this.openAnimation = true;
				this.$nextTick(() => {
					const rect = this.$refs.folderIcon?.getBoundingClientRect();
					if (rect) {
						this.folderPosition = {
							x: rect.left + rect.width / 2,
							y: rect.top + rect.height / 2,
						};
					}
				});
			} else {
				this.openAnimation = false;
				this.isEditingName = false;
				this.showDeleteButtons = false;
				if (this.deleteButtonTimeout) {
					clearTimeout(this.deleteButtonTimeout);
					this.deleteButtonTimeout = null;
				}
			}
		},
	},
	methods: {
		requestOpen() {
			this.$emit("request-open");
		},

		closeFolder() {
			this.$emit("close-folder");
		},

		openApp(app) {
			if (this.isDragging || this.showDeleteButtons) return;
			this.$emit("open-app", app);
			this.closeFolder();
		},

		startEditName() {
			this.isEditingName = true;
			this.editingName = this.folderName;
			this.$nextTick(() => {
				this.$refs.nameInput?.focus();
				this.$refs.nameInput?.select();
			});
		},

		handleNameBlur() {
			const newName = this.editingName.trim();
			if (newName && newName !== this.folderName) {
				this.$emit("update-folder", { ...this.folder, name: newName });
			} else if (!newName) {
				this.editingName = this.folderName;
			}
			this.isEditingName = false;
		},

		handleNameEnter() {
			const newName = this.editingName.trim();
			if (newName && newName !== this.folderName) {
				this.$emit("update-folder", { ...this.folder, name: newName });
			} else if (!newName) {
				this.editingName = this.folderName;
			}
			this.isEditingName = false;
		},

		startDrag(event, app) {
			if (this.showDeleteButtons) return;
			this.draggedApp = app;
			this.isDragging = true;
			const rect = event.currentTarget.getBoundingClientRect();
			this.dragStartPos = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
			};
			event.currentTarget.style.opacity = "0.7";
			event.currentTarget.style.transform = "scale(1.1)";
			event.currentTarget.style.zIndex = "999";
		},

		onDragOver(event) {
			event.preventDefault();
			event.dataTransfer.dropEffect = "move";
		},

		onDrop(event, targetApp) {
			event.preventDefault();
			if (this.draggedApp && targetApp && this.draggedApp.id !== targetApp.id) {
				const currentApps = [...this.folder.apps];
				const draggedIndex = currentApps.indexOf(this.draggedApp.id);
				const targetIndex = currentApps.indexOf(targetApp.id);

				if (draggedIndex !== -1 && targetIndex !== -1) {
					currentApps.splice(draggedIndex, 1);
					currentApps.splice(targetIndex, 0, this.draggedApp.id);
					this.$emit("update-folder", { ...this.folder, apps: currentApps });
				}
			}
			this.endDrag();
		},

		endDrag() {
			if (this.draggedApp) {
				const draggedElement = this.$el.querySelector(`[data-app-id="${this.draggedApp.id}"]`);
				if (draggedElement) {
					draggedElement.style.opacity = "";
					draggedElement.style.transform = "";
					draggedElement.style.zIndex = "";
				}
			}
			this.draggedApp = null;
			this.isDragging = false;
		},

		removeAppFromFolder(app) {
			const updatedApps = this.folder.apps.filter((appId) => appId !== app.id);
			this.$emit("update-folder", { ...this.folder, apps: updatedApps });
			if (updatedApps.length <= 1) {
				this.closeFolder();
			}
		},

		toggleEditMode() {
			this.showDeleteButtons = !this.showDeleteButtons;
			if (this.showDeleteButtons) {
				this.deleteButtonTimeout = setTimeout(() => {
					this.showDeleteButtons = false;
				}, 5000);
			} else if (this.deleteButtonTimeout) {
				clearTimeout(this.deleteButtonTimeout);
				this.deleteButtonTimeout = null;
			}
		},

		onLongPress(app) {
			if (this.isDragging) return;
			if (navigator.vibrate) {
				navigator.vibrate(50);
			}
			this.toggleEditMode();
		},
	},

	template: `
    <div class="folder-container">
      <div 
        v-if="!isOpen"
        ref="folderIcon"
        @click.stop="requestOpen" 
        class="folder-closed cursor-pointer flex flex-col items-center gap-2 transition-transform duration-200 active:scale-95"
      >
        <div class="relative w-16 h-16 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-200 hover:scale-105 bg-white/10 backdrop-blur-2xl border border-white/20">
          <div class="absolute inset-1.5 grid grid-cols-3 gap-0.5">
            <div 
              v-for="(app, index) in previewApps" 
              :key="app?.id || index"
              class="folder-preview-app rounded-sm overflow-hidden flex items-center justify-center transition-all duration-200"
              :style="{ '--index': index }"
            >
              <img 
                v-if="app"
                :src="'./assets/icons/apps/' + app.id + '.svg'" 
                :alt="(typeof app.name === 'function' ? app.name() : app.name)" 
                class="w-3 h-3 object-contain filter drop-shadow-sm"
                draggable="false"
              />
            </div>
            <div v-for="i in Math.max(0, 9 - previewApps.length)" :key="'empty-' + i"
                 class="folder-preview-app rounded-sm bg-white/8">
            </div>
          </div>
          <div class="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-2xl"></div>
        </div>
        <span class="text-white text-xs font-medium text-center w-20 leading-tight drop-shadow-sm" 
              :class="folderName.length > 12 ? 'text-[10px]' : 'text-xs'"
              style="word-wrap: break-word; hyphens: auto;">
          {{ folderName }}
        </span>
      </div>

      <transition name="folder-open">
        <div 
          v-if="isOpen" 
          @click.self="closeFolder" 
          class="folder-open-container fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
          :style="animationStyle"
        >
          <div class="folder-content pointer-events-auto bg-white/15 backdrop-blur-2xl rounded-3xl max-w-sm w-full mx-4 shadow-2xl border border-white/30 transition-all duration-300 max-h-[80vh] overflow-hidden"
               @click.stop>
            
            <div class="folder-header p-6 pb-4 text-center">
              <div v-if="!isEditingName" class="cursor-pointer" @click="startEditName">
                <h3 class="text-white text-xl font-semibold mb-1 px-2 leading-tight break-words">{{ folderName }}</h3>
              </div>
              <div v-else>
                <input
                  ref="nameInput"
                  v-model="editingName"
                  @blur="handleNameBlur"
                  @keyup.enter="handleNameEnter"
                  @keyup.escape="handleNameBlur"
                  class="bg-white/10 text-white text-xl font-semibold text-center px-3 py-2 rounded-xl border border-white/30 focus:border-blue-400 focus:outline-none w-full backdrop-blur-sm"
                  maxlength="30"
                  placeholder="Nombre de carpeta"
                />
              </div>
            </div>
            
            <div class="folder-apps-container p-6 relative">
              <div class="folder-apps-grid grid grid-cols-3 gap-4 max-h-96 overflow-y-auto -mx-2 px-2 scrollbar-hide">
                <div
                  v-for="(app, index) in folderApps"
                  :key="app.id"
                  :data-app-id="app.id"
                  @click="openApp(app)"
                  @dragstart="startDrag($event, app)"
                  @dragover="onDragOver"
                  @drop="onDrop($event, app)"
                  @dragend="endDrag"
                  @contextmenu.prevent="onLongPress(app)"
                  draggable="true"
                  class="folder-app-item relative flex flex-col items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-white/10 active:scale-95 border border-transparent hover:border-white/20"
                  :style="{ '--index': index }"
                >
                  <div class="relative">
                    <div class="w-16 h-16 rounded-2xl overflow-hidden shadow-lg bg-white/5 border border-white/10">
                      <img 
                        :src="'./assets/icons/apps/' + app.id + '.svg'" 
                        :alt="(typeof app.name === 'function' ? app.name() : app.name)" 
                        class="w-full h-full object-contain p-2"
                        draggable="false"
                      />
                    </div>
                    <transition name="delete-button">
                      <button
                        v-if="showDeleteButtons && folderApps.length > 1"
                        @click.stop="removeAppFromFolder(app)"
                        class="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:bg-red-600 transition-colors z-20"
                      >
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </transition>
                  </div>
                  <span class="text-white text-sm font-medium text-center w-full leading-tight break-words">
                    {{ typeof app.name === 'function' ? app.name() : app.name }}
                  </span>
                </div>
              </div>
              <transition name="fade">
                <button 
                  v-if="showDeleteButtons"
                  @click="toggleEditMode"
                  class="absolute -bottom-16 left-1/2 transform -translate-x-1/2 px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-medium rounded-full hover:bg-white/30 transition-all duration-200 text-base border border-white/30 shadow-lg"
                >
                  {{ t('common.done') }}
                </button>
              </transition>
            </div>
          </div>
        </div>
      </transition>
    </div>
  `,
};
window.Folder = Folder;
