RegisterNUICallback('maps:getMarkers', function(_, cb)
    TriggerServerEvent('bit-smartphone:server:getMarkers')
    cb('ok')
end)

RegisterNUICallback('maps:saveMarker', function(data, cb)
    TriggerServerEvent('bit-smartphone:server:saveMarker', data)
    cb('ok')
end)

RegisterNUICallback('maps:deleteMarker', function(data, cb)
    TriggerServerEvent('bit-smartphone:server:deleteMarker', data.id)
    cb('ok')
end)

RegisterNUICallback('maps:sendLocation', function(data, cb)
    TriggerServerEvent('bit-smartphone:server:sendLocation', data)
    cb('ok')
end)

RegisterNetEvent('bit-smartphone:client:receiveMarkers')
AddEventHandler('bit-smartphone:client:receiveMarkers', function(markers)
    SendNUIMessage({ action = 'updateMarkers', data = markers })
end)

RegisterNetEvent('bit-smartphone:client:receiveLocation')
AddEventHandler('bit-smartphone:client:receiveLocation', function(payload)
    SendNUIMessage({ action = 'receiveLocation', data = payload })
end)

