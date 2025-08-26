local function getIdentifier(source)
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier or nil
    else
        local Player = QBCore.Functions.GetPlayer(source)
        return Player and Player.PlayerData.citizenid or nil
    end
end

local function getPlayerByIdentifier(identifier)
    if Config.Framework == 'esx' then
        local xPlayers = ESX.GetPlayers()
        for _, playerId in ipairs(xPlayers) do
            local xPlayer = ESX.GetPlayerFromId(playerId)
            if xPlayer and xPlayer.identifier == identifier then
                return playerId
            end
        end
    else
        for _, playerId in ipairs(GetPlayers()) do
            local Player = QBCore.Functions.GetPlayer(playerId)
            if Player and Player.PlayerData.citizenid == identifier then
                return playerId
            end
        end
    end
    return nil
end

local function getPlayerByPhoneNumber(phoneNumber)
    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT user FROM bit_phone WHERE phone_number = @phone', {
        ['@phone'] = phoneNumber
    })
    
    if result and result[1] then
        local targetIdentifier = result[1].user
        return getPlayerByIdentifier(targetIdentifier), targetIdentifier
    end
    
    return nil, nil
end

local function isBlocked(senderId, receiverId)
    local blocked = SqlFunc(Config.Mysql, 'fetchScalar', 'SELECT COUNT(*) FROM bit_phone_blocked_numbers WHERE `user` = @blocker AND `number` = @blocked', {
        ['@blocker'] = receiverId,
        ['@blocked'] = senderId
    })
    return blocked and blocked > 0
end

RegisterNetEvent('bit-smartphone:server:sendMessage')
AddEventHandler('bit-smartphone:server:sendMessage', function(chatId, messageType, content, metadata)
    local src = source
    local identifier = getIdentifier(src)
    
    if not identifier or not chatId or not content then 
        return 
    end
    
    local senderPhoneResult = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT phone_number FROM bit_phone WHERE user = @user', {
        ['@user'] = identifier
    })
    local senderPhoneNumber = senderPhoneResult and senderPhoneResult[1] and senderPhoneResult[1].phone_number
    
    local targetPlayer, targetIdentifier = getPlayerByPhoneNumber(chatId)
    
    if not targetIdentifier then
        return
    end
    
    if isBlocked(identifier, targetIdentifier) then 
        return 
    end
    
    local chatResult = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT c.id FROM bit_phone_chats c JOIN bit_phone_chat_participants p1 ON c.id = p1.chat_id JOIN bit_phone_chat_participants p2 ON c.id = p2.chat_id WHERE p1.user_identifier = @user1 AND p2.user_identifier = @user2 AND c.chat_type = "personal"', 
        {['@user1'] = identifier, ['@user2'] = targetIdentifier}
    )
    
    local chatDbId
    if chatResult and chatResult[1] then
        chatDbId = chatResult[1].id
    else
        chatDbId = SqlFunc(Config.Mysql, 'insert',
            'INSERT INTO bit_phone_chats (chat_type, created_by) VALUES ("personal", @creator)',
            {['@creator'] = identifier}
        )
        
        if chatDbId then
            SqlFunc(Config.Mysql, 'execute',
                'INSERT INTO bit_phone_chat_participants (chat_id, user_identifier) VALUES (@chat_id, @user1), (@chat_id, @user2)',
                {['@chat_id'] = chatDbId, ['@user1'] = identifier, ['@user2'] = targetIdentifier}
            )
        end
    end
    
    if not chatDbId then
        return
    end
    
    local insertResult = SqlFunc(Config.Mysql, 'insert', 
        'INSERT INTO bit_phone_messages (chat_id, sender_identifier, message_type, content) VALUES (@chat_id, @sender, @type, @content)', 
        {
            ['@chat_id'] = chatDbId,
            ['@sender'] = identifier, 
            ['@type'] = messageType or 'text',
            ['@content'] = content
        }
    )

    local messageId = insertResult or (os.time() .. '_' .. math.random(1000, 9999))
    
    if targetPlayer then
        local playerId = tonumber(targetPlayer)
        if playerId then
            local receiverMessage = {
                id = messageId,
                content = content,
                type = messageType or 'text',
                senderId = identifier,
                senderNumber = senderPhoneNumber,
                timestamp = os.time(),
                status = 'received'
            }
            TriggerClientEvent('bit-smartphone:client:receiveNewMessage', playerId, senderPhoneNumber or identifier, receiverMessage)
            
            TriggerClientEvent('bit-smartphone:client:showNotification', playerId, {
                title = 'Nuevo mensaje',
                message = 'De ' .. (senderPhoneNumber or 'Usuario') .. ': ' .. content,
                type = 'message',
                duration = 5000
            })
        end
    end
    
    local senderMessage = {
        id = messageId,
        content = content,
        type = messageType or 'text',
        senderId = 'me',
        timestamp = os.time(),
        status = 'sent'
    }
    TriggerClientEvent('bit-smartphone:client:receiveNewMessage', src, chatId, senderMessage)
