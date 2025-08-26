Citizen.CreateThread( function()
    script = "smartphone"
    resourceName = "BIT-SMARTPHONE"
    
    function checkVersion(err, responseText, headers)
        curVersion = LoadResourceFile(GetCurrentResourceName(), "version")
        responseText = 1.0
        if curVersion ~= responseText and tonumber(curVersion) < tonumber(responseText) then
            print("^1--------------------------------------------")
            print("^1"..resourceName.." is outdated, should be: ^3"..responseText.."^1Actual version: ^3"..curVersion.."\n^1Please update it from https://keymaster.fivem.net")
            print("^1--------------------------------------------")
        elseif tonumber(curVersion) > tonumber(responseText) then
            print("^1--------------------------------------------")
            print("^1"..resourceName.." is outdated, should be: ^3"..responseText.."^1Actual version: ^3"..curVersion.."\n^1Please update it from https://keymaster.fivem.net")
            print("^1--------------------------------------------")
        else
            print("^2--------------------------------------------")
            print("^2"..resourceName.." is up to date!")
            print("^2--------------------------------------------")
        end
    end
    
    PerformHttpRequest("https://raw.githubusercontent.com/bitc0de/bit-versions/main/"..script, checkVersion, "GET")
    end)