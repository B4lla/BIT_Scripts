--##########
--   SQL
--##########




function SqlFunc(plugin, type, query, var)
    local wait = promise.new()
    if type == 'fetchAll' and plugin == 'mysql-async' then
        MySQL.Async.fetchAll(query, var, function(result)
            wait:resolve(result)
        end)
    end
    if type == 'execute' and plugin == 'mysql-async' then
        MySQL.Async.execute(query, var, function(result)
            wait:resolve(result)
        end)
    end
    if type == 'execute' and plugin == 'ghmattisql' then
        exports['ghmattimysql']:execute(query, var, function(result)
            wait:resolve(result)
        end)
    end
    if type == 'fetchAll' and plugin == 'ghmattisql' then
        exports.ghmattimysql:execute(query, var, function(result)
            wait:resolve(result)
        end)
    end
    if type == 'execute' and plugin == 'oxmysql' then
        exports.oxmysql:execute(query, var, function(result)
            wait:resolve(result)
        end)
    end
    if type == 'fetchAll' and plugin == 'oxmysql' then
        exports['oxmysql']:fetch(query, var, function(result)
            wait:resolve(result)
        end)
    end
    return Citizen.Await(wait)
end





--########
-- Lógica
--########



if ESX then
    ESX.RegisterServerCallback('bit-blips:getBlips', function(source, cb)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then
            cb({}); return
        end
        local identifier = xPlayer.identifier
        local rows = SqlFunc(Config.Mysql, 'fetchAll',
            'SELECT id, name, x, y, z, blip_sprite AS icon, blip_color AS color, visible FROM bit_blips WHERE identifier = @identifier',
            { ['@identifier'] = identifier }
        )
        cb(rows)
    end)

    ESX.RegisterServerCallback('bit-blips:saveBlip', function(source, cb, blip)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then
            cb(nil); return
        end
        local identifier = xPlayer.identifier
        local blipId = tonumber(blip.id)
    if blipId and blipId > 0 then
        -- Update existing blip
        SqlFunc(Config.Mysql, 'execute',
            'UPDATE bit_blips SET name=@name, x=@x, y=@y, z=@z, blip_color=@color, blip_sprite=@icon, visible=@visible WHERE id=@id AND identifier=@identifier',
            {
                ['@name'] = blip.name,
                ['@x'] = blip.x,
                ['@y'] = blip.y,
                ['@z'] = blip.z,
                ['@color'] = blip.color,
                ['@icon'] = blip.icon,
                ['@visible'] = blip.visible and 1 or 0,
                ['@id'] = blipId,
                ['@identifier'] = identifier
            }
        )
    else
        -- Insert new blip
        SqlFunc(Config.Mysql, 'execute',
            'INSERT INTO bit_blips (identifier,name,x,y,z,blip_color,blip_sprite,visible) VALUES (@identifier,@name,@x,@y,@z,@color,@icon,@visible)',
            {
                ['@identifier'] = identifier,
                ['@name'] = blip.name,
                ['@x'] = blip.x,
                ['@y'] = blip.y,
                ['@z'] = blip.z,
                ['@color'] = blip.color,
                ['@icon'] = blip.icon,
                ['@visible'] = blip.visible and 1 or 0
            }
        )
        local last = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT LAST_INSERT_ID() AS id', {})
        if last and last[1] then blipId = last[1].id end
    end
     if blipId then
         local saved = SqlFunc(Config.Mysql, 'fetchAll',
             'SELECT id, name, x, y, z, blip_sprite AS icon, blip_color AS color, visible FROM bit_blips WHERE id=@id',
             { ['@id'] = blipId }
         )
         cb(saved and saved[1] or nil)
     else
         cb(nil)
     end
    end)

    ESX.RegisterServerCallback('bit-blips:deleteBlip', function(source, cb, id)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb(false); return end
        SqlFunc(Config.Mysql, 'execute',
            'DELETE FROM bit_blips WHERE id=@id AND identifier=@identifier',
            { ['@id'] = id, ['@identifier'] = xPlayer.identifier }
        )
        cb(true)
    end)

    ESX.RegisterServerCallback('bit-blips:updateVisibility', function(source, cb, blips)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb(false); return end
        local identifier = xPlayer.identifier
        for _, b in ipairs(blips) do
            SqlFunc(Config.Mysql, 'execute',
                'UPDATE bit_blips SET visible=@visible WHERE id=@id AND identifier=@identifier',
                {
                    ['@visible'] = b.visible and 1 or 0,
                    ['@id'] = b.id,
                    ['@identifier'] = identifier
                }
            )
        end
        cb(true)
    end)

