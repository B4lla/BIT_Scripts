local businessData = {}

RegisterNUICallback('loadBusinesses', function(data, cb)
    if Config.Business and Config.Business.enabled then
        cb({ success = true, businesses = Config.Business.listings })
        return
    end
    cb({ success = false, businesses = {} })
end)

RegisterNUICallback('businessAction', function(data, cb)
    if not data or not data.action then
        cb({ success = false })
        return
    end

    local action = data.action
    local business = data.business

    if action == "garage" then
        TriggerEvent('bit-smartphone:openApp', 'garage')
    elseif action == "order_food" then
        TriggerServerEvent('bit-smartphone:business:orderFood', business)
    elseif action == "clothing_store" then
        TriggerServerEvent('bit-smartphone:business:openClothing', business)
    elseif action == "tech_store" then
        TriggerServerEvent('bit-smartphone:business:openTechStore', business)
    elseif action == "bank" then
        TriggerEvent('bit-smartphone:openApp', 'bank')
    else
        TriggerServerEvent('bit-smartphone:business:customAction', action, business)
    end

    cb({ success = true })
end)

RegisterNUICallback('showBusinessOnMap', function(data, cb)
    if not data or not data.location then
        cb({ success = false })
        return
    end

    local loc = data.location
    TriggerServerEvent('bit-smartphone:business:showOnMap', { name = data.name or 'Business', location = loc })
    cb({ success = true })
end)

RegisterNetEvent('bit-smartphone:business:setWaypoint', function(data)
    if not data or not data.x or not data.y then
        print('[Business] Error: Invalid waypoint data', json.encode(data))
        return
    end
    
    print('[Business] Setting waypoint to:', data.x, data.y, 'for', data.name)
    
    SetWaypointOff()
    Wait(100)
    
    SetNewWaypoint(data.x, data.y)
    
    TriggerEvent('bit-smartphone:addNotification', {
        title = 'GPS',
        message = 'Waypoint marcado para: ' .. (data.name or 'Negocio'),
        icon = 'fas fa-map-marker-alt',
        timeout = 3000
    })
    
    print('[Business] Waypoint set successfully')
end)
