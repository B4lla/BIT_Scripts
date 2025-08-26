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
        name: this.userSettings?.profileName || this.t('profile.defaultUser'),
        avatar: this.userSettings?.profileAvatar || "./assets/avatars/default1.jpg",
      },
      
      
      defaultAvatars: [
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
        fontSize: this.userSettings?.fontSize || 'medium'
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
        { id: 'system', name: 'Sistema (SF Pro Display)', family: 'var(--font-sf-pro-display)' },
        { id: 'inter', name: 'Inter', family: 'var(--font-inter)' },
        { id: 'roboto', name: 'Roboto', family: 'var(--font-roboto)' },
        { id: 'poppins', name: 'Poppins', family: 'var(--font-poppins)' },
        { id: 'playfair', name: 'Playfair Display', family: 'var(--font-playfair)' },
        { id: 'crimson', name: 'Crimson Text', family: 'var(--font-crimson)' },
        { id: 'dancing', name: 'Dancing Script', family: 'var(--font-dancing)' },
        { id: 'pacifico', name: 'Pacifico', family: 'var(--font-pacifico)' },
        { id: 'caveat', name: 'Caveat', family: 'var(--font-caveat)' },
        { id: 'bangers', name: 'Bangers', family: 'var(--font-bangers)' },
        { id: 'orbitron', name: 'Orbitron', family: 'var(--font-orbitron)' },
        { id: 'fredoka', name: 'Fredoka One', family: 'var(--font-fredoka)' },
        { id: 'abril', name: 'Abril Fatface', family: 'var(--font-abril)' },
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
              iconBgColor: 'bg-teal-500',
              action: 'navigate'
            },
            {
              id: 'text-size',
              name: this.t('settings.display.textSize'),
              subtitle: this.getFontSizeLabel(this.tempSettings.fontSize),
              icon: 'type',
              iconBgColor: 'bg-gray-500',
              action: 'navigate'
            },
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
        // Special case to navigate to profile info from the top card
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
    },

    previewFont(fontId) {
      
      const phoneContainer = document.querySelector('.iphone-container')
      if (phoneContainer) {
        this.availableFonts.forEach(font => {
          phoneContainer.classList.remove(font.cssClass)
        })
        const selectedFont = this.availableFonts.find(f => f.id === fontId)
        if (selectedFont) {
          phoneContainer.classList.add(selectedFont.cssClass)
        }
      }
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

    playSound(url) {
      if (url) {
        const audio = new Audio(url)
        audio.volume = 0.3
        audio.play().catch(() => {})
      }
    },

    resetSettings() {
      if (confirm(this.t('settings.general.resetConfirm'))) {
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
          clickSound: 'default'
        }
        
        Object.entries(defaultSettings).forEach(([key, value]) => {
          this.$emit('update-setting', key, value)
        })
        
        this.goBack()
      }
    }
  },

  template: `
    <div class="app-container h-full flex flex-col overflow-hidden" :class="themeClasses.container">
      
      <div class="sticky top-0 z-20 backdrop-blur-md flex-shrink-0" :class="[themeClasses.header, 'border-b']">
        <div class="flex items-center justify-between p-4 pt-16">
          <button v-if="currentSection" @click="goBack" class="flex items-center text-blue-500 text-lg">
            <svg class="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            {{ t('common.back') }}
          </button>
          <h1 class="text-xl font-bold flex-1 text-center pr-6">
            {{ currentSection ? currentSection.name : t('settings.title') }}
          </h1>
          <button v-if="!currentSection" @click="$emit('close')" class="text-blue-500 text-lg">
            {{ t('common.done') }}
          </button>
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
              <svg v-if="tempSettings.fontSize === size" class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
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