
const WidgetManager = {
  name: 'WidgetManager',
  props: {
    isVisible: { type: Boolean, default: false },
    currentPage: { type: Number, default: 0 },
    weatherData: { type: Object, required: true },
    batteryLevel: { type: Number, required: true },
    photos: { type: Array, required: true },
    t: { type: Function, required: true }
  },
  emits: ['close', 'add-widget'],
  components: {
    WeatherWidget: window.WeatherWidget || { name: 'WeatherWidget', template: '<div></div>' },
    ClockWidget: window.ClockWidget || { name: 'ClockWidget', template: '<div></div>' },
    BatteryWidget: window.BatteryWidget || { name: 'BatteryWidget', template: '<div></div>' },
    PhotosWidget: window.PhotosWidget || { name: 'PhotosWidget', template: '<div></div>' },
    CalendarWidget: window.CalendarWidget || { name: 'CalendarWidget', template: '<div></div>' },
    MusicWidget: window.MusicWidget || { name: 'MusicWidget', template: '<div></div>' },
    NotesWidget: window.NotesWidget || { name: 'NotesWidget', template: '<div></div>' }
  },
  data() {
    return {
      draggedWidget: null,
      availableWidgets: [
        {
          id: 'photos-4x2',
          component: 'PhotosWidget',
          name: this.t('widgets.photos'),
          size: '4x2',
          icon: '📷',
          description: this.t('widgets.photosDescription')
        },
        {
          id: 'calendar-2x2',
          component: 'CalendarWidget',
          name: this.t('widgets.calendar'),
          size: '2x2',
          icon: '📅',
          description: this.t('widgets.calendarDescription')
        },
        {
          id: 'calendar-1x1',
          component: 'CalendarWidget',
          name: this.t('widgets.date'),
          size: '1x1',
          icon: '📅',
          description: this.t('widgets.dateDescription')
        },
        {
          id: 'music-4x2',
          component: 'MusicWidget',
          name: this.t('widgets.music'),
          size: '4x2',
          icon: '🎵',
          description: this.t('widgets.musicDescription')
        },
        {
          id: 'music-2x1',
          component: 'MusicWidget',
          name: this.t('widgets.musicCompact'),
          size: '2x1',
          icon: '🎵',
          description: this.t('widgets.musicCompactDescription')
        },
        {
          id: 'notes-2x2',
          component: 'NotesWidget',
          name: this.t('widgets.notes'),
          size: '2x2',
          icon: '📝',
          description: this.t('widgets.notesDescription')
        },
        {
          id: 'notes-2x1',
          component: 'NotesWidget',
          name: this.t('widgets.notesQuick'),
          size: '2x1',
          icon: '📝',
          description: this.t('widgets.notesQuickDescription')
        }
      ]
    };
  },
  methods: {
    handleDragStart(event, widget) {
      this.draggedWidget = widget;
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', widget.id);
      
      
      const dragImage = event.target.cloneNode(true);
      dragImage.style.opacity = '0.8';
      dragImage.style.transform = 'scale(0.9)';
      event.dataTransfer.setDragImage(dragImage, 50, 50);
    },
    
    handleDragEnd() {
      this.draggedWidget = null;
    },
    
    addWidget(widget) {
      const widgetData = {
        type: 'widget',
        component: widget.component,
        size: widget.size,
        props: this.getWidgetProps(widget),
        baseId: widget.id 
      };
      
      this.$emit('add-widget', widgetData);
    },
    
    getWidgetProps(widget) {
      const baseProps = { t: this.t, size: widget.size };
      
      switch (widget.component) {
        case 'WeatherWidget':
          return { ...baseProps, weatherData: this.weatherData };
        case 'BatteryWidget':
          return { ...baseProps, batteryLevel: this.batteryLevel };
        case 'PhotosWidget':
          return { ...baseProps, photos: this.photos };
        default:
          return baseProps;
      }
    },
    
    close() {
      this.$emit('close');
    }
  },
  template: `
    <transition name="widget-manager-slide" appear>
      <div v-if="isVisible" class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end">
        <div class="w-full bg-black/10 backdrop-blur-2xl rounded-t-3xl border-t border-white/20 text-white shadow-2xl max-h-[50vh] flex flex-col">
          
          <div class="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 class="text-xl font-semibold">{{ t('widgets.title') }}</h2>
              <p class="text-sm opacity-70 mt-1">{{ t('widgets.dragInstruction') }}</p>
            </div>
            <button @click="close" 
                    class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          
          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-6">
              
              <div>
                <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Tiempo</h3>
                <div class="grid grid-cols-2 gap-3">
                  <div v-for="widget in availableWidgets.filter(w => w.component === 'WeatherWidget')" 
                       :key="widget.id"
                       @click="addWidget(widget)"
                       :draggable="true"
                       @dragstart="handleDragStart($event, widget)"
                       @dragend="handleDragEnd"
                       class="bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-95">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-2xl">{{ widget.icon }}</span>
                      <div class="flex-1">
                        <div class="text-sm font-medium">{{ widget.name }}</div>
                        <div class="text-xs opacity-60">{{ widget.size }}</div>
                      </div>
                    </div>
                    <p class="text-xs opacity-70">{{ widget.description }}</p>
                  </div>
                </div>
              </div>
              
              
              <div>
                <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Utilidades</h3>
                <div class="grid grid-cols-2 gap-3">
                  <div v-for="widget in availableWidgets.filter(w => ['ClockWidget', 'BatteryWidget', 'CalendarWidget'].includes(w.component))" 
                       :key="widget.id"
                       @click="addWidget(widget)"
                       :draggable="true"
                       @dragstart="handleDragStart($event, widget)"
                       @dragend="handleDragEnd"
                       class="bg-gradient-to-br from-gray-400/20 to-gray-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-95">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-2xl">{{ widget.icon }}</span>
                      <div class="flex-1">
                        <div class="text-sm font-medium">{{ widget.name }}</div>
                        <div class="text-xs opacity-60">{{ widget.size }}</div>
                      </div>
                    </div>
                    <p class="text-xs opacity-70">{{ widget.description }}</p>
                  </div>
                </div>
              </div>
              
              
              <div>
                <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Entretenimiento</h3>
                <div class="grid grid-cols-2 gap-3">
                  <div v-for="widget in availableWidgets.filter(w => ['MusicWidget', 'PhotosWidget'].includes(w.component))" 
                       :key="widget.id"
                       @click="addWidget(widget)"
                       :draggable="true"
                       @dragstart="handleDragStart($event, widget)"
                       @dragend="handleDragEnd"
                       class="bg-gradient-to-br from-purple-400/20 to-pink-600/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-95">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-2xl">{{ widget.icon }}</span>
                      <div class="flex-1">
                        <div class="text-sm font-medium">{{ widget.name }}</div>
                        <div class="text-xs opacity-60">{{ widget.size }}</div>
                      </div>
                    </div>
                    <p class="text-xs opacity-70">{{ widget.description }}</p>
                  </div>
                </div>
              </div>
              
              
              <div>
                <h3 class="text-sm font-medium opacity-70 uppercase tracking-wide mb-3">Productividad</h3>
                <div class="grid grid-cols-2 gap-3">
                  <div v-for="widget in availableWidgets.filter(w => w.component === 'NotesWidget')" 
                       :key="widget.id"
                       @click="addWidget(widget)"
                       :draggable="true"
                       @dragstart="handleDragStart($event, widget)"
                       @dragend="handleDragEnd"
                       class="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-xl border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all active:scale-95">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="text-2xl">{{ widget.icon }}</span>
                      <div class="flex-1">
                        <div class="text-sm font-medium">{{ widget.name }}</div>
                        <div class="text-xs opacity-60">{{ widget.size }}</div>
                      </div>
                    </div>
                    <p class="text-xs opacity-70">{{ widget.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  `
}; 
window.WidgetManager = WidgetManager;