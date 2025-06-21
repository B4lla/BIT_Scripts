const app = Vue.createApp({
  template: `
    <div class="fixed inset-0 pointer-events-none">
        <transition name="menu">
            <div v-if="isMenuOpen" class="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 pointer-events-auto">
                <div class="w-[345px] max-h-[85vh] overflow-hidden">
                    <transition name="submenu" mode="out-in">
                        <div v-if="!selectedPlayer" key="players">
                            <div class="glass-card overflow-hidden">
                                <div class="unified-header p-6 pb-4">
                                    <h2 class="text-white text-xl font-bold flex items-center">
                                        <i class="fas fa-users mr-3 text-purple-400"></i>
                                        {{ translations.nearbyPlayersTitle || 'Nearby Players' }}
                                        <span class="ml-auto counter-badge text-xs px-3 py-1 rounded-full text-white font-medium">
                                            {{ nearbyPlayers.length }}
                                        </span>
                                    </h2>
                                </div>
                                <div class="p-6 pt-5">
                                    <div class="space-y-3 max-h-64 overflow-y-auto scroll-area">
                                        <div 
                                            v-for="player in nearbyPlayers" 
                                            :key="player.id"
                                            @click="selectPlayer(player)"
                                            class="player-card p-4 cursor-pointer"
                                        >
                                            <div class="flex items-center space-x-4">
                                                <div class="relative">
                                                    <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center glow-ring">
                                                        <i class="fas fa-user text-white"></i>
                                                    </div>
                                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full pulse-dot border-2 border-gray-800"></div>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <h3 class="text-white font-semibold truncate">{{ player.name }}</h3>
                                                    <p class="text-gray-400 text-sm">ID: {{ player.id }}</p>
                                                </div>
                                                <div class="text-right flex-shrink-0">
                                                    <p class="text-purple-300 text-sm font-bold">{{ player.distance }}m</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>                                </div>
                            </div>
                        </div>
                        <div v-else key="actions">
                            <div class="glass-card overflow-hidden">
                                <div class="unified-header p-6 pb-0">
                                    <div class="flex items-center space-x-4 mb-4">
                                        <i @click="goBack" class="fas fa-arrow-left cursor-pointer back-btn text-gray-300 hover:text-purple-400 text-lg"></i>
                                        <div class="relative">
                                            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center glow-ring">
                                                <i class="fas fa-user text-white"></i>
                                            </div>
                                            <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full pulse-dot flex items-center justify-center">
                                                <i class="fas fa-check text-xs text-white"></i>
                                            </div>
                                        </div>                                        <div class="flex-1 min-w-0">
                                            <h3 class="text-white font-bold text-lg truncate">{{ selectedPlayer?.name || 'Unknown Player' }}</h3>
                                            <p class="text-gray-300 text-sm">• ID: {{ selectedPlayer?.id || 'N/A' }}</p>
                                            <p class="text-green-400 text-sm font-medium">{{ selectedPlayer?.distance || '0' }}m away</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-6 pt-5">
                                    <div class="max-h-[32rem] overflow-y-auto overflow-x-hidden scroll-area">
                                        <div class="grid grid-cols-2 gap-4">
                                            <button 
                                                v-for="action in availableActions" 
                                                :key="action.id"
                                                @click="executeAction(action)"
                                                class="action-btn p-5 text-white text-center relative"
                                                :class="{ 'opacity-40 cursor-not-allowed': !action.available }"
                                                :disabled="!action.available"
                                            >
                                                <i :class="action.icon + ' text-3xl mb-3 block action-icon-glow'" :style="{ color: action.color }"></i>
                                                <span class="text-sm font-semibold block">{{ action.label || getActionName(action.id) }}</span>
                                                <div v-if="!action.available" class="absolute top-3 right-3">
                                                    <i class="fas fa-lock text-sm text-red-400"></i>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </transition>
    </div>
  `,
  data() {
    return {
      isMenuOpen: false,
      selectedPlayer: null,
      currentRole: null,
      translations: {},
      config: { roleActions: {} },
      nearbyPlayers: [],
    };
  },  computed: {
    availableActions() {
      if (!this.currentRole || !this.config?.roleActions) return [];
      
      const roles = this.config.roleActions || {};
      for (const roleKey in roles) {
        const roleConfig = roles[roleKey];
        if (roleConfig?.jobs?.includes(this.currentRole)) {
          return (roleConfig.actions || []).map((a) => ({
            ...a, 
            available: true,
            label: a.label || this.getActionName(a.id)
          }));
        }
      }
      return [];
    },
  },
  methods: {
    selectPlayer(player) {
      this.selectedPlayer = player;
    },
    goBack() {
      this.selectedPlayer = null;
    },    executeAction(action) {
      if (!action?.available || !this.selectedPlayer || !action?.id) return;
      $.post(`https://bit-menu/executeAction`, JSON.stringify({ 
        action: action.id, 
        targetId: this.selectedPlayer.id 
      }));
      this.isMenuOpen = false;
      this.selectedPlayer = null;
    },    getActionName(actionId) {
      return this.translations.actionNames?.[actionId] || 
             this.translations.texts?.[actionId] || 
             actionId;
    },    toggleHeadbag(show) {
      const overlay = document.getElementById('headbag-overlay');
      if (overlay) {
        if (show) {
          overlay.classList.remove('hidden');
          overlay.classList.add('block');
        } else {
          overlay.classList.remove('block');
          overlay.classList.add('hidden');
        }
      }
    },
  },
  mounted() {
    window.addEventListener("message", (event) => {
      const data = event.data;
      switch (data.type) {
        case "translations":
          this.translations = data.translations || {};
          this.config = {...this.config, ...(data.config || {})};
          break;
        case "setNearbyPlayers":
          this.nearbyPlayers = data.players || [];
          break;        case "setRole":
          this.currentRole = data.role;
          break;
        case "showMenu":
          this.isMenuOpen = true;
          break;
        case "hideMenu":
          this.isMenuOpen = false;
          this.selectedPlayer = null;
          break;
        case "headbag":
          this.toggleHeadbag(data.show);
          break;
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isMenuOpen) {
        this.isMenuOpen = false;
        this.selectedPlayer = null;
        $.post(`https://bit-menu/close`, {});
      }
    });
  },
});

app.mount("#app");