if Config.Framework == "esx" then
	ESX.RegisterServerCallback('bit-smartphone:garage:loadVehicles', function(source, cb)
		local vehicles = GetPlayerVehicles(source)
        print(json.encode(vehicles))
		cb(vehicles)
	end)
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
	QBCore.Functions.CreateCallback('bit-smartphone:garage:loadVehicles', function(source, cb)
		local vehicles = GetPlayerVehicles(source)
		cb(vehicles)
	end)
end
