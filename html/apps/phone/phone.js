const Phone = {
  props: ["userSettings", "t"],
  emits: ["close", "open-app"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;
    
    const currentView = ref("contacts")
    const dialNumber = ref("")
    const selectedContact = ref(null)
    const searchQuery = ref("")
    const newContactName = ref("")
    const newContactNumber = ref("")
    const editContactName = ref("")
    const editContactNumber = ref("")
    const editNotesText = ref("")
    
    
    const showSlideUp = ref("")
    const isAnimating = ref(false)
    
    
    const favorites = ref([])
    const voicemails = ref([])
    const contacts = ref([])
    const recents = ref([])
    const blockedNumbers = ref([])
    
    
    const isLoading = ref(true)
    const isLoadingContacts = ref(false)

    const showAirDropModal = ref(false)
    const nearbyPlayers = ref([])
    const isLoadingNearbyPlayers = ref(false)
    const userProfile = ref({
      name: "Mi Perfil",
      phoneNumber: "000-000-0000",
      avatar: "👤"
    })



    const loadRecents = async () => {
  recents.value = []
    }

    const loadVoicemails = async () => {
  voicemails.value = []
    }

    const loadBlocked = async () => {
  blockedNumbers.value = []
    }

    // Procesar mensajes NUI enviados desde el cliente Lua
    const handleNuiMessage = (event) => {
      const msg = event.data
      if (!msg || !msg.action) return
      switch (msg.action) {
        case 'contacts:loaded':
          contacts.value = msg.data.contacts || []
          isLoadingContacts.value = false
          break
        case 'contact:saved':
          if (msg.data.success) {
            // Limpiar formulario
            newContactName.value = ""
            newContactNumber.value = ""
            // Recargar contactos
            loadContacts()
            if (window.appInstance && window.appInstance.addNotification) {
              window.appInstance.addNotification({
                icon: '📞',
                title: 'Contacto guardado',
                body: 'El contacto se guardó exitosamente',
                timestamp: Date.now()
              })
            }
          } else {
            if (window.appInstance && window.appInstance.addNotification) {
              window.appInstance.addNotification({
                icon: '⚠️',
                title: 'Error',
                body: 'No se pudo guardar el contacto',
                timestamp: Date.now(),
                priority: 'high'
              })
            }
          }
          break
        case 'contact:added':
          if (msg.data.success) {
            isLoadingContacts.value = true
            loadContacts()
          }
          break
        case 'contact:updated':
          if (msg.data.success) {
            isLoadingContacts.value = true
            loadContacts()
          }
          break
        case 'contact:deleted':
          if (msg.data.success) {
            isLoadingContacts.value = true
            loadContacts()
          }
          break
        case 'recents:loaded':
          recents.value = msg.data.calls || []
          break
        case 'voicemails:loaded':
          voicemails.value = msg.data.voicemails || []
          break
        case 'blocked:loaded':
          blockedNumbers.value = msg.data.blocked || []
          break
        case 'nearbyPlayers:loaded':
          nearbyPlayers.value = msg.data.players || []
          isLoadingNearbyPlayers.value = false
          break
        case 'airdrop:sent':
          if (msg.data.success) {
            showAirDropModal.value = false
            if (window.appInstance && window.appInstance.addNotification) {
              window.appInstance.addNotification({
                icon: '📱',
                title: 'AirDrop enviado',
                body: `Número compartido con ${msg.data.playerName}`,
                timestamp: Date.now()
              })
            }
          }
          break
        case 'userProfile:loaded':
          if (msg.data.profile) {
            userProfile.value = {
              name: msg.data.profile.name || "Mi Perfil",
              phoneNumber: msg.data.profile.phoneNumber || "000-000-0000",
              avatar: msg.data.profile.avatar || "👤"
            }
          }
          break
        case 'airdrop:received':
          console.log('[Phone] AirDrop received:', msg.data);
          if (msg.data) {
            if (window.appInstance && window.appInstance.addNotification) {
              window.appInstance.addNotification({
                icon: '📱',
                title: 'AirDrop recibido',
                body: msg.data.message,
                timestamp: Date.now(),
                priority: 'high'
              })
            }

            newContactName.value = msg.data.from || ''
            newContactNumber.value = msg.data.phoneNumber || ''
            console.log('[Phone] Pre-filling contact:', newContactName.value, newContactNumber.value);
            showSlideUpModal('add-contact', false)
          }
          break
      }
    }

    onMounted(() => {
      loadContacts()
      window.addEventListener('message', handleNuiMessage)
      loadUserProfile()
    })

    onUnmounted(() => {
      window.removeEventListener('message', handleNuiMessage)
    })

    const loadUserProfile = () => {
      fetch('https://bit-smartphone/getUserProfile', {
        method: 'POST',
        body: JSON.stringify({})
      }).catch(error => console.error('[Phone] Error loading user profile:', error))
    }

    const openAirDropModal = () => {
      showAirDropModal.value = true
      loadNearbyPlayers()
    }

    const closeAirDropModal = () => {
      showAirDropModal.value = false
      nearbyPlayers.value = []
    }

    const loadNearbyPlayers = () => {
      isLoadingNearbyPlayers.value = true
      fetch('https://bit-smartphone/getNearbyPlayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(error => {
        console.error('[Phone] Error loading nearby players:', error)
        isLoadingNearbyPlayers.value = false
      })
    }

    const sendAirDrop = (targetPlayer) => {
      fetch('https://bit-smartphone/sendAirDrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlayerId: targetPlayer.id,
          targetPlayerName: targetPlayer.name,
          phoneNumber: userProfile.value.phoneNumber,
          userName: userProfile.value.name
        })
      }).catch(error => console.error('[Phone] Error sending AirDrop:', error))
    }

    const loadContacts = () => {
      isLoadingContacts.value = true
      console.log('[Phone] Loading contacts...')
      fetch('https://bit-smartphone/getContacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(error => {
        console.error('[Phone] Error loading contacts:', error)
        isLoadingContacts.value = false
      })
    }

    const filteredContacts = computed(() => {
      if (!searchQuery.value) return contacts.value.filter(c => !c.blocked)
      return contacts.value.filter(contact => 
        !contact.blocked && (
          contact.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          contact.number.includes(searchQuery.value)
        )
      )
    })

    const favoriteContacts = computed(() => {
      return contacts.value.filter(contact => contact.favorite && !contact.blocked)
    })

    const unreadVoicemails = computed(() => {
      return voicemails.value.filter(vm => !vm.listened).length
    })

    
    const addDigit = (digit) => {
      dialNumber.value += digit
    }

    const deleteDigit = () => {
      dialNumber.value = dialNumber.value.slice(0, -1)
    }

    const setView = (view) => {
      if (isAnimating.value) return
      currentView.value = view
      selectedContact.value = null
      closeSlideUp()
      
      
      if (view === 'recents') {
        loadRecents()
      } else if (view === 'voicemail') {
        loadVoicemails()
      }
    }

    const viewContact = (contact) => {
      selectedContact.value = { ...contact }
      currentView.value = 'contact-detail'
    }

    
    const makeCall = (number, type = 'audio') => {
      if (!number) return
      
      
      fetch('https://bit-smartphone/makeCall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: number,
          type: type
        })
      }).then(() => {
        
        emit('open-app', 'call')
      }).catch(error => {
        console.error('Error making call:', error)
      })
    }

    
    const showSlideUpModal = async (type, clear = true) => {
      if (isAnimating.value) return

      isAnimating.value = true
      showSlideUp.value = type

      if (type === 'add-contact' && clear) {
        newContactName.value = ""
        newContactNumber.value = ""
      } else if (type === 'edit-contact' && selectedContact.value) {
        editContactName.value = selectedContact.value.name || ""
        editContactNumber.value = selectedContact.value.number || ""
      } else if (type === 'edit-notes' && selectedContact.value) {
        editNotesText.value = selectedContact.value.notes || ""
      }

      await nextTick()
      setTimeout(() => { isAnimating.value = false }, 300)
    }

    const closeSlideUp = async () => {
      if (isAnimating.value) return
      
      isAnimating.value = true
      showSlideUp.value = ""
      
      await nextTick()
      setTimeout(() => { isAnimating.value = false }, 300)
    }

    
    const saveNewContact = async () => {
      if (newContactName.value.trim() && newContactNumber.value.trim()) {
        console.log('[Phone] Saving new contact:', newContactName.value, newContactNumber.value);
        try {
          // Enviar al servidor para guardar en BD
          const response = await fetch('https://bit-smartphone/saveContact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: newContactName.value.trim(),
              number: newContactNumber.value.trim()
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              // Recargar contactos desde el servidor
              await loadContacts();
              // Limpiar formulario
              newContactName.value = "";
              newContactNumber.value = "";
              closeSlideUp();
            } else {
              console.error('Error saving contact:', result.message);
            }
          } else {
            // Si falla la petición al servidor, agregar localmente
            contacts.value.push({
              id: Date.now(),
              name: newContactName.value.trim(),
              number: newContactNumber.value.trim(),
              avatar: null,
              notes: "",
              blocked: false,
              favorite: false
            });
            newContactName.value = "";
            newContactNumber.value = "";
            closeSlideUp();
          }
        } catch (error) {
          console.error('Error saving contact:', error);
          // Si falla, agregar localmente como fallback
          contacts.value.push({
            id: Date.now(),
            name: newContactName.value.trim(),
            number: newContactNumber.value.trim(),
            avatar: null,
            notes: "",
            blocked: false,
            favorite: false
          });
          newContactName.value = "";
          newContactNumber.value = "";
          closeSlideUp();
        }
      }
    }

    const saveEditContact = async () => {
      if (editContactName.value.trim() && editContactNumber.value.trim() && selectedContact.value) {
        try {
          // Actualizar datos del contacto
          selectedContact.value.name = editContactName.value.trim();
          selectedContact.value.number = editContactNumber.value.trim();
          
          // Enviar al servidor para actualizar en BD
          const response = await fetch('https://bit-smartphone/updateContact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedContact.value.id,
              name: selectedContact.value.name,
              number: selectedContact.value.number,
              notes: selectedContact.value.notes || "",
              blocked: selectedContact.value.blocked || false,
              favorite: selectedContact.value.favorite || false
            })
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              // Recargar contactos desde el servidor
              await loadContacts();
            } else {
              console.error('Error updating contact:', result.message);
            }
          }
          
          // Actualizar localmente como fallback
          const index = contacts.value.findIndex(c => c.id === selectedContact.value.id);
          if (index !== -1) {
            contacts.value[index] = { ...selectedContact.value };
          }
          
          closeSlideUp();
        } catch (error) {
          console.error('Error updating contact:', error);
          
          // Actualizar localmente como fallback
          const index = contacts.value.findIndex(c => c.id === selectedContact.value.id);
          if (index !== -1) {
            contacts.value[index] = { ...selectedContact.value };
          }
          
          closeSlideUp();
        }
      }
    }

    const deleteContact = () => {
      showSlideUpModal('delete-confirm')
    }

    const confirmDeleteContact = async () => {
      try {
        // Enviar al servidor para eliminar de BD
        const response = await fetch('https://bit-smartphone/deleteContact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedContact.value.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Recargar contactos desde el servidor
            await loadContacts();
          } else {
            console.error('Error deleting contact:', result.message);
          }
        }
        
        // Eliminar localmente como fallback
        contacts.value = contacts.value.filter(c => c.id !== selectedContact.value.id);
        
      } catch (error) {
        console.error('Error deleting contact:', error);
        // Eliminar localmente como fallback
        contacts.value = contacts.value.filter(c => c.id !== selectedContact.value.id);
      } finally {
        currentView.value = 'contacts';
        selectedContact.value = null;
        closeSlideUp();
      }
    }

    const toggleBlock = async () => {
      selectedContact.value.blocked = !selectedContact.value.blocked;
      
      try {
        // Actualizar en el servidor
        await fetch('https://bit-smartphone/updateContact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedContact.value.id,
            name: selectedContact.value.name,
            number: selectedContact.value.number,
            notes: selectedContact.value.notes || "",
            blocked: selectedContact.value.blocked,
            favorite: selectedContact.value.favorite || false
          })
        });
      } catch (error) {
        console.error('Error updating contact block status:', error);
      }
      
      // Actualizar localmente
      const index = contacts.value.findIndex(c => c.id === selectedContact.value.id);
      if (index !== -1) {
        contacts.value[index].blocked = selectedContact.value.blocked;
      }
    }

    const toggleFavorite = async () => {
      selectedContact.value.favorite = !selectedContact.value.favorite;
      
      try {
        // Actualizar en el servidor
        await fetch('https://bit-smartphone/updateContact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedContact.value.id,
            name: selectedContact.value.name,
            number: selectedContact.value.number,
            notes: selectedContact.value.notes || "",
            blocked: selectedContact.value.blocked || false,
            favorite: selectedContact.value.favorite
          })
        });
      } catch (error) {
        console.error('Error updating contact favorite status:', error);
      }
      
      // Actualizar localmente
      const index = contacts.value.findIndex(c => c.id === selectedContact.value.id);
      if (index !== -1) {
        contacts.value[index].favorite = selectedContact.value.favorite;
      }
    }

    const saveEditNotes = async () => {
      selectedContact.value.notes = editNotesText.value;
      
      try {
        // Actualizar en el servidor
        await fetch('https://bit-smartphone/updateContact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedContact.value.id,
            name: selectedContact.value.name,
            number: selectedContact.value.number,
            notes: selectedContact.value.notes,
            blocked: selectedContact.value.blocked || false,
            favorite: selectedContact.value.favorite || false
          })
        });
      } catch (error) {
        console.error('Error updating contact notes:', error);
      }
      
      // Actualizar localmente
      const index = contacts.value.findIndex(c => c.id === selectedContact.value.id);
      if (index !== -1) {
        contacts.value[index].notes = editNotesText.value;
      }
      
      closeSlideUp();
    }

    
    const openMessages = () => {
      emit('open-app', { id: 'messages', contactNumber: selectedContact.value?.number })
    }

    const playVoicemail = async (voicemail) => {
      try {
        const response = await fetch('https://bit-smartphone/playVoicemail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: voicemail.id
          })
        })
        
        if (response.ok) {
          voicemail.listened = true
        }
      } catch (error) {
        console.error('Error marking voicemail as read:', error)
      }
    }

    const deleteVoicemail = async (voicemailId) => {
      try {
        const response = await fetch('https://bit-smartphone/deleteVoicemail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: voicemailId
          })
        })
        
        if (response.ok) {
          voicemails.value = voicemails.value.filter(vm => vm.id !== voicemailId)
        }
      } catch (error) {
        console.error('Error deleting voicemail:', error)
      }
    }

    
    onMounted(async () => {
      isLoading.value = true
      await Promise.all([
        loadContacts(),
        loadRecents(),
        loadVoicemails(),
        loadBlocked()
      ])
      isLoading.value = false
    })
    
    return {
      
      currentView,
      dialNumber,
      contacts,
      recents,
      voicemails,
      blockedNumbers,
      selectedContact,
      searchQuery,
      favoriteContacts,
      unreadVoicemails,
      showSlideUp,
      isAnimating,
      isLoading,
      isLoadingContacts,
      
      
      newContactName,
      newContactNumber,
      editContactName,
      editContactNumber,
      editNotesText,
      
      
      filteredContacts,
      
      
      addDigit,
      deleteDigit,
      setView,
      viewContact,
      makeCall,
      
      
      showSlideUpModal,
      closeSlideUp,
      
      
      saveNewContact,
      saveEditContact,
      saveEditNotes,
      deleteContact,
      toggleBlock,
      toggleFavorite,
      
      
      loadContacts,
      loadRecents,
      loadVoicemails,
      loadBlocked,
      
      // AirDrop
      showAirDropModal,
      nearbyPlayers,
      isLoadingNearbyPlayers,
      userProfile,
      openAirDropModal,
      closeAirDropModal,
      loadNearbyPlayers,
      sendAirDrop,
      
      
      openMessages,
      playVoicemail,
      deleteVoicemail
    }
  },
  methods: {
    async loadContacts() {
      try {
        isLoadingContacts.value = true;
        const response = await fetch('https://bit-smartphone/getContacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const data = await response.json();
          contacts.value = data.contacts || [];
        } else {
          console.error('Error loading contacts:', response.statusText);
        }
      } catch (error) {
        console.log('[Phone] Loaded fallback contacts:', contacts.value.length);
      } finally {
        isLoadingContacts.value = false;
      }
    }
  },
  template: `
  <div class="h-full mb-6 flex flex-col relative overflow-hidden"
       :class="userSettings.darkMode ? 'bg-black text-white' : 'bg-white text-black'">
    
    <!-- Header con estilo iOS -->
    <header class="px-4 pt-16 pb-2 flex items-center justify-between shrink-0"
            :class="userSettings.darkMode ? 'bg-black' : 'bg-white'">
      <button @click="$emit('close')" 
              class="text-blue-500 font-normal text-[17px] active:opacity-30 transition-opacity duration-150"
              style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        {{ t('common.back', 'Teléfono') }}
      </button>
      
      <h1 class="text-[17px] font-semibold text-center flex-1"
          style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
          :class="userSettings.darkMode ? 'text-white' : 'text-black'">
        {{ currentView === 'contacts' ? t('phone.contacts', 'Contactos') : 
           currentView === 'contact-detail' ? selectedContact?.name : 
           currentView === 'recents' ? t('phone.recents', 'Recientes') : 
           currentView === 'favorites' ? t('phone.favorites', 'Favoritos') : 
           currentView === 'voicemail' ? t('phone.voicemail', 'Buzón') :
           t('phone.keypad', 'Teclado') }}
      </h1>
      
      <button v-if="currentView === 'contacts'" @click="showSlideUpModal('add-contact')" 
              class="text-blue-500 text-[17px] active:opacity-30 transition-opacity duration-150"
              style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
      </button>
      <div v-else class="w-6"></div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      
      <!-- Contacts View -->
      <div v-if="currentView === 'contacts'" class="h-full flex flex-col">
        <!-- Search Bar -->
        <div class="px-4 pb-2">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input v-model="searchQuery" 
                   :placeholder="t('phone.search', 'Buscar')"
                   class="w-full pl-10 pr-4 py-2 rounded-lg text-[16px] border-0 transition-all duration-200"
                   style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                   :class="userSettings.darkMode 
                     ? 'bg-gray-800 text-white placeholder-gray-500' 
                     : 'bg-gray-100 text-black placeholder-gray-400'">
          </div>
        </div>

        <!-- Contacts List -->
        <div class="flex-1 overflow-y-auto">
          <!-- Mi Perfil / AirDrop -->
          <div class="flex items-center px-4 py-4 border-b-2"
               :class="[
                 userSettings.darkMode 
                   ? 'border-gray-700 bg-gray-900' 
                   : 'border-gray-300 bg-gray-50'
               ]">
            <div class="relative w-12 h-12 rounded-full mr-3 overflow-hidden"
                 :class="userSettings.darkMode ? 'bg-gray-700' : 'bg-blue-100'">
              <div class="w-full h-full flex items-center justify-center">
                <span class="text-2xl">{{ userProfile.avatar }}</span>
              </div>
            </div>
            
            <div class="flex-1">
              <div class="font-semibold text-[16px]"
                   :class="userSettings.darkMode ? 'text-white' : 'text-black'"
                   style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                {{ userProfile.name }}
              </div>
              <div class="text-[14px] text-gray-500"
                   style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                {{ userProfile.phoneNumber }}
              </div>
            </div>
            
            <button @click="openAirDropModal"
                    class="px-4 py-2 rounded-full text-[14px] font-medium active:opacity-70 transition-all duration-150"
                    :class="userSettings.darkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-500 text-white'"
                    style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              📡 AirDrop
            </button>
          </div>
          
          <!-- Lista de Contactos -->
          <div v-for="contact in filteredContacts" :key="contact.id" 
               @click="viewContact(contact)"
               class="flex items-center px-4 py-3 active:bg-gray-100 transition-colors duration-150 border-b"
               :class="[
                 userSettings.darkMode 
                   ? 'active:bg-gray-800 border-gray-800' 
                   : 'border-gray-200'
               ]">
            <div class="relative w-10 h-10 rounded-full mr-3 overflow-hidden bg-gray-300">
              <img v-if="contact.avatar" :src="contact.avatar" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-gray-400 flex items-center justify-center">
                <span class="text-white font-medium text-sm">{{ contact.name.charAt(0).toUpperCase() }}</span>
              </div>
              
              <!-- Favorite star -->
              <div v-if="contact.favorite" class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="font-normal text-[17px] truncate"
                 style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                 :class="userSettings.darkMode ? 'text-white' : 'text-black'">{{ contact.name }}</p>
              <p class="text-[15px] text-gray-500 truncate"
                 style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">{{ contact.number }}</p>
            </div>
            
            <svg class="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Contact Detail View -->
      <div v-if="currentView === 'contact-detail' && selectedContact" class="h-full flex flex-col">
        <!-- Contact Header -->
        <div class="px-4 py-8 text-center">
          <div class="relative w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden bg-gray-300 shadow-lg">
            <img v-if="selectedContact.avatar" :src="selectedContact.avatar" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-gray-400 flex items-center justify-center">
              <span class="text-white font-medium text-4xl">{{ selectedContact.name.charAt(0).toUpperCase() }}</span>
            </div>
            
            <!-- Favorite toggle -->
            <button @click="toggleFavorite" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-95 transition-transform">
              <svg class="w-4 h-4" :class="selectedContact.favorite ? 'text-blue-500' : 'text-gray-400'" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
          </div>
          
          <h2 class="text-2xl font-normal mb-1"
              style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
              :class="userSettings.darkMode ? 'text-white' : 'text-black'">{{ selectedContact.name }}</h2>
          <p class="text-[17px] text-gray-500 mb-8"
             style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">{{ selectedContact.number }}</p>

          <!-- Action Buttons -->
          <div class="flex justify-center space-x-12">
            <button @click="makeCall(selectedContact.number)" class="flex flex-col items-center active:opacity-30 transition-opacity">
              <div class="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </div>
              <span class="text-xs text-gray-600"
                    style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                    :class="userSettings.darkMode ? 'text-gray-400' : ''">llamar</span>
            </button>
            
            <button class="flex flex-col items-center active:opacity-30 transition-opacity">
              <div class="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <span class="text-xs text-gray-600"
                    style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                    :class="userSettings.darkMode ? 'text-gray-400' : ''">FaceTime</span>
            </button>
            
            <button @click="openMessages" class="flex flex-col items-center active:opacity-30 transition-opacity">
              <div class="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <span class="text-xs text-gray-600"
                    style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                    :class="userSettings.darkMode ? 'text-gray-400' : ''">mensaje</span>
            </button>
          </div>
        </div>

        <!-- Contact Options -->
        <div class="flex-1 px-4">
          <div class="space-y-1">
            <button @click="showSlideUpModal('edit-contact')" 
                    class="w-full text-left py-3 px-4 rounded-lg transition-colors active:bg-gray-100"
                    :class="userSettings.darkMode ? 'active:bg-gray-800' : ''">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <span class="text-[17px]"
                      style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                      :class="userSettings.darkMode ? 'text-white' : 'text-black'">Editar</span>
              </div>
            </button>
            
            <button @click="showSlideUpModal('edit-notes')" 
                    class="w-full text-left py-3 px-4 rounded-lg transition-colors active:bg-gray-100"
                    :class="userSettings.darkMode ? 'active:bg-gray-800' : ''">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </div>
                  <span class="text-[17px]"
                        style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                        :class="userSettings.darkMode ? 'text-white' : 'text-black'">Notas</span>
                </div>
                <span class="text-[15px] text-gray-500 max-w-xs truncate"
                      style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">{{ selectedContact.notes || 'Añadir nota' }}</span>
              </div>
            </button>
            
            <button @click="toggleBlock" 
                    class="w-full text-left py-3 px-4 rounded-lg transition-colors active:bg-gray-100"
                    :class="userSettings.darkMode ? 'active:bg-gray-800' : ''">
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                     :class="selectedContact.blocked ? 'bg-red-500' : 'bg-gray-400'">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path v-if="selectedContact.blocked" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    <path v-else d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                  </svg>
                </div>
                <span class="text-[17px]"
                      style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                      :class="selectedContact.blocked ? 'text-red-500' : (userSettings.darkMode ? 'text-white' : 'text-black')">
                  {{ selectedContact.blocked ? 'Desbloquear este contacto' : 'Bloquear este contacto' }}
                </span>
              </div>
            </button>
            
            <button @click="deleteContact" 
                    class="w-full text-left py-3 px-4 rounded-lg transition-colors active:bg-gray-100"
                    :class="userSettings.darkMode ? 'active:bg-gray-800' : ''">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </div>
                <span class="text-[17px] text-red-500"
                      style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Eliminar contacto</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Recents View -->
      <div v-if="currentView === 'recents'" class="h-full overflow-y-auto">
        <div v-for="call in recents" :key="call.id" 
             class="flex items-center px-4 py-3 active:bg-gray-100 transition-colors border-b"
             :class="[
               userSettings.darkMode 
                 ? 'active:bg-gray-800 border-gray-800' 
                 : 'border-gray-200'
             ]">
          <div class="w-6 h-6 mr-3 flex items-center justify-center">
            <svg class="w-4 h-4" :class="call.type === 'missed' ? 'text-red-500' : 'text-gray-400'" fill="currentColor" viewBox="0 0 24 24">
              <path v-if="call.type === 'missed'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 17h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              <path v-else-if="call.type === 'outgoing'" d="M9 5v4H5.5L12 15.5 18.5 9H15V5H9z"/>
              <path v-else d="M9 15.5L15 9H11.5V5H8.5v4H5l4 6.5z"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-normal text-[17px] truncate"
               style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
               :class="[
                 call.type === 'missed' ? 'text-red-500' : (userSettings.darkMode ? 'text-white' : 'text-black')
               ]">{{ call.name }}</p>
            <div class="flex items-center text-[15px] text-gray-500"
                 style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              <span>{{ call.number }}</span>
              <span class="mx-1">•</span>
              <span>{{ call.time }}</span>
              <span v-if="call.duration !== '00:00'" class="mx-1">•</span>
              <span v-if="call.duration !== '00:00'">{{ call.duration }}</span>
            </div>
          </div>
          <button @click.stop="makeCall(call.number)" 
                  class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center ml-3 active:opacity-30 transition-opacity">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Favorites View -->
      <div v-if="currentView === 'favorites'" class="h-full">
        <div v-if="favoriteContacts.length > 0" class="overflow-y-auto">
          <div v-for="contact in favoriteContacts" :key="contact.id" 
               @click="viewContact(contact)"
               class="flex items-center px-4 py-3 active:bg-gray-100 transition-colors border-b"
               :class="[
                 userSettings.darkMode 
                   ? 'active:bg-gray-800 border-gray-800' 
                   : 'border-gray-200'
               ]">
            <div class="relative w-10 h-10 rounded-full mr-3 overflow-hidden bg-gray-300">
              <img v-if="contact.avatar" :src="contact.avatar" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-blue-500 flex items-center justify-center">
                <span class="text-white font-medium text-sm">{{ contact.name.charAt(0).toUpperCase() }}</span>
              </div>
              
              <!-- Star indicator -->
              <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            
            <div class="flex-1 min-w-0">
              <p class="font-normal text-[17px] truncate"
                 style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                 :class="userSettings.darkMode ? 'text-white' : 'text-black'">{{ contact.name }}</p>
              <p class="text-[15px] text-gray-500 truncate"
                 style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">{{ contact.number }}</p>
            </div>
            
            <button @click.stop="makeCall(contact.number)" 
                    class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center ml-3 active:opacity-30 transition-opacity">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else class="h-full flex items-center justify-center px-6">
          <div class="text-center">
            <div class="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <p class="text-[20px] font-semibold mb-2"
               style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
               :class="userSettings.darkMode ? 'text-white' : 'text-black'">No hay favoritos</p>
            <p class="text-[15px] text-gray-500"
               style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Toca la estrella junto a un contacto para añadirlo a favoritos.</p>
          </div>
        </div>
      </div>

      <!-- Voicemail View -->
      <div v-if="currentView === 'voicemail'" class="h-full">
        <div v-if="voicemails.length > 0" class="overflow-y-auto">
          <div v-for="voicemail in voicemails" :key="voicemail.id" 
               class="flex items-center px-4 py-3 active:bg-gray-100 transition-colors border-b"
               :class="[
                 userSettings.darkMode 
                   ? 'active:bg-gray-800 border-gray-800' 
                   : 'border-gray-200',
                 !voicemail.listened ? 'bg-blue-50' : ''
               ]">
            <div class="w-8 h-8 rounded-full mr-3 flex items-center justify-center bg-blue-500">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 1v10a1 1 0 001 1h8a1 1 0 001-1V5M9 9h6m-6 4h6"/>
              </svg>
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center">
                <p class="font-normal text-[17px] truncate mr-2"
                   style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                   :class="userSettings.darkMode ? 'text-white' : 'text-black'">{{ voicemail.from }}</p>
                <div v-if="!voicemail.listened" class="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div class="flex items-center text-[15px] text-gray-500"
                   style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                <span>{{ voicemail.number }}</span>
                <span class="mx-1">•</span>
                <span>{{ voicemail.time }}</span>
                <span class="mx-1">•</span>
                <span>{{ voicemail.duration }}</span>
              </div>
            </div>
            
            <div class="flex items-center space-x-2 ml-3">
              <button @click.stop="playVoicemail(voicemail)" 
                      class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center active:opacity-30 transition-opacity">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              
              <button @click.stop="deleteVoicemail(voicemail.id)" 
                      class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center active:opacity-30 transition-opacity">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-else class="h-full flex items-center justify-center px-6">
          <div class="text-center">
            <div class="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 1v10a1 1 0 001 1h8a1 1 0 001-1V5M9 9h6m-6 4h6"/>
              </svg>
            </div>
            <p class="text-[20px] font-semibold mb-2"
               style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
               :class="userSettings.darkMode ? 'text-white' : 'text-black'">No hay mensajes de voz</p>
            <p class="text-[15px] text-gray-500"
               style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Los mensajes de voz aparecerán aquí.</p>
          </div>
        </div>
      </div>

      <!-- Keypad View -->
      <div v-if="currentView === 'keypad'" class="h-full flex flex-col justify-center px-4 py-8">
        <!-- Number Display -->
        <div class="flex-1 flex flex-col items-center justify-center mb-8">
          <div class="w-full max-w-sm">
            <input v-model="dialNumber" 
                   class="bg-transparent text-4xl text-center w-full focus:outline-none mb-4 font-light tracking-wider"
                   style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                   :class="userSettings.darkMode ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-400'"
                   placeholder="Número de teléfono"
                   readonly>
          </div>
        </div>
        
        <!-- Keypad -->
        <div class="grid grid-cols-3 gap-4 text-3xl mb-8 max-w-xs mx-auto">
          <button v-for="(digit, index) in ['1','2','3','4','5','6','7','8','9','*','0','#']" 
                  :key="digit" 
                  @click="addDigit(digit)" 
                  class="w-20 h-20 rounded-full flex items-center justify-center font-light transition-all duration-150 mx-auto active:bg-gray-200"
                  style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                  :class="[
                    userSettings.darkMode 
                      ? 'text-white active:bg-gray-800' 
                      : 'text-black',
                  ]">
            {{ digit }}
          </button>
        </div>
        
        <!-- Call/Delete buttons -->
        <div class="flex justify-center items-center space-x-12 mb-4">
          <button v-if="dialNumber.length > 0" 
                  @click="deleteDigit" 
                  class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 active:bg-gray-200"
                  :class="userSettings.darkMode ? 'active:bg-gray-800' : ''">
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"/>
            </svg>
          </button>
          <div v-else class="w-12 h-12"></div>
          
          <button v-if="dialNumber.length > 0" 
                  @click="makeCall(dialNumber)"
                  class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 active:scale-95">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
          </button>
          <div v-else class="w-16 h-16"></div>
          
          <div class="w-12 h-12"></div>
        </div>
      </div>
    </main>

    <!-- Tab Bar -->
    <footer class="grid grid-cols-5 text-xs text-center shrink-0 py-2 border-t"
            :class="userSettings.darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'">
      <button @click="setView('favorites')" 
              class="flex flex-col items-center py-1 transition-opacity duration-150 active:opacity-30"
              :class="currentView === 'favorites' ? 'text-blue-500' : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <div class="relative mb-1">
          <svg class="w-6 h-6" 
               :fill="currentView === 'favorites' ? 'currentColor' : 'none'" 
               stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.684l1.519-4.674z"/>
          </svg>
          <span v-if="favoriteContacts.length > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {{ favoriteContacts.length }}
          </span>
        </div>
        <span class="text-[10px]" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Favoritos</span>
      </button>
      
      <button @click="setView('recents')" 
              class="flex flex-col items-center py-1 transition-opacity duration-150 active:opacity-30"
              :class="currentView === 'recents' ? 'text-blue-500' : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <svg class="w-6 h-6 mb-1" 
             :fill="currentView === 'recents' ? 'currentColor' : 'none'" 
             stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span class="text-[10px]" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Recientes</span>
      </button>
      
      <button @click="setView('contacts')" 
              class="flex flex-col items-center py-1 transition-opacity duration-150 active:opacity-30"
              :class="currentView === 'contacts' ? 'text-blue-500' : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <svg class="w-6 h-6 mb-1" 
             :fill="currentView === 'contacts' ? 'currentColor' : 'none'" 
             stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <span class="text-[10px]" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Contactos</span>
      </button>
      
      <button @click="setView('keypad')" 
              class="flex flex-col items-center py-1 transition-opacity duration-150 active:opacity-30"
              :class="currentView === 'keypad' ? 'text-blue-500' : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <svg class="w-6 h-6 mb-1" 
             :fill="currentView === 'keypad' ? 'currentColor' : 'none'" 
             stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
        </svg>
        <span class="text-[10px]" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Teclado</span>
      </button>
      
      <button @click="setView('voicemail')" 
              class="flex flex-col items-center py-1 transition-opacity duration-150 active:opacity-30"
              :class="currentView === 'voicemail' ? 'text-blue-500' : (userSettings.darkMode ? 'text-gray-500' : 'text-gray-600')">
        <div class="relative mb-1">
          <svg class="w-6 h-6" 
               :fill="currentView === 'voicemail' ? 'currentColor' : 'none'" 
               stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 1v10a1 1 0 001 1h8a1 1 0 001-1V5M9 9h6m-6 4h6"/>
          </svg>
          <span v-if="unreadVoicemails > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {{ unreadVoicemails }}
          </span>
        </div>
        <span class="text-[10px]" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Buzón</span>
      </button>
    </footer>

    <!-- Slide-up Modal -->
    <transition name="slide-up-overlay">
      <div v-if="showSlideUp" 
           class="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-end"
           @click="closeSlideUp">
    
        <transition name="slide-up-content">
          <div v-if="showSlideUp" 
               @click.stop 
               class="w-full rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
               :class="userSettings.darkMode ? 'bg-gray-900' : 'bg-white'">
            
            <!-- Handle -->
            <div class="flex justify-center py-3">
              <div class="w-10 h-1 bg-gray-400 rounded-full" :class="userSettings.darkMode ? 'bg-gray-500' : ''"></div>
            </div>

            <!-- Add Contact Modal -->
            <div v-if="showSlideUp === 'add-contact'" class="p-6 pb-8">
              <h3 class="text-[20px] font-semibold mb-6 text-center"
                  style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                  :class="userSettings.darkMode ? 'text-white' : 'text-black'">
                Nuevo Contacto
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-[15px] font-normal mb-2"
                         style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                         :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                    Nombre
                  </label>
                  <input v-model="newContactName" 
                         class="w-full px-4 py-3 rounded-lg border text-[17px] transition-all duration-200"
                         style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                         :class="userSettings.darkMode ? 'bg-gray-800 text-white border-gray-700 focus:border-blue-500' : 'bg-white text-black border-gray-300 focus:border-blue-500'">
                </div>
                <div>
                  <label class="block text-[15px] font-normal mb-2"
                         style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                         :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                    Teléfono
                  </label>
                  <input v-model="newContactNumber" 
                         type="tel"
                         class="w-full px-4 py-3 rounded-lg border text-[17px] transition-all duration-200"
                         style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                         :class="userSettings.darkMode ? 'bg-gray-800 text-white border-gray-700 focus:border-blue-500' : 'bg-white text-black border-gray-300 focus:border-blue-500'">
                </div>
              </div>
              
              <div class="flex space-x-4 mt-8">
                <button @click="closeSlideUp"
                        class="flex-1 py-3 px-6 rounded-lg font-normal transition-all duration-200 active:opacity-30"
                        style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                        :class="userSettings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'">
                  Cancelar
                </button>
                <button @click="saveEditContact"
                        class="flex-1 py-3 px-6 bg-blue-500 text-white rounded-lg font-normal transition-all duration-200 active:opacity-30"
                        style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                  Guardar
                </button>
              </div>
            </div>

            <!-- Edit Notes Modal -->
            <div v-if="showSlideUp === 'edit-notes'" class="p-6 pb-8">
              <h3 class="text-[20px] font-semibold mb-6 text-center"
                  style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                  :class="userSettings.darkMode ? 'text-white' : 'text-black'">
                Editar Notas
              </h3>
              
              <div>
                <label class="block text-[15px] font-normal mb-2"
                       style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                       :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                  Notas
                </label>
                <textarea v-model="editNotesText" 
                          placeholder="Introduce las notas"
                          rows="6"
                          class="w-full px-4 py-3 rounded-lg border text-[17px] resize-none transition-all duration-200"
                          style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                          :class="userSettings.darkMode ? 'bg-gray-800 text-white border-gray-700 focus:border-blue-500' : 'bg-white text-black border-gray-300 focus:border-blue-500'">
                </textarea>
              </div>
              
              <div class="flex space-x-4 mt-8">
                <button @click="closeSlideUp"
                        class="flex-1 py-3 px-6 rounded-lg font-normal transition-all duration-200 active:opacity-30"
                        style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                        :class="userSettings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'">
                  Cancelar
                </button>
                <button @click="saveEditNotes"
                        class="flex-1 py-3 px-6 bg-blue-500 text-white rounded-lg font-normal transition-all duration-200 active:opacity-30"
                        style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                  Guardar
                </button>
              </div>
            </div>

            <!-- Delete Confirmation Modal -->
            <div v-if="showSlideUp === 'delete-confirm'" class="p-6 pb-8">
              <div class="text-center mb-6">
                <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </div>
                <h3 class="text-[20px] font-semibold mb-4 text-red-500"
                    style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Eliminar Contacto</h3>
                <p class="text-[17px] mb-2"
                   style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                   :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-600'">
                  ¿Estás seguro de que quieres eliminar este contacto?
                </p>
                <p class="text-[17px] font-medium"
                   style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                   :class="userSettings.darkMode ? 'text-white' : 'text-black'">
                  {{ selectedContact?.name }}
                </p>
              </div>
              
              <div class="flex space-x-4">
                <button @click="closeSlideUp"
                        class="flex-1 py-3 px-6 rounded-lg font-normal transition-all duration-200 active:opacity-30"
                        style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;"
                        :class="userSettings.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'">
                  Cancelar
                </button>
                <button @click="confirmDeleteContact"
                        class="flex-1 py-3 px-6 bg-red-500 text-white rounded-lg font-normal transition-all duration-200 active:opacity-30"
                        style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                  Eliminar
                </button>
              </div>
            </div>

          </div>
        </transition>
      </div>
    </transition>

    <!-- AirDrop Modal -->
    <transition name="slide-up">
      <div v-if="showAirDropModal" class="absolute inset-0 z-50 flex items-end">
        <div class="w-full bg-white rounded-t-2xl shadow-2xl max-h-[80%] flex flex-col"
             :class="userSettings.darkMode ? 'bg-gray-900' : 'bg-white'">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-4 border-b"
               :class="userSettings.darkMode ? 'border-gray-700' : 'border-gray-200'">
            <h3 class="text-lg font-semibold"
                :class="userSettings.darkMode ? 'text-white' : 'text-black'"
                style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              📡 AirDrop - Jugadores Cercanos
            </h3>
            <button @click="closeAirDropModal"
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    :class="userSettings.darkMode 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-100 text-gray-600'">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Modal Content -->
          <div class="flex-1 overflow-y-auto p-4">
            <!-- Loading State -->
            <div v-if="isLoadingNearbyPlayers" class="flex flex-col items-center justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
              <p class="text-gray-500 text-sm">Buscando jugadores cercanos...</p>
            </div>

            <!-- No Players Found -->
            <div v-else-if="nearbyPlayers.length === 0" class="flex flex-col items-center justify-center py-8">
              <div class="text-4xl mb-4">🔍</div>
              <p class="text-gray-500 text-center">
                No se encontraron jugadores cerca.
                <br>
                <span class="text-xs">Acércate a otros jugadores para compartir tu número.</span>
              </p>
              <button @click="loadNearbyPlayers"
                      class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">
                🔄 Buscar de nuevo
              </button>
            </div>

            <!-- Players List -->
            <div v-else class="space-y-3">
              <div v-for="player in nearbyPlayers" :key="player.id"
                   @click="sendAirDrop(player)"
                   class="flex items-center p-3 rounded-lg active:bg-gray-100 transition-colors duration-150 cursor-pointer"
                   :class="[
                     userSettings.darkMode 
                       ? 'bg-gray-800 hover:bg-gray-700 active:bg-gray-700' 
                       : 'bg-gray-50 hover:bg-gray-100'
                   ]">
                
                <div class="w-12 h-12 rounded-full mr-3 flex items-center justify-center"
                     :class="userSettings.darkMode ? 'bg-gray-700' : 'bg-gray-200'">
                  <span class="text-xl">👤</span>
                </div>
                
                <div class="flex-1">
                  <div class="font-medium"
                       :class="userSettings.darkMode ? 'text-white' : 'text-black'"
                       style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                    {{ player.name }}
                  </div>
                  <div class="text-sm text-gray-500">
                    ID: {{ player.id }} • {{ player.distance }}m
                  </div>
                </div>
                
                <div class="text-blue-500">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-4 border-t"
               :class="userSettings.darkMode ? 'border-gray-700' : 'border-gray-200'">
            <p class="text-xs text-gray-500 text-center">
              Al enviar tu número, el jugador podrá agregarte a sus contactos.
            </p>
          </div>
        </div>
      </div>
    </transition>

  </div>
`,
}

window.Phone = window.Phone || Phone;