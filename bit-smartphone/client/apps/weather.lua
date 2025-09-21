local weatherUpdateTimer = nil
local lastWeatherData = {}
local BuildWeatherDataFromEasyTime

RegisterNetEvent('bit-smartphone:weather:update')
AddEventHandler('bit-smartphone:weather:update', function(_)
    local wdata, pData = BuildWeatherDataFromEasyTime()
    lastWeatherData = wdata
    SendNUIMessage({ type = 'weather:update', weatherData = wdata, playerData = pData })
end)

RegisterNetEvent('bit-smartphone:weather:initialData')
AddEventHandler('bit-smartphone:weather:initialData', function(responseData)
    if responseData then
        local clientLocation = GetPlayerLocationData()
        responseData.playerData = responseData.playerData or {}
        responseData.playerData.street = clientLocation.street or responseData.playerData.street
        responseData.playerData.zone = clientLocation.zone or responseData.playerData.zone
        responseData.playerData.heading = clientLocation.heading or responseData.playerData.heading

        SendNUIMessage({
            type = 'weather:initialData',
            data = responseData
        })
    end
end)

RegisterNetEvent('bit-smartphone:client:weatherAppOpened')
AddEventHandler('bit-smartphone:client:weatherAppOpened', function()
    StartWeatherUpdates()
end)

RegisterNetEvent('bit-smartphone:client:weatherAppClosed')
AddEventHandler('bit-smartphone:client:weatherAppClosed', function()
    StopWeatherUpdates()
end)

function BuildWeatherDataFromEasyTime()
    local okReal, reald = pcall(function()
        return exports['cd_easytime']:GetRealData()
    end)

    reald = okReal and reald or {}

    local gta = (reald and reald.gta_weather) or 'CLEAR'
    local map = {
        EXTRASUNNY = 'extrasunny', CLEAR = 'clear', NEUTRAL = 'sunny', SMOG = 'smog', FOGGY = 'foggy',
        OVERCAST = 'overcast', CLOUDS = 'clouds', CLEARING = 'clearing', RAIN = 'rain', DRIZZLE = 'drizzle',
        THUNDER = 'thunder', SNOW = 'snow', BLIZZARD = 'blizzard', SNOWLIGHT = 'snow', XMAS = 'snow', HALLOWEEN = 'foggy'
    }
    local condition = (reald and reald.real_weather) and string.lower(reald.real_weather) or (map[gta] or 'clear')

    local hours = tonumber(reald and reald.hours or 12) or 12
    local mins = tonumber(reald and reald.mins or 0) or 0
    local timeString = string.format('%02d:%02d', hours, mins)

    local serverName = GetConvar('sv_projectName', 'Los Santos')
    if serverName == '' then serverName = 'Los Santos' end

    local playerData = GetPlayerLocationData()
    playerData.serverName = serverName

    local weatherData = {
        condition = condition,
        inGameTime = timeString,
        rawWeatherType = gta
    }

    if reald then
        if reald.real_weather then weatherData.real_weather = reald.real_weather end
        if reald.real_weather_description then weatherData.real_weather_description = reald.real_weather_description end
        if reald.city then weatherData.city = reald.city end
        if reald.country then weatherData.country = reald.country end
        if reald.temperature ~= nil then weatherData.temperature = tonumber(reald.temperature) end
        if reald.windSpeed ~= nil then weatherData.windSpeed = tonumber(reald.windSpeed) end
        if reald.windDirection ~= nil then weatherData.windDirection = tonumber(reald.windDirection) end
    end

    return weatherData, playerData
end

function StartWeatherUpdates()
    if weatherUpdateTimer then
        StopWeatherUpdates()
    end
    
    UpdateWeatherData()
    
    weatherUpdateTimer = Citizen.SetTimeout(Config.Weather.refreshInterval or 60000, function()
        UpdateWeatherData()
        if weatherUpdateTimer then
            StartWeatherUpdates()
        end
    end)
end

function StopWeatherUpdates()
    if weatherUpdateTimer then
        Citizen.ClearTimeout(weatherUpdateTimer)
        weatherUpdateTimer = nil
    end
end

function UpdateWeatherData()
    Citizen.CreateThread(function()
        local weatherData, playerData = BuildWeatherDataFromEasyTime()

        if not lastWeatherData 
            or weatherData.condition ~= (lastWeatherData.condition or '')
            or weatherData.inGameTime ~= (lastWeatherData.inGameTime or '') then
            lastWeatherData = weatherData
            SendNUIMessage({ type = 'weather:update', weatherData = weatherData, playerData = playerData })
        end
    end)
end

RegisterNUICallback('weather:requestUpdate', function(data, cb)
    UpdateWeatherData()
    cb('ok')
end)

RegisterNUICallback('weather:getInitialData', function(data, cb)
    local weatherData, playerData = BuildWeatherDataFromEasyTime()
    lastWeatherData = weatherData
    cb({ weatherData = weatherData, playerData = playerData })
end)

RegisterNUICallback('weather:refresh', function(data, cb)
    UpdateWeatherData()
    cb('ok')
end)

RegisterNUICallback('weather:setCity', function(data, cb)
    local city = (data and data.city) or nil
    local country = (data and data.country) or nil
    if not city or city == '' then
        cb({ ok = false, error = 'missing_city' })
        return
    end

    TriggerServerEvent('bit-smartphone:weather:setCity', city, country)
    cb({ ok = true })
end)

RegisterNetEvent('bit-smartphone:weather:citySet')
AddEventHandler('bit-smartphone:weather:citySet', function(success, info)
    SendNUIMessage({ type = 'weather:citySet', success = success, info = info })
    if success then
        UpdateWeatherData()
    end
end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        StopWeatherUpdates()
    end
end)