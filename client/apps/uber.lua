local currentTrip = nil
local driverVehicle = nil
local driverPed = nil
local isInTrip = false
local tripBlip = nil
local routeBlip = nil


RegisterNetEvent('bit-smartphone:uber:driverFound')
AddEventHandler('bit-smartphone:uber:driverFound', function(data)
    currentTrip = data.trip
    
    
    SendNUIMessage({
        action = 'uber:driverFound',
        data = data
    })
    
    
    Notifications(Noti.success, 'Conductor encontrado: ' .. currentTrip.driver.name, 4000)
end)


RegisterNetEvent('bit-smartphone:uber:driverComing')
AddEventHandler('bit-smartphone:uber:driverComing', function(data)
    currentTrip = data.trip
    
    
    SpawnUberDriver()
    
    
    SendNUIMessage({
        action = 'uber:driverComing',
        data = data
    })
    
    Notifications(Noti.info, currentTrip.driver.name .. ' está en camino', 3000)
end)


RegisterNetEvent('bit-smartphone:uber:tripCancelled')
AddEventHandler('bit-smartphone:uber:tripCancelled', function(data)
    
    CleanupUberDriver()
    
    
    currentTrip = nil
    isInTrip = false
    
    
    SendNUIMessage({
        action = 'uber:tripCancelled',
        data = data
    })
    
    if data.fee and data.fee > 0 then
        Notifications(Noti.warning, 'Viaje cancelado. Tarifa: $' .. data.fee, 4000)
    else
        Notifications(Noti.info, 'Viaje cancelado', 3000)
    end
end)


RegisterNetEvent('bit-smartphone:uber:tripCompleted')
AddEventHandler('bit-smartphone:uber:tripCompleted', function(data)
    
    CleanupUberDriver()
    
    
    SendNUIMessage({
        action = 'uber:tripCompleted',
        data = data
    })
    
    Notifications(Noti.success, 'Viaje completado. Total pagado: $' .. data.totalPaid, 5000)
    
    
    Citizen.SetTimeout(5000, function()
        currentTrip = nil
        isInTrip = false
    end)
end)


RegisterNetEvent('bit-smartphone:uber:tripExpired')
AddEventHandler('bit-smartphone:uber:tripExpired', function()
    CleanupUberDriver()
    currentTrip = nil
    isInTrip = false
    
    SendNUIMessage({
        action = 'uber:tripExpired'
    })
    
    Notifications(Noti.error, 'El viaje ha expirado', 3000)
end)


function SpawnUberDriver()
    if driverVehicle or driverPed then
        CleanupUberDriver()
    end
    
    local playerPed = PlayerPedId()
    local playerCoords = GetEntityCoords(playerPed)
    
    
    local spawnCoords = GetValidSpawnPosition(playerCoords)
    if not spawnCoords then
        Notifications(Noti.error, 'No se pudo encontrar una ubicación válida para el conductor', 4000)
        return
    end
    
    
    local vehicleModel = GetHashKey(currentTrip.driver.vehicle.model)
    RequestModel(vehicleModel)
    
    while not HasModelLoaded(vehicleModel) do
        Citizen.Wait(100)
    end
    
    
    driverVehicle = CreateVehicle(vehicleModel, spawnCoords.x, spawnCoords.y, spawnCoords.z, spawnCoords.w, true, false)
    
    
    SetVehicleNumberPlateText(driverVehicle, currentTrip.driver.vehicle.plate)
    SetVehicleColours(driverVehicle, currentTrip.driver.vehicle.color, currentTrip.driver.vehicle.color)
    SetVehicleEngineOn(driverVehicle, true, true, false)
    SetVehicleOnGroundProperly(driverVehicle)
    
    
    local driverModel = GetHashKey('a_m_m_business_01')
    RequestModel(driverModel)
    
    while not HasModelLoaded(driverModel) do
        Citizen.Wait(100)
    end
    
    driverPed = CreatePedInsideVehicle(driverVehicle, 4, driverModel, -1, true, false)
    
    
    SetEntityAsMissionEntity(driverPed, true, true)
    SetEntityAsMissionEntity(driverVehicle, true, true)
    SetBlockingOfNonTemporaryEvents(driverPed, true)
    SetPedKeepTask(driverPed, true)
    
    
    tripBlip = AddBlipForEntity(driverVehicle)
    SetBlipSprite(tripBlip, 198) 
    SetBlipColour(tripBlip, 5) 
    SetBlipDisplay(tripBlip, 2)
    SetBlipAsShortRange(tripBlip, false)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentString("Tu Uber - " .. currentTrip.driver.name)
    EndTextCommandSetBlipName(tripBlip)
    
    
    DriveToPlayer()
