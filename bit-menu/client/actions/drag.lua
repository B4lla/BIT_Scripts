local dragging_data = {
	InProgress = false,
	target = -1,
	Anim = {
		dict = "combat@drag_ped@",
		start = "injured_pickup_back_",
		loop = "injured_drag_",
		ending = "injured_putdown_"
	}
}

local function LoadAnimDict(animDict)
    if not HasAnimDictLoaded(animDict) then
        RequestAnimDict(animDict)
        while not HasAnimDictLoaded(animDict) do
            Wait(0)
        end        
    end
    return animDict
end

local old_TaskPlayAnim = TaskPlayAnim
function TaskPlayAnim(ped, animDictionary, animationName, blendInSpeed, blendOutSpeed, duration , flag, playbackRate, lockX, lockY, lockZ)
	old_TaskPlayAnim(ped, animDictionary, animationName, blendInSpeed, blendOutSpeed, duration , flag, playbackRate, lockX, lockY, lockZ)
	RemoveAnimDict(animDictionary)
	return
end

function PlayAnim(type, desinence)
	-- plyr = jugador que arrastra
	-- ped  = jugador arrastrado

	local duration = nil
	if type == "loop" then duration = -1 elseif type == "start" then duration = 6000 elseif type == "ending" then duration = 5000 end

	LoadAnimDict(dragging_data.Anim.dict)
	TaskPlayAnim(PlayerPedId(), dragging_data.Anim.dict, dragging_data.Anim[type]..desinence, 8.0, -8.0, duration, 33, 0, 0, 0, 0)

	if duration ~= -1 then
		Wait(duration)
		ClearPedTasks(PlayerPedId())
	end
end


function DragClosest()
    local player = PlayerPedId()

    if not dragging_data.InProgress then
        if not dragging_data.target or dragging_data.target == -1 then
            Notifications(Noti.error, Utils.getText("error"), Noti.time)
            return
        end

        dragging_data.InProgress = true
        TriggerServerEvent("bit-menu:drag:sync", dragging_data.target)
        PlayAnim("start", "plyr")
        PlayAnim("loop", "plyr")
        Notifications(Noti.info, Utils.getText("dragStop"), Noti.time)

        Citizen.CreateThread(function()
            while dragging_data.InProgress do
                if IsControlJustPressed(1, 323) then -- X
                    DragClosest()
                    return
                end
                Citizen.Wait(5)
            end
        end)
    else
        local target = dragging_data.target
        TriggerServerEvent("bit-menu:drag:stop", target)
        DetachEntity(player, true, false)
        PlayAnim("ending", "plyr")
        local targetPed = GetPlayerPed(GetPlayerFromServerId(target))
        ClearPedTasks(targetPed)
        dragging_data.InProgress = false
        dragging_data.target = -1 
    end
end

RegisterNetEvent("bit-menu:syncTarget")
AddEventHandler("bit-menu:syncTarget", function(target)
	local target_ped = GetPlayerPed(GetPlayerFromServerId(target))
	local player 	 = PlayerPedId()

    if not DoesEntityExist(target_ped) then
        return
    end
	dragging_data.InProgress = true

	SetEntityCoords(player, GetOffsetFromEntityInWorldCoords(target_ped, 0.0, 1.2, -1.0)) 
	SetEntityHeading(player, GetEntityHeading(target_ped)) 
	PlayAnim("start", "ped")
	ClearPedTasks(player)

	AttachEntityToEntity(player, target_ped, 1816, 4103, 0.48, 0.0, 0.0, 0.0, 0.0, 0.0)
	PlayAnim("loop", "ped")
end)

RegisterNetEvent("bit-menu:drag:stopTarget")
AddEventHandler("bit-menu:drag:stopTarget", function(_)
    local draggedPed = PlayerPedId()
    dragging_data.InProgress = false
    DetachEntity(draggedPed, true, false)
    ClearPedTasks(draggedPed)
end)

RegisterNetEvent("bit-menu:startDrag")
AddEventHandler("bit-menu:startDrag", function(targetId)
    dragging_data.target = targetId
    DragClosest()
end)