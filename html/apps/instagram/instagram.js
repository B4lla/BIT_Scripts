const Instagram = {
    name: 'Instagram',
    props: ["userSettings", "photos", "t"],
    emits: ["close", "take-photo"],
    data() {
        return {
            currentView: 'login',
            isLoggedIn: false,
            currentUser: {
                id: null,
                username: '',
                name: '',
                bio: '',
                avatar: '',
                verified: false
            },
            posts: [],
            stories: [],
            newPostForm: {
                image: '',
                caption: '',
                location: '',
                type: 'post'
            },
            showCreatePost: false,
            loading: false,
            error: '',
            success: '',
            loginForm: {
                username: '',
                password: ''
            },
            registerForm: {
                name: '',
                username: '',
                password: '',
                confirmPassword: ''
            }
        };
    },
        methods: {
            async login() {
                if (!this.loginForm.username || !this.loginForm.password) {
                    this.error = 'Por favor completa todos los campos';
                    return;
                }
                
                this.loading = true;
                this.error = '';
                
                try {
                    await fetch('https://bit-smartphone/instagramLogin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(this.loginForm)
                    });
                } catch (error) {
                    console.error('Error en login:', error);
                    this.error = 'Error de conexión';
                    this.loading = false;
                }
            },
            
            async register() {
                if (!this.registerForm.name || !this.registerForm.username || !this.registerForm.password) {
                    this.error = 'Por favor completa todos los campos';
                    return;
                }
                
                if (this.registerForm.password !== this.registerForm.confirmPassword) {
                    this.error = 'Las contraseñas no coinciden';
                    return;
                }
                
                this.loading = true;
                this.error = '';
                
                try {
                    await fetch('https://bit-smartphone/instagramRegister', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(this.registerForm)
                    });
                } catch (error) {
                    console.error('Error en registro:', error);
                    this.error = 'Error de conexión';
                    this.loading = false;
                }
            },
            
            logout() {
                this.isLoggedIn = false;
                this.currentUser = {
                    id: null,
                    username: '',
                    name: '',
                    bio: '',
                    avatar: '',
                    verified: false,
                    private: false,
                    followers_count: 0,
                    following_count: 0,
                    posts_count: 0
                };
                this.currentView = 'login';
                this.posts = [];
                this.stories = [];
            },
            
            
            async loadFeed() {
                try {
                    await fetch('https://bit-smartphone/loadInstagramFeed', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                } catch (error) {
                    console.error('Error cargando feed:', error);
                }
            },
            
            async loadStories() {
                try {
                    await fetch('https://bit-smartphone/loadInstagramStories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                } catch (error) {
                    console.error('Error cargando historias:', error);
                }
            },

            async loadMessages() {
                try {
                    await fetch('https://bit-smartphone/loadInstagramMessages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                } catch (error) {
                    console.error('Error cargando mensajes:', error);
                }
            },

            async loadProfile() {
                try {
                    await fetch('https://bit-smartphone/loadInstagramProfile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                } catch (error) {
                    console.error('Error cargando perfil:', error);
                }
            },
            
            async createPost() {
                if (!this.newPostForm.image || !this.newPostForm.caption.trim()) {
                    this.error = 'Se requiere imagen y descripción';
                    return;
                }
                
                this.loading = true;
                
                try {
                    await fetch('https://bit-smartphone/createInstagramPost', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(this.newPostForm)
                    });
                    
                    this.showCreatePost = false;
                    this.newPostForm = {
                        image: '',
                        caption: '',
                        location: '',
                        type: 'post'
                    };
                } catch (error) {
                    console.error('Error creando post:', error);
                    this.error = 'Error al publicar';
                } finally {
                    this.loading = false;
                }
            },
            
            async likePost(postId) {
                try {
                    await fetch('https://bit-smartphone/likeInstagramPost', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ postId })
                    });
                    
                    
                    const post = this.posts.find(p => p.id === postId);
                    if (post) {
                        post.liked = !post.liked;
                        post.likes += post.liked ? 1 : -1;
                    }
                } catch (error) {
                    console.error('Error con like:', error);
                }
            },
            
            openCamera() {
                this.$emit('take-photo');
            },
            
            
            goToView(view) {
                try {
                    this.currentView = view;
                    
                    if (view === 'home' && this.isLoggedIn) {
                        this.loadFeed();
                        this.loadStories();
                    } else if (view === 'messages' && this.isLoggedIn) {
                        this.loadMessages();
                    } else if (view === 'profile' && this.isLoggedIn) {
                        this.loadProfile();
                    }
                } catch (e) {
                    console.error('[Instagram] Error changing view:', e);
                    
                    this.currentView = 'home';
                }
            },
            
            
            handleNUIMessage(event) {
                try {
                    if (!event || !event.data) return;
                    
                    const { action, data } = event.data;
                    if (!action) return;
                    
                    switch (action) {
                        case 'instagram:register_error':
                        case 'instagram:login_error':
                            this.error = data?.error || 'Error desconocido';
                            this.loading = false;
                            break;
                            
                        case 'instagram:register_success':
                            this.success = data?.message || 'Registro exitoso';
                            this.currentView = 'login';
                            this.loading = false;
                            break;
                            
                        case 'instagram:login_success':
                            if (data) {
                                this.currentUser = { ...this.currentUser, ...data };
                                this.isLoggedIn = true;
                                this.currentView = 'home';
                                this.loadFeed();
                                this.loadStories();
                            }
                            this.loading = false;
                            break;
                            
                        case 'instagram:feed_data':
                            if (data && Array.isArray(data.posts)) {
                                this.posts = data.posts;
                            }
                            break;
                            
                        case 'instagram:stories_data':
                            if (data && Array.isArray(data.stories)) {
                                this.stories = data.stories;
                            }
                            break;
                            
                        case 'instagram:post_created':
                            this.success = data?.message || 'Post creado';
                            this.loadFeed();
                            if (this.newPostForm.type === 'story') {
                                this.loadStories();
                            }
                            break;
                            
                        case 'instagram:photo_taken':
                            if (data?.imageUrl) {
                                this.newPostForm.image = data.imageUrl;
                                this.showCreatePost = true;
                            }
                            break;

                        case 'instagram:messages_data':
                            
                            console.log('[Instagram] Messages loaded:', data);
                            break;

                        case 'instagram:profile_data':
                            
                            if (data) {
                                this.currentUser = { ...this.currentUser, ...data };
                            }
                            break;
                            
                        default:
                            console.log('[Instagram] Unknown action:', action);
                    }
                } catch (e) {
                    console.error('[Instagram] Error handling NUI message:', e);
                }
            },
            
            formatTime(timestamp) {
                const now = new Date();
                const time = new Date(timestamp);
                const diff = Math.floor((now - time) / 1000);
                
                if (diff < 60) return diff + 's';
                if (diff < 3600) return Math.floor(diff / 60) + 'm';
                if (diff < 86400) return Math.floor(diff / 3600) + 'h';
                return Math.floor(diff / 86400) + 'd';
            },

            initializeDemoData() {
                
                console.log('[Instagram] Ready for server data');
            }
        },
    
        mounted() {
            try {
                
                window.__instagram_message_handler = (event) => {
                    try {
                        if (event.data && typeof event.data === 'object' && this.handleNUIMessage) {
                            this.handleNUIMessage(event);
                        }
                    } catch (err) {
                        console.error('[Instagram] Message handler error:', err);
                    }
                };

                window.addEventListener('message', window.__instagram_message_handler);
            } catch (err) {
                console.error('[Instagram] mounted setup failed', err);
            }
        },
        
        beforeUnmount() {
            try {
                if (typeof window !== 'undefined' && window.__instagram_message_handler) {
                    window.removeEventListener('message', window.__instagram_message_handler);
                    window.__instagram_message_handler = null;
                }
            } catch (err) {
                console.error('Instagram beforeUnmount error', err);
            }
        },
        
        template: `
            <div class="h-full bg-black text-white flex flex-col" style="min-height:100%; display:flex; flex-direction:column;">
                
                <div v-if="currentView !== 'login' && currentView !== 'register'" 
                     class="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
                    <button @click="$emit('close')" class="text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    
                    <h1 class="text-xl font-bold">
                        <span v-if="currentView === 'home'">Instagram</span>
                        <span v-else-if="currentView === 'profile'">Perfil</span>
                        <span v-else-if="currentView === 'create'">Nueva publicación</span>
                        <span v-else-if="currentView === 'messages'">Mensajes</span>
                        <span v-else-if="currentView === 'search'">Explorar</span>
                    </h1>
                    
                    <button @click="logout" class="text-red-400 hover:text-red-300">
                        Salir
                    </button>
                </div>
                
                
                <div v-if="error" class="bg-red-600 text-white p-3 text-center">
                    {{ error }}
                    <button @click="error = ''" class="ml-2 text-red-200">×</button>
                </div>
                
                <div v-if="success" class="bg-green-600 text-white p-3 text-center">
                    {{ success }}
                    <button @click="success = ''" class="ml-2 text-green-200">×</button>
                </div>
                
                
                <div v-if="currentView === 'login'" class="flex-1 flex items-center justify-center p-6">
                    <div class="w-full max-w-md space-y-6">
                        <div class="text-center">
                            <h1 class="text-3xl font-bold mb-2">Instagram</h1>
                            <p class="text-gray-400">Inicia sesión para continuar</p>
                        </div>
                        
                        <div class="space-y-4">
                            <input 
                                v-model="loginForm.username"
                                type="text" 
                                placeholder="Usuario"
                                class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                            />
                            <input 
                                v-model="loginForm.password"
                                type="password" 
                                placeholder="Contraseña"
                                @keyup.enter="login"
                                class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                            />
                            
                            <button 
                                @click="login"
                                :disabled="loading"
                                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-3 rounded-lg font-semibold"
                            >
                                {{ loading ? 'Iniciando...' : 'Iniciar Sesión' }}
                            </button>
                            
                            <div class="text-center">
                                <button @click="currentView = 'register'" class="text-blue-400 hover:text-blue-300">
                                    ¿No tienes cuenta? Regístrate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                <div v-if="currentView === 'register'" class="flex-1 flex items-center justify-center p-6">
                    <div class="w-full max-w-md space-y-6">
                        <div class="text-center">
                            <h1 class="text-3xl font-bold mb-2">Crear Cuenta</h1>
                            <p class="text-gray-400">Únete a Instagram</p>
                        </div>
                        
                        <div class="space-y-4">
                            <input 
                                v-model="registerForm.name"
                                type="text" 
                                placeholder="Nombre completo"
                                class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                            />
                            <input 
                                v-model="registerForm.username"
                                type="text" 
                                placeholder="Usuario"
                                class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                            />
                            <input 
                                v-model="registerForm.password"
                                type="password" 
                                placeholder="Contraseña"
                                class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                            />
                            <input 
                                v-model="registerForm.confirmPassword"
                                type="password" 
                                placeholder="Confirmar contraseña"
                                @keyup.enter="register"
                                class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                            />
                            
                            <button 
                                @click="register"
                                :disabled="loading"
                                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-3 rounded-lg font-semibold"
                            >
                                {{ loading ? 'Registrando...' : 'Crear Cuenta' }}
                            </button>
                            
                            <div class="text-center">
                                <button @click="currentView = 'login'" class="text-blue-400 hover:text-blue-300">
                                    ¿Ya tienes cuenta? Inicia sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                
                
                <div v-if="currentView === 'home'" class="flex-1 overflow-hidden flex flex-col">
                    
                    <div v-if="stories.length" class="p-4 border-b border-gray-800">
                        <div class="flex space-x-3 overflow-x-auto">
                            <div v-for="story in stories" :key="story.id" 
                                 class="flex-shrink-0 flex flex-col items-center space-y-1">
                                <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
                                    <img :src="story.user.avatar" 
                                         :alt="story.user.name"
                                         class="w-full h-full rounded-full border-2 border-black object-cover"
                                         @error="(e)=>{e.target.src='./assets/avatars/default.png'}" />
                                </div>
                                <span class="text-xs text-gray-300">{{ story.user.username }}</span>
                            </div>
                        </div>
                    </div>
                    
                    
                    <div class="flex-1 overflow-y-auto">
                        <div v-for="post in posts" :key="post.id" class="border-b border-gray-800">
                            
                            <div class="flex items-center justify-between p-4">
                                <div class="flex items-center space-x-3">
                                    <img :src="post.user.avatar" 
                                         :alt="post.user.name"
                                         class="w-10 h-10 rounded-full object-cover"
                                         @error="(e)=>{e.target.src='./assets/avatars/default.png'}" />
                                    <div>
                                        <div class="flex items-center space-x-1">
                                            <span class="font-semibold">{{ post.user.username }}</span>
                                            <svg v-if="post.user.verified" class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                            </svg>
                                        </div>
                                        <span v-if="post.location" class="text-sm text-gray-400">{{ post.location }}</span>
                                    </div>
                                </div>
                                <button class="text-gray-400">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                    </svg>
                                </button>
                            </div>
                            
                            
                            <img :src="post.image" :alt="post.caption" class="w-full aspect-square object-cover" @error="(e)=>{e.target.src='./assets/backgrounds/bg1.jpg'}" />
                            
                            
                            <div class="p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center space-x-4">
                                        <button @click="likePost(post.id)" 
                                                :class="post.liked ? 'text-red-500' : 'text-white'">
                                            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                            </svg>
                                        </button>
                                        <button class="text-white">
                                            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                            </svg>
                                        </button>
                                        <button class="text-white">
                                            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <button class="text-white">
                                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                                        </svg>
                                    </button>
                                </div>
                                
                                <div class="space-y-1">
                                    <p class="font-semibold">{{ post.likes.toLocaleString() }} me gusta</p>
                                    <div>
                                        <span class="font-semibold">{{ post.user.username }}</span>
                                        <span class="ml-2">{{ post.caption }}</span>
                                    </div>
                                    <p v-if="post.comments > 0" class="text-gray-400">
                                        Ver los {{ post.comments }} comentarios
                                    </p>
                                    <p class="text-gray-400 text-sm uppercase">{{ formatTime(post.timestamp) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                
                <div v-if="currentView === 'search'" class="flex-1 overflow-y-auto p-4">
                    <div class="mb-4">
                        <input type="text" 
                               placeholder="Buscar usuarios, hashtags..." 
                               class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400">
                    </div>
                    <div class="text-center py-12 text-gray-400">
                        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <p>Busca usuarios y contenido</p>
                    </div>
                </div>
                
                
                
                <div v-if="currentView === 'messages'" class="flex-1 overflow-y-auto p-4">
                    <div class="text-center py-12 text-gray-400">
                        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        <p>Mensajes directos</p>
                        <p class="text-sm mt-2">Los mensajes aparecerán aquí</p>
                    </div>
                </div>
                
                
                
                <div v-if="currentView === 'profile'" class="flex-1 overflow-y-auto">
                    <div class="p-4">
                        <div class="flex items-center space-x-4 mb-6">
                            <img :src="currentUser.avatar || './assets/avatars/default.png'" 
                                 :alt="currentUser.name" 
                                 class="w-20 h-20 rounded-full object-cover"
                                 @error="(e)=>{e.target.src='./assets/avatars/default.png'}" />
                            <div class="flex-1">
                                <h2 class="text-xl font-bold">{{ currentUser.name || currentUser.username }}</h2>
                                <p class="text-gray-400">@{{ currentUser.username }}</p>
                                <div class="flex space-x-4 mt-2 text-sm">
                                    <span><strong>{{ currentUser.posts_count || 0 }}</strong> publicaciones</span>
                                    <span><strong>{{ currentUser.followers_count || 0 }}</strong> seguidores</span>
                                    <span><strong>{{ currentUser.following_count || 0 }}</strong> siguiendo</span>
                                </div>
                            </div>
                        </div>
                        
                        <div v-if="currentUser.bio" class="mb-4">
                            <p>{{ currentUser.bio }}</p>
                        </div>
                        
                        <div class="border-t border-gray-800 pt-4">
                            <div class="grid grid-cols-3 gap-1">
                                <div v-for="post in posts.filter(p => p.user.id === currentUser.id)" 
                                     :key="post.id" 
                                     class="aspect-square bg-gray-800 rounded">
                                    <img :src="post.image" 
                                         :alt="post.caption" 
                                         class="w-full h-full object-cover rounded"
                                         @error="(e)=>{e.target.src='./assets/backgrounds/bg1.jpg'}" />
                                </div>
                                <div v-if="posts.filter(p => p.user.id === currentUser.id).length === 0" 
                                     class="col-span-3 text-center py-12 text-gray-400">
                                    <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    <p>No hay publicaciones aún</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                <div v-if="showCreatePost" class="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
                    <div class="bg-gray-900 rounded-xl w-full max-w-md p-6 space-y-4">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold">Nueva Publicación</h2>
                            <button @click="showCreatePost = false" class="text-gray-400">×</button>
                        </div>
                        
                        <div v-if="newPostForm.image" class="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                            <img :src="newPostForm.image" alt="Preview" class="w-full h-full object-cover" />
                        </div>
                        
                        <div class="space-y-3">
                            <div class="flex space-x-2">
                                <button @click="newPostForm.type = 'post'" 
                                        :class="newPostForm.type === 'post' ? 'bg-blue-600' : 'bg-gray-700'"
                                        class="px-4 py-2 rounded-lg text-sm">Publicación</button>
                                <button @click="newPostForm.type = 'story'" 
                                        :class="newPostForm.type === 'story' ? 'bg-blue-600' : 'bg-gray-700'"
                                        class="px-4 py-2 rounded-lg text-sm">Historia</button>
                            </div>
                            
                            <textarea 
                                v-model="newPostForm.caption"
                                placeholder="Escribe una descripción..."
                                class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 h-24 resize-none"
                            ></textarea>
                            
                            <input 
                                v-model="newPostForm.location"
                                type="text" 
                                placeholder="Agregar ubicación"
                                class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                            />
                            
                            <button 
                                @click="createPost"
                                :disabled="loading || !newPostForm.image"
                                class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-3 rounded-lg font-semibold"
                            >
                                {{ loading ? 'Publicando...' : (newPostForm.type === 'story' ? 'Compartir Historia' : 'Publicar') }}
                            </button>
                        </div>
                    </div>
                </div>
                
                
                
                <div v-if="isLoggedIn" class="bg-gray-900 border-t border-gray-800 flex justify-around py-3">
                    <button @click="goToView('home')" 
                            :class="currentView === 'home' ? 'text-white' : 'text-gray-400'"
                            class="p-2">
                        <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                    </button>
                    <button @click="goToView('search')" 
                            :class="currentView === 'search' ? 'text-white' : 'text-gray-400'"
                            class="p-2">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </button>
                    <button @click="openCamera" class="text-gray-400 p-2">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                    </button>
                    <button @click="goToView('messages')" 
                            :class="currentView === 'messages' ? 'text-white' : 'text-gray-400'"
                            class="p-2">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                    </button>
                    <button @click="goToView('profile')" 
                            :class="currentView === 'profile' ? 'text-white' : 'text-gray-400'"
                            class="p-2">
                        <div class="w-7 h-7 rounded-full bg-gray-600 overflow-hidden">
                            <img v-if="currentUser.avatar" :src="currentUser.avatar" alt="Profile" class="w-full h-full object-cover" @error="(e)=>{e.target.src='./assets/avatars/default.png'}" />
                            <div v-else class="w-full h-full bg-gray-600 flex items-center justify-center">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        `
};

window.Instagram = Instagram;


try {
    if (typeof window !== 'undefined') {
        window.Instagram = window.Instagram || Instagram;
    }
} catch (e) {
    console.error('Failed to expose Instagram globally', e);
}