local activeRooms = {} 
local onlineUsers = {} 
local marketplaceCache = {} 


local function GetPlayerIdentifier(source)
    local xPlayer = ESX.GetPlayerFromId(source)
    return xPlayer and xPlayer.identifier or nil
end

local function GetPlayerFromIdentifier(identifier)
    for _, playerId in ipairs(GetPlayers()) do
        local xPlayer = ESX.GetPlayerFromId(playerId)
        if xPlayer and xPlayer.identifier == identifier then
            return tonumber(playerId)
        end
    end
    return nil
end

local function GenerateRoomCode()
    local chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    local result = ""
    for i = 1, 8 do
        local rand = math.random(1, #chars)
        result = result .. chars:sub(rand, rand)
    end
    return result
end

local function GenerateUsername(identifier)
    local hash = string.sub(identifier, -8)
    return "Anon" .. string.upper(hash)
end

local function NotifyPlayer(source, message, type)
    type = type or 'info'
    TriggerClientEvent('esx:showNotification', source, message)
end

local function CreateOrGetDarkwebUser(identifier)
    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_darkweb_users WHERE user_identifier = ?', {identifier})
    
    if result and #result > 0 then
        
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_darkweb_users SET last_active = NOW() WHERE user_identifier = ?', {identifier})
        return result[1]
    else
        
        local username = GenerateUsername(identifier)
        local id = SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_users (user_identifier, username, reputation) VALUES (?, ?, ?)', 
            {identifier, username, 100})
        
        return {
            id = id,
            user_identifier = identifier,
            username = username,
            reputation = 100,
            total_purchases = 0,
            total_sales = 0,
            is_banned = false
        }
    end
end


RegisterNetEvent('darkweb:getRooms')
AddEventHandler('darkweb:getRooms', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    print("Fetching darkweb rooms for identifier: " .. identifier)
    local rooms = SqlFunc(Config.Mysql, 'fetchAll', [[
        SELECT * FROM bit_phone_darkweb_rooms WHERE is_active = 1 AND id IN (SELECT room_id FROM bit_phone_darkweb_room_members WHERE user_identifier = ?)
    ]], {})
    print("Rooms fetched: " .. #rooms)
    for i, room in ipairs(rooms) do
        room.members = {}
        if room.member_list then
            for member in string.gmatch(room.member_list, '([^,]+)') do
                table.insert(room.members, member)
            end
        end
        room.member_count = room.member_count or 0
        room.member_list = nil
    end
    
    TriggerClientEvent('darkweb:receiveRooms', source, rooms)
end)

RegisterNetEvent('darkweb:createRoom')
AddEventHandler('darkweb:createRoom', function(roomData)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local darkwebUser = CreateOrGetDarkwebUser(identifier)
    local roomCode = GenerateRoomCode()
    
    
    local existingRoom = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_darkweb_rooms WHERE code = ?', {roomCode})
    if existingRoom and #existingRoom > 0 then
        roomCode = GenerateRoomCode() 
    end
    
    local roomId = SqlFunc(Config.Mysql, 'execute', [[
        INSERT INTO bit_phone_darkweb_rooms (name, code, creator, description) 
        VALUES (?, ?, ?, ?)
    ]], {roomData.name, roomCode, identifier, roomData.description or ''})
    
    if roomId then
        
        SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_room_members (room_id, user_identifier, username, is_admin) VALUES (?, ?, ?, ?)', 
            {roomId, identifier, darkwebUser.username, true})
        
        local newRoom = {
            id = roomId,
            name = roomData.name,
            code = roomCode,
            creator = identifier,
            description = roomData.description or '',
            is_active = true,
            member_count = 1,
            members = {darkwebUser.username},
            created_at = os.time() * 1000
        }
        
        TriggerClientEvent('darkweb:roomCreated', source, newRoom)
        NotifyPlayer(source, 'Sala creada exitosamente. Código: ' .. roomCode)
    end
end)

