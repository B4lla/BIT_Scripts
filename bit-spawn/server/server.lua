if Config.Framework == 'esx' then
    RegisterCommand('openSpawnSelector', function(source, args, raw)
        TriggerClientEvent('bit-spawn:openSelector', source)
    end, false)
elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
    QBCore.Commands.Add('openSpawnSelector', 'Open spawn selector', {}, false, function(source, args)
        TriggerClientEvent('bit-spawn:openSelector', source)
    end)
else
    print('Unrecognized framework: ' .. tostring(Config.Framework))
end


RegisterNetEvent('bit-spawnselector:requestOpen', function()
    TriggerClientEvent('bit-spawn:openSelector', source)
end)