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
