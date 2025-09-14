const Crypto = {
  name: 'crypto',
  props: ['userSettings', 'wallpapers', 'currentWallpaper', 'photos', 'weatherData', 't'],
  emits: ['close', 'update-setting', 'change-wallpaper', 'take-photo', 'delete-photo'],
  data() {
    return {
      currentView: 'portfolio', 
      selectedCrypto: null,
      
      userWallets: {},
      transactions: [],
      moneyBalances: {
        cash: 0,
        bank: 0
      },
      
      cryptoPrices: {},
      lastPriceUpdate: null,
      
      buyForm: {
        cryptoSymbol: '',
        amount: '',
        paymentMethod: 'bank',
        totalCost: 0
      },
      
      sellForm: {
        cryptoSymbol: '',
        amount: '',
        paymentMethod: 'bank',
        totalReceived: 0
      },
      
      loading: false,
      error: '',
      success: '',
      autoRefresh: true,
      refreshInterval: null,
      
      supportedCryptos: {
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
        }
      }
    }
  },
  
  computed: {
    totalPortfolioValue() {
      let total = 0;
      for (const [cryptoId, wallet] of Object.entries(this.userWallets)) {
        const price = this.cryptoPrices[cryptoId]?.usd || 0;
        total += wallet.amount * price;
      }
      return total;
    },
    
    portfolioCryptos() {
      return Object.entries(this.userWallets).map(([cryptoId, wallet]) => {
        const cryptoInfo = this.supportedCryptos[cryptoId] || {};
        const price = this.cryptoPrices[cryptoId]?.usd || 0;
        const change24h = this.cryptoPrices[cryptoId]?.usd_24h_change || 0;
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
    },
    
    availableCryptos() {
      return Object.entries(this.supportedCryptos).map(([cryptoId, cryptoInfo]) => {
        const price = this.cryptoPrices[cryptoId]?.usd || 0;
        const change24h = this.cryptoPrices[cryptoId]?.usd_24h_change || 0;
        const userWallet = this.userWallets[cryptoId];
        
        return {
          id: cryptoId,
          ...cryptoInfo,
          currentPrice: price,
          change24h: change24h,
          owned: userWallet ? userWallet.amount : 0,
          ownedValue: userWallet ? userWallet.amount * price : 0
        };
      }).sort((a, b) => b.currentPrice - a.currentPrice);
    }
  },
  
  watch: {
    'buyForm.amount': {
      handler(newAmount) {
        if (this.selectedCrypto && newAmount) {
          const price = this.cryptoPrices[this.selectedCrypto.id]?.usd || 0;
          this.buyForm.totalCost = parseFloat(newAmount) * price;
        } else {
          this.buyForm.totalCost = 0;
        }
      },
      immediate: true
    },
    
    'sellForm.amount': {
      handler(newAmount) {
        if (this.selectedCrypto && newAmount) {
          const price = this.cryptoPrices[this.selectedCrypto.id]?.usd || 0;
          this.sellForm.totalReceived = parseFloat(newAmount) * price;
        } else {
          this.sellForm.totalReceived = 0;
        }
      },
      immediate: true
    }
  },
  
  mounted() {
    this.loadCryptoData();
    this.startAutoRefresh();
    
  window.addEventListener('message', this.handleNUIMessage);
  
  try { window.cryptoApp = this; } catch (e) {  }
  },

  beforeUnmount() {
    this.stopAutoRefresh();
  window.removeEventListener('message', this.handleNUIMessage);
  try { if (window.cryptoApp === this) delete window.cryptoApp; } catch (e) {  }
  },

  methods: {
    handleNUIMessage(event) {
      const { action, data } = event.data;
      
      switch (action) {
        case 'crypto:updateData':
          this.userWallets = data.holdings || {};
          this.transactions = data.transactions || [];
          this.cryptoPrices = data.prices || {};
          this.moneyBalances = data.moneyBalances || { cash: 0, bank: 0 };
          this.lastPriceUpdate = Date.now();
          this.loading = false;
          break;
          
        case 'crypto:priceUpdate':
          this.cryptoPrices = data.prices || {};
          this.lastPriceUpdate = Date.now();
          break;
          
        case 'crypto:transactionResult':
          if (data.success) {
            this.success = data.message;
            this.userWallets = data.holdings || this.userWallets;
            this.moneyBalances = data.moneyBalances || this.moneyBalances;
            this.resetForms();
          } else {
            this.error = data.message;
          }
          this.loading = false;
          break;
      }
    },

    async loadCryptoData() {
      this.loading = true;
      this.error = '';
      
      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({ action: 'loadCryptoData' }));
        }
      } catch (error) {
        this.error = 'Error loading crypto data';
        this.loading = false;
      }
    },

    async refreshPrices() {
      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({ action: 'refreshCryptoPrices' }));
        }
      } catch (error) {
        this.error = 'Error refreshing prices';
      }
    },

    async buyCrypto() {
      if (!this.buyForm.cryptoSymbol || !this.buyForm.amount || this.buyForm.amount <= 0) {
        this.error = 'Please enter valid purchase details';
        return;
      }

      if (this.buyForm.totalCost > this.moneyBalances[this.buyForm.paymentMethod]) {
        this.error = 'Insufficient funds';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'buyCrypto',
            cryptoSymbol: this.buyForm.cryptoSymbol,
            amount: parseFloat(this.buyForm.amount),
            paymentMethod: this.buyForm.paymentMethod
          }));
        }
      } catch (error) {
        this.error = 'Error processing purchase';
        this.loading = false;
      }
    },

    async sellCrypto() {
      if (!this.sellForm.cryptoSymbol || !this.sellForm.amount || this.sellForm.amount <= 0) {
        this.error = 'Please enter valid sale details';
        return;
      }

      const wallet = this.userWallets[this.sellForm.cryptoSymbol];
      if (!wallet || wallet.amount < parseFloat(this.sellForm.amount)) {
        this.error = 'Insufficient crypto balance';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        if (window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'sellCrypto',
            cryptoSymbol: this.sellForm.cryptoSymbol,
            amount: parseFloat(this.sellForm.amount),
            paymentMethod: this.sellForm.paymentMethod
          }));
        }
      } catch (error) {
        this.error = 'Error processing sale';
        this.loading = false;
      }
    },

    resetForms() {
      this.buyForm = {
        cryptoSymbol: '',
        amount: '',
        paymentMethod: 'bank',
        totalCost: 0
      };
      
      this.sellForm = {
        cryptoSymbol: '',
        amount: '',
        paymentMethod: 'bank',
        totalReceived: 0
      };
    },

    startAutoRefresh() {
      if (this.autoRefresh) {
        this.refreshInterval = setInterval(() => {
          this.refreshPrices();
        }, 60000);
      }
    },

    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },

    selectCrypto(crypto, action) {
      this.selectedCrypto = crypto;
      this.error = '';
      this.success = '';
      
      if (action === 'buy') {
        this.buyForm.cryptoSymbol = crypto.id;
        this.currentView = 'buy';
      } else if (action === 'sell') {
        this.sellForm.cryptoSymbol = crypto.id;
        this.currentView = 'sell';
      }
    },

    goBack() {
      this.currentView = 'portfolio';
      this.selectedCrypto = null;
      this.error = '';
      this.success = '';
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    },

    formatCrypto(amount, decimals = 8) {
      return parseFloat(amount).toFixed(decimals);
    },

    formatPercent(percent) {
      return (percent >= 0 ? '+' : '') + percent.toFixed(2) + '%';
    },

    formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString();
    }
  },

  template: `
    <div class="crypto-app">
      
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>{{ t('crypto.loading') || 'Loading...' }}</p>
      </div>

      
      <div v-if="error" class="notification error">
        <i class="fas fa-exclamation-triangle"></i>
        {{ error }}
      </div>

      <div v-if="success" class="notification success">
        <i class="fas fa-check-circle"></i>
        {{ success }}
      </div>

      
      <div v-if="currentView === 'portfolio'" class="portfolio-view">
        <div class="header">
          <h2>{{ t('crypto.title') || 'Crypto Wallet' }}</h2>
          <div class="header-actions">
            <button @click="refreshPrices" class="refresh-btn">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        
        <div class="portfolio-summary">
          <div class="total-value">
            <h3>{{ formatCurrency(totalPortfolioValue) }}</h3>
            <p>{{ t('crypto.totalValue') || 'Total Portfolio Value' }}</p>
          </div>
          
          <div class="balance-info">
            <div class="balance-item">
              <span class="label">{{ t('crypto.cash') || 'Cash' }}:</span>
              <span class="value">{{ formatCurrency(moneyBalances.cash) }}</span>
            </div>
            <div class="balance-item">
              <span class="label">{{ t('crypto.bank') || 'Bank' }}:</span>
              <span class="value">{{ formatCurrency(moneyBalances.bank) }}</span>
            </div>
          </div>
        </div>

        
        <div class="holdings-section" v-if="portfolioCryptos.length > 0">
          <h3>{{ t('crypto.myHoldings') || 'My Holdings' }}</h3>
          <div class="crypto-list">
            <div v-for="crypto in portfolioCryptos" :key="crypto.id" class="crypto-item">
              <div class="crypto-info">
                <div class="crypto-icon" :style="{ color: crypto.color }">{{ crypto.icon }}</div>
                <div class="crypto-details">
                  <h4>{{ crypto.name }} ({{ crypto.symbol }})</h4>
                  <p>{{ formatCrypto(crypto.amount) }} {{ crypto.symbol }}</p>
                </div>
              </div>
              <div class="crypto-values">
                <div class="current-value">{{ formatCurrency(crypto.currentValue) }}</div>
                <div class="pnl" :class="{ positive: crypto.pnl >= 0, negative: crypto.pnl < 0 }">
                  {{ formatPercent(crypto.pnlPercentage) }}
                </div>
              </div>
              <div class="crypto-actions">
                <button @click="selectCrypto(crypto, 'buy')" class="buy-btn">{{ t('crypto.buy') || 'Buy' }}</button>
                <button @click="selectCrypto(crypto, 'sell')" class="sell-btn">{{ t('crypto.sell') || 'Sell' }}</button>
              </div>
            </div>
          </div>
        </div>

        
        <div class="available-cryptos">
          <h3>{{ t('crypto.available') || 'Available Cryptocurrencies' }}</h3>
          <div class="crypto-list">
            <div v-for="crypto in availableCryptos" :key="crypto.id" class="crypto-item">
              <div class="crypto-info">
                <div class="crypto-icon" :style="{ color: crypto.color }">{{ crypto.icon }}</div>
                <div class="crypto-details">
                  <h4>{{ crypto.name }} ({{ crypto.symbol }})</h4>
                  <p>{{ formatCurrency(crypto.currentPrice) }}</p>
                </div>
              </div>
              <div class="crypto-values">
                <div class="change" :class="{ positive: crypto.change24h >= 0, negative: crypto.change24h < 0 }">
                  {{ formatPercent(crypto.change24h) }}
                </div>
                <div v-if="crypto.owned > 0" class="owned">
                  {{ t('crypto.owned') || 'Owned' }}: {{ formatCrypto(crypto.owned) }}
                </div>
              </div>
              <div class="crypto-actions">
                <button @click="selectCrypto(crypto, 'buy')" class="buy-btn">{{ t('crypto.buy') || 'Buy' }}</button>
                <button v-if="crypto.owned > 0" @click="selectCrypto(crypto, 'sell')" class="sell-btn">{{ t('crypto.sell') || 'Sell' }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div v-if="currentView === 'buy'" class="transaction-view">
        <div class="header">
          <button @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h2>{{ t('crypto.buyTitle') || 'Buy' }} {{ selectedCrypto?.name }}</h2>
        </div>

        <div class="transaction-form">
          <div class="crypto-info-card">
            <div class="crypto-icon" :style="{ color: selectedCrypto?.color }">{{ selectedCrypto?.icon }}</div>
            <div class="crypto-details">
              <h3>{{ selectedCrypto?.name }} ({{ selectedCrypto?.symbol }})</h3>
              <p class="price">{{ formatCurrency(cryptoPrices[selectedCrypto?.id]?.usd || 0) }}</p>
              <p class="change" :class="{ positive: (cryptoPrices[selectedCrypto?.id]?.usd_24h_change || 0) >= 0, negative: (cryptoPrices[selectedCrypto?.id]?.usd_24h_change || 0) < 0 }">
                {{ formatPercent(cryptoPrices[selectedCrypto?.id]?.usd_24h_change || 0) }}
              </p>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('crypto.amount') || 'Amount' }} ({{ selectedCrypto?.symbol }})</label>
            <input v-model="buyForm.amount" type="number" step="0.00000001" placeholder="0.00000000">
          </div>

          <div class="form-group">
            <label>{{ t('crypto.paymentMethod') || 'Payment Method' }}</label>
            <select v-model="buyForm.paymentMethod">
              <option value="bank">{{ t('crypto.bank') || 'Bank' }} ({{ formatCurrency(moneyBalances.bank) }})</option>
              <option value="cash">{{ t('crypto.cash') || 'Cash' }} ({{ formatCurrency(moneyBalances.cash) }})</option>
            </select>
          </div>

          <div class="total-cost">
            <h3>{{ t('crypto.totalCost') || 'Total Cost' }}: {{ formatCurrency(buyForm.totalCost) }}</h3>
          </div>

          <button @click="buyCrypto" :disabled="loading || !buyForm.amount || buyForm.totalCost > moneyBalances[buyForm.paymentMethod]" class="transaction-btn buy">
            {{ t('crypto.confirmBuy') || 'Confirm Purchase' }}
          </button>
        </div>
      </div>

      
      <div v-if="currentView === 'sell'" class="transaction-view">
        <div class="header">
          <button @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h2>{{ t('crypto.sellTitle') || 'Sell' }} {{ selectedCrypto?.name }}</h2>
        </div>

        <div class="transaction-form">
          <div class="crypto-info-card">
            <div class="crypto-icon" :style="{ color: selectedCrypto?.color }">{{ selectedCrypto?.icon }}</div>
            <div class="crypto-details">
              <h3>{{ selectedCrypto?.name }} ({{ selectedCrypto?.symbol }})</h3>
              <p class="price">{{ formatCurrency(cryptoPrices[selectedCrypto?.id]?.usd || 0) }}</p>
              <p class="owned">{{ t('crypto.owned') || 'Owned' }}: {{ formatCrypto(userWallets[selectedCrypto?.id]?.amount || 0) }}</p>
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('crypto.amount') || 'Amount' }} ({{ selectedCrypto?.symbol }})</label>
            <input v-model="sellForm.amount" type="number" step="0.00000001" placeholder="0.00000000" :max="userWallets[selectedCrypto?.id]?.amount || 0">
          </div>

          <div class="form-group">
            <label>{{ t('crypto.receiveMethod') || 'Receive Method' }}</label>
            <select v-model="sellForm.paymentMethod">
              <option value="bank">{{ t('crypto.bank') || 'Bank' }}</option>
              <option value="cash">{{ t('crypto.cash') || 'Cash' }}</option>
            </select>
          </div>

          <div class="total-received">
            <h3>{{ t('crypto.totalReceived') || 'Total Received' }}: {{ formatCurrency(sellForm.totalReceived) }}</h3>
          </div>

          <button @click="sellCrypto" :disabled="loading || !sellForm.amount || parseFloat(sellForm.amount) > (userWallets[selectedCrypto?.id]?.amount || 0)" class="transaction-btn sell">
            {{ t('crypto.confirmSell') || 'Confirm Sale' }}
          </button>
        </div>
      </div>
    </div>
  `
};


