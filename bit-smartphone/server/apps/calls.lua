local activeCalls = {}
local callIdCounter = 0

local function GetPlayerIdentifier(source)
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier or nil
    else
        local Player = QBCore.Functions.GetPlayer(source)
        return Player and Player.PlayerData.citizenid or nil
    end
end

local function GetPlayerProfile(identifier)
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', "SELECT profile_name AS name, profile_picture, phone_number FROM bit_phone WHERE user = ? LIMIT 1", {identifier})
    local row = result and result[1]
    if not row then
        return { name = "Desconocido", profile_picture = "default-avatar.jpg", phoneNumber = "" }
    end
    return {
        name = (row.name and row.name ~= "") and row.name or "Desconocido",
        profile_picture = (row.profile_picture and row.profile_picture ~= "") and row.profile_picture or "default-avatar.jpg",
        phoneNumber = row.phone_number or ""
    }
end

local function GetContactName(userIdentifier, phoneNumber)
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', "SELECT name FROM bit_phone_contacts WHERE user = ? AND number = ? LIMIT 1", {userIdentifier, phoneNumber})
    if result and result[1] and result[1].name then
        return result[1].name
    end
    return nil
end

local function GetPlayerByIdentifier(identifier)
    for _, playerId in ipairs(GetPlayers()) do
        if GetPlayerIdentifier(playerId) == identifier then
            return tonumber(playerId)
        end
    end
    return nil
end

local function GetPlayerByPhoneNumber(phoneNumber)
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', "SELECT user FROM bit_phone WHERE phone_number = ?", {phoneNumber})
    if result and result[1] then
        local identifier = result[1].user
        
        local playerId = GetPlayerByIdentifier(identifier)
        return playerId, identifier
    end
    return nil, nil
end

local function GenerateCallId()
    callIdCounter = callIdCounter + 1
    return "call_" .. callIdCounter .. "_" .. os.time()
end


RegisterNetEvent('phone:getContacts')
AddEventHandler('phone:getContacts', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    local contacts = SqlFunc(Config.Mysql, 'fetchAll', "SELECT * FROM bit_phone_contacts WHERE user = ?", { identifier })
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'contacts:loaded',
        data = { success = true, contacts = contacts }
    })
end)


RegisterNetEvent('phone:addContact')
AddEventHandler('phone:addContact', function(data)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier or not data.name or not data.number then return end
    
    local success = SqlFunc(Config.Mysql, 'execute',"INSERT INTO bit_phone_contacts (user, name, number, notes, favorite) VALUES (?, ?, ?, ?, ?)", {
        identifier,
        data.name,
        data.number,
        data.notes or "",
        data.favorite or false
    })
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'contact:added',
        data = { success = success }
    })
end)

RegisterNetEvent('phone:updateContact')
AddEventHandler('phone:updateContact', function(data)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier or not data.id then return end
    
    local success = SqlFunc(Config.Mysql, 'execute',"UPDATE bit_phone_contacts SET name = ?, number = ?, updated_at = NOW() WHERE id = ? AND user = ?", {
        data.name,
        data.number,
        data.id,
        identifier
    })
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'contact:updated',
        data = { success = success }
    })
end)

RegisterNetEvent('phone:updateContactNotes')
AddEventHandler('phone:updateContactNotes', function(data)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier or not data.id then return end
    
    local success = SqlFunc(Config.Mysql, 'execute',"UPDATE bit_phone_contacts SET notes = ?, updated_at = NOW() WHERE id = ? AND user = ?", {
        data.notes,
        data.id,
        identifier
    })
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'contact:notes_updated',
        data = { success = success }
    })
end)

RegisterNetEvent('phone:toggleFavorite')
AddEventHandler('phone:toggleFavorite', function(data)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier or not data.id then return end
    
    local success = SqlFunc(Config.Mysql, 'execute',"UPDATE bit_phone_contacts SET favorite = ?, updated_at = NOW() WHERE id = ? AND user = ?", {
        data.favorite,
        data.id,
        identifier
    })
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'contact:favorite_toggled',
        data = { success = success }
    })
end)

RegisterNetEvent('phone:toggleBlock')
AddEventHandler('phone:toggleBlock', function(data)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier or not data.id then return end
    
    local success = SqlFunc(Config.Mysql, 'execute',"UPDATE bit_phone_contacts SET blocked = ?, updated_at = NOW() WHERE id = ? AND user = ?", {
        data.blocked,
        data.id,
        identifier
    })
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'contact:block_toggled',
        data = { success = success }
    })
end)

