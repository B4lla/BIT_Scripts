function SqlFunc(plugin, type, query, var)
    local wait = promise.new()
    
    if plugin == 'oxmysql' then
        if type == 'fetchAll' then
            exports.oxmysql:execute(query, var, function(result)
                wait:resolve(result)
            end)
        elseif type == 'execute' then
            exports.oxmysql:execute(query, var, function(result)
                wait:resolve(result)
            end)
        elseif type == 'insert' then
            exports.oxmysql:insert(query, var, function(result)
                wait:resolve(result)
            end)
        end
    elseif plugin == 'mysql-async' then
        if type == 'fetchAll' then
            MySQL.Async.fetchAll(query, var, function(result)
                wait:resolve(result)
            end)
        elseif type == 'execute' then
            MySQL.Async.execute(query, var, function(result)
                wait:resolve(result)
            end)
        elseif type == 'insert' then
            MySQL.Async.insert(query, var, function(result)
                wait:resolve(result)
            end)
        end
    elseif plugin == 'ghmattisql' then
        exports.ghmattimysql:execute(query, var, function(result)
            wait:resolve(result)
        end)
    end
    
    return Citizen.Await(wait)
end