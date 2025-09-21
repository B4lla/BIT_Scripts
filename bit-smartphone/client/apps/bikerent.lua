local function GetClosestVehicleNodeSmart(coords)
    if not coords then
        return nil
    end

    local tryFlags = {16, 8, 4, 1, 0}
    for _, flags in ipairs(tryFlags) do
        local found, outPos = GetClosestVehicleNode(coords.x, coords.y, coords.z, flags, 3.0, 0)
        if found and outPos then
            if type(outPos) == 'vector3' then
                return outPos
            else
                return vector3(outPos.x or outPos[1], outPos.y or outPos[2], outPos.z or outPos[3])
            end
        end
    end

    return nil
end

local function GetHeadingFromVector_2d(x, y)
    local angleRad = math.atan2(y, x)
    local angleDeg = angleRad * (180.0 / math.pi)
    return angleDeg
end

RegisterNUICallback('bikerent:getVehicles', function(data, cb)
    if Config and Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:getBikeRentVehicles', function(vehicles)
            SendNUIMessage({ action = 'bikerent:vehicles', data = { vehicles = vehicles or {} } })
            cb({ ok = true, vehicles = vehicles or {} })
        end)
    elseif Config and (Config.Framework == 'qb' or Config.Framework == 'qbox') then
        QBCore.Functions.TriggerCallback('bit-smartphone:getBikeRentVehicles', function(vehicles)
            SendNUIMessage({ action = 'bikerent:vehicles', data = { vehicles = vehicles or {} } })
            cb({ ok = true, vehicles = vehicles or {} })
        end)
    else
        local vehicles = Config and Config.BikeRent and Config.BikeRent.vehicles or {}
        SendNUIMessage({ action = 'bikerent:vehicles', data = { vehicles = vehicles } })
        cb({ ok = true, vehicles = vehicles })
    end
end)


RegisterNUICallback('bikerent:rentVehicle', function(data, cb)
    local vehicleId = data.vehicleId
    local duration = data.duration
    
    TriggerServerEvent('bit-smartphone:bikerent:processRental', vehicleId, duration)
    cb({ success = true })
end)


RegisterNUICallback('bikerent:endRental', function(data, cb)
    local rentalId = data.rentalId
    
    TriggerServerEvent('bikerent:endRental', rentalId)
    
    cb(true)
end)


RegisterNUICallback('bikerent:getLocation', function(data, cb)
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local streetHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local streetName = GetStreetNameFromHashKey(streetHash)
    
    cb({
        coords = coords,
        streetName = streetName or "Ubicación desconocida"
    })
end)


RegisterNetEvent('bikerent:spawnVehicle')
AddEventHandler('bikerent:spawnVehicle', function(vehicleData)
    SpawnBikeRentVehicleServer(vehicleData)
end)


RecentBikeSpawns = RecentBikeSpawns or {}

local function FindRoadSideSpawnPoint(playerCoords, maxDistance)
    local found = false
    local spawnCoords = nil
    local attempts = 0
    maxDistance = maxDistance or 50.0
    
    while not found and attempts < 20 do
        local angle = math.random() * 2 * math.pi
        local distance = math.random(15, maxDistance)
        
        local testX = playerCoords.x + math.cos(angle) * distance
        local testY = playerCoords.y + math.sin(angle) * distance
        local testZ = playerCoords.z
        
    local testCoords = vector3(testX, testY, testZ)
    local roadCoords = GetClosestVehicleNodeSmart(testCoords)
        local roadFound = roadCoords ~= nil
        
        if roadFound and roadCoords then
            local groundFound, groundZ = GetGroundZFor_3dCoord(roadCoords.x, roadCoords.y, roadCoords.z + 5.0, false)
            local finalZ = groundFound and groundZ or roadCoords.z
            
            local heading = GetHeadingFromVector_2d(roadCoords.x - testX, roadCoords.y - testY)
            local offsetDistance = 3.0
            local offsetX = roadCoords.x + math.cos(math.rad(heading + 90)) * offsetDistance
            local offsetY = roadCoords.y + math.sin(math.rad(heading + 90)) * offsetDistance
            
            local nearbyVehicle = GetClosestVehicle(offsetX, offsetY, finalZ, 5.0, 0, 71)
            if nearbyVehicle == 0 then
                spawnCoords = vector3(offsetX, offsetY, finalZ)
                found = true
            end
        end
        
        attempts = attempts + 1
    end
    
    if not found then
        local groundFound, groundZ = GetGroundZFor_3dCoord(playerCoords.x + 10.0, playerCoords.y + 10.0, playerCoords.z + 5.0, false)
        spawnCoords = vector3(playerCoords.x + 10.0, playerCoords.y + 10.0, groundFound and groundZ or playerCoords.z)
    end
    
    return spawnCoords
