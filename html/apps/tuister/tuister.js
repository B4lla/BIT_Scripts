const Tuister = {
  name: 'Tuister',
  props: ["userSettings", "t"],
  emits: ["close", "open-app", "add-notification", "updateSetting", "takePhoto", "playTrack", "pauseMusic", "orientationChange", "resumeMusic", "stopMusic", "setMusicProgress", "setMusicVolume", "setPlaylist"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;
    
    
    const currentView = ref("login") 
    const currentUser = ref({ id: 1, username: '', displayName: '' })
    const isLoading = ref(false)
    const isDarkMode = computed(() => props.userSettings.darkMode)
    const selectedTab = ref("home")

    const authError = ref("")
    const loginForm = ref({
      username: "",
      password: ""
    })
    const registerForm = ref({
      username: "",
      password: "",
      confirmPassword: "",
      displayName: ""
    })
    
    const users = ref([])
    const username = ref("")
    const tweets = ref([])
    const selectedTweet = ref(null)
    const selectedProfile = ref(null)
    const composeText = ref("")
    const isComposing = ref(false)
    const comments = ref([])
    const newComment = ref("")
    const isLoadingComments = ref(false)
    
    
    const isEditingProfile = ref(false)
    const profileEditForm = ref({
      displayName: "",
      bio: "",
      location: "",
      website: ""
    })
    
    
    const searchQuery = ref("")
    const searchResults = ref([])
    const trendingTopics = ref([
      { tag: "#TuisterApp", tweets: "12.5K" },
      { tag: "#JavaScript", tweets: "89.2K" },
      { tag: "#VueJS", tweets: "45.1K" },
      { tag: "#WebDev", tweets: "156K" },
      { tag: "#FiveM", tweets: "23.7K" }
    ])
    
    
    const notifications = ref([])
    const unreadNotifications = computed(() => 
      notifications.value.filter(n => !n.read).length
    )
    
    
    const mockTweets = ref([])
    
    
    const login = async () => {
      authError.value = ""

      if (!loginForm.value.username || !loginForm.value.password) {
        authError.value = "Por favor completa todos los campos"
        return
      }

      isLoading.value = true

      try {
        // Try to load profile from server (profiles are tied to player identifier)
        const res = await fetch('https://bit-smartphone/tuister:loadProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const json = await res.json().catch(() => ({}))

        if (json && json.success && json.profile && json.profile.id) {
          // If profile exists for this player, accept login (credential check is server-side by identifier)
          currentUser.value = json.profile
          currentView.value = 'home'
          authError.value = ''

          // load tweets for user
          const tweetsRes = await fetch('https://bit-smartphone/tuister:loadTweets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
          const tweetsJson = await tweetsRes.json().catch(() => ({}))
          if (tweetsJson && tweetsJson.success && Array.isArray(tweetsJson.tweets)) {
            tweets.value = tweetsJson.tweets
          }

          emit('add-notification', {
            appId: 'tuister',
            title: 'Tuister',
            message: 'Bienvenido de vuelta, ' + (currentUser.value.displayName || currentUser.value.username) + '!',
            icon: 'tuister'
          })
        } else {
          authError.value = 'Cuenta no encontrada para este jugador. Regístrate primero.'
        }
      } catch (e) {
        console.error('[Tuister] login error', e)
        authError.value = 'Error de conexión'
      } finally {
        isLoading.value = false
        loginForm.value = { username: '', password: '' }
      }
    }

    const register = async () => {
      authError.value = ''

      if (!registerForm.value.username || !registerForm.value.password || !registerForm.value.displayName) {
        authError.value = 'Por favor completa todos los campos'
        return
      }

      if (registerForm.value.password !== registerForm.value.confirmPassword) {
        authError.value = 'Las contraseñas no coinciden'
        return
      }

      if (registerForm.value.password.length < 6) {
        authError.value = 'La contraseña debe tener al menos 6 caracteres'
        return
      }

      isLoading.value = true

      try {
        console.log('[Tuister] Attempting registration with data:', {
          username: registerForm.value.username,
          displayName: registerForm.value.displayName
        })

        // Call the NUI endpoint directly to complete registration
        const res = await fetch('https://bit-smartphone/tuister:completeRegistration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: registerForm.value.username,
            password: registerForm.value.password,
            displayName: registerForm.value.displayName
          })
        })
        
        const json = await res.json().catch(() => ({}))
        console.log('[Tuister] completeRegistration response:', json)

        if (json && json.success) {
          // Registration successful, try to load profile
          const profileRes = await fetch('https://bit-smartphone/tuister:loadProfile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
          const profileJson = await profileRes.json().catch(() => ({}))
          console.log('[Tuister] loadProfile response:', profileJson)

          if (profileJson && profileJson.success && profileJson.profile && profileJson.profile.id) {
            currentUser.value = profileJson.profile
            currentView.value = 'home'

            emit('add-notification', {
              appId: 'tuister',
              title: '¡Bienvenido a Tuister!',
              message: 'Tu cuenta @' + (currentUser.value.username || registerForm.value.username) + ' ha sido creada exitosamente',
              icon: 'tuister'
            })

            // Clear forms
            registerForm.value = { username: '', password: '', confirmPassword: '', displayName: '' }
          } else {
            // Registration completed but profile not loaded
            console.log('[Tuister] Registration completed but profile not immediately available')
            authError.value = 'Cuenta creada. Inicia sesión para continuar.'
            currentView.value = 'login'
            registerForm.value = { username: '', password: '', confirmPassword: '', displayName: '' }
          }
        } else {
          authError.value = json && json.error ? json.error : 'Error al crear la cuenta'
          console.error('[Tuister] Registration failed:', json)
        }
      } catch (e) {
        console.error('[Tuister] register error', e)
        authError.value = 'Error al crear la cuenta'
      } finally {
        isLoading.value = false
      }
    }

    
    const logout = () => {
      currentUser.value = null
      currentView.value = "login"
      tweets.value = []
      selectedTweet.value = null
      selectedProfile.value = null
    }
    
    
    const composeTweet = async () => {
      if (!composeText.value.trim()) return
      
      isLoading.value = true
      
      try {
        await fetch('https://bit-smartphone/tuister:postTweet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: composeText.value })
        })
        
        // Create local tweet for immediate feedback
        const newTweet = {
          id: Date.now(),
          user: currentUser.value,
          content: composeText.value,
          timestamp: new Date(),
          likes: 0,
          retweets: 0,
          comments: 0,
          liked: false,
          retweeted: false,
          images: []
        }
        
        tweets.value.unshift(newTweet)
        composeText.value = ""
        isComposing.value = false
        currentView.value = "home"
        
        if (currentUser.value.tweets !== undefined) {
          currentUser.value.tweets++
        }
        
        emit('add-notification', {
          appId: 'tuister',
          title: 'Tweet publicado',
          message: 'Tu tweet se ha publicado exitosamente',
          icon: 'tuister'
        })
      } catch (e) {
        console.error('[Tuister] composeTweet error', e)
      } finally {
        isLoading.value = false
      }
    }
    
    const likeTweet = async (tweet) => {
      try {
        await fetch('https://bit-smartphone/tuister:likeTweet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tweetId: tweet.id })
        })
        
        // Toggle local state
        tweet.liked = !tweet.liked
        tweet.likes += tweet.liked ? 1 : -1
        
        // Add animation
        const element = document.querySelector('[data-tweet-id="' + tweet.id + '"] .like-btn')
        if (element && tweet.liked) {
          element.classList.add('tuister-like-animation')
          setTimeout(() => {
            element.classList.remove('tuister-like-animation')
          }, 600)
        }
      } catch (e) {
        console.error('[Tuister] likeTweet error', e)
      }
    }
    
    const retweetTweet = (tweet) => {
      tweet.retweeted = !tweet.retweeted
      tweet.retweets += tweet.retweeted ? 1 : -1
    }
    
    const openTweetDetail = (tweet) => {
      selectedTweet.value = tweet
      currentView.value = "post-detail"
      
      loadComments(tweet.id)
    }
    
    const openProfile = (user) => {
      selectedProfile.value = user
      currentView.value = "profile"
    }
    
    const followUser = async (user) => {
      if (!currentUser.value || user.id === currentUser.value.id) return
      
      const isCurrentlyFollowing = currentUser.value.followingUsers?.includes(user.id)
      
      if (isCurrentlyFollowing) {
        
        currentUser.value.followingUsers = currentUser.value.followingUsers.filter(id => id !== user.id)
        currentUser.value.following
        user.followers
        user.isFollowing = false
        
        emit('add-notification', {
          appId: 'tuister',
          title: 'Tuister',
          message: 'Ya no sigues a @' + user.username,
          icon: 'tuister'
        })
      } else {
        
        if (!currentUser.value.followingUsers) currentUser.value.followingUsers = []
        currentUser.value.followingUsers.push(user.id)
        currentUser.value.following++
        user.followers++
        user.isFollowing = true
        
        emit('add-notification', {
          appId: 'tuister',
          title: 'Tuister',
          message: 'Ahora sigues a @' + user.username,
          icon: 'tuister'
        })
      }
    }
    
    
    const loadComments = async (tweetId) => {
      isLoadingComments.value = true
      

      await new Promise(resolve => setTimeout(resolve, 500))
      

      comments.value = [
        {
          id: 1,
          tweetId: tweetId,
          user: {
            id: 99,
            username: "commenter1",
            displayName: "Usuario Comentarista",
            avatar: "https:",
            verified: false
          },
          content: "¡Excelente contenido! Me encanta esta aplicación.",
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          likes: 3,
          liked: false
        },
        {
          id: 2,
          tweetId: tweetId,
          user: {
            id: 98,
            username: "tech_fan",
            displayName: "Tech Fan",
            avatar: "https:",
            verified: true
          },
          content: "Totalmente de acuerdo. La interfaz está muy bien diseñada.",
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          likes: 7,
          liked: true
        }
      ]
      
      isLoadingComments.value = false
    }
    
    const addComment = async () => {
      if (!newComment.value.trim() || !selectedTweet.value) return
      
      isLoading.value = true
      
      try {
        await fetch('https://bit-smartphone/tuister:addComment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tweetId: selectedTweet.value.id,
            content: newComment.value.trim()
          })
        })
        
        const comment = {
          id: Date.now(),
          tweetId: selectedTweet.value.id,
          user: currentUser.value,
          content: newComment.value.trim(),
          timestamp: new Date(),
          likes: 0,
          liked: false
        }
        
        comments.value.push(comment)
        selectedTweet.value.comments++
        newComment.value = ""
        
        emit('add-notification', {
          appId: 'tuister',
          title: 'Comentario publicado',
          message: 'Tu comentario se ha publicado exitosamente',
          icon: 'tuister'
        })
      } catch (e) {
        console.error('[Tuister] addComment error', e)
      } finally {
        isLoading.value = false
      }
    }
    
    const likeComment = (comment) => {
      comment.liked = !comment.liked
      comment.likes += comment.liked ? 1 : -1
    }
    
    
    const editProfile = () => {
      profileEditForm.value = {
        displayName: currentUser.value.displayName,
        bio: currentUser.value.bio,
        location: currentUser.value.location || "",
        website: currentUser.value.website || ""
      }
      isEditingProfile.value = true
    }
    
    const saveProfile = async () => {
      try {
        await fetch('https://bit-smartphone/tuister:updateProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: profileEditForm.value.displayName,
            bio: profileEditForm.value.bio,
            avatar: profileEditForm.value.avatar || currentUser.value.avatar,
            banner: profileEditForm.value.banner || currentUser.value.banner
          })
        })
        
        // Update local state
        currentUser.value.displayName = profileEditForm.value.displayName
        currentUser.value.bio = profileEditForm.value.bio
        currentUser.value.location = profileEditForm.value.location
        currentUser.value.website = profileEditForm.value.website
        isEditingProfile.value = false
        
        emit('add-notification', {
          appId: 'tuister',
          title: 'Perfil actualizado',
          message: 'Tu perfil se ha actualizado correctamente',
          icon: 'tuister'
        })
      } catch (e) {
        console.error('[Tuister] saveProfile error', e)
      }
    }
    
    
    const search = async () => {
      if (!searchQuery.value.trim()) {
        searchResults.value = []
        return
      }
      
      isLoading.value = true
      
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      searchResults.value = tweets.value.filter(tweet => 
        tweet.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        tweet.user.displayName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        tweet.user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
      
      isLoading.value = false
    }
    
    
    const setTab = (tab) => {
      selectedTab.value = tab
      if (tab === "profile") {
        selectedProfile.value = currentUser.value
        currentView.value = "profile"
      } else if (tab === "search") {
        currentView.value = "search"
      } else {
        currentView.value = "home"
      }
    }
    
    const goBack = () => {
      if (currentView.value === "post-detail" || currentView.value === "profile") {
        currentView.value = "home"
      } else if (currentView.value === "compose") {
        isComposing.value = false
        currentView.value = "home"
      } else if (currentView.value === "register") {
        currentView.value = "login"
      }
    }
    
    
    const characterCount = computed(() => composeText.value.length)
    const characterLimit = 280
    const isOverLimit = computed(() => characterCount.value > characterLimit)

    // Helper to always return a valid avatar src to avoid image flicker when src is null/empty
    const avatarOrDefault = (src) => {
      try {
        if (!src || src === 'null') return './assets/avatars/default.png'
        return src
      } catch (e) {
        return './assets/avatars/default.png'
      }
    }
    const canTweet = computed(() => 
      composeText.value.trim().length > 0 && !isOverLimit.value
    )
    
    const userTweets = computed(() => {
      if (!selectedProfile.value) return []
      return tweets.value.filter(tweet => tweet.user.id === selectedProfile.value.id)
    })
    
    
    const formatTime = (date) => {
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (minutes < 1) return "ahora"
      if (minutes < 60) return minutes + 'm'
      if (hours < 24) return hours + 'h'
      if (days < 7) return days + 'd'
      
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }
    
    const formatNumber = (num) => {
      if (num < 1000) return num.toString()
      if (num < 1000000) return (num / 1000).toFixed(1) + "K"
      return (num / 1000000).toFixed(1) + "M"
    }
    
    
    watch(searchQuery, () => {
      if (searchQuery.value.length > 2) {
        search()
      } else {
        searchResults.value = []
      }
    })
    
    
    onMounted(() => {
      try {
        // Guarded message handler so any malformed messages won't break the app
        window.__tuister_message_handler = function(event) {
          try {
            if (!event || !event.data) return;
            const data = event.data;
            if (data && data.action === 'tuister:registerResult') {
              // legacy handling
              if (data.data && data.data.success) {
                authError.value = ''
                // show notification (server may have included a verification code)
                emit('add-notification', { appId: 'tuister', title: 'Registro', message: data.data.message || 'Registro correcto', icon: 'tuister' })
              } else {
                authError.value = (data.data && data.data.error) || 'Error en registro'
              }
            }
          } catch (inner) {
            console.error('[Tuister] message handler error', inner);
          }
        };

        window.addEventListener('message', window.__tuister_message_handler);
      } catch (err) {
        console.error('[Tuister] onMounted setup failed', err);
      }

      // Load profile and tweets from server if available (no demo users)
      (async function loadInitial() {
        try {
          const profileRes = await fetch('https://bit-smartphone/tuister:loadProfile', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
          })
          const profileJson = await profileRes.json().catch(() => ({}))
          if (profileJson && profileJson.success && profileJson.profile && profileJson.profile.id) {
            currentUser.value = profileJson.profile
            currentView.value = 'home'
            
            // Load tweets with pagination
            const tweetsRes = await fetch('https://bit-smartphone/tuister:loadTweets', { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify({ offset: 0, limit: 50 }) 
            })
            const tweetsJson = await tweetsRes.json().catch(() => ({}))
            if (tweetsJson && tweetsJson.success && Array.isArray(tweetsJson.tweets)) {
              tweets.value = tweetsJson.tweets
            }
          }
        } catch (e) {
          console.error('[Tuister] loadInitial error', e)
        }
      })()
    })
    
    return {
      // State variables
      currentView,
      currentUser,
      isLoading,
      isDarkMode,
      selectedTab,
      authError,
      loginForm,
      registerForm,
      users,
      username,
      tweets,
      selectedTweet,
      selectedProfile,
      composeText,
      isComposing,
      isEditingProfile,
      profileEditForm,
      searchQuery,
      searchResults,
      trendingTopics,
      notifications,
      unreadNotifications,
      comments,
      newComment,
      isLoadingComments,
      
      // Computed properties
      characterCount,
      characterLimit,
      isOverLimit,
      canTweet,
      userTweets,
      
      // Methods
      login,
      register,
      logout,
      
      
      composeTweet,
      likeTweet,
      retweetTweet,
      openTweetDetail,
      openProfile,
      followUser,
      
      
      loadComments,
      addComment,
      likeComment,
      
      
      editProfile,
      saveProfile,
      
      
      setTab,
      goBack,
      
      
      formatTime,
      formatNumber,
  avatarOrDefault,
      emit
    }
  },
  
  template: `
    <div class="h-full w-full bg-white dark:bg-black text-black dark:text-white tuister-container flex flex-col" style="min-height:100%; display:flex; flex-direction:column;">

      
      <div v-if="currentView === 'login'" class="h-full flex flex-col items-center justify-center p-8">
        <div class="text-center mb-8">
          <svg class="w-16 h-16 mx-auto mb-4 text-blue-500">
            <use href="#icon-twitter"></use>
          </svg>
          <h1 class="text-3xl font-bold tuister-logo-gradient mb-2">Tuister</h1>
          <p class="text-gray-500 dark:text-gray-400">Conecta con el mundo</p>
        </div>
        
        <div class="w-full max-w-sm space-y-4">
          <div v-if="authError" class="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
            <p class="text-red-600 dark:text-red-400 text-sm">{{ authError }}</p>
          </div>
          <input
            v-model="loginForm.username"
            type="text"
            placeholder="Nombre de usuario"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
          />
          <input
            v-model="loginForm.password"
            type="password"
            placeholder="Contraseña"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
          />
          <button
            @click="login"
            :disabled="isLoading"
            class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 tuister-interactive"
          >
            <span v-if="isLoading">Iniciando sesión...</span>
            <span v-else>Iniciar Sesión</span>
          </button>
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Cuentas de prueba:</p>
            <p><strong>admin</strong> / admin123</p>
            <p><strong>demo</strong> / demo123</p>
          </div>
          <button
            @click="currentView = 'register'"
            class="w-full py-3 border border-blue-500 text-blue-500 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 tuister-interactive"
          >
            Crear cuenta
          </button>
        </div>
      </div>
      
      
      <div v-if="currentView === 'register'" class="h-full flex flex-col">
        <header class="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <button @click="goBack" class="mr-4">
            <svg class="w-6 h-6">
              <use href="#icon-chevron-left"></use>
            </svg>
          </button>
          <h1 class="text-xl font-semibold">Crear cuenta</h1>
        </header>
        
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="w-full max-w-sm space-y-4">
            <div v-if="authError" class="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
              <p class="text-red-600 dark:text-red-400 text-sm">{{ authError }}</p>
            </div>
            <input
              v-model="registerForm.displayName"
              placeholder="Nombre completo"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
            />
            <input
              v-model="registerForm.username"
              placeholder="Nombre de usuario"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
            />
            <input
              v-model="registerForm.password"
              type="password"
              placeholder="Contraseña"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
            />
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="Confirmar contraseña"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
            />
            <button
              @click="register"
              :disabled="isLoading"
              class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 tuister-interactive"
            >
              <span v-if="isLoading">Creando cuenta...</span>
              <span v-else>Crear cuenta</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Main App Views -->
      <div v-if="currentUser && ['home', 'search', 'profile', 'compose', 'post-detail'].includes(currentView)" class="h-full flex flex-col">
        
        <!-- Header -->
        <header class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-10">
          <div class="flex items-center">
            <button v-if="['profile', 'compose', 'post-detail'].includes(currentView)" @click="goBack" class="mr-4">
              <svg class="w-6 h-6">
                <use href="#icon-chevron-left"></use>
              </svg>
            </button>
            <div v-else class="w-8 h-8 rounded-full overflow-hidden mr-3" @click="setTab('profile')">
              <img :src="avatarOrDefault(currentUser.avatar)" :alt="currentUser.displayName" class="w-full h-full object-cover tuister-avatar-hover cursor-pointer" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
            </div>
            
            <div>
              <h1 v-if="currentView === 'home'" class="text-xl font-bold">Inicio</h1>
              <h1 v-else-if="currentView === 'search'" class="text-xl font-bold">Explorar</h1>
              <h1 v-else-if="currentView === 'profile'" class="text-xl font-bold">{{ selectedProfile?.displayName }}</h1>
              <h1 v-else-if="currentView === 'compose'" class="text-xl font-bold">Nuevo Tweet</h1>
              <h1 v-else-if="currentView === 'post-detail'" class="text-xl font-bold">Tweet</h1>
            </div>
          </div>
          
          <div class="flex items-center space-x-3">
            <button v-if="currentView === 'home'" @click="currentView = 'compose'; isComposing = true" class="p-2">
              <svg class="w-6 h-6 text-blue-500">
                <use href="#icon-plus"></use>
              </svg>
            </button>
            <button @click="logout" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg class="w-5 h-5">
                <use href="#icon-settings"></use>
              </svg>
            </button>
          </div>
        </header>
        
        
        <div v-if="currentView === 'search'" class="flex-1 overflow-hidden flex flex-col">
          <div class="p-4">
            <div class="relative">
              <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400">
                <use href="#icon-search"></use>
              </svg>
              <input
                v-model="searchQuery"
                placeholder="Buscar en Tuister"
                class="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 tuister-input"
              />
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto tuister-scrollbar">
            
            <div v-if="!searchQuery" class="p-4">
              <h2 class="text-xl font-bold mb-4">Tendencias para ti</h2>
              <div class="space-y-3">
                <div v-for="trend in trendingTopics" :key="trend.tag" 
                     class="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  <p class="font-semibold text-blue-500">{{ trend.tag }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ trend.tweets }} Tweets</p>
                </div>
              </div>
            </div>
            
            
            <div v-else class="p-4">
              <div v-if="isLoading" class="text-center py-8">
                <div class="tuister-loading">Buscando...</div>
              </div>
              <div v-else-if="searchResults.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No se encontraron resultados
              </div>
              <div v-else class="space-y-4">
                <div v-for="tweet in searchResults" :key="tweet.id" class="tweet-item" @click="openTweetDetail(tweet)">
                  
                  <div class="flex p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <img :src="avatarOrDefault(tweet.user.avatar)" :alt="tweet.user.displayName" 
                         class="w-12 h-12 rounded-full mr-3 tuister-avatar-hover" 
                         @click.stop="openProfile(tweet.user)" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-1">
                        <span class="font-semibold">{{ tweet.user.displayName }}</span>
                        <svg v-if="tweet.user.verified" class="w-5 h-5 tuister-verified-badge">
                          <use href="#icon-shield-check"></use>
                        </svg>
                        <span class="text-gray-500 dark:text-gray-400">@{{ tweet.user.username }}</span>
                        <span class="text-gray-500 dark:text-gray-400">·</span>
                        <span class="text-gray-500 dark:text-gray-400">{{ formatTime(tweet.timestamp) }}</span>
                      </div>
                      <p class="text-base mb-3 whitespace-pre-wrap">{{ tweet.content }}</p>
                      <div class="flex items-center justify-between max-w-md">
                        <button class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 tuister-action-btn">
                          <svg class="w-5 h-5">
                            <use href="#icon-message-square"></use>
                          </svg>
                          <span class="text-sm">{{ tweet.comments }}</span>
                        </button>
                        <button @click.stop="retweetTweet(tweet)" 
                                class="flex items-center space-x-1 tuister-action-btn"
                                :class="tweet.retweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'">
                          <svg class="w-5 h-5">
                            <use href="#icon-repeat"></use>
                          </svg>
                          <span class="text-sm">{{ formatNumber(tweet.retweets) }}</span>
                        </button>
                        <button @click.stop="likeTweet(tweet)" 
                                class="flex items-center space-x-1 like-btn tuister-action-btn"
                                :class="tweet.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'">
                          <svg class="w-5 h-5">
                            <use href="#icon-heart"></use>
                          </svg>
                          <span class="text-sm">{{ formatNumber(tweet.likes) }}</span>
                        </button>
                        <button class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 tuister-action-btn">
                          <svg class="w-5 h-5">
                            <use href="#icon-share"></use>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        
        <div v-if="currentView === 'home'" class="flex-1 overflow-y-auto tuister-scrollbar">
          
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <button @click="currentView = 'compose'; isComposing = true" 
                    class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-all duration-200 tuister-compose-btn">
              ¿Qué está pasando?
            </button>
          </div>
          
          
          <div v-if="isLoading" class="p-8 text-center">
            <div class="tuister-loading">Cargando tweets...</div>
          </div>
          <div v-else>
            <div v-for="tweet in tweets" :key="tweet.id" :data-tweet-id="tweet.id"
                 class="flex p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer tuister-tweet" 
                 @click="openTweetDetail(tweet)">
              <img :src="avatarOrDefault(tweet.user.avatar)" :alt="tweet.user.displayName" 
                   class="w-12 h-12 rounded-full mr-3 tuister-avatar-hover" 
                   @click.stop="openProfile(tweet.user)" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="font-semibold cursor-pointer hover:underline" @click.stop="openProfile(tweet.user)">{{ tweet.user.displayName }}</span>
                  <svg v-if="tweet.user.verified" class="w-5 h-5 tuister-verified-badge">
                    <use href="#icon-shield-check"></use>
                  </svg>
                  <span class="text-gray-500 dark:text-gray-400">@{{ tweet.user.username }}</span>
                  <span class="text-gray-500 dark:text-gray-400">·</span>
                  <span class="text-gray-500 dark:text-gray-400">{{ formatTime(tweet.timestamp) }}</span>
                </div>
                <p class="text-base mb-3 whitespace-pre-wrap">{{ tweet.content }}</p>
                <img v-if="tweet.images && tweet.images.length > 0" 
                     :src="tweet.images[0]" 
                     class="w-full max-w-lg rounded-2xl mb-3"/>
                <div class="flex items-center justify-between max-w-md">
                  <button class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 tuister-action-btn">
                    <svg class="w-5 h-5">
                      <use href="#icon-message-square"></use>
                    </svg>
                    <span class="text-sm">{{ tweet.comments }}</span>
                  </button>
                  <button @click.stop="retweetTweet(tweet)" 
                          class="flex items-center space-x-1 tuister-action-btn"
                          :class="tweet.retweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'">
                    <svg class="w-5 h-5">
                      <use href="#icon-repeat"></use>
                    </svg>
                    <span class="text-sm">{{ formatNumber(tweet.retweets) }}</span>
                  </button>
                  <button @click.stop="likeTweet(tweet)" 
                          class="flex items-center space-x-1 like-btn tuister-action-btn"
                          :class="tweet.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'">
                    <svg class="w-5 h-5">
                      <use href="#icon-heart"></use>
                    </svg>
                    <span class="text-sm">{{ formatNumber(tweet.likes) }}</span>
                  </button>
                  <button class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 tuister-action-btn">
                    <svg class="w-5 h-5">
                      <use href="#icon-share"></use>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        
        <div v-if="currentView === 'compose'" class="flex-1 flex flex-col">
          <div class="flex-1 p-4">
            <div class="flex">
              <img :src="avatarOrDefault(currentUser.avatar)" :alt="currentUser.displayName" class="w-12 h-12 rounded-full mr-3 tuister-avatar-hover" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
              <div class="flex-1">
                <textarea
                  v-model="composeText"
                  placeholder="¿Qué está pasando?"
                  class="w-full h-32 resize-none text-xl placeholder-gray-500 dark:placeholder-gray-400 bg-transparent border-none outline-none tuister-textarea"
                  maxlength="280"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <button class="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full">
                  <svg class="w-5 h-5">
                    <use href="#icon-image"></use>
                  </svg>
                </button>
              </div>
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-2">
                  <span class="text-sm tuister-char-counter"
                        :class="{ 'warning': characterCount > 250, 'danger': isOverLimit }">
                    {{ characterLimit - characterCount }}
                  </span>
                  <div class="w-8 h-8 relative">
                    <svg class="w-8 h-8 transform -rotate-90">
                      <circle cx="16" cy="16" r="14" fill="none" stroke="#e1e8ed" stroke-width="2"/>
                      <circle cx="16" cy="16" r="14" fill="none" 
                              :stroke="isOverLimit ? '#f91880' : characterCount > 250 ? '#ffad1f' : '#1d9bf0'"
                              stroke-width="2" 
                              :stroke-dasharray="87.96"
                              :stroke-dashoffset="87.96 - (87.96 * characterCount / characterLimit)"/>
                    </svg>
                  </div>
                </div>
                <button
                  @click="composeTweet"
                  :disabled="!canTweet || isLoading"
                  class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed tuister-interactive"
                >
                  <span v-if="isLoading">Publicando...</span>
                  <span v-else>Twittear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        
        <div v-if="currentView === 'profile' && selectedProfile" class="flex-1 overflow-y-auto tuister-scrollbar">
          
          <div class="relative">
            <div class="h-48 tuister-profile-banner" 
                 :style="{ backgroundImage: selectedProfile.banner ? \`url(\${selectedProfile.banner})\` : 'none' }">
            </div>
            <div class="px-4 pb-4">
              <div class="flex items-end justify-between -mt-16 mb-4">
                <img :src="avatarOrDefault(selectedProfile.avatar)" :alt="selectedProfile.displayName" 
                     class="w-32 h-32 rounded-full border-4 border-white dark:border-black" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
                <button v-if="selectedProfile.id !== currentUser.id"
                        @click="followUser(selectedProfile)"
                        class="px-6 py-2 rounded-full border font-semibold transition-all duration-200"
                        :class="selectedProfile.isFollowing || (currentUser.followingUsers && currentUser.followingUsers.includes(selectedProfile.id))
                          ? 'border-gray-300 text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-500' 
                          : 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'">
                  {{ (selectedProfile.isFollowing || (currentUser.followingUsers && currentUser.followingUsers.includes(selectedProfile.id))) ? 'Siguiendo' : 'Seguir' }}
                </button>
                <button v-else @click="editProfile"
                        class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
                  Editar perfil
                </button>
              </div>
              
              <div class="mb-4">
                <h1 class="text-2xl font-bold flex items-center">
                  {{ selectedProfile.displayName }}
                  <svg v-if="selectedProfile.verified" class="w-6 h-6 ml-2 tuister-verified-badge">
                    <use href="#icon-shield-check"></use>
                  </svg>
                </h1>
                <p class="text-gray-500 dark:text-gray-400">@{{ selectedProfile.username }}</p>
              </div>
              
              <p v-if="selectedProfile.bio" class="text-base mb-4">{{ selectedProfile.bio }}</p>
              
              <div class="flex items-center space-x-4 text-gray-500 dark:text-gray-400 text-sm mb-4">
                <div v-if="selectedProfile.location" class="flex items-center">
                  <svg class="w-4 h-4 mr-1">
                    <use href="#icon-map"></use>
                  </svg>
                  {{ selectedProfile.location }}
                </div>
                <div v-if="selectedProfile.website" class="flex items-center">
                  <svg class="w-4 h-4 mr-1">
                    <use href="#icon-globe"></use>
                  </svg>
                  <a :href="selectedProfile.website" class="text-blue-500 hover:underline">{{ selectedProfile.website }}</a>
                </div>
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1">
                    <use href="#icon-calendar"></use>
                  </svg>
                  Se unió en {{ selectedProfile.joined?.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}
                </div>
              </div>
              
              <div class="flex items-center space-x-6 text-sm">
                <div>
                  <span class="font-semibold">{{ formatNumber(selectedProfile.following) }}</span>
                  <span class="text-gray-500 dark:text-gray-400 ml-1">Siguiendo</span>
                </div>
                <div>
                  <span class="font-semibold">{{ formatNumber(selectedProfile.followers) }}</span>
                  <span class="text-gray-500 dark:text-gray-400 ml-1">Seguidores</span>
                </div>
              </div>
            </div>
          </div>
          
          
          <div class="border-b border-gray-200 dark:border-gray-700">
            <div class="flex">
              <button class="flex-1 py-4 text-center font-semibold border-b-2 border-blue-500 text-blue-500">
                Tweets
              </button>
              <button class="flex-1 py-4 text-center text-gray-500 dark:text-gray-400">
                Respuestas
              </button>
              <button class="flex-1 py-4 text-center text-gray-500 dark:text-gray-400">
                Me gusta
              </button>
            </div>
          </div>
          
          
          <div>
            <div v-for="tweet in userTweets" :key="tweet.id" :data-tweet-id="tweet.id"
                 class="flex p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer tuister-tweet" 
                 @click="openTweetDetail(tweet)">
              <img :src="avatarOrDefault(tweet.user.avatar)" :alt="tweet.user.displayName" 
                   class="w-12 h-12 rounded-full mr-3" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="font-semibold">{{ tweet.user.displayName }}</span>
                  <svg v-if="tweet.user.verified" class="w-5 h-5 tuister-verified-badge">
                    <use href="#icon-shield-check"></use>
                  </svg>
                  <span class="text-gray-500 dark:text-gray-400">@{{ tweet.user.username }}</span>
                  <span class="text-gray-500 dark:text-gray-400">·</span>
                  <span class="text-gray-500 dark:text-gray-400">{{ formatTime(tweet.timestamp) }}</span>
                </div>
                <p class="text-base mb-3 whitespace-pre-wrap">{{ tweet.content }}</p>
                <div class="flex items-center justify-between max-w-md">
                  <button class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 tuister-action-btn">
                    <svg class="w-5 h-5">
                      <use href="#icon-message-square"></use>
                    </svg>
                    <span class="text-sm">{{ tweet.comments }}</span>
                  </button>
                  <button @click.stop="retweetTweet(tweet)" 
                          class="flex items-center space-x-1 tuister-action-btn"
                          :class="tweet.retweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'">
                    <svg class="w-5 h-5">
                      <use href="#icon-repeat"></use>
                    </svg>
                    <span class="text-sm">{{ formatNumber(tweet.retweets) }}</span>
                  </button>
                  <button @click.stop="likeTweet(tweet)" 
                          class="flex items-center space-x-1 like-btn tuister-action-btn"
                          :class="tweet.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'">
                    <svg class="w-5 h-5">
                      <use href="#icon-heart"></use>
                    </svg>
                    <span class="text-sm">{{ formatNumber(tweet.likes) }}</span>
                  </button>
                  <button class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 tuister-action-btn">
                    <svg class="w-5 h-5">
                      <use href="#icon-share"></use>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        
        <div v-if="currentView === 'post-detail' && selectedTweet" class="flex-1 overflow-y-auto tuister-scrollbar">
          <div class="p-4">
            <div class="flex mb-4">
              <img :src="avatarOrDefault(selectedTweet.user.avatar)" :alt="selectedTweet.user.displayName" 
                   class="w-14 h-14 rounded-full mr-4 tuister-avatar-hover cursor-pointer" 
                   @click="openProfile(selectedTweet.user)" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="font-semibold text-lg cursor-pointer hover:underline" @click="openProfile(selectedTweet.user)">{{ selectedTweet.user.displayName }}</span>
                  <svg v-if="selectedTweet.user.verified" class="w-6 h-6 tuister-verified-badge">
                    <use href="#icon-shield-check"></use>
                  </svg>
                </div>
                <p class="text-gray-500 dark:text-gray-400">@{{ selectedTweet.user.username }}</p>
              </div>
            </div>
            
            <p class="text-xl mb-4 whitespace-pre-wrap">{{ selectedTweet.content }}</p>
            
            <img v-if="selectedTweet.images && selectedTweet.images.length > 0" 
                 :src="selectedTweet.images[0]" 
                 class="w-full rounded-2xl mb-4"/>
            
            <div class="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {{ selectedTweet.timestamp.toLocaleString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) }}
            </div>
            
            <div class="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
              <div class="flex items-center space-x-6">
                <div class="flex items-center space-x-1">
                  <span class="font-semibold">{{ formatNumber(selectedTweet.retweets) }}</span>
                  <span class="text-gray-500 dark:text-gray-400">Retweets</span>
                </div>
                <div class="flex items-center space-x-1">
                  <span class="font-semibold">{{ formatNumber(selectedTweet.likes) }}</span>
                  <span class="text-gray-500 dark:text-gray-400">Me gusta</span>
                </div>
                <div class="flex items-center space-x-1">
                  <span class="font-semibold">{{ selectedTweet.comments }}</span>
                  <span class="text-gray-500 dark:text-gray-400">Comentarios</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-around border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <button class="flex items-center justify-center w-12 h-12 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 tuister-action-btn">
                <svg class="w-6 h-6">
                  <use href="#icon-message-square"></use>
                </svg>
              </button>
              <button @click="retweetTweet(selectedTweet)" 
                      class="flex items-center justify-center w-12 h-12 rounded-full tuister-action-btn"
                      :class="selectedTweet.retweeted ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'">
                <svg class="w-6 h-6">
                  <use href="#icon-repeat"></use>
                </svg>
              </button>
              <button @click="likeTweet(selectedTweet)" 
                      class="flex items-center justify-center w-12 h-12 rounded-full like-btn tuister-action-btn"
                      :class="selectedTweet.liked ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'">
                <svg class="w-6 h-6">
                  <use href="#icon-heart"></use>
                </svg>
              </button>
              <button class="flex items-center justify-center w-12 h-12 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 tuister-action-btn">
                <svg class="w-6 h-6">
                  <use href="#icon-share"></use>
                </svg>
              </button>
            </div>
            
            
            <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div class="flex space-x-3">
                <img :src="avatarOrDefault(currentUser.avatar)" :alt="currentUser.displayName" 
                     class="w-10 h-10 rounded-full"/>
                <div class="flex-1">
                  <textarea
                    v-model="newComment"
                    placeholder="Escribe tu comentario..."
                    class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 resize-none"
                    rows="3"
                  ></textarea>
                  <div class="flex justify-end mt-2">
                    <button
                      @click="addComment"
                      :disabled="!newComment.trim() || isLoading"
                      class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span v-if="isLoading">Comentando...</span>
                      <span v-else>Comentar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Comentarios</h3>
                <button @click="loadComments(selectedTweet.id)" 
                        :disabled="isLoadingComments"
                        class="text-blue-500 hover:text-blue-600 text-sm font-medium">
                  <span v-if="isLoadingComments">Cargando...</span>
                  <span v-else>Actualizar</span>
                </button>
              </div>
              
              <div v-if="isLoadingComments" class="text-center py-4">
                <div class="tuister-loading">Cargando comentarios...</div>
              </div>
              
              <div v-else-if="comments.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </div>
              
              <div v-else class="space-y-4">
                <div v-for="comment in comments" :key="comment.id" 
                     class="flex space-x-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-colors">
                  <img :src="avatarOrDefault(comment.user.avatar)" :alt="comment.user.displayName" 
                       class="w-10 h-10 rounded-full cursor-pointer tuister-avatar-hover"
                       @click="openProfile(comment.user)" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
                  <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                      <span class="font-semibold cursor-pointer hover:underline" 
                            @click="openProfile(comment.user)">{{ comment.user.displayName }}</span>
                      <svg v-if="comment.user.verified" class="w-4 h-4 tuister-verified-badge">
                        <use href="#icon-shield-check"></use>
                      </svg>
                      <span class="text-gray-500 dark:text-gray-400 text-sm">@{{ comment.user.username }}</span>
                      <span class="text-gray-500 dark:text-gray-400 text-sm">·</span>
                      <span class="text-gray-500 dark:text-gray-400 text-sm">{{ formatTime(comment.timestamp) }}</span>
                    </div>
                    <p class="text-sm mb-2">{{ comment.content }}</p>
                    <div class="flex items-center space-x-4">
                      <button @click="likeComment(comment)" 
                              class="flex items-center space-x-1 text-gray-500 hover:text-red-500 tuister-action-btn text-sm"
                              :class="comment.liked ? 'text-red-500' : ''">
                        <svg class="w-4 h-4">
                          <use href="#icon-heart"></use>
                        </svg>
                        <span>{{ comment.likes }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bottom Navigation (only show when logged in) -->
        <nav v-if="currentUser" class="flex items-center justify-around py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
          <button @click="setTab('home')" 
                  class="flex flex-col items-center py-2 px-4 tuister-nav-item"
                  :class="selectedTab === 'home' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'">
            <svg class="w-6 h-6 mb-1">
              <use href="#icon-home"></use>
            </svg>
            <span class="text-xs">Inicio</span>
          </button>
          <button @click="setTab('search')" 
                  class="flex flex-col items-center py-2 px-4 tuister-nav-item"
                  :class="selectedTab === 'search' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'">
            <svg class="w-6 h-6 mb-1">
              <use href="#icon-search"></use>
            </svg>
            <span class="text-xs">Explorar</span>
          </button>
          <button @click="setTab('notifications')" 
                  class="flex flex-col items-center py-2 px-4 tuister-nav-item relative"
                  :class="selectedTab === 'notifications' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'">
            <svg class="w-6 h-6 mb-1">
              <use href="#icon-bell"></use>
            </svg>
            <span class="text-xs">Notificaciones</span>
            <div v-if="unreadNotifications > 0" 
                 class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {{ unreadNotifications > 9 ? '9+' : unreadNotifications }}
            </div>
          </button>
          <button @click="setTab('profile')" 
                  class="flex flex-col items-center py-2 px-4 tuister-nav-item"
                  :class="selectedTab === 'profile' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'">
            <img :src="avatarOrDefault(currentUser.avatar)" :alt="currentUser.displayName" class="w-6 h-6 rounded-full mb-1" @error="(e)=>{e.target.src='./assets/avatars/default.png'}"/>
            <span class="text-xs">Perfil</span>
          </button>
        </nav>
      </div>
      
      
      <div v-if="isEditingProfile" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 tuister-modal-backdrop">
        <div class="w-11/12 max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 tuister-modal-content">
          <h3 class="text-xl font-semibold mb-6">Editar perfil</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nombre</label>
              <input
                v-model="profileEditForm.displayName"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 tuister-input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Bio</label>
              <textarea
                v-model="profileEditForm.bio"
                rows="3"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 resize-none tuister-input"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Ubicación</label>
              <input
                v-model="profileEditForm.location"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 tuister-input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Sitio web</label>
              <input
                v-model="profileEditForm.website"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 tuister-input"
              />
            </div>
          </div>
          
          <div class="flex space-x-3 mt-8">
            <button @click="isEditingProfile = false"
                    class="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
              Cancelar
            </button>
            <button @click="saveProfile"
                    class="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors duration-200">
              Guardar
            </button>
          </div>
        </div>
      </div>
      
    </div>
  `
}

window.Tuister = Tuister;

// Ensure Tuister is exposed globally without throwing
try {
    if (typeof window !== 'undefined') {
        window.Tuister = window.Tuister || Tuister;
    }
} catch (e) {
    console.error('Failed to expose Tuister globally', e);
}