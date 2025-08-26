local phoneOpen = false
local phoneProp = 0
local canUsePhone = true
local flashlightActive = false
local flashlightRange = 15.0
local flashlightBrightness = 2.0
local flashlightAngle = 45.0
local isConnected = true
local signalStrength = 4
local pendingCommunications = { outgoing = {}, incoming = {} }

local originalTriggerServerEvent = TriggerServerEvent

local function interceptCommunication(type, event, data, callback)
    if not isConnected or signalStrength == 0 then
        local communicationId = #pendingCommunications.outgoing + 1
        pendingCommunications.outgoing[communicationId] = {
            type = type,
            event = event,
            data = data,
            callback = callback,
            timestamp = GetGameTimer(),
            retries = 0
        }
        Notifications(Noti.warning, 'Mensaje retenido - Sin conexión', 3000)
        if callback then
            callback({success = false, reason = 'no_signal'})
        end
    end

    if type == 'server_event' then
        originalTriggerServerEvent(event, table.unpack(data))
    elseif type == 'server_callback' then
        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(event, callback, table.unpack(data))
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(event, callback, table.unpack(data))
        end
    end

    return true
end

local function processPendingCommunications()
    if not isConnected or signalStrength == 0 then return end

    for id, comm in pairs(pendingCommunications.outgoing) do
        if comm.retries < 3 then
            comm.retries = comm.retries + 1
            if comm.type == 'server_event' then
                originalTriggerServerEvent(comm.event, table.unpack(comm.data))
                Notifications(Noti.success, 'Mensaje enviado', 2000)
            elseif comm.type == 'server_callback' then
                if Config.Framework == "esx" then
                    ESX.TriggerServerCallback(comm.event, comm.callback, table.unpack(comm.data))
                elseif Config.Framework == "qb" or Config.Framework == "qbox" then
                    QBCore.Functions.TriggerCallback(comm.event, comm.callback, table.unpack(comm.data))
                end
                Notifications(Noti.success, 'Datos sincronizados', 2000)
            end
            pendingCommunications.outgoing[id] = nil
        else
            Notifications(Noti.error, 'Error enviando mensaje', 3000)
            pendingCommunications.outgoing[id] = nil
        end
    end

    for id, comm in pairs(pendingCommunications.incoming) do
        if comm.type == 'nui_message' then
            SendNUIMessage(comm.data)
        elseif comm.type == 'notification' then
            Notifications(comm.data.type, comm.data.message, comm.data.time)
        end
        pendingCommunications.incoming[id] = nil
    end
end

TriggerServerEvent = function(event, ...)
    local phoneEvents = {
        'bit-smartphone:', 'call:', 'message:', 'bitlove:', 'instagram:',
        'news:', 'mail:', 'tuister:', 'darkweb:', 'crypto:'
    }
    local isPhoneEvent = false
    for _, prefix in ipairs(phoneEvents) do
        if string.find(event, prefix) then
            isPhoneEvent = true
            break
        end
    end
    if isPhoneEvent then
        local data = {...}
        if not interceptCommunication('server_event', event, data, nil) then
            return
        end
    end
    originalTriggerServerEvent(event, ...)
end

local function phoneAnimation()
    local playerPed = PlayerPedId()
    phoneProp = CreateObject(GetHashKey("prop_amb_phone"), 0, 0, 0, true, true, true)
    AttachEntityToEntity(phoneProp, playerPed, GetPedBoneIndex(playerPed, 28422), 0.12, 0.02, 0.01, 0.0, 0.0, 0.0, true, true, false, true, 1, true)
    SetCurrentPedWeapon(playerPed, GetHashKey("WEAPON_UNARMED"), true)
    TaskPlayAnim(playerPed, "cellphone@", "cellphone_text_in", 8.0, -8.0, -1, 50, 0, false, false, false)
end

