const icons = {
	ArrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
	Search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
	Plus: '<path d="M12 5v14M5 12h14"/>',
	X: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
	ChevronRight: '<polyline points="9,18 15,12 9,6"/>',
	Phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
	Video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
	MoreVertical: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
	Send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
	Mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
	Camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
	MapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
	Smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
	Users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
	Pin: '<path d="M9 9l3 3m0 0l3-3m-3 3V2.5a2.5 2.5 0 0 1 2.5-2.5h2a2.5 2.5 0 0 1 2.5 2.5V9"/>',
	Clock: '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
	Check: '<polyline points="20,6 9,17 4,12"/>',
	CheckCheck: '<path d="M9 12l2 2 4-4"/><path d="M21 12c.5 0 .9-.4.9-1s-.4-1-.9-1h-1c-.5 0-.9.4-.9 1s.4 1 .9 1h1z"/>',
	Bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
	Moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
	Sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
	Trash2: '<polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
	Play: '<polygon points="5 3 19 12 5 21 5 3"/>',
};

const Icon = {
	props: ["name", "size"],
	computed: {
		iconPath() {
			return icons[this.name] || "";
		},
		classList() {
			const size = this.size || "5";
			return `w-${size} h-${size}`;
		},
	},
	template: `
    <svg :class="classList" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <g v-html="iconPath"></g>
    </svg>
  `,
	data: () => ({ icons }),
};

