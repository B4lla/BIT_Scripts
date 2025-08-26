local cryptoPrices = {}
local lastPriceUpdate = 0

local function GetPlayerIdentifier(src)
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(src)
        return xPlayer and xPlayer.identifier or nil
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(src)
        return Player and Player.PlayerData.citizenid or nil
    end
    return nil
end

local function UpdateCryptoPrices()
    if not Config.Crypto.enabled then return end
    
    local currentTime = os.time() * 1000
    if currentTime - lastPriceUpdate < Config.Crypto.updateInterval then
        return
    end
    
    PerformHttpRequest(Config.Crypto.apiUrl .. Config.Crypto.apiParams, function(status, response)
        if status == 200 then
            local success, data = pcall(json.decode, response)
            if success and data then
                cryptoPrices = data
                lastPriceUpdate = currentTime
                TriggerClientEvent('smartphone:crypto:priceUpdate', -1, cryptoPrices)
            end
        end
    end)
end

local function GetUserHoldings(identifier)
    local query = "SELECT crypto_symbol, amount, total_invested FROM bit_phone_crypto_holdings WHERE user_id = @user_id"
    local holdings = SqlFunc(Config.Mysql, 'fetchAll', query, { ['@user_id'] = identifier })
    local result = {}
    
    if holdings then
        for _, holding in ipairs(holdings) do
            result[holding.crypto_symbol] = {
                amount = tonumber(holding.amount) or 0,
                totalInvested = tonumber(holding.total_invested) or 0
            }
        end
    end
    
    return result
end

local function UpdateHolding(identifier, cryptoSymbol, amount, totalInvested)
    local query = [[
        INSERT INTO bit_phone_crypto_holdings (user_id, crypto_symbol, amount, total_invested) 
        VALUES (@user_id, @crypto_symbol, @amount, @total_invested)
        ON DUPLICATE KEY UPDATE 
        amount = @amount, 
        total_invested = @total_invested,
        updated_at = CURRENT_TIMESTAMP
    ]]
    
    SqlFunc(Config.Mysql, 'execute', query, {
        ['@user_id'] = identifier,
        ['@crypto_symbol'] = cryptoSymbol,
        ['@amount'] = amount,
        ['@total_invested'] = totalInvested
    })
end

local function AddTransaction(identifier, cryptoSymbol, transactionType, amount, pricePerUnit, totalValue, paymentMethod)
    local query = [[
        INSERT INTO bit_phone_crypto_transactions 
        (user_id, crypto_symbol, transaction_type, amount, price_per_unit, total_value, payment_method) 
        VALUES (@user_id, @crypto_symbol, @transaction_type, @amount, @price_per_unit, @total_value, @payment_method)
    ]]
    
    SqlFunc(Config.Mysql, 'execute', query, {
        ['@user_id'] = identifier,
        ['@crypto_symbol'] = cryptoSymbol,
        ['@transaction_type'] = transactionType,
        ['@amount'] = amount,
        ['@price_per_unit'] = pricePerUnit,
        ['@total_value'] = totalValue,
        ['@payment_method'] = paymentMethod
    })
end

local function GetUserTransactions(identifier)
    local query = [[
        SELECT crypto_symbol, transaction_type, amount, price_per_unit, total_value, payment_method, created_at 
        FROM bit_phone_crypto_transactions 
        WHERE user_id = @user_id 
        ORDER BY created_at DESC 
        LIMIT 50
    ]]
    
    return SqlFunc(Config.Mysql, 'fetchAll', query, { ['@user_id'] = identifier }) or {}
end

RegisterNetEvent('smartphone:crypto:requestData')
AddEventHandler('smartphone:crypto:requestData', function()
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    UpdateCryptoPrices()
    
    local holdings = GetUserHoldings(identifier)
    local transactions = GetUserTransactions(identifier)
    local moneyBalances = getAllPlayerMoney(src)
    
    TriggerClientEvent('smartphone:crypto:receiveData', src, {
        holdings = holdings,
        transactions = transactions,
        prices = cryptoPrices,
        moneyBalances = moneyBalances
    })
end)

RegisterNetEvent('smartphone:crypto:buyCrypto')
AddEventHandler('smartphone:crypto:buyCrypto', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local cryptoSymbol = data.cryptoSymbol
    local amount = tonumber(data.amount)
    local paymentMethod = data.paymentMethod or 'bank'
    
    if not cryptoSymbol or not amount or amount <= 0 then
        TriggerClientEvent('smartphone:crypto:transactionResult', src, { success = false, message = 'Invalid transaction data' })
        return
    end
    
    local currentPrice = cryptoPrices[cryptoSymbol] and cryptoPrices[cryptoSymbol].usd
    if not currentPrice then
        TriggerClientEvent('smartphone:crypto:transactionResult', src, { success = false, message = 'Price not available' })
        return
    end
    
    local totalCost = amount * currentPrice
    
    if not removeMoney(src, totalCost, paymentMethod) then
        TriggerClientEvent('smartphone:crypto:transactionResult', src, { success = false, message = 'Insufficient funds' })
        return
    end
    
    local currentHoldings = GetUserHoldings(identifier)
    local currentHolding = currentHoldings[cryptoSymbol] or { amount = 0, totalInvested = 0 }
    
    local newAmount = currentHolding.amount + amount
    local newTotalInvested = currentHolding.totalInvested + totalCost
    
    UpdateHolding(identifier, cryptoSymbol, newAmount, newTotalInvested)
    AddTransaction(identifier, cryptoSymbol, 'buy', amount, currentPrice, totalCost, paymentMethod)
    
    local updatedHoldings = GetUserHoldings(identifier)
    local moneyBalances = getAllPlayerMoney(src)
    
    TriggerClientEvent('smartphone:crypto:transactionResult', src, { 
        success = true, 
        message = 'Purchase successful',
        holdings = updatedHoldings,
        moneyBalances = moneyBalances
    })
end)

