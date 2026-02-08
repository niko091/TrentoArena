  document.querySelector('button[type="button"]').addEventListener('click', async () => {
            const email = document.getElementById('InputEmail').value;
            const username = document.getElementById('InputName').value;
            const password = document.getElementById('InputPassword').value;
            const repeatPassword = document.getElementById('InputRepeatPassword').value;

            if (password !== repeatPassword) {
                alert('Le password non corrispondono');
                return;
            }

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    window.location.href = 'dashboard'; 
                } else {
                    alert(data.msg || 'Errore durante la registrazione');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Errore di connessione');
            }
        });