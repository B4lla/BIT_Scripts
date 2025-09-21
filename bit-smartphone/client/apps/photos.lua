RegisterNUICallback('photos:list', function(_, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:photos:loadPhotos', function(photos)
            cb({ ok = true, photos = photos })
        end)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:photos:loadPhotos', function(photos)
            cb({ ok = true, photos = photos })
        end)
    else
        cb({ ok = false, photos = {}, error = 'framework_not_supported' })
    end
end)

local pendingDeleteCallbacks = {}

RegisterNUICallback('photos:delete', function(data, cb)
    local photoId = data.photoId
    if not photoId then
        print('[Photos] Error: No photoId provided for deletion')
        cb({success = false, error = 'No photo ID provided'})
        return
    end
    
    pendingDeleteCallbacks[photoId] = function(response)
    end

    cb({ ok = true })

    TriggerServerEvent('photos:delete', {photoId = photoId})
end)

RegisterNetEvent('photos:deleteResponse')
AddEventHandler('photos:deleteResponse', function(response)
    if response.photoId and pendingDeleteCallbacks[response.photoId] then
        local cb = pendingDeleteCallbacks[response.photoId]
        cb(response)
        pendingDeleteCallbacks[response.photoId] = nil
    else
        for photoId, cb in pairs(pendingDeleteCallbacks) do
            cb(response)
            pendingDeleteCallbacks[photoId] = nil
            break
        end
    end
end)
