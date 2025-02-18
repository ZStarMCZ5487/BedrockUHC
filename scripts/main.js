import { world, system, ItemStack } from "@minecraft/server"
import { ActionFormData } from '@minecraft/server-ui'

world.getDimension("Overworld").runCommandAsync("gamerule naturalregeneration false")
world.getDimension("Overworld").runCommandAsync("gamerule doimmediaterespawn true")
world.getDimension("Overworld").runCommandAsync("gamerule showcoordinates true")
world.getDimension("Overworld").runCommandAsync("gamerule sendcommandfeedback false")

let timer = -1

let spawnx = 0
let spawny = 0
let spawnz = 0

world.beforeEvents.chatSend.subscribe((ev) => {
    const p = ev.sender

    if(ev.message == "!start" && p.isOp) {
        ev.cancel = true
        system.run(() => {
            world.getDimension("Overworld").runCommandAsync('tp @a "' + p.name + '"')
            world.getDimension("Overworld").runCommandAsync("tag @a add playing")
            world.getDimension("Overworld").runCommandAsync("gamemode s @a")

            timer = 24000

            spawnx = p.location.x 
            spawnz = p.location.z 

            world.sendMessage("§l§aGame Started...")

            world.getDimension("Overworld").runCommandAsync("gamerule pvp false")
            world.getDimension("Overworld").runCommandAsync("time set day")
            world.getDimension("Overworld").runCommandAsync("setworldspawn " + spawnx + " " + spawny + " " + spawnz)
            world.getDimension("Overworld").runCommandAsync("effect @a instant_health 5 255")
            world.getDimension("Overworld").runCommandAsync("clear @a")
            world.getDimension("Overworld").runCommandAsync("give @a golden_apple 2")
            world.getDimension("Overworld").runCommandAsync("give @a cooked_beef 5")
        })
        return
    }

    if(ev.message == "!stop" && p.isOp) {
        ev.cancel = true
        timer = 0

        world.sendMessage("§l§cGame Force Stopped...")
        return
    }

    if(ev.message == "!dm" && p.isOp) {
        ev.cancel = true
        timer = 6101

        world.sendMessage("§l§cForce Death Match...")
        return
    }

    if (ev.message == "!spectate") {
        ev.cancel = true
        if (!p.hasTag("playing")) {
            system.run(() => {
                spectateForm(p)
            })
        }
        return
    }

    if (p.hasTag("playing")) {
        ev.cancel = true
        world.sendMessage('§8[§aAlive§8]§f ' + p.name + ' > ' + ev.message)
    } else {
        ev.cancel = true
        world.sendMessage('§8[§cDeath§8]§f ' + p.name + ' > ' + ev.message)
    }
})

world.afterEvents.playerSpawn.subscribe((ev) => {
    const p = ev.player

    system.run(() => {
        p.removeTag("playing")
        world.getDimension("Overworld").runCommandAsync('gamemode spectator "' + p.name + '"')
        p.sendMessage("§eUse §c!spectate §eto teleport to a player.")
    })
})

system.runInterval(() => {

    world.getDimension("Overworld").runCommandAsync("enchant @a efficiency 3")
    world.getDimension("Overworld").runCommandAsync("enchant @a unbreaking 3")
    world.getDimension("Overworld").runCommandAsync("effect @a night_vision infinite 1 true")

    if (timer > 0) {
        timer--
    }

    let borderx = 50
    let borderz = 50

    //idk why dont work?... btu i will just leave it here...
    if (timer <= 6000 && timer >= 1) {
        borderx - 0.3
        borderz - 0.3
    }

    for (const p of world.getPlayers()) {
        if (timer > 0) {
            const remainingSeconds = Math.floor(timer / 20)
            const remainingMinutes = Math.floor(remainingSeconds / 60)
            const displaySeconds = remainingSeconds % 60
            const displayMinutes = remainingMinutes % 60

            world.getDimension("Overworld").runCommandAsync("title @a actionbar §8[§aPlayer§8]§f: " + world.getPlayers({tags: ["playing"] }).length + " §8[§eTime§8]§f: " + displayMinutes + ":" + displaySeconds)
        }

        if (world.getPlayers({tags: ["playing"] }).length == 1) {

            if (p.hasTag("playing") == true) {
                world.sendMessage("§l§a" + p.name + " won the game!")
                world.getDimension("Overworld").runCommandAsync('gamemode spectator @a')
                world.getDimension("Overworld").runCommandAsync("tag @a remove playing")
            }
    
            timer = -1
        }

        if (timer <= 6000 && timer >= 1) {
            if (p.location.x >= spawnx + borderx || p.location.x <= spawnx - borderx || p.location.z >= spawnz + borderz || p.location.z <= spawnz - borderz) {
                p.applyDamage(0.5)
                if (!p.hasTag("border")) {
                    p.sendMessage("§l§cYou are outside of the border!")
                    p.addTag("border")
                }
            } else {
                if (p.hasTag("border")) {
                    p.removeTag("border")
                }
            }

            system.runTimeout(() => {
                for (let border1 of line({x: spawnx + borderx, y: 100, z: spawnz + borderz}, {x: spawnx - borderx, y: 100, z: spawnz + borderz}, 8)) {
                    world.getDimension("overworld").spawnParticle("minecraft:falling_border_dust_particle", border1)
                }
            
                for (let border2 of line({x: spawnx + borderx, y: 100, z: spawnz - borderz}, {x: spawnx - borderx, y: 100, z: spawnz - borderz}, 8)) {
                    world.getDimension("overworld").spawnParticle("minecraft:falling_border_dust_particle", border2)
                }
            
                for (let border3 of line({x: spawnx + borderx, y: 100, z: spawnz + borderz}, {x: spawnx + borderx, y: 100, z: spawnz - borderz}, 8)) {
                    world.getDimension("overworld").spawnParticle("minecraft:falling_border_dust_particle", border3)
                }
            
                for (let border4 of line({x: spawnx - borderx, y: 100, z: spawnz - borderz}, {x: spawnx - borderx, y: 100, z: spawnz + borderz}, 8)) {
                    world.getDimension("overworld").spawnParticle("minecraft:falling_border_dust_particle", border4)
                }
            }, 100)
        }
    }

    //18000 = 15:00
    if (timer == 18000) {
        world.sendMessage("§l§cPVP is Enabled...")
        world.getDimension("Overworld").runCommandAsync("gamerule pvp true")
        
    }

    if (timer == 0) {
        timer = -1
        world.sendMessage("§l§cGame Over")
        world.getDimension("Overworld").runCommandAsync('gamemode spectator @a')
        world.getDimension("Overworld").runCommandAsync("tag @a remove playing")
    }

    //6000 = 5:00
    if (timer == 6100) {
        world.sendMessage("§l§cDeath Match in 5...")
    }
    if (timer == 6080) {
        world.sendMessage("§l§cDeath Match in 4...")
    }
    if (timer == 6060) {
        world.sendMessage("§l§cDeath Match in 3...")
    }
    if (timer == 6040) {
        world.sendMessage("§l§cDeath Match in 2...")
    }
    if (timer == 6020) {
        world.sendMessage("§l§cDeath Match in 1...")
    }
})

