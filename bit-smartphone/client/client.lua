RegisterNUICallback(
    "getTranslations",
    function(data, cb)
        DebugPrint("CLIENT", "Getting translations", {requested_lang = data.lang or "default"})
        -- Prefer configured language; default to English if not present
        local lang = Config.Language or "en"
        if PhoneMessages and PhoneMessages[lang] then
            DebugPrint("CLIENT", "Translations found for language", lang)
            cb(PhoneMessages[lang])
        else
            DebugPrint("CLIENT", "Fallback to English translations", {has_phone_messages = PhoneMessages ~= nil})
            cb(PhoneMessages and PhoneMessages["en"] or {})
        end
    end
)

-- Send initial phone configuration to the NUI so the frontend has access to setupData (language, keybinds, etc.)
CreateThread(
    function()
        -- small delay to ensure NUI is ready to receive messages
        Wait(1000)
        SendNUIMessage(
            {
                action = "phone:config",
                data = {
                    language = Config.Language,
                    phoneKey = Config.PhoneKey,
                    notifications = Config.Notifications,
                    photoProvider = Config.PhotoProvider
                }
            }
        )
    end
)

local _TriggerServerEvent = TriggerServerEvent
local phoneOpen = false
local phoneProp = 0
local canUsePhone = true
local flashlightActive = false
local lastPhoneToggle = 0
local isPhoneTransitioning = false
local flashlightRange = 15.0
local flashlightBrightness = 2.0
local flashlightAngle = 45.0
local isConnected = true
local signalStrength = 4
local networkType = "5G"
local pendingCommunications = {outgoing = {}, incoming = {}}

function GetNetworkStatus()
    return {
        isConnected = isConnected,
        signalStrength = signalStrength,
        networkType = networkType
    }
end

function IsPhoneConnected()
    return isConnected and signalStrength > 0
end

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
        PhoneNotify("phone.messageRetained", {}, "system")
        if callback then
            callback({success = false, reason = "no_signal"})
        end
    end

    if type == "server_event" then
        _TriggerServerEvent(event, table.unpack(data))
    elseif type == "server_callback" then
        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(event, callback, table.unpack(data))
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(event, callback, table.unpack(data))
        end
    end

    return true
end

local function processPendingCommunications()
    if not isConnected or signalStrength == 0 then
        return
    end

    for id, comm in pairs(pendingCommunications.outgoing) do
        if comm.retries < 3 then
            comm.retries = comm.retries + 1
            if comm.type == "server_event" then
                _TriggerServerEvent(comm.event, table.unpack(comm.data))
                PhoneNotify("phone.messageSent", {}, "system")
            elseif comm.type == "server_callback" then
                if Config.Framework == "esx" then
                    ESX.TriggerServerCallback(comm.event, comm.callback, table.unpack(comm.data))
                elseif Config.Framework == "qb" or Config.Framework == "qbox" then
                    QBCore.Functions.TriggerCallback(comm.event, comm.callback, table.unpack(comm.data))
                end
                PhoneNotify("phone.dataSynced", {}, "system")
            end
            pendingCommunications.outgoing[id] = nil
        else
            PhoneNotify("phone.errorSendingMessage", {}, "system")
            pendingCommunications.outgoing[id] = nil
        end
    end

    for id, comm in pairs(pendingCommunications.incoming) do
        if comm.type == "nui_message" then
            SendNUIMessage(comm.data)
        elseif comm.type == "notification" then
            PhoneNotify("general.notification", {message = comm.data.message}, "system")
        end
        pendingCommunications.incoming[id] = nil
    end
end