elseif QBCore then
    QBCore.Functions.CreateCallback('bit-blips:getBlips', function(source, cb)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then
            cb({}); return
        end
        local identifier = Player.PlayerData.citizenid
        local rows = SqlFunc(Config.Mysql, 'fetchAll',
            'SELECT id, name, x, y, z, blip_sprite AS icon, blip_color AS color, visible FROM bit_blips WHERE identifier = @identifier',
            { ['@identifier'] = identifier }
        )
        cb(rows)
    end)

    QBCore.Functions.CreateCallback('bit-blips:saveBlip', function(source, cb, blip)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then
            cb(nil); return
        end
        local identifier = Player.PlayerData.citizenid
        local blipId = tonumber(blip.id)
    if blipId and blipId > 0 then
        -- Update existing blip
        SqlFunc(Config.Mysql, 'execute',
            'UPDATE bit_blips SET name=@name, x=@x, y=@y, z=@z, blip_color=@color, blip_sprite=@icon, visible=@visible WHERE id=@id AND identifier=@identifier',
            {
                ['@name'] = blip.name,
                ['@x'] = blip.x,
                ['@y'] = blip.y,
                ['@z'] = blip.z,
                ['@color'] = blip.color,
                ['@icon'] = blip.icon,
                ['@visible'] = blip.visible and 1 or 0,
                ['@id'] = blipId,
                ['@identifier'] = identifier
            }
        )
    else
        -- Insert new blip
        SqlFunc(Config.Mysql, 'execute',
            'INSERT INTO bit_blips (identifier,name,x,y,z,blip_color,blip_sprite,visible) VALUES (@identifier,@name,@x,@y,@z,@color,@icon,@visible)',
            {
                ['@identifier'] = identifier,
                ['@name'] = blip.name,
                ['@x'] = blip.x,
                ['@y'] = blip.y,
                ['@z'] = blip.z,
                ['@color'] = blip.color,
                ['@icon'] = blip.icon,
                ['@visible'] = blip.visible and 1 or 0
            }
        )
        local last = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT LAST_INSERT_ID() AS id', {})
        if last and last[1] then blipId = last[1].id end
    end
     if blipId then
         local saved = SqlFunc(Config.Mysql, 'fetchAll',
             'SELECT id, name, x, y, z, blip_sprite AS icon, blip_color AS color, visible FROM bit_blips WHERE id=@id',
             { ['@id'] = blipId }
         )
         cb(saved and saved[1] or nil)
     else
         cb(nil)
     end
    end)

    QBCore.Functions.CreateCallback('bit-blips:deleteBlip', function(source, cb, id)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb(false); return end
        SqlFunc(Config.Mysql, 'execute',
            'DELETE FROM bit_blips WHERE id=@id AND identifier=@identifier',
            { ['@id'] = id, ['@identifier'] = Player.PlayerData.citizenid }
        )
        cb(true)
    end)


    QBCore.Functions.CreateCallback('bit-blips:updateVisibility', function(source, cb, blips)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb(false); return end
        local identifier = Player.PlayerData.citizenid
        for _, b in ipairs(blips) do
            SqlFunc(Config.Mysql, 'execute',
                'UPDATE bit_blips SET visible=@visible WHERE id=@id AND identifier=@identifier',
                {
                    ['@visible'] = b.visible and 1 or 0,
                    ['@id'] = b.id,
                    ['@identifier'] = identifier
                }
            )
        end
        cb(true)
    end)
end




--########
-- Auto SQL
--########

AddEventHandler('onResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        SqlFunc(Config.Mysql, 'execute', [[
            CREATE TABLE IF NOT EXISTS bit_blips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                identifier VARCHAR(64) NOT NULL,
                name VARCHAR(100) NOT NULL,
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                z FLOAT DEFAULT 0,
                blip_color INT DEFAULT 1,
                blip_sprite INT DEFAULT 1,
                visible BOOLEAN DEFAULT TRUE
            )
        ]], {})
        print('[BIT-Blips] Database table bit_blips created or already exists.')
    end
end)
