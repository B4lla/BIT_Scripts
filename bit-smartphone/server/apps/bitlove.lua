local function validateBitLoveConfig()
    local issues = {}
    if GetResourceState('screenshot-basic') ~= 'started' then table.insert(issues, 'screenshot-basic no está iniciado') end
    if not Config.PhotoProvider or Config.PhotoProvider == '' then table.insert(issues, 'PhotoProvider no configurado') end
    if #issues > 0 then
        print('[BitLove] Errores de configuración:')
        for _, i in ipairs(issues) do print(' - ' .. i) end
    end
    return (#issues == 0)
end

local function GetPlayerIdentifier(src)
    if Config.Framework == 'esx' or Config.Framework == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        return xPlayer and xPlayer.identifier or nil
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' or Config.Framework == 'QBCore' then
        local Player = QBCore.Functions.GetPlayer(src)
        return Player and (Player.PlayerData and Player.PlayerData.citizenid) or nil
    end
    return nil
end

local function uploadPhotoToService(photoUrl, playerName, photoType)
    if not photoUrl or photoUrl == '' then 
        print('[BitLove] Error: URL de foto vacía')
        return false 
    end
    if not Config.DiscordWebhook or Config.DiscordWebhook == '' then 
        print('[BitLove] Discord webhook no configurado')
        return false 
    end
    
    local embed = {
        {
            title = '📷 BitLove - Nueva Foto',
            description = string.format('**%s** ha subido una nueva foto de perfil', playerName or 'Usuario'),
            color = 16738740,
            image = { url = photoUrl },
            timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
            footer = {
                text = 'BitLove Dating App'
            }
        }
    }
    
    local payload = { 
        username = 'BitLove', 
        embeds = embed 
    }

    PerformHttpRequest(Config.DiscordWebhook, function(status, response)
        if status == 200 or status == 204 then
            print(string.format('[BitLove] Foto notificada en Discord exitosamente'))
        else
            print(string.format('[BitLove] Error notificando Discord: status %s', tostring(status)))
            if response then
                print(string.format('[BitLove] Discord response: %s', tostring(response):sub(1, 200)))
            end
        end
    end, 'POST', json.encode(payload), { 
        ['Content-Type'] = 'application/json',
        ['User-Agent'] = 'BitLove-FiveM/1.0'
    })
    
    return true
end

local function ensureBitLoveSchema()
    local tbl = SqlFunc(Config.Mysql, 'fetchAll', [[
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'bit_phone_bitlove_swipes']])

    if not tbl or #tbl == 0 then
        local createOk = SqlFunc(Config.Mysql, 'execute', [[
            CREATE TABLE IF NOT EXISTS `bit_phone_bitlove_swipes` (
              `id` INT AUTO_INCREMENT PRIMARY KEY,
              `swiper_identifier` VARCHAR(50) NOT NULL,
              `target_identifier` VARCHAR(50) NOT NULL,
              `action` ENUM('like', 'dislike', 'superlike') NOT NULL,
              `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
              UNIQUE KEY `unique_swipe` (`swiper_identifier`, `target_identifier`),
              INDEX `idx_swiper` (`swiper_identifier`),
              INDEX `idx_target` (`target_identifier`),
              INDEX `idx_action` (`action`),
              INDEX `idx_created` (`created_at` DESC)
            ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
        ]])
        if createOk ~= nil then
            print('[BitLove] Tabla bit_phone_bitlove_swipes creada')
        end
    else
        local colSwiper = SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
              AND table_name = 'bit_phone_bitlove_swipes' 
              AND column_name = 'swiper_identifier']])
        if not colSwiper or #colSwiper == 0 then
            local ok = SqlFunc(Config.Mysql, 'execute', [[
                ALTER TABLE `bit_phone_bitlove_swipes`
                ADD COLUMN `swiper_identifier` VARCHAR(50) NOT NULL DEFAULT '' AFTER `id`;
            ]])
            if ok ~= nil then print('[BitLove] Columna swiper_identifier añadida a bit_phone_bitlove_swipes') end
        end

        local colTarget = SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
              AND table_name = 'bit_phone_bitlove_swipes' 
              AND column_name = 'target_identifier']])
        if not colTarget or #colTarget == 0 then
            local ok = SqlFunc(Config.Mysql, 'execute', [[
                ALTER TABLE `bit_phone_bitlove_swipes`
                ADD COLUMN `target_identifier` VARCHAR(50) NOT NULL DEFAULT '' AFTER `swiper_identifier`;
            ]])
            if ok ~= nil then print('[BitLove] Columna target_identifier añadida a bit_phone_bitlove_swipes') end
        end

        local colAction = SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
              AND table_name = 'bit_phone_bitlove_swipes' 
              AND column_name = 'action']])
        if not colAction or #colAction == 0 then
            local ok = SqlFunc(Config.Mysql, 'execute', [[
                ALTER TABLE `bit_phone_bitlove_swipes`
                ADD COLUMN `action` ENUM('like','dislike','superlike') NOT NULL DEFAULT 'like' AFTER `target_identifier`;
            ]])
            if ok ~= nil then print('[BitLove] Columna action añadida a bit_phone_bitlove_swipes') end
        end

        local uniq = SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT 1 FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
              AND table_name = 'bit_phone_bitlove_swipes' 
              AND index_name = 'unique_swipe']])
        if not uniq or #uniq == 0 then
            SqlFunc(Config.Mysql, 'execute', [[
                ALTER TABLE `bit_phone_bitlove_swipes` 
                ADD UNIQUE KEY `unique_swipe` (`swiper_identifier`, `target_identifier`);
            ]])
        end
    end
end

AddEventHandler('onResourceStart', function(res)
    if res ~= GetCurrentResourceName() then return end
    Citizen.CreateThread(function()
        Citizen.Wait(500)
        local ok, err = pcall(ensureBitLoveSchema)
        if not ok then
            print('[BitLove] Error asegurando esquema: ' .. tostring(err))
        end
    end)
end)

RegisterNetEvent('bit-smartphone:bitlove:getMatches', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    local query = [[
        SELECT m.*, 
               CASE WHEN m.user1_identifier = @identifier THEN p2.name ELSE p1.name END as partner_name,
               CASE WHEN m.user1_identifier = @identifier THEN p2.profile_picture ELSE p1.profile_picture END as partner_picture,
               CASE WHEN m.user1_identifier = @identifier THEN m.user2_identifier ELSE m.user1_identifier END as partner_identifier,
               (SELECT COUNT(*) FROM bit_phone_bitlove_messages msg WHERE msg.match_id = m.id AND msg.sender_identifier != @identifier AND msg.is_read = 0) as unread_count,
               (SELECT message FROM bit_phone_bitlove_messages msg WHERE msg.match_id = m.id ORDER BY msg.created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM bit_phone_bitlove_messages msg WHERE msg.match_id = m.id ORDER BY msg.created_at DESC LIMIT 1) as last_message_time
        FROM bit_phone_bitlove_matches m
        LEFT JOIN bit_phone_bitlove_profiles p1 ON m.user1_identifier = p1.identifier
        LEFT JOIN bit_phone_bitlove_profiles p2 ON m.user2_identifier = p2.identifier
        WHERE m.user1_identifier = @identifier OR m.user2_identifier = @identifier
        ORDER BY last_message_time DESC
    ]]
    local matches = SqlFunc(Config.Mysql, 'fetchAll', query, { ['@identifier'] = identifier })
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, { action = 'bitlove:matchesLoaded', success = true, matches = matches or {} })
end)

RegisterNetEvent('bit-smartphone:bitlove:getProfile', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local query = [[
        SELECT p.*, 
               (SELECT COUNT(*) FROM bit_phone_bitlove_matches m WHERE m.user1_identifier = @identifier OR m.user2_identifier = @identifier) as matches_count,
               (SELECT COUNT(*) FROM bit_phone_bitlove_swipes s WHERE s.swiper_identifier = @identifier AND s.action = 'like') as likes_count
        FROM bit_phone_bitlove_profiles p 
        WHERE p.identifier = @identifier
    ]]
    
    local profile = SqlFunc(Config.Mysql, 'fetchAll', query, { ['@identifier'] = identifier })
    
    if profile and profile[1] then
        local photos = {}
        if profile[1].photos and profile[1].photos ~= '' then
            local success, decoded = pcall(json.decode, profile[1].photos)
            if success and type(decoded) == 'table' then
                for i, photo in ipairs(decoded) do
                    if type(photo) == 'string' then
                        table.insert(photos, photo)
                    elseif type(photo) == 'table' and photo.url then
                        table.insert(photos, photo.url)
                    end
                end
            end
        end
        
        profile[1].photos = photos
        
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
            action = 'bitlove:profileLoaded', 
            success = true, 
            profile = profile[1] 
        })
    else
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
            action = 'bitlove:profileLoaded', 
            success = true, 
            profile = {
                name = '',
                age = '',
                bio = '',
                photos = {},
                matches_count = 0,
                likes_count = 0
            }
        })
    end
end)

RegisterNetEvent('bit-smartphone:bitlove:getProfiles', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local query = [[
        SELECT p.* FROM bit_phone_bitlove_profiles p 
        WHERE p.identifier != @identifier 
        AND p.identifier NOT IN (
            SELECT target_identifier FROM bit_phone_bitlove_swipes 
            WHERE swiper_identifier = @identifier
        )
        ORDER BY RAND() 
        LIMIT 20
    ]]
    
    local profiles = SqlFunc(Config.Mysql, 'fetchAll', query, { ['@identifier'] = identifier })
    
    if profiles then
        for i, profile in ipairs(profiles) do
            local photos = {}
            if profile.photos and profile.photos ~= '' then
                local success, decoded = pcall(json.decode, profile.photos)
                if success and type(decoded) == 'table' then
                    for j, photo in ipairs(decoded) do
                        if type(photo) == 'string' then
                            table.insert(photos, photo)
                        elseif type(photo) == 'table' and photo.url then
                            table.insert(photos, photo.url)
                        end
                    end
                end
            end
            profiles[i].photos = photos
        end
    end
    
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
        action = 'bitlove:profilesLoaded', 
        success = true, 
        profiles = profiles or {} 
    })
end)

RegisterNetEvent('bit-smartphone:bitlove:createProfile', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local playerName = data.name or 'Usuario'
    if Config.Framework == 'esx' or Config.Framework == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then playerName = xPlayer.getName() or playerName end
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' or Config.Framework == 'QBCore' then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then playerName = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname end
    end
    
    local success = SqlFunc(Config.Mysql, 'insert', 
        [[INSERT INTO bit_phone_bitlove_profiles (identifier, name, age, bio, photos, created_at) 
          VALUES (@identifier, @name, @age, @bio, @photos, NOW())
          ON DUPLICATE KEY UPDATE name = @name, age = @age, bio = @bio]], 
        { 
            ['@identifier'] = identifier,
            ['@name'] = data.name or playerName,
            ['@age'] = data.age or 18,
            ['@bio'] = data.bio or '',
            ['@photos'] = json.encode(data.photos or {})
        })
    
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
        action = 'bitlove:profileCreated', 
        success = success ~= nil 
    })
end)

RegisterNetEvent('bit-smartphone:bitlove:saveProfile', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local success = SqlFunc(Config.Mysql, 'execute', 
        'UPDATE bit_phone_bitlove_profiles SET name = @name, age = @age, bio = @bio WHERE identifier = @identifier', 
        { 
            ['@identifier'] = identifier,
            ['@name'] = data.name or '',
            ['@age'] = data.age or 18,
            ['@bio'] = data.bio or ''
        })
    
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
        action = 'bitlove:profileSaved', 
        success = success ~= nil 
    })
end)

RegisterNetEvent('bit-smartphone:bitlove:swipeProfile', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local targetIdentifier = data.targetIdentifier
    local action = data.action 
    
    SqlFunc(Config.Mysql, 'insert',
        'INSERT INTO bit_phone_bitlove_swipes (swiper_identifier, target_identifier, action, created_at) VALUES (@swiper, @target, @action, NOW())',
        {
            ['@swiper'] = identifier,
            ['@target'] = targetIdentifier,
            ['@action'] = action
        })
    
    if action == 'like' then
        local mutualLike = SqlFunc(Config.Mysql, 'fetchAll',
            'SELECT * FROM bit_phone_bitlove_swipes WHERE swiper_identifier = @target AND target_identifier = @swiper AND action = "like"',
            {
                ['@swiper'] = identifier,
                ['@target'] = targetIdentifier
            })
        
        if mutualLike and #mutualLike > 0 then
            SqlFunc(Config.Mysql, 'insert',
                'INSERT INTO bit_phone_bitlove_matches (user1_identifier, user2_identifier, created_at) VALUES (@user1, @user2, NOW())',
                {
                    ['@user1'] = identifier,
                    ['@user2'] = targetIdentifier
                })
            
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
                action = 'bitlove:newMatch', 
                success = true,
                targetIdentifier = targetIdentifier
            })

            for _, playerIdStr in ipairs(GetPlayers()) do
                local playerIdNum = tonumber(playerIdStr)
                if playerIdNum then
                    local otherIdentifier = GetPlayerIdentifier(playerIdNum)
                    if otherIdentifier == targetIdentifier then
                        TriggerClientEvent('bit-smartphone:bitloveResponse', playerIdNum, { 
                            action = 'bitlove:newMatch', 
                            success = true,
                            targetIdentifier = identifier
                        })
                        break
                    end
                end
            end
        end
    end
    
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
        action = 'bitlove:swipeProcessed', 
        success = true 
    })
end)

RegisterNetEvent('bit-smartphone:bitlove:getMessages', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local matchId = data.matchId
    
    local messages = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT * FROM bit_phone_bitlove_messages WHERE match_id = @matchId ORDER BY created_at ASC',
        { ['@matchId'] = matchId })
    
    SqlFunc(Config.Mysql, 'execute',
        'UPDATE bit_phone_bitlove_messages SET is_read = 1 WHERE match_id = @matchId AND sender_identifier != @identifier',
        { ['@matchId'] = matchId, ['@identifier'] = identifier })
    
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
        action = 'bitlove:messagesLoaded', 
        success = true,
        messages = messages or {}
    })
end)

RegisterNetEvent('bit-smartphone:bitlove:sendMessage', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    local matchId = data.matchId
    local message = data.message
    local messageType = data.messageType or 'text'
    local matchResult = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_bitlove_matches WHERE id = @matchId AND (user1_identifier = @identifier OR user2_identifier = @identifier)', { ['@matchId'] = matchId, ['@identifier'] = identifier })
    if not matchResult or not matchResult[1] then return end
    local messageId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_bitlove_messages (match_id, sender_identifier, message, message_type, created_at) VALUES (@matchId, @sender, @message, @messageType, NOW())', { ['@matchId'] = matchId, ['@sender'] = identifier, ['@message'] = message, ['@messageType'] = messageType })
    if not messageId or messageId <= 0 then return end
    local match = matchResult[1]
    local targetIdentifier = (match.user1_identifier == identifier) and match.user2_identifier or match.user1_identifier
    local targetPlayer = nil
    for _, playerId in ipairs(GetPlayers()) do if GetPlayerIdentifier(playerId) == targetIdentifier then targetPlayer = playerId break end end
    local messageData = { id = messageId, match_id = matchId, sender_identifier = identifier, message = message, message_type = messageType, is_read = false, created_at = os.date('%Y-%m-%d %H:%M:%S') }
    if targetPlayer then TriggerClientEvent('bit-smartphone:bitloveResponse', targetPlayer, { action = 'bitlove:messageReceived', matchId = matchId, message = messageData }) end
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, { action = 'bitlove:messageSent', success = true, message = messageData })
end)

local photoUploadCooldown = {}

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(600000) 
        local currentTime = GetGameTimer()
        local cleanedCount = 0
        
        for identifier, lastTime in pairs(photoUploadCooldown) do
            if (currentTime - lastTime) > 300000 then 
                photoUploadCooldown[identifier] = nil
                cleanedCount = cleanedCount + 1
            end
        end
        
        if cleanedCount > 0 then
            print(string.format('[BitLove] Limpiados %d cooldowns expirados', cleanedCount))
        end
    end
end)

RegisterNetEvent('bit-smartphone:bitlove:savePhotoUrl')
AddEventHandler('bit-smartphone:bitlove:savePhotoUrl', function(photoData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then
        print('[BitLove] savePhotoUrl: no identifier')
        return
    end
    
    local currentTime = GetGameTimer()
    if photoUploadCooldown[identifier] and (currentTime - photoUploadCooldown[identifier]) < 5000 then
        print('[BitLove] Photo upload cooldown active for ' .. identifier)
        return
    end
    photoUploadCooldown[identifier] = currentTime
    
    if not photoData or not photoData.photoUrl or photoData.photoUrl == '' then
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
            action = 'bitlove:photoSaveError', 
            success = false, 
            message = 'URL de foto inválida' 
        })
        return
    end
    
    local realUrl = photoData.photoUrl
    if string.sub(photoData.photoUrl, 1, 1) == '{' then
        local success, discordData = pcall(json.decode, photoData.photoUrl)
        if success and discordData.attachments and discordData.attachments[1] and discordData.attachments[1].url then
            realUrl = discordData.attachments[1].url
            print('[BitLove] URL extraída de Discord JSON: ' .. realUrl)
        else
            print('[BitLove] Error: No se pudo extraer URL del JSON de Discord')
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
                action = 'bitlove:photoSaveError', 
                success = false, 
                message = 'Error procesando respuesta de Discord' 
            })
            return
        end
    end
    
    if string.len(realUrl) > 2000 then
        print('[BitLove] Error: URL de foto demasiado larga (' .. string.len(realUrl) .. ' caracteres)')
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
            action = 'bitlove:photoSaveError', 
            success = false, 
            message = 'URL de foto demasiado larga' 
        })
        return
    end

    local playerName = 'Usuario'
    if Config.Framework == 'esx' or Config.Framework == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then playerName = xPlayer.getName() or GetPlayerName(src) end
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' or Config.Framework == 'QBCore' then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then playerName = Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname end
    end

    local url = realUrl
    
    Citizen.CreateThread(function()
        if Config.DiscordWebhook and Config.DiscordWebhook ~= '' then
            uploadPhotoToService(url, playerName, photoData.photoType or 'profile')
        end

        local success = SqlFunc(Config.Mysql, 'insert', 
            'INSERT INTO bit_phone_photos (user, url, metadata, created_at) VALUES (@user, @url, @meta, NOW())', 
            { 
                ['@user'] = identifier, 
                ['@url'] = url, 
                ['@meta'] = json.encode({
                    photoId = photoData.photoId,
                    photoType = photoData.photoType or 'profile',
                    timestamp = photoData.timestamp
                })
            })

        if success then
            local profile = SqlFunc(Config.Mysql, 'fetchAll', 
                'SELECT photos FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
                { ['@identifier'] = identifier })
            
            local photos = {}
            if profile and profile[1] and profile[1].photos and profile[1].photos ~= '' then 
                if type(profile[1].photos) == "string" then
                    photos = json.decode(profile[1].photos) or {}
                elseif type(profile[1].photos) == "table" then
                    photos = profile[1].photos
                else
                    photos = {}
                end
            end
            
            table.insert(photos, 1, url)
            
            while #photos > 6 do 
                table.remove(photos) 
            end

            if profile and profile[1] then
                SqlFunc(Config.Mysql, 'execute', 
                    'UPDATE bit_phone_bitlove_profiles SET photos = @photos WHERE identifier = @identifier', 
                    { ['@photos'] = json.encode(photos), ['@identifier'] = identifier })
            else
                SqlFunc(Config.Mysql, 'insert', 
                    'INSERT INTO bit_phone_bitlove_profiles (identifier, name, photos, created_at) VALUES (@identifier, @name, @photos, NOW())', 
                    { ['@identifier'] = identifier, ['@name'] = playerName, ['@photos'] = json.encode(photos) })
            end

            TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
                action = 'bitlove:photoSaved', 
                success = true, 
                photoUrl = url, 
                message = 'Foto guardada correctamente' 
            })
            
            print('[BitLove] Foto guardada exitosamente para ' .. playerName .. ' (' .. identifier .. ')')
        else
            print('[BitLove] Error guardando foto en base de datos')
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, { 
                action = 'bitlove:photoSaveError', 
                success = false, 
                message = 'Error guardando en base de datos' 
            })
        end
    end)
end)

RegisterNetEvent('bit-smartphone:bitlove:savePhotoMetadata')
AddEventHandler('bit-smartphone:bitlove:savePhotoMetadata', function(photoData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    if not photoData or not photoData.photoUrl then return end

    local realUrl = photoData.photoUrl
    if string.sub(photoData.photoUrl, 1, 1) == '{' then
        local success, discordData = pcall(json.decode, photoData.photoUrl)
        if success and discordData.attachments and discordData.attachments[1] and discordData.attachments[1].url then
            realUrl = discordData.attachments[1].url
            print('[BitLove] URL extraída de Discord JSON: ' .. realUrl)
        else
            print('[BitLove] Error: No se pudo extraer URL del JSON de Discord')
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, { action = 'bitlove:photoSaveError', success = false, message = 'Error procesando respuesta de Discord' })
            return
        end
    end

    if string.len(realUrl) > 1000 then
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, { action = 'bitlove:photoSaveError', success = false, message = 'URL demasiado larga' })
        return
    end

    SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_photos (user, url, metadata, created_at) VALUES (@user, @url, @meta, NOW())', { ['@user'] = identifier, ['@url'] = realUrl, ['@meta'] = json.encode(photoData.metadata or {}) })

    local profile = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT photos FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', { ['@identifier'] = identifier })
    local photos = {}
    if profile and profile[1] and profile[1].photos and profile[1].photos ~= '' then 
        if type(profile[1].photos) == "string" then
            photos = json.decode(profile[1].photos) or {}
        elseif type(profile[1].photos) == "table" then
            photos = profile[1].photos
        else
            photos = {}
        end
    end
    table.insert(photos, 1, { url = realUrl, timestamp = photoData.timestamp or os.time(), type = photoData.type or 'profile' })
    while #photos > 6 do table.remove(photos) end

    if profile and profile[1] then
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_bitlove_profiles SET photos = @photos WHERE identifier = @identifier', { ['@photos'] = json.encode(photos), ['@identifier'] = identifier })
    else
        SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_bitlove_profiles (identifier, name, photos, created_at) VALUES (@identifier, @name, @photos, NOW())', { ['@identifier'] = identifier, ['@name'] = 'Usuario', ['@photos'] = json.encode(photos) })
    end

    TriggerClientEvent('bit-smartphone:bitloveResponse', src, { action = 'bitlove:photoSaved', success = true })
end)

RegisterNetEvent('bitlove:saveProfile')
AddEventHandler('bitlove:saveProfile', function(profileData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_bitlove_profiles SET name = @name, age = @age, bio = @bio, photos = @photos WHERE identifier = @identifier', { ['@identifier'] = identifier, ['@name'] = profileData.name or '', ['@age'] = profileData.age or 18, ['@bio'] = profileData.bio or '', ['@photos'] = json.encode(profileData.photos or {}) })
    TriggerClientEvent('phone:bitloveResponse', src, { action = 'bitlove:profileSaved', success = true })
end)

CreateThread(function() Wait(2000) validateBitLoveConfig() end)

RegisterNetEvent('bit-smartphone:bitlove:uploadPhoto', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local photoUrl = data.photoUrl
    local isProfilePicture = data.isProfilePicture or false
    
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT photos, profile_picture FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
    
    if result and result[1] then
        local photos = {}
        local photosData = result[1].photos or '[]'
        if type(photosData) == "string" then
            photos = json.decode(photosData) or {}
        elseif type(photosData) == "table" then
            photos = photosData
        else
            photos = {}
        end
        table.insert(photos, photoUrl)
        
        local updateQuery = 'UPDATE bit_phone_bitlove_profiles SET photos = @photos'
        local params = {['@photos'] = json.encode(photos), ['@identifier'] = identifier}
        
        if isProfilePicture then
            updateQuery = updateQuery .. ', profile_picture = @profile_picture'
            params['@profile_picture'] = photoUrl
        end
        
        updateQuery = updateQuery .. ' WHERE identifier = @identifier'
        
        local affectedRows = SqlFunc(Config.Mysql, 'execute', updateQuery, params)
        
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:photoUploaded',
            success = (affectedRows and affectedRows > 0),
            photoUrl = photoUrl
        })
    end
end)

RegisterNetEvent('bit-smartphone:bitlove:takePhoto', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
        action = 'bitlove:cameraRequested',
        success = true,
        message = 'Camera activated'
    })
end)


RegisterNetEvent('bit-smartphone:camera:savePhoto')
AddEventHandler('bit-smartphone:camera:savePhoto', function(photoData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    
    local result = SqlFunc(Config.Mysql, 'execute', 
        'INSERT INTO bit_phone_photos (user, url, created_at) VALUES (@user, @url, NOW())', 
        {
            ['@user'] = identifier,
            ['@url'] = photoData.url
        })
    
    
    if photoData.type == 'profile' then
        
        local profileResult = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT photos FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
            {['@identifier'] = identifier})
        
        local photos = {}
        if profileResult and profileResult[1] and profileResult[1].photos then
            if type(profileResult[1].photos) == "string" then
                photos = json.decode(profileResult[1].photos) or {}
            elseif type(profileResult[1].photos) == "table" then
                photos = profileResult[1].photos
            else
                photos = {}
            end
        end
        
        
        table.insert(photos, 1, photoData.url)
        
        
        SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_bitlove_profiles SET photos = @photos WHERE identifier = @identifier', 
            {
                ['@identifier'] = identifier,
                ['@photos'] = json.encode(photos)
            })
    end
    
end)

local function uploadPhotoToService(photoUrl, playerName, photoType)
    if not photoUrl or photoUrl == '' then 
        print('[BitLove] Error: URL de foto vacía o inválida')
        return false
    end
    
    if Config.DiscordWebhook and Config.DiscordWebhook ~= '' then
        local embed = {
            {
                title = "📷 Nueva Foto de Perfil - BitLove",
                description = string.format("**%s** ha subido una nueva foto de perfil para BitLove", playerName or "Usuario"),
                color = 16738740,
                image = {
                    url = photoUrl
                },
                fields = {
                    {
                        name = "🎯 Tipo",
                        value = photoType or "Perfil BitLove",
                        inline = true
                    },
                    {
                        name = "⏰ Fecha",
                        value = os.date("%d/%m/%Y %H:%M:%S"),
                        inline = true
                    },
                    {
                        name = "🔗 URL",
                        value = string.format("[Ver Imagen](%s)", photoUrl),
                        inline = false
                    }
                },
                footer = {
                    text = "BIT Smartphone - BitLove Dating App",
                    icon_url = "https://cdn.discordapp.com/emojis/1051123572600090664.png"
                },
                timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ")
            }
        }
        
        local payload = {
            username = "BitLove Dating",
            avatar_url = "https://cdn.discordapp.com/emojis/1051123572600090664.png",
            embeds = embed
        }
        
        PerformHttpRequest(Config.DiscordWebhook, function(status, response)
            if status == 200 or status == 204 then
                print(string.format('[BitLove] Foto notificada correctamente en Discord: %s', photoUrl))
            else
                print(string.format('[BitLove] Error al notificar en Discord: %s (Status: %s)', response, status))
            end
        end, 'POST', json.encode(payload), {['Content-Type'] = 'application/json'})
    else
        print('[BitLove] Webhook de Discord no configurado, foto guardada solo localmente')
    end
    
    return true
end

RegisterNetEvent('bit-smartphone:bitlove:savePhotoToProfile', function(photoData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local playerName = "Usuario"
    if Config.Framework == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            playerName = xPlayer.getName() or GetPlayerName(src)
        end
    elseif Config.Framework == 'QBCore' then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then
            playerName = Player.PlayerData.charinfo.firstname .. " " .. Player.PlayerData.charinfo.lastname
        end
    end

    local realUrl = photoData.photoUrl
    if photoData.photoUrl and string.sub(photoData.photoUrl, 1, 1) == '{' then
        local success, discordData = pcall(json.decode, photoData.photoUrl)
        if success and discordData.attachments and discordData.attachments[1] and discordData.attachments[1].url then
            realUrl = discordData.attachments[1].url
            print('[BitLove] URL extraída de Discord JSON: ' .. realUrl)
        else
            print('[BitLove] Error: No se pudo extraer URL del JSON de Discord')
            return
        end
    end

    if realUrl and realUrl ~= '' then
        uploadPhotoToService(realUrl, playerName, photoData.type or "Perfil BitLove")
        
        SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_phone_photos (user, url, created_at) VALUES (@user, @url, NOW())', 
            {
                ['@user'] = identifier,
                ['@url'] = realUrl
            })
    end

    local profileResult = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT photos, profile_picture FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
        {['@identifier'] = identifier})
    
    if profileResult and profileResult[1] then
        local photos = {}
        local photosData = profileResult[1].photos or '[]'
        if type(photosData) == "string" then
            photos = json.decode(photosData) or {}
        elseif type(photosData) == "table" then
            photos = photosData
        else
            photos = {}
        end
        
        local photoEntry = {
            id = photoData.photoId or ('bitlove_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)),
            url = realUrl or '',
            timestamp = photoData.timestamp or os.time(),
            type = photoData.type or 'profile'
        }
        
        table.insert(photos, photoEntry)
        
        local updateQuery = 'UPDATE bit_phone_bitlove_profiles SET photos = @photos'
        local params = {['@photos'] = json.encode(photos), ['@identifier'] = identifier}
        
        if realUrl and realUrl ~= '' and 
           (not profileResult[1].profile_picture or profileResult[1].profile_picture == '') then
            updateQuery = updateQuery .. ', profile_picture = @profile_picture'
            params['@profile_picture'] = realUrl
        end
        
        updateQuery = updateQuery .. ' WHERE identifier = @identifier'
        SqlFunc(Config.Mysql, 'execute', updateQuery, params)
        
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = true,
            photo = photoEntry,
            photos = photos
        })
        
        print(string.format('[BitLove] Photo saved for player %s: %s', playerName, realUrl or 'no URL'))
    else
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = false,
            error = 'Profile not found'
        })
    end
end)


RegisterNetEvent('bit-smartphone:bitlove:capturePhoto', function(photoType, metadata)
    local playerId = source
    print(string.format('[BitLove] Player %s requesting photo capture', GetPlayerName(playerId)))
end)

RegisterNetEvent('bit-smartphone:bitlove:savePhotoUrl')
AddEventHandler('bit-smartphone:bitlove:savePhotoUrl', function(photoData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then 
        print('[BitLove] Error: No se pudo obtener el identificador del jugador')
        return 
    end
    
    local playerName = "Usuario"
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            playerName = xPlayer.getName() or GetPlayerName(src)
        end
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then
            playerName = Player.PlayerData.charinfo.firstname .. " " .. Player.PlayerData.charinfo.lastname
        end
    end
    
    if not photoData.photoUrl or photoData.photoUrl == '' then
        print('[BitLove] Error: URL de foto inválida')
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:photoSaveError',
            success = false,
            message = 'URL de foto inválida'
        })
        return
    end
    
    local realUrl = photoData.photoUrl
    if string.sub(photoData.photoUrl, 1, 1) == '{' then
        local success, discordData = pcall(json.decode, photoData.photoUrl)
        if success and discordData.attachments and discordData.attachments[1] and discordData.attachments[1].url then
            realUrl = discordData.attachments[1].url
            print('[BitLove] URL extraída de Discord JSON: ' .. realUrl)
        else
            print('[BitLove] Error: No se pudo extraer URL del JSON de Discord')
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                action = 'bitlove:photoSaveError',
                success = false,
                message = 'Error procesando respuesta de Discord'
            })
            return
        end
    end
    
    print('[BitLove] Guardando foto URL para jugador: ' .. playerName .. ' | URL: ' .. realUrl)
    
    local photoId = 'bitlove_' .. identifier .. '_' .. os.time()
    
    local insertResult = SqlFunc(Config.Mysql, 'insert', 
        'INSERT INTO bit_phone_photos (user, url, metadata, created_at) VALUES (@user, @url, @metadata, NOW())',
        {
            ['@user'] = identifier,
            ['@url'] = realUrl,
            ['@metadata'] = json.encode({
                photoId = photoId,
                photoType = photoData.photoType or 'profile',
                app = 'bitlove',
                timestamp = os.time()
            })
        }
    )
    
    if insertResult then
        print('[BitLove] Foto guardada exitosamente en la base de datos')
        
        local profile = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT photos FROM bit_phone_bitlove_profiles WHERE identifier = @identifier',
            {['@identifier'] = identifier}
        )
        
        local photos = {}
        if profile and profile[1] and profile[1].photos then
            if type(profile[1].photos) == "string" then
                photos = json.decode(profile[1].photos) or {}
            elseif type(profile[1].photos) == "table" then
                photos = profile[1].photos
            else
                photos = {}
            end
        end
        
        table.insert(photos, 1, realUrl)
        
        if #photos > 6 then
            for i = 7, #photos do
                photos[i] = nil
            end
        end
        
        if profile and profile[1] then
            SqlFunc(Config.Mysql, 'execute',
                'UPDATE bit_phone_bitlove_profiles SET photos = @photos WHERE identifier = @identifier',
                {
                    ['@photos'] = json.encode(photos),
                    ['@identifier'] = identifier
                }
            )
        else
                SqlFunc(Config.Mysql, 'insert',
                'INSERT INTO bit_phone_bitlove_profiles (identifier, name, age, bio, photos, created_at) VALUES (@identifier, @name, @age, @bio, @photos, @created_at)',
                {
                    ['@identifier'] = identifier,
                    ['@name'] = playerName,
                    ['@age'] = 25,
                    ['@bio'] = '',
                    ['@photos'] = json.encode(photos),
                    ['@created_at'] = os.date('%Y-%m-%d %H:%M:%S', os.time())
                }
            )
        end
        
        print('[BitLove] Perfil actualizado exitosamente')
        
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = true,
            photoUrl = realUrl,
            message = 'Foto guardada exitosamente'
        })
    else
        print('[BitLove] Error al guardar foto en la base de datos')
        print('[BitLove] insertResult:', tostring(insertResult))
        
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:photoSaveError',
            success = false,
            message = 'Error al guardar en la base de datos'
        })
    end
end)

RegisterNetEvent('bit-smartphone:bitlove:savePhotoMetadata')
AddEventHandler('bit-smartphone:bitlove:savePhotoMetadata', function(photoData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    
    if not photoData or not photoData.photoUrl then
        print('[BitLove] Error: Datos de foto inválidos')
        return
    end
    
    if string.len(photoData.photoUrl) > 500 then
        print('[BitLove] Error: URL de foto demasiado larga - usar bitlove:takePhoto en su lugar')
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:photoSaveError',
            success = false,
            message = 'Usar captura automática en su lugar'
        })
        return
    end
    
    if not identifier then 
        print('[BitLove] Error: No se pudo obtener el identificador del jugador')
        return 
    end
    
    local playerName = "Usuario"
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            playerName = xPlayer.getName() or GetPlayerName(src)
        end
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then
            playerName = Player.PlayerData.charinfo.firstname .. " " .. Player.PlayerData.charinfo.lastname
        end
    end
    
    if not photoData.photoUrl or photoData.photoUrl == '' then
        print('[BitLove] Error: URL de foto inválida')
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:photoSaveError',
            success = false,
            message = 'URL de foto inválida'
        })
        return
    end
    
    local realUrl = photoData.photoUrl
    if string.sub(photoData.photoUrl, 1, 1) == '{' then
        local success, discordData = pcall(json.decode, photoData.photoUrl)
        if success and discordData.attachments and discordData.attachments[1] and discordData.attachments[1].url then
            realUrl = discordData.attachments[1].url
            print('[BitLove] URL extraída de Discord JSON: ' .. realUrl)
        else
            print('[BitLove] Error: No se pudo extraer URL del JSON de Discord')
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                action = 'bitlove:photoSaveError',
                success = false,
                message = 'Error procesando respuesta de Discord'
            })
            return
        end
    end
    
    print('[BitLove] Guardando foto para jugador: ' .. playerName .. ' | URL: ' .. realUrl)
    
    if realUrl and string.len(realUrl) < 1000000 then 
        uploadPhotoToService(realUrl, playerName, photoData.type or "Perfil BitLove")
    end
    
    local photoResult = SqlFunc(Config.Mysql, 'execute', 
        'INSERT INTO bit_phone_photos (user, url, created_at) VALUES (@user, @url, NOW())', 
        {
            ['@user'] = identifier,
            ['@url'] = realUrl
        })
    
    local profileCheck = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT identifier FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
        {['@identifier'] = identifier})
    
    if not profileCheck or not profileCheck[1] then
        SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_phone_bitlove_profiles (identifier, name, photos, created_at) VALUES (@identifier, @name, @photos, NOW())', 
            {
                ['@identifier'] = identifier,
                ['@name'] = playerName,
                ['@photos'] = json.encode({})
            })
    end
    
    local profileResult = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT photos, profile_picture FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
        {['@identifier'] = identifier})
    
    if profileResult and profileResult[1] then
        local photos = {}
        local photosData = profileResult[1].photos or '[]'
        if type(photosData) == "string" then
            photos = json.decode(photosData) or {}
        elseif type(photosData) == "table" then
            photos = photosData
        else
            photos = {}
        end
        
        local photoEntry = {
            id = photoData.photoId,
            url = realUrl,
            timestamp = photoData.timestamp or GetGameTimer(),
            type = photoData.type or 'profile'
        }
        
        table.insert(photos, 1, photoEntry)
        
        if #photos > 6 then
            for i = 7, #photos do
                photos[i] = nil
            end
        end
        
        local updateQuery = 'UPDATE bit_phone_bitlove_profiles SET photos = @photos'
        local params = {['@photos'] = json.encode(photos), ['@identifier'] = identifier}
        
        if not profileResult[1].profile_picture or profileResult[1].profile_picture == '' then
            updateQuery = updateQuery .. ', profile_picture = @profile_picture'
            params['@profile_picture'] = photoEntry.url
        end
        
        updateQuery = updateQuery .. ' WHERE identifier = @identifier'
        
        local updateResult = SqlFunc(Config.Mysql, 'execute', updateQuery, params)
        
        if updateResult then
            print('[BitLove] Foto guardada exitosamente para el jugador: ' .. playerName)
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                action = 'bitlove:photoSaved',
                success = true,
                photo = photoEntry,
                photos = photos,
                message = 'Foto guardada correctamente'
            })
        else
            print('[BitLove] Error al actualizar el perfil con la nueva foto')
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                action = 'bitlove:photoSaveError',
                success = false,
                message = 'Error al guardar la foto en el perfil'
            })
        end
    else
        print('[BitLove] Error: No se pudo obtener el perfil del jugador')
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:photoSaveError',
            success = false,
            message = 'Error al acceder al perfil'
        })
    end
end)


RegisterNetEvent('bitlove:saveProfile')
AddEventHandler('bitlove:saveProfile', function(profileData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    
    local result = SqlFunc(Config.Mysql, 'execute', 
        'UPDATE bit_phone_bitlove_profiles SET name = @name, age = @age, bio = @bio, photos = @photos WHERE identifier = @identifier', 
        {
            ['@identifier'] = identifier,
            ['@name'] = profileData.name or '',
            ['@age'] = profileData.age or 18,
            ['@bio'] = profileData.bio or '',
            ['@photos'] = json.encode(profileData.photos or {})
        })
    
    TriggerClientEvent('phone:bitloveResponse', src, {
        action = 'bitlove:profileSaved',
        success = (result and result > 0)
    })
end)

RegisterNetEvent('bitlove:saveProfilePhoto', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    if not data.photoUrl or not data.photoData then
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = false,
            error = 'Datos de foto inválidos'
        })
        return
    end
    
    local playerName = "Usuario"
    if Config.Framework == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            playerName = xPlayer.getName() or GetPlayerName(src)
        end
    elseif Config.Framework == 'QBCore' then
        local Player = QBCore.Functions.GetPlayer(src)
        if Player then
            playerName = Player.PlayerData.charinfo.firstname .. " " .. Player.PlayerData.charinfo.lastname
        end
    end
    
    uploadPhotoToService(data.photoUrl, playerName, "Perfil BitLove")
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT photos FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
    
    if result and result[1] then
        local photos = {}
        
        if result[1].photos and result[1].photos ~= '' then
            local success, decoded = pcall(json.decode, result[1].photos)
            if success and type(decoded) == 'table' then
                photos = decoded
            end
        end
        
        table.insert(photos, data.photoData)
        
        local updateResult = SqlFunc(Config.Mysql, 'execute', 
            'UPDATE bit_phone_bitlove_profiles SET photos = @photos WHERE identifier = @identifier', 
            {
                ['@identifier'] = identifier,
                ['@photos'] = json.encode(photos)
            })
        
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = (updateResult and updateResult > 0),
            photo = data.photoData
        })
    else
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = false,
            error = 'Perfil no encontrado'
        })
    end
end)

CreateThread(function()
    Wait(2000) 
    validateBitLoveConfig()
end)

RegisterNetEvent('bit-smartphone:bitlove:getMyPhotos')
AddEventHandler('bit-smartphone:bitlove:getMyPhotos', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end

    local rows = SqlFunc(Config.Mysql, 'fetchAll', [[
        SELECT url, metadata, created_at 
        FROM bit_phone_photos 
        WHERE user = @user 
        ORDER BY created_at DESC 
        LIMIT 50
    ]], { ['@user'] = identifier }) or {}

    local urls = {}
    local seen = {}
    for _, r in ipairs(rows) do
        local u = r.url
        if type(u) == 'string' and u ~= '' and not seen[u] then
            table.insert(urls, u)
            seen[u] = true
        end
    end

    TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
        action = 'bitlove:myPhotosLoaded',
        success = true,
        photos = urls
    })
end)