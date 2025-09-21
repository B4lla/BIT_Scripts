const DarkWeb = {
  name: 'darkweb',
  props: ['cryptoWallet', 'cryptoPrices', 'getCryptoBalance', 'getTotalCryptoValueUSD', 'spendCrypto', 't'],
  emits: ['close', 'add-notification'],
  data() {
    return {
      rooms: [],          
      privateRooms: [],   
      currentRoom: null,
      _roomsLoadedOnce: false,
      _listenerAdded: false,
      _creatingRoom: false,
      _joiningRoom: false,
  currentView: 'rooms', 
      newRoomName: '',
      joinRoomCode: '',
      showJoinModal: false,
      username: `Anon${Math.floor(Math.random() * 9999)}`,
      newMessage: '',
      isLoading: false,
      notifications: [],
      onlineUsers: Math.floor(Math.random() * 30) + 25,
      
      cryptoBalance: {},
      showCryptoPanel: false,
      cryptoView: 'send',
      wallet: { bitcoin_balance: 0, recent_transactions: [] },
      transfer: { recipient: '', amount: '', description: '' },
      transferSending: false,
    };
  },
  computed: {
    currentRoomMessages() {
      return this.currentRoom ? (this.currentRoom.messages || []) : [];
    },
    totalCryptoValue() {
      try {
        if (this.cryptoBalance && Object.keys(this.cryptoBalance).length > 0) {
          let total = 0;
          const prices = this.cryptoPrices && (this.cryptoPrices.value || this.cryptoPrices) || {};
          const mapSymbol = (s) => {
            const sym = (s || '').toLowerCase();
            if (sym === 'btc' || sym === 'bitcoin') return 'bitcoin';
            if (sym === 'eth' || sym === 'ethereum') return 'ethereum';
            if (sym === 'xmr' || sym === 'monero') return 'monero';
            if (sym === 'zec' || sym === 'zcash') return 'zcash';
            return sym;
          };
          for (const [sym, val] of Object.entries(this.cryptoBalance)) {
            const amount = typeof val === 'object' ? (Number(val.amount) || 0) : (Number(val) || 0);
            const priceKey = mapSymbol(sym);
            let price = 0;
            const p = prices[priceKey];
            if (typeof p === 'number') price = p;
            else if (p && typeof p.usd === 'number') price = p.usd;
            total += amount * price;
          }
          return total;
        }
      } catch (e) {
        console.warn('[Darkweb] totalCryptoValue compute error:', e);
      }
      return this.getTotalCryptoValueUSD ? this.getTotalCryptoValueUSD() : 0;
    }
  },
  mounted() {
    if (!window.__darkwebMessageListener) {
      window.__darkwebMessageListener = (evt) => {
        if (window.__darkwebHandler) {
          try { window.__darkwebHandler(evt); } catch (e) { console.warn('[Darkweb] handler error', e); }
        }
      };
      window.addEventListener('message', window.__darkwebMessageListener);
    }
    window.__darkwebHandler = this.handleNuiMessage;
    if (!this._roomsLoadedOnce) {
      this._roomsLoadedOnce = true;
      this.loadRooms();
    }
    this.loadCryptoBalance();
    this.simulateActivity();
  },
  beforeUnmount() {
    if (window.__darkwebHandler === this.handleNuiMessage) {
      window.__darkwebHandler = null;
    }
  },
  methods: {
    generateRoomCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
    normalizeSymbol(symbol) {
      const s = (symbol || '').toLowerCase();
      if (s === 'btc' || s === 'bitcoin') return 'bitcoin';
      if (s === 'eth' || s === 'ethereum') return 'ethereum';
      if (s === 'xmr' || s === 'monero') return 'monero';
      if (s === 'zec' || s === 'zcash') return 'zcash';
      return s;
    },
    loadRooms() {
      fetch('https://bit-smartphone/darkweb:getRooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      }).then(text => {
        console.log('[DarkWeb] loadRooms request sent successfully');
      }).catch(error => {
        console.error('[Darkweb] Error loading rooms:', error);
        this.privateRooms = [];
        this.showNotification('Error de conexión al cargar salas', 'error');
      });
    },
    loadCryptoBalance() {
      fetch('https://bit-smartphone/crypto:getBalance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      }).then(text => {
        try {
          const data = text ? JSON.parse(text) : {};
          if (data && data.success) {
            this.cryptoBalance = data.balance || {};
          } else {
            this.cryptoBalance = { btc: 0, bitcoin: 0, eth: 0, ltc: 0, doge: 0 };
          }
        } catch (parseError) {
          console.warn('[Darkweb] Invalid JSON response for crypto balance:', text);
          this.cryptoBalance = { btc: 0, bitcoin: 0, eth: 0, ltc: 0, doge: 0 };
        }
      }).catch(error => {
        console.error('[Darkweb] Error loading crypto balance:', error);
        this.cryptoBalance = { btc: 0, bitcoin: 0, eth: 0, ltc: 0, doge: 0 };
      });
    },
    openCryptoPanel() {
      this.showCryptoPanel = true;
      this.cryptoView = 'send';
      this.fetchWallet();
    },
    closeCryptoPanel() {
      this.showCryptoPanel = false;
      this.transfer = { recipient: '', amount: '', description: '' };
      this.transferSending = false;
    },
    fetchWallet() {
      fetch('https://bit-smartphone/darkweb:getBitcoinWallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(() => {});
    },
    sendCrypto() {
      if (this.transferSending) return;
      const amount = Number(this.transfer.amount);
      if (!this.transfer.recipient || !amount || amount <= 0) {
        this.showNotification('Completa destinatario y cantidad válida', 'error');
        return;
      }
      this.transferSending = true;
      const payload = {
        recipientAddress: this.transfer.recipient,
        amount: amount,
        description: this.transfer.description || 'Transferencia DarkWeb'
      };
      fetch('https://bit-smartphone/darkweb:sendBitcoin', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      }).then(() => {
      }).finally(() => {
        setTimeout(() => { this.transferSending = false; }, 500);
      });
    },
  handleNuiMessage(event) {
      const msg = event.data;
      if (!msg || !msg.action) return;
      
      switch (msg.action) {
        case 'roomsLoaded': 
          this.privateRooms = (msg.data?.rooms || []).map(room => ({
            ...room,
            members: room.members || [],
            messages: room.messages || []
          })); 
          break;
        case 'roomCreated': {
          const room = (msg.data && (msg.data.room || msg.data)) || msg.room;
          if (room) {
            if (!this.privateRooms.some(r => r.id === room.id)) {
              this.privateRooms.push(room);
            }
            this.showNotification('Sala creada exitosamente', 'success');
          }
          break; }
        
        case 'roomJoined':
        case 'darkweb:roomJoined': {
          const roomId = (msg.data && msg.data.roomId) || msg.roomId;
          if (!roomId) break;
          let room = this.privateRooms.find(r => r.id === roomId);
          if (!room) {
            room = { id: roomId, name: `Sala #${roomId}`, members: [], messages: [] };
            this.privateRooms.push(room);
          }
          const incomingMessages = (msg.data && msg.data.messages) || msg.messages || [];
          room.messages = Array.isArray(incomingMessages) ? incomingMessages : [];
          this.currentRoom = { ...room, messages: room.messages || [] };
          this.currentView = 'chat';
          break; }
        case 'messageAdded':
        case 'darkweb:newRoomMessage':
          if (this.currentRoom && this.currentRoom.id === msg.data?.roomId && msg.data?.message) {
            if (!this.currentRoom.messages) {
              this.currentRoom.messages = [];
            }
            this.currentRoom.messages.push(msg.data.message);
          }
          break;
        case 'cryptoBalance':
          this.cryptoBalance = msg.data || {};
          break;
        case 'darkweb:receiveBitcoinWallet':
          this.wallet = msg.data || { bitcoin_balance: 0, recent_transactions: [] };
          break;
        case 'darkweb:bitcoinTransferResult': {
          const ok = msg.data && msg.data.success;
          this.showNotification(ok ? 'Transferencia enviada' : (msg.data && msg.data.message) || 'Error al enviar', ok ? 'success' : 'error');
          if (ok) {
            this.loadCryptoBalance();
            this.fetchWallet();
            this.transfer = { recipient: '', amount: '', description: '' };
          }
          break; }
        case 'darkweb:bitcoinReceived': {
          const data = msg.data || {};
          this.showNotification(`Recibiste ${data.amount} BTC de ${data.from}`, 'success');
          this.loadCryptoBalance();
          this.fetchWallet();
          break; }
      }
  },
    setView(view) {
      this.currentView = view;
    },
    goBack() {
      if (this.currentRoom && this.currentView === 'chat') {
        this.leaveRoom();
      } else {
        this.$emit('close');
      }
    },
    createPrivateRoom() {
      if (this._creatingRoom) return;
      if (!this.newRoomName.trim()) {
        this.showNotification('Ingresa un nombre para la sala', 'error');
        return;
      }
      
      const roomName = this.newRoomName.trim();
      
      this._creatingRoom = true;
      fetch('https://bit-smartphone/darkweb:createRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: roomName,
          description: `Sala creada por ${this.username}`
        })
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      }).then(text => {
        try {
          const data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.warn('[Darkweb] Invalid JSON response for createRoom:', text);
        }
      }).catch(error => {
        console.error('[Darkweb] Error creating room:', error);
        this.showNotification('No se pudo crear la sala', 'error');
      }).finally(() => {
        setTimeout(() => { this._creatingRoom = false; }, 500);
      });
      
      this.newRoomName = '';
      this.currentView = 'rooms';
    },
    showJoinRoom() {
      this.showJoinModal = true;
    },
    hideJoinModal() {
      this.showJoinModal = false;
      this.joinRoomCode = '';
    },
    joinRoom() {
      if (this._joiningRoom) return;
      this._joiningRoom = true;
      
      const existingRoom = this.privateRooms.find(room => room.code === this.joinRoomCode.toUpperCase());
      
      fetch('https://bit-smartphone/darkweb:joinRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: this.joinRoomCode })
      }).catch(error => console.error('[Darkweb] Error joining room:', error))
      .finally(() => {
        setTimeout(() => { this._joiningRoom = false; }, 500);
      });
      
      this.hideJoinModal();
    },
    enterRoom(room) {
      this.currentRoom = {
        ...room,
        members: room.members || [],
        messages: room.messages || []
      };
      this.currentView = 'chat';
    },
    leaveRoom() {
      if (this.currentRoom) {
        const room = this.currentRoom;
        room.members = (room.members || []).filter(member => member !== this.username);
        this.addSystemMessage(room, `${this.username} abandonó la sala`);
        
        if (room.creator === this.username && (room.members || []).length === 0) {
          this.privateRooms = this.privateRooms.filter(r => r.id !== room.id);
        }
      }
      
      this.currentRoom = null;
      this.currentView = 'rooms';
    },
    sendMessage() {
      if (!this.newMessage.trim()) return;
      
      fetch('https://bit-smartphone/darkweb:sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          roomId: this.currentRoom.id, 
          message: this.newMessage,
          username: this.username 
        })
      }).catch(error => console.error('[Darkweb] Error sending message:', error));
      
      this.newMessage = '';
    },
    addSystemMessage(room, text) {
      const message = {
        id: Date.now(),
        username: 'SYSTEM',
        text: text,
        timestamp: Date.now(),
        isSystem: true
      };
      
      if (!room.messages) {
        room.messages = [];
      }
      room.messages.push(message);
    },
    simulateResponse() {
      if (!this.currentRoom) return;
      
      const responses = [
        'Confirmo disponibilidad...',
        '¿Referencias verificadas?',
        'Solo crypto. Nada de efectivo.',
        'Ubicación segura únicamente.',
        'Proceder con máxima cautela.',
        '¿Cuándo cerramos el trato?',
        'Mis contactos verifican primero.',
        'Todo limpio por aquí.',
        'Envío las coordenadas por privado.',
        'Necesito confirmar identidad.',
        'El pago debe ser escrow.',
        'Tengo lo que buscas.'
      ];
      
      const members = (this.currentRoom.members || []).filter(m => m !== this.username);
      
      if (members.length > 0) {
        const message = {
          id: Date.now(),
          username: members[Math.floor(Math.random() * members.length)],
          text: responses[Math.floor(Math.random() * responses.length)],
          timestamp: Date.now(),
          isOwn: false
        };
        
        if (!this.currentRoom.messages) {
          this.currentRoom.messages = [];
        }
        this.currentRoom.messages.push(message);
      }
    },
    
    formatCurrency(amount, currency) {
      return `${amount} ${currency.toUpperCase()}`;
    },
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatTimeAgo(timestamp) {
      const diff = Date.now() - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (days > 0) return `${days}d`;
      if (hours > 0) return `${hours}h`;
      return `${minutes}m`;
    },
    
  showNotification(message, type = 'info') {
      this.$emit('add-notification', {
        id: Date.now(),
        title: 'DarkWeb',
        message: message,
        icon: './assets/icons/apps/darkweb.svg',
        app: 'darkweb',
        time: new Date().toLocaleTimeString(),
        type: type
      });
    },
    simulateActivity() {
      setInterval(() => {
        this.onlineUsers = Math.floor(Math.random() * 30) + 25;
      }, 30000);
      
      setInterval(() => {
        if (Math.random() < 0.1) {
          this.simulateNewRoom();
        }
      }, 60000);
    },
    simulateNewRoom() {
      const roomNames = ['🚫 Servicios Especiales', '💰 Lavado Express', '🔍 Datos Seguros', '⚡ Hack Rápido'];
      const creators = ['CyberGhost', 'MoneyWash', 'DataThief', 'QuickHack'];
      
      const newRoom = {
        id: Date.now(),
        name: roomNames[Math.floor(Math.random() * roomNames.length)],
        code: this.generateRoomCode(),
        creator: creators[Math.floor(Math.random() * creators.length)],
        members: [creators[Math.floor(Math.random() * creators.length)]],
        messages: [],
        createdAt: Date.now()
      };
      
      this.privateRooms.push(newRoom);
    }
  },
  
  template: `
    <div class="darkweb-app h-full bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-200 relative overflow-hidden">
      
      
      <div class="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-slate-800/60 to-slate-900/80"></div>
      <div class="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
      
      
      <div v-if="currentView === 'rooms'" class="relative z-10 h-full flex flex-col">
        
        
        <div class="bg-black/50 backdrop-blur-lg border-b border-slate-600/30 p-4 pt-8">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <button @click="goBack" class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-colors">
                <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 class="text-xl font-bold text-cyan-300">DarkWeb</h1>
                <p class="text-slate-400 text-sm">Salas Privadas</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <div class="text-right">
                <div class="text-slate-400 text-sm">En línea</div>
                <div class="text-lg font-bold text-cyan-300">{{ onlineUsers }}</div>
              </div>
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          
      <div class="grid grid-cols-2 gap-3">
            <button 
              @click="setView('create-room')" 
              class="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 rounded-xl p-3 transition-all hover:border-cyan-500/50 group"
            >
              <div class="flex flex-col items-center space-y-2">
                <div class="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                  <svg class="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                </div>
                <span class="text-cyan-300 font-medium text-sm">Crear</span>
              </div>
            </button>
            
            <button 
              @click="showJoinRoom" 
              class="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 rounded-xl p-3 transition-all hover:border-cyan-500/50 group"
            >
              <div class="flex flex-col items-center space-y-2">
                <div class="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                  <svg class="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                </div>
                <span class="text-cyan-300 font-medium text-sm">Unirse</span>
              </div>
            </button>
            
            
          </div>
        </div>
        
        
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <div
            v-for="room in privateRooms"
            :key="room.id"
            @click="enterRoom(room)"
            class="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-4 hover:bg-slate-700/50 hover:border-cyan-500/40 transition-all cursor-pointer group"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-slate-700/60 rounded-full flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <svg class="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-cyan-300 font-semibold">{{ room.name }}</h3>
                </div>
              </div>
              <div class="text-right">
                <div class="text-slate-400 text-sm">{{ formatTimeAgo(room.createdAt) }}</div>
                <div class="flex items-center space-x-1 text-slate-400 text-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                  <span>{{ room.members?.length || 0 }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="room.messages && room.messages.length > 0" class="bg-slate-900/50 rounded-lg p-3">
              <div class="text-slate-200 text-sm">
                <span class="font-medium">{{ room.messages[room.messages.length - 1]?.username }}:</span>
                {{ room.messages[room.messages.length - 1]?.text }}
              </div>
            </div>
            <div v-else class="text-slate-400 text-sm italic">
              Sin mensajes recientes
            </div>
          </div>
          
          
          <div v-if="!privateRooms || privateRooms.length === 0" class="flex flex-col items-center justify-center py-8">
            <div class="text-6xl mb-4 opacity-60">🌐</div>
            <h3 class="text-xl font-bold text-cyan-300 mb-2">Bienvenido a DarkWeb</h3>
            <p class="text-slate-400 text-center mb-6">Comienza creando tu primera sala privada</p>
            
            <div class="flex space-x-4">
              <button 
                @click="setView('create-room')"
                class="px-6 py-3 bg-slate-700/60 hover:bg-slate-600/70 border border-cyan-500/50 rounded-xl text-cyan-300 font-medium transition-colors"
              >
                🔒 Crear Sala
              </button>
              
            </div>
          </div>
        </div>
      </div>
      
      
      <div v-if="currentView === 'chat' && currentRoom" class="relative z-10 h-full flex flex-col">
        
        
        <div class="bg-black/50 backdrop-blur-lg border-b border-slate-600/30 p-4 pt-8">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button @click="leaveRoom" class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-colors">
                <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 class="text-lg font-bold text-cyan-300">{{ currentRoom.name }}</h1>
                <p class="text-slate-400 text-sm">{{ currentRoom.members?.length || 0 }} miembros • Código: {{ currentRoom.code }}</p>
              </div>
            </div>
          </div>
        </div>
        
        
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div
            v-for="message in currentRoomMessages"
            :key="message.id"
            :class="[
              'flex',
              message.isOwn ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              v-if="message.isSystem"
              class="bg-slate-800/60 border border-slate-600/40 rounded-xl px-4 py-2 text-center text-slate-400 text-sm italic max-w-xs"
            >
              {{ message.text }}
            </div>
            <div
              v-else
              :class="[
                'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl',
                message.isOwn
                  ? 'bg-slate-700/60 border border-cyan-500/50 text-slate-100'
                  : 'bg-slate-800/50 border border-slate-600/40 text-slate-200'
              ]"
            >
              <div v-if="!message.isOwn" class="text-cyan-300 text-sm font-medium mb-1">{{ message.username }}</div>
              <div class="break-words">{{ message.text }}</div>
              <div :class="['text-xs mt-1', message.isOwn ? 'text-cyan-200/70' : 'text-slate-400']">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
          
          
          <div v-if="!currentRoomMessages || currentRoomMessages.length === 0" class="flex flex-col items-center justify-center py-12">
            <div class="text-6xl mb-4 opacity-60">💬</div>
            <h3 class="text-xl font-bold text-cyan-300 mb-2">Sala vacía</h3>
            <p class="text-slate-400 text-center">Sé el primero en enviar un mensaje</p>
          </div>
        </div>
        
        
        <div class="bg-black/50 backdrop-blur-lg border-t border-slate-600/30 p-4">
          <div class="flex space-x-3 items-center">
            <button @click="openCryptoPanel" class="w-11 h-11 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 transition-colors">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3m0-6V5m0 9v3m7-7a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </button>
            <input
              v-model="newMessage"
              type="text"
              placeholder="Escribe un mensaje..."
              class="flex-1 px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              @keyup.enter="sendMessage"
            />
            <button
              @click="sendMessage"
              :disabled="!newMessage.trim()"
              class="px-6 py-3 bg-slate-700/60 hover:bg-slate-600/70 disabled:bg-slate-800/30 disabled:cursor-not-allowed border border-cyan-500/50 rounded-xl text-cyan-300 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="absolute bottom-0 left-0 right-0 z-30 transform transition-all duration-500 ease-out"
             :class="showCryptoPanel ? 'translate-y-0' : 'translate-y-full'">
          <div class="bg-black/30 backdrop-blur-2xl rounded-t-3xl border-t border-white/20 max-h-[65vh] overflow-hidden shadow-2xl">
            <div class="flex justify-center py-3">
              <div class="w-12 h-1.5 bg-white/40 rounded-full"></div>
            </div>

            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-xl font-bold text-white">Enviar Criptomonedas</h3>
                  <p class="text-gray-300 text-sm">Saldo BTC: <span class="text-cyan-300 font-semibold">{{ (wallet.bitcoin_balance || 0).toFixed ? wallet.bitcoin_balance.toFixed(8) : wallet.bitcoin_balance }}</span></p>
                </div>
                <button @click="closeCryptoPanel" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold text-white mb-2">Destinatario (identificador)</label>
                  <input v-model="transfer.recipient" type="text" placeholder="citizenid / identifier"
                         class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200"/>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-white mb-2">Cantidad (BTC)</label>
                  <input v-model="transfer.amount" type="number" step="0.00000001" min="0"
                         placeholder="0.001"
                         class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200"/>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-white mb-2">Descripción (opcional)</label>
                  <input v-model="transfer.description" type="text" placeholder="Motivo de la transferencia"
                         class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200"/>
                </div>

                <div class="flex space-x-4 pt-2">
                  <button @click="sendCrypto" :disabled="transferSending"
                          class="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/30 hover:scale-105 disabled:opacity-50">
                    Enviar BTC
                  </button>
                  <button @click="closeCryptoPanel"
                          class="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 border border-white/20">
                    Cancelar
                  </button>
                </div>

                <div class="pt-4">
                  <h4 class="text-white font-semibold mb-2">Transacciones recientes</h4>
                  <div class="space-y-2 max-h-40 overflow-y-auto">
                    <div v-if="!wallet.recent_transactions || wallet.recent_transactions.length === 0" class="text-gray-400 text-sm">Sin movimientos</div>
                    <div v-for="(tx, idx) in wallet.recent_transactions" :key="idx" class="p-3 bg-white/10 rounded-xl border border-white/20 text-white/90">
                      <div class="flex justify-between text-sm">
                        <span>{{ tx.type || 'transfer' }}</span>
                        <span>{{ tx.amount }}</span>
                      </div>
                      <div class="text-xs text-gray-300" v-if="tx.description">{{ tx.description }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      <div v-if="currentView === 'create-room'" class="relative z-10 h-full flex flex-col">
        <div class="bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20 p-4 pt-8 flex-shrink-0">
          <div class="flex items-center gap-4">
            <button @click="setView('rooms')" class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-colors">
              <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h2 class="text-xl font-bold text-cyan-300">🔒 Crear Sala Privada</h2>
              <p class="text-slate-400 text-sm">Crea tu propia sala de chat anónima</p>
            </div>
          </div>
        </div>
        
        <div class="flex-1 p-6 space-y-6">
          <div class="bg-slate-800/40 backdrop-blur-lg border border-slate-600/40 rounded-2xl p-6">
            <div class="text-center mb-6">
              <div class="text-6xl mb-4">🔐</div>
              <h3 class="text-2xl font-bold text-cyan-300 mb-2">Nueva Sala Privada</h3>
              <p class="text-slate-400">Las salas privadas son completamente anónimas y se autodestruyen después de 24 horas de inactividad</p>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-slate-300 font-medium mb-2">📝 Nombre de la Sala</label>
                <input
                  v-model="newRoomName"
                  type="text"
                  placeholder="Ej: Reunión Privada..."
                  class="w-full px-4 py-3 bg-slate-700/60 border border-slate-600/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  @keyup.enter="createPrivateRoom"
                  maxlength="50"
                />
                <p class="text-slate-400 text-xs mt-1">Máximo 50 caracteres</p>
              </div>
              
              <div class="bg-slate-700/30 rounded-xl p-4 border border-slate-600/20">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl">⚠️</span>
                  <h4 class="text-yellow-400 font-semibold">Información Importante</h4>
                </div>
                <ul class="text-slate-300 text-sm space-y-1">
                  <li>• La sala se creará con un código único de 6 dígitos</li>
                  <li>• Solo quienes tengan el código podrán unirse</li>
                  <li>• Todos los mensajes son anónimos</li>
                  <li>• La sala se eliminará automáticamente si queda vacía por más de 1 hora</li>
                </ul>
              </div>
            </div>
            
            <div class="flex gap-4 mt-6">
              <button
                @click="createPrivateRoom"
                :disabled="!newRoomName.trim()"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed border border-cyan-500/50 disabled:border-slate-600/40 rounded-xl text-white font-medium transition-all duration-300"
              >
                🔒 Crear Sala Privada
              </button>
              <button
                @click="setView('rooms')"
                class="px-6 py-3 bg-slate-700/40 hover:bg-slate-600/50 border border-slate-600/40 rounded-xl text-slate-300 transition-colors"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      
      <div v-if="showJoinModal" class="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-slate-800/80 backdrop-blur-lg border border-slate-600/40 rounded-2xl p-6 w-full max-w-md">
          <div class="text-center mb-6">
            <div class="text-4xl mb-2">🔑</div>
            <h2 class="text-xl font-bold text-cyan-300 mb-2">Unirse a Sala</h2>
            <p class="text-slate-400 text-sm">Ingresa el código de la sala privada</p>
          </div>
          
          <div class="space-y-4">
            <input
              v-model="joinRoomCode"
              type="text"
              placeholder="Código de sala (ej: ABC123XY)"
              class="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-center font-mono text-lg uppercase"
              maxlength="8"
              @keyup.enter="joinRoom"
            />
            
            <div class="flex space-x-3">
              <button
                @click="hideJoinModal"
                class="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-600/40 rounded-xl text-slate-300 font-medium transition-colors hover:bg-slate-700/60"
              >
                Cancelar
              </button>
              <button
                @click="joinRoom"
                :disabled="!joinRoomCode.trim()"
                class="flex-1 px-4 py-3 bg-slate-700/60 hover:bg-slate-600/70 disabled:bg-slate-800/30 disabled:cursor-not-allowed border border-cyan-500/50 rounded-xl text-cyan-300 font-medium transition-colors"
              >
                Unirse
              </button>
            </div>
          </div>
        </div>
      </div>
      
      
      <div class="absolute top-4 right-4 z-50 space-y-2">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'px-4 py-3 rounded-xl backdrop-blur-lg border max-w-sm transform transition-all duration-300',
            notification.type === 'success' 
              ? 'bg-green-900/80 border-green-500/50 text-green-300'
              : notification.type === 'error'
              ? 'bg-red-900/80 border-red-500/50 text-red-300'
              : 'bg-slate-800/80 border-slate-600/40 text-slate-200'
          ]"
        >
          {{ notification.message }}
        </div>
      </div>
    </div>
  `
};