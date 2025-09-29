const PhoneSetup = {
	name: "PhoneSetup",
	props: {
		t: {
			type: Function,
			required: true,
		},
		setupData: {
			type: Object,
			required: true,
		},
		wallpapers: {
			type: Array,
			default: () => ["assets/wallpapers/wallpaper1.webp", "assets/wallpapers/wallpaper2.webp", "assets/wallpapers/wallpaper3.webp", "assets/wallpapers/wallpaper4.webp", "assets/wallpapers/wallpaper5.webp"],
		},
		callSounds: {
			type: Array,
			default: () => [
				{ name: "setup.sounds.classic", url: "assets/sounds/calls/1.mp3" },
				{ name: "setup.sounds.modern", url: "assets/sounds/calls/2.mp3" },
				{ name: "Digital", url: "assets/sounds/calls/3.mp3" },
				{ name: "Suave", url: "assets/sounds/calls/4.mp3" },
				{ name: "Vibrante", url: "assets/sounds/calls/5.mp3" },
			],
		},
		notificationSounds: {
			type: Array,
			default: () => [
				{ name: "Ping", url: "assets/sounds/notifications/1.mp3" },
				{ name: "Chime", url: "assets/sounds/notifications/2.mp3" },
				{ name: "Ding", url: "assets/sounds/notifications/3.mp3" },
				{ name: "Pop", url: "assets/sounds/notifications/4.mp3" },
				{ name: "Bell", url: "assets/sounds/notifications/5.mp3" },
			],
		},
	},
	emits: {
		"update-setup": (key, value) => typeof key === "string",
		complete: () => true,
	},
	data() {
		const availableLangs = Object.keys(translations).map((id) => ({
			id,
			name: translations[id]?.language || id,
			flag: id === "es" ? "🇪🇸" : id === "en" ? "🇺🇸" : id === "fr" ? "🇫🇷" : id === "de" ? "🇩🇪" : id === "it" ? "🇮🇹" : "🏳️",
		}));
		return {
			currentStep: 0,
			isAnimating: false,
			profileLinkInput: "",
			predefinedPhotos: [
				// Use free placeholder avatar images (pravatar.cc) when local assets are missing
				// These return consistent avatar images by id (1..70)
				"../../assets/avatars/1.png",
				"../../assets/avatars/2.png",
				"../../assets/avatars/3.png",
				"../../assets/avatars/4.png",
				"../../assets/avatars/5.png",
				"../../assets/avatars/6.png",
			],
			availableLanguages: availableLangs,
			availableFonts: [
				{
					id: "system",
					name: "SF Pro Display",
					category: "system",
					cssClass: "font-system",
					preview: "Fuente del sistema iOS",
				},
				{
					id: "inter",
					name: "Inter",
					category: "modern",
					cssClass: "font-inter",
					preview: "Fuente moderna y legible",
				},
				{
					id: "roboto",
					name: "Roboto",
					category: "modern",
					cssClass: "font-roboto",
					preview: "Fuente limpia de Google",
				},
				{
					id: "poppins",
					name: "Poppins",
					category: "modern",
					cssClass: "font-poppins",
					preview: "Fuente moderna y elegante",
				},
			],
			fontCategories: [
				{ id: "system", name: "Sistema", icon: "📱" },
				{ id: "modern", name: "Modernas", icon: "✨" },
			],
			steps: ["welcome", "language", "appearance", "wallpaper", "profile", "fontFamily", "callSounds", "notificationSounds", "pin", "complete"],
			customCallSound: "",
			customNotificationSound: "",
			currentAudio: null,
		};
	},
	computed: {
		backgroundClasses() {
			return this.setupData.darkMode ? "from-gray-900 via-slate-900 to-black" : "from-gray-50 via-gray-100 to-gray-200";
		},
		textClasses() {
			return this.setupData.darkMode ? "text-white" : "text-gray-900";
		},
		itemClasses() {
			return this.setupData.darkMode ? "bg-white/10 border-white/10 hover:bg-white/20 backdrop-blur-xl" : "bg-white/80 border-white/40 hover:bg-white/90 backdrop-blur-xl shadow-lg";
		},
		currentStepName() {
			return this.steps[this.currentStep];
		},
		isLastSetupStep() {
			return this.currentStep === this.steps.indexOf("pin");
		},
		canContinue() {
			switch (this.currentStepName) {
				case "pin":
					return this.setupData.pin && this.setupData.pin.length === 4;
				case "profile":
					return this.setupData.userName && this.setupData.userName.trim().length > 0;
				default:
					return true;
			}
		},
		progressPercentage() {
			return ((this.currentStep + 1) / this.steps.length) * 100;
		},
	},
	watch: {
		"setupData.wallpaper": {
			handler(newWallpaper) {
				if (newWallpaper) {
					this.applyWallpaper(newWallpaper);
				}
			},
			immediate: true,
		},
		"setupData.fontFamily": {
			handler(newFont) {
				if (newFont) {
					this.applyFont(newFont);
				}
			},
			immediate: true,
		},
	},
	mounted() {
		if (this.setupData.wallpaper) {
			this.applyWallpaper(this.setupData.wallpaper);
		}
		if (this.setupData.fontFamily) {
			this.applyFont(this.setupData.fontFamily);
		}
	},
	beforeUnmount() {
		if (this.currentAudio) {
			this.currentAudio.pause();
			this.currentAudio = null;
		}
	},
	methods: {
		getAssetUrl(path) {
			return path;
		},
		updateSetupData(key, value) {
			this.$emit("update-setup", key, value);
		},
		applyWallpaper(wallpaper) {
			const phoneElement = document.querySelector(".phone-container") || document.querySelector(".phone-app");
			if (phoneElement && wallpaper) {
				phoneElement.style.backgroundImage = `url('${wallpaper}')`;
				phoneElement.style.backgroundSize = "cover";
				phoneElement.style.backgroundPosition = "center";
			}
		},
		applyFont(fontId) {
			const fontValue = this.getFontFamilyValue(fontId);
			const phoneElement = document.querySelector(".phone-container") || document.querySelector(".phone-app") || document.body;
			if (phoneElement) {
				phoneElement.style.fontFamily = fontValue;
			}

			const setupElement = this.$el;
			if (setupElement) {
				setupElement.style.fontFamily = fontValue;
			}
		},
		nextStep() {
			if (!this.canContinue || this.isAnimating) return;
			if (this.currentStepName === "complete") {
				this.completeSetup();
				return;
			}
			this.isAnimating = true;
			setTimeout(() => {
				if (this.currentStep < this.steps.length - 1) {
					this.currentStep++;
				}
				this.isAnimating = false;
			}, 300);
		},
		prevStep() {
			if (this.currentStep === 0 || this.isAnimating) return;
			this.isAnimating = true;
			setTimeout(() => {
				this.currentStep--;
				this.isAnimating = false;
			}, 300);
		},
		completeSetup() {
			setTimeout(() => {
				this.$emit("complete");
			}, 500);
		},
		selectPhoto(photo) {
			const newPhoto = this.setupData.userPhoto === photo ? null : photo;
			this.updateSetupData("userPhoto", newPhoto);
		},
		setPhotoFromLink() {
			if (this.profileLinkInput && this.profileLinkInput.startsWith("http")) {
				this.updateSetupData("userPhoto", this.profileLinkInput);
			}
		},
		addPinDigit(digit) {
			const currentPin = this.setupData.pin || "";
			if (currentPin.length < 4) {
				this.updateSetupData("pin", currentPin + digit);
			}
		},
		removePinDigit() {
			const currentPin = this.setupData.pin || "";
			if (currentPin.length > 0) {
				this.updateSetupData("pin", currentPin.slice(0, -1));
			}
		},
		selectFont(fontId) {
			this.updateSetupData("fontFamily", fontId);
		},
		getFontsByCategory(categoryId) {
			return this.availableFonts.filter((font) => font.category === categoryId);
		},
		getSelectedFont() {
			return this.availableFonts.find((font) => font.id === this.setupData.fontFamily) || this.availableFonts[0];
		},
		getFontFamilyValue(fontId) {
			const font = this.availableFonts.find((f) => f.id === fontId);
			if (!font) return '"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

			switch (fontId) {
				case "system":
					return '"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
				case "inter":
					return '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
				case "roboto":
					return '"Roboto", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
				case "poppins":
					return '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
				default:
					return '"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
			}
		},
		applyFont(fontId) {
			const fontValue = this.getFontFamilyValue(fontId);

			const phoneApp = document.querySelector(".phone-app") || document.querySelector("#phoneApp");
			if (phoneApp) {
				phoneApp.style.fontFamily = fontValue;
			}

			document.documentElement.style.setProperty("--phone-font-family", fontValue);

			let styleElement = document.getElementById("dynamic-phone-fonts");
			if (!styleElement) {
				styleElement = document.createElement("style");
				styleElement.id = "dynamic-phone-fonts";
				document.head.appendChild(styleElement);
			}

			styleElement.innerHTML = `
        .phone-app, .phone-app *, .phone-container, .phone-container * {
          font-family: ${fontValue} !important;
        }
        .font-system { font-family: "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }
        .font-inter { font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }
        .font-roboto { font-family: "Roboto", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }
        .font-poppins { font-family: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important; }
      `;
		},
		previewSound(sound, type) {
			if (this.currentAudio) {
				this.currentAudio.pause();
				this.currentAudio = null;
			}

			try {
				this.currentAudio = new Audio(sound.url);
				this.currentAudio.volume = 0.5;
				this.currentAudio.play();

				if (type === "call") {
					this.updateSetupData("callSound", sound.url);
				} else if (type === "notification") {
					this.updateSetupData("notificationSound", sound.url);
				}
			} catch (e) {
				console.error("Error playing sound:", e);
			}
		},
		setCustomSound(type) {
			const url = type === "call" ? this.customCallSound : this.customNotificationSound;
			if (url && (url.startsWith("http") || url.startsWith("assets/"))) {
				if (type === "call") {
					this.updateSetupData("callSound", url);
				} else if (type === "notification") {
					this.updateSetupData("notificationSound", url);
				}

				try {
					const audio = new Audio(url);
					audio.volume = 0.5;
					audio.play();
				} catch (e) {
					console.error("Error playing custom sound:", e);
				}
			}
		},
	},
	template: `
    <div class="fixed inset-0 z-50 font-sans overflow-hidden" 
         :style="{ 
           fontFamily: getFontFamilyValue(setupData.fontFamily || 'system'),
           backgroundImage: setupData.wallpaper ? 'url(' + setupData.wallpaper + ')' : 'none',
           backgroundSize: 'cover',
           backgroundPosition: 'center'
         }">
      
      
      <div class="absolute inset-0 transition-all duration-1000" 
           :class="setupData.darkMode ? 'bg-black' : 'bg-white'"></div>
      
      
      <div class="absolute top-6 left-1/2 transform -translate-x-1/2 w-36 h-8 bg-black rounded-full z-50"></div>
      
      
      <div class="absolute top-20 left-6 right-6 h-1 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden z-40" 
           v-if="currentStepName !== 'welcome' && currentStepName !== 'complete'">
        <div class="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out" 
             :style="{ width: progressPercentage + '%' }"></div>
      </div>

      <div class="relative h-full flex flex-col z-10">
        
        
        <div class="h-20 px-6 flex items-end pb-4" v-if="currentStep > 0 && currentStepName !== 'complete'">
          <button @click="prevStep" 
                  class="flex items-center text-blue-500 text-lg hover:text-blue-400 transition-all duration-200 hover:scale-105 active:scale-95 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            <span class="ml-2 font-medium">{{ t('common.back') }}</span>
          </button>
        </div>
        <div class="h-20" v-else></div>

        
        
        <div class="flex-1 overflow-hidden">
          <transition name="slide-fade" mode="out-in">
            <div :key="currentStepName" class="h-full flex flex-col px-6">

            
            <div v-if="currentStepName === 'welcome'" class="h-full flex flex-col justify-center items-center text-center animate-fade-in">
              <div class="mb-8 animate-bounce-slow">
                <div class="w-32 h-32 mx-auto bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
              <h1 class="text-6xl font-thin tracking-tight mb-6 animate-slide-up" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t('setup.welcome.title') }}</h1>
              <p class="text-xl font-light max-w-sm animate-slide-up-delay opacity-90" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{ t('setup.welcome.subtitle') }}</p>
            </div>

            
            <div v-else-if="currentStepName === 'language'" class="h-full flex flex-col">
              <h1 class="text-4xl font-light text-center mb-12 pt-8 animate-slide-down" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t('setup.language.title') }}</h1>
              <p class="text-lg text-center mb-8 opacity-80" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{ t('setup.language.description') }}</p>
              <div class="space-y-4 max-w-md mx-auto w-full overflow-y-auto">
                <button 
                  v-for="(lang, index) in availableLanguages" :key="lang.id"
                  @click="updateSetupData('language', lang.id)"
                  class="w-full flex items-center p-5 rounded-3xl border-2 transition-all duration-300 relative transform hover:scale-102 active:scale-98 animate-slide-in"
                  :class="[
                    setupData.darkMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-white/80 border-gray-300 text-gray-900 hover:bg-white/90',
                    setupData.language === lang.id ? 'border-blue-500 shadow-xl ring-4 ring-blue-500/20' : ''
                  ]"
                  :style="{ animationDelay: (index * 0.1) + 's' }"
                >
                  <span class="text-3xl mr-5 flex-shrink-0">{{ lang.flag }}</span>
                  <span class="text-lg font-medium flex-1 text-left flex items-center">{{ lang.name }}</span>
                  <transition name="check-scale">
                    <div v-if="setupData.language === lang.id" class="w-8 h-8 flex items-center justify-center bg-blue-500 rounded-full shadow-lg flex-shrink-0">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                  </transition>
                </button>
              </div>
            </div>

            <div v-else-if="currentStepName === 'appearance'" class="h-full flex flex-col justify-center">
              <h1 class="text-4xl font-light text-center mb-12 animate-slide-down" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t('setup.appearance.title') }}</h1>
              <p class="text-lg text-center mb-8 opacity-80" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{ t('setup.appearance.description') }}</p>
              <div class="grid grid-cols-2 gap-8 max-w-lg mx-auto">
                <button @click="updateSetupData('darkMode', false)" class="text-center group animate-slide-in">
                  <div class="rounded-3xl p-2 border-3 transition-all duration-300 transform group-hover:scale-105 group-active:scale-95" 
                       :class="!setupData.darkMode ? 'border-blue-500 shadow-2xl ring-4 ring-blue-500/20' : 'border-transparent'">
                     <div class="aspect-[9/19.5] bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-inner">
                       <div class="text-6xl">☀️</div>
                     </div>
                  </div>
                  <p class="font-semibold mt-6 text-lg transition-colors duration-300" :class="!setupData.darkMode ? 'text-blue-500' : (setupData.darkMode ? 'text-white' : 'text-gray-900')">{{ t('setup.appearance.light') }}</p>
                </button>
                
                <button @click="updateSetupData('darkMode', true)" class="text-center group animate-slide-in-delay">
                   <div class="rounded-3xl p-2 border-3 transition-all duration-300 transform group-hover:scale-105 group-active:scale-95" 
                        :class="setupData.darkMode ? 'border-blue-500 shadow-2xl ring-4 ring-blue-500/20' : 'border-transparent'">
                     <div class="aspect-[9/19.5] bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center shadow-inner">
                       <div class="text-6xl">🌙</div>
                     </div>
                  </div>
                  <p class="font-semibold mt-6 text-lg transition-colors duration-300" :class="setupData.darkMode ? 'text-blue-500' : (setupData.darkMode ? 'text-white' : 'text-gray-900')">{{ t('setup.appearance.dark') }}</p>
                </button>
              </div>
            </div>

            <div v-else-if="currentStepName === 'wallpaper'" class="h-full flex flex-col">
               <h1 class="text-4xl font-light text-center mb-8 pt-8 animate-slide-down" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t('setup.wallpaper.title') }}</h1>
               <p class="text-lg text-center mb-8 opacity-80" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{ t('setup.wallpaper.description') }}</p>
               <div class="flex-1 overflow-y-auto px-4">
                 <div class="grid grid-cols-2 gap-6 max-w-md mx-auto pb-6">
                    <button 
                      v-for="(wp, index) in wallpapers" :key="index" 
                      @click="updateSetupData('wallpaper', wp)"
                      class="aspect-[9/19.5] rounded-3xl overflow-hidden transition-all duration-300 border-3 transform hover:scale-105 active:scale-95 animate-slide-in shadow-lg"
                      :class="setupData.wallpaper === wp ? 'border-blue-500 scale-105 shadow-2xl ring-4 ring-blue-500/20' : (setupData.darkMode ? 'border-white/20 hover:border-white/40' : 'border-gray-300/50 hover:border-gray-400')"
                      :style="{ animationDelay: (index * 0.1) + 's' }"
                    >
                      <img :src="getAssetUrl(wp)" :alt="'Wallpaper ' + (index + 1)" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
                    </button>
                 </div>
               </div>
            </div>

            <div v-else-if="currentStepName === 'profile'" class="h-full flex flex-col justify-center">
              <h1 class="text-4xl font-light text-center mb-6 animate-slide-down" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t('setup.profile.title') }}</h1>
              <p class="text-lg text-center mb-12 animate-slide-down-delay opacity-80" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{ t('setup.profile.description') }}</p>
              <div class="max-w-md mx-auto w-full animate-slide-up">
                  
                  <div v-if="setupData.userPhoto" class="flex justify-center mb-6">
                    <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl">
                      <img :src="setupData.userPhoto.startsWith('http') ? setupData.userPhoto : getAssetUrl(setupData.userPhoto.replace('./', '../'))" 
                           class="w-full h-full object-cover" 
                           @error="$event.target.src = getAssetUrl('../assets/avatars/avatar1.png')"
                           alt="Preview"/>
                    </div>
                  </div>
                  
                  <input 
                    type="text" :value="setupData.userName" @input="updateSetupData('userName', $event.target.value)"
                    :placeholder="t('setup.profile.namePlaceholder')"
                    class="w-full text-center text-2xl mb-10 px-6 py-4 rounded-3xl border-2 focus:outline-none focus:border-blue-500 transition-all duration-300 focus:ring-4 focus:ring-blue-500/20"
                    :class="setupData.darkMode ? 'bg-white/10 border-white/20 text-white placeholder-white/60' : 'bg-white/90 border-gray-300 text-gray-900 placeholder-gray-500'" maxlength="30"
                  />
                  <div class="grid grid-cols-4 sm:grid-cols-6 gap-4 mb-6">
                    <button v-for="(photo, index) in predefinedPhotos" :key="photo" 
                            @click="selectPhoto(photo)" 
                            class="aspect-square rounded-full overflow-hidden border-3 transition-all duration-300 transform hover:scale-110 active:scale-95 animate-scale-in" 
                            :class="setupData.userPhoto === photo ? 'border-blue-500 scale-110 shadow-xl ring-4 ring-blue-500/20' : 'border-transparent opacity-70 hover:opacity-100'"
                            :style="{ animationDelay: (index * 0.05) + 's' }">
                       <img :src="photo.startsWith('http') ? photo : getAssetUrl(photo.replace('./', '../'))" class="w-full h-full object-cover" />
                    </button>
                  </div>
                  <div class="flex items-center gap-3 mb-8">
                     <input type="text" v-model="profileLinkInput" :placeholder="t('setup.profile.linkPlaceholder')" 
                            class="flex-1 text-sm px-4 py-3 rounded-2xl border-2 focus:outline-none focus:border-blue-500 transition-all duration-300" 
                            :class="setupData.darkMode ? 'bg-white/10 border-white/20 text-white placeholder-white/60' : 'bg-white/90 border-gray-300 text-gray-900 placeholder-gray-500'"/>
                     <button @click="setPhotoFromLink" class="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg">{{ t('setup.profile.use') }}</button>
                  </div>
                  <button v-if="setupData.userPhoto" @click="updateSetupData('userPhoto', null)" 
                          class="opacity-70 hover:opacity-100 w-full text-center transition-colors duration-200" 
                          :class="setupData.darkMode ? 'text-white' : 'text-gray-600'">
                    {{ t('common.skip') }}
                  </button>
              </div>
            </div>

            <div v-else-if="currentStepName === 'fontFamily'" class="h-full flex flex-col justify-center">
              <h1 class="text-4xl font-light text-center mb-6 animate-slide-down" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t('setup.fonts.title') }}</h1>
              <p class="text-lg text-center mb-8 animate-slide-down-delay opacity-80" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{ t('setup.fonts.description') }}</p>
              
              <div class="max-w-lg mx-auto w-full animate-slide-up">
                
                <div class="text-center mb-8 p-6 rounded-3xl" :class="setupData.darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white/90 border-gray-300 text-gray-900'">
                  <p class="text-2xl mb-2" :style="{fontFamily: getFontFamilyValue(setupData.fontFamily || 'system')}">{{ getSelectedFont().name }}</p>
                  <p class="text-sm opacity-70" :style="{fontFamily: getFontFamilyValue(setupData.fontFamily || 'system')}">{{ getSelectedFont().preview }}</p>
                </div>

                
                <div class="grid grid-cols-5 gap-2 mb-6">
                  <button v-for="category in fontCategories" :key="category.id"
                          @click="updateSetupData('selectedFontCategory', category.id)"
                          class="p-3 rounded-2xl text-center transition-all duration-300 transform hover:scale-105 active:scale-95"
                          :class="(setupData.selectedFontCategory || 'system') === category.id ? 
                                   'bg-blue-600 text-white shadow-lg border-2 border-blue-400' : 
                                   (setupData.darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white/90 border-gray-300 text-gray-900')">
                    <div class="text-xl mb-1">{{ category.icon }}</div>
                    <div class="text-xs font-medium">{{ category.name }}</div>
                  </button>
                </div>

                
                <div class="space-y-3 max-h-60 overflow-y-auto">
                  <button v-for="font in getFontsByCategory(setupData.selectedFontCategory || 'system')" 
                          :key="font.id"
                          @click="selectFont(font.id)"
                          class="w-full p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-left"
                          :class="(setupData.fontFamily || 'system') === font.id ? 
                                   'bg-blue-600 text-white shadow-lg border-2 border-blue-400' : 
                                   (setupData.darkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white/90 border-gray-300 text-gray-900')">
                    <div class="font-semibold text-lg mb-1" :style="{fontFamily: getFontFamilyValue(font.id)}">{{ font.name }}</div>
                    <div class="text-sm opacity-70" :style="{fontFamily: getFontFamilyValue(font.id)}">{{ font.preview }}</div>
                  </button>
                </div>
              </div>
            </div>

            
            <div v-else-if="currentStepName === 'callSounds'" class="h-full flex flex-col">
              <h1 class="text-4xl font-light text-center mb-6 pt-8 animate-slide-down" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{t('setup.callsounds.title')}}</h1>
              <p class="text-lg text-center mb-8 opacity-80" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{t('setup.callsounds.description')}}</p>
              
              <div class="flex-1 overflow-y-auto px-6">
                <div class="grid grid-cols-1 gap-3 max-w-md mx-auto">
                  <div v-for="(sound, index) in callSounds" :key="'call-' + index"
                       @click="previewSound(sound, 'call')"
                       class="p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2"
                       :class="(setupData.callSound || 'assets/sounds/calls/1.mp3') === sound.url ? 
                         'border-blue-500 bg-blue-500/20 shadow-lg ring-4 ring-blue-500/20' : 
                         (setupData.darkMode ? 'border-white/20 hover:border-white/40 bg-white/10' : 'border-gray-300/20 hover:border-gray-400/40 bg-gray-100/10')">
                    <div class="flex items-center justify-between">
                      <span class="font-medium" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t(sound.name) || sound.name }}</span>
                      <svg class="w-5 h-5" :class="setupData.darkMode ? 'text-white/60' : 'text-gray-600'" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5L13 10L8 15V5z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div class="mt-2 max-w-md mx-auto space-y-2">
                  <input v-model="customCallSound" 
                         placeholder="URL..." 
                         class="w-full p-3 rounded-xl border-2 focus:border-blue-500 focus:outline-none transition-colors"
                         :class="setupData.darkMode ? 'bg-white/10 backdrop-blur-xl text-white placeholder-white/60 border-white/20' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'">
                  <button @click="setCustomSound('call')" 
                          class="w-full p-2 rounded-xl bg-blue-500/20 border border-blue-500/50 text-blue-300 hover:bg-blue-500/30 transition-colors">
                    {{t('setup.callsounds.custom')}}
                  </button>
                </div>
              </div>
            </div>

            
            <div v-else-if="currentStepName === 'notificationSounds'" class="h-full flex flex-col">
              <h1 class="text-4xl font-light text-center mb-6 pt-8 animate-slide-down" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{t('setup.sounds.title')}}</h1>
              <p class="text-lg text-center mb-8 opacity-80" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{t('setup.sounds.description')}}</p>

              <div class="flex-1 overflow-y-auto px-6">
                <div class="grid grid-cols-1 gap-3 max-w-md mx-auto">
                  <div v-for="(sound, index) in notificationSounds" :key="'notif-' + index"
                       @click="previewSound(sound, 'notification')"
                       class="p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer border-2"
                       :class="(setupData.notificationSound || 'assets/sounds/notifications/1.mp3') === sound.url ? 
                         'border-blue-500 bg-blue-500/20 shadow-lg ring-4 ring-blue-500/20' : 
                         (setupData.darkMode ? 'border-white/20 hover:border-white/40 bg-white/10' : 'border-gray-300/20 hover:border-gray-400/40 bg-gray-100/10')">
                    <div class="flex items-center justify-between">
                      <span class="font-medium" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t(sound.name) || sound.name }}</span>
                      <svg class="w-5 h-5" :class="setupData.darkMode ? 'text-white/60' : 'text-gray-600'" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5L13 10L8 15V5z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div class="mt-2 max-w-md mx-auto space-y-2">
                  <input v-model="customNotificationSound" 
                         placeholder="URL..." 
                         class="w-full p-3 rounded-xl border-2 focus:border-blue-500 focus:outline-none transition-colors"
                         :class="setupData.darkMode ? 'bg-white/10 backdrop-blur-xl text-white placeholder-white/60 border-white/20' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'">
                  <button @click="setCustomSound('notification')" 
                          class="w-full p-2 rounded-xl bg-blue-500/20 border border-blue-500/50 text-blue-300 hover:bg-blue-500/30 transition-colors">
                    {{t('setup.sounds.custom')}}
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else-if="currentStepName === 'pin'" class="h-full flex flex-col justify-center pb-20">
              <h1 class="text-4xl font-light text-center mb-6 animate-slide-down" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t('setup.pin.title') }}</h1>
              <p class="text-lg text-center mb-12 animate-slide-down-delay opacity-80" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{ t('setup.pin.description') }}</p>
              <div class="max-w-xs mx-auto w-full animate-slide-up">
                <div class="flex justify-center gap-6 mb-16">
                  <div v-for="i in 4" :key="i" 
                       class="w-6 h-6 rounded-full border-3 transition-all duration-300 transform"
                       :class="(setupData.pin || '').length >= i ? 'bg-blue-500 border-blue-500 scale-110 shadow-lg' : (setupData.darkMode ? 'border-white/30' : 'border-gray-400/50')">
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-6">
                  <button v-for="digit in [1,2,3,4,5,6,7,8,9]" :key="digit" 
                          @click="addPinDigit(digit.toString())" 
                          class="aspect-square rounded-full flex items-center justify-center text-3xl font-light transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg animate-scale-in" 
                          :class="setupData.darkMode ? 'bg-white/10 border-white/10 hover:bg-white/20 backdrop-blur-xl text-white' : 'bg-white/80 border-white/40 hover:bg-white/90 backdrop-blur-xl shadow-lg text-gray-900'"
                          :style="{ animationDelay: ((digit - 1) * 0.05) + 's' }">
                    {{ digit }}
                  </button>
                  <div></div>
                  <button @click="addPinDigit('0')" 
                          class="aspect-square rounded-full flex items-center justify-center text-3xl font-light transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg animate-scale-in" 
                          :class="setupData.darkMode ? 'bg-white/10 border-white/10 hover:bg-white/20 backdrop-blur-xl text-white' : 'bg-white/80 border-white/40 hover:bg-white/90 backdrop-blur-xl shadow-lg text-gray-900'"
                          style="animation-delay: 0.45s">
                    0
                  </button>
                  <button @click="removePinDigit" 
                          class="aspect-square rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg animate-scale-in" 
                          :class="setupData.darkMode ? 'bg-white/10 border-white/10 hover:bg-white/20 backdrop-blur-xl text-white' : 'bg-white/80 border-white/40 hover:bg-white/90 backdrop-blur-xl shadow-lg text-gray-900'"
                          style="animation-delay: 0.5s">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V9a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"/>
                    </svg>
                  </button>
                </div>
                <div class="text-center mt-8">
                  <button @click="nextStep" class="opacity-70 hover:opacity-100 transition-opacity duration-200" :class="setupData.darkMode ? 'text-white' : 'text-gray-600'">
                    {{ t('setup.pin.skip') }}
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else-if="currentStepName === 'complete'" class="h-full flex flex-col justify-center items-center text-center">
              <div class="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center mb-10 shadow-2xl animate-bounce-slow">
                 <svg class="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                   <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                 </svg>
              </div>
              <h1 class="text-5xl font-thin tracking-tight mb-8 animate-slide-up" :class="setupData.darkMode ? 'text-white' : 'text-gray-900'">{{ t('setup.complete.title') }}</h1>
              <p class="text-xl font-light max-w-sm animate-slide-up-delay opacity-90" :class="setupData.darkMode ? 'text-white' : 'text-gray-700'">{{ t('setup.complete.description') }}</p>
            </div>

            </div>

          </transition>
        </div>

        
        <div class="px-8 pb-8 pt-4">
          <button 
            @click="nextStep"
            :disabled="!canContinue"
            class="w-full max-w-md mx-auto block bg-blue-600 hover:bg-blue-700 text-white rounded-3xl py-5 text-lg font-semibold transition-all duration-300 shadow-xl transform hover:scale-105 active:scale-95"
            :class="canContinue ? 'hover:from-blue-600 hover:to-purple-700 hover:shadow-2xl' : 'opacity-40 cursor-not-allowed'"
          >
            {{ currentStepName === 'complete' ? (t('setup.complete.finish') || 'Finalizar configuración') : (isLastSetupStep ? (t('common.done') || 'OK') : (t('common.continue') || 'Continuar')) }}
          </button>
        </div>
      </div>
    </div>

  `,
};

if (typeof window !== "undefined") {
	window.PhoneSetup = PhoneSetup;
}
