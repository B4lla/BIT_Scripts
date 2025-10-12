const config = {
  resolutionScale: 0.5,  // scale of the rendering resolution (0.5 means half the gamescreen resolution)
  defaultBlurStrength: 5.0,  //  blur strength if not provided in the data attribute
  zindex: '-1',  // z-index of game render
  renderColour: [0.0, 0.0, 0.0, 0.0],  //rgba (for debugging cuttouts)
  maxBlurSize: 20,  // by decreasing this number improves performance by reducing the number of texture samples, but it will result in a less smooth (lower quality) blur effect though.
};

const fragmentShaderSrc = `
  precision mediump float;
  varying vec2 v_texcoord;
  uniform sampler2D u_texture;
  uniform vec4 u_shape;
  uniform float u_borderRadius;
  uniform vec2 u_resolution;
  uniform float u_blurStrength;

  const int blurSizing = ${config.maxBlurSize}; 

  float roundedBoxSDF(vec2 centerPosition, vec2 size, float radius) {
    return length(max(abs(centerPosition) - size + radius, 0.0)) - radius;
  }

  float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * 3.14159) * sigma);
  }

  void main() {
    vec2 pixelCoord = gl_FragCoord.xy;
    vec2 centerPosition = (pixelCoord - u_shape.xy);
    
    float distance = u_shape.w == 0.0
      ? length(centerPosition) - u_shape.z
      : roundedBoxSDF(centerPosition, u_shape.zw, u_borderRadius);
    
    if (distance > 0.0) discard;
    
    vec4 blurredColor = vec4(0.0);
    float totalWeight = 0.0;
    float sigma = u_blurStrength / 3.0;
    
    for (int x = -blurSizing; x <= blurSizing; x++) {
      for (int y = -blurSizing; y <= blurSizing; y++) {
        if (float(x * x + y * y) > u_blurStrength * u_blurStrength) continue;
        vec2 offset = vec2(float(x), float(y)) / u_resolution;
        float weight = gaussian(length(offset), sigma);
        blurredColor += texture2D(u_texture, v_texcoord + offset) * weight;
        totalWeight += weight;
      }
    }
    
    gl_FragColor = blurredColor / totalWeight;
  }
`;

const vertexShaderSrc = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = a_texcoord;
  }
