fx_version 'cerulean'
game 'gta5'

author 'BIT Development'
description 'Multi-Character System for ESX, QBCore and QBox'
version '1.0.0'

shared_scripts {
    'shared/shared.lua'
}

client_scripts {
    'client/framework.lua',
    'client/main.lua'
}

server_scripts {
    'server/framework.lua',
    'server/dbc.lua',
    'server/main.lua',
    'version.lua'
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/styles.css',
    'html/app.js',
    'html/assets/*',
    'html/lib/*.js',
}

lua54 'yes'