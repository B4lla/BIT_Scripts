if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-smartphone:requestNotes', function(source, cb)
        local xPlayer = ESX.GetPlayerFromId(source)
        local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_notes WHERE user = @identifier', {['@identifier'] = xPlayer.identifier})
        local notes = {}
        for _, row in ipairs(result) do
            table.insert(notes, {
                id = row.id,
                title = row.title,
                note = row.note,
                last_edited = row.last_edited
            })
        end
        cb(notes)
    end)

    ESX.RegisterServerCallback('bit-smartphone:deleteNote', function(source, cb, noteId)
        local xPlayer = ESX.GetPlayerFromId(source)
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_notes WHERE id = @id AND user = @identifier', {
            ['@id'] = noteId,
            ['@identifier'] = xPlayer.identifier
        })
    end)

    ESX.RegisterServerCallback('bit-smartphone:saveNote', function(source, cb, note)
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then cb(false) return end
        local exists = SqlFunc(Config.Mysql, 'fetchAll',
            'SELECT id FROM bit_phone_notes WHERE id = @id AND user = @identifier',
            { ['@id'] = note.id, ['@identifier'] = xPlayer.identifier }
        )
        local resultId
        if exists and #exists > 0 then
            SqlFunc(Config.Mysql, 'execute',
                'UPDATE bit_phone_notes SET title = @title, note = @content, last_edited = NOW() WHERE id = @id AND user = @identifier', {
                ['@title'] = note.title,
                ['@content'] = note.content,
                ['@id'] = note.id,
                ['@identifier'] = xPlayer.identifier
            })
            resultId = note.id
        else
            SqlFunc(Config.Mysql, 'execute',
                'INSERT INTO bit_phone_notes (user, title, note, last_edited) VALUES (?, ?, ?, NOW())', {
                xPlayer.identifier,
                note.title,
                note.content
            })
            local last = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT LAST_INSERT_ID() AS id', {})
            resultId = last[1] and tonumber(last[1].id) or nil
        end
        cb(resultId)
    end)
elseif Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Functions.CreateCallback('bit-smartphone:requestNotes', function(Player, cb)
        local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_notes WHERE user = @identifier', {['@identifier'] = Player.PlayerData.citizenid})
        local notes = {}
        for _, row in ipairs(result) do
            table.insert(notes, {
                id = row.id,
                title = row.title,
                note = row.note,
                last_edited = row.last_edited
            })
        end
        cb(notes)
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:deleteNote', function(Player, cb, noteId)
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_notes WHERE id = @id AND user = @identifier', {
            ['@id'] = noteId,
            ['@identifier'] = Player.PlayerData.citizenid
        })
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:saveNote', function(source, cb, note)
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then cb(false) return end
        if note.id then
            SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_notes SET title = @title, note = @content, last_edited = @last_edited WHERE id = @id AND user = @identifier', {
                ['@id'] = note.id,
                ['@title'] = note.title,
                ['@content'] = note.content,
                ['@last_edited'] = note.last_edited,
                ['@identifier'] = Player.PlayerData.citizenid
            })
        else
            SqlFunc(Config.Mysql, 'execute', 'INSERT INTO bit_phone_notes (user, title, note, last_edited) VALUES (@identifier, @title, @content, @last_edited)', {
                ['@identifier'] = Player.PlayerData.citizenid,
                ['@title'] = note.title,
                ['@content'] = note.content,
                ['@last_edited'] = note.last_edited
            })
        end
        cb(true)
    end)
end

