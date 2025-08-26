const Business = {
  name: 'Business',
  props: ['userSettings', 'photos', 't'],
  emits: ['close', 'add-notification'],
  
  data() {
    return {
      businesses: [
        {
          id: 1,
          name: "Downtown Motors",
          category: "automotive",
          description: "Premium car dealership with the latest models and excellent service",
          banner: null,
          location: { x: 215.12, y: -791.23 },
          ownerId: "player_123",
          memberIds: ["player_123", "player_789"], 
          announcements: [
            {
              id: 1,
              author: "Carlos Manager",
              content: "New BMW X5 models available! Come check out our latest inventory with special financing options.",
              image: null,
              date: new Date(Date.now() - 86400000),
              authorId: "player_123",
              likes: 12,
              comments: []
            }
          ]
        },
        {
          id: 2,
          name: "Luigi's Pizza",
          category: "restaurant",
          description: "Authentic Italian pizza made with fresh ingredients and traditional recipes",
          banner: null,
          location: { x: -1035.71, y: -2735.48 },
          ownerId: "player_456",
          memberIds: ["player_456", "player_321"],
          announcements: [
            {
              id: 3,
              author: "Luigi Chef",
              content: "Today's special: Margherita pizza with buffalo mozzarella! Limited time offer - 20% off.",
              image: null,
              date: new Date(Date.now() - 172800000),
              authorId: "player_456",
              likes: 8,
              comments: []
            }
          ]
        },
        {
          id: 3,
          name: "Fashion District",
          category: "clothing",
          description: "Trendy clothing store with the latest fashion trends and exclusive collections",
          banner: null,
          location: { x: 72.25, y: -1399.10 },
          ownerId: "current_player",
          memberIds: ["current_player", "player_654"],
          announcements: [
            {
              id: 2,
              author: "Ana Stylist",
              content: "New summer collection just arrived! Visit us for exclusive designer pieces.",
              image: null,
              date: new Date(Date.now() - 43200000),
              authorId: "current_player",
              likes: 15,
              comments: []
            }
          ]
        }
      ],
      searchQuery: '',
      selectedBusiness: null,
      showBusinessDetail: false,
      showCreateAnnouncement: false,
      showCreateBusiness: false,
      currentMainTab: 'all',
      showPostsBoard: false,
      currentTab: 'announcements',
      newAnnouncement: {
        content: '',
        selectedImage: null
      },
      newBusiness: {
        name: '',
        category: 'automotive',
        description: '',
        banner: null
      },
      showSuccess: false,
      successMessage: '',
      userInfo: {
        citizenid: "current_player",
        name: "Current Player"
      },
      isLoading: false,
      loadingMessage: ''
    };
  },

  computed: {
    categories() {
      return [
        { id: 'automotive', name: this.t ? this.t('business.categories.automotive') : 'Automotive', icon: '🚗' },
        { id: 'restaurant', name: this.t ? this.t('business.categories.restaurant') : 'Restaurant', icon: '🍽️' },
        { id: 'clothing', name: this.t ? this.t('business.categories.clothing') : 'Clothing', icon: '👕' },
        { id: 'service', name: this.t ? this.t('business.categories.service') : 'Service', icon: '🔧' },
        { id: 'entertainment', name: this.t ? this.t('business.categories.entertainment') : 'Entertainment', icon: '🎮' },
        { id: 'health', name: this.t ? this.t('business.categories.health') : 'Health', icon: '🏥' }
      ]
    },

    displayedBusinesses() {
      let filteredBusinesses = this.currentMainTab === 'my' 
            ? this.businesses.filter(business => 
                business.ownerId === this.userInfo.citizenid || 
                (business.memberIds && business.memberIds.includes(this.userInfo.citizenid))
              )
        : this.businesses;
      
      if (!this.searchQuery) return filteredBusinesses;
      return filteredBusinesses.filter(business => 
        business.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        business.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },

    formattedAnnouncements() {
      if (!this.selectedBusiness) return [];
      return this.selectedBusiness.announcements
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(announcement => ({
          ...announcement,
          authorInitials: this.getInitials(announcement.author),
          formattedDate: this.formatDate(announcement.date)
        }));
    },

    formattedPosts() {
      const allPosts = [];
      this.businesses.forEach(business => {
        if (business.announcements && business.announcements.length > 0) {
          business.announcements.forEach(announcement => {
            allPosts.push({
              ...announcement,
              businessId: business.id,
              businessName: business.name,
              categoryIcon: this.getCategoryIcon(business.category),
              authorInitials: this.getInitials(announcement.author),
              formattedDate: this.formatDate(announcement.date)
            });
          });
        }
      });
      return allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    canManageBusiness() {
      return this.selectedBusiness && 
             (this.selectedBusiness.ownerId === this.userInfo.citizenid ||
              this.selectedBusiness.memberIds?.includes(this.userInfo.citizenid));
    },

    isBusinessOwner() {
      return this.selectedBusiness && 
             this.selectedBusiness.ownerId === this.userInfo.citizenid;
    }
  },

  mounted() {
    this.loadBusinessData();
  },

  methods: {
    
    async loadBusinessData() {
      this.isLoading = true;
      this.loadingMessage = 'Loading businesses...';

      try {
        if (typeof window !== 'undefined' && window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({ action: 'loadBusinesses' }));
        }

        if (typeof window !== 'undefined' && !window.invokeNative && window.fetch) {
          
        }

        await new Promise(resolve => setTimeout(resolve, 800));
      } finally {
        this.isLoading = false;
      }
    },

    
    searchBusinesses() {
      if (!this.searchQuery.trim()) return;
      
      const query = this.searchQuery.toLowerCase();
      
      this.sendAnalyticsEvent('business_search', { query });
    },

    openBusinessDetail(business) {
      this.selectedBusiness = business;
      this.showBusinessDetail = true;
      this.currentTab = 'announcements';
      
      
      this.sendAnalyticsEvent('business_viewed', { 
        businessId: business.id,
        businessName: business.name 
      });
    },

    closeBusinessDetail() {
      this.showBusinessDetail = false;
      this.selectedBusiness = null;
      this.currentTab = 'announcements';
    },

    showOnMap(business) {
      if (typeof window !== 'undefined' && window.invokeNative) {
        window.invokeNative('sendNuiMessage', JSON.stringify({
          action: 'showBusinessOnMap',
          data: {
            name: business.name,
            location: business.location,
            category: business.category
          }
        }));
      }
      
      this.showSuccessMessage(`${business.name} marked on map`);
    },

    
    openCreateAnnouncement() {
      if (!this.canManageBusiness) {
        this.showErrorMessage('You don\'t have permission to post in this business');
        return;
      }
      
      this.showCreateAnnouncement = true;
      this.newAnnouncement = {
        content: '',
        selectedImage: null
      };
    },

    closeCreateAnnouncement() {
      this.showCreateAnnouncement = false;
      this.newAnnouncement = {
        content: '',
        selectedImage: null
      };
    },

    selectImage(photo) {
      this.newAnnouncement.selectedImage = 
        this.newAnnouncement.selectedImage?.id === photo.id ? null : photo;
    },

    async createAnnouncement() {
      if (!this.newAnnouncement.content.trim()) {
        this.showErrorMessage('Post content cannot be empty');
        return;
      }

      if (!this.canManageBusiness) {
        this.showErrorMessage('You don\'t have permission to post in this business');
        return;
      }

      this.isLoading = true;
      this.loadingMessage = 'Publishing post...';

      try {
        const announcement = {
          id: Date.now(),
          author: this.userInfo.name || "Current Player",
          authorId: this.userInfo.citizenid,
          content: this.newAnnouncement.content,
          image: this.newAnnouncement.selectedImage,
          date: new Date(),
          likes: 0,
          comments: []
        };

        
        this.selectedBusiness.announcements.unshift(announcement);

        
        if (typeof window !== 'undefined' && window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'createBusinessAnnouncement',
            data: {
              businessId: this.selectedBusiness.id,
              announcement: announcement
            }
          }));
        }

        this.closeCreateAnnouncement();
        this.showSuccessMessage('Post published successfully');
        
        
        this.sendAnalyticsEvent('post_created', { 
          businessId: this.selectedBusiness.id,
          hasImage: !!announcement.image 
        });

      } catch (error) {
        console.error('Failed to create announcement:', error);
        this.showErrorMessage('Failed to publish post');
      } finally {
        this.isLoading = false;
      }
    },

    likePost(announcement) {
      
      const isLiked = announcement.likedByUser;
      announcement.likes += isLiked ? -1 : 1;
      announcement.likedByUser = !isLiked;

      
      if (typeof window !== 'undefined' && window.invokeNative) {
        window.invokeNative('sendNuiMessage', JSON.stringify({
          action: 'likePost',
          data: {
            postId: announcement.id,
            businessId: announcement.businessId || this.selectedBusiness?.id,
            liked: !isLiked
          }
        }));
      }
    },

    
    switchMainTab(tab) {
      this.currentMainTab = tab;
      this.showPostsBoard = tab === 'posts';
      this.searchQuery = '';
      
      if (tab === 'my') {
        this.loadMyBusinesses();
      }
    },

    openBusinessFromPost(businessId) {
      const business = this.businesses.find(b => b.id === businessId);
      if (business) {
        this.openBusinessDetail(business);
      }
    },

    openCreateBusiness() {
      this.showCreateBusiness = true;
      this.newBusiness = {
        name: '',
        category: 'automotive',
        description: '',
        banner: null
      };
    },

    closeCreateBusiness() {
      this.showCreateBusiness = false;
    },

    async createBusiness() {
      if (!this.newBusiness.name.trim() || !this.newBusiness.description.trim()) {
        this.showErrorMessage('Please fill in all required fields');
        return;
      }

      this.isLoading = true;
      this.loadingMessage = 'Creating business...';

      try {
        const business = {
          name: this.newBusiness.name,
          category: this.newBusiness.category,
          description: this.newBusiness.description,
          banner: this.newBusiness.banner,
          location: { x: 0, y: 0 },
          ownerId: this.userInfo.citizenid,
          memberIds: [this.userInfo.citizenid],
          announcements: []
        };

        this.businesses.push(business);
        
        
        if (typeof window !== 'undefined' && window.invokeNative) {
          window.invokeNative('sendNuiMessage', JSON.stringify({
            action: 'createBusiness',
            data: business
          }));
        }

        this.closeCreateBusiness();
        this.showSuccessMessage('Business created successfully');
        
        
        this.sendAnalyticsEvent('business_created', { 
          category: business.category,
          businessName: business.name 
        });

      } catch (error) {
        console.error('Failed to create business:', error);
        this.showErrorMessage('Failed to create business');
      } finally {
        this.isLoading = false;
      }
    },

    async loadMyBusinesses() {
      if (typeof window !== 'undefined' && window.invokeNative) {
        window.invokeNative('sendNuiMessage', JSON.stringify({
          action: 'getMyBusinesses',
          data: { citizenId: this.userInfo.citizenid }
        }));
      }
    },

    
    formatDate(date) {
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Now';
      if (minutes < 60) return `${minutes}m`;
      if (hours < 24) return `${hours}h`;
      if (days < 7) return `${days}d`;
      
      return date.toLocaleDateString();
    },

    getCategoryIcon(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.icon : '🏢';
    },

    getInitials(name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    },

    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : categoryId;
    },

    showSuccessMessage(message) {
      this.successMessage = message;
      this.showSuccess = true;
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);
    },

    showErrorMessage(message) {
      
      console.error(message);
    },

    sendAnalyticsEvent(eventName, data) {
      if (typeof window !== 'undefined' && window.invokeNative) {
        window.invokeNative('sendNuiMessage', JSON.stringify({
          action: 'analytics',
          data: {
            event: eventName,
            ...data,
            timestamp: Date.now()
          }
        }));
      }
    },

    handleModalClick(event) {
      if (event.target === event.currentTarget) {
        this.closeBusinessDetail();
      }
    },

    handleCreateModalClick(event) {
      if (event.target === event.currentTarget) {
        this.closeCreateAnnouncement();
      }
    }
  },


  template: `
    
    <div class="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
        <div class="absolute top-1/2 left-1/2 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
      </div>

      
      <transition name="fade">
        <div v-if="isLoading" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div class="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 flex flex-col items-center">
            <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-white font-medium">{{ loadingMessage }}</p>
          </div>
        </div>
      </transition>

      
      <div class="sticky top-0 z-40 bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div class="flex items-center justify-between px-6 py-4">
          
          <button @click="$emit('close')" 
                  class="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300 group">
            <svg class="w-5 h-5 text-white group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          
          
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-white">BusinessHub</h1>
              <p class="text-sm text-white/60">Professional Business Directory</p>
            </div>
          </div>
          
          
          <div class="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
            <button @click="switchMainTab('all')" 
                    :class="currentMainTab === 'all' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-white/70 hover:text-white hover:bg-white/10'"
                    class="px-4 py-2 rounded-xl transition-all text-sm font-medium flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <span>{{ t('business.allBusinesses', 'All') }}</span>
            </button>
            <button @click="switchMainTab('my')" 
                    :class="currentMainTab === 'my' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-white/70 hover:text-white hover:bg-white/10'"
                    class="px-4 py-2 rounded-xl transition-all text-sm font-medium flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>{{ t('business.myBusinesses', 'My Businesses') }}</span>
            </button>
            <button @click="switchMainTab('posts')" 
                    :class="currentMainTab === 'posts' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' : 'text-white/70 hover:text-white hover:bg-white/10'"
                    class="px-4 py-2 rounded-xl transition-all text-sm font-medium flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
              <span>{{ t('business.feed', 'Feed') }}</span>
            </button>
          </div>

          
          <button v-if="currentMainTab === 'my'" @click="openCreateBusiness" 
                  class="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
      </div>

      
      <transition name="slide-down">
        <div v-if="showSuccess" class="fixed top-24 left-6 right-6 z-50 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-3xl shadow-xl shadow-green-500/25">
          <div class="flex items-center gap-4 p-4">
            <div class="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p class="text-white font-medium">{{ successMessage }}</p>
          </div>
        </div>
      </transition>

      
      <div v-if="!showPostsBoard" class="p-6">
        <div class="relative bg-white/15 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300">
          <div class="flex items-center px-6 py-4">
            <svg class="w-6 h-6 text-white/70 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search businesses, categories, or descriptions..."
              class="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-base font-medium"
            />
          </div>
        </div>
      </div>

      
      <div class="flex-1 px-6 pb-8 overflow-y-auto custom-scrollbar">
        
        <div v-if="!showPostsBoard" class="space-y-6">
          <div 
            v-for="business in displayedBusinesses" 
            :key="business.id"
            class="group bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 hover:bg-white/15 transition-all duration-500 cursor-pointer hover:-translate-y-2"
            @click="openBusinessDetail(business)"
          >
            
            <div class="relative h-40 overflow-hidden rounded-t-3xl">
              <img v-if="business.banner" 
                   :src="business.banner.url" 
                   :alt="business.name" 
                   class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else class="w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 flex items-center justify-center group-hover:from-purple-700 group-hover:via-blue-700 group-hover:to-indigo-700 transition-all duration-500">
                <span class="text-6xl group-hover:scale-110 transition-transform duration-300">{{ getCategoryIcon(business.category) }}</span>
              </div>
              
              
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              
              
              <div class="absolute bottom-4 left-4">
                <span class="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold text-white border border-white/30 shadow-lg">
                  {{ getCategoryName(business.category) }}
                </span>
              </div>
              
              
              <div v-if="business.ownerId === userInfo.citizenid || business.memberIds?.includes(userInfo.citizenid)" 
                   class="absolute top-4 right-4">
                <span class="px-3 py-1 bg-yellow-500/20 backdrop-blur-sm rounded-full text-xs font-bold text-yellow-300 border border-yellow-400/30">
                  {{ business.ownerId === userInfo.citizenid ? 'OWNER' : 'MEMBER' }}
                </span>
              </div>
            </div>
            
            
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <h3 class="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{{ business.name }}</h3>
                <div class="flex gap-3">
                  <button @click.stop="openBusinessDetail(business)"
                          class="p-2.5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-purple-500/30 hover:border-purple-400/40 transition-all duration-300 group/btn">
                    <svg class="w-4 h-4 text-white group-hover/btn:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                  <button @click.stop="showOnMap(business)"
                          class="p-2.5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-blue-500/30 hover:border-blue-400/40 transition-all duration-300 group/btn">
                    <svg class="w-4 h-4 text-white group-hover/btn:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <p class="text-white/80 text-sm mb-4 line-clamp-3 leading-relaxed">{{ business.description }}</p>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2 text-white/60 text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                    </svg>
                    <span>{{ business.announcements.length }} posts</span>
                  </div>
                  <div class="flex items-center gap-2 text-white/60 text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span>{{ business.location.x.toFixed(0) }}, {{ business.location.y.toFixed(0) }}</span>
                  </div>
                </div>
                <div class="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50 animate-pulse"></div>
              </div>
            </div>
          </div>
          
          
          <div v-if="displayedBusinesses.length === 0" class="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div class="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <svg class="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-3">No Businesses Found</h3>
            <p class="text-white/70 text-lg max-w-md">{{ currentMainTab === 'my' ? 'You haven\'t created or joined any businesses yet.' : 'No businesses match your search criteria.' }}</p>
            <button v-if="currentMainTab === 'my'" @click="openCreateBusiness" 
                    class="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
              Create Your First Business
            </button>
          </div>
        </div>

        
        <div v-if="showPostsBoard" class="space-y-6">
          <div 
            v-for="post in formattedPosts" 
            :key="post.id"
            class="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 p-6"
          >
            
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {{ post.authorInitials }}
                </div>
                <div>
                  <div class="text-white font-semibold">{{ post.author }}</div>
                  <div class="text-white/60 text-sm">{{ post.formattedDate }}</div>
                </div>
              </div>
              
              <button @click="openBusinessFromPost(post.businessId)"
                      class="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 group">
                <span class="text-lg">{{ post.categoryIcon }}</span>
                <span class="text-white/90 text-sm font-medium group-hover:text-white transition-colors">{{ post.businessName }}</span>
              </button>
            </div>
            
            
            <p class="text-white/90 text-base mb-4 leading-relaxed">{{ post.content }}</p>
            
            
            <img v-if="post.image" 
                 :src="post.image.url" 
                 alt="Post image"
                 class="w-full h-64 object-cover rounded-2xl border border-white/20 mb-4 hover:scale-[1.02] transition-transform duration-300" />
            
            
            <div class="flex items-center justify-between pt-4 border-t border-white/10">
              <div class="flex items-center gap-6">
                <button @click="likePost(post)" 
                        class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
                  <svg class="w-5 h-5 transition-colors" 
                       :class="post.likedByUser ? 'text-red-400 fill-red-400' : 'text-white/60 group-hover:text-red-400'"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                  <span class="text-white/80 text-sm font-medium">{{ post.likes || 0 }}</span>
                </button>
                
                <button class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
                  <svg class="w-5 h-5 text-white/60 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <span class="text-white/80 text-sm font-medium">{{ (post.comments && post.comments.length) || 0 }}</span>
                </button>
              </div>
              
              <button class="p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group">
                <svg class="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
                </svg>
              </button>
            </div>
          </div>
          
          
          <div v-if="formattedPosts.length === 0" class="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div class="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <svg class="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-3">No Posts Yet</h3>
            <p class="text-white/70 text-lg max-w-md">Businesses haven't shared any posts yet. Check back later for updates!</p>
          </div>
        </div>
      </div>

      
      <transition name="modal">
        <div v-if="showBusinessDetail" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end" @click="handleModalClick">
          <div class="w-full max-h-[85%] bg-white/10 backdrop-blur-xl rounded-t-3xl border-t border-white/20 shadow-2xl" @click.stop>
            
            <div class="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span class="text-xl">{{ selectedBusiness ? getCategoryIcon(selectedBusiness.category) : '' }}</span>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-white">{{ selectedBusiness ? selectedBusiness.name : '' }}</h2>
                  <p class="text-white/70 text-sm">{{ selectedBusiness ? getCategoryName(selectedBusiness.category) : '' }}</p>
                </div>
              </div>
              <button @click="closeBusinessDetail" 
                      class="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            
            <div class="flex-1 overflow-y-auto custom-scrollbar">
              
              <div v-if="selectedBusiness && selectedBusiness.banner" class="w-full h-48 overflow-hidden">
                <img :src="selectedBusiness.banner.url" :alt="selectedBusiness.name" 
                     class="w-full h-full object-cover" />
              </div>
              
              <div class="p-6">
                
                <div class="mb-6 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <p class="text-white/90 text-base leading-relaxed">{{ selectedBusiness ? selectedBusiness.description : '' }}</p>
                </div>

                
                <div class="flex gap-2 mb-6 p-1 bg-white/10 rounded-2xl">
                  <button @click="currentTab = 'announcements'"
                          class="flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300"
                          :class="currentTab === 'announcements' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'">
                    Posts
                  </button>
                  <button @click="currentTab = 'info'"
                          class="flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300"
                          :class="currentTab === 'info' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'">
                    Information
                  </button>
                </div>

                
                <div v-if="currentTab === 'announcements'" class="space-y-4">
                  <div v-for="announcement in formattedAnnouncements" :key="announcement.id"
                       class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5 hover:bg-white/15 transition-all duration-300">
                    <div class="flex items-center gap-3 mb-4">
                      <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm">
                        {{ announcement.authorInitials }}
                      </div>
                      <div class="flex-1">
                        <div class="text-white font-medium">{{ announcement.author }}</div>
                        <div class="text-white/60 text-sm">{{ announcement.formattedDate }}</div>
                      </div>
                      <button v-if="announcement.authorId === userInfo.citizenid" 
                              class="p-2 rounded-xl hover:bg-white/10 transition-all">
                        <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                        </svg>
                      </button>
                    </div>
                    <p class="text-white/90 mb-4 leading-relaxed">{{ announcement.content }}</p>
                    <img v-if="announcement.image" :src="announcement.image.url" alt="Post image" 
                         class="w-full h-48 object-cover rounded-2xl border border-white/20" />
                    
                    
                    <div class="flex items-center gap-4 pt-4 border-t border-white/10 mt-4">
                      <button @click="likePost(announcement)" 
                              class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-all">
                        <svg class="w-4 h-4" :class="announcement.likedByUser ? 'text-red-400 fill-red-400' : 'text-white/60'"
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                        <span class="text-white/80 text-sm">{{ announcement.likes || 0 }}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div v-if="formattedAnnouncements.length === 0" class="text-center py-12">
                    <div class="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <svg class="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                      </svg>
                    </div>
                    <h4 class="text-xl font-bold text-white mb-2">No Posts Yet</h4>
                    <p class="text-white/70">This business hasn't shared any posts yet.</p>
                  </div>
                </div>

                
                <div v-if="currentTab === 'info'" class="space-y-6">
                  <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5">
                    <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      Location
                    </h3>
                    <p class="text-white/80 mb-4">Coordinates: {{ selectedBusiness ? (selectedBusiness.location.x.toFixed(2) + ', ' + selectedBusiness.location.y.toFixed(2)) : '' }}</p>
                    <button @click="showOnMap(selectedBusiness)" 
                            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                      Show on Map
                    </button>
                  </div>
                  
                  <div class="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5">
                    <h3 class="text-white font-bold mb-4 flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Business Details
                    </h3>
                    <div class="space-y-3 text-white/80">
                      <div class="flex justify-between">
                        <span>Category:</span>
                        <span class="font-medium">{{ selectedBusiness ? getCategoryName(selectedBusiness.category) : '' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Total Posts:</span>
                        <span class="font-medium">{{ selectedBusiness ? (selectedBusiness.announcements ? selectedBusiness.announcements.length : 0) : 0 }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Status:</span>
                        <span class="flex items-center gap-2 font-medium text-green-400">
                          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            
            <transition name="scale">
              <button v-if="canManageBusiness" @click="openCreateAnnouncement"
                      class="absolute -top-8 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl shadow-purple-500/50 flex items-center justify-center border-4 border-white/20 hover:scale-110 transition-all duration-300 group">
                <svg class="w-7 h-7 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </transition>
          </div>
        </div>
      </transition>

      
      <transition name="modal">
        <div v-if="showCreateAnnouncement" class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-end" @click="handleCreateModalClick">
          <div class="w-full max-h-[80%] bg-white/10 backdrop-blur-xl rounded-t-3xl border-t border-white/20 shadow-2xl" @click.stop>
            <div class="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
              <h2 class="text-xl font-bold text-white">Create New Post</h2>
              <button @click="closeCreateAnnouncement" 
                      class="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-6">
              <div>
                <label class="block text-white font-semibold mb-3">Post Content</label>
                <textarea v-model="newAnnouncement.content" 
                          placeholder="Share an update about your business..."
                          class="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          rows="5"></textarea>
              </div>

              <div v-if="photos && photos.length > 0">
                <label class="block text-white font-semibold mb-3">Add Image (Optional)</label>
                <div class="grid grid-cols-4 gap-3 max-h-40 overflow-y-auto custom-scrollbar">
                  <div v-for="photo in photos" :key="photo.id"
                       class="aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 hover:scale-105"
                       :class="newAnnouncement.selectedImage?.id === photo.id ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-white/20 hover:border-white/40'"
                       @click="selectImage(photo)">
                    <img :src="photo.url" :alt="photo.name" class="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div class="flex gap-4 pt-4">
                <button @click="closeCreateAnnouncement"
                        class="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300">
                  Cancel
                </button>
                <button @click="createAnnouncement"
                        :disabled="!newAnnouncement.content.trim()"
                        class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-lg">
                  Publish Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      
      <transition name="modal">
        <div v-if="showCreateBusiness" class="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" @click="closeCreateBusiness">
          <div class="w-full max-w-lg bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl" @click.stop>
            <div class="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
              <h2 class="text-xl font-bold text-white">Create New Business</h2>
              <button @click="closeCreateBusiness" 
                      class="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-6">
              <div>
                <label class="block text-white font-semibold mb-3">Business Name</label>
                <input v-model="newBusiness.name" 
                       type="text" 
                       placeholder="Enter your business name"
                       class="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300" />
              </div>

              <div>
                <label class="block text-white font-semibold mb-3">Category</label>
                <select v-model="newBusiness.category"
                        class="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300">
                  <option v-for="category in categories" :key="category.id" :value="category.id" class="bg-gray-800 text-white">
                    {{ category.icon }} {{ category.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-white font-semibold mb-3">Description</label>
                <textarea v-model="newBusiness.description" 
                          placeholder="Describe your business, services, and what makes it unique..."
                          class="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          rows="4"></textarea>
              </div>

              <div class="flex gap-4 pt-4">
                <button @click="closeCreateBusiness"
                        class="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300">
                  Cancel
                </button>
                <button @click="createBusiness"
                        :disabled="!newBusiness.name.trim() || !newBusiness.description.trim()"
                        class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 hover:scale-105 transition-all duration-300 shadow-lg">
                  Create Business
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  `
};