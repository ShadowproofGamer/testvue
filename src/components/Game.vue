<script>

import {ref} from "vue";

const X_CLASS = 'x';
const O_CLASS = 'o';
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];
export default {
  props: ['username', 'userGUID'],
  // setup(props) {
  //   console.log(props.username);
  // },
  name: "Game",
  // el: '#app',
  data() {
    return {
      loggedIn: true,
      // username: '',
      currentPlayer: X_CLASS,
      gameActive: false,
      cells: Array(9).fill(''),
      statusDisplay: '',
      stompClient: null,
      roomConnection: null,
      roomNumber: null,
      startingPlayer: null,
      gameEnded: false
    }
  },
  methods: {
    connect() {
      if (this.username.trim()) {
        this.loggedIn = true;
        const socket = new SockJS('http://localhost:8080/ws');
        this.stompClient = Stomp.over(socket);

        this.stompClient.connect({}, this.onConnected, this.onError);
      }
    },

    onError() {
      console.log("Stomp error")
    },


    onConnected() {
      // Subscribe to the Public Topic
      this.personalConnection = this.stompClient.subscribe('/topic/' + this.userGUID, this.onMessageReceived);

      // Tell your username to the server
      this.stompClient.send("/app/topic/login",
          {},
          JSON.stringify({type: 'LOGIN', username: this.userGUID, content: "Want to join"})
      )
      this.cells = Array(9).fill(''); // Reset cells
      this.statusDisplay = 'Waiting for game...';
    },

    onLeave() {
      this.gameActive = false;
      this.gameEnded = true;
      if (this.roomNumber != null) {
        this.roomConnection.unsubscribe();
        this.stompClient.send("/app/room/" + this.roomNumber,
            {},
            JSON.stringify({type: 'LEAVE', username: this.userGUID, content: "Want to leave"})
        );
        this.roomNumber = null;
      }
      this.startingPlayer = null;
      this.cells = Array(9).fill(''); // Reset cells
      this.statusDisplay = 'Waiting for game...';
      this.onRestart()
    },

    onRestart() {


      //Tell your username to the server
      this.stompClient.send("/app/topic/lobby",
          {},
          JSON.stringify({type: 'START', username: this.userGUID, content: "Want to join"})
      )
      this.statusDisplay = `Waiting for game...`;
    },


    onMessageReceived(payload) {
      let message = JSON.parse(payload.body);
      console.log(message);


      if (message.type === 'LOGIN') {
        // this.userGUID = message.username;
        // this.personalConnection.unsubscribe()
        // this.personalConnection = this.stompClient.subscribe('/topic/' + this.userGUID, this.onMessageReceived)
        // console.log(message.username + ' joined!');


        // Tell the server, that you want to start a game
        this.stompClient.send("/app/topic/lobby",
            {},
            JSON.stringify({type: 'START', username: this.userGUID, content: "Want to start the game"})
        )
      } else if (message.type === 'LEAVE') {
        this.gameActive = false;
        this.statusDisplay = 'Rival left!<br\>Restart to play again!';
        console.log(message.username + ' left!\nRestart if you want to play again!');
        this.roomConnection.unsubscribe();
        this.roomNumber = null;
        this.startingPlayer = null;
      } else if (message.type === 'ROOM') {
        // console.log(message.roomNumber);
        if (message.playerStarting != null && message.player2 != null) {
          console.log(message.playerStarting + "     "+ message.player2)
          this.gameEnded = false;
          this.startingPlayer = message.playerStarting;
          if (this.startingPlayer === this.userGUID) this.startGame();
          else {
            this.statusDisplay = `Rival's turn`;
            this.currentPlayer=O_CLASS;

          }
        }
        if (this.roomNumber == null) {
          this.roomNumber = message.roomNumber;
          this.roomConnection = this.stompClient.subscribe("/topic/room/" + this.roomNumber, this.onMessageReceived);
        }

      } else if (message.type === 'START') {
        console.log(this.startingPlayer)


      } else if (message.type === 'MOVE' && message.username !== this.userGUID) {
        console.log('Received opponent move from server:', message.content);
        this.updateBoard(message.content, O_CLASS);
        if (!this.gameEnded){
          this.statusDisplay = `Your turn`;
          if (!this.gameActive) this.startGame();
        }
      }
    },


    startGame() {
      this.statusDisplay = `Your turn`;
      this.gameActive = true;
      this.gameEnded = false;
      this.currentPlayer = X_CLASS;
    },


    handleClick(cellIndex) {
      // Check if the game is active and it's the player's turn
      if (this.gameActive && this.currentPlayer === X_CLASS && this.cells[cellIndex] === '') {
        // Update the board with the player's move
        this.updateBoard(cellIndex, X_CLASS);
        // Send move data to the server
        this.sendMoveToServer(cellIndex);
      }
    },

    updateBoard(cellIndex, currentPlayer) {
      const currentClass = currentPlayer === X_CLASS ? X_CLASS : O_CLASS;
      // Place mark on the board
      this.placeMark(cellIndex, currentClass);
      this.currentPlayer = currentClass === X_CLASS ? O_CLASS : X_CLASS
      console.log(this.currentPlayer)
    },

    placeMark(cellIndex, currentClass) {
      // Update the cells array with the player's mark
      this.cells[cellIndex] = currentClass;
      // this.$set(this.cells, cellIndex, currentClass);
      // Check for win or draw
      if (this.checkWin(currentClass)) {
        this.endGame(false, currentClass);
      } else if (this.isDraw()) {
        this.endGame(true, currentClass);
      }
    },



    checkWin(currentClass) {
      return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
          return this.cells[index] === currentClass;
        });
      });
    },

    isDraw() {
      return this.cells.every(cell => {
        return cell === X_CLASS || cell === O_CLASS;
      });
    },

    endGame(draw, currentClass) {
      this.gameActive = false;
      this.gameEnded = true;
      if (draw) {
        this.statusDisplay = `It's a Draw!`;
      } else {
        this.statusDisplay = currentClass === X_CLASS ? "You win!" : "Rival wins!";
      }
    },


    sendMoveToServer(cellIndex) {
      console.log('Sending move data to server:', cellIndex);
      this.stompClient.send("/app/room/" + this.roomNumber,
          {},
          JSON.stringify({type: "MOVE", username: this.userGUID, content: cellIndex.toString()})
      );
      if (this.gameActive) this.statusDisplay = `Rival's turn`;
    }


  },
  mounted() {
    this.connect();
  }
}



</script>

<template>
  <div class="container">
    <h1>Tic Tac Toe</h1>
    <div class="board" >
      <div v-for="(cell, index) in cells"
           :key="index"
           :data-cell="index"
           class="cell"
           @click="handleClick(index)"
           :style="{ pointerEvents: gameActive && currentPlayer === 'x' ? 'auto' : 'none' && !gameEnded && startingPlayer!=null}">
        {{ cell }}
      </div>
    </div>
    <p class="status" v-html="statusDisplay"></p>
    <button class="restart-button" @click="onLeave">Restart</button>
  </div>
</template>

<style scoped>
body {
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
  background: #181818;
}

.container {
  text-align: center;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(3, 100px);
  gap: 2px;
  background-color: #ddd;
  margin-bottom: 10px;
}

.cell {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  cursor: pointer;
  font-size: 2em;
}

.cell:hover {
  background-color: #eee;
}

.status {
  font-size: 1.5em;
  line-break: normal;
}

.restart-button {
  padding: 10px 20px;
  font-size: 1em;
  background-color: #4caf50;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

.restart-button:hover {
  background-color: #45a049;
}

.hidden{
  display: none;
}
</style>