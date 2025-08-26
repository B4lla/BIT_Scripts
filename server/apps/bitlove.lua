local function GetPlayerIdentifier(src)
    if Config.Framework == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        return xPlayer and xPlayer.identifier or nil
    elseif Config.Framework == 'QBCore' then
        local Player = QBCore.Functions.GetPlayer(src)
        return Player and Player.PlayerData.citizenid or nil
    end
end


RegisterNetEvent('bitlove:getProfile', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end

    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
    if result and result[1] then
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:profileLoaded',
            success = true,
            profile = result[1]
        })
    else
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:profileLoaded',
            success = false,
            profile = nil
        })
    end
end)


RegisterNetEvent('bitlove:createProfile', function(data)
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
            TriggerClientEvent('phone:bitloveResponse', src, {
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
            TriggerClientEvent('phone:bitloveResponse', src, {
                action = 'bitlove:profileCreated',
                success = true,
                profile = data
            })
        end
    end
end)


RegisterNetEvent('bitlove:getProfiles', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    
    local userProfile = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT gender, interested_in FROM bit_phone_bitlove_profiles WHERE identifier = @identifier', {['@identifier'] = identifier})
    if not userProfile or not userProfile[1] then 
        TriggerClientEvent('phone:bitloveResponse', src, {
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
    
    TriggerClientEvent('phone:bitloveResponse', src, {
        action = 'bitlove:profilesLoaded',
        profiles = profiles or {}
    })
end)


RegisterNetEvent('bitlove:swipeProfile', function(data)
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
                
                TriggerClientEvent('phone:bitloveResponse', src, {
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
                    TriggerClientEvent('phone:bitloveResponse', targetPlayer, {
                        action = 'bitlove:newMatch',
                        matchId = matchId,
                        profile = userProfile[1]
                    })
                end
            end
        else
            TriggerClientEvent('phone:bitloveResponse', src, {
                action = 'bitlove:swipeResult',
                success = true,
                match = false
            })
        end
    else
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:swipeResult',
            success = true,
            match = false
        })
    end
end)


RegisterNetEvent('bitlove:getMatches', function()
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
    
    TriggerClientEvent('phone:bitloveResponse', src, {
        action = 'bitlove:matchesLoaded',
        success = true,
        matches = matches or {}
    })
end)


RegisterNetEvent('bitlove:sendMessage', function(data)
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
                TriggerClientEvent('phone:bitloveResponse', targetPlayer, {
                    action = 'bitlove:messageReceived',
                    matchId = matchId,
                    message = messageData
                })
            end
            
            TriggerClientEvent('phone:bitloveResponse', src, {
                action = 'bitlove:messageSent',
                success = true,
                message = messageData
            })
        end
    end
end)


RegisterNetEvent('bitlove:getMessages', function(data)
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
        
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:messagesLoaded',
            success = true,
            messages = messages or {}
        })
    end
end)


RegisterNetEvent('bitlove:uploadPhoto', function(data)
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
        
        TriggerClientEvent('phone:bitloveResponse', src, {
            action = 'bitlove:photoUploaded',
            success = (affectedRows and affectedRows > 0),
            photoUrl = photoUrl
        })
    end
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
    
    print('[BitLove] Photo saved for user:', identifier)
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

print('^2[BitLove]^0 Server events loaded successfully')
