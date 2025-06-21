if Config.Command ~= "" then
    if Config.Framework:lower() == "esx" then
        RegisterCommand(Config.Command, function(source, args, raw)
            TriggerClientEvent("bit-menu:openMenu", source)
        end, false)
    elseif Config.Framework:lower() == "qb" or Config.Framework:lower() == "qbox" then
        QBCore.Commands.Add(Config.Command, "Open options menu", {}, false, function(source)
            TriggerClientEvent("bit-menu:openMenu", source)
        end, "user")
    end
end

if Config.Framework:lower() == "esx" then
    ESX.RegisterServerCallback('bit-menu:getPlayerName', function(source, cb, targetId)
        local xPlayer = ESX.GetPlayerFromId(targetId)
        local name = xPlayer and xPlayer.getName and xPlayer:getName() or "Unknown"
        cb(name)
    end)
elseif Config.Framework:lower() == "qb" or Config.Framework:lower() == "qbox" then
    QBCore.Functions.CreateCallback('bit-menu:getPlayerName', function(source, cb, targetId)
        local player = QBCore.Functions.GetPlayer(targetId)
        local name = "Unknown"
        if player and player.PlayerData and player.PlayerData.charinfo then
            local ci = player.PlayerData.charinfo
            name = ci.firstname .. " " .. ci.lastname
        end
        cb(name)
    end)
end