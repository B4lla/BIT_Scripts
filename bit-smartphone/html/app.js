const { createApp, ref, computed, onMounted, onUnmounted, nextTick, watch, defineComponent, markRaw, reactive } = Vue


const importApp = async (appName, t) => {
  const appMap = {
    'phone': 'Phone', 'messages': 'Messages', 'mail': 'Mail', 'music': 'Music',
    'photos': 'Photos', 'camera': 'Camera', 'clock': 'Clock', 'calculator': 'Calculator',
    'notes': 'Notes', 'maps': 'Maps', 'calendar': 'Calendar', 'settings': 'Settings',
    'appstore': 'AppStore', 'weather': 'Weather', 'instagram': 'Instagram', 'youtube': 'YouTube',
    'garage': 'Garage', 'translator': 'Translator', 'pong': 'Pong', 'fruitninja': 'FruitNinja',
    'pacman': 'Pacman', 'stack': 'Stack', 'temple': 'Temple', 'tuister': 'Tuister',
    'bank': 'Bank', 'business': 'Business', 'darkweb': 'DarkWeb', 'news': 'News',
    'bikerent': 'BikeRent', 'uber': 'Uber', 'crypto': 'Crypto', 'bitlove': 'BitLove', 'call': 'Call'
  };
  const componentName = appMap[appName];

  const createPlaceholder = (name, reason) => {
    const placeholder = { 
      name: (name || appName) + 'Placeholder', 
      template: `<div class="flex items-center justify-center h-full text-white bg-red-900/20 border border-red-500/50 rounded-lg m-4">
                   <div class="text-center">
                     <h3 class="text-lg font-bold mb-2">⚠️ Error en la App</h3>
                     <p class="text-sm opacity-80 mb-4">La aplicación "${appName}" no está disponible</p>
                     <button @click="$emit('close')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors">
                       Cerrar
                     </button>
                   </div>
                 </div>`,
      emits: ["close"]
  };
  return markRaw(defineComponent(placeholder));
  };

  if (!componentName) {
    return createPlaceholder(appName, "Not found in appMap.");
  }
  
  try {
    let appComponent = window[componentName];

    if ((!appComponent || typeof appComponent !== 'object') && componentName) {
      try {
        const evaluated = eval(componentName);
        if (evaluated && typeof evaluated === 'object') {
          window[componentName] = evaluated;
          appComponent = evaluated;
        }
      } catch (e) {
    
      }
    }

    if (!appComponent || typeof appComponent !== "object") {
      return createPlaceholder(componentName, "Component object not found or invalid.");
    }

    
    if (appComponent.setup && typeof appComponent.setup !== 'function') {
  
      return createPlaceholder(componentName, "Invalid component setup function.");
    }

    if (appComponent && !appComponent.name) {
      appComponent.name = componentName;
    }
    
    if (appComponent) {
      if (appComponent.props === null || typeof appComponent.props === 'undefined') {
        appComponent.props = ["userSettings", "notifications", "photos", "contacts", "userPhoneNumber", "batteryLevel", "isCharging", "notes", "currentTime", "weatherData", "t"];
      } else if (Array.isArray(appComponent.props)) {
        if (!appComponent.props.includes('t')) appComponent.props.push('t');
      } else if (typeof appComponent.props === 'object') {
        if (!('t' in appComponent.props)) appComponent.props['t'] = { required: false };
      } else {
        appComponent.props = ["userSettings", "notifications", "photos", "contacts", "userPhoneNumber", "batteryLevel", "isCharging", "notes", "currentTime", "weatherData", "t"];
      }

      if (appComponent.emits === null || typeof appComponent.emits === 'undefined') {
        appComponent.emits = ["close", "update-setting", "change-wallpaper", "take-photo", "delete-photo", "add-notification", "open-app"];
      } else if (typeof appComponent.emits === 'string') {
        appComponent.emits = [appComponent.emits];
      } else if (Array.isArray(appComponent.emits)) {
      } else if (typeof appComponent.emits === 'object') {
      } else {
        appComponent.emits = [];
      }
    }

    
    delete appComponent.__hmrId;
    delete appComponent.__file;

    
    try {
      console.debug('[importApp] Preparing component', appName, {
        name: appComponent.name,
        props: appComponent.props,
        emits: appComponent.emits,
        hasSetup: !!(appComponent.setup && typeof appComponent.setup === 'function')
      });
    } catch (e) {
    }

    if (!appComponent.props || (!Array.isArray(appComponent.props) && typeof appComponent.props !== 'object')) {
      console.warn('[importApp] Fixing invalid props for', appName);
      appComponent.props = ["userSettings", "t"];
    }
    if (!appComponent.emits || (typeof appComponent.emits !== 'object' && !Array.isArray(appComponent.emits))) {
      console.warn('[importApp] Fixing invalid emits for', appName);
      appComponent.emits = ["close"];
    }

    const wrappedComponent = {
      ...appComponent,
      errorCaptured(err, instance, info) {
        console.error('[importApp] errorCaptured in', appName, err, info);
        return false;
      }
    };

    try {
      const definedComponent = markRaw(defineComponent(wrappedComponent));
      
      return definedComponent;
    } catch (error) {
      console.error('[importApp] Failed to define component for', appName, error);
      return createPlaceholder(appName, `defineComponent failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`Critical error importing app ${appName}:`, error);
    return createPlaceholder(appName, `Critical error: ${error.message}`);
  }
}

const MobileOS = {
  data() {
    return {
      serverData: null,
      phoneConfig: null 
    }
  },
  setup() {
    const phoneState = ref("HOME") 
    const pinInput = ref("")
    const correctPin = "1234"
    const pinError = ref(false)
    const setupStep = ref(0)
    const setupData = ref({
      language: "es",
      darkMode: false,
      wallpaper: "wallpaper1.webp",
      userName: "",
      userPhoto: null,
      faceId: false,
   fontSize: "medium",
    })
    const lockscreenSettings = ref({
      clockStyle: 'default',
      clockColor: '#ffffff',
      clockSize: 'large',
      dateStyle: 'default',
      dateColor: '#ffffff',
      dateSize: 'medium',
      widgets: []
    })
    const currentApp = ref(null)
    const isControlCenterVisible = ref(false)
    const isNotificationsPanelVisible = ref(false)
    const isSpotlightVisible = ref(false)
    const loadedApps = ref({})
    const batteryLevel = ref(85)
    const batteryDraining = ref(false)
    const currentOpenApps = ref(new Set())
    const flashlightOn = ref(false)
    const batteryUpdateInterval = ref(null)

    const isCharging = ref(false)
    const chargingProgress = ref(0)
    const chargingStationId = ref(null)
    
    const signalStrength = ref(4)
    const networkType = ref("5G") 
    const isConnected = ref(true) 
    
    const internetRequiredApps = [
        'youtube', 'instagram', 'tuister', 'news', 
        'darkweb', 'crypto', 'bitlove', 'weather', 'appstore',
        'maps', 'translator', 'uber', 'bank'
    ]
    const currentCallAudio = ref(null) 
    const callData = ref({
      isVisible: false,
      callId: null,
      contactName: '',
      contactNumber: '',
      isIncoming: false,
      callType: 'audio', 
      callStatus: 'connecting' 
    })
    const currentTime = ref("")
    const currentDate = ref("")
    const photos = ref([])
    const wallpapers = ref([
      "./assets/wallpapers/wallpaper1.webp",
      "./assets/wallpapers/wallpaper2.webp",
      "./assets/wallpapers/wallpaper3.webp",
      "./assets/wallpapers/wallpaper4.webp",
      "./assets/wallpapers/wallpaper5.webp",
    ])
    const currentWallpaperIndex = ref(0)
    const userSettings = ref({
      brightness: 75,
      volume: 60,
      wifi: true,
      bluetooth: true,
      airplane: false,
      dnd: false,
      flashlight: false,
      darkMode: true,
      autoLock: "2 minutos",
  faceId: true,
  fontSize: "medium",
    })
    const notifications = ref([])
    const notificationIdCounter = ref(0)
    const isWidgetManagerVisible = ref(false)
    const widgets = ref([])
    const phoneOrientation = ref("portrait") 
    const isOrientationTransitioning = ref(false)
    const isAppSwitcherVisible = ref(false)
    const openApps = ref([]) 
    const homeIndicatorPressTimer = ref(null)
    const isHomeIndicatorPressed = ref(false)
    const showEmergency = ref(false) 
    const globalDraggedItem = ref(null) 
    const allApps = ref([
      { id: "phone", name: "Phone", icon: "phone", color: "bg-ios-green" },
      { id: "messages", name: "Messages", icon: "message-circle", color: "bg-ios-green" },
      { id: "music", name: "Music", icon: "music", color: "bg-ios-pink" },
      { id: "photos", name: "Photos", icon: "image", color: "bg-red-500" },
      { id: "camera", name: "Camera", icon: "camera", color: "bg-ios-gray-4" },
      { id: "clock", name: "Clock", icon: "clock", color: "bg-ios-gray-5" },
      { id: "calculator", name: "Calculator", icon: "calculator", color: "bg-ios-gray-5" },
      { id: "notes", name: "Notes", icon: "sticky-note", color: "bg-ios-yellow" },
      { id: "maps", name: "Maps", icon: "map", color: "bg-ios-orange" },
      { id: "calendar", name: "Calendar", icon: "calendar", color: "bg-ios-red" },
      { id: "settings", name: "Settings", icon: "settings", color: "bg-ios-gray-2" },
      { id: "appstore", name: "App Store", icon: "shopping-bag", color: "bg-ios-blue" },
      { id: "weather", name: "Weather", icon: "cloud-sun", color: "bg-blue-500" },
      { id: "instagram", name: "Instagram", icon: "instagram", color: "bg-blue-500" },
      { id: "youtube", name: "YouTube", icon: "youtube", color: "bg-red-600" },
      { id: "garage", name: "Garage", icon: "garage", color: "bg-blue-600" },
      { id: "translator", name: "Translator", icon: "translator", color: "bg-gradient-to-br from-purple-500 to-blue-600" },
      { id: "pong", name: "Pong", icon: "pong", color: "bg-gradient-to-br from-green-500 to-green-700" },
      { id: "fruitninja", name: "Fruit Ninja", icon: "fruitninja", color: "bg-gradient-to-br from-orange-500 to-red-600" },
      { id: "pacman", name: "PAC-MAN", icon: "pacman", color: "bg-gradient-to-br from-yellow-400 to-yellow-600" },
      { id: "stack", name: "Stack", icon: "stack", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
      { id: "tuister", name: "Tuister", icon: "tuister", color: "bg-gradient-to-br from-blue-400 to-blue-600" },
      { id: "bank", name: "Bank", icon: "bank", color: "bg-gradient-to-br from-green-500 to-green-700" },
      { id: "business", name: "Business", icon: "business", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
      { id: "darkweb", name: "Dark Web", icon: "darkweb", color: "bg-gradient-to-br from-red-900 to-black" },
      { id: "news", name: "News", icon: "news", color: "bg-gradient-to-br from-blue-500 to-blue-700" },
      { id: "bikerent", name: "Bike Rent", icon: "bikerent", color: "bg-gradient-to-br from-green-500 to-green-700" },
      { id: "uber", name: "Uber", icon: "uber", color: "bg-gradient-to-br from-yellow-500 to-yellow-700" },
      { id: "crypto", name: "Crypto", icon: "crypto", color: "bg-gradient-to-br from-blue-500 to-blue-700" },
      { id: "bitlove", name: "BitLove", icon: "bitlove", color: "bg-gradient-to-br from-pink-500 to-red-600" },
      { id: "call", name: "Call", icon: "phone", color: "bg-gradient-to-br from-green-500 to-green-700", hidden: true },
    ])
    const installedApps = ref([
      { type: "app", id: "phone" },
      { type: "app", id: "messages" },
      { type: "app", id: "camera" },
      { type: "app", id: "photos" },
      { type: "app", id: "clock" },
      { type: "app", id: "calculator" },
      { type: "app", id: "notes" },
      { type: "app", id: "maps" },
      { type: "app", id: "calendar" },
      { type: "app", id: "settings" },
      { type: "app", id: "appstore" },
      { type: "app", id: "weather" },
      { type: "app", id: "instagram" },
      { type: "app", id: "tuister" },
      { type: "app", id: "youtube" },
      { type: "app", id: "garage" },
      { type: "app", id: "bank" },
      { type: "app", id: "business" },
      { type: "app", id: "darkweb" },
      { type: "app", id: "news" },
      { type: "app", id: "crypto" },
      { type: "app", id: "bitlove" },
      { type: "app", id: "music" }
    ])
    const folders = ref({})
    const cryptoWallet = ref({ bitcoin: 0.00234567, ethereum: 0.1567834, monero: 2.45678934, zcash: 0.8765432 })
    const cryptoPrices = ref({ bitcoin: 45230.67, ethereum: 2834.92, monero: 167.45, zcash: 89.23 })
    const dockApps = ref(["phone", "settings", "messages", "music"])
    const isEditMode = ref(false)
    const openFolderId = ref(null)
    const currentPage = ref(0)
    const swipeTranslateX = ref(0);
    const showPhone = ref(false); 
    const state = reactive({});

    const t = computed(() => {
      const lang = setupData.value?.language || 'es';
      return (key, params = {}) => {
        if (key === 'meta.locale') {
          return lang === 'es' ? 'es-ES' : 'en-US';
        }
        if (!window.translations || !window.translations[lang]) {
          return key;
        }
        const value = key.split(".").reduce((obj, k) => obj && obj[k], window.translations[lang]);
        if (typeof value === "string") {
          return Object.entries(params).reduce(
            (str, [pKey, pValue]) => str.replace(new RegExp('\\{' + pKey + '\\}', "g"), pValue),
            value,
          );
        }
        return value || key;
      };
    });

    const prevPhoneState = ref(null);

    watch(() => phoneState.value, (newVal, oldVal) => {
      prevPhoneState.value = oldVal;
      setTimeout(() => {
        if (prevPhoneState.value === oldVal) prevPhoneState.value = null;
      }, 600);
    });

    const lockscreenTransitionName = computed(() => {
      if (phoneState.value === 'LOCKED_PREVIEW') return 'slide-down';
      if (prevPhoneState.value === 'LOCKED_PREVIEW') return 'slide-down';
      return 'fade';
    });

    const weatherData = computed(() => ({
      location: "Madrid",
      temperature: 22,
      condition: t.value("common.weather.sunny"),
      humidity: 60,
      windSpeed: 15,
      forecast: [
        { day: t.value("common.today"), high: 25, low: 18, condition: "sunny" },
        { day: t.value("common.days.tue"), high: 26, low: 19, condition: "sunny" },
        { day: t.value("common.days.wed"), high: 24, low: 17, condition: "cloudy" },
        { day: t.value("common.days.thu"), high: 22, low: 16, condition: "rainy" },
        { day: t.value("common.days.fri"), high: 23, low: 16, condition: "cloudy" },
        { day: t.value("common.days.sat"), high: 25, low: 18, condition: "sunny" },
        { day: t.value("common.days.sun"), high: 27, low: 20, condition: "sunny" },
      ],
    }))


    const appLayout = computed(() => {
      const appsPerPage = 20; 
      const pages = [];
      
      for (let i = 0; i < installedApps.value.length; i += appsPerPage) {
        const page = installedApps.value.slice(i, i + appsPerPage);
        
        while (page.length < appsPerPage) {
          page.push(null);
        }
        pages.push(page);
      }
      
      
      if (pages.length === 0) {
        pages.push(Array(appsPerPage).fill(null));
      }
      
      return pages;
    })

    const systemApps = computed(() => {
      return appLayout.value.map((page) =>
        page.map((item) => {
            if (item === null) return null;
            if (item.type === "app") {
              const appData = allApps.value.find((app) => app.id === item.id);
              return appData ? { ...appData, type: 'app' } : null;
            } 
            if (item.type === "folder") {
              const folderData = folders.value[item.id];
              if (!folderData) return null; 
              return {
                id: item.id,
                name: folderData.name || t.value("home.folder"),
                type: "folder",
                apps: folderData.apps || [],
                ...folderData,
              };
            }
            return null; 
          })
      );
    })

    const totalPages = computed(() => appLayout.value.length)
    const currentWallpaperStyle = computed(() => ({
      backgroundImage: 'url(' + wallpapers.value[currentWallpaperIndex.value] + ')',
    }))
    const themeClasses = computed(() => ({ dark: userSettings.value.darkMode, light: !userSettings.value.darkMode }))
    const dockAppsData = computed(() => {
      return dockApps.value.map((appId) => allApps.value.find((app) => app.id === appId)).filter(Boolean)
    })
        const updateTime = () => {
      const now = new Date()
      const langLocale = setupData.value.language === "en" ? "en-US" : "es-ES"
      currentTime.value = now.toLocaleTimeString(langLocale, { hour: "2-digit", minute: "2-digit" })
      currentDate.value = now.toLocaleDateString(langLocale, { weekday: "long", day: "numeric", month: "long" })
    }

    const enterPin = (digit) => {
      if (pinInput.value.length < 4) {
        pinInput.value += digit
        if (pinInput.value.length === 4) {
          if (pinInput.value === correctPin) {
            setTimeout(() => {
              phoneState.value = "HOME"
              pinInput.value = ""
              pinError.value = false
            }, 200)
          } else {
            pinError.value = true
            setTimeout(() => {
              pinInput.value = ""
              pinError.value = false
            }, 800)
          }
        }
      }
    }

    const goHome = () => {
      
      currentApp.value = null
      phoneOrientation.value = "portrait" 
      
      
      isControlCenterVisible.value = false
      isNotificationsPanelVisible.value = false
      isSpotlightVisible.value = false
      isAppSwitcherVisible.value = false
      isEditMode.value = false
      handleCloseFolder()
      
      
      document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
      document.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active'));
      const ghostElement = document.querySelector('.drag-ghost');
      if (ghostElement) ghostElement.remove();
      
      
      try {
        
        const errorElements = document.querySelectorAll('[data-error="true"]');
        errorElements.forEach(el => el.remove());
        
        
        if (window.appErrorTimeout) {
          clearTimeout(window.appErrorTimeout);
          window.appErrorTimeout = null;
        }
      } catch (e) {
      }
      
    }

    const forceCloseCurrentApp = () => {
      if (currentApp.value) {
        const appId = currentApp.value;
        
        
        if (loadedApps.value[appId]) {
          delete loadedApps.value[appId];
        }
        
        
        currentOpenApps.value.delete(appId);
        openApps.value = openApps.value.filter(app => app.id !== appId);
        
        
        goHome();
        
        addNotification({
          icon: '🔧',
          title: 'App cerrada',
          message: `La aplicación ${appId} fue cerrada por problemas`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'info'
        });
      }
    }

    const handleTakePhoto = async (photoData) => {
      try {
        let photoUrl
        
        if (typeof photoData === 'string') {
          
          photoUrl = photoData
        } else {
          const response = await fetch('https://bit-smartphone/camera:takePhoto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metadata: { source: 'camera-app' } })
          })
          const result = await response.json()
          
          if (result && result.ok && result.url) {
            photoUrl = result.url
          } else {
            throw new Error(result && result.error || 'Failed to take photo')
          }
        }

        
        photos.value.unshift({
          id: Date.now(),
          url: photoUrl,
          thumbnail: photoUrl,
          createdAt: new Date().toISOString(),
          favorite: false,
          albumIds: [2] 
        })

        
        addNotification({
          appId: 'photos',
          title: t.value('photos.saved') || 'Foto guardada',
          message: t.value('photos.saved_desc') || 'Se ha guardado en tu galería',
          icon: 'image'
        })

      } catch (e) {
        console.error('Error taking photo:', e)
        addNotification({ 
          appId: 'photos', 
          title: 'Error', 
          message: 'No se pudo guardar la foto', 
          icon: 'alert-triangle' 
        })
      }
    }

    const openApp = async (app) => {
      
      if (isEditMode.value) {
        
        return;
      }
      
      let appId = typeof app === 'string' ? app : app.id
      
      
      
      if (internetRequiredApps.includes(appId) && (!isConnected.value || signalStrength.value === 0)) {
        addNotification({
          icon: '📱',
          title: 'Sin conexión',
          message: `La aplicación ${app.name || appId} requiere conexión a internet.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'error'
        })
        return
      }
      
      
      try {
        
        if (typeof app === 'string' || !app.name) {
          const foundApp = allApps.value.find(a => a.id === appId)
          if (foundApp) {
            app = foundApp
          }
        }
        
        if (!t.value || typeof t.value !== 'function') {
          addNotification({
            icon: '⚠️',
            title: 'Error',
            message: `Sistema de traducción no disponible. Intenta de nuevo.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'error'
          })
          return
        }
        
        
        if (!loadedApps.value[appId]) {
          
          const imported = await importApp(appId, t.value)
          if (imported) {
            try {
              
            } catch (e) {
              
            }
            loadedApps.value[appId] = imported
            
          } else {
            
            addNotification({
              icon: '⚠️',
              title: 'Error',
              message: `No se pudo cargar la aplicación ${app.name || appId}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'error'
            })
            return
          }
        } else {
          
        }
        
        
        
        if (loadedApps.value[appId] && loadedApps.value[appId] !== null) {
          
          currentOpenApps.value.add(appId)
          currentApp.value = appId
          handleCloseFolder()       
          
          const existingApp = openApps.value.find(openApp => openApp.id === appId)
          if (!existingApp) {
            openApps.value.push({
              id: appId,
              openedAt: Date.now(),
              preview: null 
            })
          } else {
            
            existingApp.openedAt = Date.now()
          }
          
          
          isAppSwitcherVisible.value = false
          
          
        } else {
          
          throw new Error(`Component for ${appId} is null or invalid`)
        }
        
      } catch (error) {
        console.error(`[BIT-Smartphone] Error opening app ${appId}:`, error);
        
        
        currentOpenApps.value.delete(appId)
        if (currentApp.value === appId) {
          currentApp.value = null
        }
        
        
        if (loadedApps.value[appId]) {
          delete loadedApps.value[appId]
        }
        
        
        addNotification({
          icon: '⚠️',
          title: 'Error en la aplicación',
          message: `La aplicación ${app.name || appId} tiene un error y no puede abrirse`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'error'
        })
        
        
        goHome()
      }
    }

    const openAppSwitcher = () => {
      isAppSwitcherVisible.value = true
      
      isControlCenterVisible.value = false
      isNotificationsPanelVisible.value = false
      isSpotlightVisible.value = false
    }

    const closeAppSwitcher = () => {
      isAppSwitcherVisible.value = false
    }

    
    const handleEndCall = () => {
      callData.value.isVisible = false
      callData.value.callId = null
      
      
      fetch('https://bit-smartphone/call:end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callData.value.callId
        })
      }).catch(error => {
        console.error('Error ending call:', error)
      })
    }

    const handleToggleMute = () => {
      
      fetch('https://bit-smartphone/call:toggleMute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callData.value.callId,
          muted: !callData.value.muted
        })
      }).catch(error => {
        console.error('Error toggling mute:', error)
      })
    }

    const handleToggleSpeaker = () => {
      
      fetch('https://bit-smartphone/call:toggleSpeaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: callData.value.callId,
          speaker: !callData.value.speaker
        })
      }).catch(error => {
        console.error('Error toggling speaker:', error)
      })
    }

    const handleToggleVideo = () => {
      
      callData.value.callType = callData.value.callType === 'video' ? 'audio' : 'video'
    }

    const handleMinimizeCall = () => {
      
      callData.value.isMinimized = true
    }

   const handleAppSwitcherOpenApp = (appId) => {
     const app = allApps.value.find(a => a.id === appId)
     if (app) {
       openApp(app)
       closeAppSwitcher()
     }
   }

   const handleAppSwitcherCloseApp = (appId) => {
      if (appId === 'all') {
        openApps.value = []
        currentApp.value = null
        currentOpenApps.value.clear()
      } else {
        openApps.value = openApps.value.filter(app => app.id !== appId)
        currentOpenApps.value.delete(appId) 
        if (currentApp.value === appId) {
          currentApp.value = null
        }
      }
   }

   const nextSetupStep = () => {
      if (setupStep.value < 7) {
        setupStep.value++
      } else {
        completeSetup()
      }
    }

    const prevSetupStep = () => {
      if (setupStep.value > 0) {
        setupStep.value
      }
    }

    const completeSetup = async () => {
      phoneState.value = "HOME";
      
      userSettings.value.darkMode = setupData.value.darkMode;
      currentWallpaperIndex.value = wallpapers.value.indexOf('./assets/wallpapers/' + setupData.value.wallpaper);
      if (currentWallpaperIndex.value === -1) currentWallpaperIndex.value = 0;

      await savePhoneState();
    }

    const savePhoneState = async () => {
      try {
        const stateToSave = {
          setup_completed: phoneState.value !== 'SETUP' ? 1 : 0,
          profile_name: setupData.value.userName || '',
          profile_picture: setupData.value.userPhoto || '',
          pin_code: setupData.value.pin || '',
          wallpaper: setupData.value.wallpaper || 'wallpaper1.webp',
          theme_mode: userSettings.value.darkMode ? 'dark' : 'light',
          installed_apps: installedApps.value,
          dock_apps: dockApps.value,
          folders: folders.value,
          lockscreen_widgets: lockscreenSettings.value.widgets || [],
          lockscreen_font_family: lockscreenSettings.value.clockStyle || 'default',
          lockscreen_font_size: lockscreenSettings.value.clockSize || 'large',
          lockscreen_font_color: lockscreenSettings.value.clockColor || '#ffffff',
          lockscreen_date_style: lockscreenSettings.value.dateStyle || 'default',
          lockscreen_date_color: lockscreenSettings.value.dateColor || '#ffffff',
          lockscreen_date_size: lockscreenSettings.value.dateSize || 'medium',
          call_sound: setupData.value.callSound || 'assets/sounds/calls/1.mp3',
          notification_sound: setupData.value.notificationSound || 'assets/sounds/notifications/1.mp3'
        };
        
        
        
        
  const response = await fetch('https://bit-smartphone/bit-smartphone:savePhoneData', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stateToSave)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        throw error; 
      }
    }

    const handleOrientationChange = (orientation) => {
      if (isOrientationTransitioning.value) return
      
      isOrientationTransitioning.value = true
      phoneOrientation.value = orientation
      
      
      setTimeout(() => {
        isOrientationTransitioning.value = false
      }, 500)
    }

    const toggleDarkMode = () => {
      userSettings.value.darkMode = !userSettings.value.darkMode;
      
      if (phoneState.value === 'SETUP') {
        setupData.value.darkMode = userSettings.value.darkMode;
      }
    }

    const setWallpaper = (wallpaper) => {
      if (!wallpaper) return;
      setupData.value.wallpaper = wallpaper
      
      const foundIdx = wallpapers.value.findIndex(w => w.includes(wallpaper))
      if (foundIdx >= 0) {
        currentWallpaperIndex.value = foundIdx
      }
    }

    const updateSetting = async (setting, value) => {
      userSettings.value[setting] = value
      
      if (setting === 'fontSize') {
        nextTick(() => {
          applyFontSize(value)
        })
      }

      await savePhoneState()
    }


    const applyFontSize = (sizeId) => {
      const sizeMap = {
        small: 'text-size-small',
        medium: 'text-size-medium',
        large: 'text-size-large',
        xlarge: 'text-size-xlarge'
      }
      
      
      const phoneContainer = document.querySelector('.iphone-container')
      if (phoneContainer) {
        
        Object.values(sizeMap).forEach(cls => phoneContainer.classList.remove(cls))
        
        const sizeClass = sizeMap[sizeId] || sizeMap.medium
        phoneContainer.classList.add(sizeClass)
      }
    }

    const updateLockscreenSettings = async (newSettings) => {
      lockscreenSettings.value = { ...lockscreenSettings.value, ...newSettings }
      await savePhoneState()
    }

    function updateSetupData(key, value) {
      setupData.value = { ...setupData.value, [key]: value };
    }
        const installApp = async (appId) => {
      const app = allApps.value.find(a => a.id === appId);
      if (app && !installedApps.value.some(item => item && item.id === appId)) {
        installedApps.value.push({ type: 'app', id: appId });
        await savePhoneState();
        return true;
      }
      return false;
    }
    
    const uninstallApp = async (appId) => {
      const systemAppIds = ['phone', 'messages', 'camera', 'photos', 'clock', 'calculator', 'notes', 'maps', 'calendar', 'settings', 'appstore', 'weather'];
      if (systemAppIds.includes(appId)) {
        return false;
      }
      
      const index = installedApps.value.findIndex(item => item && item.id === appId);
      if (index !== -1) {
        installedApps.value.splice(index, 1);
        await savePhoneState(); 
        return true;
      }
      return false;
    }

    const getAvailableApps = async () => {
      try {
  const response = await fetch('https://bit-smartphone/bit-smartphone:getAvailableApps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.apps || [];
        }
      } catch (e) {
        
      }

      return [];
    }
    
    const isAppInstalled = (appId) => {
      return installedApps.value.some(item => item && item.id === appId);
    }
    
    const getCryptoBalance = (crypto) => {
      return cryptoWallet.value[crypto] || 0
    }
    
    const getTotalCryptoValueUSD = () => {
      let total = 0
      for (const [crypto, amount] of Object.entries(cryptoWallet.value)) {
        total += amount * cryptoPrices.value[crypto]
      }
      return total
    }
    
    const spendCrypto = (crypto, amount) => {
      if (cryptoWallet.value[crypto] >= amount) {
        cryptoWallet.value[crypto] -= amount
        return true
      }
      return false
    }
    
    const addCrypto = (crypto, amount) => {
      if (cryptoWallet.value[crypto] !== undefined) {
        cryptoWallet.value[crypto] += amount
        return true
      }
      return false
    }
        const handleCallEvents = (data) => {
      switch(data.action) {
        case 'call:incoming':
        case 'call:outgoing':
        case 'call:signaling':
        case 'call:ended':
        case 'call:timeout':
        case 'call:failed':
        case 'call:start_from_command':
          
          if (data.action === 'call:incoming' || data.action === 'call:start_from_command') {
            currentCallAudio.value = playCallSound();
          }
          
          if ((data.action === 'call:ended' || data.action === 'call:timeout' || data.action === 'call:failed') && currentCallAudio.value) {
            currentCallAudio.value.pause();
            currentCallAudio.value = null;
          }
          
          if (window.callComponent) {
            window.callComponent.handleMessage(data);
          } else {
            if (data.action === 'call:incoming' || data.action === 'call:outgoing' || data.action === 'call:start_from_command') {
              currentApp.value = 'call';
              nextTick(() => {
                if (window.callComponent) {
                  window.callComponent.handleMessage(data);
                }
              });
            }
          }
          break;
      }
    };

    const handleNotificationEvents = (data) => {
      if (data.action === 'receiveNotification') {
        const { appId, message } = data;
        
        
        const app = allApps.value.find(a => a.id === appId);
        if (!app) return;
        
        
        const truncatedMessage = message.length > 50 ? message.substring(0, 47) + '...' : message;
        
        
        addNotification({
          icon: app.icon, 
          title: app.name, 
          message: truncatedMessage,
          appId: appId,
          timestamp: Date.now()
        });
      }
    };

    const isDraggingBrightness = ref(false)
    const isDraggingVolume = ref(false)
    const isDraggingIcon = ref(false);

    const handleSliderInteraction = (event, sliderType) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const clientY = event.touches ? event.touches[0].clientY : event.clientY
      const y = clientY - rect.top
      let percentage = 100 - (y / rect.height) * 100
      percentage = Math.max(0, Math.min(100, percentage))

      if (sliderType === "brightness") {
        userSettings.value.brightness = percentage
      } else if (sliderType === "volume") {
        userSettings.value.volume = percentage
      }
    }

    const startDrag = (event, sliderType) => {
      if (sliderType === "brightness") isDraggingBrightness.value = true
      if (sliderType === "volume") isDraggingVolume.value = true
      handleSliderInteraction(event, sliderType)
    }

    const onDrag = (event) => {
      if (isDraggingBrightness.value) {
        handleSliderInteraction(event, "brightness")
      }
      if (isDraggingVolume.value) {
        handleSliderInteraction(event, "volume")
      }
    }

    const stopDrag = () => {
      isDraggingBrightness.value = false
      isDraggingVolume.value = false
    }
        const updateFolder = async (updatedFolder) => {
      folders.value[updatedFolder.id] = updatedFolder;

      await savePhoneState();
    };

    const handleOpenFolder = (folderId) => {
      openFolderId.value = folderId;
    };

    const handleCloseFolder = () => {
      openFolderId.value = null;
    };
        const handleLayoutUpdate = async ({ source, target }) => {
      console.log('💾 Layout update requested:', {
        source: source.item?.name,
        target: target.item?.name || 'empty slot',
        sourceIndex: source.itemIndex,
        targetIndex: target.itemIndex
      });
      
      const globalSourceIndex = source.pageIndex * 20 + source.itemIndex;
      let itemToMove = installedApps.value[globalSourceIndex];
      let actualSourceIndex = globalSourceIndex;
      
      if (!itemToMove) {
        
        return;
      }

      if (itemToMove?.id !== source.item.id) {
        
        const correctIndex = installedApps.value.findIndex(app => app && app.id === source.item.id);
        if (correctIndex === -1) {
          
          return;
        }
        actualSourceIndex = correctIndex;
        itemToMove = installedApps.value[correctIndex];
        
      }

      if (!target.item) {
        
        
        const globalTargetIndex = target.pageIndex * 20 + target.itemIndex;
        
        
        const maxIndex = Math.max(actualSourceIndex, globalTargetIndex);
        while (installedApps.value.length <= maxIndex) {
          installedApps.value.push(null);
        }
        
        
        if (globalTargetIndex < actualSourceIndex) {
          
          installedApps.value.splice(globalTargetIndex, 1, itemToMove);
          installedApps.value.splice(actualSourceIndex, 1, null);
        } else {
          
          installedApps.value.splice(actualSourceIndex, 1, null);
          installedApps.value.splice(globalTargetIndex, 1, itemToMove);
        }
        
        
        await savePhoneState();
        return;
      }

      const globalTargetIndex = target.pageIndex * 20 + target.itemIndex;

      if (actualSourceIndex === globalTargetIndex) {
        return;
      }

      const maxIndex = Math.max(actualSourceIndex, globalTargetIndex);
      while (installedApps.value.length <= maxIndex) {
        installedApps.value.push(null);
      }

      const targetItem = installedApps.value[globalTargetIndex];

      if (targetItem && targetItem !== null) {
        
        
        
        
        
        
        const tempSource = installedApps.value[actualSourceIndex];
        const tempTarget = installedApps.value[globalTargetIndex];
        
        installedApps.value[actualSourceIndex] = tempTarget;
        installedApps.value[globalTargetIndex] = tempSource;
        
        
        
      } else {
        
        
      }

      
      await savePhoneState();
      

    };

    const handleFoldersUpdate = async ({ sourceApp, targetApp, targetPageIndex, targetItemIndex }) => {
      const newFolderId = 'folder_' + Date.now();

      folders.value[newFolderId] = { 
        id: newFolderId, 
        name: t.value('home.folder'), 
        apps: [sourceApp.id, targetApp.id] 
      };

      const sourceGlobalIndex = installedApps.value.findIndex(item => item && item.id === sourceApp.id);
      const targetGlobalIndex = targetPageIndex * 20 + targetItemIndex;
      
      if (sourceGlobalIndex === -1) return;

      installedApps.value[targetGlobalIndex] = { type: 'folder', id: newFolderId };

      if (sourceGlobalIndex !== targetGlobalIndex) {
        installedApps.value.splice(sourceGlobalIndex, 1, null);
      }
      
      await savePhoneState();
    };
        const goToPage = (pageIndex) => {
        currentPage.value = pageIndex;
    };

    const requestNextPage = () => {
      if (currentPage.value < totalPages.value - 1) {
        const oldPage = currentPage.value;
        currentPage.value++;
      }
    };

    const requestPrevPage = () => {
      if (currentPage.value > 0) {
        const oldPage = currentPage.value;
        currentPage.value--;
      }
    };
        const toggleEditMode = (state) => {
      const wasEditMode = isEditMode.value;
      isEditMode.value = typeof state === 'boolean' ? state : !isEditMode.value;      
      
      if (wasEditMode && !isEditMode.value) {
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        document.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active'));
        const ghostElement = document.querySelector('.drag-ghost');
        if (ghostElement) ghostElement.remove();
      }
    };
    
    
    const resetUIState = () => {
      
      isEditMode.value = false;
      currentApp.value = null;
      phoneOrientation.value = "portrait";
      isControlCenterVisible.value = false;
      isNotificationsPanelVisible.value = false;
      isSpotlightVisible.value = false;
      isAppSwitcherVisible.value = false;
      isWidgetManagerVisible.value = false;
      openFolderId.value = null;
      
      
      document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
      document.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active'));
      document.querySelectorAll('.drag-ghost').forEach(el => el.remove());
      
      ['mousemove', 'mouseup', 'touchmove', 'touchend'].forEach(eventType => {
        document.removeEventListener(eventType, () => {});
      });
      
    };
    
    const lock = () => {
      phoneState.value = "LOCKED_PREVIEW";
      goHome();
    }

    const unlockPhone = () => {
      if (phoneState.value === "LOCKED") {
        phoneState.value = "PIN";
      } else if (phoneState.value === "LOCKED_PREVIEW") {
        phoneState.value = "HOME";
      }
    }
    
    const cancelPin = () => {
        phoneState.value = 'LOCKED';
        pinInput.value = '';
        pinError.value = false;
    }
        const getWidgetSize = (size) => ({'1x1':{w:1,h:1},'2x1':{w:2,h:1},'2x2':{w:2,h:2},'4x2':{w:4,h:2}}[size]||{w:1,h:1});
    
    const isAreaOccupied = (startRow, startCol, size, pageIndex) => {
        const { w, h } = getWidgetSize(size);
        if (startCol + w > 4 || startRow + h > 5) return true; 

        const widgetsOnPage = widgets.value.filter(w => w.page === pageIndex);
        
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const checkRow = startRow + r;
                const checkCol = startCol + c;
                const gridIndex = checkRow * 4 + checkCol;

                
                const pageStartIndex = pageIndex * 20;
                if (installedApps.value[pageStartIndex + gridIndex]) return true;

                if (widgetsOnPage.some(widget => {
                    const widgetSize = getWidgetSize(widget.size);
                    return checkRow >= widget.row && checkRow < widget.row + widgetSize.h &&
                           checkCol >= widget.col && checkCol < widget.col + widgetSize.w;
                })) return true;
            }
        }
        return false;
    };
        const handleAddWidget = (widgetData) => {
        let placed = false;
        const totalPagesComputed = appLayout.value.length;
        
        for (let pageOffset = 0; pageOffset < totalPagesComputed; pageOffset++) {
            const pageIdx = (currentPage.value + pageOffset) % totalPagesComputed;
            for (let i = 0; i < 20; i++) { 
                const row = Math.floor(i / 4);
                const col = i % 4;

                if (!isAreaOccupied(row, col, widgetData.size, pageIdx)) {
                    widgets.value.push({ ...widgetData, id: widgetData.baseId + '-' + Date.now(), page: pageIdx, row, col });
                    placed = true;
                    if (currentPage.value !== pageIdx) currentPage.value = pageIdx;
                    break;
                }
            }
            if (placed) break;
        }

        if (!placed) {
            
            const currentAppsLength = installedApps.value.length;
            for (let i = 0; i < 20; i++) {
                installedApps.value.push(null);
            }
            const newPageIndex = Math.ceil(currentAppsLength / 20);
            widgets.value.push({ ...widgetData, id: widgetData.baseId + '-' + Date.now(), page: newPageIndex, row: 0, col: 0 });
            nextTick(() => currentPage.value = newPageIndex);
        }
        isWidgetManagerVisible.value = false;
    };

    const handleRemoveWidget = (widgetId) => {
        widgets.value = widgets.value.filter(w => w.id !== widgetId);
    };

    const handleUpdateWidget = (updatedWidget) => {
        const index = widgets.value.findIndex(w => w.id === updatedWidget.id);
        if (index !== -1) {
            widgets.value[index] = updatedWidget;
        }
    };
        const pageContainerStyle = computed(() => {
      const baseTranslate = -currentPage.value * 100;
      const dragOffset = swipeTranslateX.value;

      return {
        transform: 'translateX(calc(' + baseTranslate + '% + ' + dragOffset + 'px))',
        transition: swipeTranslateX.value === 0 ? 'transform 0.3s ease-out' : 'none',
      };
    });

    const onSwipeStart = (startX) => {
      if (isDraggingIcon.value) return;
    };

    const onSwipeMove = (translateX) => {
      if (isDraggingIcon.value) return;
      const actualTranslateX = typeof translateX === 'number' ? translateX : translateX.translateX || 0;
      swipeTranslateX.value = actualTranslateX;
    };

    const onSwipeEnd = (swipeData) => {
      if (isDraggingIcon.value) return;
      
      const translateX = typeof swipeData === 'number' ? swipeData : swipeData.translateX;
      const velocity = typeof swipeData === 'object' && swipeData.velocity ? swipeData.velocity : 0;
      const swipeThreshold = 80;
      const velocityThreshold = 0.5; 
      const screenWidth = window.innerWidth || 320;
      const swipePercentage = Math.abs(translateX) / screenWidth;
      const shouldChangePage = swipePercentage > 0.3 || 
                              Math.abs(translateX) > swipeThreshold || 
                              (velocity > velocityThreshold && Math.abs(translateX) > 40);
      
      if (shouldChangePage) {
        if (translateX < 0) {
          requestNextPage();
        } else if (translateX > 0) {
          requestPrevPage();
        }
      }

      swipeTranslateX.value = 0;
    };
        const onDragStart = ({ item, pageIndex, itemIndex }) => {
      isDraggingIcon.value = true;
      globalDraggedItem.value = { 
        item, 
        originalPageIndex: pageIndex, 
        currentPageIndex: pageIndex,
        itemIndex 
      };
    };

    const onDragEnd = () => {
      isDraggingIcon.value = false;
      globalDraggedItem.value = null;
    };

    const handleDragPageChanged = ({ item, oldPage, newPage }) => {
      if (globalDraggedItem.value && globalDraggedItem.value.item.id === item.id) {
        globalDraggedItem.value.currentPageIndex = newPage;
      }
    };
        const musicState = reactive({
      isPlaying: false,
      track: null,
      progress: 0,
      volume: 50,
      playlist: [],
      currentTime: 0,
      duration: 0
    });

    const addNotification = (notification) => {
    const newNotification = {
      id: notification.id || ++notificationIdCounter.value,
      ...notification,
      timestamp: notification.timestamp || Date.now(),
      processed: false,
      persistent: notification.persistent || false,
      is_read: notification.is_read || false,
      is_dismissed: notification.is_dismissed || false
    }
    notifications.value.push(newNotification)

    playNotificationSound();

    if (!newNotification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 10000)
    }
  }

    const playNotificationSound = () => {
      try {
        const soundUrl = setupData.value.notificationSound || 'assets/sounds/notifications/1.mp3';
        const audio = new Audio(soundUrl);
        audio.volume = 0.7;
        audio.play().catch(e => {
          
        });
      } catch (e) {
        
      }
    }

    const playCallSound = () => {
      try {
        const soundUrl = setupData.value.callSound || 'assets/sounds/calls/1.mp3';
        const audio = new Audio(soundUrl);
        audio.volume = 0.8;
        audio.loop = true; 
        audio.play().catch(e => {
          
        });
        return audio; 
      } catch (e) {
        
        return null;
      }
    }

    const removeNotification = (notificationId) => {
      const notification = notifications.value.find(n => n.id === notificationId)
      
      if (notification && notification.persistent) {
        fetch('https://bit-smartphone/bit-smartphone:dismissNotification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notificationId })
        }).catch(console.error)
      }
      
      notifications.value = notifications.value.filter(n => n.id !== notificationId)
    }

    const handleNotificationTap = (notification) => {
      if (notification.persistent && !notification.is_read) {
        fetch('https://bit-smartphone/bit-smartphone:markNotificationRead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notification.id })
        }).catch(console.error)
        
        const notif = notifications.value.find(n => n.id === notification.id)
        if (notif) {
          notif.is_read = true
        }
      }
      
      if (notification.appId) {
        const app = allApps.value.find(a => a.id === notification.appId)
        if (app) {
          openApp(app)
        }
      }
      
      if (!notification.persistent) {
        removeNotification(notification.id)
      }
    }

    const handleDismissNotification = (notificationId) => {
      removeNotification(notificationId)
    }

    const handleExpandNotification = (notification) => {
      const notif = notifications.value.find(n => n.id === notification.id)
      if (notif) {
        notif.expanded = true
      }
    }

    const clearAllNotifications = async () => {
      try {
        const response = await fetch('https://bit-smartphone/bit-smartphone:clearAllNotifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
        
        if (response.ok) {
          notifications.value = []
        }
      } catch (error) {
        console.error('[BIT-Smartphone] Error clearing notifications:', error)
      }
    }

    const batteryConfig = {
      baseDrainRate: 0.5,
      appConsumption: {
        "phone": 0.1, "messages": 0.2, "settings": 0.1,
        "calculator": 0.1, "clock": 0.1, "notes": 0.2, "calendar": 0.1,
        "music": 0.8, "photos": 0.5, "camera": 1.2, "youtube": 1.5,
        "instagram": 0.9, "pacman": 1.8, "stack": 1.5, "fruitninja": 1.7,
        "pong": 1.2, "temple": 1.6, "maps": 1.0, "weather": 0.4,
        "garage": 0.3, "business": 0.3, "appstore": 0.4, "bank": 0.3,
        "crypto": 0.6, "tuister": 0.7, "bitlove": 0.8, "darkweb": 1.0,
        "news": 0.4, "bikerent": 0.3, "uber": 0.5, "translator": 0.3,
        "flashlight": 2.0, "call": 1.3
      }
    };

    const updateBattery = () => {
      if (isCharging.value) {
        if (batteryLevel.value < 100) {
          return;
        }
      }

      if (batteryLevel.value <= 0) {
        batteryLevel.value = 0;
        if (phoneState.value !== 'OFF') {
          phoneState.value = 'OFF';
          showPhone.value = false;
          addNotification({
            title: "Batería agotada",
            message: "El teléfono se ha apagado por batería baja",
            app: "system"
          });
        }
        return;
      }

      let totalDrain = batteryConfig.baseDrainRate;

      if (flashlightOn.value) {
        totalDrain += batteryConfig.appConsumption["flashlight"];
      }

      currentOpenApps.value.forEach(appId => {
        const consumption = batteryConfig.appConsumption[appId] || 0.2;
        totalDrain += consumption;
      });
      
      batteryLevel.value = Math.max(0, batteryLevel.value - (totalDrain / 60));

      if (!isCharging.value) {
        if (batteryLevel.value <= 20 && batteryLevel.value > 19) {
          addNotification({
            title: "Batería baja",
            message: `Batería al ${Math.floor(batteryLevel.value)}%`,
            app: "system"
          });
        } else if (batteryLevel.value <= 5 && batteryLevel.value > 4) {
          addNotification({
            title: "Batería crítica",
            message: "El teléfono se apagará pronto",
            app: "system"
          });
        }
      }
    };

    const startBatterySystem = () => {
      if (batteryUpdateInterval.value) {
        clearInterval(batteryUpdateInterval.value);
      }

      batteryUpdateInterval.value = setInterval(() => {
        updateBattery();
      }, 1000);
    };

    const stopBatterySystem = () => {
      if (batteryUpdateInterval.value) {
        clearInterval(batteryUpdateInterval.value);
        batteryUpdateInterval.value = null;
      }
    };

    const toggleFlashlight = () => {
      flashlightOn.value = !flashlightOn.value;

      fetch('https://bit-smartphone/bit-smartphone:toggleFlashlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          state: flashlightOn.value,
          brightness: 2.0,
          range: 15.0,
          angle: 45.0
        })
      }).catch(console.error);
    };

    const testNotifications = () => {
      const testNotifs = [
        {
          title: "Nuevo mensaje",
          message: "¡Hola! ¿Cómo estás? Me gustaría verte pronto para contarte las novedades.",
          app: "messages",
          appId: "messages",
          icon: "/html/assets/icons/messages.png",
          additionalInfo: "De: María García"
        },
        {
          title: "Actualización del tiempo",
          message: "Día soleado con 24°C. Ideal para salir.",
          app: "weather",
          appId: "weather",
          icon: "/html/assets/icons/weather.png",
          additionalInfo: "Los Santos, SA"
        },
        {
          title: "Recordatorio",
          message: "Reunión de trabajo a las 3:00 PM",
          app: "calendar",
          appId: "calendar",
          icon: "/html/assets/icons/calendar.png",
          additionalInfo: "En 30 minutos"
        },
        {
          title: "Nueva canción",
          message: "Ya está disponible el nuevo álbum de tu artista favorito",
          app: "music",
          appId: "music",
          icon: "/html/assets/icons/music.png",
          additionalInfo: "Spotify"
        }
      ];
      
      testNotifs.forEach((notif, index) => {
        setTimeout(() => {
          addNotification(notif);
        }, index * 2000);
      });
    }
        function playTrack(track) {
      musicState.track = track;
      musicState.isPlaying = true;
      musicState.progress = 0;
      musicState.currentTime = 0;
      
      
      if (track.duration) {
        const [mins, secs] = track.duration.split(':').map(Number);
        musicState.duration = mins * 60 + secs;
      }
      
      
      if (window.musicProgressInterval) {
        clearInterval(window.musicProgressInterval);
      }
      
      window.musicProgressInterval = setInterval(() => {
        if (musicState.isPlaying && musicState.track) {
          musicState.currentTime += 1;
          musicState.progress = (musicState.currentTime / musicState.duration) * 100;
          
          if (musicState.progress >= 100) {
            stopMusic();
          }
        }
      }, 1000);
    }
    function pauseMusic() {
      musicState.isPlaying = false;
    }
    function resumeMusic() {
      if (musicState.track) musicState.isPlaying = true;
    }
    function stopMusic() {
      musicState.isPlaying = false;
      musicState.progress = 0;
      musicState.currentTime = 0;
      if (window.musicProgressInterval) {
        clearInterval(window.musicProgressInterval);
      }
    }
    function setMusicProgress(progress) {
      musicState.progress = Math.max(0, Math.min(100, progress));
      if (musicState.duration) {
        musicState.currentTime = Math.floor((progress / 100) * musicState.duration);
      }
    }
    function setMusicVolume(volume) {
      musicState.volume = volume;
    }
    function setPlaylist(playlist) {
      musicState.playlist = playlist;
    }
        const handleHomeIndicatorTouchStart = () => {
      isHomeIndicatorPressed.value = true;
      homeIndicatorPressTimer.value = setTimeout(() => {
        if (isHomeIndicatorPressed.value) {
          openAppSwitcher();
        }
      }, 500); 
    };

    const handleHomeIndicatorTouchEnd = () => {
      isHomeIndicatorPressed.value = false;
      clearTimeout(homeIndicatorPressTimer.value);
    };
        const handleEmergencyCall = () => {
      showEmergency.value = false;
    };

    const handleTimerEnd = () => {
      handleEmergencyCall();
    };
    
    const activateEmergency = () => {
      showEmergency.value = true;
    };

    function initializeFromServer(data) {
        if (!data) {
            return;
        }
        const phoneElement = document.getElementById('app');
        if (phoneElement) {
            phoneElement.style.display = 'block';
            phoneElement.style.visibility = 'visible';
        }
        
        setupData.value = {
            language: data.language || "es",
            darkMode: data.theme_mode === 'dark',
            wallpaper: data.wallpaper || "wallpaper1.webp",
            userName: data.profile_name || "",
            userPhoto: data.profile_picture || null,
            faceId: data.faceId || false,
            fontSize: data.fontSize || "medium",
        };

    if (typeof data.theme_mode === 'string') {
      userSettings.value.darkMode = data.theme_mode === 'dark';
    }
    if (Array.isArray(data.installed_apps) && data.installed_apps.length > 0) {
      installedApps.value = data.installed_apps;
    }
    if (Array.isArray(data.dock_apps) && data.dock_apps.length > 0) {
      dockApps.value = data.dock_apps;
    }
    if (data.folders && typeof data.folders === 'object') {
      folders.value = data.folders;
    }
        
        lockscreenSettings.value = {
            clockStyle: data.lockscreen_font_family || 'default',
            clockColor: data.lockscreen_font_color || '#ffffff',
            clockSize: data.lockscreen_font_size || 'large',
            dateStyle: data.lockscreen_date_style || 'default',
            dateColor: data.lockscreen_date_color || '#ffffff',
            dateSize: data.lockscreen_date_size || 'medium',
            widgets: data.lockscreen_widgets || []
        };
        
        batteryLevel.value = data.battery_level || 85;
        const foundIndex = data.wallpaper ? wallpapers.value.findIndex(w => w.includes(data.wallpaper)) : -1;
        currentWallpaperIndex.value = foundIndex >= 0 ? foundIndex : 0;

        if (data.photos && Array.isArray(data.photos)) {
            photos.value = data.photos.map(p => ({ ...p, thumbnail: p.url, favorite: false, albumIds: [2] }));
        }

        if (data.notifications && Array.isArray(data.notifications)) {
            data.notifications.forEach(notification => {
                addNotification({
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    app: notification.app,
                    appId: notification.app_id,
                    icon: notification.icon,
                    additionalInfo: notification.additional_info,
                    data: notification.notification_data ? JSON.parse(notification.notification_data) : null,
                    priority: notification.priority,
                    timestamp: new Date(notification.created_at).getTime(),
                    persistent: true,
                    is_read: notification.is_read,
                    is_dismissed: notification.is_dismissed
                })
            })
        }

        if (data.setup_completed === false || data.setup_completed === 0) {
            phoneState.value = "SETUP";
        } else {
            phoneState.value = "LOCKED";
        }

        startBatterySystem();
        
        showPhone.value = true;
    }

    const masterNuiHandler = (message) => {
      if (!message) return;
      
      const action = message.type || message.action;

      switch(action) {
          case 'camera:preview_frame':
              break;
          case 'openPhone': 
              initializeFromServer(message.data);
              break;
          case 'closePhone':
              closePhone();
              break;
          case 'addNotification':
              if (message.data) {
                addNotification(message.data);
              }
              break;
          case 'removeNotification':
              if (message.data && message.data.id) {
                removeNotification(message.data.id);
              }
              break;
          case 'testNotifications':
              testNotifications();
              break;
          case 'receiveNotification':
              if (message.data) {
                addNotification(message.data);
              }
              break;
          case 'updateBattery':
              if (message.data && typeof message.data.battery !== 'undefined') {
                batteryLevel.value = message.data.battery;
              }
              if (message.data && typeof message.data.charging !== 'undefined') {
                isCharging.value = message.data.charging;
                if (message.data.charging) {
                  addNotification({
                    title: "Cargando",
                    message: `Batería: ${Math.floor(batteryLevel.value)}%`,
                    app: "system"
                  });
                }
              }
              break;
          case 'call:incoming':
                  callData.value = {
                    isVisible: true,
                    id: message.data.id,
                    name: message.data.name || 'Desconocido',
                    avatar: message.data.avatar || null,
                    direction: message.data.direction || 'incoming',
                    type: message.data.type || 'audio',
                    targetId: message.data.targetId,
                    isIncoming: true,
                    callStatus: 'incoming'
                  };
                  
                  if (!window.callComponent) {
                    currentCallAudio.value = playCallSound();
                  }
                  break;
          case 'call:outgoing':
            
                  callData.value = {
                    isVisible: true,
                    id: message.data.id,
                    name: message.data.name || '',
                    avatar: message.data.avatar || null,
                    direction: message.data.direction || 'outgoing',
                    type: message.data.type || 'audio',
                    targetId: message.data.targetId,
                    isIncoming: false,
                    callStatus: 'ringing'
                  };
                  break;
          case 'call:start_from_command':
            
                    callData.value = {
                      isVisible: true,
                      callId: message.data.id,
                      contactName: message.data.name || '',
                      avatar: message.data.avatar || null,
                      isIncoming: false,
                      callType: message.data.type || 'audio',
                      callStatus: 'connecting'
                    };
                    break;
              case 'call:accepted':
                if (callData.value.callId === message.data.callId) {
                  callData.value.callStatus = 'active';
                }
                break;
              case 'call:ended':
                if (callData.value.callId === message.data.callId) {
                  callData.value.isVisible = false;
                  callData.value.callId = null;
                }
                break;
          case 'call:start_from_command':
                if (window.callComponent && typeof window.callComponent.handleMessage === 'function') {
                  window.callComponent.handleMessage({ action: action, data: message.data });
                }
                break;
          case 'chargingStarted':
              isCharging.value = true;
              chargingProgress.value = 0;
              if (message.data && message.data.stationId) {
                chargingStationId.value = message.data.stationId;
              }
              addNotification({
                title: "Carga iniciada",
                message: "Conectado a estación de carga",
                app: "system"
              });
              break;
          case 'chargingStopped':
              isCharging.value = false;
              chargingProgress.value = 0;
              chargingStationId.value = null;
              if (message.data && message.data.reason) {
                addNotification({
                  title: "Carga detenida",
                  message: message.data.reason,
                  app: "system"
                });
              }
              break;
          case 'updateSignal':
              if (message.data || message.signal !== undefined) {
                signalStrength.value = message.signal || message.data?.signal || 4;
                networkType.value = message.networkType || message.data?.networkType || "5G";
                isConnected.value = message.isConnected !== undefined ? message.isConnected : (signalStrength.value > 0);
              }
              break;
          case 'updateBatteryStatus':
              if (message.data) {
                if (message.data.level !== undefined) {
                  batteryLevel.value = message.data.level;
                }
              }
              break;
          case 'forceSavePhoneState':
              
              
              savePhoneState().then(() => {
                
                
                fetch('https://bit-smartphone/bit-smartphone:saveCompleted', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    reason: message.reason,
                    success: true
                  })
                }).catch(e => {
                  console.error('[BIT-Smartphone] Error confirming save completion:', e);
                });
              }).catch(e => {
                console.error('[BIT-Smartphone] Error during forced save:', e);
                
                fetch('https://bit-smartphone/bit-smartphone:saveCompleted', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    reason: message.reason,
                    success: false,
                    error: e.message
                  })
                }).catch(console.error);
              });
              break;
          case 'openApp':
              if (message.data && message.data.appId) {
                try {
                  openApp(message.data.appId);
                } catch (e) {
                  console.error('[app.js] Error opening app from NUI message:', e);
                }
              }
              break;
          case 'appstore:appsLoaded':
          case 'appstore:downloadResult':
              
              if (window.__appstore_message_handler && typeof window.__appstore_message_handler === 'function') {
                try {
                  window.__appstore_message_handler({ data: message });
                } catch (e) {
                  console.error('[app.js] Error dispatching to AppStore:', e);
                }
              } else {
                console.error('[app.js] AppStore message handler not available');
              }
              break;
          default:
              if (action && action.includes(':')) {
                const [appName] = action.split(':');
                const handlerName = `__${appName}_message_handler`;
                if (window[handlerName] && typeof window[handlerName] === 'function') {
                  try {
                    window[handlerName]({ data: message });
                  } catch (e) {
                    console.error(`[app.js] Error dispatching to ${appName}:`, e);
                  }
                }
              }
              break;
      }
    };
    

