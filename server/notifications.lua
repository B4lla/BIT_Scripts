local function SendNotification(target, appId, message)
    TriggerClientEvent('bit-smartphone:client:receiveNotification', target, appId, message)
end


exports('sendNotification', SendNotification)