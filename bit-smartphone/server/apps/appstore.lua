local function getPlayerInstalledApps(playerId)
    local identifier = GetPlayerIdentifier(playerId, 0)
    if not identifier then return {} end
    return {
        'phone', 'messages', 'contacts', 'camera', 'photos', 'settings', 
        'calculator', 'clock', 'weather', 'calendar'
    }
end
RegisterNetEvent('bit-smartphone:appstore:getApps', function()
    local playerId = source
    
    local availableApps = Apps.appStore or {}
    
    local appsArray = {}
    for appId, appData in pairs(availableApps) do
        local appInfo = {
            id = appId,
            label = appData.label,
            icon = appData.icon,
            description = appData.description,
            price = appData.price or 0,
            app = appData.app,
            category = appData.category,
            rating = appData.rating or 4.0,
            headerColor = appData.headerColor,
            image = appData.image,
            installed = false 
        }
        table.insert(appsArray, appInfo)
    end
    
    print(string.format('[AppStore] Sending %d apps to player %s', #appsArray, GetPlayerName(playerId)))
    
    TriggerClientEvent('bit-smartphone:appstore:receiveApps', playerId, appsArray)
end)

RegisterNetEvent('bit-smartphone:appstore:downloadApp', function(appId)
    local playerId = source
    local identifier = GetPlayerIdentifier(playerId, 0)
    
    if not identifier or not appId then
        TriggerClientEvent('bit-smartphone:appstore:downloadResult', playerId, {
            success = false,
            message = 'Error en la descarga',
            appId = appId
        })
        return
    end
    
    local appData = Apps.appStore[appId]
    if not appData then
        TriggerClientEvent('bit-smartphone:appstore:downloadResult', playerId, {
            success = false,
            message = 'Aplicación no encontrada',
            appId = appId
        })
        return
    end
    
    local installedApps = getPlayerInstalledApps(playerId)
    for _, installedApp in ipairs(installedApps) do
        if installedApp == appId then
            TriggerClientEvent('bit-smartphone:appstore:downloadResult', playerId, {
                success = false,
                message = 'La aplicación ya está instalada',
                appId = appId
            })
            return
        end
    end
    
    Wait(2000)
    
    TriggerClientEvent('bit-smartphone:appstore:downloadResult', playerId, {
        success = true,
        message = appData.label .. ' instalada correctamente',
        appId = appId
    })
    
    print(string.format('[AppStore] Player %s installed app: %s', GetPlayerName(playerId), appId))
end)