TriggerServerEvent = function(event, ...)
    local phoneEvents = {
        "bit-smartphone:",
        "call:",
        "message:",
        "bitlove:",
        "instagram:",
        "news:",
        "mail:",
        "tuister:",
        "darkweb:",
        "crypto:"
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
        if not interceptCommunication("server_event", event, data, nil) then
            return
        end
    end
    _TriggerServerEvent(event, ...)
end

local function phoneAnimation()
    local playerPed = PlayerPedId()

    RequestAnimDict("cellphone@")
    while not HasAnimDictLoaded("cellphone@") do
        Wait(0)
    end

    phoneProp = CreateObject(GetHashKey("prop_amb_phone"), 0, 0, 0, true, true, true)
    AttachEntityToEntity(
        phoneProp,
        playerPed,
        GetPedBoneIndex(playerPed, 28422),
        0.0,
        -0.025,
        0.0,
        0.0,
        0.0,
        0.0,
        true,
        true,
        false,
        true,
        1,
        true
    )

    if not IsPedInAnyVehicle(playerPed, false) then
        SetCurrentPedWeapon(playerPed, GetHashKey("WEAPON_UNARMED"), true)
        TaskPlayAnim(playerPed, "cellphone@", "cellphone_text_in", 8.0, -8.0, -1, 50, 0, false, false, false)
    else
        TaskPlayAnim(playerPed, "cellphone@", "cellphone_text_in", 2.0, 2.0, -1, 50, 0, false, false, false)
    end
end

local function openPhone()
    DebugPrint("CLIENT", "Attempting to open phone")
    local playerPed = PlayerPedId()

    if IsPedDeadOrDying(playerPed, true) or IsPedBeingStunned(playerPed, 0) then
        DebugPrint("CLIENT", "Phone open blocked - player dead or stunned")
        return
    end

    local currentTime = GetGameTimer()
    if Config.PhoneCooldown.enabled and currentTime - lastPhoneToggle < Config.PhoneCooldown.openCooldown then
        DebugPrint(
            "CLIENT",
            "Phone open blocked - cooldown active",
            {time_left = Config.PhoneCooldown.openCooldown - (currentTime - lastPhoneToggle)}
        )
        PhoneNotify("phone.phoneInUse", {}, "system")
        return
    end

    if not canUsePhone then
        DebugPrint("CLIENT", "Phone open blocked - phone disabled")
        PhoneNotify("phone.phoneDisabled", {}, "system")
        return
    end

    if phoneOpen or isPhoneTransitioning then
        DebugPrint(
            "CLIENT",
            "Phone open blocked - already open or transitioning",
            {phoneOpen = phoneOpen, isTransitioning = isPhoneTransitioning}
        )
        return
    end

    DebugPrint("CLIENT", "Starting phone transition")
    isPhoneTransitioning = true
    lastPhoneToggle = currentTime

    if phoneProp ~= 0 and DoesEntityExist(phoneProp) then
        DebugPrint("CLIENT", "Deleting existing phone prop", {entity = phoneProp})
        DeleteObject(phoneProp)
        phoneProp = 0
    end

    DebugPrint("CLIENT", "Setting phone open state and starting animation")
    phoneOpen = true
    phoneAnimation()
    SetNuiFocus(true, true)

    CreateThread(
        function()
            while phoneOpen do
                InvalidateIdleCam()
                Wait(1000)
            end
        end
    )

    if Config.Framework == "esx" then
        DebugPrint("CLIENT", "Loading phone data via ESX callback")
        ESX.TriggerServerCallback(
            "bit-smartphone:loadData",
            function(data)
                DebugPrint("CLIENT", "Phone data loaded", {has_data = data ~= nil})
                data = data or {}

                if data.battery_level and type(data.battery_level) == "number" then
                    currentBatteryLevel = math.max(0, math.min(100, data.battery_level))
                    DebugPrint("CLIENT", "Battery level loaded from DB", {level = currentBatteryLevel})
                else
                    currentBatteryLevel = 85
                    DebugPrint("CLIENT", "Using default battery level", {level = currentBatteryLevel})
                end

                DebugPrint("CLIENT", "Loading photos via callback")
                ESX.TriggerServerCallback(
                    "bit-smartphone:photos:loadPhotos",
                    function(photos)
                        DebugPrint("CLIENT", "Photos loaded", {photo_count = photos and #photos or 0})
                        data.photos = photos or {}

                        DebugPrint("CLIENT", "Loading persistent notifications via callback")
                        ESX.TriggerServerCallback(
                            "bit-smartphone:getNotifications",
                            function(notifications)
                                DebugPrint(
                                    "CLIENT",
                                    "Persistent notifications loaded",
                                    {notification_count = notifications and #notifications or 0}
                                )
                                data.notifications = notifications or {}

                                DebugPrint("CLIENT", "Sending openPhone message to NUI")
                                if Config.debugMode then
                                    SendNUIMessage({type = "enableDebugMode"})
                                end
                                SendNUIMessage({type = "openPhone", data = data})

                                SetTimeout(
                                    500,
                                    function()
                                        DebugPrint("CLIENT", "Phone transition completed")
                                        isPhoneTransitioning = false
                                    end
                                )
                            end
                        )
                    end
                )
            end
        )
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback(
            "bit-smartphone:loadData",
            function(data)
                data = data or {}

                if data.battery_level and type(data.battery_level) == "number" then
                    currentBatteryLevel = math.max(0, math.min(100, data.battery_level))
                else
                    currentBatteryLevel = 85
                end

                QBCore.Functions.TriggerCallback(
                    "bit-smartphone:photos:loadPhotos",
                    function(photos)
                        data.photos = photos or {}

                        QBCore.Functions.TriggerCallback(
                            "bit-smartphone:getNotifications",
                            function(notifications)
                                data.notifications = notifications or {}
                                SendNUIMessage({action = "openPhone", data = data})

                                SetTimeout(
                                    500,
                                    function()
                                        isPhoneTransitioning = false
                                    end
                                )
                            end
                        )
                    end
                )
            end
        )
    end
end

if Config.openCommand ~= "" then
    RegisterCommand(
        Config.openCommand,
        function()
            if Config.item.itemRequired then
                if Config.Framework == "esx" then
                    ESX.TriggerServerCallback(
                        "bit-smartphone:checkItem",
                        function(hasItem)
                            if hasItem then
                                openPhone()
                            else
                                PhoneNotify("phone.phoneDisabled", {}, "system")
                            end
                        end,
                        Config.item.itemName,
                        1
                    )
                elseif Config.Framework == "qb" or Config.Framework == "qbox" then
                    QBCore.Functions.TriggerCallback(
                        "bit-smartphone:checkItem",
                        function(hasItem)
                            if hasItem then
                                openPhone()
                            else
                                PhoneNotify("phone.phoneDisabled", {}, "system")
                            end
                        end,
                        Config.item.itemName,
                        1
                    )
                end
            else
                openPhone()
            end
        end,
        false
    )
end

local function togglePhoneFlashlight(state, range, brightness, angle)
    if not Config.Flashlight.enabled then
        return
    end
    flashlightActive = state
    flashlightRange = range or Config.Flashlight.maxRange
    flashlightBrightness = brightness or Config.Flashlight.brightness
    flashlightAngle = angle or Config.Flashlight.angle
    if flashlightActive then
        CreateThread(
            function()
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
                    local targetPos =
                        lightPos + vector3(dirX * flashlightRange, dirY * flashlightRange, dirZ * flashlightRange)
                    DrawSpotLight(
                        lightPos.x,
                        lightPos.y,
                        lightPos.z,
                        dirX,
                        dirY,
                        dirZ,
                        255,
                        255,
                        255,
                        flashlightRange,
                        flashlightBrightness,
                        0.0,
                        flashlightAngle,
                        10.0
                    )
                    DrawLightWithRange(
                        lightPos.x,
                        lightPos.y,
                        lightPos.z,
                        255,
                        255,
                        255,
                        flashlightRange * 0.3,
                        flashlightBrightness * 0.3
                    )
                    Wait(0)
                end
            end
        )
    end
end

RegisterNUICallback(
    "bit-smartphone:toggleFlashlight",
    function(data, cb)
        DebugPrint(
            "CLIENT",
            "Toggling flashlight",
            {state = data.state, range = data.range, brightness = data.brightness, angle = data.angle}
        )
        togglePhoneFlashlight(data.state, data.range, data.brightness, data.angle)
        cb("ok")
    end
)

RegisterNUICallback(
    "bit-smartphone:contacts:saveContact",
    function(data, cb)
        if data.name and data.number then
            TriggerServerEvent("bit-smartphone:contacts:addContact", data)
        end
        cb("ok")
    end
)

RegisterNUICallback(
    "bit-smartphone:contacts:getContacts",
    function(data, cb)
        TriggerServerEvent("bit-smartphone:contacts:getContacts")
        cb("ok")
    end
)

RegisterNUICallback(
    "bit-smartphone:garage:loadVehicles",
    function(data, cb)
        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:garage:loadVehicles",
                function(vehicles)
                    cb({ok = true, vehicles = vehicles or {}})
                end
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:garage:loadVehicles",
                function(vehicles)
                    cb({ok = true, vehicles = vehicles or {}})
                end
            )
        else
            cb({ok = false, vehicles = {}})
        end
    end
)

RegisterNUICallback(
    "bit-smartphone:loadLocations",
    function(data, cb)
        cb({ok = true, locations = {}})
    end
)

RegisterNetEvent("phone:sendNUIMessage")
AddEventHandler(
    "phone:sendNUIMessage",
    function(msg)
        SendNUIMessage(msg)
    end
)

RegisterNetEvent("bit-smartphone:client:sendNuiMessage")
AddEventHandler(
    "bit-smartphone:client:sendNuiMessage",
    function(msg)
        SendNUIMessage(msg)
    end
)

RegisterNetEvent("phone:bitloveResponse")
AddEventHandler(
    "phone:bitloveResponse",
    function(data)
        SendNUIMessage(
            {
                type = "message",
                action = data.action,
                data = data
            }
        )
    end
)

if Config.PhoneKey.enabled then
    RegisterKeyMapping(Config.PhoneKey.Command, Config.PhoneKey.description, "keyboard", Config.PhoneKey.key)
end

RegisterNUICallback(
    "bit-smartphone:closePhone",
    function(data, cb)
        local currentTime = GetGameTimer()
        if Config.PhoneCooldown.enabled and currentTime - lastPhoneToggle < Config.PhoneCooldown.closeCooldown then
            if cb then
                cb("cooldown")
            end
            return
        end

        isPhoneTransitioning = true
        lastPhoneToggle = currentTime
        phoneOpen = false
        SetNuiFocus(false, false)
        TriggerServerEvent("bit-smartphone:saveData", data)
        local playerPed = PlayerPedId()

        if not HasAnimDictLoaded("cellphone@") then
            RequestAnimDict("cellphone@")
            while not HasAnimDictLoaded("cellphone@") do
                Wait(0)
            end
        end

        if phoneProp ~= 0 and DoesEntityExist(phoneProp) then
            if not IsPedInAnyVehicle(playerPed, false) then
                TaskPlayAnim(playerPed, "cellphone@", "cellphone_text_out", 8.0, -8.0, -1, 50, 0, false, false, false)
                Wait(800)
            else
                TaskPlayAnim(playerPed, "cellphone@", "cellphone_text_out", 2.0, 2.0, -1, 50, 0, false, false, false)
                Wait(500)
            end
        end

        if not IsPedInAnyVehicle(playerPed, false) then
            ClearPedTasks(playerPed)
        end
        if phoneProp ~= 0 and DoesEntityExist(phoneProp) then
            DeleteObject(phoneProp)
            phoneProp = 0
        end

        SetTimeout(
            200,
            function()
                isPhoneTransitioning = false
            end
        )

        if cb then
            cb("ok")
        end
    end
)

RegisterNUICallback(
    "bit-smartphone:saveData",
    function(data, cb)
        TriggerServerEvent("bit-smartphone:saveData", data)
        if cb then
            cb("ok")
        end
    end
)

RegisterNUICallback(
    "getNearbyPlayers",
    function(data, cb)
        TriggerServerEvent("bit-smartphone:getNearbyPlayers")
        if cb then
            cb("ok")
        end
    end
)

RegisterNUICallback(
    "sendAirDrop",
    function(data, cb)
        TriggerServerEvent("bit-smartphone:sendAirDrop", data)
        if cb then
            cb("ok")
        end
    end
)

if not SaveContactResultHandlerRegistered then
    SaveContactResultHandlerRegistered = true
    RegisterNetEvent("bit-smartphone:phone:saveContactResult")
    AddEventHandler(
        "bit-smartphone:phone:saveContactResult",
        function(result)
            if not result or not result.requestId then
                return
            end
            PendingContactRequests = PendingContactRequests or {}
            local cbfn = PendingContactRequests[result.requestId]
            if cbfn then
                PendingContactRequests[result.requestId] = nil
                cbfn({success = result.success, message = result.message})
            end
        end
    )
end

local currentBatteryLevel = 85
local batteryDrainActive = false
local currentApp = nil
local lastBatterySave = GetGameTimer()

Citizen.CreateThread(
    function()
        while true do
            Wait(5000)
            local playerPed = PlayerPedId()
            local playerCoords = GetEntityCoords(playerPed)
            local newSignalStrength = Config.Network.baseSignalStrength
            local newNetworkType = ""
            local closestTowerDistance = Config.Network.maxDistance

            if Config.Network.enabled then
                for _, tower in pairs(Config.Network.towers) do
                    local distance = #(playerCoords - tower.coords)
                    if distance <= tower.range then
                        if distance < closestTowerDistance then
                            closestTowerDistance = distance
                            local signalPercent = 1.0 - (distance / tower.range)
                            newSignalStrength = math.floor(signalPercent * 4) + 1
                            newSignalStrength = math.max(1, math.min(4, newSignalStrength))
                        end
                    end
                end
            end

            local altitude = playerCoords.z
            local underwater = IsPedSwimming(playerPed) and altitude < 0
            local inVehicle = IsPedInAnyVehicle(playerPed, false)
            local inBuilding = GetInteriorFromEntity(playerPed) ~= 0

            if underwater then
                newSignalStrength = 0
            elseif altitude > 500 then
                newSignalStrength = math.max(0, newSignalStrength - 2)
            elseif inBuilding then
                newSignalStrength = math.max(0, newSignalStrength - 1)
            elseif inVehicle then
                local vehicle = GetVehiclePedIsIn(playerPed, false)
                local vehicleClass = GetVehicleClass(vehicle)
                if vehicleClass == 8 or vehicleClass == 13 or vehicleClass == 14 then
                    newSignalStrength = math.max(0, newSignalStrength - 1)
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
                SendNUIMessage(
                    {
                        action = "updateSignal",
                        signal = signalStrength,
                        networkType = networkType,
                        isConnected = isConnected
                    }
                )
            end

            if not wasConnected and isConnected then
                processPendingCommunications()
            end
        end
    end
)

Citizen.CreateThread(
    function()
        while true do
            Wait(60000)

            if Config.Battery.enabled and batteryDrainActive and currentBatteryLevel > 0 then
                local drainAmount = Config.Battery.baseDrainRate

                if currentApp and Config.Battery.appConsumption[currentApp] then
                    drainAmount = drainAmount + Config.Battery.appConsumption[currentApp]
                end

                local newLevel = math.max(0, currentBatteryLevel - drainAmount)

                if newLevel ~= currentBatteryLevel then
                    currentBatteryLevel = newLevel
                    SendNUIMessage({action = "updateBattery", battery = currentBatteryLevel})

                    if currentBatteryLevel <= Config.Battery.criticalBatteryLevel and currentBatteryLevel > 0 then
                        PhoneNotify("battery.critical", {currentBatteryLevel}, "system")
                    elseif
                        currentBatteryLevel <= Config.Battery.lowBatteryWarning and
                            currentBatteryLevel > Config.Battery.criticalBatteryLevel
                     then
                        PhoneNotify("battery.low", {currentBatteryLevel}, "system")
                    end

                    if currentBatteryLevel <= Config.Battery.autoShutdownLevel then
                        PhoneNotify("battery.shutdown", {}, "system")
                        SetTimeout(
                            3000,
                            function()
                                if phoneOpen then
                                    phoneOpen = false
                                    SetNuiFocus(false, false)
                                    SendNUIMessage({action = "closePhone"})
                                end
                                batteryDrainActive = false
                            end
                        )
                    end

                    local currentTime = GetGameTimer()
                    if currentTime - lastBatterySave > 300000 or currentBatteryLevel <= 10 then
                        TriggerServerEvent("bit-smartphone:server:saveBattery", currentBatteryLevel)
                        lastBatterySave = currentTime
                    end
                end
            end
        end
    end
)

Citizen.CreateThread(
    function()
        while true do
            Wait(60000)
            local batteryData = {
                level = currentBatteryLevel,
                isCharging = exports[GetCurrentResourceName()]:IsPhoneCharging() or false,
                temperature = math.random(20, 35),
                health = math.random(85, 100)
            }
            SendNUIMessage({action = "updateBatteryStatus", data = batteryData})
        end
    end
)

RegisterNetEvent("bit-smartphone:client:setBattery")
AddEventHandler(
    "bit-smartphone:client:setBattery",
    function(newLevel)
        currentBatteryLevel = math.max(0, math.min(100, newLevel))
        SendNUIMessage({action = "updateBattery", battery = currentBatteryLevel})

        TriggerServerEvent("bit-smartphone:server:saveBattery", currentBatteryLevel)
    end
)

exports(
    "GetBatteryLevel",
    function()
        return currentBatteryLevel
    end
)

exports(
    "SetBatteryLevel",
    function(level)
        if type(level) == "number" and level >= 0 and level <= 100 then
            currentBatteryLevel = level
            SendNUIMessage({action = "updateBattery", battery = currentBatteryLevel})
            return true
        end
        return false
    end
)

exports(
    "ChargeBattery",
    function(amount)
        local newLevel = math.min(100, currentBatteryLevel + amount)
        currentBatteryLevel = newLevel
        SendNUIMessage({action = "updateBattery", battery = currentBatteryLevel, charging = true})
        return newLevel
    end
)

RegisterNetEvent("bit-smartphone:photos:added")
AddEventHandler(
    "bit-smartphone:photos:added",
    function(url)
        SendNUIMessage({action = "photos:add", url = url})
    end
)

local function interceptIncomingMessage(action, data)
    if not isConnected or signalStrength == 0 then
        local messageId = #pendingCommunications.incoming + 1
        pendingCommunications.incoming[messageId] = {
            type = "nui_message",
            data = {action = action, data = data},
            timestamp = GetGameTimer()
        }
        return false
    end
    return true
end

local originalSendNUIMessage = SendNUIMessage
SendNUIMessage = function(data)
    local communicationActions = {
        "receiveMessage",
        "receiveCall",
        "newNotification",
        "updateChats",
        "updateChatMessages",
        "receiveNewMessage",
        "instagram:newPost",
        "news:updateFeed",
        "mail:newEmail",
        "tuister:newTweet",
        "darkweb:newMessage",
        "crypto:priceUpdate"
    }
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

RegisterNetEvent("bit-smartphone:client:receiveMessage")
AddEventHandler(
    "bit-smartphone:client:receiveMessage",
    function(data)
        if interceptIncomingMessage("receiveMessage", data) then
            SendNUIMessage({action = "receiveMessage", data = data})
        end
    end
)

RegisterNetEvent("bit-smartphone:client:receiveCall")
AddEventHandler(
    "bit-smartphone:client:receiveCall",
    function(data)
        if interceptIncomingMessage("receiveCall", data) then
            SendNUIMessage({action = "receiveCall", data = data})
        end
    end
)

RegisterNetEvent("bit-smartphone:client:newNotification")
AddEventHandler(
    "bit-smartphone:client:newNotification",
    function(data)
        if interceptIncomingMessage("newNotification", data) then
            SendNUIMessage({action = "newNotification", data = data})
            if not phoneOpen then
                PhoneNotify("general.notification", {message = data.message}, "system")
            end
        end
    end
)

RegisterNetEvent("bit-smartphone:receiveInternalNotification")
AddEventHandler(
    "bit-smartphone:receiveInternalNotification",
    function(data)
        if canUsePhone then
            SendNUIMessage(
                {
                    action = "receiveNotification",
                    appId = data.appId or "system",
                    message = data.message,
                    type = data.type,
                    time = data.time,
                    timestamp = data.timestamp
                }
            )
        end
    end
)

function PhoneNotify(messageKey, params, appId)
    local lang = Config.Language or "en"
    local messages = PhoneMessages[lang] or PhoneMessages["en"]
    local message = messages[messageKey] or messageKey

    if not message or type(message) ~= "string" then
        message = messageKey or "Unknown message"
    end

    if params and type(params) == "table" and #params > 0 and string.find(message, "%%") then
        local ok, formatted = pcall(string.format, message, table.unpack(params))
        if ok then
            message = formatted
        else
            print(
                "[BIT-Smartphone] Error formatting message:",
                messageKey,
                "Message:",
                message,
                "Params:",
                json.encode(params)
            )
        end
    end

    local app = appId or "system"
    if type(app) == "string" and app ~= "system" then
        TriggerServerEvent("bit-smartphone:proxyLegacyNotification", app, message)
        return
    end

    SendNUIMessage(
        {
            action = "receiveNotification",
            appId = app,
            message = message,
            type = "info",
            time = 5000,
            timestamp = GetGameTimer()
        }
    )
end

RegisterNetEvent("bit-smartphone:requestSaveBeforeDisconnect")
AddEventHandler(
    "bit-smartphone:requestSaveBeforeDisconnect",
    function()
        SendNUIMessage({action = "forceSavePhoneState", reason = "disconnect"})
    end
)

RegisterNetEvent("bit-smartphone:requestSaveBeforeResourceStop")
AddEventHandler(
    "bit-smartphone:requestSaveBeforeResourceStop",
    function()
        SendNUIMessage({action = "forceSavePhoneState", reason = "resource_stop"})
    end
)

RegisterNUICallback(
    "bit-smartphone:savePhoneData",
    function(data, cb)
        TriggerServerEvent("bit-smartphone:saveData", data)
        cb("ok")
    end
)

RegisterNUICallback(
    "bit-smartphone:dismissNotification",
    function(data, cb)
        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:dismissNotification",
                function(success)
                    cb({success = success})
                end,
                data.notificationId
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:dismissNotification",
                function(success)
                    cb({success = success})
                end,
                data.notificationId
            )
        end
    end
)

RegisterNUICallback(
    "bit-smartphone:markNotificationRead",
    function(data, cb)
        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:markNotificationRead",
                function(success)
                    cb({success = success})
                end,
                data.notificationId
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:markNotificationRead",
                function(success)
                    cb({success = success})
                end,
                data.notificationId
            )
        end
    end
)

RegisterNUICallback(
    "bit-smartphone:clearAllNotifications",
    function(data, cb)
        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:clearAllNotifications",
                function(success)
                    cb({success = success})
                end
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:clearAllNotifications",
                function(success)
                    cb({success = success})
                end
            )
        end
    end
)

