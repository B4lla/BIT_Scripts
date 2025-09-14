

const MusicWidget = {
  name: 'MusicWidget',
  props: {
    t: { type: Function, required: true },
    size: { type: String, default: '4x2' },
    musicState: { type: Object, required: true }
  },
  emits: ["play-track", "pause-music", "resume-music", "stop-music", "set-music-progress", "set-music-volume", "set-playlist"],
  data() {
    return {
      isPlaying: false,
      currentSong: {
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        duration: '5:55',
        currentTime: '2:34'
      }
    };
  },
  computed: {
    widgetClasses() {
      const sizeClasses = {
        '4x2': 'col-span-4 row-span-2',
        '2x1': 'col-span-2 row-span-1'
      };
      return sizeClasses[this.size] + ' bg-gradient-to-br from-pink-400/20 to-purple-600/20 backdrop-blur-xl border border-white/20 rounded-3xl p-4 text-white shadow-xl';
    },
    
    progressPercentage() {
      if (!this.musicState.track) return 0;
      
      const [currentMin, currentSec] = (this.musicState.track.currentTime || '0:00').split(':').map(Number);
      const [totalMin, totalSec] = (this.musicState.track.duration || '0:01').split(':').map(Number);
      const currentTotal = currentMin * 60 + currentSec;
      const total = totalMin * 60 + totalSec;
      return (currentTotal / total) * 100;
    }
  },
  methods: {
    playPause() {
      if (this.musicState.isPlaying) {
        this.$emit('pause-music');
      } else if (this.musicState.track) {
        this.$emit('resume-music');
      } else {
        
        this.$emit('play-track', { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', duration: '5:55', currentTime: '0:00' });
      }
    },
    previousSong() {
      
    },
    nextSong() {
      
    }
  },
  template: `
    <div :class="widgetClasses">
      <div v-if="size === '4x2'" class="flex h-full gap-4">
        
        <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
          <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19V6l12-2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
        
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="text-sm font-medium truncate">{{ musicState.track ? musicState.track.title : 'Not Playing' }}</div>
            <div class="text-xs opacity-75 truncate">{{ musicState.track ? musicState.track.artist : '' }}</div>
          </div>
          
          <div class="my-2">
            <div class="w-full bg-white/20 rounded-full h-1">
              <div class="bg-white h-1 rounded-full transition-all duration-300" :style="{ width: progressPercentage + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs opacity-60 mt-1">
              <span>{{ musicState.track ? musicState.track.currentTime : '0:00' }}</span>
              <span>{{ musicState.track ? musicState.track.duration : '0:00' }}</span>
            </div>
          </div>
          
          <div class="flex items-center justify-center gap-6">
            <button @click="previousSong" class="text-lg opacity-75 hover:opacity-100 rounded-full focus:outline-none">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 48 48">
                <rect x="10" y="12" width="3.5" height="24" rx="1.7" fill="currentColor" stroke="none"/>
                <path d="M36 36Q36 38 34 37L18 25Q16 24 18 23L34 11Q36 10 36 12Z" fill="currentColor" stroke="currentColor"/>
              </svg>
            </button>
            <button @click="playPause" class="text-2xl rounded-full focus:outline-none">
              <svg v-if="musicState.isPlaying" class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 48 48">
                <rect x="13" y="10" width="8" height="28" rx="6" fill="currentColor" stroke="none"/>
                <rect x="27" y="10" width="8" height="28" rx="6" fill="currentColor" stroke="none"/>
              </svg>
              <svg v-else class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 48 48">
                <path d="M16 12Q16 10 18 11L38 23Q40 24 38 25L18 37Q16 38 16 36Z" fill="currentColor" stroke="currentColor"/>
              </svg>
            </button>
            <button @click="nextSong" class="text-lg opacity-75 hover:opacity-100 rounded-full focus:outline-none">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 48 48">
                <rect x="34.5" y="12" width="3.5" height="24" rx="1.7" fill="currentColor" stroke="none"/>
                <path d="M12 12Q12 10 14 11L30 23Q32 24 30 25L14 37Q12 38 12 36Z" fill="currentColor" stroke="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div v-else-if="size === '2x1'" class="flex items-center h-full gap-3">
        <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19V6l12-2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{{ musicState.track ? musicState.track.title : 'Not Playing' }}</div>
          <div class="text-xs opacity-75 truncate">{{ musicState.track ? musicState.track.artist : '' }}</div>
        </div>
        <button @click="playPause" class="text-xl rounded-full focus:outline-none">
          <svg v-if="musicState.isPlaying" class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 48 48">
            <rect x="13" y="10" width="8" height="28" rx="6" fill="currentColor" stroke="none"/>
            <rect x="27" y="10" width="8" height="28" rx="6" fill="currentColor" stroke="none"/>
          </svg>
          <svg v-else class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 48 48">
            <path d="M16 12Q16 10 18 11L38 23Q40 24 38 25L18 37Q16 38 16 36Z" fill="currentColor" stroke="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  `
};
window.MusicWidget = MusicWidget;