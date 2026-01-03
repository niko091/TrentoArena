export const Login = () => {
    return `<div class="d-flex justify-content-center align-items-center min-vh-100">
        <div class="card loginregistrazione-card">
            <div class="card-body">
                <h2 class="card-title"  style="text-align: center;">Login</h2>
                <div class="mb-3">
                    <p class="form-label">Email o nome</p>
                    <input type="email" class="form-control" id="InputUser">
                </div>
                <div class="mb-3">
                    <p class="form-label">Password</p>
                    <input type="password" class="form-control" id="InputPassword">
                </div>
                <div class="text-center">
                     <button type="button" class="btn btn-light" style="color: #ff6347;">Login</button>
                     <p><small>Non hai un account? <a style="color: white;" href="#registrazione">registrati</a></small></p>
                </div>
                <hr>
                <div class="text-center">
                    <button class="btn btn-light" style="color: #ff6347;">
                        <img src="https://img.icons8.com/color/48/000000/google-logo.png" width="24" height="24">
                        Continua con Google
                    </button>
                </div>
            </div>
        </div>
    </div>`
}