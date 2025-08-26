RegisterNUICallback("getNotes", function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:requestNotes', function(notes)
            cb({ action = "notesList", notes = notes or {} })
        end)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:requestNotes', function(notes)
            cb({ action = "notesList", notes = notes or {} })
        end)
    else
        cb({ action = "notesList", notes = {} })
    end
end)

RegisterNUICallback("deleteNote", function(data, cb)
    local noteId = data.id
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:deleteNote', function() end, noteId)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:deleteNote', function(success) end, noteId)
    end
    cb({ success = true })
end)

RegisterNUICallback("saveNote", function(data, cb)
    local note = data
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:saveNote', function(newId)
            cb({ success = true, id = newId })
        end, note)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:saveNote', function(success)
            cb({ success = success, id = note.id })
        end, note)
    else
        cb({ success = false })
    end
end)