end


function DriveToPlayer()
    if not driverPed or not driverVehicle then return end
    
    local playerPed = PlayerPedId()
    local playerCoords = GetEntityCoords(playerPed)
    
    
    local roadCoords = GetClosestRoad(playerCoords)
    
    
    TaskVehicleDriveToCoord(
        driverPed,
        driverVehicle,
        roadCoords.x, roadCoords.y, roadCoords.z,
        Config.Uber.driver.speed,
        0,
        GetEntityModel(driverVehicle),
        Config.Uber.driver.drivingStyle,
        2.0,
        true
    )
    
    
    Citizen.CreateThread(function()
        while driverPed and DoesEntityExist(driverPed) and not isInTrip do
            Citizen.Wait(1000)
            
            local driverCoords = GetEntityCoords(driverVehicle)
            local playerCoords = GetEntityCoords(PlayerPedId())
            local distance = #(driverCoords - playerCoords)
            
            
            if distance < 50.0 and not isInTrip then
                isInTrip = true
                
                
                if tripBlip then
                    RemoveBlip(tripBlip)
                end
                
                tripBlip = AddBlipForEntity(driverVehicle)
                SetBlipSprite(tripBlip, 198)
                SetBlipColour(tripBlip, 2) 
                BeginTextCommandSetBlipName("STRING")
                AddTextComponentString("Tu Uber ha llegado")
                EndTextCommandSetBlipName(tripBlip)
                
                Notifications(Noti.success, currentTrip.driver.name .. ' ha llegado', 4000)
                
                
                SendNUIMessage({
                    action = 'uber:driverArrived',
                    data = {trip = currentTrip}
                })
                
                
                WaitForPlayer()
                break
            end
        end
    end)
end


function WaitForPlayer()
    local waitStartTime = GetGameTimer()
    local hasPlayerEntered = false
    
    Citizen.CreateThread(function()
        while driverVehicle and DoesEntityExist(driverVehicle) and not hasPlayerEntered do
            Citizen.Wait(1000)
            
            local playerPed = PlayerPedId()
            local playerVehicle = GetVehiclePedIsIn(playerPed, false)
            
            
            if playerVehicle == driverVehicle then
                hasPlayerEntered = true
                StartTrip()
                break
            end
            
            
            if (GetGameTimer() - waitStartTime) > Config.Uber.driver.waitTime then
                Notifications(Noti.warning, 'El conductor se ha ido. Tiempo de espera agotado.', 4000)
                
                SendNUIMessage({
                    action = 'uber:driverLeft',
                    data = {reason = 'timeout'}
                })
                
                CleanupUberDriver()
                currentTrip = nil
                isInTrip = false
                break
            end
        end
    end)
end


