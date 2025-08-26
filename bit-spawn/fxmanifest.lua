fx_version 'cerulean'
game 'gta5'
author 'Balla'
description 'BIT Spawn'
version '1.0'
lua54 'yes'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/styles.css',
    'html/app.js',
    'html/*.js',
    'html/assets/map.png',
}

client_scripts {
    'client/*.lua',
}

server_scripts {
    'server/*.lua',
    'version.lua',
}

shared_scripts {
    'shared/shared.lua',
}

escrow_ignore {
    'client/framework.lua',
    'server/framework.lua',
    'shared/*.lua',
}