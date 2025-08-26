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
    
    SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_photos (user, url, metadata) VALUES (@u, @url, @meta)', {
        ['@u'] = identifier, 
        ['@url'] = photoData.url,
        ['@meta'] = json.encode(metadata)
    })
end)