local function openPhone()
    if not canUsePhone then Notifications(Noti.error, 'Phone disabled', Noti.time) return end
    phoneOpen = true
    phoneAnimation()
    SetNuiFocus(true, true)

    CreateThread(function()
        while phoneOpen do
            InvalidateIdleCam()
            Wait(1000)
        end
    end)

    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:loadData', function(data)
            data = data or {}
            ESX.TriggerServerCallback('bit-smartphone:photos:loadPhotos', function(photos)
                data.photos = photos or {}
                SendNUIMessage({ type = "openPhone", data = data })
            end)
        end)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:loadData', function(data)
            data = data or {}
            QBCore.Functions.TriggerCallback('bit-smartphone:photos:loadPhotos', function(photos)
                data.photos = photos or {}
                SendNUIMessage({ action = "openPhone", data = data })
            end)
        end)
    end
end

if Config.openCommand ~= "" then
    RegisterCommand(Config.openCommand, function()
        if Config.item.itemRequired then
            if Config.Framework == "esx" then
                ESX.TriggerServerCallback('bit-smartphone:checkItem', function(hasItem)
                    if hasItem then openPhone() else Notifications(Noti.error, Lang.noPhoneItem, Noti.time) end
                end, Config.item.itemName, 1)
            elseif Config.Framework == "qb" or Config.Framework == "qbox" then
                QBCore.Functions.TriggerCallback('bit-smartphone:checkItem', function(hasItem)
                    if hasItem then openPhone() else Notifications(Noti.error, Lang.noPhoneItem, Noti.time) end
                end, Config.item.itemName, 1)
            end
        else
            openPhone()
        end
    end, false)
end

local function togglePhoneFlashlight(state, range, brightness, angle)
    if not Config.Flashlight.enabled then return end
    flashlightActive = state
    flashlightRange = range or Config.Flashlight.maxRange
    flashlightBrightness = brightness or Config.Flashlight.brightness
    flashlightAngle = angle or Config.Flashlight.angle
    if flashlightActive then
        CreateThread(function()
            while flashlightActive do
                local playerPed = PlayerPedId()
                local coords = GetEntityCoords(playerPed)
                local heading = GetEntityHeading(playerPed)
                local forward = GetEntityForwardVector(playerPed)
                local cam = GetRenderingCam()
                local camRot = GetCamRot(cam, 2)
                local camCoords = GetCamCoord(cam)
                local pitch = math.rad(camRot.x)
                local yaw = math.rad(camRot.z)
                local dirX = -math.sin(yaw) * math.cos(pitch)
                local dirY = math.cos(yaw) * math.cos(pitch)
                local dirZ = math.sin(pitch)
                local lightPos = coords + forward * 0.5
                lightPos = vector3(lightPos.x, lightPos.y, lightPos.z + 0.1)
                local targetPos = lightPos + vector3(dirX * flashlightRange, dirY * flashlightRange, dirZ * flashlightRange)
                DrawSpotLight(lightPos.x, lightPos.y, lightPos.z, dirX, dirY, dirZ, 255, 255, 255, flashlightRange, flashlightBrightness, 0.0, flashlightAngle, 10.0)
                DrawLightWithRange(lightPos.x, lightPos.y, lightPos.z, 255, 255, 255, flashlightRange * 0.3, flashlightBrightness * 0.3)
                Wait(0)
            end
        end)
    end
end

RegisterNUICallback('bit-smartphone:toggleFlashlight', function(data, cb)
    togglePhoneFlashlight(data.state, data.range, data.brightness, data.angle)
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:contacts:saveContact', function(data, cb)
    if data.name and data.number then
        TriggerServerEvent('bit-smartphone:contacts:addContact', data)
    end
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:contacts:getContacts', function(data, cb)
    TriggerServerEvent('bit-smartphone:contacts:getContacts')
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:garage:loadVehicles', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:garage:loadVehicles', function(vehicles)
            cb({ ok = true, vehicles = vehicles or {} })
        end)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:garage:loadVehicles', function(vehicles)
            cb({ ok = true, vehicles = vehicles or {} })
        end)
    else
        cb({ ok = false, vehicles = {} })
    end
