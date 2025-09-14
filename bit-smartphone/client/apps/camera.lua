local Camera = {
    PreviewFPS = 45,
}

local isCameraActive = false
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
        AttachCamToEntity(camera, ped, 0.0, 0.6, 0.8, true)
        PointCamAtPedBone(camera, ped, 31086, 0.0, 0.0, 0.0, true) 
        SetCamFov(camera, 45.0) 
        
        local heading = GetEntityHeading(ped)
        local pitch = GetEntityPitch(ped)
        SetCamRot(camera, pitch - 10.0, 0.0, heading + 180.0, 2)
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
        local finalPitch = basePitch + mouseYRotation
        local finalHeading = baseHeading + mouseXRotation
        
        SetCamRot(camera, finalPitch, 0.0, finalHeading, 2)
        
        local pedCoords = GetEntityCoords(playerPed)
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

    if Config.PhotoProvider == 'screenshot-basic' then
        exports['screenshot-basic']:requestScreenshotUpload(Config.DiscordWebhook, 'files[]', function(dataURI)
            if dataURI then
                TriggerServerEvent('bit-smartphone:camera:savePhoto', {
                    url = dataURI,
                    location = data.location or {},
                    cameraMode = data.mode or currentMode,
                    metadata = data.metadata or {},
                    timestamp = GetGameTimer()
                })

                SendNUIMessage({ action = 'camera:photo_saved', photo = { id = tempId, url = dataURI } })
                cb({ success = true, url = dataURI, id = tempId })
            else
                cb({ success = false, error = 'capture_failed' })
            end
        end)
    elseif Config.PhotoProvider == 'fmsdk' and exports['fmsdk'] then
        local imageData = exports['fmsdk']:takeImage({ name = 'Phone screenshot', description = 'Screenshot from bit-smartphone' })
        if imageData and imageData.url then
            TriggerServerEvent('bit-smartphone:camera:savePhoto', {
                url = imageData.url,
                location = data.location or {},
                cameraMode = data.mode or currentMode,
                metadata = data.metadata or {},
                timestamp = GetGameTimer()
            })
            SendNUIMessage({ action = 'camera:photo_saved', photo = { id = tempId, url = imageData.url } })
            cb({ success = true, url = imageData.url, id = tempId })
        else
            cb({ success = false, error = 'fmsdk_error' })
        end 
    else
        cb({ success = false, error = 'no_screenshot_provider' })
    end
end)

RegisterNetEvent('bit-smartphone:camera:photo_result')
AddEventHandler('bit-smartphone:camera:photo_result', function(result)
    SendNUIMessage({ action = 'camera:photo_taken', success = result.success, url = result.url, error = result.error })
end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        stopCameraPreview()
    end
end)

RegisterNUICallback('camera:close', function(data, cb)
    stopCameraPreview()
    if cb then cb("ok") end
end)

RegisterNUICallback('camera:takePhoto', function(data, cb)
    local photoType = data.type or 'profile'
    
    if exports[photoProvider] and exports[photoProvider].requestScreenshot then
        exports[photoProvider]:requestScreenshot(function(url)
            if url then
                local photoId = 'photo_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)

                TriggerServerEvent('bit-smartphone:camera:savePhoto', {
                    id = photoId,
                    url = url,
                    type = photoType,
                    timestamp = GetGameTimer()
                })

                cb({ success = true, photoUrl = url, photoId = photoId })
            else
                cb({ success = false, error = 'failed_to_capture' })
            end
        end)
    else
        cb({ success = false, error = 'no_screenshot_provider' })
    end
end)

RegisterNUICallback('bitlove:takePhoto', function(data, cb)
    local wasPreviewEnabled = previewEnabled
    previewEnabled = false
    
    if exports[photoProvider] and exports[photoProvider].requestScreenshot then
        exports[photoProvider]:requestScreenshot(function(url)
            if url and url ~= '' then
                local photoId = 'bitlove_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)
                
                cb({ success = true, photoUrl = url, photoId = photoId })
                
            else
                cb({ success = false, error = 'No se pudo capturar la imagen' })
                previewEnabled = wasPreviewEnabled
            end
        end)
    else
        exports['screenshot-basic']:requestScreenshot(function(url)
            if url and url ~= '' then
                local photoId = 'bitlove_' .. GetGameTimer() .. '_' .. math.random(1000, 9999)
                
                cb({ success = true, photoUrl = url, photoId = photoId })
            else
                cb({ success = false, error = 'Error' })
                previewEnabled = wasPreviewEnabled
            end
        end)
    end
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