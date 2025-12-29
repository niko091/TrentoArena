import { Home } from './pages/Home'
import { Profile } from './pages/Profile'
import { Map } from './pages/Map'

const routes: Record<string, () => string> = {
    '': Home,
    '#profile': Profile,
    '#map': Map
}

export const router = () => {
    const hash = window.location.hash
    const component = routes[hash] || Home
    return component()
}
