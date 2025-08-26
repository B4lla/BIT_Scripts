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
Config.Framework = "esx"
-- Available spawn locations with individual camera preview settings
Config.Locations = {
    {
        id = 0,
        name = "Last location",
        description = "Last location seen",
        icon = "fa-person",
        h = 0.0,
        camera = { heightOffset = 60.0, descentTime = 2500, fov = 50.0 },
        scriptedCam = { heightOffsetStart = 100.0, heightOffsetEnd = 3.4, descentTime = 1800, fadeIn = 500, fadeOut = 500, walkDistance = 5.0 }
    },
    {
        id = 1,
        name = "Airport",
        description = "International Terminal",
        x = -1035.82,
        y = -2732.12,
        z = 13.74,
        h = 326.0,
        icon = "fa-plane",
        camera = { heightOffset = 60.0, descentTime = 2500, fov = 50.0 },
        scriptedCam = { heightOffsetStart = 100.0, heightOffsetEnd = 3.4, descentTime = 1800, fadeIn = 500, fadeOut = 500, walkDistance = 5.0 }
    },
    {
        id = 2,
        name = "Police Station",
        description = "Police station",
        x = 423.40,
        y = -978.68,
        z = 30.69,
        h = 90.0,
        icon = "fa-city",
        camera = { heightOffset = 55.0, descentTime = 3000, fov = 60.0 },
        scriptedCam = { heightOffsetStart = 100.0, heightOffsetEnd = 3.4, descentTime = 1800, fadeIn = 500, fadeOut = 500, walkDistance = 5.0 }
    },
    {
        id = 3,
        name = "Shandy shores",
        description = "Shandy Shores town",
        x = 1841.32,
        y = 3668.67,
        z = 33.67,
        h = 215.0,
        icon = "fa-umbrella-beach",
        camera = { heightOffset = 65.0, descentTime = 300, fov = 55.0 },
        scriptedCam = { heightOffsetStart = 100.0, heightOffsetEnd = 3.4, descentTime = 1800, fadeIn = 500, fadeOut = 500, walkDistance = 5.0 }
    },
    {
        id = 4,
        name = "Paleto Bay",
        description = "Paleto bay town",
        x = -437.23,
        y = 6022.31,
        z = 31.48,
        h = 180.0,
        icon = "fa-mountain",
        camera = { heightOffset = 80.0, descentTime = 3500, fov = 45.0 },
        scriptedCam = { heightOffsetStart = 100.0, heightOffsetEnd = 3.4, descentTime = 1800, fadeIn = 500, fadeOut = 500, walkDistance = 5.0 }
    },
}





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

-- Translation strings for UI
Lang.SpawnSelector = {
    title = "Spawn Selector",
    mapHidden = "Map Hidden",
    selectLocationMsg = "Select a location to continue",
    confirmButton = "Confirm",
    selectButton = "Select",
    toggleMapTooltip = "Show/Hide map",
    holdTooltip = "Hold to confirm",
    spawnConfirmed = "Spawn confirmed at:",
    lastLocation = "Last Location",
    lastLocationDesc = "Continue where you left off"
}
