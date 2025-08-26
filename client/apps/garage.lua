RegisterNUICallback('smartphone:garage:getVehicles', function(data, cb)
    local serverCallback = function(result)
        cb(result)
    end

    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:server:getVehicles', serverCallback)
    else
        QBCore.Functions.TriggerCallback('bit-smartphone:server:getVehicles', serverCallback)
    end
end)


RegisterNUICallback('smartphone:garage:spawnVehicle', function(data, cb)
    local plate = data.plate
    if not plate then
        cb({success = false, message = "Matrícula no proporcionada"})
        return
    end

    local serverCallback = function(result)
        if result.success then
            CreateThread(function()
                local playerPed = PlayerPedId()
                local playerCoords = GetEntityCoords(playerPed)
                local vehicleModel = data.model or result.model or 'adder'
                local vehicleHash = GetHashKey(vehicleModel)

                RequestModel(vehicleHash)
                while not HasModelLoaded(vehicleHash) do Wait(50) end

                local spawnPos = playerCoords + vector3(5.0, 5.0, 0.0)
                local spawnHeading = GetEntityHeading(playerPed)

                local vehicle = CreateVehicle(vehicleHash, spawnPos.x, spawnPos.y, spawnPos.z, spawnHeading, true, false)

                if result.props then
                    if Config.Framework == 'esx' then
                        ESX.Game.SetVehicleProperties(vehicle, result.props)
                    else
                        QBCore.Functions.SetVehicleProperties(vehicle, result.props)
                    end
                end

                SetVehicleNumberPlateText(vehicle, plate)
                if Config.Garage.useKeys then
                    TriggerEvent(Config.Garage.giveKeysEvent, plate, vehicle)
                end
                SetModelAsNoLongerNeeded(vehicleHash)

                if Config.Framework == 'esx' then
                    ESX.ShowNotification(result.message or 'Vehículo sacado del garaje')
                else
                    QBCore.Functions.Notify(result.message or 'Vehículo sacado del garaje','success')
                end
            end)
        end
        cb(result)
    end

    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:server:spawnVehicle', serverCallback, plate)
    else
        QBCore.Functions.TriggerCallback('bit-smartphone:server:spawnVehicle', serverCallback, plate)
    end
end)


RegisterNUICallback('smartphone:garage:storeVehicle', function(data, cb)
    local plate = data.plate
    if not plate then
        cb({success = false, message = "Matrícula no proporcionada"})
        return
    end

    local playerPed = PlayerPedId()
    local playerCoords = GetEntityCoords(playerPed)
    local targetVehicle = nil

    for vehicle in EnumerateVehicles() do
        if GetVehicleNumberPlateText(vehicle) == plate then
            targetVehicle = vehicle
            break
        end
    end

    if not targetVehicle then
        cb({success = false, message = "Vehículo no encontrado cerca de ti"})
        return
    end

    if GetVehicleNumberOfPassengers(targetVehicle) > 0 or GetPedInVehicleSeat(targetVehicle, -1) ~= 0 then
        cb({success = false, message = "No se puede guardar un vehículo con personas dentro"})
        return
    end

    local serverCallback = function(result)
        if result.success then
            DeleteVehicle(targetVehicle)
            if Config.Framework == 'esx' then
                ESX.ShowNotification(result.message or 'Vehículo guardado en el garaje')
            else
                QBCore.Functions.Notify(result.message or 'Vehículo guardado en el garaje','success')
            end
        end
        cb(result)
    end

    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:server:storeVehicle', serverCallback, plate)
    else
        QBCore.Functions.TriggerCallback('bit-smartphone:server:storeVehicle', serverCallback, plate)
    end
end)


RegisterNUICallback('smartphone:garage:payImpound', function(data, cb)
    local plate = data.plate
    local amount = data.amount or 500
    if not plate then
        cb({success = false, message = "Matrícula no proporcionada"})
        return
    end

    local serverCallback = function(result)
        if result.success then
            if Config.Framework == 'esx' then
                ESX.ShowNotification(result.message or 'Multa pagada')
            else
                QBCore.Functions.Notify(result.message or 'Multa pagada','success')
            end
        end
        cb(result)
    end

    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:server:payImpound', serverCallback, plate, amount)
    else
        QBCore.Functions.TriggerCallback('bit-smartphone:server:payImpound', serverCallback, plate, amount)
    end
end)


function EnumerateVehicles()
    return coroutine.wrap(function()
        local handle, vehicle = FindFirstVehicle()
        local success
        repeat
            coroutine.yield(vehicle)
            success, vehicle = FindNextVehicle(handle)
        until not success
        EndFindVehicle(handle)
    end)
end


RegisterNetEvent('bit-smartphone:client:refreshVehicles')
AddEventHandler('bit-smartphone:client:refreshVehicles', function()
    
    SendNUIMessage({
        type = 'refreshVehicles',
        data = {}
    })
end)

RegisterNetEvent('bit-smartphone:client:vehicleSpawned')
AddEventHandler('bit-smartphone:client:vehicleSpawned', function(plate, coords)
    
    if Config.Garage.onVehicleSpawned then
        Config.Garage.onVehicleSpawned(plate, coords)
    end
end)

RegisterNetEvent('bit-smartphone:client:vehicleStored')
AddEventHandler('bit-smartphone:client:vehicleStored', function(plate)
    
    if Config.Garage.onVehicleStored then
        Config.Garage.onVehicleStored(plate)
    end
end)