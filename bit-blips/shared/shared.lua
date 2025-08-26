Config, Noti, Lang = {}, {}, {}

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
-- oxmysql, mysql-async or ghmattisql
Config.Mysql = "oxmysql" 
-- Command to open the menu in-game
Config.Command = "personalblips" 
-- Font configuration for blip text (0-5)
Config.BlipTextFont = 4
-- Key to open the menu | Set to false to disable | Key codes: https://docs.fivem.net/docs/game-references/input-mapper-parameter-ids/
Config.MenuKey = {
    enabled = true,                             -- Enable/disable key binding
    key = "F4",                                 -- Key to open menu (F6, F7, etc.)
    description = "Open BIT Personal Blips"     -- Description for key mapping
}
-- Notification system to use (okok | origen | ox | wasabi | codem | esx | qb)
Config.Notifications = "qb"

-- Blur strength for the UI background blur
Config.BlurStrength = 7




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
        -- lib.notify({title = 'Notification', description = message, type = notitype})

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








-- $$\                                                                            
-- $$ |                                                                           
-- $$ |      $$$$$$\  $$$$$$$\   $$$$$$\  $$\   $$\  $$$$$$\   $$$$$$\   $$$$$$\  
-- $$ |      \____$$\ $$  __$$\ $$  __$$\ $$ |  $$ | \____$$\ $$  __$$\ $$  __$$\ 
-- $$ |      $$$$$$$ |$$ |  $$ |$$ /  $$ |$$ |  $$ | $$$$$$$ |$$ /  $$ |$$$$$$$$ |
-- $$ |     $$  __$$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$  __$$ |$$ |  $$ |$$   ____|
-- $$$$$$$$\\$$$$$$$ |$$ |  $$ |\$$$$$$$ |\$$$$$$  |\$$$$$$$ |\$$$$$$$ |\$$$$$$$\ 
-- \________|\_______|\__|  \__| \____$$ | \______/  \_______| \____$$ | \_______|
--                              $$\   $$ |                    $$\   $$ |          
--                              \$$$$$$  |                    \$$$$$$  |          
--                               \______/                      \______/           


Lang.BlipCreated = "Blip created successfully"
Lang.BlipDeleted = "Blip deleted successfully"
Lang.BlipUpdated = "Blip updated successfully"

-- UI Texts
Lang.UI = {}
Lang.UI.DeleteConfirm = "Delete"
Lang.UI.CloseInterface = "Close Interface"
Lang.UI.MyBlips = "My Blips"
Lang.UI.Search = "Search..."
Lang.UI.NoBlips = "No blips created yet"
Lang.UI.CreateFirstBlip = "Create my first blip"
Lang.UI.HideBlip = "Hide Blip"
Lang.UI.ShowBlip = "Show Blip"
Lang.UI.EditBlip = "Edit Blip"
Lang.UI.DeleteBlip = "Delete Blip"
Lang.UI.EditBlipTitle = "Edit Blip"
Lang.UI.NewBlipTitle = "New Blip"
Lang.UI.MainTitle = "BIT Blips"

-- Form labels
Lang.UI.NameLabel = "Name"
Lang.UI.LocationLabel = "Location"
Lang.UI.IconLabel = "Icon"
Lang.UI.ColorLabel = "Color"
Lang.UI.Required = "Required"
Lang.UI.IconNumber = "Icon #{number}"
Lang.UI.TotalIcons = "{count} icons shown"
Lang.UI.TotalColors = "{count} colors available"

-- Status messages
Lang.UI.UpdatingBlip = "Updating blip..."
Lang.UI.CreatingBlip = "Creating blip..."
Lang.UI.DeletingBlip = "Deleting blip..."
Lang.UI.WaitingForResponse = "Waiting for response..."

-- Map modal
Lang.UI.DeleteBlipTitle = "Delete Blip"
Lang.UI.DeleteBlipMessage = "Are you sure you want to delete this blip? This action cannot be undone."
Lang.UI.SelectLocationTitle = "Select Location"
Lang.UI.CurrentPosition = "Current position"
Lang.UI.CurrentPositionTooltip = "Use your current position"
Lang.UI.SelectOnMap = "Select on map"
Lang.UI.SelectOnMapTooltip = "Choose location on the map"
Lang.UI.BlipNamePlaceholder = "Blip name"
Lang.UI.SearchIconPlaceholder = "Search icon by number..."
Lang.UI.IconsShown = "icons shown"
Lang.UI.Loading = "Loading..."
Lang.UI.ColorsAvailable = "colors available"
Lang.UI.XCoord = "X"
Lang.UI.YCoord = "Y"
Lang.UI.ZCoord = "Z"

-- Button texts  
Lang.UI.Cancel = "Cancel"
Lang.UI.Confirm = "Confirm"
Lang.UI.Save = "Save"
Lang.UI.Create = "Create"

