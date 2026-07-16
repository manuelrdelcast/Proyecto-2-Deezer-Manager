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
            submitBtn.innerHTML = `<span class="btn-spinner" style="border-top-color: var(--primary); border-color: rgba(139, 92, 246, 0.3); width: 2rem; height: 2rem;"></span>`;

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
            
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const password = document.getElementById('regPassword').value;

            const users = JSON.parse(localStorage.getItem('users'));
            const userExists = users.find(user => user.email === email);

            if (userExists) {
                alert('Este correo electrónico ya está registrado.');
            } else {
                users.push({ name, email, password });
                localStorage.setItem('users', JSON.stringify(users));
                alert('¡Registro exitoso! Redireccionando...');
                window.location.href = 'index.html';
            }
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
});