function StartTrip()
    if not currentTrip or not driverVehicle then return end
    
    Notifications(Noti.info, 'Viaje iniciado hacia tu destino', 3000)
    
    SendNUIMessage({
        action = 'uber:tripStarted',
        data = {trip = currentTrip}
    })
    
    
    local destination = currentTrip.destination
    local destCoords = GetClosestRoad(vector3(destination.x, destination.y, destination.z))
    
    
    if tripBlip then
        RemoveBlip(tripBlip)
    end
    
    routeBlip = AddBlipForCoord(destCoords.x, destCoords.y, destCoords.z)
    SetBlipSprite(routeBlip, 8) 
    SetBlipColour(routeBlip, 3) 
    SetBlipRoute(routeBlip, true)
    SetBlipRouteColour(routeBlip, 3)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentString("Destino Uber")
    EndTextCommandSetBlipName(routeBlip)
    
    
    TaskVehicleDriveToCoord(
        driverPed,
        driverVehicle,
        destCoords.x, destCoords.y, destCoords.z,
        Config.Uber.driver.speed,
        0,
        GetEntityModel(driverVehicle),
        Config.Uber.driver.drivingStyle,
        2.0,
        true
    )
    
    
    Citizen.CreateThread(function()
        while driverVehicle and DoesEntityExist(driverVehicle) and currentTrip do
            Citizen.Wait(2000)
            
            local driverCoords = GetEntityCoords(driverVehicle)
            local distance = #(driverCoords - destCoords)
            
            
            if distance < 25.0 then
                Notifications(Noti.success, 'Has llegado a tu destino', 4000)
                
                SendNUIMessage({
                    action = 'uber:arrivedAtDestination',
                    data = {trip = currentTrip}
                })
                
                
                Citizen.Wait(5000)
                
                
                TriggerServerCallback('bit-smartphone:uber:completeRide', function(result)
                    if result.success then
                        
                    else
                        Notifications(Noti.error, result.error or 'Error al completar el viaje', 4000)
                    end
                end, {tip = 0})
                
                break
            end
        end
    end)
end


function CleanupUberDriver()
    if driverPed and DoesEntityExist(driverPed) then
        DeleteEntity(driverPed)
        driverPed = nil
    end
    
    if driverVehicle and DoesEntityExist(driverVehicle) then
        DeleteEntity(driverVehicle)
        driverVehicle = nil
    end
    
    if tripBlip then
        RemoveBlip(tripBlip)
        tripBlip = nil
    end
    
    if routeBlip then
        RemoveBlip(routeBlip)
        routeBlip = nil
    end
end


function GetValidSpawnPosition(playerCoords)
    local attempts = 0
    local maxAttempts = 10
    
    while attempts < maxAttempts do
        attempts = attempts + 1
        
        
        local angle = math.random() * 2 * math.pi
        local distance = math.random(Config.Uber.driver.spawnDistance.min, Config.Uber.driver.spawnDistance.max)
        
        local x = playerCoords.x + math.cos(angle) * distance
        local y = playerCoords.y + math.sin(angle) * distance
        local z = playerCoords.z
        
        
        local roadFound, roadCoords, heading = GetClosestVehicleNode(x, y, z, 0, 3.0, 0)
        
        if roadFound then
            return vector4(roadCoords.x, roadCoords.y, roadCoords.z, heading)
        end
    end
    
    return nil
end


function GetClosestRoad(coords)
    local roadFound, roadCoords = GetClosestVehicleNode(coords.x, coords.y, coords.z, 0, 3.0, 0)
    
    if roadFound then
        return roadCoords
    else
        return coords 
    end
end


RegisterNUICallback('bit-smartphone:uber:getEstimate', function(data, cb)
    TriggerServerCallback('bit-smartphone:uber:getEstimate', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('bit-smartphone:uber:requestRide', function(data, cb)
    TriggerServerCallback('bit-smartphone:uber:requestRide', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('bit-smartphone:uber:cancelRide', function(data, cb)
    TriggerServerCallback('bit-smartphone:uber:cancelRide', function(result)
        cb(result)
        if result.success then
            CleanupUberDriver()
            currentTrip = nil
            isInTrip = false
        end
    end, data)
end)

RegisterNUICallback('bit-smartphone:uber:completeRide', function(data, cb)
    TriggerServerCallback('bit-smartphone:uber:completeRide', function(result)
        cb(result)
    end, data)
end)

RegisterNUICallback('bit-smartphone:uber:getTripStatus', function(data, cb)
    if currentTrip then
        cb({
            success = true,
            trip = currentTrip,
            isInTrip = isInTrip
        })
    else
        cb({success = false})
    end
end)


function TriggerServerCallback(eventName, callback, ...)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback(eventName, callback, ...)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback(eventName, callback, ...)
    end
end


AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        CleanupUberDriver()
    end
end)