`;

function makeShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  const infoLog = gl.getShaderInfoLog(shader);
  if (infoLog) console.error(infoLog);
  return shader;
}

function createTexture(gl) { //thanks fxdk
  const tex = gl.createTexture();
  const texPixels = new Uint8Array([0, 0, 255, 255]);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, texPixels);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function createBuffers(gl) {
  const vertexBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuff);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  
  const texBuff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuff);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  
  return { vertexBuff, texBuff };
}

function createProgram(gl) {
  const program = gl.createProgram();
  gl.attachShader(program, makeShader(gl, gl.VERTEX_SHADER, vertexShaderSrc));
  gl.attachShader(program, makeShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc));
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
    return null;
  }

  return {
    program,
    attribLocations: {
      position: gl.getAttribLocation(program, 'a_position'),
      texcoord: gl.getAttribLocation(program, 'a_texcoord'),
    },
    uniformLocations: {
      shape: gl.getUniformLocation(program, 'u_shape'),
      borderRadius: gl.getUniformLocation(program, 'u_borderRadius'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      blurStrength: gl.getUniformLocation(program, 'u_blurStrength'),
    },
  };
}

function createGameView(canvas, glassElements, resolutionScale = config.resolutionScale) {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    depth: false,
    stencil: false,
    alpha: true,
    preserveDrawingBuffer: true,
    failIfMajorPerformanceCaveat: false
  });

  if (!gl) {
    console.error('WebGL no está disponible');
    return null;
  }

  const tex = createTexture(gl);
  const programInfo = createProgram(gl);
  const { vertexBuff, texBuff } = createBuffers(gl);

  if (!programInfo) {
    console.error('Failed to create shader program');
    return null;
  }

  gl.useProgram(programInfo.program);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(gl.getUniformLocation(programInfo.program, 'u_texture'), 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuff);
  gl.vertexAttribPointer(programInfo.attribLocations.position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.attribLocations.position);

  gl.bindBuffer(gl.ARRAY_BUFFER, texBuff);
  gl.vertexAttribPointer(programInfo.attribLocations.texcoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(programInfo.attribLocations.texcoord);

  let currentResolutionScale = resolutionScale;
  let animationFrameId = null;
  let isRunning = false;

  function render() {
    if (!isRunning) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(programInfo.program);

    glassElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const buffer = 1;
      const scaledLeft = Math.floor((rect.left - canvasRect.left) * currentResolutionScale) - buffer;
      const scaledTop = Math.floor((rect.top - canvasRect.top) * currentResolutionScale) - buffer;
      const scaledWidth = Math.ceil(rect.width * currentResolutionScale) + buffer * 2;
      const scaledHeight = Math.ceil(rect.height * currentResolutionScale) + buffer * 2;

      const centerX = scaledLeft + scaledWidth / 2;
      const centerY = gl.canvas.height - (scaledTop + scaledHeight / 2);

      const borderRadius = parseFloat(getComputedStyle(element).borderRadius);
      const isCircle = getComputedStyle(element).borderRadius.includes('%') && 
                       parseFloat(getComputedStyle(element).borderRadius) >= 50;

      gl.uniform4f(programInfo.uniformLocations.shape, centerX, centerY, 
                   isCircle ? scaledWidth / 2 : scaledWidth / 2, 
                   isCircle ? 0 : scaledHeight / 2);
      gl.uniform1f(programInfo.uniformLocations.borderRadius, borderRadius * currentResolutionScale);
      gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
      const blurStrength = parseFloat(element.dataset.blurStrength) || config.defaultBlurStrength;

      gl.uniform4f(programInfo.uniformLocations.shape, centerX, centerY, 
                   isCircle ? scaledWidth / 2 : scaledWidth / 2, 
                   isCircle ? 0 : scaledHeight / 2);
      gl.uniform1f(programInfo.uniformLocations.borderRadius, borderRadius * currentResolutionScale);
      gl.uniform2f(programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(programInfo.uniformLocations.blurStrength, blurStrength);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });

    animationFrameId = requestAnimationFrame(render);
  }

  return {
    canvas,
    gl,
    resize: (width, height) => {
      const scaledWidth = Math.ceil(width * currentResolutionScale);
      const scaledHeight = Math.ceil(height * currentResolutionScale);
      
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      gl.viewport(0, 0, scaledWidth, scaledHeight);
    },
    setResolutionScale: (scale) => {
      currentResolutionScale = scale;
    },
    start: () => {
      if (!isRunning) {
        isRunning = true;
        gl.clearColor(...config.renderColour);
        render();
      }
    },
    stop: () => {
      isRunning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  };
}

let gameView = null;


Vue.createApp({
  data() {
    return {
      newBlip: {
        name: "",
        x: 0,
        y: 0,
        z: 0,
        icon: 1,
        color: 3,
        scale: 1.0,
        visible: true,
        tags: [],
      },
      isLoading: false,
      loadingMessage: "",
      searchBlips: "",
      searchIcons: "",
      showConfirmDialog: false,
      confirmTitle: "",
      confirmMessage: "",
      confirmAction: null,
      confirmButtonText: "Eliminar",
      selectedBlip: null,
      blips: [],
      isEditing: false,
      showMapModal: false,
      loadingCurrentPosition: false,
      currentZone: "",
      existingIcons: new Set(),
      isLoadingIcons: true,
      loadingComplete: false,
      allIcons: [],
      _iconUrlCache: new Map(),
      mapZoom: 1.0,
      mapZoomStep: 0.02,
      minMapZoom: 1.0,
      maxMapZoom: 3.0,
      offsetX: 0,
      offsetY: 0,
      startX: 0,
      startY: 0,
      isDragging: false,
      marker: null,
      dragMoved: false,
      availableColors: [
        { id: 0, name: "White", hex: "#fefefe" },
        { id: 1, name: "Red", hex: "#e03232" },
        { id: 2, name: "Green", hex: "#71cb71" },
        { id: 3, name: "Blue", hex: "#5db6e5" },
        { id: 4, name: "White Alt", hex: "#fefefe" },
        { id: 5, name: "Yellow", hex: "#eec64e" },
        { id: 6, name: "Dark Red", hex: "#c25050" },
        { id: 7, name: "Purple", hex: "#9c6eaf" },
        { id: 8, name: "Pink", hex: "#fe7ac3" },
        { id: 9, name: "Salmon", hex: "#f59d79" },
        { id: 10, name: "Brown", hex: "#b18f83" },
        { id: 11, name: "Mint Green", hex: "#8dcea7" },
        { id: 12, name: "Teal", hex: "#70a8ae" },
        { id: 13, name: "Lavender", hex: "#d3d1e7" },
        { id: 14, name: "Mauve", hex: "#8f7e98" },
        { id: 15, name: "Turquoise", hex: "#6ac4bf" },
        { id: 16, name: "Beige", hex: "#d5c398" },
        { id: 17, name: "Orange", hex: "#ea8e50" },
        { id: 18, name: "Light Blue", hex: "#97cae9" },
        { id: 19, name: "Rose", hex: "#b26287" },
        { id: 20, name: "Olive", hex: "#8f8d79" },
        { id: 21, name: "Terracotta", hex: "#a6755e" },
        { id: 22, name: "Silver", hex: "#afa8a8" },
        { id: 23, name: "Coral", hex: "#e78d9a" },
        { id: 24, name: "Lime", hex: "#bbd65b" },
        { id: 25, name: "Emerald", hex: "#0c7b56" },
        { id: 26, name: "Sky Blue", hex: "#7ac3fe" },
        { id: 27, name: "Violet", hex: "#ab3ce6" },
        { id: 28, name: "Gold", hex: "#cda80c" },
        { id: 29, name: "Navy Blue", hex: "#4561ab" },
        { id: 30, name: "Aqua", hex: "#29a5b8" },
        { id: 31, name: "Tan", hex: "#b89b7b" },
        { id: 32, name: "Ice Blue", hex: "#c8e0fe" },
        { id: 33, name: "Cream", hex: "#f0f096" },
        { id: 34, name: "Blush", hex: "#ed8ca1" },
        { id: 35, name: "Light Red", hex: "#f98a8a" },
        { id: 36, name: "Pale Yellow", hex: "#fbeea5" },
        { id: 37, name: "Pure White", hex: "#fefefe" },
        { id: 38, name: "Royal Blue", hex: "#2c6db8" },
        { id: 39, name: "Medium Gray", hex: "#9a9a9a" },
        { id: 40, name: "Dark Gray", hex: "#4c4c4c" },
        { id: 41, name: "Light Pink", hex: "#F29D9D" },
        { id: 42, name: "Periwinkle", hex: "#6CB7D6" },
        { id: 43, name: "Pastel Green", hex: "#AFEDAE" },
        { id: 44, name: "Peach", hex: "#FFA75F" },
        { id: 45, name: "Off White", hex: "#F1F1F1" },
        { id: 46, name: "Bright Yellow", hex: "#ECF029" },
        { id: 47, name: "Amber", hex: "#FF9A18" },
        { id: 48, name: "Hot Pink", hex: "#F644A5" },
        { id: 49, name: "Bright Red", hex: "#E03A3A" },
        { id: 50, name: "Lilac", hex: "#8A6DE3" },
        { id: 51, name: "Light Orange", hex: "#FF8B5C" },
        { id: 52, name: "Forest Green", hex: "#416C41" },
        { id: 53, name: "Baby Blue", hex: "#B3DDF3" },
        { id: 54, name: "Steel Blue", hex: "#3A6479" },
        { id: 55, name: "Light Gray", hex: "#A0A0A0" },
        { id: 56, name: "Bronze", hex: "#847232" },
        { id: 57, name: "Cerulean", hex: "#65B9E7" },
        { id: 58, name: "Indigo", hex: "#4B4175" },
        { id: 59, name: "Crimson", hex: "#E13B3B" },
        { id: 60, name: "Mustard", hex: "#F0CB58" },
        { id: 61, name: "Magenta", hex: "#CD3F98" },
        { id: 62, name: "Platinum", hex: "#CFCFCF" },
        { id: 63, name: "Cobalt", hex: "#276A9F" },
        { id: 64, name: "Burnt Orange", hex: "#D87B1B" },
        { id: 65, name: "Dusty Purple", hex: "#8E8393" },
        { id: 66, name: "Honey", hex: "#F0CB57" },
        { id: 67, name: "Azure", hex: "#65B9E7" },
        { id: 68, name: "Powder Blue", hex: "#65B9E7" },
        { id: 69, name: "Medium Green", hex: "#79CD79" },
        { id: 70, name: "Saffron", hex: "#EFCA57" },
        { id: 71, name: "Goldenrod", hex: "#EFCA57" },
        { id: 72, name: "Charcoal", hex: "#3D3D3D" },
        { id: 73, name: "Amber Yellow", hex: "#EFCA57" },
        { id: 74, name: "Carolina Blue", hex: "#65B9E7" },
        { id: 75, name: "Scarlet", hex: "#e03232" },
        { id: 76, name: "Maroon", hex: "#782323" },
        { id: 77, name: "Dodger Blue", hex: "#65B9E7" },
        { id: 78, name: "Slate Blue", hex: "#3A6479" },
        { id: 79, name: "Ruby", hex: "#e03232" },
        { id: 80, name: "Cornflower", hex: "#65B9E7" },
        { id: 81, name: "Amber Orange", hex: "#F2A40C" },
        { id: 82, name: "Sage", hex: "#A4CCAA" },
        { id: 83, name: "Orchid", hex: "#A854F2" },
        { id: 84, name: "Steel Blue Alt", hex: "#65B9E7" },
        { id: 85, name: "Carbon Gray", hex: "#3D3D3D" },
      ],
      lang: {
        UI: {},
        Colors: {},
        Errors: {}
      },
    };
  },
  template: `
        <div
        class="h-screen w-screen flex items-center justify-center overflow-hidden">
        <div id="main-container" data-hlsl data-blur-strength="7"
          ref="mainContainer"
          class="w-10/12 h-[55vh] max-w-5xl rounded-xl bg-black/20 border border-emerald-500/20 shadow-2xl flex flex-col overflow-hidden">
          <header
            class="flex items-center justify-between px-4 py-2 border-b border-emerald-500/10 bg-black/30">
            <div class="flex items-center space-x-2.5">
              <div
                class="h-7 w-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <i class="fas fa-map-marker-alt text-emerald-500"></i>
              </div>
              <div>
                <h1 class="text-base font-bold text-emerald-400">{{ lang.UI.MainTitle || 'BIT Blips' }}</h1>
              </div>
            </div>
            <button @click="closeInterface"
              class="w-7 h-7 rounded-md bg-black/20 hover:bg-red-500/20 text-white/60 hover:text-white flex items-center justify-center transition-all duration-200 relative group">
              <i class="fas fa-times"></i>                <div
                  class="absolute bottom-full mb-2 hidden group-hover:block bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  {{ lang.UI.CloseInterface || 'Close Interface' }}
                </div>
            </button>
          </header>

          <div class="flex-1 flex overflow-hidden">
            <div
              class="w-2/5 border-r border-emerald-500/10 flex flex-col bg-black/10">
              <div
                class="p-2 border-b border-emerald-500/10 flex items-center justify-between">
                <h2 class="text-sm font-medium text-white flex items-center">
                  <i class="fas fa-list text-emerald-500 mr-1.5"></i> {{ lang.UI.MyBlips || 'My Blips' }}
                </h2>
                <div class="relative">
                  <input type="text" v-model="searchBlips" :placeholder="lang.UI.Search || 'Search...'"
                    class="bg-black/20 border border-white/10 rounded-md py-1.5 pl-6 pr-2 w-36 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/30">
                  <i
                    class="fas fa-search absolute left-2 top-2 text-white/40 text-[10px]"></i>
                </div>
              </div>

              <div
                class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-2 space-y-1">
                <div v-if="blips.length === 0"
                  class="flex flex-col items-center justify-center h-full text-white/50">
                  <i class="fas fa-map text-3xl mb-2 text-white/20"></i>
                  <p class="text-xs">{{ lang.UI.NoBlips || 'No blips created yet' }}</p>
                  <button @click="resetForm"
                    class="mt-2 px-3 py-1 text-xs rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all">
                    <i class="fas fa-plus mr-1"></i> {{ lang.UI.CreateFirstBlip || 'Create my first blip' }}
                  </button>
                </div>

                <div v-for="(blip, index) in filteredBlips" :key="index"
                  class="bg-black/20 hover:bg-black/30 border border-white/5 rounded-md p-1.5 cursor-pointer transition-all group"
                  :class="{'border-emerald-500/30 bg-emerald-900/10': selectedBlip && selectedBlip.id === blip.id}"
                  @click="selectBlip(blip)">
                  <div class="flex items-center">
                    <div
                      class="w-7 h-7 rounded-md flex items-center justify-center"
                      :style="{backgroundColor: getColorHex(blip.color, '30')}">
                      <div class="w-5 h-5 flex items-center justify-center">
                        <img :src="getIconUrl(blip.icon)"
                          class="w-4 h-4 object-contain"
                          :alt="'Icon ' + blip.icon">
                      </div>
                    </div>
                    <div class="ml-2 flex-1 truncate">
                      <h3 class="text-xs font-medium text-white truncate">{{ blip.name || '' }}</h3>
                      <p class="text-[10px] text-white/40">{{
                        formatCoordinates(blip) }}</p>
                    </div>
                    <div
                      class="flex items-center space-x-0.5 opacity-70 group-hover:opacity-100">
                      <button @click.stop="toggleVisibility(blip.id)"
                        class="w-6 h-6 rounded bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all relative">
                        <i
                          :class="[blip.visible ? 'fas fa-eye text-emerald-500' : 'fas fa-eye-slash text-white/60']"
                          class="text-xs"></i>
                        <div
                          class="absolute bottom-full mb-1 hidden hover:block bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                          {{ blip.visible ? (lang.UI.HideBlip || 'Hide Blip') : (lang.UI.ShowBlip || 'Show Blip') }}
                        </div>
                      </button>
                      <button @click.stop="editBlip(blip)"
                        class="w-6 h-6 rounded bg-black/30 hover:bg-emerald-500/30 flex items-center justify-center transition-all relative">
                        <i
                          class="fas fa-edit text-xs text-white/60 hover:text-emerald-500"></i>
                        <span
                          class="absolute bottom-full mb-1 opacity-0 hover:opacity-100 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                          {{ lang.UI.EditBlip || 'Edit Blip' }}
                        </span>
                      </button>
                      <button @click.stop="confirmDelete(blip.id)"
                        class="w-6 h-6 rounded bg-black/30 hover:bg-red-500/30 flex items-center justify-center transition-all relative">
                        <i
                          class="fas fa-trash-alt text-xs text-white/60 hover:text-red-500"></i>
                        <div
                          class="tooltip absolute bottom-full mb-1 opacity-0 hover:opacity-100 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                          {{ lang.UI.DeleteBlip || 'Delete Blip' }}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex-1 flex flex-col overflow-hidden">
              <div class="p-2 border-b border-emerald-500/10 bg-black/10">
                <h2 class="text-sm font-medium text-white flex items-center">
                  <i class="fas fa-edit text-emerald-500 mr-1.5"></i> {{
                  isEditing ? (lang.UI.EditBlipTitle || 'Edit Blip') : (lang.UI.NewBlipTitle || 'New Blip') }}
                </h2>
              </div>

              <div class="flex-1 p-3 flex flex-col">
                <div
                  class="space-y-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
                  <div>
                    <label class="block text-white/70 text-xs mb-1">{{ lang.UI.NameLabel || 'Name' }} <span
                        class="text-red-400">*</span></label>
                    <input type="text" v-model="newBlip.name"
                      :placeholder="lang.UI.BlipNamePlaceholder || 'Blip name'"
                      class="w-full bg-black/20 border border-white/5 rounded-md p-2 text-xs text-white focus:outline-none focus:border-emerald-500/30">
                  </div>

                  <div>
                    <label class="block text-white/70 text-[11px] mb-1">{{ lang.UI.LocationLabel || 'Location' }}
                      <span class="text-red-400">*</span></label>
                    <div class="grid grid-cols-3 gap-2">
                      <div class="relative">
                        <input type="number" v-model="newBlip.x" step="0.1"
                          placeholder="X"
                          class="w-full bg-black/20 border border-white/5 rounded-md py-2 pl-2 pr-6 text-xs text-white focus:outline-none focus:border-emerald-500/30 no-spinners">
                        <span
                          class="absolute right-2 top-2 text-xs text-white/40">{{ lang.UI.XCoord || 'X' }}</span>
                      </div>
                      <div class="relative">
                        <input type="number" v-model="newBlip.y" step="0.1"
                          placeholder="Y"
                          class="w-full bg-black/20 border border-white/5 rounded-md py-2 pl-2 pr-6 text-xs text-white focus:outline-none focus:border-emerald-500/30 no-spinners">
                        <span
                          class="absolute right-2 top-2 text-xs text-white/40">{{ lang.UI.YCoord || 'Y' }}</span>
                      </div>
                      <div class="relative">
                        <input type="number" v-model="newBlip.scale" step="0.1" min="0.1" max="5.0"
                          placeholder="Scale"
                          class="w-full bg-black/20 border border-white/5 rounded-md py-2 pl-2 pr-6 text-xs text-white focus:outline-none focus:border-emerald-500/30 no-spinners">
                        <span
                          class="absolute right-2 top-2 text-xs text-white/40">{{ lang.UI.Scale || 'Scale' }}</span>
                      </div>
                    </div>

                    <div class="flex mt-2 space-x-2">
                      <button @click="openCurrentPositionModal"
                        class="flex-1 py-2 rounded bg-black/20 hover:bg-emerald-500/20 text-xs text-white/70 hover:text-emerald-400 flex items-center justify-center transition-all relative">
                        <i class="fas fa-crosshairs mr-1.5"></i> {{ lang.UI.CurrentPosition || 'Current position' }}
                        <div v-if="loadingCurrentPosition"
                          class="loader-circle ml-1 w-2 h-2"></div>
                        <div
                          class="absolute bottom-full mb-1 hidden hover:block bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                          {{ lang.UI.CurrentPositionTooltip || 'Use your current position' }}
                        </div>
                      </button>
                      <button @click="openMapModal"
                        class="flex-1 py-2 rounded bg-black/20 hover:bg-emerald-500/20 text-xs text-white/70 hover:text-emerald-400 flex items-center justify-center transition-all relative">
                        <i class="fas fa-map mr-1.5"></i> {{ lang.UI.SelectOnMap || 'Select on map' }}
                        <div
                          class="absolute bottom-full mb-1 hidden hover:block bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                          {{ lang.UI.SelectOnMapTooltip || 'Choose location on the map' }}
                        </div>
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        class="block text-white/70 text-xs mb-1">{{ lang.UI.IconLabel || 'Icon' }}</label>
                      <div
                        class="bg-black/20 rounded-md border border-white/5 overflow-hidden">
                        <div
                          class="flex items-center px-3 py-2 border-b border-white/10">
                          <div
                            class="w-6 h-6 rounded flex items-center justify-center mr-2 bg-black/30">
                            <img :src="getSelectedIconImage()"
                              class="w-4 h-4 object-contain"
                              :alt="'Icon ' + newBlip.icon"
                              @error="handleIconImageError">
                          </div>
                          <span class="text-xs text-white flex-1">Icon #{{
                            newBlip.icon }}</span>
                        </div>

                        <div class="px-2 pt-2 pb-1 border-b border-white/10">
                          <input type="text" v-model="searchIcons" :placeholder="lang.UI.SearchIconPlaceholder || 'Search icon by number...'"
                            class="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/50">
                          <div
                            class="flex justify-between mt-1 text-[10px] text-white/50">
                            <span>{{ totalFilteredIcons }} {{ lang.UI.IconsShown || 'icons shown' }}</span>
                            <span v-if="isLoadingIcons"
                              class="text-emerald-500 flex items-center">
                              <i class="fas fa-spinner fa-spin mr-1"></i>
                              {{ lang.UI.Loading || 'Loading...' }}
                            </span>
                          </div>
                        </div>

                        <div class="relative">
                          <div
                            class="grid gap-1 h-[120px] overflow-y-auto overflow-x-hidden custom-scrollbar p-1.5"
                            :class="searchIcons ? 'grid-cols-6' : 'grid-cols-5'"
                            id="icons-container">
                            <button v-for="(icon, index) in filteredIcons" :key="index"
                              @click="selectIcon(icon.id)"
                              class="rounded flex flex-col items-center justify-center transition-all icon-button"
                              :data-icon-id="icon.id"
                              :class="[
                              newBlip.icon === icon.id ? 'bg-emerald-500/30' : 'hover:bg-black/40',
                              searchIcons ? 'p-1 text-[10px]' : 'p-1.5 text-xs'
                            ]">
                              <div class="flex items-center justify-center"
                                :class="searchIcons ? 'w-4 h-4' : 'w-5 h-5'">
                                <img :src="getIconUrl(icon.id)"
                                  class="max-w-full max-h-full object-contain"
                                  :alt="'Icon ' + icon.id"
                                  loading="lazy"
                                  @error="handleIconImageError">
                              </div>
                              <span class="mt-0.5 text-white/60 text-[10px]">{{
                                icon.id }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        class="block text-white/70 text-xs mb-1">{{ lang.UI.ColorLabel || 'Color' }}</label>
                      <div
                        class="bg-black/20 rounded-md border border-white/5 overflow-hidden">
                        <div
                          class="flex items-center px-3 py-2 border-b border-white/10">
                          <div
                            class="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                            :style="{ backgroundColor: getColorHex(newBlip.color) }">
                            <i v-if="newBlip.color !== undefined"
                              class="fas fa-check text-xs"
                              :class="isLightColor(getColorHex(newBlip.color)) ? 'text-black' : 'text-white'"></i>
                          </div>
                          <span class="text-xs text-white flex-1">{{
                            getSelectedColorName() }}</span>
                        </div>

                        <div class="px-2 pt-2 pb-1 border-b border-white/10">
                          <div
                            class="w-full bg-black/30 border border-white/10 rounded-md px-2 py-1 text-xs text-white/60">
                            {{ getSelectedColorName() }} (#{{ newBlip.color }})
                          </div>
                          <div
                            class="flex justify-between mt-1 text-[10px] text-white/50">
                            <span>{{ availableColors.length }} {{ lang.UI.ColorsAvailable || 'colors available' }}</span>
                          </div>
                        </div>

                        <div
                          class="flex flex-wrap gap-1 p-2 h-[120px] overflow-y-auto custom-scrollbar">
                          <button v-for="(color, index) in availableColors"
                            :key="index"
                            @click="selectColor(color.id)"
                            class="w-6 h-6 rounded-full flex items-center justify-center transition-all"
                            :style="{ backgroundColor: color.hex }"
                            :class="{ 'ring-2 ring-white': newBlip.color === color.id }">
                            <i v-if="newBlip.color === color.id"
                              class="fas fa-check text-xs"
                              :class="isLightColor(color.hex) ? 'text-black' : 'text-white'"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-end space-x-3 pt-2">
                    <button @click="resetForm"
                      class="px-4 py-2 rounded-md bg-black/20 text-white/70 hover:bg-black/40 transition-all text-xs flex items-center">                  <i class="fas fa-times mr-1.5"></i> {{ lang.UI.Cancel || 'Cancel' }}
                </button>
                <button @click="saveBlip"
                      :disabled="!isFormValid"
                      class="px-4 py-2 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-all text-xs flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                      <i :class="isEditing ? 'fas fa-save' : 'fas fa-plus'"
                        class="mr-1.5"></i>
                      {{ isEditing ? (lang.UI.Save || 'Save') : (lang.UI.Create || 'Create') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="showConfirmDialog"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div
              class="bg-black/90 border border-white/10 rounded-lg w-72 shadow-2xl animate-fadeIn">
              <div class="p-2.5 border-b border-white/10">
                <h3 class="text-sm font-medium text-white">{{ confirmTitle
                  }}</h3>
              </div>
              <div class="p-3">
                <p class="text-xs text-white/70">{{ confirmMessage }}</p>
              </div>
              <div class="p-2 bg-black/30 flex justify-end space-x-2">
                <button @click="cancelConfirmation"
                  class="px-3 py-1 rounded bg-black/50 text-white/70 hover:bg-black/70 transition-all text-xs">
                  {{ lang.UI.Cancel || 'Cancel' }}
                </button>
                <button @click="proceedWithConfirmation"
                  class="px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-[11px]">
                  {{ confirmButtonText }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="showMapModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div
              class="bg-black/90 border border-white/10 rounded-lg w-2/5 max-w-2xl shadow-2xl animate-fadeIn">
              <div
                class="p-2.5 border-b border-white/10 flex items-center justify-between">
                <h3 class="text-sm font-medium text-white">{{ lang.UI.SelectLocationTitle || 'Select Location' }}</h3>
              </div>
              <div class="p-4 text-center text-white/70 text-xs">
                <div ref="mapContainer"
                  class="relative overflow-hidden w-full h-[80vh] mx-auto"
                  @mousedown.prevent="startDrag"
                  @mousemove.prevent="onDrag"
                  @mouseup.prevent="endDrag"
                  @mouseleave.prevent="endDrag"
                  @click="handleMapClick">
                  <div
                    :style="{ transform: 'translate(' + offsetX + 'px,' + offsetY + 'px) scale(' + mapZoom + ')' }"
                    @wheel.prevent="handleMapZoom"
                    class="absolute inset-0 origin-top-left transition-transform duration-200 ease-out">
                    <img src="./assets/map.png" alt="Mapa"
                      class="w-full h-full object-cover">
                    <i v-if="marker"
                       :style="markerStyle"
                       class="fas fa-map-marker-alt absolute text-emerald-500 text-lg transform -translate-x-1/2 -translate-y-1/2 pb-2 pointer-events-none"></i>
                  </div>
                </div>
              </div>
              <div class="p-2.5 bg-black/30 flex justify-end space-x-2">
                <button @click="closeMapModal"
                  class="px-2.5 py-1 rounded bg-black/50 text-white/70 hover:bg-black/70 transition-all text-[10px]">
                  {{ lang.UI.Cancel || 'Cancel' }}
                </button>
                <button @click="confirmMapPosition"
                  class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all text-[10px]">
                  {{ lang.UI.Confirm || 'Confirm' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  `,
  computed: {
    markerStyle() {
      if (!this.marker) return {};
      const x = this.marker.x;
      const y = this.marker.y;

      return {
        left: x + 'px',
        top: y + 'px',
        transform: 'translate(-50%, -50%)'
      };
    },
    filteredBlips() {
      const validBlips = this.blips.filter(b => b);
      if (!this.searchBlips.trim()) return validBlips;

      const query = this.searchBlips.toLowerCase().trim();
      return validBlips.filter(
        (blip) =>
          (blip.name || '').toLowerCase().includes(query) ||
          (blip.id != null && blip.id.toString().includes(query)) ||
          (Array.isArray(blip.tags) &&
            blip.tags.some((tag) => (tag || '').toLowerCase().includes(query)))
      );
    },

    favoriteBlips() {
      return this.blips.filter((blip) => blip.favorite);
    },

    filteredIcons() {
      if (this.searchIcons.trim()) {
        const query = this.searchIcons.toLowerCase().trim();
        const searchNumber = parseInt(query);

        if (!isNaN(searchNumber) && searchNumber >= 0 && searchNumber <= 921) {
          if (!this.isLoadingIcons && this.existingIcons.size > 0) {
            if (this.existingIcons.has(searchNumber)) {
              const exactMatch = {
                id: searchNumber,
                name: `Icon ${searchNumber}`,
                category: "all",
              };

              const otherMatches = this.allIcons.filter(
                (icon) =>
                  icon.id !== searchNumber && icon.id.toString().includes(query)
              );

              return [exactMatch, ...otherMatches];
            } else {
              return this.allIcons.filter((icon) =>
                icon.id.toString().includes(query)
              );
            }
          } else {
            const exactMatch = this.allIcons.find(
              (icon) => icon.id === searchNumber
            );
            const otherMatches = this.allIcons.filter(
              (icon) =>
                icon.id !== searchNumber && icon.id.toString().includes(query)
            );
            return exactMatch ? [exactMatch, ...otherMatches] : otherMatches;
          }
        } else {
          return this.allIcons.filter((icon) =>
            icon.id.toString().includes(query)
          );
        }
      }

      return this.allIcons;
    },

    totalFilteredIcons() {
      return this.filteredIcons.length;
    },

    selectedColorName() {
      const selectedColor = this.availableColors.find(
        (c) => c.id === this.newBlip.color
      );
      return selectedColor ? selectedColor.name : "Blue";
    },
    isFormValid() {
      return this.newBlip.name.trim() !== "";
    },
  },
  methods: {
    initLanguage(lang) {
      this.lang = lang;
      if (this.lang && this.lang.Colors) {
        this.availableColors.forEach(color => {
          const key = color.name.replace(/\s+/g, '');
          if (this.lang.Colors[key]) color.name = this.lang.Colors[key];
        });
      }
    },

    resetForm() {
      this.newBlip = {
        name: "",
        x: 0,
        y: 0,
        z: 0,
        icon: 1,
        color: 3,
        scale: 1.0,
        visible: true,
        tags: [],
      };
      this.isEditing = false;
      this.selectedBlip = null;
    },

    startDrag(event) {
      this.isDragging = true;
      this.startX = event.clientX;
      this.startY = event.clientY;
    },
    onDrag(event) {
      if (!this.isDragging) return;
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.startX = event.clientX;
      this.startY = event.clientY;

      const rect = this.$refs.mapContainer.getBoundingClientRect();
      const minOffsetX = -rect.width * (this.mapZoom - 1);
      const maxOffsetX = 0;
      const minOffsetY = -rect.height * (this.mapZoom - 1);
      const maxOffsetY = 0;
      this.offsetX = Math.min(maxOffsetX, Math.max(minOffsetX, this.offsetX));
      this.offsetY = Math.min(maxOffsetY, Math.max(minOffsetY, this.offsetY));
      this.dragMoved = true;
    },
    endDrag() {
      this.isDragging = false;
    },
    handleMapClick(event) {
      if (this.isDragging) return;
      if (this.dragMoved) {
        this.dragMoved = false;
        return;
      }

      const rect = this.$refs.mapContainer.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      const x = (clickX - this.offsetX) / this.mapZoom;
      const y = (clickY - this.offsetY) / this.mapZoom;
      this.marker = { x, y };
    },
    handleMapZoom(event) {
      const direction = event.deltaY < 0 ? 1 : -1;
      const deltaZoom = direction * this.mapZoomStep;
      this.mapZoom = Math.min(
        this.maxMapZoom,
        Math.max(this.minMapZoom, this.mapZoom + deltaZoom)
      );
    },

    confirmDelete(blipId) {
      this.confirmTitle = this.lang.UI.DeleteBlipMessage || "Delete";
      this.confirmMessage = this.lang.UI.DeleteConfirm || "Are you sure you want to delete this blip? This action cannot be undone.";
      this.confirmButtonText = this.lang.UI.Delete || "Delete";
      this.confirmAction = () => this.deleteBlip(blipId);
      this.showConfirmDialog = true;
    },
    proceedWithConfirmation() {
      if (this.confirmAction) {
        this.confirmAction();
      }
      this.showConfirmDialog = false;
    },

    cancelConfirmation() {
      this.showConfirmDialog = false;
    },

    closeInterface() {
      const appEl = document.getElementById("app");
      if (appEl) {
        appEl.classList.remove("opacity-100");
        appEl.classList.add("opacity-0");

        if (gameView) {
          gameView.stop();
        }
        
        setTimeout(() => {
          appEl.classList.add("hidden");

          const visibility = this.blips.map((b) => ({
            id: b.id,
            visible: b.visible,
          }));
          $.post(
            "https://bit-blips/closeUI",
            JSON.stringify({ blips: visibility })
          );
        }, 300);
      } else {
        $.post(
          "https://bit-blips/closeUI",
          JSON.stringify({
            blips: this.blips.map((b) => ({ id: b.id, visible: b.visible })),
          })
        );
      }
    },

    selectBlip(blip) {
      if (this.selectedBlip && this.selectedBlip.id === blip.id) {
        this.selectedBlip = null;
      } else {
        this.selectedBlip = blip;
      }
    },

    deleteBlip(id) {
      if (!id) return;
      this.isLoading = true;
      this.loadingMessage = this.lang.UI.DeletingBlip || 'Deleting blip...';
      
      $.post('https://bit-blips/deleteBlip', JSON.stringify({ id }))
        .done((response) => {

        })
        .fail((error) => {
          console.error('Error deleting blip:', error);
        })
        .always(() => {
          this.isLoading = false;
        });
    },

    saveBlip() {
      if (!this.newBlip || !this.newBlip.name.trim()) return;
      this.isLoading = true;
      this.loadingMessage = this.isEditing
        ? this.lang.UI.UpdatingBlip || 'Updating blip...'
        : this.lang.UI.CreatingBlip || 'Creating blip...';
      const isNew = !this.isEditing;
      const tempId = Date.now();
      if (!this.newBlip.scale) {
        this.newBlip.scale = 1.0;
      }
      const blipData = { ...this.newBlip, id: this.isEditing && this.selectedBlip ? this.selectedBlip.id : null, action: this.isEditing ? 'update' : 'create' };
      if (isNew) {
        const tempBlip = {
          ...blipData,
          id: tempId,
          tags: [],
        };
        this.blips.unshift(tempBlip);
      }
      $.post('https://bit-blips/saveBlip', JSON.stringify(blipData))
        .done((response) => {

        })
        .fail((error) => {
          console.error('Error saving blip:', error);
        })
        .always(() => {
          this.isLoading = false;
        });
    },
    editBlip(blip) {
      if (!blip) return;

      this.newBlip = { 
        name: blip.name || "",
        x: blip.x || 0,
        y: blip.y || 0,
        z: blip.z || 0,
        icon: blip.icon || 1,
        color: blip.color || 3,
        scale: blip.scale || 1.0,
        visible: typeof blip.visible !== 'undefined' ? blip.visible : true,
        tags: blip.tags || [],
      };
      this.selectedBlip = blip;
      this.isEditing = true;
    },

    toggleVisibility(id) {
      const index = this.blips.findIndex((blip) => blip.id === id);
      if (index !== -1) {
        this.blips[index].visible = !this.blips[index].visible;
      }
    },

    adjustCoord(axis, amount) {
      this.newBlip[axis] = parseFloat(
        (parseFloat(this.newBlip[axis]) + amount).toFixed(2)
      );
    },

    openCurrentPositionModal() {
      this.getCurrentPosition();
    },
    openMapModal() {
      this.showMapModal = true;
    },
    closeMapModal() {
      this.showMapModal = false;
    },
    confirmMapPosition() {
      if (!this.marker) {
        this.closeMapModal();
        return;
      }
      const rect = this.$refs.mapContainer.getBoundingClientRect();

      const normX = this.marker.x / rect.width;
      const normY = this.marker.y / rect.height;

      const MIN_X = -3747;
      const MAX_X = 4500;
      const MIN_Y = -4000;
      const MAX_Y = 8022;

      const worldX = MIN_X + normX * (MAX_X - MIN_X);
      const worldY = MAX_Y - normY * (MAX_Y - MIN_Y); 
      this.newBlip.x = parseFloat(worldX.toFixed(1));
      this.newBlip.y = parseFloat(worldY.toFixed(1));
      this.closeMapModal();
    },
    selectIcon(iconId) {
      this.newBlip.icon = iconId;
    },
    selectColor(colorId) {
      this.newBlip.color = colorId;
    },

    isLightColor(hex) {
      const r = parseInt(hex.substr(1, 2), 16);
      const g = parseInt(hex.substr(3, 2), 16);
      const b = parseInt(hex.substr(5, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 155;
    },

    getColorHex(colorId, opacity) {
      const color = this.availableColors.find((c) => c.id === colorId);
      if (!color) return "#5db6e5";

      if (opacity) {
        const hex = color.hex.replace("#", "");
        return `${color.hex}${opacity}`;
      }

      return color.hex;
    },

    getSelectedColorName() {
      const selectedColor = this.availableColors.find(
        (c) => c.id === this.newBlip.color
      );
      return selectedColor ? selectedColor.name : "Blue";
    },

    getSelectedColorHex() {
      return this.getColorHex(this.newBlip.color);
    },

    loadIcons() {
      this.isLoadingIcons = true;
      const maxIcons = 921;
      this.allIcons = [];
      this.existingIcons = new Set();
      let processed = 0;
      const onProcess = () => {
        processed++;
        if (processed === maxIcons + 1) {
          this.allIcons.sort((a, b) => a.id - b.id);
          this.loadingComplete = true;
          this.isLoadingIcons = false;
        }
      };
      const ids = Array.from({ length: maxIcons + 1 }, (_, i) => i);
      const batchSize = 50;
      const processBatch = () => {
        const batch = ids.splice(0, batchSize);
        batch.forEach((id) => {
          const img = new Image();
          img.onload = () => {
            this.allIcons.push({ id, name: `Icon ${id}`, category: "all" });
            this.existingIcons.add(id);
            onProcess();
          };
          img.onerror = () => { onProcess(); };
          img.src = this.getIconUrl(id);
        });
        if (ids.length > 0) {
          setTimeout(processBatch, 100);
        }
      };
      processBatch();
    },

    getIconUrl(id) {
      return `./assets/blips/${id}.png`;
    },

    getSelectedIconImage() {
      return this.getIconUrl(this.newBlip.icon);
    },

    handleIconImageError(event) {
      event.preventDefault();
      event.stopPropagation();
      const img = event.target;
      const src = img.getAttribute("src") || "";
      if (src.endsWith(".png")) {
        img.src = src.replace(/\.png$/, ".gif");
      } else {
        const btn = img.closest("button");
        if (btn) btn.style.display = "none";
      }
    },

    formatCoordinate(value) {
      return parseFloat(value).toFixed(1);
    },

    formatCoordinates(blip) {
      return `${this.formatCoordinate(blip.x)}, ${this.formatCoordinate(
        blip.y
      )}, ${this.formatCoordinate(blip.z)}`;
    },
    getCurrentPosition() {
      this.loadingCurrentPosition = true;

      if (this.playerCoords) {
        this.newBlip.x = parseFloat(this.playerCoords.x.toFixed(1));
        this.newBlip.y = parseFloat(this.playerCoords.y.toFixed(1));
        this.newBlip.z = parseFloat(this.playerCoords.z.toFixed(1));
        this.loadingCurrentPosition = false;
      } else {
        $.post("https://bit-blips/getCurrentPosition", JSON.stringify({}))
          .done((data) => {
            if (data && data.coords) {
              this.newBlip.x = parseFloat(data.coords.x.toFixed(1));
              this.newBlip.y = parseFloat(data.coords.y.toFixed(1));
              this.newBlip.z = parseFloat(data.coords.z.toFixed(1));
            }
            this.loadingCurrentPosition = false;
          })
          .fail(() => {
            this.loadingCurrentPosition = false;
          });
      }
    },
  },
  mounted() {
    const app = document.getElementById('app');
    const glassElements = document.querySelectorAll('[data-hlsl]');

    if (!this.newBlip) {
      this.newBlip = {
        name: "",
        x: 0,
        y: 0,
        z: 0,
        icon: 1,
        color: 3,
        scale: 1.0,
        visible: true,
        tags: [],
      };
    }

    if (app && glassElements.length > 0) {
      const canvas = document.createElement('canvas');
      canvas.id = 'render';
      Object.assign(canvas.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: config.zindex,
      });
      
      app.insertBefore(canvas, app.firstChild);
      glassElements.forEach(element => {
        if (getComputedStyle(element).position === 'static') {
          element.style.position = 'relative';
        }
        element.style.background = 'rgba(255, 255, 255, 0.0)';
        
        if (!element.hasAttribute('data-blur-strength')) {
          element.setAttribute('data-blur-strength', config.defaultBlurStrength.toString());
        }
      });

      gameView = createGameView(canvas, glassElements);
      
      if (gameView) {
        const updateSize = () => gameView.resize(window.innerWidth, window.innerHeight);
        updateSize();
        window.addEventListener('resize', updateSize);
      }
    }

    window.addEventListener("message", (event) => {
      const data = event.data;
      if (data && data.action === "showUI") {
        if (data.coords) {
          this.playerCoords = {
            x: data.coords.x,
            y: data.coords.y,
            z: data.coords.z,
          };
        }

        if (data.blurStrength !== undefined) {
          const mc = this.$refs.mainContainer;
          if (mc) mc.setAttribute('data-blur-strength', data.blurStrength);
        }

        const appEl = document.getElementById("app");
        if (appEl) {
          appEl.classList.remove("hidden");

          if (gameView) {
            gameView.resize(window.innerWidth, window.innerHeight);
            gameView.start();
          }
          
          setTimeout(() => {
            appEl.classList.remove("opacity-0");
            appEl.classList.add("opacity-100");
          }, 10);
        }
      } else if (data && data.action === "hideUI") {
        const appEl = document.getElementById("app");
        if (appEl) {
          appEl.classList.remove("opacity-100");
          appEl.classList.add("opacity-0");

          if (gameView) {
            gameView.stop();
          }
          
          setTimeout(() => {
            appEl.classList.add("hidden");
          }, 300);
        }
      } else if (data && data.action === "initBlips") {
        this.blips = data.blips.map((b) => ({
          id: parseInt(b.id, 10),
          name: b.name,
          x: parseFloat(b.x),
          y: parseFloat(b.y),
          z: parseFloat(b.z),
          icon: b.icon,
          color: b.color,
          visible: b.visible == 1 || b.visible === true,
          tags: [],
        }));
      } else if (data && data.action === "saveBlipResult") {
        if (!data.blip) return;

      const blip = data.blip;
      const blipId = parseInt(blip.id, 10);

      let idx = this.blips.findIndex((b) => b.id === blipId);
      if (idx === -1) {
        idx = this.blips.findIndex((b) =>
          (!b.id || typeof b.id === 'number') &&
          b.name === blip.name &&
          parseFloat(b.x) === parseFloat(blip.x) &&
          parseFloat(b.y) === parseFloat(blip.y) &&
          parseFloat(b.z) === parseFloat(blip.z)
        );
      }
      const formatted = {
        id: blipId,
        name: blip.name || "",
        x: parseFloat(blip.x || 0),
        y: parseFloat(blip.y || 0),
        z: parseFloat(blip.z || 0),
        icon: blip.icon || 1,
        color: blip.color || 3,
        visible: blip.visible == 1 || blip.visible === true,
        tags: [],
      };
      if (idx !== -1) {
        this.blips.splice(idx, 1, formatted);
      } else {
        this.blips.unshift(formatted);
      }
        this.resetForm();
      } else if (data && data.action === "deleteBlipResult") {
        const id = data.id;
        this.blips = this.blips.filter((b) => b.id !== id);
        if (this.selectedBlip && this.selectedBlip.id === id) {
          this.selectedBlip = null;
        }
      } else if (data && data.action === "initLang") {
        this.initLanguage(data.lang);
      }
    });

    const origWarn = console.warn;
    console.warn = (...args) => {
      if (
        args.some(
          (arg) => typeof arg === "string" && arg.includes("./assets/blips/")
        )
      )
        return;
      origWarn.apply(console, args);
    };
    const origError = console.error;
    console.error = (...args) => {
      if (
        args.some(
          (arg) => typeof arg === "string" && arg.includes("./assets/blips/")
        )
      )
        return;
      origError.apply(console, args);
    };
    window.addEventListener("error", (e) => {
        if (
          e.target &&
          e.target.src &&
          e.target.src.includes("/assets/blips/")
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true
    );
    this.loadIcons();
  },
}).mount('#app')
