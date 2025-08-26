local function GetPlayerIdentifier(source)
    local identifier = nil
    
    if GetResourceState('es_extended') == 'started' then
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
            identifier = xPlayer.identifier
        end
    end
    
    
    if not identifier and GetResourceState('qb-core') == 'started' then
        local Player = QBCore.Functions.GetPlayer(source)
        if Player then
            identifier = Player.PlayerData.citizenid
        end
    end
    
    return identifier
end


RegisterNetEvent('bit-smartphone:server:calendar:loadEvents')
AddEventHandler('bit-smartphone:server:calendar:loadEvents', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then
        return
    end
    
    MySQL.Async.fetchAll('SELECT * FROM bit_phone_calendar_events WHERE player_identifier = @identifier ORDER BY date ASC', {
        ['@identifier'] = identifier
    }, function(result)
        local events = {}
        if result then
            for i = 1, #result do
                table.insert(events, {
                    id = result[i].id,
                    title = result[i].title,
                    date = result[i].date,
                    duration = result[i].duration,
                    color = result[i].color
                })
            end
        end
        
        TriggerClientEvent('bit-smartphone:client:calendar:eventsLoaded', source, events)
    end)
end)


RegisterNetEvent('bit-smartphone:server:calendar:saveEvent')
AddEventHandler('bit-smartphone:server:calendar:saveEvent', function(eventData)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then
        return
    end
    
    MySQL.Async.execute('INSERT INTO bit_phone_calendar_events (player_identifier, title, date, duration, color) VALUES (@identifier, @title, @date, @duration, @color)', {
        ['@identifier'] = identifier,
        ['@title'] = eventData.title,
        ['@date'] = eventData.date,
        ['@duration'] = eventData.duration,
        ['@color'] = eventData.color
    }, function(insertId)
        if insertId then
            TriggerClientEvent('bit-smartphone:client:calendar:eventSaved', source, {success = true, id = insertId})
        else
            TriggerClientEvent('bit-smartphone:client:calendar:eventSaved', source, {success = false})
        end
    end)
end)