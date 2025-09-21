local messagesData = {
    chats = {},
    currentChat = nil,
    currentChatId = nil,
    contacts = {}
}


RegisterNetEvent('bit-smartphone:client:receiveChats')
AddEventHandler('bit-smartphone:client:receiveChats', function(chats)
    messagesData.chats = chats
    
    
    SendNUIMessage({
        action = 'updateChats',
        data = chats
    })
end)

RegisterNetEvent('bit-smartphone:client:receiveChatMessages')
AddEventHandler('bit-smartphone:client:receiveChatMessages', function(messages)
    SendNUIMessage({
        action = 'updateChatMessages',
        data = messages
    })
end)

RegisterNetEvent('bit-smartphone:client:receiveNewMessage')
AddEventHandler('bit-smartphone:client:receiveNewMessage', function(chatId, message)
    for i, chat in ipairs(messagesData.chats) do
        if chat.id == chatId then
            messagesData.chats[i].lastMessage = message.content
            messagesData.chats[i].timestamp = message.timestamp
            if message.senderId ~= 'me' then
                messagesData.chats[i].unread = (messagesData.chats[i].unread or 0) + 1
            end
            break
        end
    end
    
    SendNUIMessage({
        action = 'receiveNewMessage',
        data = {
            chatId = chatId,
            message = message
        }
    })
    
    local isCurrentChat = (messagesData.currentChatId ~= nil) and (tostring(messagesData.currentChatId) == tostring(chatId))
    if not isCurrentChat then
        local chatName = 'Mensaje nuevo'
        for _, chat in ipairs(messagesData.chats) do
            if chat.id == chatId then
                chatName = chat.name
                break
            end
        end
        
        PhoneNotify('messages.newMessage', {chatName or "Desconocido", message.content or ""}, 'system')
    end
end)

RegisterNetEvent('bit-smartphone:messages:receiveMessage')
AddEventHandler('bit-smartphone:messages:receiveMessage', function(payload)
    if type(payload) == 'table' then
        local chatId = payload.chatId or payload.chat_id or payload.with or payload.senderId
        local message = payload.message or payload
        if chatId and type(message) == 'table' then
            TriggerEvent('bit-smartphone:client:receiveNewMessage', chatId, message)
        end
    end
end)

RegisterNetEvent('bit-smartphone:client:updateMessageStatus')
AddEventHandler('bit-smartphone:client:updateMessageStatus', function(chatId, tempId, newMessage)
    SendNUIMessage({
        action = 'updateMessageStatus',
        data = {
            chatId = chatId,
            tempId = tempId,
            newMessage = newMessage
        }
    })
end)

RegisterNetEvent('bit-smartphone:client:messageError')
AddEventHandler('bit-smartphone:client:messageError', function(chatId, tempId, error)
    SendNUIMessage({
        action = 'messageError',
        data = {
            chatId = chatId,
            tempId = tempId,
            error = error
        }
    })
end)

RegisterNetEvent('bit-smartphone:client:chatCreated')
AddEventHandler('bit-smartphone:client:chatCreated', function(chatId)
    
    TriggerServerEvent('bit-smartphone:server:getChats')
    
    SendNUIMessage({
        action = 'chatCreated',
        data = { chatId = chatId }
    })
end)

RegisterNetEvent('bit-smartphone:client:reactionUpdated')
AddEventHandler('bit-smartphone:client:reactionUpdated', function(messageId, emoji, userId)
    SendNUIMessage({
        action = 'reactionUpdated',
        data = {
            messageId = messageId,
            emoji = emoji,
            userId = userId
        }
    })
end)

RegisterNetEvent('bit-smartphone:client:chatPinToggled')
AddEventHandler('bit-smartphone:client:chatPinToggled', function(chatId)
    
    for i, chat in ipairs(messagesData.chats) do
        if chat.id == chatId then
            messagesData.chats[i].pinned = not messagesData.chats[i].pinned
            break
        end
    end
    
    SendNUIMessage({
        action = 'chatPinToggled',
        data = { chatId = chatId }
    })
end)

RegisterNetEvent('bit-smartphone:client:chatMuteToggled')
AddEventHandler('bit-smartphone:client:chatMuteToggled', function(chatId)
    
    for i, chat in ipairs(messagesData.chats) do
        if chat.id == chatId then
            messagesData.chats[i].muted = not messagesData.chats[i].muted
            break
        end
    end
    
    SendNUIMessage({
        action = 'chatMuteToggled',
        data = { chatId = chatId }
    })
end)

RegisterNetEvent('bit-smartphone:client:chatDeleted')
AddEventHandler('bit-smartphone:client:chatDeleted', function(chatId)
    
    for i, chat in ipairs(messagesData.chats) do
        if chat.id == chatId then
            table.remove(messagesData.chats, i)
            break
        end
    end
    
    SendNUIMessage({
        action = 'chatDeleted',
        data = { chatId = chatId }
    })
end)

