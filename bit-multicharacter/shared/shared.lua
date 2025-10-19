Config = {}

-- $$$$$$\   $$$$$$\  $$\   $$\ $$$$$$$$\ $$$$$$\  $$$$$$\  $$\   $$\ $$$$$$$\   $$$$$$\ $$$$$$$$\ $$$$$$\  $$$$$$\  $$\   $$\ 
-- $$  __$$\ $$  __$$\ $$$\  $$ |$$  _____|\_$$  _|$$  __$$\ $$ |  $$ |$$  __$$\ $$  __$$\\__$$  __|\_$$  _|$$  __$$\ $$$\  $$ |
-- $$ /  \__|$$ /  $$ |$$$$\ $$ |$$ |        $$ |  $$ /  \__|$$ |  $$ |$$ |  $$ |$$ /  $$ |  $$ |     $$ |  $$ /  $$ |$$$$\ $$ |
-- $$ |      $$ |  $$ |$$ $$\$$ |$$$$$\      $$ |  $$ |$$$$\ $$ |  $$ |$$$$$$$  |$$$$$$$$ |  $$ |     $$ |  $$ |  $$ |$$ $$\$$ |
-- $$ |      $$ |  $$ |$$ \$$$$ |$$  __|     $$ |  $$ |\_$$ |$$ |  $$ |$$  __$$< $$  __$$ |  $$ |     $$ |  $$ |  $$ |$$ \$$$$ |
-- $$ |  $$\ $$ |  $$ |$$ |\$$$ |$$ |        $$ |  $$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |  $$ |     $$ |  $$ |  $$ |$$ |\$$$ |
-- \$$$$$$  | $$$$$$  |$$ | \$$ |$$ |      $$$$$$\ \$$$$$$  |\$$$$$$  |$$ |  $$ |$$ |  $$ |  $$ |   $$$$$$\  $$$$$$  |$$ | \$$ |
-- \______/  \______/ \__|  \__|\__|      \______| \______/  \______/ \__|  \__|\__|  \__|  \__|   \______| \______/ \__|  \__|


-- Use "esx", "qb" or "qbox"
Config.Framework = "esx"
-- oxmysql, mysql-async or ghmattisql
Config.Mysql = "oxmysql"
-- Options: "default", "illenium"
Config.AppearanceSystem = "default" 
-- Character Configuration
Config.DefaultNumberOfCharacters = 4 -- Define max amount of characters here 1-5 (maximum 5)
Config.PlayersNumberOfCharacters = { -- Define max amount of characters for certain players
    -- ["license:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"] = 1,
}
-- General Configuration
Config.EnableCameraAnimation = true -- Enable smooth camera transitions
Config.SkipSelection = false -- Skip multicharacter screen
Config.EnableSpawnSelector = true -- Enable spawn selector after character creation/selection
Config.ClearPedCache = true -- Clear ped cache when switching characters to prevent loading issues
Config.HiddenCoords = vector4(-812.23, 182.54, 76.74, 156.5) -- Hides player while in selection
Config.DefaultSpawn = vector3(-1035.71, -2731.87, 12.86) -- Default spawn coords if no spawn is selected
Config.DefaultCameraStart = vector4(-815.0, 180.0, 77.0, 174.5) -- Starting camera position for transitions
Config.Default = {
    ["m"] = {
        sex = 0,
        tshirt_1 = 1, tshirt_2 = 0,
        torso_1 = 1, torso_2 = 0,
        decals_1 = 0, decals_2 = 0,
        arms = 1,
        pants_1 = 1, pants_2 = 0,
        shoes_1 = 1, shoes_2 = 0,
        mask_1 = 0, mask_2 = 0,
        bproof_1 = 0, bproof_2 = 0,
        chain_1 = 0, chain_2 = 0,
        helmet_1 = -1, helmet_2 = 0,
        glasses_1 = 0, glasses_2 = 0,
        ears_1 = -1, ears_2 = 0,
        bags_1 = 0, bags_2 = 0,
        face = 0,
        skin = 0
    },
    ["f"] = {
        sex = 1,
        tshirt_1 = 1, tshirt_2 = 0,
        torso_1 = 1, torso_2 = 0,
        decals_1 = 0, decals_2 = 0,
        arms = 1,
        pants_1 = 1, pants_2 = 0,
        shoes_1 = 1, shoes_2 = 0,
        mask_1 = 0, mask_2 = 0,
        bproof_1 = 0, bproof_2 = 0,
        chain_1 = 0, chain_2 = 0,
        helmet_1 = -1, helmet_2 = 0,
        glasses_1 = 0, glasses_2 = 0,
        ears_1 = -1, ears_2 = 0,
        bags_1 = 0, bags_2 = 0,
        face = 0,
        skin = 0
    }
}

