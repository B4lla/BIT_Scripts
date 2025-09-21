local function GetVehicleModels()
    local models = {}
    for i, vehicle in ipairs(Config.BikeRent.vehicles) do
        models[vehicle.id] = vehicle.model
    end
    return models
end

local function GetVehicleData(vehicleId)
    for i, vehicle in ipairs(Config.BikeRent.vehicles) do
        if vehicle.id == vehicleId then
            return vehicle
        end
    end
    return nil
end

local VehicleModels = GetVehicleModels()
local ActiveRentals = {}




RegisterNetEvent('bit-smartphone:bikerent:processRental')
AddEventHandler('bit-smartphone:bikerent:processRental', function(vehicleId, duration)
    local src = source
    
    local vehicleData = GetVehicleData(vehicleId)
    if not vehicleData then
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
            action = 'notification',
            data = {
                type = "error",
                title = "Error",
                message = "Vehículo no encontrado"
            }
        })
        return
    end
    
    local totalCost = vehicleData.price * duration
    local depositAmount = Config.BikeRent.depositRequired and Config.BikeRent.depositAmount or 0
    local totalRequired = totalCost + depositAmount
    
    local hasEnough, accountType = hasEnoughMoney(src, totalRequired, 'bank')
    if not hasEnough then
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
            action = 'notification',
            data = {
                type = "error",
                title = "Fondos insuficientes",
                message = "Necesitas $" .. totalRequired .. " en tu cuenta bancaria"
            }
        })
        return
    end
    
    if not removeMoney(src, totalRequired, accountType) then
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
            action = 'notification',
            data = {
                type = "error",
                title = "Error",
                message = "No se pudo procesar el pago"
            }
        })
        return
    end
    
    local rentalId = #ActiveRentals + 1
    ActiveRentals[rentalId] = {
        playerId = src,
        vehicleId = vehicleId,
        vehicleModel = vehicleData.model,
        vehicleName = vehicleData.name,
        startTime = os.time(),
        duration = duration,
        totalCost = totalCost,
        depositPaid = depositAmount,
        active = true
    }
    
    TriggerClientEvent('bikerent:spawnVehicle', src, {
        model = vehicleData.model,
        name = vehicleData.name,
        id = vehicleData.id,
        rentalId = rentalId,
        duration = duration * 3600000
    })
    
    TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
        action = 'notification',
        data = {
            type = "success",
            title = "¡Alquiler confirmado!",
            message = string.format("%s alquilado por %d hora(s) - $%d cobrados", vehicleData.name, duration, totalRequired)
        }
    })
    
    
    SetTimeout(duration * 3600000, function() 
        if ActiveRentals[rentalId] and ActiveRentals[rentalId].active then
            ActiveRentals[rentalId].active = false
            ActiveRentals[rentalId].endTime = os.time()
            
            TriggerClientEvent('bikerent:endRentalClient', src, rentalId)
            
            TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
                action = 'notification',
                data = {
                    type = "info",
                    title = "Tiempo agotado",
                    message = "Tu alquiler ha expirado automáticamente"
                }
            })
        end
    end)
end)


RegisterNetEvent('bikerent:endRental')
AddEventHandler('bikerent:endRental', function(rentalId)
    local source = source
    
    local rental = nil
    for id, rentalData in pairs(ActiveRentals) do
        if rentalData.playerId == source and rentalData.active then
            rental = rentalData
            rentalId = id
            break
        end
    end
    
    if not rental then
        TriggerClientEvent('bikerent:notification', source, {
            type = "error",
            title = "Error",
            message = "No se encontró alquiler activo"
        })
        return
    end
    
    rental.active = false
    rental.endTime = os.time()
    
    TriggerClientEvent('bikerent:endRentalClient', source, rentalId)
    
    local timeUsed = (rental.endTime - rental.startTime) / 3600 
    local refund = 0
    
    if timeUsed < rental.duration then
        local unusedTime = rental.duration - timeUsed
        refund = math.floor((rental.totalCost / rental.duration) * unusedTime * 0.5)
        
        if refund > 0 then
            addMoney(source, refund, 'cash')
        end
    end
    
    local message = "Alquiler finalizado"
    if refund > 0 then
        message = string.format("Alquiler finalizado - $%d reembolsados", refund)
    end
    
    TriggerClientEvent('bikerent:notification', source, {
        type = "success",
        title = "Alquiler finalizado",
        message = message
    })
end)


RegisterCommand('bikerent:admin', function(source, args, rawCommand)
    if source == 0 then
        local activeCount = 0
        for _, rental in pairs(ActiveRentals) do
            if rental.active then
                activeCount = activeCount + 1
            end
        end
        print(string.format("Alquileres activos: %d", activeCount))
    end
end, false)


CreateThread(function()
    while true do
        Wait(3600000) 
        
        local currentTime = os.time()
        for id, rental in pairs(ActiveRentals) do
            if rental.active then
                local elapsedHours = (currentTime - rental.startTime) / 3600
                if elapsedHours >= rental.duration then
                    rental.active = false
                    rental.endTime = currentTime
                    
                    TriggerClientEvent('bikerent:notification', rental.playerId, {
                        type = "info",
                        title = "Alquiler vencido",
                        message = "Tu alquiler ha expirado automáticamente"
                    })
                end
            end
        end
    end
end)


if Config and Config.Framework == 'esx' then
    ESX.RegisterServerCallback('bit-smartphone:getBikeRentVehicles', function(source, cb)
        local vehicles = Config.BikeRent and Config.BikeRent.vehicles or {}
        cb(vehicles)
    end)
else
    QBCore.Functions.CreateCallback('bit-smartphone:getBikeRentVehicles', function(source, cb)
        local vehicles = Config.BikeRent and Config.BikeRent.vehicles or {}
        cb(vehicles)
    end)
end