RegisterNetEvent('phone:deleteContact')
AddEventHandler('phone:deleteContact', function(data)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier or not data.id then return end
    
    local success = SqlFunc(Config.Mysql, 'execute',"DELETE FROM bit_phone_contacts WHERE id = ? AND user = ?", {
        data.id,
        identifier
    })
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'contact:deleted',
        data = { success = success }
    })
end)

RegisterNetEvent('phone:getRecentCalls')
AddEventHandler('phone:getRecentCalls', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then return end
    
    local calls = SqlFunc(Config.Mysql, 'fetchAll',"SELECT * FROM bit_phone_call_history WHERE user = ? ORDER BY call_time DESC LIMIT 50", {identifier})
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'recents:loaded',
        data = { success = true, calls = calls }
    })
end)

RegisterNetEvent('phone:getVoicemails')
AddEventHandler('phone:getVoicemails', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then return end
    
    local voicemails = SqlFunc(Config.Mysql, 'fetchAll', "SELECT * FROM bit_phone_voicemails WHERE user = ? ORDER BY created_at DESC", {identifier})
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'voicemails:loaded',
        data = { success = true, voicemails = voicemails }
    })
end)

RegisterNetEvent('phone:getBlockedNumbers')
AddEventHandler('phone:getBlockedNumbers', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then return end
    
    local blocked = SqlFunc(Config.Mysql, 'fetchAll', "SELECT * FROM bit_phone_blocked_numbers WHERE user = ?", {identifier})
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'blocked:loaded',
        data = { success = true, blocked = blocked }
    })
end)

RegisterNetEvent('call:start')
AddEventHandler('call:start', function(data)
    local source = source
    
    local callerIdentifier = GetPlayerIdentifier(source)
    local targetPhoneNumber = data.targetId
    local callType = data.type or 'audio'
    
    if not callerIdentifier or not targetPhoneNumber then return end
    
    
    local targetSource, targetIdentifier = GetPlayerByPhoneNumber(targetPhoneNumber)
    if not targetSource or not targetIdentifier then
        TriggerClientEvent('phone:sendNUIMessage', source, {
            action = 'call:failed',
            data = { reason = 'Usuario no disponible' }
        })
        return
    end
    
    
    local callId = GenerateCallId()
    local callerProfile = GetPlayerProfile(callerIdentifier)
    local targetProfile = GetPlayerProfile(targetIdentifier)
    
    
    local callerContactName = GetContactName(targetIdentifier, callerProfile.phoneNumber)
    local targetContactName = GetContactName(callerIdentifier, targetProfile.phoneNumber)
    
    local callData = {
        id = callId,
        caller = callerIdentifier,
        target = targetIdentifier,
        type = callType,
        status = 'ringing',
        startTime = os.time(),
        callerSource = source,
        targetSource = targetSource
    }
    
    callData.callerName = callerContactName or callerProfile.name
    callData.targetName = targetContactName or targetProfile.name
    callData.callerNumber = callerProfile.phoneNumber or ''
    callData.targetNumber = targetProfile.phoneNumber or ''
    
    activeCalls[callId] = callData
    
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'call:outgoing',
        data = {
            id = callId,
            name = targetContactName or targetProfile.name,
            avatar = targetProfile.profile_picture ~= "" and targetProfile.profile_picture or "default-avatar.jpg",
            type = callType,
            direction = 'outgoing',
            targetId = targetIdentifier
        }
    })
    
    TriggerClientEvent('phone:sendNUIMessage', targetSource, {
        action = 'call:incoming', 
        data = {
            id = callId,
            name = callerContactName or callerProfile.name,
            avatar = callerProfile.profile_picture ~= "" and callerProfile.profile_picture or "default-avatar.jpg",
            type = callType,
            direction = 'incoming',
            targetId = callerIdentifier
        }
    })
    
    SetTimeout(30000, function()
        if activeCalls[callId] and activeCalls[callId].status == 'ringing' then
            TriggerClientEvent('phone:sendNUIMessage', source, {
                action = 'call:timeout',
                data = { callId = callId }
            })
            TriggerClientEvent('phone:sendNUIMessage', targetSource, {
                action = 'call:timeout', 
                data = { callId = callId }
            })
            activeCalls[callId] = nil
        end
    end)
end)

