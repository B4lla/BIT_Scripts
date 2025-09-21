const Music = {
  name: 'Music',
  props: {
    musicState: { type: Object, required: false },
    userSettings: { type: Object, required: true },
    t: { type: Function, required: true }
  },
  emits: ["close", "play-track", "pause-music", "resume-music", "stop-music", "set-music-progress", "set-music-volume", "set-playlist"],
  setup(props, { emit }) {
    const { ref, computed, onMounted, onUnmounted } = Vue;

    
    const activeTab = ref('home');
    const currentPlaylist = ref(null);
    const shuffle = ref(false);
    const repeat = ref(0); 
    const searchQuery = ref('');
    const showSettings = ref(false);
    const showCreatePlaylist = ref(false);
    const showAddSong = ref(false);
    const newPlaylistName = ref('');
    const newPlaylistDescription = ref('');
    const newPlaylistCover = ref('');
    const loading = ref(false);
    const showPlaylistMenu = ref(null);
    const isLoadingYouTube = ref(false);
    const youtubeError = ref('');

    
    const localState = {
      currentSong: ref(null),
      isPlaying: ref(false),
      progress: ref(0),
      currentTime: ref(0),
      volume: ref(50),
    };

    
    const currentSong = computed({
      get: () => props.musicState ? props.musicState.track : localState.currentSong.value,
      set: v => {
        if (props.musicState) emit('play-track', v);
        else localState.currentSong.value = v;
      }
    });
    const isPlaying = computed({
      get: () => props.musicState ? props.musicState.isPlaying : localState.isPlaying.value,
      set: v => {
        if (props.musicState) v ? emit('resume-music') : emit('pause-music');
        else localState.isPlaying.value = v;
      }
    });
    const progress = computed({
      get: () => props.musicState ? props.musicState.progress : localState.progress.value,
      set: v => {
        if (props.musicState) emit('set-music-progress', v);
        else localState.progress.value = v;
      }
    });
    const volume = computed({
      get: () => props.musicState ? props.musicState.volume : localState.volume.value,
      set: v => {
        if (props.musicState) emit('set-music-volume', v);
        else localState.volume.value = v;
      }
    });
    const currentTime = computed(() => {
      if (props.musicState) {
        const progressPercent = props.musicState.progress || 0;
        const duration = props.musicState.duration || 0;
        return (progressPercent / 100) * duration;
      }
      return localState.currentTime.value;
    });

    
    const songs = ref([]);
    const playlists = ref([]);
    const favorites = ref([]);
    const recentlyPlayed = ref([]);
    const playlistSongs = ref({});

    
    const newSongData = ref({
      youtubeUrl: '',
      title: '',
      artist: '',
      album: '',
      duration: '',
      file_url: '',
      cover_image: '',
      genre: '',
      year: null
    });

    
    const filteredSongs = computed(() => {
      if (!searchQuery.value) return songs.value;
      return songs.value.filter(song => 
        song.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        song.genre.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });

    const favoriteSongs = computed(() => {
      return favorites.value;
    });

    const extractYouTubeVideoId = (url) => {
      if (!url || typeof url !== 'string') return null;
      
      url = url.trim();
      
      const patterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/ 
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1] && match[1].length === 11) {
          return match[1];
        }
      }
      
      return null;
    };

    const fetchYouTubeInfo = async (videoId) => {
      try {
        const youTubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        let data = null;
        
        try {
          const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(youTubeUrl)}`;
          const response = await fetch(noembedUrl);
          if (response.ok) {
            data = await response.json();
            if (data.error) throw new Error(data.error);
          }
        } catch (e) {
          console.warn('Noembed failed, trying direct approach:', e.message);
        }
        
        if (!data || !data.title) {
          try {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youTubeUrl)}&format=json`;
            const response = await fetch(oembedUrl);
            if (response.ok) {
              data = await response.json();
            }
          } catch (e) {
            console.warn('YouTube oembed failed:', e.message);
          }
        }
        
        if (!data || !data.title) {
          data = {
            title: 'Canción de YouTube',
            author_name: 'YouTube',
            thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          };
        }
        
        const title = data.title || 'Título desconocido';
        let artist = data.author_name || 'Artista desconocido';
        
        if (title.includes(' - ') && !artist.includes(' - ')) {
          const parts = title.split(' - ');
          if (parts.length >= 2) {
            artist = parts[0].trim();
          }
        }
        
        let coverImage = './assets/icons/music.png';
        if (data.thumbnail_url) {
          coverImage = data.thumbnail_url
            .replace('hqdefault.jpg', 'maxresdefault.jpg')
            .replace('mqdefault.jpg', 'maxresdefault.jpg')
            .replace('default.jpg', 'maxresdefault.jpg');
        } else if (videoId) {
          coverImage = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
        
        const validateImage = async (url) => {
          try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
          } catch {
            return false;
          }
        };
        
        if (videoId && !coverImage.includes('assets/icons')) {
          try {
            const isValid = await validateImage(coverImage);
            if (!isValid) {
              coverImage = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
          } catch {
            coverImage = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }
        }
        
        return {
          title: title,
          artist: artist,
          duration: data.duration || extractDurationFromTitle(title) || '0:00', 
          cover_image: coverImage,
          year: new Date().getFullYear(),
          genre: detectGenreFromTitle(title),
          description: data.html || '',
          viewCount: null,
          url: youTubeUrl
        };
      } catch (error) {
        console.error('Error fetching YouTube info:', error);
        return {
          title: 'Canción de YouTube',
          artist: 'YouTube',
          duration: '0:00',
          cover_image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          year: new Date().getFullYear(),
          genre: 'YouTube',
          description: '',
          viewCount: null,
          url: `https://www.youtube.com/watch?v=${videoId}`
        };
      }
    };

    const extractDurationFromTitle = (title) => {
      const durationMatch = title.match(/\((\d{1,2}:\d{2})\)|\[(\d{1,2}:\d{2})\]/);
      if (durationMatch) {
        return durationMatch[1] || durationMatch[2];
      }
      return ''; 
    };

    const detectGenreFromTitle = (title) => {
      const lowerTitle = title.toLowerCase();
      
      if (lowerTitle.includes('remix') || lowerTitle.includes('mix')) return 'Electronic';
      if (lowerTitle.includes('acoustic') || lowerTitle.includes('unplugged')) return 'Acoustic';
      if (lowerTitle.includes('live') || lowerTitle.includes('concert')) return 'Live';
      if (lowerTitle.includes('cover')) return 'Cover';
      if (lowerTitle.includes('instrumental')) return 'Instrumental';
      if (lowerTitle.includes('karaoke')) return 'Karaoke';
      
      return ''; 
    };

    const formatYouTubeDuration = (isoDuration) => {
      const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const hours = (match[1] || '').replace('H', '');
      const minutes = (match[2] || '').replace('M', '');
      const seconds = (match[3] || '').replace('S', '');
      
      if (hours) {
        return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
      } else {
        return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
      }
    };

    const processYouTubeUrl = async () => {
      if (!newSongData.value.youtubeUrl.trim()) {
        youtubeError.value = 'Por favor introduce una URL de YouTube';
        return;
      }
      
      const videoId = extractYouTubeVideoId(newSongData.value.youtubeUrl);
      if (!videoId) {
        youtubeError.value = 'URL de YouTube inválida. Asegúrate de usar un enlace válido de YouTube.';
        return;
      }

      isLoadingYouTube.value = true;
      youtubeError.value = '';
      
      try {
        const videoInfo = await fetchYouTubeInfo(videoId);
        
        newSongData.value.title = videoInfo.title;
        newSongData.value.artist = videoInfo.artist;
        newSongData.value.duration = videoInfo.duration;
        newSongData.value.cover_image = videoInfo.cover_image;
        newSongData.value.year = videoInfo.year;
        newSongData.value.genre = videoInfo.genre;
        newSongData.value.file_url = videoInfo.url;

        
      } catch (error) {
        console.error('Error processing YouTube URL:', error);
        youtubeError.value = error.message || 'Error al obtener información del video. Verifica que el enlace sea válido y el video esté disponible.';
      } finally {
        isLoadingYouTube.value = false;
      }
    };

    
    const parseDuration = (duration) => {
      const parts = duration.split(':');
      if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    };

    const formatTime = (seconds) => {
      if (!seconds || isNaN(seconds)) return '0:00';
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const timeToSeconds = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return 0;
      const parts = timeStr.split(':');
      if (parts.length !== 2) return 0;
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      return mins * 60 + secs;
    };

    const ensureYouTubeContainer = () => {
      let container = document.getElementById('bit-smartphone-youtube-player');
      if (!container) {
        container = document.createElement('div');
        container.id = 'bit-smartphone-youtube-player';
        container.style.display = 'none';
        container.style.position = 'absolute';
        container.style.top = '-1000px';
        container.style.left = '-1000px';
        document.body.appendChild(container);
      }
      return container;
    };

    const sanitizeMusicData = (data) => {
      if (!data || typeof data !== 'object') return null;
      
      return {
        title: String(data.title || 'Sin título'),
        artist: String(data.artist || 'Artista desconocido'),
        duration: data.duration || '0:00',
        cover_image: String(data.cover_image || data.thumbnail_url || './assets/icons/music.png'),
        thumbnail_url: String(data.thumbnail_url || data.cover_image || './assets/icons/music.png'),
        file_url: String(data.file_url || ''),
        progress: Math.max(0, Math.min(100, Number(data.progress) || 0)),
        currentTime: Math.max(0, Number(data.currentTime) || 0),
        isPlaying: Boolean(data.isPlaying),
        volume: Math.max(0, Math.min(100, Number(data.volume) || 50))
      };
    };

    const formatNumber = (num) => {
      if (!num) return '';
      
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
      }
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    };

    const togglePlay = async () => {
      if (!currentSong.value) return;
      
      try {
        if (isPlaying.value) {
          const response = await fetch('https://bit-smartphone/music:pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          
          const result = await response.json();
          if (result.success) {
            isPlaying.value = false;
          }
        } else {
          const response = await fetch('https://bit-smartphone/music:resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          
          const result = await response.json();
          if (result.success) {
            isPlaying.value = true;
          }
        }
      } catch (error) {
        console.error('Error toggling play:', error);
      }
    };

    const updateExistingSongInfo = async (song) => {
      if (!song.file_url || !song.file_url.includes('youtube.com/watch')) return song;
      
      const videoId = extractYouTubeVideoId(song.file_url);
      if (!videoId) return song;
      
      try {
        const videoInfo = await fetchYouTubeInfo(videoId);
        
        const updatedSong = { ...song };
        
        if (!song.cover_image || song.cover_image === './assets/cover.jpg' || song.cover_image === './assets/icons/music.png') {
          updatedSong.cover_image = videoInfo.cover_image;
        }
        
        if (!song.genre || song.genre === '') {
          updatedSong.genre = videoInfo.genre;
        }
        
        if (song.artist === 'Artista desconocido' || !song.artist) {
          updatedSong.artist = videoInfo.artist;
        }
        
        if (!song.duration && videoInfo.duration) {
          updatedSong.duration = videoInfo.duration;
        }
        
        return updatedSong;
      } catch (error) {
        console.warn('Could not update song info for:', song.title, error.message);
        return song;
      }
    };
    
    const loadMusicData = async () => {
      loading.value = true;
      try {
        const response = await fetch('https://bit-smartphone/music:loadData', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const result = await response.json();
        
        if (result.success) {
          let loadedSongs = result.data.songs || [];
          playlists.value = result.data.playlists || [];
          favorites.value = result.data.favorites || [];
          recentlyPlayed.value = result.data.recentPlays || [];
          playlistSongs.value = result.data.playlistSongs || {};
          
          if (loadedSongs.length > 0) {
            const youtubeSongs = loadedSongs.filter(song => 
              song.file_url && song.file_url.includes('youtube.com/watch') && 
              (!song.cover_image || song.cover_image === './assets/cover.jpg' || !song.genre)
            );
            
            if (youtubeSongs.length > 0) {

              const batchSize = 3;
              for (let i = 0; i < youtubeSongs.length; i += batchSize) {
                const batch = youtubeSongs.slice(i, i + batchSize);
                const promises = batch.map(song => updateExistingSongInfo(song));
                
                try {
                  const updatedBatch = await Promise.all(promises);
                  
                  updatedBatch.forEach(updatedSong => {
                    const index = loadedSongs.findIndex(s => s.id === updatedSong.id);
                    if (index !== -1) {
                      loadedSongs[index] = updatedSong;
                    }
                  });
                  
                  if (i + batchSize < youtubeSongs.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                } catch (error) {
                  console.warn('Error updating batch:', error);
                }
              }
            }
          }
          
          songs.value = loadedSongs;
          
          const colors = [
            "from-purple-500 via-pink-500 to-red-500",
            "from-blue-500 via-cyan-500 to-teal-500", 
            "from-orange-500 via-yellow-500 to-red-500",
            "from-green-500 via-emerald-500 to-teal-500",
            "from-indigo-500 via-purple-500 to-pink-500",
            "from-rose-500 via-pink-500 to-fuchsia-500"
          ];
          
          playlists.value.forEach(playlist => {
            if (!playlist.color) {
              playlist.color = colors[Math.floor(Math.random() * colors.length)];
            }
          });
        }
      } catch (error) {
        console.error('Error loading music data:', error);
      } finally {
        loading.value = false;
      }
    };

    const playSong = async (song) => {
      try {
        if (currentSong.value && isPlaying.value) {
          await fetch('https://bit-smartphone/music:stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        }
        
        currentSong.value = song;
        
        const response = await fetch('https://bit-smartphone/music:play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            songData: song,
            volume: volume.value
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          isPlaying.value = true;
          
          fetch('https://bit-smartphone/music:recordPlay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ songId: song.id })
          });
          
          const existingIndex = recentlyPlayed.value.findIndex(s => s.id === song.id);
          if (existingIndex > -1) {
            recentlyPlayed.value.splice(existingIndex, 1);
          }
          recentlyPlayed.value.unshift({ ...song, played_at: new Date().toISOString() });
          if (recentlyPlayed.value.length > 50) {
            recentlyPlayed.value = recentlyPlayed.value.slice(0, 50);
          }
        } else {
          console.error('Error playing song:', result.error);
        }
      } catch (error) {
        console.error('Error playing song:', error);
      }
    };

    const nextSong = async () => {
      if (!currentSong.value) return;
      
      let songList = currentPlaylist.value ? 
        playlistSongs.value[currentPlaylist.value.id] || [] : 
        songs.value;
      
      if (songList.length === 0) return;
      
      const currentIndex = songList.findIndex(song => song.id === currentSong.value.id);
      let nextIndex;
      
      if (shuffle.value) {
        nextIndex = Math.floor(Math.random() * songList.length);
      } else {
        nextIndex = (currentIndex + 1) % songList.length;
      }
      
      await playSong(songList[nextIndex]);
    };

    const previousSong = async () => {
      if (!currentSong.value) return;
      
      let songList = currentPlaylist.value ? 
        playlistSongs.value[currentPlaylist.value.id] || [] : 
        songs.value;
      
      if (songList.length === 0) return;
      
      const currentIndex = songList.findIndex(song => song.id === currentSong.value.id);
      let prevIndex;
      
      if (shuffle.value) {
        prevIndex = Math.floor(Math.random() * songList.length);
      } else {
        prevIndex = currentIndex === 0 ? songList.length - 1 : currentIndex - 1;
      }
      
      await playSong(songList[prevIndex]);
    };

    let ytPlayer = null;
    let ytVideoId = null;
    let ytReady = false;

    const loadYouTubeAPI = () => {
      if (window.YT) return Promise.resolve();
      return new Promise((resolve) => {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => {
          resolve();
        };
      });
    };

    const createYouTubePlayer = async (videoId, volume = 50) => {
      await loadYouTubeAPI();
      ytVideoId = videoId;
      if (ytPlayer) {
        ytPlayer.loadVideoById(videoId);
        return;
      }
      const container = ensureYouTubeContainer();
      if (!container) return;
      ytPlayer = new YT.Player(container, {
        height: '160',
        width: '280',
        videoId: videoId,
        playerVars: { 'playsinline': 1, 'controls': 0 },
        events: {
          onReady: (e) => {
            ytReady = true;
            e.target.setVolume(volume);
            sendYoutubeStateToClient();
            
            if (window.ytProgressInterval) {
              clearInterval(window.ytProgressInterval);
            }
            window.ytProgressInterval = setInterval(() => {
              if (ytPlayer && ytReady) {
                sendYoutubeStateToClient();
              }
            }, 1000); 
          },
          onStateChange: (e) => {
            sendYoutubeStateToClient();
            
            if (e.data === 0) {
              window.SendNuiMessage(JSON.stringify({ type: 'musicYoutubeEnded' }));
            } else if (e.data === 1) {

            } else if (e.data === 2) {

            }
          },
          onError: (e) => {
            console.error('YouTube Player Error:', e);
            youtubeError.value = 'Error en el reproductor de YouTube. Intenta con otro video.';
          }
        }
      });
    };

    const sendYoutubeStateToClient = () => {
      if (!ytPlayer || !ytReady) return;
      try {
        const state = ytPlayer.getPlayerState();
        const isPlaying = state === 1;
        const position = Math.floor(Number(ytPlayer.getCurrentTime()) || 0);
        const duration = Math.floor(Number(ytPlayer.getDuration()) || 0);
        const volume = Number(ytPlayer.getVolume()) / 100 || 0;
        
        const validPosition = isNaN(position) ? 0 : Math.max(0, position);
        const validDuration = isNaN(duration) ? 0 : Math.max(0, duration);
        const validVolume = isNaN(volume) ? 0 : Math.max(0, Math.min(1, volume));
        
        if (validDuration > 0) {
          progress.value = (validPosition / validDuration) * 100;
          currentTime.value = validPosition;
          
          if (currentSong.value) {
            currentSong.value.duration = formatTime(validDuration);
            currentSong.value.durationSeconds = validDuration;
          }
        }
        
        isPlaying.value = isPlaying;
        
        updateProgressUI(validPosition, validDuration);
        
        fetch('https://bit-smartphone/music:updateYoutubeState', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            isPlaying, 
            position: validPosition, 
            duration: validDuration, 
            volume: validVolume 
          })
        });
      } catch (error) {
        console.error('Error sending YouTube state to client:', error);
      }
    };

    const updateProgressUI = (position, duration) => {
      if (duration > 0 && position >= 0) {
      }
    };

    window.musicYoutubePlay = async (videoUrl, songData, volume) => {
      const id = extractYouTubeVideoId(videoUrl);
      if (!id) return;
      await createYouTubePlayer(id, Math.floor((volume || 0.5) * 100));
      if (ytPlayer && ytReady) {
        ytPlayer.playVideo();
      }
      sendYoutubeStateToClient();
    };

    window.musicYoutubePause = () => {
      try {
        if (ytPlayer && ytReady && typeof ytPlayer.pauseVideo === 'function') {
          ytPlayer.pauseVideo();
        }
        sendYoutubeStateToClient();
      } catch (error) {
        console.error('Error pausing YouTube player:', error);
      }
    };

    window.musicYoutubeResume = () => {
      try {
        if (ytPlayer && ytReady && typeof ytPlayer.playVideo === 'function') {
          ytPlayer.playVideo();
        }
        sendYoutubeStateToClient();
      } catch (error) {
        console.error('Error resuming YouTube player:', error);
      }
    };

    window.musicYoutubeStop = () => {
      if (window.ytProgressInterval) {
        clearInterval(window.ytProgressInterval);
        window.ytProgressInterval = null;
      }
      
      if (ytPlayer) {
        ytPlayer.stopVideo();
        try { ytPlayer.destroy(); } catch (e) {}
        ytPlayer = null;
        ytReady = false;
      }
      fetch('https://bit-smartphone/music:updateYoutubeState', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPlaying: false, position: 0, duration: 0, volume: 0 })
      });
    };

    window.musicYoutubeSetVolume = (v) => {
      try {
        if (ytPlayer && ytReady && typeof ytPlayer.setVolume === 'function') {
          const volume = Math.max(0, Math.min(100, Math.floor(v * 100)));
          ytPlayer.setVolume(volume);
        }
        sendYoutubeStateToClient();
      } catch (error) {
        console.error('Error setting YouTube volume:', error);
      }
    };

    window.musicYoutubeSetPosition = (p) => {
      try {
        if (ytPlayer && ytReady && typeof ytPlayer.seekTo === 'function') {
          const position = Math.max(0, Number(p));
          ytPlayer.seekTo(position, true);
        }
        sendYoutubeStateToClient();
      } catch (error) {
        console.error('Error seeking YouTube player:', error);
      }
    };

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (!message || !message.type) return;
      switch (message.type) {
        case 'musicYoutubePlay':
          window.musicYoutubePlay(message.data.videoUrl, message.data.songData, message.data.volume);
          break;
        case 'musicYoutubePause':
          window.musicYoutubePause();
          break;
        case 'musicYoutubeResume':
          window.musicYoutubeResume();
          break;
        case 'musicYoutubeStop':
          window.musicYoutubeStop();
          break;
        case 'musicYoutubeSetVolume':
          window.musicYoutubeSetVolume(message.data.volume);
          break;
        case 'musicYoutubeSetPosition':
          window.musicYoutubeSetPosition(message.data.position);
          break;
      }
    });

    onMounted(() => {
      let c = document.getElementById('bit-smartphone-youtube-player');
      if (!c) {
        c = document.createElement('div');
        c.id = 'bit-smartphone-youtube-player';
        c.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 280px; height: 160px;';
        document.body.appendChild(c);
      }
    });

    const stopMusic = async () => {
      try {
        const response = await fetch('https://bit-smartphone/music:stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        const result = await response.json();
        if (result.success) {
          isPlaying.value = false;
          currentSong.value = null;
          localState.progress.value = 0;
          localState.currentTime.value = 0;
        }
      } catch (error) {
        console.error('Error stopping music:', error);
      }
    };

    const toggleFavorite = async (song) => {
      const newFavoriteState = !song.is_favorite;
      
      try {
        const response = await fetch('https://bit-smartphone/music:toggleFavorite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            songId: song.id, 
            isFavorite: newFavoriteState 
          })
        });
        const result = await response.json();
        
        if (result.success) {
          song.is_favorite = newFavoriteState;
          
          
          if (newFavoriteState) {
            if (!favorites.value.find(f => f.id === song.id)) {
              favorites.value.push(song);
            }
          } else {
            const index = favorites.value.findIndex(f => f.id === song.id);
            if (index > -1) {
              favorites.value.splice(index, 1);
            }
          }
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    };

    const createPlaylist = async () => {
      if (newPlaylistName.value.trim()) {
        try {
          const response = await fetch('https://bit-smartphone/music:createPlaylist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: newPlaylistName.value.trim(),
              description: newPlaylistDescription.value.trim(),
              coverImage: newPlaylistCover.value.trim()
            })
          });
          const result = await response.json();
          
          if (result.success) {
            const colors = [
              "from-purple-500 via-pink-500 to-red-500",
              "from-blue-500 via-cyan-500 to-teal-500", 
              "from-orange-500 via-yellow-500 to-red-500",
              "from-green-500 via-emerald-500 to-teal-500",
              "from-indigo-500 via-purple-500 to-pink-500",
              "from-rose-500 via-pink-500 to-fuchsia-500"
            ];
            
            playlists.value.push({
              id: result.playlistId,
              name: newPlaylistName.value.trim(),
              description: newPlaylistDescription.value.trim(),
              cover_image: newPlaylistCover.value.trim(),
              color: colors[Math.floor(Math.random() * colors.length)]
            });
            
            playlistSongs.value[result.playlistId] = [];
            
            newPlaylistName.value = '';
            newPlaylistDescription.value = '';
            newPlaylistCover.value = '';
            showCreatePlaylist.value = false;
          }
        } catch (error) {
          console.error('Error creating playlist:', error);
        }
      }
    };

    const openPlaylist = (playlist) => {
      currentPlaylist.value = playlist;
      activeTab.value = 'playlist-detail';
    };

    const addToPlaylist = async (song, playlist) => {
      try {
        const response = await fetch('https://bit-smartphone/music:addSongToPlaylist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playlistId: playlist.id,
            songId: song.id
          })
        });
        const result = await response.json();
        
        if (result.success) {
          if (!playlistSongs.value[playlist.id]) {
            playlistSongs.value[playlist.id] = [];
          }
          playlistSongs.value[playlist.id].push(song);
        }
      } catch (error) {
        console.error('Error adding song to playlist:', error);
      }
    };

    const removeFromPlaylist = async (song, playlist) => {
      try {
        const response = await fetch('https://bit-smartphone/music:removeSongFromPlaylist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playlistId: playlist.id,
            songId: song.id
          })
        });
        const result = await response.json();
        
        if (result.success) {
          const songs = playlistSongs.value[playlist.id] || [];
          const index = songs.findIndex(s => s.id === song.id);
          if (index > -1) {
            songs.splice(index, 1);
          }
        }
      } catch (error) {
        console.error('Error removing song from playlist:', error);
      }
    };

    const addSong = async () => {
      if (!newSongData.value.title || !newSongData.value.artist) return;
      
      try {
        const response = await fetch('https://bit-smartphone/music:addSong', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songData: newSongData.value })
        });
        const result = await response.json();
        
        if (result.success) {
          const newSong = {
            id: result.songId,
            ...newSongData.value,
            is_favorite: false,
            play_count: 0
          };
          
          songs.value.unshift(newSong);
          
          Object.keys(newSongData.value).forEach(key => {
            if (key === 'year') {
              newSongData.value[key] = null;
            } else {
              newSongData.value[key] = '';
            }
          });
          
          showAddSong.value = false;
          youtubeError.value = '';
        }
      } catch (error) {
        console.error('Error adding song:', error);
      }
    };

    const setMusicProgress = async (newProgress) => {
      if (props.musicState) {
        emit('set-music-progress', newProgress);
      } else {
        localState.progress.value = newProgress;
        if (currentSong.value) {
          const duration = parseDuration(currentSong.value.duration);
          const newPosition = Math.floor((newProgress / 100) * duration);
          localState.currentTime.value = newPosition;
          
          try {
            const response = await fetch('https://bit-smartphone/music:setPosition', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: newPosition })
            });
            
            const result = await response.json();
            if (!result.success && result.error !== "No music playing") {
              console.error('Error setting position:', result.error);
            }
          } catch (error) {
            console.error('Error setting position:', error);
          }
        }
      }
    };

    const setVolume = async (newVolume) => {
      volume.value = newVolume;
      
      try {
        const response = await fetch('https://bit-smartphone/music:setVolume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ volume: newVolume })
        });
        
        const result = await response.json();
        if (!result.success && result.error !== "No music playing") {
          console.error('Error setting volume:', result.error);
        }
      } catch (error) {
        console.error('Error setting volume:', error);
      }
    };

    const closeApp = async () => {
      if (!props.musicState && currentSong.value && isPlaying.value) {
        try {
          await fetch('https://bit-smartphone/music:stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
        } catch (error) {
          console.error('Error stopping music:', error);
        }
      }
      emit('close');
    };

    const getMusicInfo = async () => {
      try {
        const response = await fetch('https://bit-smartphone/music:getInfo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      } catch (error) {
        console.error('Error getting music info:', error);
      }
      return null;
    };

    const getPlaylistSongs = (playlist) => {
      if (!playlist || !playlist.id) return [];
      return playlistSongs.value[playlist.id] || [];
    };

    const handleProgressClick = (event) => {
      if (!currentSong.value) return;
      
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const progressPercent = (clickX / rect.width) * 100;
      
      setMusicProgress(Math.max(0, Math.min(100, progressPercent)));
    };

    const handleVolumeClick = (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const volumePercent = (clickX / rect.width) * 100;
      
      setVolume(Math.max(0, Math.min(100, volumePercent)));
    };
    
    
    onMounted(() => {
      loadMusicData();
      
      try {
        let ytContainer = document.getElementById('bit-smartphone-youtube-player');
        if (!ytContainer) {
          ytContainer = document.createElement('div');
          ytContainer.id = 'bit-smartphone-youtube-player';
          ytContainer.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 280px; height: 160px; z-index: -1; visibility: hidden;';
          document.body.appendChild(ytContainer);

        }
      } catch (error) {
        console.error('Error creating YouTube container:', error);
      }
      
      window.progressInterval = setInterval(async () => {
        if (currentSong.value && isPlaying.value && !props.musicState) {
          try {
            const info = await getMusicInfo();
            if (info) {
              if (info.progress !== undefined && info.progress !== null) {
                const progressNum = Number(info.progress);
                if (!isNaN(progressNum)) {
                  localState.progress.value = Math.max(0, Math.min(100, progressNum));
                }
              }
              
              if (info.currentTime !== undefined && info.currentTime !== null) {
                const timeNum = Number(info.currentTime);
                if (!isNaN(timeNum)) {
                  localState.currentTime.value = Math.max(0, timeNum);
                }
              }
              
              if (typeof info.isPlaying === 'boolean') {
                localState.isPlaying.value = info.isPlaying;
              }
            }
          } catch (error) {
          }
        }
      }, 1000);
      
      window.addEventListener('message', (event) => {
        if (event.data.type === 'musicUpdate') {
          const data = event.data.data;
          if (!props.musicState && data) {
            if (typeof data.isPlaying === 'boolean') {
              localState.isPlaying.value = data.isPlaying;
            }
            
            const volume = Number(data.volume);
            if (!isNaN(volume)) {
              localState.volume.value = Math.max(0, Math.min(100, volume * 100));
            }
            
            const position = Number(data.position);
            if (!isNaN(position)) {
              localState.currentTime.value = Math.max(0, position);
            }
            
            const duration = Number(data.duration);
            if (!isNaN(duration) && duration > 0) {
              const progress = (position / duration) * 100;
              localState.progress.value = Math.max(0, Math.min(100, progress));
            }
          }
        } else if (event.data.type === 'musicEnded') {
          if (currentSong.value && repeat.value !== 0) {
            if (repeat.value === 1) { 
              playSong(currentSong.value);
            } else { 
              nextSong();
            }
          } else {
            isPlaying.value = false;
            localState.isPlaying.value = false;
          }
        }
      });
    });

    onUnmounted(() => {
      if (window.progressInterval) {
        clearInterval(window.progressInterval);
      }
      
      if (window.ytProgressInterval) {
        clearInterval(window.ytProgressInterval);
        window.ytProgressInterval = null;
      }
    });

    return {
      
      activeTab,
      currentSong,
      isPlaying,
      progress,
      currentTime,
      shuffle,
      repeat,
      searchQuery,
      showSettings,
      showCreatePlaylist,
      showAddSong,
      newPlaylistName,
      newPlaylistDescription,
      newPlaylistCover,
      newSongData,
      loading,
      volume,
      currentPlaylist,
      showPlaylistMenu,
      isLoadingYouTube,
      youtubeError,
      
      
      songs,
      playlists,
      favorites,
      recentlyPlayed,
      playlistSongs,
      
      
      filteredSongs,
      favoriteSongs,
      
      
      loadMusicData,
      playSong,
      togglePlay,
      nextSong,
      previousSong,
      stopMusic,
      toggleFavorite,
      createPlaylist,
      addSong,
      openPlaylist,
      addToPlaylist,
      removeFromPlaylist,
      setVolume,
      setMusicProgress,
      formatTime,
      formatNumber,
      parseDuration,
      closeApp,
      getPlaylistSongs,
      handleProgressClick,
      handleVolumeClick,
      processYouTubeUrl
    };
  },
  template: `
    <div class="h-full flex flex-col relative overflow-hidden transition-all duration-500"
         :class="userSettings.darkMode ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white' : 'bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50 text-gray-900'">
      
      <div class="absolute inset-0" :class="userSettings.darkMode ? 'opacity-40' : 'opacity-25'">
        <div class="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div class="absolute top-32 right-16 w-80 h-80 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div class="absolute -bottom-16 left-32 w-96 h-96 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
        <div class="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-3000"></div>
      </div>

      <div class="absolute inset-0 backdrop-blur-sm" :class="userSettings.darkMode ? 'bg-black/10' : 'bg-white/10'"></div>

      <header class="relative z-10 p-6 pt-10">
        <div class="flex justify-between items-center mb-4">         
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-lg font-bold text-white">Música</h1>
            </div>
          </div>

          <button @click="showSettings = !showSettings" class="p-2 hover:bg-white/20 rounded-xl transition-all duration-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
            </svg>
          </button>
        </div>

        <div class="flex justify-center bg-white/10 backdrop-blur-2xl rounded-3xl p-1 border border-white/20 shadow-2xl max-w-xs mx-auto">
          <button @click="activeTab = 'home'" 
                  :class="activeTab === 'home' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'"
                  class="flex-1 p-2 rounded-2xl transition-all duration-300 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </button>
          <button @click="activeTab = 'playlists'" 
                  :class="activeTab === 'playlists' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'"
                  class="flex-1 p-2 rounded-2xl transition-all duration-300 flex items-center justify-center">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
          </button>
          <button @click="activeTab = 'favorites'" 
                  :class="activeTab === 'favorites' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'"
                  class="flex-1 p-2 rounded-2xl transition-all duration-300 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="relative z-10 flex-1 overflow-hidden px-6 pb-6">
        <div v-show="activeTab === 'home'" class="h-full">
          <div class="bg-white/10 backdrop-blur-2xl rounded-2xl p-4 mb-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div class="flex items-center space-x-4">
              <div class="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input v-model="searchQuery" 
                     type="text" 
                     placeholder="Buscar música, artista, género..."
                     class="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-lg font-medium">
              <div v-if="searchQuery" class="text-sm text-white/60 bg-white/10 px-3 py-1 rounded-full">
                {{ filteredSongs.length }} resultados
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-2xl font-bold text-white mb-1">Tu Biblioteca Musical</h2>
              <p class="text-white/60 font-medium">{{ filteredSongs.length }} canciones disponibles</p>
            </div>
            <div class="flex space-x-2">
              <button @click="showAddSong = true" 
                      class="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl p-3 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 hover:scale-110">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </button>
              <button class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
              <button class="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 border border-white/20">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="h-96 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div v-for="song in filteredSongs" :key="song.id" 
                 @click="playSong(song)"
                 class="group bg-white/5 backdrop-blur-2xl rounded-2xl p-4 hover:bg-white/15 transition-all duration-500 cursor-pointer border border-white/10 hover:border-white/30 hover:shadow-2xl hover:scale-[1.02]">
              <div class="flex items-center space-x-4">
                <div class="relative overflow-hidden">
                  <img :src="song.cover_image || song.cover || 'assets/icons/music.png'" 
                       class="w-16 h-16 rounded-2xl object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
                       @error="$event.target.src = 'assets/icons/music.png'">
                  <div v-if="currentSong && currentSong.id === song.id && isPlaying" 
                       class="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl backdrop-blur-sm">
                    <div class="flex space-x-1">
                      <div class="w-1 h-4 bg-white rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 0.8s;"></div>
                      <div class="w-1 h-4 bg-white rounded-full animate-bounce" style="animation-delay: 0.1s; animation-duration: 0.8s;"></div>
                      <div class="w-1 h-4 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s; animation-duration: 0.8s;"></div>
                      <div class="w-1 h-4 bg-white rounded-full animate-bounce" style="animation-delay: 0.3s; animation-duration: 0.8s;"></div>
                    </div>
                  </div>
                  <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-white group-hover:text-purple-200 transition-colors truncate text-lg">{{ song.title }}</h3>
                  <p class="text-white/70 text-base truncate font-medium">{{ song.artist }}</p>
                  <div class="flex items-center space-x-3 mt-2">
                    <span class="text-xs text-white/60 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 rounded-full border border-white/10 font-medium">
                      {{ song.genre || 'Sin género' }}
                    </span>
                    <span class="text-sm text-white/60 font-mono">{{ song.duration || '0:00' }}</span>
                    <div v-if="song.viewCount" class="text-xs text-white/50">
                      {{ formatNumber(song.viewCount) }} vistas
                    </div>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <button @click.stop="toggleFavorite(song)" 
                          class="p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-110 group/heart">
                    <svg class="w-6 h-6 transition-all duration-300" 
                         :class="song.is_favorite ? 'text-red-400 fill-current scale-110' : 'text-white/50 group-hover/heart:text-red-300'" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" 
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </button>
                  <button v-if="playlists.length > 0" @click.stop="showPlaylistMenu = song.id" 
                          class="p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 relative hover:scale-110">
                    <svg class="w-6 h-6 text-white/50 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="filteredSongs.length === 0" class="text-center py-16">
              <div class="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                <svg class="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                </svg>
              </div>
              <p class="text-white/60 text-xl font-semibold mb-2">No se encontraron canciones</p>
              <p class="text-white/40 text-base">Agrega música desde YouTube para comenzar</p>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'playlists'" class="h-full">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-2xl font-bold text-white mb-1">Mis Playlists</h2>
              <p class="text-white/60 font-medium">{{ playlists.length }} listas de reproducción creadas</p>
            </div>
            <button @click="showCreatePlaylist = true" 
                    class="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl p-3 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 hover:scale-110">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </button>
          </div>
          
          <div class="h-96 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div v-for="playlist in playlists" :key="playlist.id" 
                 @click="openPlaylist(playlist)"
                 class="group bg-white/5 backdrop-blur-2xl rounded-3xl p-6 hover:bg-white/15 transition-all duration-500 cursor-pointer border border-white/10 hover:border-white/30 hover:shadow-2xl hover:scale-[1.02]">
              <div class="flex items-center space-x-5">
                <div :class="['w-20 h-20 rounded-2xl bg-gradient-to-br', playlist.color || 'from-purple-500 to-pink-500', 'flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-300 group-hover:scale-110']">
                  <svg class="w-10 h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-white group-hover:text-purple-200 transition-colors truncate text-xl mb-1">{{ playlist.name }}</h3>
                  <p class="text-white/70 text-base truncate font-medium mb-2">{{ playlist.description || 'Sin descripción' }}</p>
                  <p class="text-white/50 text-sm font-medium">{{ getPlaylistSongs(playlist).length }} canciones</p>
                </div>
                <svg class="w-8 h-8 text-white/30 group-hover:text-white/70 transition-all duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
            
            <div v-if="playlists.length === 0" class="text-center py-16">
              <div class="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                <svg class="w-12 h-12 text-white/40" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
              </div>
              <p class="text-white/60 text-xl font-semibold mb-2">No tienes playlists</p>
              <p class="text-white/40 text-base">Crea tu primera lista de reproducción</p>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'playlist-detail'" class="h-full">
          <div class="flex items-center mb-8">
            <button @click="activeTab = 'playlists'" class="bg-white/10 backdrop-blur-2xl rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 border border-white/20 mr-6 hover:scale-110">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div class="flex items-center space-x-4">
              <div v-if="currentPlaylist" :class="['w-16 h-16 rounded-2xl bg-gradient-to-br', currentPlaylist.color || 'from-purple-500 to-pink-500', 'flex items-center justify-center shadow-2xl']">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <div>
                <h2 class="text-3xl font-black text-white mb-1">{{ currentPlaylist?.name }}</h2>
                <p class="text-white/70 text-lg font-medium">{{ currentPlaylist ? getPlaylistSongs(currentPlaylist).length : 0 }} canciones</p>
              </div>
            </div>
          </div>
          
          <div class="h-80 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div v-for="song in currentPlaylist ? getPlaylistSongs(currentPlaylist) : []" :key="song.id" 
                 @click="playSong(song)"
                 class="group bg-white/5 backdrop-blur-2xl rounded-2xl p-5 hover:bg-white/15 transition-all duration-500 cursor-pointer border border-white/10 hover:border-white/30 hover:shadow-2xl hover:scale-[1.02]">
              <div class="flex items-center space-x-5">
                <img :src="song.cover_image || song.cover || ''" class="w-20 h-20 rounded-2xl object-cover shadow-xl group-hover:scale-110 transition-transform duration-300">
                <div class="flex-1">
                  <h3 class="font-bold text-white group-hover:text-purple-200 transition-colors text-lg mb-1">{{ song.title }}</h3>
                  <p class="text-white/70 text-base font-medium">{{ song.artist }}</p>
                  <div class="flex items-center space-x-3 mt-2">
                    <span class="text-xs text-white/60 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 rounded-full border border-white/10 font-medium">
                      {{ song.genre || 'Sin género' }}
                    </span>
                    <span class="text-sm text-white/60 font-mono">{{ song.duration || '0:00' }}</span>
                  </div>
                </div>
                <button @click.stop="removeFromPlaylist(song, currentPlaylist)" 
                        class="p-3 rounded-2xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'favorites'" class="h-full">
          <div class="mb-8">
            <h2 class="text-3xl font-black text-white mb-2">Tus Favoritos</h2>
            <p class="text-white/60 text-lg font-medium">{{ favoriteSongs.length }} canciones que amas</p>
          </div>
          
          <div class="h-80 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <div v-for="song in favoriteSongs" :key="song.id" 
                 @click="playSong(song)"
                 class="group bg-white/5 backdrop-blur-2xl rounded-2xl p-5 hover:bg-white/15 transition-all duration-500 cursor-pointer border border-white/10 hover:border-white/30 hover:shadow-2xl hover:scale-[1.02]">
              <div class="flex items-center space-x-5">
                <div class="relative">
                  <img :src="song.cover_image || song.cover || ''" class="w-20 h-20 rounded-2xl object-cover shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <div class="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg class="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-white group-hover:text-purple-200 transition-colors text-lg mb-1">{{ song.title }}</h3>
                  <p class="text-white/70 text-base font-medium">{{ song.artist }}</p>
                  <div class="flex items-center space-x-3 mt-2">
                    <span class="text-xs text-white/60 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1 rounded-full border border-white/10 font-medium">
                      {{ song.genre || 'Sin género' }}
                    </span>
                    <span class="text-sm text-white/60 font-mono">{{ song.duration || '0:00' }}</span>
                  </div>
                </div>
                <button @click.stop="toggleFavorite(song)" 
                        class="p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-110">
                  <svg class="w-6 h-6 text-red-400 fill-current hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" 
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div v-if="favoriteSongs.length === 0" class="text-center py-16">
              <div class="w-24 h-24 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                <svg class="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </div>
              <p class="text-white/60 text-xl font-semibold mb-2">No tienes favoritos</p>
              <p class="text-white/40 text-base">Marca canciones como favoritas para verlas aquí</p>
            </div>
          </div>
        </div>
      </main>

      <div v-if="currentSong" class="relative z-20 mt-auto">
        <div class="mx-4 mb-4 bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-xl">
          <div class="flex items-center space-x-3 mb-2">
            <img :src="currentSong?.cover_image || currentSong?.cover || ''" class="w-10 h-10 rounded-lg object-cover">
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-white text-xs truncate">{{ currentSong?.title || '' }}</h3>
              <p class="text-white/70 text-xs truncate">{{ currentSong?.artist || '' }}</p>
            </div>
          </div>

          <div class="mb-2">
            <div class="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>{{ formatTime(Math.floor(currentTime)) }}</span>
              <span>{{ currentSong?.duration || (currentSong?.durationSeconds ? formatTime(currentSong.durationSeconds) : '0:00') }}</span>
            </div>
            <div class="bg-white/20 rounded-full h-1 cursor-pointer" @click="handleProgressClick">
              <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300" 
                   :style="{width: Math.max(0, Math.min(100, progress)) + '%'}"></div>
            </div>
          </div>

          <div class="flex items-center justify-center space-x-3">
            <button @click="previousSong" class="p-1 rounded-lg hover:bg-white/10 transition-all duration-300 text-white">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button @click="togglePlay" class="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300">
              <svg v-if="!isPlaying" class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            
            <button @click="nextSong" class="p-1 rounded-lg hover:bg-white/10 transition-all duration-300 text-white">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="showCreatePlaylist" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div class="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <h3 class="text-2xl font-bold mb-8 text-center text-white">Crear Nueva Playlist</h3>
          <div class="space-y-6">
            <div>
              <label class="text-white block mb-3 font-semibold">Nombre de la playlist</label>
              <input v-model="newPlaylistName" 
                     type="text" 
                     placeholder="Ej: Mi música favorita"
                     class="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white placeholder-white/50 outline-none focus:border-purple-400 focus:bg-white/15 transition-all duration-300 text-lg">
            </div>
            <div>
              <label class="text-white block mb-3 font-semibold">Descripción (opcional)</label>
              <textarea v-model="newPlaylistDescription" 
                        placeholder="Describe tu playlist..."
                        rows="3"
                        class="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white placeholder-white/50 outline-none focus:border-purple-400 focus:bg-white/15 transition-all duration-300 resize-none"></textarea>
            </div>
            <div>
              <label class="text-white block mb-3 font-semibold">URL de portada (opcional)</label>
              <input v-model="newPlaylistCover" 
                     type="url" 
                     placeholder="./assets/image.png"
                     class="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white placeholder-white/50 outline-none focus:border-purple-400 focus:bg-white/15 transition-all duration-300">
            </div>
          </div>
          <div class="flex space-x-4 mt-8">
            <button @click="showCreatePlaylist = false" 
                    class="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all duration-300 border border-white/20 hover:scale-105 font-semibold">
              Cancelar
            </button>
            <button @click="createPlaylist" 
                    :disabled="!newPlaylistName.trim()"
                    class="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white transition-all duration-300 shadow-lg hover:scale-105 font-semibold">
              Crear
            </button>
          </div>
        </div>
      </div>

      <div v-if="showSettings" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div class="bg-white/10 backdrop-blur-3xl rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-2xl font-bold text-white">Configuración</h3>
            <button @click="showSettings = false" class="p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-110">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="space-y-6">
            <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <span class="text-white font-semibold">Reproducción aleatoria</span>
              <button @click="shuffle = !shuffle" 
                      :class="['w-14 h-7 rounded-full transition-all duration-300 relative', shuffle ? 'bg-purple-600' : 'bg-white/20']">
                <div :class="['w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300', shuffle ? 'translate-x-8' : 'translate-x-1']"></div>
              </button>
            </div>
            
            <div class="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div class="flex items-center justify-between mb-4">
                <span class="text-white font-semibold">Modo repetición</span>
                <select v-model="repeat" class="bg-white/10 border border-white/20 rounded-xl p-3 text-white font-medium">
                  <option value="0">Desactivado</option>
                  <option value="1">Repetir todo</option>
                  <option value="2">Repetir una</option>
                </select>
              </div>
            </div>
            
            <div class="p-4 bg-white/5 rounded-2xl border border-white/10">
              <label class="text-white block mb-4 font-semibold">Volumen: {{ volume }}%</label>
              <input type="range" 
                     :value="volume" 
                     @input="setVolume($event.target.value)"
                     min="0" 
                     max="100" 
                     class="w-full h-3 bg-white/20 rounded-full appearance-none slider">
            </div>
          </div>
        </div>
      </div>

      <div v-if="showAddSong" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 class="text-2xl font-bold text-white mb-8 text-center">Agregar Nueva Canción</h3>
          
          <div class="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <div class="flex items-center space-x-3 mb-4">
              <div class="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <h4 class="text-xl font-bold text-white">YouTube URL</h4>
            </div>
            <div class="space-y-4">
              <input v-model="newSongData.youtubeUrl" 
                     type="url"  
                     placeholder="Pega aquí el enlace de YouTube..."
                     class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/50 outline-none focus:border-red-400 transition-colors text-lg">
              <div class="flex space-x-3">
                <button @click="processYouTubeUrl" 
                        :disabled="!newSongData.youtubeUrl.trim() || isLoadingYouTube"
                        class="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 px-6 text-white transition-all duration-300 shadow-lg hover:scale-105 font-semibold flex items-center justify-center space-x-2">
                  <svg v-if="isLoadingYouTube" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span v-if="!isLoadingYouTube">Obtener Información</span>
                  <span v-else>Procesando...</span>
                </button>
              </div>
              <p v-if="youtubeError" class="text-red-400 text-sm font-medium">{{ youtubeError }}</p>
              <p class="text-white/60 text-sm">Introduce una URL de YouTube y automáticamente obtendremos toda la información de la canción</p>
            </div>
          </div>
          
          <div class="flex space-x-4 mt-8">
            <button @click="showAddSong = false; youtubeError = ''" 
                    class="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all duration-300 border border-white/20 hover:scale-105 font-semibold">
              Cancelar
            </button>
            <button @click="addSong" 
                    :disabled="!newSongData.title.trim() || !newSongData.artist.trim()"
                    class="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white transition-all duration-300 shadow-lg hover:scale-105 font-semibold">
              Agregar Canción
            </button>
          </div>
        </div>
      </div>

      <div v-if="showPlaylistMenu" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
           @click="showPlaylistMenu = null">
        <div class="bg-white/10 backdrop-blur-3xl rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl" @click.stop>
          <h3 class="text-lg font-bold text-white mb-4">Agregar a Playlist</h3>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <button v-for="playlist in playlists" :key="playlist.id"
                    @click="addToPlaylist(songs.find(s => s.id === showPlaylistMenu), playlist); showPlaylistMenu = null"
                    class="w-full text-left p-3 bg-white/5 hover:bg-white/15 rounded-2xl transition-all duration-300 border border-white/10">
              <div class="flex items-center space-x-3">
                <div :class="['w-8 h-8 rounded-lg bg-gradient-to-br', playlist.color]"></div>
                <span class="text-white font-medium">{{ playlist.name }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <style>
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8B5CF6, #EC4899);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8B5CF6, #EC4899);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      </style>
    </div>
  `
};