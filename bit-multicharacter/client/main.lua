local playerId = PlayerId()
local cam = nil
local charPed = nil
local lastPreviewData = nil
local spawned = false
local hidingPlayers = false
local Characters = {}
local nuiReady = false
local pendingUIData = nil
local mp_m_freemode_01 = `mp_m_freemode_01`
local mp_f_freemode_01 = `mp_f_freemode_01`
local currentScenarioKey = 'default'
local loadedIPLs = {} 


local function directSpawnSelector()
    if Config.EnableSpawnSelector then
        local state = GetResourceState('bit-spawn')

        if state == 'started' then
            TriggerEvent('bit-spawn:openSelector')
            return true
        end
    end
    
    return false
end

local function GetScenarioConfig(key)
    local k = key and type(key) == 'string' and key:lower() or 'default'
    if Config.InteractiveScenarios and Config.InteractiveScenarios[k] then
        return Config.InteractiveScenarios[k]
    end
    for _, v in pairs(Config.InteractiveScenarios or {}) do
        return v
    end
    return nil
end

local function GetCurrentScenario()
    return GetScenarioConfig(currentScenarioKey)
end

local function GetDefaultScenario()
    return GetScenarioConfig('default')
end

local function AnimateCameraToPosition(targetCoords, duration)
    local defScn = GetDefaultScenario()
    if not Config.EnableCameraAnimation or not cam or not DoesCamExist(cam) then
        if cam and DoesCamExist(cam) then
            SetCamCoord(cam, targetCoords.x, targetCoords.y, targetCoords.z)
            local finalPitch = defScn and defScn.camRot or 0.0
            local finalYaw = targetCoords.w or 0.0
            SetCamRot(cam, finalPitch, 0.0, finalYaw, 2)
        end
        return
    end
    
    duration = duration or 2000
    
    Citizen.CreateThread(function()
        local startCoords = GetCamCoord(cam)
        local startRot = GetCamRot(cam, 2)
        local startTime = GetGameTimer()
        
        if not targetCoords.x or not targetCoords.y or not targetCoords.z then
            return
        end
        
        while GetGameTimer() - startTime < duration do            
            local progress = (GetGameTimer() - startTime) / duration
            local easeProgress = progress * progress * (3.0 - 2.0 * progress) 
            
            local currentX = startCoords.x + (targetCoords.x - startCoords.x) * easeProgress
            local currentY = startCoords.y + (targetCoords.y - startCoords.y) * easeProgress
            local currentZ = startCoords.z + (targetCoords.z - startCoords.z) * easeProgress
            
            SetCamCoord(cam, currentX, currentY, currentZ)
            
            local targetPitch = defScn and defScn.camRot or 0.0
            local targetYaw = targetCoords.w or 0.0
            if startRot then
                local currentPitch = startRot.x + (targetPitch - startRot.x) * easeProgress
                local currentYaw = startRot.z + (targetYaw - startRot.z) * easeProgress
                SetCamRot(cam, currentPitch, 0.0, currentYaw, 2)
            end
            
            Wait(16) 
        end
        
        if cam and DoesCamExist(cam) then
            SetCamCoord(cam, targetCoords.x, targetCoords.y, targetCoords.z)
            local finalPitch = defScn and defScn.camRot or 0.0
            local finalYaw = targetCoords.w or 0.0
            SetCamRot(cam, finalPitch, 0.0, finalYaw, 2)
            
            CreateThread(function()
                Wait(100)
                SetFocusArea(targetCoords.x, targetCoords.y, targetCoords.z, 0.0, 0.0, 0.0)
                Wait(300)
                ClearFocus()
            end)
        end
    end)
end

CreateThread(function()
    while true do
        if NetworkIsPlayerActive(playerId) then
            Wait(500)
            TriggerEvent('bit-multicharacter:client:chooseChar')
            break
        end
        Wait(500)
    end
end)

