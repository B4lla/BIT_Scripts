local function GetNumberOfCharacters(license)
    local license = license
    local numOfChars = Config.DefaultNumberOfCharacters
    
    if Config.PlayersNumberOfCharacters[license] then
        numOfChars = Config.PlayersNumberOfCharacters[license]
    end
    
    return numOfChars
end

local function GiveStarterItems(source)
    if Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(source)
        if Player then
            for k, v in pairs(QBCore.Shared.StarterItems) do
                local info = {}
                if v.item == "id_card" then
                    info.citizenid = Player.PlayerData.citizenid
                    info.firstname = Player.PlayerData.charinfo.firstname
                    info.lastname = Player.PlayerData.charinfo.lastname
                    info.birthdate = Player.PlayerData.charinfo.birthdate
                    info.gender = Player.PlayerData.charinfo.gender
                    info.nationality = Player.PlayerData.charinfo.nationality
                elseif v.item == "driver_license" then
                    info.firstname = Player.PlayerData.charinfo.firstname
                    info.lastname = Player.PlayerData.charinfo.lastname
                    info.birthdate = Player.PlayerData.charinfo.birthdate
                    info.type = "Class C Driver License"
                end
                Player.Functions.AddItem(v.item, v.amount, false, info)
            end
        end
    end
end

local function GetPlayerCharacters(license)
    local characters = {}
    
    if Config.Framework == "esx" then
        local searchPattern = 'char%:' .. license

        local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM users WHERE identifier LIKE ?', {searchPattern})

        if result then
            for i = 1, #result do
                local char = result[i]
                
                local charSlot = tonumber(string.match(char.identifier, 'char(%d+):'))
                
                local accounts = {}
                if char.accounts then
                    accounts = type(char.accounts) == 'string' and json.decode(char.accounts) or char.accounts
                end
                
                characters[#characters + 1] = {
                    id = char.id,
                    slot = charSlot or i,
                    identifier = char.identifier,
                    firstname = char.firstname,
                    lastname = char.lastname,
                    dateofbirth = char.dateofbirth,
                    sex = char.sex,
                    height = char.height,
                    nationality = char.nationality,
                    phone_number = char.phone_number,
                    accounts = accounts,
                    job = char.job,
                    job_grade = char.job_grade,
                    loadout = char.loadout and (type(char.loadout) == 'string' and json.decode(char.loadout) or char.loadout) or {},
                    position = char.position and (type(char.position) == 'string' and json.decode(char.position) or char.position) or {},
                    money = accounts.money or 0,
                    bank = accounts.bank or 0,
                    skin = char.skin
                }
            end
        end
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM players WHERE license = ?', {license})
        
        if result then
            for i = 1, #result do
                local char = result[i]
                local charinfo = type(char.charinfo) == 'string' and json.decode(char.charinfo) or char.charinfo or {}
                local money = type(char.money) == 'string' and json.decode(char.money) or char.money or {}
                local job = type(char.job) == 'string' and json.decode(char.job) or char.job or {}
                
                local skinResult = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT model, skin FROM playerskins WHERE citizenid = ? AND active = 1', {char.citizenid})
                local skinData = skinResult and skinResult[1] or nil
                
                characters[#characters + 1] = {
                    id = char.id,
                    citizenid = char.citizenid,
                    license = char.license,
                    firstname = charinfo.firstname,
                    lastname = charinfo.lastname,
                    dateofbirth = charinfo.birthdate,
                    sex = charinfo.gender == 0 and 'male' or 'female',
                    gender = charinfo.gender,
                    height = charinfo.height,
                    phone_number = charinfo.phone,
                    accounts = money,
                    job = job.name or 'unemployed',
                    position = type(char.position) == 'string' and json.decode(char.position) or char.position or {},
                    charinfo = charinfo,
                    skin = skinData and skinData.skin or nil,
                    model = skinData and skinData.model or nil
                }
            end
        end
    end
    
    return characters
end