end)

RegisterNetEvent('bit-smartphone:server:createChat')
AddEventHandler('bit-smartphone:server:createChat', function(contactNumber, contactName)
    local src = source
    local identifier = getIdentifier(src)
    if not identifier or not contactNumber or not contactName then return end
    
    local profilePicture = SqlFunc(Config.Mysql, 'fetchScalar', 
        'SELECT profile_picture FROM bit_phone WHERE user = @number LIMIT 1', 
        {['@number']=contactNumber}
    ) or './assets/avatars/default.png'
    
    SqlFunc(Config.Mysql, 'execute',
        'INSERT INTO bit_phone_contacts (`user`, `number`, `name`, `avatar`) VALUES (@u, @n, @name, @avatar) ON DUPLICATE KEY UPDATE `name` = @name, `avatar` = @avatar',
        {['@u']=identifier, ['@n']=contactNumber, ['@name']=contactName, ['@avatar']=profilePicture}
    )
    
    local rows = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT c.*, COALESCE(p.profile_picture, "./assets/avatars/default.png") as profile_pic FROM bit_phone_contacts c LEFT JOIN bit_phone p ON c.number = p.user WHERE c.user = @u', 
        {['@u']=identifier}
    )
    local formatted = {}
    for _, c in ipairs(rows or {}) do
        table.insert(formatted, { 
            id = c.number, 
            name = c.name, 
            number = c.number, 
            avatar = c.profile_pic or c.avatar or './assets/avatars/default.png' 
        })
    end
    TriggerClientEvent('bit-smartphone:client:receiveContacts', src, formatted)
end)

if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-smartphone:messages:loadContacts', function(source, cb)
        local identifier = getIdentifier(source)
        if not identifier then return cb({}) end
        local contacts = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT c.*, COALESCE(p.profile_picture, "./assets/avatars/default.png") as profile_pic FROM bit_phone_contacts c LEFT JOIN bit_phone p ON c.number = p.user WHERE c.user = @identifier', 
            {['@identifier'] = identifier}
        )
        local formattedContacts = {}
        for _, contact in ipairs(contacts or {}) do
            table.insert(formattedContacts, {
                id = contact.number,
                name = contact.name,
                number = contact.number,
                avatar = contact.profile_pic or contact.avatar or './assets/avatars/default.png'
            })
        end
        cb(formattedContacts)
    end)

    ESX.RegisterServerCallback('bit-smartphone:messages:loadChats', function(source, cb)
        local identifier = getIdentifier(source)
        if not identifier then return cb({}) end
        
        local messages = SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT m.chat_id, m.message, m.type, m.sender, m.receiver, m.created_at,
                   CASE 
                       WHEN m.sender = @identifier THEN m.receiver 
                       ELSE m.sender 
                   END as contact_id,
                   c.name as contact_name,
                   c.avatar as contact_avatar
            FROM bit_phone_messages m
            LEFT JOIN bit_phone_contacts c ON (
                c.`user` = @identifier AND 
                ((m.sender = @identifier AND c.number = m.receiver) OR 
                 (m.receiver = @identifier AND c.number = m.sender))
            )
            WHERE (m.sender = @identifier OR m.receiver = @identifier)
            ORDER BY m.created_at DESC
        ]], {
            ['@identifier'] = identifier
        })
        
        local chatMap = {}
        for _, message in ipairs(messages or {}) do
            local chatId = message.contact_id
            if not chatMap[chatId] then
                chatMap[chatId] = {
                    id = chatId,
                    name = message.contact_name or chatId,
                    avatar = message.contact_avatar or './assets/avatars/default.png',
                    lastMessage = message.message,
                    timestamp = message.created_at,
                    unread = 0,
                    messages = {}
                }
            end
            
            table.insert(chatMap[chatId].messages, {
                id = message.id,
                content = message.message,
                type = message.type or 'text',
                senderId = message.sender == identifier and 'me' or message.sender,
                timestamp = message.created_at,
                status = 'sent'
            })
        end
        
        local chats = {}
        for _, chat in pairs(chatMap) do
            table.insert(chats, chat)
        end
        
        cb(chats)
    end)

    ESX.RegisterServerCallback('bit-smartphone:messages:send', function(source, cb, data)
        local identifier = getIdentifier(source)
        if not identifier or not data.content or not data.chatId then
            return cb({success = false, error = 'invalid_data'})
        end
        
        if isBlocked(identifier, data.chatId) then
            return cb({success = false, error = 'blocked'})
        end
        
        local messageId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_messages (sender, receiver, message, type, created_at) VALUES (@sender, @receiver, @message, @type, NOW())', {
            ['@sender'] = identifier,
            ['@receiver'] = data.chatId,
            ['@message'] = data.content,
            ['@type'] = data.type or 'text'
        })
        
        local targetPlayer = getPlayerByIdentifier(data.chatId)
        if targetPlayer then
            local playerId = tonumber(targetPlayer)
            if playerId then
                TriggerClientEvent('bit-smartphone:messages:receiveMessage', playerId, {
                    chatId = identifier,
                    message = {
                        id = messageId,
                        content = data.content,
                        type = data.type or 'text',
                        senderId = identifier,
                        timestamp = os.time(),
                        status = 'received'
                    }
                })
            end
        end
        
        cb({
            success = true,
            message = {
                id = messageId,
                content = data.content,
                type = data.type or 'text',
                senderId = 'me',
                timestamp = os.time(),
                status = 'sent'
            }
        })
    end)

    ESX.RegisterServerCallback('bit-smartphone:messages:block', function(source, cb, targetId)
        local identifier = getIdentifier(source)
        if not identifier or not targetId then return cb(false) end
        
        SqlFunc(Config.Mysql, 'execute', 'INSERT IGNORE INTO bit_phone_blocked_numbers (`user`, `number`) VALUES (@blocker, @blocked)', {
            ['@blocker'] = identifier,
            ['@blocked'] = targetId
        })
        
        cb(true)
    end)

    ESX.RegisterServerCallback('bit-smartphone:messages:unblock', function(source, cb, targetId)
        local identifier = getIdentifier(source)
        if not identifier or not targetId then return cb(false) end
        
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_blocked_numbers WHERE `user` = @blocker AND `number` = @blocked', {
            ['@blocker'] = identifier,
            ['@blocked'] = targetId
        })
        
        cb(true)
    end)

elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Functions.CreateCallback('bit-smartphone:messages:loadContacts', function(source, cb)
        local identifier = getIdentifier(source)
        if not identifier then return cb({}) end
        local contacts = SqlFunc(Config.Mysql, 'fetchAll', 
            'SELECT c.*, COALESCE(p.profile_picture, "./assets/avatars/default.png") as profile_pic FROM bit_phone_contacts c LEFT JOIN bit_phone p ON c.number = p.user WHERE c.user = @identifier', 
            {['@identifier'] = identifier}
        )
        local formattedContacts = {}
        for _, contact in ipairs(contacts or {}) do
            table.insert(formattedContacts, {
                id = contact.number,
                name = contact.name,
                number = contact.number,
                avatar = contact.profile_pic or contact.avatar or './assets/avatars/default.png'
            })
        end
        cb(formattedContacts)
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:messages:loadChats', function(source, cb)
        local identifier = getIdentifier(source)
        if not identifier then return cb({}) end
        local rows = SqlFunc(Config.Mysql, 'fetchAll',
            'SELECT chat_id, MAX(created_at) as last_time FROM bit_phone_messages WHERE sender = @id OR receiver = @id GROUP BY chat_id',
            {['@id'] = identifier}
        )
        local chats = {}
        for _, row in ipairs(rows or {}) do
            local chatId = row.chat_id
            local lastMsg = SqlFunc(Config.Mysql, 'fetchAll',
                'SELECT content FROM bit_phone_messages WHERE chat_id = @cid ORDER BY created_at DESC LIMIT 1',
                {['@cid'] = chatId}
            )
            local lastMessage = lastMsg and lastMsg[1] and lastMsg[1].content or ''
            local part = SqlFunc(Config.Mysql, 'fetchAll',
                'SELECT user_identifier FROM bit_phone_chat_participants WHERE chat_id = @cid AND user_identifier != @id LIMIT 1',
                {['@cid'] = chatId, ['@id'] = identifier}
            )
            local otherId = part and part[1] and part[1].user_identifier or ''
            local contact = SqlFunc(Config.Mysql, 'fetchAll',
                'SELECT name, avatar FROM bit_phone_contacts WHERE `user` = @id AND number = @other LIMIT 1',
                {['@id'] = identifier, ['@other'] = otherId}
            )
            local chatName = (contact and contact[1] and contact[1].name) or otherId
            local chatAvatar = (contact and contact[1] and contact[1].avatar) or './assets/avatars/default.png'
            table.insert(chats, {
                id = chatId,
                name = chatName,
                avatar = chatAvatar,
                lastMessage = lastMessage,
                timestamp = row.last_time,
                unread = 0,
                messages = {}
            })
        end
        cb(chats)
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:messages:send', function(source, cb, data)
        local identifier = getIdentifier(source)
        if not identifier or not data.content or not data.chatId then
            return cb({success = false, error = 'invalid_data'})
        end
        
        if isBlocked(identifier, data.chatId) then
            return cb({success = false, error = 'blocked'})
        end
        
        local messageId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_messages (sender, receiver, message, type, created_at) VALUES (@sender, @receiver, @message, @type, NOW())', {
            ['@sender'] = identifier,
            ['@receiver'] = data.chatId,
            ['@message'] = data.content,
            ['@type'] = data.type or 'text'
        })
        
        local targetPlayer = getPlayerByIdentifier(data.chatId)
        if targetPlayer then
            local playerId = tonumber(targetPlayer)
            if playerId then
                TriggerClientEvent('bit-smartphone:messages:receiveMessage', playerId, {
                    chatId = identifier,
                    message = {
                        id = messageId,
                        content = data.content,
                        type = data.type or 'text',
                        senderId = identifier,
                        timestamp = os.time(),
                        status = 'received'
                    }
                })
            end
        end
        
        cb({
            success = true,
            message = {
                id = messageId,
                content = data.content,
                type = data.type or 'text',
                senderId = 'me',
                timestamp = os.time(),
                status = 'sent'
            }
        })
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:messages:block', function(source, cb, targetId)
        local identifier = getIdentifier(source)
        if not identifier or not targetId then return cb(false) end
        
        SqlFunc(Config.Mysql, 'execute', 'INSERT IGNORE INTO bit_phone_blocked_numbers (`user`, `number`) VALUES (@blocker, @blocked)', {
            ['@blocker'] = identifier,
            ['@blocked'] = targetId
        })
        
        cb(true)
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:messages:unblock', function(source, cb, targetId)
        local identifier = getIdentifier(source)
        if not identifier or not targetId then return cb(false) end
        
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_blocked_numbers WHERE `user` = @blocker AND `number` = @blocked', {
            ['@blocker'] = identifier,
            ['@blocked'] = targetId
        })
        
        cb(true)
    end)
