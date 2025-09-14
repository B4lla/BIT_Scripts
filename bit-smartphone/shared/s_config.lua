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


function GetPlayerVehicles(playerID)
    if not Config.Garage.enabled then
        return {}
    end

    local identifier
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(playerID)
        if xPlayer then identifier = xPlayer.identifier end
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        local Player = QBCore.Functions.GetPlayer(playerID)
        if Player then identifier = Player.PlayerData.citizenid end
    end
    if not identifier then return {} end

    local vehicles = {}

    if Config.Framework == 'esx' then
        local tableName = Config.Garage.vehicleTable or 'owned_vehicles'
        local query = ('SELECT plate, vehicle, parking FROM %s WHERE owner = @identifier'):format(tableName)
        local rows = SqlFunc(Config.Mysql, 'fetchAll', query, { ['@identifier'] = identifier })
        if rows and type(rows) == 'table' then
            for i = 1, #rows do
                local row = rows[i]
                local vehicleData = {}
                if row.vehicle and type(row.vehicle) == 'string' then
                    local ok, parsed = pcall(json.decode, row.vehicle)
                    if ok and parsed then vehicleData = parsed end
                elseif type(row.vehicle) == 'table' then
                    vehicleData = row.vehicle
                end

                local plate = row.plate or row.Plate or 'UNKNOWN'
                local label = tostring(vehicleData.model or vehicleData.name or vehicleData.displayName or plate)
                local parking = row.parking or row.location or 'Unknown'
                local fuel = math.floor(vehicleData.fuelLevel or vehicleData.fuel or 0)

                table.insert(vehicles, {
                    plate = plate,
                    label = label,
                    location = parking,
                    fuel = fuel
                })
            end
        end

    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        local tableName = Config.Garage.vehicleTable or 'player_vehicles'
        local query = ('SELECT plate, vehicle, parking FROM %s WHERE citizenid = @identifier'):format(tableName)
        local rows = SqlFunc(Config.Mysql, 'fetchAll', query, { ['@identifier'] = identifier })
        if rows and type(rows) == 'table' then
            for i = 1, #rows do
                local row = rows[i]
                local vehicleData = {}
                if row.vehicle and type(row.vehicle) == 'string' then
                    local ok, parsed = pcall(json.decode, row.vehicle)
                    if ok and parsed then vehicleData = parsed end
                elseif type(row.vehicle) == 'table' then
                    vehicleData = row.vehicle
                end

                local plate = row.plate or row.Plate or 'UNKNOWN'
                local label = tostring(vehicleData.model or vehicleData.name or vehicleData.displayName or plate)
                local parking = row.parking or row.location or 'Unknown'
                local fuel = math.floor(vehicleData.fuelLevel or vehicleData.fuel or 0)

                table.insert(vehicles, {
                    plate = plate,
                    label = label,
                    location = parking,
                    fuel = fuel
                })
            end
        end
    end

    return vehicles
end