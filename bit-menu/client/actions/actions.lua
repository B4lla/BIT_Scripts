Action = {}

local function triggerCallback(eventName, callback, ...)
    local fw = Config.Framework:lower()
    if fw == "esx" then
        ESX.TriggerServerCallback(eventName, callback, ...)
    elseif fw == "qb" or fw == "qbox" then
        QBCore.Functions.TriggerCallback(eventName, callback, ...)
    end
end

--############### HANDCUFF | UNHANDCUFF ###############

function Action.handcuff(targetId)
    if not targetId then
        Notifications(Noti.error, Utils.getText("error"), Noti.time)
        return
    end

    triggerCallback('bit-menu:requestHandcuff', function(success, result, oldState)
        if not success then
            if result == "missing_item" then
                Notifications(Noti.error, Utils.getText("noItemHandcuffs"), Noti.time)
            else
                Notifications(Noti.error, Utils.getText("handcuffError"), Noti.time)
            end
            return
        end
        
        local newState = not oldState
        
        if newState then
            Notifications(Noti.check, Utils.getText("handcuffSuccess"), Noti.time)
        else
            Notifications(Noti.check, Utils.getText("unhandcuffSuccess"), Noti.time)
        end
    end, targetId)
end

function Action.unhandcuff(targetId)
    if not targetId then
        Notifications(Noti.error, Utils.getText("error"), Noti.time)
        return
    end
    
    triggerCallback('bit-menu:requestUnhandcuff', function(success, result, oldState)
        if not success then
            if result == "not_cuffed" then
                Notifications(Noti.error, Utils.getText("unhandcuffNotCuffed"), Noti.time)
            else
                Notifications(Noti.error, Utils.getText("unhandcuffError"), Noti.time)
            end
            return
        end
        local newState = not oldState
        if newState then
            Notifications(Noti.check, Utils.getText("handcuffSuccess"), Noti.time)
        else
            Notifications(Noti.check, Utils.getText("unhandcuffSuccess"), Noti.time)
        end
    end, targetId)
end

--############### HEADBAG ###############

function Action.headbag(targetId)
    if not targetId then
        Notifications(Noti.error, Utils.getText("error"), Noti.time)
        return
    end
    
    triggerCallback('bit-menu:requestHeadbag', function(success, result, oldState)
        if not success then
            if result == "missing_item" then
                Notifications(Noti.error, Utils.getText("noItemHeadbag"), Noti.time)
            else
                Notifications(Noti.error, Utils.getText("headbagError"), Noti.time)
            end
            return
        end
        
        local newState = not oldState
        
        if newState then
            Notifications(Noti.check, Utils.getText("headbagApplied"), Noti.time)
        else
            Notifications(Noti.check, Utils.getText("headbagRemoved"), Noti.time)
        end
    end, targetId)
end

--############### TIELEGS ###############

function Action.tielegs(targetId)
    if not targetId then
        Notifications(Noti.error, Utils.getText("error"), Noti.time)
        return
    end

    triggerCallback('bit-menu:requestTieLegs', function(success, result, oldState)
        if not success then
            if result == "missing_item" then
                Notifications(Noti.error, Utils.getText("noItemZipties"), Noti.time)
            else
                Notifications(Noti.error, Utils.getText("tieLegsError"), Noti.time)
            end
            return
        end
        
        local newState = not oldState
        
        if newState then
            Notifications(Noti.check, Utils.getText("tieLegsApplied"), Noti.time)
        else
            Notifications(Noti.check, Utils.getText("tieLegsRemoved"), Noti.time)
        end
    end, targetId)
end


--############### SEARCH ###############

function Action.search(targetId)
    if not targetId then
        Notifications("error", Utils.getText("error"), Noti.time)
        return
    end
    triggerCallback('bit-menu:requestSearch', function(success)
        if not success then
            Notifications(Noti.error, Utils.getText("searchError"), Noti.time)
        end
    end, targetId)
end

