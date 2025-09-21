RegisterNUICallback('bit-smartphone:instagram:register', function(data, cb)
    if not IsPhoneConnected() then
        cb({success = false, error = 'no_signal'})
        return
    end
    
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:register', function(result)
            cb(result)
            if result and result.success then
                SendNUIMessage({ action = 'instagram:register_success', data = { message = 'Registro completado', username = data and data.username, password = data and (data.password or data.confirmPassword) } })
            else
                SendNUIMessage({ action = 'instagram:register_error', data = { error = result and result.code or 'error' } })
            end
        end, data)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:register', function(result)
            cb(result)
            if result and result.success then
                SendNUIMessage({ action = 'instagram:register_success', data = { message = 'Registro completado', username = data and data.username, password = data and (data.password or data.confirmPassword) } })
            else
                SendNUIMessage({ action = 'instagram:register_error', data = { error = result and result.code or 'error' } })
            end
        end, data)
    else
        TriggerServerEvent('bit-smartphone:instagram:register', data)
        cb({ success = true })
    end
end)

RegisterNUICallback('bit-smartphone:instagram:verify', function(data, cb)
    TriggerServerEvent('bit-smartphone:instagram:verify', { username = data.username, code = data.code })
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:instagram:login', function(data, cb)
    print('[bit-smartphone][instagram] NUI callback: bit-smartphone:instagram:login received')
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:login', function(result)
            cb(result)
            if result and result.success and result.account then
                SendNUIMessage({ action = 'instagram:login_success', data = result.account })
            else
                SendNUIMessage({ action = 'instagram:login_error', data = { error = 'Credenciales inválidas' } })
            end
        end, data)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:login', function(result)
            cb(result)
            if result and result.success and result.account then
                SendNUIMessage({ action = 'instagram:login_success', data = result.account })
            else
                SendNUIMessage({ action = 'instagram:login_error', data = { error = 'Credenciales inválidas' } })
            end
        end, data)
    else
        TriggerServerEvent('bit-smartphone:instagram:login', data)
        cb({ success = true })
    end
end)

RegisterNUICallback('bit-smartphone:instagram:getFeed', function(data, cb)
    TriggerServerEvent('bit-smartphone:instagram:getFeed')
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:instagram:getStories', function(data, cb)
    TriggerServerEvent('bit-smartphone:instagram:getStories')
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:instagram:getProfilePosts', function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:getProfilePosts', function(posts)
            SendNUIMessage({ action = 'instagram:profile_posts_data', data = { posts = posts or {} } })
            cb({ success = true })
        end)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:getProfilePosts', function(posts)
            SendNUIMessage({ action = 'instagram:profile_posts_data', data = { posts = posts or {} } })
            cb({ success = true })
        end)
    else
        cb({ success = false })
    end
end)

RegisterNUICallback('bit-smartphone:instagram:createPost', function(data, cb)
    TriggerServerEvent('bit-smartphone:instagram:createPost', {
        caption = data.caption,
        image = data.image,
        location = data.location,
        type = data.type or 'post'
    })
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:instagram:likePost', function(data, cb)
    TriggerServerEvent('bit-smartphone:instagram:likePost', { postId = data.postId })
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:instagram:addComment', function(data, cb)
    TriggerServerEvent('bit-smartphone:instagram:addComment', { postId = data.postId, comment = data.comment })
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:instagram:takePhoto', function(data, cb)
    TriggerEvent('phone:camera:takePhoto', function(photoUrl)
        SendNUIMessage({ action = 'instagram:photo_taken', data = { imageUrl = photoUrl } })
    end)
    cb('ok')
end)