--  /$$        /$$$$$$  /$$   /$$  /$$$$$$  /$$   /$$  /$$$$$$   /$$$$$$  /$$$$$$$$
-- | $$       /$$__  $$| $$$ | $$ /$$__  $$| $$  | $$ /$$__  $$ /$$__  $$| $$_____/
-- | $$      | $$  \ $$| $$$$| $$| $$  \__/| $$  | $$| $$  \ $$| $$  \__/| $$      
-- | $$      | $$$$$$$$| $$ $$ $$| $$ /$$$$| $$  | $$| $$$$$$$$| $$ /$$$$| $$$$$   
-- | $$      | $$__  $$| $$  $$$$| $$|_  $$| $$  | $$| $$__  $$| $$|_  $$| $$__/   
-- | $$      | $$  | $$| $$\  $$$| $$  \ $$| $$  | $$| $$  | $$| $$  \ $$| $$      
-- | $$$$$$$$| $$  | $$| $$ \  $$|  $$$$$$/|  $$$$$$/| $$  | $$|  $$$$$$/| $$$$$$$$
-- |________/|__/  |__/|__/  \__/ \______/  \______/ |__/  |__/ \______/ |________/


Config.Locales = {
    ['en'] = {
        -- UI Elements
        ['settings'] = 'Settings',
        ['theme_colors'] = 'Theme Colors',
        ['streamer_mode'] = 'Streamer Mode',
        ['enabled'] = 'Enabled',
        ['disabled'] = 'Disabled',
        ['sensitive_info_description'] = 'Hides sensitive information like phone, full name, money and profession.',
        ['dark_filter'] = 'Dark Filter',
        ['particle_effects'] = 'Particle Effects',
        ['particle_effects_description'] = 'Shows visual particle effects in the background.',
        ['game_time'] = 'Game Time',
        ['game_weather'] = 'Game Weather',
        ['game_scenario'] = 'Game Scenario',
        
        -- Character Management
        ['delete'] = 'DELETE',
        ['play'] = 'PLAY',
        ['new_character'] = 'New Character',
        ['create_character'] = 'CREATE CHARACTER',
        ['cancel'] = 'Cancel',
        ['active_character'] = 'Active Character',
        ['basic_information'] = 'Basic Information',
        ['main_information'] = 'Main Information',
        ['finances'] = 'Finances',
        
        -- Character Info
        ['name'] = 'Name',
        ['lastname'] = 'Lastname',
        ['gender'] = 'Gender',
        ['age'] = 'Age',
        ['years'] = 'years',
        ['height'] = 'Height',
        ['phone'] = 'Phone',
        ['profession'] = 'Profession',
        ['unemployed'] = 'Unemployed',
        ['male'] = 'Male',
        ['female'] = 'Female',
        ['birth_date'] = 'Birth Date',
        ['nationality'] = 'Nationality',
        
        -- Financial
        ['total_balance'] = 'Total Balance',
        ['bank'] = 'Bank',
        ['cash'] = 'Cash',
        
        -- Placeholders
        ['enter_name'] = 'Enter name',
        ['enter_lastname'] = 'Enter lastname',
        ['select_origin'] = 'Select origin',
        ['select_weather'] = 'Select weather',
        ['select_scenario'] = 'Select scenario',
        
        -- Delete Modal
        ['confirm_deletion'] = 'Confirm Deletion',
        ['delete_character_message'] = 'Are you sure you want to delete this character? This action cannot be undone.',
        ['delete_button'] = 'Delete',
        ['cancel_button'] = 'Cancel',
        
        -- Weather Types
        ['weather_clear'] = 'Clear',
        ['weather_extrasunny'] = 'Extra Sunny',
        ['weather_clouds'] = 'Cloudy',
        ['weather_overcast'] = 'Overcast',
        ['weather_rain'] = 'Rainy',
        ['weather_thunder'] = 'Thunderstorm',
        ['weather_smog'] = 'Smoggy',
        ['weather_foggy'] = 'Foggy',
        ['weather_xmas'] = 'Christmas',
        ['weather_snowlight'] = 'Light Snow'
    },
    ['es'] = {
        -- UI Elements
        ['settings'] = 'Configuración',
        ['theme_colors'] = 'Colores del Tema',
        ['streamer_mode'] = 'Modo Streamer',
        ['enabled'] = 'Activado',
        ['disabled'] = 'Desactivado',
        ['sensitive_info_description'] = 'Oculta información sensible como teléfono, nombre completo, dinero y profesión.',
        ['dark_filter'] = 'Filtro Oscuro',
        ['particle_effects'] = 'Efectos de Partículas',
        ['particle_effects_description'] = 'Muestra efectos visuales de partículas en el fondo.',
        ['game_time'] = 'Hora del Juego',
        ['game_weather'] = 'Clima del Juego',
        ['game_scenario'] = 'Escenario del Juego',
        
        -- Character Management
        ['delete'] = 'ELIMINAR',
        ['play'] = 'JUGAR',
        ['new_character'] = 'Nuevo Personaje',
        ['create_character'] = 'CREAR PERSONAJE',
        ['cancel'] = 'Cancelar',
        ['active_character'] = 'Personaje Activo',
        ['basic_information'] = 'Información Básica',
        ['main_information'] = 'Información Principal',
        ['finances'] = 'Finanzas',
        
        -- Character Info  
        ['name'] = 'Nombre',
        ['lastname'] = 'Apellido',
        ['gender'] = 'Género',
        ['age'] = 'Edad',
        ['years'] = 'años',
        ['height'] = 'Altura',
        ['phone'] = 'Teléfono',
        ['profession'] = 'Profesión',
        ['unemployed'] = 'Desempleado',
        ['male'] = 'Masculino',
        ['female'] = 'Femenino',
        ['birth_date'] = 'Fecha de Nacimiento',
        ['nationality'] = 'Nacionalidad',
        
        -- Financial
        ['total_balance'] = 'Saldo Total',
        ['bank'] = 'Banco',
        ['cash'] = 'Efectivo',
        
        -- Placeholders
        ['enter_name'] = 'Ingresa el nombre',
        ['enter_lastname'] = 'Ingresa el apellido',
        ['select_origin'] = 'Seleccionar origen',
        ['select_weather'] = 'Seleccionar clima',
        ['select_scenario'] = 'Seleccionar escenario',
        
        -- Delete Modal
        ['confirm_deletion'] = 'Confirmar Eliminación',
        ['delete_character_message'] = '¿Estás seguro de que quieres eliminar este personaje? Esta acción no se puede deshacer.',
        ['delete_button'] = 'Eliminar',
        ['cancel_button'] = 'Cancelar',
        
        -- Weather Types
        ['weather_clear'] = 'Despejado',
        ['weather_extrasunny'] = 'Muy Soleado',
        ['weather_clouds'] = 'Nublado',
        ['weather_overcast'] = 'Cubierto',
        ['weather_rain'] = 'Lluvioso',
        ['weather_thunder'] = 'Tormenta',
        ['weather_smog'] = 'Smog',
        ['weather_foggy'] = 'Neblinoso',
        ['weather_xmas'] = 'Navideño',
        ['weather_snowlight'] = 'Nieve Ligera'
    }
}

