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
-- MySQL library used (oxmysql | mysql-async | ghmattimysql)
Config.Mysql = "oxmysql"
-- Notifications library used (codem | okok | qb | esx)
Config.Notifications = "qb"
-- Language for notifications
Config.Language = "en"
-- Debug mode for development and troubleshooting
Config.debugMode = false

-- Debug function helper
function DebugPrint(module, message, data)
    if Config.debugMode then
        -- Safe timestamp (os.date may be nil in some environments)
        local timestamp = "----"
        if type(os) == "table" and type(os.date) == "function" then
            local ok, t = pcall(os.date, "%H:%M:%S")
            if ok and t then
                timestamp = t
            end
        else
            -- Try GetGameTimer as fallback (client-side native), convert to seconds
            if type(GetGameTimer) == "function" then
                local ok2, gt = pcall(GetGameTimer)
                if ok2 and gt then
                    timestamp = tostring(math.floor(gt / 1000))
                end
            end
        end

        local prefix = "^3[BIT-DEBUG-" .. tostring(timestamp) .. "]^0"
        local moduleColor = "^2[" .. tostring(module) .. "]^0"
        local messageStr = tostring(message)

        if data then
            if type(data) == "table" then
                -- json may not be available in all environments; fallback to tostring
                local dataStr = nil
                if type(json) == "table" and type(json.encode) == "function" then
                    local ok3, enc = pcall(json.encode, data)
                    if ok3 and enc then
                        dataStr = enc
                    end
                end
                if not dataStr then
                    dataStr = tostring(data)
                end
                print(prefix .. " " .. moduleColor .. " " .. messageStr .. " -> Data: " .. dataStr)
            else
                print(prefix .. " " .. moduleColor .. " " .. messageStr .. " -> " .. tostring(data))
            end
        else
            print(prefix .. " " .. moduleColor .. " " .. messageStr)
        end
    end
end

-- Command to open the phone
Config.openCommand = "phone"
-- Item required to open the phone
Config.item = {
    itemRequired = false, -- true = item required, false = no item required
    itemName = "phone" -- name of the item required to open the phone
}
Config.Flashlight = {
    enabled = true,
    maxRange = 10,
    brightness = 2.0,
    angle = 45.0
}
-- Business directory configuration (visible en la app Business)
Config.Business = {
    enabled = false,
    listings = {
        {
            id = 1,
            name = "Downtown Motors",
            description = "Concesionario oficial con los mejores vehículos de la ciudad. Financiación disponible y garantía extendida.",
            image = "assets/icons/businesses/downtown_motors.png",
            location = {x = 215.12, y = -791.23, z = 30.82},
            buttonText = "Ver Vehículos",
            action = "garage"
        },
        {
            id = 2,
            name = "Luigi's Pizza",
            description = "La mejor pizza italiana de Los Santos. Entrega a domicilio disponible las 24 horas del día.",
            image = "assets/icons/businesses/luigis_pizza.png",
            location = {x = -1035.71, y = -2735.48, z = 20.17},
            buttonText = "Hacer Pedido",
            action = "order_food"
        },
        {
            id = 3,
            name = "Fashion District",
            description = "Ropa de moda para todas las ocasiones. Las últimas tendencias están aquí con los mejores precios.",
            image = "assets/icons/businesses/fashion_district.png",
            location = {x = 72.25, y = -1399.10, z = 28.37},
            buttonText = "Ver Catálogo",
            action = "clothing_store"
        },
        {
            id = 4,
            name = "TechHub Electronics",
            description = "Todo en tecnología y electrónicos. Smartphones, laptops, gaming y accesorios de última generación.",
            image = "assets/icons/businesses/tech_hub.png",
            location = {x = -656.3, y = -858.5, z = 24.49},
            buttonText = "Ver Productos",
            action = "tech_store"
        },
        {
            id = 5,
            name = "Banco Central",
            description = "Servicios bancarios completos. Cuentas de ahorro, préstamos, inversiones y transferencias internacionales.",
            image = "assets/icons/businesses/bank.png",
            location = {x = 149.46, y = -1040.58, z = 29.37},
            buttonText = "Servicios Bancarios",
            action = "bank"
        }
    }
}

Config.Crypto = {
    enabled = true,
    apiUrl = "https://api.coingecko.com/api/v3/simple/price",
    apiParams = "?ids=bitcoin,ethereum,binancecoin,cardano,solana,dogecoin,polygon,avalanche-2&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true",
    updateInterval = 120000, -- 2 minutos
    supportedCryptos = {
        bitcoin = {symbol = "BTC", name = "Bitcoin", icon = "₿", color = "#F7931A"},
        ethereum = {symbol = "ETH", name = "Ethereum", icon = "Ξ", color = "#627EEA"},
        binancecoin = {symbol = "BNB", name = "Binance Coin", icon = "BNB", color = "#F3BA2F"},
        cardano = {symbol = "ADA", name = "Cardano", icon = "ADA", color = "#0033AD"},
        solana = {symbol = "SOL", name = "Solana", icon = "SOL", color = "#9945FF"},
        dogecoin = {symbol = "DOGE", name = "Dogecoin", icon = "Ð", color = "#C2A633"},
        polygon = {symbol = "MATIC", name = "Polygon", icon = "MATIC", color = "#8247E5"}
    }
}

