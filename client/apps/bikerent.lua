


RegisterNUICallback('bikerent:getVehicles', function(data, cb)
    
    
    cb(true)
end)


RegisterNUICallback('bikerent:rentVehicle', function(data, cb)
    local vehicleId = data.vehicleId
    local duration = data.duration
    local playerId = PlayerId()
    
    
    TriggerServerEvent('bikerent:processRental', vehicleId, duration)
    
    cb(true)
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
AddEventHandler('bikerent:spawnVehicle', function(vehicleModel, spawnCoords)
    local playerPed = PlayerPedId()
    local coords = spawnCoords or GetEntityCoords(playerPed)
    
    
    RequestModel(vehicleModel)
    while not HasModelLoaded(vehicleModel) do
        Wait(100)
    end
    
    
    local vehicle = CreateVehicle(vehicleModel, coords.x + 2.0, coords.y + 2.0, coords.z, GetEntityHeading(playerPed), true, false)
    
    
    SetPedIntoVehicle(playerPed, vehicle, -1)
    SetEntityAsNoLongerNeeded(vehicle)
    SetModelAsNoLongerNeeded(vehicleModel)
    
    
    SendNUIMessage({
        type = "notification",
        data = {
            type = "success",
            title = "¡Vehículo entregado!",
            message = "Tu vehículo está listo para usar"
        }
    })
end)


RegisterNetEvent('bikerent:notification')
AddEventHandler('bikerent:notification', function(notificationData)
    SendNUIMessage({
        type = "notification",
        data = notificationData
    })
end)
