function GetParentResourceName() {
  return window.GetParentResourceName ? window.GetParentResourceName() : 'bit-smartphone';
}

const Calendar = {
  props: ["t"],
  emits: ["close"],
  setup(props) {
    const { ref, computed, onMounted, watch, nextTick } = Vue;
    const currentDate = ref(new Date())
    const selectedDate = ref(new Date())
    const viewMode = ref("month") 
    const showAddEventModal = ref(false)
    const newEvent = ref({
      title: '',
      date: '',
      time: '',
      duration: 60,
      color: 'bg-blue-500'
    })

    const events = ref([])

    const monthNames = props.t ? [
      props.t('calendar.months.january'),
      props.t('calendar.months.february'),
      props.t('calendar.months.march'),
      props.t('calendar.months.april'),
      props.t('calendar.months.may'),
      props.t('calendar.months.june'),
      props.t('calendar.months.july'),
      props.t('calendar.months.august'),
      props.t('calendar.months.september'),
      props.t('calendar.months.october'),
      props.t('calendar.months.november'),
      props.t('calendar.months.december'),
    ] : [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    const dayNames = props.t ? [
      props.t('calendar.days.sunday'),
      props.t('calendar.days.monday'),
      props.t('calendar.days.tuesday'),
      props.t('calendar.days.wednesday'),
      props.t('calendar.days.thursday'),
      props.t('calendar.days.friday'),
      props.t('calendar.days.saturday')
    ] : ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

    const currentMonth = computed(() => monthNames[currentDate.value.getMonth()])
    const currentYear = computed(() => currentDate.value.getFullYear())

    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - firstDay.getDay())

      const days = []
      const current = new Date(startDate)

      for (let i = 0; i < 42; i++) {
        const dayEvents = events.value.filter((event) => event.date.toDateString() === current.toDateString())

        days.push({
          date: new Date(current),
          isCurrentMonth: current.getMonth() === month,
          isToday: current.toDateString() === new Date().toDateString(),
          isSelected: current.toDateString() === selectedDate.value.toDateString(),
          events: dayEvents,
        })

        current.setDate(current.getDate() + 1)
      }

      return days
    })

    const selectedDateEvents = computed(() => {
      return events.value
        .filter((event) => event.date.toDateString() === selectedDate.value.toDateString())
        .sort((a, b) => a.date.getTime() - b.date.getTime())
    })

    const previousMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
    }

    const nextMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
    }

    const selectDate = (date) => {
      selectedDate.value = new Date(date)
    }

    const formatTime = (date) => {
      return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    }

    const goToToday = () => {
      const today = new Date()
      currentDate.value = new Date(today.getFullYear(), today.getMonth(), 1)
      selectedDate.value = today
    }

    const loadEvents = () => {
      fetch("https://bit-smartphone/loadEvents", { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      .catch(() => {})
    }

    const saveEvent = (eventData) => {
      fetch("https://bit-smartphone/saveEvent", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      })
      .catch(() => {})
    }

    
    if (!window._calendarListenerAdded) {
      window._calendarListenerAdded = true
      window.addEventListener('message', (event) => {
        if (event.data.action === 'calendar:eventsLoaded') {
          events.value = event.data.events.map(eventItem => ({
            ...eventItem,
            date: new Date(eventItem.date)
          }))
        }
      })
    }

    const addNewEvent = () => {
      if (!newEvent.value.title || !newEvent.value.date || !newEvent.value.time) {
        return
      }

      const [year, month, day] = newEvent.value.date.split('-')
      const [hour, minute] = newEvent.value.time.split(':')
      const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute))

      const eventData = {
        title: newEvent.value.title,
        date: eventDate.getTime(),
        duration: parseInt(newEvent.value.duration),
        color: newEvent.value.color
      }

      saveEvent(eventData)
      
      
      newEvent.value = {
        title: '',
        date: '',
        time: '',
        duration: 60,
        color: 'bg-blue-500'
      }
      showAddEventModal.value = false
    }

    const cancelAddEvent = () => {
      newEvent.value = {
        title: '',
        date: '',
        time: '',
        duration: 60,
        color: 'bg-blue-500'
      }
      showAddEventModal.value = false
    }

    
    onMounted(() => {
      loadEvents()
    })

    return {
      currentDate,
      selectedDate,
      viewMode,
      events,
      showAddEventModal,
      newEvent,
      monthNames,
      dayNames,
      currentMonth,
      currentYear,
      calendarDays,
      selectedDateEvents,
      previousMonth,
      nextMonth,
      selectDate,
      formatTime,
      goToToday,
      addNewEvent,
      cancelAddEvent,
    }
  },
  template: `
    <div class="flex flex-col h-full bg-white text-black">
      
      <div class="flex items-center justify-between p-4 pt-16 bg-white border-b border-gray-200">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold">{{ currentMonth }} {{ currentYear }}</h1>
          <button @click="goToToday" class="text-ios-blue text-sm font-medium px-3 py-1 rounded-full border border-ios-blue">
            Hoy
          </button>
        </div>
        <button @click="showAddEventModal = true" class="text-ios-blue text-lg font-medium p-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </button>
      </div>
      
      
      <div class="flex items-center justify-between p-4">
        <button @click="previousMonth" class="p-2 rounded-full hover:bg-gray-100">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div class="flex space-x-2">
          <button 
            v-for="mode in [{ key: 'month', label: 'Mes' }, { key: 'week', label: 'Semana' }, { key: 'day', label: 'Día' }]"
            :key="mode.key"
            @click="viewMode = mode.key"
            class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            :class="viewMode === mode.key ? 'bg-ios-blue text-white' : 'text-gray-600 hover:bg-gray-100'"
          >
            {{ mode.label }}
          </button>
        </div>
        <button @click="nextMonth" class="p-2 rounded-full hover:bg-gray-100">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
      
      
      <div class="flex-1 overflow-hidden">
        <div v-if="viewMode === 'month'" class="h-full flex flex-col">
          
          <div class="grid grid-cols-7 border-b border-gray-200">
            <div v-for="day in dayNames" :key="day" class="p-2 text-center text-sm font-medium text-gray-500">
              {{ day }}
            </div>
          </div>
          
          
          <div class="flex-1 grid grid-cols-7 grid-rows-6 gap-0">
            <div 
              v-for="day in calendarDays" 
              :key="day.date.toISOString()"
              @click="selectDate(day.date)"
              class="border-r border-b border-gray-100 p-1 cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{
                'bg-gray-50': !day.isCurrentMonth,
                'bg-ios-blue text-white': day.isSelected,
                'font-bold': day.isToday && !day.isSelected
              }"
            >
              <div class="text-sm" :class="{ 'text-gray-400': !day.isCurrentMonth }">
                {{ day.date.getDate() }}
              </div>
              <div class="mt-1 space-y-1">
                <div 
                  v-for="event in day.events.slice(0, 2)" 
                  :key="event.id"
                  class="text-xs px-1 py-0.5 rounded truncate"
                  :class="event.color + ' text-white'"
                >
                  {{ event.title }}
                </div>
                <div v-if="day.events.length > 2" class="text-xs text-gray-500">
                  +{{ day.events.length - 2 }} más
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      <div v-if="selectedDateEvents.length > 0" class="border-t border-gray-200 p-4 bg-gray-50">
        <h3 class="font-semibold mb-3">
          Eventos para {{ selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) }}
        </h3>
        <div class="space-y-2">
          <div 
            v-for="event in selectedDateEvents" 
            :key="event.id"
            class="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200"
          >
            <div class="w-3 h-3 rounded-full" :class="event.color"></div>
            <div class="flex-1">
              <div class="font-medium">{{ event.title }}</div>
              <div class="text-sm text-gray-600">
                {{ formatTime(event.date) }} - {{ formatTime(new Date(event.date.getTime() + event.duration * 60000)) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      <div v-if="showAddEventModal" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-xl w-full max-w-sm p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Nuevo Evento</h3>
            <button @click="cancelAddEvent" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input 
                v-model="newEvent.title"
                type="text" 
                placeholder="Título del evento"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input 
                v-model="newEvent.date"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Hora</label>
              <input 
                v-model="newEvent.time"
                type="time"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
              <select 
                v-model="newEvent.duration"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1.5 horas</option>
                <option value="120">2 horas</option>
                <option value="180">3 horas</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div class="flex space-x-2">
                <button 
                  v-for="color in ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500']"
                  :key="color"
                  @click="newEvent.color = color"
                  class="w-8 h-8 rounded-full border-2"
                  :class="[color, newEvent.color === color ? 'border-gray-800' : 'border-gray-300']"
                ></button>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-3 pt-4">
            <button 
              @click="cancelAddEvent"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              @click="addNewEvent"
              class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
}