RegisterNetEvent('call:signaling')
AddEventHandler('call:signaling', function(data)
    local source = source
    local callId = data.callId
    local messageType = data.type
    local messageData = data.data
    local targetIdentifier = data.targetId

    if messageData then
    end

    if not activeCalls[callId] then
        return
    end
    
    local call = activeCalls[callId]
    local targetSource = GetPlayerByIdentifier(targetIdentifier)
    
    if not targetSource then return end
    
    if messageType == 'call-accepted' then
        call.status = 'connected'
        call.connectTime = os.time()

        
        TriggerClientEvent('phone:sendNUIMessage', call.callerSource, {
            action = 'call:connected',
            data = { callId = callId }
        })
        
        TriggerClientEvent('phone:sendNUIMessage', call.targetSource, {
            action = 'call:connected',
            data = { callId = callId }
        })

        
        if call.type == 'audio' and Config.VoiceCalls.enabled and Config.VoiceCalls.provider == 'pma-voice' then
            TriggerClientEvent('bit-smartphone:client:addPlayerToCall', call.callerSource, callId)
            TriggerClientEvent('bit-smartphone:client:addPlayerToCall', call.targetSource, callId)
        elseif call.type == 'audio' and Config.VoiceCalls.enabled and Config.VoiceCalls.provider == 'saltychat' then
            
            local callChannel = 'call_' .. callId
            exports['saltychat']:SetPlayerRadioSpeaker(call.callerSource, true)
            exports['saltychat']:SetPlayerRadioSpeaker(call.targetSource, true)
            exports['saltychat']:SetPlayerRadioChannel(call.callerSource, callChannel, true)
            exports['saltychat']:SetPlayerRadioChannel(call.targetSource, callChannel, true)
        end
        
    elseif messageType == 'call-rejected' or messageType == 'call-ended' then
        if call.status == 'connected' then

        if call.type == 'audio' and Config.VoiceCalls.enabled and Config.VoiceCalls.provider == 'pma-voice' then
            TriggerClientEvent('bit-smartphone:client:removePlayerFromCall', call.callerSource, callId)
            TriggerClientEvent('bit-smartphone:client:removePlayerFromCall', call.targetSource, callId)
        elseif call.type == 'audio' and Config.VoiceCalls.enabled and Config.VoiceCalls.provider == 'saltychat' then
            local callChannel = 'call_' .. callId
            exports['saltychat']:SetPlayerRadioSpeaker(call.callerSource, false)
            exports['saltychat']:SetPlayerRadioSpeaker(call.targetSource, false)
            exports['saltychat']:RemovePlayerRadioChannel(call.callerSource, callChannel)
            exports['saltychat']:RemovePlayerRadioChannel(call.targetSource, callChannel)
        end
            if Config.VoiceCalls.recordCalls then
                local duration = os.time() - call.connectTime
                local callTimeFormatted = os.date('%Y-%m-%d %H:%M:%S', os.time())
                
                SqlFunc(Config.Mysql, 'execute',
                    'INSERT INTO bit_phone_call_history (user, contact_name, number, call_type, type, duration, call_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
                    call.caller, call.targetName or '', call.targetNumber or '', call.type, 'outgoing', duration, callTimeFormatted, 'completed'
                })
                
                SqlFunc(Config.Mysql, 'execute',
                    'INSERT INTO bit_phone_call_history (user, contact_name, number, call_type, type, duration, call_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
                    call.target, call.callerName or '', call.callerNumber or '', call.type, 'incoming', duration, callTimeFormatted, 'completed'
                })
            end
        end
        activeCalls[callId] = nil
    elseif messageType == 'webrtc-offer' or messageType == 'webrtc-answer' or messageType == 'webrtc-ice-candidate' then
        TriggerClientEvent('phone:sendNUIMessage', targetSource, {
            action = 'call:signaling',
            data = {
                callId = callId,
                type = messageType,
                data = messageData
            }
        })
        return 
    end
    
    TriggerClientEvent('phone:sendNUIMessage', targetSource, {
        action = 'call:signaling',
        data = {
            callId = callId,
            type = messageType,
            data = messageData
        }
    })
end)

