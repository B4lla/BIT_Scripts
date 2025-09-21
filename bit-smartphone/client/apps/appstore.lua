RegisterNUICallback('appstore:getApps', function(data, cb)
    if not IsPhoneConnected() then
        cb({success = false, error = 'no_signal'})
        return
    end
    TriggerServerEvent('bit-smartphone:appstore:getApps')
    cb('ok')
end)

RegisterNUICallback('appstore:downloadApp', function(data, cb)
    if not IsPhoneConnected() then
        cb({success = false, error = 'no_signal'})
        return
    end
    TriggerServerEvent('bit-smartphone:appstore:downloadApp', data.appId)
    cb('ok')
end)

RegisterNetEvent('bit-smartphone:appstore:receiveApps')
AddEventHandler('bit-smartphone:appstore:receiveApps', function(apps)
    SendNUIMessage({
        action = 'appstore:appsLoaded',
        apps = apps
    })
end)

RegisterNetEvent('bit-smartphone:appstore:downloadResult')
AddEventHandler('bit-smartphone:appstore:downloadResult', function(result)
    SendNUIMessage({
        action = 'appstore:downloadResult',
        success = result.success,
        message = result.message,
        appId = result.appId
    })
end)