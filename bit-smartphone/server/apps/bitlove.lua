local function GetPlayerIdentifier(src)
    if Config.Framework == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        return xPlayer and xPlayer.identifier or nil
    elseif Config.Framework == 'QBCore' then
        local Player = QBCore.Functions.GetPlayer(src)
        return Player and Player.PlayerData.citizenid or nil
    end
end


RegisterNetEvent('bit-smartphone:bitlove:getProfile', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end

    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
    if result and result[1] then
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:profileLoaded',
            success = true,
            profile = result[1]
        })
    else
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:profileLoaded',
            success = false,
            profile = nil
        })
    end
end)


RegisterNetEvent('bit-smartphone:bitlove:createProfile', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
    if result and result[1] then
        
        local affectedRows = SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_bitlove_profiles SET name = @name, bio = @bio, age = @age, gender = @gender, interested_in = @interested_in, profile_picture = @profile_picture, updated_at = NOW() WHERE identifier = @identifier', {
            ['@name'] = data.name,
            ['@bio'] = data.bio,
            ['@age'] = data.age,
            ['@gender'] = data.gender,
            ['@interested_in'] = data.interested_in,
            ['@profile_picture'] = data.profile_picture,
            ['@identifier'] = identifier
        })
        
        if affectedRows > 0 then
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                action = 'bitlove:profileCreated',
                success = true,
                profile = data
            })
        end
    else
        
        local insertId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_bitlove_profiles (identifier, name, bio, age, gender, interested_in, profile_picture, photos, created_at, updated_at) VALUES (@identifier, @name, @bio, @age, @gender, @interested_in, @profile_picture, @photos, NOW(), NOW())', {
            ['@identifier'] = identifier,
            ['@name'] = data.name,
            ['@bio'] = data.bio,
            ['@age'] = data.age,
            ['@gender'] = data.gender,
            ['@interested_in'] = data.interested_in,
            ['@profile_picture'] = data.profile_picture,
            ['@photos'] = json.encode({})
        })
        
        if insertId and insertId > 0 then
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                action = 'bitlove:profileCreated',
                success = true,
                profile = data
            })
        end
    end
end)


RegisterNetEvent('bit-smartphone:bitlove:getProfiles', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    
    local userProfile = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT gender, interested_in FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
    if not userProfile or not userProfile[1] then 
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:profilesLoaded',
            profiles = {}
        })
        return 
    end
    
    local userGender = userProfile[1].gender
    local interestedIn = userProfile[1].interested_in
    
    
    local query = [[
        SELECT p.* FROM bit_phone_bitlove_profiles p 
        WHERE p.identifier != @identifier 
        AND p.gender = @interested_in
        AND p.interested_in = @user_gender
        AND p.identifier NOT IN (
            SELECT target_identifier FROM bit_phone_bitlove_swipes 
            WHERE swiper_identifier = @identifier
        )
        ORDER BY RAND() 
        LIMIT 20
    ]]
    
    local profiles = SqlFunc(Config.Mysql, 'fetchAll', query, {
        ['@identifier'] = identifier, 
        ['@interested_in'] = interestedIn, 
        ['@user_gender'] = userGender
    })
    
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
        action = 'bitlove:profilesLoaded',
        profiles = profiles or {}
    })
end)


RegisterNetEvent('bit-smartphone:bitlove:swipeProfile', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local targetIdentifier = data.targetId
    local action = data.action 
    
    
    local insertId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_bitlove_swipes (swiper_identifier, target_identifier, action, created_at) VALUES (@swiper, @target, @action, NOW())', {
        ['@swiper'] = identifier,
        ['@target'] = targetIdentifier,
        ['@action'] = action
    })
    
    if insertId and insertId > 0 and action == 'like' then
        
        local mutualLike = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_bitlove_swipes WHERE swiper_identifier = @target AND target_identifier = @swiper AND action = "like"', {
            ['@target'] = targetIdentifier, 
            ['@swiper'] = identifier
        })
        
        if mutualLike and mutualLike[1] then
            
            local matchId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_bitlove_matches (user1_identifier, user2_identifier, created_at) VALUES (@user1, @user2, NOW())', {
                ['@user1'] = identifier, 
                ['@user2'] = targetIdentifier
            })
            
            if matchId and matchId > 0 then
                
                local targetProfile = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = targetIdentifier})
                
                TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                    action = 'bitlove:swipeResult',
                    success = true,
                    match = true,
                    matchId = matchId,
                    profile = targetProfile[1]
                })
                
                
                local targetPlayer = nil
                for _, playerId in ipairs(GetPlayers()) do
                    if GetPlayerIdentifier(playerId) == targetIdentifier then
                        targetPlayer = playerId
                        break
                    end
                end
                
                if targetPlayer then
                    local userProfile = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
                    TriggerClientEvent('bit-smartphone:bitloveResponse', targetPlayer, {
                        action = 'bitlove:newMatch',
                        matchId = matchId,
                        profile = userProfile[1]
                    })
                end
            end
        else
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                action = 'bitlove:swipeResult',
                success = true,
                match = false
            })
        end
    else
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:swipeResult',
            success = true,
            match = false
        })
    end