RegisterNetEvent('darkweb:joinRoom')
AddEventHandler('darkweb:joinRoom', function(roomCode)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local darkwebUser = CreateOrGetDarkwebUser(identifier)
    
    local room = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_darkweb_rooms WHERE code = ? AND is_active = 1', {roomCode})
    if not room or #room == 0 then
        NotifyPlayer(source, 'Código de sala inválido')
        return
    end
    room = room[1] 
    
    
    local existingMember = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_darkweb_room_members WHERE room_id = ? AND user_identifier = ?', 
        {room.id, identifier})
    
    if not existingMember or #existingMember == 0 then
        SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_room_members (room_id, user_identifier, username) VALUES (?, ?, ?)', 
            {room.id, identifier, darkwebUser.username})
        
        
        SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_messages (room_id, user_identifier, username, message, message_type) VALUES (?, ?, ?, ?, ?)', 
            {room.id, 'system', 'Sistema', darkwebUser.username .. ' se unió a la sala', 'system'})
    end
    
    TriggerClientEvent('darkweb:roomJoined', source, {room = room, success = true})
    
    
    local messages = SqlFunc(Config.Mysql, 'fetchAll', [[
        SELECT * FROM bit_phone_darkweb_messages 
        WHERE room_id = ? AND is_deleted = 0 
        ORDER BY created_at DESC 
        LIMIT 50
    ]], {room.id})
    
    
    for i, msg in ipairs(messages) do
        msg.timestamp = os.time() * 1000
        msg.isOwn = (msg.user_identifier == identifier)
    end
    
    TriggerClientEvent('darkweb:receiveRoomMessages', source, {roomId = room.id, messages = messages})
end)

RegisterNetEvent('darkweb:leaveRoom')
AddEventHandler('darkweb:leaveRoom', function(roomId)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local darkwebUser = CreateOrGetDarkwebUser(identifier)
    
    
    SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_darkweb_room_members WHERE room_id = ? AND user_identifier = ?', 
        {roomId, identifier})
    
    
    SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_messages (room_id, user_identifier, username, message, message_type) VALUES (?, ?, ?, ?, ?)', 
        {roomId, 'system', 'Sistema', darkwebUser.username .. ' abandonó la sala', 'system'})
    
    TriggerClientEvent('darkweb:roomLeft', source, {roomId = roomId, success = true})
end)





RegisterNetEvent('darkweb:sendRoomMessage')
AddEventHandler('darkweb:sendRoomMessage', function(roomId, messageText)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local darkwebUser = CreateOrGetDarkwebUser(identifier)
    
    
    local isMember = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_darkweb_room_members WHERE room_id = ? AND user_identifier = ?', 
        {roomId, identifier})
    
    if not isMember or #isMember == 0 then
        NotifyPlayer(source, 'No tienes acceso a esta sala')
        return
    end
    
    
    local messageId = SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_messages (room_id, user_identifier, username, message) VALUES (?, ?, ?, ?)', 
        {roomId, identifier, darkwebUser.username, messageText})
    
    if messageId then
        local message = {
            id = messageId,
            username = darkwebUser.username,
            text = messageText,
            timestamp = os.time() * 1000,
            isOwn = false
        }
        
        
        local members = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT user_identifier FROM bit_phone_darkweb_room_members WHERE room_id = ?', {roomId})
        for _, member in ipairs(members) do
            local xPlayer = ESX.GetPlayerFromIdentifier(member.user_identifier)
            if xPlayer then
                local isOwn = (member.user_identifier == identifier)
                TriggerClientEvent('darkweb:receiveRoomMessage', xPlayer.source, {
                    roomId = roomId,
                    message = {
                        id = messageId,
                        username = darkwebUser.username,
                        text = messageText,
                        timestamp = os.time() * 1000,
                        isOwn = isOwn
                    }
                })
            end
        end
        
        
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_darkweb_rooms SET updated_at = NOW() WHERE id = ?', {roomId})
    end
end)





RegisterNetEvent('darkweb:getMarketplace')
AddEventHandler('darkweb:getMarketplace', function(category)
    local source = source
    
    category = category or 'all'
    local whereClause = "WHERE is_active = 1"
    local params = {}
    
    if category ~= 'all' then
        whereClause = whereClause .. " AND category = ?"
        params = {category}
    else
        params = {}
    end
    
    local items = SqlFunc(Config.Mysql, 'fetchAll', string.format([[
        SELECT m.*, u.username as seller_username, u.reputation as seller_reputation
        FROM bit_phone_darkweb_marketplace m
        LEFT JOIN bit_phone_darkweb_users u ON m.seller_identifier = u.user_identifier
        %s
        ORDER BY m.created_at DESC
        LIMIT 100
    ]], whereClause), params)
    
    for i, item in ipairs(items) do
        item.rating = tonumber(item.rating) or 5.0
        item.views_count = tonumber(item.views_count) or 0
    end
    
    TriggerClientEvent('darkweb:receiveMarketplace', source, {category = category, items = items})
end)

