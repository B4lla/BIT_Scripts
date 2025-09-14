local function getPlayerIdentifier(playerId)
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(playerId)
        return xPlayer and xPlayer.identifier or nil
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(playerId)
        return Player and Player.PlayerData.citizenid or nil
    end
    return nil
end

CreateThread(function()
    while true do
        Wait(300000) -- 5 minutes
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_notifications WHERE expires_at IS NOT NULL AND expires_at < NOW()')
        print('[BIT-Smartphone] Cleaned up expired notifications')
    end
end)

local function SendNotification(playerId, notificationData, legacyMessage)
    if type(notificationData) == "string" then
        local appId = notificationData
        notificationData = {
            title = appId,
            message = legacyMessage or 'Notificación',
            app = appId or 'system'
        }
    end
    
    local identifier = getPlayerIdentifier(playerId)
    if not identifier then return false end
    
    local result = SqlFunc(Config.Mysql, 'execute', [[
        INSERT INTO bit_phone_notifications 
        (user, title, message, app, app_id, icon, additional_info, notification_data, priority, expires_at)
        VALUES (@user, @title, @message, @app, @app_id, @icon, @additional_info, @notification_data, @priority, @expires_at)
    ]], {
        ['@user'] = identifier,
        ['@title'] = notificationData.title or 'Notificación',
        ['@message'] = notificationData.message or '',
        ['@app'] = notificationData.app or 'system',
        ['@app_id'] = notificationData.appId,
        ['@icon'] = notificationData.icon,
        ['@additional_info'] = notificationData.additionalInfo,
        ['@notification_data'] = notificationData.data and json.encode(notificationData.data) or nil,
        ['@priority'] = notificationData.priority or 'normal',
        ['@expires_at'] = notificationData.expiresAt
    })
    
    local clientNotification = {
        id = result.insertId or os.time(),
        title = notificationData.title or 'Notificación',
        message = notificationData.message or '',
        app = notificationData.app or 'system',
        appId = notificationData.appId,
        icon = notificationData.icon,
        additionalInfo = notificationData.additionalInfo,
        data = notificationData.data,
        priority = notificationData.priority or 'normal',
        timestamp = os.time() * 1000,
        persistent = true,
        is_read = false,
        is_dismissed = false
    }
    
    TriggerClientEvent('bit-smartphone:receiveNotification', playerId, clientNotification)
    return true
end

local function SendNotificationToMultiple(playerIds, notificationData)
    for _, playerId in ipairs(playerIds) do
        SendNotification(playerId, notificationData)
    end
end

local function SendNotificationToAll(notificationData)
    local players = GetPlayers()
    for _, playerId in ipairs(players) do
        SendNotification(tonumber(playerId), notificationData)
    end
end

RegisterNetEvent('bit-smartphone:sendNotification')
AddEventHandler('bit-smartphone:sendNotification', function(targetPlayerId, notificationData)
    SendNotification(targetPlayerId, notificationData)
end)

RegisterNetEvent('bit-smartphone:sendNotificationToMultiple')
AddEventHandler('bit-smartphone:sendNotificationToMultiple', function(playerIds, notificationData)
    SendNotificationToMultiple(playerIds, notificationData)
end)

RegisterNetEvent('bit-smartphone:sendNotificationToAll')
AddEventHandler('bit-smartphone:sendNotificationToAll', function(notificationData)
    SendNotificationToAll(notificationData)
end)

exports('sendNotification', SendNotification) 
exports('SendNotification', SendNotification)
exports('SendNotificationToMultiple', SendNotificationToMultiple)  
exports('SendNotificationToAll', SendNotificationToAll)

RegisterCommand('testnotification', function(source, args)
    if source == 0 then return end 
    
    local title = table.concat(args, ' ', 1, 1) or 'Test Notification'
    local message = table.concat(args, ' ', 2) or 'This is a test notification'
    
    SendNotification(source, {
        title = title,
        message = message,
        app = 'system',
        icon = '/html/assets/icons/system.png',
        priority = 'normal'
    })
end, false)

RegisterCommand('testnotificationall', function(source, args)
    if source ~= 0 then return end 
    
    local title = table.concat(args, ' ', 1, 1) or 'Server Notification'
    local message = table.concat(args, ' ', 2) or 'This is a server-wide notification'
    
    SendNotificationToAll({
        title = title,
        message = message,
        app = 'system',
        icon = '/html/assets/icons/system.png',
        priority = 'high'
    })
end, true)

print('[BIT-Smartphone] Enhanced notification system loaded successfully')