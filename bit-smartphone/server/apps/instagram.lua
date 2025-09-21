local function GetPlayerIdentifier(source)
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier or nil
    else
        local Player = QBCore.Functions.GetPlayer(source)
        return Player and Player.PlayerData.citizenid or nil
    end
end

local function registerInstagram(source, data)
    DebugPrint("INSTAGRAM", "Registering new Instagram account", {source = source, username = data and data.username or "unknown"})
    local identifier = GetPlayerIdentifier(source)
    if not identifier then
        DebugPrint("INSTAGRAM", "Failed to get player identifier", {source = source})
        return false, 'no_identifier'
    end
    local passwordVal = nil
    if data then
        passwordVal = data.password or data.confirmPassword or data.pwd or data.pass
    end
    local usernameVal = data and (data.username or data.user)
    if not usernameVal or usernameVal == '' or not passwordVal or passwordVal == '' then
        DebugPrint("INSTAGRAM", "Missing required fields", {has_username = usernameVal ~= nil, has_password = passwordVal ~= nil})
        return false, 'missing_fields'
    end
    DebugPrint("INSTAGRAM", "Checking if username exists", {username = usernameVal})
    local existing = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_instagram_accounts WHERE username = @username', { ['@username'] = usernameVal })
    if existing and existing[1] then
        DebugPrint("INSTAGRAM", "Username already exists", {username = usernameVal})
        return false, 'exists'
    end
    local plainPassword = passwordVal
    local insertId = SqlFunc(Config.Mysql, 'insert',
        'INSERT INTO bit_phone_instagram_accounts (identifier, username, password, full_name, is_verified) VALUES (@id, @username, @password, @full_name, 1)',
        { ['@id'] = identifier, ['@username'] = usernameVal, ['@password'] = plainPassword, ['@full_name'] = data.full_name or data.name or usernameVal }
    )
    if insertId and insertId > 0 then
        return true, nil
    end
    return false, 'insert_failed'
end