RegisterNetEvent('bit-smartphone:client:receiveContacts')
AddEventHandler('bit-smartphone:client:receiveContacts', function(contacts)
    messagesData.contacts = contacts
    
    SendNUIMessage({
        action = 'updateContacts',
        data = contacts
    })
end)


RegisterNUICallback('messages:getChats', function(data, cb)
    if not IsPhoneConnected() then
        cb({success = false, error = 'no_signal'})
        return
    end
    TriggerServerEvent('bit-smartphone:server:getChats')
    cb('ok')
end)

RegisterNUICallback('messages:openChat', function(data, cb)
    local chatId = data.chatId
    if not chatId then
        cb('error')
        return
    end
    
    
    for _, chat in ipairs(messagesData.chats) do
        if chat.id == chatId then
            messagesData.currentChat = chat
            messagesData.currentChatId = chat.id
            break
        end
    end
    
    
    TriggerServerEvent('bit-smartphone:server:getChatMessages', chatId, 1)
    cb('ok')
end)

RegisterNUICallback('messages:sendMessage', function(data, cb)
    if not IsPhoneConnected() then
        cb({success = false, error = 'no_signal'})
        return
    end
    
    local chatId = data.chatId or data.phoneNumber
    local messageType = data.type or 'text'
    local content = data.content or data.message
    local metadata = data.metadata
    
    if not chatId or not content or content == '' then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:server:sendMessage', chatId, messageType, content, metadata)
    cb('ok')
end)

RegisterNUICallback('messages:createChat', function(data, cb)
    local contactIdentifier = data.contactIdentifier
    local contactName = data.contactName
    
    if not contactIdentifier then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:server:createChat', contactIdentifier, contactName)
    cb('ok')
end)

RegisterNUICallback('messages:addReaction', function(data, cb)
    local messageId = data.messageId
    local emoji = data.emoji
    
    if not messageId or not emoji then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:server:addReaction', messageId, emoji)
    cb('ok')
end)

RegisterNUICallback('messages:togglePinChat', function(data, cb)
    local chatId = data.chatId
    
    if not chatId then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:server:togglePinChat', chatId)
    cb('ok')
end)

RegisterNUICallback('messages:toggleMuteChat', function(data, cb)
    local chatId = data.chatId
    
    if not chatId then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:server:toggleMuteChat', chatId)
    cb('ok')
end)

RegisterNUICallback('messages:deleteChat', function(data, cb)
    local chatId = data.chatId
    
    if not chatId then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:server:deleteChat', chatId)
    cb('ok')
end)

RegisterNUICallback('messages:getContacts', function(data, cb)
    if Config.Framework == 'esx' and ESX then
        ESX.TriggerServerCallback('bit-smartphone:messages:loadContacts', function(contacts)
            messagesData.contacts = contacts or {}
            SendNUIMessage({ action = 'updateContacts', data = contacts or {} })
            cb('ok')
        end)
    elseif QBCore then
        QBCore.Functions.TriggerCallback('bit-smartphone:messages:loadContacts', function(contacts)
            messagesData.contacts = contacts or {}
            SendNUIMessage({ action = 'updateContacts', data = contacts or {} })
            cb('ok')
        end)
    else
        cb('error')
    end
end)

RegisterNUICallback('messages:loadMoreMessages', function(data, cb)
    local chatId = data.chatId
    local page = data.page or 2
    
    if not chatId then
        cb('error')
        return
    end
    
    TriggerServerEvent('bit-smartphone:server:getChatMessages', chatId, page)
    cb('ok')
end)

RegisterNUICallback('messages:getLocation', function(data, cb)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)

    local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local streetName = ''
    local crossingName = ''
    if streetHash and streetHash ~= 0 then
        streetName = GetStreetNameFromHashKey(streetHash) or ''
    end
    if crossingHash and crossingHash ~= 0 then
        crossingName = GetStreetNameFromHashKey(crossingHash) or ''
    end

    local address = 'Ubicación compartida'
    if streetName ~= '' then
        if crossingName ~= '' then
            address = string.format('%s & %s', streetName, crossingName)
        else
            address = streetName
        end
    end

    local result = {
        coords = { x = coords.x, y = coords.y, z = coords.z },
        address = address
    }
    cb(result)
end)

RegisterNUICallback('messages:navigate', function(data, cb)
    local x = tonumber(data.x)
    local y = tonumber(data.y)
    if x and y then
        SetNewWaypoint(x + 0.0, y + 0.0)
        cb({ ok = true })
    else
        cb({ ok = false, error = 'invalid_coords' })
    end
end)


function GetMessagesData()
    return messagesData
end

function CreateNewChat(targetPlayerId, contactName)
    local targetPlayer = GetPlayerFromServerId(targetPlayerId)
    if targetPlayer and targetPlayer ~= PlayerId() then
        
        
        SendNUIMessage({
            action = 'openNewChatDialog',
            data = {
                targetId = targetPlayerId,
                targetName = contactName or GetPlayerName(targetPlayer)
            }
        })
    end
end


exports('GetMessagesData', GetMessagesData)
exports('CreateNewChat', CreateNewChat)