RegisterNUICallback(
    "bit-smartphone:getAvailableApps",
    function(data, cb)
        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:getAvailableApps",
                function(result)
                    cb(result)
                end
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:getAvailableApps",
                function(result)
                    cb(result)
                end
            )
        end
    end
)

RegisterNUICallback(
    "appstore:downloadApp",
    function(data, cb)
        print("[Client] Received download request for app:", data.appId)
        TriggerServerEvent("bit-smartphone:appstore:downloadApp", data.appId)
        cb({success = true})
    end
)

RegisterNUICallback(
    "getUserProfile",
    function(data, cb)
        TriggerServerEvent("bit-smartphone:getUserProfile")
        cb("ok")
    end
)

RegisterNUICallback(
    "saveContact",
    function(data, cb)
        if data.name and data.number then
            local responded = false
            local src = PlayerId()

            local function onResult(result)
                if not responded then
                    responded = true
                    cb(result)
                end
            end

            RegisterNetEvent("bit-smartphone:phone:saveContactResult")
            AddEventHandler(
                "bit-smartphone:phone:saveContactResult",
                function(result)
                    onResult(result)
                end
            )

            TriggerServerEvent("bit-smartphone:phone:saveContact", data)

            Citizen.SetTimeout(
                3000,
                function()
                    if not responded then
                        responded = true
                        cb({success = false, message = "timeout"})
                    end
                end
            )
        else
            cb({success = false, message = "missing_fields"})
        end
    end
)

