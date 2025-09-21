local activeRooms = {} 
local onlineUsers = {} 
local lastCreateBySource = {}
local lastCreatePayloadHash = {}
local lastRoomsReqBySource = {}

local function GetPlayerIdentifier(src)
    if not src then return nil end
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(src)
        return xPlayer and xPlayer.identifier or nil
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        if QBCore and QBCore.Functions and QBCore.Functions.GetPlayer then
            local player = QBCore.Functions.GetPlayer(tonumber(src))
            if player and player.PlayerData then
                return player.PlayerData.citizenid or player.PlayerData.identifier or nil
            end
        end
    end
    if ESX and ESX.GetPlayerFromId then
        local xPlayer = ESX.GetPlayerFromId(src)
        return xPlayer and xPlayer.identifier or nil
    end
    return nil
end

local function GetPlayerFromIdentifier(identifier)
    if not identifier then return nil end
    for _, pid in ipairs(GetPlayers()) do
        local psrc = tonumber(pid)
        if not psrc then goto continue end

        if Config.Framework == "esx" then
            local xPlayer = ESX.GetPlayerFromId(psrc)
            if xPlayer and xPlayer.identifier == identifier then
                return psrc
            end
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            if QBCore and QBCore.Functions and QBCore.Functions.GetPlayer then
                local player = QBCore.Functions.GetPlayer(psrc)
                if player and player.PlayerData then
                    local idVal = player.PlayerData.citizenid or player.PlayerData.identifier
                    if idVal == identifier then
                        return psrc
                    end
                end
            end
        else
            local xPlayer = ESX.GetPlayerFromId(psrc)
            if xPlayer and xPlayer.identifier == identifier then
                return psrc
            end
        end
        ::continue::
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

