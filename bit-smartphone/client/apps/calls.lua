local isInCall = false
local currentCallId = nil
local activeCallData = nil
local lastCallStartTime = 0


RegisterNUICallback('makeCall', function(data, cb)
    if not data.targetId then
        cb('error')
        return
    end
    local now = GetGameTimer()
    if now - lastCallStartTime < 2000 then
        print('[CallSystem] Ignoring duplicate makeCall request (debounce)')
        cb('ok')
        return
    end
    lastCallStartTime = now

    TriggerServerEvent('call:start', {
        targetId = data.targetId,
        type = data.type or 'audio'
    })
    cb('ok')
end)

RegisterNUICallback('call:start', function(data, cb)
    if not IsPhoneConnected() then
        cb({success = false, error = 'no_signal'})
        return
    end
    
    if not data.targetId then
        cb('error')
        return
    end

    local now = GetGameTimer()
    if now - lastCallStartTime < 2000 then
        print('[CallSystem] Ignoring duplicate call:start request (debounce)')
        cb('ok')
        return
    end
    lastCallStartTime = now

    TriggerServerEvent('call:start', {
        targetId = data.targetId,
        type = data.type or 'audio'
    })
    cb('ok')
end)

RegisterNUICallback('call:signaling', function(data, cb)
    TriggerServerEvent('call:signaling', {
        callId = data.callId,
        type = data.type,
        data = data.data,
        targetId = data.targetId
    })
    cb('ok')
end)

RegisterNUICallback('call:end', function(data, cb)
    TriggerServerEvent('call:end', {
        callId = data.callId
    })

    isInCall = false
    currentCallId = nil
    activeCallData = nil

    cb('ok')
end)

RegisterNUICallback('call:accept', function(data, cb)
    print('[CallSystem] Call accepted:', json.encode(data))
    print('[CallSystem] Sending signaling with targetId:', data.targetId, 'callId:', data.callId)
    isInCall = true
    currentCallId = data.callId
    activeCallData = data

    TriggerServerEvent('call:signaling', {
        callId = data.callId,
        type = 'call-accepted',
        data = {},
        targetId = data.targetId
    })

    cb('ok')
end)

RegisterNUICallback('call:reject', function(data, cb)
    TriggerServerEvent('call:signaling', {
        callId = data.callId,
        type = 'call-rejected',
        data = {},
        targetId = data.targetId
    })

    cb('ok')
end)

RegisterNUICallback('call:mute', function(data, cb)
    if isInCall then
        if Config.VoiceCalls.provider == 'pma-voice' and exports['pma-voice'] then
            if data.muted then
                exports['pma-voice']:toggleMutePlayer(PlayerId(), true)
            else
                exports['pma-voice']:toggleMutePlayer(PlayerId(), false)
            end
        elseif Config.VoiceCalls.provider == 'saltychat' and exports['saltychat'] then
            exports['saltychat']:SetPlayerIsMuted(data.muted)
        end

        if currentCallId and activeCallData then
            TriggerServerEvent('call:signaling', {
                callId = currentCallId,
                type = 'mute-status',
                data = { muted = data.muted },
                targetId = activeCallData.targetId
            })
        end
    end
    cb('ok')
end)

RegisterNUICallback('call:speaker', function(data, cb)
    if isInCall and activeCallData then
        if Config.VoiceCalls.provider == 'pma-voice' and exports['pma-voice'] then
            if data.enabled then
                exports['pma-voice']:SetRadioVolume(0.8)
            else
                exports['pma-voice']:SetRadioVolume(0.5)
            end
        elseif Config.VoiceCalls.provider == 'saltychat' and exports['saltychat'] then
            exports['saltychat']:SetPlayerIsMuted(data.muted)
        end

        SendNUIMessage({
            action = 'call:speaker_changed',
            data = { enabled = data.enabled }
        })
    end
    cb('ok')
end)

RegisterNUICallback('call:volume', function(data, cb)
    if isInCall then
        if Config.VoiceCalls.provider == 'pma-voice' and exports['pma-voice'] then
            local volume = math.max(0.0, math.min(1.0, data.volume or 1.0))
            exports['pma-voice']:SetRadioVolume(volume)
        elseif Config.VoiceCalls.provider == 'saltychat' and exports['saltychat'] then
            local volume = math.max(0.0, math.min(1.0, data.volume or 1.0))
            exports['saltychat']:SetRadioVolume(volume)
        end
    end
    cb('ok')
end)

RegisterNetEvent('phone:webrtc:signaling')
AddEventHandler('phone:webrtc:signaling', function(data)
    print('[CallSystem] WebRTC signaling received:', json.encode(data))
    print('[CallSystem] Sending NUI message to frontend (webrtc signaling)')
    SendNUIMessage({
        action = 'call:signaling',
        data = data
    })
end)

