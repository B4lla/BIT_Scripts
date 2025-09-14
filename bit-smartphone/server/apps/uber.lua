local activeTrips = {}
local driverPool = {}

function GetPlayer(source)
    if Config and Config.Framework == "esx" then
        return ESX and ESX.GetPlayerFromId and ESX.GetPlayerFromId(source)
    elseif Config and (Config.Framework == "qb" or Config.Framework == "qbox") then
        return QBCore and QBCore.Functions and QBCore.Functions.GetPlayer and QBCore.Functions.GetPlayer(source)
    end
    return nil
end


function GetPlayerMoney(xPlayer)
    if not xPlayer then return 0 end
    if Config and Config.Framework == "esx" then
        
        return xPlayer.getMoney and xPlayer.getMoney() or 0
    elseif Config and (Config.Framework == "qb" or Config.Framework == "qbox") then
        
        return xPlayer.PlayerData and xPlayer.PlayerData.money and xPlayer.PlayerData.money.cash or 0
    end
    return 0
end


function RemovePlayerMoney(xPlayer, amount)
    if not xPlayer then return end
    if Config and Config.Framework == "esx" then
        if xPlayer.removeMoney then xPlayer.removeMoney(amount) end
    elseif Config and (Config.Framework == "qb" or Config.Framework == "qbox") then
        if xPlayer.Functions and xPlayer.Functions.RemoveMoney then
            xPlayer.Functions.RemoveMoney('cash', amount)
        end
    end
end


function RegisterCallback(eventName, callback)
    if Config and Config.Framework == "esx" then
        if ESX and ESX.RegisterServerCallback then
            ESX.RegisterServerCallback(eventName, callback)
        end
    elseif Config and (Config.Framework == "qb" or Config.Framework == "qbox") then
        if QBCore and QBCore.Functions and QBCore.Functions.CreateCallback then
            QBCore.Functions.CreateCallback(eventName, callback)
        end
    end
end


RegisterCallback('bit-smartphone:uber:getEstimate', function(source, cb, data)
    local pickup = data.pickup
    local destination = data.destination
    
    if not pickup or not destination then
        cb({success = false, message = 'Ubicaciones requeridas'})
        return
    end
    
    if not pickup.x or not pickup.y or not destination.x or not destination.y then
        cb({success = false, message = 'Coordenadas inválidas'})
        return
    end
    
    local distance = #(vector3(pickup.x, pickup.y, pickup.z or 0) - vector3(destination.x, destination.y, destination.z or 0))
    
    if distance > (Config.Uber and Config.Uber.maxDistance or 10000) then
        cb({success = false, message = 'Destino demasiado lejos'})
        return
    end
    
    local distanceKm = distance / 1000.0
    
    local priceConfig = Config.Uber.priceCalculation or {}
    local baseRate = priceConfig.baseRate or 3.0
    local distanceRate = priceConfig.distanceRate or Config.Uber.pricePerKm or 2.5
    local minimumFare = priceConfig.minimumFare or Config.Uber.minimumPrice or 8.0
    
    local basePrice = baseRate + (distanceKm * distanceRate)
    basePrice = math.max(basePrice, minimumFare)
    
    local currentHour = tonumber(os.date('%H'))
    local surgeMultiplier = 1.0
    if (currentHour >= 7 and currentHour <= 9) or (currentHour >= 17 and currentHour <= 19) then
        surgeMultiplier = 1.5
    end
    
    local estimatedTime = math.max(math.ceil((distance / 1000.0) * 2), 3)
    
    local vehicles = {
        {
            id = 'uberx',
            name = 'UberX',
            description = 'Cómodo y económico',
            price = math.ceil(basePrice * surgeMultiplier),
            capacity = 4,
            estimatedTime = estimatedTime,
            icon = '🚗'
        },
        {
            id = 'comfort',
            name = 'Comfort',
            description = 'Más espacio y comodidad',
            price = math.ceil(basePrice * 1.3 * surgeMultiplier),
            capacity = 4,
            estimatedTime = estimatedTime,
            icon = '🚙'
        },
        {
            id = 'xl',
            name = 'UberXL',
            description = 'Para grupos más grandes',
            price = math.ceil(basePrice * 1.8 * surgeMultiplier),
            capacity = 6,
            estimatedTime = estimatedTime + 2,
            icon = '🚐'
        }
    }
    
    cb({
        success = true,
        estimate = {
            distance = distance,
            distanceKm = math.floor(distanceKm * 10 + 0.5) / 10, 
            estimatedTime = estimatedTime,
            vehicles = vehicles,
            surgeActive = surgeMultiplier > 1.0,
            surgeMultiplier = surgeMultiplier,
            pickup = pickup,
            destination = destination
        }
    })
end)