end)


RegisterNetEvent('bit-smartphone:bitlove:getMatches', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local query = [[
        SELECT m.*, 
               CASE 
                   WHEN m.user1_identifier = @identifier THEN p2.name 
                   ELSE p1.name 
               END as partner_name,
               CASE 
                   WHEN m.user1_identifier = @identifier THEN p2.profile_picture 
                   ELSE p1.profile_picture 
               END as partner_picture,
               CASE 
                   WHEN m.user1_identifier = @identifier THEN m.user2_identifier 
                   ELSE m.user1_identifier 
               END as partner_identifier,
               (SELECT COUNT(*) FROM bit_phone_bitlove_messages msg 
                WHERE msg.match_id = m.id AND msg.sender_identifier != @identifier AND msg.is_read = 0) as unread_count,
               (SELECT message FROM bit_phone_bitlove_messages msg 
                WHERE msg.match_id = m.id ORDER BY msg.created_at DESC LIMIT 1) as last_message,
               (SELECT created_at FROM bit_phone_bitlove_messages msg 
                WHERE msg.match_id = m.id ORDER BY msg.created_at DESC LIMIT 1) as last_message_time
        FROM bit_phone_bitlove_matches m
        LEFT JOIN bit_phone_bitlove_profiles p1 ON m.user1_identifier = p1.identifier
        LEFT JOIN bit_phone_bitlove_profiles p2 ON m.user2_identifier = p2.identifier
        WHERE m.user1_identifier = @identifier OR m.user2_identifier = @identifier
        ORDER BY last_message_time DESC
    ]]
    
    local matches = SqlFunc(Config.Mysql, 'fetchAll', query, {['@identifier'] = identifier})
    
    TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
        action = 'bitlove:matchesLoaded',
        success = true,
        matches = matches or {}
    })
end)


RegisterNetEvent('bit-smartphone:bitlove:sendMessage', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local matchId = data.matchId
    local message = data.message
    local messageType = data.messageType or 'text'
    
    
    local matchResult = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_bitlove_matches WHERE id = @matchId AND (user1_identifier = @identifier OR user2_identifier = @identifier)', {
        ['@matchId'] = matchId, 
        ['@identifier'] = identifier
    })
    
    if matchResult and matchResult[1] then
        
        local messageId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_bitlove_messages (match_id, sender_identifier, message, message_type, created_at) VALUES (@matchId, @sender, @message, @messageType, NOW())', {
            ['@matchId'] = matchId, 
            ['@sender'] = identifier, 
            ['@message'] = message, 
            ['@messageType'] = messageType
        })
        
        if messageId and messageId > 0 then
            
            local match = matchResult[1]
            local targetIdentifier = (match.user1_identifier == identifier) and match.user2_identifier or match.user1_identifier
            
            
            local targetPlayer = nil
            for _, playerId in ipairs(GetPlayers()) do
                if GetPlayerIdentifier(playerId) == targetIdentifier then
                    targetPlayer = playerId
                    break
                end
            end
            
            local messageData = {
                id = messageId,
                match_id = matchId,
                sender_identifier = identifier,
                message = message,
                message_type = messageType,
                is_read = false,
                created_at = os.date('%Y-%m-%d %H:%M:%S')
            }
            
            if targetPlayer then
                TriggerClientEvent('bit-smartphone:bitloveResponse', targetPlayer, {
                    action = 'bitlove:messageReceived',
                    matchId = matchId,
                    message = messageData
                })
            end
            
            TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
                action = 'bitlove:messageSent',
                success = true,
                message = messageData
            })
        end
    end