local function spawnPlayer(model, coords, heading, cb)
    local ped = PlayerPedId()
    
    if model and GetHashKey(model) ~= GetEntityModel(ped) then
        RequestModel(GetHashKey(model))
        while not HasModelLoaded(GetHashKey(model)) do
            Wait(0)
        end
        SetPlayerModel(PlayerId(), GetHashKey(model))
        SetModelAsNoLongerNeeded(GetHashKey(model))
        ped = PlayerPedId()
    end
    
    SetEntityCoords(ped, coords.x, coords.y, coords.z, false, false, false, true)
    SetEntityHeading(ped, heading or coords.w or coords.heading or 0.0)
    FreezeEntityPosition(ped, false)
    SetEntityVisible(ped, true, false)
    
    if cam then
        SetCamActive(cam, false)
        RenderScriptCams(false, false, 1, true, true)
        DestroyCam(cam, true)
        cam = nil
    end
    
    if cb then
        cb()
    end
end

local function ApplyCharacterSkin(ped, data)
    if not data or not data.skin then return end
    
    if Config.AppearanceSystem:lower() == "illenium" then
        local skin = type(data.skin) == 'string' and json.decode(data.skin) or data.skin
        if skin then
            exports['illenium-appearance']:setPedAppearance(ped, skin)
        end
    else
        if Config.Framework == "esx" then
            local skin = type(data.skin) == 'string' and json.decode(data.skin) or data.skin
            if skin then
                if skin.tshirt_1 then SetPedComponentVariation(ped, 8, skin.tshirt_1, skin.tshirt_2 or 0, 0) end
                if skin.torso_1 then SetPedComponentVariation(ped, 11, skin.torso_1, skin.torso_2 or 0, 0) end
                if skin.decals_1 then SetPedComponentVariation(ped, 10, skin.decals_1, skin.decals_2 or 0, 0) end
                if skin.arms then SetPedComponentVariation(ped, 3, skin.arms, skin.arms_2 or 0, 0) end
                if skin.pants_1 then SetPedComponentVariation(ped, 4, skin.pants_1, skin.pants_2 or 0, 0) end
                if skin.shoes_1 then SetPedComponentVariation(ped, 6, skin.shoes_1, skin.shoes_2 or 0, 0) end
                if skin.mask_1 then SetPedComponentVariation(ped, 1, skin.mask_1, skin.mask_2 or 0, 0) end
                if skin.bproof_1 then SetPedComponentVariation(ped, 9, skin.bproof_1, skin.bproof_2 or 0, 0) end
                if skin.chain_1 then SetPedComponentVariation(ped, 7, skin.chain_1, skin.chain_2 or 0, 0) end
                if skin.bags_1 then SetPedComponentVariation(ped, 5, skin.bags_1, skin.bags_2 or 0, 0) end
                
                if skin.helmet_1 then
                    if skin.helmet_1 == -1 then
                        ClearPedProp(ped, 0)
                    else
                        SetPedPropIndex(ped, 0, skin.helmet_1, skin.helmet_2 or 0, true)
                    end
                end
                if skin.glasses_1 then
                    if skin.glasses_1 == -1 then
                        ClearPedProp(ped, 1)
                    else
                        SetPedPropIndex(ped, 1, skin.glasses_1, skin.glasses_2 or 0, true)
                    end
                end
                if skin.watches_1 then
                    if skin.watches_1 == -1 then
                        ClearPedProp(ped, 6)
                    else
                        SetPedPropIndex(ped, 6, skin.watches_1, skin.watches_2 or 0, true)
                    end
                end
                if skin.bracelets_1 then
                    if skin.bracelets_1 == -1 then
                        ClearPedProp(ped, 7)
                    else
                        SetPedPropIndex(ped, 7, skin.bracelets_1, skin.bracelets_2 or 0, true)
                    end
                end
                
                if skin.face then SetPedHeadBlendData(ped, skin.face, skin.face, skin.face, skin.face, skin.face, skin.face, 0.0, 0.0, 0.0, false) end
                if skin.hair_1 then SetPedComponentVariation(ped, 2, skin.hair_1, skin.hair_2 or 0, 0) end
                if skin.hair_color_1 then SetPedHairColor(ped, skin.hair_color_1, skin.hair_color_2 or 0) end
                if skin.eye_color then SetPedEyeColor(ped, skin.eye_color) end
                if skin.beard_1 then SetPedHeadOverlay(ped, 1, skin.beard_1, (skin.beard_2 and skin.beard_2 / 10.0) or 1.0) end
                if skin.beard_3 then SetPedHeadOverlayColor(ped, 1, 1, skin.beard_3, skin.beard_4 or 0) end
                if skin.eyebrows_1 then SetPedHeadOverlay(ped, 2, skin.eyebrows_1, (skin.eyebrows_2 and skin.eyebrows_2 / 10.0) or 1.0) end
                if skin.eyebrows_3 then SetPedHeadOverlayColor(ped, 2, 1, skin.eyebrows_3, skin.eyebrows_4 or 0) end
                if skin.makeup_1 then SetPedHeadOverlay(ped, 4, skin.makeup_1, (skin.makeup_2 and skin.makeup_2 / 10.0) or 1.0) end
                if skin.makeup_3 then SetPedHeadOverlayColor(ped, 4, 1, skin.makeup_3, skin.makeup_4 or 0) end
                if skin.lipstick_1 then SetPedHeadOverlay(ped, 8, skin.lipstick_1, (skin.lipstick_2 and skin.lipstick_2 / 10.0) or 1.0) end
                if skin.lipstick_3 then SetPedHeadOverlayColor(ped, 8, 1, skin.lipstick_3, skin.lipstick_4 or 0) end
                if skin.blemishes_1 then SetPedHeadOverlay(ped, 0, skin.blemishes_1, (skin.blemishes_2 and skin.blemishes_2 / 10.0) or 1.0) end
                if skin.age_1 then SetPedHeadOverlay(ped, 3, skin.age_1, (skin.age_2 and skin.age_2 / 10.0) or 1.0) end
                if skin.complexion_1 then SetPedHeadOverlay(ped, 6, skin.complexion_1, (skin.complexion_2 and skin.complexion_2 / 10.0) or 1.0) end
                if skin.sun_1 then SetPedHeadOverlay(ped, 7, skin.sun_1, (skin.sun_2 and skin.sun_2 / 10.0) or 1.0) end
                if skin.moles_1 then SetPedHeadOverlay(ped, 9, skin.moles_1, (skin.moles_2 and skin.moles_2 / 10.0) or 1.0) end
                if skin.chest_1 then SetPedHeadOverlay(ped, 10, skin.chest_1, (skin.chest_2 and skin.chest_2 / 10.0) or 1.0) end
                if skin.chest_3 then SetPedHeadOverlayColor(ped, 10, 1, skin.chest_3, skin.chest_4 or 0) end
                if skin.bodyb_1 then SetPedHeadOverlay(ped, 11, skin.bodyb_1, (skin.bodyb_2 and skin.bodyb_2 / 10.0) or 1.0) end
                if skin.bodyb_3 then SetPedHeadOverlayColor(ped, 11, 1, skin.bodyb_3, skin.bodyb_4 or 0) end
            end
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            local skin = type(data.skin) == 'string' and json.decode(data.skin) or data.skin
            TriggerEvent('qb-clothing:client:loadPlayerClothing', skin, ped)
        end
    end