const closePhone = () => {
  showPhone.value = false;
  const payload = {
    setup_completed: phoneState.value !== 'SETUP' ? 1 : 0,
    installed_apps: installedApps.value,
    dock_apps: dockApps.value,
    wallpaper: setupData.value.wallpaper,
    theme_mode: userSettings.value.darkMode ? 'dark' : 'light',
    profile_name: setupData.value.userName,
    profile_picture: setupData.value.userPhoto,
    lockscreen_widgets: lockscreenSettings.value.widgets,
    lockscreen_font_size: lockscreenSettings.value.clockSize,
    lockscreen_font_color: lockscreenSettings.value.clockColor,
    lockscreen_date_style: lockscreenSettings.value.dateStyle,
    lockscreen_date_color: lockscreenSettings.value.dateColor,
    lockscreen_date_size: lockscreenSettings.value.dateSize,
    call_sound: setupData.value.callSound || 'assets/sounds/calls/1.mp3',
    notification_sound: setupData.value.notificationSound || 'assets/sounds/notifications/1.mp3'
  };
  fetch('https://bit-smartphone/bit-smartphone:closePhone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(console.error);
};

const handleEsc = (e) => {
  if (e.key === 'Escape' && showPhone.value) {
    e.preventDefault();
    e.stopPropagation();
    closePhone();
  }
};

    onMounted(() => {
      window.addEventListener('keydown', handleEsc);
      
      updateTime();
      setInterval(updateTime, 10000);

      
      setInterval(() => {
        if (phoneState.value !== 'SETUP') { 
          
          savePhoneState().catch(e => {
            console.error('[BIT-Smartphone] Periodic save failed:', e);
          });
        }
      }, 300000); 

      
      setInterval(() => {
        if (phoneState.value === 'HOME' && !isEditMode.value) {
          const draggingElements = document.querySelectorAll('.dragging');
          const ghostElements = document.querySelectorAll('.drag-ghost');
          const dragOverElements = document.querySelectorAll('.drag-over-active');
          
          if (draggingElements.length > 0 || ghostElements.length > 0 || dragOverElements.length > 0) {
            
            draggingElements.forEach(el => el.classList.remove('dragging'));
            ghostElements.forEach(el => el.remove());
            dragOverElements.forEach(el => el.classList.remove('drag-over-active'));
          }
        }
      }, 30000); 

      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", stopDrag);
      window.addEventListener("touchmove", onDrag, { passive: false });
      window.addEventListener("touchend", stopDrag);

      window.addEventListener('beforeunload', (event) => {
        
        try {
          savePhoneState();
        } catch (e) {
          console.error('[BIT-Smartphone] Error during beforeunload save:', e);
        }
      });

      window.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'phone:config') {
          window.phoneConfig = event.data.data;
          this.phoneConfig = event.data.data;
        }
      });

      const applyInitialSettings = () => {
        nextTick(() => {
          applyFontSize(userSettings.value.fontSize || 'medium');
        });
      };
      
      if (window.translations) {
        applyInitialSettings();
      } else {
        setTimeout(applyInitialSettings, 100);
      }

      if (setupData.value.wallpaper) {
        const idx = wallpapers.value.findIndex(w => w.includes(setupData.value.wallpaper));
        if (idx >= 0) currentWallpaperIndex.value = idx;
      }

      window.__nui_message_queue = window.__nui_message_queue || [];
      const drainQueue = () => {
        try {
          const q = window.__nui_message_queue;
          while (q.length > 0) {
            const msg = q.shift();
            try {
              masterNuiHandler(msg);
            } catch (err) {
              console.error('[NUI] Error', err, msg);
            }
          }
        } catch (e) {
          console.error('[NUI]', e);
        }
      };
      drainQueue();
      window.__nui_message_poller = setInterval(drainQueue, 50);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleEsc);
      if (window.__nui_message_poller) {
        clearInterval(window.__nui_message_poller);
        window.__nui_message_poller = null;
      }
    });
    

    watch(() => userSettings.value.fontSize, (newSize) => {
      nextTick(() => {
        applyFontSize(newSize || 'medium')
      })
    });

    
    watch(() => callData.value?.isVisible, (isVisible) => {
      if (isVisible) {
        nextTick(() => {
          if (appInstance && appInstance.$refs && appInstance.$refs.callComponent) {
            window.callComponent = appInstance.$refs.callComponent;
            
          }
        });
      }
    });

    watch(() => currentApp.value, (newApp, oldApp) => {
      
      if (newApp && loadedApps.value[newApp]) {
        console.log('[Watch] Component available for', newApp, { 
          component: !!loadedApps.value[newApp], 
          hasProps: !!(loadedApps.value[newApp] && loadedApps.value[newApp].props),
          hasEmits: !!(loadedApps.value[newApp] && loadedApps.value[newApp].emits),
          tAvailable: typeof t.value === 'function'
        });
      }
      if (oldApp && newApp !== oldApp) {
        setTimeout(() => {
          document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
          document.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active'));
          document.querySelectorAll('.drag-ghost').forEach(el => el.remove());
        }, 100);
      }
    });

    watch(() => phoneState.value, (newState, oldState) => {
      if (newState === 'HOME' && oldState !== 'HOME') {
        setTimeout(() => {
          const draggingElements = document.querySelectorAll('.dragging');
          const ghostElements = document.querySelectorAll('.drag-ghost');
          if (draggingElements.length > 0 || ghostElements.length > 0) {
            
            draggingElements.forEach(el => el.classList.remove('dragging'));
            ghostElements.forEach(el => el.remove());
          }
        }, 200);
      }
    });

    window.testAirDrop = () => {
      
      if (window.appInstance && window.appInstance.addNotification) {
        window.appInstance.addNotification({
          icon: '',
          title: window.currentLanguage === 'es' ? 'AirDrop recibido' : 'AirDrop received',
          body: window.currentLanguage === 'es' 
            ? 'TestUser te ha compartido su número: 123-456-7890' 
            : 'TestUser has shared their number: 123-456-7890',
          timestamp: Date.now(),
          priority: 'high'
        });
      }
    };

    return {
      t, phoneState, setupStep, setupData, nextSetupStep, prevSetupStep, completeSetup, toggleDarkMode, setWallpaper,
      pinInput, pinError, currentApp, isControlCenterVisible, loadedApps, batteryLevel, signalStrength, networkType, currentTime,
      currentDate, photos, weatherData, wallpapers, currentWallpaperIndex, userSettings, allApps, systemApps,
      dockAppsData, currentWallpaperStyle, themeClasses, updateTime, enterPin, isDraggingBrightness, isDraggingVolume,
      startDrag, onDrag, stopDrag, handleSliderInteraction, updateFolder, isEditMode, toggleEditMode, handleLayoutUpdate,
      handleFoldersUpdate, openFolderId, handleOpenFolder, handleCloseFolder, deletePin: () => { pinInput.value = pinInput.value.slice(0, -1) },
      lock, unlockPhone, cancelPin, goHome, resetUIState, handleTakePhoto, openApp, updateSetting, isConnected, internetRequiredApps,
      toggleControlCenter: () => (isControlCenterVisible.value = !isControlCenterVisible.value),
      openAirDrop: () => {
        isControlCenterVisible.value = false;
        openApp('phone');
        nextTick(() => {
          if (currentApp.value === 'phone' && loadedApps.value.phone) {
            const phoneComponent = loadedApps.value.phone;
            if (phoneComponent && phoneComponent.openAirDropModal) {
              phoneComponent.openAirDropModal();
            } else {
              window.dispatchEvent(new CustomEvent('open-airdrop-modal'));
            }
          }
        });
      },
      widgets, isWidgetManagerVisible, handleAddWidget, handleRemoveWidget, handleUpdateWidget, currentPage, totalPages,
      goToPage, requestNextPage, requestPrevPage, pageContainerStyle, onSwipeStart, onSwipeMove, onSwipeEnd,
      onDragStart, onDragEnd, globalDraggedItem, handleDragPageChanged, musicState, playTrack, pauseMusic, resumeMusic,
      stopMusic, setMusicProgress, setMusicVolume, setPlaylist, lockscreenSettings, updateLockscreenSettings,
      notifications, addNotification, removeNotification, handleNotificationTap, handleDismissNotification, handleExpandNotification, testNotifications, 
      playNotificationSound, playCallSound, currentCallAudio, callData,
      handleEndCall, handleToggleMute, handleToggleSpeaker, handleToggleVideo, handleMinimizeCall,
      batteryLevel, batteryDraining, currentOpenApps, flashlightOn, toggleFlashlight, startBatterySystem, stopBatterySystem, updateSetupData, showPhone,
      isCharging, chargingProgress, chargingStationId,
      phoneOrientation, isOrientationTransitioning, handleOrientationChange, isAppSwitcherVisible, openApps,
      openAppSwitcher, closeAppSwitcher, handleAppSwitcherOpenApp, handleAppSwitcherCloseApp, forceCloseCurrentApp,
      handleHomeIndicatorTouchStart, handleHomeIndicatorTouchEnd, showEmergency, handleEmergencyCall, handleTimerEnd,
      activateEmergency, cryptoWallet, cryptoPrices, getCryptoBalance, getTotalCryptoValueUSD, spendCrypto, addCrypto,
      installedApps, appLayout, installApp, uninstallApp, getAvailableApps, isAppInstalled, state, initializeFromServer, dispatchNui: masterNuiHandler,
      savePhoneState,
      lockscreenTransitionName,
    };
  },
  components: {
    StatusBar: StatusBar,
    Folder: Folder,
    DraggableAppGrid: DraggableAppGrid, 
    ControlCenter: ControlCenter,
    PhoneSetup: PhoneSetup,
    Lockscreen: Lockscreen,
    PinScreen: PinScreen,
  WidgetManager: window.WidgetManager || { name: 'WidgetManager', template: '<div></div>' },
    NotchNotification: NotchNotification,
    AppSwitcher: AppSwitcher,
    MedicalEmergency: MedicalEmergency,
    CallComponent: CallComponent,
  },
  template: `
        <div>
          <transition name="slide-in-up" mode="out-in">
            <div v-if="showPhone" class="phone-wrapper relative overflow-visible"
                 :class="phoneOrientation === 'landscape' ? 'landscape-mode' : ''">
              <div class="iphone-container transition-all duration-500 ease-in-out" 
                   :class="[
                     themeClasses,
                     phoneOrientation === 'landscape' ? 'landscape-mode' : 'portrait-mode',
                     isOrientationTransitioning ? 'orientation-transitioning' : ''
                   ]">

                <NotchNotification 
                  v-if="!(phoneState === 'LOCKED' || phoneState === 'LOCKED_PREVIEW')"
                  :music-state="musicState"
                  :notifications="notifications"
                  :t="t"
                  @dismiss-notification="removeNotification"
                  @tap-notification="handleNotificationTap"
                />

                <div class="iphone-screen" :style="{ filter: 'brightness(' + userSettings.brightness + '%)', background: 'url(' + wallpapers[currentWallpaperIndex] + ') no-repeat center/cover' }">
                  <StatusBar 
                    :current-time="currentTime"
                    :battery-level="batteryLevel"
                    :signal-strength="signalStrength"
                    :network-type="networkType"
                    :is-charging="isCharging"
                    :is-dark-mode="userSettings.darkMode"
                    :is-in-app="!!currentApp"
                    @time-tap="lock"
                    @status-tap="toggleControlCenter"
                  />

                   <PhoneSetup v-if="phoneState === 'SETUP'" :t="t" :setup-data="setupData" @update-setup="updateSetupData" @complete="completeSetup" @next-step="nextSetupStep" @prev-step="prevSetupStep" />
                   
                   <transition :name="lockscreenTransitionName">
                    <Lockscreen v-if="phoneState === 'LOCKED' || phoneState === 'LOCKED_PREVIEW'" 
                                :phone-state="phoneState"    
                                :current-wallpaper-style="currentWallpaperStyle" 
                                :current-date="currentDate" 
                                :current-time="currentTime" 
                                :t="t" 
                                :lockscreen-settings="lockscreenSettings"
                                :notifications="notifications"
                                :weather-data="weatherData"
                                :music-state="musicState"
                                :battery-level="batteryLevel"
                                :photos="photos"
                                @unlock-phone="unlockPhone"
                                @update-lockscreen-settings="updateLockscreenSettings"
                                @dismiss-notification="handleDismissNotification"
                                @tap-notification="handleNotificationTap"
                                @expand-notification="handleExpandNotification"
                                @clear-all-notifications="clearAllNotifications"
                                @flashlight-toggle="(state) => { flashlightOn = state }"
                    />
                   </transition>
                   
                   <transition name="pinscreen-fade">            
                      <PinScreen v-if="phoneState === 'PIN'" 
                                :pin-input="pinInput" 
                                :pin-error="pinError" 
                                :t="t" 
                                @enter-pin="enterPin" 
                                @delete-pin="deletePin"
                                @cancel="cancelPin" />
                   </transition>

                   
                   <MedicalEmergency 
                      :isActive="showEmergency" 
                      @emergency-called="handleEmergencyCall"
                      @timer-ended="handleTimerEnd"
                    />

                   
                  <div v-if="phoneState === 'HOME'" class="relative w-full h-full z-10 overflow-hidden" @click="toggleEditMode(false)">
                    
                    <StatusBar 
                      :current-time="currentTime"
                      :battery-level="batteryLevel"
                      :signal-strength="signalStrength"
                      :network-type="networkType"
                      :is-charging="isCharging"
                      :is-dark-mode="false"
                      :is-in-app="false"

                      @time-tap="lock"
                      @status-tap="toggleControlCenter"
                    />

                    <div class="absolute inset-0 bg-cover bg-center" :style="currentWallpaperStyle"></div>
                    <div class="absolute inset-0" :class="userSettings.darkMode ? 'bg-black/40' : 'bg-black/20'"></div>

                    
                    <div class="w-full h-full flex" :style="pageContainerStyle">
                      <div v-for="(pageLayout, pageIndex) in systemApps" :key="'page-' + pageIndex" class="w-full h-full flex-shrink-0 relative">
                        
                        <DraggableAppGrid
                          :system-apps="systemApps"
                          :all-apps="allApps"
                          :is-edit-mode="isEditMode"
                          :t="t"
                          :current-page="currentPage"
                          :page-index="pageIndex"
                          :global-dragged-item="globalDraggedItem"
                          :total-pages="totalPages"
                          :open-folder-id="openFolderId"
                          :widgets="widgets"
                          :weather-data="weatherData"
                          :battery-level="batteryLevel"
                          :photos="photos"
                          :music-state="musicState"
                          :is-connected="isConnected"
                          :signal-strength="signalStrength"
                          :internet-required-apps="internetRequiredApps"
                          @update:layout="handleLayoutUpdate"
                          @update:folders="handleFoldersUpdate"
                          @open-app="openApp"
                          @request-edit-mode="toggleEditMode"
                          @request-open-widget-manager="isWidgetManagerVisible = true"
                          @request-open="handleOpenFolder"
                          @close-folder="handleCloseFolder"
                          @update-folder="updateFolder"
                                                   @remove-widget="handleRemoveWidget"
                          @update-widget="handleUpdateWidget"
                          @request-next-page="requestNextPage" 
                          @request-prev-page="requestPrevPage"
                          @swipe-start="onSwipeStart"
                          @swipe-move="onSwipeMove"
                          @swipe-end="onSwipeEnd"
                          @drag-start="onDragStart"
                          @drag-end="onDragEnd"
                          @drag-page-changed="handleDragPageChanged"
                        />
                      </div>
                    </div>

                    
                    <div v-if="!currentApp" class="absolute bottom-[130px] left-0 right-0 flex justify-center items-center gap-2 z-30">
                      <button v-for="i in totalPages" :key="'dot-' + i" @click.stop="goToPage(i - 1)" class="w-2 h-2 rounded-full transition-colors" :class="currentPage === i - 1 ? 'bg-white' : 'bg-white/40'"></button>
                    </div>

                    
                    <div v-if="!currentApp" class="absolute bottom-8 left-4 right-4 h-24 bg-black/20 backdrop-blur-xl rounded-3xl z-20 flex items-center justify-around px-4">
                      <div v-for="app in dockAppsData" :key="app.id" @click="openApp(app)" class="w-16 h-16 cursor-pointer rounded-2xl flex items-center justify-center overflow-hidden app-icon" :class="{ 
                        'disabled-no-connection': internetRequiredApps.includes(app.id) && (!isConnected || signalStrength === 0) 
                      }">
                        <img :src="'./assets/icons/apps/' + app.id + '.svg'" :alt="app.name" class="w-full h-full" draggable="false"/>
                      </div>
                    </div>

                    
                    <transition name="app-zoom">
                     <div v-if="currentApp && loadedApps[currentApp] && loadedApps[currentApp] !== null" class="absolute inset-0 z-40">
                       <component :is="loadedApps[currentApp]"
                                  :userSettings="userSettings"
                                  :wallpapers="wallpapers"
                                  :currentWallpaper="currentWallpaperIndex"
                                  :photos="photos"
                                  :weatherData="weatherData"
                                  :music-state="musicState"
                                  :t="t"
                                  @close="goHome"
                                  @update-setting="updateSetting"
                                  @take-photo="handleTakePhoto"
                                  @add-notification="addNotification"
                                  @open-app="openApp"
                                  @play-track="playTrack"
                                  @pause-music="pauseMusic"
                                  @orientation-change="handleOrientationChange"
                                  @resume-music="resumeMusic"
                                  @stop-music="stopMusic"
                                  @set-music-progress="setMusicProgress"
                                  @set-music-volume="setMusicVolume"
                                  @set-playlist="setPlaylist" />
                     </div>
                   </transition>
                    
                    
                    <transition name="edit-mode-enter-active">
                      <div v-if="isEditMode && !openFolderId" class="absolute bottom-36 left-1/2 -translate-x-1/2 z-50">
                        <button @click.stop="toggleEditMode(false)" class="px-8 py-2 bg-white/20 backdrop-blur-md text-white font-semibold rounded-full border border-white/30 hover:bg-white/30 transition-all">
                          {{ t('common.done', 'Done') }}
                        </button>
                      </div>
                    </transition>
                  </div>

                  
                  <transition name="slide-down">
                   <ControlCenter 
                     v-if="isControlCenterVisible"
                     :user-settings="userSettings"
                     :all-apps="allApps"
                     :music-state="musicState"
                     :t="t"
                     @update-setting="updateSetting"
                     @open-app="openApp"
                     @close="toggleControlCenter"
                     @toggle-dark-mode="toggleDarkMode"
                     @play-track="playTrack"
                     @pause-music="pauseMusic"
                     @resume-music="resumeMusic"
                     @stop-music="stopMusic"
                     @set-music-progress="setMusicProgress"
                     @set-music-volume="setMusicVolume"
                     @set-playlist="setPlaylist"
                     @open-airdrop="openAirDrop"
                   />
                  </transition>

                   
                 <WidgetManager
                   :is-visible="isWidgetManagerVisible"
                   :weather-data="weatherData"
                   :battery-level="batteryLevel"
                   :photos="photos"
                   :music-state="musicState"
                   :t="t"
                   @close="isWidgetManagerVisible = false"
                   @add-widget="handleAddWidget"
                 />

                
                <div v-if="phoneState === 'HOME'" 
                     @click="goHome" 
                     @touchstart="handleHomeIndicatorTouchStart"
                     @touchend="handleHomeIndicatorTouchEnd"
                     @mousedown="handleHomeIndicatorTouchStart"
                     @mouseup="handleHomeIndicatorTouchEnd"
                     class="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 rounded-full z-[60] cursor-pointer transition-colors duration-300"
                     :class="currentApp && !userSettings.darkMode ? 'bg-black' : 'bg-white'"></div>

                
                <AppSwitcher 
                  :visible="isAppSwitcherVisible"
                  :open-apps="openApps"
                  :all-apps="allApps"
                  @close="closeAppSwitcher"
                  @open-app="handleAppSwitcherOpenApp"
                  @close-app="handleAppSwitcherCloseApp"
                />
                <CallComponent 
                  ref="callComponent"
                  v-if="callData && callData.isVisible"
                  :call-data="callData"
                  :is-visible="callData.isVisible"
                  @end-call="handleEndCall"
                  @toggle-mute="handleToggleMute"
                  @toggle-speaker="handleToggleSpeaker"
                  @toggle-video="handleToggleVideo"
                  @minimize="handleMinimizeCall"
                />
               </div>

               
               <div id="imgOverlay" class="absolute pointer-events-none z-10 top-[-135px] left-[-134px]" style="width:calc(100% + 270px); height:calc(100% + 270px);">
                 <img src="./assets/frame.png" alt="iPhone Frame" class="w-full h-full object-cover" />
               </div>
              </div> 
            </div> 
          </transition>
        </div>
      `,
};


