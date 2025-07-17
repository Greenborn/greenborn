<template>
  <div>
    <button class="chatbot-fab" @click="toggleChat">
      💬
    </button>
    <div v-if="open" class="chatbot-window">
      <div class="chatbot-header">
        <span>Bugon - Chatbot</span>
        <button class="close-btn" @click="toggleChat">×</button>
      </div>
      <div class="chatbot-messages" ref="messagesEnd">
        <div v-for="(msg, idx) in messages" :key="idx" :class="msg.from">
          {{ msg.text }}
        </div>
      </div>
      <form class="chatbot-input" @submit.prevent="sendMessage">
        <input v-model="input" type="text" placeholder="Escribe tu mensaje..." autocomplete="off" />
        <button type="submit">Enviar</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const open = ref(false)
const input = ref('')
const messages = ref([
  { from: 'bot', text: '¡Hola! ¿En qué puedo ayudarte?' }
])
const messagesEnd = ref(null)

function toggleChat() {
  open.value = !open.value
  nextTick(() => {
    if (open.value && messagesEnd.value) {
      messagesEnd.value.scrollTop = messagesEnd.value.scrollHeight
    }
  })
}

function sendMessage() {
  if (!input.value.trim()) return
  messages.value.push({ from: 'user', text: input.value })
  const userMsg = input.value.toLowerCase()
  input.value = ''
  setTimeout(() => {
    if (userMsg.includes('hola')) {
      messages.value.push({ from: 'bot', text: '¡Hola! ¿Cómo estás?' })
    } else if (userMsg.includes('precio')) {
      messages.value.push({ from: 'bot', text: 'Para información de precios, por favor visita nuestra sección de servicios.' })
    } else {
      messages.value.push({ from: 'bot', text: 'Lo siento, soy un bot simple. ¿Puedes reformular tu pregunta?' })
    }
    nextTick(() => {
      if (messagesEnd.value) {
        messagesEnd.value.scrollTop = messagesEnd.value.scrollHeight
      }
    })
  }, 700)
}
</script>

<style scoped>
.chatbot-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2e7d32;
  color: #fff;
  border: none;
  font-size: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
  z-index: 1000;
  transition: background 0.2s;
}
.chatbot-fab:hover {
  background: #388e3c;
}
.chatbot-window {
  position: fixed;
  right: 24px;
  bottom: 90px;
  width: 320px;
  max-width: 90vw;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  z-index: 1001;
}
.chatbot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2e7d32;
  color: #fff;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
}
.chatbot-messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background: #f9f9f9;
  min-height: 120px;
  max-height: 260px;
}
.bot {
  text-align: left;
  color: #2e7d32;
  margin-bottom: 8px;
}
.user {
  text-align: right;
  color: #1976d2;
  margin-bottom: 8px;
}
.chatbot-input {
  display: flex;
  border-top: 1px solid #eee;
  padding: 8px;
}
.chatbot-input input {
  flex: 1;
  border: none;
  outline: none;
  padding: 8px;
  border-radius: 4px;
  font-size: 1rem;
  background: #f1f1f1;
}
.chatbot-input button {
  margin-left: 8px;
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}
.chatbot-input button:hover {
  background: #388e3c;
}
</style> 