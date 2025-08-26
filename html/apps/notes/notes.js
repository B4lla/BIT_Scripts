const Notes = {
  name: 'Notes',
  props: ["t", "userSettings"],
  emits: ["close"],
  setup(props, { emit }) {
    const { ref, computed, watch, nextTick, onMounted, onUnmounted } = Vue;

    const isComponentMounted = ref(true);
    const notes = ref([]);
    const currentNoteId = ref(null);
    const searchQuery = ref("");
    const isEditMode = ref(false);
    const openMenuNoteId = ref(null);
    const titleInput = ref(null);
    const editorDiv = ref(null);
    const isFormatPopupVisible = ref(false);
    const formatPopupStyle = ref({});
    const currentNote = computed(() => notes.value.find((n) => n.id === currentNoteId.value));
    const filteredNotes = computed(() => {
        notes.value.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        if (!searchQuery.value) return notes.value;
        const query = searchQuery.value.toLowerCase();
        return notes.value.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        );
    });

    const getNotePreview = (note) => {
      const strippedContent = note.content.replace(/<[^>]+>/g, ' ');
      return strippedContent.trim().split('\n')[0] || props.t('notes.emptyNote');
    }

    const formatDate = (date) => {
      const locale = props.t('meta.locale');
      const now = new Date();
      const noteDate = new Date(date);
      if (now.toDateString() === noteDate.toDateString()) {
        return noteDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      }
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (yesterday.toDateString() === noteDate.toDateString()) {
        return props.t('notes.yesterday');
      }
      return noteDate.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    
    const toggleMenu = (noteId) => {
        isFormatPopupVisible.value = false;
        openMenuNoteId.value = openMenuNoteId.value === noteId ? null : noteId;
    };

    const createNewNote = () => {
      const newNote = { id: Date.now(), title: "", content: "", lastModified: new Date() };
      notes.value.unshift(newNote);
      currentNoteId.value = newNote.id;
      isEditMode.value = false;
      openMenuNoteId.value = null;
    };

    const openNote = (noteId) => {
      if(isEditMode.value && openMenuNoteId.value !== noteId) return;
      currentNoteId.value = noteId;
      openMenuNoteId.value = null;
    };

    const deleteNote = (noteId) => {
      const index = notes.value.findIndex((n) => n.id === noteId);
      if (index > -1) {
        notes.value.splice(index, 1);
        fetch("https://bit-smartphone/deleteNote", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: noteId })
        }).catch(error => {
          console.error('[Notes] Error deleting note:', error);
        });
      }
      openMenuNoteId.value = null;
    };
    
    const saveNote = (note) => {
      console.log('[Notes] Saving note:', note);
      fetch("https://bit-smartphone/saveNote", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: note.id,
          title: note.title,
          content: note.content
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.id) {
          note.id = data.id;
        }
        note.lastModified = new Date().toISOString();
      })
      .catch(error => {
        console.error('[Notes] Error saving note:', error);
      });
    };

    const closeEditor = () => {
      isFormatPopupVisible.value = false;
      if (currentNote.value && !currentNote.value.title.trim() && !currentNote.value.content.trim()) {
        deleteNote(currentNote.value.id);
      } else if (currentNote.value) {
        saveNote(currentNote.value);
      }
      currentNoteId.value = null;
    };

    const toggleEditMode = () => {
      isEditMode.value = !isEditMode.value;
      openMenuNoteId.value = null;
    };
    
    const closeAllPopups = () => {
        openMenuNoteId.value = null;
    };

    const handleContentInput = (e) => {
        if (currentNote.value) {
            currentNote.value.content = e.target.innerHTML;
        }
    };
    
    const handleSelection = () => {
        if (!editorDiv.value) { return; }
        
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) {
             isFormatPopupVisible.value = false;
             return;
        }

        const range = selection.getRangeAt(0);
        const isInsideEditor = editorDiv.value.contains(range.commonAncestorContainer);

        if (selection.isCollapsed || !isInsideEditor) {
            isFormatPopupVisible.value = false;
            return;
        }
        
        const selectionRect = range.getBoundingClientRect();
        const containerRect = editorDiv.value.parentElement.getBoundingClientRect();

        const POPUP_WIDTH = 136;
        const PADDING = 10;

        let top = selectionRect.top - containerRect.top - 55;
        let left = selectionRect.left - containerRect.left + selectionRect.width / 2;

        if (left - POPUP_WIDTH / 2 < PADDING) {
            left = POPUP_WIDTH / 2 + PADDING;
        }
        if (left + POPUP_WIDTH / 2 > containerRect.width - PADDING) {
            left = containerRect.width - POPUP_WIDTH / 2 - PADDING;
        }

        formatPopupStyle.value = { top: `${top}px`, left: `${left}px` };
        isFormatPopupVisible.value = true;
    };

    const formatText = (command) => {
        document.execCommand(command, false, null);
        editorDiv.value.focus();
        isFormatPopupVisible.value = false;
    };

    watch(currentNoteId, (newId) => {
        if (newId) {
            isFormatPopupVisible.value = false;
            nextTick(() => { titleInput.value?.focus(); });
        }
    });

  onMounted(() => {
    document.addEventListener('selectionchange', handleSelection);
    // Cargar notas desde el servidor y actualizar notes.value
    fetch("https://bit-smartphone/getNotes", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    .then(res => res.json())
    .then(data => {
      if (data.action === 'notesList' && Array.isArray(data.notes)) {
        notes.value = data.notes.map(n => ({
          id: n.id,
          title: n.title,
          content: n.note,
          lastModified: n.last_edited
        }));
      }
    })
    .catch(error => console.error('[Notes] Error fetching notes:', error));
  });

  onUnmounted(() => {
    document.removeEventListener('selectionchange', handleSelection);
  });

  // Ya no se usan fetchNotesFromServer ni handleNuiNotesResponse

    // Component lifecycle cleanup
    onUnmounted(() => {
      isComponentMounted.value = false;
    });

    return {
      isComponentMounted,
      currentNote, currentNoteId, notes, filteredNotes, searchQuery, isEditMode, titleInput, openMenuNoteId, editorDiv, isFormatPopupVisible, formatPopupStyle,
      openNote, createNewNote, deleteNote, closeEditor, getNotePreview, formatDate, toggleEditMode, toggleMenu, closeAllPopups, handleContentInput, formatText
    };
  },
  template: `
  <div class="h-full flex flex-col font-sans" @click="closeAllPopups"
       :class="userSettings.darkMode ? 'bg-black text-white' : 'bg-gray-100 text-black'">
    <div class="relative w-full h-full overflow-hidden">
      <transition name="slide" mode="out-in">
        <div v-if="!currentNoteId" key="list" class="absolute inset-0 flex flex-col bg-inherit">
            <header class="p-4 pt-12 shrink-0 flex justify-between items-center">
                <button @click="toggleEditMode" class="text-yellow-500 font-semibold text-lg px-2 py-1 active:opacity-70 transition-colors">
                {{ isEditMode ? t('common.done') : 'Editar' }}
                </button>
                <div class="flex items-center space-x-3">
                  <button @click="createNewNote" class="text-yellow-500 active:opacity-70">
                    <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                  <button @click="$emit('close')" class="text-gray-500 active:opacity-70">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
            </header>
          
            <main class="flex-1 flex flex-col overflow-y-hidden">
                <h1 class="text-4xl font-bold px-5 mb-2" :class="userSettings.darkMode ? 'text-white' : 'text-black'">{{ t('notes.title') }}</h1>
                <div class="px-4 mt-2 mb-4">
                  <div class="relative">
                     <svg class="w-5 h-5 absolute top-1/2 left-3 -translate-y-1/2" :class="userSettings.darkMode ? 'text-gray-500' : 'text-gray-400'" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
                     <input v-model="searchQuery" type="search" :placeholder="t('notes.searchPlaceholder')" 
                         class="w-full text-base pl-10 pr-4 py-2 rounded-lg focus:outline-none"
                         :class="userSettings.darkMode ? 'bg-zinc-800 text-white placeholder-gray-500' : 'bg-gray-200 text-black placeholder-gray-500'">
                  </div>
                </div>
                
                <div class="flex-grow overflow-y-auto px-4 pb-24">
                    <transition-group name="list" tag="div">
                      <div v-for="note in filteredNotes" :key="note.id" 
                           class="relative mb-2 transition-all duration-300"
                           :class="{ 'z-30': openMenuNoteId === note.id }">
                        
                        <div class="flex items-center w-full rounded-2xl border transition-all duration-300"
                             :class="userSettings.darkMode ? 'bg-zinc-800/70 border-white/20 backdrop-blur-xl' : 'bg-white/60 border-black/10 backdrop-blur-xl'">

                            <div v-if="isEditMode" class="pl-3">
                                <button @click="deleteNote(note.id)" class="text-red-500 active:scale-125 transition-transform">
                                  <svg class="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                  </svg>
                                </button>
                            </div>
                            
                            <div @click="openNote(note.id)" class="flex-grow p-4 min-w-0" :class="isEditMode ? '' : 'cursor-pointer'">
                                <p class="font-semibold truncate text-base" :class="userSettings.darkMode ? 'text-gray-100' : 'text-gray-900'">
                                  {{ note.title || t('notes.newNote') }}
                                </p>
                                <p class="text-sm mt-1 truncate" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-600'">
                                  {{ getNotePreview(note) }}
                                </p>
                            </div>
                            
                            <div v-if="!isEditMode" class="flex-shrink-0 pr-2">
                               <button @click.stop="toggleMenu(note.id)" class="p-2 rounded-full text-gray-500 hover:bg-white/10 active:scale-110 transition-all">
                                 <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                                 </svg>
                               </button>
                            </div>
                        </div>

                        <transition name="fade-in-fast">
                          <div v-if="openMenuNoteId === note.id" 
                               class="absolute top-full mt-1 right-2 w-56 rounded-xl shadow-lg overflow-hidden z-40 border"
                               :class="userSettings.darkMode ? 'bg-zinc-800/80 border-white/20 backdrop-blur-xl' : 'bg-white/80 border-black/10 backdrop-blur-xl'">
                            <div class="flex flex-col text-sm" :class="userSettings.darkMode ? 'text-white' : 'text-black'">
                              <button @click.stop="openNote(note.id)" class="px-4 py-3 text-left hover:bg-white/20 dark:hover:bg-white/10 transition-colors">Abrir Nota</button>
                              <hr :class="userSettings.darkMode ? 'border-white/10' : 'border-black/10'"/>
                              <button @click.stop="deleteNote(note.id)" class="px-4 py-3 text-left text-red-500 hover:bg-red-500/20 transition-colors">Eliminar Nota</button>
                              <hr :class="userSettings.darkMode ? 'border-white/10' : 'border-black/10'"/>
                              <div class="px-4 py-3 text-xs" :class="userSettings.darkMode ? 'text-gray-400' : 'text-gray-500'">
                                <p class="font-bold">Última edición</p>
                                <p>{{ formatDate(note.lastModified) }}</p>
                              </div>
                            </div>
                          </div>
                        </transition>
                      </div>
                    </transition-group>
                </div>
            </main>
        </div>

        <div v-else key="editor" class="absolute inset-0 flex flex-col bg-inherit">
            <header class="p-4 pt-12 shrink-0 flex justify-between items-center z-20">
              <button @click="closeEditor" class="flex items-center active:opacity-70 text-yellow-500">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
                <span class="ml-1 font-semibold text-base">{{ t('notes.title') }}</span>
              </button>
              <div class="flex items-center space-x-3">
                <button @click="closeEditor" class="font-bold text-yellow-500 active:opacity-70">{{ t('common.done') }}</button>
                <button @click="$emit('close')" class="text-gray-500 active:opacity-70">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </header>
            <main class="relative flex-1 overflow-y-auto px-6 pb-4 flex flex-col" @scroll="isFormatPopupVisible = false">
              <input type="text" ref="titleInput" v-model="currentNote.title" 
                     :placeholder="t('notes.newNote')"
                     class="w-full bg-transparent text-3xl font-bold focus:outline-none mb-4"
                     :class="userSettings.darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'"/>
              
              <div ref="editorDiv" contenteditable="true" v-html="currentNote.content"
                   @input="handleContentInput"
                   data-placeholder="Empieza a escribir..."
                   class="w-full h-full flex-1 bg-transparent text-lg leading-relaxed focus:outline-none resize-none"
                   :class="userSettings.darkMode ? 'text-gray-100' : 'text-gray-800'">
              </div>
              
              <transition name="fade-in-fast">
                  <div v-if="isFormatPopupVisible" :style="formatPopupStyle" class="format-popup-container">
                    <div class="format-popup-content">
                        <button @mousedown.prevent="formatText('bold')" title="Negrita">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.674zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.908z"/>
                            </svg>
                        </button>
                        <button @mousedown.prevent="formatText('italic')" title="Cursiva">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.521h3.774l.11-.521c-1.06-.095-1.129-.211-1.006-.806z"/>
                            </svg>
                        </button>
                        <button @mousedown.prevent="formatText('underline')" title="Subrayado">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57V3.136zM12.5 15h-9v-1h9v1z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="popup-arrow"></div>
                  </div>
              </transition>
            </main>
        </div>
      </transition>
    </div>
  </div>
`,
};