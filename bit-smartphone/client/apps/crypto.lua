
RegisterNUICallback('loadCryptoData', function(data, cb)
    TriggerServerEvent('smartphone:crypto:requestData')
    cb({ success = true })
end)

RegisterNUICallback('buyCrypto', function(data, cb)
    TriggerServerEvent('smartphone:crypto:buyCrypto', data)
    cb({ success = true })
end)

RegisterNUICallback('sellCrypto', function(data, cb)
    TriggerServerEvent('smartphone:crypto:sellCrypto', data)
    cb({ success = true })
end)

RegisterNUICallback('refreshCryptoPrices', function(data, cb)
    TriggerServerEvent('smartphone:crypto:requestPrices')
    cb({ success = true })
end)

RegisterNetEvent('smartphone:crypto:receiveData')
AddEventHandler('smartphone:crypto:receiveData', function(data)
    SendNUIMessage({
        action = 'crypto:updateData',
        data = data
    })
end)

RegisterNetEvent('smartphone:crypto:priceUpdate')
AddEventHandler('smartphone:crypto:priceUpdate', function(prices)
    SendNUIMessage({
        action = 'crypto:priceUpdate',
        data = { prices = prices }
    })
end)

RegisterNetEvent('smartphone:crypto:transactionResult')
AddEventHandler('smartphone:crypto:transactionResult', function(result)
    SendNUIMessage({
        action = 'crypto:transactionResult',
        data = result
    })
end)
