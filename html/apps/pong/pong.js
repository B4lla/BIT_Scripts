const Pong = {
  props: [
    "userSettings",
    "t",
  ],
  emits: ["close", "orientation-change"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted, nextTick } = Vue;
    
    const gameCanvas = ref(null)
    const gameCtx = ref(null)
    const gameState = ref('menu') 
    const difficulty = ref('medium')
    const playerScore = ref(0)
    const aiScore = ref(0)
    const gameSpeed = ref(60) 
    
    
    const game = ref({
      canvas: { width: 400, height: 250 },
      ball: { x: 200, y: 125, vx: 3, vy: 2, radius: 6, speed: 3 },
      player: { x: 10, y: 110, width: 8, height: 60, speed: 5 },
      ai: { x: 382, y: 110, width: 8, height: 60, speed: 3 },
      lastTime: 0
    })

    
    const isLandscape = ref(false)

    
    const touchY = ref(0)
    const isTouching = ref(false)

    
    const difficulties = {
      easy: { aiSpeed: 2, ballSpeed: 2.5, aiReactionDelay: 8 },
      medium: { aiSpeed: 3, ballSpeed: 3, aiReactionDelay: 5 },
      hard: { aiSpeed: 4.5, ballSpeed: 4, aiReactionDelay: 2 },
      insane: { aiSpeed: 6, ballSpeed: 5, aiReactionDelay: 1 }
    }

    
    const initGame = () => {
      const settings = difficulties[difficulty.value]
      const canvas = game.value.canvas
      
      game.value.ball = { 
        x: canvas.width / 2, 
        y: canvas.height / 2, 
        vx: settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
        vy: settings.ballSpeed * (Math.random() > 0.5 ? 1 : -1),
        radius: 6,
        speed: settings.ballSpeed
      }
      
      
      if (isLandscape.value) {
        
        game.value.player = { x: (canvas.width - 60) / 2, y: 10, width: 60, height: 8, speed: 5 }
        game.value.ai = { x: (canvas.width - 60) / 2, y: canvas.height - 18, width: 60, height: 8, speed: settings.aiSpeed }
      } else {
        
        game.value.player = { x: 10, y: (canvas.height - 60) / 2, width: 8, height: 60, speed: 5 }
        game.value.ai = { x: canvas.width - 18, y: (canvas.height - 60) / 2, width: 8, height: 60, speed: settings.aiSpeed }
      }
      
      game.value.ai.reactionDelay = settings.aiReactionDelay
      game.value.ai.delayCounter = 0
    }

    const startGame = () => {
      playerScore.value = 0
      aiScore.value = 0
      
      
      isLandscape.value = true
      emit('orientation-change', 'landscape')
      
      
      game.value.canvas = { width: 250, height: 400 }
      
      
      if (gameCanvas.value) {
        gameCanvas.value.width = game.value.canvas.width
        gameCanvas.value.height = game.value.canvas.height
      }
      
      initGame()
      gameState.value = 'playing'
      gameLoop()
    }

    const pauseGame = () => {
      gameState.value = gameState.value === 'paused' ? 'playing' : 'paused'
    }

    const resetGame = () => {
      gameState.value = 'menu'
      playerScore.value = 0
      aiScore.value = 0
      
      
      isLandscape.value = false
      emit('orientation-change', 'portrait')
      
      
      game.value.canvas = { width: 400, height: 250 }
      
      
      if (gameCanvas.value) {
        gameCanvas.value.width = game.value.canvas.width
        gameCanvas.value.height = game.value.canvas.height
      }
      
      
      nextTick(() => {
        render()
      })
    }

    const updateGame = () => {
      if (gameState.value !== 'playing') return

      const ball = game.value.ball
      const player = game.value.player
      const ai = game.value.ai
      const canvas = game.value.canvas

      
      ball.x += ball.vx
      ball.y += ball.vy

      if (isLandscape.value) {
        
        
        
        if (ball.x <= ball.radius || ball.x >= canvas.width - ball.radius) {
          ball.vx = -ball.vx
        }

        
        if (ball.y <= player.y + player.height + ball.radius &&
            ball.x >= player.x &&
            ball.x <= player.x + player.width &&
            ball.vy < 0) {
          ball.vy = -ball.vy
          const relativeIntersectX = (player.x + player.width / 2) - ball.x
          const normalizedRelativeIntersection = relativeIntersectX / (player.width / 2)
          ball.vx = normalizedRelativeIntersection * ball.speed * -1
        }

        
        if (ball.y >= ai.y - ball.radius &&
            ball.x >= ai.x &&
            ball.x <= ai.x + ai.width &&
            ball.vy > 0) {
          ball.vy = -ball.vy
          const relativeIntersectX = (ai.x + ai.width / 2) - ball.x
          const normalizedRelativeIntersection = relativeIntersectX / (ai.width / 2)
          ball.vx = normalizedRelativeIntersection * ball.speed * -1
        }

        
        if (ball.y < 0) {
          aiScore.value++
          if (aiScore.value >= 5) {
            gameState.value = 'gameOver'
            return
          }
          initGame()
        } else if (ball.y > canvas.height) {
          playerScore.value++
          if (playerScore.value >= 5) {
            gameState.value = 'gameOver'
            return
          }
          initGame()
        }

        
        ai.delayCounter = (ai.delayCounter || 0) + 1
        if (ai.delayCounter >= ai.reactionDelay) {
          const aiCenter = ai.x + ai.width / 2
          if (aiCenter < ball.x - 10) {
            ai.x += ai.speed
          } else if (aiCenter > ball.x + 10) {
            ai.x -= ai.speed
          }
          ai.delayCounter = 0
        }

        
        ai.x = Math.max(0, Math.min(canvas.width - ai.width, ai.x))

      } else {
        
        
        
        if (ball.y <= ball.radius || ball.y >= canvas.height - ball.radius) {
          ball.vy = -ball.vy
        }

        
        if (ball.x <= player.x + player.width + ball.radius &&
            ball.y >= player.y &&
            ball.y <= player.y + player.height &&
            ball.vx < 0) {
          ball.vx = -ball.vx
          const relativeIntersectY = (player.y + player.height / 2) - ball.y
          const normalizedRelativeIntersection = relativeIntersectY / (player.height / 2)
          ball.vy = normalizedRelativeIntersection * ball.speed * -1
        }

        
        if (ball.x >= ai.x - ball.radius &&
            ball.y >= ai.y &&
            ball.y <= ai.y + ai.height &&
            ball.vx > 0) {
          ball.vx = -ball.vx
          const relativeIntersectY = (ai.y + ai.height / 2) - ball.y
          const normalizedRelativeIntersection = relativeIntersectY / (ai.height / 2)
          ball.vy = normalizedRelativeIntersection * ball.speed * -1
        }

        
        if (ball.x < 0) {
          aiScore.value++
          if (aiScore.value >= 5) {
            gameState.value = 'gameOver'
            return
          }
          initGame()
        } else if (ball.x > canvas.width) {
          playerScore.value++
          if (playerScore.value >= 5) {
            gameState.value = 'gameOver'
            return
          }
          initGame()
        }

        
        ai.delayCounter = (ai.delayCounter || 0) + 1
        if (ai.delayCounter >= ai.reactionDelay) {
          const aiCenter = ai.y + ai.height / 2
          if (aiCenter < ball.y - 10) {
            ai.y += ai.speed
          } else if (aiCenter > ball.y + 10) {
            ai.y -= ai.speed
          }
          ai.delayCounter = 0
        }

        
        ai.y = Math.max(0, Math.min(canvas.height - ai.height, ai.y))
      }
    }

    const render = () => {
      if (!gameCtx.value) return

      const ctx = gameCtx.value
      const canvas = game.value.canvas

      
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2, 0)
      ctx.lineTo(canvas.width / 2, canvas.height)
      ctx.stroke()
      ctx.setLineDash([])

      
      ctx.fillStyle = '#00ff00'
      ctx.fillRect(game.value.player.x, game.value.player.y, game.value.player.width, game.value.player.height)

      
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(game.value.ai.x, game.value.ai.y, game.value.ai.width, game.value.ai.height)

      
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(game.value.ball.x, game.value.ball.y, game.value.ball.radius, 0, Math.PI * 2)
      ctx.fill()

      
      ctx.fillStyle = '#ffffff'
      ctx.font = '20px Monaco, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(playerScore.value, canvas.width / 4, 30)
      ctx.fillText(aiScore.value, (canvas.width * 3) / 4, 30)
    }

    const gameLoop = () => {
      if (gameState.value === 'playing') {
        updateGame()
        render()
        requestAnimationFrame(gameLoop)
      }
    }

    
    const handleTouchStart = (event) => {
      event.preventDefault()
      if (gameState.value !== 'playing') return
      
      isTouching.value = true
      const rect = gameCanvas.value.getBoundingClientRect()
      if (isLandscape.value) {
        touchY.value = event.touches[0].clientX - rect.left 
      } else {
        touchY.value = event.touches[0].clientY - rect.top
      }
    }

    const handleTouchMove = (event) => {
      event.preventDefault()
      if (!isTouching.value || gameState.value !== 'playing') return
      
      const rect = gameCanvas.value.getBoundingClientRect()
      
      if (isLandscape.value) {
        
        const currentX = event.touches[0].clientX - rect.left
        const newX = game.value.player.x + (currentX - touchY.value)
        game.value.player.x = Math.max(0, Math.min(game.value.canvas.width - game.value.player.width, newX))
        touchY.value = currentX
      } else {
        
        const currentY = event.touches[0].clientY - rect.top
        const newY = game.value.player.y + (currentY - touchY.value)
        game.value.player.y = Math.max(0, Math.min(game.value.canvas.height - game.value.player.height, newY))
        touchY.value = currentY
      }
    }

    const handleTouchEnd = (event) => {
      event.preventDefault()
      isTouching.value = false
    }

    
    const handleMouseMove = (event) => {
      if (gameState.value !== 'playing') return
      
      const rect = gameCanvas.value.getBoundingClientRect()
      
      if (isLandscape.value) {
        
        const mouseX = event.clientX - rect.left
        const paddleCenter = mouseX - game.value.player.width / 2
        game.value.player.x = Math.max(0, Math.min(game.value.canvas.width - game.value.player.width, paddleCenter))
      } else {
        
        const mouseY = event.clientY - rect.top
        const paddleCenter = mouseY - game.value.player.height / 2
        game.value.player.y = Math.max(0, Math.min(game.value.canvas.height - game.value.player.height, paddleCenter))
      }
    }

    const setDifficulty = (diff) => {
      difficulty.value = diff
    }

    onMounted(() => {
      nextTick(() => {
        if (gameCanvas.value) {
          gameCtx.value = gameCanvas.value.getContext('2d')
          gameCanvas.value.width = game.value.canvas.width
          gameCanvas.value.height = game.value.canvas.height
          render()
        }
      })
    })

    onUnmounted(() => {
      gameState.value = 'menu'
      
      isLandscape.value = false
      emit('orientation-change', 'portrait')
    })

    return {
      gameCanvas,
      gameState,
      difficulty,
      playerScore,
      aiScore,
      game,
      isLandscape,
      startGame,
      pauseGame,
      resetGame,
      setDifficulty,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseMove,
      isTouching
    }
  },
  template: `
    <div class="pong-app h-full w-full flex flex-col overflow-hidden"
         :class="userSettings.darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-b from-blue-50 to-white text-gray-900'">

      
      <header v-if="gameState === 'menu' || gameState === 'gameOver'" class="relative backdrop-blur-xl border-b"
              :class="userSettings.darkMode ? 'bg-green-800/80 border-gray-700/50' : 'bg-green-300/80 border-green-200/50'">
        <div class="absolute inset-0 bg-gradient-to-r opacity-10"
             :class="userSettings.darkMode ? 'from-green-600 to-green-800' : 'from-green-300 to-green-500'"></div>
        
        <div class="relative flex items-center justify-between p-4 pt-16">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-green-500 to-blue-600">
              <span class="text-2xl">🏓</span>
            </div>
            <div>
              <h1 class="text-xl font-bold bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">
                {{ t('pong.title', 'Pong Game') }}
              </h1>
              <p class="text-xs opacity-70">{{ t('pong.subtitle', 'Clásico juego de arcade') }}</p>
            </div>
          </div>
          
          <button @click="$emit('close')" 
                  class="p-3 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  :class="userSettings.darkMode ? 'bg-gray-800/60 hover:bg-red-500/20 text-white hover:text-red-400' : 'bg-white/60 hover:bg-red-50 text-gray-700 hover:text-red-600'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </header>

      
      <button v-if="gameState === 'playing' || gameState === 'paused'" 
              @click="resetGame"
              class="absolute top-4 right-4 z-50 p-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
              :class="userSettings.darkMode ? 'bg-gray-800/80 hover:bg-red-500/20 text-white hover:text-red-400' : 'bg-white/80 hover:bg-red-50 text-gray-700 hover:text-red-600'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      
      <main class="flex-1 flex flex-col items-center justify-center relative"
            :class="gameState === 'playing' || gameState === 'paused' ? 'p-2' : 'p-4'">
        
        
        <div class="relative">
          <canvas ref="gameCanvas" 
                  class="pong-game-canvas rounded-lg"
                  :class="{ 'landscape': isLandscape }"
                  @touchstart="handleTouchStart"
                  @touchmove="handleTouchMove" 
                  @touchend="handleTouchEnd"
                  @mousemove="handleMouseMove">
          </canvas>
          
          
          <div v-if="gameState === 'gameOver'" class="game-over">
            <h3>{{ t('pong.gameOver', '¡Juego Terminado!') }}</h3>
            <p v-if="playerScore >= 5">{{ t('pong.youWin', '¡Has ganado!') }} 🎉</p>
            <p v-else>{{ t('pong.youLose', '¡Has perdido!') }} 😢</p>
            <p>{{ t('pong.finalScore', 'Puntuación final') }}: {{ playerScore }} - {{ aiScore }}</p>
            <div class="flex gap-2 mt-4">
              <button @click="startGame" class="pong-button">
                {{ t('pong.playAgain', 'Jugar de Nuevo') }}
              </button>
              <button @click="resetGame" class="pong-button">
                {{ t('pong.menu', 'Menú') }}
              </button>
            </div>
          </div>
        </div>

        
        <div v-if="gameState !== 'menu'" class="pong-score mt-2">
          {{ t('pong.player', 'Jugador') }}: {{ playerScore }} - {{ t('pong.ai', 'IA') }}: {{ aiScore }}
        </div>

        
        <div v-if="gameState === 'menu' || gameState === 'gameOver'" class="pong-controls w-full max-w-sm mt-4">
          
          
          <div v-if="gameState === 'menu'">
            <h3 class="text-center mb-2 font-semibold">{{ t('pong.difficulty', 'Dificultad') }}</h3>
            <div class="pong-difficulty">
              <button v-for="diff in ['easy', 'medium', 'hard', 'insane']" 
                      :key="diff"
                      @click="setDifficulty(diff)"
                      class="difficulty-btn"
                      :class="{ active: difficulty === diff }">
                {{ t('pong.difficulties.' + diff, diff.charAt(0).toUpperCase() + diff.slice(1)) }}
              </button>
            </div>
          </div>

          
          <div class="flex gap-2">
            <button v-if="gameState === 'menu'" 
                    @click="startGame" 
                    class="pong-button flex-1">
              {{ t('pong.start', 'Comenzar Juego') }}
            </button>
            
            <button v-if="gameState === 'playing'" 
                    @click="pauseGame" 
                    class="pong-button flex-1">
              {{ t('pong.pause', 'Pausar') }}
            </button>
            
            <button v-if="gameState === 'paused'" 
                    @click="pauseGame" 
                    class="pong-button flex-1">
              {{ t('pong.resume', 'Continuar') }}
            </button>
            
            <button v-if="gameState === 'playing' || gameState === 'paused'" 
                    @click="resetGame" 
                    class="pong-button flex-1">
              {{ t('pong.reset', 'Reiniciar') }}
            </button>
          </div>

          
          <div class="pong-status">
            <span v-if="gameState === 'menu'">{{ t('pong.ready', 'Listo para jugar') }}</span>
            <span v-if="gameState === 'playing'" class="blinking">{{ t('pong.playing', 'Jugando...') }}</span>
            <span v-if="gameState === 'paused'">{{ t('pong.paused', 'Juego pausado') }}</span>
          </div>

          
          <div class="pong-instructions">
            {{ t('pong.instructions', 'Toca y arrastra para mover tu paleta (verde). ¡Evita que la pelota pase!') }}
          </div>
        </div>
      </main>
    </div>
  `
}
