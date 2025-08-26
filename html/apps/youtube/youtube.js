const YouTube = {
  name: 'YouTube',
  props: [
    "userSettings",
    "wallpapers",
    "currentWallpaper",
    "photos",
    "weatherData",
    "t",
  ],
  emits: [
    "close",
    "orientationChange",
    "update-setting",
    "change-wallpaper",
    "take-photo",
    "delete-photo",
    "playTrack",
    "pauseMusic",
    "resumeMusic",
    "stopMusic",
    "setMusicProgress",
    "setMusicVolume",
    "setPlaylist",
  ],
  setup(props, { emit }) {
    const { ref, reactive, computed, onMounted, onUnmounted, watch } = Vue;
    
    const currentView = ref("home");
    const searchQuery = ref("");
    const isSearching = ref(false);
    const selectedVideo = ref(null);
    const isPlaying = ref(false);
    const isFullscreen = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const volume = ref(80);
    const isMuted = ref(false);
    const showControls = ref(true);
    const isLoading = ref(false);
    const playbackSpeed = ref(1);
    const quality = ref("720p");
    const videoElement = ref(null);

    
    const categories = ref([
      { id: "all", name: props.t('youtube.categories.all', 'Todo'), active: true },
      { id: "music", name: props.t('youtube.categories.music', 'Música'), active: false },
      { id: "gaming", name: props.t('youtube.categories.gaming', 'Gaming'), active: false },
      { id: "news", name: props.t('youtube.categories.news', 'Noticias'), active: false },
      { id: "sports", name: props.t('youtube.categories.sports', 'Deportes'), active: false },
      { id: "tech", name: props.t('youtube.categories.tech', 'Tecnología'), active: false },
      { id: "entertainment", name: props.t('youtube.categories.entertainment', 'Entretenimiento'), active: false },
    ]);

    
    const videos = ref([
      {
        id: "1",
        title: "Amazing Nature Documentary 4K",
        channel: "NatureHD",
        channelAvatar: "https:",
        views: "2.5M",
        uploadTime: "hace 3 días",
        duration: "10:45",
        thumbnail:
          "https:",
        category: "entertainment",
        verified: true,
        description:
          "Explora la belleza natural del mundo en esta increíble documentación en 4K.",
        subscribers: "1.2M",
        likes: "45K",
        dislikes: "892",
        videoUrl:
          "https:",
      },
      {
        id: "2",
        title: "Top 10 Programming Languages 2024",
        channel: "CodeMaster",
        channelAvatar: "https:",
        views: "890K",
        uploadTime: "hace 1 semana",
        duration: "15:32",
        thumbnail:
          "https:",
        category: "tech",
        verified: true,
        description:
          "Descubre los lenguajes de programación más demandados este año.",
        subscribers: "850K",
        likes: "32K",
        dislikes: "234",
        videoUrl:
          "https:",
      },
      {
        id: "3",
        title: "Epic Gaming Montage - Best Moments",
        channel: "GameClips",
        channelAvatar: "https:",
        views: "1.8M",
        uploadTime: "hace 2 días",
        duration: "8:21",
        thumbnail:
          "https:",
        category: "gaming",
        verified: false,
        description:
          "Los mejores momentos gaming compilados en un épico montaje.",
        subscribers: "500K",
        likes: "67K",
        dislikes: "1.2K",
        videoUrl:
          "https:",
      },
      {
        id: "4",
        title: "Relaxing Jazz Music for Study",
        channel: "JazzVibes",
        channelAvatar: "https:",
        views: "3.2M",
        uploadTime: "hace 5 días",
        duration: "2:14:33",
        thumbnail:
          "https:",
        category: "music",
        verified: true,
        description:
          "Música jazz relajante perfecta para estudiar y concentrarse.",
        subscribers: "2.1M",
        likes: "89K",
        dislikes: "445",
        videoUrl:
          "https:",
      },
      {
        id: "5",
        title: "Breaking: Tech News Update",
        channel: "TechNews24",
        channelAvatar: "https:",
        views: "456K",
        uploadTime: "hace 6 horas",
        duration: "12:08",
        thumbnail:
          "https:",
        category: "news",
        verified: true,
        description:
          "Las últimas noticias del mundo tecnológico que no puedes perderte.",
        subscribers: "750K",
        likes: "28K",
        dislikes: "156",
        videoUrl:
          "https:",
      },
      {
        id: "6",
        title: "Football Highlights - Champions League",
        channel: "SportCenter",
        channelAvatar: "https:",
        views: "2.1M",
        uploadTime: "hace 1 día",
        duration: "18:45",
        thumbnail:
          "https:",
        category: "sports",
        verified: true,
        description:
          "Los mejores momentos de la Champions League en este resumen.",
        subscribers: "3.5M",
        likes: "125K",
        dislikes: "987",
        videoUrl:
          "https:",
      },
    ]);

    const searchResults = ref([]);
    const history = ref([]);
    const playlists = ref([]);
    const subscriptions = ref([]);

    
    let controlsTimeout = null;
    let progressUpdateInterval = null;

    
    const filteredVideos = computed(() => {
      const activeCategory = categories.value.find((cat) => cat.active);
      if (activeCategory.id === "all") {
        return videos.value;
      }
      return videos.value.filter(
        (video) => video.category === activeCategory.id
      );
    });

    const currentVideos = computed(() => {
      return currentView.value === "search"
        ? searchResults.value
        : filteredVideos.value;
    });

    const progressPercentage = computed(() => {
      return duration.value > 0
        ? (currentTime.value / duration.value) * 100
        : 0;
    });

    const formattedCurrentTime = computed(() => {
      return formatTime(currentTime.value);
    });

    const formattedDuration = computed(() => {
      return formatTime(duration.value);
    });

    
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return mins + ':' + secs.toString().padStart(2, "0");
    };

    const setActiveCategory = (categoryId) => {
      categories.value.forEach((cat) => {
        cat.active = cat.id === categoryId;
      });
    };

    const searchVideos = async () => {
      if (!searchQuery.value.trim()) return;

      isSearching.value = true;
      currentView.value = "search";

      
      setTimeout(() => {
        searchResults.value = videos.value.filter(
          (video) =>
            video.title
              .toLowerCase()
              .includes(searchQuery.value.toLowerCase()) ||
            video.channel
              .toLowerCase()
              .includes(searchQuery.value.toLowerCase())
        );
        isSearching.value = false;
      }, 1000);
    };

    const selectVideo = (video) => {
      try {
        if (!video) {
          console.error("No video provided to selectVideo");
          return;
        }

        selectedVideo.value = video;
        currentView.value = "player";
        currentTime.value = 0;
        duration.value = Math.floor(Math.random() * 1800) + 300; 

        
        const existingIndex = history.value.findIndex((h) => h.id === video.id);
        if (existingIndex >= 0) {
          history.value.splice(existingIndex, 1);
        }
        history.value.unshift({ ...video, watchedAt: new Date() });
        if (history.value.length > 50) {
          history.value = history.value.slice(0, 50);
        }
      } catch (error) {
        console.error("Error selecting video:", error);
      }
    };

    const togglePlay = () => {
      if (!videoElement.value) return;

      if (isPlaying.value) {
        videoElement.value.pause();
      } else {
        videoElement.value.play().catch((err) => {
          console.error("Error al reproducir video:", err);
          
          isPlaying.value = true;
          showPlayerControls();
          startProgressUpdate();
        });
      }
    };

    
    const onVideoLoaded = () => {
      if (videoElement.value) {
        duration.value = videoElement.value.duration;
        videoElement.value.volume = volume.value / 100;
      }
    };

    const onTimeUpdate = () => {
      if (videoElement.value) {
        currentTime.value = videoElement.value.currentTime;
      }
    };

    const onVideoEnded = () => {
      isPlaying.value = false;
      currentTime.value = 0;
      if (videoElement.value) {
        videoElement.value.currentTime = 0;
      }
    };

    const onPlay = () => {
      isPlaying.value = true;
      showPlayerControls();
      startProgressUpdate();
    };

    const onPause = () => {
      isPlaying.value = false;
      stopProgressUpdate();
    };

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value;

      if (isFullscreen.value) {
        
        emit("orientationChange", "landscape");

        
        const playerElement = document.querySelector(".video-player");
        if (playerElement) {
          playerElement.style.transform = "rotate(90deg) scale(1.2)";
          playerElement.style.transformOrigin = "center";
          playerElement.style.transition = "transform 0.5s ease-in-out";
        }
      } else {
        emit("orientationChange", "portrait");

        const playerElement = document.querySelector(".video-player");
        if (playerElement) {
          playerElement.style.transform = "none";
        }
      }

      showPlayerControls();
    };

    const seekTo = (percentage) => {
      if (videoElement.value && duration.value > 0) {
        const newTime = (percentage / 100) * duration.value;
        videoElement.value.currentTime = newTime;
        currentTime.value = newTime;
      }
      showPlayerControls();
    };

    const changeVolume = (newVolume) => {
      volume.value = Math.max(0, Math.min(100, newVolume));
      isMuted.value = volume.value === 0;
      if (videoElement.value) {
        videoElement.value.volume = volume.value / 100;
        videoElement.value.muted = isMuted.value;
      }
    };

    const toggleMute = () => {
      isMuted.value = !isMuted.value;
      if (videoElement.value) {
        videoElement.value.muted = isMuted.value;
      }
      showPlayerControls();
    };

    const changePlaybackSpeed = (speed) => {
      playbackSpeed.value = speed;
      if (videoElement.value) {
        videoElement.value.playbackRate = speed;
      }
      showPlayerControls();
    };

    const changeQuality = (newQuality) => {
      quality.value = newQuality;
      showPlayerControls();
    };

    const showPlayerControls = () => {
      showControls.value = true;
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => {
        if (isPlaying.value) {
          showControls.value = false;
        }
      }, 3000);
    };

    const hidePlayerControls = () => {
      if (!isPlaying.value) return;
      showControls.value = false;
    };

    const startProgressUpdate = () => {
      progressUpdateInterval = setInterval(() => {
        if (currentTime.value < duration.value) {
          currentTime.value += playbackSpeed.value;
        } else {
          
          isPlaying.value = false;
          currentTime.value = 0;
          stopProgressUpdate();
        }
      }, 1000);
    };

    const stopProgressUpdate = () => {
      if (progressUpdateInterval) {
        clearInterval(progressUpdateInterval);
        progressUpdateInterval = null;
      }
    };

    const goHome = () => {
      currentView.value = "home";
      searchQuery.value = "";
      searchResults.value = [];
    };

    const goBack = () => {
      if (currentView.value === "player") {
        currentView.value = history.value.length > 0 ? "home" : "home";
        selectedVideo.value = null;
        isPlaying.value = false;
        isFullscreen.value = false;
        stopProgressUpdate();

        
        emit("orientationChange", "portrait");
      } else if (currentView.value === "search") {
        goHome();
      }
    };

    const likeVideo = () => {
      if (selectedVideo.value) {
        
        showPlayerControls();
      }
    };

    const dislikeVideo = () => {
      if (selectedVideo.value) {
        
        showPlayerControls();
      }
    };

    const shareVideo = () => {
      if (selectedVideo.value) {
        
        showPlayerControls();
      }
    };

    const subscribeToChannel = () => {
      if (selectedVideo.value) {
        
        showPlayerControls();
      }
    };

    
    watch(currentView, (newView) => {
      if (newView !== "player") {
        stopProgressUpdate();
      }
    });

    
    onMounted(() => {
      
      try {
        
        if (!categories.value.some((cat) => cat.active)) {
          categories.value[0].active = true;
        }

      } catch (error) {
        console.error(error);
      }
    });

    onUnmounted(() => {
      stopProgressUpdate();
      clearTimeout(controlsTimeout);
      
      emit("orientationChange", "portrait");
    });

    return {
      
      currentView,
      searchQuery,
      isSearching,
      selectedVideo,
      isPlaying,
      isFullscreen,
      currentTime,
      duration,
      volume,
      isMuted,
      showControls,
      isLoading,
      playbackSpeed,
      quality,
      videoElement,

      
      categories,
      videos,
      searchResults,
      history,
      filteredVideos,
      currentVideos,

      
      progressPercentage,
      formattedCurrentTime,
      formattedDuration,

      
      setActiveCategory,
      searchVideos,
      selectVideo,
      togglePlay,
      toggleFullscreen,
      seekTo,
      changeVolume,
      toggleMute,
      changePlaybackSpeed,
      changeQuality,
      showPlayerControls,
      hidePlayerControls,
      goHome,
      goBack,
      likeVideo,
      dislikeVideo,
      shareVideo,
      subscribeToChannel,
      formatTime,
      onVideoLoaded,
      onTimeUpdate,
      onVideoEnded,
      onPlay,
      onPause,
    };
  },
  template: `
        <div class="youtube-app h-full w-full flex flex-col transition-all duration-300"
             :class="[
                userSettings.darkMode ? 'bg-black text-white' : 'bg-white text-gray-900',
                isFullscreen ? 'fixed inset-0 z-50' : ''
             ]">

            
            <header v-if="!isFullscreen" class="flex items-center justify-between p-4 pt-16 border-b transition-colors duration-300"
                    :class="userSettings.darkMode ? 'border-gray-800 bg-black/95' : 'border-gray-200 bg-white/95'">
                <div class="flex items-center space-x-3">
                    <button @click="goBack" v-if="currentView !== 'home'" 
                            class="p-2 rounded-lg transition-colors duration-300"
                            :class="userSettings.darkMode ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-700'">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                        </div>
                        <h1 class="text-xl font-bold">YouTube</h1>
                    </div>
                </div>
                
                <div class="flex items-center space-x-2">
                    <button @click="$emit('close')" 
                            class="p-2 rounded-lg transition-colors duration-300"
                            :class="userSettings.darkMode ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-700'">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </header>

            
            <div v-if="!isFullscreen && currentView !== 'player'" class="p-4 border-b transition-colors duration-300"
                 :class="userSettings.darkMode ? 'border-gray-800' : 'border-gray-200'">
                <div class="relative">
                    <input v-model="searchQuery" 
                           @keyup.enter="searchVideos"
                           type="text" 
                           placeholder="Buscar en YouTube..."
                           class="w-full pl-12 pr-4 py-3 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2"
                           :class="userSettings.darkMode 
                             ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-red-500 focus:border-red-500' 
                             : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-red-500 focus:border-red-500'">
                    <button @click="searchVideos" 
                            class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            
            <div v-if="!isFullscreen && currentView === 'home'" class="p-4 border-b transition-colors duration-300"
                 :class="userSettings.darkMode ? 'border-gray-800' : 'border-gray-200'">
                <div class="flex space-x-3 overflow-x-auto scrollbar-hide">
                    <button v-for="category in categories" 
                            :key="category.id"
                            @click="setActiveCategory(category.id)"
                            class="px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300"
                            :class="category.active 
                              ? 'bg-red-600 text-white' 
                              : (userSettings.darkMode 
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300')">
                        {{ category.name }}
                    </button>
                </div>
            </div>

            
            <main class="flex-1 overflow-hidden">
                
                <div v-if="currentView === 'home' || currentView === 'search'" 
                     class="h-full overflow-y-auto">
                    
                    
                    <div v-if="isSearching" class="flex items-center justify-center h-64">
                        <div class="flex flex-col items-center space-y-4">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                            <p :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">Buscando videos...</p>
                        </div>
                    </div>

                    
                    <div v-else class="p-4 space-y-4">
                        <div v-for="video in currentVideos" 
                             :key="video.id"
                             @click="selectVideo(video)"
                             class="rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                             :class="userSettings.darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50 shadow-sm'">
                            
                            
                            <div class="relative">
                                <img :src="video.thumbnail" 
                                     :alt="video.title"
                                     class="w-full h-48 object-cover">
                                <div class="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                    {{ video.duration }}
                                </div>
                            </div>
                            
                            
                            <div class="p-4">
                                <div class="flex space-x-3">
                                    <img :src="video.channelAvatar" 
                                         :alt="video.channel"
                                         class="w-10 h-10 rounded-full">
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-semibold text-sm line-clamp-2 mb-1"
                                            :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                                            {{ video.title }}
                                        </h3>
                                        <div class="flex items-center space-x-1 mb-1">
                                            <p class="text-sm"
                                               :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                                                {{ video.channel }}
                                            </p>
                                            <svg v-if="video.verified" class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                            </svg>
                                        </div>
                                        <p class="text-xs"
                                           :class="userSettings.darkMode ? 'text-gray-500' : 'text-gray-500'">
                                            {{ video.views }} visualizaciones • {{ video.uploadTime }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        
                        <div v-if="currentView === 'search' && currentVideos.length === 0 && !isSearching"
                             class="text-center py-20">
                            <svg class="w-16 h-16 mx-auto mb-4"
                                 :class="userSettings.darkMode ? 'text-gray-600' : 'text-gray-400'"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <h3 class="text-lg font-semibold mb-2"
                                :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                                No se encontraron resultados
                            </h3>
                            <p :class="userSettings.darkMode ? 'text-gray-500' : 'text-gray-500'">
                                Intenta con otros términos de búsqueda
                            </p>
                        </div>
                    </div>
                </div>

                
                <div v-if="currentView === 'player' && selectedVideo" 
                     class="h-full flex flex-col"
                     :class="isFullscreen ? 'bg-black' : ''">
                    
                    
                    <div class="relative video-player"
                         :class="[
                           isFullscreen ? 'h-screen w-screen landscape-mode' : 'h-64'
                         ]"
                         @click="showPlayerControls"
                         @touchstart="showPlayerControls">
                        
                        
                        <video v-if="selectedVideo" 
                               ref="videoElement"
                               class="w-full h-full object-cover bg-black"
                               :poster="selectedVideo.thumbnail"
                               @loadedmetadata="onVideoLoaded"
                               @timeupdate="onTimeUpdate"
                               @ended="onVideoEnded"
                               @play="onPlay"
                               @pause="onPause"
                               :muted="isMuted"
                               preload="metadata">
                            <source :src="selectedVideo.videoUrl" type="video/mp4">
                            Tu navegador no soporta el elemento video.
                        </video>
                        
                        
                        <button v-if="!isPlaying" 
                                @click="togglePlay"
                                class="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300">
                            <div class="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                                <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                        </button>
                            
                            
                            <div v-if="showControls" 
                                 class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 flex flex-col justify-between transition-opacity duration-300">
                                
                                
                                <div class="p-4 flex justify-between items-start">
                                    <button @click="goBack" 
                                            class="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                        </svg>
                                    </button>
                                    
                                    <div class="flex space-x-2">
                                        
                                        <select v-model="quality" 
                                                class="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm">
                                            <option value="1080p">1080p</option>
                                            <option value="720p">720p</option>
                                            <option value="480p">480p</option>
                                            <option value="360p">360p</option>
                                        </select>
                                        
                                        
                                        <button @click="toggleFullscreen" 
                                                class="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path v-if="!isFullscreen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                                                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5m5.5 11v4.5M9 15H4.5M9 15l-5.5 5.5m11-5.5v4.5m0-4.5h4.5m0 0l-5.5 5.5m5.5-11V4.5m0 4.5h-4.5m4.5 0L20.5 3.5"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                
                                <div class="flex items-center justify-center space-x-8">
                                    
                                    <button @click="seekTo(Math.max(0, progressPercentage - 10))" 
                                            class="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                                        </svg>
                                    </button>
                                    
                                    
                                    <button @click="togglePlay" 
                                            class="p-4 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all transform hover:scale-110">
                                        <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                                            <path v-if="!isPlaying" d="M8 5v14l11-7z"/>
                                            <path v-else d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                        </svg>
                                    </button>
                                    
                                    
                                    <button @click="seekTo(Math.min(100, progressPercentage + 10))" 
                                            class="p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                                        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                                        </svg>
                                    </button>
                                </div>
                                
                                
                                <div class="p-4 space-y-4">
                                    
                                    <div class="flex items-center space-x-3 text-white text-sm">
                                        <span>{{ formattedCurrentTime }}</span>
                                        <div class="flex-1 h-2 bg-white/20 rounded-full cursor-pointer"
                                             @click="seekTo(($event.offsetX / $event.target.offsetWidth) * 100)">
                                            <div class="h-full bg-red-600 rounded-full transition-all duration-100"
                                                 :style="{ width: progressPercentage + '%' }"></div>
                                        </div>
                                        <span>{{ formattedDuration }}</span>
                                    </div>
                                    
                                    
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center space-x-4">
                                            
                                            <div class="flex items-center space-x-2">
                                                <button @click="toggleMute" class="text-white hover:text-red-500 transition-colors">
                                                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path v-if="!isMuted && volume > 50" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                                        <path v-else-if="!isMuted && volume > 0" d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                                                        <path v-else d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                                    </svg>
                                                </button>
                                                <div class="w-20 h-1 bg-white/20 rounded-full cursor-pointer"
                                                     @click="changeVolume(($event.offsetX / $event.target.offsetWidth) * 100)">
                                                    <div class="h-full bg-white rounded-full"
                                                         :style="{ width: (isMuted ? 0 : volume) + '%' }"></div>
                                                </div>
                                            </div>
                                            
                                            
                                            <select v-model="playbackSpeed" 
                                                    class="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm">
                                                <option value="0.25">0.25x</option>
                                                <option value="0.5">0.5x</option>
                                                <option value="0.75">0.75x</option>
                                                <option value="1">1x</option>
                                                <option value="1.25">1.25x</option>
                                                <option value="1.5">1.5x</option>
                                                <option value="2">2x</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    
                    <div v-if="!isFullscreen && selectedVideo" class="flex-1 overflow-y-auto p-4">
                        <div class="space-y-4">
                            
                            <div>
                                <h1 class="text-lg font-bold mb-2"
                                    :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                                    {{ selectedVideo.title }}
                                </h1>
                                <div class="flex items-center justify-between">
                                    <p class="text-sm"
                                       :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                                        {{ selectedVideo.views }} visualizaciones • {{ selectedVideo.uploadTime }}
                                    </p>
                                </div>
                            </div>
                            
                            
                            <div class="flex items-center space-x-4 overflow-x-auto">
                                <button @click="likeVideo" 
                                        class="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300"
                                        :class="userSettings.darkMode 
                                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                                    </svg>
                                    <span class="text-sm">{{ selectedVideo.likes }}</span>
                                </button>
                                
                                <button @click="dislikeVideo" 
                                        class="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300"
                                        :class="userSettings.darkMode 
                                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"/>
                                    </svg>
                                    <span class="text-sm">{{ selectedVideo.dislikes }}</span>
                                </button>
                                
                                <button @click="shareVideo" 
                                        class="flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300"
                                        :class="userSettings.darkMode 
                                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                                    </svg>
                                    <span class="text-sm">Compartir</span>
                                </button>
                            </div>
                            
                            
                            <div class="flex items-center justify-between p-4 rounded-xl transition-colors duration-300"
                                 :class="userSettings.darkMode ? 'bg-gray-900' : 'bg-gray-50'">
                                <div class="flex items-center space-x-3">
                                    <img :src="selectedVideo.channelAvatar" 
                                         :alt="selectedVideo.channel"
                                         class="w-12 h-12 rounded-full">
                                    <div>
                                        <div class="flex items-center space-x-2">
                                            <h3 class="font-semibold"
                                                :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                                                {{ selectedVideo.channel }}
                                            </h3>
                                            <svg v-if="selectedVideo.verified" class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                            </svg>
                                        </div>
                                        <p class="text-sm"
                                           :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                                            {{ selectedVideo.subscribers }} suscriptores
                                        </p>
                                    </div>
                                </div>
                                
                                <button @click="subscribeToChannel" 
                                        class="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-semibold">
                                    Suscribirse
                                </button>
                            </div>
                            
                            
                            <div class="p-4 rounded-xl transition-colors duration-300"
                                 :class="userSettings.darkMode ? 'bg-gray-900' : 'bg-gray-50'">
                                <p class="text-sm leading-relaxed"
                                   :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                                    {{ selectedVideo.description }}
                                </p>
                            </div>
                            
                            
                            <div class="space-y-4">
                                <h3 class="text-lg font-semibold"
                                    :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                                    Comentarios
                                </h3>
                                
                                
                                <div class="flex space-x-3">
                                    <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                        <span class="text-white text-sm font-bold">U</span>
                                    </div>
                                    <input type="text" 
                                           placeholder="Añadir un comentario..."
                                           class="flex-1 bg-transparent border-b pb-2 focus:outline-none transition-colors duration-300"
                                           :class="userSettings.darkMode 
                                             ? 'border-gray-700 text-white placeholder-gray-400 focus:border-red-500' 
                                             : 'border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500'">
                                </div>
                                
                                
                                <div class="space-y-4">
                                    <div class="flex space-x-3">
                                        <img src="https:
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-2 mb-1">
                                                <span class="font-semibold text-sm"
                                                      :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                                                    @usuario123
                                                </span>
                                                <span class="text-xs"
                                                      :class="userSettings.darkMode ? 'text-gray-500' : 'text-gray-500'">
                                                    hace 2 horas
                                                </span>
                                            </div>
                                            <p class="text-sm"
                                               :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                                                ¡Excelente video! Me encantó el contenido, muy informativo.
                                            </p>
                                            <div class="flex items-center space-x-4 mt-2">
                                                <button class="flex items-center space-x-1 text-xs"
                                                        :class="userSettings.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                                                    </svg>
                                                    <span>24</span>
                                                </button>
                                                <button class="text-xs"
                                                        :class="userSettings.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'">
                                                    Responder
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            
            <nav v-if="!isFullscreen && currentView !== 'player'" 
                 class="border-t backdrop-blur-md transition-all duration-300"
                 :class="userSettings.darkMode 
                   ? 'border-gray-800 bg-black/80' 
                   : 'border-gray-200 bg-white/80'">
                <div class="grid grid-cols-4 py-2">
                    <button @click="goHome" 
                            class="flex flex-col items-center py-2 transition-colors duration-300"
                            :class="currentView === 'home' 
                              ? 'text-red-600' 
                              : (userSettings.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700')">
                        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                        <span class="text-xs">Inicio</span>
                    </button>
                    
                    <button class="flex flex-col items-center py-2 transition-colors duration-300"
                            :class="userSettings.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'">
                        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"/>
                        </svg>
                        <span class="text-xs">Shorts</span>
                    </button>
                    
                    <button class="flex flex-col items-center py-2 transition-colors duration-300"
                            :class="userSettings.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'">
                        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span class="text-xs">Crear</span>
                    </button>
                    
                    <button class="flex flex-col items-center py-2 transition-colors duration-300"
                            :class="userSettings.darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'">
                        <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        <span class="text-xs">Biblioteca</span>
                    </button>
                </div>
            </nav>
        </div>
    `,
};
