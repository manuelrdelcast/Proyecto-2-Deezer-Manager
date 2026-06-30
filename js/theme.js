document.addEventListener('DOMContentLoaded', () => {
    
    const themeToggle = document.getElementById('btnTheme');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') {
            themeToggle.checked = true;
        }
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});