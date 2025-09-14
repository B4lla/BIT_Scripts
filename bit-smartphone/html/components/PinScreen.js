const PinScreen = {
  props: ["pinInput", "pinError", "t"],
  emits: ["enter-pin", "delete-pin", "cancel"],
  template: `
    <div class="pin-screen absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xl bg-black/30">
      <div class="flex flex-col items-center justify-center w-full max-w-xs">
        <div class="text-center w-full mb-12">
          <h1 class="text-white text-xl font-normal mb-4 tracking-wide">{{ t("common.enterPin") }}</h1>
          
          <div class="h-6 mb-2 flex items-center justify-center">
            <span v-if="pinError" class="text-red-400 text-sm animate-shake">
              {{ t("common.pinError") }}
            </span>
          </div>

          <div class="pin-input flex justify-center gap-5">
            <div v-for="n in 4" :key="n" 
                 class="w-3.5 h-3.5 rounded-full border border-white/60 transition-all duration-300"
                 :class="{ 'bg-white': pinInput.length >= n, 'bg-transparent': pinInput.length < n }">
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-x-6 gap-y-4 mb-10">
          <button v-for="n in 9" :key="n" 
                  @click="$emit('enter-pin', n)"
                  class="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm text-white
                         hover:bg-white/20 active:bg-white active:text-black
                         transition-colors duración-200 ease-out
                         flex items-center justify-center">
            <span class="text-4xl font-extralight tracking-wider">{{ n }}</span>
          </button>
        
          <div class="w-20 h-20"></div>

          <button @click="$emit('enter-pin', 0)"
                  class="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm text-white
                         hover:bg-white/20 active:bg-white active:text-black
                         transition-colors duración-200 ease-out
                         flex items-center justify-center">
            <span class="text-4xl font-extralight tracking-wider">0</span>
          </button>

          <button @click="$emit('delete-pin')"
                  class="w-20 h-20 rounded-full bg-transparent text-white
                         hover:bg-white/15 active:bg-white/25
                         transition-colors duración-200 ease-out
                         flex items-center justify-center">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"></path>
            </svg>
          </button>
        </div>

        <div class="text-center w-full h-10">
          <button @click="$emit('cancel')" 
                  class="px-6 py-2 text-white text-base font-normal
                         hover:text-white/80 rounded-full transition-colors duración-200">
            {{ t("common.cancel") || "Cancelar" }}
          </button>
        </div>

      </div>
    </div>
  `,
}
window.PinScreen = PinScreen;