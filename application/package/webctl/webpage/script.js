document.addEventListener('DOMContentLoaded', function () {
    const contentArea = document.getElementById('content-area');

    clearInterval(window.intervalID_cpu);
    clearInterval(window.intervalID_vpn);

    function loadScript(scriptPath) {
        const script = document.createElement('script');
        script.src = scriptPath;
        document.body.appendChild(script);
    }

    
    document.getElementById('wifiSettings').addEventListener('click', function (event) {
        event.preventDefault();
        clearInterval(window.intervalID_cpu);
        clearInterval(window.intervalID_vpn);
        loadScript('wifi_settings.js');
    });

    document.getElementById('statusLink').addEventListener('click', function (event) {
        event.preventDefault();
        clearInterval(window.intervalID_cpu);
        clearInterval(window.intervalID_vpn);
        loadScript('status.js');
    });
    
    document.getElementById('vpnSettings').addEventListener('click', function (event) {
        event.preventDefault();
        clearInterval(window.intervalID_cpu);
        clearInterval(window.intervalID_vpn);
        loadScript('vpn_settings.js');
    });

    loadScript('status.js');
    
});
