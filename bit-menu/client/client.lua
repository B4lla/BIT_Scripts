--- ##############
---    Variables
--- ##############

menuOpen = false
local name = nil


--- ##############
---  Key Binding
--- ##############


if Config.MenuKey and Config.MenuKey.enabled then
    RegisterKeyMapping(Config.Command, Config.MenuKey.description or 'Open BIT Menu', 'keyboard', Config.MenuKey.key or 'F6')
end

RegisterCommand(Config.Command, function()
    openMenu()
end, false)


--- ##############
---  NET Events
--- ##############
 
RegisterNetEvent("bit-menu:openMenu", function()
    openMenu()
end)



--- ##############
---  NUI Callbacks
--- ##############

RegisterNUICallback('close', function(data)
    SetDisplay(false)
end)

RegisterNUICallback('executeAction', function(data, cb)
    local action = data.action
    local targetId = tonumber(data.targetId)
    SetDisplay(false)

    if type(Action[action]) == 'function' then
        Action[action](targetId)
    else
        print("^1[ERROR] No function found for action: " .. action)
    end
    cb('ok')
end)







--- ##############
---   Functions
--- ##############

function SetDisplay(bool)
    if bool then
        local playerJob = Utils.getPlayerJob()
        local hasAccess = false
        for _, roleConfig in pairs(Actions.roleActions or {}) do
            for _, j in ipairs(roleConfig.jobs or {}) do
                if j == playerJob then
                    if roleConfig.actions and #roleConfig.actions > 0 then hasAccess = true end
                    break
                end
            end
            if hasAccess then break end
        end
        if not hasAccess then
            Notifications(Noti.error, Actions.texts.noActions, Noti.time)
            return
        end
    end
    menuOpen = bool
    SetNuiFocus(bool, bool) 
    if bool then
        local playerJob = Utils.getPlayerJob()

         SendNUIMessage({
            type = "translations",
            translations = Actions.texts or {},
            config = { 
                roleActions = Actions.roleActions 
            }
        })

        Citizen.Wait(50)
        SendNUIMessage({ 
            type = "setRole", 
            role = playerJob or "civ" 
        })

        local nearby = {}
        local playerPed = PlayerPedId()
        local playerCoords = GetEntityCoords(playerPed)
        for _, v in ipairs(GetActivePlayers()) do
            if v ~= PlayerId() then
                local ped = GetPlayerPed(v)
                local coords = GetEntityCoords(ped)
                local dist = #(coords - playerCoords)
                if Config.UseSteamName then
                    name = GetPlayerName(v)
                else
                    local serverId = GetPlayerServerId(v)
                    name = Utils.getPlayerNameServer(serverId)
                end
                table.insert(nearby, {                    id = GetPlayerServerId(v),
                    name = name,
                    distance = math.floor(dist * 100) / 100
                })
            end
        end

        SendNUIMessage({ type = "setNearbyPlayers", players = nearby })
        SendNUIMessage({ type = "showMenu" })
    else
        SendNUIMessage({ type = "hideMenu" })
    end
end

function openMenu()
    if not menuOpen then
        SetDisplay(true)
        menuOpen = true
    end
end

