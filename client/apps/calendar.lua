RegisterNUICallback('calendar:loadEvents', function(data, cb)
    TriggerServerEvent('bit-smartphone:server:calendar:loadEvents')
    cb({success = true})
end)


RegisterNUICallback('calendar:saveEvent', function(data, cb)
    TriggerServerEvent('bit-smartphone:server:calendar:saveEvent', data)
    cb({success = true})
end)


RegisterNetEvent('bit-smartphone:client:calendar:eventsLoaded')
AddEventHandler('bit-smartphone:client:calendar:eventsLoaded', function(events)
    SendNUIMessage({
        action = 'calendar:eventsLoaded',
        events = events
    })
end)


RegisterNetEvent('bit-smartphone:client:calendar:eventSaved')
AddEventHandler('bit-smartphone:client:calendar:eventSaved', function(result)
    if result.success then
        
        TriggerServerEvent('bit-smartphone:server:calendar:loadEvents')
    end
end)