end)


RegisterNetEvent('bit-smartphone:bitlove:getMessages', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local matchId = data.matchId
    
    
    local matchResult = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_bitlove_matches WHERE id = @matchId AND (user1_identifier = @identifier OR user2_identifier = @identifier)', {
        ['@matchId'] = matchId, 
        ['@identifier'] = identifier
    })
    
    if matchResult and matchResult[1] then
        
        local messages = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_bitlove_messages WHERE match_id = @matchId ORDER BY created_at ASC', {['@matchId'] = matchId})
        
        
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_bitlove_messages SET is_read = 1 WHERE match_id = @matchId AND sender_identifier != @identifier', {
            ['@matchId'] = matchId, 
            ['@identifier'] = identifier
        })
        
        
        for _, msg in ipairs(messages or {}) do
            msg.isMine = (msg.sender_identifier == identifier)
        end
        
        TriggerClientEvent('bit-smartphone:bitloveResponse', src, {
            action = 'bitlove:messagesLoaded',
            success = true,
            messages = messages or {}
        })
    end
end)


RegisterNetEvent('bit-smartphone:bitlove:uploadPhoto', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local photoUrl = data.photoUrl
    local isProfilePicture = data.isProfilePicture or false
    
    
    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT photos, profile_picture FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
    
    if result and result[1] then
        local photos = json.decode(result[1].photos or '[]')
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
        'INSERT INTO bit_phone_photos (user, image_url, created_at) VALUES (@user, @image_url, NOW())', 
        {
            ['@user'] = identifier,
            ['@image_url'] = photoData.url
        })
    
    
    if photoData.type == 'profile' then
        
        local profileResult = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT photos FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
            {['@identifier'] = identifier})
        
        local photos = {}
        if profileResult and profileResult[1] and profileResult[1].photos then
            photos = json.decode(profileResult[1].photos) or {}
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
    if not photoUrl or photoUrl == '' then return end
    
    if Config.PhotoProvider == 'fmsdk' then
        print(string.format('[BitLove] Photo saved to FiveManage: %s', photoUrl))
    elseif Config.DiscordWebhook and Config.DiscordWebhook ~= '' then
        local embed = {
            {
                title = "📷 Nueva Foto de Perfil - BitLove",
                description = string.format("**%s** ha subido una nueva foto de perfil", playerName or "Usuario"),
                color = 16738740,
                image = {
                    url = photoUrl
                },
                fields = {
                    {
                        name = "🎯 Tipo",
                        value = photoType or "Perfil",
                        inline = true
                    },
                    {
                        name = "⏰ Fecha",
                        value = os.date("%d/%m/%Y %H:%M:%S"),
                        inline = true
                    }
                },
                footer = {
                    text = "BIT Smartphone - BitLove App",
                    icon_url = "https://cdn.discordapp.com/emojis/1051123572600090664.png"
                },
                timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ")
            }
        }
        
        local payload = {
            username = "BIT Smartphone",
            avatar_url = "https://cdn.discordapp.com/emojis/1051123572600090664.png",
            embeds = embed
        }
        
        PerformHttpRequest(Config.DiscordWebhook, function(status, response)
            if status == 200 or status == 204 then
                print(string.format('[BitLove] Photo uploaded to Discord: %s', photoUrl))
            else
                print(string.format('[BitLove] Error uploading to Discord: %s (Status: %s)', response, status))
            end
        end, 'POST', json.encode(payload), {['Content-Type'] = 'application/json'})
    end
end