RegisterNetEvent("bit-smartphone:receiveNotification")
AddEventHandler(
    "bit-smartphone:receiveNotification",
    function(notificationData)
        SendNUIMessage(
            {
                action = "receiveNotification",
                data = notificationData
            }
        )
    end
)

RegisterNUICallback(
    "getContacts",
    function(data, cb)
        TriggerServerEvent("bit-smartphone:phone:getContacts")
        cb("ok")
    end
)

RegisterNUICallback(
    "makeCall",
    function(data, cb)
        TriggerServerEvent("call:start", data)
        cb("ok")
    end
)

local function cleanupPhone()
    local playerPed = PlayerPedId()

    ClearPedTasks(playerPed)

    if phoneProp ~= 0 and DoesEntityExist(phoneProp) then
        DeleteObject(phoneProp)
        phoneProp = 0
    end

    if phoneOpen then
        phoneOpen = false
        SetNuiFocus(false, false)
    end

    isPhoneTransitioning = false
    lastPhoneToggle = 0
end

RegisterNUICallback(
    "phoneOpened",
    function(data, cb)
        batteryDrainActive = true
        currentApp = nil
        cb("ok")
    end
)

RegisterNUICallback(
    "phoneClosed",
    function(data, cb)
        batteryDrainActive = false
        currentApp = nil
        TriggerServerEvent("bit-smartphone:server:saveBattery", currentBatteryLevel)
        cb("ok")
    end
)

