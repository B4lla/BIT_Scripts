local tieLegsProps = {}
local tieLeggedPlayers = {}


local function playTieLegsAnimation(playerPed, targetPed, isApplying)
    local dict = "amb@medic@standing@kneel@base"
    local animName = "base"
    
    if isApplying then
        RequestAnimDict(dict)
        while not HasAnimDictLoaded(dict) do
            Citizen.Wait(100)
        end

        TaskPlayAnim(playerPed, dict, animName, 8.0, -8.0, 3000, 1, 0, false, false, false)
    else
        RequestAnimDict(dict)
        while not HasAnimDictLoaded(dict) do
            Citizen.Wait(100)
        end
        
        TaskPlayAnim(playerPed, dict, animName, 8.0, -8.0, 2500, 1, 0, false, false, false)
    end
end

function CreateTieLegsProps(targetId)
    if not targetId then return end

    local targetPlayer = GetPlayerFromServerId(targetId)
    if not targetPlayer or targetPlayer == -1 then return end

    local targetPed = GetPlayerPed(targetPlayer)
    if not DoesEntityExist(targetPed) then return end

    RemoveTieLegsProps(targetId)

    local model = "prop_rope_family_3"
    RequestModel(model)
    while not HasModelLoaded(model) do
        Citizen.Wait(100)
    end

    local rightAnkleBone = GetPedBoneIndex(targetPed, 10709) -- SKEL_R_Ankle

    local prop = CreateObject(model, 0, 0, 0, true, true, true)

    AttachEntityToEntity(
        prop,
        targetPed,
        rightAnkleBone,
        0.055, 0.0, -0.9,   -- x = -0.08, z = -0.7
        0.0, 0.0, 160.0,
        true, true, false, true, 1, true
    )

    tieLegsProps[targetId] = { rope = prop }

    SetModelAsNoLongerNeeded(model)   
    if targetId == GetPlayerServerId(PlayerId()) then
        local ped = PlayerPedId()
        RequestAnimDict("move_m@injured")
        while not HasAnimDictLoaded("move_m@injured") do
            Citizen.Wait(100)
        end
        SetPedMovementClipset(ped, "move_m@injured", 1.0)
    end
end


function RemoveTieLegsProps(targetId)
    if not targetId then return end

    local props = tieLegsProps[targetId]

    local function forceDeleteProp(prop)
        if prop and DoesEntityExist(prop) then
            NetworkRequestControlOfEntity(prop)
            local timeout = 1000
            local timer = GetGameTimer()

            while not NetworkHasControlOfEntity(prop) and (GetGameTimer() - timer) < timeout do
                Wait(0)
                NetworkRequestControlOfEntity(prop)
            end

            SetEntityAsMissionEntity(prop, true, true)
            DeleteEntity(prop)

            if DoesEntityExist(prop) then
                DetachEntity(prop, true, true)
                DeleteObject(prop)
                DeleteEntity(prop)
            end
        end
    end

    if type(props) == "table" and props.rope then
        forceDeleteProp(props.rope)
    elseif props then
        forceDeleteProp(props)
    end

    tieLegsProps[targetId] = nil
end

RegisterNetEvent('bit-menu:applyTieLegs')
AddEventHandler('bit-menu:applyTieLegs', function(targetId, apply)
    if apply then
        CreateTieLegsProps(targetId)
        if targetId == GetPlayerServerId(PlayerId()) then
            tieLeggedPlayers[targetId] = true
        end
    else
        RemoveTieLegsProps(targetId)
        if targetId == GetPlayerServerId(PlayerId()) then
            tieLeggedPlayers[targetId] = nil
            local ped = PlayerPedId()
            ClearPedTasks(ped)
            ResetPedMovementClipset(ped, 1.0)
            SetPedCanRagdoll(ped, true)
        end
    end
end)

RegisterNetEvent('bit-menu:playTieLegsAnimation')
AddEventHandler('bit-menu:playTieLegsAnimation', function(targetId, isApplying)
    local playerPed = PlayerPedId()
    local targetPlayer = GetPlayerFromServerId(targetId)
    
    if targetPlayer == -1 then
        return
    end
    
    local targetPed = GetPlayerPed(targetPlayer)
    
    if not DoesEntityExist(targetPed) then
        return
    end

    playTieLegsAnimation(playerPed, targetPed, isApplying)
end)

Citizen.CreateThread(function()
    while true do
        local myServerId = GetPlayerServerId(PlayerId())
        
        if tieLeggedPlayers[myServerId] then
            local ped = PlayerPedId()

            if GetPedMovementClipset(ped) ~= GetHashKey("move_m@injured") then
                RequestAnimDict("move_m@injured")
                while not HasAnimDictLoaded("move_m@injured") do
                    Citizen.Wait(100)
                end
                SetPedMovementClipset(ped, "move_m@injured", 1.0)
            end
            
            Citizen.Wait(1000)
        else
            Citizen.Wait(2000)
        end
    end
end)

Citizen.CreateThread(function()
    while true do
        local myServerId = GetPlayerServerId(PlayerId())
        
        if tieLeggedPlayers[myServerId] then
            DisableControlAction(0, 30, true)  -- Move Left/Right (A/D)
            DisableControlAction(0, 31, true)  -- Move Up/Down (W/S)  
            DisableControlAction(0, 21, true)  -- Sprint (Shift)
            DisableControlAction(0, 22, true)  -- Jump (Space)
            DisableControlAction(0, 23, true)  -- Enter vehicle (F)
            DisableControlAction(0, 75, true)  -- Exit vehicle (F)
            DisableControlAction(0, 44, true)  -- Cover (Q)
            DisableControlAction(0, 36, true)  -- Input Duck/Sneak (Ctrl)            
            Citizen.Wait(0)
        else
            Citizen.Wait(500)
        end
    end
end)

AddEventHandler('onPlayerDropped', function(reason)
    local serverId = source
    RemoveTieLegsProps(serverId)
    tieLeggedPlayers[serverId] = nil
end)

AddEventHandler('onResourceStop', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        for targetId, props in pairs(tieLegsProps) do
            if type(props) == "table" and props.rope then
                if DoesEntityExist(props.rope) then
                    DeleteEntity(props.rope)
                end
            elseif props and DoesEntityExist(props) then
                DeleteEntity(props)
            end
        end
        tieLegsProps = {}
        tieLeggedPlayers = {}

        local ped = PlayerPedId()
        ClearPedTasks(ped)
        ResetPedMovementClipset(ped, 1.0)
        SetPedCanRagdoll(ped, true)
    end
end)