RegisterNetEvent('smartphone:crypto:sellCrypto')
AddEventHandler('smartphone:crypto:sellCrypto', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    local cryptoSymbol = data.cryptoSymbol
    local amount = tonumber(data.amount)
    local paymentMethod = data.paymentMethod or 'bank'
    
    if not cryptoSymbol or not amount or amount <= 0 then
        TriggerClientEvent('smartphone:crypto:transactionResult', src, { success = false, message = 'Invalid transaction data' })
        return
    end
    
    local currentPrice = cryptoPrices[cryptoSymbol] and cryptoPrices[cryptoSymbol].usd
    if not currentPrice then
        TriggerClientEvent('smartphone:crypto:transactionResult', src, { success = false, message = 'Price not available' })
        return
    end
    
    local currentHoldings = GetUserHoldings(identifier)
    local currentHolding = currentHoldings[cryptoSymbol]
    
    if not currentHolding or currentHolding.amount < amount then
        TriggerClientEvent('smartphone:crypto:transactionResult', src, { success = false, message = 'Insufficient crypto balance' })
        return
    end
    
    local totalReceived = amount * currentPrice
    local newAmount = currentHolding.amount - amount
    local proportionSold = amount / currentHolding.amount
    local newTotalInvested = currentHolding.totalInvested * (1 - proportionSold)
    
    if newAmount <= 0.00000001 then
        newAmount = 0
        newTotalInvested = 0
    end
    
    UpdateHolding(identifier, cryptoSymbol, newAmount, newTotalInvested)
    AddTransaction(identifier, cryptoSymbol, 'sell', amount, currentPrice, totalReceived, paymentMethod)
    
    addMoney(src, totalReceived, paymentMethod)
    
    local updatedHoldings = GetUserHoldings(identifier)
    local moneyBalances = getAllPlayerMoney(src)
    
    TriggerClientEvent('smartphone:crypto:transactionResult', src, { 
        success = true, 
        message = 'Sale successful',
        holdings = updatedHoldings,
        moneyBalances = moneyBalances
    })
end)

RegisterNetEvent('smartphone:crypto:requestPrices')
AddEventHandler('smartphone:crypto:requestPrices', function()
    local src = source
    UpdateCryptoPrices()
    TriggerClientEvent('smartphone:crypto:priceUpdate', src, cryptoPrices)
end)

if Config.Framework == "esx" then
    ESX.RegisterServerCallback('smartphone:crypto:getUserData', function(source, cb)
        local identifier = GetPlayerIdentifier(source)
        if not identifier then
            cb({ success = false })
            return
        end
        
        UpdateCryptoPrices()
        
        cb({
            success = true,
            holdings = GetUserHoldings(identifier),
            transactions = GetUserTransactions(identifier),
            prices = cryptoPrices,
            moneyBalances = getAllPlayerMoney(source)
        })
    end)
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Functions.CreateCallback('smartphone:crypto:getUserData', function(source, cb)
        local identifier = GetPlayerIdentifier(source)
        if not identifier then
            cb({ success = false })
            return
        end
        
        UpdateCryptoPrices()
        
        cb({
            success = true,
            holdings = GetUserHoldings(identifier),
            transactions = GetUserTransactions(identifier),
            prices = cryptoPrices,
            moneyBalances = getAllPlayerMoney(source)
        })
    end)
end

CreateThread(function()
    while true do
        if Config.Crypto.enabled then
            UpdateCryptoPrices()
        end
        Wait(Config.Crypto.updateInterval)
    end
end)


RegisterNetEvent('crypto:getPrices')
AddEventHandler('crypto:getPrices', function()
    local source = source
    
    TriggerClientEvent('phone:sendNUIMessage', source, {
        action = 'crypto:prices_updated',
        data = { prices = cryptoPricesCache }
    })
end)


RegisterCommand('givecrypto', function(source, args, rawCommand)
    if source == 0 or IsPlayerAceAllowed(source, 'command.givecrypto') then
        local playerId = tonumber(args[1])
        local cryptoSymbol = args[2]
        local amount = tonumber(args[3])
        
        if not playerId or not cryptoSymbol or not amount then
            print('Uso: /givecrypto <playerid> <crypto_symbol> <amount>')
            return
        end
        
        local identifier = GetPlayerIdentifier(playerId)
        if not identifier then
            print('Jugador no encontrado')
            return
        end
        
        
        local existingWallet = SqlFunc("SELECT * FROM bit_crypto_wallets WHERE identifier = ? AND crypto_symbol = ?", 
                                      {identifier, cryptoSymbol})
        
        if existingWallet and existingWallet[1] then
            local newAmount = tonumber(existingWallet[1].amount) + amount
            SqlFunc("UPDATE bit_crypto_wallets SET amount = ? WHERE identifier = ? AND crypto_symbol = ?",
                   {newAmount, identifier, cryptoSymbol})
        else
            SqlFunc("INSERT INTO bit_crypto_wallets (identifier, crypto_symbol, amount, total_invested) VALUES (?, ?, ?, ?)",
                   {identifier, cryptoSymbol, amount, 0})
        end
        
        print(string.format('Se han dado %.8f %s al jugador %d', amount, cryptoSymbol:upper(), playerId))
        
        
        TriggerEvent('crypto:getWallet', playerId)
    end
end, false)
