const DarkWeb = {
  name: 'darkweb',
  props: ['cryptoWallet', 'cryptoPrices', 'getCryptoBalance', 'getTotalCryptoValueUSD', 'spendCrypto', 't'],
  data() {
    return {
      rooms: [],          
      privateRooms: [],   
      currentRoom: null,
      currentView: 'rooms', 
      currentCategory: 'all',
      newRoomName: '',
      joinRoomCode: '',
      showJoinModal: false,
      username: `Anon${Math.floor(Math.random() * 9999)}`,
      newMessage: '',
      isLoading: false,
      notifications: [],
      onlineUsers: Math.floor(Math.random() * 30) + 25,
      
      marketItems: [
        {
          id: 1,
          name: 'Información Confidencial',
          description: 'Documentos clasificados',
          price: 0.05,
          currency: 'btc',
          seller: 'DataBroker',
          category: 'info',
          inStock: true,
          rating: 4.8,
          sales: 127
        },
        {
          id: 2,
          name: 'Servicio de Anonimato',
          description: 'VPN premium + proxies',
          price: 200,
          currency: 'eth',
          seller: 'GhostNet',
          category: 'services',
          inStock: true,
          rating: 4.9,
          sales: 89
        },
        {
          id: 3,
          name: 'Cuentas Digitales',
          description: 'Accesos verificados',
          price: 50,
          currency: 'ltc',
          seller: 'AccountDealer',
          category: 'digital',
          inStock: false,
          rating: 4.2,
          sales: 156
        },
        {
          id: 4,
          name: 'Consultoría Crypto',
          description: 'Asesoría en inversiones',
          price: 0.02,
          currency: 'btc',
          seller: 'CryptoGuru',
          category: 'services',
          inStock: true,
          rating: 4.7,
          sales: 203
        }
      ]
    };
  },
  computed: {
    currentRoomMessages() {
      return this.currentRoom ? this.currentRoom.messages : [];
    },
    totalCryptoValue() {
      return this.getTotalCryptoValueUSD ? this.getTotalCryptoValueUSD() : 0;
    },
    filteredMarketItems() {
      if (this.currentCategory === 'all') {
        return this.marketItems;
      }
      return this.marketItems.filter(item => item.category === this.currentCategory);
    }
  },
  mounted() {
    window.addEventListener('message', this.handleNuiMessage);
    this.loadRooms();
    this.simulateActivity();
    
    
    if (this.privateRooms.length === 0) {
      this.createSampleRooms();
    }
  },
  methods: {
    createSampleRooms() {
      const sampleRooms = [
        {
          id: Date.now() + 1,
          name: '🔒 Sala Segura',
          code: this.generateRoomCode(),
          creator: 'CyberMaster',
          members: ['CyberMaster', 'Anonymous'],
          messages: [
            {
              id: Date.now(),
              username: 'CyberMaster',
              text: 'Bienvenidos a la sala segura. Todas las comunicaciones están cifradas.',
              timestamp: Date.now() - 300000,
              isOwn: false
            }
          ],
          createdAt: Date.now() - 600000
        },
        {
          id: Date.now() + 2,
          name: '💰 Trading Hub',
          code: this.generateRoomCode(),
          creator: 'TradeKing',
          members: ['TradeKing', 'CryptoWhale'],
          messages: [
            {
              id: Date.now() + 1,
              username: 'TradeKing',
              text: 'Intercambios seguros solo aquí. Verifico todas las transacciones.',
              timestamp: Date.now() - 180000,
              isOwn: false
            }
          ],
          createdAt: Date.now() - 900000
        }
      ];
      
      this.privateRooms = sampleRooms;
    },
    generateRoomCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },
    loadRooms() {
      fetch('https://bit-smartphone/darkweb:getRooms', {
        method: 'POST',
        body: JSON.stringify({})
      }).catch(error => console.error('[Darkweb] Error loading rooms:', error));
    },
    handleNuiMessage(event) {
      const msg = event.data;
      switch (msg.action) {
        case 'roomsLoaded': this.rooms = msg.data.rooms || []; break;
        case 'roomCreated': this.rooms.push(msg.data.room); this.notifications.push('Sala creada'); break;
        case 'roomJoined': this.currentRoom = this.rooms.find(r => r.id === msg.data.roomId); break;
        case 'messageAdded': if (this.currentRoom && this.currentRoom.id === msg.data.roomId) this.currentRoom.messages.push(msg.data); break;
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
      if (!this.newRoomName.trim()) return this.showNotification('Ingresa un nombre', 'error');
      
      const newRoom = {
        id: Date.now(),
        name: this.newRoomName,
        code: this.generateRoomCode(),
        creator: this.username,
        members: [this.username],
        messages: [],
        createdAt: Date.now()
      };
      
      this.privateRooms.push(newRoom);
      this.addSystemMessage(newRoom, `Sala creada por ${this.username}`);
      
      fetch('https://bit-smartphone/darkweb:createRoom', {
        method: 'POST',
        body: JSON.stringify({ 
          name: this.newRoomName, 
          creator: this.username 
        })
      }).catch(error => console.error('[Darkweb] Error creating room:', error));
      
      this.newRoomName = '';
      this.currentView = 'rooms';
      this.showNotification('Sala creada exitosamente', 'success');
    },
    showJoinRoom() {
      this.showJoinModal = true;
    },
    hideJoinModal() {
      this.showJoinModal = false;
      this.joinRoomCode = '';
    },
    joinRoom() {
      
      const existingRoom = this.privateRooms.find(room => room.code === this.joinRoomCode.toUpperCase());
      
      if (existingRoom) {
        if (!existingRoom.members.includes(this.username)) {
          existingRoom.members.push(this.username);
          this.addSystemMessage(existingRoom, `${this.username} se unió a la sala`);
        }
        this.enterRoom(existingRoom);
        this.showNotification('Te uniste a la sala', 'success');
      } else {
        this.showNotification('Código de sala inválido', 'error');
      }
      
      fetch('https://bit-smartphone/darkweb:joinRoom', {
        method: 'POST',
        body: JSON.stringify({ code: this.joinRoomCode })
      }).catch(error => console.error('[Darkweb] Error joining room:', error));
      
      this.hideJoinModal();
    },
    enterRoom(room) {
      this.currentRoom = room;
      this.currentView = 'chat';
      setTimeout(() => {
        if (Math.random() < 0.3) {
          this.simulateResponse();
        }
      }, 2000 + Math.random() * 5000);
    },
    leaveRoom() {
      if (this.currentRoom) {
        const room = this.currentRoom;
        room.members = room.members.filter(member => member !== this.username);
        this.addSystemMessage(room, `${this.username} abandonó la sala`);
        
        if (room.creator === this.username && room.members.length === 0) {
          this.privateRooms = this.privateRooms.filter(r => r.id !== room.id);
        }
      }
      
      this.currentRoom = null;
      this.currentView = 'rooms';
    },
    sendMessage() {
      if (!this.newMessage.trim()) return;
      
      const message = {
        id: Date.now(),
        username: this.username,
        text: this.newMessage,
        timestamp: Date.now(),
        isOwn: true
      };
      
      this.currentRoom.messages.push(message);
      
      fetch('https://bit-smartphone/darkweb:sendMessage', {
        method: 'POST',
        body: JSON.stringify({ 
          roomId: this.currentRoom.id, 
          text: this.newMessage, 
          username: this.username 
        })
      }).catch(error => console.error('[Darkweb] Error sending message:', error));
      
      this.newMessage = '';
      
      
      setTimeout(() => {
        if (Math.random() < 0.4) {
          this.simulateResponse();
        }
      }, 1000 + Math.random() * 3000);
    },
    addSystemMessage(room, text) {
      const message = {
        id: Date.now(),
        username: 'SYSTEM',
        text: text,
        timestamp: Date.now(),
        isSystem: true
      };
      
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
      
      const members = this.currentRoom.members.filter(m => m !== this.username);
      
      if (members.length > 0) {
        const message = {
          id: Date.now(),
          username: members[Math.floor(Math.random() * members.length)],
          text: responses[Math.floor(Math.random() * responses.length)],
          timestamp: Date.now(),
          isOwn: false
        };
        
        this.currentRoom.messages.push(message);
      }
    },
    setCategory(category) {
      this.currentCategory = category;
    },
    buyItem(item) {
      if (!item.inStock) {
        this.showNotification('Artículo agotado', 'error');
        return;
      }
      
      const balance = this.getCryptoBalance ? this.getCryptoBalance(item.currency) : 0;
      
      if (balance < item.price) {
        this.showNotification(`Saldo insuficiente de ${item.currency.toUpperCase()}`, 'error');
        return;
      }
      
      if (confirm(`¿Confirmar compra de "${item.name}" por ${item.price} ${item.currency.toUpperCase()}?`)) {
        if (this.spendCrypto && this.spendCrypto(item.currency, item.price)) {
          this.showNotification('Compra procesada. El vendedor te contactará.', 'success');
          
          setTimeout(() => {
            this.simulateVendorContact(item);
          }, 2000 + Math.random() * 3000);
        } else {
          this.showNotification('Error procesando el pago', 'error');
        }
      }
    },
    simulateVendorContact(item) {
      const vendorRoom = {
        id: Date.now(),
        name: `💼 ${item.seller}`,
        code: this.generateRoomCode(),
        creator: item.seller,
        members: [this.username, item.seller],
        messages: [
          {
            id: Date.now(),
            username: item.seller,
            text: `${this.username}, pago confirmado por "${item.name}". Instrucciones de entrega en proceso...`,
            timestamp: Date.now(),
            isOwn: false
          }
        ],
        createdAt: Date.now()
      };
      
      this.privateRooms.push(vendorRoom);
      this.showNotification(`${item.seller} te contactó en sala privada`, 'success');
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
    renderStars(rating) {
      const stars = Math.floor(rating);
      return '★'.repeat(stars) + '☆'.repeat(5 - stars);
    },
    showNotification(message, type = 'info') {
      const notification = {
        id: Date.now(),
        message,
        type,
        timestamp: Date.now()
      };
      
      this.notifications.push(notification);
      
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
      }, 3000);
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
        
        
        <div class="bg-black/50 backdrop-blur-lg border-b border-slate-600/30 p-4">
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
          
          
          <div class="grid grid-cols-3 gap-3">
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
            
            <button 
              @click="setView('marketplace')" 
              class="bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/50 rounded-xl p-3 transition-all hover:border-cyan-500/50 group"
            >
              <div class="flex flex-col items-center space-y-2">
                <div class="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
                  <svg class="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
                <span class="text-cyan-300 font-medium text-sm">Market</span>
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
                  <p class="text-slate-400 text-sm">Por {{ room.creator }}</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-slate-400 text-sm">{{ formatTimeAgo(room.createdAt) }}</div>
                <div class="flex items-center space-x-1 text-slate-400 text-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                  </svg>
                  <span>{{ room.members.length }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="room.messages.length > 0" class="bg-slate-900/50 rounded-lg p-3">
              <div class="text-slate-200 text-sm">
                <span class="font-medium">{{ room.messages[room.messages.length - 1].username }}:</span>
                {{ room.messages[room.messages.length - 1].text }}
              </div>
            </div>
            <div v-else class="text-slate-400 text-sm italic">
              Sin mensajes recientes
            </div>
          </div>
          
          
          <div v-if="privateRooms.length === 0" class="flex flex-col items-center justify-center py-8">
            <div class="text-6xl mb-4 opacity-60">🌐</div>
            <h3 class="text-xl font-bold text-cyan-300 mb-2">Bienvenido a DarkWeb</h3>
            <p class="text-slate-400 text-center mb-6">Comienza creando tu primera sala o explorando el marketplace</p>
            
            <div class="flex space-x-4">
              <button 
                @click="setView('create-room')"
                class="px-6 py-3 bg-slate-700/60 hover:bg-slate-600/70 border border-cyan-500/50 rounded-xl text-cyan-300 font-medium transition-colors"
              >
                🔒 Crear Sala
              </button>
              <button 
                @click="setView('marketplace')"
                class="px-6 py-3 bg-slate-700/60 hover:bg-slate-600/70 border border-cyan-500/50 rounded-xl text-cyan-300 font-medium transition-colors"
              >
                🛒 Ver Market
              </button>
            </div>
          </div>
        </div>
      </div>
      
      
      <div v-if="currentView === 'chat' && currentRoom" class="relative z-10 h-full flex flex-col">
        
        
        <div class="bg-black/50 backdrop-blur-lg border-b border-slate-600/30 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button @click="leaveRoom" class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-colors">
                <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 class="text-lg font-bold text-cyan-300">{{ currentRoom.name }}</h1>
                <p class="text-slate-400 text-sm">{{ currentRoom.members.length }} miembros • Código: {{ currentRoom.code }}</p>
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
          
          
          <div v-if="currentRoomMessages.length === 0" class="flex flex-col items-center justify-center py-12">
            <div class="text-6xl mb-4 opacity-60">💬</div>
            <h3 class="text-xl font-bold text-cyan-300 mb-2">Sala vacía</h3>
            <p class="text-slate-400 text-center">Sé el primero en enviar un mensaje</p>
          </div>
        </div>
        
        
        <div class="bg-black/50 backdrop-blur-lg border-t border-slate-600/30 p-4">
          <div class="flex space-x-3">
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
      </div>
      
      
      <div v-if="currentView === 'marketplace'" class="relative z-10 h-full flex flex-col">
        
        
        <div class="bg-black/50 backdrop-blur-lg border-b border-slate-600/30 p-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <button @click="setView('rooms')" class="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-colors">
                <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 class="text-xl font-bold text-cyan-300">Black Market</h1>
                <p class="text-slate-400 text-sm">Solo pagos en crypto</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-slate-400 text-sm">Wallet</div>
              <div class="text-lg font-bold text-green-400">\${{ totalCryptoValue.toFixed(2) }}</div>
            </div>
          </div>
          
          
          <div class="flex space-x-2 overflow-x-auto pb-2">
            <button 
              v-for="category in [
                { id: 'all', name: '🌐 Todo', icon: '🌐' },
                { id: 'info', name: '📊 Info', icon: '📊' },
                { id: 'services', name: '🔧 Servicios', icon: '🔧' },
                { id: 'digital', name: '💾 Digital', icon: '💾' }
              ]"
              :key="category.id"
              @click="setCategory(category.id)"
              :class="[
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                currentCategory === category.id
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800/40 text-slate-400 border border-slate-600/40 hover:bg-slate-700/50 hover:text-slate-300'
              ]"
            >
              {{ category.name }}
            </button>
          </div>
        </div>
        
        
        <div class="flex-1 overflow-y-auto p-4">
          <div class="grid gap-4">
            <div
              v-for="item in filteredMarketItems"
              :key="item.id"
              class="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-4 hover:border-cyan-500/40 transition-all"
            >
              <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                  <h3 class="text-cyan-300 font-semibold text-lg mb-1">{{ item.name }}</h3>
                  <p class="text-slate-400 text-sm mb-2">{{ item.description }}</p>
                  <div class="flex items-center space-x-2 text-xs">
                    <span class="text-yellow-400">{{ renderStars(item.rating) }}</span>
                    <span class="text-slate-400">({{ item.sales }} ventas)</span>
                    <span class="text-cyan-400">por {{ item.seller }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-green-400">
                    {{ formatCurrency(item.price, item.currency) }}
                  </div>
                  <div :class="['text-sm font-medium', item.inStock ? 'text-green-400' : 'text-red-400']">
                    {{ item.inStock ? '✓ Disponible' : '✗ Agotado' }}
                  </div>
                </div>
              </div>
              
              <div class="flex space-x-3">
                <button
                  @click="buyItem(item)"
                  :disabled="!item.inStock"
                  class="flex-1 px-4 py-3 bg-slate-700/60 hover:bg-slate-600/70 disabled:bg-slate-800/30 disabled:cursor-not-allowed border border-cyan-500/50 rounded-xl text-cyan-300 font-medium transition-colors"
                >
                  {{ item.inStock ? '🛒 Comprar' : 'Agotado' }}
                </button>
                <button class="px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-600/40 rounded-xl text-slate-300 transition-colors">
                  💬 Contactar
                </button>
              </div>
            </div>
          </div>
          
          
          <div v-if="filteredMarketItems.length === 0" class="flex flex-col items-center justify-center py-12">
            <div class="text-6xl mb-4 opacity-60">📦</div>
            <h3 class="text-xl font-bold text-cyan-300 mb-2">Sin artículos</h3>
            <p class="text-slate-400 text-center">No hay artículos en esta categoría</p>
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