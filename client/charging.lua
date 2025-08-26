local chargingStations = {}
local currentCharging = nil
local chargingCableEntity = nil
local chargingProps = {}
local isChargingPhone = false
local chargingProgress = 0


Citizen.CreateThread(function()
    if not Config.ChargingStations.enabled then return end
    
    Wait(2000)
    
    for k, station in pairs(Config.ChargingStations.stations) do
        if Config.ChargingStations.blipSettings.enabled then
            local blip = AddBlipForCoord(station.coords.x, station.coords.y, station.coords.z)
            SetBlipSprite(blip, Config.ChargingStations.blipSettings.sprite)
            SetBlipColour(blip, Config.ChargingStations.blipSettings.color)
            SetBlipScale(blip, Config.ChargingStations.blipSettings.scale)
            SetBlipAsShortRange(blip, true)
            BeginTextCommandSetBlipName("STRING")
            AddTextComponentString(Config.ChargingStations.blipSettings.name)
            EndTextCommandSetBlipName(blip)
            
            station.blip = blip
        end

        local propHash = GetHashKey(station.prop)
        RequestModel(propHash)
        while not HasModelLoaded(propHash) do
            Wait(1)
        end
        
        local prop = CreateObject(propHash, station.coords.x, station.coords.y, station.coords.z, false, false, false)
        SetEntityHeading(prop, station.heading)
        PlaceObjectOnGroundProperly(prop)
        FreezeEntityPosition(prop, true)
        
        chargingProps[station.id] = prop
        station.propEntity = prop

    end
end)


Citizen.CreateThread(function()
    if not Config.ChargingStations.enabled then return end
    
    while true do
        Wait(0)
        
        local playerPed = PlayerPedId()
        local playerCoords = GetEntityCoords(playerPed)
        local nearStation = nil
        local nearestDistance = nil

        for k, station in pairs(Config.ChargingStations.stations) do
            local distance = #(playerCoords - station.coords)
            
            if distance <= Config.ChargingStations.charging.interactionDistance then
                if not nearestDistance or distance < nearestDistance then
                    nearStation = station
                    nearestDistance = distance
                end
            end
        end

        if nearStation and not isChargingPhone then
            if Config.ChargingStations.interactionType == "drawtext" then
                local costText = nearStation.free and "Gratis" or "$" .. nearStation.cost
                DrawText3D(nearStation.coords.x, nearStation.coords.y, nearStation.coords.z + 1.2, 
                    "[~g~E~w~] " .. nearStation.label .. "\n~y~Costo: " .. costText)
                
                if IsControlJustPressed(0, 38) then -- E
                    StartCharging(nearStation)
                end
            end
        end
        
        if isChargingPhone and currentCharging then
            local chargingDistance = #(playerCoords - currentCharging.coords)
            
            if chargingDistance > Config.ChargingStations.charging.maxDistance then
                StopCharging("Te alejaste demasiado de la estación de carga")
            end
        end
        
        if not nearStation then
            Wait(500) 
        end
    end
end)


Citizen.CreateThread(function()
    while true do
        Wait(1000) 
        
        if isChargingPhone and currentCharging then
            local currentBattery = exports['bit-smartphone']:GetBatteryLevel() or 50
            local newBatteryLevel = math.min(100, currentBattery + Config.ChargingStations.charging.chargingRate)

            TriggerEvent('bit-smartphone:client:setBattery', newBatteryLevel)
            
            chargingProgress = chargingProgress + (100 / (Config.ChargingStations.charging.chargingTime / 1000))

            if newBatteryLevel >= 100 then
                StopCharging("¡Carga completa!")
            end

            SendNUIMessage({
                action = "updateBattery",
                battery = newBatteryLevel,
                charging = true
            })
        end
    end
end)

function StartCharging(station)
    if isChargingPhone then return end

    if not station.free then
        local hasEnough = false
        if Config.Framework == "esx" then
            hasEnough = ESX.GetPlayerData().money >= station.cost
        elseif Config.Framework == "qb" then
            hasEnough = QBCore.Functions.GetPlayerData().money.cash >= station.cost
        end
        
        if not hasEnough then
            Notifications(Noti.error, "No tienes suficiente dinero para cargar ($" .. station.cost .. ")", Noti.time)
            return
        end

        TriggerServerEvent('bit-smartphone:server:payCharging', station.cost)
    end
    
    isChargingPhone = true
    currentCharging = station
    chargingProgress = 0

    CreateChargingCable(station)

    local playerPed = PlayerPedId()
    RequestAnimDict("amb@prop_human_atm@male@idle_a")
    while not HasAnimDictLoaded("amb@prop_human_atm@male@idle_a") do
        Wait(1)
    end
    
    TaskPlayAnim(playerPed, "amb@prop_human_atm@male@idle_a", "idle_b", 8.0, -8.0, -1, 1, 0, false, false, false)
    
    Notifications(Noti.info, "Iniciando carga del teléfono...", Noti.time)

    PlaySoundFrontend(-1, "PHONE_GENERIC_KEY_TONE", "HUD_FRONTEND_DEFAULT_SOUNDSET", false)
