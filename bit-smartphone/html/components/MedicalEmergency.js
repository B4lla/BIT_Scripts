const MedicalEmergency = {
  name: 'MedicalEmergency',
  props: {
    isActive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['emergency-called', 'timer-ended'],
  data() {
    return {
      timeLeft: 300, 
      timerInterval: null,
      isSliding: false,
      slideDistance: 0,
      startX: 0,
      isDragging: false,
      emergencyMessages: [
        'Mantén la calma',
        'Ayuda está en camino',
        'Respira profundamente',
        'No te muevas innecesariamente'
      ],
      currentMessageIndex: 0,
      messageInterval: null
    };
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return minutes + ':' + seconds.toString().padStart(2, '0');
    },
    progressPercentage() {
      return ((300 - this.timeLeft) / 300) * 100;
    },
    slidePercentage() {
      return Math.min((this.slideDistance / 250) * 100, 100);
    },
    currentMessage() {
      return this.emergencyMessages[this.currentMessageIndex];
    }
  },
  watch: {
    isActive(newVal) {
      if (newVal) {
        this.startTimer();
        this.startMessageRotation();
      } else {
        this.stopTimer();
        this.stopMessageRotation();
      }
    }
  },
  methods: {
    startTimer() {
      this.timeLeft = 300;
      this.timerInterval = setInterval(() => {
        this.timeLeft
        if (this.timeLeft <= 0) {
          this.stopTimer();
          this.$emit('timer-ended');
        }
      }, 1000);
    },
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },
    startMessageRotation() {
      this.messageInterval = setInterval(() => {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.emergencyMessages.length;
      }, 3000);
    },
    stopMessageRotation() {
      if (this.messageInterval) {
        clearInterval(this.messageInterval);
        this.messageInterval = null;
      }
    },
    handleSlideStart(event) {
      if (event.type === 'touchstart') {
        this.startX = event.touches[0].clientX;
      } else {
        this.startX = event.clientX;
      }
      this.isDragging = true;
      this.slideDistance = 0;
    },
    handleSlideMove(event) {
      if (!this.isDragging) return;
      
      event.preventDefault();
      let currentX;
      if (event.type === 'touchmove') {
        currentX = event.touches[0].clientX;
      } else {
        currentX = event.clientX;
      }
      
      this.slideDistance = Math.max(0, currentX - this.startX);
      
      if (this.slideDistance >= 250) {
        this.callEmergency();
      }
    },
    handleSlideEnd() {
      this.isDragging = false;
      if (this.slideDistance < 250) {
        this.slideDistance = 0;
      }
    },
    callEmergency() {
      this.isSliding = true;
      this.$emit('emergency-called');
      this.stopTimer();
      this.stopMessageRotation();
    },
    mounted() {
      document.addEventListener('touchmove', this.handleSlideMove);
      document.addEventListener('touchend', this.handleSlideEnd);
      document.addEventListener('mousemove', this.handleSlideMove);
      document.addEventListener('mouseup', this.handleSlideEnd);
    },
    beforeUnmount() {
      document.removeEventListener('touchmove', this.handleSlideMove);
      document.removeEventListener('touchend', this.handleSlideEnd);
      document.removeEventListener('mousemove', this.handleSlideMove);
      document.removeEventListener('mouseup', this.handleSlideEnd);
      this.stopTimer();
      this.stopMessageRotation();
    }
  },
  template: `
    <div v-if="isActive" class="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden select-none" 
         style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;">

      <div class="absolute inset-0 bg-gradient-radial from-red-900/30 via-transparent to-transparent animate-pulse"></div>
      <div class="flex flex-col items-center justify-center h-full px-8 relative z-10">
        <div class="mb-8 relative">
          <div class="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/50 animate-bounce">
            <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
              <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z"/>
            </svg>
          </div>
          <div class="absolute inset-0 w-24 h-24 bg-red-600 rounded-full animate-ping opacity-20"></div>
        </div>

        <div class="text-center mb-8">
          <h1 class="text-white text-3xl font-bold mb-2 tracking-wide">EMERGENCIA MÉDICA</h1>
          <div class="h-8 flex items-center justify-center">
            <p class="text-red-300 text-lg font-medium transition-all duration-500">{{ currentMessage }}</p>
          </div>
        </div>

        <div class="mb-12 text-center">
          <div class="relative w-32 h-32 mb-6">
            <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" stroke-width="6" fill="none"/>
              <circle cx="50" cy="50" r="45" stroke="#ef4444" stroke-width="6" fill="none"
                      :stroke-dasharray="283" :stroke-dashoffset="283 - (283 * progressPercentage / 100)"
                      class="transition-all duration-1000"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-white text-2xl font-mono font-bold">{{ formattedTime }}</span>
            </div>
          </div>
          <p class="text-white/70 text-sm">Tiempo hasta activación automática</p>
        </div>

        <div class="relative">
          <div class="w-80 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl shadow-black/50 overflow-hidden">
            <div class="absolute inset-1 bg-gradient-to-r from-red-600/80 to-red-500/80 rounded-full opacity-0 transition-opacity duration-300"
                 :class="{ 'opacity-100': slidePercentage > 0 }"></div>

            <div class="absolute top-1 left-1 w-14 h-14 bg-gradient-to-br from-white to-gray-100 rounded-full shadow-lg flex items-center justify-center transition-transform duration-200 cursor-grab active:cursor-grabbing"
                 :style="{ transform: 'translateX(' + slideDistance + 'px)' }"
                 @mousedown="handleSlideStart"
                 @touchstart="handleSlideStart">
              <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44-2.83 3.76-5.14 6.67-6.62L11.63 2.3c-3.53 1.73-6.46 4.66-8.24 8.24l3.23 1.25z"/>
                <path d="M17.38 13.21c-1.44 2.83-3.76 5.14-6.67 6.62l1.66 1.87c3.53-1.73 6.46-4.66 8.24-8.24l-3.23-1.25z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8z"/>
              </svg>
            </div>

            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-white font-semibold text-sm tracking-wider ml-8">
                {{ slidePercentage < 90 ? 'DESLIZA PARA LLAMAR 911' : 'LLAMANDO...' }}
              </span>
            </div>

            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 flex space-x-1">
              <div class="w-2 h-2 bg-white/50 rounded-full animate-pulse" style="animation-delay: 0s"></div>
              <div class="w-2 h-2 bg-white/50 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-white/50 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
            </div>
          </div>

          <p class="text-white/60 text-xs text-center mt-4 tracking-wide">
            {{ t('emergency.holdAndSlide') }}
          </p>
        </div>

        <div class="absolute bottom-8 left-8 right-8">
          <div class="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-2xl">
            <div class="flex items-center justify-between text-white/80 text-sm">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Modo de emergencia activo</span>
              </div>
              <div class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Servicios listos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30 pointer-events-none"></div>
    </div>
  `
};
