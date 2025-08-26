const Camera = {
  name: 'Camera',
  props: ["photos", "userSettings", "t"],
  emits: ["close", "take-photo"],
  setup(props, { emit }) {
    const { ref, onMounted, onUnmounted, computed } = Vue;
    
    const isLoading = ref(false);
    const error = ref(null);
    const flashMode = ref("off");
    const cameraMode = ref("photo");
    const facingMode = ref("back");
    const isRecording = ref(false);
    const isCameraActive = ref(false);
    const isTakingPhoto = ref(false);
    const previewSrc = ref(null);
    const frameCount = ref(0);
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });
    const lastDragTime = ref(0);

    const flashModes = [
      { key: "off", label: "Desactivado", icon: "flash-off" },
      { key: "on", label: "Activado", icon: "flash-on" },
      { key: "auto", label: "Automático", icon: "flash-auto" }
    ];

    const cameraModes = [
      { key: "photo", label: "FOTO" },
      { key: "video", label: "VIDEO" },
      { key: "portrait", label: "RETRATO" }
    ];

    const previewImageStyle = computed(() => {
      const baseStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        cursor: isDragging.value ? 'grabbing' : 'grab'
      };
      
      if (facingMode.value === 'front') {
        baseStyle.transform = 'scaleX(-1)';
      }
      
      return baseStyle;
    });

    const startDrag = (event) => {
      if (!isCameraActive.value || isTakingPhoto.value) return;
      
      event.preventDefault();
      isDragging.value = true;
      
      const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
      const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
      
      dragStart.value = { x: clientX, y: clientY };
      lastDragTime.value = Date.now();
    };

    const onDrag = (event) => {
      if (!isDragging.value || !isCameraActive.value || isTakingPhoto.value) return;
      
      event.preventDefault();
      
      const now = Date.now();
      if (now - lastDragTime.value < 16) return;
      
      const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
      const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
      
      const deltaX = (clientX - dragStart.value.x) * 0.2;
      const deltaY = (clientY - dragStart.value.y) * 0.2;
      
      fetch('https://bit-smartphone/camera:mouse_move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltaX, deltaY })
      }).catch(() => {});
      
      lastDragTime.value = now;
    };

    const stopDrag = () => {
      isDragging.value = false;
    };

    const startCamera = async () => {
      try {
        isLoading.value = true;
        error.value = null;
        
        const response = await fetch('https://bit-smartphone/camera:start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: facingMode.value })
        });
        
        const data = await response.json();
        if (data.success) {
          isCameraActive.value = true;
        } else {
          throw new Error('Error al iniciar la cámara');
        }
      } catch (err) {
        error.value = "No se pudo acceder a la cámara de FiveM.";
      } finally {
        isLoading.value = false;
      }
    };

    const stopCamera = () => {
      if (isCameraActive.value) {
        fetch('https://bit-smartphone/camera:stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(() => {});
        isCameraActive.value = false;
        previewSrc.value = null;
        frameCount.value = 0;
        isDragging.value = false;
        isTakingPhoto.value = false;
      }
    };

    const takePhoto = async () => {
      if (isTakingPhoto.value || !isCameraActive.value) return;
      console.log("Taking photo with settings:")
      
      if (!window.cameraTimeouts) {
        window.cameraTimeouts = [];
      }
      
      isTakingPhoto.value = true;
      
      const resetButton = () => {
        setTimeout(() => {
          isTakingPhoto.value = false;
        }, 300);
        
        
        if (window.cameraTimeouts) {
          window.cameraTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
          });
          window.cameraTimeouts = [];
        }
      };
      
      const timeoutId = setTimeout(() => {
        if (isTakingPhoto.value) {
          error.value = 'Timeout al tomar la foto';
          resetButton();
        }
      }, 15000);
      
      
      window.cameraTimeouts.push(timeoutId);
      
      try {
        console.log("Taking photo with settings:")
        const response = await fetch('https://bit-smartphone/camera:take', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            metadata: { 
              app: 'camera', 
              flashMode: flashMode.value, 
              facingMode: facingMode.value, 
              timestamp: Date.now(),
              frameNumber: frameCount.value
            } 
          })
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        if (data.success) {
          if (navigator.vibrate) navigator.vibrate(50);
        } else {
          throw new Error(data.error || 'Error al tomar la foto');
        }
        
        resetButton();
      } catch (err) {
        clearTimeout(timeoutId);
        error.value = 'Error al capturar la foto';
        resetButton();
      }
    };

    const switchCamera = async () => {
      if (isTakingPhoto.value) return;
      
      try {
        const newMode = facingMode.value === "back" ? "front" : "back";
        previewSrc.value = null;
        
        const response = await fetch('https://bit-smartphone/camera:switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: newMode })
        });
        
        const data = await response.json();
        if (data.success) {
          facingMode.value = data.mode;
        }
      } catch (err) {
        error.value = 'No se pudo cambiar la cámara';
      }
    };

    const cycleFlashMode = () => {
      if (isTakingPhoto.value) return;
      
      const modes = ['off', 'on', 'auto'];
      const currentIndex = modes.indexOf(flashMode.value);
      flashMode.value = modes[(currentIndex + 1) % modes.length];
    };

    const messageListener = (event) => {
      const { action, ...data } = event.data;
      
      switch (action) {
        case 'camera:start_preview':
          break;
          
        case 'camera:preview_frame':
          if (data.imageData) {
            previewSrc.value = data.imageData;
            frameCount.value = data.frameNumber || frameCount.value + 1;
          }
          break;
          
        case 'camera:stop_preview':
          previewSrc.value = null;
          break;
          
        case 'camera:photo_taken':
          isTakingPhoto.value = false;
          if (data.success) {
            emit('take-photo', data.url);
          } else {
            error.value = 'Error al tomar la foto';
          }
          break;
      }
    };

    onMounted(() => {
      window.addEventListener('message', messageListener);
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
      startCamera();
    });

    onUnmounted(() => {
      window.removeEventListener('message', messageListener);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
      stopCamera();
      
      
      if (window.invokeNative) {
        fetch(`https://${GetParentResourceName()}/camera:close`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(() => {});
      }
    });

    return {
      isLoading, error, flashMode, cameraMode, facingMode,
      isRecording, flashModes, cameraModes, isCameraActive,
      isTakingPhoto, previewSrc, frameCount, isDragging,
      previewImageStyle,
      takePhoto, switchCamera, cycleFlashMode, startCamera, 
      stopCamera, startDrag, onDrag, stopDrag
    };
  },
  template: `
    <div class="relative w-full h-full overflow-hidden transition-all duration-300 bg-black">
      
      <div v-if="isLoading" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
        <p class="text-white text-lg">Iniciando cámara...</p>
      </div>
      
      <div v-if="error" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black p-4">
        <div class="bg-red-500/20 border border-red-500 rounded-lg p-6 max-w-sm">
          <svg class="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="text-white text-center mb-4">{{ error }}</p>
          <button @click="startCamera" class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors">
            Reintentar
          </button>
        </div>
      </div>
      
      <img
        v-if="previewSrc && !isLoading && !error"
        :src="previewSrc" 
        :style="previewImageStyle"
        class="absolute inset-0 select-none"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @touchstart="startDrag"
        @touchmove="onDrag"
        @error="error = 'Error al cargar preview'"
        draggable="false"
      />
      
      <div class="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 pt-16 bg-gradient-to-b from-black/70 to-transparent">
        <button @click="$emit('close')" class="p-3 rounded-full bg-black/40 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/60">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <div class="flex items-center space-x-3">
          <button @click="cycleFlashMode" class="p-3 rounded-full bg-black/40 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/60" :class="{ 'bg-yellow-500/80': flashMode !== 'off' }">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="flashMode === 'off'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </button>
          
          <button @click="switchCamera" class="p-3 rounded-full bg-black/40 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-black/60">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="absolute bottom-32 left-0 right-0 z-10 flex justify-center">
        <div class="flex space-x-4 bg-black/40 backdrop-blur-sm rounded-full p-2">
          <button 
            v-for="mode in cameraModes" 
            :key="mode.key" 
            @click="cameraMode = mode.key" 
            class="px-4 py-2 rounded-full text-white font-medium transition-all duration-300" 
            :class="cameraMode === mode.key ? 'bg-white text-black shadow-lg' : 'hover:bg-white/20'"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
      
      <div class="absolute bottom-0 left-0 right-0 z-10 p-8 bg-gradient-to-t from-black/70 to-transparent">
        <div class="flex items-center justify-center">
          <button 
            @click="takePhoto" 
            :disabled="!isCameraActive || isTakingPhoto"
            class="w-20 h-20 bg-white rounded-full border-4 border-gray-300 transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:scale-100 relative overflow-hidden"
            :class="{ 'animate-pulse bg-blue-500': isTakingPhoto }"
          >
            <div class="w-full h-full flex items-center justify-center">
              <svg v-if="!isTakingPhoto" class="w-10 h-10 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4h-6a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
              </svg>
              <div v-else class="w-6 h-6 bg-white rounded-full animate-pulse"></div>
            </div>
          </button>
        </div>
        
        <div v-if="!isDragging && !isTakingPhoto" class="text-center mt-4">
          <p class="text-white text-sm opacity-70">Arrastra para mover la cámara</p>
        </div>
      </div>
    </div>
  `,
}

window.Camera = Camera;
