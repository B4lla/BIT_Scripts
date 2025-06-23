Config, Noti = {}, {}

-- $$$$$$\   $$$$$$\  $$\   $$\ $$$$$$$$\ $$$$$$\  $$$$$$\  $$\   $$\ $$$$$$$\   $$$$$$\ $$$$$$$$\ $$$$$$\  $$$$$$\  $$\   $$\ 
-- $$  __$$\ $$  __$$\ $$$\  $$ |$$  _____|\_$$  _|$$  __$$\ $$ |  $$ |$$  __$$\ $$  __$$\\__$$  __|\_$$  _|$$  __$$\ $$$\  $$ |
-- $$ /  \__|$$ /  $$ |$$$$\ $$ |$$ |        $$ |  $$ /  \__|$$ |  $$ |$$ |  $$ |$$ /  $$ |  $$ |     $$ |  $$ /  $$ |$$$$\ $$ |
-- $$ |      $$ |  $$ |$$ $$\$$ |$$$$$\      $$ |  $$ |$$$$\ $$ |  $$ |$$$$$$$  |$$$$$$$$ |  $$ |     $$ |  $$ |  $$ |$$ $$\$$ |
-- $$ |      $$ |  $$ |$$ \$$$$ |$$  __|     $$ |  $$ |\_$$ |$$ |  $$ |$$  __$$< $$  __$$ |  $$ |     $$ |  $$ |  $$ |$$ \$$$$ |
-- $$ |  $$\ $$ |  $$ |$$ |\$$$ |$$ |        $$ |  $$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |  $$ |     $$ |  $$ |  $$ |$$ |\$$$ |
-- \$$$$$$  | $$$$$$  |$$ | \$$ |$$ |      $$$$$$\ \$$$$$$  |\$$$$$$  |$$ |  $$ |$$ |  $$ |  $$ |   $$$$$$\  $$$$$$  |$$ | \$$ |
-- \______/  \______/ \__|  \__|\__|      \______| \______/  \______/ \__|  \__|\__|  \__|  \__|   \______| \______/ \__|  \__|


-- Framework used by the server (esx | qb | qbox)
Config.Framework = "qb"
-- Names will be displayed in the menu
Config.UseSteamName = false
-- Radius to search for nearby players
Config.NearbyRadius = 5.0
-- Command to open the menu | Keep it empty to disable the command
Config.Command = "menu" 
-- Key to open the menu | Set to false to disable | Key codes: https://docs.fivem.net/docs/game-references/input-mapper-parameter-ids/
Config.MenuKey = {
    enabled = true,                   -- Enable/disable key binding
    key = "F6",                       -- Key to open menu (F6, F7, etc.)
    description = "Open BIT Menu"     -- Description for key mapping
}
-- Notification system to use (okok | origen | ox | wasabi | codem | esx | qb)
Config.Notifications = "qb"
-- Inventory system to use (esx | qbcore| ox | qs | custom) | Custom allows you to implement your own inventory system
Config.Inventory = {
  system = "qbcore",
  open = {
    esx = function(targetId, inv)
      -- ESX
    end,
    qbcore = function(targetId, inv)
      exports['qb-inventory']:OpenInventoryById(playerID, targetId)
      --exports['qb-inventory']:openInventory(targetId)
    end,
    ox = function(targetId, inv)
      exports.ox_inventory:openInventory("player", targetId)
    end,
    qs = function(targetId, inv)
      exports['qs-inventory']:OpenInventory(targetId)
    end,
    custom = function(targetId, inv)
      -- Custom open 
    end,
  },
  get = {
    esx = function(targetId, itemName)
      local xPlayer = ESX.GetPlayerFromId(targetId)
      local item = xPlayer and xPlayer.getInventoryItem and xPlayer.getInventoryItem(itemName)
      return item and item.count > 0
    end,
    qbcore = function(targetId, itemName)
      local item = exports['qb-inventory']:GetItemByName(targetId, itemName)
      return item and item.amount > 0
    end,    ox = function(targetId, itemName)
      local item = exports.ox_inventory:Search(targetId, 'count', itemName)
      return item and item > 0
    end,
    qs = function(targetId, itemName)
      local item = exports['qs-inventory']:GetItem(targetId, itemName)
      return item and item.count > 0
    end,
    custom = function(targetId, itemName)
      return false
    end,
  },  remove = {
    esx = function(source, item, count)
      if ESX then
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
          xPlayer.removeInventoryItem(item, count or 1)
        end
      end
    end,
    qbcore = function(source, item, count)
      exports['qb-inventory']:RemoveItem(source, item, count or 1)
    end,
    ox = function(source, item, count)
      exports.ox_inventory:RemoveItem(source, item, count or 1)
    end,
    qs = function(source, item, count)
      exports['qs-inventory']:RemoveItem(source, item, count or 1)
    end,
    custom = function(source, item, count)
      -- Custom removal 
    end,
  },add = {
    esx = function(source, item, count)
      -- ESX
      if ESX then
        local xPlayer = ESX.GetPlayerFromId(source)
        if xPlayer then
          xPlayer.addInventoryItem(item, count or 1)
        end
      end
    end,
    qbcore = function(source, item, count)
      exports['qb-inventory']:AddItem(source, item, count or 1)
    end,    ox = function(source, item, count)
      exports.ox_inventory:AddItem(source, item, count or 1)
    end,
    qs = function(source, item, count)
      exports['qs-inventory']:AddItem(source, item, count or 1)
    end,
    custom = function(source, item, count)
      -- Custom add
    end,
  },
}