end)

RegisterNUICallback('bit-smartphone:loadLocations', function(data, cb)
    cb({ ok = true, locations = {} })
end)

RegisterNetEvent('phone:sendNUIMessage')
AddEventHandler('phone:sendNUIMessage', function(msg)
    SendNUIMessage(msg)
end)

RegisterNetEvent('bit-smartphone:client:sendNuiMessage')
AddEventHandler('bit-smartphone:client:sendNuiMessage', function(msg)
    SendNUIMessage(msg)
end)

RegisterNetEvent('phone:bitloveResponse')
AddEventHandler('phone:bitloveResponse', function(data)
    SendNUIMessage({
        type = 'message',
        action = data.action,
        data = data
    })
end)

if Config.PhoneKey.enabled then
    RegisterKeyMapping(Config.PhoneKey.Command, Config.PhoneKey.description, "keyboard", Config.PhoneKey.key)
end

RegisterNUICallback('bit-smartphone:closePhone', function(data, cb)
    phoneOpen = false
    SetNuiFocus(false, false)
    TriggerServerEvent('bit-smartphone:saveData', data)
    local playerPed = PlayerPedId()
    if phoneProp ~= 0 and DoesEntityExist(phoneProp) then
        TaskPlayAnim(playerPed, "cellphone@", "cellphone_text_out", 8.0, -8.0, -1, 50, 0, false, false, false)
        Wait(500)
    end
    Wait(500)
    ClearPedTasks(playerPed)
    if phoneProp ~= 0 and DoesEntityExist(phoneProp) then
        DeleteObject(phoneProp)
        phoneProp = 0
    end
    if cb then cb('ok') end
end)

RegisterNUICallback('bit-smartphone:saveData', function(data, cb)
    TriggerServerEvent('bit-smartphone:saveData', data)
    if cb then cb('ok') end
end)

RegisterNUICallback('getNearbyPlayers', function(data, cb)
    TriggerServerEvent('bit-smartphone:getNearbyPlayers')
    if cb then cb('ok') end
end)

RegisterNUICallback('sendAirDrop', function(data, cb)
    TriggerServerEvent('bit-smartphone:sendAirDrop', data)
    if cb then cb('ok') end
end)


if not SaveContactResultHandlerRegistered then
    SaveContactResultHandlerRegistered = true
    RegisterNetEvent('bit-smartphone:phone:saveContactResult')
    AddEventHandler('bit-smartphone:phone:saveContactResult', function(result)
        if not result or not result.requestId then return end
        PendingContactRequests = PendingContactRequests or {}
        local cbfn = PendingContactRequests[result.requestId]
        if cbfn then
            PendingContactRequests[result.requestId] = nil
            cbfn({ success = result.success, message = result.message })
        end
    end)
end



local currentBatteryLevel = 85
local networkType = "5G"

local lowSignalZones = {
    {coords = vector3(136.0, -761.0, 242.0), radius = 100.0, strength = 1},
    {coords = vector3(-2203.0, 4244.0, 47.0), radius = 150.0, strength = 1},
    {coords = vector3(-1087.0, -2187.0, 13.0), radius = 200.0, strength = 0},
    {coords = vector3(715.0, 4165.0, 40.0), radius = 100.0, strength = 2},
    {coords = vector3(1728.0, 3308.0, 41.0), radius = 80.0, strength = 1},
    {coords = vector3(-75.0, -827.0, 243.0), radius = 50.0, strength = 2},
    {coords = vector3(-1375.0, -499.0, 33.0), radius = 40.0, strength = 1},
    {coords = vector3(-1350.0, 4394.0, 182.0), radius = 120.0, strength = 1},
    {coords = vector3(2868.0, 4627.0, 48.0), radius = 100.0, strength = 2},
}

