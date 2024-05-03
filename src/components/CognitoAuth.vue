<script setup>
import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

import { Amplify } from 'aws-amplify';
import Game from "@/components/Game.vue";

import awsconfig from './aws-exports.js';

Amplify.configure(awsconfig);
</script>

<template>
  <authenticator>
    <template v-slot="{ user, signOut }">
      <h1>Hello {{ user.username }}!</h1>
      <Game :username="user.username"></Game>
      <button @click="signOut">Sign Out</button>
    </template>
  </authenticator>
</template>
<style scoped>
template {
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
h1{
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

button {
  padding: 10px 20px;
  font-size: 1em;
  background-color: #4caf50;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  text-align: center;
}

button:hover {
  background-color: #45a049;
}

.hidden{
  display: none;
}
</style>