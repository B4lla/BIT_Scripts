local isInCall = false
local currentCallId = nil
local activeCallData = nil


RegisterNUICallback('makeCall', function(data, cb)
    if not data.targetId then
        cb('error')
        return
    end

    TriggerServerEvent('call:start', {
        targetId = data.targetId,
        type = data.type or 'audio'
    })
    cb('ok')
end)

RegisterNUICallback('call:start', function(data, cb)
    if not data.targetId then
        cb('error')
        return
    end

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
    SendNUIMessage({
        action = 'call:signaling',
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
    if Config.VoiceCalls.enabled and Config.VoiceCalls.provider == 'pma-voice' and exports['pma-voice'] then
        exports['pma-voice']:addPlayerToCall(callId)
    end
end)

RegisterNetEvent('bit-smartphone:client:removePlayerFromCall')
AddEventHandler('bit-smartphone:client:removePlayerFromCall', function(callId)
    if Config.VoiceCalls.enabled and Config.VoiceCalls.provider == 'pma-voice' and exports['pma-voice'] then
        exports['pma-voice']:removePlayerFromCall(callId)
    end
end)

RegisterNetEvent('phone:sendNUIMessage')
AddEventHandler('phone:sendNUIMessage', function(data)
    SendNUIMessage(data)
end)

RegisterCommand('testpmavoice', function()
    if GetResourceState('pma-voice') ~= 'started' then
        return
    end
    if exports['pma-voice'] then
        local callId = 'test_call_' .. GetPlayerServerId(PlayerId())
        exports['pma-voice']:addPlayerToCall(callId)
        SetTimeout(10000, function()
            exports['pma-voice']:removePlayerFromCall(callId)
        end)
    end
end, false)