-- Phone key configuration
Config.PhoneKey = {
    enabled = true, -- true = phone key enabled, false = no phone key
    Command = Config.openCommand, -- command to open the phone
    key = "F1", -- key to open the phone
    description = "Open phone" -- description of the key
}
-- Cooldown configuration
Config.PhoneCooldown = {
    enabled = true, -- true = cooldown enabled, false = no cooldown
    openCooldown = 2000, -- cooldown in milliseconds for opening phone
    closeCooldown = 500, -- cooldown in milliseconds for closing phone
    maxTransitionTime = 10000 -- maximum time allowed for transition before force reset
}
-- Phone provider (screenshot-basic | fmsdk)
Config.PhotoProvider = "screenshot-basic"
-- Discord webhook for logging (leave empty if FMSDK)
Config.DiscordWebhook =
    "https://discord.com/api/webhooks/1362096355631431791/jaiE6Dq4_5zRr5eivlXiixtQmFBL_HUApicbZpXYNHGYeoHx-TpFwr7OZt4JhNIwqSA1"

-- Network and Signal Configuration
Config.Network = {
    enabled = true,
    maxDistance = 2000,
    baseSignalStrength = 0,
    towers = {
        {coords = vector3(-74.4, -818.6, 326.2), range = 1500},
        {coords = vector3(2118.5, 3014.6, 74.9), range = 1200},
        {coords = vector3(-425.7, 1123.6, 325.9), range = 1400},
        {coords = vector3(763.2, -348.3, 175.4), range = 1000},
        {coords = vector3(-1028.4, -2740.2, 20.2), range = 1100},
        {coords = vector3(470.3, -1310.5, 29.2), range = 900},
        {coords = vector3(1207.9, -1396.1, 35.2), range = 800},
        {coords = vector3(-1305.7, -394.2, 36.7), range = 1000},
        {coords = vector3(119.4, -883.4, 31.1), range = 850},
        {coords = vector3(-47.8, -1115.3, 26.4), range = 900},
        {coords = vector3(2663.8, 3266.8, 55.2), range = 1300},
        {coords = vector3(1965.1, 3740.5, 32.3), range = 1100},
        {coords = vector3(1729.5, 6415.9, 35.0), range = 1400},
        {coords = vector3(-322.3, 6077.9, 31.5), range = 1200},
        {coords = vector3(-2072.4, 3170.5, 32.8), range = 1000},
        {coords = vector3(-1119.8, 2698.2, 18.6), range = 1100},
        {coords = vector3(543.4, 2671.2, 42.2), range = 1200},
        {coords = vector3(1391.1, 3605.6, 38.9), range = 1000},
        {coords = vector3(2550.0, 382.0, 108.6), range = 1300},
        {coords = vector3(715.2, 4165.8, 40.7), range = 1100}
    }
}

-- Weather and Time configuration
Config.Weather = {
    provider = "cd_easytime",
    refreshInterval = 60000,
    useRealWorldWeather = false,
    apiKey = "",
    fallbackData = {
        temperature = 22,
        condition = "clear",
        windSpeed = 5,
        windDirection = 45
    }
}
-- Configuración de subida de fotos (optimizada para evitar saturar la red)
Config.PhotoUpload = {
    maxAttempts = 3, -- Número máximo de intentos de subida
    timeout = 15000, -- Timeout en milisegundos (15 segundos - reducido)
    retryDelay = 3000, -- Delay entre reintentos en milisegundos
    imageQuality = 0.6, -- Calidad de imagen reducida (0.1 - 1.0)
    encoding = "jpg", -- Formato de codificación
    maxFileSize = 2048, -- Tamaño máximo en KB (2MB)
    cooldownTime = 5000 -- Tiempo entre fotos en milisegundos (5 segundos)
}
-- FMSDK configuration
Config.FMSDK = {
    enabled = false, -- true = FMSDK enabled, false = no FMSDK
    timeout = 10000 -- timeout for FMSDK requests in milliseconds
}

-- Voice calls configuration
Config.VoiceCalls = {
    enabled = true, -- true = voice calls enabled
    provider = "pma-voice", -- Voice provider (pma-voice | saltychat | mumble-voip)
    usePrivateChannels = true, -- Use radio channels for private calls (recommended)
    callTimeout = 30000, -- Call timeout in milliseconds (30 seconds)
    maxCallDuration = 3600000, -- Max call duration in milliseconds (1 hour)
    recordCalls = true, -- Save call history to database
    allowBlockedNumbers = false, -- Allow calls from blocked numbers
    -- Call audio settings
    audio = {
        defaultVolume = 0.5, -- Default call volume (0.0 - 1.0)
        speakerVolume = 0.8, -- Speaker mode volume (0.0 - 1.0)
        muteDuringCall = false -- Mute proximity voice during calls
    }
}

