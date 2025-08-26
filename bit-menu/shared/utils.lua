Utils = {}
local framework = Config.Framework:lower()



--- Client version - only gets the local player's job
---@return string|nil job name of the local player
function Utils.getPlayerJob()
    if framework == "esx" then
        local playerData = ESX.GetPlayerData()
        return playerData.job and playerData.job.name or nil
    elseif framework == "qb" or framework == "qbox" then
        local player = QBCore.Functions.GetPlayerData()
        return player.job and player.job.name or nil
    end
    return nil
end

--- Server version - gets player job by source ID
---@param source number Player server ID
---@return string|nil job name of the specified player
function Utils.getPlayerJobServer(source)
    if framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.job and xPlayer.job.name or nil
    elseif framework == "qb" or framework == "qbox" then
        local player = QBCore.Functions.GetPlayer(source)
        return player and player.PlayerData and player.PlayerData.job and player.PlayerData.job.name or nil
    end
    return nil
end

--- Get player gang information (client-side)
---@return string|nil gang name/ID of the local player
function Utils.getPlayerGang()
    if framework == "esx" then
        if exports['origen_ilegal'] and type(exports['origen_ilegal'].GetGangID) == 'function' then
            return exports['origen_ilegal']:GetGangID()
        end
    elseif framework == "qb" or framework == "qbox" then
        if exports['qb-gangs'] and type(exports['qb-gangs'].GetGang) == 'function' then
            return exports['qb-gangs']:GetGang()
        end
    end
    return nil
end

--- Get player display name
---@param source number Player's server ID
---@return string|nil formatted player name
function Utils.getPlayerName(source)
    if framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.getName and xPlayer:getName() or nil
    elseif framework == "qb" or framework == "qbox" then
        local player = QBCore.Functions.GetPlayer(source)
        if player and player.PlayerData and player.PlayerData.charinfo then
            local ci = player.PlayerData.charinfo
            return ci.firstname .. " " .. ci.lastname
        end
    end
    return nil
end

--- Get player inventory using configured system
---@param targetPlayer table Player object from framework
---@return table inventory data
function Utils.getPlayerInventory(targetPlayer)
    local system = Config.Inventory.system
    local exportFunc = Config.Inventory.exports[system]
    
    if exportFunc and type(exportFunc) == "function" then
        return exportFunc(targetPlayer)
    else
        print("^1[ERROR]^0 Inventory system not configured correctly: " .. system)
        return {}
    end
end

--- Execute configuration callbacks safely
---@param callbackName string Name of the callback to execute
---@param ... any Arguments to pass to the callback
function Utils.executeCallback(callbackName, ...)
    local callback = Config.Callbacks[callbackName]
    if callback and type(callback) == "function" then
        local success, error = pcall(callback, ...)
        if not success then
            print("^1[ERROR]^0 Error in callback " .. callbackName .. ": " .. error)
        end
    end
end

--- Get configurable text strings
---@param textKey string Key for the text to retrieve
---@return string localized text or error message
function Utils.getText(textKey)
    return Actions.texts[textKey] or ("Text not found: " .. textKey)
end

function Utils.getPlayerNameServer(targetId)
    local name = ""
    if framework == "esx" then
        ESX.TriggerServerCallback('bit-menu:getPlayerName', function(n) name = n end, targetId)
    elseif framework == "qb" or framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-menu:getPlayerName', function(n) name = n end, targetId)
    end

    local timeout, elapsed = 5000, 0
    while name == "" and elapsed < timeout do
        Citizen.Wait(10)
        elapsed = elapsed + 10
    end
    return name ~= "" and name or "Unknown"
end

function Utils.checkAndRemoveItem(itemName, count)
    local system = Config.Inventory.system
    local sourceId = source 
    local hasItem = Config.Inventory.get[system](sourceId, itemName)
    if hasItem then
        Config.Inventory.remove[system](sourceId, itemName, count or 1)
        return true
    end
    return false
end

function Utils.addItem(itemName, count)
    TriggerServerEvent('bit-menu:addItem', itemName, count or 1)
end