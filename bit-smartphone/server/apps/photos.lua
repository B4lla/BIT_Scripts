local function getIdentifier(source)
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier or nil
    else
        local Player = QBCore.Functions.GetPlayer(source)
        return Player and Player.PlayerData.citizenid or nil
    end
end


if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-smartphone:photos:loadPhotos', function(source, cb)
    local identifier = getIdentifier(source)
    if not identifier then return cb({}) end
    local rows = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id, url, metadata, created_at FROM bit_phone_photos WHERE user = @u ORDER BY id DESC', {['@u']=identifier})
    cb(rows or {})
end)

elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Functions.CreateCallback('bit-smartphone:photos:loadPhotos', function(source, cb)
        local identifier = getIdentifier(source)
        if not identifier then return cb({}) end
        local rows = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id, url, metadata, created_at FROM bit_phone_photos WHERE user = @u ORDER BY id DESC', {['@u']=identifier})
        cb(rows or {})
    end)
end

RegisterNetEvent('bit-smartphone:camera:savePhoto')
AddEventHandler('bit-smartphone:camera:savePhoto', function(photoData)
    local source = source
    local identifier = getIdentifier(source)
    
    if not identifier then 
        return 
    end
    
    local metadata = {
        location = photoData.location or {},
        cameraMode = photoData.cameraMode or "back",
        weather = photoData.metadata and photoData.metadata.weather or "unknown",
        time = photoData.metadata and photoData.metadata.time or {},
        timestamp = photoData.timestamp or os.time()
    }
    local realUrl = nil
    if photoData.url and photoData.url ~= '' then realUrl = photoData.url end
    if (not realUrl or realUrl == '') and photoData.photoUrl and photoData.photoUrl ~= '' then realUrl = photoData.photoUrl end

    if realUrl and string.sub(realUrl, 1, 1) == '{' then
        local ok, decoded = pcall(json.decode, realUrl)
        if ok and decoded and decoded.attachments and decoded.attachments[1] and decoded.attachments[1].url then
            realUrl = decoded.attachments[1].url
            print('[Photos] Extracted URL from Discord JSON: ' .. tostring(realUrl))
        else
            print('[Photos] Warning: failed to extract URL from JSON response')
        end
    end

    if not realUrl or realUrl == '' then
        print('[Photos] No valid photo URL received for player ' .. tostring(identifier))
        return
    end

    if string.len(realUrl) > 2000 then
        print('[Photos] Photo URL too long, aborting')
        return
    end

    SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_photos (user, url, metadata, created_at) VALUES (@u, @url, @meta, NOW())', {
        ['@u'] = identifier,
        ['@url'] = realUrl,
        ['@meta'] = json.encode(metadata)
    })

    print('[Photos] Saved photo URL for user ' .. tostring(identifier) .. ': ' .. tostring(realUrl))

    local meta = photoData.metadata or {}
    local appTag = meta.app or (meta.extra and meta.extra.app) or (metadata and metadata.app)
    local targetChatId = meta.chatId or (meta.extra and meta.extra.chatId) or (metadata and metadata.chatId)
    if appTag == 'messages' and targetChatId and tostring(targetChatId) ~= '' then
        local chatId = tostring(targetChatId)
        local messageType = 'image'
        local content = realUrl
        local src = source

        local senderPhoneResult = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT phone_number FROM bit_phone WHERE user = @user', { ['@user'] = identifier })
        local senderPhoneNumber = senderPhoneResult and senderPhoneResult[1] and senderPhoneResult[1].phone_number

        local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT user FROM bit_phone WHERE phone_number = @phone', { ['@phone'] = chatId })
        local targetIdentifier = result and result[1] and result[1].user

        if targetIdentifier and targetIdentifier ~= '' then
            local blocked = SqlFunc(Config.Mysql, 'fetchScalar', 'SELECT COUNT(*) FROM bit_phone_blocked_numbers WHERE `user` = @blocker AND `number` = @blocked', {
                ['@blocker'] = targetIdentifier,
                ['@blocked'] = identifier
            })
            if blocked and tonumber(blocked) and tonumber(blocked) > 0 then
                return
            end
            local chatResult = SqlFunc(Config.Mysql, 'fetchAll',
                'SELECT c.id FROM bit_phone_chats c JOIN bit_phone_chat_participants p1 ON c.id = p1.chat_id JOIN bit_phone_chat_participants p2 ON c.id = p2.chat_id WHERE p1.user_identifier = @user1 AND p2.user_identifier = @user2 AND c.chat_type = "personal"',
                { ['@user1'] = identifier, ['@user2'] = targetIdentifier }
            )
            local chatDbId
            if chatResult and chatResult[1] then
                chatDbId = chatResult[1].id
            else
                chatDbId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_chats (chat_type, created_by) VALUES ("personal", @creator)', { ['@creator'] = identifier })
                if chatDbId then
                    SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_chat_participants (chat_id, user_identifier) VALUES (@chat_id, @user1), (@chat_id, @user2)', { ['@chat_id'] = chatDbId, ['@user1'] = identifier, ['@user2'] = targetIdentifier })
                end
            end

            if chatDbId then
                local insertResult = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_messages (chat_id, sender_identifier, message_type, content) VALUES (@chat_id, @sender, @type, @content)', {
                    ['@chat_id'] = chatDbId,
                    ['@sender'] = identifier,
                    ['@type'] = messageType,
                    ['@content'] = content
                })
                local messageId = insertResult or (os.time() .. '_' .. math.random(1000, 9999))

                local targetPlayer = nil
                if Config.Framework == 'esx' then
                    local xPlayers = ESX.GetPlayers()
                    for _, pid in ipairs(xPlayers) do
                        local xPlayer = ESX.GetPlayerFromId(pid)
                        if xPlayer and xPlayer.identifier == targetIdentifier then targetPlayer = pid break end
                    end
                else
                    for _, pid in ipairs(GetPlayers()) do
                        local Player = QBCore.Functions.GetPlayer(pid)
                        if Player and Player.PlayerData.citizenid == targetIdentifier then targetPlayer = pid break end
                    end
                end

                if targetPlayer then
                    local tpid = tonumber(targetPlayer)
                    if tpid then
                    local receiverMessage = {
                        id = messageId,
                        content = content,
                        type = messageType,
                        senderId = identifier,
                        senderNumber = senderPhoneNumber,
                        timestamp = os.time(),
                        status = 'received'
                    }
                    TriggerClientEvent('bit-smartphone:client:receiveNewMessage', tpid, senderPhoneNumber or identifier, receiverMessage)
                    TriggerClientEvent('bit-smartphone:client:showNotification', tpid, {
                        title = 'Nuevo mensaje',
                        message = 'Imagen de ' .. (senderPhoneNumber or 'Usuario'),
                        type = 'message',
                        duration = 5000
                    })
                    end
                end

                local senderMessage = {
                    id = messageId,
                    content = content,
                    type = messageType,
                    senderId = 'me',
                    timestamp = os.time(),
                    status = 'sent'
                }
                TriggerClientEvent('bit-smartphone:client:receiveNewMessage', source, chatId, senderMessage)
            end
        end
    end
end)

RegisterNetEvent('photos:delete')
AddEventHandler('photos:delete', function(data, cb)
    local source = source
    local identifier = getIdentifier(source)
    
    if not identifier then 
        print('[Photos] Error: Cannot get identifier for player ' .. tostring(source))
        TriggerClientEvent('photos:deleteResponse', source, {success = false, error = 'Invalid player'})
        return 
    end
    
    local photoId = data.photoId
    if not photoId then
        print('[Photos] Error: No photoId provided for deletion')
        TriggerClientEvent('photos:deleteResponse', source, {success = false, error = 'No photo ID provided'})
        return
    end

    local result = SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_photos WHERE id = @id AND user = @u', {
        ['@id'] = photoId,
        ['@u'] = identifier
    })
    
    if result then
        print('[Photos] Successfully deleted photo ID ' .. tostring(photoId) .. ' for user ' .. tostring(identifier))
        TriggerClientEvent('photos:deleteResponse', source, {success = true, photoId = photoId})
    else
        print('[Photos] Error deleting photo ID ' .. tostring(photoId) .. ' for user ' .. tostring(identifier))
        TriggerClientEvent('photos:deleteResponse', source, {success = false, error = 'Database error', photoId = photoId})
    end
end)