-- Video calls configuration with WebRTC
Config.VideoCalls = {
    enabled = true, -- true = video calls enabled
    rtcConfig = {
        iceServers = {
            {
                urls = "stun:stun.relay.metered.ca:80"
            },
            {
                urls = "turn:global.relay.metered.ca:80",
                username = "8236c324acc46422b0c2a481",
                credential = "wIgbfMWQ3LJUBuHN"
            },
            {
                urls = "turn:global.relay.metered.ca:80?transport=tcp",
                username = "8236c324acc46422b0c2a481",
                credential = "wIgbfMWQ3LJUBuHN"
            },
            {
                urls = "turn:global.relay.metered.ca:443",
                username = "8236c324acc46422b0c2a481",
                credential = "wIgbfMWQ3LJUBuHN"
            },
            {
                urls = "turns:global.relay.metered.ca:443?transport=tcp",
                username = "8236c324acc46422b0c2a481",
                credential = "wIgbfMWQ3LJUBuHN"
            }
        }
    },
    videoConstraints = {
        width = {min = 320, max = 1280},
        height = {min = 240, max = 720},
        frameRate = {min = 15, max = 30}
    },
    audioConstraints = {
        echoCancellation = true,
        noiseSuppression = true,
        autoGainControl = true
    }
}
-- Garage database table configuration
Config.Garage = {
    enabled = true, -- true = garage enabled, false = no garage
    vehicleTable = "owned_vehicles", -- name of the database table for vehicles
    columns = {
        owner = "owner", -- column for the owner identifier
        plate = "plate", -- column for the vehicle plate
        vehicle = "vehicle", -- column for the vehicle data
        type = "type", -- column for the vehicle type
        job = "job", -- column for the job (if applicable)
        stored = "stored", -- column for the stored status
        parking = "parking", -- column for the parking location
        pound = "pound", -- column for the impounded status
        glovebox = "glovebox", -- column for the glovebox status
        trunk = "trunk" -- column for the trunk status
    },
    useKeys = true, -- true = use vehicle keys, false = no keys
    giveKeysEvent = "vehiclekeys:client:SetOwner", -- event to give vehicle keys
    impoundFee = 500, -- fee for impounding vehicles
    onVehicleSpawn = nil, -- function to call when a vehicle is spawned
    onVehicleStore = nil, -- function to call when a vehicle is stored
    customActions = {}, -- custom actions for the garage
    spawnRadius = 20, -- radius for spawning vehicles
    maxSpawnDistance = 100, -- maximum distance to spawn vehicles
    maxVehiclesOut = 0, -- maximum number of vehicles allowed out at the same time
    allowStoringDamaged = true, -- true = allow storing damaged vehicles, false = no damaged vehicles allowed
    minStoreDistance = 5.0, -- minimum distance to store vehicles
    maxStoreDistance = 100.0 -- maximum distance to store vehicles
}

-- Battery configuration
Config.Battery = {
    enabled = true, -- true = battery system enabled, false = no battery system
    maxBattery = 100, -- maximum battery level
    baseDrainRate = 0.5, -- base battery drain rate per minute without apps
    lowBatteryWarning = 20, -- percentage to trigger low battery warning
    criticalBatteryLevel = 5, -- critical battery level
    autoShutdownLevel = 0, -- level where the phone automatically shuts down
    chargingRate = 10, -- charging rate per minute (if charger implemented)
    appConsumption = {
        -- Apps basics
        ["phone"] = 0.1,
        ["messages"] = 0.2,
        ["mail"] = 0.2,
        ["settings"] = 0.1,
        ["calculator"] = 0.1,
        ["clock"] = 0.1,
        ["notes"] = 0.2,
        ["calendar"] = 0.1,
        -- Apps multimedia
        ["music"] = 0.8,
        ["photos"] = 0.5,
        ["camera"] = 1.2,
        ["youtube"] = 1.5,
        ["instagram"] = 0.9,
        -- Games apps
        ["pacman"] = 1.8,
        ["stack"] = 1.5,
        ["fruitninja"] = 1.7,
        ["pong"] = 1.2,
        ["temple"] = 1.6,
        -- Service apps
        ["maps"] = 1.0,
        ["weather"] = 0.4,
        ["garage"] = 0.3,
        ["business"] = 0.3,
        ["appstore"] = 0.4,
        -- Finance apps
        ["bank"] = 0.3,
        ["crypto"] = 0.6,
        -- Social apps
        ["tuister"] = 0.7,
        ["bitlove"] = 0.8,
        -- Special apps
        ["darkweb"] = 1.0,
        ["news"] = 0.4,
        ["bikerent"] = 0.3,
        ["uber"] = 0.5,
        ["translator"] = 0.3,
        -- Special
        ["flashlight"] = 2.0,
        ["call"] = 1.3
    }
}

