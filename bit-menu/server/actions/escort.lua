local escorting = {}
local escorted = {}

function SetPlayerEscorted(playerId, isEscorted, escorterId)
    if not Players then
        Players = {}
    end
    Players[playerId] = Players[playerId] or {}
    Players[playerId].isEscorted = isEscorted
    
    if isEscorted then
        Players[playerId].escortedBy = escorterId
        escorting[escorterId] = playerId
        escorted[playerId] = escorterId
    else
        Players[playerId].escortedBy = nil
        if escorted[playerId] then
            escorting[escorted[playerId]] = nil
        end
        escorted[playerId] = nil
    end
end

if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-menu:requestEscort', function(source, cb, targetId)
        local sourcePlayer = ESX.GetPlayerFromId(source)
        local targetPlayer = ESX.GetPlayerFromId(targetId)
        
        if sourcePlayer and targetPlayer then
            if not Players then Players = {} end
            Players[targetId] = Players[targetId] or {}
            
            local currentEscortStatus = Players[targetId].isEscorted or false
            local newEscortStatus = not currentEscortStatus
            
            SetPlayerEscorted(targetId, newEscortStatus, newEscortStatus and source or nil)
            
            if newEscortStatus then
                TriggerClientEvent("bit-menu:setEscorted", -1, targetId, true, source)
            else
                TriggerClientEvent("bit-menu:setEscorted", -1, targetId, false, nil)
            end
            
            Utils.executeCallback("onEscort", source, targetId, newEscortStatus)
            cb(true, newEscortStatus, currentEscortStatus)
        else
            cb(false, false, false)
        end
    end)
else
    QBCore.Functions.CreateCallback('bit-menu:requestEscort', function(source, cb, targetId)
        local sourcePlayer = QBCore.Functions.GetPlayer(source)
        local targetPlayer = QBCore.Functions.GetPlayer(targetId)
        
        if sourcePlayer and targetPlayer then
            if not Players then Players = {} end
            Players[targetId] = Players[targetId] or {}
            
            local currentEscortStatus = Players[targetId].isEscorted or false
            local newEscortStatus = not currentEscortStatus
            
            SetPlayerEscorted(targetId, newEscortStatus, newEscortStatus and source or nil)
            
            if newEscortStatus then
                TriggerClientEvent("bit-menu:setEscorted", -1, targetId, true, source)
            else
                TriggerClientEvent("bit-menu:setEscorted", -1, targetId, false, nil)
            end
            
            Utils.executeCallback("onEscort", source, targetId, newEscortStatus)
            cb(true, newEscortStatus, currentEscortStatus)
        else
            cb(false, false, false)
        end
    end)
end

RegisterServerEvent('bit-menu:setPlayerEscort')
AddEventHandler('bit-menu:setPlayerEscort', function(target, state, setIntoVeh, setIntoSeat)
    local src = source
    target = tonumber(target)
    if not target then return end

    local playerCoords = GetEntityCoords(GetPlayerPed(src))
    local targetPed = GetPlayerPed(target)
    local targetCoords = GetEntityCoords(targetPed)
    if not playerCoords or not targetCoords or #(playerCoords-targetCoords) > 5 then return end

    local targetPlayer = Player(target)
    if targetPlayer then
        targetPlayer.state:set('isEscorted', state and src, true)
    end

    SetPlayerEscorted(target, state, state and src or nil)

    if not setIntoVeh or not setIntoSeat then return end
    Wait(500)

    local veh = NetworkGetEntityFromNetworkId(setIntoVeh)
    if not DoesEntityExist(veh) then return end

    SetPedIntoVehicle(targetPed, veh, setIntoSeat)
end)

AddEventHandler('playerDropped', function(reason)
    local playerId = source

    if Players and Players[playerId] then
        if Players[playerId].isEscorted and Players[playerId].escortedBy then
            TriggerClientEvent("bit-menu:setEscorted", -1, playerId, false, nil)
            escorting[Players[playerId].escortedBy] = nil
        end

        for id, data in pairs(Players) do
            if data.escortedBy == playerId then
                data.isEscorted = false
                data.escortedBy = nil
                TriggerClientEvent("bit-menu:setEscorted", -1, id, false, nil)
                escorted[id] = nil
            end
        end
    end
    
    if escorting[playerId] then
        escorted[escorting[playerId]] = nil
        escorting[playerId] = nil
    end
    
    if escorted[playerId] then
        escorting[escorted[playerId]] = nil
        escorted[playerId] = nil
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        for playerId, playerData in pairs(Players or {}) do
            if playerData.isEscorted then
                TriggerClientEvent("bit-menu:setEscorted", -1, playerId, false, nil)
            end
        end
        
        escorting = {}
        escorted = {}
    end
end)
