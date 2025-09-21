RegisterNUICallback('darkweb:getRooms', function(data, cb)
    TriggerServerEvent('bit-smartphone:darkweb:getRooms')
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
    
    TriggerServerEvent('bit-smartphone:darkweb:createRoom', roomData)
    cb('ok')
end)

RegisterNUICallback('darkweb:joinRoom', function(data, cb)
    if not data.code or data.code == '' then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:darkweb:joinRoom', data.code)
    cb('ok')
end)

RegisterNUICallback('darkweb:leaveRoom', function(data, cb)
    if not data.roomId then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:darkweb:leaveRoom', data.roomId)
    cb('ok')
end)


RegisterNUICallback('darkweb:sendMessage', function(data, cb)
    if not data or not data.roomId or not data.message or data.message == '' then
        cb('error')
        return
    end
    TriggerServerEvent('bit-smartphone:darkweb:sendMessage', data)
    cb('ok')
end)






RegisterNUICallback('crypto:getBalance', function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('smartphone:crypto:getUserData', function(result)
            local holdings = (result and result.holdings) or {}
            cb({ success = true, balance = holdings })
        end)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('smartphone:crypto:getUserData', function(result)
            local holdings = (result and result.holdings) or {}
            cb({ success = true, balance = holdings })
        end)
    else
        cb({ success = false })
    end
end)

RegisterNUICallback('darkweb:getBitcoinWallet', function(data, cb)
    TriggerServerEvent('darkweb:getBitcoinWallet')
    cb('ok')
end)

RegisterNUICallback('darkweb:sendBitcoin', function(data, cb)
    if not data or not data.recipientAddress or not data.amount then
        cb('error')
        return
    end
    TriggerServerEvent('darkweb:sendBitcoin', data)
    cb('ok')
end)

RegisterNUICallback('darkweb:getOnlineUsers', function(data, cb)
    TriggerServerEvent('bit-smartphone:darkweb:getOnlineUsers')
    cb('ok')
end)

RegisterNetEvent('bit-smartphone:darkweb:receiveRooms')
AddEventHandler('bit-smartphone:darkweb:receiveRooms', function(rooms)
    SendNUIMessage({
        action = 'roomsLoaded',
        data = {
            rooms = rooms
        }
    })
end)

RegisterNetEvent('bit-smartphone:darkweb:roomCreated')
AddEventHandler('bit-smartphone:darkweb:roomCreated', function(room)
    SendNUIMessage({ action = 'roomCreated', data = room })
end)

RegisterNetEvent('bit-smartphone:darkweb:roomJoined')
AddEventHandler('bit-smartphone:darkweb:roomJoined', function(response)
    SendNUIMessage({ action = 'darkweb:roomJoined', data = response })
end)

RegisterNetEvent('bit-smartphone:darkweb:roomLeft')
AddEventHandler('bit-smartphone:darkweb:roomLeft', function(response)
    SendNUIMessage({ action = 'darkweb:roomLeft', data = response })
end)

RegisterNetEvent('bit-smartphone:darkweb:receiveRoomMessages')
AddEventHandler('bit-smartphone:darkweb:receiveRoomMessages', function(data)
    SendNUIMessage({ action = 'darkweb:updateRoomMessages', data = data })
end)

RegisterNetEvent('bit-smartphone:darkweb:newMessage')
AddEventHandler('bit-smartphone:darkweb:newMessage', function(messageData)
    SendNUIMessage({ action = 'darkweb:newRoomMessage', data = messageData })
end)

RegisterNetEvent('bit-smartphone:darkweb:receiveOnlineCount')
AddEventHandler('bit-smartphone:darkweb:receiveOnlineCount', function(count)
    SendNUIMessage({ action = 'darkweb:updateOnlineCount', data = { count = count } })
end)

RegisterNetEvent('bit-smartphone:darkweb:receiveGlobalMessage')
AddEventHandler('bit-smartphone:darkweb:receiveGlobalMessage', function(messageData)
    SendNUIMessage({ action = 'newMessage', data = messageData })
end)

RegisterNetEvent('bit-smartphone:darkweb:receiveBitcoinWallet')
AddEventHandler('bit-smartphone:darkweb:receiveBitcoinWallet', function(wallet)
    SendNUIMessage({ action = 'darkweb:receiveBitcoinWallet', data = wallet })
end)

RegisterNetEvent('bit-smartphone:darkweb:bitcoinTransferResult')
AddEventHandler('bit-smartphone:darkweb:bitcoinTransferResult', function(payload)
    SendNUIMessage({ action = 'darkweb:bitcoinTransferResult', data = payload })
end)

RegisterNetEvent('bit-smartphone:darkweb:bitcoinReceived')
AddEventHandler('bit-smartphone:darkweb:bitcoinReceived', function(payload)
    SendNUIMessage({ action = 'darkweb:bitcoinReceived', data = payload })
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
        userStats = {}
    }
end)
