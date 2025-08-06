<template>
  <div>
    <button class="chatbot-fab" @click="toggleChat">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
        <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12Z" fill="currentColor"/>
      </svg>
    </button>
    <div v-if="open" class="chatbot-window">
      <div class="chatbot-header">
        <div class="chatbot-header-content">
          <div class="chatbot-brand">
            <span class="chatbot-title">GREENBORN</span>
          </div>
        </div>
        <button class="close-btn" @click="toggleChat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div class="chatbot-content">
        <div class="chatbot-note">
          <div class="note-icon">💬</div>
          <div class="note-text">
            <strong>¿Necesitas ayuda personalizada?</strong>
            <span>Chatea con un humano por WhatsApp</span>
          </div>
        </div>
        
        <div class="chatbot-quick-replies">
          <button class="quick-reply" @click="openWhatsApp('542494279833', 'Hola, quiero información sobre desarrollo de APPs')">
            <span class="quick-reply-icon">📱</span>
            <span>Desarrollo de APP's</span>
          </button>
          <button class="quick-reply" @click="openWhatsApp('54249467516', 'Hola, quiero información sobre testing')">
            <span class="quick-reply-icon">🧪</span>
            <span>Testing</span>
          </button>
        </div>
        
        <div class="chatbot-note-bot">
          <div class="bot-icon">🤖</div>
          <span>Para consultas rápidas puedes usar nuestro chatbot</span>
        </div>
        
        <div class="chatbot-messages" ref="messagesEnd">
          <div v-for="(msg, idx) in messages" :key="idx" :class="['message', msg.from]">
            <div class="message-content">
              {{ msg.text }}
            </div>
          </div>
          <div v-if="loading" class="message bot loading">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
        
        <form class="chatbot-input" @submit.prevent="sendMessage">
          <div class="input-container">
            <input 
              v-model="input" 
              type="text" 
              placeholder="Escribe tu mensaje..." 
              autocomplete="off" 
              :disabled="loading" 
            />
            <button type="submit" :disabled="loading" class="send-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
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
    const apiUrl = import.meta.env.VITE_CHATBOT_API_URL
    const response = await fetch(apiUrl, {
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 100%);
  color: var(--text-light);
  border: none;
  font-size: 1.5rem;
  box-shadow: var(--shadow-hover);
  cursor: pointer;
  z-index: 1000;
  transition: var(--transition-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 170, 0.2);
}

.chatbot-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 60px rgba(0, 212, 170, 0.3);
}

.chatbot-window {
  position: fixed;
  right: 24px;
  bottom: 90px;
  width: 380px;
  max-width: 90vw;
  max-height: 90vh;
  height: auto;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: var(--shadow-hover);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  border: 1px solid var(--border-light);
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.chatbot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 100%);
  color: var(--text-dark);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chatbot-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chatbot-brand {
  display: flex;
  flex-direction: column;
}

.chatbot-title {
  font-family: 'BebasNeue', sans-serif;
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--text-dark);
}

.chatbot-subtitle {
  font-size: 0.75rem;
  opacity: 0.9;
  font-weight: 300;
  color: var(--text-dark);
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: var(--text-light);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
  backdrop-filter: blur(10px);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.chatbot-content {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 300px;
  max-height: 70vh;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.chatbot-note {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(0, 212, 170, 0.1);
  border-bottom: 1px solid var(--border-light);
}

.note-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.note-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.note-text strong {
  font-size: 0.9rem;
  color: var(--primary-green);
}

.note-text span {
  font-size: 0.8rem;
  color: var(--text-gray);
}

.chatbot-quick-replies {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border-light);
}

.quick-reply {
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  color: var(--text-light);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-medium);
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
}

.quick-reply:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(37, 211, 102, 0.4);
}

.quick-reply-icon {
  font-size: 1rem;
}

.chatbot-note-bot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(0, 212, 170, 0.05);
  border-bottom: 1px solid var(--border-light);
}

.bot-icon {
  font-size: 1rem;
}

.chatbot-note-bot span {
  font-size: 0.8rem;
  color: var(--text-gray);
}

.chatbot-messages {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  margin-bottom: 8px;
}

.message.bot {
  justify-content: flex-start;
}

.message.user {
  justify-content: flex-end;
}

.message-content {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.message.bot .message-content {
  background: rgba(0, 212, 170, 0.1);
  color: var(--primary-green);
  border: 1px solid rgba(0, 212, 170, 0.2);
}

.message.user .message-content {
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 100%);
  color: var(--text-light);
}

.loading-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 212, 170, 0.1);
  border-radius: 18px;
  border: 1px solid rgba(0, 212, 170, 0.2);
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary-green);
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
  padding: 16px 20px;
  border-top: 1px solid var(--border-light);
  background: rgba(255, 255, 255, 0.02);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 25px;
  padding: 4px;
  border: 1px solid var(--border-light);
}

.chatbot-input input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  background: transparent;
  color: var(--text-light);
}

.chatbot-input input::placeholder {
  color: var(--text-gray);
}

.chatbot-input input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 100%);
  color: var(--text-light);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-medium);
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(0, 212, 170, 0.4);
}

.send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Scrollbar personalizada para el chat */
.chatbot-messages::-webkit-scrollbar {
  width: 6px;
}

.chatbot-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chatbot-messages::-webkit-scrollbar-thumb {
  background: var(--primary-green);
  border-radius: 3px;
}

.chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: var(--secondary-green);
}

/* Responsive */
@media (max-width: 768px) {
  .chatbot-window {
    right: 16px;
    left: 16px;
    width: auto;
    max-width: none;
  }
  
  .chatbot-quick-replies {
    flex-direction: column;
  }
  
  .quick-reply {
    justify-content: center;
  }
}
</style> 