if Config.Framework == 'esx' then
    ESX.RegisterServerCallback('bit-smartphone:instagram:register', function(source, cb, data)
        local ok, res = registerInstagram(source, data)
        cb({ success = ok, code = res })
        if ok then
            local pwd = (data and (data.password or data.confirmPassword or data.pwd or data.pass)) or nil
            TriggerClientEvent('bit-smartphone:client:sendNuiMessage', source, { action = 'instagram:register_success', data = { username = data and data.username, password = pwd } })
        end
    end)

    ESX.RegisterServerCallback('bit-smartphone:instagram:verify', function(source, cb, data)
        cb({ success = false, reason = 'verification_disabled' })
    end)

    ESX.RegisterServerCallback('bit-smartphone:instagram:login', function(source, cb, data)
        local plain = data.password
        local account = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_instagram_accounts WHERE username = @username AND password = @password AND is_verified = 1', { ['@username'] = data.username, ['@password'] = plain })
        if account and account[1] then
            local a = account[1]
            local response = { success = true, account = { id = a.id, username = a.username, name = a.full_name, bio = a.bio, avatar = a.avatar, verified = (a.is_verified == 1), private = (a.is_private == 1), followers_count = a.followers_count or 0, following_count = a.following_count or 0, posts_count = a.posts_count or 0 } }
            cb(response)
            TriggerClientEvent('bit-smartphone:client:sendNuiMessage', source, { action = 'instagram:login_success', data = response.account })
        else
            cb({ success = false })
        end
    end)

    ESX.RegisterServerCallback('bit-smartphone:instagram:getFeed', function(source, cb)
        local posts = SqlFunc(Config.Mysql, [[
            SELECT p.id, p.caption, p.image_url, p.location, p.created_at, a.id AS user_id, a.identifier AS user_identifier, a.username, a.full_name AS name, a.profile_picture AS avatar, a.is_verified,
                   (SELECT COUNT(*) FROM bit_phone_instagram_likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM bit_phone_instagram_comments WHERE post_id = p.id) as comments_count
            FROM bit_phone_instagram_posts p
            JOIN bit_phone_instagram_accounts a ON p.user_identifier = a.identifier
            WHERE p.is_pinned = 0
            ORDER BY p.created_at DESC
            LIMIT 50
        ]], {})
        cb(posts or {})
    end)

    ESX.RegisterServerCallback('bit-smartphone:instagram:updateProfile', function(source, cb, data)
        if not data or not data.username then
            cb({ success = false, reason = 'invalid_data' })
            return
        end
        local res = SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_instagram_accounts SET full_name = @name, bio = @bio, avatar = @avatar WHERE username = @username', { ['@name'] = data.name or '', ['@bio'] = data.bio or '', ['@avatar'] = data.avatar or '', ['@username'] = data.username })
        cb({ success = true })
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', source, { action = 'instagram:profile_updated', data = { username = data.username } })
    end)

    ESX.RegisterServerCallback('bit-smartphone:instagram:searchUsers', function(source, cb, query)
        local q = '%' .. (query or '') .. '%'
        local users = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id, username, full_name AS name, avatar FROM bit_phone_instagram_accounts WHERE username LIKE @q OR full_name LIKE @q LIMIT 20', { ['@q'] = q })
        cb(users or {})
    end)

    ESX.RegisterServerCallback('bit-smartphone:instagram:sendMessage', function(source, cb, data)
        if not data or not data.to or not data.message then
            cb({ success = false })
            return
        end
        local senderId = GetPlayerIdentifier(source)
        local receiver = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_instagram_accounts WHERE username = @username', { ['@username'] = data.to })
        if not receiver or not receiver[1] then
            cb({ success = false })
            return
        end
        local recvId = receiver[1].id
        local insertId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_instagram_messages (sender_id, receiver_id, message, created_at) VALUES (@s, @r, @m, NOW())', { ['@s'] = senderId, ['@r'] = recvId, ['@m'] = data.message })
        cb({ success = (insertId and insertId > 0) })
    end)

    ESX.RegisterServerCallback('bit-smartphone:instagram:getMessages', function(source, cb, withUsername)
        if not withUsername then cb({}); return end
        local meId = GetPlayerIdentifier(source)
        local other = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_instagram_accounts WHERE username = @username', { ['@username'] = withUsername })
        if not other or not other[1] then cb({}); return end
        local otherId = other[1].id
        local msgs = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT m.id, m.message, m.created_at, a.username AS sender FROM bit_phone_instagram_messages m JOIN bit_phone_instagram_accounts a ON m.sender_id = a.id WHERE (m.sender_id = @me AND m.receiver_id = @other) OR (m.sender_id = @other AND m.receiver_id = @me) ORDER BY m.created_at ASC', { ['@me'] = meId, ['@other'] = otherId })
        cb(msgs or {})
    end)

    ESX.RegisterServerCallback('bit-smartphone:instagram:getProfilePosts', function(source, cb)
        local identifier = GetPlayerIdentifier(source)
        if not identifier then cb({}); return end
        local posts = SqlFunc(Config.Mysql, [[
            SELECT p.id, p.caption, p.image_url, p.location, p.created_at,
                   a.id AS user_id, a.identifier AS user_identifier, a.username, a.full_name AS name,
                   a.profile_picture AS avatar, a.is_verified,
                   (SELECT COUNT(*) FROM bit_phone_instagram_likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM bit_phone_instagram_comments WHERE post_id = p.id) as comments_count
            FROM bit_phone_instagram_posts p
            JOIN bit_phone_instagram_accounts a ON p.user_identifier = a.identifier
            WHERE p.user_identifier = @uid
            ORDER BY p.created_at DESC
            LIMIT 100
        ]], { ['@uid'] = identifier })
        cb(posts or {})
    end)
