local playerBlips = {}

local function ClearPlayerBlips()
    for _, b in ipairs(playerBlips) do
        RemoveBlip(b)
    end
    playerBlips = {}
end

function LoadPlayerBlips()
    if Config.Framework == 'esx' then
        ESX.TriggerServerCallback('bit-blips:getBlips', function(blips)
            ClearPlayerBlips()
            for _, b in ipairs(blips) do
                if b.visible == 1 or b.visible == true then
                    local blipObj = AddBlipForCoord(b.x, b.y, b.z)
                    SetBlipSprite(blipObj, b.icon)
                    SetBlipColour(blipObj, b.color)
                    SetBlipScale(blipObj, b.scale or 1.0)
                    SetBlipAsShortRange(blipObj, true)
                    BeginTextCommandSetBlipName('STRING')
                    AddTextComponentString(b.name)
                    EndTextCommandSetBlipName(blipObj)
                    table.insert(playerBlips, blipObj)
                end
            end
        end)
    elseif Config.Framework == 'qb' or Config.Framework == 'qbox' then
        QBCore.Functions.TriggerCallback('bit-blips:getBlips', function(blips)
            ClearPlayerBlips()
            for _, b in ipairs(blips) do
                if b.visible == 1 or b.visible == true then
                    local blipObj = AddBlipForCoord(b.x, b.y, b.z)
                    SetBlipSprite(blipObj, b.icon)
                    SetBlipColour(blipObj, b.color)
                    SetBlipScale(blipObj, b.scale or 1.0)
                    SetBlipAsShortRange(blipObj, true)
                    BeginTextCommandSetBlipName('STRING')
                    AddTextComponentString(b.name)
                    EndTextCommandSetBlipName(blipObj)
                    table.insert(playerBlips, blipObj)
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
