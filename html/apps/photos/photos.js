const Photos = {
  name: 'Photos',
  props: ["photos", "userSettings", "t"],
  emits: ["close", "delete-photo", "share-photo"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, watch, nextTick } = Vue;
    
    
    const currentView = ref("photos") 
    const selectedPhoto = ref(null)
    const selectedPhotos = ref(new Set())
    const isSelectionMode = ref(false)
    const currentAlbum = ref(null)
    const showShareModal = ref(false)
    const showAlbumModal = ref(false)
    const showCreateAlbumModal = ref(false)
    const isLoading = ref(false)
    const albums = ref([])
    const newAlbumName = ref("")
    const shareOptions = ref([
      { id: 'tuister', name: props.t ? props.t('photos.share_options.tuister') : 'Tuister', icon: 'icon-twitter' },
      { id: 'messages', name: props.t ? props.t('photos.share_options.messages') : 'Mensajes', icon: 'icon-message-square' },
      { id: 'mail', name: props.t ? props.t('photos.share_options.mail') : 'Email', icon: 'icon-mail' },
      { id: 'save', name: props.t ? props.t('photos.share_options.save') : 'Guardar en dispositivo', icon: 'icon-download' }
    ])
    
    const samplePhotos = ref([])
    const tempPhotos = ref([])
    const allPhotos = computed(() => {
      const propsPhotos = props.photos || []
      const photos = [...tempPhotos.value, ...samplePhotos.value, ...propsPhotos]
      
      // Asegurar que todas las fotos tengan albumIds inicializado
      photos.forEach(photo => {
        if (!photo.albumIds) {
          photo.albumIds = []
        }
      })
      
      return photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })
    
    const groupedPhotos = computed(() => {
      if (currentView.value === "album-detail" && currentAlbum.value) {
        const albumPhotos = allPhotos.value.filter(photo => 
          photo.albumIds?.includes(currentAlbum.value.id)
        )
        return groupPhotosByDate(albumPhotos)
      }
      return groupPhotosByDate(allPhotos.value)
    })
    
    const favoritePhotos = computed(() => 
      allPhotos.value.filter(photo => photo.favorite)
    )
    
    const recentPhotos = computed(() => 
      allPhotos.value.slice(0, 20)
    )
    
    const selectedPhotosList = computed(() => 
      Array.from(selectedPhotos.value)
    )
    
    const canCreateAlbum = computed(() => 
      newAlbumName.value.trim().length > 0
    )
    
    
    const groupPhotosByDate = (photos) => {
      const groups = {}
      photos.forEach(photo => {
        const date = formatDateGroup(photo.createdAt)
        if (!groups[date]) groups[date] = []
        groups[date].push(photo)
      })
      return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]))
    }
    
    const formatDateGroup = (date) => {
      const now = new Date()
      const photoDate = new Date(date)
      const diffTime = now - photoDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return props.t ? props.t('common.today') : "Hoy"
      if (diffDays === 1) return props.t ? props.t('common.yesterday') : "Ayer"
      if (diffDays < 7) return props.t ? props.t('common.days_ago').replace('{count}', diffDays) : 'Hace ' + diffDays + ' días'
      
      return photoDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: photoDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      })
    }
    
    const formatDateTime = (date) => {
      return new Date(date).toLocaleString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    
    const openPhoto = (photo) => {
      selectedPhoto.value = photo
      currentView.value = "photo-viewer"
    }
    
    const closePhoto = () => {
      selectedPhoto.value = null
      currentView.value = currentAlbum.value ? "album-detail" : "photos"
    }
    
    const togglePhotoSelection = (photo) => {
      if (selectedPhotos.value.has(photo.id)) {
        selectedPhotos.value.delete(photo.id)
      } else {
        selectedPhotos.value.add(photo.id)
      }
      
      if (selectedPhotos.value.size === 0) {
        isSelectionMode.value = false
      }
    }
    
    const startSelectionMode = (photo) => {
      isSelectionMode.value = true
      selectedPhotos.value.clear()
      selectedPhotos.value.add(photo.id)
    }
    
    const exitSelectionMode = () => {
      isSelectionMode.value = false
      selectedPhotos.value.clear()
    }
    
    const selectAllPhotos = () => {
      const photosToSelect = currentView.value === "album-detail" && currentAlbum.value
        ? allPhotos.value.filter(photo => photo.albumIds?.includes(currentAlbum.value.id))
        : allPhotos.value
      
      photosToSelect.forEach(photo => selectedPhotos.value.add(photo.id))
    }
    
    const deleteSelectedPhotos = async () => {
      if (selectedPhotosList.value.length === 0) return
      
      const confirmMessage = props.t ? 
        props.t('photos.delete_confirmation').replace('{count}', selectedPhotosList.value.length) :
        '¿Estás seguro de que quieres eliminar ' + selectedPhotosList.value.length + ' foto(s)?'
      
      if (confirm(confirmMessage)) {
        isLoading.value = true
        
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        selectedPhotosList.value.forEach(photoId => {
          const photoIndex = samplePhotos.value.findIndex(p => p.id === photoId)
          if (photoIndex !== -1) {
            samplePhotos.value.splice(photoIndex, 1)
          }
          emit("delete-photo", photoId)
        })
        
        exitSelectionMode()
        isLoading.value = false
      }
    }
    
    const toggleFavorite = (photo) => {
      photo.favorite = !photo.favorite
      
      if (photo.favorite && !photo.albumIds.includes('favorites')) {
        photo.albumIds.push('favorites')
      } else if (!photo.favorite && photo.albumIds.includes('favorites')) {
        photo.albumIds = photo.albumIds.filter(id => id !== 'favorites')
      }
      
      // Actualizar covers de albums después de cambiar favoritos
      updateAlbumCovers()
    }
    
    const sharePhoto = (photo) => {
      selectedPhoto.value = photo
      showShareModal.value = true
    }
    
    const shareWith = (option) => {
      const photo = selectedPhoto.value
      emit("share-photo", { photo, platform: option.id })
      showShareModal.value = false
      
      
      switch (option.id) {
        case 'tuister':
          
          break
        case 'messages':
          
          break
        case 'mail':
          
          break
        case 'save':
          
          break
      }
    }
    
    const openAlbums = () => {
      currentView.value = "albums"
      updateAlbumCovers()
    }
    
    const openAlbum = (album) => {
      currentAlbum.value = album
      currentView.value = "album-detail"
    }
    
    const createAlbum = async () => {
      if (!canCreateAlbum.value) return
      
      isLoading.value = true
      
      const newAlbum = {
        id: Date.now(),
        name: newAlbumName.value.trim(),
        cover: null,
        photos: [],
        createdAt: new Date(),
        isSystem: false
      }
      
      albums.value.push(newAlbum)
      newAlbumName.value = ""
      showCreateAlbumModal.value = false
      
      await new Promise(resolve => setTimeout(resolve, 300))
      isLoading.value = false
    }
    
    const addPhotosToAlbum = (albumId) => {
      selectedPhotosList.value.forEach(photoId => {
        const photo = allPhotos.value.find(p => p.id === photoId)
        if (photo && !photo.albumIds.includes(albumId)) {
          photo.albumIds.push(albumId)
        }
      })
      
      updateAlbumCovers()
      exitSelectionMode()
      showAlbumModal.value = false
    }
    
    const removePhotosFromAlbum = () => {
      if (!currentAlbum.value) return
      
      selectedPhotosList.value.forEach(photoId => {
        const photo = allPhotos.value.find(p => p.id === photoId)
        if (photo) {
          photo.albumIds = photo.albumIds.filter(id => id !== currentAlbum.value.id)
        }
      })
      
      updateAlbumCovers()
      exitSelectionMode()
    }
    
    const updateAlbumCovers = () => {
      albums.value.forEach(album => {
        if (album.id === 'favorites') {
          // Sincronizar album de favoritos
          const favoritePhotoIds = favoritePhotos.value.map(p => p.id)
          album.photos = favoritePhotoIds
          album.count = favoritePhotoIds.length
          album.cover = favoritePhotos.value.length > 0 ? favoritePhotos.value[0].thumbnail : null
        } else if (album.id === 'recent') {
          // Sincronizar album de recientes
          const recentPhotoIds = recentPhotos.value.map(p => p.id)
          album.photos = recentPhotoIds
          album.count = recentPhotoIds.length
          album.cover = recentPhotos.value.length > 0 ? recentPhotos.value[0].thumbnail : null
        } else {
          // Albums personalizados
          const albumPhotos = allPhotos.value.filter(photo => 
            photo.albumIds?.includes(album.id)
          )
          album.cover = albumPhotos.length > 0 ? albumPhotos[0].thumbnail : null
          album.count = albumPhotos.length
        }
      })
    }
    
    const goBack = () => {
      if (currentView.value === "photo-viewer") {
        closePhoto()
      } else if (currentView.value === "album-detail") {
        currentAlbum.value = null
        currentView.value = "albums"
      } else if (currentView.value === "albums") {
        currentView.value = "photos"
      }
    }
    
    
    onMounted(() => {
      // Event listeners para fotos desde cámara
      window.addEventListener('message', (event) => {
        if (event.data.action === 'camera:photo_instant') {
          const tempPhoto = {
            ...event.data.photo,
            thumbnail: event.data.photo.url,
            favorite: false,
            albumIds: [],
            isTemp: true
          }
          tempPhotos.value.unshift(tempPhoto)
        } else if (event.data.action === 'camera:photo_saved') {
          const tempIndex = tempPhotos.value.findIndex(p => p.id === event.data.tempId)
          if (tempIndex !== -1) {
            tempPhotos.value.splice(tempIndex, 1)
            if (event.data.success) {
              emit('photos-updated')
            }
          }
        }
      })
      
      // Inicializar albums del sistema si no existen
      if (albums.value.length === 0) {
        albums.value = [
          {
            id: 'favorites',
            name: props.t ? props.t('photos.albums.favorites') : 'Favoritos',
            cover: null,
            photos: [],
            createdAt: new Date(),
            isSystem: true
          },
          {
            id: 'recent',
            name: props.t ? props.t('photos.albums.recent') : 'Recientes',
            cover: null,
            photos: [],
            createdAt: new Date(),
            isSystem: true
          }
        ]
      }
      
      // updateAlbumCovers se encarga de sincronizar todos los albums
      updateAlbumCovers()
    })
    
    watch(allPhotos, () => {
      updateAlbumCovers()
    }, { deep: true })
    
    return {
      
      currentView,
      selectedPhoto,
      selectedPhotos,
      isSelectionMode,
      currentAlbum,
      showShareModal,
      showAlbumModal,
      showCreateAlbumModal,
      isLoading,
      albums,
      newAlbumName,
      shareOptions,
      
      
      allPhotos,
      groupedPhotos,
      selectedPhotosList,
      canCreateAlbum,
      
      
      openPhoto,
      closePhoto,
      togglePhotoSelection,
      startSelectionMode,
      exitSelectionMode,
      selectAllPhotos,
      deleteSelectedPhotos,
      toggleFavorite,
      sharePhoto,
      shareWith,
      openAlbums,
      openAlbum,
      createAlbum,
      addPhotosToAlbum,
      removePhotosFromAlbum,
      goBack,
      formatDateTime,
      emit
    }
  },
  
  template: `
    <div class="h-full w-full flex flex-col photos-app"
         :class="userSettings.darkMode ? 'bg-black text-white' : 'bg-white text-black'">
      
      
      <header class="flex items-center justify-between p-4 pt-12 shrink-0 border-b"
              :class="userSettings.darkMode ? 'border-gray-700' : 'border-gray-200'">
        <div class="flex items-center">
          <button v-if="currentView !== 'photos'" @click="goBack" class="mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h1 class="text-2xl font-bold">
            {{ currentView === 'albums' ? (t ? t('photos.albums') : 'Álbumes') : 
               currentView === 'album-detail' ? currentAlbum?.name : 
               currentView === 'photo-viewer' ? (t ? t('photos.title') : 'Foto') : (t ? t('photos.photos') : 'Fotos') }}
          </h1>
        </div>
        
        <div class="flex items-center space-x-3">
          <button v-if="isSelectionMode" @click="selectAllPhotos" 
                  class="text-blue-500 text-sm font-medium">
            {{ t ? t('photos.select_all') : 'Seleccionar todo' }}
          </button>
          <button v-if="isSelectionMode" @click="exitSelectionMode" 
                  class="text-gray-500 text-sm">
            {{ t ? t('photos.cancel') : 'Cancelar' }}
          </button>
          <button v-if="!isSelectionMode" @click="emit('close')" 
                  class="p-2 rounded-full transition-colors"
                  :class="userSettings.darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </header>
      
      
      <div v-if="currentView === 'photos' || currentView === 'albums'" class="tab-navigation">
        <button @click="currentView = 'photos'" 
                class="tab-button" 
                :class="{ active: currentView === 'photos' }">
          {{ t ? t('photos.photos') : 'Fotos' }}
        </button>
        <button @click="openAlbums" 
                class="tab-button" 
                :class="{ active: currentView === 'albums' }">
          {{ t ? t('photos.albums') : 'Álbumes' }}
        </button>
      </div>
      
      
      <div v-if="isSelectionMode && selectedPhotosList.length > 0" 
           class="flex items-center justify-between p-4 border-b"
           :class="userSettings.darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'">
        <span class="text-sm font-medium">
          {{ t ? t('photos.selected_count').replace('{count}', selectedPhotosList.length) : selectedPhotosList.length + ' foto(s) seleccionada(s)' }}
        </span>
        <div class="flex space-x-3">
          <button @click="showAlbumModal = true" 
                  class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
            {{ t ? t('photos.add_to_album') : 'Añadir a álbum' }}
          </button>
          <button v-if="currentView === 'album-detail' && !currentAlbum?.isSystem" 
                  @click="removePhotosFromAlbum"
                  class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
            Quitar del álbum
          </button>
          <button @click="deleteSelectedPhotos" 
                  class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium">
            {{ t ? t('photos.delete') : 'Eliminar' }}
          </button>
        </div>
      </div>
      
      
      <div v-if="currentView === 'photos' || currentView === 'album-detail'" 
           class="flex-1 overflow-y-auto photos-scrollbar">
        <div v-if="allPhotos.length === 0" 
             class="flex flex-col items-center justify-center h-full text-center p-8">
          <svg class="w-24 h-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <h3 class="text-xl font-semibold mb-2">{{ t ? t('photos.no_photos') : 'No hay fotos' }}</h3>
          <p class="text-gray-500 dark:text-gray-400">
            Usa la cámara para capturar tus primeros momentos
          </p>
        </div>
        
        <div v-else>
          <div v-for="([date, photoGroup]) in groupedPhotos" :key="date" class="date-section">
            <h3 class="date-header">{{ date }}</h3>
            <div class="photos-grid">
              <div v-for="photo in photoGroup" :key="photo.id" 
                   class="photo-item"
                   :class="{ selected: selectedPhotos.has(photo.id) }"
                   @click="isSelectionMode ? togglePhotoSelection(photo) : openPhoto(photo)"
                   @long-press="startSelectionMode(photo)">
                <img :src="photo.thumbnail || photo.url" 
                     :alt="'Foto del ' + formatDateTime(photo.createdAt)"
                     class="w-full h-full object-cover" />
                <div v-if="isSelectionMode" class="selection-indicator">
                  <svg v-if="selectedPhotos.has(photo.id)" class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div v-if="photo.favorite" 
                     class="absolute top-2 left-2 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      <div v-if="currentView === 'albums'" class="flex-1 overflow-y-auto photos-scrollbar">
        <div class="albums-grid">
          <div v-for="album in albums" :key="album.id" 
               class="album-item" @click="openAlbum(album)">
            <img v-if="album.cover" :src="album.cover" class="album-cover" />
            <div v-else class="album-cover bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
              <svg class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="album-info">
              <div class="album-title">{{ album.name }}</div>
              <div class="album-count">{{ album.count || 0 }} {{ t ? t('photos.photos') : 'fotos' }}</div>
            </div>
          </div>
        </div>
      </div>
      
      
      <div v-if="currentView === 'photo-viewer' && selectedPhoto" class="photo-viewer">
        <div class="photo-viewer-header">
          <div class="flex items-center justify-between">
            <button @click="closePhoto" class="flex items-center text-white">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              {{ t ? t('common.back') : 'Atrás' }}
            </button>
            <button @click="toggleFavorite(selectedPhoto)" 
                    class="p-2 rounded-full bg-black bg-opacity-30">
              <svg class="w-6 h-6" :class="selectedPhoto.favorite ? 'text-yellow-400' : 'text-white'" 
                   fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="photo-viewer-content">
          <img :src="selectedPhoto.url" class="max-w-full max-h-full object-contain" />
        </div>
        
        <div class="photo-viewer-footer">
          <div class="mb-4 text-sm text-center text-white text-opacity-80">
            <div>{{ formatDateTime(selectedPhoto.createdAt) }}</div>
            <div v-if="selectedPhoto.location">{{ selectedPhoto.location }}</div>
            <div>{{ selectedPhoto.dimensions }} • {{ selectedPhoto.size }}</div>
          </div>
          
          <div class="photo-actions">
            <button @click="sharePhoto(selectedPhoto)" class="photo-action-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
              <span>{{ t ? t('photos.share') : 'Compartir' }}</span>
            </button>
            
            <button @click="startSelectionMode(selectedPhoto); closePhoto()" class="photo-action-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M5 13l4 4L19 7"></path>
              </svg>
              <span>{{ t ? t('photos.select') : 'Seleccionar' }}</span>
            </button>
            
            <button @click="showAlbumModal = true" class="photo-action-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span>{{ t ? t('photos.add_to_album') : 'Añadir' }}</span>
            </button>
            
            <button @click="deleteSelectedPhotos" class="photo-action-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>{{ t ? t('photos.delete') : 'Eliminar' }}</span>
            </button>
          </div>
        </div>
      </div>
      
      
      <div v-if="currentView === 'albums'" class="floating-actions">
        <button @click="showCreateAlbumModal = true" class="floating-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </button>
      </div>
      
      
      <div v-if="showShareModal" class="modal-backdrop" @click="showShareModal = false">
        <div class="modal-content" @click.stop>
          <h3 class="text-lg font-semibold mb-4">{{ t ? t('photos.share') + ' foto' : 'Compartir foto' }}</h3>
          <div class="grid grid-cols-2 gap-3">
            <button v-for="option in shareOptions" :key="option.id"
                    @click="shareWith(option)"
                    class="flex flex-col items-center p-4 rounded-xl border transition-colors"
                    :class="userSettings.darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'">
              <svg class="w-8 h-8 mb-2">
                <use :href="'#' + option.icon"></use>
              </svg>
              <span class="text-sm font-medium">{{ option.name }}</span>
            </button>
          </div>
          <button @click="showShareModal = false" 
                  class="w-full mt-4 py-2 text-gray-500 text-sm">
            {{ t ? t('photos.cancel') : 'Cancelar' }}
          </button>
        </div>
      </div>
      
      
      <div v-if="showAlbumModal" class="modal-backdrop" @click="showAlbumModal = false">
        <div class="modal-content" @click.stop>
          <h3 class="text-lg font-semibold mb-4">{{ t ? t('photos.add_to_album') : 'Añadir a álbum' }}</h3>
          <div class="space-y-2 max-h-60 overflow-y-auto">
            <button v-for="album in albums" :key="album.id"
                    @click="addPhotosToAlbum(album.id)"
                    class="w-full flex items-center p-3 rounded-xl border transition-colors text-left"
                    :class="userSettings.darkMode ? 'border-gray-600 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'">
              <div class="w-12 h-12 rounded-lg overflow-hidden mr-3 bg-gray-300 dark:bg-gray-700">
                <img v-if="album.cover" :src="album.cover" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1">
                <div class="font-medium">{{ album.name }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ album.count || 0 }} {{ t ? t('photos.photos') : 'fotos' }}</div>
              </div>
            </button>
          </div>
          <button @click="showAlbumModal = false" 
                  class="w-full mt-4 py-2 text-gray-500 text-sm">
            {{ t ? t('photos.cancel') : 'Cancelar' }}
          </button>
        </div>
      </div>
      
      
      <div v-if="showCreateAlbumModal" class="modal-backdrop" @click="showCreateAlbumModal = false">
        <div class="modal-content" @click.stop>
          <h3 class="text-lg font-semibold mb-4">{{ t ? t('photos.create_album') : 'Crear álbum' }}</h3>
          <input v-model="newAlbumName" 
                 :placeholder="t ? t('photos.album_name') : 'Nombre del álbum'"
                 class="w-full p-3 border rounded-xl mb-4 focus:outline-none focus:border-blue-500"
                 :class="userSettings.darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'"
                 @keyup.enter="createAlbum" />
          <div class="flex space-x-3">
            <button @click="showCreateAlbumModal = false" 
                    class="flex-1 py-3 border rounded-xl"
                    :class="userSettings.darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'">
              {{ t ? t('photos.cancel') : 'Cancelar' }}
            </button>
            <button @click="createAlbum" 
                    :disabled="!canCreateAlbum || isLoading"
                    class="flex-1 py-3 bg-blue-500 text-white rounded-xl disabled:opacity-50">
              {{ isLoading ? (t ? t('photos.loading') + '...' : 'Creando...') : (t ? t('photos.create') : 'Crear') }}
            </button>
          </div>
        </div>
      </div>
      
    </div>
  `
}
