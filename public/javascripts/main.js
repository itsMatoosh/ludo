const backHost = 'lu-woah.herokuapp.com'
const backAddr = `https://${backHost}/games`

// argument false: createGame / true: quickGame
async function gameCreation(quickGame) {
    console.log("clicked")
    var game = await axios.post(`${backAddr}`, {quickGame});
    console.log(game.data.gameId);
    window.location.replace(`game.html#${game.data.gameId}`);
}

var createGame = document.getElementById("createGameButton");
createGame.onclick = () => {
    gameCreation(false);
}


var quickGame = document.getElementById("quickGameButton");
quickGame.onclick = () => {
    gameCreation(true);
} 

async function updateMain() {
    // updating game list  
    // <tr>
    //     <td>game cdoe</td>
    //     <td>num of players</td>
    //     <td><button>Join</button></td>
    // </tr>
    var table = document.getElementById("gameListTable");
    for (let i = 0; i < games.data.length; i++) {
        var row = table.insertRow();
        var cell0 = row.insertCell(0);
        var cell1 = row.insertCell(1);
        var cell2 = row.insertCell(2);
        cell0.innerHTML = games.data[i].gameId;
        cell1.innerHTML = games.data[i].players;

        var tableJoin = document.createElement("button");
        tableJoin.innerHTML = "Join";
        tableJoin.classList.add("tableButton");
        cell2.appendChild(tableJoin);
        tableJoin.onclick = function() {
            window.location.replace(`game.html#${games.data[i].gameId}`);
        }
    }
}

var joinGame = document.getElementById("joinGameButton");
var joinGameId = document.getElementById("joinGameId");
var message = document.getElementById("message");
joinGame.onclick = async function() {
    var games = await axios.get(`${backAddr}`);
    for (let i = 0; i < games.data.length; i++) {
        // if the game code is valid
        if (games.data[i].gameId == joinGameId.value) {
            message.style.display = "none";
            window.location.replace(`game.html#${joinGameId.value}`);
            return;
        }
    }
    message.style.display = "block";
}

updateMain();