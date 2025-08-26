function SqlFunc(plugin, type, query, var)
    if plugin == 'oxmysql' then
        if type == 'fetchAll' then
            return exports.oxmysql:query_async(query, var)
        elseif type == 'execute' then
            return exports.oxmysql:execute_async(query, var)
        elseif type == 'insert' then
            return exports.oxmysql:insert_async(query, var)
        elseif type == 'fetchScalar' then
            return exports.oxmysql:scalar_async(query, var)
        end
    end
    
    local wait = promise.new()
    
    if type == 'fetchAll' and plugin == 'mysql-async' then
        MySQL.Async.fetchAll(query, var, function(result)
            wait:resolve(result)
        end)
    elseif type == 'execute' and plugin == 'mysql-async' then
        MySQL.Async.execute(query, var, function(result)
            wait:resolve(result)
        end)
    elseif type == 'insert' and plugin == 'mysql-async' then
        MySQL.Async.insert(query, var, function(insertId)
            wait:resolve(insertId)
        end)
    elseif type == 'fetchScalar' and plugin == 'mysql-async' then
        MySQL.Async.fetchScalar(query, var, function(result)
            wait:resolve(result)
        end)
    elseif type == 'execute' and plugin == 'ghmattisql' then
        exports['ghmattimysql']:execute(query, var, function(result)
            wait:resolve(result)
        end)
    elseif type == 'insert' and plugin == 'ghmattisql' then
        exports['ghmattimysql']:execute(query, var, function(result)
            wait:resolve(result)
        end)
    elseif type == 'fetchAll' and plugin == 'ghmattisql' then
        exports.ghmattimysql:execute(query, var, function(result)
            wait:resolve(result)
        end)
    elseif type == 'fetchScalar' and plugin == 'ghmattisql' then
        exports.ghmattimysql:scalar(query, var, function(result)
            wait:resolve(result)
        end)
    end
    
    return Citizen.Await(wait)
end