const Settings = {
  props: ['userSettings', 'currentWallpaper', 'wallpapers', 'photos', 't'],
  emits: ['close', 'update-setting', 'change-wallpaper', 'update-profile', 'toggle-dark-mode'],

  data() {
    return {
      currentSection: null,
      showProfileEdit: false,
      showCustomImageInput: false,
      customImageUrl: '',
      tempProfile: {
        name: this.userSettings?.profileName || this.t('settings.profile.defaultUser'),
        avatar: this.userSettings?.profileAvatar || "./assets/avatars/default.svg",
      },
      
      
      defaultAvatars: [
        "./assets/avatars/default.svg",
        "./assets/avatars/default1.jpg",
        "./assets/avatars/default2.jpg", 
        "./assets/avatars/default3.jpg",
        "./assets/avatars/default4.jpg",
        "./assets/avatars/default5.jpg",
        "./assets/avatars/default6.jpg"
      ],

      
      tempSettings: {
        notificationSound: this.userSettings?.notificationSound || 'default',
        clickSound: this.userSettings?.clickSound || 'default',
        customNotificationUrl: this.userSettings?.customNotificationUrl || '',
        customClickUrl: this.userSettings?.customClickUrl || '',
        fontSize: this.userSettings?.fontSize || 'medium',
        fontFamily: this.userSettings?.fontFamily || 'system',
        wallpaperStyle: this.userSettings?.wallpaperStyle || 'default',
        iconStyle: this.userSettings?.iconStyle || 'default',
        animationSpeed: this.userSettings?.animationSpeed || 'normal',
        accentColor: this.userSettings?.accentColor || 'blue',
        borderRadius: this.userSettings?.borderRadius || 'medium'
      }
    }
  },

  computed: {
    
    defaultSounds() {
      return [
        { id: 'default', name: this.t('settings.sounds.default') || 'Por defecto', url: '' },
        { id: 'ding', name: 'Ding', url: './assets/sounds/ding.mp3' },
        { id: 'chime', name: this.t('settings.sounds.chime') || 'Campanada', url: './assets/sounds/chime.mp3' },
        { id: 'pop', name: 'Pop', url: './assets/sounds/pop.mp3' },
        { id: 'swoosh', name: 'Swoosh', url: './assets/sounds/swoosh.mp3' }
      ]
    },

    
    availableFonts() {
      return [
        { id: 'system', name: 'SF Pro Display (Sistema)', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
        { id: 'inter', name: 'Inter', family: 'Inter, sans-serif' },
        { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif' },
        { id: 'poppins', name: 'Poppins', family: 'Poppins, sans-serif' },
        { id: 'playfair', name: 'Playfair Display', family: 'Playfair Display, serif' },
        { id: 'crimson', name: 'Crimson Text', family: 'Crimson Text, serif' },
        { id: 'dancing', name: 'Dancing Script', family: 'Dancing Script, cursive' },
        { id: 'pacifico', name: 'Pacifico', family: 'Pacifico, cursive' },
        { id: 'caveat', name: 'Caveat', family: 'Caveat, cursive' },
        { id: 'bangers', name: 'Bangers', family: 'Bangers, cursive' },
        { id: 'orbitron', name: 'Orbitron', family: 'Orbitron, monospace' },
        { id: 'fredoka', name: 'Fredoka One', family: 'Fredoka One, cursive' },
        { id: 'abril', name: 'Abril Fatface', family: 'Abril Fatface, cursive' },
      ]
    },

    availableAccentColors() {
      return [
        { id: 'blue', name: 'Azul', value: '#007AFF', description: 'Azul clásico de iOS' },
        { id: 'green', name: 'Verde', value: '#34C759', description: 'Verde vibrante' },
        { id: 'red', name: 'Rojo', value: '#FF3B30', description: 'Rojo intenso' },
        { id: 'orange', name: 'Naranja', value: '#FF9500', description: 'Naranja enérgico' },
        { id: 'purple', name: 'Morado', value: '#AF52DE', description: 'Morado elegante' },
        { id: 'pink', name: 'Rosa', value: '#FF2968', description: 'Rosa vibrante' },
        { id: 'teal', name: 'Turquesa', value: '#5AC8FA', description: 'Turquesa refrescante' },
        { id: 'yellow', name: 'Amarillo', value: '#FFCC00', description: 'Amarillo brillante' }
      ]
    },

    availableBorderRadius() {
      return [
        { id: 'sharp', name: 'Angulado', value: '4px', preview: '4px', description: 'Bordes afilados' },
        { id: 'small', name: 'Pequeño', value: '8px', preview: '8px', description: 'Ligeramente redondeado' },
        { id: 'medium', name: 'Medio', value: '12px', preview: '12px', description: 'Equilibrio perfecto' },
        { id: 'large', name: 'Grande', value: '16px', preview: '16px', description: 'Notablemente redondeado' },
        { id: 'extra', name: 'Extra', value: '24px', preview: '24px', description: 'Muy redondeado' }
      ]
    },

    availableWallpaperStyles() {
      return [
        { id: 'default', name: 'Por defecto', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', size: 'cover', repeat: 'no-repeat', position: 'center', description: 'Gradiente azul-morado' },
        { id: 'minimal', name: 'Minimalista', preview: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)', size: 'cover', repeat: 'no-repeat', position: 'center', description: 'Limpio y simple' },
        { id: 'dark', name: 'Oscuro', preview: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', size: 'cover', repeat: 'no-repeat', position: 'center', description: 'Tema oscuro elegante' },
        { id: 'nature', name: 'Naturaleza', preview: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', size: 'cover', repeat: 'no-repeat', position: 'center', description: 'Inspirado en la naturaleza' },
        { id: 'sunset', name: 'Atardecer', preview: 'linear-gradient(135deg, #fab1a0 0%, #e17055 100%)', size: 'cover', repeat: 'no-repeat', position: 'center', description: 'Colores cálidos del atardecer' },
        { id: 'ocean', name: 'Océano', preview: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)', size: 'cover', repeat: 'no-repeat', position: 'center', description: 'Azules profundos del océano' }
      ]
    },

    availableAnimationSpeeds() {
      return [
        { id: 'slow', name: 'Lenta', value: '0.5s', duration: 2, description: 'Animaciones pausadas y relajantes' },
        { id: 'normal', name: 'Normal', value: '0.3s', duration: 1, description: 'Velocidad estándar recomendada' },
        { id: 'fast', name: 'Rápida', value: '0.15s', duration: 0.5, description: 'Animaciones ágiles y dinámicas' },
        { id: 'instant', name: 'Instantánea', value: '0.05s', duration: 0.2, description: 'Cambios casi inmediatos' }
      ]
    },

    
    settingsCategories() {
      return [
        {
          id: 'connectivity',
          name: this.t('settings.categories.connectivity'),
          icon: 'wifi',
          items: [
            {
              id: 'airplane',
              name: this.t('settings.connectivity.airplane'),
              icon: 'plane',
              iconBgColor: 'bg-orange-500',
              type: 'toggle',
              value: this.userSettings.airplane || false,
              setting: 'airplane'
            },
            {
              id: 'bluetooth',
              name: this.t('settings.connectivity.bluetooth'),
              icon: 'bluetooth',
              iconBgColor: 'bg-blue-500',
              type: 'toggle',
              value: this.userSettings.bluetooth || false,
              setting: 'bluetooth'
            }
          ]
        },
        {
          id: 'display',
          name: this.t('settings.categories.display'),
          icon: 'monitor',
          items: [
            {
              id: 'appearance',
              name: this.t('settings.display.appearance'),
              subtitle: this.userSettings.darkMode ? this.t('settings.display.dark') : this.t('settings.display.light'),
              icon: 'moon',
              iconBgColor: 'bg-indigo-500',
              type: 'toggle',
              value: this.userSettings.darkMode || false,
              setting: 'darkMode'
            },
            {
              id: 'brightness',
              name: this.t('settings.display.brightness'),
              subtitle: (this.userSettings.brightness || 75) + '%',
              icon: 'sun',
              iconBgColor: 'bg-yellow-500',
              action: 'navigate'
            },
            {
              id: 'wallpaper-style',
              name: 'Estilo de Fondo',
              subtitle: this.getWallpaperStyleLabel(this.tempSettings.wallpaperStyle),
              icon: 'image',
              iconBgColor: 'bg-green-500',
              action: 'navigate'
            }
          ]
        },
        {
          id: 'typography',
          name: 'Tipografía',
          icon: 'type',
          items: [
            {
              id: 'text-size',
              name: this.t('settings.display.textSize'),
              subtitle: this.getFontSizeLabel(this.tempSettings.fontSize),
              icon: 'type',
              iconBgColor: 'bg-gray-500',
              action: 'navigate'
            },
            {
              id: 'font-family',
              name: 'Fuente',
              subtitle: this.getFontFamilyLabel(this.tempSettings.fontFamily),
              icon: 'edit-3',
              iconBgColor: 'bg-purple-500',
              action: 'navigate'
            }
          ]
        },
        {
          id: 'appearance',
          name: 'Apariencia',
          icon: 'palette',
          items: [
            {
              id: 'accent-color',
              name: 'Color de Acento',
              subtitle: this.getAccentColorLabel(this.tempSettings.accentColor),
              icon: 'circle',
              iconBgColor: 'bg-blue-500',
              action: 'navigate'
            },
            {
              id: 'border-radius',
              name: 'Bordes Redondeados',
              subtitle: this.getBorderRadiusLabel(this.tempSettings.borderRadius),
              icon: 'square',
              iconBgColor: 'bg-cyan-500',
              action: 'navigate'
            },
            {
              id: 'animation-speed',
              name: 'Velocidad de Animación',
              subtitle: this.getAnimationSpeedLabel(this.tempSettings.animationSpeed),
              icon: 'zap',
              iconBgColor: 'bg-orange-500',
              action: 'navigate'
            }
          ]
        },
        {
          id: 'sounds',
          name: this.t('settings.categories.sounds'),
          icon: 'volume-2',
          items: [
            {
              id: 'notification-sounds',
              name: this.t('settings.sounds.notifications'),
              subtitle: this.getSoundLabel(this.tempSettings.notificationSound),
              icon: 'bell',
              iconBgColor: 'bg-red-500',
              action: 'navigate'
            },
            {
              id: 'click-sounds',
              name: this.t('settings.sounds.clicks'),
              subtitle: this.getSoundLabel(this.tempSettings.clickSound),
              icon: 'mouse-pointer',
              iconBgColor: 'bg-pink-500',
              action: 'navigate'
            }
          ]
        },
        {
          id: 'general',
          name: this.t('settings.categories.general'),
          icon: 'settings',
          items: [
            {
              id: 'reset',
              name: this.t('settings.general.reset'),
              subtitle: this.t('settings.general.resetSubtitle'),
              icon: 'refresh-cw',
              iconBgColor: 'bg-gray-500',
              action: 'navigate',
              danger: true
            }
          ]
        }
      ]
    },

    
    themeClasses() {
      const isDark = this.userSettings.darkMode
      return {
        container: isDark ? 'bg-black text-white' : 'bg-gray-100 text-gray-900',
        
        header: isDark ? 'bg-black/95 border-gray-800' : 'bg-white/95 border-gray-300',
        
        card: isDark ? 'bg-gray-900' : 'bg-white',
        cardHover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
        
        border: isDark ? 'border-gray-800' : 'border-gray-200',
        
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-500',
        
        input: isDark ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-gray-200 text-gray-900 placeholder-gray-500',
        
        slider: isDark ? 'bg-gray-700' : 'bg-gray-300',
        sliderTrack: isDark ? 'bg-gray-700' : 'bg-gray-200',
        
        buttonSecondary: isDark ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
      }
    }
  },

  methods: {
    
    openSection(item) {
      if (item.type === 'toggle') {
        this.toggleSetting(item.setting, item.value)
      } else if (item.action === 'navigate') {
        if (item.id === 'profile-header') {
          this.currentSection = { id: 'profile-info', name: this.t('settings.profile.title'), action: 'navigate' }
        } else {
          this.currentSection = item
        }
      }
    },

    goBack() {
      this.currentSection = null
      this.showProfileEdit = false
      this.showCustomImageInput = false
    },

    
    openProfileEdit() {
      this.showProfileEdit = true
    },

    saveProfile() {
      this.$emit('update-setting', 'profileName', this.tempProfile.name)
      this.$emit('update-setting', 'profileAvatar', this.tempProfile.avatar)
      this.showProfileEdit = false
    },

    selectAvatar(avatar) {
      this.tempProfile.avatar = avatar
    },

    openCustomImageInput() {
      this.showCustomImageInput = true
    },

    saveCustomImage() {
      if (this.customImageUrl.trim()) {
        this.tempProfile.avatar = this.customImageUrl.trim()
        this.showCustomImageInput = false
        this.customImageUrl = ''
      }
    },

    
    toggleSetting(setting, currentValue) {
      this.$emit('update-setting', setting, !currentValue)
    },

    updateBrightness(value) {
      this.$emit('update-setting', 'brightness', value)
    },

    updateSoundSetting(soundType, soundId) {
      this.tempSettings[soundType] = soundId
      this.$emit('update-setting', soundType, soundId)
    },

    updateFontSize(size) {
      this.tempSettings.fontSize = size
      this.$emit('update-setting', 'fontSize', size)
    },

    updateFontFamily(fontId) {
      this.tempSettings.fontFamily = fontId
      this.$emit('update-setting', 'fontFamily', fontId)
      this.applyFontFamily(fontId)
    },

    updateAccentColor(colorId) {
      this.tempSettings.accentColor = colorId
      this.$emit('update-setting', 'accentColor', colorId)
      this.applyAccentColor(colorId)
    },

    updateBorderRadius(radiusId) {
      this.tempSettings.borderRadius = radiusId
      this.$emit('update-setting', 'borderRadius', radiusId)
      this.applyBorderRadius(radiusId)
    },

    updateWallpaperStyle(styleId) {
      this.tempSettings.wallpaperStyle = styleId
      this.$emit('update-setting', 'wallpaperStyle', styleId)
      this.applyWallpaperStyle(styleId)
    },

    updateAnimationSpeed(speedId) {
      this.tempSettings.animationSpeed = speedId
      this.$emit('update-setting', 'animationSpeed', speedId)
      this.applyAnimationSpeed(speedId)
    },

    applyFontFamily(fontId) {
      const selectedFont = this.availableFonts.find(f => f.id === fontId)
      if (selectedFont) {
        document.documentElement.style.setProperty('--phone-font-family', selectedFont.family)
      }
    },

    applyAccentColor(colorId) {
      const selectedColor = this.availableAccentColors.find(c => c.id === colorId)
      if (selectedColor) {
        document.documentElement.style.setProperty('--accent-color', selectedColor.value)
      }
    },

    applyBorderRadius(radiusId) {
      const selectedRadius = this.availableBorderRadius.find(r => r.id === radiusId)
      if (selectedRadius) {
        document.documentElement.style.setProperty('--border-radius', selectedRadius.value)
      }
    },

    applyWallpaperStyle(styleId) {
      const selectedStyle = this.availableWallpaperStyles.find(s => s.id === styleId)
      if (selectedStyle) {
        const phoneContainer = document.querySelector('.phone-container')
        if (phoneContainer) {
          phoneContainer.className = `phone-container ${selectedStyle.preview}`
        }
      }
    },

    applyAnimationSpeed(speedId) {
      const selectedSpeed = this.availableAnimationSpeeds.find(s => s.id === speedId)
      if (selectedSpeed) {
        document.documentElement.style.setProperty('--animation-duration', selectedSpeed.value)
      }
    },

    previewFont(fontId) {
      this.applyFontFamily(fontId)
    },

    
    getSoundLabel(soundId) {
      const sound = this.defaultSounds.find(s => s.id === soundId)
      return sound ? sound.name : this.t('settings.sounds.custom')
    },

    getFontSizeLabel(size) {
      const labels = {
        small: this.t('settings.display.fontSize.small'),
        medium: this.t('settings.display.fontSize.medium'),
        large: this.t('settings.display.fontSize.large')
      }
      return labels[size] || labels.medium
    },

    getFontFamilyLabel(fontId) {
      const font = this.availableFonts.find(f => f.id === fontId)
      return font ? font.name : 'Sistema'
    },

    getAccentColorLabel(colorId) {
      const color = this.availableAccentColors.find(c => c.id === colorId)
      return color ? color.name : 'Azul'
    },

    getBorderRadiusLabel(radiusId) {
      const radius = this.availableBorderRadius.find(r => r.id === radiusId)
      return radius ? radius.name : 'Medio'
    },

    getWallpaperStyleLabel(styleId) {
      const style = this.availableWallpaperStyles.find(s => s.id === styleId)
      return style ? style.name : 'Por defecto'
    },

    getAnimationSpeedLabel(speedId) {
      const speed = this.availableAnimationSpeeds.find(s => s.id === speedId)
      return speed ? speed.name : 'Normal'
    },

    playSound(url) {
      if (url) {
        const audio = new Audio(url)
        audio.volume = 0.3
        audio.play().catch(() => {})
      }
    },

    resetSettings() {
      if (confirm(this.t('settings.general.resetConfirm') || '¿Restablecer todas las configuraciones a los valores predeterminados?')) {
        const defaultSettings = {
          brightness: 75,
          volume: 60,
          wifi: true,
          bluetooth: false,
          airplane: false,
          dnd: false,
          flashlight: false,
          darkMode: true,
          autoLock: "2 minutos",
          faceId: true,
          fontFamily: "system",
          fontSize: "medium",
          notificationSound: 'default',
          clickSound: 'default',
          customNotificationUrl: '',
          customClickUrl: '',
          wallpaperStyle: 'default',
          iconStyle: 'default',
          animationSpeed: 'normal',
          accentColor: 'blue',
          borderRadius: 'medium',
          profileName: this.t('settings.profile.defaultUser') || 'Usuario',
          profileAvatar: './assets/avatars/default.svg'
        }
        
        Object.keys(this.tempSettings).forEach(key => {
          if (defaultSettings[key] !== undefined) {
            this.tempSettings[key] = defaultSettings[key]
          }
        })
        
        this.tempProfile.name = defaultSettings.profileName
        this.tempProfile.avatar = defaultSettings.profileAvatar
        
        Object.entries(defaultSettings).forEach(([key, value]) => {
          this.$emit('update-setting', key, value)
        })
        
        this.$emit('update-profile', {
          name: defaultSettings.profileName,
          avatar: defaultSettings.profileAvatar
        })
        
        this.goBack()
        
        setTimeout(() => {
          this.showNotification('Configuraciones restablecidas correctamente', 'success')
        }, 100)
      }
    },
    
    showNotification(message, type = 'info') {
      console.log(`[${type.toUpperCase()}] ${message}`)
    }
  },

  template: `
    <div class="app-container h-full flex flex-col overflow-hidden" :class="themeClasses.container">
      
      <div class="sticky top-0 z-20 flex-shrink-0" :class="[themeClasses.header]">
        <div class="flex items-center justify-between px-6 pt-3 pb-1">
          <div class="flex items-center space-x-1">
            <span class="text-sm font-semibold">{{ currentTime }}</span>
          </div>
          
          <div class="flex items-center space-x-1">
            <div class="flex items-center space-x-1">
              <div class="w-1 h-2 bg-current rounded-full"></div>
              <div class="w-1 h-3 bg-current rounded-full"></div>
              <div class="w-1 h-4 bg-current rounded-full"></div>
              <div class="w-1 h-4 bg-current rounded-full opacity-30"></div>
            </div>
            
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
            </svg>
            
            <div class="flex items-center">
              <div class="w-6 h-3 border border-current rounded-sm relative">
                <div class="absolute inset-0.5 bg-current rounded-sm" :style="{width: (userSettings.battery || 85) + '%'}"></div>
              </div>
              <div class="w-0.5 h-1.5 bg-current rounded-r-full ml-px"></div>
            </div>
          </div>
        </div>
        
        <div class="flex items-center justify-between px-4 pb-4">
          <button v-if="currentSection" @click="goBack" class="flex items-center text-blue-500 text-lg font-medium">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
            {{ t('common.back') }}
          </button>
          <div v-else class="w-16"></div>
          
          <h1 class="text-xl font-bold text-center flex-1">
            {{ currentSection ? currentSection.name : t('settings.title') }}
          </h1>
          
          <button v-if="!currentSection" @click="$emit('close')" class="text-blue-500 text-lg font-medium">
            {{ t('common.done') }}
          </button>
          <div v-else class="w-16"></div>
        </div>
      </div>

      
      <div v-if="!currentSection" class="flex-1 overflow-y-auto pb-8 scrollbar-hide">
        
        <div class="p-4">
          <button @click="openSection({ id: 'profile-header', action: 'navigate' })" class="w-full flex items-center p-4 rounded-xl transition-colors" :class="[themeClasses.card, themeClasses.cardHover]">
            <img :src="tempProfile.avatar" class="w-16 h-16 rounded-full mr-4 object-cover">
            <div class="text-left">
                <div class="font-semibold text-xl">{{ tempProfile.name }}</div>
                <div class="text-sm" :class="themeClasses.textSecondary">{{ t('settings.profile.description') }}</div>
            </div>
            <svg class="w-5 h-5 ml-auto" :class="themeClasses.textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        
        <div v-for="category in settingsCategories" :key="category.id" class="px-4 mb-6">
          <div class="rounded-xl overflow-hidden" :class="themeClasses.card">
            <button
              v-for="(item, index) in category.items"
              :key="item.id"
              @click="openSection(item)"
              class="w-full flex items-center p-3 transition-colors"
              :class="[
                index !== category.items.length - 1 ? themeClasses.border + ' border-b' : '',
                item.danger ? 'text-red-500' : '',
                themeClasses.cardHover
              ]"
            >
              <div class="flex items-center flex-1">
                
                <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-4" :class="item.iconBgColor || 'bg-gray-400'">
                  <svg class="w-5 h-5 text-white">
                    <use :href="'#icon-' + item.icon"></use>
                  </svg>
                </div>
                
                <div class="text-left">
                  <div class="font-medium" :class="item.danger ? 'text-red-500' : ''">{{ item.name }}</div>
                </div>
              </div>

              <div class="flex items-center ml-4">
                <div v-if="item.subtitle" class="text-sm mr-2" :class="themeClasses.textSecondary">{{ item.subtitle }}</div>

                
                <div v-if="item.type === 'toggle'">
                  <div class="relative inline-block w-12 h-6" @click.stop="toggleSetting(item.setting, item.value)">
                    <div
                      class="w-12 h-7 rounded-full transition-colors duration-300"
                      :class="[item.value ? 'bg-green-500' : themeClasses.slider]"
                    ></div>
                    <div
                      class="absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-300"
                      :class="item.value ? 'translate-x-5' : ''"
                    ></div>
                  </div>
                </div>
                
                
                <svg v-else class="w-5 h-5" :class="themeClasses.textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'brightness'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="rounded-xl p-4 mt-4" :class="themeClasses.card">
          <div class="flex items-center space-x-3">
              <svg class="w-6 h-6" :class="themeClasses.textSecondary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.636 5.636a9 9 0 000 12.728M18.364 5.636a9 9 0 010 12.728M12 18a6 6 0 100-12 6 6 0 000 12zM12 8a4 4 0 110 8 4 4 0 010-8z" />
              </svg>
              <input
                  type="range"
                  :value="userSettings.brightness"
                  @input="updateBrightness($event.target.value)"
                  min="0"
                  max="100"
                  class="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  :class="themeClasses.slider"
              />
              <svg class="w-8 h-8" :class="themeClasses.textSecondary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 18a6 6 0 100-12 6 6 0 000 12z" />
              </svg>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'text-size'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="space-y-4 mt-4">
          <div
            v-for="size in ['small', 'medium', 'large']"
            :key="size"
            @click="updateFontSize(size)"
            class="rounded-xl p-4 cursor-pointer transition-colors"
            :class="[
              themeClasses.card,
              themeClasses.cardHover,
              tempSettings.fontSize === size ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium" :class="{
                  'text-sm': size === 'small',
                  'text-base': size === 'medium',
                  'text-lg': size === 'large'
                }">
                  {{ getFontSizeLabel(size) }}
                </h3>
                <p class="mt-2" :class="[
                  themeClasses.textSecondary,
                  {
                    'text-xs': size === 'small',
                    'text-sm': size === 'medium', 
                    'text-base': size === 'large'
                  }
                ]">
                  {{ t('settings.display.fontSize.preview') }}
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <svg class="text-blue-400" :class="{
                  'w-4 h-4': size === 'small',
                  'w-5 h-5': size === 'medium',
                  'w-6 h-6': size === 'large'
                }" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.5 4v3h5v12h3V7h5V4h-13zm17.5 8v-2h-5v2h1.5v6h2v-6h1.5z"/>
                </svg>
                <svg v-if="tempSettings.fontSize === size" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'font-family'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="space-y-4 mt-4">
          <div
            v-for="font in availableFonts"
            :key="font.id"
            @click="updateFontFamily(font.id)"
            @mouseenter="previewFont(font.id)"
            class="rounded-xl p-4 cursor-pointer transition-colors"
            :class="[
              themeClasses.card,
              themeClasses.cardHover,
              tempSettings.fontFamily === font.id ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium" :style="{ fontFamily: font.family }">
                  {{ font.name }}
                </h3>
                <p class="mt-2 text-sm" :class="themeClasses.textSecondary" :style="{ fontFamily: font.family }">
                  {{ t('fontFamily.' + font.category) || t('settings.display.fontSize.preview') }}
                </p>
              </div>
              <svg v-if="tempSettings.fontFamily === font.id" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'accent-color'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="space-y-4 mt-4">
          <div
            v-for="color in availableAccentColors"
            :key="color.id"
            @click="updateAccentColor(color.id)"
            class="rounded-xl p-4 cursor-pointer transition-colors"
            :class="[
              themeClasses.card,
              themeClasses.cardHover,
              tempSettings.accentColor === color.id ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div
                  class="w-8 h-8 rounded-full"
                  :style="{ backgroundColor: color.value }"
                ></div>
                <div>
                  <h3 class="font-medium">{{ color.name }}</h3>
                  <p class="text-sm" :class="themeClasses.textSecondary">
                    {{ color.description }}
                  </p>
                </div>
              </div>
              <svg v-if="tempSettings.accentColor === color.id" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'border-radius'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="space-y-4 mt-4">
          <div
            v-for="radius in availableBorderRadius"
            :key="radius.id"
            @click="updateBorderRadius(radius.id)"
            class="rounded-xl p-4 cursor-pointer transition-colors"
            :class="[
              themeClasses.card,
              themeClasses.cardHover,
              tempSettings.borderRadius === radius.id ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div
                  class="w-12 h-8 bg-blue-500"
                  :style="{ borderRadius: radius.preview }"
                ></div>
                <div>
                  <h3 class="font-medium">{{ radius.name }}</h3>
                  <p class="text-sm" :class="themeClasses.textSecondary">
                    {{ radius.description }}
                  </p>
                </div>
              </div>
              <svg v-if="tempSettings.borderRadius === radius.id" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'wallpaper-style'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="space-y-4 mt-4">
          <div
            v-for="style in availableWallpaperStyles"
            :key="style.id"
            @click="updateWallpaperStyle(style.id)"
            class="rounded-xl p-4 cursor-pointer transition-colors"
            :class="[
              themeClasses.card,
              themeClasses.cardHover,
              tempSettings.wallpaperStyle === style.id ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div
                  class="w-12 h-8 rounded border-2 border-gray-300"
                  :style="{ 
                    backgroundImage: style.preview,
                    backgroundSize: style.size,
                    backgroundRepeat: style.repeat,
                    backgroundPosition: style.position
                  }"
                ></div>
                <div>
                  <h3 class="font-medium">{{ style.name }}</h3>
                  <p class="text-sm" :class="themeClasses.textSecondary">
                    {{ style.description }}
                  </p>
                </div>
              </div>
              <svg v-if="tempSettings.wallpaperStyle === style.id" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'animation-speed'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="space-y-4 mt-4">
          <div
            v-for="speed in availableAnimationSpeeds"
            :key="speed.id"
            @click="updateAnimationSpeed(speed.id)"
            class="rounded-xl p-4 cursor-pointer transition-colors"
            :class="[
              themeClasses.card,
              themeClasses.cardHover,
              tempSettings.animationSpeed === speed.id ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="relative w-12 h-8 bg-gray-200 rounded overflow-hidden">
                  <div
                    class="absolute top-0 left-0 h-full bg-blue-500 rounded animate-pulse"
                    :style="{ 
                      width: '30%',
                      animationDuration: speed.duration + 's'
                    }"
                  ></div>
                </div>
                <div>
                  <h3 class="font-medium">{{ speed.name }}</h3>
                  <p class="text-sm" :class="themeClasses.textSecondary">
                    {{ speed.description }}
                  </p>
                </div>
              </div>
              <svg v-if="tempSettings.animationSpeed === speed.id" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'notification-sounds'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="space-y-4 mt-4">
          <div
            v-for="sound in defaultSounds"
            :key="sound.id"
            @click="updateSoundSetting('notificationSound', sound.id)"
            class="rounded-xl p-4 cursor-pointer transition-colors flex items-center justify-between"
            :class="[
              themeClasses.card,
              themeClasses.cardHover,
              tempSettings.notificationSound === sound.id ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <span class="font-medium">{{ sound.name }}</span>
            <div class="flex items-center">
              <button
                v-if="sound.url"
                @click.stop="playSound(sound.url)"
                class="mr-3 p-2 bg-blue-500 rounded-full"
              >
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <svg v-if="tempSettings.notificationSound === sound.id" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'click-sounds'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="space-y-4 mt-4">
          <div
            v-for="sound in defaultSounds"
            :key="sound.id"
            @click="updateSoundSetting('clickSound', sound.id)"
            class="rounded-xl p-4 cursor-pointer transition-colors flex items-center justify-between"
            :class="[
              themeClasses.card,
              themeClasses.cardHover,
              tempSettings.clickSound === sound.id ? 'ring-2 ring-blue-500' : ''
            ]"
          >
            <span class="font-medium">{{ sound.name }}</span>
            <div class="flex items-center">
              <button
                v-if="sound.url"
                @click.stop="playSound(sound.url)"
                class="mr-3 p-2 bg-blue-500 rounded-full"
              >
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <svg v-if="tempSettings.clickSound === sound.id" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'reset'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        <div class="rounded-xl p-6 mt-4 text-center" :class="themeClasses.card">
          <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          
          <h3 class="text-xl font-bold mb-2">{{ t('settings.general.reset') }}</h3>
          <p class="mb-6" :class="themeClasses.textSecondary">{{ t('settings.general.resetDescription') }}</p>
          
          <button
            @click="resetSettings"
            class="bg-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
          >
            {{ t('settings.general.resetConfirm') }}
          </button>
        </div>
      </div>

      
      <div v-else-if="currentSection.id === 'profile-info'" class="flex-1 overflow-y-auto p-4 scrollbar-hide">
        
        <div v-if="!showProfileEdit" class="text-center">
          <div class="rounded-xl p-6 mt-4" :class="themeClasses.card">
            <img :src="tempProfile.avatar" :alt="tempProfile.name" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover">
            <h3 class="text-2xl font-bold mb-2">{{ tempProfile.name }}</h3>
            <p class="mb-6" :class="themeClasses.textSecondary">{{ t('settings.profile.description') }}</p>
            
            <button @click="openProfileEdit" class="bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
              {{ t('settings.profile.edit') }}
            </button>
          </div>
        </div>

        
        <div v-else class="space-y-6 mt-4">
          
          <div class="rounded-xl p-6" :class="themeClasses.card">
            <h4 class="text-lg font-semibold mb-4">{{ t('settings.profile.avatar') }}</h4>
            
            <div class="grid grid-cols-3 gap-4 mb-4">
              <button
                v-for="avatar in defaultAvatars"
                :key="avatar"
                @click="selectAvatar(avatar)"
                class="relative"
              >
                <img :src="avatar" :alt="'Avatar'" class="w-20 h-20 rounded-full object-cover hover:scale-110 transition-transform"
                     :class="tempProfile.avatar === avatar ? 'ring-4 ring-blue-500' : ''">
                <svg v-if="tempProfile.avatar === avatar" class="absolute -top-2 -right-2 w-6 h-6 text-blue-500 bg-white rounded-full" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
                </svg>
              </button>
            </div>

            
            <div v-if="!showCustomImageInput">
              <button @click="openCustomImageInput" class="w-full py-3 border-2 border-dashed rounded-xl transition-colors" :class="[themeClasses.border, 'hover:border-blue-500 hover:text-blue-500', themeClasses.textSecondary]">
                {{ t('settings.profile.customImage') }}
              </button>
            </div>
            
            <div v-else class="space-y-3">
              <input
                v-model="customImageUrl"
                type="url"
                :placeholder="t('settings.profile.imageUrl')"
                class="w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="themeClasses.input"
              >
              <div class="flex gap-3">
                <button @click="saveCustomImage" class="flex-1 bg-blue-500 text-white py-2 rounded-xl font-semibold">
                  {{ t('common.save') }}
                </button>
                <button @click="showCustomImageInput = false; customImageUrl = ''" class="flex-1 py-2 rounded-xl" :class="themeClasses.buttonSecondary">
                  {{ t('common.cancel') }}
                </button>
              </div>
            </div>
          </div>

          
          <div class="rounded-xl p-6" :class="themeClasses.card">
            <h4 class="text-lg font-semibold mb-4">{{ t('settings.profile.name') }}</h4>
            <input
              v-model="tempProfile.name"
              type="text"
              :placeholder="t('settings.profile.namePlaceholder')"
              class="w-full p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="themeClasses.input"
            >
          </div>

          
          <button @click="saveProfile" class="w-full bg-green-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-600 transition-colors">
            {{ t('settings.profile.save') }}
          </button>
        </div>
      </div>
    </div>
  `
}