RegisterNetEvent('darkweb:createMarketplaceItem')
AddEventHandler('darkweb:createMarketplaceItem', function(itemData)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local darkwebUser = CreateOrGetDarkwebUser(identifier)
    
    local itemId = SqlFunc(Config.Mysql, 'execute', [[
        INSERT INTO bit_phone_darkweb_marketplace 
        (seller_identifier, seller_username, title, description, category, price, currency, location, image_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        identifier, darkwebUser.username, itemData.title, itemData.description, 
        itemData.category, itemData.price, itemData.currency or 'money', 
        itemData.location, itemData.image_url
    })
    
    if itemId then
        TriggerClientEvent('darkweb:itemCreated', source, {itemId = itemId, success = true})
        NotifyPlayer(source, 'Artículo publicado en el marketplace')
    end
end)

RegisterNetEvent('darkweb:purchaseItem')
AddEventHandler('darkweb:purchaseItem', function(itemId, quantity, deliveryLocation)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local xPlayer = ESX.GetPlayerFromId(source)
    if not xPlayer then return end
    
    local item = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_darkweb_marketplace WHERE id = ? AND is_active = 1', {itemId})
    if not item or #item == 0 then
        NotifyPlayer(source, 'Artículo no encontrado')
        return
    end
    item = item[1] 
    
    quantity = quantity or 1
    local totalPrice = item.price * quantity
    
    
    local hasEnoughFunds = false
    
    if item.currency == 'money' then
        hasEnoughFunds = (xPlayer.getMoney() >= totalPrice)
        if hasEnoughFunds then
            xPlayer.removeMoney(totalPrice)
        end
    else
        
        hasEnoughFunds = true 
    end
    
    if not hasEnoughFunds then
        NotifyPlayer(source, 'Fondos insuficientes')
        return
    end
    
    
    local purchaseId = SqlFunc(Config.Mysql, 'execute', [[
        INSERT INTO bit_phone_darkweb_purchases 
        (buyer_identifier, seller_identifier, item_id, item_title, quantity, total_price, currency, delivery_location) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ]], {identifier, item.seller_identifier, itemId, item.title, quantity, totalPrice, item.currency, deliveryLocation})
    
    if purchaseId then
        
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_darkweb_marketplace SET views_count = views_count + 1 WHERE id = ?', {itemId})
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_darkweb_users SET total_purchases = total_purchases + 1 WHERE user_identifier = ?', {identifier})
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_darkweb_users SET total_sales = total_sales + 1 WHERE user_identifier = ?', {item.seller_identifier})
        
        TriggerClientEvent('darkweb:purchaseComplete', source, {
            purchaseId = purchaseId,
            item = item,
            totalPrice = totalPrice,
            success = true
        })
        
        NotifyPlayer(source, 'Compra realizada exitosamente')
        
        
        local seller = ESX.GetPlayerFromIdentifier(item.seller_identifier)
        if seller then
            NotifyPlayer(seller.source, 'Has vendido: ' .. item.title)
        end
    end
end)





RegisterNetEvent('darkweb:getOnlineUsers')
AddEventHandler('darkweb:getOnlineUsers', function()
    local source = source
    local onlineCount = 0
    
    for identifier, _ in pairs(onlineUsers) do
        onlineCount = onlineCount + 1
    end
    
    
    onlineCount = onlineCount + math.random(15, 45)
    
    TriggerClientEvent('darkweb:receiveOnlineCount', source, onlineCount)
end)





AddEventHandler('playerConnecting', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if identifier then
        onlineUsers[identifier] = source
    end
end)

AddEventHandler('playerDropped', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if identifier then
        onlineUsers[identifier] = nil
    end
end)








Citizen.CreateThread(function()
    Citizen.SetTimeout(3600000, function()
        SqlFunc(Config.Mysql, 'execute', [[
            UPDATE bit_phone_darkweb_rooms 
            SET is_active = 0 
            WHERE updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) 
            AND (SELECT COUNT(*) FROM bit_phone_darkweb_room_members WHERE room_id = bit_phone_darkweb_rooms.id) = 0
        ]], {})
    end)
end)





exports('CreateDarkwebUser', CreateOrGetDarkwebUser)
exports('GetDarkwebUserData', function(identifier)
    local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_darkweb_users WHERE user_identifier = ?', {identifier})
    return result and result[1] or nil
end)

exports('AddMarketplaceItem', function(sellerIdentifier, itemData)
    local darkwebUser = CreateOrGetDarkwebUser(sellerIdentifier)
    return SqlFunc(Config.Mysql, 'execute', [[
        INSERT INTO bit_phone_darkweb_marketplace 
        (seller_identifier, seller_username, title, description, category, price, currency, location) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ]], {
        sellerIdentifier, darkwebUser.username, itemData.title, itemData.description, 
        itemData.category, itemData.price, itemData.currency or 'money', itemData.location
    })
end)




RegisterNetEvent('bit-smartphone:darkweb:getRooms', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    
    
    local rooms = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT * FROM bit_phone_darkweb_room_members WHERE user_identifier = ?',
        {identifier}
    )
    
    TriggerClientEvent('bit-smartphone:darkweb:receiveRooms', source, rooms)
end)


