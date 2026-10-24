<template>
<section class="contact-section seccion" id="seccion-contacto">
  <div class="container-modern">

    <!-- Header de la sección -->
    <div class="section-header">
      <p class="section-eyebrow">Contacto</p>
      <h2 class="section-title">Hablemos de tu <em>proyecto</em></h2>
      <p class="section-subtitle">
        Contanos qué tenés en mente y te respondemos con una propuesta clara.
      </p>
    </div>

    <div class="contact-content">

      <!-- Información de contacto -->
      <div class="contact-info">
        <div class="info-card">
          <div class="info-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <div>
            <h3>Ubicación</h3>
            <p>Tandil, Buenos Aires, Argentina</p>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <i class="fas fa-envelope"></i>
          </div>
          <div>
            <h3>Email</h3>
            <p><a href="mailto:info@greenborn.com">info@greenborn.com</a></p>
          </div>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div>
            <h3>Horarios</h3>
            <p>Lunes a viernes, a convenir</p>
          </div>
        </div>
      </div>

      <!-- Formulario de contacto -->
      <div class="contact-form-container">
        <div class="form-card">
          <h3>Envíanos un mensaje</h3>
          <p class="form-subtitle">Completá el formulario y te respondemos en menos de 24 horas.</p>
          
          <form @submit.prevent="sendMessage" class="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Nombre</label>
                <input 
                  type="text" 
                  id="name" 
                  v-model="form_.name"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="surname">Apellido</label>
                <input 
                  type="text" 
                  id="surname" 
                  v-model="form_.surname"
                  placeholder="Tu apellido"
                  required
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="form_.email"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="tel">Teléfono</label>
                <input 
                  type="tel" 
                  id="tel" 
                  v-model="form_.tel"
                  placeholder="+54 9 1234 5678"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="message">Mensaje</label>
              <textarea 
                id="message" 
                rows="6"
                v-model="form_.message"
                placeholder="Cuéntanos sobre tu proyecto..."
                required
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn-modern">
                <i class="fas fa-paper-plane" aria-hidden="true"></i>
                Enviar mensaje
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>

    <div v-if="modal.visible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-icon">
          <i :class="modal.success ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
        </div>
        <div class="modal-message">{{ modal.message }}</div>
        <button class="btn-modern" @click="modal.visible = false">Cerrar</button>
      </div>
    </div>

  </div>
</section>
</template>

<script setup>
import { ref } from 'vue'

const form_ = ref({
  name: '',
  surname: '',
  email: '',
  tel: '',
  message: ''
})

const modal = ref({
  visible: false,
  message: '',
  success: true
})

function sendMessage() {
  const url = import.meta.env.VITE_TELEGRAM_URL
  const token = import.meta.env.VITE_TELEGRAM_TOKEN

  // Formatear mensaje compatible con Telegram
  const msg = `<b>Nuevo contacto web</b>\n` +
    `<b>Nombre:</b> ${form_.value.name} ${form_.value.surname}\n` +
    `<b>Email:</b> ${form_.value.email}\n` +
    `<b>Teléfono:</b> ${form_.value.tel || '-'}\n` +
    `<b>Mensaje:</b> ${form_.value.message}`

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      alias: 'ALERTASGREENBORN',
      message: msg,
      parse_mode: 'HTML',
      token: token
    })
  })
  .then(res => res.json())
  .then(data => {
    modal.value = {
      visible: true,
      message: '¡Mensaje enviado correctamente!',
      success: true
    }
    form_.value = {
      name: '',
      surname: '',
      email: '',
      tel: '',
      message: ''
    }
  })
  .catch(err => {
    modal.value = {
      visible: true,
      message: 'Hubo un error al enviar el mensaje. Intenta nuevamente.',
      success: false
    }
  })
}
</script>

<style scoped>
.contact-content {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.6fr);
  gap: var(--sp-5);
  align-items: start;
}

.contact-info {
  display: grid;
  gap: var(--sp-3);
}

.info-card {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 1.25rem 1.4rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: linear-gradient(160deg, var(--surface-raised-strong) 0%, var(--surface-raised) 100%);
  transition:
    transform var(--transition-medium),
    border-color var(--transition-medium),
    box-shadow var(--transition-medium);
  animation: fadeInUp 0.8s ease-out both;
}

.info-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-green);
  box-shadow: var(--shadow-card), var(--ring-green);
}

.info-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-green);
  border-radius: var(--r-sm);
  background: rgba(0, 212, 170, 0.1);
  color: var(--primary-green);
  font-size: 1rem;
}

.info-card h3 {
  margin-bottom: 0.15rem;
  color: var(--text-light);
  font-size: var(--fs-sm);
  font-weight: 650;
}

.info-card p {
  color: var(--text-gray);
  font-size: var(--fs-sm);
  line-height: 1.5;
}

.info-card p a {
  color: var(--text-body);
}

.info-card p a:hover {
  color: var(--primary-green);
}

.contact-form-container {
  animation: fadeInUp 0.8s ease-out 0.15s both;
}

.form-card {
  padding: var(--sp-6);
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  background:
    radial-gradient(ellipse at top right, rgba(0, 212, 170, 0.08) 0%, transparent 55%),
    linear-gradient(160deg, var(--surface-raised-strong) 0%, var(--surface-raised) 100%);
  box-shadow: var(--shadow-card);
}

.form-card h3 {
  margin-bottom: 0.35rem;
  color: var(--text-light);
  font-size: var(--fs-h3);
  font-weight: 700;
}

.form-subtitle {
  margin-bottom: var(--sp-5);
  color: var(--text-gray);
  font-size: var(--fs-sm);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.4rem;
  color: var(--text-body);
  font-size: var(--fs-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  background: rgba(0, 0, 0, 0.25);
  color: var(--text-light);
  font-family: inherit;
  font-size: var(--fs-sm);
  line-height: 1.5;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-group textarea {
  resize: vertical;
  min-height: 9rem;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-faint);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-green);
  box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.14);
}

.form-actions {
  margin-top: var(--sp-2);
}

.form-actions .btn-modern {
  width: 100%;
}

.form-actions .btn-modern i {
  font-size: 0.85rem;
}

@media (max-width: 1024px) {
  .contact-content {
    grid-template-columns: 1fr;
  }

  .contact-info {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-card {
    padding: var(--sp-4);
  }

  .contact-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .form-card {
    padding: var(--sp-3);
  }

  .info-card {
    padding: 1rem;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-3);
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  z-index: 5000;
}

.modal-content {
  width: min(24rem, 100%);
  padding: 2.25rem 2rem;
  text-align: center;
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  background: var(--surface-2);
  box-shadow: var(--shadow-hover);
}

.modal-icon {
  margin-bottom: var(--sp-2);
  color: var(--primary-green);
  font-size: 2.5rem;
}

.modal-message {
  margin-bottom: var(--sp-4);
  color: var(--text-light);
  font-size: var(--fs-body);
}

.modal-content .btn-modern {
  width: auto;
  min-width: 8rem;
  padding: 0.7rem 1.5rem;
  font-size: var(--fs-sm);
}
</style>
