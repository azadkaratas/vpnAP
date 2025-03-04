document.addEventListener('DOMContentLoaded', function () {
    const contentArea = document.getElementById('content-area');
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    let isSidebarOpen = false; // Track sidebar state manually

    // Clear intervals on page change
    function clearIntervals() {
        clearInterval(window.timerUpdateDeviceStatus);
        clearInterval(window.intervalID_vpn);
    }

    // Load script dynamically
    function loadScript(scriptPath) {
        const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
        if (existingScript) existingScript.remove();

        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = () => console.log(`${scriptPath} loaded`);
        script.onerror = () => console.error(`Failed to load ${scriptPath}`);
        document.body.appendChild(script);
    }

    // Navigation event listeners
    const navLinks = [
        { id: 'statusLink', script: 'status.js' },
        { id: 'wifiSettings', script: 'wifi_settings.js' },
        { id: 'vpnSettings', script: 'vpn_settings.js' },
        { id: 'updateFirmware', script: 'update.js' }
    ];

    navLinks.forEach(link => {
        const element = document.getElementById(link.id);
        if (element) {
            element.addEventListener('click', function (e) {
                e.preventDefault();
                clearIntervals();
                contentArea.innerHTML = ''; // Clear content
                loadScript(link.script);

                // Highlight active link
                document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');

                // Close sidebar on small screens
                if (window.innerWidth < 768) {
                    isSidebarOpen = false;
                    sidebar.style.transform = 'translateX(-100%)';
                    console.log('Sidebar closed by link click');
                }
            });
        } else {
            console.error(`Element with ID ${link.id} not found`);
        }
    });

    // Toggle sidebar with hamburger button
    hamburgerBtn.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent any default behavior
        if (window.innerWidth < 768) {
            isSidebarOpen = !isSidebarOpen;
            sidebar.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
            console.log('Sidebar toggled:', isSidebarOpen);
        }
    });

    // Close sidebar when clicking outside on small screens
    document.addEventListener('click', function (e) {
        if (window.innerWidth < 768 && isSidebarOpen) {
            const isClickInsideSidebar = sidebar.contains(e.target);
            const isClickOnHamburger = e.target.closest('.hamburger-btn');

            if (!isClickInsideSidebar && !isClickOnHamburger) {
                isSidebarOpen = false;
                sidebar.style.transform = 'translateX(-100%)';
                console.log('Sidebar closed by outside click');
            }
        }
    });

    // Handle resize to ensure sidebar visibility on large screens
    function handleResize() {
        if (window.innerWidth >= 768) {
            sidebar.style.transform = 'translateX(0)'; // Always visible on large screens
            isSidebarOpen = true; // Reset state
        } else if (!isSidebarOpen) {
            sidebar.style.transform = 'translateX(-100%)'; // Hidden on small screens unless opened
        }
    }

    // Initial state
    handleResize();
    window.addEventListener('resize', handleResize);

    // Load status page by default
    loadScript('status.js');
});