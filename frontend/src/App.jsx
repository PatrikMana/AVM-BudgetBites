import SplitText from "./components/SplitText.jsx";
import StaggeredMenu from "./components/StaggeredMenu.jsx";

const menuItems = [
    { label: "Home", ariaLabel: "Go to home page", link: "/" },
    { label: "About", ariaLabel: "Learn about us", link: "/about" },
    { label: "Services", ariaLabel: "View our services", link: "/services" },
    { label: "Contact", ariaLabel: "Get in touch", link: "/contact" },
];

const socialItems = [
    { label: "Twitter", link: "https://twitter.com" },
    { label: "GitHub", link: "https://github.com" },
    { label: "LinkedIn", link: "https://linkedin.com" },
];

function App() {
    const handleAnimationComplete = () => {
        console.log("All letters have animated!");
    };

    return (
        <div className="w-screen h-screen bg-[#1a1a1a] flex items-center justify-center relative overflow-hidden">
            {/* Centered SplitText */}
            <SplitText
                text="Hello, GSAP!"
                className="text-6xl font-bold text-white text-center"
                delay={100}
                duration={0.6}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                onLetterAnimationComplete={handleAnimationComplete}
            />

            <div style={{ height: '100vh', background: '#1a1a1a' }}>
                <StaggeredMenu
                    position="right"
                    items={menuItems}
                    socialItems={socialItems}
                    displaySocials={true}
                    displayItemNumbering={true}
                    menuButtonColor="#fff"
                    openMenuButtonColor="#fff"
                    changeMenuColorOnOpen={true}
                    colors={['#B19EEF', '#5227FF']}
                    logoUrl="/path-to-your-logo.svg"
                    accentColor="#ff6b6b"
                    onMenuOpen={() => console.log('Menu opened')}
                    onMenuClose={() => console.log('Menu closed')}
                />
            </div>
        </div>
    );
}

export default App;
