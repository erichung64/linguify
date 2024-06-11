document.addEventListener('DOMContentLoaded', function() {
    const languageSelect = document.getElementById('language-select');
    const enableToggle = document.getElementById('enable-toggle');

    // Load settings
    chrome.storage.sync.get(['targetLang', 'pluginEnabled'], function(data) {
        if (data.targetLang) {
            languageSelect.value = data.targetLang;
        }
        if (data.pluginEnabled !== undefined) {
            enableToggle.checked = data.pluginEnabled;
        }
    });

    // Save language setting
    languageSelect.addEventListener('change', function() {
        const selectedLanguage = languageSelect.value;
        chrome.storage.sync.set({ targetLang: selectedLanguage });
    });

    // Save enable/disable setting
    enableToggle.addEventListener('change', function() {
        const pluginEnabled = enableToggle.checked;
        chrome.storage.sync.set({ pluginEnabled: pluginEnabled });
        chrome.runtime.sendMessage({ type: 'togglePlugin', enabled: pluginEnabled });
    });
});
