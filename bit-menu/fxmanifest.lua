fx_version 'cerulean'
game 'gta5'
author 'Balla'
description 'BIT Menu - A versatile menu for actions and interactions'
version '1.0'
lua54 'yes'

ui_page 'html/index.html'

data_file "DLC_ITYP_REQUEST" "stream/cuffs_main.ytyp"

files {
    'html/index.html',
    'html/app.js',
    'html/assets/headbag.jpg',
    'html/styles.css',
}

client_scripts {
    'client/*.lua',
    'client/actions/*.lua',
}

server_scripts {
    'server/framework.lua',
    'server/*.lua',
    'server/actions/*.lua',
    'version.lua',
}

shared_scripts {
    'shared/shared.lua',
    'shared/utils.lua'
}

escrow_ignore {
    'shared/*.lua',
    'client/framework.lua',
    'client/actions/customActions.lua',
    'server/framework.lua',
    'server/actions/customActions.lua',
}