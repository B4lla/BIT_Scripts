local dragging = {}
local dragged = {}

RegisterServerEvent("bit-menu:drag:sync")
AddEventHandler("bit-menu:drag:sync", function(targetSrc)
    if targetSrc > 0 and #(GetEntityCoords(GetPlayerPed(source)) - GetEntityCoords(GetPlayerPed(targetSrc))) < 20.0 then
        TriggerClientEvent("bit-menu:syncTarget", targetSrc, source)
        dragging[source] = targetSrc
        dragged[targetSrc] = source
    end
end)

RegisterServerEvent("bit-menu:drag:stop")
AddEventHandler("bit-menu:drag:stop", function(targetSrc)
	local source = source

	if dragging[source] then
	    TriggerClientEvent("bit-menu:drag:stopTarget", targetSrc, source)

		dragging[source] = nil
		dragged[targetSrc] = nil
	end
end)


if Config.Framework:lower() == "esx" then
    ESX.RegisterServerCallback('bit-menu:requestDrag', function(source, cb, targetId)
        if not Players then Players = {} end
        Players[targetId] = Players[targetId] or {}
        local isDragged = Players[targetId].isDragged or false
        Players[targetId].isDragged = not isDragged
        
        TriggerClientEvent('bit-menu:applyDrag', -1, source, targetId, not isDragged)
        Utils.executeCallback("onDrag", source, targetId, not isDragged)
        cb(true, not isDragged)
    end)
elseif Config.Framework:lower() == "qb" or Config.Framework:lower() == "qbox" then
    QBCore.Functions.CreateCallback('bit-menu:requestDrag', function(source, cb, targetId)
        if not Players then Players = {} end
        Players[targetId] = Players[targetId] or {}
        local isDragged = Players[targetId].isDragged or false
        Players[targetId].isDragged = not isDragged
        
        TriggerClientEvent('bit-menu:applyDrag', -1, source, targetId, not isDragged)
        Utils.executeCallback("onDrag", source, targetId, not isDragged)
        cb(true, not isDragged)
    end)
end

AddEventHandler('playerDropped', function(reason)
	local source = source

	dragging[source] = nil
	dragged[source] = nil
	
    if Players and Players[source] and Players[source].isDragged then
        TriggerClientEvent('bit-menu:applyDrag', -1, nil, source, false)
    end
    
    for id, data in pairs(Players or {}) do
        if data.isDragged then
            TriggerClientEvent('bit-menu:applyDrag', -1, nil, id, false)
            data.isDragged = false
        end
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        dragging = {}
        dragged = {}

        for playerId, playerData in pairs(Players or {}) do
            if playerData.isDragged then
                TriggerClientEvent('bit-menu:applyDrag', -1, nil, playerId, false)
            end
        end
    end
end)