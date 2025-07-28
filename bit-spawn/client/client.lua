local uiActive = false
local lastCoord = nil
local lastRealCoord = nil

AddEventHandler("playerSpawned", function()
    if Config.Framework == 'esx' and ESX then
        local pd = ESX.GetPlayerData()
        if pd and pd.coords then
            lastRealCoord = vector3(pd.coords.x, pd.coords.y, pd.coords.z)
            lastCoord = lastRealCoord 
        end
    elseif (Config.Framework == 'qb' or Config.Framework == 'qbox') and QBCore then
        local pd = QBCore.Functions.GetPlayerData()
        if pd and pd.position then
            lastRealCoord = vector3(pd.position.x, pd.position.y, pd.position.z)
            lastCoord = lastRealCoord 
        end
    end
    print(json.encode(lastRealCoord))
end)


local function setUIActive(state)
    uiActive = state
    SetNuiFocus(state, state)
    local nuiMessage = { 
        action = state and 'open' or 'close', 
        locations = Config.Locations, 
        texts = Lang.SpawnSelector 
    }
    if lastCoord then
        nuiMessage.lastCoord = lastCoord
    end
    SendNUIMessage(nuiMessage)
end

RegisterNetEvent('bit-spawn:openSelector', function()
    setUIActive(true)
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        if uiActive then
            DisableAllControlActions(0)
            EnableControlAction(0, 1, true)
            EnableControlAction(0, 2, true)
            EnableControlAction(0, 249, true)
        end
    end
end)

local previewCam = nil
local function clearPreviewCam()
    if previewCam then
        RenderScriptCams(false, false, 0, true, false)
        DestroyCam(previewCam, false)
        previewCam = nil
        local ped = PlayerPedId()
        if SetEntityRoutingBucket then
            SetEntityRoutingBucket(ped, 0)
        end
    end
end

RegisterNUICallback('previewLocation', function(data, cb)
    clearPreviewCam()
    local locId = tonumber(data.locationId)
    local chosen
    for _, loc in ipairs(Config.Locations) do if loc.id == locId then chosen = loc; break end end
    if chosen then

        local coords = (chosen.id == 0) and lastRealCoord or vector3(chosen.x, chosen.y, chosen.z)
        local conf = chosen.camera or Config.Preview
        local heading = chosen.h or 0.0

        local ped = PlayerPedId()
        if SetEntityRoutingBucket then
            SetEntityRoutingBucket(ped, 1)
        end

        SetEntityCoords(ped, coords.x, coords.y, coords.z, false, false, false, true)
        SetEntityHeading(ped, heading)
        RequestCollisionAtCoord(coords.x, coords.y, coords.z)

        previewCam = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)

        SetCamCoord(previewCam, coords.x, coords.y, coords.z + (conf.heightOffset or 50.0))

        SetCamRot(previewCam, -25.0, 0.0, heading, 2)

        SetCamFov(previewCam, conf.fov or 60.0)
        RenderScriptCams(true, false, 0, true, false)
    end
    cb('ok')
end)


RegisterNUICallback('confirmSpawn', function(data, cb)
    local locId = tonumber(data.locationId)
    local chosen
    for _, loc in ipairs(Config.Locations) do
        if loc.id == locId then chosen = loc; break end
    end

    if chosen then
        local ped = PlayerPedId()
        local dest = (chosen.id == 0) and lastRealCoord or vector3(chosen.x, chosen.y, chosen.z)
        local sc = chosen.scriptedCam or chosen.camera or Config.Preview

        SetEntityCoords(ped, dest.x, dest.y, dest.z, false, false, false, true)
        local heading = chosen.h or 0.0
        SetEntityHeading(ped, heading)

        local radians = math.rad(heading)
        local forwardX = -math.sin(radians)
        local forwardY = math.cos(radians)

        local walkTo = vector3(
            dest.x + forwardX * sc.walkDistance, 
            dest.y + forwardY * sc.walkDistance, 
            dest.z
        )

        local cam = previewCam
        if not cam then
            cam = CreateCam('DEFAULT_SCRIPTED_CAMERA', true)
        end

        local startHeight = sc.heightOffsetStart or 15.0
        local endHeight = sc.heightOffsetEnd or 1.0

        local startPos = vector3(dest.x, dest.y, dest.z + startHeight)
        local endPos = vector3(dest.x, dest.y, dest.z + endHeight)


        SetCamCoord(cam, startPos.x, startPos.y, startPos.z)
        SetCamRot(cam, -85.0, 0.0, heading, 2)
        SetCamFov(cam, sc.fov or 60.0)
        RenderScriptCams(true, false, 0, true, false)

        DoScreenFadeIn(sc.fadeIn or 500)

        TaskGoStraightToCoord(ped, walkTo.x, walkTo.y, walkTo.z, 1.0, sc.descentTime, heading, 0.0)

        local animTime = math.max(sc.descentTime or 1000, 100) 
        local startTime = GetGameTimer()
        local endTime = startTime + animTime

        while GetGameTimer() < endTime do
            local now = GetGameTimer()
            local t = (now - startTime) / animTime
            if t > 1.0 then t = 1.0 end

            local x = startPos.x + (endPos.x - startPos.x) * t
            local y = startPos.y + (endPos.y - startPos.y) * t
            local z = startPos.z + (endPos.z - startPos.z) * t
            SetCamCoord(cam, x, y, z)

            local currentPitch = -85.0 + t * 35.0
            SetCamRot(cam, currentPitch, 0.0, heading, 2)

            Citizen.Wait(0)
        end

        SetCamCoord(cam, endPos.x, endPos.y, endPos.z)
        SetCamRot(cam, -30.0, 0.0, heading, 2)
        Citizen.Wait(200)


        local blendTime = sc.transitionTime or sc.fadeOut or 1000
        RenderScriptCams(false, true, blendTime, true, false)
        Citizen.Wait(blendTime)
        DestroyCam(cam, false)
        previewCam = nil
    end

    setUIActive(false)
    cb('ok')
end)


RegisterNUICallback('closeUI', function(data, cb)
    clearPreviewCam()
    setUIActive(false)
    cb('ok')
end)