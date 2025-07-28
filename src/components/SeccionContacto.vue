<template>
<div class="contact-section seccion" id="seccion-contacto">
  <div class="container-modern">
    
    <!-- Header de la sección -->
    <div class="section-header">
      <h2 class="section-title">Contáctanos</h2>
      <p class="section-subtitle">
        ¿Tienes un proyecto en mente? Hablemos sobre cómo podemos ayudarte a hacerlo realidad
      </p>
    </div>

    <div class="contact-content">
      
      <!-- Información de contacto -->
      <div class="contact-info">
        <div class="info-card">
          <div class="info-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <h3>Ubicación</h3>
          <p>Tandil, Buenos Aires, Argentina</p>
        </div>
        
        <div class="info-card">
          <div class="info-icon">
            <i class="fas fa-clock"></i>
          </div>
          <h3>Horarios</h3>
          <p>A convenir</p>
        </div>
      </div>

      <!-- Formulario de contacto -->
      <div class="contact-form-container">
        <div class="form-card">
          <h3>Envíanos un mensaje</h3>
          <p class="form-subtitle">Completa el formulario y te responderemos en menos de 24 horas</p>
          
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
                <i class="fas fa-paper-plane"></i>
                Enviar Mensaje
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>

  </div>
</div>
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

function sendMessage() {
  // Aquí iría la lógica para enviar el mensaje
  console.log('Enviando mensaje:', form_.value)
  
  // Resetear formulario
  form_.value = {
    name: '',
    surname: '',
    email: '',
    tel: '',
    message: ''
  }
}
</script>

<style scoped>
.contact-section {
  background: var(--bg-gradient-dark);
  position: relative;
}

.contact-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--primary-green) 50%, transparent 100%);
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeInUp 0.8s ease-out;
}

.section-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--accent-green) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.3rem);
  color: var(--text-gray);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

.contact-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.info-card {
  background: var(--bg-gradient-card);
  border: 1px solid var(--border-light);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: var(--transition-medium);
  animation: fadeInUp 0.8s ease-out both;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-green);
}

.info-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  transition: var(--transition-medium);
}

.info-card:hover .info-icon {
  transform: scale(1.1);
}

.info-icon i {
  font-size: 1.5rem;
  color: var(--text-light);
}

.info-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 0.5rem;
}

.info-card p {
  color: var(--text-gray);
  font-size: 1rem;
}

.contact-form-container {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.form-card {
  background: var(--bg-gradient-card);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  padding: 3rem;
}

.form-card h3 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: var(--text-gray);
  margin-bottom: 2rem;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: var(--text-light);
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group input,
.form-group textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 1rem;
  color: var(--text-light);
  font-size: 1rem;
  transition: var(--transition-medium);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-green);
  box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.1);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-gray);
}

.form-actions {
  text-align: center;
  margin-top: 1rem;
}

.form-actions .btn-modern {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
}

.form-actions .btn-modern i {
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .contact-info {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .form-card {
    padding: 2rem 1.5rem;
  }
  
  .contact-info {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .form-card {
    padding: 1.5rem 1rem;
  }
  
  .info-card {
    padding: 1.5rem;
  }
}
</style>