RegisterNUICallback('instagramRegister', function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:register', function(result)
            cb(result)
            if result and result.success then
                SendNUIMessage({ action = 'instagram:register_success', data = { message = 'Registro completado', username = data and data.username, password = data and (data.password or data.confirmPassword) } })
            else
                SendNUIMessage({ action = 'instagram:register_error', data = { error = result and result.code or 'error' } })
            end
        end, data)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:register', function(result)
            cb(result)
            if result and result.success then
                SendNUIMessage({ action = 'instagram:register_success', data = { message = 'Registro completado', username = data and data.username, password = data and (data.password or data.confirmPassword) } })
            else
                SendNUIMessage({ action = 'instagram:register_error', data = { error = result and result.code or 'error' } })
            end
        end, data)
    else
        TriggerServerEvent('bit-smartphone:instagram:register', data)
        cb({ success = true })
    end
end)

RegisterNUICallback('instagramLogin', function(data, cb)
    print('[bit-smartphone][instagram] NUI callback: instagramLogin received')
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:login', function(result)
            cb(result)
            if result and result.success and result.account then
                SendNUIMessage({ action = 'instagram:login_success', data = result.account })
            else
                SendNUIMessage({ action = 'instagram:login_error', data = { error = 'Credenciales inválidas' } })
            end
        end, data)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:login', function(result)
            cb(result)
            if result and result.success and result.account then
                SendNUIMessage({ action = 'instagram:login_success', data = result.account })
            else
                SendNUIMessage({ action = 'instagram:login_error', data = { error = 'Credenciales inválidas' } })
            end
        end, data)
    else
        TriggerServerEvent('bit-smartphone:instagram:login', data)
        cb({ success = true })
    end
end)

RegisterNUICallback('loadInstagramFeed', function(data, cb)
    print('[bit-smartphone][instagram] NUI callback: loadInstagramFeed received')
    TriggerServerEvent('instagram:getFeed')
    cb('ok')
end)

RegisterNUICallback('loadInstagramStories', function(data, cb)
    print('[bit-smartphone][instagram] NUI callback: loadInstagramStories received')
    TriggerServerEvent('instagram:getStories')
    cb('ok')
end)

RegisterNUICallback('bit-smartphone:instagram:searchUsers', function(data, cb)
    local query = data and data.query or ''
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:searchUsers', function(users)
            cb({ users = users or {} })
            SendNUIMessage({ action = 'instagram:search_results', data = { users = users or {} } })
        end, query)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:searchUsers', function(users)
            cb({ users = users or {} })
            SendNUIMessage({ action = 'instagram:search_results', data = { users = users or {} } })
        end, query)
    else
        cb({ users = {} })
    end
end)

RegisterNUICallback('bit-smartphone:instagram:updateProfile', function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:updateProfile', function(result)
            cb(result)
            if result and result.success then
                SendNUIMessage({ action = 'instagram:profile_updated', data = { username = data.username } })
            end
        end, data)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:updateProfile', function(result)
            cb(result)
            if result and result.success then
                SendNUIMessage({ action = 'instagram:profile_updated', data = { username = data.username } })
            end
        end, data)
    else
        cb({ success = false })
    end
end)

RegisterNUICallback('bit-smartphone:instagram:sendMessage', function(data, cb)
    if not data or not data.to or not data.message then cb({ success = false }); return end
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:sendMessage', function(result)
            cb(result)
            SendNUIMessage({ action = result and result.success and 'instagram:message_sent' or 'instagram:message_error', data = { to = data.to, success = result and result.success } })
        end, data)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:sendMessage', function(result)
            cb(result)
            SendNUIMessage({ action = result and result.success and 'instagram:message_sent' or 'instagram:message_error', data = { to = data.to, success = result and result.success } })
        end, data)
    else
        cb({ success = false })
    end
end)

RegisterNUICallback('bit-smartphone:instagram:getMessages', function(data, cb)
    if not data or not data.with then cb({ messages = {} }); return end
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-smartphone:instagram:getMessages', function(msgs)
            cb({ messages = msgs or {} })
            SendNUIMessage({ action = 'instagram:messages_list', data = { with = data.with, messages = msgs or {} } })
        end, data.with)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-smartphone:instagram:getMessages', function(msgs)
            cb({ messages = msgs or {} })
            SendNUIMessage({ action = 'instagram:messages_list', data = { with = data.with, messages = msgs or {} } })
        end, data.with)
    else
        cb({ messages = {} })
    end
end)