-- Current Language
Config.DefaultLanguage = 'en'
-- Countries/Nationalities
Config.Countries = {
    'Afghan', 'Albanian', 'German', 'Andorran', 'Angolan', 'Argentine', 'Armenian', 'Australian',
    'Austrian', 'Azerbaijani', 'Bahamian', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian', 'Belizean',
    'Beninese', 'Bolivian', 'Bosnian', 'Botswanan', 'Brazilian', 'Bruneian', 'Bulgarian', 'Burkinabé',
    'Burundian', 'Bhutanese', 'Cape Verdean', 'Cambodian', 'Cameroonian', 'Canadian', 'Qatari', 'Chadian',
    'Czech', 'Chilean', 'Chinese', 'Cypriot', 'Colombian', 'Comorian', 'Congolese', 'North Korean',
    'South Korean', 'Ivorian', 'Costa Rican', 'Croatian', 'Cuban', 'Danish', 'Dominican', 'Dominican',
    'Ecuadorian', 'Egyptian', 'Salvadoran', 'Emirati', 'Eritrean', 'Slovak', 'Slovenian', 'Spanish',
    'American', 'Estonian', 'Ethiopian', 'Filipino', 'Finnish', 'Fijian', 'French', 'Gabonese',
    'Gambian', 'Georgian', 'Ghanaian', 'Grenadian', 'Greek', 'Guatemalan', 'Guinean',
    'Equatorial Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hungarian', 'Indian', 'Indonesian', 'Iranian',
    'Iraqi', 'Irish', 'Icelandic', 'Israeli', 'Italian', 'Jamaican', 'Japanese', 'Jordanian',
    'Kazakh', 'Kenyan', 'Kyrgyz', 'Kiribati', 'Kuwaiti', 'Laotian', 'Lesotho', 'Latvian',
    'Lebanese', 'Liberian', 'Libyan', 'Liechtenstein', 'Lithuanian', 'Luxembourgish', 'Macedonian',
    'Malagasy', 'Malaysian', 'Malawian', 'Maldivian', 'Malian', 'Maltese', 'Moroccan', 'Marshallese',
    'Mauritian', 'Mauritanian', 'Mexican', 'Micronesian', 'Moldovan', 'Monégasque', 'Mongolian',
    'Montenegrin', 'Mozambican', 'Myanmar', 'Namibian', 'Nauruan', 'Nepali', 'Nicaraguan',
    'Nigerien', 'Nigerian', 'Norwegian', 'New Zealand', 'Omani', 'Dutch', 'Pakistani', 'Palauan',
    'Palestinian', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Puerto Rican',
    'British', 'Central African', 'Romanian', 'Rwandan', 'Russian', 'Solomon Islander', 'Samoan',
    'San Marinese', 'São Toméan', 'Saudi', 'Senegalese', 'Serbian', 'Seychellois', 'Sierra Leonean',
    'Singaporean', 'Syrian', 'Somali', 'South African', 'Sudanese', 'South Sudanese', 'Swedish', 'Swiss',
    'Surinamese', 'Swazi', 'Tajik', 'Thai', 'Tanzanian', 'Timorese', 'Togolese', 'Tongan',
    'Trinidadian', 'Tunisian', 'Turkmen', 'Turkish', 'Tuvaluan', 'Ukrainian', 'Ugandan', 'Uruguayan',
    'Uzbek', 'Vanuatuan', 'Vatican', 'Venezuelan', 'Vietnamese', 'Yemeni', 'Djiboutian', 'Zambian',
    'Zimbabwean'
}





