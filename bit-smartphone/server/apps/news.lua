


local newsData = {
    articles = {},
    editors = {}
}


local function HasNewsPermission(source)
    local playerJob = nil
    
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return false end
        playerJob = xPlayer.getJob().name
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(source)
        if not Player then return false end
        playerJob = Player.PlayerData.job.name
    end
    
    for _, allowedJob in ipairs(Config.News.allowedJobs) do
        if playerJob == allowedJob then
            return true
        end
    end
    
    return false
end


local function GetPlayerInfo(source)
    local playerInfo = {}
    
    if Config.Framework == "esx" then
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
            playerInfo = {
                identifier = xPlayer.getIdentifier(),
                name = xPlayer.getName(),
                job = xPlayer.getJob().name,
                jobLabel = xPlayer.getJob().label
            }
        end
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        local Player = QBCore.Functions.GetPlayer(source)
        if Player then
            playerInfo = {
                identifier = Player.PlayerData.citizenid,
                name = Player.PlayerData.charinfo.firstname .. " " .. Player.PlayerData.charinfo.lastname,
                job = Player.PlayerData.job.name,
                jobLabel = Player.PlayerData.job.label
            }
        end
    end
    
    return playerInfo
end

local function LoadNewsArticles()
    local query = [[
        SELECT id, title, summary, content, image_url, category, author, author_identifier, 
               created_at, is_featured, tags, read_time
        FROM bit_phone_news 
        ORDER BY created_at DESC
    ]]
    
    SqlFunc(query, {}, function(result)
        if result then
            newsData.articles = result
        end
    end)
end

local function SaveNewsArticle(article, callback)
    local query = [[
        INSERT INTO bit_phone_news (title, summary, content, image_url, category, author, author_identifier, 
                             created_at, is_featured, tags, read_time) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]]
    
    local parameters = {
        article.title,
        article.summary,
        article.content,
        article.image_url or '',
        article.category,
        article.author,
        article.author_identifier,
        os.time(),
        article.is_featured or false,
        json.encode(article.tags or {}),
        article.read_time or '2 min'
    }
    
    SqlFunc(query, parameters, function(result)
    if result and result.insertId then
            article.id = result.insertId
            article.created_at = os.time()
            table.insert(newsData.articles, 1, article)
            
            if callback then
                callback(true, article)
            end
            
            if Config.News.notifications.notifyOnNewArticle then
                TriggerClientEvent('bit-smartphone:client:newsUpdated', -1, article)
            end
        else
            if callback then
                callback(false, nil)
            end
        end
    end)
end

local function DeleteNewsArticle(articleId, callback)
    local query = "DELETE FROM bit_phone_news WHERE id = ?"
    
    SqlFunc(query, {articleId}, function(result)
        if result and result.affectedRows and result.affectedRows > 0 then
            
            for i, article in ipairs(newsData.articles) do
                if article.id == articleId then
                    table.remove(newsData.articles, i)
                    break
                end
            end
            
            if callback then
                callback(true)
            end
            
            TriggerClientEvent('bit-smartphone:client:newsDeleted', -1, articleId)
        else
            if callback then
                callback(false)
            end
        end
    end)
end


