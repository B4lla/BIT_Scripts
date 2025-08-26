local businesses = {}
local playerBusinesses = {} 


local function loadBusinesses()
    
    businesses = {
        [1] = {
            id = 1,
            name = "Downtown Motors",
            category = "automotive",
            description = "Concesionario oficial con los mejores vehículos de la ciudad. Financiación disponible.",
            banner = nil,
            location = { x = 215.12, y = -791.23 },
            owner = "license:abc123",
            announcements = {}
        },
        [2] = {
            id = 2,
            name = "Luigi's Pizza",
            category = "restaurant", 
            description = "La mejor pizza italiana de Los Santos. Entrega a domicilio disponible.",
            banner = nil,
            location = { x = -1035.71, y = -2735.48 },
            owner = "license:def456",
            announcements = {}
        },
        [3] = {
            id = 3,
            name = "Fashion District",
            category = "clothing",
            description = "Ropa de moda para todas las ocasiones. Las últimas tendencias están aquí.",
            banner = nil,
            location = { x = 72.25, y = -1399.10 },
            owner = "license:ghi789",
            announcements = {}
        }
    }
end


local function loadPlayerBusinesses()
    
    
    playerBusinesses = {
        ["license:abc123"] = {1}, 
        ["license:def456"] = {2}, 
        ["license:ghi789"] = {3}  
    }
end


RegisterNetEvent('smartphone:business:getBusinesses')
AddEventHandler('smartphone:business:getBusinesses', function()
    local source = source
    TriggerClientEvent('smartphone:business:receiveBusinesses', source, businesses)
end)


RegisterNetEvent('smartphone:business:getUserBusinesses')
AddEventHandler('smartphone:business:getUserBusinesses', function()
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then return end
    
    local identifier = xPlayer.identifier
    local userBusinessList = playerBusinesses[identifier] or {}
    
    TriggerClientEvent('smartphone:business:receiveUserBusinesses', source, userBusinessList)
end)


RegisterNetEvent('smartphone:business:createAnnouncement')
AddEventHandler('smartphone:business:createAnnouncement', function(businessId, announcement)
    local source = source
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then return end
    
    local identifier = xPlayer.identifier
    local userBusinessList = playerBusinesses[identifier] or {}
    
    
    local canManage = false
    for _, id in ipairs(userBusinessList) do
        if id == businessId then
            canManage = true
            break
        end
    end
    
    if not canManage then
        TriggerClientEvent('smartphone:business:notify', source, {
            type = 'error',
            message = 'No tienes permisos para gestionar este negocio'
        })
        return
    end
    
    
    if not businesses[businessId] then
        TriggerClientEvent('smartphone:business:notify', source, {
            type = 'error',
            message = 'Negocio no encontrado'
        })
        return
    end
    
    
    local newAnnouncement = {
        id = (#businesses[businessId].announcements + 1),
        author = xPlayer.getName(),
        content = announcement.content,
        image = announcement.image,
        createdAt = os.time()
    }
    
    table.insert(businesses[businessId].announcements, 1, newAnnouncement)
    
    
    TriggerClientEvent('smartphone:business:notify', source, {
        type = 'success',
        message = 'Anuncio publicado exitosamente'
    })
    
    
    TriggerClientEvent('smartphone:business:newAnnouncement', -1, {
        businessId = businessId,
        businessName = businesses[businessId].name,
        announcement = newAnnouncement
    })
    
    
    print(string.format('[BUSINESS] %s (ID: %s) creó un anuncio para %s: %s', 
        xPlayer.getName(), source, businesses[businessId].name, announcement.content))
end)


RegisterNetEvent('smartphone:business:showOnMap')
AddEventHandler('smartphone:business:showOnMap', function(businessData)
    local source = source
    
    
    TriggerClientEvent('smartphone:business:createMapBlip', source, {
        name = businessData.name,
        location = businessData.location,
        sprite = 374, 
        color = 3,    
        scale = 0.8,
        duration = 30000 
    })
end)


ESX.RegisterServerCallback('smartphone:business:getBusinessInfo', function(source, cb, businessId)
    if businesses[businessId] then
        cb(businesses[businessId])
    else
        cb(nil)
    end
end)


ESX.RegisterServerCallback('smartphone:business:canManageBusiness', function(source, cb, businessId)
    local xPlayer = ESX.GetPlayerFromId(source)
    
    if not xPlayer then 
        cb(false)
        return 
    end
    
    local identifier = xPlayer.identifier
    local userBusinessList = playerBusinesses[identifier] or {}
    
    for _, id in ipairs(userBusinessList) do
        if id == businessId then
            cb(true)
            return
        end
    end
    
    cb(false)
end)


RegisterCommand('addbusiness', function(source, args, rawCommand)
    if source == 0 then 
        if #args ~= 2 then
            print('Uso: addbusiness [player_id] [business_id]')
            return
        end
        
        local playerId = tonumber(args[1])
        local businessId = tonumber(args[2])
        
        local xPlayer = ESX.GetPlayerFromId(playerId)
        if not xPlayer then
            print('Jugador no encontrado: ' .. args[1])
            return
        end
        
        if not businesses[businessId] then
            print('Negocio no encontrado: ' .. args[2])
            return
        end
        
        local identifier = xPlayer.identifier
        if not playerBusinesses[identifier] then
            playerBusinesses[identifier] = {}
        end
        
        
        for _, id in ipairs(playerBusinesses[identifier]) do
            if id == businessId then
                print('El jugador ya tiene permisos para este negocio')
                return
            end
        end
        
        table.insert(playerBusinesses[identifier], businessId)
        print(string.format('Permisos de negocio %s otorgados a %s', businesses[businessId].name, xPlayer.getName()))
        
        
        TriggerClientEvent('smartphone:business:notify', playerId, {
            type = 'success',
            message = 'Ahora puedes gestionar ' .. businesses[businessId].name
        })
        
    else
        
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer.getGroup() == 'admin' or xPlayer.getGroup() == 'superadmin' then
            
            TriggerClientEvent('smartphone:business:notify', source, {
                type = 'info',
                message = 'Usa la consola del servidor para este comando'
            })
        else
            TriggerClientEvent('smartphone:business:notify', source, {
                type = 'error',
                message = 'No tienes permisos para usar este comando'
            })
        end
    end
end, false)


RegisterCommand('removebusiness', function(source, args, rawCommand)
    if source == 0 then 
        if #args ~= 2 then
            print('Uso: removebusiness [player_id] [business_id]')
            return
        end
        
        local playerId = tonumber(args[1])
        local businessId = tonumber(args[2])
        
        local xPlayer = ESX.GetPlayerFromId(playerId)
        if not xPlayer then
            print('Jugador no encontrado: ' .. args[1])
            return
        end
        
        local identifier = xPlayer.identifier
        if not playerBusinesses[identifier] then
            print('El jugador no tiene permisos de negocios')
            return
        end
        
        for i, id in ipairs(playerBusinesses[identifier]) do
            if id == businessId then
                table.remove(playerBusinesses[identifier], i)
                print(string.format('Permisos de negocio removidos de %s', xPlayer.getName()))
                
                TriggerClientEvent('smartphone:business:notify', playerId, {
                    type = 'info',
                    message = 'Ya no puedes gestionar este negocio'
                })
                return
            end
        end
        
        print('El jugador no tenía permisos para este negocio')
    end
end, false)


CreateThread(function()
    loadBusinesses()
    loadPlayerBusinesses()
end)