-- $$\   $$\  $$$$$$\ $$$$$$$$\ $$$$$$\ $$$$$$$$\ $$$$$$\  $$$$$$\   $$$$$$\ $$$$$$$$\ $$$$$$\  $$$$$$\  $$\   $$\  $$$$$$\  
-- $$$\  $$ |$$  __$$\\__$$  __|\_$$  _|$$  _____|\_$$  _|$$  __$$\ $$  __$$\\__$$  __|\_$$  _|$$  __$$\ $$$\  $$ |$$  __$$\ 
-- $$$$\ $$ |$$ /  $$ |  $$ |     $$ |  $$ |        $$ |  $$ /  \__|$$ /  $$ |  $$ |     $$ |  $$ /  $$ |$$$$\ $$ |$$ /  \__|
-- $$ $$\$$ |$$ |  $$ |  $$ |     $$ |  $$$$$\      $$ |  $$ |      $$$$$$$$ |  $$ |     $$ |  $$ |  $$ |$$ $$\$$ |\$$$$$$\  
-- $$ \$$$$ |$$ |  $$ |  $$ |     $$ |  $$  __|     $$ |  $$ |      $$  __$$ |  $$ |     $$ |  $$ |  $$ |$$ \$$$$ | \____$$\ 
-- $$ |\$$$ |$$ |  $$ |  $$ |     $$ |  $$ |        $$ |  $$ |  $$\ $$ |  $$ |  $$ |     $$ |  $$ |  $$ |$$ |\$$$ |$$\   $$ |
-- $$ | \$$ | $$$$$$  |  $$ |   $$$$$$\ $$ |      $$$$$$\ \$$$$$$  |$$ |  $$ |  $$ |   $$$$$$\  $$$$$$  |$$ | \$$ |\$$$$$$  |
-- \__|  \__| \______/   \__|   \______|\__|      \______| \______/ \__|  \__|  \__|   \______| \______/ \__|  \__| \______/

---@param notitype String type of notification (info, check, error)
---@param message String message to display
---@param time Number time in milliseconds to display the notification

function Notifications(notitype, message, time)
    if Config.Notifications == "okok" then
        exports['okokNotify']:Alert("Notification", message, time, notitype)

    elseif Config.Notifications == "origen" then
        exports["origen_notify"]:ShowNotification(message)

    elseif Config.Notifications == "ox" then
        -- You need to import ox_lib in your fxmanifest.lua | Documentation: https://overextended.dev/ox_lib#usage
        --lib.notify({title = 'Notification', description = message, type = notitype})

    elseif Config.Notifications == "wasabi" then
        exports.wasabi_notify:notify("Notification", message, time, notitype)

    elseif Config.Notifications == "codem" then
        TriggerEvent("codem-notification", message, time, notitype)

    else
        if Config.Notifications == "esx" then
            ESX.ShowNotification(message)
            
        elseif Config.Notifications == "qb" or "qbox" then
            QBCore.Functions.Notify(message)

        else
            print("^1[WARNING]^0 No compatible notification system found.")
            print("^1[INFO]^0 Message: " .. message)
        end
    end
