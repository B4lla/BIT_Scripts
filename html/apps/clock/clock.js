const Clock = {
  props: ["userSettings", "t"],
  emits: ["close", "playTrack", "pauseMusic", "resumeMusic", "stopMusic", "setMusicProgress", "setMusicVolume", "setPlaylist"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted } = Vue;
    
    
    const isComponentMounted = ref(true);
    
    const currentTab = ref("world")
    const currentTime = ref("")
    let clockInterval = null

    
    const showModal = ref(false)
    const modalType = ref("")
    const modalInputs = ref({})
    const editingItem = ref(null)
    
    const worldClocks = ref([
      { city: "Cupertino", diff: "Hoy, -9 h", timezone: "America/Los_Angeles" },
      { city: "Nueva York", diff: "Hoy, -6 h", timezone: "America/New_York" },
      { city: "Londres", diff: "Hoy, -1 h", timezone: "Europe/London" },
      { city: "Tokio", diff: "Mañana, +7 h", timezone: "Asia/Tokyo" },
    ])

    
    const alarms = ref([
      { time: "07:00", label: "Alarma", enabled: true },
      { time: "08:30", label: "Despertar", enabled: false },
    ])

    
    const stopwatchTime = ref(0)
    const isStopwatchRunning = ref(false)
    let stopwatchInterval = null

    
    const timerDuration = ref(15 * 60) 
    const timerTimeLeft = ref(timerDuration.value)
    const isTimerRunning = ref(false)
    const isTimerFinished = ref(false)
    let timerInterval = null
    let alarmAudio = null

    
    const updateClocks = () => {
      const now = new Date()
      currentTime.value = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      worldClocks.value.forEach((clock) => {
        clock.time = now.toLocaleTimeString("en-US", {
          timeZone: clock.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      })
    }

    
    const formattedStopwatch = computed(() => {
      const totalSeconds = Math.floor(stopwatchTime.value / 1000)
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
      const seconds = String(totalSeconds % 60).padStart(2, "0")
      const milliseconds = String(stopwatchTime.value % 1000)
        .slice(0, 2)
        .padStart(2, "0")
      return `${minutes}:${seconds},${milliseconds}`
    })

    const toggleStopwatch = () => {
      if (isStopwatchRunning.value) {
        clearInterval(stopwatchInterval)
      } else {
        const startTime = Date.now() - stopwatchTime.value
        stopwatchInterval = setInterval(() => {
          stopwatchTime.value = Date.now() - startTime
        }, 10)
      }
      isStopwatchRunning.value = !isStopwatchRunning.value
    }

    const resetStopwatch = () => {
      clearInterval(stopwatchInterval)
      isStopwatchRunning.value = false
      stopwatchTime.value = 0
    }

    
    const formatTime = (totalSeconds) => {
      if (totalSeconds < 0) totalSeconds = 0
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
      const seconds = String(totalSeconds % 60).padStart(2, "0")
      return timerDuration.value >= 3600 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`
    }

    const formattedTimer = computed(() => formatTime(timerTimeLeft.value))

    const timerProgress = computed(() => {
      if (timerDuration.value === 0) return 0
      return timerTimeLeft.value / timerDuration.value
    })

    const timerRingStyle = computed(() => ({
      strokeDashoffset: 2 * Math.PI * 120 * (1 - timerProgress.value),
    }))

    const endTime = computed(() => {
      const end = new Date(Date.now() + timerTimeLeft.value * 1000)
      return end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    })

    const toggleTimer = () => {
      if (isTimerRunning.value) {
        pauseTimer()
      } else {
        startTimer()
      }
    }

    const startTimer = () => {
      if (timerTimeLeft.value <= 0) return
      isTimerRunning.value = true
      isTimerFinished.value = false
      if (alarmAudio) alarmAudio.pause()

      const expected = Date.now() + 1000
      timerInterval = setTimeout(step, 1000)

      function step() {
        const dt = Date.now() - expected
        if (dt > 1000) {
          
        }

        timerTimeLeft.value

        if (timerTimeLeft.value <= 0) {
          finishTimer()
        } else {
          const nextExpected = expected + 1000
          timerInterval = setTimeout(step, Math.max(0, 1000 - dt))
        }
      }
    }

    const pauseTimer = () => {
      clearTimeout(timerInterval)
      isTimerRunning.value = false
    }

    const cancelTimer = () => {
      clearTimeout(timerInterval)
      isTimerRunning.value = false
      isTimerFinished.value = false
      timerTimeLeft.value = timerDuration.value
      if (alarmAudio) alarmAudio.pause()
    }

    const finishTimer = () => {
      clearTimeout(timerInterval)
      isTimerRunning.value = false
      isTimerFinished.value = true

      if (alarmAudio) {
        alarmAudio.currentTime = 0
        alarmAudio.play()
      }
    }

    
    const openModal = (type, item = null) => {
      modalType.value = type
      editingItem.value = item
      modalInputs.value = {}
      
      if (type === 'worldClock') {
        modalInputs.value = {
          city: item ? item.city : '',
          timezone: item ? item.timezone : ''
        }
      } else if (type === 'alarm') {
        modalInputs.value = {
          time: item ? item.time : '07:00',
          label: item ? item.label : 'Alarma'
        }
      } else if (type === 'timer') {
        modalInputs.value = {
          duration: Math.floor(timerDuration.value / 60)
        }
      }
      
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
      modalType.value = ""
      modalInputs.value = {}
      editingItem.value = null
    }

    const saveModal = () => {
      if (modalType.value === 'worldClock') {
        if (modalInputs.value.city && modalInputs.value.timezone) {
          if (editingItem.value) {
            editingItem.value.city = modalInputs.value.city
            editingItem.value.timezone = modalInputs.value.timezone
          } else {
            worldClocks.value.push({
              city: modalInputs.value.city,
              diff: "",
              timezone: modalInputs.value.timezone
            })
          }
          updateClocks()
        }
      } else if (modalType.value === 'alarm') {
        if (modalInputs.value.time) {
          if (editingItem.value) {
            editingItem.value.time = modalInputs.value.time
            editingItem.value.label = modalInputs.value.label
          } else {
            alarms.value.push({
              time: modalInputs.value.time,
              label: modalInputs.value.label || modalInputs.value.time,
              enabled: true
            })
          }
        }
      } else if (modalType.value === 'timer') {
        const newSeconds = parseInt(modalInputs.value.duration) * 60
        if (!isNaN(newSeconds) && newSeconds > 0) {
          timerDuration.value = newSeconds
          timerTimeLeft.value = newSeconds
          isTimerFinished.value = false
        }
      }
      
      closeModal()
    }

    
    const addWorldClock = () => {
      openModal('worldClock')
    }

    
    const addAlarm = () => {
      openModal('alarm')
    }

    const editAlarm = (alarm) => {
      
      editingItem.value = alarm;
      modalType.value = 'alarm';
      modalInputs.value = {
        time: alarm.time,
        label: alarm.label
      };
      showModal.value = true;
    };
    
    const laps = ref([])
    const lapOrReset = () => {
      if (isStopwatchRunning.value) {
        laps.value.push(stopwatchTime.value)
      } else {
        laps.value = []
        stopwatchTime.value = 0
      }
    }
    const formatLapTime = (time) => {
      const totalSeconds = Math.floor(time / 1000)
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
      const seconds = String(totalSeconds % 60).padStart(2, "0")
      const milliseconds = String(time % 1000).slice(0, 2).padStart(2, "0")
      return `${minutes}:${seconds},${milliseconds}`
    }

    
    const editTimer = () => {
      if (isTimerRunning.value) return
      openModal('timer')
    }

    onMounted(() => {
      updateClocks()
      clockInterval = setInterval(updateClocks, 1000)
      alarmAudio = new Audio("./assets/alarm.mp3") 
      alarmAudio.loop = true
    })

    onUnmounted(() => {
      isComponentMounted.value = false;
      clearInterval(clockInterval)
      clearInterval(stopwatchInterval)
      clearTimeout(timerInterval)
      if (alarmAudio) alarmAudio.pause()
    })

    return {
      isComponentMounted,
      currentTab,
      currentTime,
      worldClocks,
      alarms,
      formattedStopwatch,
      isStopwatchRunning,
      toggleStopwatch,
      resetStopwatch,
      
      formattedTimer,
      isTimerRunning,
      isTimerFinished,
      toggleTimer,
      cancelTimer,
      timerRingStyle,
      endTime,
      emit,

      timerDuration,
      timerTimeLeft,
      timerProgress,
      lapOrReset,
      laps,
      formatLapTime,
      addWorldClock,
      addAlarm,
      editAlarm,
      editTimer,
      
      
      showModal,
      modalType,
      modalInputs,
      openModal,
      closeModal,
      saveModal,
    }
  },
  template: `
  <div class="h-full w-full flex flex-col font-sans transition-all duration-300"
       :class="userSettings.darkMode ? 'bg-black text-white' : 'bg-white text-gray-900'">
    <header class="p-4 pt-16 shrink-0 z-10">
      <div class="flex justify-between items-center">
        <button @click="$emit('close')" class="text-lg transition-colors duration-300"
                :class="userSettings.darkMode ? 'text-orange-500' : 'text-blue-500'">Home</button>
        <h1 class="font-semibold text-lg invisible">Reloj</h1> 
        <button v-if="currentTab === 'world'" @click="addWorldClock" class="transition-colors duration-300"
                :class="userSettings.darkMode ? 'text-orange-500' : 'text-blue-500'">
          <svg class="w-8 h-8"><use href="#icon-plus"></use></svg>
        </button>
        <button v-else-if="currentTab === 'alarm'" @click="addAlarm" class="transition-colors duration-300"
                :class="userSettings.darkMode ? 'text-orange-500' : 'text-blue-500'">
          <svg class="w-8 h-8"><use href="#icon-plus"></use></svg>
        </button>
      </div>
    </header>
    
    <main class="flex-1 overflow-y-auto px-4">
      
      <div v-if="currentTab === 'world'">
        <h2 class="text-3xl font-bold mb-4">Reloj mundial</h2>
        <div class="space-y-4">
          <div v-for="clock in worldClocks" :key="clock.city" class="flex items-end border-b pb-4 transition-colors duration-300"
               :class="userSettings.darkMode ? 'border-gray-700' : 'border-gray-300'">
            <div class="flex-1">
              <p class="text-base transition-colors duration-300"
                 :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">{{ clock.diff }}</p>
              <p class="text-3xl">{{ clock.city }}</p>
            </div>
            <p class="text-5xl font-thin">{{ clock.time }}</p>
          </div>
        </div>
      </div>
      
      <div v-if="currentTab === 'alarm'">
        <h2 class="text-3xl font-bold mb-4">Alarma</h2>
        <div class="space-y-4">
          <div v-for="alarm in alarms" :key="alarm.time" class="flex items-center border-b border-gray-700 pb-4" :class="{'text-gray-500': !alarm.enabled}">
            <div class="flex-1" @click="editAlarm(alarm)">
              <p class="text-5xl font-thin tracking-wider">{{ alarm.time }}</p>
              <p class="text-lg" :class="{'text-white': alarm.enabled}">{{ alarm.label }}</p>
            </div>
            <div @click="alarm.enabled = !alarm.enabled" class="w-12 h-7 rounded-full relative cursor-pointer transition-colors" :class="alarm.enabled ? 'bg-ios-green' : 'bg-gray-700'">
              <div class="w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform" :class="alarm.enabled ? 'translate-x-5' : 'translate-x-0.5'"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="currentTab === 'stopwatch'" class="flex flex-col h-full items-center justify-around pb-12">
          <h1 class="text-8xl font-thin tracking-tighter tabular-nums">{{ formattedStopwatch }}</h1>
          <div class="flex justify-center gap-4 w-full">
              <button @click="lapOrReset" class="w-20 h-20 text-lg rounded-full flex items-center justify-center font-semibold" :class="isStopwatchRunning ? 'bg-gray-800/80 text-white' : 'bg-red-900/50 text-red-400'">
                  {{ isStopwatchRunning ? 'Vuelta' : 'Reset' }}
              </button>
              <button @click="toggleStopwatch" class="w-20 h-20 text-lg rounded-full flex items-center justify-center font-semibold" :class="isStopwatchRunning ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'">
                  {{ isStopwatchRunning ? 'Parar' : 'Iniciar' }}
              </button>
          </div>
          <div v-if="laps.length > 0" class="mt-4 w-full max-w-md">
            <h2 class="text-xl font-bold mb-2">Vueltas</h2>
            <div class="bg-gray-800/80 rounded-lg p-4">
              <div v-for="(lap, index) in laps" :key="index" class="flex justify-between text-gray-300 text-sm border-b last:border-b-0 pb-2 mb-2">
                <span>Vuelta {{ index + 1 }}</span>
                <span>{{ formatLapTime(lap) }}</span>
              </div>
            </div>
          </div>
      </div>
      
      <div v-if="currentTab === 'timer'" class="flex flex-col h-full items-center justify-around pb-12">
        <div class="relative w-72 h-72 flex items-center justify-center">
            <svg class="w-full h-full transform -rotate-90">
                <circle cx="144" cy="144" r="134" stroke-width="12" class="text-gray-700" stroke="currentColor" fill="transparent" />
                <circle cx="144" cy="144" r="134" stroke-width="12" class="text-ios-orange" stroke="currentColor" fill="transparent"
                        stroke-linecap="round"
                        :stroke-dasharray="2 * Math.PI * 134"
                        :stroke-dashoffset="2 * Math.PI * 134 * (1 - timerProgress)"
                        style="transition: stroke-dashoffset 1s linear;" />
            </svg>
            <div class="absolute text-center">
                <h1 @click="editTimer" class="text-6xl font-thin tracking-wider tabular-nums cursor-pointer" :class="{'text-ios-orange animate-pulse': isTimerFinished}">{{ formattedTimer }}</h1>
                <p v-if="isTimerRunning || timerTimeLeft < timerDuration" class="text-gray-400 text-lg flex items-center justify-center gap-1">
                    <svg class="w-4 h-4"><use href="#icon-alarm-clock"></use></svg>
                    {{ endTime }}
                </p>
            </div>
        </div>
        <div class="flex justify-center gap-4 w-full">
            <button @click="toggleTimer" class="w-20 h-20 text-lg rounded-full flex items-center justify-center font-semibold" 
                    :class="{
                        'bg-orange-900/50 text-orange-400': isTimerRunning,
                        'bg-green-900/50 text-green-400': !isTimerRunning
                    }">
                {{ isTimerRunning ? 'Pausar' : (timerTimeLeft < timerDuration ? 'Reanudar' : 'Iniciar') }}
            </button>
        </div>
      </div>
    </main>

    <footer class="grid grid-cols-4 border-t text-xs text-center shrink-0 backdrop-blur-md transition-all duration-300"
            :class="userSettings.darkMode 
              ? 'border-gray-800 text-gray-500 bg-gray-900/50' 
              : 'border-gray-300 text-gray-600 bg-white/50'">
      <button @click="currentTab = 'world'" class="p-2 pt-3 flex flex-col items-center gap-1 transition-colors duration-300" 
              :class="currentTab === 'world' 
                ? (userSettings.darkMode ? 'text-orange-500' : 'text-blue-500')
                : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <svg class="w-6 h-6"><use href="#icon-globe"></use></svg> Mundial
      </button>
      <button @click="currentTab = 'alarm'" class="p-2 pt-3 flex flex-col items-center gap-1 transition-colors duration-300" 
              :class="currentTab === 'alarm' 
                ? (userSettings.darkMode ? 'text-orange-500' : 'text-blue-500')
                : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <svg class="w-6 h-6"><use href="#icon-alarm-clock"></use></svg> Alarma
      </button>
      <button @click="currentTab = 'stopwatch'" class="p-2 pt-3 flex flex-col items-center gap-1 transition-colors duration-300" 
              :class="currentTab === 'stopwatch' 
                ? (userSettings.darkMode ? 'text-orange-500' : 'text-blue-500')
                : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <svg class="w-6 h-6"><use href="#icon-stopwatch"></use></svg> Cronómetro
      </button>
      <button @click="currentTab = 'timer'" class="p-2 pt-3 flex flex-col items-center gap-1 transition-colors duration-300" 
              :class="currentTab === 'timer' 
                ? (userSettings.darkMode ? 'text-orange-500' : 'text-blue-500')
                : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <svg class="w-6 h-6"><use href="#icon-timer"></use></svg> Temporizador
      </button>
    </footer>

    
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-end justify-center" @click="closeModal">
      <div class="fixed inset-0 bg-black bg-opacity-50"></div>
      <div class="relative w-full max-w-md p-6 rounded-t-2xl transition-transform transform translate-y-0 animate-slide-up"
           :class="userSettings.darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'"
           @click.stop>
        
        
        <div class="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
        
        
        <div v-if="modalType === 'worldClock'">
          <h3 class="text-xl font-semibold mb-4">{{ editingItem ? 'Editar' : 'Añadir' }} Reloj Mundial</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Ciudad</label>
              <input v-model="modalInputs.city" type="text" placeholder="Ej: Madrid" 
                     class="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     :class="userSettings.darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'">
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Zona horaria (IANA)</label>
              <input v-model="modalInputs.timezone" type="text" placeholder="Ej: Europe/Madrid" 
                     class="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     :class="userSettings.darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'">
            </div>
          </div>
        </div>
        
        
        <div v-if="modalType === 'alarm'">
          <h3 class="text-xl font-semibold mb-4">{{ editingItem ? 'Editar' : 'Añadir' }} Alarma</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Hora</label>
              <input v-model="modalInputs.time" type="time" 
                     class="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     :class="userSettings.darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'">
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Etiqueta</label>
              <input v-model="modalInputs.label" type="text" placeholder="Ej: Despertar" 
                     class="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     :class="userSettings.darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'">
            </div>
          </div>
        </div>
        
        
        <div v-if="modalType === 'timer'">
          <h3 class="text-xl font-semibold mb-4">Configurar Temporizador</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Duración (minutos)</label>
              <input v-model="modalInputs.duration" type="number" min="1" max="180" 
                     class="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     :class="userSettings.darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'">
            </div>
          </div>
        </div>
        
        
        <div class="flex gap-3 mt-6">
          <button @click="closeModal" 
                  class="flex-1 py-3 px-4 rounded-lg font-medium transition-colors"
                  :class="userSettings.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'">
            Cancelar
          </button>
          <button @click="saveModal" 
                  class="flex-1 py-3 px-4 rounded-lg font-medium text-white transition-colors"
                  :class="userSettings.darkMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'">
            {{ editingItem ? 'Guardar' : 'Añadir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
`,
}
