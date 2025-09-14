RegisterNUICallback('tuister:completeRegistration', function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:tuister:completeRegistration', function(success)
            cb({ success = success })
        end, data)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:tuister:completeRegistration', function(success)
            cb({ success = success })
        end, data)
    else
        TriggerServerEvent('bit-smartphone:tuister:completeRegistration', data)
        cb({ success = true })
    end
end)

RegisterNUICallback('tuister:loadProfile', function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:tuister:loadProfile', function(profile)
            cb({ success = true, profile = profile })
        end)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:tuister:loadProfile', function(profile)
            cb({ success = true, profile = profile })
        end)
    else
        cb({ success = false, profile = {} })
    end
end)

RegisterNUICallback('tuister:loadTweets', function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:tuister:loadTweets', function(tweets)
            cb({ success = true, tweets = tweets })
        end)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:tuister:loadTweets', function(tweets)
            cb({ success = true, tweets = tweets })
        end)
    else
        cb({ success = false, tweets = {} })
    end
end)

RegisterNUICallback('tuister:postTweet', function(data, cb)
    TriggerServerEvent('bit-smartphone:tuister:postTweet', data.content)
    cb({ success = true })
end)

RegisterNUICallback('tuister:updateProfile', function(data, cb)
    TriggerServerEvent('bit-smartphone:tuister:updateProfile', {
        displayName = data.displayName,
        bio = data.bio,
        avatar = data.avatar,
        banner = data.banner
    })
    cb({ success = true })
end)

RegisterNUICallback('tuister:likeTweet', function(data, cb)
    TriggerServerEvent('bit-smartphone:tuister:likeTweet', data.tweetId)
    cb({ success = true })
end)

RegisterNUICallback('tuister:addComment', function(data, cb)
    TriggerServerEvent('bit-smartphone:tuister:addComment', data.tweetId, data.content)
    cb({ success = true })
end)