end

-- Notifications types:
Noti.info = 'info'
Noti.check = 'check'
Noti.error = 'error'
Noti.time = 5000




--  $$$$$$\              $$\     $$\                               
-- $$  __$$\             $$ |    \__|                              
-- $$ /  $$ | $$$$$$$\ $$$$$$\   $$\  $$$$$$\  $$$$$$$\   $$$$$$$\ 
-- $$$$$$$$ |$$  _____|\_$$  _|  $$ |$$  __$$\ $$  __$$\ $$  _____|
-- $$  __$$ |$$ /        $$ |    $$ |$$ /  $$ |$$ |  $$ |\$$$$$$\  
-- $$ |  $$ |$$ |        $$ |$$\ $$ |$$ |  $$ |$$ |  $$ | \____$$\ 
-- $$ |  $$ |\$$$$$$$\   \$$$$  |$$ |\$$$$$$  |$$ |  $$ |$$$$$$$  |
-- \__|  \__| \_______|   \____/ \__| \______/ \__|  \__|\_______/ 


-- Consolidated actions, roles, jobs and UI texts
Actions = {
    roleActions = {        
        police = {
            jobs = { "police" },
            label = "Police",
            actions = {
                { id = "handcuff", icon = "fas fa-handcuffs", color = "#ef4444", label = "Handcuff" },
                { id = "unhandcuff", icon = "fas fa-unlock", color = "#10b981", label = "Unhandcuff" },
                { id = "search", icon = "fas fa-search", color = "#f59e0b", label = "Search" },
                { id = "putInVehicle", icon = "fas fa-car-side", color = "#3b82f6", label = "Put in Vehicle" },
                { id = "removeFromVehicle", icon = "fas fa-door-open", color = "#6366f1", label = "Remove from Vehicle" },
                { id = "escort", icon = "fas fa-walking", color = "#8b5cf6", label = "Escort" },
                { id = "headbag", icon = "fas fa-mask", color = "#6b7280", label = "Headbag" },
                { id = "tielegs", icon = "fas fa-link", color = "#9333ea", label = "Tie Legs" },
                { id = "carry", icon = "fas fa-people-carry", color = "#f59e0b", label = "Carry" },
                { id = "drag", icon = "fas fa-hand-rock", color = "#ef4444", label = "Drag" },
            }
        },
        gang = {
            jobs = { "ballas" },
            label = "Gang",
            actions = {
                { id = "handcuff", icon = "fas fa-handcuffs", color = "#ef4444", label = "Handcuff" },
                { id = "unhandcuff", icon = "fas fa-unlock", color = "#10b981", label = "Unhandcuff" },
                { id = "escort", icon = "fas fa-walking", color = "#8b5cf6", label = "Escort" },
                { id = "search", icon = "fas fa-money-bill-wave", color = "#10b981", label = "Rob" },
                { id = "carry", icon = "fas fa-people-carry", color = "#f59e0b", label = "Carry" },
                { id = "drag", icon = "fas fa-hand-rock", color = "#ef4444", label = "Drag" },
                { id = "headbag" , icon = "fas fa-mask", color = "#8b5cf6", label = "Headbag" },
                { id = "tielegs", icon = "fas fa-link", color = "#9333ea", label = "Tie Legs" },
            }
        }
    },    texts = {
        -- General messages
        noActions = "You have no available actions",
        error = "An error occurred while processing your request",
        nearbyPlayersTitle = "Nearby Players",
        selectedTargetTitle = "Target",
        availableActionsTitle = "Available Actions",
        closeMenu = "Close Menu",
        selectPlayerPrompt = "Select a Player",
        noPlayerPrompt = "Choose a player from the list to see available actions",
        
        -- Handcuff messages
        handcuffSuccess = "Player handcuffed",
        handcuffError = "Could not handcuff the player",
        unhandcuffSuccess = "Player unhandcuffed", 
        unhandcuffError = "Could not unhandcuff the player",
        
        -- Search messages
        searchError = "Could not access player's inventory",
        
        -- Escort messages
        escortStart = "Escorting player",
        escortStop = "You stopped escorting",
        escortErrorNotCuffed = "Player must be handcuffed to be escorted",
        escortError = "Could not escort the player",
        
        -- Carry messages
        carryStart = "Started carrying player",
        carryStop = "Stopped carrying player",
        carryErrorCondition = "Player must be unconscious or injured to be carried",
        carryError = "Could not carry the player",

        -- Vehicle messages
        putInVehicleSuccess = "Player put in vehicle",
        putInVehicleErrorNoVehicle = "You are not in a vehicle",
        removeFromVehicleSuccess = "Player removed from vehicle",
        removeFromVehicleErrorNotInVehicle = "Player is not in a vehicle",
        noSeatsAvailable = "No seats available in the vehicle",

        -- Headbag messages
        headbagApplied = "Headbag applied successfully",
        headbagRemoved = "Headbag removed successfully",
        headbagError = "Could not apply/remove headbag",     
        
        -- TieLegs messages       
        tieLegsApplied = "Leg restraints applied successfully",
        tieLegsRemoved = "Leg restraints removed successfully", 
        tieLegsSuccess = "Leg restraints applied/removed successfully",
        tieLegsError = "Could not apply/remove leg restraints",

        -- Missing item errors
        noItemHandcuffs = "You don't have handcuffs",
        noItemHeadbag = "You don't have a headbag",
        noItemZipties = "You don't have zipties",

        -- Drag messages
        dragStop = "Press X to stop dragging",
        playerNotNearby = "Player is not nearby",

        -- Escort messages
        escortEndUncuffed = "Escort ended - player is no longer handcuffed",
        escortDisconnected = "Escort ended - player disconnected",
    }
}





