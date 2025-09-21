const Tuister = {
  name: 'Tuister',
  props: ["userSettings", "t"],
  emits: ["close", "open-app", "add-notification", "updateSetting", "takePhoto", "playTrack", "pauseMusic", "orientationChange", "resumeMusic", "stopMusic", "setMusicProgress", "setMusicVolume", "setPlaylist"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;
    
    const handleError = (error, context = 'Unknown') => {
      console.error(`[Tuister] Error in ${context}:`, error);
      return false;
    };
    
    const translate = (key, params = {}) => {
      try {
        if (props.t && typeof props.t === 'function') {
          return props.t(key, params)
        }
        
        const lang = (window.setupData && window.setupData.language) || "es"
        if (window.translations && window.translations[lang]) {
          const value = key.split(".").reduce((obj, k) => obj && obj[k], window.translations[lang])
          if (typeof value === "string") {
            return Object.entries(params).reduce((str, [pKey, pValue]) => str.replace(new RegExp("\\{" + pKey + "\\}", "g"), pValue), value)
          }
          if (value) return value
        }
        return key
      } catch (error) {
        console.error('[Tuister] Translation error:', error)
        return key
      }
    };
    
    
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
      website: "",
      avatar: "",
      banner: ""
    })
    
  const showPhotoOptions = ref(false)
  const showPhotoTypeSelector = ref(false)
  const selectedPhotoUrl = ref("")
  const photoTarget = ref('avatar') 
  const photosGallery = ref([])
  const showGalleryModal = ref(false)
  const galleryLoading = ref(false)
    
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
        authError.value = props.t('tuister.completeAllFields')
        return
      }

      isLoading.value = true

      try {
        const res = await fetch('https://bit-smartphone/tuister:loadProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        const json = await res.json().catch(() => ({}))

        if (json && json.success && json.profile && json.profile.id) {
          currentUser.value = json.profile
          currentView.value = 'home'
          authError.value = ''

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
            title: props.t('tuister.title'),
            message: props.t('tuister.welcomeBack') + ', ' + (currentUser.value.displayName || currentUser.value.username) + '!',
            icon: 'tuister'
          })
        } else {
          authError.value = props.t('tuister.accountNotFound')
        }
      } catch (e) {
        console.error('[Tuister] login error', e)
        authError.value = props.t('tuister.connectionError')
      } finally {
        isLoading.value = false
        loginForm.value = { username: '', password: '' }
      }
    }

    const register = async () => {
      authError.value = ''

      if (!registerForm.value.username || !registerForm.value.password || !registerForm.value.displayName) {
        authError.value = translate('tuister.completeAllFields')
        return
      }

      if (registerForm.value.password !== registerForm.value.confirmPassword) {
        authError.value = translate('tuister.passwordsDontMatch')
        return
      }

      if (registerForm.value.password.length < 6) {
        authError.value = translate('tuister.passwordTooShort')
        return
      }

      isLoading.value = true

      try {
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

        if (json && json.success) {
          const profileRes = await fetch('https://bit-smartphone/tuister:loadProfile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
          const profileJson = await profileRes.json().catch(() => ({}))
          

          if (profileJson && profileJson.success && profileJson.profile && profileJson.profile.id) {
            currentUser.value = profileJson.profile
            currentView.value = 'home'

            emit('add-notification', {
              appId: 'tuister',
              title: translate('tuister.welcomeToTuister'),
              message: translate('tuister.accountCreated', { username: currentUser.value.username || registerForm.value.username }),
              icon: 'tuister'
            })

            registerForm.value = { username: '', password: '', confirmPassword: '', displayName: '' }
          } else {
            authError.value = 'Cuenta creada. Inicia sesión para continuar.'
            currentView.value = 'login'
            registerForm.value = { username: '', password: '', confirmPassword: '', displayName: '' }
          }
        }
      } catch (e) {
        console.error('[Tuister] register error', e)
        authError.value = translate('tuister.errorCreatingAccount')
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
          title: translate('tuister.tweetPosted'),
          message: translate('tuister.tweetPostedMessage'),
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
        
        tweet.liked = !tweet.liked
        tweet.likes += tweet.liked ? 1 : -1
        
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
      try {
        if (!user || !user.id) {
          console.error('[Tuister] Invalid user object passed to openProfile:', user);
          return;
        }
        
        selectedProfile.value = {
          ...user,
          avatar: user.avatar || './assets/avatars/default.svg',
          joined: user.joined || new Date().toISOString()
        };
        currentView.value = "profile";
      } catch (error) {
        console.error('[Tuister] Error in openProfile:', error);
      }
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
          message: translate('tuister.nowFollowing', { username: user.username }),
          icon: 'tuister'
        })
      }
    }
    
    
    const loadComments = async (tweetId) => {
      isLoadingComments.value = true
      try {
        comments.value = []
      } catch (e) {
        console.error('[Tuister] loadComments error', e)
        comments.value = []
      } finally {
        isLoadingComments.value = false
      }
      
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
          title: translate('tuister.commentPosted'),
          message: translate('tuister.commentPostedMessage'),
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
        displayName: currentUser.value.displayName || currentUser.value.username || '',
        bio: currentUser.value.bio,
        location: currentUser.value.location || "",
        website: currentUser.value.website || "",
        avatar: currentUser.value.avatar || '',
        banner: currentUser.value.banner || ''
      }
      isEditingProfile.value = true
    }
    
    const saveProfile = async () => {
      try {
        await fetch('https://bit-smartphone/tuister:updateProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: profileEditForm.value.displayName || currentUser.value.displayName || currentUser.value.username || '',
            bio: profileEditForm.value.bio,
            avatar: profileEditForm.value.avatar || currentUser.value.avatar,
            banner: profileEditForm.value.banner || currentUser.value.banner
          })
        })
        
  currentUser.value.displayName = profileEditForm.value.displayName || currentUser.value.displayName
  currentUser.value.bio = profileEditForm.value.bio
  currentUser.value.location = profileEditForm.value.location
  currentUser.value.website = profileEditForm.value.website
  if (profileEditForm.value.avatar) currentUser.value.avatar = profileEditForm.value.avatar
  if (profileEditForm.value.banner) currentUser.value.banner = profileEditForm.value.banner
        isEditingProfile.value = false
        
        emit('add-notification', {
          appId: 'tuister',
          title: translate('tuister.profileUpdated'),
          message: translate('tuister.profileUpdatedMessage'),
          icon: 'tuister'
        })
      } catch (e) {
        console.error('[Tuister] saveProfile error', e)
      }
    }
    
    const openPhotoOptions = (target = 'avatar') => {
      photoTarget.value = target
      showPhotoOptions.value = true
    }

    const selectFromGallery = async () => {
      try {
        showPhotoOptions.value = false
        galleryLoading.value = true
        const res = await fetch('https://bit-smartphone/photos:list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        const json = await res.json().catch(() => ({ ok: false }))
        photosGallery.value = (json && json.ok && Array.isArray(json.photos)) ? json.photos : []
        showGalleryModal.value = true
      } catch (error) {
        console.error('[Tuister] Error selecting from gallery:', error)
        photosGallery.value = []
      } finally {
        galleryLoading.value = false
      }
    }

    const takePhotoWithCameraTarget = async (target = 'avatar') => {
      try {
        emit('takePhoto', {
          callback: (photoUrl) => {
            if (photoUrl) {
              if (target === 'avatar') {
                profileEditForm.value.avatar = photoUrl
                showPhotoOptions.value = false
              } else if (target === 'banner') {
                profileEditForm.value.banner = photoUrl
                showPhotoOptions.value = false
              } else {
                selectedPhotoUrl.value = photoUrl
                showPhotoTypeSelector.value = true
                showPhotoOptions.value = false
              }
            }
          }
        })
      } catch (error) {
        console.error('[Tuister] Error taking photo:', error)
      }
    }

    const takePhotoWithCamera = () => takePhotoWithCameraTarget(photoTarget.value || 'avatar')
    
    const setAsAvatar = (url) => {
      const u = (typeof url === 'string' && url) || selectedPhotoUrl.value
      if (u) {
        profileEditForm.value.avatar = u
        showPhotoTypeSelector.value = false
        selectedPhotoUrl.value = ""
        showGalleryModal.value = false
      }
    }

    const setAsBanner = (url) => {
      const u = (typeof url === 'string' && url) || selectedPhotoUrl.value
      if (u) {
        profileEditForm.value.banner = u
        showPhotoTypeSelector.value = false
        selectedPhotoUrl.value = ""
        showGalleryModal.value = false
      }
    }

    const choosePhotoFromGallery = (photo) => {
      if (!photo || !photo.url) return
      if (photoTarget.value === 'avatar') {
        setAsAvatar(photo.url)
      } else if (photoTarget.value === 'banner') {
        setAsBanner(photo.url)
      } else {
        selectedPhotoUrl.value = photo.url
        showPhotoTypeSelector.value = true
      }
      showGalleryModal.value = false
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

    const avatarOrDefault = (src) => {
      try {
        if (!src || src === 'null' || src === '' || src === undefined) return './assets/avatars/default.svg'
        return src
      } catch (e) {
        return './assets/avatars/default.svg'
      }
    }

    const joinedDisplay = (joined) => {
      try {
        if (!joined || joined === null || joined === undefined) return 'Fecha desconocida'
        
        if (typeof joined === 'string' || typeof joined === 'number') {
          const d = new Date(joined)
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
          }
          
          const parts = String(joined).split('-')
          if (parts.length >= 3) {
            const y = parseInt(parts[0], 10)
            const m = parseInt(parts[1], 10) - 1
            const day = parseInt(parts[2], 10)
            if (!isNaN(y) && !isNaN(m) && !isNaN(day)) {
              const d2 = new Date(y, m, day)
              if (!isNaN(d2.getTime())) {
                return d2.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              }
            }
          }
          return 'Fecha desconocida'
        }
        
        if (joined instanceof Date && !isNaN(joined.getTime())) {
          return joined.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        }
        
        return 'Fecha desconocida'
      } catch (e) {
        console.error('[Tuister] Error in joinedDisplay:', e)
        return 'Fecha desconocida'
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
      
      if (minutes < 1) return translate('tuister.now')
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
        window.__tuister_message_handler = function(event) {
          try {
            if (!event || !event.data) return;
            const data = event.data;
            if (data && data.action === 'tuister:registerResult') {
              if (data.data && data.data.success) {
                authError.value = ''
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

      (async function loadInitial() {
        try {
          const profileRes = await fetch('https://bit-smartphone/tuister:loadProfile', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
          })
          const profileJson = await profileRes.json().catch(() => ({}))
          if (profileJson && profileJson.success && profileJson.profile && profileJson.profile.id) {
            currentUser.value = profileJson.profile
            currentView.value = 'home'
            
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

    const handlePhotoShare = (event) => {
      if (event.detail) {
        const photoUrl = event.detail.photo?.url || event.detail.photoUrl;
        if (photoUrl) {
          if (selectedTab.value === 'home' && currentView.value === 'home') {
            composeText.value = (composeText.value || '') + ' ' + photoUrl;
          }
        }
      }
    };

    onMounted(() => {
      window.addEventListener('phone:share-photo', handlePhotoShare);
    });

    onUnmounted(() => {
      window.removeEventListener('phone:share-photo', handlePhotoShare);
    });
    
    return {
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
      
      characterCount,
      characterLimit,
      isOverLimit,
      canTweet,
      userTweets,
      
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
      
  openPhotoOptions,
      showPhotoOptions,
      showPhotoTypeSelector,
      selectedPhotoUrl,
  showGalleryModal,
  galleryLoading,
  photosGallery,
  photoTarget,
      selectFromGallery,
      takePhotoWithCamera,
  choosePhotoFromGallery,
      setAsAvatar,
      setAsBanner,
      
      setTab,
      goBack,
      
      formatTime,
      formatNumber,
      avatarOrDefault,
      joinedDisplay,
      handleError,
      emit,
      
      t: (key, params = {}) => {
        try {
          if (props.t && typeof props.t === 'function') {
            return props.t(key, params)
          }
          
          const lang = (window.setupData && window.setupData.language) || "es"
          if (window.translations && window.translations[lang]) {
            const value = key.split(".").reduce((obj, k) => obj && obj[k], window.translations[lang])
            if (typeof value === "string") {
              return Object.entries(params).reduce((str, [pKey, pValue]) => str.replace(new RegExp("\\{" + pKey + "\\}", "g"), pValue), value)
            }
            if (value) return value
          }
          return key
        } catch (error) {
          console.error('[Tuister] Translation error:', error)
          return key
        }
      },
      
      translate
    }
  },
  
  errorCaptured(error, instance, info) {
    console.error('[Tuister] Error captured:', error, info);
    return false;
  },
  
  template: `
    <div class="h-full w-full bg-white dark:bg-black text-black dark:text-white tuister-container flex flex-col" style="min-height:100%; display:flex; flex-direction:column;" @error="handleError">

      
      <div v-if="currentView === 'login'" class="h-full flex flex-col items-center justify-center p-8">
        <div class="text-center mb-8">
          <svg class="w-16 h-16 mx-auto mb-4 text-blue-500">
            <use href="#icon-twitter"></use>
          </svg>
          <h1 class="text-3xl font-bold tuister-logo-gradient mb-2">{{ t('tuister.title') }}</h1>
          <p class="text-gray-500 dark:text-gray-400">{{ t('tuister.connectWithWorld') }}</p>
        </div>
        
        <div class="w-full max-w-sm space-y-4">
          <div v-if="authError" class="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
            <p class="text-red-600 dark:text-red-400 text-sm">{{ authError }}</p>
          </div>
          <input
            v-model="loginForm.username"
            type="text"
            :placeholder="translate('tuister.username')"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
          />
          <input
            v-model="loginForm.password"
            type="password"
            :placeholder="translate('tuister.password')"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
          />
          <button
            @click="login"
            :disabled="isLoading"
            class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 tuister-interactive"
          >
            <span v-if="isLoading">{{ t('tuister.signingIn') }}</span>
            <span v-else>{{ t('tuister.login') }}</span>
          </button>
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>{{ t('tuister.signInOrRegister') }}</p>
          </div>
          <button
            @click="currentView = 'register'"
            class="w-full py-3 border border-blue-500 text-blue-500 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 tuister-interactive"
          >
            {{ t('tuister.createAccount') }}
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
          <h1 class="text-xl font-semibold">{{ t('tuister.createAccount') }}</h1>
        </header>
        
        <div class="flex-1 flex items-center justify-center p-8">
          <div class="w-full max-w-sm space-y-4">
            <div v-if="authError" class="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
              <p class="text-red-600 dark:text-red-400 text-sm">{{ authError }}</p>
            </div>
            <input
              v-model="registerForm.displayName"
              :placeholder="translate('tuister.fullName')"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
            />
            <input
              v-model="registerForm.username"
              :placeholder="translate('tuister.username')"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
            />
            <input
              v-model="registerForm.password"
              type="password"
              :placeholder="translate('tuister.password')"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
            />
            <input
              v-model="registerForm.confirmPassword"
              type="password"
              :placeholder="translate('tuister.confirmPassword')"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 tuister-input"
            />
            <button
              @click="register"
              :disabled="isLoading"
              class="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 tuister-interactive"
            >
              <span v-if="isLoading">{{ t('tuister.creatingAccount') }}</span>
              <span v-else>{{ t('tuister.createAccount') }}</span>
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="currentUser && ['home', 'search', 'profile', 'compose', 'post-detail'].includes(currentView)" class="h-full flex flex-col">
        
  <header class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-10" style="margin-top:8px;">
          <div class="flex items-center">
            <button v-if="['profile', 'compose', 'post-detail'].includes(currentView)" @click="goBack" class="mr-4">
              <svg class="w-6 h-6">
                <use href="#icon-chevron-left"></use>
              </svg>
            </button>
            <div v-else class="w-8 h-8 rounded-full overflow-hidden mr-3" @click="setTab('profile')">
              <img :src="avatarOrDefault(currentUser.avatar)" :alt="currentUser.displayName" class="w-full h-full object-cover tuister-avatar-hover cursor-pointer" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
            </div>
            
            <div>
              <h1 v-if="currentView === 'home'" class="text-xl font-bold">{{ t('tuister.home') }}</h1>
              <h1 v-else-if="currentView === 'search'" class="text-xl font-bold">{{ t('tuister.explore') }}</h1>
              <h1 v-else-if="currentView === 'profile'" class="text-xl font-bold">{{ selectedProfile?.displayName }}</h1>
              <h1 v-else-if="currentView === 'compose'" class="text-xl font-bold">{{ t('tuister.newTweet') }}</h1>
              <h1 v-else-if="currentView === 'post-detail'" class="text-xl font-bold">{{ t('tuister.tweet') }}</h1>
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
                :placeholder="translate('tuister.searchTwitter')"
                class="w-full pl-12 pr-4 py-3 bg-gray-900 text-white border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 tuister-input"
              />
            </div>
          </div>
          
          <div class="flex-1 overflow-y-auto tuister-scrollbar">
            
            <div v-if="!searchQuery" class="p-4">
              <h2 class="text-xl font-bold mb-4">{{ t('tuister.trendingForYou') }}</h2>
              <div class="space-y-3">
                <div v-for="trend in trendingTopics" :key="trend.tag" 
                     class="p-3 rounded-xl hover:bg-gray-800 cursor-pointer transition-colors">
                  <p class="font-semibold text-blue-500">{{ trend.tag }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ trend.tweets }} Tweets</p>
                </div>
              </div>
            </div>
            
            
            <div v-else class="p-4">
              <div v-if="isLoading" class="text-center py-8">
                <div class="tuister-loading">{{ t('tuister.searching') }}</div>
              </div>
              <div v-else-if="searchResults.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                {{ t('tuister.noResults') }}
              </div>
              <div v-else class="space-y-4">
                <div v-for="tweet in searchResults" :key="tweet.id" class="tweet-item" @click="openTweetDetail(tweet)">
                  
                  <div class="flex p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <img :src="avatarOrDefault(tweet.user.avatar)" :alt="tweet.user.displayName" 
                         class="w-12 h-12 rounded-full mr-3 tuister-avatar-hover" 
                         @click.stop="openProfile(tweet.user)" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
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
                   @click.stop="openProfile(tweet.user)" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
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
              <img :src="avatarOrDefault(currentUser.avatar)" :alt="currentUser.displayName" class="w-12 h-12 rounded-full mr-3 tuister-avatar-hover" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
              <div class="flex-1">
                <textarea
                  v-model="composeText"
                  :placeholder="translate('tuister.whatHappening')"
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
                     class="w-32 h-32 rounded-full border-4 border-white dark:border-black" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
                <button v-if="selectedProfile.id !== currentUser.id"
                        @click="followUser(selectedProfile)"
                        class="px-6 py-2 rounded-full border font-semibold transition-all duration-200"
                        :class="selectedProfile.isFollowing || (currentUser.followingUsers && currentUser.followingUsers.includes(selectedProfile.id))
                          ? 'border-gray-300 text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-500' 
                          : 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'">
                  {{ (selectedProfile.isFollowing || (currentUser.followingUsers && currentUser.followingUsers.includes(selectedProfile.id))) ? translate('tuister.following') : translate('tuister.follow') }}
                </button>
                <button v-else @click="editProfile"
                        class="px-6 py-2 border border-gray-600 text-white rounded-full font-semibold hover:bg-gray-800 transition-all duration-200">
                  {{ t('tuister.editProfile') }}
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
                  Se unió en {{ selectedProfile && selectedProfile.joined ? joinedDisplay(selectedProfile.joined) : 'Fecha desconocida' }}
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
                   class="w-12 h-12 rounded-full mr-3" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
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
                   @click="openProfile(selectedTweet.user)" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
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
            
            
            <div class="mb-6 p-4 bg-black border border-gray-800 rounded-xl">
              <div class="flex space-x-3">
                <img :src="avatarOrDefault(currentUser.avatar)" :alt="currentUser.displayName" 
                     class="w-10 h-10 rounded-full" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
                <div class="flex-1">
                  <textarea
                    v-model="newComment"
                    :placeholder="translate('tuister.writeComment')"
                    class="w-full p-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:outline-none focus:border-blue-500 resize-none"
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
                       @click="openProfile(comment.user)" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
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
            <img :src="avatarOrDefault(currentUser.avatar)" :alt="currentUser.displayName" class="w-6 h-6 rounded-full mb-1" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}"/>
            <span class="text-xs">Perfil</span>
          </button>
        </nav>
      </div>
      
      
      <div v-if="isEditingProfile" class="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 tuister-modal-backdrop">
        <div class="w-11/12 max-w-md bg-black border border-gray-800 rounded-2xl p-6 tuister-modal-content">
          <h3 class="text-xl font-semibold mb-6">{{ t('tuister.editProfile') }}</h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2 text-white">Nombre</label>
              <input
                v-model="profileEditForm.displayName"
                class="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:outline-none focus:border-blue-500 tuister-input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-white">Bio</label>
              <textarea
                v-model="profileEditForm.bio"
                rows="3"
                class="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:outline-none focus:border-blue-500 resize-none tuister-input"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-white">Ubicación</label>
              <input
                v-model="profileEditForm.location"
                class="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:outline-none focus:border-blue-500 tuister-input"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-white">Sitio web</label>
              <input
                v-model="profileEditForm.website"
                class="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:outline-none focus:border-blue-500 tuister-input"
              />
            </div>
            
            <div class="space-y-4 border-t border-gray-700 pt-4">
              <h4 class="text-lg font-semibold text-white">Imágenes de Perfil</h4>
              
              <div class="space-y-3">
  <button @click="openPhotoOptions('')"
                        class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>Seleccionar Foto</span>
                </button>
              </div>
              
              <div v-if="profileEditForm.avatar">
                <label class="block text-sm font-medium mb-2 text-white">Foto de Perfil (Avatar)</label>
                <div class="flex space-x-3">
      <button @click.prevent="openPhotoOptions('avatar')"
                          class="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>Tomar Foto</span>
                  </button>
                  <input
                    v-model="profileEditForm.avatar"
                    placeholder="O ingresa URL de la imagen..."
                    class="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
                <div v-if="profileEditForm.avatar" class="mt-2">
                  <img :src="profileEditForm.avatar" alt="Vista previa del avatar" class="w-16 h-16 rounded-full object-cover border border-gray-600" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}" />
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-3 mt-8">
            <button @click="isEditingProfile = false"
                    class="flex-1 py-3 px-4 border border-gray-600 text-gray-300 rounded-xl font-medium hover:bg-gray-800 transition-colors duration-200">
              {{ t('tuister.cancel') }}
            </button>
            <button @click="saveProfile"
                    class="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors duration-200">
              {{ t('tuister.save') }}
            </button>
          </div>
        </div>
        
          <div v-if="showGalleryModal" class="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 tuister-modal-backdrop">
            <div class="w-11/12 max-w-lg bg-black border border-gray-800 rounded-2xl p-4 tuister-modal-content">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-white">Seleccionar de la Galería</h4>
                <button @click="showGalleryModal = false" class="text-gray-400">Cerrar</button>
              </div>
              <div v-if="galleryLoading" class="text-white text-center py-8">Cargando...</div>
              <div v-else class="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto tuister-scrollbar pr-1">
                <div v-for="photo in photosGallery" :key="photo.id" class="cursor-pointer" @click="choosePhotoFromGallery(photo)">
                  <img :src="photo.url" class="w-full h-24 object-cover rounded-lg border border-gray-700" @error="(e)=>{e.target.src='./assets/avatars/default.svg'}" />
                </div>
                <div v-if="photosGallery.length === 0" class="col-span-3 text-center text-gray-400">No hay fotos disponibles</div>
              </div>
            </div>
          </div>
      </div>
      
      <div v-if="showPhotoOptions" class="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 tuister-modal-backdrop">
        <div class="w-11/12 max-w-sm bg-black border border-gray-800 rounded-2xl p-6">
          <h3 class="text-xl font-semibold mb-6 text-white text-center">Seleccionar Origen</h3>
          
          <div class="space-y-3">
            <button @click="selectFromGallery"
                    class="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>Seleccionar de Galería</span>
            </button>
            
            <button @click="takePhotoWithCamera"
                    class="w-full py-4 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span>Tomar Foto con Cámara</span>
            </button>
          </div>
          
          <button @click="showPhotoOptions = false"
                  class="w-full mt-4 py-3 px-4 border border-gray-600 text-gray-300 rounded-xl font-medium hover:bg-gray-800 transition-colors duration-200">
            Cancelar
          </button>
        </div>
      </div>
      
      <div v-if="showPhotoTypeSelector" class="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 tuister-modal-backdrop">
        <div class="w-11/12 max-w-sm bg-black border border-gray-800 rounded-2xl p-6">
          <h3 class="text-xl font-semibold mb-4 text-white text-center">¿Dónde usar esta foto?</h3>
          
          <div v-if="selectedPhotoUrl" class="mb-6 text-center">
            <img :src="selectedPhotoUrl" alt="Foto seleccionada" class="w-24 h-24 mx-auto rounded-lg object-cover border border-gray-600" />
          </div>
          
          <div class="space-y-3">
      <button @click="() => setAsAvatar()"
                    class="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>Usar como Avatar</span>
            </button>
            
      <button @click="() => setAsBanner()"
                    class="w-full py-4 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center space-x-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>Usar como Banner</span>
            </button>
          </div>
          
          <button @click="showPhotoTypeSelector = false; selectedPhotoUrl = ''"
                  class="w-full mt-4 py-3 px-4 border border-gray-600 text-gray-300 rounded-xl font-medium hover:bg-gray-800 transition-colors duration-200">
            Cancelar
          </button>
        </div>
      </div>
      
    </div>
  `
}

window.Tuister = Tuister;

try {
    if (typeof window !== 'undefined') {
        window.Tuister = window.Tuister || Tuister;
    }
} catch (e) {
    console.error('Failed to expose Tuister globally', e);
}