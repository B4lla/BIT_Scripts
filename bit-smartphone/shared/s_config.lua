function getItem(playerID, item, amount)
    amount = amount or 1

    local ok, data = pcall(function()
        return exports.ox_inventory:GetItem(playerID, item, nil, true)
    end)
    if not ok or data == nil then
        return false
    end

    local count = 0
    if type(data) == 'number' then
        count = data
    elseif type(data) == 'table' and data.count then
        count = data.count
    end
    return count >= amount
end


function getMoney(playerID, account)
    account = account or 'money'
    
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(playerID)
        if xPlayer then
            if account == 'money' then
                return xPlayer.getMoney()
            elseif account == 'bank' then
                return xPlayer.getAccount('bank').money
            elseif account == 'crypto' then
                return xPlayer.getAccount('crypto') and xPlayer.getAccount('crypto').money or 0
            end
        end
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        local Player = QBCore.Functions.GetPlayer(playerID)
        if Player then
            if account == 'money' then
                return Player.PlayerData.money.cash or 0
            elseif account == 'bank' then
                return Player.PlayerData.money.bank or 0
            elseif account == 'crypto' then
                return Player.PlayerData.money.crypto or 0
            end
        end
    end
    
    return 0
end

function getBankMoney(playerID)
    return getMoney(playerID, 'bank')
end

function getCashMoney(playerID)
    return getMoney(playerID, 'money')
end

function getCryptoMoney(playerID)
    return getMoney(playerID, 'crypto')
end

function getAllPlayerMoney(playerID)
    return {
        cash = getCashMoney(playerID),
        bank = getBankMoney(playerID),
        crypto = getCryptoMoney(playerID)
    }
end

function hasEnoughMoney(playerID, amount, preferredAccount)
    preferredAccount = preferredAccount or 'bank'
    
    local money = getMoney(playerID, preferredAccount)
    if money >= amount then
        return true, preferredAccount
    end

    if preferredAccount ~= 'bank' then
        local bankMoney = getBankMoney(playerID)
        if bankMoney >= amount then
            return true, 'bank'
        end
    end
    
    if preferredAccount ~= 'money' then
        local cashMoney = getCashMoney(playerID)
        if cashMoney >= amount then
            return true, 'money'
        end
    end
    
    return false, nil
end

function removeMoney(playerID, amount, account)
    account = account or 'money'
    
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(playerID)
        if xPlayer then
            if account == 'money' then
                if xPlayer.getMoney() >= amount then
                    xPlayer.removeMoney(amount)
                    return true
                end
            elseif account == 'bank' then
                if xPlayer.getAccount('bank').money >= amount then
                    xPlayer.removeAccountMoney('bank', amount)
                    return true
                end
            elseif account == 'crypto' then
                if xPlayer.getAccount('crypto') and xPlayer.getAccount('crypto').money >= amount then
                    xPlayer.removeAccountMoney('crypto', amount)
                    return true
                end
            end
        end
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        local Player = QBCore.Functions.GetPlayer(playerID)
        if Player then
            if account == 'money' then
                if (Player.PlayerData.money.cash or 0) >= amount then
                    Player.Functions.RemoveMoney('cash', amount)
                    return true
                end
            elseif account == 'bank' then
                if (Player.PlayerData.money.bank or 0) >= amount then
                    Player.Functions.RemoveMoney('bank', amount)
                    return true
                end
            elseif account == 'crypto' then
                if (Player.PlayerData.money.crypto or 0) >= amount then
                    Player.Functions.RemoveMoney('crypto', amount)
                    return true
                end
            end
        end
    end
    
    return false
end

function addMoney(playerID, amount, account)
    account = account or 'money'
    
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(playerID)
        if xPlayer then
            if account == 'money' then
                xPlayer.addMoney(amount)
                return true
            elseif account == 'bank' then
                xPlayer.addAccountMoney('bank', amount)
                return true
            elseif account == 'crypto' then
                xPlayer.addAccountMoney('crypto', amount)
                return true
            end
        end
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        local Player = QBCore.Functions.GetPlayer(playerID)
        if Player then
            if account == 'money' then
                Player.Functions.AddMoney('cash', amount)
                return true
            elseif account == 'bank' then
                Player.Functions.AddMoney('bank', amount)
                return true
            elseif account == 'crypto' then
                Player.Functions.AddMoney('crypto', amount)
                return true
            end
        end
    end
    
    return false
end


function giveVehicleKeys(vehicle, plate)
    if not Config.Garage.useKeys then
        return
    end
    
    if Config.Garage.giveKeysEvent and Config.Garage.giveKeysEvent ~= "" then
        TriggerEvent(Config.Garage.giveKeysEvent, plate or GetVehicleNumberPlateText(vehicle))
    end
end