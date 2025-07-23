--########
-- Variables
--########


local InMenu = false



--########
-- Utils
--########


if Config.MenuKey and Config.MenuKey.enabled then
    RegisterKeyMapping(Config.Command, Config.MenuKey.description or "Open Blip Menu", 'keyboard', Config.MenuKey.key)
end


RegisterCommand(Config.Command, function()
    SetNuiFocus(true, true)
    local coords = GetEntityCoords(PlayerPedId())
    SendNUIMessage({ 
        action = 'showUI',
        coords = coords,
        blurStrength = Config.BlurStrength
    })
    SendNUIMessage({ action = 'initLang', lang = Lang })

    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-blips:getBlips', function(blips)
            SendNUIMessage({ action = 'initBlips', blips = blips })
        end)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-blips:getBlips', function(blips)
            SendNUIMessage({ action = 'initBlips', blips = blips })
        end)
    end
    InMenu = true
    Citizen.CreateThread(function()
        while InMenu do
            Citizen.InvokeNative(0xF4F2C0D4EE209E20) -- remove inactive camera 
            Citizen.Wait(15000)
        end 
    end)
end, false)




--#######
-- NUI Callbacks
--#######


RegisterNUICallback("closeUI", function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-blips:updateVisibility', function(success)
            SetNuiFocus(false, false)
            InMenu = false
            DisplayRadar(true)
            LoadPlayerBlips()
        end, data.blips)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-blips:updateVisibility', function(success)
            SetNuiFocus(false, false)
            InMenu = false
            DisplayRadar(true) 
            LoadPlayerBlips()
        end, data.blips)
    else
        SetNuiFocus(false, false)
        InMenu = false
        DisplayRadar(true) 
        LoadPlayerBlips()
    end
    cb('ok')
end)

RegisterNUICallback('saveBlip', function(data, cb)
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-blips:saveBlip', function(savedBlip)
            if savedBlip then
                SendNUIMessage({ action = 'saveBlipResult', blip = savedBlip })
            end
            cb('ok')
            LoadPlayerBlips()
            if data.id then
                Notifications(Noti.check, Lang.BlipUpdated, Noti.time)
            else
                Notifications(Noti.check, Lang.BlipCreated, Noti.time)
            end
        end, data)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-blips:saveBlip', function(savedBlip)
            if savedBlip then
                SendNUIMessage({ action = 'saveBlipResult', blip = savedBlip })
            end
            cb('ok')
            LoadPlayerBlips()
            if data.id then
                Notifications(Noti.check, Lang.BlipUpdated, Noti.time)
            else
                Notifications(Noti.check, Lang.BlipCreated, Noti.time)
            end
        end, data)
    else
        cb('error')
    end
end)

RegisterNUICallback('deleteBlip', function(data, cb)
    local blipId = data.id
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-blips:deleteBlip', function(success)
            if success then
                SendNUIMessage({ action = 'deleteBlipResult', id = blipId })
            end
            cb('ok')

            LoadPlayerBlips()
            Notifications(Noti.check, Lang.BlipDeleted, Noti.time)
        end, blipId)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-blips:deleteBlip', function(success)
            if success then
                SendNUIMessage({ action = 'deleteBlipResult', id = blipId })
            end
            cb('ok')
            LoadPlayerBlips()
            Notifications(Noti.check, Lang.BlipDeleted, Noti.time)
        end, blipId)
    else
        cb('error')
    end
end)


--########
-- Net Events
--########

RegisterNetEvent('bit-blips:sendBlips')
AddEventHandler('bit-blips:sendBlips', function(rows)
    SendNUIMessage({ action = 'initBlips', blips = rows })
end)