end

local function CreateCharacterPed(data, coords)
    if charPed and DoesEntityExist(charPed) then
        DeleteEntity(charPed)
        charPed = nil
    end
    
    if Config.ClearPedCache then
        Wait(100) 
    end
    
    if not data and not lastPreviewData then return end
    
    local useData = data or lastPreviewData
    local currentScn = GetCurrentScenario() or GetDefaultScenario()
    local spawnCoords = coords or (currentScn and currentScn.coord) or Config.PedCoords

    if Config.Framework == "esx" and useData and useData.sex == nil and useData.gender ~= nil then
        if type(useData.gender) == 'string' then
            local g = string.lower(useData.gender)
            useData.sex = (g == 'female' or g == 'f') and 'f' or 'm'
        elseif type(useData.gender) == 'number' then
            useData.sex = (useData.gender == 1) and 'f' or 'm'
        end
    end
    
    local model = mp_m_freemode_01
    if Config.Framework == "esx" then
        model = (useData.sex == 'f') and mp_f_freemode_01 or mp_m_freemode_01
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        if useData.model then
            model = useData.model
        else
            model = (useData.charinfo and useData.charinfo.gender == 1) and mp_f_freemode_01 or mp_m_freemode_01
        end
    end
    
    local modelHash
    if type(model) == 'string' then
        modelHash = GetHashKey(model)
    else
        modelHash = model
    end
    
    RequestCollisionAtCoord(spawnCoords.x, spawnCoords.y, spawnCoords.z)
    SetFocusArea(spawnCoords.x, spawnCoords.y, spawnCoords.z, 0.0, 0.0, 0.0)

    RequestModel(modelHash)
    while not HasModelLoaded(modelHash) do
        Wait(10)
    end
    
    local groundZ = spawnCoords.z
    local heading = (spawnCoords and (spawnCoords.w or spawnCoords.heading)) or 0.0

    local found, finalZ = GetGroundZFor_3dCoord(spawnCoords.x, spawnCoords.y, spawnCoords.z + 5.0, false)
    if found then groundZ = finalZ end

    charPed = CreatePed(4, modelHash, spawnCoords.x, spawnCoords.y, groundZ, heading, false, false)
    SetEntityAsMissionEntity(charPed, true, true)
    SetBlockingOfNonTemporaryEvents(charPed, true)
    SetEntityInvincible(charPed, true)
    
    CreateThread(function()
        Wait(100)
        if charPed and DoesEntityExist(charPed) then
            SetEntityHeading(charPed, heading)
        end
    end)
    
    FreezeEntityPosition(charPed, true)
    
    if useData.skin then
        ApplyCharacterSkin(charPed, useData)
    end
    
    SetModelAsNoLongerNeeded(modelHash)
    
    CreateThread(function()
        Wait(400)
        ClearFocus()
    end)