RegisterNetEvent('phone:call:incoming')
AddEventHandler('phone:call:incoming', function(data)
    print('[CallSystem] Incoming call:', json.encode(data))
    print('[CallSystem] Sending NUI message to frontend (incoming call)')
    print('[CallSystem] incoming payload:', json.encode(data))
    SendNUIMessage({
        action = 'call:incoming',
        data = data
    })
end)

RegisterNetEvent('phone:call:outgoing') 
AddEventHandler('phone:call:outgoing', function(data)
    print('[CallSystem] Outgoing call:', json.encode(data))
    print('[CallSystem] Sending NUI message to frontend (outgoing call)')
    print('[CallSystem] outgoing payload:', json.encode(data))
    SendNUIMessage({
        action = 'call:outgoing',
        data = data
    })
end)

CreateThread(function()
    Wait(1000)
    if Config.VideoCalls and Config.VideoCalls.enabled then
        SendNUIMessage({
            action = 'phone:config',
            data = {
                videoCalls = Config.VideoCalls
            }
        })
    end
end)

AddEventHandler('phone:callCommand', function(targetId, callType)
    if not targetId then return end
    SendNUIMessage({
        action = 'call:start_from_command',
        data = {
            targetId = targetId,
            type = callType or 'audio'
        }
    })
end)

RegisterNetEvent('bit-smartphone:client:addPlayerToCall')
AddEventHandler('bit-smartphone:client:addPlayerToCall', function(callId)
    if Config.VoiceCalls.enabled and Config.VoiceCalls.provider == 'pma-voice' then
        if GetResourceState('pma-voice') == 'started' and exports['pma-voice'] then
            exports['pma-voice']:addPlayerToCall(callId)
            print('[CallSystem] Player added to call: ' .. callId)
        else
            print('[CallSystem] PMA-Voice not available')
        end
    end
end)

RegisterNetEvent('bit-smartphone:client:removePlayerFromCall')
AddEventHandler('bit-smartphone:client:removePlayerFromCall', function(callId)
    if Config.VoiceCalls.enabled and Config.VoiceCalls.provider == 'pma-voice' then
        if GetResourceState('pma-voice') == 'started' and exports['pma-voice'] then
            exports['pma-voice']:removePlayerFromCall(callId)
            print('[CallSystem] Player removed from call: ' .. callId)
        else
            print('[CallSystem] PMA-Voice not available')
        end
    end
end)

RegisterNetEvent('phone:sendNUIMessage')
AddEventHandler('phone:sendNUIMessage', function(data)
    SendNUIMessage(data)
end)

RegisterCommand('testpmavoice', function()
    print('[CallSystem] Testing PMA-Voice integration...')
    print('[CallSystem] PMA-Voice state:', GetResourceState('pma-voice'))
    
    if GetResourceState('pma-voice') ~= 'started' then
        print('[CallSystem] PMA-Voice not started!')
        return
    end
    
    if exports['pma-voice'] then
        local callId = 'test_call_' .. GetPlayerServerId(PlayerId())
        print('[CallSystem] Adding player to test call:', callId)
        exports['pma-voice']:addPlayerToCall(callId)
        
        SetTimeout(10000, function()
            print('[CallSystem] Removing player from test call:', callId)
            exports['pma-voice']:removePlayerFromCall(callId)
        end)
    else
        print('[CallSystem] PMA-Voice exports not available!')
    end
end, false)

RegisterCommand('testcall', function(source, args)
    if not args[1] then
        print('[CallSystem] Usage: /testcall <phone_number>')
        return
    end
    
    local targetNumber = args[1]
    print('[CallSystem] Initiating test call to:', targetNumber)
    
    TriggerServerEvent('call:start', {
        targetId = targetNumber,
        type = 'audio'
    })
end, false)

RegisterNUICallback('call:accept', function(data, cb)
    local callId = data.callId
    local targetId = data.targetId
    
    print('[CallSystem] Call accept callback:', callId)
    
    TriggerServerEvent('call:signaling', {
        callId = callId,
        type = 'call-accepted',
        targetId = targetId
    })
    
    cb({success = true})
end)

RegisterNUICallback('call:reject', function(data, cb)
    local callId = data.callId
    local targetId = data.targetId
    
    print('[CallSystem] Call reject callback:', callId)
    
    TriggerServerEvent('call:signaling', {
        callId = callId,
        type = 'call-rejected',
        targetId = targetId
    })
    
    cb({success = true})
end)

RegisterNUICallback('call:end', function(data, cb)
    local callId = data.callId
    
    print('[CallSystem] Call end callback:', callId)
    
    TriggerServerEvent('call:end', {
        callId = callId
    })
    
    cb({success = true})
end)

RegisterNUICallback('call:signaling', function(data, cb)
    local callId = data.callId
    local messageType = data.type
    local messageData = data.data
    
    print('[CallSystem] WebRTC signaling callback:', messageType, 'for call:', callId)

    TriggerServerEvent('call:webrtc_signaling', {
        callId = callId,
        type = messageType,
        data = messageData
    })
    
    cb({success = true})
end)