local function captureAndSavePhoto(playerId, photoType, metadata)
    local playerName = "Usuario"
    local identifier = GetPlayerIdentifier(playerId)
    
    if not identifier then return false end
    
    if Config.Framework == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(playerId)
        if xPlayer then
            playerName = xPlayer.getName() or GetPlayerName(playerId)
        end
    elseif Config.Framework == 'QBCore' then
        local Player = QBCore.Functions.GetPlayer(playerId)
        if Player then
            playerName = Player.PlayerData.charinfo.firstname .. " " .. Player.PlayerData.charinfo.lastname
        end
    end
    
    if Config.PhotoProvider == 'screenshot-basic' then
        exports['screenshot-basic']:requestClientScreenshot(playerId, {
            fileName = 'bitlove_' .. identifier .. '_' .. os.time()
        }, function(url)
            if url then
                uploadPhotoToService(url, playerName, photoType or "Perfil BitLove")
                
                local photoId = 'bitlove_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)
                
                SqlFunc(Config.Mysql, 'execute', 
                    'INSERT INTO bit_phone_photos (user, image_url, created_at) VALUES (@user, @image_url, NOW())', 
                    {
                        ['@user'] = identifier,
                        ['@image_url'] = url
                    })
                
                local profileResult = SqlFunc(Config.Mysql, 'fetchAll', 
                    'SELECT photos, profile_picture FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
                    {['@identifier'] = identifier})
                
                if profileResult and profileResult[1] then
                    local photos = json.decode(profileResult[1].photos or '[]')
                    
                    local photoEntry = {
                        id = photoId,
                        url = url,
                        timestamp = os.time(),
                        type = photoType or 'profile'
                    }
                    
                    table.insert(photos, photoEntry)
                    
                    local updateQuery = 'UPDATE bit_phone_bitlove_profiles SET photos = @photos'
                    local params = {['@photos'] = json.encode(photos), ['@identifier'] = identifier}
                    
                    if not profileResult[1].profile_picture or profileResult[1].profile_picture == '' then
                        updateQuery = updateQuery .. ', profile_picture = @profile_picture'
                        params['@profile_picture'] = url
                    end
                    
                    updateQuery = updateQuery .. ' WHERE identifier = @identifier'
                    SqlFunc(Config.Mysql, 'execute', updateQuery, params)
                    
                    TriggerClientEvent('bit-smartphone:bitloveResponse', playerId, {
                        action = 'bitlove:photoSaved',
                        success = true,
                        photo = photoEntry,
                        photos = photos
                    })
                    
                    print(string.format('[BitLove] Photo saved for player %s: %s', playerName, url))
                else
                    TriggerClientEvent('bit-smartphone:bitloveResponse', playerId, {
                        action = 'bitlove:photoSaved',
                        success = false,
                        error = 'Profile not found'
                    })
                end
            else
                TriggerClientEvent('bit-smartphone:bitloveResponse', playerId, {
                    action = 'bitlove:photoSaved',
                    success = false,
                    error = 'Screenshot failed'
                })
            end
        end)
    elseif Config.PhotoProvider == 'fmsdk' then
        exports['fmsdk']:takePhoto(playerId, function(url)
            if url then
                uploadPhotoToService(url, playerName, photoType or "Perfil BitLove")
                
                local photoId = 'bitlove_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)
                
                SqlFunc(Config.Mysql, 'execute', 
                    'INSERT INTO bit_phone_photos (user, image_url, created_at) VALUES (@user, @image_url, NOW())', 
                    {
                        ['@user'] = identifier,
                        ['@image_url'] = url
                    })
                
                local profileResult = SqlFunc(Config.Mysql, 'fetchAll', 
                    'SELECT photos, profile_picture FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
                    {['@identifier'] = identifier})
                
                if profileResult and profileResult[1] then
                    local photos = json.decode(profileResult[1].photos or '[]')
                    
                    local photoEntry = {
                        id = photoId,
                        url = url,
                        timestamp = os.time(),
                        type = photoType or 'profile'
                    }
                    
                    table.insert(photos, photoEntry)
                    
                    local updateQuery = 'UPDATE bit_phone_bitlove_profiles SET photos = @photos'
                    local params = {['@photos'] = json.encode(photos), ['@identifier'] = identifier}
                    
                    if not profileResult[1].profile_picture or profileResult[1].profile_picture == '' then
                        updateQuery = updateQuery .. ', profile_picture = @profile_picture'
                        params['@profile_picture'] = url
                    end
                    
                    updateQuery = updateQuery .. ' WHERE identifier = @identifier'
                    SqlFunc(Config.Mysql, 'execute', updateQuery, params)
                    
                    TriggerClientEvent('bit-smartphone:bitloveResponse', playerId, {
                        action = 'bitlove:photoSaved',
                        success = true,
                        photo = photoEntry,
                        photos = photos
                    })
                else
                    TriggerClientEvent('bit-smartphone:bitloveResponse', playerId, {
                        action = 'bitlove:photoSaved',
                        success = false,
                        error = 'Profile not found'
                    })
                end
            else
                TriggerClientEvent('phone:bitloveResponse', playerId, {
                    action = 'bitlove:photoSaved',
                    success = false,
                    error = 'Photo capture failed'
                })
            end
        end)
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

    if photoData.photoUrl and photoData.photoUrl ~= '' then
        uploadPhotoToService(photoData.photoUrl, playerName, photoData.type or "Perfil BitLove")
        
        SqlFunc(Config.Mysql, 'execute', 
            'INSERT INTO bit_phone_photos (user, image_url, created_at) VALUES (@user, @image_url, NOW())', 
            {
                ['@user'] = identifier,
                ['@image_url'] = photoData.photoUrl
            })
    end

    local profileResult = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT photos, profile_picture FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
        {['@identifier'] = identifier})
    
    if profileResult and profileResult[1] then
        local photos = json.decode(profileResult[1].photos or '[]')
        
        local photoEntry = {
            id = photoData.photoId or ('bitlove_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)),
            url = photoData.photoUrl or '',
            timestamp = photoData.timestamp or os.time(),
            type = photoData.type or 'profile'
        }
        
        table.insert(photos, photoEntry)
        
        local updateQuery = 'UPDATE bit_phone_bitlove_profiles SET photos = @photos'
        local params = {['@photos'] = json.encode(photos), ['@identifier'] = identifier}
        
        if photoData.photoUrl and photoData.photoUrl ~= '' and 
           (not profileResult[1].profile_picture or profileResult[1].profile_picture == '') then
            updateQuery = updateQuery .. ', profile_picture = @profile_picture'
            params['@profile_picture'] = photoData.photoUrl
        end
        
        updateQuery = updateQuery .. ' WHERE identifier = @identifier'
        SqlFunc(Config.Mysql, 'execute', updateQuery, params)
        
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = true,
            photo = photoEntry,
            photos = photos
        })
        
        print(string.format('[BitLove] Photo saved for player %s: %s', playerName, photoData.photoUrl or 'no URL'))
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
    
    captureAndSavePhoto(playerId, photoType or 'profile', metadata or {})
