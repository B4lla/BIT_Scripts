
RegisterNUICallback('bitlove:createProfile', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:createProfile', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:getProfile', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:getProfile')
    cb('ok')
end)

RegisterNUICallback('bitlove:getProfiles', function(data, cb)
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

RegisterNUICallback('bitlove:sendMessage', function(data, cb)
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
    TriggerServerEvent('bit-smartphone:bitlove:saveProfile', data)
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

RegisterNetEvent('bit-smartphone:bitloveResponse')
AddEventHandler('bit-smartphone:bitloveResponse', function(data)
    SendNUIMessage(data)
end)