if Config.Framework == "esx" then
    ESX.RegisterServerCallback('bit-smartphone:server:getNews', function(source, cb)
        local isEditor = HasNewsPermission(source)
        local playerInfo = GetPlayerInfo(source)
        
        cb({
            success = true,
            articles = newsData.articles,
            isEditor = isEditor,
            playerInfo = playerInfo
        })
    end)
    
    ESX.RegisterServerCallback('bit-smartphone:server:createNews', function(source, cb, articleData)
        if not HasNewsPermission(source) then
            cb({
                success = false,
                message = "No tienes permisos para crear noticias"
            })
            return
        end
        
        local playerInfo = GetPlayerInfo(source)
        
        
        if not articleData.title or articleData.title == "" then
            cb({
                success = false,
                message = "El título es obligatorio"
            })
            return
        end
        
        if not articleData.content or articleData.content == "" then
            cb({
                success = false,
                message = "El contenido es obligatorio"
            })
            return
        end
        
        if Config.News.articles.requireSummary and (not articleData.summary or articleData.summary == "") then
            cb({
                success = false,
                message = "El resumen es obligatorio"
            })
            return
        end
        
        
        if #articleData.title > Config.News.articles.maxTitleLength then
            cb({
                success = false,
                message = "El título es demasiado largo (máximo " .. Config.News.articles.maxTitleLength .. " caracteres)"
            })
            return
        end
        
        if articleData.summary and #articleData.summary > Config.News.articles.maxSummaryLength then
            cb({
                success = false,
                message = "El resumen es demasiado largo (máximo " .. Config.News.articles.maxSummaryLength .. " caracteres)"
            })
            return
        end
        
        if #articleData.content > Config.News.articles.maxLength then
            cb({
                success = false,
                message = "El contenido es demasiado largo (máximo " .. Config.News.articles.maxLength .. " caracteres)"
            })
            return
        end
        
        
        local article = {
            title = articleData.title,
            summary = articleData.summary or "",
            content = articleData.content,
            image_url = articleData.image_url or "",
            category = articleData.category or "General",
            author = playerInfo.name or "Redacción",
            author_identifier = playerInfo.identifier,
            is_featured = articleData.is_featured or false,
            tags = articleData.tags or {},
            read_time = math.ceil(#articleData.content / 200) .. " min"
        }
        
        
        SaveNewsArticle(article, function(success, savedArticle)
            if success then
                cb({
                    success = true,
                    message = "Noticia creada exitosamente",
                    article = savedArticle
                })
            else
                cb({
                    success = false,
                    message = "Error al guardar la noticia en la base de datos"
                })
            end
        end)
    end)
    
    ESX.RegisterServerCallback('bit-smartphone:server:deleteNews', function(source, cb, articleId)
        if not HasNewsPermission(source) then
            cb({
                success = false,
                message = "No tienes permisos para eliminar noticias"
            })
            return
        end
        
        DeleteNewsArticle(articleId, function(success)
            if success then
                cb({
                    success = true,
                    message = "Noticia eliminada exitosamente"
                })
            else
                cb({
                    success = false,
                    message = "Error al eliminar la noticia"
                })
            end
        end)
    end)
end


if Config.Framework == "qb" or Config.Framework == "qbox" then
    QBCore.Functions.CreateCallback('bit-smartphone:server:getNews', function(source, cb)
        local isEditor = HasNewsPermission(source)
        local playerInfo = GetPlayerInfo(source)
        
        cb({
            success = true,
            articles = newsData.articles,
            isEditor = isEditor,
            playerInfo = playerInfo
        })
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:server:createNews', function(source, cb, articleData)
        if not HasNewsPermission(source) then
            cb({
                success = false,
                message = "No tienes permisos para crear noticias"
            })
            return
        end
        
        local playerInfo = GetPlayerInfo(source)
        
        
        if not articleData.title or articleData.title == "" then
            cb({
                success = false,
                message = "El título es obligatorio"
            })
            return
        end
        
        if not articleData.content or articleData.content == "" then
            cb({
                success = false,
                message = "El contenido es obligatorio"
            })
            return
        end
        
        if Config.News.articles.requireSummary and (not articleData.summary or articleData.summary == "") then
            cb({
                success = false,
                message = "El resumen es obligatorio"
            })
            return
        end
        
        
        if #articleData.title > Config.News.articles.maxTitleLength then
            cb({
                success = false,
                message = "El título es demasiado largo (máximo " .. Config.News.articles.maxTitleLength .. " caracteres)"
            })
            return
        end
        
        if articleData.summary and #articleData.summary > Config.News.articles.maxSummaryLength then
            cb({
                success = false,
                message = "El resumen es demasiado largo (máximo " .. Config.News.articles.maxSummaryLength .. " caracteres)"
            })
            return
        end
        
        if #articleData.content > Config.News.articles.maxLength then
            cb({
                success = false,
                message = "El contenido es demasiado largo (máximo " .. Config.News.articles.maxLength .. " caracteres)"
            })
            return
        end
        
        
        local article = {
            title = articleData.title,
            summary = articleData.summary or "",
            content = articleData.content,
            image_url = articleData.image_url or "",
            category = articleData.category or "General",
            author = playerInfo.name or "Redacción",
            author_identifier = playerInfo.identifier,
            is_featured = articleData.is_featured or false,
            tags = articleData.tags or {},
            read_time = math.ceil(#articleData.content / 200) .. " min"
        }
        
        
        SaveNewsArticle(article, function(success, savedArticle)
            if success then
                cb({
                    success = true,
                    message = "Noticia creada exitosamente",
                    article = savedArticle
                })
            else
                cb({
                    success = false,
                    message = "Error al guardar la noticia en la base de datos"
                })
            end
        end)
    end)
    
    QBCore.Functions.CreateCallback('bit-smartphone:server:deleteNews', function(source, cb, articleId)
        if not HasNewsPermission(source) then
            cb({
                success = false,
                message = "No tienes permisos para eliminar noticias"
            })
            return
        end
        
        DeleteNewsArticle(articleId, function(success)
            if success then
                cb({
                    success = true,
                    message = "Noticia eliminada exitosamente"
                })
            else
                cb({
                    success = false,
                    message = "Error al eliminar la noticia"
                })
            end
        end)
    end)
end

RegisterNetEvent('bit-smartphone:server:updateNewsArticle', function(articleId, updateData)
    local source = source
    
    if not HasNewsPermission(source) then
        TriggerClientEvent('bit-smartphone:client:notification', source, {
            type = 'error',
            message = 'No tienes permisos para actualizar noticias'
        })
        return
    end
    
    local query = "UPDATE bit_phone_news SET is_featured = ? WHERE id = ?"
    SqlFunc(query, {updateData.is_featured, articleId}, function(result)
        if result and result.affectedRows and result.affectedRows > 0 then
            for _, article in ipairs(newsData.articles) do
                if article.id == articleId then
                    article.is_featured = updateData.is_featured
                    break
                end
            end
            
            TriggerClientEvent('bit-smartphone:client:notification', source, {
                type = 'success',
                message = 'Noticia actualizada exitosamente'
            })
        end
    end)
end)


RegisterCommand('newsreload', function(source, args, rawCommand)
    if source == 0 then 
        LoadNewsArticles()
        print("^2[News] ^7Articles reloaded from database")
    else
        local playerInfo = GetPlayerInfo(source)
        if HasNewsPermission(source) then
            LoadNewsArticles()
            TriggerClientEvent('bit-smartphone:client:notification', source, {
                type = 'success',
                message = 'Noticias recargadas desde la base de datos'
            })
        else
            TriggerClientEvent('bit-smartphone:client:notification', source, {
                type = 'error',
                message = 'No tienes permisos para usar este comando'
            })
        end
    end
end, false)


CreateThread(function()
    Wait(5000) 
    LoadNewsArticles()
end)


exports('getNewsArticles', function()
    return newsData.articles
end)

exports('hasNewsPermission', function(source)
    return HasNewsPermission(source)
end)

exports('createNewsArticle', function(articleData, authorInfo)
    SaveNewsArticle(articleData, function(success, article)
        if success then
            return article
        end
        return nil
    end)
end)
