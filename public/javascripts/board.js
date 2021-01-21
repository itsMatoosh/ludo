const backHost = 'lu-woah.herokuapp.com'
const backAddr = `http://${backHost}`

// constants
const PLAYER_NAME_PLACEHOLDER = 'Waiting for players...'

// game session vars
const gameId = window.location.hash.replace('#','');
var playerId;
var playerColor;
var nameArray;

// other stuff
var gameCodeLabel = document.getElementById("gameCode");
gameCodeLabel.innerHTML = gameId;

// generates a promise that resolves after ms time
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// integrate dice roll animation and dice roll result
var button = document.getElementById("dice");
button.onclick = async () => {
    if (turn == playerColor) {
        rollDice();
    }
}

// do a dice roll
let isRolling = false;
async function rollDice(value) {
    if (!isRolling) {
        var interval = setInterval(diceAnimation, 40);
        isRolling = true;
        try {
            var diceEye;
            if(value != undefined) {
                await timeout(500)
                diceEye = value;
            } else {
                diceEyePromise = rollDiceOnServer();
                await timeout(500);
                diceEye = await diceEyePromise;
            }
            document.querySelector("#diceImg").setAttribute("src", "media/diceSides/Side" + diceEye + ".png");
        } finally {
            clearInterval(interval);
            isRolling = false;
        }
    }
}

// recieve dice roll result from the server
async function rollDiceOnServer() {
    var result = await axios.post(`${backAddr}/games/${gameId}/roll`, {playerId});
    console.log(result.data.roll);
    return result.data.roll;
}

// animation for dice roll after clicking the dice
function diceAnimation() {
    var temp = (1 + Math.round(Math.random() * 5));
    document.querySelector("#diceImg").setAttribute("src", "media/diceSides/Side" + temp + ".png");
}

// connects to the game websocket
function connect() {
    const socket = new WebSocket(`ws://${backHost}/games/${gameId}/live`);
    socket.onmessage = function(event) {
        console.log(`LIVE message: ${event.data}`)

        var args = event.data.split(' ')
        switch (args[0]) {
            case 'PLAYER_ID':
                playerId = parseInt(args[1])
                updateNames();
                updateBoard();
                console.log(`Joined game! Player id: ${playerId}`);
            break
            case 'UPDATE_PLAYERS':
                updateNames()
                break;
            case 'DICE_ROLL':
                if (parseInt(args[1]) != playerId) {
                    rollDice(parseInt(args[2]));
                }
                updateBoard();
                break;
            case 'PAWN_MOVE':
                updateBoard();
                break;
            case 'MURDER':
                var killer = parseInt(args[1]);
                var victim = parseInt(args[2]);
                if (playerColor == killer) {
                    alert(`You are murdering ${nameArray[victim]}'s pawn!`);
                }
                else if (playerColor == victim) {
                    alert(`Your pawn is getting murdered by ${nameArray[killer]}!`);
                }
                break;
        }
    }
    socket.onerror = (event) => {
        // return to main page on error
        window.location.replace('index.html')
        alert(`An error has occurred on the server, we are sending you to the main page.\n${event.reason}`);
    }
    socket.onclose = (event) => {
        // return to main page when we lost connection
        window.location.replace('index.html')
        alert(event.reason);
    }
}
connect();

// assign nickname to players (from modal)
async function assignName() {
    var nickname = document.getElementById("nameField").value;
    console.log(nickname);
    await axios.put(`${backAddr}/games/${gameId}/player/${playerId}/nickname`, {nickname});
    var checkname = await axios.get(`${backAddr}/games/${gameId}/player/${playerId}/nickname`);
    console.log(checkname.data.nickname);
}

// update name field, called in assignName()
async function updateNames() {
    nameArray = (await axios.get(`${backAddr}/games/${gameId}/player/nicknames`)).data;
    playerColor = (await axios.post(`${backAddr}/games/${gameId}/color`, {playerId})).data.color;
    console.log('names', nameArray)
    for (let i = 0; i < 4; i++) {
        var id = "name" + (i + 1).toString();
        if(nameArray[i]) {
            // placeholder name
            document.getElementById(id).innerHTML = nameArray[i];
        } else {
            // player name
            document.getElementById(id).innerHTML = PLAYER_NAME_PLACEHOLDER;
        }
    }
}

// toggle modal
var modal = document.getElementById("createGame");
var close = document.getElementsByClassName("close")[0];
var submitButton = document.getElementById("submitButton");
submitButton.onclick = function() {
    assignName();
    modal.style.display = "none";
}

close.onclick = function() {
    modal.style.display = "none";
}

// updating board
var game;
var turn;
async function updateBoard() {
    game = (await axios.get(`${backAddr}/games/${gameId}`)).data;
    turn = (game.info.start_color + game.info.moves - game.info.sixes) % 4;
    var board = game.board;
    highlightPlayer();

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            var pawn = document.getElementById(pawnColors[i] + j.toString());
            var oldPos = pawn.parentNode.id;
            var location;
            if (board[i][`p${j}`] > -1 && board[i][`p${j}`] < 52) {
                location = "b" + board[i][`p${j}`];
            }

            // last five blocks for each color
            else if (board[i][`p${j}`] >= 52 && board[i][`p${j}`] < 57) {
                location = "bb" + (board[i][`p${j}`] - 52);
            }
            else if (board[i][`p${j}`] >= 57 && board[i][`p${j}`] < 62) {
                location = "bg" + (board[i][`p${j}`] - 57);
            }
            else if (board[i][`p${j}`] >= 62 && board[i][`p${j}`] < 67) {
                location = "br" + (board[i][`p${j}`] - 62);
            }
            else if (board[i][`p${j}`] >= 67) {
                location = "by" + (board[i][`p${j}`] - 67);
            }

            // back to the pawn holder
            else {
                document.getElementById(`holder${i}`).appendChild(pawn);
                pawn.style.position = "relative";
                continue;
            }

            console.log(location);

            // do not make any change if the location is the same
            if (oldPos != location) {
                var block = document.getElementById(location);
                pawn.style.zIndex = block.childNodes.length + 1;
                pawn.style.position = "relative";
                block.appendChild(pawn);
            }
        }
    }
}

// find what pawn is selected and send the data to server
var pawnColors = ["pb","pg","pr","py"];
async function checkSelectedPawn() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            var pawnString = pawnColors[j] + i.toString();
            var pawn = document.getElementById(pawnString);
            (pawn.addEventListener("click", async function() {
                await pawnMove(i, j);
            }));
        }
    }
}
checkSelectedPawn();

// track pawn movement
async function pawnMove(pawn, color) {
    // TODO
    if (turn == color) {
        var response = await axios.post(`${backAddr}/games/${gameId}/move`, {playerId, pawn});

        // alert user if the move is invalid
        if (!response.data.success) {
            alert("Invalid move, please select different pawn.");
        }
    }
}

// // temporary function to check the pawn movement
// var firstRed = document.getElementById("pr0");
// firstRed.onclick = function() {
//     if (diceEye > 0) {
//         document.getElementById("b26").appendChild(firstRed);
//     }
// }

// update turn on dice roll, pawn move
function highlightPlayer() {
    for(let i = 1; i <= 4; i++) {
        if(i == turn + 1) {
            // highlight curr player
            var nameField = document.getElementById("name" + i.toString());
            nameField.style.background = "#f8e5af";
        } else {
            // remove highlight from others
            var nameField = document.getElementById("name" + i.toString());
            nameField.style.background = "none";
        }
    }
    
}