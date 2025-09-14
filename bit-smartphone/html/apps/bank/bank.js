const Bank = {
    name: 'bank',
    data() {
        return {
            
            currentView: 'home', 
            showBottomPanel: false,
            isLoading: false,
            
            
            bankAccount: {
                balance: 0,
                accountNumber: null,
                accountType: null,
                holder: null,
                cardNumber: null,
                cardExpiry: null,
                lastFour: null
            },
            
            
            sendMoneyForm: {
                playerId: '',
                playerName: '',
                amount: '',
                concept: ''
            },
            
            
            requestMoneyForm: {
                playerId: '',
                playerName: '',
                amount: '',
                concept: ''
            },
            
            
            onlinePlayers: [],
            moneyBalances: { cash: 0, bank: 0 },
            
            
            transactions: [],
            
            
            searchQuery: '',
            selectedPlayer: null
        }
    },
    computed: {
        formattedBalance() {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
            }).format(this.bankAccount.balance);
        },
        
        recentTransactions() {
            return this.transactions.slice(0, 5);
        },
        
        filteredPlayers() {
            if (!this.searchQuery) return this.onlinePlayers;
            
            return this.onlinePlayers.filter(player =>
                player.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                player.serverId.toString().includes(this.searchQuery)
            );
        }
    },
    mounted() {
        this.setupBankingAPI();
        window.addEventListener('message', this.handleNUIMessage.bind(this));
        this.refreshBankData();
    },
    methods: {
        
    setupBankingAPI() {
            if (!window.BankApp) {
                window.BankApp = {
                    updateBalance: (newBalance) => this.updateBalance(newBalance),
                    addTransaction: (transactionData) => this.addTransaction(transactionData)
                };
            }
        },
        
        updateBalance(newBalance) {
            this.bankAccount.balance = newBalance;
        },
        
        addTransaction(transactionData) {
            const transaction = {
                id: transactionData.id || Date.now(),
                type: transactionData.type || 'other',
                playerName: transactionData.playerName || transactionData.counterpart || 'Sistema',
                amount: transactionData.amount,
                concept: transactionData.concept || 'Sin concepto',
                date: transactionData.created_at ? new Date(transactionData.created_at) : new Date(),
                status: transactionData.status || 'completed',
                icon: this.getTransactionIcon(transactionData.type)
            };
            this.transactions.unshift(transaction);
            if (typeof transactionData.amount === 'number') {
                this.bankAccount.balance = (this.bankAccount.balance || 0) + transactionData.amount;
            }
        },
        
        getTransactionIcon(type) {
            const icons = {
                transfer_sent: '📤',
                transfer_received: '📥',
                salary: '💰',
                purchase: '🛒',
                job_payment: '💼',
                fine: '🚫',
                deposit: '🏦',
                withdrawal: '💸'
            };
            return icons[type] || '💳';
        },
        
        
        showSendMoneyPanel() {
            this.currentView = 'send-money';
            this.showBottomPanel = true;
            this.resetForms();
        },
        
        showRequestMoneyPanel() {
            this.currentView = 'request-money';
            this.showBottomPanel = true;
            this.resetForms();
        },
        
        showTransactionsPanel() {
            this.currentView = 'transactions';
            this.showBottomPanel = true;
        },
        
        hideBottomPanel() {
            this.showBottomPanel = false;
            this.selectedPlayer = null;
            this.searchQuery = '';
        },
        
        resetForms() {
            this.sendMoneyForm = {
                playerId: '',
                playerName: '',
                amount: '',
                concept: ''
            };
            this.requestMoneyForm = {
                playerId: '',
                playerName: '',
                amount: '',
                concept: ''
            };
            this.selectedPlayer = null;
        },
        
        
        selectPlayer(player) {
            this.selectedPlayer = player;
            if (this.currentView === 'send-money') {
                this.sendMoneyForm.playerId = player.serverId;
                this.sendMoneyForm.playerName = player.name;
            } else if (this.currentView === 'request-money') {
                this.requestMoneyForm.playerId = player.serverId;
                this.requestMoneyForm.playerName = player.name;
            }
        },
        
        async sendMoney() {
            const form = this.sendMoneyForm;
            if (!form.playerId || !form.amount || form.amount <= 0) {
                this.showNotification(this.$t('bank.fillAllFields', 'Complete todos los campos requeridos'), 'error');
                return;
            }
            this.isLoading = true;
            try {
                await fetch('https://bit-smartphone/bank:transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toIdentifier: form.playerId, amount: parseFloat(form.amount), concept: form.concept }) });
            } catch (e) {
                console.error('Error sending transfer', e);
                this.showNotification(this.$t('bank.error', 'Error al enviar transferencia'), 'error');
            } finally {
                this.isLoading = false;
                this.hideBottomPanel();
            }
        },
        
        requestMoney() {
            const form = this.requestMoneyForm;
            
            if (!form.playerId || !form.amount || form.amount <= 0) {
                this.showNotification(this.$t('bank.fillAllFields', 'Complete todos los campos requeridos'), 'error');
                return;
            }
            
            this.isLoading = true;
            
            
            setTimeout(() => {
                this.showNotification(`Solicitud enviada a ${form.playerName}`, 'success');
                this.hideBottomPanel();
                this.isLoading = false;
                
                
                if (window.postMessage) {
                    window.postMessage({
                        type: 'REQUEST_MONEY',
                        data: {
                            playerId: form.playerId,
                            amount: form.amount,
                            concept: form.concept
                        }
                    });
                }
            }, 1000);
        },
        
        
        formatAmount(amount) {
            return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR'
            }).format(Math.abs(amount));
        },
        
        formatDate(date) {
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            
            if (diffMinutes < 60) {
                return `Hace ${diffMinutes}m`;
            } else if (diffHours < 24) {
                return `Hace ${diffHours}h`;
            } else if (diffDays === 1) {
                return 'Ayer';
            } else if (diffDays < 7) {
                return `Hace ${diffDays} días`;
            } else {
                return date.toLocaleDateString('es-ES');
            }
        },
        
        showNotification(message, type = 'info') {
            if (window.postMessage) {
                window.postMessage({
                    type: 'notification',
                    data: {
                        title: 'Banco',
                        message: message,
                        type: type
                    }
                });
            }
        }
        ,

        async refreshBankData() {
            try {
                await fetch('https://bit-smartphone/bank:getPlayers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
                await fetch('https://bit-smartphone/bank:getBalance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
            } catch (e) {
                console.error('Error refreshing bank data', e);
            }
        },

        handleNUIMessage(event) {
            const { action, data } = event.data || {};
            if (!action) return;

            switch (action) {
                case 'bank:players_list':
                    this.onlinePlayers = data.players || [];
                    break;
                case 'bank:balance':
                    this.bankAccount.balance = data.balance || 0;
                    this.moneyBalances = data.moneyBalances || { cash: 0, bank: data.balance || 0 };
                    break;
                case 'bank:transfer_result':
                    if (data.success) {
                        this.showNotification('Transferencia enviada', 'success');
                        this.refreshBankData();
                    } else {
                        this.showNotification('Error: ' + (data.error || 'unknown'), 'error');
                    }
                    break;
                case 'bank:incoming_transfer':
                    this.showNotification('Has recibido ' + (data.amount || 0) + '€', 'success');
                    this.refreshBankData();
                    break;
            }
        },

        async sendMoney() {
            const form = this.sendMoneyForm;
            if (!form.playerId || !form.amount || form.amount <= 0) {
                this.showNotification(this.$t('bank.fillAllFields', 'Complete todos los campos requeridos'), 'error');
                return;
            }
            this.isLoading = true;
            try {
                await fetch('https://bit-smartphone/bank:transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toIdentifier: form.playerId, amount: parseFloat(form.amount) }) });
            } catch (e) {
                console.error('Error sending transfer', e);
                this.showNotification(this.$t('bank.error', 'Error al enviar transferencia'), 'error');
            } finally {
                this.isLoading = false;
                this.hideBottomPanel();
            }
        }
    },
    template: `
        <div class="bank-app h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            
            <div class="h-full flex flex-col">
                
                <div class="bg-black/20 backdrop-blur-xl rounded-b-3xl border-b border-white/10 p-6 pt-16 shadow-2xl">
                    <div class="text-center mb-6">
                        <h1 class="text-3xl font-bold text-white mb-2">Mi Banco</h1>
                        <p class="text-gray-300">{{ bankAccount.holder }}</p>
                    </div>
                    
                    
                    <div class="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 rounded-3xl p-6 shadow-2xl border border-white/20">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <p class="text-blue-100 text-sm">Saldo disponible</p>
                                <h2 class="text-4xl font-bold text-white">{{ formattedBalance }}</h2>
                            </div>
                            <div class="w-12 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <div class="w-8 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded"></div>
                            </div>
                        </div>
                        
                        <div class="flex justify-between items-end">
                            <div>
                                <p class="text-blue-100 text-xs">{{ bankAccount.accountType }}</p>
                                <p class="text-blue-200 text-sm font-mono">{{ bankAccount.cardNumber }}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-blue-100 text-xs">Válida hasta</p>
                                <p class="text-blue-200 text-sm">{{ bankAccount.cardExpiry }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div class="p-6">
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <button @click="showSendMoneyPanel" 
                                class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-200 hover:scale-105">
                            <div class="text-center">
                                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                </div>
                                <h3 class="text-white font-semibold text-sm">Enviar Dinero</h3>
                                <p class="text-gray-400 text-xs">Transferir a jugadores</p>
                            </div>
                        </button>
                        
                        <button @click="showRequestMoneyPanel" 
                                class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-200 hover:scale-105">
                            <div class="text-center">
                                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m7-7l-7 7-7-7"></path>
                                    </svg>
                                </div>
                                <h3 class="text-white font-semibold text-sm">Solicitar Dinero</h3>
                                <p class="text-gray-400 text-xs">Pedir a jugadores</p>
                            </div>
                        </button>
                    </div>
                    
                    
                    <div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-white font-semibold">Transacciones Recientes</h3>
                            <button @click="showTransactionsPanel" 
                                    class="text-blue-400 text-sm hover:text-blue-300 transition-colors duration-200">
                                Ver todas
                            </button>
                        </div>
                        
                        <div class="space-y-3">
                            <div v-for="transaction in recentTransactions" :key="transaction.id" 
                                 class="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-200">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">
                                        {{ transaction.icon }}
                                    </div>
                                    <div>
                                        <h4 class="text-white font-medium text-sm">{{ transaction.playerName }}</h4>
                                        <p class="text-gray-400 text-xs">{{ transaction.concept }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p :class="['font-semibold text-sm', transaction.amount > 0 ? 'text-green-400' : 'text-red-400']">
                                        {{ transaction.amount > 0 ? '+' : '' }}{{ formatAmount(transaction.amount) }}
                                    </p>
                                    <p class="text-gray-500 text-xs">{{ formatDate(transaction.date) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            
            <div class="absolute bottom-0 left-0 right-0 z-30 transform transition-all duration-500 ease-out"
                 :class="showBottomPanel ? 'translate-y-0' : 'translate-y-full'">
                
                <div class="bg-black/30 backdrop-blur-2xl rounded-t-3xl border-t border-white/20 max-h-[70vh] overflow-hidden shadow-2xl">
                    
                    <div class="flex justify-center py-3">
                        <div class="w-12 h-1.5 bg-white/40 rounded-full"></div>
                    </div>

                    
                    <div v-if="currentView === 'send-money'" class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-bold text-white">Enviar Dinero</h3>
                            <button @click="hideBottomPanel" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div v-if="!selectedPlayer">
                            
                            <div class="mb-4">
                                <div class="relative">
                                    <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    <input v-model="searchQuery" 
                                           type="text" 
                                           placeholder="Buscar jugador por nombre o ID"
                                           class="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200">
                                </div>
                            </div>
                            
                            
                            <div class="space-y-3 max-h-64 overflow-y-auto">
                                <div v-for="player in filteredPlayers" :key="player.id" 
                                     @click="selectPlayer(player)"
                                     class="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
                                    <div class="flex items-center space-x-4">
                                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
                                            {{ player.avatar }}
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-white">{{ player.name }}</h4>
                                            <p class="text-sm text-gray-300">ID: {{ player.serverId }} • {{ player.distance }}</p>
                                        </div>
                                    </div>
                                    <div :class="['w-3 h-3 rounded-full', player.online ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400']"></div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="space-y-4">
                            
                            <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-4">
                                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">
                                            {{ selectedPlayer.avatar }}
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-white">{{ selectedPlayer.name }}</h4>
                                            <p class="text-sm text-gray-300">ID: {{ selectedPlayer.serverId }}</p>
                                        </div>
                                    </div>
                                    <button @click="selectedPlayer = null" class="text-gray-400 hover:text-white transition-colors duration-200">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-semibold text-white mb-2">Cantidad</label>
                                    <input v-model="sendMoneyForm.amount" 
                                           type="number" 
                                           step="0.01"
                                           placeholder="0.00"
                                           class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200">
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-white mb-2">Concepto (opcional)</label>
                                    <input v-model="sendMoneyForm.concept" 
                                           type="text" 
                                           placeholder="¿Para qué es?"
                                           class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200">
                                </div>

                                <button @click="sendMoney" 
                                        :disabled="isLoading"
                                        class="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span v-if="!isLoading">Enviar Dinero</span>
                                    <span v-else class="flex items-center justify-center">
                                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enviando...
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    
                    <div v-if="currentView === 'request-money'" class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-bold text-white">Solicitar Dinero</h3>
                            <button @click="hideBottomPanel" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <div v-if="!selectedPlayer">
                            
                            <div class="mb-4">
                                <div class="relative">
                                    <svg class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    <input v-model="searchQuery" 
                                           type="text" 
                                           placeholder="Buscar jugador por nombre o ID"
                                           class="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200">
                                </div>
                            </div>
                            
                            
                            <div class="space-y-3 max-h-64 overflow-y-auto">
                                <div v-for="player in filteredPlayers" :key="player.id" 
                                     @click="selectPlayer(player)"
                                     class="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
                                    <div class="flex items-center space-x-4">
                                        <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-xl">
                                            {{ player.avatar }}
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-white">{{ player.name }}</h4>
                                            <p class="text-sm text-gray-300">ID: {{ player.serverId }} • {{ player.distance }}</p>
                                        </div>
                                    </div>
                                    <div :class="['w-3 h-3 rounded-full', player.online ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400']"></div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="space-y-4">
                            
                            <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-4">
                                        <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-xl">
                                            {{ selectedPlayer.avatar }}
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-white">{{ selectedPlayer.name }}</h4>
                                            <p class="text-sm text-gray-300">ID: {{ selectedPlayer.serverId }}</p>
                                        </div>
                                    </div>
                                    <button @click="selectedPlayer = null" class="text-gray-400 hover:text-white transition-colors duration-200">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-semibold text-white mb-2">Cantidad</label>
                                    <input v-model="requestMoneyForm.amount" 
                                           type="number" 
                                           step="0.01"
                                           placeholder="0.00"
                                           class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200">
                                </div>

                                <div>
                                    <label class="block text-sm font-semibold text-white mb-2">Concepto (opcional)</label>
                                    <input v-model="requestMoneyForm.concept" 
                                           type="text" 
                                           placeholder="¿Para qué necesitas el dinero?"
                                           class="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 focus:outline-none transition-all duration-200">
                                </div>

                                <button @click="requestMoney" 
                                        :disabled="isLoading"
                                        class="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span v-if="!isLoading">Solicitar Dinero</span>
                                    <span v-else class="flex items-center justify-center">
                                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enviando solicitud...
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    
                    <div v-if="currentView === 'transactions'" class="p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-xl font-bold text-white">Todas las Transacciones</h3>
                            <button @click="hideBottomPanel" class="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-all duration-200">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="space-y-3 max-h-96 overflow-y-auto">
                            <div v-for="transaction in transactions" :key="transaction.id" 
                                 class="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-200">
                                <div class="flex items-center space-x-4">
                                    <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                                        {{ transaction.icon }}
                                    </div>
                                    <div>
                                        <h4 class="text-white font-semibold">{{ transaction.playerName }}</h4>
                                        <p class="text-gray-400 text-sm">{{ transaction.concept }}</p>
                                        <p class="text-gray-500 text-xs">{{ formatDate(transaction.date) }}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p :class="['font-bold text-lg', transaction.amount > 0 ? 'text-green-400' : 'text-red-400']">
                                        {{ transaction.amount > 0 ? '+' : '' }}{{ formatAmount(transaction.amount) }}
                                    </p>
                                    <p class="text-gray-500 text-xs">{{ transaction.status === 'completed' ? 'Completada' : 'Pendiente' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}
