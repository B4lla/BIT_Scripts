RegisterNetEvent('bit-smartphone:tuister:register')
AddEventHandler('bit-smartphone:tuister:register', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src, 0)
    
    
    if not data.username or not data.password then
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, {
            action = 'tuister:registerResult',
            data = { success = false, error = 'Datos incompletos' }
        })
        return
    end
end)


local function GetPlayerIdentifier(source)
    if Config.Framework == 'esx' then
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier or nil
    else
        local Player = QBCore.Functions.GetPlayer(source)
        return Player and Player.PlayerData.citizenid or nil
    end
end

local function completeTuisterRegistration(source, data)
    local identifier = GetPlayerIdentifier(source)
    if not identifier then
        return false
    end
    if not data.username or not data.password then
        return false
    end

    
    local existing = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_tuister_users WHERE identifier = @id OR username = @username LIMIT 1', { ['@id'] = identifier, ['@username'] = data.username })
    if existing and existing[1] then
        return false
    end

    
    local okInsert, insertRes = pcall(function()
        return SqlFunc(Config.Mysql, 'insert', [[
            INSERT INTO bit_phone_tuister_users (identifier, username, password, display_name) VALUES (@id, @username, @password, @display)
        ]], { 
            ['@id'] = identifier, 
            ['@username'] = data.username, 
            ['@password'] = data.password, 
            ['@display'] = data.displayName or data.username 
        })
    end)

    if not okInsert then
    end

    local insertId = (okInsert and insertRes) or nil

    

    if (not insertId or insertId == 0) and exports and exports.oxmysql then
        local ok, res = pcall(function()
            return exports.oxmysql:insert_async('INSERT INTO bit_phone_tuister_users (identifier, username, password, display_name) VALUES (?, ?, ?, ?)', { 
                identifier, 
                data.username, 
                data.password, 
                data.displayName or data.username 
            })
        end)
        
        if ok and res and res > 0 then
            insertId = res
        end
    end

    

    return insertId and insertId > 0
end

if Config.Framework == 'esx' then
    ESX.RegisterServerCallback('bit-smartphone:tuister:completeRegistration', function(source, cb, data)
        local ok = completeTuisterRegistration(source, data)
        cb(ok)
    end)

    ESX.RegisterServerCallback('bit-smartphone:tuister:loadProfile', function(source, cb)
        local xPlayer = ESX.GetPlayerFromId(source)
        local identifier = xPlayer and xPlayer.identifier or GetPlayerIdentifier(source)
        local rows = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id, username, display_name, bio, avatar, banner, verified, followers_count, following_count, tweets_count FROM bit_phone_tuister_users WHERE identifier = @id', { ['@id'] = identifier })
        local profile = rows and rows[1]
        if profile then
            profile.bio = profile.bio or ''
            profile.avatar = profile.avatar or './assets/avatars/default.png'
            profile.banner = profile.banner or ''
            profile.verified = profile.verified or false
            profile.followers_count = profile.followers_count or 0
            profile.following_count = profile.following_count or 0
            profile.tweets_count = profile.tweets_count or 0
            profile.followers = profile.followers_count
            profile.following = profile.following_count
            profile.tweets = profile.tweets_count
            profile.joined = os.date('%Y-%m-%d')
        end
        cb(profile or {})
    end)

    ESX.RegisterServerCallback('bit-smartphone:tuister:loadTweets', function(source, cb, data)
        local offset = (data and data.offset) or 0
        local limit = (data and data.limit) or 50
        
        local tweets = SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT 
                t.id, 
                t.content, 
                t.image_url,
                t.likes_count, 
                t.retweets_count, 
                t.comments_count,
                t.created_at, 
                u.id as user_id,
                u.display_name, 
                u.username, 
                u.avatar,
                u.verified
            FROM bit_phone_tuister_tweets t
            JOIN bit_phone_tuister_users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT @limit OFFSET @offset
        ]], { ['@limit'] = limit, ['@offset'] = offset })
        
        
        if tweets then
            for i, tweet in ipairs(tweets) do
                tweet.user = {
                    id = tweet.user_id,
                    username = tweet.username,
                    displayName = tweet.display_name,
                    avatar = tweet.avatar or './assets/avatars/default.png',
                    verified = tweet.verified or false
                }
                tweet.likes = tweet.likes_count or 0
                tweet.retweets = tweet.retweets_count or 0
                tweet.comments = tweet.comments_count or 0
                tweet.liked = false 
                tweet.retweeted = false 
                tweet.timestamp = tweet.created_at
                tweet.images = tweet.image_url and {tweet.image_url} or {}
                
                
                tweet.user_id = nil
                tweet.username = nil
                tweet.display_name = nil
                tweet.avatar = nil
                tweet.verified = nil
                tweet.likes_count = nil
                tweet.retweets_count = nil
                tweet.comments_count = nil
                tweet.image_url = nil
            end
        end
        
        cb(tweets or {})
    end)