RegisterNetEvent('call:end')
AddEventHandler('call:end', function(data)
    local source = source
    local callId = data.callId
    
    if not activeCalls[callId] then return end
    
    local call = activeCalls[callId]
    
    if call.status == 'connected' then
        
        if call.type == 'audio' and Config.VoiceCalls.enabled then
            if Config.VoiceCalls.provider == 'pma-voice' then
                
                exports['pma-voice']:removePlayerFromCall(call.callerSource, callId)
                exports['pma-voice']:removePlayerFromCall(call.targetSource, callId)
            elseif Config.VoiceCalls.provider == 'saltychat' then
                local callChannel = 'call_' .. callId
                exports['saltychat']:SetPlayerRadioSpeaker(call.callerSource, false)
                exports['saltychat']:SetPlayerRadioSpeaker(call.targetSource, false)
                exports['saltychat']:RemovePlayerRadioChannel(call.callerSource, callChannel)
                exports['saltychat']:RemovePlayerRadioChannel(call.targetSource, callChannel)
            end
        end
        
        
            if Config.VoiceCalls.recordCalls then
                local duration = os.time() - call.connectTime
                local callTimeFormatted = os.date('%Y-%m-%d %H:%M:%S', os.time())
                SqlFunc(Config.Mysql, 'execute',
                    'INSERT INTO bit_phone_call_history (user, contact_name, number, call_type, type, duration, call_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
                    call.caller, call.targetName or '', call.targetNumber or '', call.type, 'outgoing', duration, callTimeFormatted, 'completed'
                })
                SqlFunc(Config.Mysql, 'execute',
                    'INSERT INTO bit_phone_call_history (user, contact_name, number, call_type, type, duration, call_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
                    call.target, call.callerName or '', call.callerNumber or '', call.type, 'incoming', duration, callTimeFormatted, 'completed'
                })
            end
    end
    
    local otherSource = (source == call.callerSource) and call.targetSource or call.callerSource
    if otherSource then
        TriggerClientEvent('phone:sendNUIMessage', otherSource, {
            action = 'call:ended',
            data = { callId = callId }
        })
    end
    
    activeCalls[callId] = nil
end)

AddEventHandler('playerDropped', function(reason)
    local source = source
    
    for callId, call in pairs(activeCalls) do
        if call.callerSource == source or call.targetSource == source then
            local otherSource = (call.callerSource == source) and call.targetSource or call.callerSource
            
            if call.status == 'connected' then
                if Config.VoiceCalls.provider == 'pma-voice' then
                    
                    exports['pma-voice']:removePlayerFromCall(call.callerSource, callId)
                    exports['pma-voice']:removePlayerFromCall(call.targetSource, callId)
                elseif Config.VoiceCalls.provider == 'saltychat' then
                    local callChannel = 'call_' .. callId
                    exports['saltychat']:SetPlayerRadioSpeaker(call.callerSource, false)
                    exports['saltychat']:SetPlayerRadioSpeaker(call.targetSource, false)
                    exports['saltychat']:RemovePlayerRadioChannel(call.callerSource, callChannel)
                    exports['saltychat']:RemovePlayerRadioChannel(call.targetSource, callChannel)
                end
            end
            
            if otherSource then
                TriggerClientEvent('phone:sendNUIMessage', otherSource, {
                    action = 'call:ended',
                    data = { callId = callId, reason = 'disconnected' }
                })
            end
            
            activeCalls[callId] = nil
        end
    end
end)






RegisterNetEvent('bit-smartphone:getUserProfile')
AddEventHandler('bit-smartphone:getUserProfile', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    
    print('[bit-smartphone] [PROFILE DEBUG] getUserProfile llamado para source:', src)
    print('[bit-smartphone] [PROFILE DEBUG] identifier:', identifier)
    
    if not identifier then 
        print('[bit-smartphone] [PROFILE DEBUG] No se pudo obtener identifier')
        return 
    end
    
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', "SELECT profile_name, phone_number FROM bit_phone WHERE user = ?", {identifier})
    print('[bit-smartphone] [PROFILE DEBUG] Resultado BD:', json.encode(result))
    
    local profile = result[1]
    
    if profile then
        local profileData = {
            name = profile.profile_name or "Usuario",
            phoneNumber = profile.phone_number or "000-000-0000",
            avatar = "👤"
        }
        
        print('[bit-smartphone] [PROFILE DEBUG] Enviando perfil:', json.encode(profileData))
        
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
            action = 'userProfile:loaded',
            data = { profile = profileData }
        })
    else
        print('[bit-smartphone] [PROFILE DEBUG] No se encontró perfil, creando uno nuevo')
        
        
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
            action = 'userProfile:loaded',
            data = { 
                profile = {
                    name = "Usuario",
                    phoneNumber = "000-000-0000",
                    avatar = "👤"
                }
            }
        })
    end
end)


