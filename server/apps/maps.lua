


local function getIdentifier(source)
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier
    else
        local Player = QBCore.Functions.GetPlayer(source)
        return Player and Player.PlayerData.citizenid
    end
end

local function getPlayerByIdentifier(identifier)
    for _, playerId in ipairs(GetPlayers()) do
        if getIdentifier(playerId) == identifier then
            return playerId
        end
    end
end



SqlFunc(Config.Mysql, 'execute', [[
    CREATE TABLE IF NOT EXISTS bit_phone_map_markers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_identifier VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(10) NOT NULL,
        x FLOAT NOT NULL,
        y FLOAT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
]], {})


RegisterNetEvent('bit-smartphone:server:getMarkers')
AddEventHandler('bit-smartphone:server:getMarkers', function()
    local src = source
    local identifier = getIdentifier(src)
    local markers = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT * FROM bit_phone_map_markers WHERE user_identifier = @uid',
        {['@uid'] = identifier}
    )
    TriggerClientEvent('bit-smartphone:client:receiveMarkers', src, markers or {})
end)


RegisterNetEvent('bit-smartphone:server:saveMarker')
AddEventHandler('bit-smartphone:server:saveMarker', function(marker)
    local src = source
    local identifier = getIdentifier(src)
    SqlFunc(Config.Mysql, 'execute',
        'INSERT INTO bit_phone_map_markers (user_identifier, name, icon, x, y, description) VALUES (@uid, @name, @icon, @x, @y, @desc)',
        {
            ['@uid'] = identifier,
            ['@name'] = marker.name,
            ['@icon'] = marker.icon,
            ['@x'] = marker.x,
            ['@y'] = marker.y,
            ['@desc'] = marker.description
        }
    )
    
    local markers = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT * FROM bit_phone_map_markers WHERE user_identifier = @uid',
        {['@uid'] = identifier}
    )
    TriggerClientEvent('bit-smartphone:client:receiveMarkers', src, markers or {})
end)


RegisterNetEvent('bit-smartphone:server:deleteMarker')
AddEventHandler('bit-smartphone:server:deleteMarker', function(markerId)
    local src = source
    SqlFunc(Config.Mysql, 'execute',
        'DELETE FROM bit_phone_map_markers WHERE id = @id',
        {['@id'] = markerId}
    )
    local identifier = getIdentifier(src)
    local markers = SqlFunc(Config.Mysql, 'fetchAll',
        'SELECT * FROM bit_phone_map_markers WHERE user_identifier = @uid',
        {['@uid'] = identifier}
    )
    TriggerClientEvent('bit-smartphone:client:receiveMarkers', src, markers or {})
end)


RegisterNetEvent('bit-smartphone:server:sendLocation')
AddEventHandler('bit-smartphone:server:sendLocation', function(data)
    local src = source
    local targetId = data.playerId
    local location = data.location
    TriggerClientEvent('bit-smartphone:client:receiveLocation', targetId, { sender = getIdentifier(src), location = location })
end)
