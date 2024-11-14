function loadVPNSettingsPage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="sub-content-area">
            <div class="sub-content-area-header">VPN Configuration</div>
            <form id="vpnSettingsForm" class="mt-4">
                <div class="form-group">
                    <label>Username:</label>
                    <input type="text" id="vpnUsername" name="vpnUsername" class="form-control">
                </div>
                <div class="form-group mt-3">
                    <label for="vpnPassword">Password:</label>
                    <input type="text" id="vpnPassword" name="vpnPassword" class="form-control">
                </div>
                <button type="submit" class="btn btn-primary mt-4">Save Configuration</button>
            </form>
        </div>
    `;
}

loadVPNSettingsPage();