end

RegisterNetEvent('bit-smartphone:server:getChats')
AddEventHandler('bit-smartphone:server:getChats', function()
    local src = source
    local identifier = getIdentifier(src)
    
    if not identifier then return end
    
    local chatsResult = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT DISTINCT c.id, c.created_at, c.updated_at FROM bit_phone_chats c JOIN bit_phone_chat_participants p ON c.id = p.chat_id WHERE p.user_identifier = @user AND c.chat_type = "personal" ORDER BY c.updated_at DESC', 
        {['@user'] = identifier}
    )
    
    local chats = {}
    
    if chatsResult then
        for _, chat in ipairs(chatsResult) do
            local otherParticipantResult = SqlFunc(Config.Mysql, 'fetchAll',
                'SELECT user_identifier FROM bit_phone_chat_participants WHERE chat_id = @chat_id AND user_identifier != @user',
                {['@chat_id'] = chat.id, ['@user'] = identifier}
            )
            
            if otherParticipantResult and otherParticipantResult[1] then
                local contactIdentifier = otherParticipantResult[1].user_identifier
                
                local contactInfo = SqlFunc(Config.Mysql, 'fetchAll',
                    'SELECT phone_number, profile_name, profile_picture FROM bit_phone WHERE user = @user',
                    {['@user'] = contactIdentifier}
                )
                
                local lastMessage = SqlFunc(Config.Mysql, 'fetchAll',
                    'SELECT content, created_at, sender_identifier FROM bit_phone_messages WHERE chat_id = @chat_id ORDER BY created_at DESC LIMIT 1',
                    {['@chat_id'] = chat.id}
                )

                local unreadCount = SqlFunc(Config.Mysql, 'fetchAll',
                    'SELECT COUNT(*) as count FROM bit_phone_messages WHERE chat_id = @chat_id AND sender_identifier != @user',
                    {['@chat_id'] = chat.id, ['@user'] = identifier}
                )
                
                local chatData = {
                    id = chat.id,
                    contactId = contactIdentifier,
                    phoneNumber = contactInfo and contactInfo[1] and contactInfo[1].phone_number or contactIdentifier,
                    name = contactInfo and contactInfo[1] and contactInfo[1].profile_name or 'Usuario',
                    avatar = contactInfo and contactInfo[1] and contactInfo[1].profile_picture or './assets/avatars/default.png',
                    lastMessage = lastMessage and lastMessage[1] and lastMessage[1].content or '',
                    timestamp = lastMessage and lastMessage[1] and lastMessage[1].created_at or chat.created_at,
                    unread = unreadCount and unreadCount[1] and unreadCount[1].count or 0,
                    isOnline = getPlayerByIdentifier(contactIdentifier) ~= nil
                }
                
                table.insert(chats, chatData)
            end
        end
    end
    
    TriggerClientEvent('bit-smartphone:client:receiveChats', src, chats)
