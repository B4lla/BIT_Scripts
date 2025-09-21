if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-smartphone:music:loadData', function(source, cb)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb({}) end
        
        local identifier = xPlayer.identifier
        
        
        local playlists = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT * FROM bit_phone_music_playlists WHERE user = @user ORDER BY created_at DESC', 
            {['@user'] = identifier}
        )
        
        
        local songs = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT * FROM bit_phone_music_songs WHERE user = @user ORDER BY added_at DESC', 
            {['@user'] = identifier}
        )
        
        
        local favorites = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT * FROM bit_phone_music_songs WHERE user = @user AND is_favorite = 1 ORDER BY added_at DESC', 
            {['@user'] = identifier}
        )
        
        
                local recentPlays = SqlFunc(Config.Mysql, 'fetchAll', 
                        [[SELECT s.*, r.played_at FROM bit_phone_music_recent_plays r 
                            JOIN bit_phone_music_songs s ON r.song_id = s.id 
              WHERE r.user = @user 
              ORDER BY r.played_at DESC LIMIT 50]], 
            {['@user'] = identifier}
        )
        
        
        local playlistSongs = {}
        for _, playlist in ipairs(playlists) do
                        local songs_in_playlist = SqlFunc(Config.Mysql, 'fetchAll', 
                                [[SELECT s.*, ps.position FROM bit_phone_music_playlist_songs ps 
                                    JOIN bit_phone_music_songs s ON ps.song_id = s.id 
                  WHERE ps.playlist_id = @playlist_id 
                  ORDER BY ps.position ASC]], 
                {['@playlist_id'] = playlist.id}
            )
            playlistSongs[playlist.id] = songs_in_playlist
        end
        
        cb({
            playlists = playlists,
            songs = songs,
            favorites = favorites,
            recentPlays = recentPlays,
            playlistSongs = playlistSongs
        })
    end)
    
    
    ESX.RegisterServerCallback('bit-smartphone:music:createPlaylist', function(source, cb, name, description, coverImage)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb(false) end
        
        local identifier = xPlayer.identifier
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_phone_music_playlists (user, name, description, cover_image) VALUES (@user, @name, @description, @cover)', 
            {
                ['@user'] = identifier,
                ['@name'] = name,
                ['@description'] = description or '',
                ['@cover'] = coverImage or ''
            }
        )
        
        cb(result and result.insertId or false)
    end)
    
    
    ESX.RegisterServerCallback('bit-smartphone:music:addSong', function(source, cb, songData)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb(false) end
        
        local identifier = xPlayer.identifier
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            [[INSERT INTO bit_phone_music_songs (user, title, artist, album, duration, file_url, cover_image, genre, year) 
              VALUES (@user, @title, @artist, @album, @duration, @file_url, @cover_image, @genre, @year)]], 
            {
                ['@user'] = identifier,
                ['@title'] = songData.title,
                ['@artist'] = songData.artist,
                ['@album'] = songData.album or '',
                ['@duration'] = songData.duration,
                ['@file_url'] = songData.file_url,
                ['@cover_image'] = songData.cover_image or '',
                ['@genre'] = songData.genre or '',
                ['@year'] = songData.year or nil
            }
        )
        
        cb(result and result.insertId or false)
    end)
    
    
    ESX.RegisterServerCallback('bit-smartphone:music:addSongToPlaylist', function(source, cb, playlistId, songId)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb(false) end
        
        
        local playlist = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT id FROM bit_phone_music_playlists WHERE id = @id AND user = @user', 
            {['@id'] = playlistId, ['@user'] = xPlayer.identifier}
        )
        
        if not playlist[1] then return cb(false) end
        
        
        local nextPosition = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM bit_phone_music_playlist_songs WHERE playlist_id = @playlist_id', 
            {['@playlist_id'] = playlistId}
        )
        
        local position = nextPosition[1].next_pos
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_phone_music_playlist_songs (playlist_id, song_id, position) VALUES (@playlist_id, @song_id, @position)', 
            {
                ['@playlist_id'] = playlistId,
                ['@song_id'] = songId,
                ['@position'] = position
            }
        )
        
        cb(result ~= nil)
    end)
    
    
    ESX.RegisterServerCallback('bit-smartphone:music:toggleFavorite', function(source, cb, songId, isFavorite)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb(false) end
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_music_songs SET is_favorite = @is_favorite WHERE id = @id AND user = @user', 
            {
                ['@id'] = songId,
                ['@is_favorite'] = isFavorite and 1 or 0,
                ['@user'] = xPlayer.identifier
            }
        )
        
        cb(result ~= nil)
    end)
    
    
    ESX.RegisterServerCallback('bit-smartphone:music:recordPlay', function(source, cb, songId)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb(false) end
        
        local identifier = xPlayer.identifier
        
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_music_songs SET play_count = play_count + 1, last_played = NOW() WHERE id = @id AND user = @user', 
            {['@id'] = songId, ['@user'] = identifier}
        )
        
        
        SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_phone_music_recent_plays (user, song_id) VALUES (@user, @song_id)', 
            {['@user'] = identifier, ['@song_id'] = songId}
        )
        
        
        SqlFunc(Config.Mysql, 'execute', 
            [[DELETE FROM bit_phone_music_recent_plays 
              WHERE user = @user AND id NOT IN 
              (SELECT * FROM (SELECT id FROM bit_phone_music_recent_plays WHERE user = @user ORDER BY played_at DESC LIMIT 100) t)]], 
            {['@user'] = identifier}
        )
        
        cb(true)
    end)
    
    
    ESX.RegisterServerCallback('bit-smartphone:music:deletePlaylist', function(source, cb, playlistId)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb(false) end
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'DELETE FROM bit_phone_music_playlists WHERE id = @id AND user = @user', 
            {['@id'] = playlistId, ['@user'] = xPlayer.identifier}
        )
        
        cb(result ~= nil)
    end)
    
    
    ESX.RegisterServerCallback('bit-smartphone:music:deleteSong', function(source, cb, songId)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb(false) end
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'DELETE FROM bit_phone_music_songs WHERE id = @id AND user = @user', 
            {['@id'] = songId, ['@user'] = xPlayer.identifier}
        )
        
        cb(result ~= nil)
    end)
    
    
    ESX.RegisterServerCallback('bit-smartphone:music:removeSongFromPlaylist', function(source, cb, playlistId, songId)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return cb(false) end
        
        
        local playlist = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT id FROM bit_phone_music_playlists WHERE id = @id AND user = @user', 
            {['@id'] = playlistId, ['@user'] = xPlayer.identifier}
        )
        
        if not playlist[1] then return cb(false) end
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'DELETE FROM bit_phone_music_playlist_songs WHERE playlist_id = @playlist_id AND song_id = @song_id', 
            {['@playlist_id'] = playlistId, ['@song_id'] = songId}
        )
        
        cb(result ~= nil)
    end)

elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:loadData', function(source, cb)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb({}) end
        
        local identifier = Player.PlayerData.citizenid
        
        
        local playlists = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT * FROM bit_phone_music_playlists WHERE user = @user ORDER BY created_at DESC', 
            {['@user'] = identifier}
        )
        
        
        local songs = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT * FROM bit_phone_music_songs WHERE user = @user ORDER BY added_at DESC', 
            {['@user'] = identifier}
        )
        
        
        local favorites = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT * FROM bit_phone_music_songs WHERE user = @user AND is_favorite = 1 ORDER BY added_at DESC', 
            {['@user'] = identifier}
        )
        
        
        local recentPlays = SqlFunc(Config.Mysql, 'fetchAll', 
            [[SELECT s.*, r.played_at FROM bit_phone_music_recent_plays r 
              JOIN bit_music_songs s ON r.song_id = s.id 
              WHERE r.user = @user 
              ORDER BY r.played_at DESC LIMIT 50]], 
            {['@user'] = identifier}
        )
        
        
        local playlistSongs = {}
        for _, playlist in ipairs(playlists) do
            local songs_in_playlist = SqlFunc(Config.Mysql, 'fetchAll', 
                [[SELECT s.*, ps.position FROM bit_phone_music_playlist_songs ps 
                  JOIN bit_music_songs s ON ps.song_id = s.id 
                  WHERE ps.playlist_id = @playlist_id 
                  ORDER BY ps.position ASC]], 
                {['@playlist_id'] = playlist.id}
            )
            playlistSongs[playlist.id] = songs_in_playlist
        end
        
        cb({
            playlists = playlists,
            songs = songs,
            favorites = favorites,
            recentPlays = recentPlays,
            playlistSongs = playlistSongs
        })
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:createPlaylist', function(source, cb, name, description, coverImage)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb(false) end
        
        local identifier = Player.PlayerData.citizenid
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_music_playlists (user, name, description, cover_image) VALUES (@user, @name, @description, @cover)', 
            {
                ['@user'] = identifier,
                ['@name'] = name,
                ['@description'] = description or '',
                ['@cover'] = coverImage or ''
            }
        )
        
        cb(result and result.insertId or false)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:addSong', function(source, cb, songData)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb(false) end
        
        local identifier = Player.PlayerData.citizenid
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            [[INSERT INTO bit_music_songs (user, title, artist, album, duration, file_url, cover_image, genre, year) 
              VALUES (@user, @title, @artist, @album, @duration, @file_url, @cover_image, @genre, @year)]], 
            {
                ['@user'] = identifier,
                ['@title'] = songData.title,
                ['@artist'] = songData.artist,
                ['@album'] = songData.album or '',
                ['@duration'] = songData.duration,
                ['@file_url'] = songData.file_url,
                ['@cover_image'] = songData.cover_image or '',
                ['@genre'] = songData.genre or '',
                ['@year'] = songData.year or nil
            }
        )
        
        cb(result and result.insertId or false)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:addSongToPlaylist', function(source, cb, playlistId, songId)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb(false) end
        
        local playlist = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT id FROM bit_music_playlists WHERE id = @id AND user = @user', 
            {['@id'] = playlistId, ['@user'] = Player.PlayerData.citizenid}
        )
        
        if not playlist[1] then return cb(false) end
        
        local nextPosition = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM bit_music_playlist_songs WHERE playlist_id = @playlist_id', 
            {['@playlist_id'] = playlistId}
        )
        
        local position = nextPosition[1].next_pos
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_music_playlist_songs (playlist_id, song_id, position) VALUES (@playlist_id, @song_id, @position)', 
            {
                ['@playlist_id'] = playlistId,
                ['@song_id'] = songId,
                ['@position'] = position
            }
        )
        
        cb(result ~= nil)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:toggleFavorite', function(source, cb, songId, isFavorite)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb(false) end
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_music_songs SET is_favorite = @is_favorite WHERE id = @id AND user = @user', 
            {
                ['@id'] = songId,
                ['@is_favorite'] = isFavorite and 1 or 0,
                ['@user'] = Player.PlayerData.citizenid
            }
        )
        
        cb(result ~= nil)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:recordPlay', function(source, cb, songId)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb(false) end
        
        local identifier = Player.PlayerData.citizenid
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_music_songs SET play_count = play_count + 1, last_played = NOW() WHERE id = @id AND user = @user', 
            {['@id'] = songId, ['@user'] = identifier}
        )
        
        SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_phone_music_recent_plays (user, song_id) VALUES (@user, @song_id)', 
            {['@user'] = identifier, ['@song_id'] = songId}
        )
        
        SqlFunc(Config.Mysql, 'execute', 
            [[DELETE FROM bit_phone_music_recent_plays 
              WHERE user = @user AND id NOT IN 
              (SELECT * FROM (SELECT id FROM bit_phone_music_recent_plays WHERE user = @user ORDER BY played_at DESC LIMIT 100) t)]], 
            {['@user'] = identifier}
        )
        
        cb(true)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:deletePlaylist', function(source, cb, playlistId)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb(false) end
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'DELETE FROM bit_music_playlists WHERE id = @id AND user = @user', 
            {['@id'] = playlistId, ['@user'] = Player.PlayerData.citizenid}
        )
        
        cb(result ~= nil)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:deleteSong', function(source, cb, songId)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb(false) end
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'DELETE FROM bit_music_songs WHERE id = @id AND user = @user', 
            {['@id'] = songId, ['@user'] = Player.PlayerData.citizenid}
        )
        
        cb(result ~= nil)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:music:removeSongFromPlaylist', function(source, cb, playlistId, songId)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return cb(false) end
        
        local playlist = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT id FROM bit_music_playlists WHERE id = @id AND user = @user', 
            {['@id'] = playlistId, ['@user'] = Player.PlayerData.citizenid}
        )
        
        if not playlist[1] then return cb(false) end
        
        local result = SqlFunc(Config.Mysql, 'execute', 
            'DELETE FROM bit_music_playlist_songs WHERE playlist_id = @playlist_id AND song_id = @song_id', 
            {['@playlist_id'] = playlistId, ['@song_id'] = songId}
        )
        
        cb(result ~= nil)
    end)
end
