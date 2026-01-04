export const Registrazione = () => {
    return `<div class="d-flex justify-content-center align-items-center min-vh-100">
         <div class="card loginregistrazione-card">
             <div class="card-body">
                    <h2 class="card-title"  style="text-align: center;">Registrazione</h2>
                    <div class="mb-3">
                        <p class="form-label">Email</p>
                        <input type="email" class="form-control" id="InputEmail">
                    </div>
                    <div class="mb-3">
                        <p class="form-label">Nome Utente</p>
                        <input type="email" class="form-control" id="InputName">
                    </div>
                    <div class="mb-3">
                        <p class="form-label">Passwors</p>
                        <input type="password" class="form-control" id="InputPassword">
                    </div>
                    <div class="mb-3">
                        <p class="form-label">Ripeti Passwors</p>
                        <input type="password" class="form-control" id="InputRepeatPassword">
                    </div>
                    <div class="text-center">
                            <button type="button" class="btn btn-light" style="color: #ff6347;">Registrati</button>
                    </div>
                    <hr>
                    <div class="text-center">
                        <button class="btn btn-light" style="color: #ff6347;">
                            <img src="https://img.icons8.com/color/48/000000/google-logo.png" width="24" height="24">
                            registrati con Google
                        </button>
                    </div>
                </div>
         </div>
    </div>`
}