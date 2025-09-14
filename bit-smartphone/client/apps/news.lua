local newsData = {
    articles = {},
    isEditor = false,
    playerInfo = {}
}


RegisterNUICallback('loadNews', function(data, cb)
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:server:getNews', function(result)
            if result.success then
                newsData = result
                cb({ 
                    success = true, 
                    articles = result.articles, 
                    isEditor = result.isEditor, 
                    playerInfo = result.playerInfo 
                })
            else
                cb({ 
                    success = false, 
                    message = result.message or "Error al obtener noticias" 
                })
            end
        end)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:server:getNews', function(result)
            if result.success then
                newsData = result
                cb({ 
                    success = true, 
                    articles = result.articles, 
                    isEditor = result.isEditor, 
                    playerInfo = result.playerInfo 
                })
            else
                cb({ 
                    success = false, 
                    message = result.message or "Error al obtener noticias" 
                })
            end
        end)
    end
end)


RegisterNUICallback('createNewsArticle', function(data, cb)
    if not newsData.isEditor then
        cb({
            success = false,
            message = "No tienes permisos para crear noticias"
        })
        return
    end
    
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:server:createNews', function(result)
            if result.success then
                table.insert(newsData.articles, 1, result.article)
                PhoneNotify('news.newsCreated', {}, 'system')
                cb({ success = true, message = result.message, article = result.article })
            else
                PhoneNotify('news.newsCreatedError', {error = result.message or 'Error al crear noticia'}, 'system')
                cb(result)
            end
        end, data)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:server:createNews', function(result)
            if result.success then
                table.insert(newsData.articles, 1, result.article)
                QBCore.Functions.Notify('Noticia creada exitosamente', 'success')
                cb({ success = true, message = result.message, article = result.article })
            else
                QBCore.Functions.Notify(result.message or 'Error al crear noticia', 'error')
                cb(result)
            end
        end, data)
    end
end)


RegisterNUICallback('deleteNewsArticle', function(data, cb)
    if not newsData.isEditor then
        cb({
            success = false,
            message = "No tienes permisos para eliminar noticias"
        })
        return
    end
    
    if Config.Framework == "esx" then
        ESX.TriggerServerCallback('bit-smartphone:server:deleteNews', function(result)
            if result.success then
                for i, article in ipairs(newsData.articles) do
                    if article.id == data.articleId then 
                        table.remove(newsData.articles, i) 
                        break 
                    end
                end
                PhoneNotify('news.newsDeleted', {}, 'system')
                cb({ success = true, message = result.message })
            else
                PhoneNotify('news.newsDeletedError', {error = result.message or 'Error al eliminar noticia'}, 'system')
                cb(result)
            end
        end, data.articleId)
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.TriggerCallback('bit-smartphone:server:deleteNews', function(result)
            if result.success then
                for i, article in ipairs(newsData.articles) do 
                    if article.id == data.articleId then 
                        table.remove(newsData.articles, i) 
                        break 
                    end 
                end
                QBCore.Functions.Notify('Noticia eliminada exitosamente', 'success')
                cb({ success = true, message = result.message })
            else
                QBCore.Functions.Notify(result.message or 'Error al eliminar noticia', 'error')
                cb(result)
            end
        end, data.articleId)
    end
end)


RegisterNetEvent('bit-smartphone:client:newsUpdated', function(newArticle)
    table.insert(newsData.articles, 1, newArticle)
    
    
    SendNUIMessage({
        action = 'newsUpdated',
        article = newArticle
    })
    
    
    if Config.Framework == "esx" then
        PhoneNotify('news.newNewsAvailable', {title = newArticle.title}, 'system')
    elseif Config.Framework == "qb" or Config.Framework == "qbox" then
        QBCore.Functions.Notify('📰 Nueva noticia disponible: ' .. newArticle.title, 'info', 5000)
    end
end)


RegisterNetEvent('bit-smartphone:client:newsDeleted', function(articleId)
    for i, article in ipairs(newsData.articles) do
        if article.id == articleId then
            table.remove(newsData.articles, i)
            break
        end
    end
    
    
    SendNUIMessage({
        action = 'newsDeleted',
        articleId = articleId
    })
end)