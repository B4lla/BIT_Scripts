const LockscreenNotifications = {
  name: 'LockscreenNotifications',
  props: {
    notifications: {
      type: Array,
      default: () => []
    },
    t: {
      type: Function,
      required: true
    }
  },
  emits: ['dismiss-notification', 'tap-notification', 'expand-notification', 'clear-all-notifications'],
  data() {
    return {
      expandedNotification: null,
      dismissingNotifications: new Set(),
      touchStartX: 0,
      touchStartY: 0,
      isDragging: false,
      draggedNotification: null,
      dragOffset: 0,
      maxNotificationsVisible: 4,
      stackOffset: 8, 
      swipeThreshold: 100 
    };
  },
  computed: {
    sortedNotifications() {
      return [...this.notifications]
        .filter(n => !this.dismissingNotifications.has(n.id))
        .sort((a, b) => new Date(b.timestamp || Date.now()) - new Date(a.timestamp || Date.now()));
    },

    visibleNotifications() {
      return this.sortedNotifications.slice(0, this.maxNotificationsVisible);
    },

    stackedCount() {
      return Math.max(0, this.sortedNotifications.length - this.maxNotificationsVisible);
    },
    
    notificationStyles() {
      return this.visibleNotifications.map((notification, index) => {
        const isExpanded = this.expandedNotification === notification.id;
        const isDragged = this.draggedNotification === notification.id;
        
        let transform = '';
        let zIndex = this.visibleNotifications.length - index + 10;
        let scale = 1;
        let opacity = 1;
        
        if (isExpanded) {
          zIndex = 100;
          transform = 'translateY(0px) scale(1.02)';
        } else if (this.expandedNotification && !isExpanded) {
          transform = `translateY(${(index + 1) * 60}px) scale(0.95)`;
          opacity = 0.3;
        } else if (isDragged) {
          transform = `translateX(${this.dragOffset}px) translateY(${index * this.stackOffset}px)`;
          zIndex = 101;
        } else {
          const stackIndex = Math.min(index, 3);
          scale = 1 - (stackIndex * 0.02);
          transform = `translateY(${stackIndex * this.stackOffset}px) scale(${scale})`;
          
          if (index > 2) {
            opacity = Math.max(0.1, 1 - ((index - 2) * 0.3));
          }
        }
        
        return {
          transform,
          zIndex,
          opacity,
          transition: isDragged ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        };
      });
    }
  },
  methods: {
    formatNotificationTime(notification) {
      if (!notification.timestamp) return 'ahora';
      
      const now = new Date();
      const notificationTime = new Date(notification.timestamp);
      const diffMs = now - notificationTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 1) return 'ahora';
      if (diffMins < 60) return `hace ${diffMins}m`;
      if (diffHours < 24) return `hace ${diffHours}h`;
      
      return notificationTime.toLocaleDateString();
    },
    
    toggleNotificationExpansion(notification) {
      if (this.expandedNotification === notification.id) {
        this.expandedNotification = null;
      } else {
        this.expandedNotification = notification.id;
        this.$emit('expand-notification', notification);
      }
    },
    
    handleNotificationTap(notification) {
      if (this.expandedNotification === notification.id) {
        this.$emit('tap-notification', notification);
        this.expandedNotification = null;
      } else {
        this.toggleNotificationExpansion(notification);
      }
    },

    handleTouchStart(event, notification) {
      const touch = event.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.isDragging = false;
      this.draggedNotification = null;
      this.dragOffset = 0;

      event.preventDefault();
    },

    handleTouchMove(event, notification) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - this.touchStartX;
      const deltaY = Math.abs(touch.clientY - this.touchStartY);
      
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > deltaY) {
        this.isDragging = true;
        this.draggedNotification = notification.id;
        this.dragOffset = deltaX;

        event.preventDefault();
      }
    },

    handleTouchEnd(event, notification) {
      const deltaX = this.dragOffset;
      
      if (this.isDragging && Math.abs(deltaX) > this.swipeThreshold) {
        this.dismissNotification(notification);
      } else if (!this.isDragging) {
        this.handleNotificationTap(notification);
      }

      this.isDragging = false;
      this.draggedNotification = null;
      this.dragOffset = 0;
    },
    
    handleMouseDown(event, notification) {
      this.touchStartX = event.clientX;
      this.touchStartY = event.clientY;
      this.isDragging = false;
      this.draggedNotification = null;
      this.dragOffset = 0;
      
      const handleMouseMove = (e) => {
        const deltaX = e.clientX - this.touchStartX;
        const deltaY = Math.abs(e.clientY - this.touchStartY);
        
        if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > deltaY) {
          this.isDragging = true;
          this.draggedNotification = notification.id;
          this.dragOffset = deltaX;
        }
      };
      
      const handleMouseUp = () => {
        const deltaX = this.dragOffset;
        
        if (this.isDragging && Math.abs(deltaX) > this.swipeThreshold) {
          this.dismissNotification(notification);
        } else if (!this.isDragging) {
          this.handleNotificationTap(notification);
        }
        
        this.isDragging = false;
        this.draggedNotification = null;
        this.dragOffset = 0;
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },

    dismissNotification(notification) {
      this.dismissingNotifications.add(notification.id);

      setTimeout(() => {
        this.$emit('dismiss-notification', notification.id);
        this.dismissingNotifications.delete(notification.id);

        if (this.expandedNotification === notification.id) {
          this.expandedNotification = null;
        }
      }, 300);
    },

    clearAllNotifications() { 
      this.$emit('clear-all-notifications');
      this.expandedNotification = null;
    },

    getAppIcon(notification) {
      if (notification.icon) return notification.icon;

      const defaultIcons = {
        'messages': '/html/assets/icons/messages.png',
        'mail': '/html/assets/icons/mail.png',
        'news': '/html/assets/icons/news.png',
        'music': '/html/assets/icons/music.png',
        'weather': '/html/assets/icons/weather.png',
        'calendar': '/html/assets/icons/calendar.png',
        'photos': '/html/assets/icons/photos.png',
      };
      
      return defaultIcons[notification.app] || null;
    }
  },

  beforeUnmount() {
    this.expandedNotification = null;
    this.dismissingNotifications.clear();
  },
  
  template: `
    <div v-if="sortedNotifications.length > 0" class="absolute inset-x-0 top-32 z-30 flex flex-col items-center px-4">
      <div class="relative w-full max-w-sm">
        <transition-group name="notification-stack" tag="div" class="relative">
          <div
            v-for="(notification, index) in visibleNotifications"
            :key="notification.id"
            :style="notificationStyles[index]"
            class="absolute w-full bg-black/85 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden cursor-pointer select-none"
            :class="{
              'ring-2 ring-blue-500/50': expandedNotification === notification.id,
              'opacity-50': dismissingNotifications.has(notification.id)
            }"
            @touchstart="handleTouchStart($event, notification)"
            @touchmove="handleTouchMove($event, notification)"
            @touchend="handleTouchEnd($event, notification)"
            @mousedown="handleMouseDown($event, notification)"
          >
            <div class="flex items-start p-4">
              <div class="flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden mr-3 bg-white/10 flex items-center justify-center">
                <img
                  v-if="getAppIcon(notification)"
                  :src="getAppIcon(notification)"
                  :alt="notification.app"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full bg-blue-500 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-white text-sm font-semibold truncate">
                    {{ notification.title }}
                  </div>
                  <div class="text-gray-400 text-xs font-mono ml-2 flex-shrink-0">
                    {{ formatNotificationTime(notification) }}
                  </div>
                </div>
                
                <div class="text-gray-300 text-sm leading-relaxed"
                     :class="expandedNotification === notification.id ? '' : 'line-clamp-2'">
                  {{ notification.message }}
                </div>

                <div v-if="expandedNotification === notification.id && notification.additionalInfo" 
                     class="mt-3 pt-3 border-t border-white/10">
                  <div class="text-gray-400 text-xs">
                    {{ notification.additionalInfo }}
                  </div>
                </div>

                <div v-if="expandedNotification === notification.id" 
                     class="flex items-center gap-3 mt-3">
                  <button
                    @click.stop="$emit('tap-notification', notification)"
                    class="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
                  >
                    {{ t('common.open') }}
                  </button>
                  <button
                    @click.stop="dismissNotification(notification)"
                    class="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {{ t('notifications.dismiss') }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="draggedNotification === notification.id && Math.abs(dragOffset) > 20"
                 class="absolute inset-y-0 flex items-center text-white/60"
                 :class="dragOffset > 0 ? 'right-4' : 'left-4'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="dragOffset > 0" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </div>
        </transition-group>

        <div v-if="stackedCount > 0"
             class="relative mt-20 text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white/70 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            {{ stackedCount }} {{ t('notifications.more') }}
          </div>
        </div>
      </div>

      <div v-if="visibleNotifications.length > 1" class="mt-6">
        <button
          @click="clearAllNotifications"
          class="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-white/20 text-sm transition-colors"
        >
          {{ t('notifications.clearAll') }}
        </button>
      </div>
    </div>
  `
};

window.LockscreenNotifications = LockscreenNotifications;
