local Camera = {
    PreviewFPS = 45,
}

local isCameraActive = false

Citizen.CreateThread(function()
    local playerPed = PlayerPedId()
    SetEntityVisible(playerPed, true, false)
    DisplayRadar(true)
    SetMinimapHideFow(false)
end)


local camera = nil
local previewThread = nil
local previewEnabled = false
local photoProvider = string.lower(Config.PhotoProvider or '')
if photoProvider == 'screenshot' then photoProvider = 'screenshot-basic' end
local currentMode = "back"
local frameCount = 0
local lastFrameTime = 0
local mouseXRotation = 0.0
local mouseYRotation = 0.0
local sensitivity = 0.1

local function getFrameDelay()
    return math.floor(1000 / Camera.PreviewFPS)
end

local function setupCamera(mode, ped)
    if not camera or not DoesCamExist(camera) or not ped then return end
    
    if mode == "front" then
        AttachCamToEntity(camera, ped, 0.0, 0.8, 0.6, true)
        SetCamFov(camera, 45.0)

        local heading = GetEntityHeading(ped)
        local pitch = GetEntityPitch(ped)
        SetCamRot(camera, pitch - 5.0, 0.0, heading + 180.0, 2)
        local headPos = GetPedBoneCoords(ped, 31086, 0.0, 0.0, 0.0)
        PointCamAtCoord(camera, headPos.x, headPos.y, headPos.z)
    else
        AttachCamToEntity(camera, ped, 0.0, 0.0, 0.6, true)
        local pitch = GetEntityPitch(ped)
        SetCamRot(camera, pitch, 0.0, GetEntityHeading(ped), 2)
        SetCamFov(camera, 60.0)
    end
    
    mouseXRotation = 0.0
    mouseYRotation = 0.0
end


local function updateCameraRotation(deltaX, deltaY)
    if not camera or not DoesCamExist(camera) then return end
    
    mouseXRotation = mouseXRotation + (deltaX * sensitivity)
    mouseYRotation = mouseYRotation - (deltaY * sensitivity)
    
    mouseYRotation = math.max(-45.0, math.min(45.0, mouseYRotation))
    
    local playerPed = PlayerPedId()
    local baseHeading = GetEntityHeading(playerPed)
    local basePitch = GetEntityPitch(playerPed)
    
    if currentMode == "front" then
        local finalPitch = basePitch - 5.0 + mouseYRotation
        local finalHeading = baseHeading + 180.0 + mouseXRotation
        
        SetCamRot(camera, finalPitch, 0.0, finalHeading, 2)
        
        local headBone = GetPedBoneCoords(playerPed, 31086, 0.0, 0.0, 0.0)
        PointCamAtCoord(camera, headBone.x, headBone.y, headBone.z)
    else
        SetCamRot(camera, basePitch + mouseYRotation, 0.0, baseHeading + mouseXRotation, 2)
    end
end

local function startCameraPreview(mode)
    if isCameraActive then return end
    
    currentMode = mode or "back"
    camera = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    
    local playerPed = PlayerPedId()
    setupCamera(currentMode, playerPed)

    if currentMode == "front" then
        SetEntityVisible(playerPed, true, false)  
    else
        SetEntityVisible(playerPed, false, false) 
    end
    DisplayRadar(false)
    SetMinimapHideFow(true)

    RenderScriptCams(true, false, 0, true, true)
    isCameraActive = true
    previewEnabled = true
    frameCount = 0
    lastFrameTime = GetGameTimer()
    
    if previewThread then
        previewThread = nil
    end
    
    previewThread = Citizen.CreateThread(function()
        local frameDelay = getFrameDelay()
        
        while previewEnabled and isCameraActive do
            local currentTime = GetGameTimer()
            
            if currentTime - lastFrameTime >= frameDelay then
            if exports[photoProvider] and exports[photoProvider].requestScreenshot then
                exports[photoProvider]:requestScreenshot(function(url)
                        if previewEnabled and url then
                            frameCount = frameCount + 1
                            
                            SendNUIMessage({
                                action = "camera:preview_frame",
                                imageData = url,
                                mode = currentMode,
                                frameNumber = frameCount,
                                timestamp = currentTime
                            })
                        end
                    end)
                    
                    lastFrameTime = currentTime
                end
            end
            
            Citizen.Wait(10)
        end
    end)
    
    SendNUIMessage({
        action = "camera:start_preview",
        success = true,
        config = {
            fps = Camera.PreviewFPS
        }
    })