end

function SpawnBikeRentVehicleLocal(vehicleData)
    
end

local ActiveRentals = {}

function SpawnBikeRentVehicleServer(vehicleData)
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    
    local spawnCoords = FindRoadSideSpawnPoint(coords, 50.0)
    if not spawnCoords then
        SendNUIMessage({ action = 'notification', data = { type = 'error', title = 'Error', message = 'No se encontró una ubicación adecuada' } })
        return
    end

    local vehicleModel = vehicleData.model or vehicleData

    RequestModel(vehicleModel)
    local timeout = 0
    while not HasModelLoaded(vehicleModel) and timeout < 5000 do
        Wait(100)
        timeout = timeout + 100
    end

    if not HasModelLoaded(vehicleModel) then
        SendNUIMessage({ action = 'notification', data = { type = 'error', title = 'Error', message = 'No se pudo cargar el vehículo' } })
        return
    end

    local heading = GetHeadingFromVector_2d(spawnCoords.x - coords.x, spawnCoords.y - coords.y)
    local vehicle = CreateVehicle(vehicleModel, spawnCoords.x, spawnCoords.y, spawnCoords.z, heading, true, false)

    if DoesEntityExist(vehicle) then
        SetVehicleEngineOn(vehicle, true, true, false)
        SetVehicleDirtLevel(vehicle, 0.0)
        SetVehicleHasBeenOwnedByPlayer(vehicle, true)
        SetVehicleOnGroundProperly(vehicle)

        local plate = GetVehicleNumberPlateText(vehicle)
        if giveVehicleKeys then
            giveVehicleKeys(vehicle, plate)
        end

        local blip = AddBlipForEntity(vehicle)
        SetBlipSprite(blip, 225)
        SetBlipColour(blip, 2)
        SetBlipScale(blip, 0.8)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentString('Vehículo Alquilado')
        EndTextCommandSetBlipName(blip)

        SetNewWaypoint(spawnCoords.x, spawnCoords.y)
        SetModelAsNoLongerNeeded(vehicleModel)
        
        local rentalId = vehicleData.rentalId or GetGameTimer()
        ActiveRentals[rentalId] = {
            vehicle = vehicle,
            blip = blip,
            spawnTime = GetGameTimer(),
            duration = vehicleData.duration or 3600000
        }

        SendNUIMessage({ action = 'notification', data = { type = 'success', title = '¡Vehículo entregado!', message = 'Tu vehículo está esperándote en el borde de la carretera.' } })
    else
        SendNUIMessage({ action = 'notification', data = { type = 'error', title = 'Error', message = 'No se pudo crear el vehículo' } })
    end
end


RegisterNetEvent('bikerent:notification')
AddEventHandler('bikerent:notification', function(notificationData)
    SendNUIMessage({
        type = "notification",
        data = notificationData
    })
end)

RegisterNetEvent('bikerent:endRentalClient')
AddEventHandler('bikerent:endRentalClient', function(rentalId)
    if ActiveRentals[rentalId] then
        local rental = ActiveRentals[rentalId]
        
        if DoesEntityExist(rental.vehicle) then
            DeleteEntity(rental.vehicle)
        end
        
        if DoesBlipExist(rental.blip) then
            RemoveBlip(rental.blip)
        end
        
        ActiveRentals[rentalId] = nil
        
        SendNUIMessage({ 
            action = 'notification', 
            data = { 
                type = 'info', 
                title = 'Alquiler finalizado', 
                message = 'El vehículo ha sido devuelto automáticamente.' 
            } 
        })
    end
end)

CreateThread(function()
    while true do
        Wait(30000)
        local currentTime = GetGameTimer()
        
        for rentalId, rental in pairs(ActiveRentals) do
            if rental and rental.spawnTime then
                local timeElapsed = currentTime - rental.spawnTime
                
                if timeElapsed >= rental.duration then
                    if DoesEntityExist(rental.vehicle) then
                        DeleteEntity(rental.vehicle)
                    end
                    
                    if DoesBlipExist(rental.blip) then
                        RemoveBlip(rental.blip)
                    end
                    
                    ActiveRentals[rentalId] = nil
                    
                    SendNUIMessage({ 
                        action = 'notification', 
                        data = { 
                            type = 'info', 
                            title = 'Time Expired', 
                            message = 'Time has expired for your rental vehicle and it has been returned.' 
                        } 
                    })
                end
            end
        end
    end
end)