end

local function SetupCamera()
    if cam then
        DestroyCam(cam, false)
        cam = nil
    end
    
    local defScn = GetCurrentScenario() 
    local startPos = nil
    if Config.EnableCameraAnimation then
        startPos = (defScn and defScn.cam) or (defScn and defScn.coord) or Config.DefaultCameraStart or Config.CamCoords
    else
        startPos = (defScn and defScn.cam) or (defScn and defScn.coord) or Config.CamCoords
    end

    local camPitch = defScn and defScn.camRot or 0.0
    local camYaw = 0.0
    
    if defScn and defScn.cam and defScn.cam.w then
        camYaw = defScn.cam.w
    elseif startPos.w then
        camYaw = startPos.w
    end

    cam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', startPos.x, startPos.y, startPos.z, camPitch, 0.0, camYaw, 60.00, false, 0)
    SetCamActive(cam, true)
    RenderScriptCams(true, false, 1, true, true)

    if Config.EnableCameraAnimation then
        Citizen.SetTimeout(500, function()
            local camTarget = (defScn and defScn.cam) or (defScn and defScn.coord) or Config.CamCoords
            AnimateCameraToPosition(camTarget, 2500)
        end)
    end
end

local function UpdateCameraTarget(targetCoords)
    if cam and DoesCamExist(cam) and targetCoords then
        local defScn = GetCurrentScenario()  
        local camPitch = defScn and defScn.camRot or 0.0
        local camYaw = 0.0
        
        if defScn and defScn.cam and defScn.cam.w then
            camYaw = defScn.cam.w
        else
            local camTarget = (defScn and defScn.coord) or Config.CamCoords
            camYaw = camTarget and camTarget.w or 0.0
        end
        
        SetCamRot(cam, camPitch, 0.0, camYaw, 2)
    end
end

local function LoadArea(coords)
    if not coords then return end
    
    RequestCollisionAtCoord(coords.x, coords.y, coords.z)
    SetFocusArea(coords.x, coords.y, coords.z, 0.0, 0.0, 0.0)

    local playerPed = PlayerPedId()
    SetEntityCoords(playerPed, coords.x, coords.y, coords.z - 50.0, false, false, false, true)
    SetEntityVisible(playerPed, false, false)
    SetEntityAlpha(playerPed, 0, false)
    FreezeEntityPosition(playerPed, true)
end

local function DestroyCamera()
    if cam then
        SetCamActive(cam, false)
        DestroyCam(cam, true)
        RenderScriptCams(false, false, 1, true, true)
        cam = nil
    end
end

