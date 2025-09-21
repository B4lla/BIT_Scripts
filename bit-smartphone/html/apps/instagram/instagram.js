const Instagram = {
	name: "Instashot",
	props: ["userSettings", "photos", "t"],
	emits: ["close", "take-photo"],
	data() {
		return {
			currentView: "login",
			isLoggedIn: false,
			currentUser: {
				id: null,
				username: "",
				name: "",
				bio: "",
				avatar: "",
				verified: false,
			},
			posts: [],
            stories: [],
            profilePosts: [],
            samplePosts: [],
            sampleStories: [],
			newPostForm: {
				image: "",
				caption: "",
				location: "",
				type: "post",
			},
			newStoryForm: {
				image: "",
				text: "",
			},
			editProfileForm: {
				name: "",
				bio: "",
				avatar: "",
			},
            cameraRequestTimer: null,
            cameraTimeoutMs: 8000,
			showCreatePost: false,
			showCreateStory: false,
			showEditProfile: false,
			showGallery: false,
			showCreateMenu: false,
			isSelectingForPost: false,
			isSelectingForStory: false,
			galleryPhotos: [],
			loading: false,
                _fetchAttempts: { feed: 0, stories: 0 },
			error: "",
			success: "",
			loginForm: {
				username: "",
				password: "",
			},
			registerForm: {
				name: "",
				username: "",
				password: "",
				confirmPassword: "",
			},
		};
	},
	methods: {
		async login() {
			if (!this.loginForm.username || !this.loginForm.password) {
				this.error = "Por favor completa todos los campos";
				return;
			}

			this.loading = true;
			this.error = "";

			try {
				await fetch("https://bit-smartphone/instagramLogin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(this.loginForm),
				});
			} catch (error) {
				console.error("Error en login:", error);
				this.error = "Error de conexión";
				this.loading = false;
			}
		},

		async register() {
			if (!this.registerForm.name || !this.registerForm.username || !this.registerForm.password) {
				this.error = "Por favor completa todos los campos";
				return;
			}

			if (this.registerForm.password !== this.registerForm.confirmPassword) {
				this.error = "Las contraseñas no coinciden";
				return;
			}

			this.loading = true;
			this.error = "";

			try {
				await fetch("https://bit-smartphone/instagramRegister", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(this.registerForm),
				});
			} catch (error) {
				console.error("Error en registro:", error);
				this.error = "Error de conexión";
				this.loading = false;
			}
		},

		logout() {
            this.isLoggedIn = false;
            try { localStorage.removeItem('instagram_account'); localStorage.removeItem('instagram_logged_in'); } catch (e) {}
            this.currentUser = {
				id: null,
				username: "",
				name: "",
				bio: "",
				avatar: "",
				verified: false,
				private: false,
				followers_count: 0,
				following_count: 0,
				posts_count: 0,
			};
			this.currentView = "login";
            this.posts = [];
            this.stories = [];
            this.profilePosts = [];
		},

		async loadFeed() {
            if (this._fetchAttempts.feed >= 3) {
                console.warn("[Instagram] Max feed fetch attempts reached, using sample content");
                this.posts = this.samplePosts;
                return;
            }
            
            this._fetchAttempts.feed++;
            
            try {
                await fetch("https://bit-smartphone/loadInstagramFeed", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
                
                setTimeout(() => {
                    if (this.posts.length === 0) {
                        console.log("[Instagram] No server response, loading sample posts");
                        this.posts = this.samplePosts;
                    }
                }, 3000);
                
            } catch (error) {
                console.error("Error cargando feed:", error);
                this.posts = this.samplePosts;
            }
		},

		async loadStories() {
            if (this._fetchAttempts.stories >= 3) {
                console.warn("[Instagram] Max stories fetch attempts reached, using sample content");
                this.stories = this.sampleStories;
                return;
            }
            
            this._fetchAttempts.stories++;
            
            try {
                await fetch("https://bit-smartphone/loadInstagramStories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                });
                
                setTimeout(() => {
                    if (this.stories.length === 0) {
                        console.log("[Instagram] No server response, loading sample stories");
                        this.stories = this.sampleStories;
                    }
                }, 3000);
                
            } catch (error) {
                console.error("Error cargando historias:", error);
                this.stories = this.sampleStories;
            }
		},

		async loadMessages() {
			try {
				await fetch("https://bit-smartphone/loadInstagramMessages", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});
			} catch (error) {
				console.error("Error cargando mensajes:", error);
			}
		},

		async loadProfile() {
			try {
				await fetch("https://bit-smartphone/loadInstagramProfile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});
			} catch (error) {
				console.error("Error cargando perfil:", error);
			}
		},

		async createPost() {
			if (!this.newPostForm.image || !this.newPostForm.caption.trim()) {
				this.error = "Se requiere imagen y descripción";
				return;
			}

			this.loading = true;

			try {
				await fetch("https://bit-smartphone/createInstagramPost", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(this.newPostForm),
				});

				this.showCreatePost = false;
				this.newPostForm = {
					image: "",
					caption: "",
					location: "",
					type: "post",
				};
			} catch (error) {
				console.error("Error creando post:", error);
				this.error = "Error al publicar";
			} finally {
				this.loading = false;
			}
		},

		async likePost(postId) {
			try {
				await fetch("https://bit-smartphone/likeInstagramPost", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ postId }),
				});

				const post = this.posts.find((p) => p.id === postId);
				if (post) {
					post.liked = !post.liked;
					post.likes += post.liked ? 1 : -1;
				}
			} catch (error) {
				console.error("Error con like:", error);
			}
		},

        openCamera() {
            try {
                this.error = "";
                
                if (this.cameraRequestTimer) {
                    clearTimeout(this.cameraRequestTimer);
                }
                
                this.cameraRequestTimer = setTimeout(() => {
                    this.cameraRequestTimer = null;
                    this.error = "Error: El tiempo de espera para tomar la foto ha expirado";
                    this.showCreatePost = false;
                    this.newPostForm.image = "";
                    console.error('[Instagram] Camera timeout after', this.cameraTimeoutMs, 'ms');
                }, this.cameraTimeoutMs);
                
                fetch("https://bit-smartphone/camera:take", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mode: this.cameraMode || 'back', metadata: { context: 'instagram', type: 'post' } })
                })
                .then(res => res.json().catch(() => ({})))
                .then((result) => {
                    if (result && result.success && result.url) {
                        this.newPostForm.image = result.url;
                        this.showCreatePost = true;
                        if (this.cameraRequestTimer) { clearTimeout(this.cameraRequestTimer); this.cameraRequestTimer = null; }
                    } else {
                        this.error = 'Error al capturar la imagen';
                        if (this.cameraRequestTimer) { clearTimeout(this.cameraRequestTimer); this.cameraRequestTimer = null; }
                    }
                }).catch((err) => {
                    console.error('[Instagram] camera:take fetch error', err);
                    this.error = 'Error de conexión al solicitar la cámara';
                    if (this.cameraRequestTimer) { clearTimeout(this.cameraRequestTimer); this.cameraRequestTimer = null; }
                });
                
            } catch (err) {
                console.error('[Instagram] openCamera error:', err);
                this.error = 'Error: No se pudo iniciar la cámara. Intenta de nuevo.';
                if (this.cameraRequestTimer) {
                    clearTimeout(this.cameraRequestTimer);
                    this.cameraRequestTimer = null;
                }
            }
        },

        openGallery(type = 'post') {
            this.loadGallery();
            this.showGallery = true;
            this.isSelectingForPost = type === 'post';
            this.isSelectingForStory = type === 'story';
        },

        selectPhoto(photoUrl) {
            if (this.isSelectingForPost) {
                this.newPostForm.image = photoUrl;
                this.showCreatePost = true;
            } else if (this.isSelectingForStory) {
                this.newStoryForm.image = photoUrl;
                this.showCreateStory = true;
            }
            this.closeGallery();
        },

        closeGallery() {
            this.showGallery = false;
            this.isSelectingForPost = false;
            this.isSelectingForStory = false;
        },

        openCreateStory() {
            this.showCreateMenu = false;
            this.showCreateStory = true;
            this.newStoryForm = {
                image: "",
                text: "",
            };
        },

        createStory() {
            if (!this.newStoryForm.image) {
                this.error = "Debes seleccionar una imagen para la historia";
                return;
            }

            const newStory = {
                id: Date.now(),
                user: {
                    id: this.currentUser.id,
                    username: this.currentUser.username,
                    name: this.currentUser.name,
                    avatar: this.currentUser.avatar
                },
                image: this.newStoryForm.image,
                text: this.newStoryForm.text,
                timestamp: Date.now(),
                viewers: []
            };

            this.stories.unshift(newStory);
            this.showCreateStory = false;
            this.newStoryForm = {
                image: "",
                text: "",
            };
            this.success = "¡Historia publicada exitosamente!";
            setTimeout(() => this.success = "", 3000);
        },

        openEditProfile() {
            this.editProfileForm = {
                name: this.currentUser.name || this.currentUser.username || '',
                bio: this.currentUser.bio || '',
                avatar: this.currentUser.avatar || ''
            };
            this.showEditProfile = true;
        },

        closeEditProfile() {
            this.showEditProfile = false;
        },

        updateProfile() {
            this.success = "¡Perfil actualizado exitosamente!";
            this.showEditProfile = false;
            setTimeout(() => this.success = "", 3000);
        },

        closeCreateStory() {
            this.showCreateStory = false;
            this.newStoryForm = {
                image: '',
                text: ''
            };
        },

        openGalleryForStory() {
            this.isSelectingForStory = true;
            this.isSelectingForPost = false;
            this.openGallery('story');
        },

        takePhotoForStory() {
            this.isSelectingForStory = true;
            this.isSelectingForPost = false;
            this.takePhoto();
        },

        takePhoto() {
            console.log('[Instagram] Taking photo...');
            try {
                this.$emit('take-photo');
                
                this.cameraRequestTimer = setTimeout(() => {
                    console.warn('[Instagram] Camera timeout - no photo received');
                    this.cameraRequestTimer = null;
                }, this.cameraTimeoutMs);
                
            } catch (error) {
                console.error('[Instagram] Error taking photo:', error);
            }
        },

        loadGallery() {
            console.log('[Instagram] Loading gallery, photos:', this.photos);
            this.galleryPhotos = [];
            
            if (this.photos && Array.isArray(this.photos) && this.photos.length > 0) {
                this.galleryPhotos = this.photos.map((photo, index) => {
                    let url = '';
                    if (typeof photo === 'string') {
                        url = photo;
                    } else if (photo.url) {
                        url = photo.url;
                    } else if (photo.thumbnail) {
                        url = photo.thumbnail;
                    } else if (photo.src) {
                        url = photo.src;
                    }
                    
                    return {
                        id: photo.id || `photo_${index}`,
                        url: url,
                        name: photo.name || `Photo ${index + 1}`
                    };
                }).filter(photo => photo.url); 
            }
            
            console.log('[Instagram] Gallery loaded with', this.galleryPhotos.length, 'photos');
        },

        toggleCreateMenu() {
            this.showCreateMenu = !this.showCreateMenu;
        },

        loadGallery() {
            if (this.photos && Array.isArray(this.photos) && this.photos.length > 0) {
                this.galleryPhotos = this.photos.map((p, idx) => ({ id: p.id || idx, url: p.url || p.thumbnail || p }))
            } else {
                this.galleryPhotos = []
            }
        },

        openCreatePost() {
            this.showCreateMenu = false;
            this.showCreatePost = true;
            this.newPostForm = {
                image: "",
                caption: "",
                location: "",
                type: "post",
            };
        },

        takePhotoForPost() {
            this.isSelectingForPost = true;
            this.isSelectingForStory = false;
            this.takePhoto();
        },

        openGalleryForPost() {
            this.isSelectingForPost = true;
            this.isSelectingForStory = false;
            this.openGallery('post');
        },

        avatarOrDefault(src) {
            if (!src || src === '' || src === 'null' || src === null || src === undefined) {
                return './assets/avatars/default.svg';
            }
            return src;
        },

        normalizeUser(user) {
            const u = user || {};
            return {
                id: u.id ?? null,
                username: u.username ?? 'unknown',
                name: u.name ?? '',
                bio: u.bio ?? '',
                avatar: u.avatar || './assets/avatars/default.svg',
                verified: !!u.verified,
                private: !!u.private,
                followers_count: u.followers_count || 0,
                following_count: u.following_count || 0,
                posts_count: u.posts_count || 0
            };
        },

        normalizePost(post) {
            const p = post || {};
            let userCandidate = p.user || p.author || {};
            if (!userCandidate || Object.keys(userCandidate).length === 0) {
                const built = {
                    id: p.user_id ?? p.userId ?? p.user_identifier ?? null,
                    username: p.username ?? p.user_username ?? null,
                    name: p.name ?? p.full_name ?? null,
                    avatar: p.avatar ?? p.profile_picture ?? p.image_url ?? './assets/avatars/default.svg'
                };
                if (built.id || built.username) {
                    userCandidate = built;
                }
            }

            const normalized = {
                id: p.id ?? Date.now(),
                user: this.normalizeUser(userCandidate),
                image: p.image || p.url || p.photo || p.image_url || '',
                caption: p.caption || p.text || '',
                location: p.location || '',
                likes: typeof p.likes === 'number' ? p.likes : (p.likes_count || 0),
                liked: !!p.liked,
                verified: !!p.verified,
                timestamp: p.timestamp || p.createdAt || p.created_at || Date.now(),
                ...p
            };

            normalized.user.avatar = this.avatarOrDefault(normalized.user.avatar);
            return normalized;
        },

        normalizeStory(story) {
            const s = story || {};
            const userCandidate = s.user || s.author || {};
            return {
                id: s.id ?? Date.now(),
                user: this.normalizeUser(userCandidate),
                image: s.image || s.url || s.photo || '',
                text: s.text || s.caption || '',
                timestamp: s.timestamp || s.createdAt || Date.now(),
                viewers: Array.isArray(s.viewers) ? s.viewers : []
            };
        },

		goToView(view) {
			try {
                this.showCreateMenu = false;
				this.currentView = view;

				if (view === "home" && this.isLoggedIn) {
					this.loadFeed();
					this.loadStories();
				} else if (view === "messages" && this.isLoggedIn) {
					this.loadMessages();
                } else if (view === "profile" && this.isLoggedIn) {
                    this.loadProfile();
                    this.loadProfilePosts();
				}
			} catch (e) {
				console.error("[Instashot] Error changing view:", e);

				this.currentView = "home";
			}
		},

		handleNUIMessage(event) {
			try {
				if (!event || !event.data) return;

				const { action, data } = event.data;
				if (!action) return;

				switch (action) {
                    case "instagram:profile_posts_data":
                        if (data && Array.isArray(data.posts)) {
                            const normalized = data.posts.map(p => this.normalizePost(p));
                            try { console.debug('[Instashot] profile_posts_data received, count=', normalized.length, 'firstImage=', (normalized[0] && normalized[0].image)); } catch (e) {}
                            const myId = this.currentUser && (this.currentUser.id || this.currentUser.user_id || this.currentUser.identifier);
                            this.profilePosts = normalized.filter(p => {
                                return p.user && (p.user.id == myId || p.user.username == this.currentUser.username || p.user.id == this.currentUser.user_id);
                            });
                        } else {
                            this.profilePosts = [];
                        }
                        break;
					case "instagram:register_error":
					case "instagram:login_error":
						this.error = data?.error || "Error desconocido";
						this.loading = false;
						break;

					case "instagram:register_success":
						this.success = data?.message || "Registro exitoso";
						this.currentView = "login";
						this.loading = false;
						break;

					case "instagram:login_success":
						if (data) {
							this.currentUser = { 
								...this.currentUser, 
								...data,
								avatar: data.avatar || './assets/avatars/default.svg'
							};
							this.isLoggedIn = true;
							this.currentView = "home";
							this.loadFeed();
							this.loadStories();
                            try { localStorage.setItem('instagram_account', JSON.stringify(this.currentUser)); localStorage.setItem('instagram_logged_in', '1'); } catch (e) {}
                            this.loadProfilePosts();
						}
						this.loading = false;
						break;

                    case "instagram:feed_data":
                        if (data && Array.isArray(data.posts)) {
                            this.posts = data.posts.map(p => this.normalizePost(p));
                            if (this.isLoggedIn) {
                                const myId = this.currentUser && (this.currentUser.id || this.currentUser.user_id || this.currentUser.identifier);
                                const myUser = this.currentUser && this.currentUser.username;
                                this.profilePosts = this.posts.filter(p => {
                                    if (!p || !p.user) return false;
                                    if (myId && (p.user.id == myId)) return true;
                                    if (myUser && (p.user.username == myUser)) return true;
                                    return false;
                                });
                            }
                        } else {
                            this.posts = [];
                        }
						break;

                    case "instagram:stories_data":
                        if (data && Array.isArray(data.stories)) {
                            this.stories = data.stories.map(s => this.normalizeStory(s));
                        } else {
                            this.stories = [];
                        }
						break;

					case "instagram:post_created":
						this.success = data?.message || "Post creado";
						this.loadFeed();
						if (this.newPostForm.type === "story") {
							this.loadStories();
						}
						break;

					case "instagram:photo_taken":
                        if (this.cameraRequestTimer) {
                            clearTimeout(this.cameraRequestTimer);
                            this.cameraRequestTimer = null;
                        }
                        if (data?.imageUrl) {
                            if (this.isSelectingForPost) {
                                this.newPostForm.image = data.imageUrl;
                                this.showCreatePost = true;
                            } else if (this.isSelectingForStory) {
                                this.newStoryForm.image = data.imageUrl;
                                this.showCreateStory = true;
                            } else {
                                this.newPostForm.image = data.imageUrl;
                                this.showCreatePost = true;
                            }
                        } else {
                            this.error = 'No se recibió la foto';
                            this.showCreatePost = false;
                            this.showCreateStory = false;
                            this.newPostForm.image = '';
                            this.newStoryForm.image = '';
                        }
                        this.isSelectingForPost = false;
                        this.isSelectingForStory = false;
						break;

					case "instagram:messages_data":
						break;

					case "instagram:profile_data":
						if (data) {
							this.currentUser = { 
								...this.currentUser, 
								...data,
								avatar: data.avatar || './assets/avatars/default.svg'
							};
						}
						break;

					default:
				}
			} catch (e) {
				console.error("[Instashot] Error handling NUI message:", e);
			}
		},

		formatTime(timestamp) {
			const now = new Date();
			const time = new Date(timestamp);
			const diff = Math.floor((now - time) / 1000);

			if (diff < 60) return diff + "s";
			if (diff < 3600) return Math.floor(diff / 60) + "m";
			if (diff < 86400) return Math.floor(diff / 3600) + "h";
			return Math.floor(diff / 86400) + "d";
		},

        initializeDemoData() {},

        async loadProfilePosts() {
            try {
                await fetch("https://bit-smartphone/bit-smartphone:instagram:getProfilePosts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                });
            } catch (error) {
                console.error("[Instagram] Error solicitando posts del perfil:", error);
            }
        },
	},

	mounted() {
		try {
            try {
                const acct = localStorage.getItem('instagram_account');
                const logged = localStorage.getItem('instagram_logged_in');
                if (logged === '1' && acct) {
                    this.currentUser = JSON.parse(acct);
                    this.isLoggedIn = true;
                    this.currentView = 'home';
                    this.loadFeed();
                    this.loadStories();
                    this.loadProfilePosts();
                }
            } catch (e) {}
			window.__instagram_message_handler = (event) => {
				try {
					if (event.data && typeof event.data === "object" && this.handleNUIMessage) {
						this.handleNUIMessage(event);
					}
				} catch (err) {
					console.error("[Instashot] Message handler error:", err);
				}
			};

			window.addEventListener("message", window.__instagram_message_handler);

			this.handlePhotoShare = (event) => {
				if (event.detail && event.detail.photo) {
                    this.showCreatePost = true;
                    this.newPostForm.image = event.detail.photo.url || event.detail.photo.photoUrl || event.detail.photoUrl;
                    this.newPostForm.caption = '';
				}
			};
			window.addEventListener('phone:share-photo', this.handlePhotoShare);
		} catch (err) {
			console.error("[Instashot] mounted setup failed", err);
		}
	},

	beforeUnmount() {
		try {
			if (typeof window !== "undefined" && window.__instagram_message_handler) {
				window.removeEventListener("message", window.__instagram_message_handler);
				window.__instagram_message_handler = null;
			}

			window.removeEventListener('phone:share-photo', this.handlePhotoShare);

            if (this.cameraRequestTimer) {
                clearTimeout(this.cameraRequestTimer);
                this.cameraRequestTimer = null;
            }
		} catch (err) {
			console.error("Instashot beforeUnmount error", err);
		}
	},

	template: `
            <div class="h-full bg-black text-white flex flex-col" style="min-height:100%; display:flex; flex-direction:column;">
                
                <div v-if="currentView !== 'login' && currentView !== 'register'" 
                     class="flex items-center justify-between p-4 bg-black border-b border-gray-900">
                    <button @click="$emit('close')" class="text-white">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    
                    <h1 class="text-xl font-bold">
                        <span v-if="currentView === 'home'">Instashot</span>
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
                            <svg class="w-16 h-16 mx-auto mb-4" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M349.33 69.33H162.67C110.17 69.33 69.33 110.17 69.33 162.67v186.67C69.33 401.83 110.17 442.67 162.67 442.67h186.67c52.5 0 93.34-40.84 93.34-93.34V162.67c0-52.5-40.84-93.34-93.34-93.34zm61.34 280c0 33.83-27.51 61.34-61.34 61.34H162.67c-33.83 0-61.34-27.51-61.34-61.34V162.67c0-33.83 27.51-61.34 61.34-61.34h186.67c33.83 0 61.34 27.51 61.34 61.34v186.66z"/>
                                <path d="M256 165.33c-50.12 0-90.67 40.55-90.67 90.67S205.88 346.67 256 346.67 346.67 306.12 346.67 256 306.12 165.33 256 165.33zm0 149.34c-32.57 0-58.67-26.1-58.67-58.67s26.1-58.67 58.67-58.67 58.67 26.1 58.67 58.67-26.1 58.67-58.67 58.67z"/>
                                <circle cx="393.6" cy="118.4" r="17.07"/>
                            </svg>
                            <h1 class="text-3xl font-bold mb-2">Instashot</h1>
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
                            <p class="text-gray-400">Únete a Instashot</p>
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
                    
                    <div v-if="stories.length" class="p-4 border-b border-gray-900">
                        <div class="flex space-x-3 overflow-x-auto">
                            <div v-for="story in stories" :key="story.id" 
                                 class="flex-shrink-0 flex flex-col items-center space-y-1">
                                <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-0.5">
                             <img :src="avatarOrDefault(story.user.avatar)" 
                                         :alt="story.user.name"
                                         class="w-full h-full rounded-full border-2 border-black object-cover"
                                         @error="(e)=>{e.target.src='./assets/avatars/default.svg'}" />
                                </div>
                                <span class="text-xs text-gray-300">{{ story.user.username }}</span>
                            </div>
                        </div>
                    </div>
                    
                    
                    <div class="flex-1 overflow-y-auto">
                        <div v-for="post in posts" :key="post.id" class="border-b border-gray-900">
                            
                            <div class="flex items-center justify-between p-4">
                                <div class="flex items-center space-x-3">
                             <img :src="avatarOrDefault(post.user.avatar)" 
                                         :alt="post.user.name"
                                         class="w-10 h-10 rounded-full object-cover"
                                         @error="(e)=>{e.target.src='./assets/avatars/default.svg'}" />
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
                        
                        <div v-if="posts.length === 0" class="flex-1 flex items-center justify-center py-16">
                            <div class="text-center space-y-4">
                                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
                                    <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                </div>
                                <h3 class="text-xl font-semibold text-white">¡Empieza a compartir!</h3>
                                <p class="text-gray-400 max-w-xs">Cuando publiques fotos y videos, aparecerán aquí en tu feed personal.</p>
                                <button @click="goToView('create')" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
                                    Crear tu primera publicación
                                </button>
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
                       <img :src="avatarOrDefault(currentUser.avatar)" 
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
                        
                        <div class="mb-4">
                            <button @click="openEditProfile" 
                                    class="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                                Editar perfil
                            </button>
                        </div>
                        
                        <div class="border-t border-gray-800 pt-4">
                            <div class="grid grid-cols-3 gap-1">
                                <div v-for="post in profilePosts" 
                                     :key="post.id" 
                                     class="aspect-square bg-gray-800 rounded">
                                    <img :src="post.image" 
                                         :alt="post.caption" 
                                         class="w-full h-full object-cover rounded"
                                         @error="(e)=>{e.target.src='./assets/backgrounds/bg1.jpg'}" />
                                </div>
                                <div v-if="profilePosts.length === 0" 
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
                
                
                <div v-if="showCreatePost" class="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                    <div class="bg-black border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div class="flex items-center justify-between p-4 border-b border-gray-800">
                            <h2 class="text-xl font-bold text-white">Nueva Publicación</h2>
                            <button @click="showCreatePost = false" 
                                    class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="p-4 space-y-4">
                            <div v-if="newPostForm.image" class="aspect-square bg-black rounded-xl overflow-hidden border border-gray-800">
                                <img :src="newPostForm.image" alt="Preview" class="w-full h-full object-cover" />
                            </div>
                            <div v-else class="aspect-square bg-gray-900 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-700">
                                <div class="text-center text-gray-400">
                                    <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    <p class="text-lg font-medium">Selecciona una imagen</p>
                                    <p class="text-sm text-gray-500 mt-1">Elige de la galería o toma una foto</p>
                                </div>
                            </div>
                            
                            <div v-if="!newPostForm.image" class="grid grid-cols-2 gap-3">
                                <button @click="takePhotoForPost" 
                                        class="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <span>Tomar foto</span>
                                </button>
                                <button @click="openGalleryForPost" 
                                        class="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-4 rounded-xl transition-all duration-200 font-medium">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                    </svg>
                                    <span>Galería</span>
                                </button>
                            </div>
                        
                            <div class="space-y-4">
                                <div class="flex space-x-2 bg-gray-900 p-1 rounded-xl">
                                    <button @click="newPostForm.type = 'post'" 
                                            :class="newPostForm.type === 'post' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-gray-400 hover:text-white'"
                                            class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">Publicación</button>
                                    <button @click="newPostForm.type = 'story'" 
                                            :class="newPostForm.type === 'story' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-gray-400 hover:text-white'"
                                            class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">Historia</button>
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-gray-300">Descripción</label>
                                    <textarea 
                                        v-model="newPostForm.caption"
                                        placeholder="Escribe una descripción..."
                                        class="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 h-24 resize-none focus:outline-none focus:border-purple-500 transition-colors"
                                    ></textarea>
                                </div>
                                
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-gray-300">Ubicación</label>
                                    <input 
                                        v-model="newPostForm.location"
                                        type="text" 
                                        placeholder="Agregar ubicación"
                                        class="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                                
                                <button 
                                    @click="createPost"
                                    :disabled="loading || !newPostForm.image"
                                    class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-600 text-white p-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed"
                                >
                                    <span v-if="loading" class="flex items-center justify-center space-x-2">
                                        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                        <span>Publicando...</span>
                                    </span>
                                    <span v-else>{{ newPostForm.type === 'story' ? 'Compartir Historia' : 'Publicar' }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                
                <div v-if="isLoggedIn" class="bg-black border-t border-gray-900 flex justify-around py-3">
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
                    <div class="relative">
                        <button @click="toggleCreateMenu" class="text-gray-400 p-2">
                            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                        </button>
                        <div v-if="showCreateMenu" class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black border border-gray-800 rounded-xl shadow-2xl min-w-max overflow-hidden">
                            <button @click="openCreatePost" class="block w-full text-left px-5 py-4 text-white hover:bg-gray-900 transition-colors flex items-center space-x-3">
                                <div class="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                </div>
                                <span class="font-medium">Crear Post</span>
                            </button>
                            <div class="border-t border-gray-800"></div>
                            <button @click="openCreateStory" class="block w-full text-left px-5 py-4 text-white hover:bg-gray-900 transition-colors flex items-center space-x-3">
                                <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                    </svg>
                                </div>
                                <span class="font-medium">Crear Historia</span>
                            </button>
                        </div>
                    </div>
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

            <div v-if="showEditProfile" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                <div class="bg-black border border-gray-800 rounded-2xl w-full max-w-md">
                    <div class="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold text-white">Editar perfil</h3>
                            <button @click="closeEditProfile" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-5">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-300">Nombre</label>
                            <input v-model="editProfileForm.name" 
                                   type="text" 
                                   class="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none transition-colors">
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-300">Biografía</label>
                            <textarea v-model="editProfileForm.bio" 
                                      rows="3" 
                                      class="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none resize-none transition-colors"
                                      placeholder="Escribe algo sobre ti..."></textarea>
                        </div>
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-300">Avatar URL</label>
                            <input v-model="editProfileForm.avatar" 
                                   type="text" 
                                   class="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                   placeholder="https://...">
                        </div>
                    </div>

                    <div class="p-6 pt-0">
                        <div class="flex space-x-3">
                            <button @click="closeEditProfile" 
                                    class="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-medium transition-colors">
                                Cancelar
                            </button>
                            <button @click="updateProfile" 
                                    class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200">
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showCreateStory" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                <div class="bg-black border border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
                    <div class="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold text-white">Nueva Historia</h3>
                            <button @click="closeCreateStory" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                        <div class="space-y-3">
                            <label class="block text-sm font-medium text-gray-300">Imagen</label>
                            <div v-if="newStoryForm.image" class="w-full h-48 bg-gray-900 rounded-xl overflow-hidden ring-2 ring-purple-500">
                                <img :src="newStoryForm.image" alt="Story preview" class="w-full h-full object-cover">
                            </div>
                            <div v-else class="w-full h-48 bg-gray-900 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-700 hover:border-gray-600 transition-colors">
                                <div class="text-center text-gray-400">
                                    <div class="bg-gray-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                    </div>
                                    <p class="font-medium">Selecciona una imagen</p>
                                    <p class="text-xs text-gray-500 mt-1">Para crear tu historia</p>
                                </div>
                            </div>
                            
                            <div class="flex space-x-3">
                                <button @click="takePhotoForStory" 
                                        class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <span>Cámara</span>
                                </button>
                                <button @click="openGalleryForStory" 
                                        class="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14-4H3a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                                    </svg>
                                    <span>Galería</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="space-y-2">
                            <label class="block text-sm font-medium text-gray-300">Texto (opcional)</label>
                            <textarea v-model="newStoryForm.text" 
                                      rows="3" 
                                      class="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none transition-colors"
                                      placeholder="Añade un texto a tu historia..."></textarea>
                        </div>
                    </div>
                    
                    <div class="p-6 pt-0 border-t border-gray-800">
                        <div class="flex space-x-3">
                            <button @click="closeCreateStory" 
                                    class="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-medium transition-colors">
                                Cancelar
                            </button>
                            <button @click="createStory" 
                                    :disabled="!newStoryForm.image"
                                    :class="!newStoryForm.image ? 'from-gray-700 to-gray-600 cursor-not-allowed' : 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'"
                                    class="flex-1 bg-gradient-to-r text-white py-3 px-4 rounded-xl font-medium transition-all duration-200">
                                <span v-if="!newStoryForm.image">Selecciona imagen</span>
                                <span v-else>Publicar Historia</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showGallery" class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                <div class="bg-black border border-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                    <div class="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
                        <div class="flex justify-between items-center">
                            <h3 class="text-lg font-semibold text-white">
                                {{ isSelectingForStory ? 'Seleccionar para Historia' : 'Seleccionar para Post' }}
                            </h3>
                            <button @click="closeGallery" class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-4 max-h-[60vh] overflow-y-auto">
                        <div class="grid grid-cols-3 gap-3 mb-6">
                            <div v-for="photo in galleryPhotos" 
                                 :key="photo.id" 
                                 @click="selectPhoto(photo.url)"
                                 class="aspect-square bg-gray-900 rounded-xl cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all duration-200 overflow-hidden group">
                                <img :src="photo.url" 
                                     :alt="'Gallery photo ' + photo.id" 
                                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200">
                            </div>
                        </div>
                        
                        <div v-if="galleryPhotos.length === 0" class="text-center py-12 text-gray-400">
                            <div class="bg-gray-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <p class="text-lg font-medium mb-2">No hay fotos en la galería</p>
                            <p class="text-sm text-gray-500">Toma una foto primero para poder seleccionarla</p>
                        </div>
                    </div>
                    
                    <div class="p-4 border-t border-gray-800">
                        <button @click="closeGallery" 
                                class="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-medium transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `,
};

window.Instagram = Instagram;

try {
	if (typeof window !== "undefined") {
		window.Instagram = window.Instagram || Instagram;
	}
} catch (e) {
	console.error("Failed to expose Instashot globally", e);
}
