if Config.Framework:lower() == "esx" then
    ESX = exports['es_extended']:getSharedObject()
elseif Config.Framework:lower() == "qb" or Config.Framework:lower() == "qbox" then
    QBCore = exports['qb-core']:GetCoreObject()
else
    print("Unrecognized framework")
end