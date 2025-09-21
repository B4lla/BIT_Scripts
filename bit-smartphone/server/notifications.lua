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
    Wait(500)
    local query = [[
        CREATE TABLE IF NOT EXISTS `bit_phone_notifications` (
          `id` INT AUTO_INCREMENT PRIMARY KEY,
          `user` VARCHAR(50) NOT NULL,
          `title` VARCHAR(255) NOT NULL,
          `message` TEXT DEFAULT NULL,
          `app` VARCHAR(50) DEFAULT 'system',
          `app_id` VARCHAR(50) DEFAULT NULL,
          `icon` TEXT DEFAULT NULL,
          `icon_svg` TEXT DEFAULT NULL,
          `additional_info` TEXT DEFAULT NULL,
          `notification_data` JSON DEFAULT NULL,
          `priority` ENUM('low','normal','high') DEFAULT 'normal',
          `is_read` BOOLEAN DEFAULT FALSE,
          `is_dismissed` BOOLEAN DEFAULT FALSE,
          `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
          `read_at` DATETIME DEFAULT NULL,
          `dismissed_at` DATETIME DEFAULT NULL,
          `expires_at` DATETIME DEFAULT NULL,
          INDEX `idx_user_created` (`user`, `created_at` DESC),
          INDEX `idx_read` (`user`, `is_read`),
          INDEX `idx_app` (`app`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ]]
    pcall(function()
        SqlFunc(Config.Mysql, 'execute', query)
    end)

    local alters = {
        "ALTER TABLE `bit_phone_notifications` ADD COLUMN IF NOT EXISTS `icon_svg` TEXT DEFAULT NULL",
        "ALTER TABLE `bit_phone_notifications` ADD COLUMN IF NOT EXISTS `read_at` DATETIME DEFAULT NULL",
        "ALTER TABLE `bit_phone_notifications` ADD COLUMN IF NOT EXISTS `dismissed_at` DATETIME DEFAULT NULL"
    }
    for _, q in ipairs(alters) do
        pcall(function()
            SqlFunc(Config.Mysql, 'execute', q)
        end)
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
    
    local insertedId = (type(result) == 'table' and (result.insertId or result.insert_id)) or nil
    local clientNotification = {
        id = insertedId or os.time(),
        title = notificationData.title or 'Notificación',
        message = notificationData.message or '',
        app = notificationData.app or 'system',
        appId = notificationData.appId,
        icon = notificationData.icon,
        icon_svg = notificationData.iconSvg or notificationData.icon_svg or nil,
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

RegisterNetEvent('bit-smartphone:proxyLegacyNotification')
AddEventHandler('bit-smartphone:proxyLegacyNotification', function(appId, message)
    local src = source
    if not appId then return end
    SendNotification(src, appId, message)
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

RegisterCommand('testpersistentnotif', function(source, args)
    if source == 0 then return end 
    
    local title = table.concat(args, ' ', 1, 1) or 'Persistent Test'
    local message = table.concat(args, ' ', 2) or 'This is a persistent notification that should survive phone restarts'
    
    SendNotification(source, {
        title = title,
        message = message,
        app = 'messages',
        icon = '/html/assets/icons/messages.png',
        priority = 'normal',
        additionalInfo = 'This notification will persist until dismissed'
    })
end, false)
