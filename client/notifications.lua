RegisterNetEvent('bit-smartphone:client:receiveNotification')
AddEventHandler('bit-smartphone:client:receiveNotification', function(appId, message)
    
    SendNUIMessage({
        action = 'receiveNotification',
        appId = appId,
        message = message
    })
end)


exports('sendNotification', function(appId, message)
    SendNUIMessage({
        action = 'receiveNotification',
        appId = appId,
        message = message
    })
end)