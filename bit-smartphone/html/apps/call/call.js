const Call = {
  components: {
    CallComponent: CallComponent
  },
  props: ["userSettings", "t"],
  emits: ["close"],
  data() {
    return {
      callData: null,
      isInitializing: true
    };
  },
  methods: {
    handleCallEnd() {
      this.callData = null;
      this.isInitializing = false;
      this.$emit('close');
    },
    
    handleMessage(data) {
      
      if (data.action === 'call:incoming' || data.action === 'call:outgoing' || data.action === 'call:start_from_command') {
        this.callData = data.data;
        this.isInitializing = false;
      } else if (data.action === 'call:ended' || data.action === 'call:timeout' || data.action === 'call:failed') {
        this.handleCallEnd();
      }
    }
  },
  template: `
    <div class="app-container h-full bg-black text-white relative overflow-hidden">
      <CallComponent 
        v-if="callData && !isInitializing"
        :call-data="callData"
        :is-visible="true"
        @end-call="handleCallEnd"
        class="h-full w-full"
      />
      <div v-else-if="isInitializing" class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p class="text-xl font-medium">{{ t('call.initializing', 'Inicializando llamada...') }}</p>
          <p class="text-sm text-white/60 mt-2">Preparando conexión</p>
        </div>
      </div>
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-center">
          <p class="text-lg text-white/60">{{ t('call.noActiveCall', 'No hay llamada activa') }}</p>
        </div>
      </div>
    </div>
  `,
  mounted() {
    setTimeout(() => {
      if (this.isInitializing && !this.callData) {
        console.warn('[Call] No call data received, closing...');
        this.handleCallEnd();
      }
    }, 10000);

    try {
      window.callComponent = {
        handleMessage: this.handleMessage
      };
      window.__previous_bit_dispatch = window.__bit_dispatch;
      window.__bit_dispatch = this.handleMessage;
    } catch (e) {
      console.error('[Call] Error setting temporary dispatcher:', e);
    }
  },
  beforeUnmount() {
    try {
      if (window.__previous_bit_dispatch !== undefined) {
        window.__bit_dispatch = window.__previous_bit_dispatch;
        delete window.__previous_bit_dispatch;
      } else if (window.__bit_dispatch === this.handleMessage) {
        delete window.__bit_dispatch;
      }
    } catch (e) {
      console.error('[Call] Error restoring dispatcher:', e);
    }

    if (window.callComponent) {
      delete window.callComponent;
    }
  }
};