RegisterNUICallback(
    "appChanged",
    function(data, cb)
        if data and data.appId then
            currentApp = data.appId
        else
            currentApp = nil
        end
        cb("ok")
    end
)

RegisterNUICallback(
    "bit-smartphone:dismissNotification",
    function(data, cb)
        DebugPrint("CLIENT", "Dismissing notification", {id = data.notificationId})

        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:dismissNotification",
                function(success)
                    cb({success = success})
                end,
                data.notificationId
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:dismissNotification",
                function(success)
                    cb({success = success})
                end,
                data.notificationId
            )
        end
    end
)

RegisterNUICallback(
    "bit-smartphone:markNotificationRead",
    function(data, cb)
        DebugPrint("CLIENT", "Marking notification as read", {id = data.notificationId})

        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:markNotificationRead",
                function(success)
                    cb({success = success})
                end,
                data.notificationId
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:markNotificationRead",
                function(success)
                    cb({success = success})
                end,
                data.notificationId
            )
        end
    end
)

RegisterNUICallback(
    "bit-smartphone:clearAllNotifications",
    function(data, cb)
        DebugPrint("CLIENT", "Clearing all notifications")

        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:clearAllNotifications",
                function(success)
                    cb({success = success})
                end
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:clearAllNotifications",
                function(success)
                    cb({success = success})
                end
            )
        end
    end
)