--  $$$$$$\            $$\ $$\ $$\                           $$\                 
-- $$  __$$\           $$ |$$ |$$ |                          $$ |                
-- $$ /  \__| $$$$$$\  $$ |$$ |$$$$$$$\   $$$$$$\   $$$$$$$\ $$ |  $$\  $$$$$$$\ 
-- $$ |       \____$$\ $$ |$$ |$$  __$$\  \____$$\ $$  _____|$$ | $$  |$$  _____|
-- $$ |       $$$$$$$ |$$ |$$ |$$ |  $$ | $$$$$$$ |$$ /      $$$$$$  / \$$$$$$\  
-- $$ |  $$\ $$  __$$ |$$ |$$ |$$ |  $$ |$$  __$$ |$$ |      $$  _$$<   \____$$\ 
-- \$$$$$$  |\$$$$$$$ |$$ |$$ |$$$$$$$  |\$$$$$$$ |\$$$$$$$\ $$ | \$$\ $$$$$$$  |
--  \______/  \_______|\__|\__|\_______/  \_______| \_______|\__|  \__|\_______/ 

-- If you want to add custom actions, you can do so here.

Config.Callbacks = {
    ---@param sourceId number ID of the player performing the action
    ---@param targetId number ID of the target player
    ---@param isHandcuffed boolean true if handcuffed, false if unhandcuffed
    onHandcuff = function(sourceId, targetId, isHandcuffed)
        -- Function executed when someone is handcuffed/unhandcuffed
    end,

    ---@param inventory table inventory of the target player
    onSearch = function(sourceId, targetId, inventory)
        -- Function executed when someone is searched
    end,
    
    ---@param isEscorted boolean true if started escorting, false if stopped
    onEscort = function(sourceId, targetId, isEscorted)
        -- Function executed when someone is escorted/unescorted
    end,
    
    ---@param isCarried boolean true if started carrying, false if stopped
    onCarry = function(sourceId, targetId, isCarried)
        -- Function executed when someone is carried/uncarried
    end,
    
    ---@param vehicle number vehicle entity
    onPutInVehicle = function(sourceId, targetId, vehicle)
        -- Function executed when someone is put in a vehicle
    end,

    onRemoveFromVehicle = function(sourceId, targetId)
        -- Function executed when someone is removed from a vehicle
    end
}
