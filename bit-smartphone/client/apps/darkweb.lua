RegisterNUICallback('darkweb:getRooms', function(data, cb)
    TriggerServerEvent('darkweb:getRooms')
    cb('ok')
end)

RegisterNUICallback('darkweb:createRoom', function(data, cb)
    if not data.name or data.name == '' then
        cb('error')
        return
    end
    
    local roomData = {
        name = data.name,
        description = data.description
    }
    
    TriggerServerEvent('darkweb:createRoom', roomData)
    cb('ok')
end)

RegisterNUICallback('darkweb:joinRoom', function(data, cb)
    if not data.code or data.code == '' then
        cb('error')
        return
    end
    
    TriggerServerEvent('darkweb:joinRoom', data.code)
    cb('ok')
end)

RegisterNUICallback('darkweb:leaveRoom', function(data, cb)
    if not data.roomId then
        cb('error')
        return
    end
    
    TriggerServerEvent('darkweb:leaveRoom', data.roomId)
    cb('ok')
end)





RegisterNUICallback('darkweb:sendRoomMessage', function(data, cb)
    if not data.roomId or not data.message or data.message == '' then
        cb('error')
        return
    end
    
    TriggerServerEvent('darkweb:sendRoomMessage', data.roomId, data.message)
    cb('ok')
end)


RegisterNUICallback('darkweb:sendMessage', function(data, cb)
    TriggerServerEvent('darkweb:sendGlobalMessage', data)
    cb('ok')
end)





RegisterNUICallback('darkweb:getMarketplace', function(data, cb)
    local category = data.category or 'all'
    TriggerServerEvent('darkweb:getMarketplace', category)
    cb('ok')
end)

RegisterNUICallback('darkweb:createMarketplaceItem', function(data, cb)
    if not data.title or not data.price or not data.category then
        cb('error')
        return
    end
    
    local itemData = {
        title = data.title,
        description = data.description,
        category = data.category,
        price = data.price,
        currency = data.currency or 'money',
        location = data.location,
        image_url = data.image_url
    }
    
    TriggerServerEvent('darkweb:createMarketplaceItem', itemData)
    cb('ok')
end)

RegisterNUICallback('darkweb:purchaseItem', function(data, cb)
    if not data.itemId then
        cb('error')
        return
    end
    
    TriggerServerEvent('darkweb:purchaseItem', data.itemId, data.quantity, data.deliveryLocation)
    cb('ok')
end)


RegisterNUICallback('darkweb:buyItem', function(data, cb)
    local playerData = ESX.GetPlayerData()
    local money = playerData.money
    
    if money >= data.price then
        TriggerServerEvent('darkweb:purchaseItem', data)
        cb({success = true, message = "Compra realizada con éxito"})
    else
        cb({success = false, message = "Fondos insuficientes"})
    end
end)





RegisterNUICallback('darkweb:getOnlineUsers', function(data, cb)
    TriggerServerEvent('darkweb:getOnlineUsers')
    cb('ok')
end)

RegisterNUICallback('darkweb:addReview', function(data, cb)
    if not data.purchaseId or not data.rating then
        cb('error')
        return
    end
    
    TriggerServerEvent('darkweb:addReview', data.purchaseId, data.rating, data.review)
    cb('ok')
end)






RegisterNetEvent('darkweb:receiveRooms')
AddEventHandler('darkweb:receiveRooms', function(rooms)
    SendNUIMessage({
        action = 'darkweb:updateRooms',
        data = rooms
    })
end)


RegisterNetEvent('darkweb:roomCreated')
AddEventHandler('darkweb:roomCreated', function(room)
    SendNUIMessage({
        action = 'darkweb:roomCreated',
        data = room
    })
end)


RegisterNetEvent('darkweb:roomJoined')
AddEventHandler('darkweb:roomJoined', function(response)
    SendNUIMessage({
        action = 'darkweb:roomJoined',
        data = response
    })
end)


RegisterNetEvent('darkweb:roomLeft')
AddEventHandler('darkweb:roomLeft', function(response)
    SendNUIMessage({
        action = 'darkweb:roomLeft',
        data = response
    })
end)


RegisterNetEvent('darkweb:receiveRoomMessages')
AddEventHandler('darkweb:receiveRoomMessages', function(data)
    SendNUIMessage({
        action = 'darkweb:updateRoomMessages',
        data = data
    })
end)


RegisterNetEvent('darkweb:receiveRoomMessage')
AddEventHandler('darkweb:receiveRoomMessage', function(data)
    SendNUIMessage({
        action = 'darkweb:newRoomMessage',
        data = data
    })
end)


RegisterNetEvent('darkweb:receiveMarketplace')
AddEventHandler('darkweb:receiveMarketplace', function(data)
    SendNUIMessage({
        action = 'darkweb:updateMarketplace',
        data = data
    })
end)


RegisterNetEvent('darkweb:itemCreated')
AddEventHandler('darkweb:itemCreated', function(response)
    SendNUIMessage({
        action = 'darkweb:itemCreated',
        data = response
    })
end)


RegisterNetEvent('darkweb:purchaseComplete')
AddEventHandler('darkweb:purchaseComplete', function(response)
    SendNUIMessage({
        action = 'darkweb:purchaseComplete',
        data = response
    })
end)


RegisterNetEvent('darkweb:reviewAdded')
AddEventHandler('darkweb:reviewAdded', function(response)
    SendNUIMessage({
        action = 'darkweb:reviewAdded',
        data = response
    })
end)


RegisterNetEvent('darkweb:receiveOnlineCount')
AddEventHandler('darkweb:receiveOnlineCount', function(count)
    SendNUIMessage({
        action = 'darkweb:updateOnlineCount',
        data = {count = count}
    })
end)


RegisterNetEvent('darkweb:receiveGlobalMessage')
AddEventHandler('darkweb:receiveGlobalMessage', function(messageData)
    
    SendNUIMessage({
        action = 'newMessage',
        data = messageData
    })
end)

RegisterNetEvent('darkweb:purchaseComplete')
AddEventHandler('darkweb:purchaseComplete', function(itemData)
    
    SendNUIMessage({
        action = 'darkweb:purchaseComplete',
        data = itemData
    })
end)

exports('OpenDarkweb', function()
    SendNUIMessage({
        action = 'openApp',
        appId = 'darkweb'
    })
end)

exports('GetDarkwebData', function()
    return {
        rooms = {},
        marketplace = {},
        userStats = {}
    }
end)
