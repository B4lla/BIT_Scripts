local function generateUniquePhoneNumber()
    math.randomseed(os.time())
    local phone, res
    repeat
        phone = tostring(math.random(100000000, 999999999))
        res = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT phone_number FROM bit_phone WHERE phone_number = @phone', {['@phone'] = phone})
    until not res[1]
    return phone
end





if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-smartphone:loadData', function(source, cb)
        DebugPrint("SERVER", "Loading phone data for player", {source = source})
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then 
            DebugPrint("SERVER", "Player not found in ESX", {source = source})
            cb({}) 
            return 
        end
        DebugPrint("SERVER", "Player found, querying database", {identifier = xPlayer.identifier})
        local result = SqlFunc(Config.Mysql,'fetchAll','SELECT * FROM bit_phone WHERE user = @identifier', {['@identifier'] = xPlayer.identifier})
        if result[1] then
            DebugPrint("SERVER", "Phone data found in database", {phone_number = result[1].phone_number})
            local row = result[1]
            local notifications = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_notifications WHERE user = @identifier AND is_dismissed = 0 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC', {['@identifier'] = xPlayer.identifier})
            DebugPrint("SERVER", "Notifications loaded", {count = notifications and #notifications or 0})
            
            local data = {
                setup_completed = row.setup_completed,
                profile_name = row.profile_name,
                profile_picture = row.profile_picture,
                pin_code = row.pin_code,
                phone_number = row.phone_number,
                battery_level = row.battery_level,
                desktop_layout = row.desktop_layout and (type(row.desktop_layout) == "string" and json.decode(row.desktop_layout) or row.desktop_layout) or {},
                installed_apps = row.installed_apps and (type(row.installed_apps) == "string" and json.decode(row.installed_apps) or row.installed_apps) or {},
                dock_apps = row.dock_apps and (type(row.dock_apps) == "string" and json.decode(row.dock_apps) or row.dock_apps) or {},
                folders = row.folders and (type(row.folders) == "string" and json.decode(row.folders) or row.folders) or {},
                wallpaper = row.wallpaper,
                theme_mode = row.theme_mode,
                lockscreen_widgets = row.lockscreen_widgets and (type(row.lockscreen_widgets) == "string" and json.decode(row.lockscreen_widgets) or row.lockscreen_widgets) or {},
                lockscreen_font_family = row.lockscreen_font_family,
                lockscreen_font_size = row.lockscreen_font_size,
                lockscreen_font_color = row.lockscreen_font_color,
                lockscreen_date_style = row.lockscreen_date_style,
                lockscreen_date_color = row.lockscreen_date_color,
                lockscreen_date_size = row.lockscreen_date_size,
                notifications = notifications or {}
            }
            DebugPrint("SERVER", "Sending phone data to client", {setup_completed = data.setup_completed, has_phone_number = data.phone_number ~= nil})
            cb(data)
        else
            DebugPrint("SERVER", "No phone data found, creating new entry")
            local phone = generateUniquePhoneNumber()
            DebugPrint("SERVER", "Generated new phone number", {phone = phone})
            SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone (user, phone_number) VALUES (@identifier, @phone)', {['@identifier'] = xPlayer.identifier, ['@phone'] = phone})
            DebugPrint("SERVER", "New phone entry created, sending initial data")
            cb({ setup_completed = 0 })
        end
    end)

    ESX.RegisterServerCallback('bit-smartphone:checkItem', function(source, cb, itemName, amount)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb(false) return end
        local hasItem = getItem(source, itemName, amount)
        cb(hasItem)
    end)

    ESX.RegisterServerCallback('bit-smartphone:getAvailableApps', function(source, cb)
        local apps = {}
        if Apps and Apps.appStore then
            for appId, appData in pairs(Apps.appStore) do
                apps[#apps + 1] = {
                    id = appId,
                    label = appData.label,
                    icon = appData.icon,
                    description = appData.description,
                    price = appData.price,
                    category = appData.category,
                    rating = appData.rating,
                    jobBlacklist = appData.jobBlacklist,
                    ageRating = appData.ageRating,
                    headerColor = appData.headerColor,
                    image = appData.image
                }
            end
        end
        cb({apps = apps})
    end)
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Functions.CreateCallback('bit-smartphone:loadData', function(source, cb)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb({}) return end
        local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone WHERE user = @identifier', {['@identifier'] = Player.PlayerData.citizenid})
        if result[1] then
            local row = result[1]
            local notifications = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_notifications WHERE user = @identifier AND is_dismissed = 0 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC', {['@identifier'] = Player.PlayerData.citizenid})
            
            local data = {
                setup_completed = row.setup_completed,
                profile_name = row.profile_name,
                profile_picture = row.profile_picture,
                pin_code = row.pin_code,
                phone_number = row.phone_number,
                battery_level = row.battery_level,
                desktop_layout = row.desktop_layout and (type(row.desktop_layout) == "string" and json.decode(row.desktop_layout) or row.desktop_layout) or {},
                installed_apps = row.installed_apps and (type(row.installed_apps) == "string" and json.decode(row.installed_apps) or row.installed_apps) or {},
                dock_apps = row.dock_apps and (type(row.dock_apps) == "string" and json.decode(row.dock_apps) or row.dock_apps) or {},
                folders = row.folders and (type(row.folders) == "string" and json.decode(row.folders) or row.folders) or {},
                wallpaper = row.wallpaper,
                theme_mode = row.theme_mode,
                lockscreen_widgets = row.lockscreen_widgets and (type(row.lockscreen_widgets) == "string" and json.decode(row.lockscreen_widgets) or row.lockscreen_widgets) or {},
                lockscreen_font_family = row.lockscreen_font_family,
                lockscreen_font_size = row.lockscreen_font_size,
                lockscreen_font_color = row.lockscreen_font_color,
                lockscreen_date_style = row.lockscreen_date_style,
                lockscreen_date_color = row.lockscreen_date_color,
                lockscreen_date_size = row.lockscreen_date_size,
                notifications = notifications or {}
            }
            cb(data)
        else
            SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone (user) VALUES (@identifier)', {['@identifier'] = Player.PlayerData.citizenid})
            cb({ setup_completed = 0 })
        end
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:checkItem', function(source, cb, itemName, amount)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb(false) return end
        local hasItem = getItem(source, itemName, amount)
        cb(hasItem)
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:getAvailableApps', function(source, cb)
        local apps = {}
        if Apps and Apps.appStore then
            for appId, appData in pairs(Apps.appStore) do
                apps[#apps + 1] = {
                    id = appId,
                    label = appData.label,
                    icon = appData.icon,
                    description = appData.description,
                    price = appData.price,
                    category = appData.category,
                    rating = appData.rating,
                    jobBlacklist = appData.jobBlacklist,
                    ageRating = appData.ageRating,
                    headerColor = appData.headerColor,
                    image = appData.image
                }
            end
        end
        cb({apps = apps})
    end)
end

RegisterNetEvent('bit-smartphone:saveData')
AddEventHandler('bit-smartphone:saveData', function(state)
    local src = source
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(src)
        if not xPlayer then return end
        SqlFunc(Config.Mysql, 'execute', [[
            UPDATE bit_phone SET
                setup_completed = @setup_completed,
                installed_apps = @installed_apps,
                dock_apps = @dock_apps,
                folders = @folders,
                wallpaper = @wallpaper,
                theme_mode = @theme_mode,
                profile_name = @profile_name,
                profile_picture = @profile_picture,
                lockscreen_widgets = @lockscreen_widgets,
                lockscreen_font_family = @lockscreen_font_family,
                lockscreen_font_size = @lockscreen_font_size,
                lockscreen_font_color = @lockscreen_font_color,
                lockscreen_date_style = @lockscreen_date_style,
                lockscreen_date_color = @lockscreen_date_color,
                lockscreen_date_size = @lockscreen_date_size
            WHERE user = @identifier
        ]], {
            ['@setup_completed'] = state.setup_completed or 0,
            ['@installed_apps'] = state.installed_apps and json.encode(state.installed_apps) or json.encode({}),
            ['@dock_apps'] = state.dock_apps and json.encode(state.dock_apps) or json.encode({}),
            ['@folders'] = state.folders and json.encode(state.folders) or json.encode({}),
            ['@wallpaper'] = state.wallpaper,
            ['@theme_mode'] = state.theme_mode,
            ['@profile_name'] = state.profile_name,
            ['@profile_picture'] = state.profile_picture,
            ['@lockscreen_widgets'] = state.lockscreen_widgets and json.encode(state.lockscreen_widgets) or json.encode({}),
            ['@lockscreen_font_family'] = state.lockscreen_font_family,
            ['@lockscreen_font_size'] = state.lockscreen_font_size,
            ['@lockscreen_font_color'] = state.lockscreen_font_color,
            ['@lockscreen_date_style'] = state.lockscreen_date_style,
            ['@lockscreen_date_color'] = state.lockscreen_date_color,
            ['@lockscreen_date_size'] = state.lockscreen_date_size,
            ['@identifier'] = xPlayer.identifier
        })
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(src)
        if not Player then return end
        SqlFunc(Config.Mysql, 'execute', [[
            UPDATE bit_phone SET
                setup_completed = @setup_completed,
                installed_apps = @installed_apps,
                dock_apps = @dock_apps,
                folders = @folders,
                wallpaper = @wallpaper,
                theme_mode = @theme_mode,
                profile_name = @profile_name,
                profile_picture = @profile_picture,
                lockscreen_widgets = @lockscreen_widgets,
                lockscreen_font_family = @lockscreen_font_family,
                lockscreen_font_size = @lockscreen_font_size,
                lockscreen_font_color = @lockscreen_font_color,
                lockscreen_date_style = @lockscreen_date_style,
                lockscreen_date_color = @lockscreen_date_color,
                lockscreen_date_size = @lockscreen_date_size
            WHERE user = @identifier
        ]], {
            ['@setup_completed'] = state.setup_completed or 0,
            ['@installed_apps'] = state.installed_apps and json.encode(state.installed_apps) or json.encode({}),
            ['@dock_apps'] = state.dock_apps and json.encode(state.dock_apps) or json.encode({}),
            ['@folders'] = state.folders and json.encode(state.folders) or json.encode({}),
            ['@wallpaper'] = state.wallpaper,
            ['@theme_mode'] = state.theme_mode,
            ['@profile_name'] = state.profile_name,
            ['@profile_picture'] = state.profile_picture,
            ['@lockscreen_widgets'] = state.lockscreen_widgets and json.encode(state.lockscreen_widgets) or json.encode({}),
            ['@lockscreen_font_family'] = state.lockscreen_font_family,
            ['@lockscreen_font_size'] = state.lockscreen_font_size,
            ['@lockscreen_font_color'] = state.lockscreen_font_color,
            ['@lockscreen_date_style'] = state.lockscreen_date_style,
            ['@lockscreen_date_color'] = state.lockscreen_date_color,
            ['@lockscreen_date_size'] = state.lockscreen_date_size,
            ['@identifier'] = Player.PlayerData.citizenid
        })
    end
end)

AddEventHandler('playerDropped', function(reason)
    local src = source
    TriggerClientEvent('bit-smartphone:requestSaveBeforeDisconnect', src)
end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        TriggerClientEvent('bit-smartphone:requestSaveBeforeResourceStop', -1)
        Wait(2000)
    end
end)

if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-smartphone:getNotifications', function(source, cb)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb({}) return end
        
        local notifications = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT * FROM bit_phone_notifications WHERE user = @identifier AND is_dismissed = 0 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC', 
            {['@identifier'] = xPlayer.identifier}
        )
        
        local clientNotifications = {}
        for i, notification in ipairs(notifications or {}) do
            table.insert(clientNotifications, {
                id = notification.id,
                title = notification.title,
                message = notification.message,
                app = notification.app,
                appId = notification.app_id,
                icon = notification.icon,
                icon_svg = notification.icon_svg,
                additionalInfo = notification.additional_info,
                data = notification.notification_data and json.decode(notification.notification_data) or nil,
                priority = notification.priority,
                timestamp = notification.created_at and (type(notification.created_at) == "string" and (function(dt) local ok, time = pcall(function() return os.time() * 1000 end) if ok then return time else return os.time() * 1000 end end)() or os.time() * 1000) or os.time() * 1000,
                created_at = notification.created_at,
                persistent = true,
                is_read = notification.is_read == 1,
                is_dismissed = notification.is_dismissed == 1
            })
        end
        
        cb(clientNotifications)
    end)
    
    ESX.RegisterServerCallback('bit-smartphone:saveNotification', function(source, cb, notificationData)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb({ success = false, error = 'no_player' }) return end
        local identifier = xPlayer.identifier
        if not identifier then cb({ success = false, error = 'no_identifier' }) return end

        local exec = SqlFunc(Config.Mysql, 'execute', [[
            INSERT INTO bit_phone_notifications (user, title, message, app, app_id, icon, icon_svg, additional_info, notification_data, priority, expires_at)
            VALUES (@user, @title, @message, @app, @app_id, @icon, @icon_svg, @additional_info, @notification_data, @priority, @expires_at)
        ]], {
            ['@user'] = identifier,
            ['@title'] = notificationData and notificationData.title or 'Notificación',
            ['@message'] = notificationData and notificationData.message or '',
            ['@app'] = notificationData and (notificationData.app or notificationData.appId) or 'system',
            ['@app_id'] = notificationData and (notificationData.appId or notificationData.app) or 'system',
            ['@icon'] = notificationData and notificationData.icon or nil,
            ['@icon_svg'] = notificationData and (notificationData.iconSvg or notificationData.icon_svg) or nil,
            ['@additional_info'] = notificationData and notificationData.additionalInfo or nil,
            ['@notification_data'] = (notificationData and notificationData.data) and json.encode(notificationData.data) or nil,
            ['@priority'] = notificationData and notificationData.priority or 'normal',
            ['@expires_at'] = notificationData and notificationData.expiresAt or nil
        })

        local insertId = exec and exec.insertId or nil
        cb({ success = insertId ~= nil, id = insertId })
    end)
    
    ESX.RegisterServerCallback('bit-smartphone:dismissNotification', function(source, cb, notificationId)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb(false) return end
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_notifications SET is_dismissed = 1, dismissed_at = NOW() WHERE id = @id AND user = @identifier', 
            {['@id'] = notificationId, ['@identifier'] = xPlayer.identifier}
        )
        cb(true)
    end)
    
    ESX.RegisterServerCallback('bit-smartphone:markNotificationRead', function(source, cb, notificationId)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb(false) return end
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_notifications SET is_read = 1, read_at = NOW() WHERE id = @id AND user = @identifier', 
            {['@id'] = notificationId, ['@identifier'] = xPlayer.identifier}
        )
        cb(true)
    end)
    
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Functions.CreateCallback('bit-smartphone:getNotifications', function(source, cb)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb({}) return end
        
        local notifications = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT * FROM bit_phone_notifications WHERE user = @identifier AND is_dismissed = 0 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC', 
            {['@identifier'] = Player.PlayerData.citizenid}
        )
        
        local clientNotifications = {}
        for i, notification in ipairs(notifications or {}) do
            table.insert(clientNotifications, {
                id = notification.id,
                title = notification.title,
                message = notification.message,
                app = notification.app,
                appId = notification.app_id,
                icon = notification.icon,
                icon_svg = notification.icon_svg,
                additionalInfo = notification.additional_info,
                data = notification.notification_data and json.decode(notification.notification_data) or nil,
                priority = notification.priority,
                timestamp = notification.created_at and (type(notification.created_at) == "string" and (function(dt) local ok, time = pcall(function() return os.time() * 1000 end) if ok then return time else return os.time() * 1000 end end)() or os.time() * 1000) or os.time() * 1000,
                created_at = notification.created_at,
                persistent = true,
                is_read = notification.is_read == 1,
                is_dismissed = notification.is_dismissed == 1
            })
        end
        
        cb(clientNotifications)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:saveNotification', function(source, cb, notificationData)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb({ success = false, error = 'no_player' }) return end
        local identifier = Player.PlayerData.citizenid
        if not identifier then cb({ success = false, error = 'no_identifier' }) return end

        local exec = SqlFunc(Config.Mysql, 'execute', [[
            INSERT INTO bit_phone_notifications (user, title, message, app, app_id, icon, icon_svg, additional_info, notification_data, priority, expires_at)
            VALUES (@user, @title, @message, @app, @app_id, @icon, @icon_svg, @additional_info, @notification_data, @priority, @expires_at)
        ]], {
            ['@user'] = identifier,
            ['@title'] = notificationData and notificationData.title or 'Notification',
            ['@message'] = notificationData and notificationData.message or '',
            ['@app'] = notificationData and (notificationData.app or notificationData.appId) or 'system',
            ['@app_id'] = notificationData and (notificationData.appId or notificationData.app) or 'system',
            ['@icon'] = notificationData and notificationData.icon or nil,
            ['@icon_svg'] = notificationData and (notificationData.iconSvg or notificationData.icon_svg) or nil,
            ['@additional_info'] = notificationData and notificationData.additionalInfo or nil,
            ['@notification_data'] = (notificationData and notificationData.data) and json.encode(notificationData.data) or nil,
            ['@priority'] = notificationData and notificationData.priority or 'normal',
            ['@expires_at'] = notificationData and notificationData.expiresAt or nil
        })

        local insertId = exec and exec.insertId or nil
        cb({ success = insertId ~= nil, id = insertId })
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:dismissNotification', function(source, cb, notificationId)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb(false) return end
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_notifications SET is_dismissed = 1, dismissed_at = NOW() WHERE id = @id AND user = @identifier', 
            {['@id'] = notificationId, ['@identifier'] = Player.PlayerData.citizenid}
        )
        cb(true)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:markNotificationRead', function(source, cb, notificationId)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb(false) return end
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_notifications SET is_read = 1, read_at = NOW() WHERE id = @id AND user = @identifier', 
            {['@id'] = notificationId, ['@identifier'] = Player.PlayerData.citizenid}
        )
        cb(true)
    end)
    
    ESX.RegisterServerCallback('bit-smartphone:clearAllNotifications', function(source, cb)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb(false) return end
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_notifications SET is_dismissed = 1, dismissed_at = NOW() WHERE user = @identifier AND is_dismissed = 0', 
            {['@identifier'] = xPlayer.identifier}
        )
        cb(true)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:clearAllNotifications', function(source, cb)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb(false) return end
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_notifications SET is_dismissed = 1, dismissed_at = NOW() WHERE user = @identifier AND is_dismissed = 0', 
            {['@identifier'] = Player.PlayerData.citizenid}
        )
        cb(true)
    end)
