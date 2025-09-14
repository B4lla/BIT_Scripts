const Translator = {
  props: [
    "userSettings",
    "t",
  ],
  emits: ["close"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted, nextTick } = Vue;
    
    const sourceText = ref('')
    const translatedText = ref('')
    const sourceLang = ref('en')
    const targetLang = ref('es')
    const isTranslating = ref(false)
    const showSourceDropdown = ref(false)
    const showTargetDropdown = ref(false)
    const recentTranslations = ref([])
    const currentView = ref('translator') 

    const languages = ref([
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
      { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
      { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
      { code: 'da', name: 'Dansk', flag: '🇩🇰' },
      { code: 'no', name: 'Norsk', flag: '🇳🇴' },
      { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
      { code: 'pl', name: 'Polski', flag: '🇵🇱' },
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
      { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    ])

    
    const sampleTexts = {
      'en': 'Hello, how are you today?',
      'es': 'Hola, ¿cómo estás hoy?',
      'fr': 'Bonjour, comment allez-vous aujourd\'hui?',
      'de': 'Hallo, wie geht es dir heute?',
      'it': 'Ciao, come stai oggi?',
      'pt': 'Olá, como você está hoje?',
      'ru': 'Привет, как дела сегодня?',
      'ja': 'こんにちは、今日はいかがですか？',
      'ko': '안녕하세요, 오늘 어떠세요?',
      'zh': '你好，你今天怎么样？',
      'ar': 'مرحبا، كيف حالك اليوم؟',
      'hi': 'नमस्ते, आज आप कैसे हैं?',
      'nl': 'Hallo, hoe gaat het vandaag?',
      'sv': 'Hej, hur mår du idag?',
      'da': 'Hej, hvordan har du det i dag?',
      'no': 'Hei, hvordan har du det i dag?',
      'fi': 'Hei, mitä kuuluu tänään?',
      'pl': 'Cześć, jak się masz dzisiaj?',
      'tr': 'Merhaba, bugün nasılsın?',
      'th': 'สวัสดี วันนี้เป็นอย่างไรบ้าง?'
    }

    
    const sourceLanguage = computed(() => 
      languages.value.find(lang => lang.code === sourceLang.value)
    )

    const targetLanguage = computed(() => 
      languages.value.find(lang => lang.code === targetLang.value)
    )

    const filteredSourceLanguages = computed(() =>
      languages.value.filter(lang => lang.code !== targetLang.value)
    )

    const filteredTargetLanguages = computed(() =>
      languages.value.filter(lang => lang.code !== sourceLang.value)
    )

    const canTranslate = computed(() => 
      sourceText.value.trim().length > 0 && sourceLang.value !== targetLang.value
    )

    
    const translate = async () => {
      if (!canTranslate.value) return
      isTranslating.value = true
      try {
        const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + sourceLang.value + "&tl=" + targetLang.value + "&dt=t&q=" + encodeURIComponent(sourceText.value)
        const response = await fetch(url)
        const data = await response.json()
        const translation = Array.isArray(data) && data[0]
          ? data[0].map(segment => segment[0]).join('')
          : ''
        translatedText.value = translation
        const newTranslation = {
          id: Date.now(),
          source: sourceText.value,
          target: translation,
          sourceLang: sourceLang.value,
          targetLang: targetLang.value,
          timestamp: new Date().toLocaleString('es-ES')
        }
        recentTranslations.value.unshift(newTranslation)
        if (recentTranslations.value.length > 20) {
          recentTranslations.value = recentTranslations.value.slice(0, 20)
        }
      } catch (error) {
        console.error('Translation error:', error)
        translatedText.value = props.t('translator.errorTranslating', 'Error al traducir. Inténtalo de nuevo.')
      } finally {
        isTranslating.value = false
      }
    }

    const swapLanguages = () => {
      const tempLang = sourceLang.value
      const tempText = sourceText.value
      
      sourceLang.value = targetLang.value
      targetLang.value = tempLang
      
      sourceText.value = translatedText.value
      translatedText.value = tempText
    }

    const selectSourceLanguage = (lang) => {
      sourceLang.value = lang.code
      showSourceDropdown.value = false
      if (targetLang.value === lang.code) {
        targetLang.value = sourceLang.value === 'en' ? 'es' : 'en'
      }
    }

    const selectTargetLanguage = (lang) => {
      targetLang.value = lang.code
      showTargetDropdown.value = false
      if (sourceLang.value === lang.code) {
        sourceLang.value = targetLang.value === 'en' ? 'es' : 'en'
      }
    }

    const clearText = () => {
      sourceText.value = ''
      translatedText.value = ''
    }

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text)
        
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }

    const loadSampleText = () => {
      sourceText.value = sampleTexts[sourceLang.value] || 'Hello, how are you today?'
    }

    const deleteTranslation = (id) => {
      recentTranslations.value = recentTranslations.value.filter(t => t.id !== id)
    }

    const reuseTranslation = (translation) => {
      sourceText.value = translation.source
      translatedText.value = translation.target
      sourceLang.value = translation.sourceLang
      targetLang.value = translation.targetLang
      currentView.value = 'translator'
    }

    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.language-dropdown')) {
        showSourceDropdown.value = false
        showTargetDropdown.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      isTranslating,
      showSourceDropdown,
      showTargetDropdown,
      recentTranslations,
      currentView,
      languages,
      sourceLanguage,
      targetLanguage,
      filteredSourceLanguages,
      filteredTargetLanguages,
      canTranslate,
      translate,
      swapLanguages,
      selectSourceLanguage,
      selectTargetLanguage,
      clearText,
      copyToClipboard,
      loadSampleText,
      deleteTranslation,
      reuseTranslation
    }
  },
  template: `
    <div class="translator-app h-full w-full flex flex-col overflow-hidden"
         :class="userSettings.darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-b from-purple-50 to-white text-gray-900'">

      
      <header class="relative backdrop-blur-md border-b bg-black/20 border-white/10">        
        <div class="relative flex items-center justify-between p-4 pt-16">
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-green-600">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                </svg>
              </div>
              <div>
                <h1 class="text-xl font-bold text-white">
                  {{ t('translator.title', 'Traductor') }}
                </h1>
                <p class="text-xs text-white/60">{{ t('translator.subtitle', 'Traduce cualquier texto') }}</p>
              </div>
            </div>
          </div>
          
          
          <div class="flex items-center space-x-2">
            <button @click="currentView = 'translator'"
                    :class="currentView === 'translator' ? 'bg-green-600 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'"
                    class="px-4 py-2 rounded-lg transition-all text-sm flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
              </svg>
              <span>Traductor</span>
            </button>
            
            <button @click="currentView = 'history'"
                    :class="currentView === 'history' ? 'bg-green-600 text-white shadow-lg' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'"
                    class="px-4 py-2 rounded-lg transition-all text-sm flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Historial</span>
            </button>
          </div>
          
          <button @click="$emit('close')" 
                  class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </header>

      
      <main class="flex-1 overflow-hidden">
        
        
        <div v-if="currentView === 'translator'" class="h-full flex flex-col">
          
          
          <div class="p-4 space-y-4">
            <div class="flex items-center space-x-4">
              
              
              <div class="flex-1 relative language-dropdown">
                <button @click="showSourceDropdown = !showSourceDropdown"
                        class="w-full p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] flex items-center justify-between"
                        :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50 text-white' : 'bg-white/80 border-gray-200/50 text-gray-900 shadow-sm'">
                  <div class="flex items-center space-x-3">
                    <span class="text-2xl">{{ sourceLanguage.flag }}</span>
                    <div class="text-left">
                      <p class="font-semibold">{{ sourceLanguage.name }}</p>
                      <p class="text-xs opacity-70">{{ t('translator.sourceLanguage', 'Idioma origen') }}</p>
                    </div>
                  </div>
                  <svg class="w-5 h-5 transition-transform duration-200" 
                       :class="showSourceDropdown ? 'rotate-180' : ''"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                
                <div v-if="showSourceDropdown" 
                     class="absolute top-full left-0 right-0 mt-2 rounded-2xl backdrop-blur-xl border shadow-2xl z-50 max-h-64 overflow-y-auto"
                     :class="userSettings.darkMode ? 'bg-gray-800/95 border-gray-700/50' : 'bg-white/95 border-gray-200/50'">
                  <div class="p-2">
                    <button v-for="lang in filteredSourceLanguages"
                            :key="lang.code"
                            @click="selectSourceLanguage(lang)"
                            class="w-full p-3 rounded-xl transition-all duration-200 flex items-center space-x-3 hover:scale-[1.02]"
                            :class="userSettings.darkMode ? 'hover:bg-gray-700/60 text-white' : 'hover:bg-gray-50 text-gray-900'">
                      <span class="text-xl">{{ lang.flag }}</span>
                      <span class="font-medium">{{ lang.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              
              <button @click="swapLanguages"
                      class="p-4 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:rotate-180"
                      :class="userSettings.darkMode ? 'bg-gray-800/60 text-purple-400 hover:bg-purple-500/20' : 'bg-white/80 text-purple-600 hover:bg-purple-50 shadow-sm'">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
              </button>
              
              
              <div class="flex-1 relative language-dropdown">
                <button @click="showTargetDropdown = !showTargetDropdown"
                        class="w-full p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] flex items-center justify-between"
                        :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50 text-white' : 'bg-white/80 border-gray-200/50 text-gray-900 shadow-sm'">
                  <div class="flex items-center space-x-3">
                    <span class="text-2xl">{{ targetLanguage.flag }}</span>
                    <div class="text-left">
                      <p class="font-semibold">{{ targetLanguage.name }}</p>
                      <p class="text-xs opacity-70">{{ t('translator.targetLanguage', 'Idioma destino') }}</p>
                    </div>
                  </div>
                  <svg class="w-5 h-5 transition-transform duration-200" 
                       :class="showTargetDropdown ? 'rotate-180' : ''"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                
                <div v-if="showTargetDropdown" 
                     class="absolute top-full left-0 right-0 mt-2 rounded-2xl backdrop-blur-xl border shadow-2xl z-50 max-h-64 overflow-y-auto"
                     :class="userSettings.darkMode ? 'bg-gray-800/95 border-gray-700/50' : 'bg-white/95 border-gray-200/50'">
                  <div class="p-2">
                    <button v-for="lang in filteredTargetLanguages"
                            :key="lang.code"
                            @click="selectTargetLanguage(lang)"
                            class="w-full p-3 rounded-xl transition-all duration-200 flex items-center space-x-3 hover:scale-[1.02]"
                            :class="userSettings.darkMode ? 'hover:bg-gray-700/60 text-white' : 'hover:bg-gray-50 text-gray-900'">
                      <span class="text-xl">{{ lang.flag }}</span>
                      <span class="font-medium">{{ lang.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          <div class="flex-1 p-4 space-y-4">
            
            
            <div class="relative">
              <div class="rounded-2xl backdrop-blur-sm border overflow-hidden"
                   :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200/50 shadow-sm'">
                <div class="p-4 border-b" :class="userSettings.darkMode ? 'border-gray-700/50' : 'border-gray-200/50'">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                      {{ t('translator.sourceText', 'Texto origen') }}
                    </span>
                    <div class="flex space-x-2">
                      <button @click="loadSampleText"
                              class="px-3 py-1 rounded-lg text-xs transition-all duration-200 hover:scale-105"
                              :class="userSettings.darkMode ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
                        {{ t('translator.sample', 'Ejemplo') }}
                      </button>
                      <button @click="clearText"
                              class="px-3 py-1 rounded-lg text-xs transition-all duration-200 hover:scale-105"
                              :class="userSettings.darkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'">
                        {{ t('translator.clear', 'Limpiar') }}
                      </button>
                    </div>
                  </div>
                </div>
                
                <textarea v-model="sourceText"
                          :placeholder="t('translator.enterText', 'Introduce el texto a traducir...')"
                          class="w-full h-32 p-4 bg-transparent resize-none focus:outline-none"
                          :class="userSettings.darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'">
                </textarea>
                
                <div class="p-4 border-t flex justify-between items-center"
                     :class="userSettings.darkMode ? 'border-gray-700/50' : 'border-gray-200/50'">
                  <span class="text-sm" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                    {{ sourceText.length }} {{ t('translator.characters', 'caracteres') }}
                  </span>
                  <button v-if="sourceText"
                          @click="copyToClipboard(sourceText)"
                          class="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                          :class="userSettings.darkMode ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            
            <div class="flex justify-center">
              <button @click="translate"
                      :disabled="!canTranslate || isTranslating"
                      class="px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center space-x-3 shadow-xl text-white"
                      :class="canTranslate && !isTranslating 
                        ? 'bg-green-600 hover:bg-green-700 hover:scale-105 hover:shadow-2xl' 
                        : 'bg-gray-500 cursor-not-allowed'">
                <svg v-if="isTranslating" class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                </svg>
                <span>{{ isTranslating ? t('translator.translating', 'Traduciendo...') : t('translator.translate', 'Traducir') }}</span>
              </button>
            </div>

            
            <div class="relative">
              <div class="rounded-2xl backdrop-blur-sm border overflow-hidden"
                   :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200/50 shadow-sm'">
                <div class="p-4 border-b" :class="userSettings.darkMode ? 'border-gray-700/50' : 'border-gray-200/50'">
                  <span class="font-semibold" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-700'">
                    {{ t('translator.translatedText', 'Texto traducido') }}
                  </span>
                </div>
                
                <div class="h-32 p-4 flex items-start">
                  <div v-if="isTranslating" class="w-full flex items-center justify-center h-full">
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                      <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                      <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                  </div>
                  <p v-else-if="translatedText" 
                     class="w-full leading-relaxed"
                     :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                    {{ translatedText }}
                  </p>
                  <p v-else 
                     class="w-full italic"
                     :class="userSettings.darkMode ? 'text-gray-500' : 'text-gray-400'">
                    {{ t('translator.translationWillAppear', 'La traducción aparecerá aquí...') }}
                  </p>
                </div>
                
                <div v-if="translatedText" 
                     class="p-4 border-t flex justify-between items-center"
                     :class="userSettings.darkMode ? 'border-gray-700/50' : 'border-gray-200/50'">
                  <span class="text-sm" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                    {{ translatedText.length }} {{ t('translator.characters', 'caracteres') }}
                  </span>
                  <button @click="copyToClipboard(translatedText)"
                          class="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                          :class="userSettings.darkMode ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div v-if="currentView === 'history'" class="h-full flex flex-col">
          <div class="p-4">
            <h2 class="text-xl font-bold mb-4" :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
              {{ t('translator.recentTranslations', 'Traducciones recientes') }}
            </h2>
            
            <div v-if="recentTranslations.length === 0" 
                 class="text-center py-12">
              <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p class="text-lg font-medium mb-2" :class="userSettings.darkMode ? 'text-gray-300' : 'text-gray-600'">
                {{ t('translator.noHistory', 'No hay traducciones recientes') }}
              </p>
              <p class="text-sm" :class="userSettings.darkMode ? 'text-gray-500' : 'text-gray-400'">
                {{ t('translator.noHistoryDescription', 'Las traducciones aparecerán aquí una vez que comiences a usar el traductor') }}
              </p>
            </div>
            
            <div v-else class="space-y-3">
              <div v-for="translation in recentTranslations"
                   :key="translation.id"
                   class="rounded-2xl backdrop-blur-sm border overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                   :class="userSettings.darkMode ? 'bg-gray-800/60 border-gray-700/50 hover:border-purple-500/50' : 'bg-white/80 border-gray-200/50 hover:border-purple-400/50 shadow-sm'"
                   @click="reuseTranslation(translation)">
                
                <div class="p-4">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-2">
                      <span class="text-lg">{{ languages.find(l => l.code === translation.sourceLang)?.flag }}</span>
                      <svg class="w-4 h-4" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      <span class="text-lg">{{ languages.find(l => l.code === translation.targetLang)?.flag }}</span>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                      <span class="text-xs" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                        {{ translation.timestamp }}
                      </span>
                      <button @click.stop="deleteTranslation(translation.id)"
                              class="p-1 rounded-lg transition-all duration-200 hover:scale-110"
                              :class="userSettings.darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    <div class="p-3 rounded-xl" :class="userSettings.darkMode ? 'bg-gray-700/40' : 'bg-gray-50'">
                      <p class="text-sm font-medium" :class="userSettings.darkMode ? 'text-white' : 'text-gray-900'">
                        {{ translation.source }}
                      </p>
                    </div>
                    
                    <div class="p-3 rounded-xl" :class="userSettings.darkMode ? 'bg-purple-500/10' : 'bg-purple-50'">
                      <p class="text-sm font-medium" :class="userSettings.darkMode ? 'text-purple-300' : 'text-purple-900'">
                        {{ translation.target }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
}
