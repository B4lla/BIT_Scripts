const News = {
  emits: ["close", "updateSetting"],
  props: {
    translations: {
      type: Object,
      default: () => ({ home: 'Inicio' })
    },
    userSettings: {
      type: Object,
      default: () => ({ darkMode: true })
    },
    t: {
      type: [Object, Function],
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    const { ref, computed, nextTick, onMounted, watch, onUnmounted } = Vue;
    
    const currentView = ref('home') 
    const selectedNews = ref(null)
    const isEditor = ref(false) 
    const searchQuery = ref("")
    const showCreateModal = ref(false)
    const isAnimating = ref(false)
    const isLoading = ref(true)
    const isCreatingArticle = ref(false)
    const playerInfo = ref({})
    
    
    const newArticle = ref({
      title: '',
      content: '',
      image_url: '',
      category: 'General',
      summary: '',
      is_featured: false,
      tags: []
    })
    
    
    const newsArticles = ref([])
    
    
    const categories = ref([
      'General',
      'Seguridad', 
      'Transporte',
      'Entretenimiento',
      'Deportes',
      'Tecnología',
      'Salud',
      'Economía',
      'Política',
      'Eventos'
    ])
    
    
    const filteredNews = computed(() => {
      if (!searchQuery.value) return newsArticles.value
      
      const query = searchQuery.value.toLowerCase()
      return newsArticles.value.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query)
      )
    })
    
    const featuredNews = computed(() => {
      return newsArticles.value.filter(article => article.is_featured).slice(0, 3)
    })
    
    const latestNews = computed(() => {
      return [...newsArticles.value]
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 10)
    })
    
    const trendingNews = computed(() => {
      return [...newsArticles.value]
        .filter(article => article.category === 'Entretenimiento' || article.category === 'Deportes')
        .slice(0, 5)
    })
    
    const loadNewsData = async () => {
      isLoading.value = true
      
      try {
        const result = await fetch('https://bit-smartphone/loadNews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).then(res => res.json())
        
        if (result.success) {
          newsArticles.value = result.articles || []
          isEditor.value = result.isEditor || false
          playerInfo.value = result.playerInfo || {}
        } else {
          console.error('Failed to load news data:', result.message)
          newsArticles.value = []
          isEditor.value = false
        }
      } catch (error) {
        console.error('Error loading news data:', error)
        newsArticles.value = []
        isEditor.value = false 
      }
      
      isLoading.value = false
    }
    
    const selectNews = (article) => {
      selectedNews.value = article
      currentView.value = 'article'
      isAnimating.value = true
      setTimeout(() => isAnimating.value = false, 300)
    }
    
    const createArticle = async () => {
      if (!newArticle.value.title || !newArticle.value.title.trim()) {
        alert('El título es obligatorio')
        return
      }
      
      if (!newArticle.value.content || !newArticle.value.content.trim()) {
        alert('El contenido es obligatorio')
        return
      }
      
      if (!newArticle.value.summary || !newArticle.value.summary.trim()) {
        alert('El resumen es obligatorio')
        return
      }
      
      if (newArticle.value.title.length > 200) {
        alert('El título es demasiado largo (máximo 200 caracteres)')
        return
      }
      
      if (newArticle.value.summary.length > 500) {
        alert('El resumen es demasiado largo (máximo 500 caracteres)')
        return
      }
      
      if (newArticle.value.content.length > 5000) {
        alert('El contenido es demasiado largo (máximo 5000 caracteres)')
        return
      }
      
      try {
        isCreatingArticle.value = true
        
        const result = await fetch('https://bit-smartphone/createNewsArticle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArticle.value)
        }).then(res => res.json())
        
        if (result.success) {
          newsArticles.value.unshift(result.article)
          
          newArticle.value = {
            title: '',
            content: '',
            image_url: '',
            category: 'General',
            summary: '',
            is_featured: false,
            tags: []
          }
          
          showCreateModal.value = false
          currentView.value = 'home'
           
          
        } else {
          alert(result.message || 'Error al crear el artículo')
        }
      } catch (error) {
        console.error('Error creating article:', error)
        alert('Error de conexión al crear el artículo')
      } finally {
        isCreatingArticle.value = false
      }
    }
    
    const deleteArticle = async (articleId) => {
      if (!confirm('¿Estás seguro de que deseas eliminar esta noticia?')) {
        return
      }
      
      try {
        const result = await fetch('https://bit-smartphone/deleteNewsArticle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId })
        }).then(res => res.json())
        
        if (result.success) {
          newsArticles.value = newsArticles.value.filter(article => article.id !== articleId)
          if (selectedNews.value && selectedNews.value.id === articleId) {
            goHome()
          }
        }
      } catch (error) {
        console.error('Error deleting article:', error)
      }
    }
    
    const formatDate = (timestamp) => {
      const date = new Date(timestamp * 1000)
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const formatTimeAgo = (timestamp) => {
      const now = Math.floor(Date.now() / 1000)
      const diff = now - timestamp
      
      if (diff < 60) return 'Hace ' + diff + 's'
      if (diff < 3600) return 'Hace ' + Math.floor(diff / 60) + 'm'
      if (diff < 86400) return 'Hace ' + Math.floor(diff / 3600) + 'h'
      return 'Hace ' + Math.floor(diff / 86400) + 'd'
    }
    
    const goHome = () => {
      currentView.value = 'home'
      selectedNews.value = null
    }
    
    const openCreateModal = () => {
      showCreateModal.value = true
    }
    
    const closeApp = () => {
      emit('close')
    }
    
    
    onMounted(() => {
      loadNewsData()
    })
    
    
    window.addEventListener('message', (event) => {
      if (event.data.action === 'newsUpdated') {
        newsArticles.value.unshift(event.data.article)
      } else if (event.data.action === 'newsDeleted') {
        newsArticles.value = newsArticles.value.filter(article => article.id !== event.data.articleId)
        if (selectedNews.value && selectedNews.value.id === event.data.articleId) {
          goHome()
        }
      }
    })
    
    return {
      currentView,
      selectedNews,
      isEditor,
      searchQuery,
      showCreateModal,
      newArticle,
      isAnimating,
      isLoading,
      isCreatingArticle,
      playerInfo,
      
      
      newsArticles,
      categories,
      
      
      filteredNews,
      featuredNews,
      latestNews,
      trendingNews,
      
      
      loadNewsData,
      selectNews,
      createArticle,
      deleteArticle,
      formatDate,
      formatTimeAgo,
      goHome,
      openCreateModal,
      closeApp
    }
  },
  template: `
    <div class="h-full bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col relative overflow-hidden">
      
      <div v-if="isLoading" class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="flex flex-col items-center space-y-4">
          <div class="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-white/80">Cargando noticias...</p>
        </div>
      </div>

      
      <header class="relative z-10 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div class="px-6 py-4 pt-14">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <button @click="closeApp" class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              
              
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-white">NewsHub</h1>
                  <p class="text-sm text-blue-200">Los Santos News</p>
                </div>
              </div>
            </div>
            
            
            <div class="flex items-center space-x-2">
              <button v-if="isEditor" @click="openCreateModal"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-all flex items-center space-x-2 shadow-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                <span class="hidden sm:inline">Crear</span>
              </button>
            </div>
          </div>
          
          
          <div v-if="currentView === 'home'" class="relative">
            <div class="relative">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Buscar noticias..." 
                class="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 pl-12 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/15 transition-all"
              >
              <svg class="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </header>

      
      <main class="flex-1 overflow-hidden">
        
        <div v-if="currentView === 'home'" class="h-full overflow-y-auto">
          <div class="p-6 space-y-8">
            
            
            <section v-if="featuredNews.length > 0" class="space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-white flex items-center space-x-2">
                  <div class="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <span>Destacadas</span>
                </h2>
                <div class="flex items-center space-x-1">
                  <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span class="text-xs text-red-400 font-medium">EN VIVO</span>
                </div>
              </div>
              
              
              <div v-if="featuredNews[0]" @click="selectNews(featuredNews[0])"
                   class="relative group cursor-pointer rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-md border border-white/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
                <div class="aspect-video relative overflow-hidden">
                  <img :src="featuredNews[0].image" :alt="featuredNews[0].title" 
                       class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  
                  <div class="absolute top-4 left-4">
                    <span class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      DESTACADA
                    </span>
                  </div>
                  
                  
                  <div class="absolute bottom-0 left-0 right-0 p-6">
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full">
                        {{ featuredNews[0].category }}
                      </span>
                      <span class="text-white/80 text-xs">{{ formatTimeAgo(featuredNews[0].publishDate) }}</span>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">
                      {{ featuredNews[0].title }}
                    </h3>
                    <p class="text-white/80 text-sm line-clamp-2">{{ featuredNews[0].summary }}</p>
                  </div>
                </div>
              </div>
              
              
              <div v-if="featuredNews.length > 1" class="grid grid-cols-2 gap-4">
                <div v-for="article in featuredNews.slice(1, 3)" :key="article.id" 
                     @click="selectNews(article)"
                     class="group cursor-pointer rounded-2xl overflow-hidden bg-black/30 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02]">
                  <div class="aspect-video relative overflow-hidden">
                    <img :src="article.image_url" :alt="article.title" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    <div class="absolute bottom-0 left-0 right-0 p-4">
                      <div class="flex items-center space-x-1 mb-1">
                        <span class="bg-purple-500/80 text-white text-xs px-2 py-1 rounded-full">
                          {{ article.category }}
                        </span>
                      </div>
                      <h4 class="text-sm font-semibold text-white line-clamp-2 group-hover:text-blue-200 transition-colors">
                        {{ article.title }}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            
            <section class="space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-white flex items-center space-x-2">
                  <div class="w-1 h-6 bg-green-500 rounded-full"></div>
                  <span>Últimas Noticias</span>
                </h2>
                <button class="text-blue-400 hover:text-blue-300 text-sm font-medium">Ver todas</button>
              </div>
              
              <div class="space-y-3">
                <div v-for="article in (searchQuery ? filteredNews : latestNews)" :key="article.id"
                     @click="selectNews(article)"
                     class="group cursor-pointer bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/30 p-4 transition-all duration-300 hover:scale-[1.01]">
                  <div class="flex space-x-4">
                    <div class="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img :src="article.image_url" :alt="article.title" 
                           class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    </div>
                    
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center space-x-2 mb-2">
                        <span class="text-xs px-2 py-1 rounded-full font-medium"
                              :class="{
                                'bg-red-500/20 text-red-400': article.category === 'Seguridad',
                                'bg-blue-500/20 text-blue-400': article.category === 'Tecnología',
                                'bg-green-500/20 text-green-400': article.category === 'Salud',
                                'bg-purple-500/20 text-purple-400': article.category === 'Entretenimiento',
                                'bg-yellow-500/20 text-yellow-400': article.category === 'Deportes',
                                'bg-gray-500/20 text-gray-400': !['Seguridad', 'Tecnología', 'Salud', 'Entretenimiento', 'Deportes'].includes(article.category)
                              }">
                          {{ article.category }}
                        </span>
                        <span class="text-white/60 text-xs">{{ formatTimeAgo(article.created_at) }}</span>
                      </div>
                      
                      <h3 class="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-blue-200 transition-colors">
                        {{ article.title }}
                      </h3>
                      
                      <p class="text-white/70 text-xs line-clamp-2">{{ article.summary }}</p>
                      
                      <div class="flex items-center justify-between mt-2">
                        <span class="text-white/50 text-xs">Por {{ article.author }}</span>
                        <span class="text-white/50 text-xs">{{ article.readTime }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        
        <div v-else-if="currentView === 'article' && selectedNews" class="h-full overflow-y-auto">
          <div class="relative">
            
            <div class="relative h-80 overflow-hidden">
              <img :src="selectedNews.image" :alt="selectedNews.title" 
                   class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              
              
              <button @click="goHome" 
                      class="absolute top-6 left-6 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              
              
              <button v-if="isEditor" @click="deleteArticle(selectedNews.id)"
                      class="absolute top-6 right-6 p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
              
              
              <div class="absolute bottom-0 left-0 right-0 p-6">
                <div class="flex items-center space-x-2 mb-4">
                  <span class="bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                    {{ selectedNews.category }}
                  </span>
                  <span v-if="selectedNews.featured" class="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                    DESTACADA
                  </span>
                </div>
                <h1 class="text-3xl font-bold text-white mb-3">{{ selectedNews.title }}</h1>
                <div class="flex items-center text-white/80 text-sm space-x-4">
                  <span>{{ formatDate(selectedNews.publishDate) }}</span>
                  <span>Por {{ selectedNews.author }}</span>
                  <span>{{ selectedNews.readTime }}</span>
                </div>
              </div>
            </div>
            
            
            <div class="bg-black/20 backdrop-blur-md p-6">
              <div class="max-w-4xl mx-auto">
                
                <div class="mb-8">
                  <p class="text-lg text-white/90 leading-relaxed font-light italic border-l-4 border-blue-500 pl-6">
                    {{ selectedNews.summary }}
                  </p>
                </div>
                
                
                <div class="prose prose-invert prose-lg max-w-none">
                  <div class="text-white/80 leading-relaxed space-y-6 text-base">
                    <div v-for="paragraph in selectedNews.content.split('\\n\\n')" :key="paragraph" class="mb-4">
                      {{ paragraph }}
                    </div>
                  </div>
                </div>
                
                
                <div v-if="selectedNews.tags && selectedNews.tags.length" class="mt-12 pt-6 border-t border-white/20">
                  <h3 class="text-sm font-medium text-white/60 mb-4">Etiquetas:</h3>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="tag in selectedNews.tags" :key="tag" 
                          class="bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-sm px-3 py-1 rounded-full hover:bg-white/20 transition-colors">
                      #{{ tag }}
                    </span>
                  </div>
                </div>
                
                
                <div class="mt-8 pt-6 border-t border-white/20">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <button class="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                        </svg>
                        <span>Compartir</span>
                      </button>
                      <button class="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                        <span>Me gusta</span>
                      </button>
                    </div>
                    
                    <button @click="goHome" class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all">
                      Volver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      
      <div v-if="showCreateModal" 
           @click="showCreateModal = false"
           class="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div @click.stop class="w-full max-w-2xl bg-black/80 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">Crear Noticia</h3>
                <p class="text-sm text-white/60">Comparte información importante</p>
              </div>
            </div>
            <button @click="showCreateModal = false" class="p-2 text-white/60 hover:text-white transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="createArticle" class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="block text-sm font-medium text-white mb-2">Título *</label>
                <input v-model="newArticle.title" 
                       type="text" 
                       placeholder="Título de la noticia"
                       class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15"
                       required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-white mb-2">Categoría</label>
                <select v-model="newArticle.category" 
                        class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15">
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-white mb-2">Imagen URL</label>
                <input v-model="newArticle.image_url" 
                       type="url" 
                       placeholder="https://example.com/image.jpg"
                       class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15">
              </div>
              
              <div class="col-span-2">
                <label class="block text-sm font-medium text-white mb-2">Resumen</label>
                <textarea v-model="newArticle.summary" 
                          rows="3" 
                          placeholder="Breve descripción de la noticia..."
                          class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 resize-none"></textarea>
              </div>
              
              <div class="col-span-2">
                <label class="block text-sm font-medium text-white mb-2">Contenido *</label>
                <textarea v-model="newArticle.content" 
                          rows="8" 
                          placeholder="Contenido completo de la noticia..."
                          class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 resize-none"
                          required></textarea>
              </div>
              
              <div class="col-span-2">
                <label class="flex items-center space-x-3">
                  <input v-model="newArticle.is_featured" type="checkbox" 
                         class="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500/50">
                  <span class="text-white font-medium">Marcar como noticia destacada</span>
                </label>
              </div>
            </div>
            
            <div class="flex justify-end space-x-4 pt-6">
              <button @click="showCreateModal = false" type="button" 
                      class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                      :disabled="isCreatingArticle">
                Cancelar
              </button>
              <button type="submit" 
                      class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-blue-500/30 disabled:bg-blue-400 disabled:cursor-not-allowed"
                      :disabled="!newArticle.title || !newArticle.content || !newArticle.summary || isCreatingArticle">
                <span v-if="isCreatingArticle">Publicando...</span>
                <span v-else>Publicar Noticia</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
};
