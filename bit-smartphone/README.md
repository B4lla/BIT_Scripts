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

