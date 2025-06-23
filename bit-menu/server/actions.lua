--############### VARIABLES ###############

Players = {}
local framework = Config.Framework:lower()

local function registerToggleAction(eventName, clientEvent, propKey, utilName, returnOld, requiredItem)
    local cbFunc = function(source, cbfn, targetId)
        Players[targetId] = Players[targetId] or {}
        local oldState = Players[targetId][propKey] or false
        local newState = not oldState

        if eventName == 'bit-menu:requestUnhandcuff' and not oldState then
            cbfn(false)
            return
        end
        
        if newState and requiredItem then
            local hasItem = Config.Inventory.get[Config.Inventory.system](source, requiredItem)
            if not hasItem then
                cbfn(false, "missing_item", "")
                return
            end
            Config.Inventory.remove[Config.Inventory.system](source, requiredItem, 1)
        end

        if not newState and requiredItem then
            Config.Inventory.add[Config.Inventory.system](source, requiredItem, 1)
        end
          Players[targetId][propKey] = newState
        TriggerClientEvent(clientEvent, -1, targetId, newState)
        
        -- Trigger animation for specific actions
        if propKey == 'isHandcuffed' then
            TriggerClientEvent('bit-menu:playHandcuffAnimation', source, targetId, newState)
        elseif propKey == 'isTieLegged' then
            TriggerClientEvent('bit-menu:playTieLegsAnimation', source, targetId, newState)
        elseif propKey == 'isHeadbagged' then
            TriggerClientEvent('bit-menu:playHeadbagAnimation', source, targetId, newState)
        end
        
        Utils.executeCallback(utilName, source, targetId, newState)
        
        if returnOld then
            cbfn(true, newState, oldState)
        else
            cbfn(true, newState, "")
        end
    end
    if framework == 'esx' then
        ESX.RegisterServerCallback(eventName, cbFunc)
    else
        QBCore.Functions.CreateCallback(eventName, cbFunc)
    end
end

registerToggleAction('bit-menu:requestTieLegs',   'bit-menu:applyTieLegs',   'isTieLegged',  'onTieLegs',   true, 'zipties')
registerToggleAction('bit-menu:requestHeadbag',   'bit-menu:applyHeadbag',    'isHeadbagged','onHeadbag',   true, 'headbag')
registerToggleAction('bit-menu:requestHandcuff',  'bit-menu:setHandcuffed',   'isHandcuffed','onHandcuff',  true, 'handcuffs')
registerToggleAction('bit-menu:requestUnhandcuff','bit-menu:setHandcuffed',   'isHandcuffed','onHandcuff',  true)

--############### SEARCH ###############

if Config.Framework:lower() == "esx" then
    ESX.RegisterServerCallback('bit-menu:requestSearch', function(source, cb, targetId)
        local xTarget = ESX.GetPlayerFromId(targetId)
        if xTarget then
            local inv = {}
            for _, item in ipairs(xTarget.inventory) do
                table.insert(inv, {name = item.name, label = item.label or item.name, count = item.count})
            end
            Utils.executeCallback("onSearch", source, targetId, inv)
            cb(true, inv)
            TriggerClientEvent('bit-menu:openTargetInventory', source, targetId, inv)        else
            cb(false, {})
        end
    end)
elseif Config.Framework:lower() == "qb" or Config.Framework:lower() == "qbox" then
    QBCore.Functions.CreateCallback('bit-menu:requestSearch', function(source, cb, targetId)
        local ply = QBCore.Functions.GetPlayer(targetId)
        if ply and ply.PlayerData and ply.PlayerData.items then
            local inv = {}
            for _, item in ipairs(ply.PlayerData.items) do
                table.insert(inv, {name = item.name, label = item.label or item.name, count = item.amount or item.count})
            end
            Utils.executeCallback("onSearch", source, targetId, inv)
            cb(true, inv)
        else
            cb(false, {})
        end
    end)
end


AddEventHandler('playerDropped', function(reason)
    local playerId = source

    if Players[playerId] then
        if Players[playerId].isHeadbagged then
            TriggerClientEvent("bit-menu:applyHeadbag", -1, playerId, false)
        end

        if Players[playerId].isTieLegged then
            TriggerClientEvent("bit-menu:applyTieLegs", -1, playerId, false)
        end
        Players[playerId] = nil
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        for playerId, playerData in pairs(Players) do
            if playerData.isHeadbagged then
                TriggerClientEvent("bit-menu:applyHeadbag", -1, playerId, false)
            end
            if playerData.isTieLegged then
                TriggerClientEvent("bit-menu:applyTieLegs", -1, playerId, false)
            end
        end

        Players = {}
    end
end)


RegisterNetEvent('bit-menu:addItem')
AddEventHandler('bit-menu:addItem', function(itemName, count)
    local source = source
    if not source or not itemName then return end
    
    local system = Config.Inventory.system
    local addFunc = Config.Inventory.add[system]
    
    if addFunc and type(addFunc) == 'function' then
        addFunc(source, itemName, count or 1)
    end
end)
