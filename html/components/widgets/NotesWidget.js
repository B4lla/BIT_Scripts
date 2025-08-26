

const NotesWidget = {
  name: 'NotesWidget',
  props: {
    t: { type: Function, required: true },
    size: { type: String, default: '2x2' }
  },
  data() {
    return {
      notes: [
        {
          id: 1,
          title: this.t('notesWidget.sampleNote1Title'),
          preview: this.t('notesWidget.sampleNote1Preview'),
          date: '2 jul'
        },
        {
          id: 2,
          title: this.t('notesWidget.sampleNote2Title'),
          preview: this.t('notesWidget.sampleNote2Preview'),
          date: '1 jul'
        },
        {
          id: 3,
          title: this.t('notesWidget.sampleNote3Title'),
          preview: this.t('notesWidget.sampleNote3Preview'),
          date: '30 jun'
        }
      ]
    };
  },
  computed: {
    widgetClasses() {
      const sizeClasses = {
        '2x2': 'col-span-2 row-span-2',
        '2x1': 'col-span-2 row-span-1'
      };
      return sizeClasses[this.size] + ' bg-gradient-to-br from-yellow-400/20 to-orange-500/20 backdrop-blur-xl border border-white/20 rounded-3xl p-4 text-white shadow-xl';
    }
  },
  template: `
    <div :class="widgetClasses">
      <div v-if="size === '2x2'" class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium opacity-90">Notas</span>
          <span class="text-xs opacity-70">{{ notes.length }}</span>
        </div>
        
        <div class="flex-1 space-y-2">
          <div v-for="note in notes.slice(0, 3)" 
               :key="note.id"
               class="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <div class="flex items-start justify-between mb-1">
              <span class="text-xs font-medium truncate flex-1">{{ note.title }}</span>
              <span class="text-xs opacity-60 ml-2">{{ note.date }}</span>
            </div>
            <p class="text-xs opacity-75 line-clamp-2">{{ note.preview }}</p>
          </div>
        </div>
      </div>
      
      <div v-else-if="size === '2x1'" class="flex items-center h-full gap-3">
        <div class="w-10 h-10 bg-yellow-500/30 rounded-xl flex items-center justify-center">
          <span class="text-lg">📝</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium">Notas</div>
          <div class="text-xs opacity-75 truncate">{{ notes[0].title }}</div>
        </div>
        <span class="text-xs opacity-60">+{{ notes.length - 1 }}</span>
      </div>
    </div>
  `
};
window.NotesWidget = NotesWidget;