local function CreateOrGetBitcoinWallet(identifier)
    DebugPrint('[DARKWEB] CreateOrGetBitcoinWallet called for identifier:', identifier)
    local cryptoHoldings = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT amount FROM bit_phone_crypto_holdings WHERE user_id = ? AND (crypto_symbol = ? OR crypto_symbol = ?)', {identifier, 'btc', 'bitcoin'})
    local balance = 0
    
    if cryptoHoldings and #cryptoHoldings > 0 then
        balance = tonumber(cryptoHoldings[1].amount) or 0
        DebugPrint('[DARKWEB] Found BTC balance in crypto_holdings:', balance)
    else
        DebugPrint('[DARKWEB] No BTC holdings found in crypto_holdings table')
    end
    
    if Crypto_GetUserBalance then
        local holdings = Crypto_GetUserBalance(identifier)
        local apiBalance = 0
        if type(holdings) == 'table' then
            if holdings.btc and holdings.btc.amount then apiBalance = tonumber(holdings.btc.amount) or 0 end
            if holdings.bitcoin and holdings.bitcoin.amount then
                local alt = tonumber(holdings.bitcoin.amount) or 0
                if alt > apiBalance then apiBalance = alt end
            end
        else
            apiBalance = tonumber(Crypto_GetUserBalance(identifier, 'btc')) or 0
        end
        DebugPrint('[DARKWEB] Crypto API balance (btc/bitcoin):', apiBalance)
        if apiBalance > balance then balance = apiBalance end
    end
    
    local txs = {}
    if Crypto_GetUserTransactions then
        txs = Crypto_GetUserTransactions(identifier, 'btc') or {}
        print('[DARKWEB] Found', #txs, 'transactions from crypto API')
    end
    
    print('[DARKWEB] Final BTC balance:', balance)
    return {
        user_identifier = identifier,
        bitcoin_balance = balance,
        wallet_address = nil,
        recent_transactions = txs
    }
end

local function TransferBitcoin(fromIdentifier, toIdentifier, amount, transactionType, referenceId, description)
    if not amount or tonumber(amount) <= 0 then
        return false, 'Cantidad inválida'
    end

    if Crypto_GetUserBalance and Crypto_ModifyUserBalance then
        local senderHoldings = Crypto_GetUserBalance(fromIdentifier) or {}
        local btcAmt = 0
        local btcAlt = 0
        if type(senderHoldings) == 'table' then
            btcAmt = tonumber((senderHoldings['btc'] and senderHoldings['btc'].amount) or 0) or 0
            btcAlt = tonumber((senderHoldings['bitcoin'] and senderHoldings['bitcoin'].amount) or 0) or 0
        else
            btcAmt = tonumber(Crypto_GetUserBalance(fromIdentifier, 'btc')) or 0
            btcAlt = tonumber(Crypto_GetUserBalance(fromIdentifier, 'bitcoin')) or 0
        end

        local senderSymbol = 'btc'
        local senderBal = btcAmt
        if btcAlt > btcAmt then
            senderSymbol = 'bitcoin'
            senderBal = btcAlt
        end

        if senderBal < amount then
            return false, 'Saldo insuficiente'
        end

        local success, err = Crypto_ModifyUserBalance(fromIdentifier, senderSymbol, -tonumber(amount), transactionType or 'transfer', 0, 0, 'darkweb')
        if not success then
            return false, err or 'Error al debitar'
        end

        local receiverHoldings = Crypto_GetUserBalance(toIdentifier) or {}
        local recvSymbol = 'btc'
        if type(receiverHoldings) == 'table' then
            local hasBtc = receiverHoldings['btc'] and (tonumber(receiverHoldings['btc'].amount) or 0) > 0
            local hasBitcoin = receiverHoldings['bitcoin'] and (tonumber(receiverHoldings['bitcoin'].amount) or 0) > 0
            if hasBitcoin and not hasBtc then
                recvSymbol = 'bitcoin'
            end
        end

        local succ2, err2 = Crypto_ModifyUserBalance(toIdentifier, recvSymbol, tonumber(amount), transactionType or 'transfer', 0, 0, 'darkweb')
        if not succ2 then
            Crypto_ModifyUserBalance(fromIdentifier, senderSymbol, tonumber(amount), 'rollback', 0, 0, 'darkweb')
            return false, err2 or 'Error al acreditar receptor'
        end

        return true, 'Transacción completada', nil
    else
        return false, 'API de cripto no disponible'
    end
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
        SqlFunc(Config.Mysql, 'execute', [[
            INSERT INTO bit_phone_darkweb_users (user_identifier, username, reputation, last_active) 
            VALUES (?, ?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE username = VALUES(username), reputation = VALUES(reputation), last_active = NOW()
        ]], {identifier, username, 100})

        local newRow = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_darkweb_users WHERE user_identifier = ?', {identifier})
        if newRow and #newRow > 0 then
            return newRow[1]
        end
        return {
            id = nil,
            user_identifier = identifier,
            username = username,
            reputation = 100,
            is_banned = false
        }
    end
end


RegisterNetEvent('darkweb:getRooms')
AddEventHandler('darkweb:getRooms', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then 
        print('[DARKWEB] getRooms: No identifier for source', source)
        return 
    end
    
    print('[DARKWEB] Fetching darkweb rooms for identifier:', identifier)
    
    local rooms = SqlFunc(Config.Mysql, 'fetchAll', [[
        SELECT r.* FROM bit_phone_darkweb_rooms r 
        LEFT JOIN bit_phone_darkweb_room_members m ON r.id = m.room_id 
        WHERE r.is_active = 1 AND (r.creator = ? OR m.member_identifier = ?)
        GROUP BY r.id
    ]], {identifier, identifier})
    
    print('[DARKWEB] Rooms fetched:', #rooms)
    
    if #rooms == 0 then
        local allRooms = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT COUNT(*) as total FROM bit_phone_darkweb_rooms WHERE is_active = 1')
        print('[DARKWEB] Total active rooms in database:', allRooms and allRooms[1] and allRooms[1].total or 0)
    end
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
    
    TriggerClientEvent('bit-smartphone:darkweb:receiveRooms', source, rooms)
end)

RegisterNetEvent('darkweb:createRoom')
AddEventHandler('darkweb:createRoom', function(roomData)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then 
        print('[DARKWEB] createRoom: No identifier for source', source)
        return 
    end
    
    print('[DARKWEB] createRoom called by', identifier, 'with name:', roomData.name)
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
    if type(roomId) == 'table' and roomId.insertId then
        roomId = tonumber(roomId.insertId)
    else
        roomId = tonumber(roomId) or roomId
    end
    
    if roomId then
        
        SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_room_members (room_id, member_identifier, is_admin) VALUES (?, ?, ?)', 
            {roomId, identifier, true})
        
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
        
    TriggerClientEvent('bit-smartphone:darkweb:roomCreated', source, newRoom)
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
    
    
    local existingMember = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_darkweb_room_members WHERE room_id = ? AND member_identifier = ?', 
        {room.id, identifier})
    
    if not existingMember or #existingMember == 0 then
        SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_room_members (room_id, member_identifier) VALUES (?, ?)', 
            {room.id, identifier})
        
        
        SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_messages (room_id, sender_identifier, message) VALUES (?, ?, ?)', 
            {room.id, 'system', darkwebUser.username .. ' se unió a la sala'})
    end
    
    TriggerClientEvent('bit-smartphone:darkweb:roomJoined', source, {room = room, success = true})
    
    
    local messages = SqlFunc(Config.Mysql, 'fetchAll', [[
        SELECT * FROM bit_phone_darkweb_messages 
        WHERE room_id = ? AND is_deleted = 0 
        ORDER BY created_at DESC 
        LIMIT 50
    ]], {room.id})
    
    
    for i, msg in ipairs(messages) do
        msg.timestamp = os.time() * 1000
        msg.isOwn = (msg.sender_identifier == identifier)
    end
    
    TriggerClientEvent('bit-smartphone:darkweb:receiveRoomMessages', source, {roomId = room.id, messages = messages})
