import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import 'pannellum/build/pannellum.css'
import 'pannellum'
import 'mdb-react-ui-kit/dist/css/mdb.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
