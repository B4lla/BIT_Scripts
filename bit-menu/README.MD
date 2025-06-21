# BIT Menu - Player Interaction System

Simple and configurable player interaction menu for FiveM servers (ESX/QBCore/QBox).

## 📦 Installation

1. Download and place resource in your `resources` folder
2. Add `ensure bit-menu` to your `server.cfg`
3. Configure the script in `shared/shared.lua`
4. Restart your server

## ⚙️ Basic Configuration

```lua
-- Framework (esx | qbcore | qbox)
Config.Framework = "esx"

-- Notifications (okok | origen | ox | wasabi | codem | esx | qb)
Config.Notifications = "codem"

-- Inventory system (ox | qs | esx | qbcore | custom)
Config.Inventory = { system = "ox" }

-- Menu command and key
Config.Command = "menu"
Config.MenuKey = { enabled = true, key = "F6" }

-- Player search radius
Config.NearbyRadius = 5.0

-- Target system
Config.UseTarget = true
Config.TargetSystem = "ox" -- ox | qb | custom
```

## 🔧 Adding Custom Actions

### Client Side (`client/actions/customActions.lua`)
```lua
function Action.yourAction(targetId)
    if not targetId then
        Notifications(Noti.error, Utils.getText("error"), Noti.time)
        return
    end
    -- Your action logic here
    Notifications(Noti.check, "Action completed!", Noti.time)
end
```

### Server Side (`server/customActions.lua`)
```lua
-- For ESX
ESX.RegisterServerCallback('your-callback', function(source, cb, targetId)
    -- Your validation logic here
    cb(true)
end)

-- For QBCore/QBox
QBCore.Functions.CreateCallback('your-callback', function(source, cb, targetId)
    -- Your validation logic here
    cb(true)
end)
```

## 🎮 Core Features

### Available Actions
- **Handcuff/Unhandcuff** - With item requirements and animations
- **Escort** - Walk with handcuffed players
- **Carry** - Carry unconscious/injured players
- **Search/Rob** - Access player inventory
- **Vehicle Actions** - Put in/remove from vehicle, trunk operations
- **Headbag** - Apply/remove headbags with visual effects
- **Tie Legs** - Leg restraint system
- **Drag** - Advanced drag system

### Role-Based System
- **Police Actions** - Full law enforcement toolkit
- **Gang Actions** - Criminal activities
- **Custom Roles** - Easy addition of new roles
- **Permission System** - Job-based action filtering

### Interaction Methods
- **Command-Based** - Configurable command (`/menu`)
- **Key Binding** - Customizable keys (F1-F12)
- **Target System** - ox_target, qb-target support
- **Proximity Detection** - Automatic nearby player detection

## 🎒 Systems Integration

### Inventory Systems
- OX Inventory, QS Inventory, ESX Default, QBCore, Custom

### Notification Systems
- OKOK, Origen, OX, Wasabi, CodeM, ESX, QB

### Target Systems
- OX Target, QB Target, Custom implementations

## 🆘 Troubleshooting

### Common Issues
1. **Menu not opening** - Check command/key configuration
2. **Actions not working** - Verify framework and job permissions
3. **Target issues** - Ensure target system is properly configured
4. **Inventory problems** - Configure correct inventory system

### Requirements
- **FiveM Server** - Latest recommended version
- **Framework** - ESX, QBCore, or QBox
- **Dependencies** - Target system, inventory system, notifications

## 🔄 Latest Features
- ✅ Multi-framework compatibility (ESX/QBCore/QBox)
- ✅ Advanced inventory integration
- ✅ Enhanced target system
- ✅ Role-based action filtering
- ✅ Item requirement system
- ✅ Callback system for custom logic
- ✅ Comprehensive localization

---

**Support**: Check configuration, console errors, and ensure all dependencies are running properly.
