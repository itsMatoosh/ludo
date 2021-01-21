var express = require('express')
var router = express.Router()

// initializes the stats database
var db;
async function init(database) {
    db = database

    // board table stores position of pawns of each player in the game
    await db.run(`CREATE TABLE IF NOT EXISTS stats (gamesCompleted int)`)
}

async function getGameStats() {
    return await db.get('SELECT * FROM stats')
}

// called on a completed games
async function onGameCompleted() {
    // increment game stats
    var stats = await getGameStats()
    var gamesCompleted = 0
    if(stats != undefined) {
        gamesCompleted = stats.gamesCompleted
    }

    // update stats
    gamesCompleted += 1
    await db.run('UPDATE stats SET gamesCompleted = ?', [gamesCompleted])
}

// return game stats
router.get('/', async (req, res) => {
    var stats = await getGameStats()
    if(stats != undefined) {
        res.send(query)
    } else {
        res.send({
            gamesCompleted: 0
        })
    }
})

module.exports.router = router
module.exports.onGameCompleted = onGameCompleted
module.exports.init = init