end

function StopCharging(reason)
    if not isChargingPhone then return end
    
    isChargingPhone = false
    chargingProgress = 0

    local playerPed = PlayerPedId()
    ClearPedTasks(playerPed)

    if chargingCableEntity and DoesEntityExist(chargingCableEntity) then
        DeleteEntity(chargingCableEntity)
        chargingCableEntity = nil
    end
    
    if reason then
        Notifications(Noti.info, reason, Noti.time)
    end
    
    currentCharging = nil

    SendNUIMessage({
        action = "updateBattery",
        charging = false
    })

    PlaySoundFrontend(-1, "PHONE_GENERIC_KEY_TONE", "HUD_FRONTEND_DEFAULT_SOUNDSET", false)
end

function CreateChargingCable(station)
    if not Config.ChargingStations.cable.enabled then return end

    local cableHash = GetHashKey(Config.ChargingStations.cable.model)
    RequestModel(cableHash)
    while not HasModelLoaded(cableHash) do
        Wait(1)
    end
    
    local playerCoords = GetEntityCoords(PlayerPedId())
    chargingCableEntity = CreateObject(cableHash, 
        (station.coords.x + playerCoords.x) / 2,
        (station.coords.y + playerCoords.y) / 2,
        station.coords.z, false, false, false)
    
    if Config.ChargingStations.cable.physics then
        SetEntityDynamic(chargingCableEntity, true)
        SetEntityHasGravity(chargingCableEntity, false)
    end
end

function DrawText3D(x, y, z, text)
    local onScreen, _x, _y = World3dToScreen2d(x, y, z)
    local px, py, pz = table.unpack(GetGameplayCamCoords())
    
    SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(1)
    SetTextColour(255, 255, 255, 215)
    SetTextEntry("STRING")
    SetTextCentre(1)
    AddTextComponentString(text)
    DrawText(_x, _y)
    
    local factor = (string.len(text)) / 370
    DrawRect(_x, _y + 0.0125, 0.015 + factor, 0.03, 41, 11, 41, 68)
end

exports('IsPhoneCharging', function()
    return isChargingPhone
end)

exports('GetChargingProgress', function()
    return chargingProgress
end)

exports('StopCharging', function()
    StopCharging("Carga detenida")
end)

RegisterNetEvent('bit-smartphone:client:stopCharging')
AddEventHandler('bit-smartphone:client:stopCharging', function()
    StopCharging("Carga detenida por el servidor")
end)

RegisterNetEvent('bit-smartphone:client:addChargingStation')
AddEventHandler('bit-smartphone:client:addChargingStation', function(newStation)
    if Config.ChargingStations.blipSettings.enabled then
        local blip = AddBlipForCoord(newStation.coords.x, newStation.coords.y, newStation.coords.z)
        SetBlipSprite(blip, Config.ChargingStations.blipSettings.sprite)
        SetBlipColour(blip, Config.ChargingStations.blipSettings.color)
        SetBlipScale(blip, Config.ChargingStations.blipSettings.scale)
        SetBlipAsShortRange(blip, true)
        BeginTextCommandSetBlipName("STRING")
        AddTextComponentString(Config.ChargingStations.blipSettings.name)
        EndTextCommandSetBlipName(blip)
        
        newStation.blip = blip
    end
    
    local propHash = GetHashKey(newStation.prop)
    RequestModel(propHash)
    while not HasModelLoaded(propHash) do
        Wait(1)
    end
    
    local prop = CreateObject(propHash, newStation.coords.x, newStation.coords.y, newStation.coords.z, false, false, false)
    SetEntityHeading(prop, newStation.heading)
    PlaceObjectOnGroundProperly(prop)
    FreezeEntityPosition(prop, true)
    
    chargingProps[newStation.id] = prop
    newStation.propEntity = prop

    table.insert(Config.ChargingStations.stations, newStation)

end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end

    for k, prop in pairs(chargingProps) do
        if DoesEntityExist(prop) then
            DeleteEntity(prop)
        end
    end

    if chargingCableEntity and DoesEntityExist(chargingCableEntity) then
        DeleteEntity(chargingCableEntity)
    end
end)