-- Bike Rent configuration
Config.BikeRent = {
    enabled = true, -- true = bike rent enabled, false = no bike rent
    -- List of available vehicles
    vehicles = {
        {
            id = 1,
            model = "bmx",
            name = "BMX Thunder",
            price = 15,
            category = "bike",
            description = "Bicicleta básica para desplazarse por la ciudad",
            features = {"Ligera", "Urbana", "Económica"},
            battery = 100,
            rating = 4.2
        },
        {
            id = 2,
            model = "scorcher",
            name = "Scorcher Pro",
            price = 25,
            category = "bike",
            description = "Bicicleta deportiva de alta gama",
            features = {"Deportiva", "Velocidad", "Resistente"},
            battery = 95,
            rating = 4.7
        },
        {
            id = 3,
            model = "tribike3",
            name = "TriBike Elite",
            price = 35,
            category = "bike",
            description = "Bicicleta de triatlón profesional",
            features = {"Profesional", "Aerodinámica", "Carbono"},
            battery = 90,
            rating = 4.9
        },
        {
            id = 4,
            model = "bati",
            name = "Bati 801",
            price = 80,
            category = "motorcycle",
            description = "Motocicleta deportiva de alta velocidad",
            features = {"Potente", "Deportiva", "Velocidad"},
            battery = 100,
            rating = 4.8
        },
        {
            id = 5,
            model = "faggio2",
            name = "Faggio Sport",
            price = 20,
            category = "scooter",
            description = "Scooter urbano cómodo y económico",
            features = {"Eléctrico", "Urbano", "Silencioso"},
            battery = 85,
            rating = 4.3
        },
        {
            id = 6,
            model = "cruiser",
            name = "City Cruiser",
            price = 12,
            category = "bike",
            description = "Bicicleta estilo cruiser para paseos relajados",
            features = {"Cómoda", "Estilo", "Paseo"},
            battery = 100,
            rating = 4.1
        }
    },
    maxRentalTime = 480,
    minRentalTime = 60,
    depositRequired = true,
    depositAmount = 50,
    spawnLocations = {
        vector3(228.15, -365.50, 44.25), -- Legion Square
        vector3(-1034.51, -2733.20, 20.17), -- Airport
        vector3(-1392.74, -584.91, 30.32), -- Beach
        vector3(1729.79, 3311.70, 41.22) -- Sandy Shores
    },
    notifications = {
        rentalSuccess = "Vehículo alquilado exitosamente",
        rentalError = "Error al alquilar el vehículo",
        insufficientFunds = "Fondos insuficientes",
        rentalExpired = "Tu alquiler ha expirado",
        depositReturned = "Depósito devuelto",
        vehicleReturned = "Vehículo devuelto exitosamente"
    },
    -- Penalizaciones
    penaltyForDamage = 0.5, -- porcentaje del depósito por daño (50%)
    penaltyForDestroyed = 1.0 -- penalización si se destruye (100% del depósito)
}

-- Configuración de Linterna
Config.Flashlight = {
    enabled = true,
    maxRange = 15.0, -- alcance máximo de la luz
    brightness = 2.0, -- intensidad de la luz
    angle = 45.0, -- ángulo del cono de luz
    batteryDrainMultiplier = 2.0 -- multiplicador de consumo de batería
}

Config.Uber = {
    enabled = true,
    pricePerKm = 2.5,
    minimumPrice = 8.0,
    maxDistance = 15000.0,
    priceCalculation = {
        baseRate = 3.0,
        distanceRate = 2.5,
        timeRate = 0.5,
        minimumFare = 8.0,
        maximumFare = 500.0,
        currencySymbol = "$"
    },
    -- Multiplicadores de precio por tipo de vehículo
    vehicleMultipliers = {
        uberx = 1.0, -- UberX - económico
        comfort = 1.25, -- Comfort - más cómodo
        xl = 1.5, -- UberXL - vehículos grandes
        black = 2.2 -- Uber Black - premium
    },
    -- Vehículos disponibles por tipo
    vehicles = {
        uberx = {
            "asea",
            "premier",
            "primo",
            "primo2",
            "fugitive",
            "tailgater",
            "washington"
        },
        comfort = {
            "schafter2",
            "cognoscenti",
            "superd",
            "tailgater2",
            "washington"
        },
        xl = {
            "bison",
            "rumpo",
            "minivan",
            "minivan2",
            "journey"
        },
        black = {
            "schafter4",
            "cognoscenti2",
            "xls",
            "turreted_limo",
            "stretch"
        }
    },
    -- Configuración del conductor NPC
    driver = {
        spawnDistance = {min = 200, max = 800}, -- distancia de spawn del conductor
        drivingStyle = 786603, -- estilo de conducción (seguro, respeta semáforos)
        speed = 25.0, -- velocidad máxima
        waitTime = 30000 -- tiempo de espera antes de irse (30 segundos)
    },
    -- Tarifas especiales por hora
    surgeHours = {
        ["06:00-09:00"] = 1.5, -- hora pico mañana
        ["17:00-20:00"] = 1.8, -- hora pico tarde
        ["22:00-06:00"] = 0.8 -- descuento nocturno
    },
    -- Sistema de propinas
    tips = {
        enabled = true,
        suggestions = {5, 10, 15, 20}, -- porcentajes sugeridos
        maxTip = 50.0 -- propina máxima
    }
}

