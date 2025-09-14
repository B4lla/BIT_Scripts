const Pacman = {
  props: ['userSettings', 't'],
  emits: ['close'],
  setup(props, { emit }) {
    const { ref, onMounted, onUnmounted, nextTick } = Vue;

    
    const gameCanvas = ref(null)
    const gameCtx = ref(null)

    
    const gameState = ref('menu') 
    const score = ref(0)
    const lives = ref(3)
    const level = ref(1)

    
    const GRID_SIZE = 16
    const CANVAS_WIDTH = 304  
    const CANVAS_HEIGHT = 336 

    
    const gameMap = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
      [1,3,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,3,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,2,1,2,1,1,1,2,1,2,1,1,1,2,1],
      [1,2,2,2,2,2,1,2,2,1,2,2,1,2,2,2,2,2,1],
      [1,1,1,1,1,2,1,1,0,1,0,1,1,2,1,1,1,1,1],
      [0,0,0,0,1,2,1,0,0,0,0,0,1,2,1,0,0,0,0],
      [1,1,1,1,1,2,1,0,1,0,1,0,1,2,1,1,1,1,1],
      [0,0,0,0,0,2,0,0,1,0,1,0,0,2,0,0,0,0,0],
      [1,1,1,1,1,2,1,0,1,1,1,0,1,2,1,1,1,1,1],
      [0,0,0,0,1,2,1,0,0,0,0,0,1,2,1,0,0,0,0],
      [1,1,1,1,1,2,1,1,0,1,0,1,1,2,1,1,1,1,1],
      [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,2,1],
      [1,3,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,3,1],
      [1,1,1,2,1,2,1,2,1,1,1,2,1,2,1,2,1,1,1],
      [1,2,2,2,2,2,1,2,2,1,2,2,1,2,2,2,2,2,1],
      [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]

    
    const pacman = ref({
      x: 9,
      y: 15,
      prevX: 9,
      prevY: 15,
      direction: 'up',
      nextDirection: 'up',
      frame: 0
    })

    
    const ghosts = ref([
      { x: 9, y: 9, direction: 'up', color: 'red', scared: false },
      { x: 8, y: 9, direction: 'down', color: 'pink', scared: false },
      { x: 10, y: 9, direction: 'left', color: 'cyan', scared: false },
      { x: 9, y: 8, direction: 'right', color: 'orange', scared: false }
    ])

    
    let gameLoop = null
    let lastTime = 0
    let lastRenderTime = 0
    const RENDER_FPS = 60 
    const RENDER_INTERVAL = 1000 / RENDER_FPS
    const GAME_SPEED = 150 

    
    const eatenDots = ref(new Set())
    const totalDots = ref(0)

    
    const touchStartPos = ref({ x: 0, y: 0 })

    
    const initGame = () => {
      score.value = 0
      lives.value = 3
      level.value = 1
      eatenDots.value = new Set()
      
      
      totalDots.value = 0
      for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
          if (gameMap[y][x] === 2 || gameMap[y][x] === 3) {
            totalDots.value++
          }
        }
      }

      
      pacman.value = {
        x: 9,
        y: 15,
        direction: 'up',
        nextDirection: 'up',
        frame: 0
      }

      ghosts.value = [
        { x: 9, y: 9, direction: 'up', color: 'red', scared: false },
        { x: 8, y: 9, direction: 'down', color: 'pink', scared: false },
        { x: 10, y: 9, direction: 'left', color: 'cyan', scared: false },
        { x: 9, y: 8, direction: 'right', color: 'orange', scared: false }
      ]
    }

    
    const isValidMove = (x, y) => {
      if (x < 0 || x >= gameMap[0].length || y < 0 || y >= gameMap.length) {
        return false
      }
      return gameMap[y][x] !== 1
    }

    
    const movePacman = () => {
      
      pacman.value.prevX = pacman.value.x
      pacman.value.prevY = pacman.value.y

      const directions = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      }

      
      const nextDir = directions[pacman.value.nextDirection]
      const nextX = pacman.value.x + nextDir.x
      const nextY = pacman.value.y + nextDir.y

      if (isValidMove(nextX, nextY)) {
        pacman.value.direction = pacman.value.nextDirection
      }

      
      const currentDir = directions[pacman.value.direction]
      const newX = pacman.value.x + currentDir.x
      const newY = pacman.value.y + currentDir.y

      if (isValidMove(newX, newY)) {
        pacman.value.x = newX
        pacman.value.y = newY

        
        if (pacman.value.x < 0) {
          pacman.value.x = gameMap[0].length - 1
        } else if (pacman.value.x >= gameMap[0].length) {
          pacman.value.x = 0
        }

        
        const cellKey = pacman.value.x + ',' + pacman.value.y
        if (!eatenDots.value.has(cellKey)) {
          const cell = gameMap[pacman.value.y][pacman.value.x]
          if (cell === 2) {
            eatenDots.value.add(cellKey)
            score.value += 10
          } else if (cell === 3) {
            eatenDots.value.add(cellKey)
            score.value += 50
            
            ghosts.value.forEach(ghost => {
              ghost.scared = true
            })
            setTimeout(() => {
              ghosts.value.forEach(ghost => {
                ghost.scared = false
              })
            }, 5000)
          }
        }

        
        if (eatenDots.value.size >= totalDots.value) {
          level.value++
          initGame()
        }
      }

      pacman.value.frame = (pacman.value.frame + 1) % 4
    }

    
    const moveGhosts = () => {
      ghosts.value.forEach(ghost => {
        const directions = ['up', 'down', 'left', 'right']
        const validDirections = directions.filter(dir => {
          const moves = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
          }
          const move = moves[dir]
          return isValidMove(ghost.x + move.x, ghost.y + move.y)
        })

        if (validDirections.length > 0) {
          
          const randomDirection = validDirections[Math.floor(Math.random() * validDirections.length)]
          ghost.direction = randomDirection

          const moves = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
          }
          const move = moves[ghost.direction]
          ghost.x += move.x
          ghost.y += move.y

          
          if (ghost.x < 0) {
            ghost.x = gameMap[0].length - 1
          } else if (ghost.x >= gameMap[0].length) {
            ghost.x = 0
          }
        }
      })
    }

    
    const checkCollisions = () => {
      ghosts.value.forEach(ghost => {
        if (ghost.x === pacman.value.x && ghost.y === pacman.value.y) {
          if (ghost.scared) {
            
            score.value += 200
            ghost.x = 9
            ghost.y = 9
            ghost.scared = false
          } else {
            
            lives.value
            if (lives.value <= 0) {
              gameState.value = 'gameOver'
            } else {
              
              pacman.value.x = 9
              pacman.value.y = 15
              ghosts.value.forEach((g, i) => {
                g.x = 9 + (i % 2 === 0 ? 0 : i === 1 ? -1 : 1)
                g.y = 9 + (i > 1 ? -1 : 0)
              })
            }
          }
        }
      })
    }

    
    const updateGame = () => {
      movePacman()
      moveGhosts()
      checkCollisions()
    }

    
    const render = (interp = 1) => {
      if (!gameCtx.value) return

      const ctx = gameCtx.value
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      
      for (let y = 0; y < gameMap.length; y++) {
        for (let x = 0; x < gameMap[y].length; x++) {
          const cell = gameMap[y][x]
          const cellKey = x + ',' + y

          if (cell === 1) {
            
            ctx.fillStyle = '#0000FF'
            ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
          } else if (cell === 2 && !eatenDots.value.has(cellKey)) {
            
            ctx.fillStyle = '#FFFF00'
            ctx.beginPath()
            ctx.arc(x * GRID_SIZE + GRID_SIZE/2, y * GRID_SIZE + GRID_SIZE/2, 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (cell === 3 && !eatenDots.value.has(cellKey)) {
            
            ctx.fillStyle = '#FFFF00'
            ctx.beginPath()
            ctx.arc(x * GRID_SIZE + GRID_SIZE/2, y * GRID_SIZE + GRID_SIZE/2, 6, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      
      ctx.fillStyle = '#FFFF00'
      ctx.beginPath()
      const pacX = (pacman.value.prevX + (pacman.value.x - pacman.value.prevX) * interp) * GRID_SIZE + GRID_SIZE/2
      const pacY = (pacman.value.prevY + (pacman.value.y - pacman.value.prevY) * interp) * GRID_SIZE + GRID_SIZE/2

      if (pacman.value.frame % 2 === 0) {
        ctx.arc(pacX, pacY, GRID_SIZE/2 - 2, 0, Math.PI * 2)
      } else {
        
        const startAngle = pacman.value.direction === 'right' ? 0.2 :
                          pacman.value.direction === 'down' ? Math.PI/2 + 0.2 :
                          pacman.value.direction === 'left' ? Math.PI + 0.2 :
                          3*Math.PI/2 + 0.2
        const endAngle = startAngle + Math.PI * 1.6
        ctx.arc(pacX, pacY, GRID_SIZE/2 - 2, startAngle, endAngle)
        ctx.lineTo(pacX, pacY)
      }
      ctx.fill()

      
      ghosts.value.forEach(ghost => {
        const ghostX = ghost.x * GRID_SIZE + GRID_SIZE/2
        const ghostY = ghost.y * GRID_SIZE + GRID_SIZE/2
        
        ctx.fillStyle = ghost.scared ? '#0000FF' : ghost.color
        ctx.beginPath()
        ctx.arc(ghostX, ghostY - 4, GRID_SIZE/2 - 2, Math.PI, 0)
        ctx.rect(ghostX - GRID_SIZE/2 + 2, ghostY - 4, GRID_SIZE - 4, GRID_SIZE/2)
        ctx.fill()

        
        if (!ghost.scared) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(ghostX - 6, ghostY - 10, 4, 4)
          ctx.fillRect(ghostX + 2, ghostY - 10, 4, 4)
          ctx.fillStyle = '#000000'
          ctx.fillRect(ghostX - 5, ghostY - 9, 2, 2)
          ctx.fillRect(ghostX + 3, ghostY - 9, 2, 2)
        }
      })
    }

    
    const gameLoopFunction = (currentTime) => {
      if (gameState.value !== 'playing') return;
      
      if (!lastTime) lastTime = currentTime;
      
      if (currentTime - lastTime > GAME_SPEED) {
        updateGame();
        
        lastTime += GAME_SPEED;
      }
      
      const interp = Math.min((currentTime - lastTime) / GAME_SPEED, 1);
      render(interp);
      gameLoop = requestAnimationFrame(gameLoopFunction);
    }

    
    const startGame = () => {
      gameState.value = 'playing';
      lastTime = 0;
      lastRenderTime = 0;
      if (!gameLoop) gameLoop = requestAnimationFrame(gameLoopFunction);
    }

    const pauseGame = () => {
      if (gameState.value === 'playing') {
        gameState.value = 'paused'
        if (gameLoop) cancelAnimationFrame(gameLoop)
        gameLoop = null
      } else if (gameState.value === 'paused') {
        gameState.value = 'playing'
        if (!gameLoop) gameLoop = requestAnimationFrame(gameLoopFunction)
      }
    }

    const resetGame = () => {
      gameState.value = 'menu'
      if (gameLoop) cancelAnimationFrame(gameLoop)
      gameLoop = null
      initGame()
    }

    
    const handleTouchStart = (event) => {
      event.preventDefault()
      const touch = event.touches[0]
      const rect = gameCanvas.value.getBoundingClientRect()
      touchStartPos.value = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }

    const handleTouchEnd = (event) => {
      event.preventDefault()
      const touch = event.changedTouches[0]
      const rect = gameCanvas.value.getBoundingClientRect()
      const endPos = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }

      const deltaX = endPos.x - touchStartPos.value.x
      const deltaY = endPos.y - touchStartPos.value.y
      const minSwipeDistance = 30

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          pacman.value.nextDirection = deltaX > 0 ? 'right' : 'left'
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          pacman.value.nextDirection = deltaY > 0 ? 'down' : 'up'
        }
      }
    }

    
    const handleKeyPress = (event) => {
      if (gameState.value !== 'playing') return

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          pacman.value.nextDirection = 'up'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          pacman.value.nextDirection = 'down'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          pacman.value.nextDirection = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          pacman.value.nextDirection = 'right'
          break
      }
    }

    onMounted(() => {
      nextTick(() => {
        if (gameCanvas.value) {
          gameCtx.value = gameCanvas.value.getContext('2d')
          gameCanvas.value.width = CANVAS_WIDTH
          gameCanvas.value.height = CANVAS_HEIGHT
          initGame()
          render()

          
          document.addEventListener('keydown', handleKeyPress)
        }
      })
    })

    onUnmounted(() => {
      if (gameLoop) {
        cancelAnimationFrame(gameLoop)
      }
      document.removeEventListener('keydown', handleKeyPress)
    })

    return {
      gameCanvas,
      gameState,
      score,
      lives,
      level,
      startGame,
      pauseGame,
      resetGame,
      handleTouchStart,
      handleTouchEnd
    }
  },
  template: `
    <div class="pacman-app h-full w-full flex flex-col overflow-hidden"
         :class="userSettings.darkMode ? 'bg-black text-white' : 'bg-gray-900 text-white'">

      
      <header class="relative backdrop-blur-xl border-b border-yellow-500/30 bg-black/90">
        <div class="flex items-center justify-between p-4 pt-16">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <div class="w-6 h-6 bg-yellow-400 rounded-full relative">
                <div class="absolute top-1 right-1 w-2 h-2 bg-black rounded-full"></div>
              </div>
            </div>
            <h1 class="text-xl font-bold text-yellow-400">PAC-MAN</h1>
          </div>
          
          <button @click="$emit('close')" 
                  class="p-2 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </header>

      
      <div class="bg-black/80 p-3 border-b border-yellow-500/30">
        <div class="flex justify-between items-center text-yellow-400 text-sm">
          <div class="flex items-center space-x-3">
            <span class="font-bold">{{ score.toLocaleString() }}</span>
            <span>Lv.{{ level }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <span>Vidas:</span>
            <div class="flex space-x-1">
              <div v-for="life in lives" :key="life" 
                   class="w-3 h-3 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      
      <div class="flex-1 flex items-center justify-center p-2 bg-black overflow-hidden">
        <div class="relative">
          <canvas ref="gameCanvas" 
                  class="border border-blue-500/50 rounded bg-black"
                  @touchstart="handleTouchStart"
                  @touchend="handleTouchEnd">
          </canvas>
          
          
          <div v-if="gameState === 'gameOver'" 
               class="absolute inset-0 bg-black/90 flex items-center justify-center rounded">
            <div class="text-center p-4">
              <h2 class="text-2xl font-bold text-red-500 mb-3">GAME OVER</h2>
              <p class="text-yellow-400 mb-3 text-sm">{{ score.toLocaleString() }} puntos</p>
              <button @click="resetGame" 
                      class="px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors text-sm">
                Jugar de Nuevo
              </button>
            </div>
          </div>

          
          <div v-if="gameState === 'paused'" 
               class="absolute inset-0 bg-black/80 flex items-center justify-center rounded">
            <div class="text-center p-4">
              <h2 class="text-xl font-bold text-yellow-400 mb-3">PAUSADO</h2>
              <button @click="pauseGame" 
                      class="px-4 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors text-sm">
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>

      
      <div class="bg-black/90 p-3 border-t border-yellow-500/30">
        <div v-if="gameState === 'menu'" class="text-center space-y-3">
          <h3 class="text-base font-bold text-yellow-400">¿Listo para jugar?</h3>
          <p class="text-xs text-gray-300">Desliza para mover a Pac-Man</p>
          <button @click="startGame" 
                  class="w-full py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded hover:from-yellow-400 hover:to-yellow-500 transition-all text-sm">
            INICIAR
          </button>
        </div>

        <div v-else class="flex gap-2">
          <button v-if="gameState === 'playing'" 
                  @click="pauseGame" 
                  class="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded hover:from-blue-500 hover:to-blue-600 transition-all text-sm">
            PAUSA
          </button>
          
          <button v-if="gameState === 'paused'" 
                  @click="pauseGame" 
                  class="flex-1 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded hover:from-green-500 hover:to-green-600 transition-all text-sm">
            REANUDAR
          </button>
          
          <button @click="resetGame" 
                  class="flex-1 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded hover:from-red-500 hover:to-red-600 transition-all text-sm">
            REINICIAR
          </button>
        </div>

        
        <div v-if="gameState === 'menu'" class="mt-2 text-center">
          <p class="text-xs text-gray-500">
            Come todos los puntos y evita los fantasmas
          </p>
        </div>
      </div>
    </div>
  `
}
