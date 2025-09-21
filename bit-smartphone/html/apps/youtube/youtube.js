const YouTube = {
	name: "Youtube",
	props: ["userSettings"],
	emits: ["close"],
	setup(props, { emit }) {
		const { ref, computed } = Vue;

		const searchQuery = ref("");
		const selectedVideo = ref(null);
		const isPlaying = ref(false);
		const isLoading = ref(false);
		const searchResults = ref([]);
		const nextPageToken = ref(null);
		const prevPageToken = ref(null);
		const hasError = ref(false);
		const errorMessage = ref("");

		const YOUTUBE_API_KEY = "AIzaSyClCJEgN8nBpplIq2d-FCmrpxZZKjyoPQE";
		const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

		const searchVideos = async (pageToken = null) => {
			if (!searchQuery.value.trim()) {
				searchResults.value = [];
				return;
			}

			isLoading.value = true;
			hasError.value = false;

			if (!pageToken) {
				searchResults.value = [];
			}

			try {
				const params = new URLSearchParams({
					part: "snippet,id",
					q: searchQuery.value,
					type: "video",
					key: YOUTUBE_API_KEY,
					maxResults: 10,
				});

				if (pageToken) {
					params.append("pageToken", pageToken);
				}

				const response = await fetch(`${YOUTUBE_API_URL}?${params}`);

				if (!response.ok) {
					throw new Error(`Error ${response.status}: ${response.statusText}`);
				}

				const data = await response.json();

				nextPageToken.value = data.nextPageToken || null;
				prevPageToken.value = data.prevPageToken || null;

				const processedVideos = data.items.map((item) => ({
					id: item.id.videoId,
					title: item.snippet.title,
					channel: item.snippet.channelTitle,
					description: item.snippet.description,
					thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
					publishedAt: item.snippet.publishedAt,
					videoId: item.id.videoId,
				}));

				if (pageToken) {
					searchResults.value = [...searchResults.value, ...processedVideos];
				} else {
					searchResults.value = processedVideos;
				}
			} catch (error) {
				console.error("Error searching YouTube:", error);
				hasError.value = true;
				errorMessage.value = "Error al buscar videos. Inténtalo de nuevo.";
			} finally {
				isLoading.value = false;
			}
		};

		const loadNextPage = () => {
			if (nextPageToken.value) {
				searchVideos(nextPageToken.value);
			}
		};

		const loadPrevPage = () => {
			if (prevPageToken.value) {
				searchVideos(prevPageToken.value);
			}
		};

		const selectVideo = (video) => {
			selectedVideo.value = video;
			isPlaying.value = false;
		};

		const togglePlay = () => {
			isPlaying.value = !isPlaying.value;
		};

		const goBack = () => {
			if (selectedVideo.value) {
				selectedVideo.value = null;
				isPlaying.value = false;
			} else {
				emit("close");
			}
		};

		const handleSearch = (event) => {
			event.preventDefault();
			searchVideos();
		};

		const clearResults = () => {
			searchResults.value = [];
			searchQuery.value = "";
			hasError.value = false;
		};

		return {
			searchQuery,
			selectedVideo,
			isPlaying,
			isLoading,
			searchResults,
			nextPageToken,
			prevPageToken,
			hasError,
			errorMessage,
			searchVideos,
			loadNextPage,
			loadPrevPage,
			selectVideo,
			togglePlay,
			goBack,
			handleSearch,
			clearResults,
		};
	},
	template: `
    <div class="youtube-app h-full w-full flex flex-col bg-gray-900 pt-12 text-white">
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <div class="flex items-center space-x-3">
          <button @click="goBack" class="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <h1 class="text-xl font-bold">Youtuf</h1>
        </div>
        <button v-if="searchResults.length > 0" @click="clearResults" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div v-if="!selectedVideo" class="p-4 border-b border-gray-700">
        <form @submit="handleSearch" class="relative">
          <input v-model="searchQuery" 
                 type="text" 
                 placeholder="Search on YouTube..."
                 class="w-full pl-12 pr-20 py-3 rounded-full bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent">
          <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <button type="submit" class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full transition-colors">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </form>
      </div>

      <div v-if="selectedVideo" class="flex-1 flex flex-col">
        <div class="relative bg-black aspect-video">
          <iframe :src="'https://www.youtube-nocookie.com/embed/' + selectedVideo.videoId + '?autoplay=' + (isPlaying ? '1' : '0')"
                  class="w-full h-full"
                  frameborder="0"
                  allowfullscreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
          </iframe>
          
          <div v-if="!isPlaying" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <button @click="togglePlay" 
                    class="w-16 h-16 bg-red-600 bg-opacity-90 hover:bg-opacity-100 transition-all rounded-full flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-4 flex-1 overflow-y-auto">
          <h2 class="text-lg font-bold mb-2 leading-tight">{{ selectedVideo.title }}</h2>
          
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-sm">{{ selectedVideo.channel.charAt(0) }}</span>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-white">{{ selectedVideo.channel }}</p>
              <p class="text-sm text-gray-400">{{ new Date(selectedVideo.publishedAt).toLocaleDateString() }}</p>
            </div>
            <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
              Suscribirse
            </button>
          </div>
          
          <div class="bg-gray-800 rounded-lg p-3 mb-3">
            <p class="text-sm text-gray-300 line-clamp-3">{{ selectedVideo.description || 'Sin descripción disponible.' }}</p>
          </div>
          
          <div class="flex items-center justify-around py-3 border-t border-gray-700">
            <button class="flex flex-col items-center space-y-1 text-gray-300 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
              </svg>
              <span class="text-xs">Me gusta</span>
            </button>
            
            <button class="flex flex-col items-center space-y-1 text-gray-300 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
              <span class="text-xs">Compartir</span>
            </button>
            
            <button class="flex flex-col items-center space-y-1 text-gray-300 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <span class="text-xs">Descargar</span>
            </button>
            
            <button class="flex flex-col items-center space-y-1 text-gray-300 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
              </svg>
              <span class="text-xs">Guardar</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="flex-1 overflow-y-auto">
        <div v-if="isLoading" class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p class="text-gray-400">Buscando videos...</p>
          </div>
        </div>
        
        <div v-else-if="hasError" class="flex flex-col items-center justify-center h-64 text-gray-400 p-4">
          <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-lg font-semibold mb-2">Error al buscar</p>
          <p class="text-sm text-center">{{ errorMessage }}</p>
          <button @click="searchVideos()" class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
            Reintentar
          </button>
        </div>
        
        <div v-else-if="searchResults.length === 0 && searchQuery.trim() === ''" class="flex flex-col items-center justify-center h-64 text-gray-400 p-4">
          <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <p class="text-lg font-semibold mb-2">Busca videos de YouTube</p>
          <p class="text-sm text-center">Escribe algo en la barra de búsqueda para encontrar videos</p>
        </div>
        
        <div v-else-if="searchResults.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400 p-4">
          <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
          <p class="text-lg font-semibold mb-2">No se encontraron videos</p>
          <p class="text-sm text-center">Intenta buscar con otros términos</p>
        </div>
        
        <div v-else class="p-4">
          <div class="space-y-4">
            <div v-for="video in searchResults" 
                 :key="video.id"
                 @click="selectVideo(video)"
                 class="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors">
              <div class="relative">
                <img :src="video.thumbnail" 
                     :alt="video.title"
                     class="w-full h-48 object-cover"
                     @error="$event.target.src = 'https://picsum.photos/320/180?random=' + Math.random()">
                <div class="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  <svg class="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Video
                </div>
              </div>
              <div class="p-3">
                <h3 class="font-semibold text-sm mb-2 line-clamp-2 leading-tight">{{ video.title }}</h3>
                <div class="flex items-center space-x-2">
                  <div class="w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex-shrink-0"></div>
                  <p class="text-gray-400 text-xs truncate">{{ video.channel }}</p>
                </div>
                <p class="text-gray-500 text-xs mt-1">{{ new Date(video.publishedAt).toLocaleDateString() }}</p>
              </div>
            </div>
          </div>
          
          <div v-if="nextPageToken || prevPageToken" class="flex justify-center space-x-4 mt-6 pb-4">
            <button v-if="prevPageToken" 
                    @click="loadPrevPage()"
                    :disabled="isLoading"
                    class="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors">
              Anterior
            </button>
            <button v-if="nextPageToken" 
                    @click="loadNextPage()"
                    :disabled="isLoading"
                    class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};

window.YouTube = YouTube;
window.YouTube = window.YouTube || YouTube;
