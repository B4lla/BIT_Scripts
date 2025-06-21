if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-menu:requestPutInVehicle', function(source, cb, targetId, seat, vehicleNetId)
        local sourcePlayer = ESX.GetPlayerFromId(source)
        local targetPlayer = ESX.GetPlayerFromId(targetId)

        if sourcePlayer and targetPlayer then
            local vehicle = NetworkGetEntityFromNetworkId(vehicleNetId)
            if DoesEntityExist(vehicle) then
                TriggerClientEvent("bit-menu:enterVehicle", targetId, vehicleNetId, seat)
                Utils.executeCallback("onPutInVehicle", source, targetId, vehicleNetId, seat)
                cb(true)
            else
                cb(false)
            end
        else
            cb(false)
        end
    end)

    ESX.RegisterServerCallback('bit-menu:requestRemoveFromVehicle', function(source, cb, targetId)
        local sourcePlayer = ESX.GetPlayerFromId(source)
        local targetPlayer = ESX.GetPlayerFromId(targetId)

        if sourcePlayer and targetPlayer then
            TriggerClientEvent("bit-menu:exitVehicle", targetId)
            Utils.executeCallback("onRemoveFromVehicle", source, targetId)
            cb(true)
        else
            cb(false)
        end
    end)
else
    QBCore.Functions.CreateCallback('bit-menu:requestPutInVehicle', function(source, cb, targetId, seat, vehicleNetId)
        local sourcePlayer = QBCore.Functions.GetPlayer(source)
        local targetPlayer = QBCore.Functions.GetPlayer(targetId)

        if sourcePlayer and targetPlayer then
            local vehicle = NetworkGetEntityFromNetworkId(vehicleNetId)
            if DoesEntityExist(vehicle) then
                TriggerClientEvent("bit-menu:enterVehicle", targetId, vehicleNetId, seat)
                Utils.executeCallback("onPutInVehicle", source, targetId, vehicleNetId, seat)
                cb(true)
            else
                cb(false)
            end
        else
            cb(false)
        end
    end)

    QBCore.Functions.CreateCallback('bit-menu:requestRemoveFromVehicle', function(source, cb, targetId)
        local sourcePlayer = QBCore.Functions.GetPlayer(source)
        local targetPlayer = QBCore.Functions.GetPlayer(targetId)

        if sourcePlayer and targetPlayer then
            TriggerClientEvent("bit-menu:exitVehicle", targetId)
            Utils.executeCallback("onRemoveFromVehicle", source, targetId)
            cb(true)
        else
            cb(false)
        end
    end)
end