local function DeleteCharacterFromDB(source, characterId)
    local license = Framework.GetIdentifier(source)
    if not license then return false end
    
    if Config.Framework == "esx" then
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM users WHERE identifier = ?', {characterId})
        
        pcall(function()
            SqlFunc(Config.Mysql, 'execute', 'DELETE FROM user_accounts WHERE identifier = ?', {characterId})
        end)
        
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM user_inventory WHERE identifier = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM datastore_data WHERE owner = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM owned_vehicles WHERE owner = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM user_licenses WHERE owner = ?', {characterId})
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM players WHERE citizenid = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM apartments WHERE citizenid = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bank_accounts WHERE citizenid = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM crypto_transactions WHERE citizenid = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM phone_invoices WHERE citizenid = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM phone_messages WHERE citizenid = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM playerskins WHERE citizenid = ?', {characterId})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM player_vehicles WHERE citizenid = ?', {characterId})
    end
    
    return true
end

local function LoadCharacter(source, characterId)
    if Config.Framework == "esx" then
        local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM users WHERE identifier = ?', {characterId})
        
        if not result or not result[1] then
            return
        end
        
        local char = result[1]
        TriggerClientEvent('bit-multicharacter:client:closeUI', source)
        
        if ESX.Players[source] then
            ESX.Players[source] = nil
        end

        local charSlot = characterId:match("(char%d+):")
        
        if not charSlot then
            return
        end
        
        TriggerEvent("esx:onPlayerJoined", source, charSlot)
        
        Citizen.SetTimeout(1500, function()
            local xPlayer = ESX.GetPlayerFromId(source)
            
            if xPlayer then
                local skinData = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT skin FROM users WHERE identifier = ?', {characterId})
                local skin = skinData and skinData[1] and skinData[1].skin and json.decode(skinData[1].skin) or {}
                local playerData = type(xPlayer.getPlayerData) == 'function' and xPlayer.getPlayerData() or xPlayer
                
                TriggerClientEvent('esx:playerLoaded', source, playerData, skin)
                
                if skin and next(skin) then
                    Citizen.SetTimeout(500, function()
                        TriggerClientEvent('esx_skin:playerRegistered', source)
                        Citizen.SetTimeout(500, function()
                            TriggerClientEvent('skinchanger:loadSkin', source, skin)
                        end)
                    end)
                end
            end
        end)
        
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local result = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM players WHERE citizenid = ?', {characterId})
        
        if result and result[1] then
            if QBCore.Player.Login(source, characterId) then
                local skinResult = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM playerskins WHERE citizenid = ? AND active = 1', {characterId})
                
                Wait(1000)
                
                TriggerClientEvent('bit-multicharacter:client:closeUI', source)
                TriggerClientEvent('QBCore:Player:SetPlayerData', source, QBCore.Functions.GetPlayer(source).PlayerData)
                
                if skinResult and skinResult[1] then
                    TriggerClientEvent('qb-clothing:client:loadPlayerClothing', source, skinResult[1], result[1])
                end
            else
                DropPlayer(source, 'Character loading failed')
            end
        else
            DropPlayer(source, 'Character not found')
        end
    end
end

RegisterNetEvent('bit-multicharacter:server:loadUserData', function()
    local src = source
    local license = Framework.GetIdentifier(src)

    if license then
        local result = GetPlayerCharacters(license)
        local maxCharacters = GetNumberOfCharacters(license)
        
        TriggerClientEvent('bit-multicharacter:client:showUI', src, result, maxCharacters)
    end
end)

