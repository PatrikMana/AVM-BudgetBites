
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Generate from './pages/Generate'
import Layout from './pages/Layout.jsx'
import Login from "./pages/Login"
import Account from "./pages/Account"
import ProtectedRoute from "./components/ProtectedRoute"
import { Toaster } from "./components/ui/toaster"


function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />         {/* renders at "/" - shows landing or dashboard */}
                        <Route path="dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } /> {/* renders at "/dashboard" - PROTECTED */}
                        <Route path="generate" element={
                            <ProtectedRoute>
                                <Generate />
                            </ProtectedRoute>
                        } /> {/* renders at "/generate" - PROTECTED */}
                        <Route path="login" element={<Login />} /> {/* renders at "/login" */}
                        <Route path="account" element={
                            <ProtectedRoute>
                                <Account />
                            </ProtectedRoute>
                        } /> {/* renders at "/account" - PROTECTED */}
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster />
        </div>
    );
}

export default App;