RegisterNUICallback(
    "bit-smartphone:saveNotification",
    function(data, cb)
        DebugPrint("CLIENT", "Saving notification", data)
        if not data or type(data) ~= "table" then
            cb({success = false, error = "invalid_payload"})
            return
        end

        if Config.Framework == "esx" then
            ESX.TriggerServerCallback(
                "bit-smartphone:saveNotification",
                function(result)
                    cb(result or {success = false})
                end,
                data
            )
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            QBCore.Functions.TriggerCallback(
                "bit-smartphone:saveNotification",
                function(result)
                    cb(result or {success = false})
                end,
                data
            )
        else
            cb({success = false, error = "unsupported_framework"})
        end
    end
)

AddEventHandler(
    "onResourceStop",
    function(resourceName)
        if GetCurrentResourceName() == resourceName then
            cleanupPhone()
        end
    end
)

AddEventHandler(
    "onClientResourceStop",
    function(resourceName)
        if GetCurrentResourceName() == resourceName then
            cleanupPhone()
        end
    end
)

CreateThread(
    function()
        while true do
            Wait(5000)

            if isPhoneTransitioning and (GetGameTimer() - lastPhoneToggle) > Config.PhoneCooldown.maxTransitionTime then
                print("[BIT-Smartphone] Resetting stuck phone transition")
                isPhoneTransitioning = false

                if phoneOpen then
                    phoneOpen = false
                    SetNuiFocus(false, false)
                    print("[BIT-Smartphone] Force closed stuck phone")
                end
            end
        end
    end
)
