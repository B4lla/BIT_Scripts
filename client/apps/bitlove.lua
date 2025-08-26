
RegisterNUICallback('bitlove:createProfile', function(data, cb)
    TriggerServerEvent('bitlove:createProfile', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:getProfile', function(data, cb)
    TriggerServerEvent('bitlove:getProfile')
    cb('ok')
end)

RegisterNUICallback('bitlove:getProfiles', function(data, cb)
    TriggerServerEvent('bitlove:getProfiles')
    cb('ok')
end)

RegisterNUICallback('bitlove:swipeProfile', function(data, cb)
    TriggerServerEvent('bitlove:swipeProfile', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:getMatches', function(data, cb)
    TriggerServerEvent('bitlove:getMatches')
    cb('ok')
end)

RegisterNUICallback('bitlove:sendMessage', function(data, cb)
    TriggerServerEvent('bitlove:sendMessage', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:getMessages', function(data, cb)
    TriggerServerEvent('bitlove:getMessages', data)
    cb('ok')
end)

RegisterNUICallback('bitlove:uploadPhoto', function(data, cb)
    TriggerServerEvent('bitlove:uploadPhoto', data)
    cb('ok')
end)