end)

RegisterNetEvent('darkweb:leaveRoom')
AddEventHandler('darkweb:leaveRoom', function(roomId)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local darkwebUser = CreateOrGetDarkwebUser(identifier)
    
    
    SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_darkweb_room_members WHERE room_id = ? AND member_identifier = ?', 
        {roomId, identifier})
    
    
    SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_messages (room_id, sender_identifier, message) VALUES (?, ?, ?)', 
        {roomId, 'system', darkwebUser.username .. ' abandonó la sala'})
    
    TriggerClientEvent('bit-smartphone:darkweb:roomLeft', source, {roomId = roomId, success = true})
end)





RegisterNetEvent('darkweb:sendRoomMessage')
AddEventHandler('darkweb:sendRoomMessage', function(roomId, messageText)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local darkwebUser = CreateOrGetDarkwebUser(identifier)
    
    
    local isMember = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_darkweb_room_members WHERE room_id = ? AND member_identifier = ?', 
        {roomId, identifier})
    
    if not isMember or #isMember == 0 then
        NotifyPlayer(source, 'No tienes acceso a esta sala')
        return
    end
    
    
    local messageId = SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_messages (room_id, sender_identifier, message) VALUES (?, ?, ?)', 
        {roomId, identifier, messageText})
    if type(messageId) == 'table' and messageId.insertId then messageId = tonumber(messageId.insertId) end
    
    if messageId then
        local message = {
            id = messageId,
            username = darkwebUser.username,
            text = messageText,
            timestamp = os.time() * 1000,
            isOwn = false
        }
        
        
        local members = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT member_identifier FROM bit_phone_darkweb_room_members WHERE room_id = ?', {roomId})
        for _, member in ipairs(members) do
            local xPlayer = ESX.GetPlayerFromIdentifier(member.member_identifier)
            if xPlayer then
                local isOwn = (member.member_identifier == identifier)
                TriggerClientEvent('bit-smartphone:darkweb:newMessage', xPlayer.source, {
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

RegisterNetEvent('darkweb:getOnlineUsers')
AddEventHandler('darkweb:getOnlineUsers', function()
    local source = source
    local onlineCount = 0
    
    for identifier, _ in pairs(onlineUsers) do
        onlineCount = onlineCount + 1
    end
    
    
    onlineCount = onlineCount + math.random(15, 45)
    
    TriggerClientEvent('bit-smartphone:darkweb:receiveOnlineCount', source, onlineCount)
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

RegisterNetEvent('bit-smartphone:darkweb:getRooms', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    print('[DARKWEB] getRooms called by source:', source, 'identifier:', identifier)
    
    if not identifier then 
        print('[DARKWEB] Error: No identifier found for source:', source)
        TriggerClientEvent('bit-smartphone:darkweb:receiveRooms', source, {})
        return 
    end
    
    local now = (GetGameTimer and GetGameTimer() or os.time() * 1000)
    local last = lastRoomsReqBySource[source] or 0
    if (now - last) < 1000 then
        return
    end
    lastRoomsReqBySource[source] = now

    print('[DARKWEB] Fetching rooms for identifier:', identifier)
    
    local success, rows = pcall(function()
        return SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT 
                r.id,
                r.name,
                r.code,
                r.description,
                r.creator AS creator,
                r.created_at,
                r.updated_at,
                COUNT(m2.member_identifier) AS member_count
            FROM bit_phone_darkweb_rooms r
            INNER JOIN bit_phone_darkweb_room_members m ON r.id = m.room_id AND m.member_identifier = ?
            LEFT JOIN bit_phone_darkweb_room_members m2 ON r.id = m2.room_id
            WHERE r.is_active = 1
            GROUP BY r.id
            ORDER BY r.updated_at DESC, r.created_at DESC
        ]], {identifier})
    end)

    if not success or not rows then
        print('[DARKWEB] Error fetching rooms or tables missing:', rows)
        TriggerClientEvent('bit-smartphone:darkweb:receiveRooms', source, {})
        return
    end

    local rooms = {}
    for _, r in ipairs(rows) do
        local createdAtMs = os.time() * 1000
        if r.created_at then
            if type(r.created_at) == 'number' then
                createdAtMs = math.floor(r.created_at) * 1000
            elseif type(r.created_at) == 'string' then
                local y, mo, d, h, mi, s = r.created_at:match("(\n?%d+)%-(%d+)%-(%d+)%s+(%d+):(%d+):(%d+)")
                if y and mo and d and h and mi and s then
                    local yy = tonumber(y) or 1970
                    local mmo = tonumber(mo) or 1
                    local dd = tonumber(d) or 1
                    local hh = tonumber(h) or 0
                    local mii = tonumber(mi) or 0
                    local ss = tonumber(s) or 0
                    local ts = os.time({year = yy, month = mmo, day = dd, hour = hh, min = mii, sec = ss})
                    if ts then createdAtMs = ts * 1000 end
                end
            end
        end

        table.insert(rooms, {
            id = r.id,
            name = r.name or ('Sala #' .. tostring(r.id)),
            code = r.code or tostring(r.id),
            creator = r.creator or 'Anon',
            createdAt = createdAtMs,
            members = {},
            messages = {}
        })
    end

    print('[DARKWEB] Rooms built for NUI:', #rooms)
    TriggerClientEvent('bit-smartphone:darkweb:receiveRooms', source, rooms)
end)


RegisterNetEvent('bit-smartphone:darkweb:createRoom', function(roomData)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    print('[DARKWEB] createRoom called by source:', source, 'identifier:', identifier, 'roomData:', json.encode(roomData))

    if not identifier then
        print('[DARKWEB] Error: No identifier found for createRoom')
        return
    end

    local function HasColumn(tableName, columnName)
        local ok, rows = pcall(function()
            return SqlFunc(Config.Mysql, 'fetchAll', [[
                SELECT 1 FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                LIMIT 1
            ]], {tableName, columnName})
        end)
        if not ok then return false end
        return rows and #rows > 0
    end

    local hasIsPrivate = HasColumn('bit_phone_darkweb_rooms', 'is_private')
    local hasCreatedBy = HasColumn('bit_phone_darkweb_rooms', 'created_by')
    local hasLastMessageAt = HasColumn('bit_phone_darkweb_rooms', 'last_message_at')
    local hasCode = HasColumn('bit_phone_darkweb_rooms', 'code')

    local roomId
    local ok, res = pcall(function()
        if hasIsPrivate and hasCreatedBy then
            if hasLastMessageAt then
                return SqlFunc(Config.Mysql, 'insert', [[
                    INSERT INTO bit_phone_darkweb_rooms (name, description, is_private, created_by, created_at, last_message_at)
                    VALUES (?, ?, 1, ?, NOW(), NOW())
                ]], { roomData.name, roomData.description or '', identifier })
            else
                return SqlFunc(Config.Mysql, 'insert', [[
                    INSERT INTO bit_phone_darkweb_rooms (name, description, is_private, created_by, created_at)
                    VALUES (?, ?, 1, ?, NOW())
                ]], { roomData.name, roomData.description or '', identifier })
            end
        elseif hasCode then
            local code = GenerateRoomCode()
            local exists = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_darkweb_rooms WHERE code = ? LIMIT 1', { code })
            if exists and #exists > 0 then
                code = GenerateRoomCode()
            end
            return SqlFunc(Config.Mysql, 'insert', [[
                INSERT INTO bit_phone_darkweb_rooms (name, code, creator, description)
                VALUES (?, ?, ?, ?)
            ]], { roomData.name, code, identifier, roomData.description or '' })
        else
            return SqlFunc(Config.Mysql, 'insert', [[
                INSERT INTO bit_phone_darkweb_rooms (name, description)
                VALUES (?, ?)
            ]], { roomData.name, roomData.description or '' })
        end
    end)

    if not ok then
        print('[DARKWEB] Error executing room insert:', res)
    else
        roomId = res
    end

    if type(roomId) == 'table' and roomId.insertId then roomId = tonumber(roomId.insertId) end
    if type(roomId) ~= 'number' then roomId = tonumber(roomId) end

    if roomId then
        local memberOk, memberErr = pcall(function()
            SqlFunc(Config.Mysql, 'execute', [[
                INSERT INTO bit_phone_darkweb_room_members (room_id, member_identifier, is_admin, joined_at)
                VALUES (?, ?, 1, NOW())
            ]], { roomId, identifier })
        end)

        if memberOk then
            print('[DARKWEB] Room created successfully with ID:', roomId)
            TriggerClientEvent('bit-smartphone:darkweb:roomCreated', source, { id = roomId, name = roomData.name })
        else
            print('[DARKWEB] Error: Could not add creator as room member ->', memberErr)
        end
    else
        print('[DARKWEB] Error: Could not create room. Tables/columns may not exist or insert failed.')
    end
end)


RegisterNetEvent('bit-smartphone:darkweb:joinRoom', function(roomRef)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    local roomId = tonumber(roomRef)
    if not roomId then
        local row = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_darkweb_rooms WHERE code = ? AND is_active = 1', {tostring(roomRef or '')})
        if row and #row > 0 then roomId = tonumber(row[1].id) end
    end
    if not roomId then
        TriggerClientEvent('bit-smartphone:darkweb:roomJoined', source, { error = 'Sala no encontrada' })
        return
    end

    local existing = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT * FROM bit_phone_darkweb_room_members WHERE room_id = ? AND member_identifier = ?',
        {roomId, identifier}
    )
    if #existing == 0 then
        
        SqlFunc(Config.Mysql, 'execute',
            'INSERT INTO bit_phone_darkweb_room_members (room_id, member_identifier, is_admin, joined_at) VALUES (?, ?, 0, NOW())',
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
    
    if not messageData or not tonumber(messageData.roomId) or not messageData.message or tostring(messageData.message):gsub("%s+","") == '' then
        return
    end

    local roomId = tonumber(messageData.roomId)
    local darkwebUser = CreateOrGetDarkwebUser(identifier)

    local isMember = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT id FROM bit_phone_darkweb_room_members WHERE room_id = ? AND member_identifier = ?',
        {roomId, identifier}
    )
    if not isMember or #isMember == 0 then
        pcall(function()
            SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_room_members (room_id, member_identifier, is_admin, joined_at) VALUES (?, ?, 0, NOW())', {roomId, identifier})
        end)
    end

    local messageId = SqlFunc(Config.Mysql, 'execute', [[
        INSERT INTO bit_phone_darkweb_messages (room_id, sender_identifier, message) VALUES (?, ?, ?)
    ]], {roomId, identifier, tostring(messageData.message) })
    if type(messageId) == 'table' and messageId.insertId then messageId = tonumber(messageId.insertId) end

    if messageId and tonumber(messageId) then
        pcall(function()
            SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_darkweb_rooms SET updated_at = NOW() WHERE id = ?', {roomId})
        end)

        local members = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT member_identifier FROM bit_phone_darkweb_room_members WHERE room_id = ?', {roomId})
        local nowMs = os.time() * 1000
        for _, member in ipairs(members or {}) do
            local targetPlayer = GetPlayerFromIdentifier(member.member_identifier)
            if targetPlayer then
                local isOwn = (member.member_identifier == identifier)
                TriggerClientEvent('bit-smartphone:darkweb:newMessage', targetPlayer, {
                    roomId = roomId,
                    message = {
                        id = messageId,
                        username = (darkwebUser and darkwebUser.username) or 'Anon',
                        text = tostring(messageData.message),
                        timestamp = nowMs,
                        isOwn = isOwn
                    }
                })
            end
        end
    else
        print('[DARKWEB] Error: no se pudo insertar mensaje en DB para room', roomId, 'identifier', identifier)
    end
end)

