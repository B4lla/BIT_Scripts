const Stack = {
  props: ['userSettings', 't'],
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, onMounted, onUnmounted } = Vue;
    const gameContainer = ref(null);
    const gameState = ref('menu'); 
    const score = ref(0);
    const bestScore = ref(0);
    
    let scene, camera, renderer, world;
    let stack = [];
    let overhangs = [];
    let boxHeight = 1;
    let originalBoxSize = 3;
    let nextDir = 'x';
    let currentBoxColor = 0x0077ff;
    let isGameRunning = false;
    let autopilot = true;
    let gameEnded = false;
    let robotPrecision = true;

    const boxColors = [
      0x0077ff, 0x00ddff, 0x0099ff, 0x00bbff, 0x0066ff,
      0x0055ff, 0x0088ff, 0x00aaff, 0x0044ff, 0x0033ff
    ];

    onMounted(() => {
      init();
      render();
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('resize', onWindowResize);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onWindowResize);
      if (renderer) {
        renderer.dispose();
      }
    });

    function init() {
      
      scene = new THREE.Scene();
      
      
      world = new CANNON.World();
      world.gravity.set(0, -10, 0);
      world.broadphase = new CANNON.NaiveBroadphase();
      world.solver.iterations = 40;
      
      
      addLayer(0, 0, originalBoxSize, originalBoxSize);
      
      
      addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x');
      
      
      const aspect = gameContainer.value.clientWidth / gameContainer.value.clientHeight;
      const width = 10;
      const height = width / aspect;
      
      camera = new THREE.OrthographicCamera(
        width / -2, width / 2, height / 2, height / -2, 0, 100
      );
      
      camera.position.set(4, 4, 4);
      camera.lookAt(0, 0, 0);
      
      
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(gameContainer.value.clientWidth, gameContainer.value.clientHeight);
      
      renderer.setClearColor(0x000000, 0);
      gameContainer.value.appendChild(renderer.domElement);
      
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight.position.set(10, 20, 0);
      scene.add(directionalLight);
    }

    function startGame() {
      autopilot = false;
      gameEnded = false;
      isGameRunning = true;
      gameState.value = 'playing';
      
      if (stack.length <= 1) {
        score.value = 0;
      }
    }

    function restartGame() {
      
      if (gameContainer.value) {
        gameContainer.value.innerHTML = '';
      }
      gameEnded = false;
      isGameRunning = false;
      autopilot = true;
      gameState.value = 'menu';
      score.value = 0;
      
      stack.forEach(layer => {
        scene.remove(layer.threejs);
        world.removeBody(layer.cannonjs);
      });
      overhangs.forEach(overhang => {
        scene.remove(overhang.threejs);
        world.removeBody(overhang.cannonjs);
      });
      stack = [];
      overhangs = [];
      
      if (boxColors.length - 1 - score.value <= 0) {
        currentBoxColor = boxColors[0];
      } else {
        currentBoxColor = boxColors[boxColors.length - 1 - score.value];
      }
      
      init();
      
      startGame();
      requestAnimationFrame(animation);
    }

    function generateBox(x, y, z, width, depth, falls) {
      
      const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
      const color = new THREE.Color('hsl(' + (30 + stack.length * 4) + ', 100%, 50%)');
      const material = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      
      
      const shape = new CANNON.Box(new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2));
      let mass = falls ? 5 : 0;
      mass *= width / originalBoxSize;
      mass *= depth / originalBoxSize;
      const body = new CANNON.Body({ mass, shape });
      body.position.set(x, y, z);
      world.addBody(body);
      
      return { threejs: mesh, cannonjs: body, width, depth };
    }

    function addLayer(x, z, width, depth, direction) {
      const y = boxHeight * stack.length;
      const layer = generateBox(x, y, z, width, depth, false);
      layer.direction = direction;
      stack.push(layer);
    }

    function addOverhang(x, z, width, depth) {
      const y = boxHeight * (stack.length - 1);
      const overhang = generateBox(x, y, z, width, depth, true);
      overhangs.push(overhang);
    }

    function cutBox(topLayer, overlap, size, delta) {
      const direction = topLayer.direction;
      const newWidth = direction === 'x' ? overlap : topLayer.width;
      const newDepth = direction === 'z' ? overlap : topLayer.depth;
      
      
      topLayer.width = newWidth;
      topLayer.depth = newDepth;
      
      
      topLayer.threejs.scale[direction] = overlap / size;
      topLayer.threejs.position[direction] -= delta / 2;
      
      
      topLayer.cannonjs.position[direction] -= delta / 2;
      
      const shape = new CANNON.Box(
        new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
      );
      topLayer.cannonjs.shapes = [];
      topLayer.cannonjs.addShape(shape);
    }

    function eventHandler() {
      if (autopilot) startGame();
      else splitBlockAndAddNext();
    }

    function splitBlockAndAddNext() {
      if (gameEnded) return;
      
      const topLayer = stack[stack.length - 1];
      const previousLayer = stack[stack.length - 2];
      
      const direction = topLayer.direction;
      
      const size = direction === 'x' ? topLayer.width : topLayer.depth;
      const delta = topLayer.threejs.position[direction] - previousLayer.threejs.position[direction];
      const overhangSize = Math.abs(delta);
      const overlap = size - overhangSize;
      
      if (overlap > 0) {
        cutBox(topLayer, overlap, size, delta);
        
        
        const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
        const overhangX = direction === 'x' 
          ? topLayer.threejs.position.x + overhangShift 
          : topLayer.threejs.position.x;
        const overhangZ = direction === 'z' 
          ? topLayer.threejs.position.z + overhangShift 
          : topLayer.threejs.position.z;
        const overhangWidth = direction === 'x' ? overhangSize : topLayer.width;
        const overhangDepth = direction === 'z' ? overhangSize : topLayer.depth;
        
        addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);
        
        
        const nextX = direction === 'x' ? topLayer.threejs.position.x : -10;
        const nextZ = direction === 'z' ? topLayer.threejs.position.z : -10;
        const newWidth = topLayer.width;
        const newDepth = topLayer.depth;
        const nextDirection = direction === 'x' ? 'z' : 'x';
        
        if (score.value === bestScore.value) {
          bestScore.value = score.value + 1;
        }
        score.value += 1;
        
        addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
      } else {
        missedTheSpot();
      }
    }

    function missedTheSpot() {
      const topLayer = stack[stack.length - 1];
      
      
      addOverhang(
        topLayer.threejs.position.x,
        topLayer.threejs.position.z,
        topLayer.width,
        topLayer.depth
      );
      
      world.removeBody(topLayer.cannonjs);
      scene.remove(topLayer.threejs);
      
      gameEnded = true;
      isGameRunning = false;
      gameState.value = 'gameOver';
      
      if (score.value > bestScore.value) {
        bestScore.value = score.value;
      }
    }

    function animation(time) {
      if (autopilot) {
        const currentLayer = stack[stack.length - 1];
        const previousLayer = stack[stack.length - 2];
        
        const boxShouldMove = currentLayer.threejs.position[currentLayer.direction] < previousLayer.threejs.position[currentLayer.direction] + robotPrecision;
        
        if (boxShouldMove) {
          currentLayer.threejs.position[currentLayer.direction] += 0.03;
          currentLayer.cannonjs.position[currentLayer.direction] += 0.03;
          
          if (currentLayer.threejs.position[currentLayer.direction] > previousLayer.threejs.position[currentLayer.direction] + robotPrecision) {
            robotPrecision *= -1;
          }
        }
      } else {
        const currentLayer = stack[stack.length - 1];
        
        if (currentLayer) {
          currentLayer.threejs.position[currentLayer.direction] += 0.03;
          currentLayer.cannonjs.position[currentLayer.direction] += 0.03;
          
          if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
            camera.position.y += 0.05;
          }
        }
      }
      
      
      world.step(1 / 60);
      
      
      overhangs.forEach((element) => {
        element.threejs.position.copy(element.cannonjs.position);
        element.threejs.quaternion.copy(element.cannonjs.quaternion);
      });
      
      render();
      requestAnimationFrame(animation);
    }

    function render() {
      renderer.render(scene, camera);
    }

    function onKeyDown(event) {
      if (event.code === 'Space') {
        event.preventDefault();
        eventHandler();
      }
      if (event.code === 'KeyR') {
        event.preventDefault();
        restartGame();
      }
    }

    function onWindowResize() {
      const aspect = gameContainer.value.clientWidth / gameContainer.value.clientHeight;
      const width = 10;
      const height = width / aspect;
      
      camera.left = width / -2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = height / -2;
      
      camera.updateProjectionMatrix();
      
      renderer.setSize(gameContainer.value.clientWidth, gameContainer.value.clientHeight);
    }

    function handleContainerClick() {
      eventHandler();
    }

    
    onMounted(() => {
      requestAnimationFrame(animation);
    });

    return {
      gameContainer,
      gameState,
      score,
      bestScore,
      handleContainerClick,
      startGame: eventHandler,
      resetGame: restartGame
    };
  },
  template: `
    <div class="stack-app h-full w-full flex flex-col overflow-hidden bg-gradient-to-b from-gray-900 via-purple-900 to-indigo-900">

      
      <header class="relative backdrop-blur-xl border-b border-purple-500/30 bg-black/20">
        <div class="flex items-center justify-between p-2 pt-12">
          <div class="flex items-center space-x-2">
            <div class="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <div class="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <h1 class="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">STACK</h1>
          </div>
          
          <button @click="$emit('close')" 
                  class="p-1 rounded-xl hover:bg-purple-500/20 text-purple-400 transition-all duration-200 hover:scale-105">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </header>

      
      <div class="bg-black/20 backdrop-blur-sm p-2 border-b border-purple-500/20">
        <div class="flex justify-between items-center">
          <div class="text-center">
            <p class="text-xs text-purple-300 font-medium">Puntuación</p>
            <p class="text-lg font-bold text-white drop-shadow-lg">{{ score }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-pink-300 font-medium">Mejor</p>
            <p class="text-lg font-bold text-yellow-400 drop-shadow-lg">{{ bestScore }}</p>
          </div>
        </div>
      </div>

      
      <div class="flex-1 flex items-center justify-center relative">
        <div class="relative w-full max-w-sm h-[60vh] mt-[-240px] mx-2">
          <div ref="gameContainer" 
               class="cursor-pointer rounded-xl overflow-hidden bg-transparent shadow-2xl h-full"
               @click="handleContainerClick"
               @touchend.prevent="handleContainerClick"
               style="width: 100%; height: 100%; aspect-ratio: 3/4;">
          </div>
          
          
          <div v-if="gameState === 'menu'" 
               class="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center rounded-xl">
            <div class="text-center p-4 space-y-3">
              <div class="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 shadow-xl">
                <div class="w-8 h-8 bg-white rounded-lg shadow-inner"></div>
              </div>
              <h2 class="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                STACK 3D
              </h2>
              <div class="space-y-1">
                <p class="text-white text-sm font-medium">Apila bloques cortándolos</p>
                <p class="text-purple-300 text-xs">¡Construye la torre más alta!</p>
              </div>
              <button @click="startGame" 
                      class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-xl border border-purple-400/30">
                COMENZAR
              </button>
              <p class="text-xs text-gray-400 mt-2">
                Toca la pantalla para jugar
              </p>
            </div>
          </div>

          
          <div v-if="gameState === 'gameOver'" 
               class="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center rounded-xl">
            <div class="text-center p-4 space-y-3">
              <div class="w-10 h-10 mx-auto bg-red-500 rounded-xl flex items-center justify-center mb-2">
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h2 class="text-lg font-bold text-red-400 mb-2">¡Juego Terminado!</h2>
              <div class="space-y-1">
                <p class="text-white">Puntuación: <span class="text-purple-400 font-bold">{{ score }}</span></p>
                <p v-if="score === bestScore && score > 0" class="text-yellow-400 text-sm font-bold animate-pulse">
                  ¡NUEVO RÉCORD! 🏆
                </p>
                <p v-else class="text-gray-300 text-sm">
                  Mejor: {{ bestScore }}
                </p>
              </div>
              <div class="space-y-2 pt-2">
                <button @click="resetGame" 
                        class="w-full py-2 bg-gray-700/80 text-gray-300 font-bold rounded-xl hover:bg-gray-600/80 transition-all border border-gray-600/30">
                  {{ t('stack.menu.playAgain') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div class="bg-black/20 backdrop-blur-sm p-2 border-t border-purple-500/20">
        <div v-if="gameState === 'playing'" class="text-center">
          <p class="text-sm text-purple-300 font-medium">
            Toca cuando el bloque esté sobre la pila
          </p>
        </div>
        <div v-else class="text-center">
          <p class="text-xs text-gray-400 leading-relaxed">
            Corta los bloques en el momento perfecto para construir tu torre.
          </p>
        </div>
      </div>
    </div>
  `
}

window.Stack = Stack;
window.Stack = window.Stack || Stack;