local function LoadIPLs(iplList)
    if not iplList then return end
    
    local newIPLsLoaded = false
    
    for _, ipl in ipairs(iplList) do
        if not loadedIPLs[ipl] then
            RequestIpl(ipl)
            loadedIPLs[ipl] = true
            newIPLsLoaded = true
        end
    end
    
    if newIPLsLoaded then
        Wait(1000)
    end
end

local function PlayScenarioAnimation(scenarioKey)
    if not scenarioKey or not charPed or not DoesEntityExist(charPed) then return end
    local key = type(scenarioKey) == 'string' and scenarioKey:lower() or 'default'
    local scenarioConfig = Config.InteractiveScenarios[key]
    if not scenarioConfig then return end

    currentScenarioKey = key

    local finalHeading = nil
    if scenarioConfig.coord and scenarioConfig.coord.w then
        finalHeading = scenarioConfig.coord.w
    end

    if finalHeading then
        FreezeEntityPosition(charPed, false)
        SetEntityHeading(charPed, finalHeading)
        Wait(100) 
        FreezeEntityPosition(charPed, true)
    end

    if scenarioConfig.activities and scenarioConfig.activities[1] then
        local activity = scenarioConfig.activities[1]
        
        if activity.anim and activity.anim.dict and activity.anim.name then
            RequestAnimDict(activity.anim.dict)
            local timeout = GetGameTimer() + 3000
            while not HasAnimDictLoaded(activity.anim.dict) do
                if GetGameTimer() > timeout then break end
                Wait(10)
            end
            TaskPlayAnim(charPed, activity.anim.dict, activity.anim.name, 8.0, 8.0, -1, 1, 0, false, false, false)
        end
    end
    
    if cam and DoesCamExist(cam) then
        UpdateCameraTarget(scenarioConfig.coord or scenarioConfig.cam)
    end
end

local function CleanupIPLs()
    for ipl, _ in pairs(loadedIPLs) do
        RemoveIpl(ipl)
    end
    loadedIPLs = {}
end

local function CleanupMulticharacter()
    ClearFocus()
    CleanupIPLs()
    currentScenarioKey = 'default'
    local playerPed = PlayerPedId()
    SetEntityCoords(playerPed, Config.HiddenCoords.x, Config.HiddenCoords.y, Config.HiddenCoords.z - 50.0, false, false, false, true)
    SetEntityVisible(playerPed, false, false)
    SetEntityAlpha(playerPed, 0, false)
end

local function HidePlayer()
    local playerPed = PlayerPedId()
    local defScn = GetDefaultScenario()
    local hidden = (defScn and defScn.hidden) or Config.HiddenCoords
    SetEntityCoords(playerPed, hidden.x, hidden.y, hidden.z - 50.0, false, false, false, true)
    SetEntityHeading(playerPed, hidden.w)
    FreezeEntityPosition(playerPed, true)
    SetEntityVisible(playerPed, false, false)
    SetEntityAlpha(playerPed, 0, false) 
    SetEntityCollision(playerPed, false, false) 
end

local function startLoop()
    if hidingPlayers then return end
    hidingPlayers = true
    
    MumbleSetVolumeOverride(playerId, 0.0)
    
    CreateThread(function()
        local keysToKeepEnabled = { 18, 27, 172, 173, 174, 175, 176, 177, 187, 188, 191, 201, 108, 109 }
        local playerPedId
        
        while hidingPlayers do
            playerPedId = PlayerPedId()
            
            SetEntityVisible(playerPedId, false, false)
            SetEntityAlpha(playerPedId, 0, false)
            SetLocalPlayerVisibleLocally(true)
            SetPlayerInvincible(playerId, true)
            
            ThefeedHideThisFrame()
            HideHudComponentThisFrame(11)
            HideHudComponentThisFrame(12)
            HideHudComponentThisFrame(21)
            HideHudAndRadarThisFrame()
            
            DisableAllControlActions(0)
            
            for i = 1, #keysToKeepEnabled do
                EnableControlAction(0, keysToKeepEnabled[i], true)
            end
            
            local players = GetActivePlayers()
            for i = 1, #players do
                local player = players[i]
                if player ~= playerId then
                    NetworkConcealPlayer(player, true, true)
                end
            end
            
            local vehicles = GetGamePool("CVehicle")
            for i = 1, #vehicles do
                SetEntityLocallyInvisible(vehicles[i])
            end
            
            Wait(0)
        end
        
        MumbleSetVolumeOverride(playerId, -1.0)
        SetEntityVisible(playerPedId, true, false)
        SetPlayerInvincible(playerId, false)
        FreezeEntityPosition(playerPedId, false)
    end)
