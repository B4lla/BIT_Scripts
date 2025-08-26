local businessData = {}

RegisterNUICallback('loadBusinesses', function(data, cb)
    if Config.Business and Config.Business.enabled then
        cb({ success = true, businesses = Config.Business.listings })
        return
    end
    cb({ success = false, businesses = {} })
end)

RegisterNUICallback('showBusinessOnMap', function(data, cb)
    if not data or not data.location then
        cb({ success = false })
        return
    end

    local loc = data.location
    TriggerServerEvent('smartphone:business:showOnMap', { name = data.name or 'Business', location = loc })
    cb({ success = true })
end)

RegisterNetEvent('smartphone:business:receiveBusinesses')
AddEventHandler('smartphone:business:receiveBusinesses', function(list)
    businessData = list or {}
    SendNUIMessage({ action = 'business:updateList', data = businessData })
end)
