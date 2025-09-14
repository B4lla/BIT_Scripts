local currentMusic = {
    name = nil,
    url = nil,
    isPlaying = false,
    volume = 0.5,
    duration = 0,
    position = 0
}

local function GenerateSoundName()
    return "bit_music_" .. GetPlayerServerId(PlayerId()) .. "_" .. math.random(1000, 9999)
end

RegisterNUICallback('music:play', function(data, cb)
    local songData = data.songData
    
    if not songData or not songData.file_url then
        cb({ success = false, error = "No URL provided" })
        return
    end
    
    if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
        exports.xsound:Destroy(currentMusic.name)
    end
    
    currentMusic.name = GenerateSoundName()
    currentMusic.url = songData.file_url
    currentMusic.isPlaying = true
    currentMusic.volume = data.volume or 0.5
    
    exports.xsound:PlayUrl(currentMusic.name, songData.file_url, currentMusic.volume, false, {
        onPlayStart = function()
            print("Música iniciada: " .. songData.title)
        end,
        onPlayEnd = function()
            currentMusic.isPlaying = false
            SendNUIMessage({
                type = "musicEnded",
                data = {}
            })
        end,
        onPlayPause = function()
            currentMusic.isPlaying = false
        end,
        onPlayResume = function()
            currentMusic.isPlaying = true
        end
    })
    
    cb({ success = true })
end)

RegisterNUICallback('music:pause', function(data, cb)
    if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
        exports.xsound:Pause(currentMusic.name)
        currentMusic.isPlaying = false
        cb({ success = true })
    else
        cb({ success = false, error = "No music playing" })
    end
end)

RegisterNUICallback('music:resume', function(data, cb)
    if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
        exports.xsound:Resume(currentMusic.name)
        currentMusic.isPlaying = true
        cb({ success = true })
    else
        cb({ success = false, error = "No music to resume" })
    end
end)

RegisterNUICallback('music:stop', function(data, cb)
    if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
        exports.xsound:Destroy(currentMusic.name)
        currentMusic.isPlaying = false
        currentMusic.name = nil
        currentMusic.url = nil
        cb({ success = true })
    else
        cb({ success = false, error = "No music playing" })
    end
end)

RegisterNUICallback('music:setVolume', function(data, cb)
    local volume = math.max(0.0, math.min(1.0, (data.volume or 50) / 100))
    
    if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
        exports.xsound:setVolume(currentMusic.name, volume)
        currentMusic.volume = volume
        cb({ success = true })
    else
        cb({ success = false, error = "No music playing" })
    end
end)

RegisterNUICallback('music:setPosition', function(data, cb)
    local position = data.position or 0
    
    if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
        exports.xsound:setTimeStamp(currentMusic.name, position)
        currentMusic.position = position
        cb({ success = true })
    else
        cb({ success = false, error = "No music playing" })
    end
end)

RegisterNUICallback('music:getInfo', function(data, cb)
    if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
        local info = exports.xsound:getInfo(currentMusic.name)
        cb({
            success = true,
            data = {
                isPlaying = info.playing or false,
                isPaused = info.paused or false,
                volume = info.volume or 0,
                position = info.timeStamp or 0,
                duration = info.maxDuration or 0,
                url = info.url or ""
            }
        })
    else
        cb({
            success = true,
            data = {
                isPlaying = false,
                isPaused = false,
                volume = 0,
                position = 0,
                duration = 0,
                url = ""
            }
        })
    end
end)

CreateThread(function()
    while true do
        if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
            local info = exports.xsound:getInfo(currentMusic.name)
            if info then
                SendNUIMessage({
                    type = "musicUpdate",
                    data = {
                        isPlaying = info.playing or false,
                        isPaused = info.paused or false,
                        volume = info.volume or 0,
                        position = info.timeStamp or 0,
                        duration = info.maxDuration or 0
                    }
                })
            end
        end
        Wait(1000) 
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        if currentMusic.name and exports.xsound:soundExists(currentMusic.name) then
            exports.xsound:Destroy(currentMusic.name)
        end
    end
end)

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