RegisterNetEvent('bit-multicharacter:server:createCharacter', function(data)
    local src = source
    local license = Framework.GetIdentifier(src)
    
    if not license then return end
    
    local characters = GetPlayerCharacters(license)
    local maxCharacters = GetNumberOfCharacters(license)
    
    if #characters >= maxCharacters then
        TriggerClientEvent('QBCore:Notify', src, 'Maximum number of characters reached', 'error')
        return
    end
    
    if Config.Framework == "esx" then
        local nextSlot = 1
        
        local usedSlots = {}
        for i = 1, #characters do
            if characters[i].slot then
                usedSlots[characters[i].slot] = true
            end
        end
        
        while usedSlots[nextSlot] do
            nextSlot = nextSlot + 1
        end
        
        local newIdentifier = 'char' .. nextSlot .. ':' .. license
        
        local firstname = data.firstname and string.sub(tostring(data.firstname):gsub("[^%w%s%-']", ""), 1, 50) or "John"
        local lastname = data.lastname and string.sub(tostring(data.lastname):gsub("[^%w%s%-']", ""), 1, 50) or "Doe"
        local nationality = data.nationality and string.sub(tostring(data.nationality):gsub("[^%w%s%-']", ""), 1, 50) or "American"
        
        local birthdate = "2000-01-01"
        if data.birthdate and type(data.birthdate) == "string" then
            local year, month, day = data.birthdate:match("(%d%d%d%d)-(%d%d)-(%d%d)")
            if year and month and day then
                local y, m, d = tonumber(year), tonumber(month), tonumber(day)
                if y and m and d and y >= 1900 and y <= 2005 and m >= 1 and m <= 12 and d >= 1 and d <= 31 then
                    birthdate = data.birthdate
                end
            end
        end
        
        local gender = (data.gender == 'male' or data.gender == 'm') and 'm' or 'f'
        local height = math.max(150, math.min(220, math.floor(tonumber(data.height) or 180)))
        
        local def = Config.InteractiveScenarios and Config.InteractiveScenarios['default']
        local spawnPos = def and def.coord and { x = def.coord.x, y = def.coord.y, z = def.coord.z } or { x = Config.DefaultSpawn.x, y = Config.DefaultSpawn.y, z = Config.DefaultSpawn.z }

        local queryParams = {
            newIdentifier,
            json.encode({bank = 5000, money = 5000}),
            'unemployed',
            0,
            'user',
            json.encode(spawnPos),
            firstname,
            lastname,
            birthdate,
            gender,
            height,
            nationality
        }

        local insertId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO users (identifier, accounts, job, job_grade, `group`, position, firstname, lastname, dateofbirth, sex, height, nationality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', queryParams)
        
        if insertId then
            Wait(500)
            local updatedCharacters = GetPlayerCharacters(license)
            TriggerClientEvent('bit-multicharacter:client:showUI', src, updatedCharacters, maxCharacters)
        else
            TriggerClientEvent('QBCore:Notify', src, 'Error creating character', 'error')
        end
        
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local newData = {}
        newData.cid = #characters + 1
        newData.money = {}
        newData.money.bank = QBCore.Config.StartingCash or 5000
        newData.money.cash = QBCore.Config.StartingBank or 5000
        newData.optin = true
        newData.charinfo = {
            firstname = data.firstname,
            lastname = data.lastname,
            birthdate = data.birthdate,
            gender = data.gender == 'male' and 0 or 1,
            backstory = 'placeholder backstory',
            nationality = data.nationality,
            phone = math.random(100,999)..math.random(1000000,9999999),
            account = math.random(1111111111,9999999999),
            height = data.height or 180
        }
        
        if QBCore.Player.Login(src, false, newData) then
            TriggerEvent("qb-log:server:CreateLog", "joinleave", "Loaded", "green", "**".. GetPlayerName(src) .. "** has been loaded..")
            TriggerClientEvent("qb-weathersync:client:EnableSync", src)
            TriggerClientEvent('bit-multicharacter:client:closeUI', src)

            if GetResourceState('qb-spawn') == 'started' then
                TriggerClientEvent('qb-spawn:client:setupSpawnUI', src, newData)
            elseif GetResourceState('qb-apartments') == 'started' then
                TriggerClientEvent('apartments:client:setupSpawnUI', src, newData)
            end
            
            GiveStarterItems(src)
        end
    end
end)

RegisterNetEvent('bit-multicharacter:server:deleteCharacter', function(citizenid)
    local src = source
    local license = Framework.GetIdentifier(src)
    
    if not license then return end
    
    if DeleteCharacterFromDB(src, citizenid) then
        if Config.Framework == "qb" or Config.Framework == "qbox" then
            TriggerClientEvent('QBCore:Notify', src, 'Character deleted successfully', 'success')
        elseif Config.Framework == "esx" then
            TriggerClientEvent('esx:showNotification', src, 'Character deleted successfully', 'success')
        end
        
        Wait(500)
        
        local updatedCharacters = GetPlayerCharacters(license)
        local maxCharacters = GetNumberOfCharacters(license)
        TriggerClientEvent('bit-multicharacter:client:showUI', src, updatedCharacters, maxCharacters)
    else
        if Config.Framework == "qb" or Config.Framework == "qbox" then
            TriggerClientEvent('QBCore:Notify', src, 'Failed to delete character', 'error')
        elseif Config.Framework == "esx" then
            TriggerClientEvent('esx:showNotification', src, 'Failed to delete character', 'error')
        end
    end
end)

RegisterNetEvent('bit-multicharacter:server:loadCharacter', function(citizenid)
    local src = source
    local license = Framework.GetIdentifier(src)
    
    if not license then return end
    
    LoadCharacter(src, citizenid)
    TriggerClientEvent('bit-multicharacter:client:closeUI', src)
end)

if Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Commands.Add("logout", "Logout of character", {}, false, function(source)
        QBCore.Player.Logout(source)
        TriggerClientEvent('bit-multicharacter:client:chooseChar', source)
    end)
    
    QBCore.Commands.Add("closeNUI", "Close Multi NUI", {}, false, function(source)
        TriggerClientEvent('bit-multicharacter:client:closeUI', source)
    end)
elseif Config.Framework == "esx" then
    RegisterCommand("logout", function(source)
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
            xPlayer.triggerEvent('esx:onPlayerLogout')
            TriggerClientEvent('bit-multicharacter:client:chooseChar', source)
        end
    end, false)
    
    RegisterCommand("closeNUI", function(source)
        TriggerClientEvent('bit-multicharacter:client:closeUI', source)
    end, false)
end

AddEventHandler('playerJoining', function()
    local src = source
    
    if Config.SkipSelection then
        return
    end
    
    TriggerClientEvent('bit-multicharacter:client:chooseChar', src)
end)

if Config.Framework == "qb" or Config.Framework == "qbox" then
    AddEventHandler('QBCore:Server:PlayerLoaded', function(Player)
        Wait(1000) 
        TriggerClientEvent('bit-multicharacter:client:closeUI', Player.PlayerData.source)
    end)
    
    AddEventHandler('QBCore:Server:OnPlayerUnload', function(src)
        TriggerClientEvent('bit-multicharacter:client:chooseChar', src)
    end)
elseif Config.Framework == "esx" then
    AddEventHandler('esx:playerLoaded', function(playerId, xPlayer)
        Wait(1000)
        TriggerClientEvent('bit-multicharacter:client:closeUI', playerId)
    end)
    
    AddEventHandler('esx:onPlayerLogout', function(playerId)
        TriggerClientEvent('bit-multicharacter:client:chooseChar', playerId)
    end)
end

if Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Functions.CreateCallback('bit-multicharacter:server:GetNumberOfCharacters', function(source, cb)
        local license = Framework.GetIdentifier(source)
        if license then
            local numOfChars = GetNumberOfCharacters(license)
            cb(numOfChars)
        else
            cb(0)
        end
    end)
    
    QBCore.Functions.CreateCallback('bit-multicharacter:server:GetUserCharacters', function(source, cb)
        local license = Framework.GetIdentifier(source)
        if license then
            local result = GetPlayerCharacters(license)
            cb(result)
        else
            cb({})
        end
    end)
elseif Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-multicharacter:server:GetNumberOfCharacters', function(source, cb)
        local license = Framework.GetIdentifier(source)
        if license then
            local numOfChars = GetNumberOfCharacters(license)
            cb(numOfChars)
        else
            cb(0)
        end
    end)
    
    ESX.RegisterServerCallback('bit-multicharacter:server:GetUserCharacters', function(source, cb)
        local license = Framework.GetIdentifier(source)
        if license then
            local result = GetPlayerCharacters(license)
            cb(result)
        else
            cb({})
        end
    end)
    
    ESX.RegisterServerCallback('bit-multicharacter:GetCharacters', function(source, cb)
        local license = Framework.GetIdentifier(source)
        if license then
            local result = GetPlayerCharacters(license)
            cb(result)
        else
            cb({})
        end
    end)
end

RegisterNetEvent('bit-multicharacter:server:setRoutingBucket', function(useUnique)
    local src = source
    if useUnique then
        SetPlayerRoutingBucket(src, src)
    else
        SetPlayerRoutingBucket(src, 0)
    end
end)