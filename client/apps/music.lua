




RegisterNUICallback('music:loadData', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:loadData', function(musicData)
            cb({
                success = true,
                data = musicData
            })
        end)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:loadData', function(musicData)
            cb({
                success = true,
                data = musicData
            })
        end)
    end
end)


RegisterNUICallback('music:createPlaylist', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:createPlaylist', function(playlistId)
            cb({
                success = playlistId ~= false,
                playlistId = playlistId
            })
        end, data.name, data.description, data.coverImage)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:createPlaylist', function(playlistId)
            cb({
                success = playlistId ~= false,
                playlistId = playlistId
            })
        end, data.name, data.description, data.coverImage)
    end
end)


RegisterNUICallback('music:addSong', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:addSong', function(songId)
            cb({
                success = songId ~= false,
                songId = songId
            })
        end, data.songData)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:addSong', function(songId)
            cb({
                success = songId ~= false,
                songId = songId
            })
        end, data.songData)
    end
end)


RegisterNUICallback('music:addSongToPlaylist', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:addSongToPlaylist', function(success)
            cb({
                success = success
            })
        end, data.playlistId, data.songId)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:addSongToPlaylist', function(success)
            cb({
                success = success
            })
        end, data.playlistId, data.songId)
    end
end)


RegisterNUICallback('music:toggleFavorite', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:toggleFavorite', function(success)
            cb({
                success = success
            })
        end, data.songId, data.isFavorite)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:toggleFavorite', function(success)
            cb({
                success = success
            })
        end, data.songId, data.isFavorite)
    end
end)


RegisterNUICallback('music:recordPlay', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:recordPlay', function(success)
            cb({
                success = success
            })
        end, data.songId)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:recordPlay', function(success)
            cb({
                success = success
            })
        end, data.songId)
    end
end)


RegisterNUICallback('music:deletePlaylist', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:deletePlaylist', function(success)
            cb({
                success = success
            })
        end, data.playlistId)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:deletePlaylist', function(success)
            cb({
                success = success
            })
        end, data.playlistId)
    end
end)


RegisterNUICallback('music:deleteSong', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:deleteSong', function(success)
            cb({
                success = success
            })
        end, data.songId)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:deleteSong', function(success)
            cb({
                success = success
            })
        end, data.songId)
    end
end)


RegisterNUICallback('music:removeSongFromPlaylist', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:music:removeSongFromPlaylist', function(success)
            cb({
                success = success
            })
        end, data.playlistId, data.songId)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:music:removeSongFromPlaylist', function(success)
            cb({
                success = success
            })
        end, data.playlistId, data.songId)
    end
end)