window.startCall = (targetId, callType = 'audio') => {
  
  const event = {
    data: {
      action: 'call:start_from_command',
      data: {
        targetId: targetId,
        type: callType
      }
    }
  };
  
  
  if (window.callComponent) {
    window.callComponent.handleMessage(event.data);
  } else {
    
    window.dispatchEvent(new CustomEvent('message', event));
  }
};

let appInstance = null;
let appInitialized = false;

function initializeApp() {
  if (appInitialized) return;
  
  try {
    const app = createApp(MobileOS);
    
    app.config.globalProperties.$t = (key, fallback) => {
      const instance = app._instance || appInstance;
      if (instance && instance.t) {
        return instance.t(key, fallback);
      }
      return fallback || key;
    };
    
    appInstance = app.mount('#app');
    window.appInstance = appInstance;
    window.vueApp = appInstance; 
    
    
    setTimeout(() => {
      if (appInstance && appInstance.$refs && appInstance.$refs.callComponent) {
        window.callComponent = appInstance.$refs.callComponent;
        } else {
        
        setTimeout(() => {
          if (appInstance && appInstance.$refs && appInstance.$refs.callComponent) {
            window.callComponent = appInstance.$refs.callComponent;
            }
        }, 500);
      }
    }, 100);
    
    appInitialized = true;

    if (window.__nui_message_queue && window.__nui_message_queue.length > 0) {
      while (window.__nui_message_queue.length > 0) {
        const pending = window.__nui_message_queue.shift();
        if (appInstance && appInstance.dispatchNui) {
          appInstance.dispatchNui(pending);
        }
      }
    }
  } catch (error) {
    console.error('[BIT-Smartphone] Error initializing app:', error);
    appInitialized = false;
  }
}

