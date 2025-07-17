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
      <div class="chatbot-note">
        💬 ¿Necesitas ayuda personalizada? Chatea con un humano por WhatsApp
      </div>
      <div class="chatbot-quick-replies">
        <button class="quick-reply" @click="openWhatsApp('542494279833', 'Hola, quiero información sobre desarrollo de APPs')">
          Desarrollo de APP's
        </button>
        <button class="quick-reply" @click="openWhatsApp('54249467516', 'Hola, quiero información sobre testing')">
          Testing
        </button>
      </div>
      <div class="chatbot-note-bot">
        🤖 Para consultas rápidas puedes usar nuestro chatbot.
      </div>
      <div class="chatbot-messages" ref="messagesEnd">
        <div v-for="(msg, idx) in messages" :key="idx" :class="msg.from">
          {{ msg.text }}
        </div>
        <div v-if="loading" class="bot loading">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <form class="chatbot-input" @submit.prevent="sendMessage">
        <input v-model="input" type="text" placeholder="Escribe tu mensaje..." autocomplete="off" :disabled="loading" />
        <button type="submit" :disabled="loading">Enviar</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'

const open = ref(false)
const input = ref('')
const loading = ref(false)
const userId = ref()
const messages = ref([
  { from: 'bot', text: '¡Hola! ¿En qué puedo ayudarte?' }
])
const messagesEnd = ref(null)

onMounted(() => {
  // Generar userId aleatorio
  userId.value = 'user_' + Math.random().toString(36).substr(2)
})

function toggleChat() {
  open.value = !open.value
  nextTick(() => {
    if (open.value && messagesEnd.value) {
      messagesEnd.value.scrollTop = messagesEnd.value.scrollHeight
    }
  })
}

async function sendMessage() {
  if (!input.value.trim() || loading.value) return
  
  const userMessage = input.value
  messages.value.push({ from: 'user', text: userMessage })
  input.value = ''
  loading.value = true
  
  nextTick(() => {
    if (messagesEnd.value) {
      messagesEnd.value.scrollTop = messagesEnd.value.scrollHeight
    }
  })

  try {
    const response = await fetch('http://localhost:6789/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId.value,
        message: userMessage,
        botName: 'bugon'
      })
    })

    if (!response.ok) {
      throw new Error('Error en la petición')
    }

    const data = await response.json()
    messages.value.push({ from: 'bot', text: data.response })
  } catch (error) {
    console.error('Error al enviar mensaje:', error)
    messages.value.push({ from: 'bot', text: 'Lo siento, hubo un error al procesar tu mensaje. ¿Puedes intentar de nuevo?' })
  } finally {
    loading.value = false
    nextTick(() => {
      if (messagesEnd.value) {
        messagesEnd.value.scrollTop = messagesEnd.value.scrollHeight
      }
    })
  }
}

function openWhatsApp(phone, text) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
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
.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}
.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2e7d32;
  animation: loading 1.4s infinite ease-in-out;
}
.loading-dots span:nth-child(1) {
  animation-delay: 0.32s;
}
.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}
@keyframes loading {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
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
.chatbot-input input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
.chatbot-input button:hover:not(:disabled) {
  background: #388e3c;
}
.chatbot-input button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.chatbot-quick-replies {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 8px 0 0 0;
}
.quick-reply {
  background: #25d366;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}
.quick-reply:hover {
  background: #128c7e;
}
.chatbot-note {
  text-align: center;
  font-size: 0.85rem;
  color: #666;
  padding: 8px 12px;
  background: #f0f0f0;
  border-bottom: 1px solid #eee;
}
.chatbot-note-bot {
  text-align: center;
  font-size: 0.85rem;
  color: #1976d2;
  padding: 8px 12px 0 12px;
}
</style> 