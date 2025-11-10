import StaggeredMenu from '../components/StaggeredMenu.jsx'
import cookingLogo from '../assets/Cooking.png'

const menuItems = [
    { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
    { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
    { label: 'Login', ariaLabel: 'Login', link: '/login' },
];

const socialItems = [
    { label: 'Twitter', link: 'https://twitter.com' },
    { label: 'GitHub', link: 'https://github.com' },
    { label: 'LinkedIn', link: 'https://linkedin.com' }
];

// Color configuration - uses Tailwind theme colors from tailwind.config.js
const SIDEBAR_COLORS = {
    buttonClosed: '#B19EEF',    // brand-primary
    buttonOpen: '#ffffff',       // white
    panelLayers: ['#B19EEF', '#5227FF'], // brand-primary & brand-secondary
    accent: '#B19EEF',           // brand-primary
};

export default function Layout() {
    return (
        <div className="staggered-menu h-screen bg-black">
            <div style={{ height: '100vh', background: '#1a1a1a' }}>
                <StaggeredMenu
                    position="left"
                    items={menuItems}
                    socialItems={socialItems}
                    displaySocials={true}
                    displayItemNumbering={true}
                    className=""
                    menuButtonColor={SIDEBAR_COLORS.buttonClosed}
                    openMenuButtonColor={SIDEBAR_COLORS.buttonOpen}
                    changeMenuColorOnOpen={true}
                    colors={SIDEBAR_COLORS.panelLayers}
                    logoUrl={cookingLogo}
                    accentColor={SIDEBAR_COLORS.accent}
                    onMenuOpen={() => console.log('Menu opened')}
                    onMenuClose={() => console.log('Menu closed')}
                />
            </div>
        </div>
    )
}