-- News App Configuration
Config.News = {
    enabled = true, -- true = news app enabled
    -- Jobs allowed to create and manage news articles
    allowedJobs = {
        "journalist", -- Periodista
        "reporter", -- Reportero
        "news", -- News agency
        "media", -- Media company
        "government" -- Government officials
    },
    -- Article settings
    articles = {
        maxLength = 5000, -- Maximum article content length
        requireImage = false, -- Require image for articles
        requireSummary = true, -- Require summary for articles
        autoApproval = true, -- Auto-approve articles (false = require admin approval)
        maxTitleLength = 200, -- Maximum title length
        maxSummaryLength = 500 -- Maximum summary length
    },
    -- Categories available for news articles
    categories = {
        "General",
        "Seguridad",
        "Transporte",
        "Entretenimiento",
        "Deportes",
        "Tecnología",
        "Salud",
        "Economía",
        "Política",
        "Eventos"
    },
    -- Featured articles settings
    featured = {
        maxFeatured = 3, -- Maximum number of featured articles
        autoRotation = true, -- Auto-rotate featured articles
        rotationHours = 24 -- Hours between rotation
    },
    -- Notifications settings
    notifications = {
        notifyOnNewArticle = true, -- Notify players when new articles are published
        notifyDistance = 1000, -- Distance for location-based notifications (meters)
        maxNotifications = 5 -- Maximum notifications per player per day
    }
}

-- $$$$$$\  $$\   $$\  $$$$$$\  $$$$$$$\   $$$$$$\  $$$$$$\ $$\   $$\  $$$$$$\        $$$$$$\ $$$$$$$$\  $$$$$$\ $$$$$$$$\ $$$$$$\  $$$$$$\  $$\   $$\
-- $$  __$$\ $$ |  $$ |$$  __$$\ $$  __$$\ $$  __$$\ \_$$  _|$$$\  $$ |$$  __$$\      $$  __$$\\__$$  __|$$  __$$\\__$$  __|\_$$  _|$$  __$$\ $$$\  $$ |
-- $$ /  \__|$$ |  $$ |$$ /  $$ |$$ |  $$ |$$ /  \__|  $$ |  $$$$\ $$ |$$ /  \__|     $$ /  \__|  $$ |   $$ /  $$ |  $$ |     $$ |  $$ /  $$ |$$$$\ $$ |
-- $$ |      $$$$$$$$ |$$$$$$$$ |$$$$$$$  |$$ |$$$$\   $$ |  $$ $$\$$ |$$ |$$$$\      \$$$$$$\    $$ |   $$$$$$$$ |  $$ |     $$ |  $$ |  $$ |$$ $$\$$ |
-- $$ |      $$  __$$ |$$  __$$ |$$  __$$< $$ |\_$$ |  $$ |  $$ \$$$$ |$$ |\_$$ |      \____$$\   $$ |   $$  __$$ |  $$ |     $$ |  $$ |  $$ |$$ \$$$$ |
-- $$ |  $$\ $$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |  $$ |  $$ |\$$$ |$$ |  $$ |     $$\   $$ |  $$ |   $$ |  $$ |  $$ |     $$ |  $$ |  $$ |$$ |\$$$ |
-- \$$$$$$  |$$ |  $$ |$$ |  $$ |$$ |  $$ |\$$$$$$  |$$$$$$\ $$ | \$$ |\$$$$$$  |     \$$$$$$  |  $$ |   $$ |  $$ |  $$ |   $$$$$$\  $$$$$$  |$$ | \$$ |
--  \______/ \__|  \__|\__|  \__|\__|  \__| \______/ \______|\__|  \__| \______/       \______/   \__|   \__|  \__|  \__|   \______| \______/ \__|  \__|

Config.ChargingStations = {
    enabled = true,
    -- Configuración global
    interactionType = "drawtext", -- "drawtext", "target", "interact"
    blipSettings = {
        enabled = true,
        sprite = 354, -- Icono del blip (354 = enchufe)
        color = 2, -- Color del blip (2 = verde)
        scale = 0.8, -- Tamaño del blip
        name = "Estación de Carga"
    },
    -- Configuración de carga
    charging = {
        chargingTime = 60000, -- Tiempo de carga completa en ms (60 segundos)
        chargingRate = 2.0, -- Porcentaje por segundo que carga
        maxDistance = 3.0, -- Distancia máxima para mantener la carga
        interactionDistance = 2.0 -- Distancia para mostrar interacción
    },
    -- Configuración del cable
    cable = {
        enabled = true,
        model = "prop_cs_cardboard_01", -- Modelo del cable (temporal)
        physics = true, -- Activar físicas del cable
        maxLength = 5.0 -- Longitud máxima del cable
    },
    -- Estaciones de carga
    stations = {
        {
            id = 1,
            coords = vector3(228.15, -365.50, 44.25), -- Legion Square
            heading = 270.0,
            label = "Cargador Público - Legion Square",
            prop = "prop_cctv_cont_05",
            free = true,
            cost = 0
        },
        {
            id = 2,
            coords = vector3(-548.25, -204.73, 38.22), -- Maze Bank
            heading = 180.0,
            label = "Cargador Público - Maze Bank",
            prop = "prop_cctv_cont_05",
            free = false,
            cost = 50
        },
        {
            id = 3,
            coords = vector3(1138.21, -468.93, 67.04), -- Mirror Park
            heading = 90.0,
            label = "Cargador Público - Mirror Park",
            prop = "prop_cctv_cont_05",
            free = true,
            cost = 0
        },
        {
            id = 4,
            coords = vector3(-1827.32, -1193.43, 14.31), -- Vespucci Beach
            heading = 0.0,
            label = "Cargador Público - Vespucci Beach",
            prop = "prop_cctv_cont_05",
            free = true,
            cost = 0
        },
        {
            id = 5,
            coords = vector3(372.64, 322.85, 103.57), -- Vinewood
            heading = 270.0,
            label = "Cargador VIP - Vinewood",
            prop = "prop_cctv_cont_05",
            free = false,
            cost = 100
        }
    }
}

