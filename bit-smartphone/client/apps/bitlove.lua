
RegisterNUICallback('bitlove:createProfile', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:createProfile', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:getProfile', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:getProfile')
    cb('ok')
end)

RegisterNUICallback('bitlove:getProfiles', function(data, cb)
    if not IsPhoneConnected() then
        cb({success = false, error = 'no_signal'})
        return
    end
    TriggerServerEvent('bit-smartphone:bitlove:getProfiles')
    cb('ok')
end)

RegisterNUICallback('bitlove:swipeProfile', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:swipeProfile', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:getMatches', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:getMatches')
    cb('ok')
end)

RegisterNUICallback('bitlove:getMyPhotos', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:getMyPhotos')
    cb('ok')
end)

RegisterNUICallback('bitlove:sendMessage', function(data, cb)
    if not IsPhoneConnected() then
        cb({success = false, error = 'no_signal'})
        return
    end
    TriggerServerEvent('bit-smartphone:bitlove:sendMessage', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:getMessages', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:getMessages', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:uploadPhoto', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:uploadPhoto', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:saveProfile', function(data, cb)
    TriggerServerEvent('bitlove:saveProfile', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:saveProfileFull', function(data, cb)
    TriggerServerEvent('bitlove:saveProfile', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:savePhotoMetadata', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:savePhotoMetadata', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:capturePhoto', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:capturePhoto', data.photoType, data.metadata)
    cb('ok')
end)

RegisterNUICallback('bitlove:savePhotoToProfile', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:savePhotoToProfile', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:takePhoto', function(data, cb)
    if GetResourceState('screenshot-basic') ~= 'started' then
        cb({success = false, error = 'screenshot-basic no disponible'})
        return
    end
    
    local timeoutTimer = nil
    local completed = false
    
    timeoutTimer = Citizen.SetTimeout(15000, function()
        if not completed then
            completed = true
            cb({success = false, error = 'Timeout al capturar la foto'})
        end
    end)
    
    exports['screenshot-basic']:requestScreenshotUpload(Config.DiscordWebhook, 'files[]', function(response)
        if completed then return end
        completed = true
        
        if timeoutTimer then
            Citizen.ClearTimeout(timeoutTimer)
        end
        
        local success = response and response ~= '' and string.len(response) > 10
        if success then
            if string.len(response) > 2000 then
                cb({success = false, error = 'URL de foto demasiado larga'})
                return
            end
            

            local photoId = 'bitlove_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)
            local photoData = {
                photoId = photoId,
                photoUrl = response,
                photoType = data.photoType or 'profile',
                timestamp = GetGameTimer()
            }
            
            local attempts = 0
            local maxAttempts = 3
            
            local function tryUpload()
                attempts = attempts + 1
                TriggerServerEvent('bit-smartphone:bitlove:savePhotoUrl', photoData)
                
                Citizen.SetTimeout(3000, function()
                    if attempts < maxAttempts then
                        print('[BitLove] Reintentando subida... (' .. attempts .. '/' .. maxAttempts .. ')')
                        tryUpload()
                    end
                end)
            end
            
            tryUpload()
            cb({success = true, photoUrl = response, photoId = photoId, timestamp = photoData.timestamp})
        else
            print('[BitLove] Error capturando foto: respuesta inválida')
            cb({success = false, error = 'Error al capturar la foto'})
        end
    end)
end)

RegisterNUICallback('bitlove:savePhoto', function(data, cb)
    if not data or not data.photoUrl or string.len(data.photoUrl) > 2000 then
        cb({success = false, error = 'Datos de foto inválidos'})
        return
    end
    
    local metadata = {
        photoId = data.photoId,
        photoUrl = data.photoUrl,
        metadata = data.metadata or {},
        timestamp = GetGameTimer()
    }
    
    TriggerServerEvent('bit-smartphone:bitlove:savePhotoMetadata', metadata)
    cb({success = true})
end)

RegisterNetEvent('bit-smartphone:bitloveResponse')
AddEventHandler('bit-smartphone:bitloveResponse', function(data)
    SendNUIMessage(data)
end)

RegisterNetEvent('phone:bitloveResponse')
AddEventHandler('phone:bitloveResponse', function(data)
    SendNUIMessage(data)
end)