else
    QBCore.Functions.CreateCallback('bit-smartphone:instagram:register', function(source, cb, data)
        local ok, res = registerInstagram(source, data)
        cb({ success = ok, code = res })
        if ok then
            local pwd = (data and (data.password or data.confirmPassword or data.pwd or data.pass)) or nil
            TriggerClientEvent('bit-smartphone:client:sendNuiMessage', source, { action = 'instagram:register_success', data = { username = data and data.username, password = pwd } })
        end
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:instagram:verify', function(source, cb, data)
        cb({ success = false, reason = 'verification_disabled' })
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:instagram:login', function(source, cb, data)
        local plain = data.password
        local account = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_instagram_accounts WHERE username = @username AND password = @password AND is_verified = 1', { ['@username'] = data.username, ['@password'] = plain })
        if account and account[1] then
            local a = account[1]
            local response = { success = true, account = { id = a.id, username = a.username, name = a.full_name, bio = a.bio, avatar = a.avatar, verified = (a.is_verified == 1), private = (a.is_private == 1), followers_count = a.followers_count or 0, following_count = a.following_count or 0, posts_count = a.posts_count or 0 } }
            cb(response)
            TriggerClientEvent('bit-smartphone:client:sendNuiMessage', source, { action = 'instagram:login_success', data = response.account })
        else
            cb({ success = false })
        end
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:instagram:getFeed', function(source, cb)
        local posts = SqlFunc(Config.Mysql, [[
            SELECT p.id, p.caption, p.image_url, p.location, p.created_at, a.id AS user_id, a.identifier AS user_identifier, a.username, a.full_name AS name, a.profile_picture AS avatar, a.is_verified,
                   (SELECT COUNT(*) FROM bit_phone_instagram_likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM bit_phone_instagram_comments WHERE post_id = p.id) as comments_count
            FROM bit_phone_instagram_posts p
            JOIN bit_phone_instagram_accounts a ON p.user_identifier = a.identifier
            WHERE p.is_pinned = 0
            ORDER BY p.created_at DESC
            LIMIT 50
        ]], {})
        cb(posts or {})
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:instagram:updateProfile', function(source, cb, data)
        if not data or not data.username then
            cb({ success = false, reason = 'invalid_data' })
            return
        end
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_instagram_accounts SET full_name = @name, bio = @bio, avatar = @avatar WHERE username = @username', { ['@name'] = data.name or '', ['@bio'] = data.bio or '', ['@avatar'] = data.avatar or '', ['@username'] = data.username })
        cb({ success = true })
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', source, { action = 'instagram:profile_updated', data = { username = data.username } })
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:instagram:searchUsers', function(source, cb, query)
        local q = '%' .. (query or '') .. '%'
        local users = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id, username, full_name AS name, avatar FROM bit_phone_instagram_accounts WHERE username LIKE @q OR full_name LIKE @q LIMIT 20', { ['@q'] = q })
        cb(users or {})
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:instagram:sendMessage', function(source, cb, data)
        if not data or not data.to or not data.message then
            cb({ success = false })
            return
        end
        local senderId = GetPlayerIdentifier(source)
        local receiver = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_instagram_accounts WHERE username = @username', { ['@username'] = data.to })
        if not receiver or not receiver[1] then
            cb({ success = false })
            return
        end
        local recvId = receiver[1].id
        local insertId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_instagram_messages (sender_id, receiver_id, message, created_at) VALUES (@s, @r, @m, NOW())', { ['@s'] = senderId, ['@r'] = recvId, ['@m'] = data.message })
        cb({ success = (insertId and insertId > 0) })
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:instagram:getMessages', function(source, cb, withUsername)
        if not withUsername then cb({}); return end
        local meId = GetPlayerIdentifier(source)
        local other = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_instagram_accounts WHERE username = @username', { ['@username'] = withUsername })
        if not other or not other[1] then cb({}); return end
        local otherId = other[1].id
        local msgs = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT m.id, m.message, m.created_at, a.username AS sender FROM bit_phone_instagram_messages m JOIN bit_phone_instagram_accounts a ON m.sender_id = a.id WHERE (m.sender_id = @me AND m.receiver_id = @other) OR (m.sender_id = @other AND m.receiver_id = @me) ORDER BY m.created_at ASC', { ['@me'] = meId, ['@other'] = otherId })
        cb(msgs or {})
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:instagram:getProfilePosts', function(source, cb)
        local identifier = GetPlayerIdentifier(source)
        if not identifier then cb({}); return end
        local posts = SqlFunc(Config.Mysql, [[
            SELECT p.id, p.caption, p.image_url, p.location, p.created_at,
                   a.id AS user_id, a.identifier AS user_identifier, a.username, a.full_name AS name,
                   a.profile_picture AS avatar, a.is_verified,
                   (SELECT COUNT(*) FROM bit_phone_instagram_likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM bit_phone_instagram_comments WHERE post_id = p.id) as comments_count
            FROM bit_phone_instagram_posts p
            JOIN bit_phone_instagram_accounts a ON p.user_identifier = a.identifier
            WHERE p.user_identifier = @uid
            ORDER BY p.created_at DESC
            LIMIT 100
        ]], { ['@uid'] = identifier })
        cb(posts or {})
    end)
