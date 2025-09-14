RegisterNUICallback('bank:getPlayers', function(data, cb)
    TriggerServerEvent('bit-smartphone:app:bank:getPlayers')
    cb('ok')
end)

RegisterNUICallback('bank:getBalance', function(data, cb)
    TriggerServerEvent('bit-smartphone:app:bank:getBalance')
    cb('ok')
end)

RegisterNUICallback('bank:transfer', function(data, cb)
    TriggerServerEvent('bit-smartphone:app:bank:transfer', data)
    cb('ok')
end)

RegisterNUICallback('bank:getTransactions', function(data, cb)
    TriggerServerEvent('bit-smartphone:app:bank:getTransactions')
    cb('ok')
end)
