document.addEventListener('DOMContentLoaded', () => {
    
    // Creación de base de datos de usuarios en localStorage si no existe
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }

    // === 1. FLUJO DE INICIO DE SESIÓN (index.html) ===
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.textContent.trim();

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="btn-spinner"></span>`;

            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = document.getElementById('password').value;

            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('users'));
                const validUser = users.find(user => user.email === email && user.password === password);

                if (validUser) {
                    localStorage.setItem('session_active', 'true');
                    localStorage.setItem('logged_user', JSON.stringify({ name: validUser.name, email: validUser.email }));
                    window.location.href = 'buscador.html';
                } else {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    alert('Credenciales incorrectas. Verifica tu correo y contraseña.');
                }
            }, 800);
        });
    }

    // === 2. FLUJO DE REGISTRO (registro.html) ===
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // CORRECCIÓN: Se agregó la lógica del botón y el spinner
            const submitBtn = registerForm.querySelector('button[type="submit"]') || document.getElementById('submitBtn');
            const originalText = submitBtn.textContent.trim();

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="btn-spinner"></span>`;

            
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const password = document.getElementById('regPassword').value;

            // CORRECCIÓN: Se agregó el setTimeout para que el spinner sea visible
            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('users'));
                const userExists = users.find(user => user.email === email);

                if (userExists) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    alert('Este correo electrónico ya está registrado.');
                } else {
                    users.push({ name, email, password });
                    localStorage.setItem('users', JSON.stringify(users));
                    alert('¡Registro exitoso! Redireccionando...');
                    window.location.href = 'index.html';
                }
            }, 800);
        });
    }

    // === 3. FLUJO DE RECUPERACIÓN (recuperar-contraseña.html) ===
    const recoverForm = document.getElementById('recoverForm');
    if (recoverForm) {
        recoverForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('recoverEmail').value.trim().toLowerCase();
            const users = JSON.parse(localStorage.getItem('users'));
            const userExists = users.find(user => user.email === email);

            if (userExists) {
                alert(`Se ha enviado un enlace de restauración a: ${email}\n(Simulación - Tu contraseña es: "${userExists.password}")`);
                window.location.href = 'index.html';
            } else {
                alert('El correo electrónico ingresado no coincide con ningún usuario.');
            }
        });
    }

    // === 4. CONTROL DE SESIÓN SEGURO ===
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('session_active');
            localStorage.removeItem('logged_user');
            window.location.href = 'index.html';
        });
    }

    // === 5. TOGGLE VISIBILIDAD DE CONTRASEÑA ===
    const EYE_OPEN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const EYE_OFF_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    document.addEventListener('click', (e) => {
        const btnEye = e.target.closest('.btn-eye');
        if (!btnEye) return;

        e.preventDefault();

        const input = btnEye.previousElementSibling;
        if (!input || input.tagName !== 'INPUT') return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btnEye.innerHTML = isPassword ? EYE_OFF_SVG : EYE_OPEN_SVG;
        btnEye.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
});