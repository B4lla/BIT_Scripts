const Messages = {
  name: "Messages",
  props: { 
    t: { type: Function, default: () => (key) => key } 
  },
  emits: ["close", "call", "video-call"],
  data() {
    return {
      currentView: "chats",
      selectedChat: null,
      searchQuery: "",
      newMessage: "",
      showMediaOptions: false,
      showEmojiPicker: false,
      showGifPicker: false,
  showCameraModal: false,
  showGalleryPicker: false,
      showContactPicker: false,
      showChatMenu: null,
      isLoading: false,
      activeEmojiTab: "smileys-people",
      activeGifTab: "trending",
      gifSearchQuery: "",
      gifSearchTimeout: null,
  gifSearchResults: [],
  galleryPhotos: [],
  cameraActive: false,
  cameraMode: 'back',
  isTakingPhoto: false,
  cameraPreviewUrl: '',
  cameraTargetChatId: null,
  cameraAutoSendServer: false,
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  lastDragTime: 0,
      emojiData: {},
      gifData: {},
      chats: [],
      contacts: [],
      phoneContacts: [],
  isLoadingContacts: false,
      __pendingSendTimeouts: {},
      __lastOpenedChatId: null
    };
  },

  computed: {
    filteredChats() {
      if (!this.searchQuery) return this.chats;
      const q = (this.searchQuery || '').toLowerCase();
      return this.chats.filter(chat => {
        const n = chat && chat.name ? String(chat.name) : '';
        return n.toLowerCase().includes(q);
      });
    },
    
    totalUnread() {
      return this.chats.reduce((total, chat) => total + (chat.unread || 0), 0);
    },

    currentGifs() {
      if (this.gifSearchQuery && this.gifSearchQuery.trim()) {
        return this.gifSearchResults || [];
      }
      return this.gifData[this.activeGifTab] || [];
    }
  },

  methods: {
    goBack() {
      if (this.showEmojiPicker) {
        this.showEmojiPicker = false;
        return;
      }
      if (this.showGifPicker) {
        this.showGifPicker = false;
        return;
      }
      if (this.showMediaOptions) {
        this.showMediaOptions = false;
        return;
      }
      if (this.showContactPicker) {
        this.showContactPicker = false;
        return;
      }
      
      if (this.currentView === "chat") {
        this.currentView = "chats";
        this.selectedChat = null;
      } else {
        this.$emit('close');
      }
    },

    openChat(chat) {
      this.selectedChat = chat;
      this.currentView = "chat";
      chat.unread = 0;
      this.__lastOpenedChatId = chat.id || chat.phoneNumber || chat.contactId || chat.number || null;

      try {
        fetch("https://bit-smartphone/messages:openChat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: this.__lastOpenedChatId })
        }).catch((e) => console.warn('[messages] openChat fetch failed', e));
      } catch(e) { console.warn('[messages] openChat fetch error', e); }
      
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },

    async sendMessage() {
      if (!this.newMessage.trim() || !this.selectedChat) return;

      const messageContent = this.newMessage.trim();
      this.newMessage = "";

      this.$nextTick(() => {
        const textarea = this.$refs.messageInput;
        if (textarea) {
          textarea.style.height = 'auto';
        }
      });

      const tempId = "temp_" + Date.now();
      const tempMessage = {
        id: tempId,
        content: messageContent,
        timestamp: Date.now(),
        senderId: "me",
        status: "sending"
      };

      if (!this.selectedChat.messages) {
        this.selectedChat.messages = [];
      }
      this.selectedChat.messages.push(tempMessage);
      this.selectedChat.lastMessage = messageContent;
      this.selectedChat.timestamp = Date.now();
      
      this.$nextTick(() => this.scrollToBottom());

      try {
        fetch("https://bit-smartphone/messages:sendMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: this.selectedChat.id || this.selectedChat.phoneNumber || this.selectedChat.contactId || this.selectedChat.number,
            type: "text",
            content: messageContent
          })
        }).catch((e) => console.warn('[messages] sendMessage fetch failed', e));
      } catch(e) { console.warn('[messages] sendMessage error', e); }

      clearTimeout(this.__pendingSendTimeouts[tempId]);
      this.__pendingSendTimeouts[tempId] = setTimeout(() => {
        const msg = (this.selectedChat?.messages || []).find(m => m.id === tempId);
        if (msg && msg.status === 'sending') {
          msg.status = 'error';
        }
      }, 10000);
    },

    scrollToBottom() {
      if (this.$refs.messagesContainer) {
        this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
      }
    },

    handleKeyPress(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.sendMessage();
      }
    },

    handleMediaAction(action) {
      this.showMediaOptions = false;

      switch (action) {
        case "camera":
          this.openCameraModal();
          break;
        case "emoji":
          this.showEmojiPicker = true;
          break;
        case "gif":
          this.showGifPicker = true;
          break;
        case "gallery":
          this.openGalleryPicker();
          break;
        case "location":
          this.sendLocationMessage();
          break;
      }
    },

    async openGalleryPicker() {
      this.showGalleryPicker = true;
      try {
        const resp = await fetch('https://bit-smartphone/photos:list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const data = await resp.json().catch(() => ({ ok: false, photos: [] }));
        if (data && data.ok && Array.isArray(data.photos)) {
          this.galleryPhotos = data.photos.map((p, idx) => ({ id: p.id || idx, url: p.url || p.thumbnail || p }));
        } else {
          this.galleryPhotos = [];
        }
      } catch (e) {
        console.warn('[messages] openGalleryPicker error', e);
        this.galleryPhotos = [];
      }
    },

    selectGalleryPhoto(photo) {
      const url = (photo && (photo.url || photo.thumbnail)) || null;
      if (url) {
        this.sendImageMessage(url);
        this.showGalleryPicker = false;
      }
    },

    closeModalsOnOutsideClick(event) {
      try {
        const target = event && event.target ? event.target : null;
        const isNode = target && typeof target === 'object' && typeof target.nodeType === 'number';
        if (this.showMediaOptions) {
          const menu = this.$refs.mediaMenu;
          const toggle = this.$refs.mediaToggle;
          const clickedInsideMenu = menu && (menu === target || (typeof menu.contains === 'function' && isNode && menu.contains(target)));
          const clickedToggle = toggle && (toggle === target || (typeof toggle.contains === 'function' && isNode && toggle.contains(target)));
          if (!clickedInsideMenu && !clickedToggle) {
            this.showMediaOptions = false;
          }
        }
      } catch(e) {
        if (this.showMediaOptions) this.showMediaOptions = false;
      }
    },

    autoResizeTextarea() {
      this.$nextTick(() => {
        const textarea = this.$refs.messageInput;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
      });
    },

    async openCameraModal() {
      this.showCameraModal = true;
      this.cameraMode = 'back';
      this.cameraPreviewUrl = '';
      this.isTakingPhoto = false;
      try {
        const cid = this.selectedChat && (this.selectedChat.phoneNumber || this.selectedChat.number || this.selectedChat.contactId || this.selectedChat.id);
        this.cameraTargetChatId = cid || null;
      } catch (e) { this.cameraTargetChatId = null; }
      this.cameraAutoSendServer = true;
      try {
        const resp = await fetch('https://bit-smartphone/camera:start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: this.cameraMode })
        });
        const data = await resp.json().catch(() => ({ success: false }));
        if (data && data.success) {
          this.cameraActive = true;
        } else {
          this.cameraActive = false;
          console.error('[messages] No se pudo iniciar la cámara');
        }
      } catch (e) {
        this.cameraActive = false;
        console.error('[messages] Error iniciando cámara', e);
      }
    },

    async takePhoto() {
      if (this.isTakingPhoto || !this.cameraActive) return;
      this.isTakingPhoto = true;
      try {
        const resp = await fetch('https://bit-smartphone/camera:take', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metadata: { app: 'messages', cameraMode: this.cameraMode, timestamp: Date.now(), chatId: this.cameraTargetChatId }
          })
        });
        const data = await resp.json().catch(() => ({ success: false }));
        if (data && data.success) {
          const url = data.url || data.photoUrl;
          if (url && !this.cameraAutoSendServer) {
            this.sendImageMessage(url, this.cameraTargetChatId || null);
          }
          this.closeCameraModal();
        } else {
          this.isTakingPhoto = false;
        }
      } catch (e) {
        console.warn('[messages] takePhoto error', e);
        this.isTakingPhoto = false;
      }
    },

    async switchCamera() {
      const newMode = this.cameraMode === 'back' ? 'front' : 'back';
      try {
        const resp = await fetch('https://bit-smartphone/camera:switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: newMode })
        });
        const data = await resp.json().catch(() => ({ success: false }));
        if (data && data.success) {
          this.cameraMode = data.mode || newMode;
        }
      } catch (e) {
        console.warn('[messages] switchCamera error', e);
      }
    },

    async closeCameraModal() {
      this.showCameraModal = false;
      this.isTakingPhoto = false;
      this.cameraPreviewUrl = '';
      if (this.cameraActive) {
        try {
          await fetch('https://bit-smartphone/camera:stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        } catch (e) {}
      }
      this.cameraActive = false;
      this.cameraTargetChatId = null;
      this.cameraAutoSendServer = false;
    },

    onCameraFrame(event) {
      if (!event || !event.data) return;
      if (event.data.action === 'camera:preview_frame' && this.cameraActive && this.showCameraModal) {
        if (event.data.imageData) {
          this.cameraPreviewUrl = event.data.imageData;
        }
      }
      if (event.data.action === 'camera:photo_taken' || event.data.action === 'camera:photo_saved') {
        this.isTakingPhoto = false;
        if (event.data.success) {
          const url = event.data.url || (event.data.photo && event.data.photo.url) || event.data.photoUrl;
          if (url && !this.cameraAutoSendServer) {
            this.sendImageMessage(url, this.cameraTargetChatId || null);
          }
          this.closeCameraModal();
        }
      }
    },

    startDrag(event) {
      if (!this.cameraActive || this.isTakingPhoto) return;
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) {}
      this.isDragging = true;
      const t = (event.touches && event.touches[0]) || event;
      const clientX = t && (t.clientX || t.pageX) || 0;
      const clientY = t && (t.clientY || t.pageY) || 0;
      this.dragStart = { x: clientX, y: clientY };
      this.lastDragTime = Date.now();
    },

    onDrag(event) {
      if (!this.isDragging || !this.cameraActive || this.isTakingPhoto) return;
      try { event.preventDefault(); } catch (e) {}
      const now = Date.now();
      if (now - this.lastDragTime < 16) return;

      const t = (event.touches && event.touches[0]) || event;
      const clientX = t && (t.clientX || t.pageX) || 0;
      const clientY = t && (t.clientY || t.pageY) || 0;
      let deltaX = (clientX - this.dragStart.x) * 0.2;
      const deltaY = (clientY - this.dragStart.y) * 0.2;
      if (this.cameraMode === 'front') deltaX = -deltaX;

      try {
        fetch('https://bit-smartphone/camera:mouse_move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deltaX, deltaY, facingMode: this.cameraMode })
        }).catch(() => {});
      } catch (e) {}
      this.lastDragTime = now;
    },

    stopDrag() {
      if (this.isDragging) this.isDragging = false;
    },

    sendImageMessage(imageUrl, explicitChatId = null) {
      if (!imageUrl) return;

      let targetId = explicitChatId || (this.selectedChat && (this.selectedChat.id || this.selectedChat.phoneNumber || this.selectedChat.contactId || this.selectedChat.number));
      if (!targetId) return;
      const targetChat = this.chats.find(c => String(c.id) === String(targetId) || String(c.phoneNumber) === String(targetId) || String(c.contactId) === String(targetId) || String(c.number) === String(targetId)) || this.selectedChat;
      if (!targetChat) return;

      const imageMessage = {
        id: "img_" + Date.now(),
        content: imageUrl,
        timestamp: Date.now(),
        senderId: "me",
        type: "image",
        status: "sending"
      };

      targetChat.messages = targetChat.messages || [];
      targetChat.messages.push(imageMessage);
      targetChat.lastMessage = "📷 Imagen";
      targetChat.timestamp = Date.now();
      
      if (this.selectedChat && (String(this.selectedChat.id) === String(targetId) || String(this.selectedChat.phoneNumber) === String(targetId))) {
        this.$nextTick(() => this.scrollToBottom());
      }

      try {
        fetch("https://bit-smartphone/messages:sendMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: targetId,
            type: "image",
            content: imageUrl
          })
        }).then(() => {
          imageMessage.status = 'sent';
        }).catch((e) => {
          console.warn('[messages] sendImageMessage fetch failed', e);
          imageMessage.status = 'error';
        });
      } catch(e) {
        console.warn('[messages] sendImageMessage error', e);
        imageMessage.status = 'error';
      }
    },

    async sendLocationMessage() {
      if (!this.selectedChat) return;

      let payload = null;
      try {
        const resp = await fetch('https://bit-smartphone/messages:getLocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await resp.json().catch(() => ({}));
        const coords = data && data.coords;
        const address = (data && data.address) || 'Ubicación compartida';
        payload = {
          x: coords && typeof coords.x === 'number' ? coords.x : 0,
          y: coords && typeof coords.y === 'number' ? coords.y : 0,
          z: coords && typeof coords.z === 'number' ? coords.z : 0,
          address
        };
      } catch (e) {
        console.warn('[messages] getLocation failed, using fallback', e);
        payload = { x: 0, y: 0, z: 0, address: 'Ubicación compartida' };
      }

      const locationMessage = {
        id: 'loc_' + Date.now(),
        type: 'location',
        content: JSON.stringify(payload),
        timestamp: Date.now(),
        senderId: 'me',
        status: 'sending'
      };

      this.selectedChat.messages.push(locationMessage);
      this.selectedChat.lastMessage = '📍 Ubicación';
      this.selectedChat.timestamp = Date.now();
      this.$nextTick(() => this.scrollToBottom());

      try {
        fetch('https://bit-smartphone/messages:sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: this.selectedChat.id || this.selectedChat.phoneNumber || this.selectedChat.contactId || this.selectedChat.number,
            type: 'location',
            content: JSON.stringify(payload)
          })
        }).then(() => { locationMessage.status = 'sent'; })
          .catch((e) => { console.warn('[messages] send location failed', e); locationMessage.status = 'error'; });
      } catch (e) {
        console.warn('[messages] sendLocationMessage error', e);
        locationMessage.status = 'error';
      }
    },

    openLocation(message) {
      try {
        const obj = (typeof message.content === 'string') ? JSON.parse(message.content) : (message.content || {});
        let x = null, y = null;
        if (typeof obj.x === 'number' && typeof obj.y === 'number') { x = obj.x; y = obj.y; }
        else if (typeof obj.longitude === 'number' && typeof obj.latitude === 'number') { x = obj.longitude; y = obj.latitude; }
        else if (typeof obj.lng === 'number' && typeof obj.lat === 'number') { x = obj.lng; y = obj.lat; }
        if (x != null && y != null) {
          fetch('https://bit-smartphone/messages:navigate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x, y })
          }).catch(e => console.warn('[messages] navigate fetch failed', e));
        }
      } catch (e) { console.warn('[messages] openLocation parse error', e); }
    },

    addEmoji(emoji) {
      this.newMessage += emoji;
      this.showEmojiPicker = false;
    },

    addGif(gifUrl) {
      if (!this.selectedChat) return;

      const gifMessage = {
        id: "gif_" + Date.now(),
        content: gifUrl,
        timestamp: Date.now(),
        senderId: "me",
        type: "gif",
        status: "sent"
      };

      this.selectedChat.messages.push(gifMessage);
      this.selectedChat.lastMessage = "GIF";
      this.selectedChat.timestamp = Date.now();
      
      this.$nextTick(() => this.scrollToBottom());
      this.showGifPicker = false;
    },

    showNewChatModal() {
      this.showContactPicker = true;
      this.isLoadingContacts = true;
      try {
        fetch("https://bit-smartphone/messages:getContacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
          .catch(e => console.warn('[messages] getContacts (from modal) fetch failed', e))
          .finally(() => { this.isLoadingContacts = false; });
      } catch(e) { 
        console.warn('[messages] getContacts (from modal) error', e); 
        this.isLoadingContacts = false;
      }
    },

    selectContactForChat(contact) {
      const existingChat = this.chats.find(chat => 
        String(chat.phoneNumber) === String(contact.number)
      );
      
      if (existingChat) {
        this.openChat(existingChat);
      } else {
        const newChat = {
          id: "temp_" + Date.now(),
          name: contact.name,
          avatar: contact.avatar || './assets/avatars/default.svg',
          phoneNumber: contact.number,
          lastMessage: "",
          timestamp: Date.now(),
          unread: 0,
          messages: [],
          status: "offline"
        };
        this.chats.unshift(newChat);
        this.openChat(newChat);
        this.createChat(contact);
      }
      this.showContactPicker = false;
    },

    createChat(contact) {
      if (!contact) return;
      try {
        fetch("https://bit-smartphone/messages:createChat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactIdentifier: contact.number, contactName: contact.name })
        }).catch((e) => console.warn('[messages] createChat fetch failed', e));
      } catch(e) { console.warn('[messages] createChat error', e); }
    },

    startCall(contact) {
      this.$emit('call', contact);
    },

    startVideoCall(contact) {
      this.$emit('video-call', contact);
    },

    formatTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "ahora";
      if (minutes < 60) return minutes + "m";
      if (hours < 24) return hours + "h";
      if (days < 7) return days + "d";
      return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
    },

    formatMessageTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      });
    },

    getAvatarUrl(avatar) {
      return avatar || './assets/avatars/default.svg';
    },

    async loadEmojis() {
      this.emojiData = {
        "smileys-people": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"],
        "animals-nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🐒", "🦍", "🦧", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦣", "🦏", "🦛", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🪶", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦔"],
        "food-drink": ["🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯"],
        "activity": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️‍♀️", "🏋️", "🏋️‍♂️", "🤼‍♀️", "🤼", "🤼‍♂️", "🤸‍♀️", "🤸", "🤸‍♂️", "⛹️‍♀️", "⛹️", "⛹️‍♂️", "🤺", "🤾‍♀️", "🤾", "🤾‍♂️", "🏌️‍♀️", "🏌️", "🏌️‍♂️", "🧘‍♀️", "🧘", "🧘‍♂️", "🏄‍♀️", "🏄", "🏄‍♂️", "🏊‍♀️", "🏊", "🏊‍♂️", "🤽‍♀️", "🤽", "🤽‍♂️", "🚣‍♀️", "🚣", "🚣‍♂️", "🧗‍♀️", "🧗", "🧗‍♂️", "🚵‍♀️", "🚵", "🚵‍♂️", "🚴‍♀️", "🚴", "🚴‍♂️"],
        "travel-places": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🛹", "🛼", "🚁", "🛸", "✈️", "🛩️", "🛫", "🛬", "🪂", "💺", "🚀", "🛰️", "🚢", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚁", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇", "🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒", "🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🛹", "🛼", "🚏", "⛽", "🚨", "🚥", "🚦", "🛑", "🚧"],
        "objects": ["⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⏳", "⌛", "📡", "🔋", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷", "🪙", "💰", "💳", "💎", "⚖️", "🪜", "🧰", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🪓", "🪚", "🔩", "⚙️", "🪤", "🧲", "🔫", "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "🪦", "⚱️", "🏺", "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", "🩺", "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️", "🧹", "🪣", "🧽", "🧼", "🪥", "🪒", "🧴", "🛎️", "🔑", "🗝️", "🚪", "🪑", "🛋️", "🛏️", "🛌", "🧸", "🪆", "🖼️", "🪞", "🪟", "🛍️", "🛒", "🎁", "🎈", "🎏", "🎀", "🪄", "🪅", "🎊", "🎉", "🪩", "🎎", "🏮", "🎐", "🧧", "✉️", "📩", "📨", "📧", "💌", "📥", "📤", "📦", "🏷️", "🪧", "📪", "📫", "📬", "📭", "📮", "📯", "📜", "📃", "📄", "📑", "🧾", "📊", "📈", "📉", "🗒️", "🗓️", "📅", "📆", "📇", "🗃️", "🗳️", "🗄️", "📋", "📌", "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗃️", "🗄️", "🗑️", "🔒", "🔓", "🔏", "🔐", "🔑", "🗝️"],
        "symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🛗", "🈳", "🈂️", "🛂", "🛃", "🛄", "🛅", "🚹", "🚺", "🚼", "⚧", "🚻", "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️", "🔤", "🔡", "🔠", "🆖", "🆗", "🆙", "🆒", "🆕", "🆓", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", "🔢", "#️⃣", "*️⃣", "⏏️", "▶️", "⏸️", "⏯️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", "🔼", "🔽", "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↪️", "↩️", "⤴️", "⤵️", "🔀", "🔁", "🔂", "🔄", "🔃", "🎵", "🎶", "➕", "➖", "➗", "✖️", "🟰", "♾️", "💲", "💱", "™️", "©️", "®️", "〰️", "➰", "➿", "🔚", "🔙", "🔛", "🔝", "🔜", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", "◻️", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🟫", "🔈", "🔇", "🔉", "🔊", "🔔", "🔕", "📣", "📢", "👁‍🗨", "💬", "💭", "🗯", "♠️", "♣️", "♥️", "♦️", "🃏", "🎴", "🀄", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛", "🕜", "🕝", "🕞", "🕟", "🕠", "🕡", "🕢", "🕣", "🕤", "🕥", "🕦", "🕧"]
      };
    },

    async loadGifs() {
      this.gifData = {
        trending: [
          { id: 1, url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif", title: "Thumbs Up" },
          { id: 2, url: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif", title: "Happy Dance" },
          { id: 3, url: "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif", title: "Wave Hello" },
          { id: 4, url: "https://media.giphy.com/media/l1J9FiGxR61OcF2mI/giphy.gif", title: "Love Heart" },
          { id: 5, url: "https://media.giphy.com/media/3oz8xZvvOZRmEay4De/giphy.gif", title: "Laugh" },
          { id: 6, url: "https://media.giphy.com/media/26FLgGTPUDH6UGAbm/giphy.gif", title: "Fire" }
        ],
        reactions: [
          { id: 7, url: "https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif", title: "Shocked" },
          { id: 8, url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif", title: "Facepalm" },
          { id: 9, url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif", title: "Applause" },
          { id: 10, url: "https://media.giphy.com/media/l1J9EdzfOSgfyueLm/giphy.gif", title: "Crying" }
        ]
      };
    },

    async searchGifs(query) {
      if (!query.trim()) {
        return this.gifData[this.activeGifTab] || [];
      }
      
      const mockResults = [
        { id: "search_1", url: "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif", title: query },
        { id: "search_2", url: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif", title: query },
        { id: "search_3", url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif", title: query }
      ];
      
      return mockResults;
    },

    handleGifSearch() {
      clearTimeout(this.gifSearchTimeout);
      const q = this.gifSearchQuery || '';
      if (!q.trim()) {
        this.gifSearchResults = [];
        return;
      }
      this.gifSearchTimeout = setTimeout(async () => {
        try {
          const results = await this.searchGifs(q);
          if ((this.gifSearchQuery || '') === q) {
            this.gifSearchResults = Array.isArray(results) ? results : [];
          }
        } catch (e) {
          console.warn('[messages] GIF search failed', e);
          this.gifSearchResults = [];
        }
      }, 250);
    },

    handleNUIMessage(event) {
      try {
        if (typeof DOMException !== 'undefined' && event instanceof DOMException) return;
        if (typeof Error !== 'undefined' && event instanceof Error) return;

        let msg = event;
        if (msg && typeof msg === 'object' && !('action' in msg) && 'data' in msg) {
          msg = msg.data;
        }

        if (!msg || typeof msg !== 'object') return;
        if (typeof DOMException !== 'undefined' && msg instanceof DOMException) return;
        if (typeof Error !== 'undefined' && msg instanceof Error) return;

        const action = msg.action || msg.type || null;
        if (!action) return;

        switch (action) {
          case 'receiveMessage':
          case 'message:received':
          case 'messages:receive':
            if (msg.data && typeof msg.data === 'object') {
              try {
                const message = msg.data;
                const chatId = message.chatId || message.phoneNumber || message.to || message.with;
                if (chatId) {
                  const chat = this.chats.find(c => String(c.id) === String(chatId) || String(c.phoneNumber) === String(chatId) || String(c.contactId) === String(chatId));
                  if (chat) {
                    chat.messages = chat.messages || [];
                    chat.messages.push(message);
                    chat.lastMessage = message.content || chat.lastMessage;
                    chat.timestamp = message.timestamp || Date.now();
                  }
                }
              } catch (e) { console.warn('[messages] error handling receiveMessage', e); }
            }
            break;

          case 'receiveNewMessage': {
            const payload = msg.data || msg;
            const chatId = payload.chatId;
            const message = payload.message || payload;
            if (!chatId || !message) break;
            const chat = this.chats.find(c => String(c.id) === String(chatId) || String(c.phoneNumber) === String(chatId) || String(c.contactId) === String(chatId));
            if (!chat) break;
            chat.messages = chat.messages || [];

            if (message.senderId === 'me') {
              const candidate = [...chat.messages].reverse().find(m => m.senderId === 'me' && m.status === 'sending' && m.content === message.content && Math.abs((message.timestamp || 0) - (m.timestamp || 0)) < 15000);
              if (candidate) {
                candidate.id = message.id || candidate.id;
                candidate.status = 'sent';
                clearTimeout(this.__pendingSendTimeouts[candidate.id]);
              } else {
                chat.messages.push(message);
              }
            } else {
              chat.messages.push(message);
              chat.unread = (chat.unread || 0) + (this.selectedChat && (String(this.selectedChat.id) === String(chatId) || String(this.selectedChat.phoneNumber) === String(chatId)) ? 0 : 1);
            }
            chat.lastMessage = message.content || chat.lastMessage;
            chat.timestamp = message.timestamp || Date.now();
            if (this.selectedChat && (String(this.selectedChat.id) === String(chatId) || String(this.selectedChat.phoneNumber) === String(chatId))) {
              this.$nextTick(() => this.scrollToBottom());
            }
            break;
          }

          case 'updateChats':
          case 'chats:update':
            if (msg.data && Array.isArray(msg.data)) {
              this.chats = msg.data;
            }
            break;

          case 'updateContacts': {
            if (Array.isArray(msg.data)) {
              this.phoneContacts = msg.data;
            }
            break;
          }

          case 'updateChatMessages': {
            const messages = msg.data;
            if (Array.isArray(messages)) {
              if (this.selectedChat) {
                this.selectedChat.messages = messages;
                this.$nextTick(() => this.scrollToBottom());
              }
            }
            break;
          }

          case 'openChat':
          case 'messages:open':
            if (msg.data) {
              const id = msg.data.chatId || msg.data.phoneNumber || msg.data.id;
              const chat = this.chats.find(c => String(c.id) === String(id) || String(c.phoneNumber) === String(id) || String(c.contactId) === String(id));
              if (chat) this.openChat(chat);
            }
            break;

          case 'updateMessageStatus': {
            const d = msg.data || {};
            const chatId = d.chatId;
            const tempId = d.tempId;
            const newMessage = d.newMessage;
            const chat = this.chats.find(c => String(c.id) === String(chatId) || String(c.phoneNumber) === String(chatId) || String(c.contactId) === String(chatId));
            if (chat && tempId && newMessage) {
              const idx = (chat.messages || []).findIndex(m => m.id === tempId);
              if (idx >= 0) {
                chat.messages.splice(idx, 1, newMessage);
              }
            }
            break;
          }

          case 'messageError': {
            const d = msg.data || {};
            const chatId = d.chatId;
            const tempId = d.tempId;
            const chat = this.chats.find(c => String(c.id) === String(chatId) || String(c.phoneNumber) === String(chatId) || String(c.contactId) === String(chatId));
            if (chat && tempId) {
              const m = (chat.messages || []).find(x => x.id === tempId);
              if (m) m.status = 'error';
            }
            break;
          }

          case 'chatCreated': {
            const cid = msg.data && msg.data.chatId;
            if (cid) {
              const chat = this.chats.find(c => String(c.id) === String(cid));
              if (chat) this.openChat(chat);
            }
            break;
          }

          case 'reactionUpdated':
          case 'chatPinToggled':
          case 'chatMuteToggled':
          case 'chatDeleted':
            break;

          default:
            break;
        }
      } catch(err) {
        console.warn('[messages] Error in NUI message handler, ignoring', err);
      }
    },
  
    initData() {
      try {
        fetch("https://bit-smartphone/messages:getContacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
          .catch(e => console.warn('[messages] getContacts fetch failed', e));
      } catch(e) { console.warn('[messages] getContacts error', e); }
      try {
        fetch("https://bit-smartphone/messages:getChats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
          .catch(e => console.warn('[messages] getChats fetch failed', e));
      } catch(e) { console.warn('[messages] getChats error', e); }
    }

  },

  mounted() {
    this.loadGifs();
    this.loadEmojis();
    this.initData();

    document.addEventListener('click', this.closeModalsOnOutsideClick);

    if (typeof window !== 'undefined') {
      this.__boundHandleNUIMessage = (event) => this.handleNUIMessage(event);
      try {
        window.__bit_dispatch = this.__boundHandleNUIMessage;
      } catch (e) {
        console.warn('[messages] could not set window.__bit_dispatch', e);
      }

      try {
        if (Array.isArray(window.__nui_message_queue) && window.__nui_message_queue.length) {
          window.__nui_message_queue.forEach((queued) => {
            try { this.handleNUIMessage(queued); } catch (err) { console.warn('[messages] error processing queued NUI message', err, queued); }
          });
          window.__nui_message_queue = [];
        }
        if (Array.isArray(window.__bit_pending_messages) && window.__bit_pending_messages.length) {
          const pend = window.__bit_pending_messages.slice();
          window.__bit_pending_messages = [];
          pend.forEach((queued) => {
            try { this.handleNUIMessage(queued); } catch (err) { console.warn('[messages] error processing pending master message', err, queued); }
          });
        }
      } catch (e) {
        console.warn('[messages] error flushing __nui_message_queue', e);
      }
    }
    try { window.addEventListener('message', this.onCameraFrame); } catch (e) {}
    try {
      document.addEventListener('mouseup', this.stopDrag);
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('touchend', this.stopDrag);
      document.addEventListener('touchmove', this.onDrag, { passive: false });
    } catch (e) {}
  },

  beforeUnmount() {
    document.removeEventListener('click', this.closeModalsOnOutsideClick);

    if (typeof window !== 'undefined') {
      try {
        if (window.__bit_dispatch === this.__boundHandleNUIMessage) {
          try { delete window.__bit_dispatch; } catch(e) { window.__bit_dispatch = undefined; }
        }
      } catch (e) {}
      this.__boundHandleNUIMessage = null;
    }
    try { window.removeEventListener('message', this.onCameraFrame); } catch (e) {}
    try {
      document.removeEventListener('mouseup', this.stopDrag);
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('touchend', this.stopDrag);
      document.removeEventListener('touchmove', this.onDrag);
    } catch (e) {}
  },

  template: `
    <div class="h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      <div class="absolute inset-0 opacity-30 dark:opacity-10 pointer-events-none">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, rgba(99,102,241,0.12) 1px, transparent 1px); background-size: 60px 60px;"></div>
      </div>

      <div v-if="currentView === 'chats'" class="h-full flex flex-col relative z-10 pointer-events-auto">
  <div class="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-gray-800 dark:to-gray-700 shadow-xl sticky top-0 z-20 pointer-events-auto">
          <div class="px-6 py-6 text-white">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-2xl font-bold tracking-tight">Mensajes</h1>
                  <p class="text-indigo-100 text-sm" v-if="totalUnread > 0">{{totalUnread}} mensajes sin leer</p>
                </div>
              </div>
              
              <button @click="showNewChatModal" aria-label="Nuevo chat"
                      class="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm hover:scale-105">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="relative">
            <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input v-model="searchQuery" 
                   type="text" 
                   placeholder="Buscar conversaciones..." 
                   class="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm">
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 pb-6">
          <div v-if="filteredChats.length === 0" class="flex flex-col items-center justify-center py-20">
            <div class="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay conversaciones</h3>
            <p class="text-gray-500 dark:text-gray-400 text-center max-w-sm">Inicia una nueva conversación tocando el botón + en la parte superior.</p>
          </div>
          
          <div v-else class="space-y-3">
            <div v-for="chat in filteredChats" :key="chat.id" 
                 @click="openChat(chat)"
                 class="flex items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700">
              
              <div class="relative flex-shrink-0">
                <img :src="getAvatarUrl(chat.avatar)" :alt="chat.name" 
                     class="w-14 h-14 rounded-2xl object-cover">
                <div v-if="chat.status === 'online'" 
                     class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div class="ml-4 flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <h3 class="font-semibold text-gray-900 dark:text-white truncate">{{chat.name}}</h3>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{formatTime(chat.timestamp)}}</span>
                </div>
                <div class="flex items-center justify-between">
                  <p class="text-sm text-gray-600 dark:text-gray-300 truncate">{{chat.lastMessage || 'Sin mensajes'}}</p>
                  <span v-if="chat.unread > 0" 
                        class="ml-2 bg-indigo-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
                    {{chat.unread}}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  <div v-if="currentView === 'chat'" class="h-full flex flex-col relative z-10 pointer-events-auto">
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-gray-800 dark:to-gray-700 shadow-xl sticky top-0 z-20 pointer-events-auto">
          <div class="px-4 py-4 text-white">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <button @click.stop="goBack" @mousedown.prevent aria-label="Volver"
                        class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                
                <div class="relative">
         <img :src="getAvatarUrl(selectedChat && selectedChat.avatar)" :alt="selectedChat && selectedChat.name" 
                       class="w-12 h-12 rounded-xl object-cover">
         <div v-if="selectedChat && selectedChat.status === 'online'" 
                       class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div>
         <h3 class="font-bold text-lg">{{selectedChat && selectedChat.name}}</h3>
         <p class="text-sm text-indigo-100">{{selectedChat && selectedChat.status === 'online' ? 'En línea' : 'Desconectado'}}</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <button @click.stop="startCall(selectedChat)" aria-label="Llamar"
                        class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </button>
                
                <button @click.stop="startVideoCall(selectedChat)" aria-label="Videollamar"
                        class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/60">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
          <div v-if="!(selectedChat && selectedChat.messages && selectedChat.messages.length)" class="flex items-center justify-center h-full">
            <div class="text-center">
              <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <p class="text-gray-500 dark:text-gray-400">Inicia la conversación</p>
            </div>
          </div>
          
          <div v-for="message in (selectedChat && selectedChat.messages) || []" :key="message.id">
            <div v-if="!message.type || message.type === 'text'" 
                 :class="['flex', message.senderId === 'me' ? 'justify-end' : 'justify-start']">
              <div :class="[
                'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm',
                message.senderId === 'me' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-md' 
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'
              ]">
                <p class="text-sm leading-relaxed break-words">{{message.content}}</p>
                <div :class="['flex items-center justify-end mt-2 space-x-1', 
                  message.senderId === 'me' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400']">
                  <span class="text-xs">{{formatMessageTime(message.timestamp)}}</span>
                  <div v-if="message.senderId === 'me'" class="flex space-x-1">
                    <svg v-if="message.status === 'sent'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else-if="message.type === 'image'" 
                 :class="['flex', message.senderId === 'me' ? 'justify-end' : 'justify-start']">
              <div :class="[
                'max-w-xs lg:max-w-md rounded-2xl shadow-sm overflow-hidden',
                message.senderId === 'me' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-white dark:bg-gray-700'
              ]">
                <img :src="message.content" alt="Imagen" class="w-full h-auto rounded-t-2xl">
                <div :class="['px-3 py-2 flex items-center justify-end space-x-1', 
                  message.senderId === 'me' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400']">
                  <span class="text-xs">{{formatMessageTime(message.timestamp)}}</span>
                </div>
              </div>
            </div>
            
            <div v-else-if="message.type === 'location'" 
                 :class="['flex', message.senderId === 'me' ? 'justify-end' : 'justify-start']">
              <div :class="[
                'max-w-xs lg:max-w-md rounded-2xl shadow-sm overflow-hidden border',
                message.senderId === 'me' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-400' 
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600'
              ]">
                <button @click="openLocation(message)" class="w-full aspect-video bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900 flex items-center justify-center hover:opacity-95 transition">
                  <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
                <div class="p-3">
                  <div class="flex items-center space-x-2 mb-1">
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="text-sm font-medium">Ubicación</span>
                  </div>
                  <p class="text-xs opacity-75">{{ (() => { try { const o = typeof message.content === 'string' ? JSON.parse(message.content) : message.content; return (o && o.address) || 'Ubicación compartida'; } catch(e) { return 'Ubicación compartida'; } })() }}</p>
                  <div :class="['flex items-center justify-end mt-2 space-x-1', 
                    message.senderId === 'me' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400']">
                    <span class="text-xs">{{formatMessageTime(message.timestamp)}}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else-if="message.type === 'gif'" 
                 :class="['flex', message.senderId === 'me' ? 'justify-end' : 'justify-start']">
              <div :class="[
                'max-w-xs lg:max-w-md rounded-2xl shadow-sm overflow-hidden',
                message.senderId === 'me' ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-white dark:bg-gray-700'
              ]">
                <img :src="message.content" alt="GIF" class="w-full h-auto rounded-t-2xl">
                <div :class="['px-3 py-2 flex items-center justify-end space-x-1', 
                  message.senderId === 'me' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400']">
                  <span class="text-xs">{{formatMessageTime(message.timestamp)}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-end space-x-3">
            <div class="relative">
              <button ref="mediaToggle" @click="showMediaOptions = !showMediaOptions" 
                      class="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all duration-200">
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
              
              <div v-if="showMediaOptions" ref="mediaMenu" class="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-700 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 py-2 min-w-[200px] z-50">
                <button @click="handleMediaAction('camera')" 
                        class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Cámara</span>
                </button>
                
                <button @click="handleMediaAction('emoji')" 
                        class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200">
                  <span class="text-lg">😊</span>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Emoji</span>
                </button>
                
                <button @click="handleMediaAction('gif')" 
                        class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200">
                  <span class="text-lg">🎬</span>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">GIF</span>
                </button>

                <button @click="handleMediaAction('gallery')"
                        class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4-4 4 4 4-4 4 4M4 8h16"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Galería</span>
                </button>
                
                <button @click="handleMediaAction('location')" 
                        class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200">
                  <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Ubicación</span>
                </button>
              </div>
            </div>
            
            <div class="flex-1 relative">
              <textarea v-model="newMessage" 
                        @keypress="handleKeyPress"
                        @input="autoResizeTextarea"
                        ref="messageInput"
                        placeholder="Escribe un mensaje..."
                        rows="1"
                        style="max-height: 120px;"
                        class="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 resize-none overflow-y-auto"></textarea>
            </div>
            
            <button v-if="newMessage.trim()" @click="sendMessage" 
                    class="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="showContactPicker" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Nuevo mensaje</h3>
            <button @click="showContactPicker = false" 
                    class="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-all duration-200">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="isLoadingContacts" class="text-sm text-gray-500 dark:text-gray-400 text-center py-6">Cargando contactos…</div>
            <div v-else-if="!phoneContacts || phoneContacts.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
              No hay contactos guardados. Abre la app Teléfono para añadirlos.
            </div>
            <div v-for="contact in phoneContacts" :key="contact.id" 
                 @click="selectContactForChat(contact)"
                 class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-all duration-200">
              <img :src="getAvatarUrl(contact.avatar)" :alt="contact.name" 
                   class="w-12 h-12 rounded-full object-cover">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 dark:text-white">{{contact.name}}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{contact.number}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showEmojiPicker" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Emojis</h3>
            <button @click="showEmojiPicker = false" 
                    class="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-all duration-200">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <button v-for="(category, key) in emojiData" :key="key"
                    @click="activeEmojiTab = key"
                    :class="[
                      'px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200',
                      activeEmojiTab === key 
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    ]">
              {{key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}}
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4">
            <div class="grid grid-cols-8 gap-2">
              <button v-for="emoji in emojiData[activeEmojiTab] || []" :key="emoji"
                      @click="addEmoji(emoji)"
                      class="w-10 h-10 text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center justify-center">
                {{emoji}}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showGifPicker" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">GIFs</h3>
            <button @click="showGifPicker = false" 
                    class="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-all duration-200">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <input v-model="gifSearchQuery" 
                   @input="handleGifSearch"
                   type="text" 
                   placeholder="Buscar GIFs..." 
                   class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400">
          </div>
          
          <div class="flex border-b border-gray-200 dark:border-gray-700">
            <button v-for="(category, key) in gifData" :key="key"
                    @click="activeGifTab = key"
                    :class="[
                      'px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200',
                      activeGifTab === key 
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    ]">
              {{key.charAt(0).toUpperCase() + key.slice(1)}}
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4">
            <div class="grid grid-cols-2 gap-3">
              <div v-for="gif in currentGifs" :key="gif.id"
                   @click="addGif(gif.url)"
                   class="relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md">
                <img :src="gif.url" :alt="gif.title" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showGalleryPicker" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Galería</h3>
            <button @click="showGalleryPicker = false" 
                    class="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-all duration-200">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="!galleryPhotos || galleryPhotos.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No hay fotos en la galería</div>
            <div v-else class="grid grid-cols-3 gap-2">
              <button v-for="p in galleryPhotos" :key="p.id"
                      @click="selectGalleryPhoto(p)"
                      class="relative group rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <img :src="p.url" alt="Foto" class="w-full h-24 object-cover group-hover:opacity-90 transition" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

  <div v-if="showCameraModal" class="absolute inset-0 z-50 bg-black flex flex-col">
        <div class="flex items-center justify-between p-4">
          <button @click="closeCameraModal" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm">Cerrar</button>
          <button @click="switchCamera" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm">Cambiar</button>
        </div>
        <div class="flex-1 flex items-center justify-center px-4">
          <div class="w-full max-w-[420px] aspect-[9/16] bg-black rounded-2xl overflow-hidden flex items-center justify-center my-6">
            <img 
              v-if="cameraPreviewUrl"
              :src="cameraPreviewUrl"
              :style="{ width: '100%', height: '100%', objectFit: 'cover', transform: cameraMode==='front' ? 'scaleX(-1)' : 'none', cursor: isDragging ? 'grabbing' : 'grab' }"
              class="select-none"
              @mousedown="startDrag"
              @touchstart="startDrag"
              draggable="false"
            />
            <div v-else class="text-white/70 text-sm">Iniciando cámara...</div>
          </div>
        </div>
        <div class="p-6 flex items-center justify-center">
          <button @click="takePhoto" :disabled="!cameraActive || isTakingPhoto" class="w-16 h-16 rounded-full bg-white disabled:bg-gray-400 shadow-xl active:scale-95 transition-transform"></button>
        </div>
      </div>
    </div>
  `

};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Messages;
} else if (typeof window !== 'undefined') {
  window.Messages = Messages;
}