const FruitNinja = {
  props: ["userSettings", "t"],
  emits: ["close", "orientation-change"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted, nextTick } = Vue;
    
    const gameCanvas = ref(null)
    const gameCtx = ref(null)
    const gameState = ref('menu') 
    const score = ref(0)
    const lives = ref(3)
    const timeLeft = ref(60)
    const combo = ref(0)
    const maxCombo = ref(0)
    
    
    const fruits = ref([])
    const bombs = ref([])
    const particles = ref([])
    const slashes = ref([])
    
    
    const gameConfig = ref({
      fruitSpeed: 2.5,
      bombChance: 0.12, 
      spawnRate: 800, 
      gravity: 0.18,
      particleLife: 40,
      slashLife: 25,
      canvas: {
        width: 400,
        height: 600
      }
    })

    
    const isLandscape = ref(false)
    const isSlicing = ref(false)
    const mousePos = ref({ x: 0, y: 0 })
    const lastMousePos = ref({ x: 0, y: 0 })
    
    
    let gameLoop = null
    let spawnTimer = null
    let countdownTimer = null

    
    const fruitTypes = [
      { name: 'apple', image: './assets/games/fruitNinja/apple.png', pieces: ['./assets/games/fruitNinja/apple-1.png', './assets/games/fruitNinja/apple-2.png'], points: 10 },
      { name: 'banana', image: './assets/games/fruitNinja/banana.png', pieces: ['./assets/games/fruitNinja/banana-1.png', './assets/games/fruitNinja/banana-2.png'], points: 15 },
      { name: 'peach', image: './assets/games/fruitNinja/peach.png', pieces: ['./assets/games/fruitNinja/peach-1.png', './assets/games/fruitNinja/peach-2.png'], points: 20 },
      { name: 'watermelon', image: './assets/games/fruitNinja/sandia.png', pieces: ['./assets/games/fruitNinja/sandia-1.png', './assets/games/fruitNinja/sandia-2.png'], points: 25 },
      { name: 'coconut', image: './assets/games/fruitNinja/basaha.png', pieces: ['./assets/games/fruitNinja/basaha-1.png', './assets/games/fruitNinja/basaha-2.png'], points: 30 }
    ]

    
    const imageCache = ref({})
    
    const preloadImages = async () => {
      const imagesToLoad = [
        './assets/games/fruitNinja/boom.png',
        ...fruitTypes.flatMap(fruit => [fruit.image, ...fruit.pieces])
      ]
      
      for (const src of imagesToLoad) {
        try {
          const img = new Image()
          img.src = src
          await new Promise((resolve, reject) => {
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
          })
          imageCache.value[src] = img
          
        } catch (error) {
          console.error(`[FruitNinja] Error loading image: ${src}`, error)
        }
      }
      .length} images`)
    }

    
    class GameObject {
      constructor(x, y, vx, vy) {
        this.x = x
        this.y = y
        this.vx = vx
        this.vy = vy
        this.life = 100
        this.maxLife = 100
      }
      
      update() {
        this.x += this.vx
        this.y += this.vy
        this.vy += gameConfig.value.gravity
        this.life
      }
      
      isOffScreen() {
        return this.y > gameConfig.value.canvas.height + 50 || this.life <= 0
      }
    }

    class Fruit extends GameObject {
      constructor(x, y, vx, vy, type) {
        super(x, y, vx, vy)
        this.type = type
        this.radius = 35 + Math.random() * 10 
        this.angle = 0
        this.rotationSpeed = (Math.random() - 0.5) * 0.2
        this.sliced = false
        this.scale = 0.9 + Math.random() * 0.3 
      }
      
      update() {
        super.update()
        this.angle += this.rotationSpeed
      }
      
      draw(ctx) {
        const img = imageCache.value[this.type.image]
        if (!img) return
        
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.scale(this.scale, this.scale)
        ctx.drawImage(img, -this.radius, -this.radius, this.radius * 2, this.radius * 2)
        ctx.restore()
      }
      
      checkSlice(slashPoints) {
        for (let i = 0; i < slashPoints.length - 1; i++) {
          const p1 = slashPoints[i]
          const p2 = slashPoints[i + 1]
          
          if (this.lineIntersectsCircle(p1, p2, { x: this.x, y: this.y }, this.radius)) {
            return true
          }
        }
        return false
      }
      
      lineIntersectsCircle(p1, p2, circle, radius) {
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const fx = p1.x - circle.x
        const fy = p1.y - circle.y
        
        const a = dx * dx + dy * dy
        const b = 2 * (fx * dx + fy * dy)
        const c = (fx * fx + fy * fy) - radius * radius
        
        const discriminant = b * b - 4 * a * c
        
        if (discriminant < 0) return false
        
        const discriminantSqrt = Math.sqrt(discriminant)
        const t1 = (-b - discriminantSqrt) / (2 * a)
        const t2 = (-b + discriminantSqrt) / (2 * a)
        
        return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)
      }
      
      slice(slashAngle) {
        this.sliced = true
        
        
        for (let i = 0; i < 2; i++) {
          const piece = new FruitPiece(
            this.x + (Math.random() - 0.5) * 20,
            this.y + (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8 - 2,
            this.type.pieces[i]
          )
          particles.value.push(piece)
        }
        
        
        for (let i = 0; i < 8; i++) {
          const particle = new Particle(
            this.x,
            this.y,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10 - 5,
          )
          particles.value.push(particle)
        }
        
        
        score.value += this.type.points * (combo.value + 1)
        combo.value++
        maxCombo.value = Math.max(maxCombo.value, combo.value)
      }
    }

    class Bomb extends GameObject {
      constructor(x, y, vx, vy) {
        super(x, y, vx, vy)
        this.radius = 30 + Math.random() * 8 
        this.angle = 0
        this.rotationSpeed = (Math.random() - 0.5) * 0.3
      }
      
      update() {
        super.update()
        this.angle += this.rotationSpeed
      }
      
      draw(ctx) {
        const img = imageCache.value['./assets/games/fruitNinja/boom.png']
        if (!img) return
        
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.drawImage(img, -this.radius, -this.radius, this.radius * 2, this.radius * 2)
        ctx.restore()
      }
      
      checkSlice(slashPoints) {
        for (let i = 0; i < slashPoints.length - 1; i++) {
          const p1 = slashPoints[i]
          const p2 = slashPoints[i + 1]
          
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const fx = p1.x - this.x
          const fy = p1.y - this.y
          
          const a = dx * dx + dy * dy
          const b = 2 * (fx * dx + fy * dy)
          const c = (fx * fx + fy * fy) - this.radius * this.radius
          
          const discriminant = b * b - 4 * a * c
          
          if (discriminant >= 0) {
            const discriminantSqrt = Math.sqrt(discriminant)
            const t1 = (-b - discriminantSqrt) / (2 * a)
            const t2 = (-b + discriminantSqrt) / (2 * a)
            
            if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
              return true
            }
          }
        }
        return false
      }
      
      explode() {
        
        for (let i = 0; i < 15; i++) {
          const particle = new Particle(
            this.x,
            this.y,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15 - 8,
            
          )
          particles.value.push(particle)
        }
        
        
        lives.value
        combo.value = 0
      }
    }

    class FruitPiece extends GameObject {
      constructor(x, y, vx, vy, imageSrc) {
        super(x, y, vx, vy)
        this.imageSrc = imageSrc
        this.angle = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.4
        this.scale = 0.8 + Math.random() * 0.4
        this.life = 60
      }
      
      update() {
        super.update()
        this.angle += this.rotationSpeed
      }
      
      draw(ctx) {
        const img = imageCache.value[this.imageSrc]
        if (!img) return
        
        const alpha = this.life / 60
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        ctx.scale(this.scale, this.scale)
        ctx.drawImage(img, -15, -15, 30, 30)
        ctx.restore()
      }
    }

    class Particle extends GameObject {
      constructor(x, y, vx, vy, color) {
        super(x, y, vx, vy)
        this.color = color
        this.size = 2 + Math.random() * 4
        this.life = gameConfig.value.particleLife
      }
      
      update() {
        super.update()
        this.size *= 0.98
      }
      
      draw(ctx) {
        const alpha = this.life / gameConfig.value.particleLife
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    class Slash {
      constructor() {
        this.points = []
        this.life = gameConfig.value.slashLife
      }
      
      addPoint(x, y) {
        this.points.push({ x, y })
        if (this.points.length > 5) {
          this.points.shift()
        }
      }
      
      update() {
        this.life
      }
      
      draw(ctx) {
        if (this.points.length < 2) return
        
        const alpha = this.life / gameConfig.value.slashLife
        ctx.save()
        ctx.globalAlpha = alpha * 0.8
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 6
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        ctx.beginPath()
        ctx.moveTo(this.points[0].x, this.points[0].y)
        for (let i = 1; i < this.points.length; i++) {
          ctx.lineTo(this.points[i].x, this.points[i].y)
        }
        ctx.stroke()
        
        
        ctx.globalAlpha = alpha
        ctx.strokeStyle = '#ff4444'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.restore()
      }
    }

    
    const initGame = () => {
      const canvas = gameCanvas.value
      if (!canvas) {
        console.error('[FruitNinja] Canvas not found!')
        return
      }
      
      
      
      if (isLandscape.value) {
        gameConfig.value.canvas.width = 600
        gameConfig.value.canvas.height = 400
      } else {
        gameConfig.value.canvas.width = 400
        gameConfig.value.canvas.height = 600
      }
      
      canvas.width = gameConfig.value.canvas.width
      canvas.height = gameConfig.value.canvas.height
      gameCtx.value = canvas.getContext('2d')
      
      if (!gameCtx.value) {
        return
      }
      
      
      
      score.value = 0
      lives.value = 3
      timeLeft.value = 60
      combo.value = 0
      maxCombo.value = 0
      fruits.value = []
      bombs.value = []
      particles.value = []
      slashes.value = []

    }

    const startGame = () => {
      stopGameLoop()
      stopSpawnTimer()
      stopCountdown()
      
      gameState.value = 'playing'

      
      isLandscape.value = true
      emit('orientation-change', 'landscape')

      nextTick(() => {
        initGame()
        
        
        setTimeout(() => {
          startGameLoop()
          startSpawnTimer()
          startCountdown()

          setTimeout(() => {
            spawnFruit()
            spawnFruit()
          }, 1000)
        }, 100)
      })
    }

    const pauseGame = () => {
      gameState.value = 'paused'
      stopGameLoop()
      stopSpawnTimer()
      stopCountdown()
    }

    const resumeGame = () => {
      gameState.value = 'playing'
      startGameLoop()
      startSpawnTimer()
      startCountdown()
    }

    const endGame = () => {
      gameState.value = 'gameOver'
      stopGameLoop()
      stopSpawnTimer()
      stopCountdown()
    }

    const returnToMenu = () => {
      gameState.value = 'menu'
      isLandscape.value = false
      emit('orientation-change', 'portrait')
      stopGameLoop()
      stopSpawnTimer()
      stopCountdown()
    }

    const spawnFruit = () => {
      const canvas = gameConfig.value.canvas
      const x = Math.random() * (canvas.width - 100) + 50
      const y = canvas.height + 50
      const vx = (Math.random() - 0.5) * 4
      const vy = -8 - Math.random() * 6
      
      if (Math.random() < gameConfig.value.bombChance) {
        const bomb = new Bomb(x, y, vx, vy)
        bombs.value.push(bomb)
        
      } else {
        
        const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)]
        const fruit = new Fruit(x, y, vx, vy, fruitType)
        fruits.value.push(fruit)
        
      }
    }

    const update = () => {
      
      fruits.value.forEach(fruit => fruit.update())
      fruits.value = fruits.value.filter(fruit => !fruit.isOffScreen() && !fruit.sliced)
      
      
      bombs.value.forEach(bomb => bomb.update())
      bombs.value = bombs.value.filter(bomb => !bomb.isOffScreen())
      
      
      particles.value.forEach(particle => particle.update())
      particles.value = particles.value.filter(particle => !particle.isOffScreen())
      
      
      slashes.value.forEach(slash => slash.update())
      slashes.value = slashes.value.filter(slash => slash.life > 0)
      
      
      const missedFruits = fruits.value.filter(fruit => fruit.y > gameConfig.value.canvas.height)
      if (missedFruits.length > 0) {
        lives.value
        combo.value = 0
        fruits.value = fruits.value.filter(fruit => fruit.y <= gameConfig.value.canvas.height)
      }
      
      
      if (lives.value <= 0 || timeLeft.value <= 0) {
        endGame()
      }
    }

    const draw = () => {
      const ctx = gameCtx.value
      if (!ctx) {
        console.warn('[FruitNinja] No context available for drawing')
        return
      }
      
      
      const gradient = ctx.createLinearGradient(0, 0, 0, gameConfig.value.canvas.height)
      gradient.addColorStop(0, '#87CEEB')
      gradient.addColorStop(1, '#FFE4B5')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, gameConfig.value.canvas.width, gameConfig.value.canvas.height)
      
      
      if (gameState.value === 'playing') {
        ctx.fillStyle = '#FF0000'
        ctx.beginPath()
        ctx.arc(gameConfig.value.canvas.width / 2, gameConfig.value.canvas.height / 2, 20, 0, Math.PI * 2)
        ctx.fill()
        
        
        ctx.fillStyle = '#000000'
        ctx.font = '20px Arial'
        ctx.fillText('FruitNinja Activo', 10, 30)
        ctx.fillText(`Frutas: ${fruits.value.length}`, 10, 60)
        ctx.fillText(`Bombas: ${bombs.value.length}`, 10, 90)
      }
      
      
      fruits.value.forEach(fruit => fruit.draw(ctx))
      
      
      bombs.value.forEach(bomb => bomb.draw(ctx))
      
      
      particles.value.forEach(particle => particle.draw(ctx))
      
      
      slashes.value.forEach(slash => slash.draw(ctx))
    }

    const startGameLoop = () => {
      gameLoop = setInterval(() => {
        update()
        draw()
      }, 1000 / 60) 
    }

    const stopGameLoop = () => {
      if (gameLoop) {
        clearInterval(gameLoop)
        gameLoop = null
      }
    }

    const startSpawnTimer = () => {
      spawnTimer = setInterval(spawnFruit, gameConfig.value.spawnRate)
    }

    const stopSpawnTimer = () => {
      if (spawnTimer) {
        clearInterval(spawnTimer)
        spawnTimer = null
      }
    }

    const startCountdown = () => {
      countdownTimer = setInterval(() => {
        timeLeft.value
        if (timeLeft.value <= 0) {
          endGame()
        }
      }, 1000)
    }

    const stopCountdown = () => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }

    
    const handleMouseDown = (event) => {
      if (gameState.value !== 'playing') return
      
      isSlicing.value = true
      const rect = gameCanvas.value.getBoundingClientRect()
      mousePos.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      lastMousePos.value = { ...mousePos.value }
      
      const newSlash = new Slash()
      newSlash.addPoint(mousePos.value.x, mousePos.value.y)
      slashes.value.push(newSlash)
    }

    const handleMouseMove = (event) => {
      if (gameState.value !== 'playing' || !isSlicing.value) return
      
      const rect = gameCanvas.value.getBoundingClientRect()
      lastMousePos.value = { ...mousePos.value }
      mousePos.value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      
      
      if (slashes.value.length > 0) {
        slashes.value[slashes.value.length - 1].addPoint(mousePos.value.x, mousePos.value.y)
      }
      
      
      checkSlices()
    }

    const handleMouseUp = () => {
      isSlicing.value = false
    }

    
    const handleTouchStart = (event) => {
      event.preventDefault()
      const touch = event.touches[0]
      handleMouseDown(touch)
    }

    const handleTouchMove = (event) => {
      event.preventDefault()
      const touch = event.touches[0]
      handleMouseMove(touch)
    }

    const handleTouchEnd = (event) => {
      event.preventDefault()
      handleMouseUp()
    }

    const checkSlices = () => {
      if (slashes.value.length === 0) return
      
      const currentSlash = slashes.value[slashes.value.length - 1]
      
      
      fruits.value.forEach(fruit => {
        if (!fruit.sliced && fruit.checkSlice(currentSlash.points)) {
          fruit.slice()
        }
      })
      
      
      bombs.value.forEach((bomb, index) => {
        if (bomb.checkSlice(currentSlash.points)) {
          bomb.explode()
          bombs.value.splice(index, 1)
        }
      })
    }

    
    onMounted(async () => {
      
      
      try {
        await preloadImages()
        
      } catch (error) {
        console.error('[FruitNinja] Error preloading images:', error)
      }
      
      if (gameCanvas.value) {
        
        gameCtx.value = gameCanvas.value.getContext('2d')
        
        if (gameCtx.value) {
          
          initGame()
          
          
          gameCanvas.value.addEventListener('mousedown', handleMouseDown)
          gameCanvas.value.addEventListener('mousemove', handleMouseMove)
          gameCanvas.value.addEventListener('mouseup', handleMouseUp)
          gameCanvas.value.addEventListener('touchstart', handleTouchStart)
          gameCanvas.value.addEventListener('touchmove', handleTouchMove)
          gameCanvas.value.addEventListener('touchend', handleTouchEnd)
          
          
        } else {
          console.error('[FruitNinja] Failed to get 2D context from canvas')
        }
      } else {
        console.error('[FruitNinja] Canvas element not found')
      }
    })

    onUnmounted(() => {
      stopGameLoop()
      stopSpawnTimer()
      stopCountdown()
      
      
      isLandscape.value = false
      emit('orientation-change', 'portrait')
      
      
      if (gameCanvas.value) {
        gameCanvas.value.removeEventListener('mousedown', handleMouseDown)
        gameCanvas.value.removeEventListener('mousemove', handleMouseMove)
        gameCanvas.value.removeEventListener('mouseup', handleMouseUp)
        gameCanvas.value.removeEventListener('touchstart', handleTouchStart)
        gameCanvas.value.removeEventListener('touchmove', handleTouchMove)
        gameCanvas.value.removeEventListener('touchend', handleTouchEnd)
      }
    })

    return {
      gameCanvas,
      gameState,
      score,
      lives,
      timeLeft,
      combo,
      maxCombo,
      isLandscape,
      startGame,
      pauseGame,
      resumeGame,
      returnToMenu,
      gameConfig
    }
  },

  template: `
    <div class="fruitninja-app w-full h-full bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 relative overflow-hidden">
      
      <div v-if="gameState === 'menu'" class="fruitninja-menu w-full h-full flex flex-col items-center justify-center text-white">
        <div class="text-center mb-8">
          <h1 class="text-6xl font-bold mb-4 text-yellow-300 drop-shadow-lg">🥷</h1>
          <h2 class="text-4xl font-bold mb-2 drop-shadow-lg">Fruit Ninja</h2>
          <p class="text-lg opacity-80">¡Corta las frutas y evita las bombas!</p>
        </div>
        
        <div class="fruitninja-button rounded-3xl p-8 max-w-sm mx-4">
          <div class="space-y-6">
            <div class="text-center">
              <h3 class="text-xl font-semibold mb-3">Instrucciones</h3>
              <div class="space-y-3 text-sm opacity-90">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🍎</span>
                  <span>Corta las frutas para ganar puntos</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-2xl">💣</span>
                  <span>¡Evita las bombas o perderás vida!</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-2xl">⏰</span>
                  <span>Tienes 60 segundos</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-2xl">❤️</span>
                  <span>3 vidas disponibles</span>
                </div>
              </div>
            </div>
            
            <button @click="startGame" 
                    class="fruitninja-button w-full py-4 px-6 rounded-xl font-bold text-lg">
              🎮 Jugar
            </button>
          </div>
        </div>
      </div>

      
      <div v-if="gameState === 'playing' || gameState === 'paused'" 
           class="w-full h-full flex flex-col"
           :class="isLandscape ? 'landscape-mode' : ''">
        
        
        <div class="fruitninja-hud flex justify-between items-center p-4 text-white">
          <div class="flex items-center gap-4">
            <button @click="pauseGame" 
                    class="fruitninja-button p-2 rounded-lg">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
            <div class="text-lg font-bold">Puntuación: {{ score.toLocaleString() }}</div>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <span class="text-red-400">❤️</span>
              <span class="font-bold">{{ lives }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-yellow-400">⏰</span>
              <span class="font-bold">{{ timeLeft }}s</span>
            </div>
            <div v-if="combo > 0" class="flex items-center gap-1">
              <span class="text-orange-400">🔥</span>
              <span class="font-bold">{{ combo }}x</span>
            </div>
          </div>
        </div>

        
        <div class="flex-1 relative overflow-hidden">
          <canvas ref="gameCanvas" 
                  class="absolute inset-0 w-full h-full object-contain cursor-crosshair"
                  :width="gameConfig.canvas.width" 
                  :height="gameConfig.canvas.height">
          </canvas>
          
          
          <div v-if="gameState === 'paused'" 
               class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div class="fruitninja-button rounded-3xl p-8 text-white text-center">
              <h3 class="text-3xl font-bold mb-4">⏸️ Pausado</h3>
              <div class="space-y-4">
                <button @click="resumeGame" 
                        class="fruitninja-button w-full py-3 px-6 rounded-xl font-semibold">
                  Continuar
                </button>
                <button @click="returnToMenu" 
                        class="fruitninja-button w-full py-3 px-6 rounded-xl font-semibold">
                  Menú Principal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div v-if="gameState === 'gameOver'" 
           class="fruitninja-menu w-full h-full flex flex-col items-center justify-center text-white">
        <div class="text-center mb-8">
          <h1 class="text-6xl font-bold mb-4">🎯</h1>
          <h2 class="text-4xl font-bold mb-4 text-red-400">¡Juego Terminado!</h2>
        </div>
        
        <div class="fruitninja-score-card rounded-3xl p-8 max-w-sm mx-4">
          <div class="text-center space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="fruitninja-button rounded-xl p-3">
                <div class="text-yellow-400 font-bold text-xl">{{ score.toLocaleString() }}</div>
                <div class="opacity-80">Puntuación Final</div>
              </div>
              <div class="fruitninja-button rounded-xl p-3">
                <div class="text-orange-400 font-bold text-xl">{{ maxCombo }}x</div>
                <div class="opacity-80">Máximo Combo</div>
              </div>
            </div>
            
            <div class="space-y-3 pt-4">
              <button @click="startGame" 
                      class="fruitninja-button w-full py-3 px-6 rounded-xl font-semibold">
                🔄 Jugar de Nuevo
              </button>
              <button @click="returnToMenu" 
                      class="fruitninja-button w-full py-3 px-6 rounded-xl font-semibold">
                🏠 Menú Principal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
