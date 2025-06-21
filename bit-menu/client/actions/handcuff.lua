

local function playHandcuffAnimations(playerPed, targetPed)
    local dict = "mp_arrest_paired"
    RequestAnimDict(dict)
    while not HasAnimDictLoaded(dict) do
        Citizen.Wait(100)
    end
    TaskPlayAnim(playerPed, dict, "cop_p2_back_left", 8.0, -8.0, 3000, 49, 0, false, false, false)
    TaskPlayAnim(targetPed, dict, "crook_p2_back_left", 8.0, -8.0, 3000, 49, 0, false, false, false)
end

local function playUnhandcuffAnimations(playerPed, targetPed)
    local dict = "mp_arresting"
    RequestAnimDict(dict)
    while not HasAnimDictLoaded(dict) do
        Citizen.Wait(100)
    end
    TaskPlayAnim(playerPed, dict, "a_uncuff", 8.0, -8.0, 2500, 49, 0, false, false, false)
    
    if DoesEntityExist(targetPed) then
        TaskPlayAnim(targetPed, dict, "b_uncuff", 8.0, -8.0, 2500, 49, 0, false, false, false)
    end
end

local cuffModels = { cuffs = "police_cuffs", zipties = "police_zip_tie_positioned" }
local cuffInfo = {
    cuffs = {
        back = {
            pos = vector3(0.0, 0.07, 0.03),
            rot = vector3(10.0, 115.0, -65.0)
        },
        front = {
            pos = vector3(-0.025, 0.0, 0.085),
            rot = vector3(10.0, 75.0, 0.0)
        }
    },
    zipties = {
        back = {
            pos = vector3(0.01, 0.06, 0.035),
            rot = vector3(-90.0, 110.0, -65.0)
        },
        front = {
            pos = vector3(-0.02, 0.0, 0.085),
            rot = vector3(100.0, 75.0, 0.0)
        }
    }
}
local cuffProps = {}
local handcuffedPlayers = {}

function CreateCuffProp(targetId)
    if not targetId then return end
    
    local targetPlayer = GetPlayerFromServerId(targetId)
    if not targetPlayer or targetPlayer == -1 then return end
    
    local targetPed = GetPlayerPed(targetPlayer)
    if not DoesEntityExist(targetPed) then return end
    
    local model = cuffModels.cuffs 
    local position = cuffInfo.cuffs.back 
    
    if not model or not position then return end
    
    local pos, rot = position.pos, position.rot

    RemoveCuffProp(targetId)

    RequestModel(model)
    while not HasModelLoaded(model) do
        Citizen.Wait(100)
    end
    
    local entity = CreateObject(model, 0, 0, 0, true, true, true)
    AttachEntityToEntity(entity, targetPed, GetPedBoneIndex(targetPed, 0x49D9), pos.x, pos.y, pos.z, rot.x, rot.y, rot.z, true, true, false, true, 1, true)
    
    cuffProps[targetId] = entity
    SetModelAsNoLongerNeeded(model)
end

function RemoveCuffProp(targetId)
    if not targetId then return end

    local prop = cuffProps[targetId]

    if prop and DoesEntityExist(prop) then
        NetworkRequestControlOfEntity(prop)
        local timeout = 1000
        local timer = GetGameTimer()

        while not NetworkHasControlOfEntity(prop) and GetGameTimer() - timer < timeout do
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

    cuffProps[targetId] = nil
end

RegisterNetEvent("bit-menu:setHandcuffed", function(playerId, isCuffed)
    local playerPed = GetPlayerPed(GetPlayerFromServerId(playerId))
    
    if isCuffed then
        handcuffedPlayers[playerId] = true
        SetEnableHandcuffs(playerPed, true)
        RequestAnimDict("mp_arresting")
        while not HasAnimDictLoaded("mp_arresting") do
            Citizen.Wait(100)
        end
        TaskPlayAnim(playerPed, "mp_arresting", "idle", 8.0, -8.0, -1, 49, 0, false, false, false)
        
        Citizen.SetTimeout(1000, function()
            CreateCuffProp(playerId)
        end)
    else
        handcuffedPlayers[playerId] = nil
        SetEnableHandcuffs(playerPed, false)
        ClearPedTasks(playerPed)
        RemoveCuffProp(playerId)
    end
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(1000)
        
        local myServerId = GetPlayerServerId(PlayerId())
        if handcuffedPlayers[myServerId] then
            local ped = PlayerPedId()

            if not IsEntityPlayingAnim(ped, "mp_arresting", "idle", 3) then
                RequestAnimDict("mp_arresting")
                while not HasAnimDictLoaded("mp_arresting") do
                    Citizen.Wait(100)
                end
                TaskPlayAnim(ped, "mp_arresting", "idle", 8.0, -8.0, -1, 49, 0, false, false, false)
            end
        end
    end
end)

RegisterNetEvent('bit-menu:playHandcuffAnimation')
AddEventHandler('bit-menu:playHandcuffAnimation', function(targetId, isApplying)
    local playerPed = PlayerPedId()
    local targetPed = GetPlayerPed(GetPlayerFromServerId(targetId))
    
    if isApplying then
        playHandcuffAnimations(playerPed, targetPed)
    else
        playUnhandcuffAnimations(playerPed, targetPed)
    end
end)

AddEventHandler("onPlayerDropped", function(reason)
    local serverId = source
    RemoveCuffProp(serverId)
    handcuffedPlayers[serverId] = nil
end)

AddEventHandler("onResourceStop", function(resourceName)
    if resourceName == GetCurrentResourceName() then
        for targetId, entity in pairs(cuffProps) do
            if DoesEntityExist(entity) then
                DeleteEntity(entity)
            end
        end
        cuffProps = {}
        handcuffedPlayers = {}
        
        local ped = PlayerPedId()
        ClearPedTasks(ped)
        SetEnableHandcuffs(ped, false)
    end
end)
