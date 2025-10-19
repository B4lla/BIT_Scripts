if Config.Framework == "esx" then
    ESX = exports["es_extended"]:getSharedObject()
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore = exports["qb-core"]:GetCoreObject()
else
    print("^1[ERROR]^7 Unrecognized framework: " .. Config.Framework)
end

Framework = {}

function Framework.ShowNotification(text, type)
    if Config.Framework == "esx" then
        ESX.ShowNotification(text, type)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.Notify(text, type)
    end
end

function Framework.GetPlayerData()
    if Config.Framework == "esx" then
        return ESX.GetPlayerData()
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        return QBCore.Functions.GetPlayerData()
    end
    return nil
end

function Framework.IsPlayerLoaded()
    if Config.Framework == "esx" then
        local playerData = ESX.GetPlayerData()
        return playerData and playerData.identifier ~= nil
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local playerData = QBCore.Functions.GetPlayerData()
        return playerData and playerData.citizenid ~= nil
    end
    return false
end

function Framework.TriggerCallback(name, cb, ...)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback(name, cb, ...)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback(name, cb, ...)
    end
end