RegisterCallback('bit-smartphone:uber:requestRide', function(source, cb, data)
    local xPlayer = GetPlayer(source)
    if not xPlayer then
        cb({success = false, error = 'Jugador no encontrado'})
        return
    end
    
    local pickup = data.pickup
    local destination = data.destination
    local vehicleType = data.vehicleType or 'uberx'
    local estimate = data.estimate
    
    if not pickup then
        cb({success = false, error = 'Ubicación de recogida requerida'})
        return
    end
    
    if not destination then
        cb({success = false, error = 'Destino requerido'})
        return
    end
    
    if not pickup.x or not pickup.y then
        cb({success = false, error = 'Coordenadas de recogida inválidas'})
        return
    end
    
    if not destination.coords or not destination.coords.x or not destination.coords.y then
        cb({success = false, error = 'Coordenadas de destino inválidas'})
        return
    end
    
    if not estimate or not estimate.price then
        cb({success = false, error = 'Estimación de precio requerida'})
        return
    end
    
    local playerMoney = GetPlayerMoney(xPlayer)
    if playerMoney < estimate.price then
        cb({success = false, error = 'Dinero insuficiente. Necesitas $' .. estimate.price})
        return
    end
    
    if activeTrips[source] then
        cb({success = false, error = 'Ya tienes un viaje activo'})
        return
    end
    
    local distance = #(vector3(pickup.x, pickup.y, pickup.z or 0) - vector3(destination.coords.x, destination.coords.y, destination.coords.z or 0))
    local distanceKm = distance / 1000.0
    
    local priceConfig = Config.Uber.priceCalculation or {}
    local baseRate = priceConfig.baseRate or 3.0
    local distanceRate = priceConfig.distanceRate or Config.Uber.pricePerKm or 2.5
    local minimumFare = priceConfig.minimumFare or Config.Uber.minimumPrice or 8.0
    local maximumFare = priceConfig.maximumFare or 500.0
    
    local realPrice = baseRate + (distanceKm * distanceRate)
    realPrice = math.max(realPrice, minimumFare)
    realPrice = math.min(realPrice, maximumFare)
    
    if Config.Uber.vehicleMultipliers and Config.Uber.vehicleMultipliers[vehicleType] then
        realPrice = realPrice * Config.Uber.vehicleMultipliers[vehicleType]
    end
    local playerMoney = GetPlayerMoney(xPlayer)
    if playerMoney < realPrice then
        cb({success = false, error = 'Dinero insuficiente. Necesitas $' .. math.ceil(realPrice)})
        return
    end
    
    local driverNames = {
        'Carlos', 'Miguel', 'José', 'Antonio', 'Francisco', 'Manuel', 'David', 'Juan',
        'Pedro', 'Alejandro', 'Roberto', 'Fernando', 'Eduardo', 'Daniel', 'Jorge',
        'María', 'Carmen', 'Ana', 'Isabel', 'Laura', 'Elena', 'Rosa', 'Patricia'
    }
    
    local driver = {
        name = driverNames[math.random(#driverNames)],
        rating = math.random(40, 50) / 10, 
        vehicle = {
            model = Config.Uber.vehicles[vehicleType] and Config.Uber.vehicles[vehicleType][math.random(#Config.Uber.vehicles[vehicleType])] or "asea",
            plate = 'UBER' .. math.random(100, 999),
            color = math.random(0, 159)
        },
        phone = '555-' .. math.random(1000, 9999),
        eta = math.random(3, 8) .. ' min'
    }
    
    
    activeTrips[source] = {
        id = source .. '-' .. os.time(),
        playerId = source,
        pickup = pickup,
        destination = destination,
        vehicleType = vehicleType,
        estimate = {
            price = realPrice,
            distance = distance,
            distanceKm = distanceKm,
            estimatedTime = math.max(math.ceil(distanceKm * 2), 3)
        },
        driver = driver,
        status = 'searching',
        createdAt = os.time(),
        paidAmount = 0
    }
    
    
    cb({
        success = true,
        trip = activeTrips[source]
    })
    
    
    Citizen.CreateThread(function()
        Citizen.Wait(math.random(3000, 8000))
        
        if activeTrips[source] and activeTrips[source].status == 'searching' then
            activeTrips[source].status = 'driver_assigned'
            
            TriggerClientEvent('bit-smartphone:uber:driverFound', source, {
                trip = activeTrips[source]
            })
            
            exports['bit-smartphone']:sendNotification(source, 'uber', 'Conductor encontrado: ' .. activeTrips[source].driver.name)
            
            
            Citizen.Wait(2000)
            
            if activeTrips[source] and activeTrips[source].status == 'driver_assigned' then
                activeTrips[source].status = 'driver_coming'
                
                TriggerClientEvent('bit-smartphone:uber:driverComing', source, {
                    trip = activeTrips[source]
                })
                
                exports['bit-smartphone']:sendNotification(source, 'uber', activeTrips[source].driver.name .. ' está en camino')
            end
        end
    end)
end)


RegisterCallback('bit-smartphone:uber:cancelRide', function(source, cb, data)
    if not activeTrips[source] then
        cb({success = false, error = 'No hay viaje activo'})
        return
    end
    
    local trip = activeTrips[source]
    local cancellationFee = 0
    
    
    if trip.status ~= 'searching' then
        cancellationFee = math.ceil(trip.estimate.price * 0.1) 
        local xPlayer = GetPlayer(source)
        if xPlayer then
            RemovePlayerMoney(xPlayer, cancellationFee)
        end
    end
    
    
    TriggerClientEvent('bit-smartphone:uber:tripCancelled', source, {
        reason = 'cancelled_by_user',
        fee = cancellationFee
    })

    if cancellationFee > 0 then
        exports['bit-smartphone']:sendNotification(source, 'uber', 'Viaje cancelado. Tarifa: $' .. cancellationFee)
    else
        exports['bit-smartphone']:sendNotification(source, 'uber', 'Viaje cancelado')
    end
    
    activeTrips[source] = nil
    
    cb({
        success = true,
        cancellationFee = cancellationFee
    })
end)


RegisterCallback('bit-smartphone:uber:completeRide', function(source, cb, data)
    if not activeTrips[source] then
        cb({success = false, error = 'No hay viaje activo'})
        return
    end
    
    local trip = activeTrips[source]
    local xPlayer = GetPlayer(source)
    
    if not xPlayer then
        cb({success = false, error = 'Jugador no encontrado'})
        return
    end
    
    local totalAmount = trip.estimate.price
    local tip = data.tip or 0
    
    if tip > 0 and Config.Uber.tips.enabled then
        tip = math.min(tip, Config.Uber.tips.maxTip)
        totalAmount = totalAmount + tip
    end
    
    
    local playerMoney = GetPlayerMoney(xPlayer)
    if playerMoney < totalAmount then
        cb({success = false, error = 'Dinero insuficiente para completar el viaje'})
        return
    end
    
    
    RemovePlayerMoney(xPlayer, totalAmount)
    
    
    trip.status = 'completed'
    trip.paidAmount = totalAmount
    trip.tip = tip
    trip.completedAt = os.time()
    
    
    TriggerClientEvent('bit-smartphone:uber:tripCompleted', source, {
        trip = trip,
        totalPaid = totalAmount
    })
    
    exports['bit-smartphone']:sendNotification(source, 'uber', 'Viaje completado. Total pagado: $' .. totalAmount)
    
    
    Citizen.SetTimeout(5000, function()
        activeTrips[source] = nil
    end)
    
    cb({
        success = true,
        totalPaid = totalAmount,
        tip = tip
    })
end)


RegisterCallback('bit-smartphone:uber:getTripStatus', function(source, cb)
    if activeTrips[source] then
        cb({
            success = true,
            trip = activeTrips[source]
        })
    else
        cb({
            success = false,
            error = 'No hay viaje activo'
        })
    end
end)


function GetPlayer(source)
    if Config.Framework == "esx" then
        return ESX.GetPlayerFromId(source)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        return QBCore.Functions.GetPlayer(source)
    end
    return nil
end


Citizen.CreateThread(function()
    while true do
        Citizen.Wait(600000) 
        
        local currentTime = os.time()
        for playerId, trip in pairs(activeTrips) do
            
            if (currentTime - trip.createdAt) > 1800 then
                TriggerClientEvent('bit-smartphone:uber:tripExpired', playerId)
                exports['bit-smartphone']:sendNotification(playerId, 'uber', 'El viaje ha expirado')
                activeTrips[playerId] = nil
            end
        end
    end
end)
