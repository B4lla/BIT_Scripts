local function GetPlayerIdentifier(source)
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier or nil
    else
        local Player = QBCore.Functions.GetPlayer(source)
        return Player and Player.PlayerData.citizenid or nil
    end
end

local function getPlayerServerIdByIdentifier(identifier)
    if not identifier then return nil end
    if Config.Framework == 'esx' then
        local xPlayers = ESX.GetPlayers()
        for _, playerId in ipairs(xPlayers) do
            local xPlayer = ESX.GetPlayerFromId(playerId)
            if xPlayer and xPlayer.identifier == identifier then
                return playerId
            end
        end
    else
        for _, pid in ipairs(GetPlayers()) do
            local Player = QBCore.Functions.GetPlayer(pid)
            if Player and Player.PlayerData.citizenid == identifier then
                return pid
            end
        end
    end
    return nil
end

RegisterNetEvent('bit-smartphone:app:bank:getPlayers')
AddEventHandler('bit-smartphone:app:bank:getPlayers', function()
    local src = source
    local players = {}

    for _, pid in ipairs(GetPlayers()) do
        local name = nil
        local identifier = nil
        if Config.Framework == 'esx' then
            local xPlayer = ESX.GetPlayerFromId(pid)
            if xPlayer then
                name = xPlayer.getName() or ('Player ' .. tostring(pid))
                identifier = xPlayer.identifier
            end
        else
            local Player = QBCore.Functions.GetPlayer(pid)
            if Player then
                name = Player.PlayerData.charinfo and (Player.PlayerData.charinfo.firstname .. ' ' .. Player.PlayerData.charinfo.lastname) or ('Player ' .. tostring(pid))
                identifier = Player.PlayerData.citizenid
            end
        end

        if identifier then
            table.insert(players, {
                serverId = tonumber(pid),
                name = name,
                identifier = identifier,
                isOnline = true
            })
        end
    end

    TriggerClientEvent('phone:sendNUIMessage', src, {
        action = 'bank:players_list',
        data = { players = players }
    })
end)

RegisterNetEvent('bit-smartphone:app:bank:getBalance')
AddEventHandler('bit-smartphone:app:bank:getBalance', function()
    local src = source
    local moneyData = getAllPlayerMoney(src)
    TriggerClientEvent('phone:sendNUIMessage', src, {
        action = 'bank:balance',
        data = { balance = moneyData.bank or 0, moneyBalances = moneyData }
    })
end)

RegisterNetEvent('bit-smartphone:app:bank:transfer')
AddEventHandler('bit-smartphone:app:bank:transfer', function(data)
    local src = source
    local fromIdentifier = GetPlayerIdentifier(src)
    if not fromIdentifier or not data or not data.toIdentifier or not data.amount then
        TriggerClientEvent('phone:sendNUIMessage', src, { action = 'bank:transfer_result', data = { success = false, error = 'invalid_data' } })
        return
    end

    local amount = tonumber(data.amount)
    if not amount or amount <= 0 then
        TriggerClientEvent('phone:sendNUIMessage', src, { action = 'bank:transfer_result', data = { success = false, error = 'invalid_amount' } })
        return
    end

    
    local hasEnough, accountType = hasEnoughMoney(src, amount, 'bank')
    if not hasEnough then
        TriggerClientEvent('phone:sendNUIMessage', src, { action = 'bank:transfer_result', data = { success = false, error = 'insufficient_funds' } })
        return
    end

    
    local targetServerId = getPlayerServerIdByIdentifier(data.toIdentifier)

    
    if not removeMoney(src, amount, accountType) then
        TriggerClientEvent('phone:sendNUIMessage', src, { action = 'bank:transfer_result', data = { success = false, error = 'deduct_failed' } })
        return
    end

    local added = false
    if targetServerId then
        
        added = addMoney(targetServerId, amount, 'bank')
    else
        local res = SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_bank_pending (`to_identifier`, `amount`, `from_identifier`, `created_at`) VALUES (@to, @amount, @from, NOW())', {
            ['@to'] = data.toIdentifier,
            ['@amount'] = amount,
            ['@from'] = fromIdentifier
        })
        added = res and true or false
    end

    if not added then
        
        addMoney(src, amount, accountType)
        TriggerClientEvent('phone:sendNUIMessage', src, { action = 'bank:transfer_result', data = { success = false, error = 'credit_failed' } })
        return
    end

    
    local insertRes = SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_bank_transactions (`from_identifier`, `to_identifier`, `amount`, `concept`, `created_at`) VALUES (@from, @to, @amount, @concept, NOW())', {
        ['@from'] = fromIdentifier,
        ['@to'] = data.toIdentifier,
        ['@amount'] = amount,
        ['@concept'] = data.concept or ''
    })

    
    TriggerClientEvent('phone:sendNUIMessage', src, { action = 'bank:transfer_result', data = { success = true, amount = amount, to = data.toIdentifier } })
    if targetServerId then
        TriggerClientEvent('phone:sendNUIMessage', targetServerId, { action = 'bank:incoming_transfer', data = { amount = amount, from = fromIdentifier } })
    end

    
    TriggerEvent('bit-smartphone:app:bank:getBalance', src)
    if targetServerId then
        TriggerEvent('bit-smartphone:app:bank:getBalance', targetServerId)
    end
end)
RegisterNetEvent('bit-smartphone:app:bank:getTransactions')
AddEventHandler('bit-smartphone:app:bank:getTransactions', function()
    local src = source
    local ident = GetPlayerIdentifier(src)
    if not ident then
        TriggerClientEvent('phone:sendNUIMessage', src, { action = 'bank:transactions', data = { transactions = {} } })
        return
    end

    local rows = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id, from_identifier, to_identifier, amount, concept, created_at FROM bit_phone_bank_transactions WHERE from_identifier = @ident OR to_identifier = @ident ORDER BY created_at DESC LIMIT 200', { ['@ident'] = ident }) or {}

    TriggerClientEvent('phone:sendNUIMessage', src, { action = 'bank:transactions', data = { transactions = rows } })
end)