end

function setupCharacter(index)
    if not Characters[index] then return end
    
    local defScn = GetDefaultScenario()
    local defCoord = defScn and defScn.coord
    spawnPlayer(Characters[index].model or mp_m_freemode_01, defCoord or Config.PedCoords, (defCoord and defCoord.w) or Config.PedCoords.w)
    
    if Characters[index] then
        local skin = Characters[index].skin or Config.Default
        
        if not Characters[index].model then
            if Config.Framework == "esx" then
                if Characters[index].sex == 'f' then skin.sex = 1 else skin.sex = 0 end
            elseif Config.Framework == "qb" or Config.Framework == "qbox" then
                if Characters[index].charinfo and Characters[index].charinfo.gender == 1 then
                    skin.sex = 1
                else
                    skin.sex = 0
                end
            end
        end
        
        if Config.Framework == "esx" then
            TriggerEvent("skinchanger:loadSkin", skin)
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            TriggerEvent('qb-clothing:client:loadPlayerClothing', Characters[index], PlayerPedId())
        end
    end
    
    DoScreenFadeIn(500)
    while not IsScreenFadedIn() do Wait(0) end
    
    spawned = index
    local playerPedId = PlayerPedId()
    
    FreezeEntityPosition(playerPedId, true)
    SetPedAoBlobRendering(playerPedId, true)
    SetEntityAlpha(playerPedId, 255, false)
end


RegisterNetEvent('bit-multicharacter:client:chooseChar', function()
    DoScreenFadeOut(0)
    Wait(500)
    
    spawned = false
    nuiReady = false
    pendingUIData = nil
    
    HidePlayer()
    SetupCamera()
    
    local defaultScenario = GetDefaultScenario()
    LoadArea((defaultScenario and defaultScenario.coord) or Config.PedCoords)
    if defaultScenario and defaultScenario.ipls then
        LoadIPLs(defaultScenario.ipls)
    end
    
    local interiorCoords = (defaultScenario and defaultScenario.coord) or Config.Interior
    local interior = GetInteriorAtCoords(interiorCoords.x, interiorCoords.y, interiorCoords.z)
    LoadInterior(interior)
    while not IsInteriorReady(interior) do
        Wait(1000)
    end
    
    DoScreenFadeIn(1000)
    startLoop()
    
    ShutdownLoadingScreen()
    ShutdownLoadingScreenNui()
    
    TriggerEvent("esx:loadingScreenOff")
    TriggerServerEvent("bit-multicharacter:server:loadUserData")
end)

RegisterNetEvent('bit-multicharacter:client:showUI', function(characters, maxChars)
    Characters = {}
    
    for i = 1, #characters do
        local char = characters[i]
        if Config.Framework == "esx" then
            Characters[char.slot or i] = char
        elseif Config.Framework == "qb" or Config.Framework == "qbox" then
            Characters[char.cid or i] = char
        end
    end
    
    SetNuiFocus(true, true)
    
    local uiData = {
        action = 'setupUI',
        characters = characters,
        maxCharacters = maxChars or Config.DefaultNumberOfCharacters,
        locales = Config.Locales[Config.DefaultLanguage or 'en'],
        countries = Config.Countries,
        scenarios = Config.InteractiveScenarios
    }
    
    if nuiReady then
        SendNUIMessage(uiData)
    else
        pendingUIData = uiData
    end
end)

RegisterNUICallback('selectCharacter', function(data, cb)
    local charData = data.characterData
    
    if not charData then
        cb('ok')
        return
    end

    DoScreenFadeOut(500)
    Wait(500)
    
    SetNuiFocus(false, false)
    SendNUIMessage({
        action = 'closeUI'
    })
    
    DestroyCamera()
    CleanupMulticharacter()
    
    if charPed then
        DeleteEntity(charPed)
    end
    
    hidingPlayers = false
    
     if Config.Framework == "esx" then
        TriggerServerEvent('bit-multicharacter:server:loadCharacter', charData.identifier)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        TriggerServerEvent('bit-multicharacter:server:loadCharacter', charData.citizenid)
    end
    
    CreateThread(function()
        Wait(2000)

        if directSpawnSelector() then
            
        end
    end)
    
    cb('ok')
end)