end

local function stopCameraPreview()
    if not isCameraActive then return end

    previewEnabled = false
    
    if previewThread then
        previewThread = nil
    end
    
    local playerPed = PlayerPedId()
    SetEntityVisible(playerPed, true, false)
    DisplayRadar(true)
    SetMinimapHideFow(false)
    
    RenderScriptCams(false, false, 0, true, true)
    if camera and DoesCamExist(camera) then
        DestroyCam(camera, false)
    end
    
    camera = nil
    isCameraActive = false
    
    SendNUIMessage({ 
        action = "camera:stop_preview",
        finalFrameCount = frameCount
    })
    
    Citizen.Wait(100)
end

local function captureAndUpload(data, serverEvent, cb)
    local photoId = (data.photoId or ('photo_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)))
    local completed = false
    local timeoutTimer = nil
    local playerPed = PlayerPedId()

    timeoutTimer = Citizen.SetTimeout(15000, function()
        if not completed then
            completed = true
            SetEntityVisible(playerPed, true, false)
            DisplayRadar(true)
            SetMinimapHideFow(false)
            if cb then cb({ success = false, error = 'timeout' }) end
        end
    end)

    local prevPreview = previewEnabled
    local prevMode = currentMode
    
    local cameraMode = nil
    if data and data.mode then
        cameraMode = data.mode
    elseif data and data.metadata and data.metadata.cameraMode then
        cameraMode = data.metadata.cameraMode
    elseif data and data.metadata and data.metadata.facingMode then
        cameraMode = data.metadata.facingMode
    else
        cameraMode = currentMode
    end
    local hidePlayerForCapture = (cameraMode ~= 'front')
    SetEntityVisible(playerPed, not hidePlayerForCapture, false)
    DisplayRadar(false)
    SetMinimapHideFow(true)
    
    previewEnabled = false

    if GetResourceState('screenshot-basic') == 'started' and exports['screenshot-basic'] and exports['screenshot-basic'].requestScreenshotUpload then
        exports['screenshot-basic']:requestScreenshotUpload(Config.DiscordWebhook, 'files[]', function(response)
            if completed then return end
            completed = true
            if timeoutTimer then Citizen.ClearTimeout(timeoutTimer) end

            SetEntityVisible(playerPed, true, false)
            DisplayRadar(true)
            SetMinimapHideFow(false)

            if response and response ~= '' then
                local url = response
                local photoData = {
                    photoId = photoId,
                    photoUrl = url,
                    url = url,
                    photoType = data.photoType or data.type or 'photo',
                    metadata = data.metadata or {},
                    timestamp = GetGameTimer()
                }

                TriggerServerEvent(serverEvent, photoData)

                pcall(function() stopCameraPreview() end)

                if prevPreview then
                    Citizen.SetTimeout(200, function()
                        pcall(function() startCameraPreview(prevMode) end)
                        previewEnabled = true
                    end)
                end

                if cb then cb({ success = true, photoUrl = url, url = url, photoId = photoId }) end
            else
                previewEnabled = prevPreview
                if cb then cb({ success = false, error = 'capture_failed' }) end
            end
        end)
        return
    end

    if Config.PhotoProvider == 'fmsdk' and exports['fmsdk'] and exports['fmsdk'].takeImage then
        local imageData = exports['fmsdk']:takeImage({ name = 'Phone screenshot', description = 'Screenshot from bit-smartphone' })
        
        SetEntityVisible(playerPed, true, false)
        DisplayRadar(true)
        SetMinimapHideFow(false)
        
        if imageData and imageData.url then
            if completed then return end
            completed = true
            if timeoutTimer then Citizen.ClearTimeout(timeoutTimer) end

            local url = imageData.url
            local photoData = {
                photoId = photoId,
                photoUrl = url,
                url = url,
                photoType = data.photoType or data.type or 'photo',
                metadata = data.metadata or {},
                timestamp = GetGameTimer()
            }

            TriggerServerEvent(serverEvent, photoData)
            pcall(function() stopCameraPreview() end)

            if prevPreview then
                Citizen.SetTimeout(200, function()
                    pcall(function() startCameraPreview(prevMode) end)
                    previewEnabled = true
                end)
            end

            if cb then cb({ success = true, photoUrl = url, url = url, photoId = photoId }) end
            return
        else
            previewEnabled = prevPreview
            if cb then cb({ success = false, error = 'fmsdk_error' }) end
            return
        end
    end

    if timeoutTimer then Citizen.ClearTimeout(timeoutTimer) end
    if not completed then completed = true end
    
    SetEntityVisible(playerPed, true, false)
    DisplayRadar(true)
    SetMinimapHideFow(false)
    
    previewEnabled = prevPreview
    if cb then cb({ success = false, error = 'no_screenshot_provider' }) end
end

RegisterNUICallback('camera:start', function(data, cb)
    startCameraPreview(data.mode or "back")
    cb({ success = true })
end)

RegisterNUICallback('camera:stop', function(data, cb)
    stopCameraPreview()
    cb({ success = true })
end)

RegisterNUICallback('camera:switch', function(data, cb)
    local newMode = data.mode or "back"
    currentMode = newMode
    stopCameraPreview()
    Citizen.Wait(100)
    startCameraPreview(newMode)
    cb({ success = true, mode = newMode })
end)

RegisterNUICallback('camera:mouse_move', function(data, cb)
    if camera and DoesCamExist(camera) and isCameraActive then
        local deltaX = data.deltaX or 0
        local deltaY = data.deltaY or 0
        local facingMode = data.facingMode or currentMode
        
        updateCameraRotation(deltaX, deltaY)
        cb({ success = true, applied = true, mode = currentMode })
    else
        cb({ success = false, error = "camera_not_active" })
    end
end)

RegisterNUICallback('camera:take', function(data, cb)
    local tempId = 'temp_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)

    PlaySoundFrontend(-1, 'Camera_Shoot', 'Phone_SoundSet_Default', true)
    captureAndUpload({ photoType = data.photoType or data.type or 'photo', metadata = { location = data.location or {}, cameraMode = data.mode or currentMode, extra = data.metadata or {} } }, 'bit-smartphone:camera:savePhoto', function(result)
        if result and result.success then
            SendNUIMessage({ action = 'camera:photo_saved', photo = { id = tempId, url = result.photoUrl } })
            cb({ success = true, url = result.photoUrl, id = tempId })
        else
            cb({ success = false, error = result and result.error or 'capture_failed' })
        end
    end)
end)

RegisterNetEvent('bit-smartphone:camera:photo_result')
AddEventHandler('bit-smartphone:camera:photo_result', function(result)
    SendNUIMessage({ action = 'camera:photo_taken', success = result.success, url = result.url, error = result.error })
end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        stopCameraPreview()
        local playerPed = PlayerPedId()
        SetEntityVisible(playerPed, true, false)
        DisplayRadar(true)
        SetMinimapHideFow(false)
    end
end)

RegisterNUICallback('camera:close', function(data, cb)
    stopCameraPreview()
    if cb then cb("ok") end
end)

RegisterNUICallback('camera:takePhoto', function(data, cb)
    local photoType = data.type or 'profile'
    captureAndUpload({ photoType = photoType, metadata = data.metadata or {} }, 'bit-smartphone:camera:savePhoto', function(result)
        if result and result.success then
            cb({ success = true, photoUrl = result.photoUrl, photoId = result.photoId })
        else
            cb({ success = false, error = result and result.error or 'failed_to_capture' })
        end
    end)
end)

RegisterNUICallback('bitlove:takePhoto', function(data, cb)
    local wasPreviewEnabled = previewEnabled
    previewEnabled = false
    captureAndUpload({ photoType = data.type or 'bitlove_profile', metadata = data.metadata or {} }, 'bit-smartphone:bitlove:savePhotoUrl', function(result)
        if result and result.success then
            cb({ success = true, photoUrl = result.photoUrl, photoId = result.photoId })
        else
            cb({ success = false, error = result and result.error or 'capture_failed' })
            previewEnabled = wasPreviewEnabled
        end
    end)
end)

RegisterNUICallback('bitlove:savePhoto', function(data, cb)
    TriggerServerEvent('bit-smartphone:bitlove:savePhotoMetadata', {
        photoId = data.photoId or ('bitlove_' .. GetGameTimer()),
        photoUrl = data.photoUrl, 
        type = 'bitlove_profile',
        timestamp = GetGameTimer(),
        metadata = data.metadata or {}
    })
    
    cb({ success = true })
end)