RegisterNetEvent('bit-smartphone:getNearbyPlayers')
AddEventHandler('bit-smartphone:getNearbyPlayers', function()
    local src = source
    local playerCoords = GetEntityCoords(GetPlayerPed(src))
    local nearbyPlayers = {}
    
    for _, playerId in ipairs(GetPlayers()) do
        local targetPlayerId = tonumber(playerId)
        
        if targetPlayerId and targetPlayerId ~= src then
            local targetCoords = GetEntityCoords(GetPlayerPed(targetPlayerId))
            local distance = #(playerCoords - targetCoords)
            
            
            if distance <= 10.0 then
                local targetIdentifier = GetPlayerIdentifier(targetPlayerId)
                local playerName = GetPlayerName(targetPlayerId)
                
                table.insert(nearbyPlayers, {
                    id = targetPlayerId,
                    name = playerName,
                    distance = math.floor(distance)
                })
            end
        end
    end
    
    TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
        action = 'nearbyPlayers:loaded',
        data = { players = nearbyPlayers }
    })
end)


RegisterNetEvent('bit-smartphone:sendAirDrop')
AddEventHandler('bit-smartphone:sendAirDrop', function(data)
    local src = source
    local targetPlayerId = tonumber(data.targetPlayerId)
    local phoneNumber = data.phoneNumber
    local userName = data.userName
    
    if not targetPlayerId or not phoneNumber or not userName then
        return
    end
    
    
    if GetPlayerPed(targetPlayerId) == 0 then
        return
    end
    
    
    local playerCoords = GetEntityCoords(GetPlayerPed(src))
    local targetCoords = GetEntityCoords(GetPlayerPed(targetPlayerId))
    local distance = #(playerCoords - targetCoords)
    
    if distance > 10.0 then
        return
    end
    
    
    local targetPlayerName = GetPlayerName(targetPlayerId)
    
    
    TriggerClientEvent('bit-smartphone:client:sendNuiMessage', targetPlayerId, {
        action = 'airdrop:received',
        data = {
            from = userName,
            phoneNumber = phoneNumber,
            message = string.format("%s te ha compartido su número: %s", userName, phoneNumber)
        }
    })
    
    
    TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
        action = 'airdrop:sent',
        data = { 
            success = true, 
            playerName = targetPlayerName
        }
    })
end)


RegisterNetEvent('bit-smartphone:phone:saveContact')
AddEventHandler('bit-smartphone:phone:saveContact', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    
    print('[bit-smartphone] [PHONE DEBUG] saveContact event received from source:', src)
    print('[bit-smartphone] [PHONE DEBUG] identifier:', identifier)
    print('[bit-smartphone] [PHONE DEBUG] data received:', json.encode(data))
    
    if not identifier or not data.name or not data.number then 
        print('[bit-smartphone] [PHONE DEBUG] Missing required data - identifier:', identifier, 'name:', data.name, 'number:', data.number)
        return 
    end
    
    print('[bit-smartphone] [PHONE DEBUG] Guardando contacto:', data.name, data.number)
    
    
    local result = SqlFunc(Config.Mysql, 'execute', 
        "INSERT INTO bit_phone_contacts (user, name, number, favorite, blocked, notes) VALUES (?, ?, ?, 0, 0, '')", 
        {identifier, data.name, data.number})
    
    print('[bit-smartphone] [PHONE DEBUG] SQL result:', result)
    
    if result then
        print('[bit-smartphone] [PHONE DEBUG] Contacto guardado exitosamente')
        
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
            action = 'contact:saved',
            data = { success = true }
        })
        
        local response = { success = true }
        if data and data.requestId then response.requestId = data.requestId end
        TriggerClientEvent('bit-smartphone:phone:saveContactResult', src, response)

        
        TriggerEvent('bit-smartphone:phone:getContacts', src)
    else
        print('[bit-smartphone] [PHONE DEBUG] Error al guardar contacto')
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
            action = 'contact:saved',
            data = { success = false, error = "Error al guardar contacto" }
        })
        local response = { success = false, message = 'db_error' }
        if data and data.requestId then response.requestId = data.requestId end
        TriggerClientEvent('bit-smartphone:phone:saveContactResult', src, response)
    end
end)

RegisterNetEvent('bit-smartphone:phone:getContacts')
AddEventHandler('bit-smartphone:phone:getContacts', function(src)
    local source = src or source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then return end
    
    print('[bit-smartphone] [PHONE DEBUG] Obteniendo contactos para:', identifier)
    
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', 
        "SELECT id, name, number, favorite, blocked, notes FROM bit_phone_contacts WHERE user = ? ORDER BY name ASC", 
        {identifier})
    
    local contacts = result or {}
    
    print('[bit-smartphone] [PHONE DEBUG] Contactos encontrados:', #contacts)
    
    TriggerClientEvent('bit-smartphone:client:sendNuiMessage', source, {
        action = 'contacts:loaded',
        data = { contacts = contacts }
    })
end)