end

RegisterNetEvent('bit-smartphone:instagram:createPost')
AddEventHandler('bit-smartphone:instagram:createPost', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    
    DebugPrint("INSTAGRAM", "Creating post request", {
        source = src,
        identifier = identifier,
        has_data = data ~= nil,
        has_image = data and data.image ~= nil,
        has_caption = data and data.caption ~= nil
    })
    
    if not identifier then 
        DebugPrint("INSTAGRAM", "No identifier found for player", {source = src})
        return 
    end
    
    if not data or not data.image or not data.caption then
        DebugPrint("INSTAGRAM", "Missing required data", {
            has_data = data ~= nil,
            has_image = data and data.image ~= nil,
            has_caption = data and data.caption ~= nil
        })
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:error', data = { error = 'Faltan datos requeridos' } })
        return
    end
    
    local account = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_instagram_accounts WHERE identifier = @id', { ['@id'] = identifier })
    if not account or not account[1] then
        DebugPrint("INSTAGRAM", "User account not found", {identifier = identifier})
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:error', data = { error = 'Usuario no encontrado' } })
        return
    end
    
    local recentPosts = SqlFunc(Config.Mysql, 'fetchAll', 
        'SELECT id FROM bit_phone_instagram_posts WHERE user_identifier = @identifier AND image_url = @image AND caption = @caption AND created_at > DATE_SUB(NOW(), INTERVAL 10 SECOND)', 
        { ['@identifier'] = identifier, ['@image'] = data.image, ['@caption'] = data.caption }
    )
    
    if recentPosts and recentPosts[1] then
        DebugPrint("INSTAGRAM", "Duplicate post detected within 10 seconds", {
            identifier = identifier,
            image = data.image,
            existing_post_id = recentPosts[1].id
        })
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:error', data = { error = 'Post duplicado detectado' } })
        return
    end
    
    local isStory = data.type == 'story'
    local expiresAt = isStory and os.date('%Y-%m-%d %H:%M:%S', os.time() + 86400) or nil
    
    local insertId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_instagram_posts (user_identifier, caption, image_url, location, is_pinned, created_at) VALUES (@user_identifier, @cap, @img, @loc, 0, NOW())', { 
        ['@user_identifier'] = identifier, 
        ['@cap'] = data.caption, 
        ['@img'] = data.image, 
        ['@loc'] = data.location or '' 
    })
    
    if insertId and insertId > 0 then
        DebugPrint("INSTAGRAM", "Post created successfully", {
            post_id = insertId,
            identifier = identifier,
            is_story = isStory
        })
        
        if not isStory then
            SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_instagram_accounts SET posts_count = posts_count + 1 WHERE id = @id', { ['@id'] = account[1].id })
        end
        
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:post_created', data = { message = isStory and 'Historia publicada' or 'Post publicado exitosamente' } })
        
        local posts = SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT p.id, p.caption, p.image_url, p.location, p.created_at, a.username, a.full_name AS name, a.profile_picture AS avatar, a.is_verified,
                   (SELECT COUNT(*) FROM bit_phone_instagram_likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM bit_phone_instagram_comments WHERE post_id = p.id) as comments_count
            FROM bit_phone_instagram_posts p
            JOIN bit_phone_instagram_accounts a ON p.user_identifier = a.identifier
            WHERE p.is_pinned = 0
            ORDER BY p.created_at DESC
            LIMIT 50
        ]], {})
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:feed_data', data = { posts = posts or {} } })
    else
        DebugPrint("INSTAGRAM", "Failed to insert post", {identifier = identifier})
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:error', data = { error = 'Error al publicar' } })
    end
end)