RegisterNUICallback('createCharacter', function(data, cb)
    DoScreenFadeOut(500)
    Wait(500)
    
    SetNuiFocus(false, false)
    DestroyCamera()
    CleanupMulticharacter()
    
    if charPed then
        DeleteEntity(charPed)
    end
    
    hidingPlayers = false
    
    TriggerServerEvent('bit-multicharacter:server:createCharacter', data)
    cb('ok')
end)

RegisterNUICallback('deleteCharacter', function(data, cb)
    TriggerServerEvent('bit-multicharacter:server:deleteCharacter', data.characterId)
    cb('ok')
end)

RegisterNUICallback('nuiReady', function(_, cb)
    nuiReady = true
    
    if pendingUIData then
        SendNUIMessage(pendingUIData)
        pendingUIData = nil
    end
    
    cb('ok')
end)

RegisterNUICallback('previewCharacter', function(data, cb)
    if charPed and DoesEntityExist(charPed) then
        DeleteEntity(charPed)
        charPed = nil
    end
    
    if data.characterData then
        lastPreviewData = data.characterData
        
        local scenarioKey = (data.currentScenario and type(data.currentScenario) == 'string') and data.currentScenario:lower() or 'default'
        local scenarioConfig = GetScenarioConfig(scenarioKey)
        local defaultScn = GetDefaultScenario()
        local coords = (scenarioConfig and scenarioConfig.coord) or ((defaultScn and defaultScn.coord) or Config.PedCoords)

        if scenarioKey ~= currentScenarioKey then
            currentScenarioKey = scenarioKey
            if scenarioConfig and scenarioConfig.ipls then
                LoadIPLs(scenarioConfig.ipls)
            end
        end
        
        LoadArea(coords)
        UpdateCameraTarget(coords)
        
        local attempts = 0
        local function tryCreate()
            attempts = attempts + 1
            CreateCharacterPed(data.characterData, coords)
            if not charPed or not DoesEntityExist(charPed) then
                if attempts < 3 then
                    Citizen.SetTimeout(250, tryCreate)
                end
            else
                PlayScenarioAnimation(scenarioKey)
            end
        end
        tryCreate()
    else
        lastPreviewData = nil
    end
    cb('ok')
end)

RegisterNUICallback('setWeather', function(data, cb)
    local weather = data.weather or 'CLEAR'
    SetWeatherTypeNowPersist(weather)
    cb('ok')
end)

RegisterNUICallback('setScenario', function(data, cb)
    local scenario = data.scenario or 'DEFAULT'
    local scenarioConfig = GetScenarioConfig(scenario:lower())

    DoScreenFadeOut(500)
    while not IsScreenFadedOut() do Wait(10) end
    
    if charPed and DoesEntityExist(charPed) then
        DeleteEntity(charPed)
        charPed = nil
    end
    
    if scenarioConfig and scenario:upper() ~= 'DEFAULT' then
        TriggerServerEvent('bit-multicharacter:server:setRoutingBucket', true)
        
        currentScenarioKey = scenario:lower()

        local coords = scenarioConfig.coord
        local camCoords = scenarioConfig.cam
        
        if scenarioConfig.ipls then
            LoadIPLs(scenarioConfig.ipls)
        end
        
        LoadArea(coords)
        
        if cam and DoesCamExist(cam) then
            SetCamCoord(cam, camCoords.x, camCoords.y, camCoords.z)
            local camPitch = scenarioConfig.camRot or 0.0
            SetCamRot(cam, camPitch, 0.0, camCoords.w or 0.0, 2)
            UpdateCameraTarget(coords)
        end
        
        Wait(1000)
        
        if lastPreviewData then
            CreateCharacterPed(lastPreviewData, coords)
        end
        
        PlayScenarioAnimation(scenario)
        
    else
        TriggerServerEvent('bit-multicharacter:server:setRoutingBucket', false)
        
        currentScenarioKey = 'default'
        
        local defaultScn = Config.InteractiveScenarios and Config.InteractiveScenarios['default']
        if defaultScn and defaultScn.ipls then
            LoadIPLs(defaultScn.ipls)
        end

        local defScn = GetDefaultScenario()
        LoadArea((defScn and defScn.coord) or Config.PedCoords)
        
        if cam and DoesCamExist(cam) then
            local camC = (defScn and defScn.cam) or Config.CamCoords
            SetCamCoord(cam, camC.x, camC.y, camC.z)
            local camPitch = defScn and defScn.camRot or 0.0
            SetCamRot(cam, camPitch, 0.0, camC.w or 0.0, 2)
            UpdateCameraTarget((defScn and defScn.coord) or Config.PedCoords)
        end
        
        Wait(1000)
        
        if lastPreviewData then
            local __def = GetDefaultScenario()
            CreateCharacterPed(lastPreviewData, (__def and __def.coord) or Config.PedCoords)
            PlayScenarioAnimation('default')
        end
    end
    
    DoScreenFadeIn(500)
    cb('ok')
end)

