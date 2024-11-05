function loadVPNSettingsPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">VPN Configuration</div>
        </div>
    `;
}

loadVPNSettingsPage();