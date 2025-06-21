local carrying = {}
local carried = {}

function CanPlayerBeCarried(playerId)
    return true
end

function SetPlayerCarried(playerId, isCarried, carrierId)
    if not Players then
        Players = {}
    end
    Players[playerId] = Players[playerId] or {}
    Players[playerId].isCarried = isCarried
    if isCarried then
        Players[playerId].carriedBy = carrierId
        carrying[carrierId] = playerId
        carried[playerId] = carrierId
    else
        Players[playerId].carriedBy = nil
        if Players[playerId].carriedBy then
            carrying[Players[playerId].carriedBy] = nil
        end
        carried[playerId] = nil
    end
end

if Config.Framework:lower() == "esx" then
    ESX.RegisterServerCallback('bit-menu:requestCarry', function(source, cb, targetId)
        local sourcePlayer = ESX.GetPlayerFromId(source)
        local targetPlayer = ESX.GetPlayerFromId(targetId)

        if sourcePlayer and targetPlayer then
            if CanPlayerBeCarried(targetId) then
                if not Players then Players = {} end
                Players[targetId] = Players[targetId] or {}
                local currentCarryStatus = Players[targetId].isCarried or false
                local newCarryStatus = not currentCarryStatus
                
                SetPlayerCarried(targetId, newCarryStatus, newCarryStatus and source or nil)
                
                if newCarryStatus then
                    TriggerClientEvent("bit-menu:carry:sync", -1, targetId, source)
                else
                    TriggerClientEvent("bit-menu:carry:stop", -1, targetId, source)
                end
                
                Utils.executeCallback("onCarry", source, targetId, newCarryStatus)
                cb(true, true, currentCarryStatus)
            else
                cb(true, false, false)
            end
        else
            cb(false, false, false)
        end
    end)
elseif Config.Framework:lower() == "qb" or Config.Framework:lower() == "qbox" then
    QBCore.Functions.CreateCallback('bit-menu:requestCarry', function(source, cb, targetId)
        local sourcePlayer = QBCore.Functions.GetPlayer(source)
        local targetPlayer = QBCore.Functions.GetPlayer(targetId)

        if sourcePlayer and targetPlayer then
            if CanPlayerBeCarried(targetId) then
                if not Players then Players = {} end
                Players[targetId] = Players[targetId] or {}
                local currentCarryStatus = Players[targetId].isCarried or false
                local newCarryStatus = not currentCarryStatus
                
                SetPlayerCarried(targetId, newCarryStatus, newCarryStatus and source or nil)
                
                if newCarryStatus then
                    TriggerClientEvent("bit-menu:carry:sync", -1, targetId, source)
                else
                    TriggerClientEvent("bit-menu:carry:stop", -1, targetId, source)
                end
                
                Utils.executeCallback("onCarry", source, targetId, newCarryStatus)
                cb(true, true, currentCarryStatus)
            else
                cb(true, false, false)
            end
        else
            cb(false, false, false)
        end
    end)
end

RegisterServerEvent("bit-menu:carry:sync")
AddEventHandler("bit-menu:carry:sync", function(targetId)
    local src = source
    if targetId and tonumber(targetId) then
        local srcPed = GetPlayerPed(src)
        local tgtPed = GetPlayerPed(targetId)
        if srcPed and tgtPed and #(GetEntityCoords(srcPed) - GetEntityCoords(tgtPed)) < 3.0 then
            TriggerClientEvent("bit-menu:carry:syncTarget", targetId, src)
            carrying[src] = targetId
            carried[targetId] = src
        end
    end
end)

RegisterServerEvent("bit-menu:carry:stop")
AddEventHandler("bit-menu:carry:stop", function(targetId)
    local src = source
    if targetId and tonumber(targetId) then
        TriggerClientEvent("bit-menu:carry:stopTarget", targetId)
        carrying[src] = nil
        carried[targetId] = nil
    end
end)

RegisterServerEvent("CarryPeople:sync")
AddEventHandler("CarryPeople:sync", function(targetSrc)
    local source = source
    local sourcePed = GetPlayerPed(source)
    local sourceCoords = GetEntityCoords(sourcePed)
    local targetPed = GetPlayerPed(targetSrc)
    local targetCoords = GetEntityCoords(targetPed)
    if #(sourceCoords - targetCoords) <= 3.0 then 
        TriggerClientEvent("CarryPeople:syncTarget", targetSrc, source)
        carrying[source] = targetSrc
        carried[targetSrc] = source
    end
end)

RegisterServerEvent("CarryPeople:stop")
AddEventHandler("CarryPeople:stop", function(targetSrc)
    local source = source

    if carrying[source] then
        TriggerClientEvent("CarryPeople:cl_stop", targetSrc)
        carrying[source] = nil
        carried[targetSrc] = nil
    elseif carried[source] then
        TriggerClientEvent("CarryPeople:cl_stop", carried[source])			
        carrying[carried[source]] = nil
        carried[source] = nil
    end
end)

AddEventHandler('playerDropped', function(reason)
    local source = source

    if Players and Players[source] then
        if Players[source].isCarried and Players[source].carriedBy then
            TriggerClientEvent("bit-menu:carry:stop", -1, source, Players[source].carriedBy)
            carrying[Players[source].carriedBy] = nil
        end

        for playerId, data in pairs(Players) do
            if data.carriedBy == source then
                data.isCarried = false
                data.carriedBy = nil
                TriggerClientEvent("bit-menu:carry:stop", -1, playerId, source)
                carried[playerId] = nil
            end
        end
    end
    
    if carrying[source] then
        TriggerClientEvent("CarryPeople:cl_stop", carrying[source])
        carried[carrying[source]] = nil
        carrying[source] = nil
    end

    if carried[source] then
        TriggerClientEvent("CarryPeople:cl_stop", carried[source])
        carrying[carried[source]] = nil
        carried[source] = nil
    end
end)