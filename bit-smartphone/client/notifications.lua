RegisterNetEvent('bit-smartphone:client:receiveNotification')
AddEventHandler('bit-smartphone:client:receiveNotification', function(appId, message)
    DebugPrint("NOTIFICATIONS", "Received notification (legacy). Forwarding to server for persistence", {appId = appId, message = message})
    TriggerServerEvent('bit-smartphone:proxyLegacyNotification', appId, message)
end)


exports('sendNotification', function(appId, message)
    DebugPrint("NOTIFICATIONS", "Sending notification via export (legacy -> server)", {appId = appId, message = message})
    TriggerServerEvent('bit-smartphone:proxyLegacyNotification', appId, message)
end)