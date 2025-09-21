const BitLove = {
  props: {
    userSettings: { type: Object, required: true },
    t: { type: Function, required: true }
  },
  emits: ["close"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted, reactive, nextTick } = Vue;

    const isComponentMounted = ref(true);
    const currentView = ref('discover'); 

    const currentProfile = ref(null);
    const currentMatch = ref(null);
    const currentChatId = ref(null);
    const loading = ref(false);
    const showProfileEditor = ref(false);
    const showMatchOverlay = ref(false);
    const matchedProfile = ref(null);
    const showPhotoEditor = ref(false);
    const selectedPhotoIndex = ref(0);
    const showCameraModal = ref(false);
    const cameraActive = ref(false);
    const cameraMode = ref('front');
    const cameraPreviewUrl = ref('');
    const capturedPhoto = ref('');
    const capturedPhotoId = ref('');
    const isTakingPhoto = ref(false);

    const handleNuiMessage = (event) => {
      const payload = (event && event.data) || {};
      const action = payload.action;
      const data = payload;
      switch (action) {
        case 'bitlove:newMessage':
          if (data.matchId === currentChatId.value) {
            messages.value.push(data.message);
            nextTick(() => scrollToBottom());
          }
          loadMatches();
          break;
        case 'bitlove:newMatch':
          matchedProfile.value = data.profile;
          showMatchOverlay.value = true;
          loadMatches();
          break;
        case 'bitlove:profileUpdated':
          myProfile.value = data.profile;
          break;
        case 'bitlove:profilesLoaded':
          profiles.value = data.profiles || [];
          profileQueue.value = profiles.value;
          currentProfileIndex.value = 0;
          loading.value = false;
          break;
        case 'bitlove:profileLoaded':
          if (data.success && data.profile) {
            console.log('[BitLove] Profile loaded:', data.profile);
            try {
              if (typeof data.profile.photos === 'string') {
                const parsed = JSON.parse(data.profile.photos);
                if (Array.isArray(parsed)) data.profile.photos = parsed;
              }
            } catch (e) {
              console.warn('[BitLove] No se pudo parsear photos en NUI:', e);
            }
            console.log('[BitLove] Photos array:', data.profile.photos);
            myProfile.value = data.profile;
            Object.assign(profileForm, data.profile);
            const empty = (!data.profile.name || data.profile.name === '') && (!data.profile.bio || data.profile.bio === '') && (!data.profile.age || data.profile.age == '');
            showProfileEditor.value = empty;
            loadMyPhotos();
            loadProfiles();
          } else {
            console.log('[BitLove] Profile loading failed or no profile data');
            showProfileEditor.value = true;
          }
          break;
        case 'bitlove:myPhotosLoaded':
          if (data.success) {
            const existing = Array.isArray(myProfile.value?.photos) ? myProfile.value.photos.slice() : [];
            const incoming = Array.isArray(data.photos) ? data.photos : [];
            const seen = new Set(existing);
            for (const url of incoming) {
              if (typeof url === 'string' && url && !seen.has(url)) {
                existing.unshift(url);
                seen.add(url);
              }
            }
            myProfile.value.photos = existing.slice(0, 30);
          }
          break;
        case 'bitlove:profileSaved':
          if (data.success) {
            loadProfile();
            showNotification('Perfil guardado', 'success');
          }
          break;
        case 'bitlove:photoSaved':
          if (data.success) {
            sendInternalNotification('bitlove.camera.photoSaved', {}, 'system');
            capturedPhoto.value = '';
            capturedPhotoId.value = '';
            if (showCameraModal.value) closeCameraModal();
            loadProfile();
          } else {
            sendInternalNotification('bitlove.camera.photoError', { error: data.error || 'Error al guardar' }, 'system');
          }
          break;
        case 'bitlove:matchesLoaded':
          if (data.success) {
            matches.value = data.matches || [];
          }
          break;
        case 'bitlove:messagesLoaded':
          if (data.success) {
            messages.value = data.messages || [];
            nextTick(() => scrollToBottom());
          }
          break;
        case 'bitlove:swipeResult':
          if (data.success && data.match) {
            matchedProfile.value = currentProfileData.value;
            showMatchOverlay.value = true;
            loadMatches();
          }
          break;
        case 'bitlove:profileCreated':
          if (data.success) {
            loadProfile();
            showNotification('Perfil creado exitosamente');
          }
          break;
        case 'bitlove:photoTaken':
          if (data.success) {
            const url = data.photoUrl || (data.photo && data.photo.url) || (data.photos && data.photos[0]) || '';
            if (url) capturedPhoto.value = url;
            if (data.photoId) capturedPhotoId.value = data.photoId;
            sendInternalNotification('bitlove.photoTaken', {}, 'system');
          } else {
            sendInternalNotification('bitlove.photoError', { error: data.error }, 'system');
          }
          break;
        case 'bitlove:messageReceived':
          if (data.matchId === currentChatId.value) {
            messages.value.push(data.message);
            nextTick(() => scrollToBottom());
          }
          break;
        default:
          break;
      }
    };

    onMounted(async () => {
      try {
        if (window.__bitloveMessageHandler) {
          window.removeEventListener('message', window.__bitloveMessageHandler);
        }
        window.__bitloveMessageHandler = handleNuiMessage;
        window.addEventListener('message', handleNuiMessage);
      } catch (e) {
        console.error('[BitLove] Error registrando listener NUI', e);
      }
      await loadProfile();
    });
    
    const profiles = ref([]);
    const matches = ref([]);
    const messages = ref([]);
    const myProfile = ref({
      name: '',
      age: '',
      bio: '',
      photos: []
    });
    const swipeAnimation = ref('');
    const profileQueue = ref([]);
    const currentProfileIndex = ref(0);

    
    const stats = ref({
      totalLikes: 0,
      totalMatches: 0,
      superLikesLeft: 5,
      isPremium: false,
      boostActive: false,
      boostExpires: null
    });

    
    const profileForm = reactive({
      name: '',
      age: '',
      bio: '',
      location: '',
      interests: '',
      job: '',
      lookingFor: 'anything',
      distanceRange: 50,
      ageMin: 18,
      ageMax: 99,
      photos: []
    });

    
    const newMessage = ref('');
    const isTyping = ref(false);
    const typingUsers = ref([]);

    
    const isFiveMEnvironment = () => {
      return typeof window.GetParentResourceName === 'function';
    };

    const getResourceName = () => {
      if (isFiveMEnvironment()) {
        return window.GetParentResourceName();
      }
      return 'bit-smartphone';
    };

    
    const currentProfileData = computed(() => {
      if (!profileQueue.value.length || currentProfileIndex.value >= profileQueue.value.length) {
        return null;
      }
      return profileQueue.value[currentProfileIndex.value];
    });

    const hasMoreProfiles = computed(() => {
      return profileQueue.value.length > 0 && currentProfileIndex.value < profileQueue.value.length;
    });

    const unreadMatchesCount = computed(() => {
      return matches.value.filter(match => match.unreadCount > 0).length;
    });

    const sortedMessages = computed(() => {
      return [...messages.value].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });

    
    const loadProfile = async () => {
      try {
        console.log('[BitLove] Loading profile...');
        await fetch('https://bit-smartphone/bitlove:getProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(() => {});
      } catch (error) {
        console.error('[BitLove] Error loading profile:', error);
      }
    };

    const loadMyPhotos = async () => {
      try {
        await fetch('https://bit-smartphone/bitlove:getMyPhotos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(() => {});
      } catch (e) {
        console.warn('[BitLove] Error requesting my photos:', e);
      }
    };

    const lastPhotoTime = ref(0);
    const PHOTO_COOLDOWN = 5000;
    
    const takePhoto = async () => {
      try {
        if (!isFiveMEnvironment()) {
          sendInternalNotification('bitlove.camera.noProvider', {}, 'system');
          showCameraModal.value = false;
          return;
        }

        const now = Date.now();
        if (now - lastPhotoTime.value < PHOTO_COOLDOWN) {
          sendInternalNotification('bitlove.camera.cooldown', {
            remainingTime: Math.ceil((PHOTO_COOLDOWN - (now - lastPhotoTime.value)) / 1000)
          }, 'system');
          return;
        }

        isTakingPhoto.value = true;
        lastPhotoTime.value = now;

        const wasActive = cameraActive.value;
        cameraActive.value = false;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const response = await fetch('https://bit-smartphone/bitlove:takePhoto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoType: 'profile',
              metadata: {
                profileId: myProfile.value?.id || 'unknown',
                timestamp: now,
                cameraMode: cameraMode.value
              }
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.photoUrl) {
              if (result.photoUrl.length > 2000) {
                throw new Error('URL de foto demasiado larga');
              }
              capturedPhoto.value = result.photoUrl;
              if (result.photoId) capturedPhotoId.value = result.photoId;
              isTakingPhoto.value = false;
              sendInternalNotification('bitlove.camera.photoTaken', {}, 'system');
            } else {
              throw new Error(result.error || 'Error desconocido al tomar foto');
            }
          } else {
            throw new Error(`Error HTTP: ${response.status}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Timeout: La foto tardó demasiado en procesarse');
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        console.error('[BitLove] Error taking photo:', error);
        isTakingPhoto.value = false;
        const wasActive = cameraActive.value; 
        cameraActive.value = wasActive;

        let errorMessage = 'Error al tomar la foto';
        if (error.message && error.message.includes('Timeout')) {
          errorMessage = 'La foto tardó demasiado en procesarse. Intenta de nuevo.';
        } else if (error.message && error.message.includes('demasiado larga')) {
          errorMessage = 'Error: foto demasiado grande';
        } else if (error.message && error.message.includes('HTTP')) {
          errorMessage = 'Error de conexión con el servidor';
        }
        sendInternalNotification('bitlove.camera.photoError', { error: errorMessage }, 'system');
      }
    };

    const startCamera = async () => {
      try {
        cameraActive.value = true; 
        const response = await fetch('https://bit-smartphone/camera:start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: cameraMode.value })
        });
        
        if (response.ok) {
          const result = await response.json();
          
        } else {
          console.error('Failed to start camera');
          cameraActive.value = false;
        }
      } catch (error) {
        console.error('Error starting camera:', error);
        cameraActive.value = false;
      }
    };

    const stopCamera = async () => {
      try {
        cameraActive.value = false;
        cameraPreviewUrl.value = '';
        
        const response = await fetch('https://bit-smartphone/camera:stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          
        }
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
    };

    const switchCamera = async () => {
      cameraMode.value = cameraMode.value === 'front' ? 'back' : 'front';
      
      try {
        const response = await fetch('https://bit-smartphone/camera:switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: cameraMode.value })
        });
        
        if (response.ok) {
          const result = await response.json();
          
        }
      } catch (error) {
        console.error('Error switching camera:', error);
      }
    };

    const savePhoto = async () => {
      try {
        if (!capturedPhoto.value) {
          sendInternalNotification('bitlove.camera.noPhoto', {}, 'system');
          return;
        }

        const savingNotificationKey = 'bitlove.camera.saving';
        sendInternalNotification('bitlove.photoProcessing', {}, 'system');

        try {
          await processPhotoForBitLove(capturedPhoto.value, capturedPhotoId.value || undefined);
          sendInternalNotification('bitlove.camera.photoSaved', {}, 'system');

          if (myProfile.value) {
            if (!myProfile.value.photos) myProfile.value.photos = [];
            myProfile.value.photos.unshift(capturedPhoto.value);
            if (myProfile.value.photos.length > 6) myProfile.value.photos = myProfile.value.photos.slice(0, 6);
          }

          closeCameraModal();
          await loadProfile();
        } catch (err) {
          console.error('[BitLove] Error saving photo to server:', err);
          sendInternalNotification('bitlove.camera.photoError', { error: err.message || 'Error al guardar' }, 'system');
        }
      } catch (error) {
        console.error('[BitLove] Error saving photo:', error);
        sendInternalNotification('bitlove.camera.photoError', {error: 'Error al procesar foto: ' + error.message}, 'system');
      }
    };

    const processPhotoForBitLove = async (photoUrl, photoId) => {
      try {
        const response = await fetch('https://bit-smartphone/bitlove:savePhotoToProfile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            photoId: photoId || 'photo_' + Date.now(),
            photoUrl: photoUrl,
            type: 'bitlove_profile',
            timestamp: Date.now(),
            metadata: {
              profileId: myProfile.value?.id || 'unknown',
              cameraMode: cameraMode.value
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Error al guardar la foto en el perfil');
        }

        try {
          const json = await response.json();
          return json;
        } catch (e) {
          const text = await response.text().catch(() => null);
          return { ok: true, text };
        }
      } catch (error) {
        console.error('Error processing photo for BitLove:', error);
        throw error;
      }
    };

    const retakePhoto = () => {
      capturedPhoto.value = '';
      isTakingPhoto.value = false;
      cameraActive.value = true;
      startCamera();
    };

    const closeCameraModal = () => {
      showCameraModal.value = false;
      stopCamera();
      capturedPhoto.value = '';
      isTakingPhoto.value = false;
    };

    const handleCameraFrame = (event) => {
      if (!event || !event.data) return;
      
      if (event.data.action === 'camera:preview_frame' && cameraActive.value) {
        if (event.data.imageData) {
          cameraPreviewUrl.value = event.data.imageData;
          
        }
      }
    };

    onMounted(() => {
      window.addEventListener('message', handleCameraFrame);
    });

    onUnmounted(() => {
      window.removeEventListener('message', handleCameraFrame);
      if (cameraActive.value) {
        stopCamera();
      }
      if (window.__bitloveMessageHandler) {
        window.removeEventListener('message', window.__bitloveMessageHandler);
        window.__bitloveMessageHandler = null;
      }
    });

    const updateProfile = async () => {
      try {
        const payload = {
          name: myProfile.value?.name || '',
          age: myProfile.value?.age || 18,
          bio: myProfile.value?.bio || '',
          photos: myProfile.value?.photos || []
        };
        const likelyExists = !!(myProfile.value && (myProfile.value.id || myProfile.value.identifier || myProfile.value.created_at));
        const endpoint = likelyExists ? 'bitlove:saveProfile' : 'bitlove:createProfile';
        await fetch(`https://bit-smartphone/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (error) {
        console.error('[BitLove] Error updating profile:', error);
      }
    };

    const removePhoto = (photoIndex) => {
      if (myProfile.value && myProfile.value.photos) {
        myProfile.value.photos.splice(photoIndex, 1);
        updateProfile();
      }
    };

    const loadProfiles = async () => {
      if (loading.value) return;
      loading.value = true;
      
      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({ action: 'bitlove:getProfiles' }));
        }
      } catch (error) {
        loading.value = false;
      }
    };

    const swipeProfile = async (action, isSuperLike = false) => {
      const profile = currentProfileData.value;
      if (!profile || loading.value) return;

      
      swipeAnimation.value = action === 'like' ? 'like' : 'nope';
      
      if (isSuperLike && stats.value.superLikesLeft <= 0) {
        showNotification('Sin Super Likes disponibles', 'error');
        return;
      }

      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'bitlove:swipeProfile',
            targetIdentifier: profile.identifier || profile.id,
            action: action,
            isSuperLike: isSuperLike
          }));
        }
        
        if (isSuperLike) {
          stats.value.superLikesLeft--;
        }
        
        
        setTimeout(() => {
          if (!isComponentMounted.value) return;
          
          currentProfileIndex.value++;
          swipeAnimation.value = '';
          
          if (currentProfileIndex.value >= profileQueue.value.length) {
            loadProfiles();
          }
        }, 500);
        
      } catch (error) {
        swipeAnimation.value = '';
      }
    };

    const loadMatches = async () => {
      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({ action: 'bitlove:getMatches' }));
        }
      } catch (error) {
      }
    };

    const loadMessages = async (matchId) => {
      if (!matchId) return;
      
      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'bitlove:getMessages',
            matchId: matchId
          }));
        }
      } catch (error) {
      }
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !currentChatId.value) return;
      
      const messageText = newMessage.value.trim();
      newMessage.value = '';
      
      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'bitlove:sendMessage',
            matchId: currentChatId.value,
            message: messageText,
            messageType: 'text'
          }));
        }
        
        messages.value.push({
          id: Date.now(),
          match_id: currentChatId.value,
          sender_identifier: myProfile.value?.identifier,
          message: messageText,
          message_type: 'text',
          is_read: false,
          created_at: new Date().toISOString(),
          isMine: true
        });
        
        nextTick(() => {
          scrollToBottom();
        });
        
      } catch (error) {
      }
    };

    const markMessagesAsRead = async (matchId) => {
      try {
        await fetch("https://bit-smartphone/markMessagesAsRead", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId })
        });
      } catch (error) {
      }
    };

    const saveProfile = async () => {
      loading.value = true;
      
      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'bitlove:createProfile',
            name: profileForm.name,
            bio: profileForm.bio,
            age: parseInt(profileForm.age),
            gender: profileForm.gender,
            interested_in: profileForm.interested_in,
            profile_picture: profileForm.photos[0] || ''
          }));
        }
        
        myProfile.value = { ...profileForm };
        showProfileEditor.value = false;
        showNotification('Perfil guardado exitosamente');
      } catch (error) {
        showNotification('Error al guardar el perfil', 'error');
      } finally {
        loading.value = false;
      }
    };

    const uploadPhoto = async (file) => {
      if (!file) return;
      
      const formData = new FormData();
      formData.append('photo', file);
      
      try {
        const response = await fetch("https://bit-smartphone/uploadPhoto", {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.photoUrl) {
            profileForm.photos.push(result.photoUrl);
            showNotification('Foto subida exitosamente');
          }
        }
      } catch (error) {
        showNotification('Error al subir la foto', 'error');
      }
    };

    const deletePhoto = (index) => {
      profileForm.photos.splice(index, 1);
    };

    const openChat = (match) => {
      currentMatch.value = match;
      currentChatId.value = match.id;
      currentView.value = 'chat';
      loadMessages(match.id);
    };

    const closeMatchOverlay = () => {
      if (!isComponentMounted.value) return;
      showMatchOverlay.value = false;
      matchedProfile.value = null;
    };

    const navigateTo = (view) => {
      if (!isComponentMounted.value) return;
      currentView.value = view;
      
      if (view === 'matches') {
        loadMatches();
      } else if (view === 'profiles') {
        if (profileQueue.value.length === 0) {
          loadProfiles();
        }
      }
    };

    const goBack = () => {
      if (currentView.value === 'chat') {
        currentView.value = 'matches';
        currentMatch.value = null;
        currentChatId.value = null;
        messages.value = [];
      } else if (currentView.value === 'profile' || currentView.value === 'settings') {
        currentView.value = 'profiles';
      } else {
        currentView.value = 'profiles';
      }
    };

    const scrollToBottom = () => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    };

    const showNotification = (message, type = 'success') => {
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 transform translate-x-full ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
      }`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
      }, 100);
      
      
      setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          try {
            if (notification && notification.parentNode) {
              notification.parentNode.removeChild(notification);
            } else if (notification && document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          } catch (e) {
            console.error('[bitlove] remove notification failed', e);
          }
        }, 300);
      }, 3000);
    };

    const sendInternalNotification = (messageKey, variables = {}, appName = 'system') => {
      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'phone:notify',
            messageKey: messageKey,
            variables: variables,
            appName: appName
          }));
        } else {
          showNotification(`${messageKey}: ${JSON.stringify(variables)}`, 'info');
        }
      } catch (error) {
        showNotification('Error en notificación', 'error');
      }
    };

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) { 
        return 'Ahora';
      } else if (diff < 3600000) { 
        return `${Math.floor(diff / 60000)}m`;
      } else if (diff < 86400000) { 
        return `${Math.floor(diff / 3600000)}h`;
      } else {
        return date.toLocaleDateString();
      }
    };

    const calculateAge = (birthDate) => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    };

    
    const likeProfile = () => {
      if (currentProfileData.value) {
        swipeProfile('like');
      }
    };

    const dislikeProfile = () => {
      if (currentProfileData.value) {
        swipeProfile('dislike');
      }
    };

    const superLikeProfile = () => {
      if (currentProfileData.value) {
        swipeProfile('like', true);
      }
    };

    
    const closeApp = () => {
      emit('close');
    };

   
    onUnmounted(() => {
      isComponentMounted.value = false;
    });

    return {
      
      props,
      isComponentMounted,
      
      
      currentView,
      currentProfile,
      currentMatch,
      currentChatId,
      loading,
      showProfileEditor,
      showMatchOverlay,
      matchedProfile,
  showPhotoEditor,
  selectedPhotoIndex,
      showCameraModal,
      cameraActive,
      cameraMode,
      cameraPreviewUrl,
      capturedPhoto,
      isTakingPhoto,      
      profiles,
      matches,
      messages,
      myProfile,
      swipeAnimation,
      profileQueue,
      currentProfileIndex,
      stats,
      profileForm,
      newMessage,
      isTyping,
      typingUsers,
      
      
      currentProfileData,
      hasMoreProfiles,
      unreadMatchesCount,
      sortedMessages,
      
      
      loadProfile,
      loadProfiles,
      swipeProfile,
      loadMatches,
      loadMessages,
      sendMessage,
      markMessagesAsRead,
      saveProfile,
  updateProfile,
      uploadPhoto,
  deletePhoto,
  removePhoto,
  takePhoto,
      startCamera,
      stopCamera,
      switchCamera,
      savePhoto,
      retakePhoto,
      closeCameraModal,
      openChat,
      closeMatchOverlay,
      navigateTo,
      goBack,
      scrollToBottom,
      showNotification,
      formatTime,
      calculateAge,
      likeProfile,
      dislikeProfile,
      superLikeProfile,
      closeApp
    };
  },
  template: `
    <div class="h-full flex flex-col relative overflow-hidden"
         :class="userSettings.darkMode ? 'bg-gradient-to-br from-pink-900 via-red-900 to-orange-900 text-white' : 'bg-gradient-to-br from-pink-100 via-red-100 to-orange-100 text-gray-900'">
      
      
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-10 left-10 text-pink-500 opacity-20 animate-pulse">
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div class="absolute top-32 right-16 text-red-400 opacity-15 animate-bounce">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div class="absolute bottom-20 left-20 text-pink-400 opacity-10 animate-pulse delay-1000">
          <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
      </div>

      
      <header class="relative z-10 p-4 pt-12">
        <div class="flex justify-between items-center">
          <button @click="closeApp" class="backdrop-blur-md rounded-full p-3 hover:bg-white/20 transition-all duration-300 border"
                  :class="userSettings.darkMode ? 'bg-white/10 border-white/20' : 'bg-black/10 border-black/20'">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div class="flex items-center space-x-2">
            <div class="text-3xl">💕</div>
            <h1 class="text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
                :class="userSettings.darkMode ? 'from-pink-300 to-red-300' : 'from-pink-600 to-red-600'">
              {{ props.t('bitlove.title') }}
            </h1>
          </div>
          
          <div class="w-12 h-12"></div>
        </div>
      </header>

      
      <nav v-if="currentView !== 'chat'" class="relative z-10 px-4 mb-4">
        <div class="backdrop-blur-md rounded-2xl p-2 flex space-x-1 border"
             :class="userSettings.darkMode ? 'bg-white/10 border-white/20' : 'bg-black/10 border-black/20'">
          <button @click="currentView = 'profile'" 
                  :class="['flex-1 py-3 px-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-1', 
                          currentView === 'profile' 
                            ? (userSettings.darkMode ? 'bg-pink-500/40 text-pink-200 shadow-lg' : 'bg-pink-500/30 text-pink-700 shadow-lg')
                            : (userSettings.darkMode ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-black/10')]">
            <span class="text-sm">Mi Perfil</span>
          </button>
          <button @click="currentView = 'discover'" 
                  :class="['flex-1 py-3 px-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-1', 
                          currentView === 'discover' 
                            ? (userSettings.darkMode ? 'bg-pink-500/40 text-pink-200 shadow-lg' : 'bg-pink-500/30 text-pink-700 shadow-lg')
                            : (userSettings.darkMode ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-black/10')]">
            <span class="text-sm">Descubrir</span>
          </button>
          <button @click="currentView = 'matches'" 
                  :class="['flex-1 py-3 px-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-1', 
                          currentView === 'matches' 
                            ? (userSettings.darkMode ? 'bg-pink-500/40 text-pink-200 shadow-lg' : 'bg-pink-500/30 text-pink-700 shadow-lg')
                            : (userSettings.darkMode ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-black/10')]">
            <span class="text-sm">Chats</span>
          </button>
        </div>
      </nav>

      
      <main class="relative z-10 flex-1 overflow-hidden">
        <div v-if="currentView === 'profile'" class="h-full px-4 overflow-y-auto">
          <div class="space-y-6 pb-6">   
            <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
                <span class="text-xl mr-2">📷</span>
                Mis Fotos
              </h3>
              
              <div class="mb-4 overflow-x-auto">
                <div class="flex items-center space-x-3 snap-x snap-mandatory pr-2">
                  <div v-for="(photo, index) in myProfile?.photos || []" :key="index"
                       class="relative w-24 h-24 min-w-[6rem] rounded-xl overflow-hidden bg-gray-200 snap-start">
                    <img :src="typeof photo === 'string' ? photo : (photo && photo.url)" 
                         :alt="'Foto ' + (index + 1)" class="w-full h-full object-cover">
                    <button @click="removePhoto(index)" 
                            class="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                      ×
                    </button>
                  </div>
                  
                  <button @click="showCameraModal = true; startCamera()" 
                          class="w-24 h-24 min-w-[6rem] rounded-xl flex flex-col items-center justify-center text-white/70 hover:bg-white/30 transition-all duration-300 border-2 border-dashed border-white/30 bg-white/20">
                    <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <span class="text-xs">Agregar</span>
                  </button>
                </div>
              </div>
            </div>
            
            
            <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
                <span class="text-xl mr-2">👤</span>
                Información Personal
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-white/70 text-sm mb-2">Nombre</label>
                  <input v-model="myProfile.name" type="text" 
                         class="w-full bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-white placeholder-white/50 outline-none border border-white/20 focus:border-pink-400 transition-all duration-300">
                </div>
                
                <div>
                  <label class="block text-white/70 text-sm mb-2">Edad</label>
                  <input v-model="myProfile.age" type="number" 
                         class="w-full bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-white placeholder-white/50 outline-none border border-white/20 focus:border-pink-400 transition-all duration-300">
                </div>
                
                <div>
                  <label class="block text-white/70 text-sm mb-2">Biografía</label>
                  <textarea v-model="myProfile.bio" rows="3"
                            class="w-full bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-white placeholder-white/50 outline-none border border-white/20 focus:border-pink-400 transition-all duration-300 resize-none"></textarea>
                </div>
                
                <button @click="updateProfile()" 
                        class="w-full bg-gradient-to-r from-pink-500 to-red-500 py-3 rounded-xl text-white font-medium hover:from-pink-600 hover:to-red-600 transition-all duration-300">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
        
        
        <div v-if="currentView === 'discover'" class="h-full px-4">
          <div v-if="loading" class="flex items-center justify-center h-full">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
          
          <div v-else-if="profiles.length === 0" class="flex flex-col items-center justify-center h-full text-center">
            <div class="text-6xl mb-4">💔</div>
            <h3 class="text-xl font-bold mb-2">{{ props.t('bitlove.discover.noMoreProfiles') }}</h3>
            <p class="text-white/70 mb-4">{{ props.t('bitlove.discover.comeBackLater') }}</p>
            <button @click="loadProfiles" class="bg-gradient-to-r from-pink-500 to-red-500 px-6 py-3 rounded-full text-white font-medium hover:from-pink-600 hover:to-red-600 transition-all duration-300">
              {{ props.t('bitlove.discover.searchAgain') }}
            </button>
          </div>
          
          
          <div v-else class="relative h-full flex items-center justify-center">
            <div v-for="(profile, index) in profiles.slice(0, 3)" :key="profile.id"
                 class="absolute w-80 max-w-full h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-md transition-all duration-500"
                 :class="{
                   'z-30': index === 0,
                   'z-20 scale-95 -rotate-2': index === 1,
                   'z-10 scale-90 rotate-1': index === 2
                 }"
                 :style="{
                   transform: index === 0 && swipeAnimation === 'like' ? 'translateX(100%) rotate(20deg)' : 
                             index === 0 && swipeAnimation === 'nope' ? 'translateX(-100%) rotate(-20deg)' : '',
                   opacity: index === 0 && swipeAnimation ? '0' : '1'
                 }">
              
              
              <div class="relative h-3/4 bg-gradient-to-br from-pink-400 to-red-500">
                <img v-if="profile.photos && profile.photos[0]" 
                     :src="profile.photos[0]" 
                     :alt="profile.name"
                     class="w-full h-full object-cover">
                <div v-else class="flex items-center justify-center h-full text-white text-4xl">
                  {{ profile.name?.charAt(0) || '?' }}
                </div>
                
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                
                <div class="absolute bottom-4 left-4 right-4 text-white">
                  <h3 class="text-2xl font-bold mb-1">{{ profile.name }}, {{ profile.age }}</h3>
                  <div class="flex items-center space-x-2 text-sm text-white/80">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <span>{{ profile.location }}</span>
                  </div>
                </div>
              </div>
              
              
              <div class="h-1/4 p-4 bg-white/10 backdrop-blur-md">
                <p class="text-sm text-white/90 leading-relaxed line-clamp-3">{{ profile.bio }}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                  <span v-for="interest in (profile.interests || '').split(',')" :key="interest"
                        class="text-xs bg-white/20 px-2 py-1 rounded-full text-white/80">
                    {{ interest.trim() }}
                  </span>
                </div>
              </div>
            </div>
            
            
            <div v-if="profiles.length > 0" class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6 z-40">
              <button @click="dislikeProfile()" 
                      class="w-16 h-16 bg-gray-500/30 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-gray-500/50 transition-all duration-300 border-2 border-white/20">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
              
              <button @click="likeProfile()" 
                      class="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 backdrop-blur-md rounded-full flex items-center justify-center hover:from-pink-600 hover:to-red-600 transition-all duration-300 border-2 border-white/20 shadow-xl">
                <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              
              <button class="w-16 h-16 bg-blue-500/30 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-blue-500/50 transition-all duration-300 border-2 border-white/20">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        
        <div v-if="currentView === 'matches'" class="h-full px-4">
          <h2 class="text-xl font-bold mb-4 text-center">{{ props.t('bitlove.matches.title') }}</h2>
          
          <div v-if="loading" class="flex items-center justify-center h-full">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
          
          <div v-else-if="matches.length === 0" class="flex flex-col items-center justify-center h-full text-center">
            <div class="text-6xl mb-4">💔</div>
            <h3 class="text-xl font-bold mb-2">{{ props.t('bitlove.matches.noMatches') }}</h3>
            <p class="text-white/70">{{ props.t('bitlove.matches.noMatchesDescription') }}</p>
          </div>
          
          <div v-else class="h-full overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/20">
            <div v-for="match in matches" :key="match.match_id"
                 @click="openChat(match)"
                 class="bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20">
              <div class="flex items-center space-x-4">
                <div class="relative">
                  <img v-if="match.photos && JSON.parse(match.photos || '[]')[0]" 
                       :src="JSON.parse(match.photos)[0]" 
                       class="w-16 h-16 rounded-full object-cover border-2 border-pink-400">
                  <div v-else class="w-16 h-16 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {{ match.name?.charAt(0) || '?' }}
                  </div>
                  <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-white truncate">{{ match.name }}</h3>
                  <p class="text-white/70 text-sm truncate">{{ match.last_message || props.t('bitlove.matches.startConversation') }}</p>
                </div>
                
                <div class="text-xs text-white/50">
                  {{ match.last_message_time ? formatTime(match.last_message_time) : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div v-if="currentView === 'chat'" class="h-full flex flex-col">
          
          <div class="bg-white/10 backdrop-blur-md p-4 border-b border-white/20">
            <div class="flex items-center space-x-3">
              <button @click="currentView = 'matches'" class="p-2 rounded-full hover:bg-white/10 transition-all duration-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              
              <div class="relative">
                <img v-if="currentMatch?.photos && JSON.parse(currentMatch.photos || '[]')[0]" 
                     :src="JSON.parse(currentMatch.photos)[0]" 
                     class="w-10 h-10 rounded-full object-cover">
                <div v-else class="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  {{ currentMatch?.name?.charAt(0) || '?' }}
                </div>
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              </div>
              
              <div class="flex-1">
                <h3 class="font-semibold text-white">{{ currentMatch?.name }}</h3>
                <p class="text-xs text-white/70">{{ props.t('bitlove.matches.online') }}</p>
              </div>
            </div>
          </div>
          
          
          <div class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20">
            <div v-for="message in messages" :key="message.id"
                 :class="['flex', message.sender_identifier === 'me' ? 'justify-end' : 'justify-start']">
              <div :class="['max-w-xs px-4 py-2 rounded-2xl', 
                           message.sender_identifier === 'me' 
                             ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' 
                             : 'bg-white/20 text-white backdrop-blur-md']">
                <p class="text-sm">{{ message.message }}</p>
                <p class="text-xs mt-1 opacity-70">{{ formatTime(message.created_at) }}</p>
              </div>
            </div>
          </div>
          
          
          <div class="bg-white/10 backdrop-blur-md p-4 border-t border-white/20">
            <div class="flex items-center space-x-3">
              <input v-model="newMessage" 
                     @keypress.enter="sendMessage"
                     type="text" 
                     :placeholder="props.t('bitlove.chat.messageInput')"
                     class="flex-1 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-white placeholder-white/50 outline-none border border-white/20 focus:border-pink-400 transition-all duration-300">
              <button @click="sendMessage" 
                      :disabled="!newMessage.trim()"
                      class="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center hover:from-pink-600 hover:to-red-600 transition-all duration-300 disabled:opacity-50">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      
      <div v-if="showMatchOverlay" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 rounded-3xl p-8 text-center text-white max-w-sm mx-4 shadow-2xl border-4 border-white/20">
          <div class="text-6xl mb-4 animate-bounce">🎉</div>
          <h3 class="text-3xl font-bold mb-2">{{ props.t('bitlove.match.itsAMatch') }}</h3>
          <p class="text-lg mb-6">{{ props.t('bitlove.match.youBothLiked', { name: matchedProfile?.name }) }}</p>
          
          <div class="flex justify-center space-x-4 mb-6">
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl">👤</div>
            <div class="flex items-center">
              <div class="text-3xl animate-pulse">💕</div>
            </div>
            <div class="w-20 h-20 rounded-full overflow-hidden border-4 border-white/40">
              <img v-if="matchedProfile?.photos?.[0]" :src="matchedProfile.photos[0]" class="w-full h-full object-cover">
              <div v-else class="w-full h-full bg-gradient-to-br from-pink-300 to-red-300 flex items-center justify-center text-2xl font-bold text-white">
                {{ matchedProfile?.name?.charAt(0) }}
              </div>
            </div>
          </div>
          
          <div class="text-sm opacity-80">{{ props.t('bitlove.match.sendMessagePrompt') }}</div>
        </div>
      </div>
      <div v-if="showCameraModal" class="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div class="relative w-full h-full flex flex-col">
          <div class="absolute top-6 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent"
               style="padding-top: 2rem; margin-top: 1rem;">
            <button @click="closeCameraModal()" 
                    class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            
            <div class="text-white text-center px-4">
              <h3 class="text-lg font-semibold drop-shadow-lg">Foto de Perfil</h3>
              <p class="text-sm text-white/80 drop-shadow">{{ cameraMode === 'front' ? 'Cámara frontal' : 'Cámara trasera' }}</p>
            </div>
            
            <button @click="switchCamera()" 
                    class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg"
                    :disabled="isTakingPhoto">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
            </button>
          </div>

          <div class="flex-1 relative overflow-hidden">
            <div v-if="!capturedPhoto && cameraActive" class="w-full h-full relative">
              <img :src="cameraPreviewUrl" 
                   class="w-full h-full object-cover"
                   v-if="cameraPreviewUrl"
                   alt="Camera preview">
              
              <div v-if="!cameraPreviewUrl" class="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div class="text-center text-white">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Iniciando cámara...</p>
                </div>
              </div>
              
              <div class="absolute inset-0 pointer-events-none">
                <div class="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                  <div class="border-r border-b border-white/30"></div>
                  <div class="border-r border-b border-white/30"></div>
                  <div class="border-b border-white/30"></div>
                  <div class="border-r border-b border-white/30"></div>
                  <div class="border-r border-b border-white/30"></div>
                  <div class="border-b border-white/30"></div>
                  <div class="border-r border-white/30"></div>
                  <div class="border-r border-white/30"></div>
                  <div></div>
                </div>
              </div>
            </div>

            <div v-else-if="capturedPhoto" class="w-full h-full relative">
              <img :src="capturedPhoto" 
                   class="w-full h-full object-cover"
                   alt="Captured photo">
            </div>

            <div v-else class="w-full h-full flex items-center justify-center bg-gray-900">
              <div class="text-center text-white">
                <div class="text-6xl mb-4">📷</div>
                <p>Preparando cámara...</p>
              </div>
            </div>
          </div>

          <div class="absolute bottom-6 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
               style="padding-bottom: 2rem; margin-bottom: 1rem;">
            <div v-if="!capturedPhoto" class="flex justify-center items-center space-x-6">
              <button @click="takePhoto()" 
                      :disabled="isTakingPhoto || !cameraActive"
                      class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <div v-if="isTakingPhoto" class="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
                <svg v-else class="w-10 h-10 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>

            <div v-else class="flex justify-center items-center space-x-4">
              <button @click="retakePhoto()" 
                      class="px-8 py-4 bg-white/20 backdrop-blur-md rounded-xl text-white font-medium hover:bg-white/30 transition-all shadow-lg">
                Repetir
              </button>
              
              <button @click="savePhoto()" 
                      class="px-10 py-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl text-white font-medium hover:from-pink-600 hover:to-red-600 transition-all shadow-lg">
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
