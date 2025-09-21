const Crypto = {
  name: 'CryptoWallet',
  emits: ['close'],
  setup() {
    const { ref, computed, onMounted, onUnmounted, watch } = Vue;

    const currentView = ref('portfolio');
    const selectedCrypto = ref(null);
    const userWallets = ref({});
    const transactions = ref([]);
    const moneyBalances = ref({ cash: 0, bank: 0 });
    const cryptoPrices = ref({});
    const lastPriceUpdate = ref(null);
    const loading = ref(false);
    const error = ref('');
    const success = ref('');
    const autoRefresh = ref(true);
    let refreshInterval = null;

    const buyForm = ref({
      cryptoSymbol: '',
      amount: '',
      paymentMethod: 'bank',
      totalCost: 0
    });

    const sellForm = ref({
      cryptoSymbol: '',
      amount: '',
      paymentMethod: 'bank',
      totalReceived: 0
    });

    const supportedCryptos = {
      bitcoin: { 
        symbol: 'BTC', 
        name: 'Bitcoin', 
        icon: '₿',
        color: '#F7931A',
        description: 'La primera y más conocida criptomoneda descentralizada.'
      },
      ethereum: { 
        symbol: 'ETH', 
        name: 'Ethereum', 
        icon: 'Ξ',
        color: '#627EEA',
        description: 'Plataforma para contratos inteligentes y aplicaciones descentralizadas.'
      },
      binancecoin: { 
        symbol: 'BNB', 
        name: 'Binance Coin', 
        icon: 'BNB',
        color: '#F3BA2F',
        description: 'Token nativo del exchange Binance.'
      },
      cardano: { 
        symbol: 'ADA', 
        name: 'Cardano', 
        icon: 'ADA',
        color: '#0033AD',
        description: 'Blockchain de tercera generación enfocada en sostenibilidad.'
      },
      solana: { 
        symbol: 'SOL', 
        name: 'Solana', 
        icon: 'SOL',
        color: '#9945FF',
        description: 'Blockchain de alta velocidad para aplicaciones descentralizadas.'
      },
      dogecoin: { 
        symbol: 'DOGE', 
        name: 'Dogecoin', 
        icon: 'Ð',
        color: '#C2A633',
        description: 'La criptomoneda meme que se volvió mainstream.'
      },
      polygon: { 
        symbol: 'MATIC', 
        name: 'Polygon', 
        icon: 'MATIC',
        color: '#8247E5',
        description: 'Solución de escalabilidad para Ethereum.'
      },
      'avalanche-2': { 
        symbol: 'AVAX', 
        name: 'Avalanche', 
        icon: 'AVAX',
        color: '#E84142',
        description: 'Plataforma para aplicaciones descentralizadas de alta velocidad.'
      },
      litecoin: { 
        symbol: 'LTC', 
        name: 'Litecoin', 
        icon: 'Ł',
        color: '#BFBBBB',
        description: 'La plata digital, procesamiento más rápido que Bitcoin.'
      },
      chainlink: { 
        symbol: 'LINK', 
        name: 'Chainlink', 
        icon: 'LINK',
        color: '#375BD2',
        description: 'Oráculo descentralizado que conecta blockchains con datos externos.'
      },
      polkadot: { 
        symbol: 'DOT', 
        name: 'Polkadot', 
        icon: 'DOT',
        color: '#E6007A',
        description: 'Protocolo de blockchain multicadena e interoperable.'
      },
      'uniswap': { 
        symbol: 'UNI', 
        name: 'Uniswap', 
        icon: 'UNI',
        color: '#FF007A',
        description: 'Protocolo de intercambio descentralizado líder en DeFi.'
      },
      vechain: { 
        symbol: 'VET', 
        name: 'VeChain', 
        icon: 'VET',
        color: '#15BDFF',
        description: 'Blockchain empresarial enfocada en cadenas de suministro.'
      },
      stellar: { 
        symbol: 'XLM', 
        name: 'Stellar', 
        icon: 'XLM',
        color: '#7D00FF',
        description: 'Red de pagos globales rápida y de bajo costo.'
      },
      'crypto-com-chain': { 
        symbol: 'CRO', 
        name: 'Cronos', 
        icon: 'CRO',
        color: '#003D82',
        description: 'Token nativo del ecosistema Crypto.com.'
      }
    };

    const totalPortfolioValue = computed(() => {
      let total = 0;
      for (const [cryptoId, wallet] of Object.entries(userWallets.value)) {
        const price = cryptoPrices.value[cryptoId]?.usd || 0;
        total += wallet.amount * price;
      }
      return total;
    });

    const portfolioCryptos = computed(() => {
      return Object.entries(userWallets.value).map(([cryptoId, wallet]) => {
        const cryptoInfo = supportedCryptos[cryptoId] || {};
        const price = cryptoPrices.value[cryptoId]?.usd || 0;
        const change24h = cryptoPrices.value[cryptoId]?.usd_24h_change || 0;
        const currentValue = wallet.amount * price;
        const pnl = currentValue - wallet.totalInvested;
        const pnlPercentage = wallet.totalInvested > 0 ? (pnl / wallet.totalInvested) * 100 : 0;
        
        return {
          id: cryptoId,
          ...cryptoInfo,
          amount: wallet.amount,
          totalInvested: wallet.totalInvested,
          currentPrice: price,
          change24h: change24h,
          currentValue: currentValue,
          pnl: pnl,
          pnlPercentage: pnlPercentage
        };
      }).sort((a, b) => b.currentValue - a.currentValue);
    });

    const availableCryptos = computed(() => {
      return Object.entries(supportedCryptos).map(([cryptoId, cryptoInfo]) => {
        const price = cryptoPrices.value[cryptoId]?.usd || 0;
        const change24h = cryptoPrices.value[cryptoId]?.usd_24h_change || 0;
        const marketCap = cryptoPrices.value[cryptoId]?.usd_market_cap || 0;
        const volume24h = cryptoPrices.value[cryptoId]?.usd_24h_vol || 0;
        const userWallet = userWallets.value[cryptoId];
        
        return {
          id: cryptoId,
          ...cryptoInfo,
          currentPrice: price,
          change24h: change24h,
          marketCap: marketCap,
          volume24h: volume24h,
          owned: userWallet ? userWallet.amount : 0,
          ownedValue: userWallet ? userWallet.amount * price : 0
        };
      }).sort((a, b) => b.marketCap - a.marketCap);
    });

    watch(() => buyForm.value.amount, (newAmount) => {
      if (selectedCrypto.value && newAmount) {
        const price = cryptoPrices.value[selectedCrypto.value.id]?.usd || 0;
        buyForm.value.totalCost = parseFloat(newAmount) * price;
      } else {
        buyForm.value.totalCost = 0;
      }
    });

    watch(() => sellForm.value.amount, (newAmount) => {
      if (selectedCrypto.value && newAmount) {
        const price = cryptoPrices.value[selectedCrypto.value.id]?.usd || 0;
        sellForm.value.totalReceived = parseFloat(newAmount) * price;
      } else {
        sellForm.value.totalReceived = 0;
      }
    });

    const handleNUIMessage = (event) => {
      if (!event.data) return;
      
      const { action, data } = event.data;
      
      switch (action) {
        case 'crypto:updateData':
          userWallets.value = data.holdings || {};
          transactions.value = data.transactions || [];
          cryptoPrices.value = data.prices || {};
          moneyBalances.value = data.moneyBalances || { cash: 0, bank: 0 };
          lastPriceUpdate.value = Date.now();
          loading.value = false;
          break;
          
        case 'crypto:priceUpdate':
          cryptoPrices.value = data.prices || {};
          lastPriceUpdate.value = Date.now();
          break;
          
        case 'crypto:transactionResult':
          if (data.success) {
            success.value = data.message;
            userWallets.value = data.holdings || userWallets.value;
            moneyBalances.value = data.moneyBalances || moneyBalances.value;
            resetForms();
          } else {
            error.value = data.message;
          }
          loading.value = false;
          break;
      }
    };

    const loadCryptoData = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        await fetch('https://bit-smartphone/loadCryptoData', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      } catch (error) {
        error.value = 'Error loading crypto data';
        loading.value = false;
      }
    };

    const refreshPrices = async () => {
      try {
        await fetch('https://bit-smartphone/refreshCryptoPrices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
      } catch (error) {
        error.value = 'Error refreshing prices';
      }
    };

    const buyCrypto = async () => {
      if (!buyForm.value.cryptoSymbol || !buyForm.value.amount || buyForm.value.amount <= 0) {
        error.value = 'Por favor ingresa detalles válidos de compra';
        return;
      }

      if (buyForm.value.totalCost > moneyBalances.value[buyForm.value.paymentMethod]) {
        error.value = 'Fondos insuficientes';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        await fetch('https://bit-smartphone/buyCrypto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cryptoSymbol: buyForm.value.cryptoSymbol,
            amount: parseFloat(buyForm.value.amount),
            paymentMethod: buyForm.value.paymentMethod
          })
        });
      } catch (error) {
        error.value = 'Error procesando la compra';
        loading.value = false;
      }
    };

    const sellCrypto = async () => {
      if (!sellForm.value.cryptoSymbol || !sellForm.value.amount || sellForm.value.amount <= 0) {
        error.value = 'Por favor ingresa detalles válidos de venta';
        return;
      }

      const wallet = userWallets.value[sellForm.value.cryptoSymbol];
      if (!wallet || wallet.amount < parseFloat(sellForm.value.amount)) {
        error.value = 'Balance de criptomoneda insuficiente';
        return;
      }

      loading.value = true;
      error.value = '';

      try {
        await fetch('https://bit-smartphone/sellCrypto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cryptoSymbol: sellForm.value.cryptoSymbol,
            amount: parseFloat(sellForm.value.amount),
            paymentMethod: sellForm.value.paymentMethod
          })
        });
      } catch (error) {
        error.value = 'Error procesando la venta';
        loading.value = false;
      }
    };

    const resetForms = () => {
      buyForm.value = {
        cryptoSymbol: '',
        amount: '',
        paymentMethod: 'bank',
        totalCost: 0
      };
      
      sellForm.value = {
        cryptoSymbol: '',
        amount: '',
        paymentMethod: 'bank',
        totalReceived: 0
      };
    };

    const startAutoRefresh = () => {
      if (autoRefresh.value) {
        refreshInterval = setInterval(() => {
          refreshPrices();
        }, 60000);
      }
    };

    const stopAutoRefresh = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };

    const selectCrypto = (crypto, action) => {
      selectedCrypto.value = crypto;
      error.value = '';
      success.value = '';
      
      if (action === 'buy') {
        buyForm.value.cryptoSymbol = crypto.id;
        currentView.value = 'buy';
      } else if (action === 'sell') {
        sellForm.value.cryptoSymbol = crypto.id;
        currentView.value = 'sell';
      }
    };

    const goBack = () => {
      currentView.value = 'portfolio';
      selectedCrypto.value = null;
      error.value = '';
      success.value = '';
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const formatCrypto = (amount, decimals = 8) => {
      return parseFloat(amount).toFixed(decimals);
    };

    const formatPercent = (percent) => {
      return (percent >= 0 ? '+' : '') + percent.toFixed(2) + '%';
    };

    const formatLargeNumber = (num) => {
      if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
      if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
      if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
      if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
      return num.toFixed(2);
    };

    const clearNotifications = () => {
      error.value = '';
      success.value = '';
    };

    onMounted(() => {
      loadCryptoData();
      startAutoRefresh();
      window.addEventListener('message', handleNUIMessage);
      setTimeout(clearNotifications, 5000);
    });

    onUnmounted(() => {
      stopAutoRefresh();
      window.removeEventListener('message', handleNUIMessage);
    });

    return {
      currentView,
      selectedCrypto,
      userWallets,
      transactions,
      moneyBalances,
      cryptoPrices,
      lastPriceUpdate,
      loading,
      error,
      success,
      autoRefresh,
      buyForm,
      sellForm,
      supportedCryptos,
      totalPortfolioValue,
      portfolioCryptos,
      availableCryptos,
      loadCryptoData,
      refreshPrices,
      buyCrypto,
      sellCrypto,
      resetForms,
      selectCrypto,
      goBack,
      formatCurrency,
      formatCrypto,
      formatPercent,
      formatLargeNumber,
      clearNotifications
    };
  },

  template: `
  <div class="h-full bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 relative flex flex-col">
      <div class="absolute inset-0 opacity-20">
        <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cryptoGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <line x1="0" y1="25" x2="50" y2="25" stroke="rgb(59, 130, 246)" stroke-width="0.5" opacity="0.6"/>
              <line x1="25" y1="0" x2="25" y2="50" stroke="rgb(59, 130, 246)" stroke-width="0.5" opacity="0.6"/>
              <circle cx="25" cy="25" r="1.5" fill="rgb(34, 197, 94)" opacity="0.8"/>
              <circle cx="0" cy="0" r="1" fill="rgb(59, 130, 246)" opacity="0.4"/>
              <circle cx="50" cy="50" r="1" fill="rgb(59, 130, 246)" opacity="0.4"/>
            </pattern>
            
            <radialGradient id="cryptoGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(59, 130, 246, 0.1)"/>
              <stop offset="70%" stop-color="rgba(34, 197, 94, 0.05)"/>
              <stop offset="100%" stop-color="transparent"/>
            </radialGradient>
          </defs>
          
          <rect width="100%" height="100%" fill="url(#cryptoGrid)"/>
          <rect width="100%" height="100%" fill="url(#cryptoGlow)"/>
          
          <g opacity="0.7">
            <circle cx="10%" cy="20%" r="2" fill="rgb(34, 197, 94)">
              <animate attributeName="cy" values="20%;25%;20%" dur="6s" repeatCount="indefinite"/>
            </circle>
            <circle cx="90%" cy="80%" r="1.5" fill="rgb(59, 130, 246)">
              <animate attributeName="cx" values="90%;85%;90%" dur="8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="70%" cy="30%" r="1" fill="rgb(34, 197, 94)" opacity="0.8">
              <animate attributeName="r" values="1;2.5;1" dur="4s" repeatCount="indefinite"/>
            </circle>
          </g>
        </svg>
      </div>


      <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-gray-900/50"></div>

  <div class="relative z-10 min-h-screen flex flex-col">
        

        <div v-if="loading" class="absolute inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center z-50">
          <div class="text-center">
            <div class="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-white font-medium">Cargando datos crypto...</p>
          </div>
        </div>


        <Transition name="slide-down">
          <div v-if="error" class="absolute top-4 left-4 right-4 z-40 bg-red-500/90 backdrop-blur-xl text-white px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span class="flex-1">{{ error }}</span>
            <button @click="clearNotifications" class="p-1 hover:bg-white/20 rounded-full">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </Transition>

        <Transition name="slide-down">
          <div v-if="success" class="absolute top-4 left-4 right-4 z-40 bg-green-500/90 backdrop-blur-xl text-white px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="flex-1">{{ success }}</span>
            <button @click="clearNotifications" class="p-1 hover:bg-white/20 rounded-full">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </Transition>


        <div v-if="currentView === 'portfolio'" class="crypto-main-container">

          <header class="bg-gray-900/90 backdrop-blur-xl border-b border-blue-500/20 px-6 py-6 flex-shrink-0">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-green-400 to-blue-500 bg-clip-text text-transparent">
                  CryptoWallet
                </h1>
                <p class="text-gray-400 text-sm mt-1">💎 Tu portafolio digital</p>
              </div>
              <div class="flex items-center gap-3">
                <button @click="refreshPrices" class="w-12 h-12 bg-blue-500/20 hover:bg-blue-500/30 rounded-2xl flex items-center justify-center transition-all duration-300 border border-blue-500/30">
                  <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>
                <button @click="$emit('close')" class="w-12 h-12 bg-gray-700/50 hover:bg-red-500/20 rounded-2xl flex items-center justify-center transition-all duration-300 border border-gray-600">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>


            <div class="bg-gradient-to-r from-blue-500/10 to-green-500/10 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/20">
              <div class="text-center mb-4">
                <h3 class="text-4xl font-bold text-white mb-2">{{ formatCurrency(totalPortfolioValue) }}</h3>
                <p class="text-gray-400">Valor Total del Portafolio</p>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-600/30">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                    <span class="text-gray-400 text-sm">Efectivo</span>
                  </div>
                  <span class="text-green-400 font-bold">{{ formatCurrency(moneyBalances.cash) }}</span>
                </div>
                
                <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-600/30">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                    </svg>
                    <span class="text-gray-400 text-sm">Banco</span>
                  </div>
                  <span class="text-blue-400 font-bold">{{ formatCurrency(moneyBalances.bank) }}</span>
                </div>
              </div>
            </div>
          </header>


          <main class="crypto-content-scroll crypto-scrollbar px-6 py-4 pb-8 flex-1" style="min-height:0; height:0;">

            <div v-if="portfolioCryptos.length > 0" class="mb-8">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
                </svg>
                Mis Criptomonedas
              </h3>
              
              <div class="space-y-3">
                <div
                  v-for="crypto in portfolioCryptos"
                  :key="crypto.id"
                  class="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-600/40 rounded-3xl p-5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold" :style="{ backgroundColor: crypto.color + '20', color: crypto.color, border: '1px solid ' + crypto.color + '40' }">
                        {{ crypto.icon }}
                      </div>
                      <div>
                        <h4 class="text-white font-bold">{{ crypto.name }}</h4>
                        <p class="text-gray-400 text-sm">{{ formatCrypto(crypto.amount) }} {{ crypto.symbol }}</p>
                      </div>
                    </div>
                    
                    <div class="text-right">
                      <div class="text-lg font-bold text-white">{{ formatCurrency(crypto.currentValue) }}</div>
                      <div class="text-sm" :class="crypto.pnl >= 0 ? 'text-green-400' : 'text-red-400'">
                        {{ formatPercent(crypto.pnlPercentage) }}
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <button @click="selectCrypto(crypto, 'buy')" class="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-bold py-2 px-4 rounded-xl transition-all duration-300">
                      Comprar
                    </button>
                    <button @click="selectCrypto(crypto, 'sell')" class="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-2 px-4 rounded-xl transition-all duration-300">
                      Vender
                    </button>
                  </div>
                </div>
              </div>
            </div>


            <div>
              <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zM9 9a1 1 0 000-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2zm-3 3a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                </svg>
                Mercado Crypto
              </h3>
              
              <div class="space-y-3 pb-6">
                <div
                  v-for="crypto in availableCryptos"
                  :key="crypto.id"
                  class="bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-600/30 rounded-3xl p-5 hover:border-blue-500/40 transition-all duration-300"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold" :style="{ backgroundColor: crypto.color + '15', color: crypto.color, border: '1px solid ' + crypto.color + '30' }">
                        {{ crypto.icon }}
                      </div>
                      <div>
                        <h4 class="text-white font-bold">{{ crypto.name }}</h4>
                        <p class="text-gray-400 text-sm">{{ crypto.symbol }}</p>
                        <p v-if="crypto.owned > 0" class="text-blue-400 text-xs">Posees: {{ formatCrypto(crypto.owned) }}</p>
                      </div>
                    </div>
                    
                    <div class="text-right">
                      <div class="text-lg font-bold text-white">{{ formatCurrency(crypto.currentPrice) }}</div>
                      <div class="text-sm" :class="crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'">
                        {{ formatPercent(crypto.change24h) }}
                      </div>
                      <div class="text-xs text-gray-500">Cap: {{ formatLargeNumber(crypto.marketCap) }}</div>
                    </div>
                  </div>

                  <div class="flex gap-2">
                    <button @click="selectCrypto(crypto, 'buy')" class="flex-1 bg-green-500/15 hover:bg-green-500/25 text-green-400 font-bold py-2 px-4 rounded-xl transition-all duration-300">
                      Comprar
                    </button>
                    <button v-if="crypto.owned > 0" @click="selectCrypto(crypto, 'sell')" class="flex-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-bold py-2 px-4 rounded-xl transition-all duration-300">
                      Vender
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>


        <div v-if="currentView === 'buy'" class="crypto-main-container">
          <header class="bg-gray-900/90 backdrop-blur-xl border-b border-green-500/20 px-6 py-6 flex-shrink-0">
            <div class="flex items-center gap-4 mb-4">
              <button @click="goBack" class="w-12 h-12 bg-gray-700/50 hover:bg-gray-600/50 rounded-2xl flex items-center justify-center transition-all duration-300">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h2 class="text-2xl font-bold text-white">Comprar {{ selectedCrypto?.name }}</h2>
                <p class="text-green-400 text-sm">💰 Adquiere criptomonedas</p>
              </div>
            </div>
          </header>

          <main class="crypto-content-scroll crypto-scrollbar px-6 py-6 flex-1" style="min-height:0; height:0;">
            <div v-if="selectedCrypto" class="max-w-md mx-auto">
              <div class="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl rounded-3xl p-6 border border-green-500/20 mb-6">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold" :style="{ backgroundColor: selectedCrypto.color + '20', color: selectedCrypto.color, border: '2px solid ' + selectedCrypto.color + '40' }">
                    {{ selectedCrypto.icon }}
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-white">{{ selectedCrypto.name }}</h3>
                    <p class="text-gray-400">{{ selectedCrypto.symbol }}</p>
                  </div>
                </div>
                
                <div class="text-center">
                  <div class="text-2xl font-bold text-white mb-2">{{ formatCurrency(cryptoPrices[selectedCrypto.id]?.usd || 0) }}</div>
                  <div class="text-sm" :class="(cryptoPrices[selectedCrypto.id]?.usd_24h_change || 0) >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ formatPercent(cryptoPrices[selectedCrypto.id]?.usd_24h_change || 0) }} (24h)
                  </div>
                </div>
              </div>


              <div class="space-y-6">
                <div>
                  <label class="block text-gray-300 font-medium mb-2">Cantidad ({{ selectedCrypto.symbol }})</label>
                  <input
                    v-model="buyForm.amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    class="w-full bg-gray-800/50 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                  />
                </div>

                <div>
                  <label class="block text-gray-300 font-medium mb-2">Método de Pago</label>
                  <select
                    v-model="buyForm.paymentMethod"
                    class="w-full bg-gray-800/50 border border-gray-600 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                  >
                    <option value="bank">🏦 Banco ({{ formatCurrency(moneyBalances.bank) }})</option>
                    <option value="cash">💵 Efectivo ({{ formatCurrency(moneyBalances.cash) }})</option>
                  </select>
                </div>

                <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-600/30">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400">Costo Total:</span>
                    <span class="text-2xl font-bold text-green-400">{{ formatCurrency(buyForm.totalCost) }}</span>
                  </div>
                </div>

                <button
                  @click="buyCrypto"
                  :disabled="loading || !buyForm.amount || buyForm.totalCost > moneyBalances[buyForm.paymentMethod]"
                  class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <span v-if="loading">Procesando...</span>
                  <span v-else>💰 Confirmar Compra</span>
                </button>
              </div>
            </div>
          </main>
        </div>


        <div v-if="currentView === 'sell'" class="crypto-main-container">
          <header class="bg-gray-900/90 backdrop-blur-xl border-b border-red-500/20 px-6 py-6 flex-shrink-0">
            <div class="flex items-center gap-4 mb-4">
              <button @click="goBack" class="w-12 h-12 bg-gray-700/50 hover:bg-gray-600/50 rounded-2xl flex items-center justify-center transition-all duration-300">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h2 class="text-2xl font-bold text-white">Vender {{ selectedCrypto?.name }}</h2>
                <p class="text-red-400 text-sm">💸 Convierte a dinero fiat</p>
              </div>
            </div>
          </header>

          <main class="crypto-content-scroll crypto-scrollbar px-6 py-6 flex-1" style="min-height:0; height:0;">
            <div v-if="selectedCrypto" class="max-w-md mx-auto">
              <div class="bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-xl rounded-3xl p-6 border border-red-500/20 mb-6">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold" :style="{ backgroundColor: selectedCrypto.color + '20', color: selectedCrypto.color, border: '2px solid ' + selectedCrypto.color + '40' }">
                    {{ selectedCrypto.icon }}
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-white">{{ selectedCrypto.name }}</h3>
                    <p class="text-gray-400">{{ selectedCrypto.symbol }}</p>
                  </div>
                </div>
                
                <div class="text-center mb-4">
                  <div class="text-2xl font-bold text-white mb-2">{{ formatCurrency(cryptoPrices[selectedCrypto.id]?.usd || 0) }}</div>
                  <div class="text-sm text-blue-400">Posees: {{ formatCrypto(userWallets[selectedCrypto.id]?.amount || 0) }} {{ selectedCrypto.symbol }}</div>
                </div>
              </div>


              <div class="space-y-6">
                <div>
                  <label class="block text-gray-300 font-medium mb-2">Cantidad a Vender ({{ selectedCrypto.symbol }})</label>
                  <input
                    v-model="sellForm.amount"
                    type="number"
                    step="0.00000001"
                    placeholder="0.00000000"
                    :max="userWallets[selectedCrypto.id]?.amount || 0"
                    class="w-full bg-gray-800/50 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all duration-300"
                  />
                </div>

                <div>
                  <label class="block text-gray-300 font-medium mb-2">Recibir en</label>
                  <select
                    v-model="sellForm.paymentMethod"
                    class="w-full bg-gray-800/50 border border-gray-600 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all duration-300"
                  >
                    <option value="bank">🏦 Banco</option>
                    <option value="cash">💵 Efectivo</option>
                  </select>
                </div>

                <div class="bg-gray-800/50 rounded-2xl p-4 border border-gray-600/30">
                  <div class="flex justify-between items-center">
                    <span class="text-gray-400">Total a Recibir:</span>
                    <span class="text-2xl font-bold text-red-400">{{ formatCurrency(sellForm.totalReceived) }}</span>
                  </div>
                </div>

                <button
                  @click="sellCrypto"
                  :disabled="loading || !sellForm.amount || parseFloat(sellForm.amount) > (userWallets[selectedCrypto.id]?.amount || 0)"
                  class="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  <span v-if="loading">Procesando...</span>
                  <span v-else>💸 Confirmar Venta</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  `
};


window.Crypto = Crypto;