end)

RegisterNetEvent('bit-smartphone:bitlove:savePhotoMetadata')
AddEventHandler('bit-smartphone:bitlove:savePhotoMetadata', function(photoData)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
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
    
    if photoData.photoUrl and string.len(photoData.photoUrl) < 1000000 then 
        uploadPhotoToService(photoData.photoUrl, playerName, photoData.type or "Perfil BitLove")
    end
    
    local result = SqlFunc(Config.Mysql, 'execute', 
        'INSERT INTO bit_phone_photos (user, image_url, created_at) VALUES (@user, @image_url, NOW())', 
        {
            ['@user'] = identifier,
            ['@image_url'] = photoData.photoUrl or ('local_photo_' .. photoData.photoId)
        })
    
    local profileResult = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT photos, profile_picture FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', 
        {['@identifier'] = identifier})
    
    if profileResult and profileResult[1] then
        local photos = json.decode(profileResult[1].photos or '[]')
        
        local photoEntry = {
            id = photoData.photoId,
            url = photoData.photoUrl or ('local_photo_' .. photoData.photoId),
            timestamp = photoData.timestamp,
            type = photoData.type or 'profile'
        }
        
        table.insert(photos, photoEntry)
        
        local updateQuery = 'UPDATE bit_phone_bitlove_profiles SET photos = @photos'
        local params = {['@photos'] = json.encode(photos), ['@identifier'] = identifier}
        
        if not profileResult[1].profile_picture or profileResult[1].profile_picture == '' then
            updateQuery = updateQuery .. ', profile_picture = @profile_picture'
            params['@profile_picture'] = photoEntry.url
        end
        
        updateQuery = updateQuery .. ' WHERE identifier = @identifier'
        
        SqlFunc(Config.Mysql, 'execute', updateQuery, params)
        
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = true,
            photo = photoEntry,
            photos = photos
        })
    else
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoSaved',
            success = false,
            error = 'No profile found'
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