else
    
    QBCore.Functions.CreateCallback('bit-smartphone:tuister:completeRegistration', function(source, cb, data)
        local ok = completeTuisterRegistration(source, data)
        cb(ok)
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:tuister:loadProfile', function(source, cb)
        local Player = QBCore.Functions.GetPlayer(source)
        local identifier = Player and Player.PlayerData.citizenid or GetPlayerIdentifier(source)
        local rows = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id, username, display_name, bio, avatar, banner, verified, followers_count, following_count, tweets_count FROM bit_phone_tuister_users WHERE identifier = @id', { ['@id'] = identifier })
        local profile = rows and rows[1]
        if profile then
            
            profile.bio = profile.bio or ''
            profile.avatar = profile.avatar or './assets/avatars/default.png'
            profile.banner = profile.banner or ''
            profile.verified = profile.verified or false
            profile.followers_count = profile.followers_count or 0
            profile.following_count = profile.following_count or 0
            profile.tweets_count = profile.tweets_count or 0
            profile.followers = profile.followers_count
            profile.following = profile.following_count
            profile.tweets = profile.tweets_count
            profile.joined = os.date('%Y-%m-%d')
        end
        cb(profile or {})
    end)

    QBCore.Functions.CreateCallback('bit-smartphone:tuister:loadTweets', function(source, cb, data)
        local offset = (data and data.offset) or 0
        local limit = (data and data.limit) or 50
        
        local tweets = SqlFunc(Config.Mysql, 'fetchAll', [[
            SELECT 
                t.id, 
                t.content, 
                t.image_url,
                t.likes_count, 
                t.retweets_count, 
                t.comments_count,
                t.created_at, 
                u.id as user_id,
                u.display_name, 
                u.username, 
                u.avatar,
                u.verified
            FROM bit_phone_tuister_tweets t
            JOIN bit_phone_tuister_users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
            LIMIT @limit OFFSET @offset
        ]], { ['@limit'] = limit, ['@offset'] = offset })
        
        
        if tweets then
            for i, tweet in ipairs(tweets) do
                tweet.user = {
                    id = tweet.user_id,
                    username = tweet.username,
                    displayName = tweet.display_name,
                    avatar = tweet.avatar or './assets/avatars/default.png',
                    verified = tweet.verified or false
                }
                tweet.likes = tweet.likes_count or 0
                tweet.retweets = tweet.retweets_count or 0
                tweet.comments = tweet.comments_count or 0
                tweet.liked = false 
                tweet.retweeted = false 
                tweet.timestamp = tweet.created_at
                tweet.images = tweet.image_url and {tweet.image_url} or {}
                
                
                tweet.user_id = nil
                tweet.username = nil
                tweet.display_name = nil
                tweet.avatar = nil
                tweet.verified = nil
                tweet.likes_count = nil
                tweet.retweets_count = nil
                tweet.comments_count = nil
                tweet.image_url = nil
            end
        end
        
        cb(tweets or {})
    end)
end

RegisterNetEvent('bit-smartphone:tuister:postTweet')
AddEventHandler('bit-smartphone:tuister:postTweet', function(content)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    
    local userRow = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_tuister_users WHERE identifier = @id', { ['@id'] = identifier })
    if not userRow or not userRow[1] then return end
    
    local userId = userRow[1].id
    
    local recent = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_tuister_tweets WHERE user_id = @user AND content = @content AND created_at > DATE_SUB(NOW(), INTERVAL 5 SECOND) LIMIT 1', { ['@user'] = userId, ['@content'] = content })
    if recent and recent[1] then
        print('[Tuister] Duplicate tweet prevented for user_id=' .. tostring(userId))
        return
    end
    
    
    local tweetId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_tuister_tweets (user_id, content) VALUES (@user, @content)', { ['@user'] = userId, ['@content'] = content })
    
    
    if tweetId then
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_tuister_users SET tweets_count = tweets_count + 1 WHERE id = @id', { ['@id'] = userId })
    end
end)