window.addEventListener('translationsLoaded', initializeApp);

setTimeout(() => {
  if (!appInitialized) {
    initializeApp();
  }
}, 500);


(function(){
  
  function createDebugOverlay() {
    if (document.getElementById('bit-debug-overlay')) return;
    try {
      const ov = document.createElement('div');
      ov.id = 'bit-debug-overlay';
      ov.style.position = 'fixed';
      ov.style.left = '12px';
      ov.style.right = '12px';
      ov.style.bottom = '12px';
      ov.style.zIndex = 99999;
      ov.style.padding = '10px 12px';
      ov.style.background = 'rgba(0,0,0,0.7)';
      ov.style.color = '#fff';
      ov.style.fontFamily = 'Inter, Roboto, sans-serif';
      ov.style.borderRadius = '10px';
      ov.style.display = 'flex';
      ov.style.alignItems = 'center';
      ov.style.justifyContent = 'space-between';
      ov.innerHTML = `
        <div style="flex:1; padding-right:10px; font-size:13px">BIT-Smartphone UI not initialized. Use <strong>Reiniciar UI</strong> to attempt recovery.</div>
        <div style="display:flex; gap:8px">
          <button id="bit-debug-restart" style="background:#1f2937;color:#fff;border:none;padding:8px 10px;border-radius:6px;cursor:pointer">Reiniciar UI</button>
        </div>
      `;
      document.body.appendChild(ov);
      document.getElementById('bit-debug-restart').addEventListener('click', function(){
        try { initializeApp(); } catch(e) { console.error('[BIT-Smartphone] restart failed', e); }
      });
    } catch (e) { console.warn('[BIT-Smartphone] createDebugOverlay error', e); }
  }

  
  let __bit_init_attempts = 0;
  const __bit_max_attempts = 6;
  const __bit_retry_delay = 1000; 

  const tryInitialize = () => {
    if (appInitialized) return;
    __bit_init_attempts++;
    try {
      initializeApp();
      setTimeout(() => {
        if (!appInitialized) {
          console.warn('[BIT-Smartphone] initializeApp did not complete, attempt', __bit_init_attempts);
          createDebugOverlay();
          if (__bit_init_attempts < __bit_max_attempts) {
            setTimeout(tryInitialize, __bit_retry_delay);
          } else {
            console.error('[BIT-Smartphone] maximum initialization attempts reached');
          }
        }
      }, 400);
    } catch (e) {
      console.error('[BIT-Smartphone] initializeApp threw', e);
      createDebugOverlay();
      if (__bit_init_attempts < __bit_max_attempts) {
        setTimeout(tryInitialize, __bit_retry_delay);
      }
    }
  };

  
  window.addEventListener('DOMContentLoaded', () => {
    tryInitialize();
  });
  window.addEventListener('load', () => {
    tryInitialize();
  });

  
  setTimeout(() => {
    if (!appInitialized) tryInitialize();
  }, 300);

})();



window.addEventListener('error', (event) => {
  console.error('[BIT-Smartphone] Global error:', event.error);
  
  return true;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[BIT-Smartphone] Unhandled promise rejection:', event.reason);
  
  event.preventDefault();
});


if (window.Vue) {
  const app = window.Vue.config || {};
  app.errorHandler = (err, instance, info) => {
    console.error('[BIT-Smartphone] Vue error:', err, info);
    
    
    if (window.vueApp && window.vueApp.currentApp && window.vueApp.forceCloseCurrentApp) {
      setTimeout(() => {
        try {
          window.vueApp.forceCloseCurrentApp();
        } catch (e) {
          console.error('[BIT-Smartphone] Error during recovery:', e);
        }
      }, 100);
    }
  };
}