Citizen.CreateThread(function()
    while true do
        Wait(5000)
        local playerPed = PlayerPedId()
        local playerCoords = GetEntityCoords(playerPed)
        local newSignalStrength = 4
        local newNetworkType = "5G"

        for _, zone in pairs(lowSignalZones) do
            local distance = #(playerCoords - zone.coords)
            if distance <= zone.radius then
                local signalReduction = math.max(0, (zone.radius - distance) / zone.radius)
                local zoneSignal = math.floor(zone.strength + (4 - zone.strength) * (1 - signalReduction))
                newSignalStrength = math.min(newSignalStrength, zoneSignal)
            end
        end

        local altitude = playerCoords.z
        local underwater = IsPedSwimming(playerPed) and altitude < 0
        local inVehicle = IsPedInAnyVehicle(playerPed, false)
        local inBuilding = GetInteriorFromEntity(playerPed) ~= 0

        if underwater then
            newSignalStrength = 0
            newNetworkType = ""
        elseif altitude > 300 then
            newSignalStrength = math.max(1, newSignalStrength - 1)
        elseif inBuilding then
            newSignalStrength = math.max(1, newSignalStrength - 1)
        elseif inVehicle then
            local vehicle = GetVehiclePedIsIn(playerPed, false)
            local vehicleClass = GetVehicleClass(vehicle)
            if vehicleClass == 15 or vehicleClass == 16 then
                newSignalStrength = math.min(4, newSignalStrength + 1)
            end
        end

        if newSignalStrength >= 4 then
            newNetworkType = "5G"
        elseif newSignalStrength >= 3 then
            newNetworkType = "4G"
        elseif newSignalStrength >= 2 then
            newNetworkType = "3G"
        elseif newSignalStrength >= 1 then
            newNetworkType = "E"
        else
            newNetworkType = ""
        end

        local wasConnected = isConnected
        isConnected = newSignalStrength > 0

        if newSignalStrength ~= signalStrength or newNetworkType ~= networkType then
            signalStrength = newSignalStrength
            networkType = newNetworkType
            SendNUIMessage({ action = "updateSignal", signal = signalStrength, networkType = networkType, isConnected = isConnected })
        end

        if not wasConnected and isConnected then
            processPendingCommunications()
        end
    end
end)

Citizen.CreateThread(function()
    while true do
        Wait(60000)
        local batteryData = { level = currentBatteryLevel, isCharging = exports[GetCurrentResourceName()]:IsPhoneCharging() or false, temperature = math.random(20, 35), health = math.random(85, 100) }
        SendNUIMessage({ action = "updateBatteryStatus", data = batteryData })
    end
end)

RegisterNetEvent('bit-smartphone:client:setBattery')
AddEventHandler('bit-smartphone:client:setBattery', function(newLevel)
    currentBatteryLevel = math.max(0, math.min(100, newLevel))
    SendNUIMessage({ action = "updateBattery", battery = currentBatteryLevel })
end)

exports('GetBatteryLevel', function()
    return currentBatteryLevel
end)

exports('SetBatteryLevel', function(level)
    if type(level) == "number" and level >= 0 and level <= 100 then
        currentBatteryLevel = level
        SendNUIMessage({ action = "updateBattery", battery = currentBatteryLevel })
        return true
    end
    return false
end)

exports('ChargeBattery', function(amount)
    local newLevel = math.min(100, currentBatteryLevel + amount)
    currentBatteryLevel = newLevel
    SendNUIMessage({ action = "updateBattery", battery = currentBatteryLevel, charging = true })
    return newLevel
end)

RegisterNetEvent('bit-smartphone:photos:added')
AddEventHandler('bit-smartphone:photos:added', function(url)
    SendNUIMessage({ action = 'photos:add', url = url })
end)

local function interceptIncomingMessage(action, data)
    if not isConnected or signalStrength == 0 then
        local messageId = #pendingCommunications.incoming + 1
        pendingCommunications.incoming[messageId] = { type = 'nui_message', data = { action = action, data = data }, timestamp = GetGameTimer() }
        return false
    end
    return true
