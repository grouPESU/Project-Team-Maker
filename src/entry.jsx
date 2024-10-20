import {createRoot} from 'react-dom/client'
import { StrictMode } from 'react'
//import Main from "./Main.jsx"
//import Admin from "./admin.jsx"
//import LoginForm from "./Login.jsx"
//import RegistrationForm from "./Register.jsx"
//import Assignment from "./Teacher.jsx"
import App from "./App"

createRoot(document.getElementById('root')).render(
        <App />
        //<RegistrationForm />
        //<Main />
        //<Admin />
        //<LoginForm />
        //<Assignment />
)