RegisterNetEvent('bit-smartphone:instagram:likePost')
AddEventHandler('bit-smartphone:instagram:likePost', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    
    DebugPrint("INSTAGRAM", "Like post request", {
        source = src,
        identifier = identifier,
        postId = data and data.postId or nil
    })
    
    if not identifier then
        DebugPrint("INSTAGRAM", "No identifier for like request", {source = src})
        return 
    end
    
    if not data or not data.postId then
        DebugPrint("INSTAGRAM", "Missing post ID for like", {source = src})
        return
    end
    
    local account = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_instagram_accounts WHERE identifier = @id', { ['@id'] = identifier })
    if not account or not account[1] then
        DebugPrint("INSTAGRAM", "User account not found for like", {identifier = identifier})
        return
    end
    
    local existing = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_instagram_likes WHERE post_id = @post AND user_identifier = @uid', { ['@post'] = data.postId, ['@uid'] = identifier })
    
    if existing and existing[1] then
        DebugPrint("INSTAGRAM", "Removing like", {postId = data.postId, user = identifier})
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_instagram_likes WHERE post_id = @post AND user_identifier = @uid', { ['@post'] = data.postId, ['@uid'] = identifier })
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:like_removed', data = { postId = data.postId } })
    else
        DebugPrint("INSTAGRAM", "Adding like", {postId = data.postId, user = identifier})
        SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_instagram_likes (post_id, user_identifier) VALUES (@post, @uid)', { ['@post'] = data.postId, ['@uid'] = identifier })
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:like_added', data = { postId = data.postId } })
    end
end)

RegisterNetEvent('bit-smartphone:instagram:addComment')
AddEventHandler('bit-smartphone:instagram:addComment', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    local account = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id, username FROM bit_phone_instagram_accounts WHERE identifier = @id', { ['@id'] = identifier })
    if not account or not account[1] then return end
    local insertId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_instagram_comments (post_id, user_identifier, comment) VALUES (@post, @uid, @comment)', { ['@post'] = data.postId, ['@uid'] = identifier, ['@comment'] = data.comment })
    if insertId and insertId > 0 then
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:comment_added', data = { postId = data.postId, comment = { id = insertId, username = account[1].username, comment = data.comment, timestamp = os.date('%Y-%m-%d %H:%M:%S') } } })
    end
end)

RegisterNetEvent('instagram:getFeed')
AddEventHandler('instagram:getFeed', function()
    local src = source
    DebugPrint("INSTAGRAM", "Loading feed for player", {source = src})
    
    local posts = SqlFunc(Config.Mysql, 'fetchAll', [[
        SELECT p.id, p.caption, p.image_url, p.location, p.created_at, a.username, a.full_name AS name, a.profile_picture AS avatar, a.is_verified,
               (SELECT COUNT(*) FROM bit_phone_instagram_likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM bit_phone_instagram_comments WHERE post_id = p.id) as comments_count
        FROM bit_phone_instagram_posts p
        JOIN bit_phone_instagram_accounts a ON p.user_identifier = a.identifier
        WHERE p.is_pinned = 0
        ORDER BY p.created_at DESC
        LIMIT 50
    ]], {})
    
    DebugPrint("INSTAGRAM", "Feed loaded", {post_count = posts and #posts or 0})
    TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:feed_data', data = { posts = posts or {} } })
end)

RegisterNetEvent('instagram:getStories')
AddEventHandler('instagram:getStories', function()
    local src = source
    DebugPrint("INSTAGRAM", "Loading stories for player", {source = src})
    
    TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:stories_data', data = { stories = {} } })
end)

RegisterNetEvent('bit-smartphone:instagram:register')
AddEventHandler('bit-smartphone:instagram:register', function(data)
    local src = source
    local ok, res = registerInstagram(src, data)
    if ok then
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:register_success', data = { message = 'Registro completado', code = res } })
    else
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:register_error', data = { error = res or 'error' } })
    end
end)

RegisterNetEvent('instagram:login')
AddEventHandler('instagram:login', function(data)
    local src = source
    local plain = data.password
    local account = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT * FROM bit_phone_instagram_accounts WHERE username = @username AND password = @password AND is_verified = 1', { ['@username'] = data.username, ['@password'] = plain })
    if account and account[1] then
        local a = account[1]
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:login_success', data = { id = a.id, username = a.username, name = a.full_name, bio = a.bio, avatar = a.avatar } })
    else
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:login_error', data = { error = 'Credenciales inválidas' } })
    end
end)

RegisterNetEvent('instagramRegister')
AddEventHandler('instagramRegister', function(data)
    local src = source
    local ok, res = registerInstagram(src, data)
    if ok then
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:register_success', data = { message = 'Registro completado', code = res } })
    else
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'instagram:register_error', data = { error = res or 'error' } })
    end
end)



