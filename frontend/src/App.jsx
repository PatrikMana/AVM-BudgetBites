import './App.css'
import SplitText from './components/SplitText.jsx'
import StaggeredMenu from './components/StaggeredMenu.jsx'

function App() {
    const menuItems = [
        { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
        { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
        { label: 'Services', ariaLabel: 'View our services', link: '/services' },
        { label: 'Contact', ariaLabel: 'Get in touch', link: '/contact' }
    ]

    const socialItems = [
        { label: 'Twitter', link: 'https://twitter.com' },
        { label: 'GitHub', link: 'https://github.com' },
        { label: 'LinkedIn', link: 'https://linkedin.com' }
    ]

    return (
        <div className="app-layout">
            {/* Left side menu */}
            <aside className="menu-panel">
                <StaggeredMenu
                    position="left"
                    items={menuItems}
                    socialItems={socialItems}
                    displaySocials={true}
                    displayItemNumbering={true}
                    menuButtonColor="#fff"
                    openMenuButtonColor="#fff"
                    changeMenuColorOnOpen={true}
                    colors={['#B19EEF', '#5227FF']}
                    accentColor="#ff6b6b"
                />
            </aside>

            {/* Center content */}
            <main className="main-content">
                <SplitText
                    text="Welcome to BudgetBites"
                    className="splittext-heading"
                    delay={100}
                    duration={0.6}
                    ease="power3.out"
                    splitType="chars"
                    from={{ opacity: 0, y: 40 }}
                    to={{ opacity: 1, y: 0 }}
                />
            </main>
        </div>
    )
}

export default App
