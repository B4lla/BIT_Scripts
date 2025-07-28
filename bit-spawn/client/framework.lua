if Config.Framework == "esx" then
    ESX = exports["es_extended"]:getSharedObject()
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore = exports["qb-core"]:GetCoreObject()
else
    print("Unrecognized framework")
end