function IsPlayerDead()
    if GetEntityHealth(PlayerPedId()) <= 0 then
        return true
    end
    return false
end

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
        exports["okokNotify"]:Alert("Notification", message, time, notitype)
    elseif Config.Notifications == "origen" then
        exports["origen_notify"]:ShowNotification(message)
    elseif Config.Notifications == "ox" then
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

Noti.info = "info"
Noti.check = "check"
Noti.error = "error"
Noti.time = 5000

Lang.noPhoneItem = "You don't have the phone item to open it."

PhoneMessages = {
    en = {
        ["uber.driverFound"] = "Driver found: %s",
        ["uber.driverOnWay"] = "%s is on the way",
        ["uber.tripCancelled"] = "Trip cancelled",
        ["uber.tripCancelledFee"] = "Trip cancelled. Fee: $%s",
        ["uber.tripCompleted"] = "Trip completed. Total paid: $%s",
        ["uber.tripExpired"] = "The trip has expired",
        ["uber.noValidLocation"] = "Could not find a valid location for the driver",
        ["uber.driverArrived"] = "%s has arrived",
        ["uber.driverLeft"] = "The driver has left. Wait time expired.",
        ["uber.tripStarted"] = "Trip started to your destination",
        ["uber.destinationReached"] = "You have reached your destination",
        ["uber.tripCompletionError"] = "Error completing trip",
        ["phone.messageRetained"] = "Message retained - Offline",
        ["phone.messageSent"] = "Message sent",
        ["phone.dataSynced"] = "Data synced",
        ["phone.errorSendingMessage"] = "Error sending message",
        ["phone.phoneDisabled"] = "Phone disabled",
        ["phone.phoneInUse"] = "Phone is busy, please wait...",
        ["phone.insufficientMoney"] = "You don't have enough money to charge ($%s)",
        ["phone.chargingStarted"] = "Starting phone charge...",
        ["phone.chargingStopped"] = "Charge stopped",
        ["messages.newMessage"] = "%s: %s",
        ["news.newsCreated"] = "News created successfully",
        ["news.newsCreationError"] = "Error creating news",
        ["news.newsDeleted"] = "News deleted successfully",
        ["news.newsDeletionError"] = "Error deleting news",
        ["news.newArticleAvailable"] = "📰 New article available: %s",
        ["charging.notEnoughMoney"] = "You don't have enough money to charge ($%s)",
        ["charging.chargingStarted"] = "Starting phone charge...",
        ["charging.chargingStopped"] = "Phone charge stopped: %s",
        ["battery.low"] = "Low battery: %s%%",
        ["battery.critical"] = "Critical battery: %s%%! Find a charger!",
        ["battery.shutdown"] = "Battery depleted. Phone shutting down...",
        ["news.newsCreatedError"] = "Error creating news: %s",
        ["news.newsDeletedError"] = "Error deleting news: %s",
        ["news.newNewsAvailable"] = "📰 New news available: %s",
        ["general.notification"] = "%s",
        ["bitlove.photoProcessing"] = "Processing photo...",
        ["bitlove.photoSaved"] = "Photo saved successfully",
        ["bitlove.photoError"] = "Error taking photo",
        ["bitlove.noProvider"] = "Screenshot provider not available",
        ["phone.recents"] = "Recents",
        ["phone.favorites"] = "Favorites",
        ["phone.voicemail"] = "Voicemail",
        ["phone.contacts"] = "Contacts",
        ["phone.keypad"] = "Keypad",
        ["camera.dragToMove"] = "Drag to move the camera",
        ["photos.create_album"] = "Create album",
        ["photos.album_name"] = "Album name",
        ["notes.searchPlaceholder"] = "Note",
        ["calendar.months.january"] = "January",
        ["calendar.months.february"] = "February",
        ["calendar.months.march"] = "March",
        ["calendar.months.april"] = "April",
        ["calendar.months.may"] = "May",
        ["calendar.months.june"] = "June",
        ["calendar.months.july"] = "July",
        ["calendar.months.august"] = "August",
        ["calendar.months.september"] = "September",
        ["calendar.months.october"] = "October",
        ["calendar.months.november"] = "November",
        ["calendar.months.december"] = "December",
        ["calendar.days.sunday"] = "Sunday",
        ["calendar.days.monday"] = "Monday",
        ["calendar.days.tuesday"] = "Tuesday",
        ["calendar.days.wednesday"] = "Wednesday",
        ["calendar.days.thursday"] = "Thursday",
        ["calendar.days.friday"] = "Friday",
        ["calendar.days.saturday"] = "Saturday",
        ["crypto.loading"] = "Loading",
        ["app.phone"] = "Phone",
        ["app.messages"] = "Messages",
        ["app.music"] = "Music",
        ["app.photos"] = "Photos",
        ["app.camera"] = "Camera",
        ["app.clock"] = "Clock",
        ["app.calculator"] = "Calculator",
        ["app.notes"] = "Notes",
        ["app.maps"] = "Map",
        ["app.calendar"] = "Calendar",
        ["app.settings"] = "Settings",
        ["app.appstore"] = "App shop",
        ["app.weather"] = "Weather",
        ["app.instagram"] = "Instashot",
        ["app.youtube"] = "Youtube",
        ["app.garage"] = "Garage",
        ["app.translator"] = "Translator",
        ["app.pong"] = "Pong",
        ["app.fruitninja"] = "FruitKnife",
        ["app.pacman"] = "Pacman",
        ["app.stack"] = "Stack",
        ["app.tuister"] = "Tuister",
        ["app.bank"] = "Bank",
        ["app.business"] = "Business",
        ["app.darkweb"] = "Darkweb",
        ["app.news"] = "News",
        ["app.bikerent"] = "Rental",
        ["app.huver"] = "Huver",
        ["app.crypto"] = "Crypto",
        ["app.bitlove"] = "BitLove",
        ["app.call"] = "Calls"
    },
    es = {
        ["uber.driverFound"] = "Conductor encontrado: %s",
        ["uber.driverOnWay"] = "%s está en camino",
        ["uber.tripCancelled"] = "Viaje cancelado",
        ["uber.tripCancelledFee"] = "Viaje cancelado. Tarifa: $%s",
        ["uber.tripCompleted"] = "Viaje completado. Total pagado: $%s",
        ["uber.tripExpired"] = "El viaje ha expirado",
        ["uber.noValidLocation"] = "No se pudo encontrar una ubicación válida para el conductor",
        ["uber.driverArrived"] = "%s ha llegado",
        ["uber.driverLeft"] = "El conductor se ha ido. Tiempo de espera agotado.",
        ["uber.tripStarted"] = "Viaje iniciado hacia tu destino",
        ["uber.destinationReached"] = "Has llegado a tu destino",
        ["uber.tripCompletionError"] = "Error al completar el viaje",
        ["phone.messageRetained"] = "Mensaje retenido - Sin conexión",
        ["phone.messageSent"] = "Mensaje enviado",
        ["phone.dataSynced"] = "Datos sincronizados",
        ["phone.errorSendingMessage"] = "Error enviando mensaje",
        ["phone.phoneDisabled"] = "Teléfono desactivado",
        ["phone.phoneInUse"] = "El teléfono está ocupado, espera un momento...",
        ["phone.insufficientMoney"] = "No tienes suficiente dinero para cargar ($%s)",
        ["phone.chargingStarted"] = "Iniciando carga del teléfono...",
        ["phone.chargingStopped"] = "Carga detenida",
        ["messages.newMessage"] = "%s: %s",
        ["news.newsCreated"] = "Noticia creada exitosamente",
        ["news.newsCreationError"] = "Error al crear noticia",
        ["news.newsDeleted"] = "Noticia eliminada exitosamente",
        ["news.newsDeletionError"] = "Error al eliminar noticia",
        ["news.newArticleAvailable"] = "📰 Nueva noticia disponible: %s",
        ["charging.notEnoughMoney"] = "No tienes suficiente dinero para cargar ($%s)",
        ["charging.chargingStarted"] = "Iniciando carga del teléfono...",
        ["charging.chargingStopped"] = "Carga del teléfono detenida: %s",
        ["battery.low"] = "Batería baja: %s%%",
        ["battery.critical"] = "¡Batería crítica: %s%%! ¡Busca un cargador!",
        ["battery.shutdown"] = "Batería agotada. Apagando teléfono...",
        ["news.newsCreatedError"] = "Error al crear noticia: %s",
        ["news.newsDeletedError"] = "Error al eliminar noticia: %s",
        ["news.newNewsAvailable"] = "📰 Nueva noticia disponible: %s",
        ["general.notification"] = "%s",
        ["bitlove.photoProcessing"] = "Procesando foto...",
        ["bitlove.photoSaved"] = "Foto guardada correctamente",
        ["bitlove.photoError"] = "Error al tomar la foto",
        ["bitlove.noProvider"] = "Proveedor de capturas no disponible",
        ["phone.recents"] = "Recientes",
        ["phone.favorites"] = "Favoritos",
        ["phone.voicemail"] = "Buzón",
        ["phone.contacts"] = "Contactos",
        ["phone.keypad"] = "Teclado",
        ["camera.dragToMove"] = "Arrastra para mover la cámara",
        ["photos.create_album"] = "Crear album",
        ["photos.album_name"] = "Nombre del album",
        ["notes.searchPlaceholder"] = "Nota",
        ["calendar.months.january"] = "Enero",
        ["calendar.months.february"] = "Febrero",
        ["calendar.months.march"] = "Marzo",
        ["calendar.months.april"] = "Abril",
        ["calendar.months.may"] = "Mayo",
        ["calendar.months.june"] = "Junio",
        ["calendar.months.july"] = "Julio",
        ["calendar.months.august"] = "Agosto",
        ["calendar.months.september"] = "Septiembre",
        ["calendar.months.october"] = "Octubre",
        ["calendar.months.november"] = "Noviembre",
        ["calendar.months.december"] = "Diciembre",
        ["calendar.days.sunday"] = "Domingo",
        ["calendar.days.monday"] = "Lunes",
        ["calendar.days.tuesday"] = "Martes",
        ["calendar.days.wednesday"] = "Miercoles",
        ["calendar.days.thursday"] = "Jueves",
        ["calendar.days.friday"] = "Viernes",
        ["calendar.days.saturday"] = "Sábado",
        ["crypto.loading"] = "Cargando",
        ["app.phone"] = "Teléfono",
        ["app.messages"] = "Mensajes",
        ["app.music"] = "Música",
        ["app.photos"] = "Fotos",
        ["app.camera"] = "Cámara",
        ["app.clock"] = "Reloj",
        ["app.calculator"] = "Calculadora",
        ["app.notes"] = "Notas",
        ["app.maps"] = "Mapa",
        ["app.calendar"] = "Calendario",
        ["app.settings"] = "Ajustes",
        ["app.appstore"] = "App shop",
        ["app.weather"] = "Tiempo",
        ["app.instagram"] = "Instashot",
        ["app.youtube"] = "Youtube",
        ["app.garage"] = "Garaje",
        ["app.translator"] = "Traductor",
        ["app.pong"] = "Pong",
        ["app.fruitninja"] = "FruitKnife",
        ["app.pacman"] = "Pacman",
        ["app.stack"] = "Stack",
        ["app.tuister"] = "Tuister",
        ["app.bank"] = "Bank",
        ["app.business"] = "Negocios",
        ["app.darkweb"] = "Darkweb",
        ["app.news"] = "Noticias",
        ["app.bikerent"] = "Alquiler",
        ["app.huver"] = "Huver",
        ["app.crypto"] = "Crypto",
        ["app.bitlove"] = "BitLove",
        ["app.call"] = "Llamadas"
    }
}

