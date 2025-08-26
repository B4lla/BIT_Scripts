const DraggableAppGrid = {
  name: "DraggableAppGrid",
  props: {
    systemApps: { type: Array, required: true },
    allApps: { type: Array, required: true },
    isEditMode: { type: Boolean, required: true },
    currentPage: { type: Number, default: 0 },
    pageIndex: { type: Number, required: true }, 
    t: { type: Function, required: true },
    openFolderId: { type: String, default: null },
    widgets: { type: Array, default: () => [] },
    weatherData: { type: Object, required: true },
    batteryLevel: { type: Number, required: true },
    photos: { type: Array, required: true },
    musicState: { type: Object, required: false }
  },
  emits: [
    "update:layout", "update:folders", "open-app", "request-edit-mode", "update-folder", "request-open", "close-folder", "update-widgets", "request-open-widget-manager", "remove-widget", "update-widget", "request-next-page", "request-prev-page", "swipe-start", "swipe-move", "swipe-end", "drag-start", "drag-end"
  ],
  components: {
    Folder, WeatherWidget, ClockWidget, BatteryWidget, PhotosWidget, CalendarWidget, MusicWidget, NotesWidget
  },

  data() {
    return {
      draggedItem: null,
      dragOverItem: null,
      folderCreationTimeout: null,
      folderCandidateId: null,
      isFolderCreationCandidate: false,
      longPressTimer: null,
      swipeStartX: 0,
      isSwiping: false,
      isManualDragging: false,
      dragStartPos: { x: 0, y: 0 },
      dragCurrentPos: { x: 0, y: 0 },
      ghostElement: null,
      originalElement: null,
    };
  },

  computed: {
    gridItems() {
      const pageLayout = this.systemApps[this.pageIndex] || Array(24).fill(null);
      const pageWidgets = this.widgets.filter(w => w.page === this.currentPage);
      const gridArray = [...pageLayout];
      pageWidgets.forEach(widget => {
        const startIndex = this.getGridIndex(widget.row, widget.col);
        this.placeWidgetInGrid(widget, startIndex, gridArray);
      });
      return gridArray;
    },
  },

  methods: {
    getGridIndex(row, col) { return row * 4 + col; },
    getRowCol(index) { return { row: Math.floor(index / 4), col: index % 4 }; },
    getWidgetSize(size) { const s={'1x1':{w:1,h:1},'2x1':{w:2,h:1},'2x2':{w:2,h:2},'4x2':{w:4,h:2}}; return s[size]||{w:1,h:1}; },
    placeWidgetInGrid(widget, startIndex, gridArray) {
      const { row, col } = this.getRowCol(startIndex);
      const size = this.getWidgetSize(widget.size);
      for (let r = 0; r < size.height; r++) {
        for (let c = 0; c < size.width; c++) {
          const cellIndex = (row + r) * 4 + (col + c);
          gridArray[cellIndex] = { ...widget, isWidgetCell: true, isMainCell: r === 0 && c === 0 };
        }
      }
    },
    getWidgetProps(widget) {
      const baseProps = { t: this.t, size: widget.size, weatherData: this.weatherData, batteryLevel: this.batteryLevel, photos: this.photos };
      if (widget.component === 'MusicWidget') return { ...baseProps, musicState: this.$props.musicState };
      return baseProps;
    },

    handleBackgroundMouseDown(event) {
        if (this.isEditMode || (event.button && event.button !== 0)) return;
        this.isSwiping = true;
        this.swipeStartX = event.clientX;
        this.$emit('swipe-start', event.clientX);
    },
    handleBackgroundMouseMove(event) {
        if (this.isSwiping && !this.isManualDragging) this.$emit('swipe-move', { translateX: event.clientX - this.swipeStartX });
    },
    handleBackgroundMouseUp(event) {
        if (this.isSwiping && !this.isManualDragging) {
            this.$emit('swipe-end', { translateX: event.clientX - this.swipeStartX });
            this.isSwiping = false;
        }
    },
    
    handleItemMouseDown(event, item, pageIndex, itemIndex) {
      if (event.button && event.button !== 0) return;

      if (this.isEditMode) {
        this.draggedItem = { item, pageIndex, itemIndex };
        this.isManualDragging = true;
        
        const clientX = event.clientX || event.touches[0].clientX;
        const clientY = event.clientY || event.touches[0].clientY;
        this.dragStartPos = { x: clientX, y: clientY };
        this.dragCurrentPos = { x: clientX, y: clientY };
        
        this.originalElement = event.currentTarget;
        setTimeout(() => {
            if(this.isManualDragging) this.originalElement.classList.add('dragging');
        }, 50);

        this.createGhostElement(this.originalElement);
        this.updateGhostPosition(event);

        document.addEventListener('mousemove', this.handleDragMove);
        document.addEventListener('mouseup', this.handleDragEnd);
        document.addEventListener('touchmove', this.handleDragMove, { passive: false });
        document.addEventListener('touchend', this.handleDragEnd);
        
        this.$emit('drag-start');

      } else {
        this.clearLongPressTimer();
        this.longPressTimer = setTimeout(() => {
          if (!this.isSwiping) { 
             this.$emit("request-edit-mode", true);
          }
        }, 700);
      }
    },

    clearLongPressTimer() {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    },

    handleDragMove(event) {
      if (!this.isManualDragging) return;
      event.preventDefault();

      this.updateGhostPosition(event);

      this.ghostElement.style.display = 'none';
      const elementBelow = document.elementFromPoint(this.dragCurrentPos.x, this.dragCurrentPos.y);
      this.ghostElement.style.display = '';

      const dropZone = elementBelow ? elementBelow.closest('.drop-zone') : null;
      
      document.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active'));
      this.clearFolderCreationTimer();

      if (dropZone) {
        dropZone.classList.add('drag-over-active');
        const allZones = Array.from(this.$el.querySelectorAll('.drop-zone'));
        const index = allZones.indexOf(dropZone);
        
        if (index > -1) {
            const targetItem = this.gridItems[index];
            this.dragOverItem = { item: targetItem, pageIndex: this.currentPage, itemIndex: index };

            if (this.draggedItem.item?.type === 'app' && targetItem?.type === 'app' && this.draggedItem.item.id !== targetItem.id) {
              if (this.folderCandidateId !== targetItem.id) {
                this.folderCandidateId = targetItem.id;
                this.folderCreationTimeout = setTimeout(() => {
                  if (this.folderCandidateId === targetItem.id) this.isFolderCreationCandidate = true;
                }, 800);
              }
            }
        }
      } else {
        this.dragOverItem = null;
      }
    },
    
    handleDragEnd() {
      if (!this.isManualDragging) return;

      if (this.dragOverItem) {
        const source = this.draggedItem;
        const target = this.dragOverItem;

        if (source.item.id !== target.item?.id) {
            if (this.isFolderCreationCandidate && source.item.type === 'app' && target.item?.type === 'app') {
              this.$emit('update:folders', { sourceApp: source.item, targetApp: target.item, targetPageIndex: target.pageIndex, targetItemIndex: target.itemIndex });
            } else if (target.item?.type === 'folder' && source.item.type === 'app') {
              this.$emit('update-folder', { ...target.item, apps: [...(target.item.apps || []), source.item.id] });
              this.$emit('update:layout', { source, target: { item: null, pageIndex: source.pageIndex, itemIndex: source.itemIndex } });
            } else {
              this.$emit('update:layout', { source, target });
            }
        }
      }
      this.cleanupDragState();
    },

    cleanupDragState() {
      if (this.originalElement) this.originalElement.classList.remove('dragging');
      this.removeGhostElement();
      
      document.removeEventListener('mousemove', this.handleDragMove);
      document.removeEventListener('mouseup', this.handleDragEnd);
      document.removeEventListener('touchmove', this.handleDragMove);
      document.removeEventListener('touchend', this.handleDragEnd);
      
      
      document.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active'));
      document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
      
      
      this.isManualDragging = false;
      this.isSwiping = false;
      this.draggedItem = null;
      this.dragOverItem = null;
      this.originalElement = null;
      this.ghostElement = null;
      
      
      this.clearFolderCreationTimer();
      this.clearLongPressTimer();
      
      this.$emit('drag-end');
    },
    
    createGhostElement(originalEl) {
      if(this.ghostElement) this.ghostElement.remove();
      this.ghostElement = originalEl.cloneNode(true);
      this.ghostElement.classList.remove('dragging'); 
      this.ghostElement.classList.add('drag-ghost');
      document.body.appendChild(this.ghostElement);
    },
    removeGhostElement() {
      if (this.ghostElement) {
        this.ghostElement.remove();
        this.ghostElement = null;
      }
    },
    updateGhostPosition(event) {
        if (!this.ghostElement) return;
        this.dragCurrentPos.x = event.clientX || event.touches[0].clientX;
        this.dragCurrentPos.y = event.clientY || event.touches[0].clientY;
        this.ghostElement.style.left = `${this.dragCurrentPos.x}px`;
        this.ghostElement.style.top = `${this.dragCurrentPos.y}px`;
    },

    clearFolderCreationTimer() {
        clearTimeout(this.folderCreationTimeout);
        this.folderCreationTimeout = null;
        this.folderCandidateId = null;
        this.isFolderCreationCandidate = false;
    },
    
    openApp(app) { 
      
      if (!this.isEditMode && (!this.isManualDragging || (!this.draggedItem && !this.originalElement))) {
        
        if (this.isManualDragging) {
          this.cleanupDragState();
        }
        this.$emit('open-app', app);
      }
    },
    removeWidget(widget) { this.$emit('remove-widget', widget.id); },
  },

  watch: {
    isEditMode(newVal, oldVal) {
      
      if (oldVal === true && newVal === false) {
        this.cleanupDragState();
      }
    }
  },

  template: `
    <div class="absolute top-12 bottom-48 w-full px-6 pt-10" 
         @mousedown="handleBackgroundMouseDown" @mouseup="handleBackgroundMouseUp" @mouseleave="handleBackgroundMouseUp" 
         @mousemove="handleBackgroundMouseMove" @touchstart.passive="handleBackgroundMouseDown" @touchend.passive="handleBackgroundMouseUp">
      <div class="grid grid-cols-4 grid-rows-5 gap-y-0 gap-x-4 h-full">
  <template v-for="(item, index) in gridItems" :key="item ? item.id + '-' + index : 'empty-' + pageIndex + '-' + index">
          
          <div v-if="!item || !item.isWidgetCell || item.isMainCell" class="relative flex flex-col items-center justify-start drop-zone transition-transform duration-150"
               :class="{
                 'col-span-1': !item || getWidgetSize(item.size).w === 1, 'col-span-2': item && getWidgetSize(item.size).w === 2, 'col-span-4': item && getWidgetSize(item.size).w === 4,
                 'row-span-1': !item || getWidgetSize(item.size).h === 1, 'row-span-2': item && getWidgetSize(item.size).h === 2
               }" style="min-height: 80px;">
            
            <div v-if="item && item.type === 'widget'" class="relative w-full h-full draggable-item" 
                 @mousedown.stop="handleItemMouseDown($event, item, currentPage, index)" 
                 @mouseup.stop="clearLongPressTimer" @mouseleave="clearLongPressTimer"
                 @touchstart.stop="handleItemMouseDown($event, item, currentPage, index)" 
                 @touchend.stop="clearLongPressTimer">
              
            </div>
            
            <div v-else-if="item && item.type === 'app'" class="app-icon cursor-pointer flex flex-col items-center gap-2 select-none draggable-item" 
                 :class="{ 'animate-wiggle': isEditMode }"
                 @mousedown.stop="handleItemMouseDown($event, item, currentPage, index)"
                 @mouseup.stop="clearLongPressTimer" @mouseleave="clearLongPressTimer"
                 @touchstart.stop="handleItemMouseDown($event, item, currentPage, index)"
                 @touchend.stop="clearLongPressTimer"
                 @click.stop="openApp(item)">
              <div class="relative pointer-events-none">
                <div class="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                  <img :src="'./assets/icons/apps/' + item.id + '.svg'" :alt="item.name" class="w-full h-full" draggable="false"/>
                </div>
                <div v-if="isFolderCreationCandidate && folderCandidateId === item.id" class="absolute inset-0 bg-blue-500/40 rounded-2xl border-2 border-blue-400 animate-pulse backdrop-blur-sm">
                  <svg xmlns='http://www.w3.org/2000/svg' class='w-8 h-8 text-white drop-shadow-lg' fill='none' viewBox='0 0 24 24' stroke='currentColor' stroke-width='3'><path stroke-linecap='round' stroke-linejoin='round' d='M12 4v16m8-8H4'/></svg>
                </div>
              </div>
              <span class="text-white text-xs font-medium text-center truncate w-16 pointer-events-none">{{ item.name }}</span>
            </div>
            
            <Folder v-else-if="item && item.type === 'folder'"
              :folder="item" :all-apps="allApps" :position="{ row: Math.floor(index / 4), col: index % 4 }"
              :t="t" :is-open="item.id === openFolderId"
              @request-open="$emit('request-open', item.id)" @close-folder="$emit('close-folder')" @open-app="openApp" @update-folder="$emit('update-folder', $event)"
              :class="{ 'animate-wiggle': isEditMode, 'draggable-item': true }"
              @mousedown.stop="handleItemMouseDown($event, item, currentPage, index)"
              @mouseup.stop="clearLongPressTimer" @mouseleave="clearLongPressTimer"
              @touchstart.stop="handleItemMouseDown($event, item, currentPage, index)"
              @touchend.stop="clearLongPressTimer"
            />
            
            <div v-else-if="!item && isEditMode" @click.stop="$emit('request-open-widget-manager')" class="w-full h-full border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10">
              <span class="text-white/40 text-2xl pointer-events-none">+</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  `
};