local function getIdentifier(playerId)
    if Config.Framework == 'esx' then
        if ESX then
            local xPlayer = ESX.GetPlayerFromId(playerId)
            return xPlayer and xPlayer.identifier or nil
        end
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        if QBCore then
            local Player = QBCore.Functions.GetPlayer(playerId)
            return Player and Player.PlayerData and Player.PlayerData.citizenid or nil
        end
    end
    return GetPlayerIdentifier(playerId, 0)
end

local function getPlayerInstalledAppsFromDB(playerId)
    local identifier = getIdentifier(playerId)
    if not identifier then return {} end

    local res = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT installed_apps FROM bit_phone WHERE user = @identifier', { ['@identifier'] = identifier })
    if res and res[1] and res[1].installed_apps then
        local installed = res[1].installed_apps
        if type(installed) == 'string' then
            local ok, decoded = pcall(json.decode, installed)
            if ok and type(decoded) == 'table' then
                return decoded
            end
            return {}
        elseif type(installed) == 'table' then
            return installed
        end
    end
    return {
        'phone', 'messages', 'contacts', 'camera', 'photos', 'settings', 
        'calculator', 'clock', 'weather', 'calendar'
    }
end

RegisterNetEvent('bit-smartphone:appstore:getApps', function()
    local playerId = source
    local availableApps = Apps.appStore or {}

    local userInstalled = getPlayerInstalledAppsFromDB(playerId)
    local installedLookup = {}
    for _, v in ipairs(userInstalled) do installedLookup[v] = true end

    local appsArray = {}
    for appId, appData in pairs(availableApps) do
        if appData and appData.label and appData.description and appId then
            local appInfo = {
                id = appId,
                label = tostring(appData.label or "App"),
                icon = tostring(appData.icon or ""),
                description = tostring(appData.description or "No description"),
                price = tonumber(appData.price or 0),
                app = tostring(appData.app or appId),
                category = tostring(appData.category or "other"),
                rating = tonumber(appData.rating or 4.0),
                headerColor = tostring(appData.headerColor or "#007AFF"),
                image = tostring(appData.image or ""),
                installed = installedLookup[appId] == true
            }
            table.insert(appsArray, appInfo)
        else
            print(string.format('[AppStore] Skipping invalid app data for: %s', tostring(appId)))
        end
    end

    print(string.format('[AppStore] Sending %d valid apps to player %s', #appsArray, GetPlayerName(playerId)))
    TriggerClientEvent('bit-smartphone:appstore:receiveApps', playerId, appsArray)
end)

RegisterNetEvent('bit-smartphone:appstore:downloadApp', function(appId)
    local playerId = source
    local identifier = getIdentifier(playerId)

    if not identifier or not appId then
        TriggerClientEvent('bit-smartphone:appstore:downloadResult', playerId, {
            success = false,
            message = 'Error en la descarga',
            appId = appId
        })
        return
    end

    local appData = Apps.appStore and Apps.appStore[appId]
    if not appData then
        TriggerClientEvent('bit-smartphone:appstore:downloadResult', playerId, {
            success = false,
            message = 'Aplicación no encontrada',
            appId = appId
        })
        return
    end

    local current = getPlayerInstalledAppsFromDB(playerId) or {}
    for _, v in ipairs(current) do
        if v == appId then
            TriggerClientEvent('bit-smartphone:appstore:downloadResult', playerId, {
                success = false,
                message = 'La aplicación ya está instalada',
                appId = appId
            })
            return
        end
    end

    Wait(2000)

    table.insert(current, appId)

    local row = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT user FROM bit_phone WHERE user = @identifier', { ['@identifier'] = identifier })
    if not row or not row[1] then
        SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone (`user`, `installed_apps`) VALUES (@identifier, @installed_apps)', {
            ['@identifier'] = identifier,
            ['@installed_apps'] = json.encode(current)
        })
    else
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone SET installed_apps = @installed_apps WHERE user = @identifier', {
            ['@installed_apps'] = json.encode(current),
            ['@identifier'] = identifier
        })
    end

    TriggerClientEvent('bit-smartphone:appstore:downloadResult', playerId, {
        success = true,
        message = appData.label .. ' instalada correctamente',
        appId = appId
    })

    print(string.format('[AppStore] Player %s installed app: %s', GetPlayerName(playerId), appId))
end)
