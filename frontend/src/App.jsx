
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Generate from './pages/Generate'
import Layout from './pages/Layout.jsx'
import Login from "./pages/Login"
import Account from "./pages/Account"
import { Toaster } from "./components/ui/toaster"


function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />         {/* renders at "/" */}
                        <Route path="generate" element={<Generate />} /> {/* renders at "/generate" */}
                        <Route path="login" element={<Login />} /> {/* renders at "/login" */}
                        <Route path="account" element={<Account />} /> {/* renders at "/account" */}
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster />
        </div>
    );
}

export default App;