//auto smelt...
world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const p = ev.player
    const b = ev.block

    if (b.typeId == "minecraft:oak_leaves" || b.typeId == "minecraft:birch_leaves" || b.typeId == "minecraft:spruce_leaves" || b.typeId == "minecraft:acacia_leaves" || b.typeId == "minecraft:jungle_leaves" || b.typeId == "minecraft:dark_oak_leaves" || b.typeId == "minecraft:azalea_leaves" || b.typeId == "minecraft:azalea_leaves_flowered" || b.typeId == "minecraft:cherry_leaves" || b.typeId == "minecraft:mangrove_leaves" || b.typeId == "minecraft:pale_oak_leaves") {
        system.run(() => {
            var chance = Math.floor(Math.random() * 11);
            if (chance < 2) { //20% chance of getting apple
                world.getDimension("Overworld").spawnItem(new ItemStack("minecraft:apple", 1), b.location)
            }
        })
    }
})

world.afterEvents.entitySpawn.subscribe((ev) => {
    const {entity} = ev
    if(entity.typeId !== "minecraft:item") return
    const item = entity.getComponent("minecraft:item").itemStack
    const id = item?.typeId
    if (id == "minecraft:raw_copper") {
        world.getDimension("Overworld").spawnItem(new ItemStack("minecraft:copper_ingot", 1), entity.location)
        entity.kill()
    }
    if (id == "minecraft:raw_iron") {
        world.getDimension("Overworld").spawnItem(new ItemStack("minecraft:iron_ingot", 1), entity.location)
        entity.kill()
    }
    if (id == "minecraft:raw_gold") {
        world.getDimension("Overworld").spawnItem(new ItemStack("minecraft:gold_ingot", 1), entity.location)
        entity.kill()
    }
})

function spectateForm(p) {
    let playing = [];

    for (const notPlaying of world.getPlayers()) {
        if (notPlaying.hasTag("playing") && notPlaying !== p) {
            playing.push(notPlaying);
        }
    }

    if (playing.length > 0 && !p.hasTag("playing")) {
        p.sendMessage("§cClose chat ui to show spectator ui...")
        let form = new ActionFormData()
        form.title("§l§7Spectate Player")

        playing.forEach((playing) => {
            form.button(playing.name)
        })

        form.show(p).then(result => {
            if (result.cancelationReason == "UserBusy") {
                return system.runTimeout(() => {
                    spectateForm(p)
                }, 10)
            }

            if (result.selection >= 0 && result.selection < playing.length) {
                const selectedPlayer = playing[result.selection]
                world.getDimension("Overworld").runCommandAsync('tp  "' + p.name + '" "' + selectedPlayer.name + '"')
            }
        })            
    } else {
        p.sendMessage("§l§cYou can't use this right now!")
    }
}

function distance(vector1, vector2) {
    return Math.sqrt(Math.abs(vector1.x - vector2.x)**2 + Math.abs(vector1.y - vector2.y)**2 + Math.abs(vector1.z - vector2.z)**2)
}

function line(vector1, vector2, step2 = 1) {
    let dist = distance(vector1, vector2)
    let step = {
      x: (vector2.x - vector1.x) / (dist || 1),
      y: (vector2.y - vector1.y) / (dist || 1),
      z: (vector2.z - vector1.z) / (dist || 1)
    }
    let list = []
    for (let i = 0; i < dist; i += step2) {
      list.push({
        x: vector1.x + i*step.x,
        y: vector1.y + i*step.y,
        z: vector1.z + i*step.z
      })
    }
    return list
}