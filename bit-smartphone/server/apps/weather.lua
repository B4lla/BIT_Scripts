local function GetRealFromEasytime()
    local ok, real = pcall(function()
        return exports['cd_easytime']:GetRealData()
    end)
    if not ok then return {} end
    return real or {}
end

local function BuildServerWeather()
    local reald = GetRealFromEasytime()
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

    local data = {
        condition = condition,
        inGameTime = timeString,
        rawWeatherType = gta,
        real_weather = reald.real_weather,
        real_weather_description = reald.real_weather_description,
        city = reald.city,
        country = reald.country,
        temperature = reald.temperature,
        windSpeed = reald.windSpeed,
        windDirection = reald.windDirection
    }
    return data
end

exports('GetWeatherData', function(_)
    return BuildServerWeather()
end)

Citizen.CreateThread(function()
    while true do
        Wait(300000) 
        local players = GetPlayers()
        local data = BuildServerWeather()
        for _, playerId in ipairs(players) do
            local playerIdNum = tonumber(playerId)
            if playerIdNum then
                TriggerClientEvent('bit-smartphone:weather:update', playerIdNum, data)
            end
        end
    end
end)

RegisterServerEvent('bit-smartphone:weather:requestInitial')
AddEventHandler('bit-smartphone:weather:requestInitial', function()
    local src = source
    if not src or src == 0 then return end
    local weatherData = BuildServerWeather()
    local serverName = GetConvar('sv_projectName', 'Los Santos Roleplay')
    local responseData = {
        weatherData = weatherData,
        playerData = {
            serverName = serverName,
            street = '',
            zone = '',
            heading = 0
        }
    }
    TriggerClientEvent('bit-smartphone:weather:initialData', src, responseData)
end)

RegisterServerEvent('bit-smartphone:weather:setCity')
AddEventHandler('bit-smartphone:weather:setCity', function(city, country)
    local src = source
    local ok = false
    local err = 'unsupported'
    if GetResourceState('cd_easytime') == 'started' then
        local success, res = pcall(function()
            if exports['cd_easytime'].SetRealData then
                exports['cd_easytime']:SetRealData({ city = city, country = country })
                return true
            elseif exports['cd_easytime'].SetCity then
                exports['cd_easytime']:SetCity(city, country)
                return true
            else
                error('no_setter')
            end
        end)
        if success then
            ok = true
            err = 'ok'
        else
            ok = false
            if type(res) == 'string' then
                err = res
            else
                err = 'error'
            end
        end
    end
    TriggerClientEvent('bit-smartphone:weather:citySet', src, ok, ok and { city = city, country = country } or { error = err })
end)