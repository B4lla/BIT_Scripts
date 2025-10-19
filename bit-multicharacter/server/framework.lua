if Config.Framework == "esx" then
    ESX = exports["es_extended"]:getSharedObject()
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore = exports["qb-core"]:GetCoreObject()
else
    print("^1[ERROR]^7 Unrecognized framework: " .. Config.Framework)
end

Framework = {}

function Framework.GetPlayer(source)
    if Config.Framework == "esx" then
        return ESX.GetPlayerFromId(source)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        return QBCore.Functions.GetPlayer(source)
    end
    return nil
end

function Framework.GetIdentifier(source)
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
            local identifier = xPlayer.identifier
            if identifier:match("char%d+:") then
                return identifier:gsub("char%d+:", "")
            end
            if identifier:match("license:") then
                return identifier:gsub("license:", "")
            end
            return identifier
        end
        
        local license = nil
        for i = 0, GetNumPlayerIdentifiers(source) - 1 do
            local identifier = GetPlayerIdentifier(source, i)
            if identifier and identifier:find("license:") then
                license = identifier:gsub("license:", "")
                break
            end
        end
        return license
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(source)
        if Player then
            return Player.PlayerData.license
        end
        
        local license = nil
        for i = 0, GetNumPlayerIdentifiers(source) - 1 do
            local identifier = GetPlayerIdentifier(source, i)
            if identifier and identifier:find("license:") then
                license = identifier
                break
            end
        end
        return license
    end
    return nil
end

function Framework.CreatePlayer(source, charInfo)
    if Config.Framework == "esx" then
        return true
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local newData = {}
        newData.cid = charInfo.cid
        newData.money = {}
        newData.money.bank = 5000
        newData.money.cash = 500
        newData.optin = true
        newData.charinfo = charInfo
        
        return QBCore.Player.Login(source, false, newData)
    end
    return false
end

function Framework.GetCharacterData(source)
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
            return {
                firstname = xPlayer.variables.firstName or xPlayer.get('firstName'),
                lastname = xPlayer.variables.lastName or xPlayer.get('lastName'),
                dateofbirth = xPlayer.variables.dateofbirth or xPlayer.get('dateofbirth'),
                sex = xPlayer.variables.sex or xPlayer.get('sex'),
                height = xPlayer.variables.height or xPlayer.get('height'),
                money = xPlayer.getMoney(),
                bank = xPlayer.getAccount('bank').money,
                job = xPlayer.job.name,
                phone_number = xPlayer.variables.phone_number or xPlayer.get('phone_number')
            }
        end
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(source)
        if Player then
            return {
                firstname = Player.PlayerData.charinfo.firstname,
                lastname = Player.PlayerData.charinfo.lastname,
                dateofbirth = Player.PlayerData.charinfo.birthdate,
                sex = Player.PlayerData.charinfo.gender == 0 and 'm' or 'f',
                height = Player.PlayerData.charinfo.height or 180,
                money = Player.PlayerData.money.cash,
                bank = Player.PlayerData.money.bank,
                job = Player.PlayerData.job.name,
                phone_number = Player.PlayerData.charinfo.phone
            }
        end
    end
    return nil
end

function Framework.LogoutPlayer(source)
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
            xPlayer.triggerEvent('esx:onPlayerLogout')
        end
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Player.Logout(source)
    end
end

function Framework.DeleteCharacter(source, cid)
    if Config.Framework == "esx" then
        return true
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Player.DeleteCharacter(source, cid)
        return true
    end
    return false
end