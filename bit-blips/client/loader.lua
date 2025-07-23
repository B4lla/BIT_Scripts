local playerBlips = {}

local function ClearPlayerBlips()
    for _, b in ipairs(playerBlips) do
        RemoveBlip(b)
    end
    playerBlips = {}
end

function LoadPlayerBlips()
    local function createBlip(b)
        local blipObj = AddBlipForCoord(b.x, b.y, 15.0)
        SetBlipSprite(blipObj, b.icon)
        SetBlipColour(blipObj, b.color)
        local scale = tonumber(b.scale) and b.scale + 0.0 or 1.0
        SetBlipScale(blipObj, scale)
        SetBlipDisplay(blipObj, 2)
        SetBlipAsShortRange(blipObj, false)
        SetBlipPriority(blipObj, 10)

        BeginTextCommandSetBlipName('STRING')
        SetTextFont(Config.BlipTextFont or 0)
        AddTextComponentString(b.name)
        EndTextCommandSetBlipName(blipObj)

        table.insert(playerBlips, blipObj)
    end

    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-blips:getBlips', function(blips)
            ClearPlayerBlips()
            for _, b in ipairs(blips) do
                if b.visible == 1 or b.visible == true then
                    createBlip(b)
                end
            end
        end)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-blips:getBlips', function(blips)
            ClearPlayerBlips()
            for _, b in ipairs(blips) do
                if b.visible == 1 or b.visible == true then
                    createBlip(b)
                end
            end
        end)
    end
end


if Config.Framework == 'esx' then
    RegisterNetEvent('esx:playerLoaded')
    AddEventHandler('esx:playerLoaded', function()
        LoadPlayerBlips()
    end)
elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
    RegisterNetEvent('QBCore:Client:OnPlayerLoaded')
    AddEventHandler('QBCore:Client:OnPlayerLoaded', function()
        LoadPlayerBlips()
    end)
end

RegisterNetEvent('onResourceStart', function(resourceName)
    if resourceName == GetCurrentResourceName() then
        LoadPlayerBlips()
    end
end)
