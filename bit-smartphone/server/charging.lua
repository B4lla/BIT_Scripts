local chargingPlayers = {}


RegisterServerEvent('bit-smartphone:server:payCharging')
AddEventHandler('bit-smartphone:server:payCharging', function(cost)
    local playerId = source
    local playerIdentifier = nil
    
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(playerId)
        if not xPlayer then return end
        
        playerIdentifier = xPlayer.identifier
   
        if xPlayer.getMoney() >= cost then
            xPlayer.removeMoney(cost)
        elseif xPlayer.getAccount('bank').money >= cost then
            xPlayer.removeAccountMoney('bank', cost)
        else
            TriggerClientEvent('bit-smartphone:client:stopCharging', playerId)
            return
        end
        
    elseif Config.Framework == "qb" then
        local Player = QBCore.Functions.GetPlayer(playerId)
        if not Player then return end
        
        playerIdentifier = Player.PlayerData.citizenid
    
        if Player.PlayerData.money.cash >= cost then
            Player.Functions.RemoveMoney('cash', cost, "phone-charging")
        elseif Player.PlayerData.money.bank >= cost then
            Player.Functions.RemoveMoney('bank', cost, "phone-charging")
        else
            TriggerClientEvent('bit-smartphone:client:stopCharging', playerId)
            return
        end
    end

    chargingPlayers[playerId] = {
        identifier = playerIdentifier,
        startTime = os.time(),
        cost = cost
    }
    
end)

AddEventHandler('playerDropped', function()
    local playerId = source
    if chargingPlayers[playerId] then
        chargingPlayers[playerId] = nil
    end
end)

exports('IsPlayerCharging', function(playerId)
    return chargingPlayers[playerId] ~= nil
end)

exports('GetChargingInfo', function(playerId)
    return chargingPlayers[playerId]
end)

RegisterCommand('stopcharging', function(source, args, rawCommand)
    if source == 0 then 
        local targetId = tonumber(args[1])
        if targetId and chargingPlayers[targetId] then
            chargingPlayers[targetId] = nil
            TriggerClientEvent('bit-smartphone:client:stopCharging', targetId)
            print("^2[CHARGING]^0 Carga detenida para jugador " .. targetId)
        else
            print("^1[CHARGING]^0 Jugador no encontrado o no está cargando")
        end
    end
end, false)

RegisterCommand('addchargingstation', function(source, args, rawCommand)
    if source == 0 then 
        if #args < 4 then
            print("^1[CHARGING]^0 Uso: addchargingstation [x] [y] [z] [nombre] [costo(opcional)]")
            return
        end
        
        local x, y, z = tonumber(args[1]), tonumber(args[2]), tonumber(args[3])
        local name = args[4]
        local cost = tonumber(args[5]) or 0
        
        if not x or not y or not z then
            print("^1[CHARGING]^0 Coordenadas inválidas")
            return
        end
        
        local newStation = {
            id = #Config.ChargingStations.stations + 1,
            coords = vector3(x, y, z),
            heading = 0.0,
            label = name,
            prop = "prop_cctv_cont_05",
            free = cost == 0,
            cost = cost
        }

        table.insert(Config.ChargingStations.stations, newStation)

        TriggerClientEvent('bit-smartphone:client:addChargingStation', -1, newStation)
        
        print("^2[CHARGING]^0 Estación agregada: " .. name .. " en " .. x .. ", " .. y .. ", " .. z .. " (Costo: $" .. cost .. ")")
    elseif source > 0 then
        local playerId = source
        
        if #args < 1 then
            TriggerClientEvent('chat:addMessage', playerId, {
                color = {255, 0, 0},
                multiline = true,
                args = {"Sistema", "Uso: /addchargingstation [nombre] [costo(opcional)]"}
            })
            return
        end

        local playerPed = GetPlayerPed(playerId)
        local playerCoords = GetEntityCoords(playerPed)
        
        local name = args[1]
        local cost = tonumber(args[2]) or 0
        
        local newStation = {
            id = #Config.ChargingStations.stations + 1,
            coords = vector3(playerCoords.x, playerCoords.y, playerCoords.z),
            heading = 0.0,
            label = name,
            prop = "prop_cctv_cont_05",
            free = cost == 0,
            cost = cost
        }
        
        table.insert(Config.ChargingStations.stations, newStation)
        TriggerClientEvent('bit-smartphone:client:addChargingStation', -1, newStation)
        
        TriggerClientEvent('chat:addMessage', playerId, {
            color = {0, 255, 0},
            multiline = true,
            args = {"Sistema", "Estación de carga agregada: " .. name .. " (Costo: $" .. cost .. ")"}
        })
    end
end, false)


Citizen.CreateThread(function()
    while true do
        Wait(300000) 
        
        local currentTime = os.time()
        for playerId, data in pairs(chargingPlayers) do
            if currentTime - data.startTime > 600 then
                chargingPlayers[playerId] = nil
                TriggerClientEvent('bit-smartphone:client:stopCharging', playerId)
            end
        end
    end
end)