-- Listen to server event to open target inventory
RegisterNetEvent('bit-menu:openTargetInventory')
AddEventHandler('bit-menu:openTargetInventory', function(targetId, inv)
    local system = Config.Inventory.system
    if system == "qbcore" or system == "qbox" or system == "qb" then
        local playerID = GetPlayerServerId(PlayerId())
        TriggerServerEvent("bit-menu:openInventoryQB", playerID, targetId, inv)
    else
        local openFunc = Config.Inventory.open[system]
        if openFunc then
            openFunc(targetId, inv)
        end
    end
end)

--############### PUT / REMOVE FROM VEHICLE ###############

function Action.putInVehicle(targetId)
    if not targetId then
        Notifications("error", Utils.getText("error"), 5000)
        return
    end
    local playerPed = PlayerPedId()
    if IsPedInAnyVehicle(playerPed, false) then
        local vehicle = GetVehiclePedIsIn(playerPed, false)
        local maxSeats = GetVehicleMaxNumberOfPassengers(vehicle)
        local availableSeat = nil

        if maxSeats == 1 then
            if IsVehicleSeatFree(vehicle, 0) then availableSeat = 0 end
        else
            for seat = maxSeats - 1, 1, -1 do
                if IsVehicleSeatFree(vehicle, seat) then availableSeat = seat break end
            end
            if not availableSeat and IsVehicleSeatFree(vehicle, 0) then availableSeat = 0 end
        end
        if availableSeat then
            triggerCallback('bit-menu:requestPutInVehicle', function(success)
                if success then 
                    Notifications(Noti.check, Utils.getText("putInVehicleSuccess"), Noti.time)
                else 
                    Notifications(Noti.error, Utils.getText("putInVehicleErrorNoVehicle"), Noti.time) end
            end, targetId, availableSeat, VehToNet(vehicle))
        else
            Notifications("error", Utils.getText("noSeatsAvailable"), Noti.time)
        end
    else
        Notifications(Noti.error, Utils.getText("putInVehicleErrorNoVehicle"), Noti.time)
    end
end

function Action.removeFromVehicle(targetId)
    if not targetId then
        Notifications("error", Utils.getText("error"), 5000)
        return
    end
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    if IsPedInAnyVehicle(targetPed, false) then
        triggerCallback('bit-menu:requestRemoveFromVehicle', function(success)
            if success then 
                Notifications(Noti.check, Utils.getText("removeFromVehicleSuccess"), Noti.time)
            else 
                Notifications(Noti.error, Utils.getText("removeFromVehicleErrorNotInVehicle"), Noti.time) end
        end, targetId)
    else
        Notifications(Noti.error, Utils.getText("removeFromVehicleErrorNotInVehicle"), Noti.time)
    end
end




--############### ESCORT ###############

function Action.escort(targetId)
    if not targetId then
        Notifications("error", Utils.getText("error"), 5000)
        return
    end

    TriggerEvent('bit-menu:escort:toggle', targetId)
end

--############### DRAG ###############

function Action.drag(targetId)
    if not targetId then
        Notifications("error", Utils.getText("error"), 5000)
        return
    end
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    if not targetPed then
        Notifications("error", Utils.getText("playerNotNearby"), Noti.time)
        return
    end

    TriggerEvent('bit-menu:startDrag', targetId)
end


--############### VEHICLE EVENTS ###############

RegisterNetEvent("bit-menu:enterVehicle", function(vehicleNetId, seat)
    local vehicle = NetworkGetEntityFromNetworkId(vehicleNetId)
    if DoesEntityExist(vehicle) then
        TaskWarpPedIntoVehicle(PlayerPedId(), vehicle, seat)
    end
end)

RegisterNetEvent("bit-menu:exitVehicle", function()
    local p = PlayerPedId()
    if IsPedInAnyVehicle(p, false) then
        TaskLeaveVehicle(p, GetVehiclePedIsIn(p, false), 0)
    end
end)



--############### CARRY ###############
function Action.carry(targetId)
    if not targetId then
        Notifications("error", Utils.getText("error"), 5000)
        return
    end
    TriggerEvent('bit-menu:startCarry', targetId)
end
