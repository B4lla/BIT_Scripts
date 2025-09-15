# EXPORTS

## CLIENT

local phoneStatus = exports['bit-smartphone']:IsPhoneOpen()
exports['bit-smartphone']:SetPhoneUsage(boolean)

exports['bit-smartphone']:SendNotification(playerId, {
title = "Nuevo Mensaje",
message = "Tienes un mensaje de John Doe",
app = "messages",
priority = "normal"
})

exports['bit-smartphone']:SendNotification(playerId, {
title = "Oferta Especial",
message = "50% de descuento - ¡Solo por hoy!",
app = "business",
priority = "high",
expiresAt = "2024-01-01 23:59:59"
})

exports['bit-smartphone']:SendNotificationToAll({
title = "Mantenimiento",
message = "Reinicio en 10 minutos",
priority = "urgent"
})

## SERVER

## CAMBIOS

-Arregladas traducciones en la app phone

-Arregladas las traducciones del calendario

-Ahora las apps del inicio tienen traducción (shared.lua)

-Arreglada la linterna

-Arreglado un fallo de ESX que salía en QB por el server/apps/business.lua

-Cambiados los nombres de algunas apps para que no hayan problemas

-Cambiado el padding top de Mensajes

-Cambiado el CDN de Vue a producción

-Añadido three.js en local

-Añadido el js de tailwind en local

-Eliminados los jugadores cercanos de prueba

## PROBLEMAS ENCONTRADOS

-La App Store cuando accedes te salen primero las apps como undefined, y a veces se cierra

-Iconos en App Store no se ven todos

-A veces cierras el movil y luego no abre de nuevo tienes que reiniciar el script

-Al acceder a la app de instagram saltan errores y no funciona mu bien

-La App de Tuister tampoco funciona muy bien

-La App de crypto se queda cargando

-La App bitlove no guarda la imagen

-La App musica no obtiene la info de la url de youtube

-La App de alquiler de bicis no abre

-La App FruitNinja no funciona bien (a las malas se puede quitar)