-- Error messages
Lang.Errors = {}
Lang.Errors.InvalidInput = "Please fill in all required fields"
Lang.Errors.ServerError = "Server error, please try again"
Lang.Errors.PermissionDenied = "You don't have permission to do this"
Lang.Errors.BlipNotFound = "Blip not found"
Lang.Errors.TooManyBlips = "You have reached the maximum number of blips"
Lang.Errors.InvalidCoordinates = "Invalid coordinates"
Lang.Errors.InvalidIcon = "Invalid icon number"
Lang.Errors.InvalidColor = "Invalid color"

-- Colors
Lang.Colors = {}
Lang.Colors.White = "White"
Lang.Colors.Red = "Red"
Lang.Colors.Green = "Green"
Lang.Colors.Blue = "Blue"
Lang.Colors.WhiteAlt = "White Alt"
Lang.Colors.Yellow = "Yellow"
Lang.Colors.DarkRed = "Dark Red"
Lang.Colors.Purple = "Purple"
Lang.Colors.Pink = "Pink"
Lang.Colors.Salmon = "Salmon"
Lang.Colors.Brown = "Brown"
Lang.Colors.MintGreen = "Mint Green"
Lang.Colors.Teal = "Teal"
Lang.Colors.Lavender = "Lavender"
Lang.Colors.Mauve = "Mauve"
Lang.Colors.Turquoise = "Turquoise"
Lang.Colors.Beige = "Beige"
Lang.Colors.Orange = "Orange"
Lang.Colors.LightBlue = "Light Blue"
Lang.Colors.Rose = "Rose"
Lang.Colors.Olive = "Olive"
Lang.Colors.Terracotta = "Terracotta"
Lang.Colors.Silver = "Silver"
Lang.Colors.Coral = "Coral"
Lang.Colors.Lime = "Lime"
Lang.Colors.Emerald = "Emerald"
Lang.Colors.SkyBlue = "Sky Blue"
Lang.Colors.Violet = "Violet"
Lang.Colors.Gold = "Gold"
Lang.Colors.NavyBlue = "Navy Blue"
Lang.Colors.Aqua = "Aqua"
Lang.Colors.Tan = "Tan"
Lang.Colors.IceBlue = "Ice Blue"
Lang.Colors.Cream = "Cream"
Lang.Colors.Blush = "Blush"
Lang.Colors.LightRed = "Light Red"
Lang.Colors.PaleYellow = "Pale Yellow"
Lang.Colors.PureWhite = "Pure White"
Lang.Colors.RoyalBlue = "Royal Blue"
Lang.Colors.MediumGray = "Medium Gray"
Lang.Colors.DarkGray = "Dark Gray"
Lang.Colors.LightPink = "Light Pink"
Lang.Colors.Periwinkle = "Periwinkle"
Lang.Colors.PastelGreen = "Pastel Green"
Lang.Colors.Peach = "Peach"
Lang.Colors.OffWhite = "Off White"
Lang.Colors.BrightYellow = "Bright Yellow"
Lang.Colors.Amber = "Amber"
Lang.Colors.HotPink = "Hot Pink"
Lang.Colors.BrightRed = "Bright Red"
Lang.Colors.Lilac = "Lilac"
Lang.Colors.LightOrange = "Light Orange"
Lang.Colors.ForestGreen = "Forest Green"
Lang.Colors.BabyBlue = "Baby Blue"
Lang.Colors.SteelBlue = "Steel Blue"
Lang.Colors.LightGray = "Light Gray"
Lang.Colors.Bronze = "Bronze"
Lang.Colors.Cerulean = "Cerulean"
Lang.Colors.Indigo = "Indigo"
Lang.Colors.Crimson = "Crimson"
Lang.Colors.Mustard = "Mustard"
Lang.Colors.Magenta = "Magenta"
Lang.Colors.Platinum = "Platinum"
Lang.Colors.Cobalt = "Cobalt"
Lang.Colors.BurntOrange = "Burnt Orange"
Lang.Colors.DustyPurple = "Dusty Purple"
Lang.Colors.Honey = "Honey"
Lang.Colors.Azure = "Azure"
Lang.Colors.PowderBlue = "Powder Blue"
Lang.Colors.MediumGreen = "Medium Green"
Lang.Colors.Saffron = "Saffron"
Lang.Colors.Goldenrod = "Goldenrod"
Lang.Colors.Charcoal = "Charcoal"
Lang.Colors.AmberYellow = "Amber Yellow"
Lang.Colors.CarolinaBlue = "Carolina Blue"
Lang.Colors.Scarlet = "Scarlet"
Lang.Colors.Maroon = "Maroon"
Lang.Colors.DodgerBlue = "Dodger Blue"
Lang.Colors.SlateBlue = "Slate Blue"
Lang.Colors.Ruby = "Ruby"
Lang.Colors.Cornflower = "Cornflower"
Lang.Colors.AmberOrange = "Amber Orange"
Lang.Colors.Sage = "Sage"
Lang.Colors.Orchid = "Orchid"
Lang.Colors.SteelBlueAlt = "Steel Blue Alt"
Lang.Colors.CarbonGray = "Carbon Gray"
