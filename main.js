document.addEventListener('DOMContentLoaded', () => {
  // Debounce utility
  const debounce = (func, delay) => {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // 1. SCROLL REVEAL
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { 
      if (e.isIntersecting) {
        e.target.classList.add('visible'); 
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // 2. FAQ ACORDEÓN
  const faqButtons = document.querySelectorAll('.faq-q');
  faqButtons.forEach(button => {
    button.addEventListener('click', function() {
      const faqItem = this.closest('.faq-item');
      const answer = faqItem.querySelector('.faq-a');
      const icon = faqItem.querySelector('.faq-icon');
      const isOpen = answer.classList.contains('open');

      // Cerrar todos los demás
      document.querySelectorAll('.faq-a').forEach(a => {
        if (a !== answer) a.classList.remove('open');
      });
      document.querySelectorAll('.faq-icon').forEach(i => {
        if (i !== icon) i.classList.remove('rot');
      });
      document.querySelectorAll('.faq-q').forEach(q => {
        if (q !== this) q.setAttribute('aria-expanded', 'false');
      });

      // Toggle el actual
      if (!isOpen) { 
        answer.classList.add('open'); 
        icon.classList.add('rot'); 
        this.setAttribute('aria-expanded', 'true');
      } else {
        answer.classList.remove('open');
        icon.classList.remove('rot');
        this.setAttribute('aria-expanded', 'false');
      }
    });

    // Soporte para keyboard
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  });

  // 3. FORMULARIO DE CONTACTO
  const contactForm = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');

  if (contactForm) {
    contactForm.querySelectorAll('input, select').forEach(campo => {
      campo.addEventListener('input', function() {
        const errorSpan = document.getElementById(`error-${this.name}`);
        if (errorSpan) {
          errorSpan.textContent = ''; 
        }
       
        if (formMessage.classList.contains('error')) {
          formMessage.textContent = '';
          formMessage.classList.remove('error');
        }
      });
    });
  }

  // Validación de email en tiempo real
  const emailInput = document.getElementById('user-email');
  const emailError = document.getElementById('error-email');
  
  if (emailInput) {
    emailInput.addEventListener('blur', () => validateEmail());
  }

  function validateEmail() {
    if (!emailInput || !emailError) return true;
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
      emailError.textContent = 'Por favor, ingresá un email válido';
      emailInput.style.borderColor = 'var(--error)';
      return false;
    } else {
      emailError.textContent = '';
      emailInput.style.borderColor = '';
      return true;
    }
  }

  // Validación de teléfono (Argentina)
  const phoneInput = document.getElementById('user-phone');
  const phoneError = document.getElementById('error-whatsapp');
  
  if (phoneInput) {
    phoneInput.addEventListener('blur', () => validatePhone());
  }

  function validatePhone() {
    if (!phoneInput || !phoneError) return true;
    const phone = phoneInput.value.trim();
    const phoneRegex = /^[0-9\s]{6,}$/;
    
    if (phone && !phoneRegex.test(phone)) {
      phoneError.textContent = 'Por favor, ingresa un número válido (sin 0 y sin 15)';
      phoneInput.style.borderColor = 'var(--error)';
      return false;
    } else {
      phoneError.textContent = '';
      phoneInput.style.borderColor = '';
      return true;
    }
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validar
      // Limpiar mensajes de error previos
      document.querySelectorAll('.form-error').forEach(span => span.textContent = '');

      // Validar con nuestra propia lógica
      if (!contactForm.checkValidity()) {
        contactForm.querySelectorAll(':invalid').forEach(input => {
          const errorSpan = document.getElementById(`error-${input.name}`);
          if (errorSpan) {
            errorSpan.textContent = 'Este campo es obligatorio.';
          }
        });
        
        formMessage.textContent = 'Por favor, completá los campos obligatorios.';
        formMessage.classList.add('error');
        return;
      }
      
      // Validar regex personalizadas
      if (!validateEmail() || !validatePhone()) {
        formMessage.textContent = 'Por favor, revisá el formato del email o teléfono.';
        formMessage.classList.add('error');
        return;
      }

      const formData = new FormData(contactForm);

      // UI: Loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      formMessage.textContent = '';

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          formMessage.textContent = '✓ Datos guardados. Abriendo calendario...';
          formMessage.classList.remove('error');
          formMessage.classList.add('success');
          
          contactForm.reset();
          submitBtn.classList.remove('loading');

          // Abrir Calendly después de 1.5s
          setTimeout(() => {
            try {
              if (window.Calendly) {
                Calendly.initPopupWidget({
                  url: 'https://calendly.com/macarenacaceres2023/30min',
                  color: '#1a1528',
                  textColor: '#f0eeff',
                  primaryColor: '#9c6cfe'
                });
              } else {
                window.open('https://calendly.com/macarenacaceres2023/30min', '_blank');
              }
            } catch (calError) {
              console.error('Error al abrir Calendly:', calError);
              formMessage.textContent = '✓ Datos guardados. Por favor, abre tu calendario manualmente.';
            }
            
            submitBtn.disabled = false;
            formMessage.textContent = '';
          }, 1500);
        } 
        else {
          throw new Error('Error en la respuesta del servidor');
        }
      } catch (error) {
        console.error('Error:', error);
        formMessage.textContent = 'Error al enviar. Por favor, intenta de nuevo.';
        formMessage.classList.add('error');
        formMessage.classList.remove('success');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  }

  // 4. NAVEGACIÓN (Scroll compacto)
  const nav = document.getElementById('mainNav');
  if (nav) {
    const handleNavScroll = debounce(() => {
      nav.classList.toggle('nav-scrolled', window.scrollY > 40);
    }, 50);

    window.addEventListener('scroll', handleNavScroll);
  }

  // 5. EFECTO 3D EN TARJETA HERO
  const card = document.querySelector('.card-3d');
  if (card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateY(${x * 20}deg) rotateX(${-y * 10}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'rotateY(-12deg) rotateX(6deg)';
    });
  }

  // 6. SCROLL SUAVE (Botones)
  const scrollButtons = document.querySelectorAll('button[data-scroll-to]');
  scrollButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-scroll-to');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // 6b. HAMBURGER MENU MOBILE
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const mobileOverlay = document.getElementById('mobileOverlay');

  if (hamburger && navLinks) {
    const toggleMenu = (open) => {
      const isOpen = typeof open === 'boolean' ? open : !navLinks.classList.contains('open');
      navLinks.classList.toggle('open', isOpen);
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
      if (mobileOverlay) mobileOverlay.classList.toggle('active', isOpen);
    };

    hamburger.addEventListener('click', () => toggleMenu());

    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', () => toggleMenu(false));
    }

    // Cerrar el menú al hacer click en un link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  }

  // 7. LÓGICA DEL MODAL DE CURSOS
  const courseDetails = {
    "Conversación & Fluidez": "Este curso está diseñado para romper la barrera del miedo a hablar. Trabajaremos con debates, role-plays y situaciones reales. Ideal para quienes entienden el idioma al leerlo pero se bloquean al intentar comunicarse oralmente.",
    "Exámenes Internacionales": "Programa intensivo enfocado 100% en estrategias para rendir. Hacemos simulacros cronometrados, analizamos la estructura de los exámenes y te enseñamos exactamente qué buscan los evaluadores en cada habilidad.",
    "Jóvenes y adultos": "Clases de inglés desde nivel básico hasta avanzado. Dinámicas y personalizadas. Aprendemos de forma simple y con una metodología comunicativa, conectando el idioma con tus intereses. No enseñamos de manera tradicional: trabajamos con situaciones reales y métodos actuales que hacen el aprendizaje más natural y motivador.",
    "Viajes & Lifestyle": "Destinado para los amantes del turismo y viajes. Vas a aprender a enfrentar situaciones en aeropuertos, hacer check-in, pedir comida con especificaciones, ubicarte en la ciudad y manejar emergencias médicas o de transporte.",
    "Entrevistas Laborales": "Simularemos entrevistas reales orientadas a tu rubro. Chequeamos tu CV en inglés, prepararemos respuestas para las preguntas 'capciosas' de RRHH y te ayudamos a proyectar tu voz con confianza y profesionalismo.",
    "Clases particulares": "Apoyo personalizado para nivel secundario o universitario. Traes tu material, temario o trabajos prácticos y lo resolvemos. El objetivo es que entiendas todos los temas para que puedas aprobar con seguridad."
  };

  const modal = document.getElementById('courseModal');
  const modalIcon = document.getElementById('modalIcon');
  const modalDesc = document.getElementById('modalDescription');
  const modalTitle = document.getElementById('modalTitle');
  const modalCta = document.getElementById('modalCta');
  const closeModalBtn = document.querySelector('.modal-close');
  const courseInterest = document.getElementById('course-interest');
  let lastFocusedElement = null;

  if (modal) {
    // Focusable elements dentro del modal
    const getFocusableElements = () => modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    // Focus trap
    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Abrir modal al clickear curso
    document.querySelectorAll('.course-card').forEach(card => {
      const handler = function(e) {
        if (e) e.preventDefault();

        const title = this.querySelector('h3').textContent.trim();
        const icon = this.querySelector('.course-glyph').textContent.trim();

        // Inyectar datos
        modalIcon.textContent = icon;
        if (modalTitle) modalTitle.textContent = title;
        if (modalDesc) modalDesc.textContent = courseDetails[title] || 'Próximamente más detalles sobre este curso.';

        // Guardar referencia al elemento que abrió el modal
        lastFocusedElement = document.activeElement;

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Enviar focus al modal
        requestAnimationFrame(() => closeModalBtn.focus());

        // Activar focus trap
        modal.addEventListener('keydown', trapFocus);
      };

      card.addEventListener('click', handler);

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handler.call(card, e);
        }
      });
    });

    // Función unificada para cerrar
    function closeModalHandler(e) {
      if (e && e.type !== 'keydown') e.preventDefault();
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Desactivar focus trap
      modal.removeEventListener('keydown', trapFocus);

      // Devolver focus al elemento que abrió el modal
      if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
    }

    // Cerrar modal
    closeModalBtn.addEventListener('click', closeModalHandler);

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModalHandler(e);
      }
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModalHandler(e);
      }
    });

    // CTA del modal → llevar al formulario con curso pre-seleccionado
    if (modalCta) {
      modalCta.addEventListener('click', () => {
        const courseName = modalTitle ? modalTitle.textContent.trim() : '';
        if (courseInterest) courseInterest.value = courseName;
        closeModalHandler();
        const contactSection = document.getElementById('contacto');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  // Soporte para flechas en cursos (keyboard)
  document.querySelectorAll('.course-arrow').forEach(arrow => {
    arrow.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        arrow.closest('.course-card').click();
      }
    });
  });
});