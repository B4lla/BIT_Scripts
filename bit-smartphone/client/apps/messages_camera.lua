RegisterNUICallback('messages:camera:take', function(data, cb)
    if not data then data = {} end
    
    local metadata = {
        fromApp = 'messages',
        chatId = data.chatId
    }
    
    exports["bit-smartphone"]:captureAndUpload({
        photoType = 'messages',
        metadata = metadata
    }, 'bit-smartphone:messages:savePhoto', function(result)
        if result and result.success then
            cb({
                success = true,
                photoUrl = result.photoUrl,
                photoId = result.photoId
            })
        else
            cb({
                success = false,
                error = result and result.error or 'capture_failed'
            })
        end
    end)
end)

RegisterNetEvent('bit-smartphone:messages:savePhoto')
AddEventHandler('bit-smartphone:messages:savePhoto', function(photoData)
    TriggerServerEvent('bit-smartphone:saveMessagePhoto', photoData)
end)