RegisterNetEvent('bit-smartphone:tuister:updateProfile')
AddEventHandler('bit-smartphone:tuister:updateProfile', function(data)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_tuister_users SET display_name = @display, bio = @bio, avatar = @avatar, banner = @banner WHERE identifier = @id', { ['@display'] = data.displayName, ['@bio'] = data.bio, ['@avatar'] = data.avatar, ['@banner'] = data.banner, ['@id'] = identifier })
end)


RegisterNetEvent('bit-smartphone:tuister:completeRegistration')
AddEventHandler('bit-smartphone:tuister:completeRegistration', function(data)
    local src = source
    print('[Tuister] server event completeRegistration received from ' .. tostring(src) .. ' username=' .. tostring(data and data.username))
    local ok = completeTuisterRegistration(src, data)
    if ok then
        print('[Tuister] Registration successful for source=' .. tostring(src))
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'tuister:registerResult', data = { success = true, message = 'Registro completado' } })
    else
        print('[Tuister] Registration failed for source=' .. tostring(src))
        TriggerClientEvent('bit-smartphone:client:sendNuiMessage', src, { action = 'tuister:registerResult', data = { success = false, error = 'Registro fallido' } })
    end
end)


RegisterNetEvent('bit-smartphone:tuister:likeTweet')
AddEventHandler('bit-smartphone:tuister:likeTweet', function(tweetId)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    
    local userRow = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_tuister_users WHERE identifier = @id', { ['@id'] = identifier })
    if not userRow or not userRow[1] then return end
    
    local userId = userRow[1].id
    
    
    local existingLike = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_tuister_likes WHERE tweet_id = @tweet AND user_id = @user', { ['@tweet'] = tweetId, ['@user'] = userId })
    
    if existingLike and existingLike[1] then
        
        SqlFunc(Config.Mysql, 'execute', 'DELETE FROM bit_phone_tuister_likes WHERE tweet_id = @tweet AND user_id = @user', { ['@tweet'] = tweetId, ['@user'] = userId })
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_tuister_tweets SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = @id', { ['@id'] = tweetId })
    else
        
        local insertId = SqlFunc(Config.Mysql, 'insert', 'INSERT IGNORE INTO bit_phone_tuister_likes (tweet_id, user_id) VALUES (@tweet, @user)', { ['@tweet'] = tweetId, ['@user'] = userId })
        
        if insertId and insertId > 0 then
            SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_tuister_tweets SET likes_count = likes_count + 1 WHERE id = @id', { ['@id'] = tweetId })
        else
            
            print('[Tuister] Like insert ignored (duplicate) for tweet=' .. tostring(tweetId) .. ' user=' .. tostring(userId))
        end
    end
end)

RegisterNetEvent('bit-smartphone:tuister:addComment')
AddEventHandler('bit-smartphone:tuister:addComment', function(tweetId, content)
    local src = source
    local identifier = GetPlayerIdentifier(src)
    if not identifier then return end
    
    
    local userRow = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_tuister_users WHERE identifier = @id', { ['@id'] = identifier })
    if not userRow or not userRow[1] then return end
    
    local userId = userRow[1].id
    
    local recent = SqlFunc(Config.Mysql, 'fetchAll', 'SELECT id FROM bit_phone_tuister_comments WHERE tweet_id = @tweet AND user_id = @user AND content = @content AND created_at > DATE_SUB(NOW(), INTERVAL 5 SECOND) LIMIT 1', { ['@tweet'] = tweetId, ['@user'] = userId, ['@content'] = content })
    if recent and recent[1] then
        print('[Tuister] Duplicate comment prevented for user_id=' .. tostring(userId) .. ' tweet_id=' .. tostring(tweetId))
        return
    end

    
    local commentId = SqlFunc(Config.Mysql, 'insert', 'INSERT INTO bit_phone_tuister_comments (tweet_id, user_id, content) VALUES (@tweet, @user, @content)', { 
        ['@tweet'] = tweetId, 
        ['@user'] = userId, 
        ['@content'] = content 
    })

    
    if commentId and commentId > 0 then
        SqlFunc(Config.Mysql, 'execute', 'UPDATE bit_phone_tuister_tweets SET comments_count = comments_count + 1 WHERE id = @id', { ['@id'] = tweetId })
    end
end)
