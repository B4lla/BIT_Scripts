const Calculator = {
  props: ["userSettings", "t"],
  emits: ["close"],
  setup(props) {
    const { ref, computed } = Vue;
    const display = ref("0")
    const previousValue = ref(null)
    const operation = ref(null)
    const waitingForOperand = ref(false)

    const displayValue = computed(() => {
      return Number.parseFloat(display.value).toLocaleString("es-ES", {
        maximumFractionDigits: 8,
      })
    })

    const inputDigit = (digit) => {
      if (waitingForOperand.value) {
        display.value = String(digit)
        waitingForOperand.value = false
      } else {
        if (display.value.length >= 9) return
        display.value = display.value === "0" ? String(digit) : display.value + digit
      }
    }

    const inputDecimal = () => {
      if (!display.value.includes(".")) {
        display.value += "."
      }
    }

    const clear = () => {
      display.value = "0"
      previousValue.value = null
      operation.value = null
      waitingForOperand.value = false
    }

    const performOperation = (nextOperation) => {
      const inputValue = Number.parseFloat(display.value)

      if (previousValue.value !== null && operation.value) {
        const result = calculate(previousValue.value, inputValue, operation.value)
        display.value = String(result)
        previousValue.value = result
      } else {
        previousValue.value = inputValue
      }

      waitingForOperand.value = true
      operation.value = nextOperation === "=" ? null : nextOperation
    }

    const calculate = (first, second, op) => {
      if (op === "+") return first + second
      if (op === "-") return first - second
      if (op === "×") return first * second
      if (op === "÷") return first / second
      return second
    }

    const percentage = () => {
      display.value = String(Number.parseFloat(display.value) / 100)
    }

    const toggleSign = () => {
      display.value = String(Number.parseFloat(display.value) * -1)
    }

    return {
      display,
      displayValue,
      inputDigit,
      inputDecimal,
      clear,
      performOperation,
      percentage,
      toggleSign,
    }
  },
  template: `
  <div class="flex flex-col h-full transition-colors duration-300" :class="userSettings.darkMode ? 'bg-black text-white' : 'bg-white text-black'">
    <div class="flex-1 flex items-end justify-end p-8 pb-4">
      <h1 class="text-8xl font-thin tracking-tight break-all text-right leading-none max-w-full overflow-hidden">{{ displayValue }}</h1>
    </div>

    <div class="grid grid-cols-4 gap-4 p-6 pb-12">
      <button @click="clear" class="h-20 rounded-full text-2xl font-medium active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-500 text-black hover:bg-gray-400' : 'bg-gray-300 text-black hover:bg-gray-200'">AC</button>
      <button @click="toggleSign" class="h-20 rounded-full text-2xl font-medium active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-500 text-black hover:bg-gray-400' : 'bg-gray-300 text-black hover:bg-gray-200'">+/-</button>
      <button @click="percentage" class="h-20 rounded-full text-2xl font-medium active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-500 text-black hover:bg-gray-400' : 'bg-gray-300 text-black hover:bg-gray-200'">%</button>
      <button @click="performOperation('÷')" class="h-20 rounded-full bg-orange-500 text-white text-3xl font-light hover:bg-orange-400 active:scale-95 transition-all duration-200">÷</button>

      <button @click="inputDigit(7)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">7</button>
      <button @click="inputDigit(8)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">8</button>
      <button @click="inputDigit(9)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">9</button>
      <button @click="performOperation('×')" class="h-20 rounded-full bg-orange-500 text-white text-3xl font-light hover:bg-orange-400 active:scale-95 transition-all duration-200">×</button>

      <button @click="inputDigit(4)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">4</button>
      <button @click="inputDigit(5)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">5</button>
      <button @click="inputDigit(6)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">6</button>
      <button @click="performOperation('-')" class="h-20 rounded-full bg-orange-500 text-white text-3xl font-light hover:bg-orange-400 active:scale-95 transition-all duration-200">-</button>

      <button @click="inputDigit(1)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">1</button>
      <button @click="inputDigit(2)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">2</button>
      <button @click="inputDigit(3)" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">3</button>
      <button @click="performOperation('+')" class="h-20 rounded-full bg-orange-500 text-white text-3xl font-light hover:bg-orange-400 active:scale-95 transition-all duration-200">+</button>

      <button @click="inputDigit(0)" class="col-span-2 h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200 text-left pl-8" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">0</button>
      <button @click="inputDecimal" class="h-20 rounded-full text-2xl font-light active:scale-95 transition-all duration-200" :class="userSettings.darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-black hover:bg-gray-50'">,</button>
      <button @click="performOperation('=')" class="h-20 rounded-full bg-orange-500 text-white text-3xl font-light hover:bg-orange-400 active:scale-95 transition-all duration-200">=</button>
    </div>
  </div>
`,
}