RegisterNUICallback('createDefaultPed', function(data, cb)
    local gender = data.gender or 'male'
    local model = gender == 'female' and mp_f_freemode_01 or mp_m_freemode_01
    
    if charPed and DoesEntityExist(charPed) then
        ClearPedTasksImmediately(charPed)
        DeleteEntity(charPed)
        charPed = nil
    end
    
    local defaultAppearance = {
        model = model,
        components = {},
        props = {},
        headBlend = {
            shapeFirst = 0,
            shapeSecond = 0,
            skinFirst = 0,
            skinSecond = 0,
            shapeMix = 0.5,
            skinMix = 0.5
        },
        faceFeatures = {},
        headOverlays = {},
        eyeColor = 0,
        hairColor = {
            color = 1,
            highlight = 1
        }
    }
    
    local __def = GetDefaultScenario()
    CreateCharacterPed(defaultAppearance, (__def and __def.coord) or Config.PedCoords)
    
    cb('ok')
end)

RegisterNUICallback('updatePedGender', function(data, cb)
    local gender = data.gender or 'male'
    local model = gender == 'female' and mp_f_freemode_01 or mp_m_freemode_01
    
    local defaultAppearance = {
        model = model,
        components = {},
        props = {},
        headBlend = {
            shapeFirst = 0,
            shapeSecond = 0,
            skinFirst = 0,
            skinSecond = 0,
            shapeMix = 0.5,
            skinMix = 0.5
        },
        faceFeatures = {},
        headOverlays = {},
        eyeColor = 0,
        hairColor = {
            color = 1,
            highlight = 1
        }
    }
    
    local __current = GetCurrentScenario()
    local spawnCoords = (__current and __current.coord) or Config.PedCoords

    CreateCharacterPed(defaultAppearance, spawnCoords)
    
    local currentScenario = data.scenario or currentScenarioKey or 'default'
    
    if currentScenario and currentScenario ~= '' then
        CreateThread(function()
            Wait(500)
            
            if charPed and DoesEntityExist(charPed) then
                PlayScenarioAnimation(currentScenario)
            end
        end)
    end
    
    cb('ok')
end)

if Config.Framework == "esx" then
    AddEventHandler("esx:playerLoaded", function(xPlayer, isNew, skin)

        hidingPlayers = false
        spawned = true
        Characters = {}
        
    end)
    
    AddEventHandler("esx:onPlayerLogout", function()
        DoScreenFadeOut(1000)
        spawned = false
        TriggerEvent("bit-multicharacter:client:chooseChar")
        TriggerEvent("esx_skin:resetFirstSpawn")
    end)
    
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
        hidingPlayers = false
        spawned = false
        
        DoScreenFadeIn(1000)
        
        Wait(2000)
        
        if Config.EnableSpawnSelector then
            TriggerEvent('bit-spawn:openSelector')
        end
    end)

end

RegisterCommand("logout", function()
    if Config.Framework == "esx" then
        TriggerServerEvent("esx:onPlayerLogout")
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        TriggerServerEvent("qb-multicharacter:server:logout")
    end
end, false)