const Messages = {
	name: "Messages",
	components: { Icon },
	props: { t: { type: Function, default: () => (key) => key } },
	emits: ["close", "call", "video-call", "open-camera", "request-location"],
	data() {
		return {
			currentView: "chats",
			selectedChat: null,
			searchQuery: "",
			newMessage: "",
			isDarkMode: false,
			showMediaOptions: false,
			showEmojiPicker: false,
			showGifPicker: false,
			showContactPicker: false,
			showChatMenu: null,
			showMessageActions: null,
			isRecording: false,
			recordingTime: 0,
			recordingInterval: null,
			activeEmojiTab: "recent",
			activeGifTab: "trending",
			isLoading: false,
			chats: [],
			contacts: [],
			phoneContacts: [],
			emojiCategories: {
				recent: ["😊", "😂", "❤️", "👍", "🎉", "✨", "🔥", "💯"],
				smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑"],
				people: ["🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯"],
				animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆"],
				hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
				gestures: ["👍", "👎", "👌", "🤌", "✌️", "🤞", "🤟", "🤘", "👋", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✊", "👊", "🤛", "🤜", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖"],
				objects: ["📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "💾", "💿", "📀", "📹", "📷", "📸", "📞", "☎️", "📟", "📠", "📺", "📻", "🎵", "🎶", "🎤", "🎧", "📢", "📣", "🔔", "🔕"],
				activities: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋"],
			},
			gifCategories: {
				trending: [
					{ id: 1, url: "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif", keywords: ["thumbs up", "good", "approval"] },
					{ id: 2, url: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif", keywords: ["dance", "happy", "celebration"] },
					{ id: 3, url: "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif", keywords: ["wave", "hello", "hi"] },
					{ id: 4, url: "https://media.giphy.com/media/l1J9FiGxR61OcF2mI/giphy.gif", keywords: ["love", "heart", "kiss"] },
					{ id: 5, url: "https://media.giphy.com/media/3oz8xZvvOZRmEay4De/giphy.gif", keywords: ["laugh", "funny", "lol"] },
				],
				reactions: [
					{ id: 6, url: "https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif", keywords: ["shocked", "surprise", "wow"] },
					{ id: 7, url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif", keywords: ["facepalm", "disappointed"] },
					{ id: 8, url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif", keywords: ["applause", "clap"] },
					{ id: 9, url: "https://media.giphy.com/media/l1J9EdzfOSgfyueLm/giphy.gif", keywords: ["crying", "sad"] },
					{ id: 10, url: "https://media.giphy.com/media/l3q2XhfQ8oCkm1Ts4/giphy.gif", keywords: ["excited", "happy"] },
				],
				animals: [
					{ id: 11, url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif", keywords: ["cat", "cute"] },
					{ id: 12, url: "https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif", keywords: ["dog", "puppy"] },
					{ id: 13, url: "https://media.giphy.com/media/3o7aCRloybJlXpNjSU/giphy.gif", keywords: ["panda", "cute"] },
				],
			},
		};
	},
	computed: {
		filteredChats() {
			if (!this.searchQuery) return this.chats;
			return this.chats.filter((chat) => chat.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
		},

		pinnedChats() {
			return this.filteredChats.filter((chat) => chat.pinned);
		},

		regularChats() {
			return this.filteredChats.filter((chat) => !chat.pinned);
		},

		totalUnread() {
			return this.chats.reduce((total, chat) => total + (chat.unread || 0), 0);
		},
	},
	methods: {
		async loadChats() {
			this.isLoading = true;
			try {
				await fetch("https://bit-smartphone/messages:getChats", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});
			} catch (error) {
				console.error("Error loading chats:", error);
			} finally {
				this.isLoading = false;
			}
		},

		async loadContacts() {
			try {
				await fetch("https://bit-smartphone/loadContactsMessages", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});
			} catch (error) {
				console.error("Error loading contacts:", error);
			}
		},

		async loadPhoneContacts() {
			try {
				await fetch("https://bit-smartphone/messages:getContacts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});
			} catch (error) {
				console.error("Error loading phone contacts:", error);
			}
		},

		showNewChatModal() {
			this.showContactPicker = true;
			this.loadPhoneContacts();
		},

		selectContactForChat(contact) {
			const existingChat = this.chats.find((chat) => chat.phoneNumber === contact.number);
			if (existingChat) {
				this.openChat(existingChat);
			} else {
				const newChat = {
					id: "temp_" + Date.now(),
					name: contact.name,
					avatar: contact.avatar || "./assets/avatars/default.png",
					contactId: contact.number,
					phoneNumber: contact.number,
					lastMessage: "",
					timestamp: Date.now(),
					unread: 0,
					messages: [],
					status: "offline",
				};
				this.chats.unshift(newChat);
				this.openChat(newChat);
			}
			this.showContactPicker = false;
		},

		async openChat(chat) {
			this.selectedChat = chat;
			this.currentView = "chat";
			this.isLoading = true;

			try {
				await fetch("https://bit-smartphone/messages:openChat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						chatId: chat.phoneNumber || chat.contactId || chat.id,
					}),
				});

				await fetch("https://bit-smartphone/markAsRead", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ chatId: chat.id }),
				});

				chat.unread = 0;
			} catch (error) {
				console.error("Error opening chat:", error);
			} finally {
				this.isLoading = false;
			}

			this.$nextTick(() => {
				this.scrollToBottom();
			});
		},

		async sendMessage() {
			if (!this.newMessage.trim() || !this.selectedChat) return;

			const messageContent = this.newMessage.trim();
			const targetPhoneNumber = this.selectedChat.phoneNumber || this.selectedChat.contactId;
			this.newMessage = "";

			try {
				await fetch("https://bit-smartphone/messages:sendMessage", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						chatId: targetPhoneNumber,
						type: "text",
						content: messageContent,
					}),
				});
			} catch (error) {
				console.error("Error sending message:", error);
				this.newMessage = messageContent;
			}
		},

		async addReaction(message, emoji) {
			if (!message || !emoji) return;

			try {
				await fetch("https://bit-smartphone/reactToMessage", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						messageId: message.id,
						emoji: emoji,
					}),
				});
			} catch (error) {
				console.error("Error adding reaction:", error);
			}
		},

		async pinChat(chat) {
			if (!chat) return;

			try {
				await fetch("https://bit-smartphone/togglePin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ chatId: chat.id }),
				});
			} catch (error) {
				console.error("Error toggling pin:", error);
			}
		},

		async muteChat(chat) {
			if (!chat) return;

			try {
				await fetch("https://bit-smartphone/toggleMute", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ chatId: chat.id }),
				});
			} catch (error) {
				console.error("Error toggling mute:", error);
			}
		},

		async deleteChat(chat) {
			if (!chat) return;

			try {
				await fetch("https://bit-smartphone/deleteChat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ chatId: chat.id }),
				});
			} catch (error) {
				console.error("Error deleting chat:", error);
			}
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
				minute: "2-digit",
			});
		},

		goBack() {
			this.currentView = "chats";
			this.selectedChat = null;
			this.showMessageActions = null;
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

		startVoiceRecording() {
			this.isRecording = true;
			this.recordingTime = 0;
			this.recordingInterval = setInterval(() => {
				this.recordingTime++;
			}, 1000);
		},

		stopVoiceRecording() {
			this.isRecording = false;
			if (this.recordingInterval) {
				clearInterval(this.recordingInterval);
			}

			this.recordingTime = 0;
		},

		cancelVoiceRecording() {
			this.isRecording = false;
			this.recordingTime = 0;
			if (this.recordingInterval) {
				clearInterval(this.recordingInterval);
			}
		},

		handleMediaAction(action) {
			this.showMediaOptions = false;

			if (!this.selectedChat) return;

			switch (action) {
				case "camera":
					this.$emit("open-camera");
					break;
				case "location":
					this.$emit("request-location");
					break;
			}
		},

		addEmoji(emoji) {
			this.newMessage += emoji;
			this.showEmojiPicker = false;

			const recentEmojis = this.emojiCategories.recent;
			if (!recentEmojis.includes(emoji)) {
				recentEmojis.unshift(emoji);
				if (recentEmojis.length > 24) {
					recentEmojis.pop();
				}
			}
		},

		addGif(gif) {
			if (!this.selectedChat) return;

			const targetPhoneNumber = this.selectedChat.phoneNumber || this.selectedChat.contactId;

			fetch("https://bit-smartphone/messages:sendMessage", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					chatId: targetPhoneNumber,
					type: "gif",
					content: gif.url,
				}),
			}).catch((error) => {
				console.error("Error sending GIF:", error);
			});

			this.showGifPicker = false;
		},

		searchGifs(query) {
			if (!query) return this.gifCategories.trending;

			const allGifs = Object.values(this.gifCategories).flat();
			return allGifs.filter((gif) => gif.keywords.some((keyword) => keyword.toLowerCase().includes(query.toLowerCase())));
		},

		toggleDarkMode() {
			this.isDarkMode = !this.isDarkMode;
			document.documentElement.classList.toggle("dark", this.isDarkMode);
		},

		handleNUIMessage(event) {
			const data = event.data;
			switch (data.action) {
				case "updateChats":
					this.chats = data.data || [];
					break;

				case "updateChatMessages":
					if (this.selectedChat) {
						this.selectedChat.messages = data.data || [];
						this.$nextTick(() => this.scrollToBottom());
					}
					break;

				case "receiveNewMessage":
					const { chatId, message } = data.data;

					let chatIndex = this.chats.findIndex((c) => c.contactId === chatId || c.phoneNumber === chatId || c.id === chatId);

					if (chatIndex !== -1) {
						this.chats[chatIndex].lastMessage = message.content;
						this.chats[chatIndex].timestamp = message.timestamp;
						if (message.senderId !== "me") {
							this.chats[chatIndex].unread = (this.chats[chatIndex].unread || 0) + 1;
						}
					}

					if (this.selectedChat && (this.selectedChat.contactId === chatId || this.selectedChat.phoneNumber === chatId || this.selectedChat.id === chatId)) {
						if (!this.selectedChat.messages) this.selectedChat.messages = [];
						this.selectedChat.messages.push(message);
						this.$nextTick(() => {
							this.scrollToBottom();
						});
					}
					break;

				case "updateContacts":
					this.contacts = data.data || [];
					this.phoneContacts = data.data || [];
					break;

				case "updatePhoneContacts":
					this.phoneContacts = data.data || [];
					break;

				case "updateMessageStatus":
					const { chatId: updateChatId, tempId, newMessage } = data.data;

					if (this.selectedChat && (this.selectedChat.contactId === updateChatId || this.selectedChat.phoneNumber === updateChatId || this.selectedChat.id === updateChatId)) {
						const msgIndex = this.selectedChat.messages.findIndex((m) => m.id === tempId);
						if (msgIndex !== -1) {
							this.selectedChat.messages[msgIndex] = newMessage;
						}
					}
					break;

				case "messageError":
					const { chatId: errorChatId, tempId: errorTempId, error } = data.data;

					if (this.selectedChat && (this.selectedChat.contactId === errorChatId || this.selectedChat.phoneNumber === errorChatId || this.selectedChat.id === errorChatId)) {
						const msgIndex = this.selectedChat.messages.findIndex((m) => m.id === errorTempId);
						if (msgIndex !== -1) {
							this.selectedChat.messages[msgIndex].status = "error";
						}
					}
					break;

				case "chatPinToggled":
					const pinnedChatIndex = this.chats.findIndex((c) => c.id === data.data.chatId);
					if (pinnedChatIndex !== -1) {
						this.chats[pinnedChatIndex].pinned = !this.chats[pinnedChatIndex].pinned;
					}
					break;

				case "chatMuteToggled":
					const mutedChatIndex = this.chats.findIndex((c) => c.id === data.data.chatId);
					if (mutedChatIndex !== -1) {
						this.chats[mutedChatIndex].muted = !this.chats[mutedChatIndex].muted;
					}
					break;

				case "chatDeleted":
					const deletedChatIndex = this.chats.findIndex((c) => c.id === data.data.chatId);
					if (deletedChatIndex !== -1) {
						this.chats.splice(deletedChatIndex, 1);
					}
					if (this.selectedChat && this.selectedChat.id === data.data.chatId) {
						this.goBack();
					}
					break;
			}
		},

		startCall(contact) {
			if (!contact || !contact.id) return;

			fetch("https://bit-smartphone/call:start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					targetId: contact.id || contact.contactId,
					type: "audio",
				}),
			}).catch((error) => {
				console.error("Error making call:", error);
			});
		},

		startVideoCall(contact) {
			if (!contact || !contact.id) return;

			fetch("https://bit-smartphone/call:start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					targetId: contact.id || contact.contactId,
					type: "video",
				}),
			}).catch((error) => {
				console.error("Error making video call:", error);
			});
		},
	},

	mounted() {
		if (localStorage.getItem("darkMode") === "true") {
			this.isDarkMode = true;
			document.documentElement.classList.add("dark");
		}

		this.loadChats();
		this.loadContacts();
		this.loadPhoneContacts();

		window.__bit_dispatch = this.handleNUIMessage;
		window.addEventListener("message", this.handleNUIMessage);
	},

	beforeUnmount() {
		if (this.recordingInterval) {
			clearInterval(this.recordingInterval);
		}

		window.removeEventListener("message", this.handleNUIMessage);
	},

	template: `
    <div class="h-full pt-12 w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-gray-900 dark:to-indigo-950 font-sans relative overflow-hidden">
            <div class="absolute inset-0 opacity-30 dark:opacity-10">
        <svg class="absolute top-0 left-0 w-full h-full" viewBox="0 0 400 400" fill="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="0.5" class="text-blue-200 dark:text-slate-600"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>
      
            <div v-if="currentView === 'chats'" class="h-full flex flex-col">
                <div class="flex-shrink-0 relative">
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 dark:from-slate-800/90 dark:via-slate-700/90 dark:to-slate-600/90 backdrop-blur-xl border-b border-white/20 dark:border-slate-600/50"></div>
          
                    <div class="relative px-6 py-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg group-hover:scale-105 transition-transform duration-200">
                  <svg class="w-7 h-7 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-white drop-shadow-sm tracking-tight">Mensajes</h1>
                  <div class="flex items-center space-x-2">
                    <div v-if="totalUnread > 0" class="flex items-center space-x-1">
                      <div class="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      <p class="text-sm text-blue-100 font-medium">{{totalUnread}} sin leer</p>
                    </div>
                    <div v-else class="flex items-center space-x-1">
                      <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <p class="text-sm text-blue-100 font-medium">Todo al día</p>
                    </div>
                  </div>
                </div>
              </div>
              
                            <button @click="showNewChatModal" 
                      class="group w-12 h-12 bg-white/20 hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                <svg class="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

                <div class="flex-shrink-0 p-6 relative">
          <div class="relative group">
                        <div class="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <svg class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            
                        <input v-model="searchQuery" 
                   type="text" 
                   placeholder="Buscar conversaciones, contactos..." 
                   class="w-full pl-12 pr-6 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-600/50 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-700/90 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg">
            
                        <button v-if="searchQuery" @click="searchQuery = ''" 
                    class="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-300 dark:bg-slate-600 rounded-full flex items-center justify-center hover:bg-gray-400 dark:hover:bg-slate-500 transition-colors duration-200">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

                <div class="flex-1 overflow-y-auto">
          <div v-if="isLoading" class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
          </div>
          
          <div v-else-if="filteredChats.length === 0" class="flex flex-col items-center justify-center py-20 px-6">
                        <div class="relative">
                            <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-32 h-32 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full animate-pulse"></div>
              </div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-24 h-24 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 rounded-full animate-pulse" style="animation-delay: 0.5s"></div>
              </div>
              
                            <div class="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
                <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                
                                <div class="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                <div class="absolute -bottom-2 -left-2 w-3 h-3 bg-green-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
              </div>
            </div>
            
            <div class="text-center space-y-4">
              <h3 class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">¡Comienza a conversar!</h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">No tienes conversaciones aún. Inicia una nueva conversación tocando el botón + en la parte superior.</p>
              
                            <div class="mt-8 space-y-3">
                <div class="flex items-center justify-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl backdrop-blur-sm border border-blue-100 dark:border-slate-600/50">
                  <div class="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </div>
                  <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">Crear nueva conversación</span>
                </div>
                
                <div class="flex items-center justify-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl backdrop-blur-sm border border-green-100 dark:border-slate-600/50">
                  <div class="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">Buscar contactos</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="px-4 pb-4">
                        <div v-if="pinnedChats.length > 0" class="mb-6">
              <div class="px-4 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center space-x-2">
                <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span>Fijados</span>
              </div>
              <div v-for="chat in pinnedChats" :key="'pinned-' + chat.id" @click="openChat(chat)"
                   class="group relative p-5 mb-3 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900/30 dark:via-blue-900/30 dark:to-cyan-900/30 rounded-3xl hover:from-indigo-100 hover:via-blue-100 hover:to-cyan-100 dark:hover:from-indigo-800/40 dark:hover:via-blue-800/40 dark:hover:to-cyan-800/40 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-400/20 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-600/30">
                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-3xl"></div>
                
                <div class="relative flex items-center space-x-4">
                  <div class="relative flex-shrink-0">
                    <div class="absolute inset-0 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-3xl blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                    <img :src="chat.avatar" :alt="chat.name" class="relative w-18 h-18 rounded-3xl object-cover ring-2 ring-white/50 dark:ring-slate-600/50 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div v-if="chat.status === 'online'" class="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 border-3 border-white dark:border-slate-800 rounded-full shadow-lg flex items-center justify-center">
                      <div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center space-x-3">
                        <h3 class="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent truncate">{{chat.name}}</h3>
                        <div class="flex items-center space-x-1">
                          <svg class="w-5 h-5 text-yellow-500 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          <span class="text-xs bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent font-bold">FIJADO</span>
                        </div>
                      </div>
                      <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold bg-white/60 dark:bg-slate-700/60 px-2 py-1 rounded-lg backdrop-blur-sm">{{formatTime(chat.timestamp)}}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 font-medium">{{chat.lastMessage || 'Sin mensajes'}}</p>
                      <span v-if="chat.unread > 0" class="ml-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full min-w-[1.75rem] h-7 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">{{chat.unread}}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
                        <div v-if="regularChats.length > 0">
              <div v-if="pinnedChats.length > 0" class="px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3 flex items-center space-x-2">
                <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                </svg>
                <span>Recientes</span>
              </div>
              <div v-for="chat in regularChats" :key="chat.id" @click="openChat(chat)"
                   class="group relative p-4 mb-3 bg-white/80 dark:bg-slate-800/80 rounded-2xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg hover:shadow-gray-500/10 dark:hover:shadow-gray-900/20 backdrop-blur-md border border-gray-200/50 dark:border-slate-600/50 hover:border-gray-300/60 dark:hover:border-slate-500/60">
                                <div class="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-indigo-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                
                <div class="relative flex items-center space-x-4">
                  <div class="relative flex-shrink-0">
                    <div class="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-500 dark:from-slate-600 dark:to-slate-700 rounded-2xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                    <img :src="chat.avatar" :alt="chat.name" class="relative w-14 h-14 rounded-2xl object-cover ring-1 ring-gray-200 dark:ring-slate-600 shadow-md group-hover:shadow-lg transition-all duration-300" style="max-width:3.5rem; max-height:3.5rem;">
                    <div v-if="chat.status === 'online'" class="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-md flex items-center justify-center">
                      <div class="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                    </div>
                    <div v-else-if="chat.status === 'away'" class="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 border-2 border-white dark:border-slate-800 rounded-full shadow-md"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1.5">
                      <h3 class="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">{{chat.name}}</h3>
                      <span class="text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100/60 dark:bg-slate-700/60 px-2 py-1 rounded-lg backdrop-blur-sm group-hover:bg-gray-200/80 dark:group-hover:bg-slate-600/80 transition-all duration-200">{{formatTime(chat.timestamp)}}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-sm text-gray-600 dark:text-gray-300 truncate flex-1 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200">{{chat.lastMessage || 'Sin mensajes'}}</p>
                      <span v-if="chat.unread > 0" class="ml-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full min-w-[1.5rem] h-6 flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300 transform group-hover:scale-110">{{chat.unread}}</span>
                    </div>
                  </div>
                </div>
                
                                <div v-if="chat.isTyping" class="mt-3 flex items-center space-x-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <div class="flex space-x-1">
                    <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                    <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                  </div>
                  <span>{{chat.name}} está escribiendo...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

            <div v-if="currentView === 'chat'" class="h-full flex flex-col">
                <div class="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-slate-800 dark:to-slate-700 px-4 py-3 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button @click="goBack" class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div class="relative">
                <img :src="selectedChat?.avatar" :alt="selectedChat?.name" class="w-12 h-12 rounded-xl object-cover">
                <div v-if="selectedChat?.status === 'online'" class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white truncate">{{selectedChat?.name}}</h3>
                <p class="text-sm text-blue-100">{{selectedChat?.status === 'online' ? 'En línea' : 'Desconectado'}}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="startCall(selectedChat)" class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </button>
              <button @click="startVideoCall(selectedChat)" class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

                <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div v-for="message in selectedChat?.messages || []" :key="message.id" 
               :class="['flex', message.senderId === 'me' ? 'justify-end' : 'justify-start']">
            <div :class="[
              'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm',
              message.senderId === 'me' 
                ? 'bg-blue-500 text-white rounded-br-md' 
                : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-slate-600'
            ]">
              <p class="text-sm leading-relaxed">{{message.content}}</p>
              <div :class="['flex items-center justify-end mt-2 space-x-1', message.senderId === 'me' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400']">
                <span class="text-xs">{{formatMessageTime(message.timestamp)}}</span>
                <div v-if="message.senderId === 'me'" class="flex space-x-1">
                  <svg v-if="message.status === 'sent'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <svg v-else-if="message.status === 'received'" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

                <div class="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4">
          <div class="flex items-end space-x-3">
                        <div class="relative">
              <button @click="showMediaOptions = !showMediaOptions" 
                      class="w-10 h-10 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl flex items-center justify-center transition-all duration-200">
                <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
              
                            <div v-if="showMediaOptions" class="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-700 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-600 py-2 min-w-[200px] z-50">
                <button @click="handleMediaAction('camera')" class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-200">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Cámara</span>
                </button>
                <button @click="showGifPicker = true; showMediaOptions = false" class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-200">
                  <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 110 2h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6H4a1 1 0 110-2h3zM9 6v10h6V6H9z"/>
                  </svg>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">GIF</span>
                </button>
                <button @click="showEmojiPicker = true; showMediaOptions = false" class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-200">
                  <span class="text-lg">😊</span>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Emoji</span>
                </button>
                <button @click="handleMediaAction('location')" class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-200">
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
                        placeholder="Escribe un mensaje..."
                        rows="1"
                        class="w-full px-4 py-3 bg-gray-100 dark:bg-slate-700 border-0 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 resize-none"></textarea>
            </div>
            
                        <button v-if="newMessage.trim()" @click="sendMessage" 
                    class="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

            <div v-if="showContactPicker" class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Nuevo mensaje</h3>
            <button @click="showContactPicker = false" class="w-8 h-8 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full flex items-center justify-center transition-all duration-200">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <div v-for="contact in phoneContacts" :key="contact.id" @click="selectContactForChat(contact)"
                 class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-all duration-200">
              <img :src="contact.avatar || './assets/avatars/default.png'" :alt="contact.name" class="w-12 h-12 rounded-full object-cover">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900 dark:text-white">{{contact.name}}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{contact.number}}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
     </div>
  `,
};

window.Messages = window.Messages || Messages;