end

RegisterNetEvent('bit-smartphone:addPersistentNotification')
AddEventHandler('bit-smartphone:addPersistentNotification', function(targetSource, notificationData)
    local src = targetSource or source
    local identifier = nil
    
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(src)
        if not xPlayer then return end
        identifier = xPlayer.identifier
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(src)
        if not Player then return end
        identifier = Player.PlayerData.citizenid
    end
    
    if not identifier then return end
    
    local result = SqlFunc(Config.Mysql, 'execute', [[
        INSERT INTO bit_phone_notifications (user, title, message, app, app_id, icon, icon_svg, additional_info, notification_data, priority, expires_at)
        VALUES (@user, @title, @message, @app, @app_id, @icon, @icon_svg, @additional_info, @notification_data, @priority, @expires_at)
    ]], {
        ['@user'] = identifier,
        ['@title'] = notificationData.title or 'Notificación',
        ['@message'] = notificationData.message or '',
        ['@app'] = notificationData.app or 'system',
        ['@app_id'] = notificationData.appId,
        ['@icon'] = notificationData.icon,
        ['@icon_svg'] = notificationData.iconSvg or notificationData.icon_svg or nil,
        ['@additional_info'] = notificationData.additionalInfo,
        ['@notification_data'] = notificationData.data and json.encode(notificationData.data) or nil,
        ['@priority'] = notificationData.priority or 'normal',
        ['@expires_at'] = notificationData.expiresAt
    })
    
    TriggerClientEvent('bit-smartphone:receiveNotification', src, {
        id = result.insertId or os.time(),
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
        persistent = true
    })
end)

exports('SendPersistentNotification', function(playerId, notificationData)
    TriggerEvent('bit-smartphone:addPersistentNotification', playerId, notificationData)
end)

RegisterNetEvent('bit-smartphone:server:saveBattery')
AddEventHandler('bit-smartphone:server:saveBattery', function(batteryLevel)
    local src = source
    
    if not batteryLevel or type(batteryLevel) ~= "number" then
        return
    end
    
    batteryLevel = math.max(0, math.min(100, batteryLevel))
    
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            SqlFunc(Config.Mysql, 'execute', 
                'UPDATE bit_phone SET battery_level = @battery WHERE user = @identifier', 
                {
                    ['@battery'] = batteryLevel,
                    ['@identifier'] = xPlayer.identifier
                }
            )
        end
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then
            SqlFunc(Config.Mysql, 'execute', 
                'UPDATE bit_phone SET battery_level = @battery WHERE user = @identifier', 
                {
                    ['@battery'] = batteryLevel,
                    ['@identifier'] = Player.PlayerData.citizenid
                }
            )
        end
    end
end)