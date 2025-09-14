

const CalendarWidget = {
  name: 'CalendarWidget',
  props: {
    t: { type: Function, required: true },
    size: { type: String, default: '2x2' }
  },
  data() {
    return {
      currentDate: new Date()
    };
  },
  computed: {
    widgetClasses() {
      const sizeClasses = {
        '2x2': 'col-span-2 row-span-2',
        '1x1': 'col-span-1 row-span-1'
      };
      return sizeClasses[this.size] + ' bg-gradient-to-br from-red-400/20 to-red-600/20 backdrop-blur-xl border border-white/20 rounded-3xl p-4 text-white shadow-xl';
    },
    
    dayNumber() {
      return this.currentDate.getDate();
    },
    
    dayName() {
      return this.currentDate.toLocaleDateString('es-ES', { weekday: 'long' });
    },
    
    monthName() {
      return this.currentDate.toLocaleDateString('es-ES', { month: 'long' });
    },
    
    year() {
      return this.currentDate.getFullYear();
    },
    
    calendarDays() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const days = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push({
          date: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: date.toDateString() === new Date().toDateString()
        });
      }
      return days.slice(0, 35); 
    }
  },
  template: `
    <div :class="widgetClasses">
      <div v-if="size === '1x1'" class="flex flex-col h-full justify-center items-center text-center">
        <div class="text-xs opacity-75 uppercase tracking-wide mb-1">{{ monthName.slice(0, 3) }}</div>
        <div class="text-2xl font-light">{{ dayNumber }}</div>
      </div>
      
      <div v-else-if="size === '2x2'" class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-sm font-medium">{{ monthName }} {{ year }}</div>
            <div class="text-xs opacity-75 capitalize">{{ dayName }}</div>
          </div>
          <div class="text-2xl font-light">{{ dayNumber }}</div>
        </div>
        
        <div class="flex-1">
          <div class="grid grid-cols-7 gap-1 text-xs">
            <div v-for="day in ['D', 'L', 'M', 'X', 'J', 'V', 'S']" 
                 :key="day" 
                 class="text-center opacity-50 mb-1">
              {{ day }}
            </div>
            
            <div v-for="(day, index) in calendarDays" 
                 :key="index"
                 class="text-center py-1 text-xs rounded"
                 :class="{
                   'opacity-30': !day.isCurrentMonth,
                   'bg-white/20 font-semibold': day.isToday,
                   'opacity-70': day.isCurrentMonth && !day.isToday
                 }">
              {{ day.date }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
window.CalendarWidget = CalendarWidget;