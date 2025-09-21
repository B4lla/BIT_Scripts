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
    local result = {}

    local ok, holdings = pcall(function()
        local query = "SELECT crypto_symbol, amount, average_buy_price FROM bit_phone_crypto_holdings WHERE `user_id` = ?"
        return SqlFunc(Config.Mysql, 'fetchAll', query, { identifier })
    end)

    if not ok or not holdings then
        print('[Crypto] Warning: unable to fetch holdings for user ' .. tostring(identifier))
        return result
    end

    for _, holding in ipairs(holdings or {}) do
        local symbol = holding.crypto_symbol
        local amt = tonumber(holding.amount) or 0
        local avg = tonumber(holding.average_buy_price) or 0

        if symbol then
            result[tostring(symbol)] = {
                amount = amt,
                averageBuyPrice = avg,
                totalInvested = amt * avg
            }
        end
    end

    return result
end

local function UpdateHolding(identifier, cryptoSymbol, amount, averageBuyPrice)
    local query = [[ 
        INSERT INTO bit_phone_crypto_holdings (`user_id`, `crypto_symbol`, `amount`, `average_buy_price`) 
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
        amount = ?, 
        average_buy_price = ?,
        updated_at = CURRENT_TIMESTAMP
    ]]

    SqlFunc(Config.Mysql, 'execute', query, { identifier, cryptoSymbol, amount, averageBuyPrice, amount, averageBuyPrice })
end

local function AddTransaction(identifier, cryptoSymbol, transactionType, amount, pricePerUnit, totalValue, paymentMethod)
    local normalizedType = 'buy'
    if transactionType == 'sell' then normalizedType = 'sell' end

    local query = [[ 
        INSERT INTO bit_phone_crypto_transactions 
        (`user_id`, `crypto_symbol`, `transaction_type`, `amount`, `price_per_unit`, `total_value`, `payment_method`) 
        VALUES (?, ?, ?, ?, ?, ?, ?) 
    ]]

    SqlFunc(Config.Mysql, 'execute', query, { identifier, cryptoSymbol, normalizedType, amount, pricePerUnit, totalValue, paymentMethod })
end

local function GetUserTransactions(identifier)
    local query = [[
        SELECT crypto_symbol, transaction_type, amount, price_per_unit, total_value, payment_method, created_at 
        FROM bit_phone_crypto_transactions 
        WHERE `user_id` = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ]]

    local ok, rows = pcall(function()
        return SqlFunc(Config.Mysql, 'fetchAll', query, { identifier })
    end)

    if ok and rows then
        return rows or {}
    end

    print('[Crypto] Warning: unable to fetch transactions for user ' .. tostring(identifier))
    return {}
end

function Crypto_GetUserBalance(identifier, cryptoSymbol)
    local holdings = GetUserHoldings(identifier)
    if not cryptoSymbol then
        return holdings
    end
    return (holdings[cryptoSymbol] and tonumber(holdings[cryptoSymbol].amount)) or 0
end

function Crypto_ModifyUserBalance(identifier, cryptoSymbol, deltaAmount, transactionType, pricePerUnit, totalValue, paymentMethod)
    if not identifier or not cryptoSymbol or not deltaAmount then
        return false, 'Invalid arguments'
    end

    local currentHoldings = GetUserHoldings(identifier)
    local current = currentHoldings[cryptoSymbol] or { amount = 0, averageBuyPrice = 0 }
    local deltaNum = tonumber(deltaAmount) or 0
    local newAmount = tonumber(current.amount) + deltaNum
    if newAmount < 0 then
        return false, 'Insufficient crypto balance'
    end

    UpdateHolding(identifier, cryptoSymbol, newAmount, current.averageBuyPrice)
    local tnorm = 'buy'
    if deltaNum < 0 then tnorm = 'sell' else tnorm = 'buy' end
    AddTransaction(identifier, cryptoSymbol, tnorm, math.abs(deltaNum), pricePerUnit or 0, totalValue or 0, paymentMethod or 'server')

    return true
end

function Crypto_GetUserTransactions(identifier, cryptoSymbol)
    local all = GetUserTransactions(identifier)
    if not cryptoSymbol then
        return all
    end
    local filtered = {}
    for _, t in ipairs(all) do
        if t.crypto_symbol == cryptoSymbol then
            table.insert(filtered, t)
        end
    end
    return filtered
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
    local currentHolding = currentHoldings[cryptoSymbol] or { amount = 0, averageBuyPrice = 0 }
    
    currentHolding.amount = tonumber(currentHolding.amount) or 0
    currentHolding.averageBuyPrice = tonumber(currentHolding.averageBuyPrice) or 0
    
    local newAmount = currentHolding.amount + amount
    local currentTotalInvested = currentHolding.amount * currentHolding.averageBuyPrice
    local newTotalInvested = currentTotalInvested + totalCost
    local newAverageBuyPrice = newAmount > 0 and (newTotalInvested / newAmount) or 0
    
    UpdateHolding(identifier, cryptoSymbol, newAmount, newAverageBuyPrice)
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
    
    currentHolding.amount = tonumber(currentHolding.amount) or 0
    currentHolding.averageBuyPrice = tonumber(currentHolding.averageBuyPrice) or 0
    
    local totalReceived = amount * currentPrice
    local newAmount = currentHolding.amount - amount
    local proportionSold = amount / currentHolding.amount
    local currentTotalInvested = currentHolding.amount * currentHolding.averageBuyPrice
    local newTotalInvested = currentTotalInvested * (1 - proportionSold)
    local newAverageBuyPrice = newAmount > 0 and (newTotalInvested / newAmount) or 0
    
    if newAmount <= 0.00000001 then
        newAmount = 0
        newAverageBuyPrice = 0
    end
    
    UpdateHolding(identifier, cryptoSymbol, newAmount, newAverageBuyPrice)
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
        data = { prices = cryptoPrices }
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
