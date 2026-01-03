import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/main.css'
import { Navbar } from './components/Navbar'
import { router } from './router'

const render = () => {
  const app = document.querySelector<HTMLDivElement>('#app')!
  const hash = window.location.hash

  if(hash==='#login' || hash==='#registrazione'){
    app.innerHTML =`
    <div id="content">
        ${router()}
      </div>
    `
  }else{
    app.innerHTML = `
    <div class="container">
      ${Navbar()}
      <div id="content">
        ${router()}
      </div>
    </div>
    `
  }

  // Re-attach listeners for home page if needed, or handle globally
  if (!hash || hash === '#') {
    document.querySelector('#start-btn')?.addEventListener('click', () => {
      alert('Welcome to the future! 🚀')
    })
  }
}

// Initial render
render()

// Listen for hash changes
window.addEventListener('hashchange', render)
