

const PhotosWidget = {
  name: 'PhotosWidget',
  props: {
    photos: { type: Array, required: true },
    t: { type: Function, required: true },
    size: { type: String, default: '2x2' }
  },
  computed: {
    widgetClasses() {
      const sizeClasses = {
        '2x2': 'col-span-2 row-span-2',
        '4x2': 'col-span-4 row-span-2'
      };
      return sizeClasses[this.size] + ' bg-gradient-to-br from-purple-400/20 to-pink-600/20 backdrop-blur-xl border border-white/20 rounded-3xl p-2 text-white shadow-xl overflow-hidden';
    },
    
    recentPhotos() {
      
      const defaultPhotos = [
        './assets/wallpapers/wallpaper1.webp',
        './assets/wallpapers/wallpaper2.webp',
        './assets/wallpapers/wallpaper3.webp',
        './assets/wallpapers/wallpaper4.webp'
      ];
      return this.photos.length > 0 ? this.photos.slice(-4) : defaultPhotos;
    }
  },
  template: `
    <div :class="widgetClasses">
      <div v-if="size === '2x2'" class="h-full flex flex-col">
        <div class="flex items-center justify-between p-2">
          <span class="text-sm font-medium opacity-90">Fotos</span>
          <span class="text-xs opacity-70">{{ recentPhotos.length }}</span>
        </div>
        <div class="flex-1 grid grid-cols-2 gap-1">
          <div v-for="(photo, index) in recentPhotos.slice(0, 4)" 
               :key="index"
               class="bg-cover bg-center rounded-xl overflow-hidden"
               :style="{ backgroundImage: 'url(' + photo + ')' }">
          </div>
        </div>
      </div>
      
      <div v-else-if="size === '4x2'" class="h-full flex flex-col">
        <div class="flex items-center justify-between p-2">
          <span class="text-sm font-medium opacity-90">Recuerdos</span>
          <span class="text-xs opacity-70">Ver todo</span>
        </div>
        <div class="flex-1 flex gap-1">
          <div class="flex-1 bg-cover bg-center rounded-xl overflow-hidden"
               :style="{ backgroundImage: 'url(' + recentPhotos[0] + ')' }">
          </div>
          <div class="flex-1 grid grid-cols-2 gap-1">
            <div v-for="(photo, index) in recentPhotos.slice(1, 4)" 
                 :key="index"
                 class="bg-cover bg-center rounded-lg overflow-hidden"
                 :style="{ backgroundImage: 'url(' + photo + ')' }">
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
window.PhotosWidget = PhotosWidget;