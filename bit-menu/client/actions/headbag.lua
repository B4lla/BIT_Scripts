local headbagProps = {}
local HEADBAG_PROP = "prop_money_bag_01"
local HEADBAG_BONE = 12844

local function playHeadbagAnimation(playerPed, targetPed, isApplying)
    RequestAnimDict("mp_arresting")
    while not HasAnimDictLoaded("mp_arresting") do
        Citizen.Wait(100)
    end

    local duration = isApplying and 2500 or 1500
    TaskPlayAnim(playerPed, "mp_arresting", "a_uncuff", 8.0, -8.0, duration, 1, 0, false, false, false)
    Citizen.Wait(duration)
    ClearPedTasks(playerPed)
end

local function RemoveHeadbagProp(targetId)
    local props = headbagProps[targetId]

    local function safeDelete(entity)
        if entity and DoesEntityExist(entity) then
            NetworkRequestControlOfEntity(entity)
            local timeout = 1000
            local timer = GetGameTimer()
            while not NetworkHasControlOfEntity(entity) and GetGameTimer() - timer < timeout do
                Wait(0)
                NetworkRequestControlOfEntity(entity)
            end
            SetEntityAsMissionEntity(entity, true, true)
            DetachEntity(entity, true, true)
            DeleteObject(entity)
            DeleteEntity(entity)
        end
    end

    if type(props) == "table" then
        safeDelete(props.prop1)
        safeDelete(props.prop2)
    elseif props then
        safeDelete(props)
    end

    headbagProps[targetId] = nil
end



local function CreateDoubleHeadbags(targetId)
    RemoveHeadbagProp(targetId)
    
    local targetPlayer = GetPlayerFromServerId(targetId)
    if not targetPlayer or targetPlayer == -1 then return end
    
    local targetPed = GetPlayerPed(targetPlayer)
    if not DoesEntityExist(targetPed) then return end
    
    local propHash = GetHashKey("prop_money_bag_01")
    RequestModel(propHash)
    while not HasModelLoaded(propHash) do Citizen.Wait(100) end

    local prop1 = CreateObject(propHash, 0, 0, 0, true, true, true)
    local prop2 = CreateObject(propHash, 0, 0, 0, true, true, true)

    AttachEntityToEntity(
        prop1,
        targetPed,
        GetPedBoneIndex(targetPed, 12844),
        0.2, 0.02, 0.0,  -- x, y, z
        0.0, 270.0, 0.0, -- rx, ry, rz
        true, true, false, true, 1, true
    )

    AttachEntityToEntity(
        prop2,
        targetPed,
        GetPedBoneIndex(targetPed, 12844),
        0.2, 0.03, 0.0,  -- x, y, z
        0.0, 270.0, 0.0,  -- rx, ry, rz
        true, true, false, true, 1, true
    )

    SetModelAsNoLongerNeeded(propHash)

    headbagProps[targetId] = { prop1 = prop1, prop2 = prop2 }
end


RegisterNetEvent('bit-menu:applyHeadbag')
AddEventHandler('bit-menu:applyHeadbag', function(targetId, apply)
    if apply then
        CreateDoubleHeadbags(targetId)
        if targetId == GetPlayerServerId(PlayerId()) then SendNUIMessage({ type = "headbag", show = true }) end
    else
        RemoveHeadbagProp(targetId)
        if targetId == GetPlayerServerId(PlayerId()) then SendNUIMessage({ type = "headbag", show = false }) end
    end
end)

RegisterNetEvent('bit-menu:playHeadbagAnimation')
AddEventHandler('bit-menu:playHeadbagAnimation', function(targetId, isApplying)
    local playerPed = PlayerPedId()
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))

    if isApplying then
        playHeadbagAnimation(playerPed, targetPed, true)
    else
        playHeadbagAnimation(playerPed, targetPed, false)
    end
end)


AddEventHandler("onPlayerDropped", function(reason)
    local serverId = source
    RemoveHeadbagProp(serverId)
end)

AddEventHandler("onResourceStop", function(resourceName)
    if resourceName == GetCurrentResourceName() then
        for targetId, props in pairs(headbagProps) do
            if type(props) == "table" then
                if props.prop1 and DoesEntityExist(props.prop1) then
                    DeleteEntity(props.prop1)
                end
                if props.prop2 and DoesEntityExist(props.prop2) then
                    DeleteEntity(props.prop2)
                end
            elseif props and DoesEntityExist(props) then
                DeleteEntity(props)
            end
        end
        headbagProps = {}
    end
end)