-- Configuración del DarkWeb
Config.DarkWeb = {
    enabled = true,
    bitcoin = {
        enabled = true,
        initialBalance = {min = 1.0, max = 5.0}, -- Rango de Bitcoin inicial para nuevos usuarios
        transactionFee = 0.001, -- Fee por transacción (en Bitcoin)
        minTransfer = 0.001, -- Transferencia mínima
        maxTransfer = 100.0 -- Transferencia máxima
    },
    -- marketplace removed
    rooms = {
        enabled = true,
        maxRoomsPerUser = 5, -- Máximo de salas que puede crear un usuario
        maxMembersPerRoom = 50, -- Máximo de miembros por sala
        moderationEnabled = true -- Moderación automática de mensajes
    },
    security = {
        banDuration = 86400, -- Duración del ban en segundos (24 horas)
        maxReportsBeforeBan = 5, -- Reportes necesarios para ban automático
        antiSpam = {
            enabled = true,
            maxMessagesPerMinute = 10,
            maxSameMessageRepeats = 3
        }
    }
}

-- Weather and Time functions
function GetWeatherData()
    local weatherData = {
        temperature = Config.Weather.fallbackData.temperature,
        condition = Config.Weather.fallbackData.condition,
        conditionFriendlyName = "Despejado",
        windSpeed = Config.Weather.fallbackData.windSpeed,
        windDirection = Config.Weather.fallbackData.windDirection,
        inGameTime = "12:00",
        inGameDate = "Sábado, 16 de Septiembre"
    }

    if Config.Weather.provider == "cd_easytime" then
        if GetResourceState("cd_easytime") == "started" then
            local success, time =
                pcall(
                function()
                    return exports["cd_easytime"]:GetTime()
                end
            )
            if success and time then
                weatherData.inGameTime = string.format("%02d:%02d", time.hour or 12, time.minute or 0)
                weatherData.inGameDate = time.date or weatherData.inGameDate
            end

            local weatherSuccess, weather =
                pcall(
                function()
                    return exports["cd_easytime"]:GetWeather()
                end
            )
            if weatherSuccess and weather then
                weatherData.condition = weather.type or weatherData.condition
                weatherData.temperature = weather.temperature or weatherData.temperature
                weatherData.windSpeed = weather.windSpeed or weatherData.windSpeed
                weatherData.windDirection = weather.windDirection or weatherData.windDirection
            end
        end
    end

    return weatherData
end

function GetPlayerLocationData(playerId)
    local playerPed = GetPlayerPed(playerId or -1)
    local coords = GetEntityCoords(playerPed)
    local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local streetName = GetStreetNameFromHashKey(streetHash)
    local crossingName = crossingHash ~= 0 and GetStreetNameFromHashKey(crossingHash) or ""
    local zoneName = GetLabelText(GetNameOfZone(coords.x, coords.y, coords.z))
    local heading = GetEntityHeading(playerPed)

    local fullStreet = streetName
    if crossingName and crossingName ~= "" then
        fullStreet = streetName .. " / " .. crossingName
    end

    return {
        street = fullStreet ~= "" and fullStreet or "Ubicación desconocida",
        zone = zoneName ~= "ZONE_UNK" and zoneName or "Los Santos",
        heading = heading,
        coords = coords
    }
end