end

local originalSendNUIMessage = SendNUIMessage
SendNUIMessage = function(data)
    local communicationActions = { 'receiveMessage', 'receiveCall', 'newNotification', 'updateChats', 'updateChatMessages', 'receiveNewMessage', 'instagram:newPost', 'news:updateFeed', 'mail:newEmail', 'tuister:newTweet', 'darkweb:newMessage', 'crypto:priceUpdate' }
    local shouldIntercept = false
    for _, action in ipairs(communicationActions) do
        if data.action == action then
            shouldIntercept = true
            break
        end
    end
    if shouldIntercept and not interceptIncomingMessage(data.action, data.data) then
        return
    end
    originalSendNUIMessage(data)
end

RegisterNetEvent('bit-smartphone:client:receiveMessage')
AddEventHandler('bit-smartphone:client:receiveMessage', function(data)
    if interceptIncomingMessage('receiveMessage', data) then
        SendNUIMessage({ action = 'receiveMessage', data = data })
    end
end)

RegisterNetEvent('bit-smartphone:client:receiveCall')
AddEventHandler('bit-smartphone:client:receiveCall', function(data)
    if interceptIncomingMessage('receiveCall', data) then
        SendNUIMessage({ action = 'receiveCall', data = data })
    end
end)

RegisterNetEvent('bit-smartphone:client:newNotification')
AddEventHandler('bit-smartphone:client:newNotification', function(data)
    if interceptIncomingMessage('newNotification', data) then
        SendNUIMessage({ action = 'newNotification', data = data })
        if not phoneOpen then
            Notifications(data.type or Noti.info, data.message, data.time or 3000)
        end
    end
end)

RegisterNetEvent('bit-smartphone:requestSaveBeforeDisconnect')
AddEventHandler('bit-smartphone:requestSaveBeforeDisconnect', function()
    SendNUIMessage({ action = 'forceSavePhoneState', reason = 'disconnect' })
end)

RegisterNetEvent('bit-smartphone:requestSaveBeforeResourceStop')
AddEventHandler('bit-smartphone:requestSaveBeforeResourceStop', function()
    SendNUIMessage({ action = 'forceSavePhoneState', reason = 'resource_stop' })
end)

RegisterNUICallback('bit-smartphone:savePhoneData', function(data, cb)
    TriggerEvent('bit-smartphone:saveData', data)
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:getAvailableApps', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:getAvailableApps', function(result)
            cb(result)
        end)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:getAvailableApps', function(result)
            cb(result)
        end)
    end
end)

RegisterNUICallback('bit-smartphone:saveCompleted', function(data, cb)
    TriggerServerEvent('bit-smartphone:saveCompleted', data)
    cb('ok')
end)


RegisterNUICallback('getUserProfile', function(data, cb)
    TriggerServerEvent('bit-smartphone:getUserProfile')
    cb('ok')
end)

RegisterNUICallback('saveContact', function(data, cb)
    if data.name and data.number then
        local responded = false
        local src = PlayerId()

        
        local function onResult(result)
            if not responded then
                responded = true
                cb(result)
            end
        end

        RegisterNetEvent('bit-smartphone:phone:saveContactResult')
        AddEventHandler('bit-smartphone:phone:saveContactResult', function(result)
            onResult(result)
        end)

        
        TriggerServerEvent('bit-smartphone:phone:saveContact', data)

        
        Citizen.SetTimeout(3000, function()
            if not responded then
                responded = true
                cb({ success = false, message = 'timeout' })
            end
        end)
    else
        cb({ success = false, message = 'missing_fields' })
    end
end)

RegisterNUICallback('getContacts', function(data, cb)
    TriggerServerEvent('bit-smartphone:phone:getContacts')
    cb('ok')
end)

RegisterNUICallback('makeCall', function(data, cb)
    TriggerServerEvent('call:start', data)
    cb('ok')
end)