const cryptoStyles = `

.crypto-app { padding: 16px; font-family: Inter, Roboto, Poppins, system-ui, sans-serif; color: #111; background: transparent; }
.loading-overlay { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.85); z-index:50; flex-direction:column; gap:8px; }
.spinner { width:40px; height:40px; border:4px solid rgba(0,0,0,0.08); border-top-color:#6366f1; border-radius:50%; animation:spin 1s linear infinite; }
@keyframes spin{ to { transform: rotate(360deg); } }
.portfolio-view .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.portfolio-summary{ display:flex; gap:12px; align-items:center; margin-bottom:12px; }
.total-value h3{ margin:0; font-size:1.25rem; }
.balance-info { display:flex; gap:8px; }
.crypto-list{ display:flex; flex-direction:column; gap:8px; }
.crypto-item{ display:flex; justify-content:space-between; align-items:center; padding:10px; border-radius:8px; background:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
.crypto-info{ display:flex; align-items:center; gap:10px; }
.crypto-icon{ font-size:18px; width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius:8px; background:rgba(0,0,0,0.04); }
.crypto-details h4{ margin:0; font-weight:600; }
.crypto-values { text-align:right; min-width:110px; }
.crypto-actions button{ margin-left:6px; padding:6px 10px; border-radius:6px; border:none; cursor:pointer; }
.buy-btn{ background:#10b981; color:white; }
.sell-btn{ background:#ef4444; color:white; }
.notification{ padding:8px 12px; border-radius:8px; margin-bottom:8px; }
.notification.error{ background:#fee2e2; color:#7f1d1d; }
.notification.success{ background:#ecfdf5; color:#065f46; }
`;

if (typeof document !== 'undefined' && !document.getElementById('crypto-styles')) {
  try {
    const style = document.createElement('style');
    style.id = 'crypto-styles';
    style.innerText = cryptoStyles;
    document.head.appendChild(style);
  } catch (e) {
    
  }
}


try { window.Crypto = window.Crypto || Crypto; } catch (e) {  }
