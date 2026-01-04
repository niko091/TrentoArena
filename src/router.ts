import { Home } from './pages/Home'
import { Profile } from './pages/Profile'
import { Map } from './pages/Map'
import { Login } from './pages/Login'
import { Registrazione } from './pages/Registrazione'

const routes: Record<string, () => string> = {
    '': Home,
    '#profile': Profile,
    '#map': Map,
    '#login':Login,
    '#registrazione' : Registrazione
}

export const router = () => {
    const hash = window.location.hash
    const component = routes[hash] || Home
    return component()
}
