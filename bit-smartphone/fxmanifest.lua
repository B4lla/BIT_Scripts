fx_version 'cerulean'
game 'gta5'
lua54 'yes'
author 'B4lla'
description 'BIT Smartphone'
version '1.0'


shared_scripts {
    'shared/*.lua'
}

client_scripts {
    'client/framework.lua',
    'client/*.lua',
    'client/apps/*.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/framework.lua',
    'server/dbc.lua',
    'server/*.lua', 
    'server/apps/*.lua',
    'version.lua',
}

ui_page 'html/index.html'
ui_page_game_script 'yes'

files {
    'html/index.html',
    'html/**/*.css',
    'html/**/*.js', 
    'html/assets/**/*',
    'html/fonts/**/*',
    'html/lib/*',
    'html/locales/*.json'
}