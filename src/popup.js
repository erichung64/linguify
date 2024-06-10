document.addEventListener('DOMContentLoaded', function() {
    let languageSelect = document.getElementById('language-select');
    languageSelect.addEventListener('change', function() {
        let selectedLanguage = languageSelect.value;
        chrome.storage.sync.set({targetLang: selectedLanguage});
    });

    chrome.storage.sync.get('targetLang', function(data) {
        if (data.targetLang) {
            languageSelect.value = data.targetLang;
        }
    });
});