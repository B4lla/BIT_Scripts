local playerState = LocalPlayer.state
local lastNearbySeatCheck = 0
local nearBySeatStatus = false

local IsPedCuffed = IsPedCuffed
local IsEntityAttachedToEntity = IsEntityAttachedToEntity

function StopEscortPlayer(serverId, setIntoVeh, setIntoSeat)
    TriggerServerEvent('bit-menu:setPlayerEscort', serverId, false, setIntoVeh, setIntoSeat)
    LocalPlayer.state.blockHandsUp = false

    local playerPed = PlayerPedId()
    StopAnimTask(playerPed, "anim@heists@box_carry@", "idle", 2.0)
    ClearPedTasks(playerPed) 

    currentlyEscorting = false
    escortTargetServerId = nil
end

local function escortPlayer(ped, id)
    if not id then
        id = NetworkGetPlayerIndexFromPed(ped)
    end
    
    local targetServerId = GetPlayerServerId(id)
    local isCurrentlyEscorting = IsEntityAttachedToEntity(ped, PlayerPedId())
    
    if not isCurrentlyEscorting then
        RequestAnimDict("anim@heists@box_carry@")
        while not HasAnimDictLoaded("anim@heists@box_carry@") do
            Citizen.Wait(100)
        end
        TaskPlayAnim(PlayerPedId(), "anim@heists@box_carry@", "idle", 8.0, 8.0, -1, 50, 0, false, false, false)
        LocalPlayer.state.blockHandsUp = true
        
        TriggerServerEvent('bit-menu:setPlayerEscort', targetServerId, true)
        currentlyEscorting = true
        escortTargetServerId = targetServerId
    else
        StopEscortPlayer(targetServerId)
    end
end

local currentlyEscorting = false
local escortTargetServerId = nil

local isEscorted = playerState.isEscorted
local AttachEntityToEntity = AttachEntityToEntity
local IsPedWalking = IsPedWalking
local IsEntityPlayingAnim = IsEntityPlayingAnim
local IsPedRunning = IsPedRunning
local IsPedSprinting = IsPedSprinting
local TaskPlayAnim = TaskPlayAnim
local StopAnimTask = StopAnimTask

local function setEscorted(serverId)
    local dict = 'anim@move_m@prisoner_cuffed'
    local dict2 = 'anim@move_m@trash'

    while isEscorted do
        local player = GetPlayerFromServerId(serverId)
        local ped = player > 0 and GetPlayerPed(player)

        if not ped then break end

        if not IsEntityAttachedToEntity(PlayerPedId(), ped) then
            AttachEntityToEntity(PlayerPedId(), ped, 11816, 0.38, 0.4, 0.0, 0.0, 0.0, 0.0, false, false, true, true, 2, true)
        end

        if IsPedWalking(ped) then
            if not IsEntityPlayingAnim(PlayerPedId(), dict, 'walk', 3) then
                RequestAnimDict(dict)
                while not HasAnimDictLoaded(dict) do
                    Citizen.Wait(100)
                end
                TaskPlayAnim(PlayerPedId(), dict, 'walk', 8.0, -8, -1, 1, 0.0, false, false, false)
            end
        elseif IsPedRunning(ped) or IsPedSprinting(ped) then
            if not IsEntityPlayingAnim(PlayerPedId(), dict2, 'run', 3) then
                RequestAnimDict(dict2)
                while not HasAnimDictLoaded(dict2) do
                    Citizen.Wait(100)
                end
                TaskPlayAnim(PlayerPedId(), dict2, 'run', 8.0, -8, -1, 1, 0.0, false, false, false)
            end
        else
            StopAnimTask(PlayerPedId(), dict, 'walk', -8.0)
            StopAnimTask(PlayerPedId(), dict2, 'run', -8.0)
        end

        Wait(0)
    end

    RemoveAnimDict(dict)
    RemoveAnimDict(dict2)
    playerState:set('isEscorted', false, true)

    local playerPed = PlayerPedId()
    if IsEntityAttached(playerPed) then
        DetachEntity(playerPed, true, false)
    end
    StopAnimTask(playerPed, 'anim@move_m@prisoner_cuffed', 'walk', -8.0)
    StopAnimTask(playerPed, 'anim@move_m@trash', 'run', -8.0)
    ClearPedTasks(playerPed)
end

AddStateBagChangeHandler('isEscorted', ('player:%s'):format(GetPlayerServerId(PlayerId())), function(_, _, value)
    isEscorted = value

    if not value then
        local playerPed = PlayerPedId()
        if IsEntityAttached(playerPed) then
            DetachEntity(playerPed, true, false)
        end
        StopAnimTask(playerPed, 'anim@move_m@prisoner_cuffed', 'walk', -8.0)
        StopAnimTask(playerPed, 'anim@move_m@trash', 'run', -8.0)
        ClearPedTasks(playerPed)
    end

    if value then setEscorted(value) end
end)

if isEscorted then
    CreateThread(function()
        setEscorted(isEscorted)
    end)
end

CreateThread(function()
    while true do
        Wait(1000)
        
        if currentlyEscorting then
            local playerPed = PlayerPedId()
            if not IsEntityPlayingAnim(playerPed, "anim@heists@box_carry@", "idle", 3) then
                RequestAnimDict("anim@heists@box_carry@")
                while not HasAnimDictLoaded("anim@heists@box_carry@") do
                    Wait(100)
                end
                TaskPlayAnim(playerPed, "anim@heists@box_carry@", "idle", 8.0, 8.0, -1, 50, 0, false, false, false)
            end
        end
    end
end)

CreateThread(function()
    while true do
        Wait(2000) 
        
        if currentlyEscorting and escortTargetServerId then
            local targetPlayer = GetPlayerFromServerId(escortTargetServerId)
            
            if targetPlayer and targetPlayer ~= -1 then
                local targetPed = GetPlayerPed(targetPlayer)

                if DoesEntityExist(targetPed) and not IsPedCuffed(targetPed) then
                    StopEscortPlayer(escortTargetServerId)
                    Notifications(Noti.info, Utils.getText("escortEndUncuffed"), Noti.time)
                end
            else
                StopEscortPlayer(escortTargetServerId)
                Notifications(Noti.info, Utils.getText("escortDisconnected"), Noti.time)
            end
        end
    end
end)

RegisterNetEvent('bit-menu:escort:start')
AddEventHandler('bit-menu:escort:start', function(targetServerId)
    local ped = GetPlayerPed(GetPlayerFromServerId(targetServerId))
    if ped then
        escortPlayer(ped)
    end
end)

RegisterNetEvent('bit-menu:escort:toggle')
AddEventHandler('bit-menu:escort:toggle', function(targetServerId)
    if currentlyEscorting and escortTargetServerId == targetServerId then
        StopEscortPlayer(targetServerId)
    else
        local ped = GetPlayerPed(GetPlayerFromServerId(targetServerId))
        if ped then escortPlayer(ped) end
    end
end)