end)

RegisterNetEvent('bit-smartphone:server:getChatMessages')
AddEventHandler('bit-smartphone:server:getChatMessages', function(chatId, page)
    local src = source
    local identifier = getIdentifier(src)

    if not identifier or not chatId then
        return
    end

    page = page or 1
    local limit = 50
    local offset = (page - 1) * limit

    local actualChatId = tonumber(chatId)
    local messages = nil

    if actualChatId then
        messages = SqlFunc(Config.Mysql, 'fetchAll',
            'SELECT * FROM bit_phone_messages WHERE chat_id = @chat_id ORDER BY created_at DESC LIMIT @limit OFFSET @offset',
            {['@chat_id'] = actualChatId, ['@limit'] = limit, ['@offset'] = offset}
        )
    end

    if (not messages or #messages == 0) and chatId then
        local chatIdStr = tostring(chatId)
        if chatIdStr:match('^%d+$') and #chatIdStr >= 7 then
            local phoneRow = SqlFunc(Config.Mysql, 'fetchAll',
                'SELECT user FROM bit_phone WHERE phone_number = @phone LIMIT 1',
                {['@phone'] = chatIdStr}
            )
            local targetIdentifier = phoneRow and phoneRow[1] and phoneRow[1].user or nil
            if targetIdentifier then
                local chatRes = SqlFunc(Config.Mysql, 'fetchAll',
                    'SELECT c.id FROM bit_phone_chats c '
                    .. 'JOIN bit_phone_chat_participants p1 ON c.id = p1.chat_id '
                    .. 'JOIN bit_phone_chat_participants p2 ON c.id = p2.chat_id '
                    .. 'WHERE p1.user_identifier = @u1 AND p2.user_identifier = @u2 AND c.chat_type = "personal" LIMIT 1',
                    {['@u1'] = identifier, ['@u2'] = targetIdentifier}
                )
                if chatRes and chatRes[1] then
                    actualChatId = chatRes[1].id
                    messages = SqlFunc(Config.Mysql, 'fetchAll',
                        'SELECT * FROM bit_phone_messages WHERE chat_id = @chat_id ORDER BY created_at DESC LIMIT @limit OFFSET @offset',
                        {['@chat_id'] = actualChatId, ['@limit'] = limit, ['@offset'] = offset}
                    )
                end
            end
        end
    end

    if (not messages or #messages == 0) and type(chatId) == 'string' and chatId:find(':') then
        local chatRes2 = SqlFunc(Config.Mysql, 'fetchAll',
            'SELECT c.id FROM bit_phone_chats c '
            .. 'JOIN bit_phone_chat_participants p1 ON c.id = p1.chat_id '
            .. 'JOIN bit_phone_chat_participants p2 ON c.id = p2.chat_id '
            .. 'WHERE p1.user_identifier = @u1 AND p2.user_identifier = @u2 AND c.chat_type = "personal" LIMIT 1',
            {['@u1'] = identifier, ['@u2'] = chatId}
        )
        if chatRes2 and chatRes2[1] then
            actualChatId = chatRes2[1].id
            messages = SqlFunc(Config.Mysql, 'fetchAll',
                'SELECT * FROM bit_phone_messages WHERE chat_id = @chat_id ORDER BY created_at DESC LIMIT @limit OFFSET @offset',
                {['@chat_id'] = actualChatId, ['@limit'] = limit, ['@offset'] = offset}
            )
        end
    end
    local formattedMessages = {}
    for _, msg in ipairs(messages or {}) do
        table.insert(formattedMessages, {
            id = msg.id,
            content = msg.content,
            type = msg.message_type,
            senderId = (msg.sender_identifier == identifier) and 'me' or msg.sender_identifier,
            timestamp = msg.created_at,
            status = 'sent'
        })
    end

    local reversedMessages = {}
    for i = #formattedMessages, 1, -1 do
        table.insert(reversedMessages, formattedMessages[i])
    end

    TriggerClientEvent('bit-smartphone:client:receiveChatMessages', src, reversedMessages)
end)
