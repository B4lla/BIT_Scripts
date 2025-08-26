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
        else
            print("[bit-smartphone][uber] Warning: ESX.RegisterServerCallback not available for event: " .. tostring(eventName))
        end
    elseif Config and (Config.Framework == "qb" or Config.Framework == "qbox") then
        if QBCore and QBCore.Functions and QBCore.Functions.CreateCallback then
            QBCore.Functions.CreateCallback(eventName, callback)
        else
            print("[bit-smartphone][uber] Warning: QBCore.Functions.CreateCallback not available for event: " .. tostring(eventName))
        end
    end
end


RegisterCallback('bit-smartphone:uber:getEstimate', function(source, cb, data)
    local pickup = data.pickup
    local destination = data.destination
    local vehicleType = data.vehicleType or 'uberx'
    
    if not pickup or not destination then
        cb({success = false, error = 'Ubicaciones requeridas'})
        return
    end
    
    
    local distance = #(vector3(pickup.x, pickup.y, pickup.z) - vector3(destination.x, destination.y, destination.z))
    
    
    if distance > Config.Uber.maxDistance then
        cb({success = false, error = 'Destino demasiado lejos'})
        return
    end
    
    
    local distanceKm = distance / 1000.0
    local basePrice = math.max(distanceKm * Config.Uber.pricePerKm, Config.Uber.minimumPrice)
    
    
    local multiplier = Config.Uber.vehicleMultipliers[vehicleType] or 1.0
    
    
    local currentHour = os.date('%H:%M')
    local surgeMultiplier = 1.0
    
    for timeRange, surge in pairs(Config.Uber.surgeHours) do
        local startTime, endTime = timeRange:match('(%d%d:%d%d)-(%d%d:%d%d)')
        if currentHour >= startTime and currentHour <= endTime then
            surgeMultiplier = surge
            break
        end
    end
    
    local finalPrice = math.ceil(basePrice * multiplier * surgeMultiplier)
    local estimatedTime = math.ceil((distance / 1000.0) * 2) 
    
    cb({
        success = true,
        estimate = {
            price = finalPrice,
            distance = distance,
            distanceKm = math.ceil(distanceKm * 10) / 10, 
            estimatedTime = estimatedTime,
            vehicleType = vehicleType,
            surgeActive = surgeMultiplier > 1.0,
            surgeMultiplier = surgeMultiplier
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
    
    if not pickup or not destination or not estimate then
        cb({success = false, error = 'Datos incompletos'})
        return
    end
    
    
    local playerMoney = GetPlayerMoney(xPlayer)
    if playerMoney < estimate.price then
        cb({success = false, error = 'Dinero insuficiente'})
        return
    end
    
    
    if activeTrips[source] then
        cb({success = false, error = 'Ya tienes un viaje activo'})
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
            model = Config.Uber.vehicles[vehicleType][math.random(#Config.Uber.vehicles[vehicleType])],
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
        estimate = estimate,
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
            
            
            Citizen.Wait(2000)
            
            if activeTrips[source] and activeTrips[source].status == 'driver_assigned' then
                activeTrips[source].status = 'driver_coming'
                
                TriggerClientEvent('bit-smartphone:uber:driverComing', source, {
                    trip = activeTrips[source]
                })
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
                activeTrips[playerId] = nil
            end
        end
    end
end)
