
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Layout from './pages/Layout.jsx'
import Login from "./pages/Login"
import { Toaster } from "./components/ui/toaster"


function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />         {/* renders at "/" */}
                        <Route path="about" element={<About />} /> {/* renders at "/about" */}
                        <Route path="login" element={<Login />} /> {/* renders at "/login" */}
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster />
        </div>
    );
}

export default App;