RegisterNetEvent('bit-smartphone:darkweb:createRoom', function(roomData)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    
    local roomId = SqlFunc(Config.Mysql, 'insert', [[
        INSERT INTO bit_phone_darkweb_rooms (name, description, is_private, created_by, created_at, last_message_at)
        VALUES (?, ?, 1, ?, NOW(), NOW())
    ]], {roomData.name, roomData.description or '', identifier})
    
    if roomId then
        
        SqlFunc(Config.Mysql, 'execute', [[
        INSERT INTO bit_phone_darkweb_room_members (room_id, user_identifier, is_admin, created_at)
        VALUES (?, ?, 1, NOW())
        ]], {roomId, identifier})
        
        TriggerClientEvent('bit-smartphone:darkweb:roomCreated', source, {id = roomId, name = roomData.name})
    end
end)


RegisterNetEvent('bit-smartphone:darkweb:joinRoom', function(roomId)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    
    
    local existing = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT * FROM bit_phone_darkweb_room_members WHERE room_id = ? AND user_identifier = ?',
        {roomId, identifier}
    )
    if #existing == 0 then
        
        SqlFunc(Config.Mysql, 'execute',
            'INSERT INTO bit_phone_darkweb_room_members (room_id, user_identifier, is_admin, created_at) VALUES (?, ?, 0, NOW())',
            {roomId, identifier}
        )
    end
    
    
    local messages = SqlFunc(Config.Mysql, 'fetchAll', [[
        SELECT * FROM bit_phone_darkweb_messages 
        WHERE room_id = ? 
        ORDER BY created_at ASC 
        LIMIT 50
    ]], {roomId})
    
    TriggerClientEvent('bit-smartphone:darkweb:roomJoined', source, {roomId = roomId, messages = messages})
end)


RegisterNetEvent('bit-smartphone:darkweb:sendMessage', function(messageData)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    
    
    local isMember = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT * FROM bit_phone_darkweb_room_members WHERE room_id = ? AND user_identifier = ?',
        {messageData.roomId, identifier}
    )
    if #isMember > 0 then
        
        local messageId = SqlFunc(Config.Mysql, 'insert', [[
            INSERT INTO bit_phone_darkweb_messages (room_id, sender_identifier, message, created_at)
            VALUES (?, ?, ?, NOW())
        ]], {messageData.roomId, identifier, messageData.message})
        
        if messageId then
            
            SqlFunc(Config.Mysql, 'execute', [[
                UPDATE bit_phone_darkweb_rooms SET last_message_at = NOW() WHERE id = ?
            ]], {messageData.roomId})
            
            
            
            local members = SqlFunc(Config.Mysql, 'fetchAll',
                'SELECT * FROM bit_phone_darkweb_room_members WHERE room_id = ?',
                {messageData.roomId}
            )
            
            
            for _, member in ipairs(members) do
                local targetPlayer = GetPlayerFromIdentifier(member.member_identifier)
                if targetPlayer then
                    TriggerClientEvent('bit-smartphone:darkweb:newMessage', targetPlayer, {
                        id = messageId,
                        roomId = messageData.roomId,
                        sender = identifier,
                        message = messageData.message,
                        timestamp = os.time()
                    })
                end
            end
        end
    end
end)