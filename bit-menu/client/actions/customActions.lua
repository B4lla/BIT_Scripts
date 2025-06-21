-- Custom Actions - Client Side
-- Add your own actions here following the examples below

-- Example 1: Simple handshake action
--[[function Action.handshake(targetId)
    if not targetId then
        Notifications(Noti.error, "No target selected", Noti.time)
        return
    end
    
    -- Simple animation and notification
    local playerPed = PlayerPedId()
    RequestAnimDict("mp_ped_interaction")
    while not HasAnimDictLoaded("mp_ped_interaction") do
        Wait(100)
    end
    
    TaskPlayAnim(playerPed, "mp_ped_interaction", "handshake_guy_a", 8.0, -8.0, 3000, 0, 0, false, false, false)
end
]]