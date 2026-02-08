  document.querySelector('button[type="button"]').addEventListener('click', async () => {
            const email = document.getElementById('InputUser').value;
            const password = document.getElementById('InputPassword').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    window.location.href = 'dashboard';
                } else {
                    alert(data.msg || 'Errore durante il login');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Errore di connessione');
            }
        });