--   /$$$$$$   /$$$$$$  /$$$$$$$$ /$$   /$$  /$$$$$$  /$$$$$$$  /$$$$$$  /$$$$$$   /$$$$$$ 
--  /$$__  $$ /$$__  $$| $$_____/| $$$ | $$ /$$__  $$| $$__  $$|_  $$_/ /$$__  $$ /$$__  $$
-- | $$  \__/| $$  \__/| $$      | $$$$| $$| $$  \ $$| $$  \ $$  | $$  | $$  \ $$| $$  \__/
-- |  $$$$$$ | $$      | $$$$$   | $$ $$ $$| $$$$$$$$| $$$$$$$/  | $$  | $$  | $$|  $$$$$$ 
--  \____  $$| $$      | $$__/   | $$  $$$$| $$__  $$| $$__  $$  | $$  | $$  | $$ \____  $$
--  /$$  \ $$| $$    $$| $$      | $$\  $$$| $$  | $$| $$  \ $$  | $$  | $$  | $$ /$$  \ $$
-- |  $$$$$$/|  $$$$$$/| $$$$$$$$| $$ \  $$| $$  | $$| $$  | $$ /$$$$$$|  $$$$$$/|  $$$$$$/
--  \______/  \______/ |________/|__/  \__/|__/  |__/|__/  |__/|______/ \______/  \______/ 



Config.InteractiveScenarios = {
    ['default'] = {
        name = 'Club',
        description = 'Club Interior',
        coord = vector4(1124.545044, -3143.327393, -37.074707, 167.24408),   -- Character creation spawn coords
        cam = vector4(1123.870312, -3144.7, -37.074707, 342.086609),         -- Camera coordinates for character creation
        camRot = 15.0,                                                       -- Camera pitch (up/down rotation)
        interior = vector3(-814.89, 181.95, 76.74),                          -- Interior to load where characters are previewed
        isInterior = true,
        ipls = {
            'bkr_biker_interior_placement_interior_0_biker_dlc_int_01_mil'
        },
        activities = {
            {
                name = 'Sit Chair 2',
                heading = 70.0,
                anim = { dict = "timetable@ron@ig_5_p3", name = "ig_5_p3_base" }
            }
        }
    },
    ['yacht'] = {
        name = 'Luxury Yacht',
        description = 'Luxury Yacht',
        coord = vector4(-2043.837402, -1030.641724, 11.975098, 107.716537), 
        cam = vector4(-2046.395630, -1030.615356, 11.975098, 283.464569), 
        camRot = 5.0, 
        interior = vector3(-2045.8, -1031.2, 11.91),
        isInterior = true,
        ipls = {
            'hei_yacht_heist',
            'hei_yacht_heist_enginrm',
            'hei_yacht_heist_Lounge'
        },
        activities = {
            {
                name = 'Relaxing',
                anim = { dict = "mp_move@prostitute@m@french", name = "idle" }
            }
        }
    },
}