RegisterNetEvent('darkweb:getBitcoinWallet')
AddEventHandler('darkweb:getBitcoinWallet', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local wallet = CreateOrGetBitcoinWallet(identifier)
    if wallet then
        print('[DARKWEB] Sending wallet data to client:', json.encode(wallet))
        
        wallet.recent_transactions = {}
    TriggerClientEvent('bit-smartphone:darkweb:receiveBitcoinWallet', source, wallet)
    else
        print('[DARKWEB] No wallet found for identifier:', identifier)
    end
end)

RegisterNetEvent('darkweb:sendBitcoin')
AddEventHandler('darkweb:sendBitcoin', function(data)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end
    
    local success, message, transactionId = TransferBitcoin(
        identifier, 
        data.recipientAddress, 
        data.amount, 
        'transfer', 
        nil, 
        data.description or 'Transferencia directa'
    )
    
    if success then
    TriggerClientEvent('bit-smartphone:darkweb:bitcoinTransferResult', source, {
            success = true,
            message = message,
            transactionId = transactionId
        })
        
        local recipientPlayer = GetPlayerFromIdentifier(data.recipientAddress)
        if recipientPlayer then
            TriggerClientEvent('bit-smartphone:darkweb:bitcoinReceived', recipientPlayer, {
                amount = data.amount,
                from = identifier,
                description = data.description
            })
        end
    else
    TriggerClientEvent('bit-smartphone:darkweb:bitcoinTransferResult', source, {
            success = false,
            message = message
        })
    end
end)

RegisterNetEvent('bit-smartphone:darkweb:leaveRoom')
AddEventHandler('bit-smartphone:darkweb:leaveRoom', function(roomId)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    if not identifier then return end

    local darkwebUser = CreateOrGetDarkwebUser(identifier)

    SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_darkweb_room_members WHERE room_id = ? AND member_identifier = ?', {roomId, identifier})
    SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_darkweb_messages (room_id, sender_identifier, message) VALUES (?, ?, ?)', {roomId, 'system', (darkwebUser.username or 'Usuario') .. ' abandonó la sala'})
    TriggerClientEvent('bit-smartphone:darkweb:roomLeft', source, { roomId = roomId, success = true })
end)