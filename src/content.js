console.log('Content script loaded');

document.addEventListener('mouseup', async function(event) {
    let selectedText = window.getSelection().toString().trim();
    console.log('Text selected:', selectedText);

    // Remove any existing translation box
    let existingBox = document.querySelector('.translation-box');
    if (existingBox) {
        existingBox.remove();
    }

    if (selectedText) {
        try {
            const response = await sendMessageAsync({ type: 'translate', text: selectedText });
            console.log('Response from background script:', response);
            if (response && response.translation) {
                createTranslationBox(event.pageX, event.pageY, response.translation);
            }
        } catch (error) {
            console.error('Error during translation:', error);
        }
    }
});

document.addEventListener('mousedown', function(event) {
    // Remove the translation box when starting a new selection
    let existingBox = document.querySelector('.translation-box');
    if (existingBox) {
        existingBox.remove();
    }
});

function sendMessageAsync(message) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, function(response) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

function createTranslationBox(x, y, text) {
    let translationBox = document.createElement('div');
    translationBox.className = 'translation-box';
    translationBox.textContent = text;
    translationBox.style.position = 'absolute';
    translationBox.style.left = `${x}px`;
    translationBox.style.top = `${y}px`;
    translationBox.style.backgroundColor = '#fff';
    translationBox.style.border = '1px solid #ccc';
    translationBox.style.padding = '10px';
    translationBox.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    translationBox.style.zIndex = '1000';
    document.body.appendChild(translationBox);

    translationBox.addEventListener('dblclick', async function() {
        let selectedWord = window.getSelection().toString().trim();
        if (selectedWord) {
            try {
                const response = await sendMessageAsync({ type: 'translate', text: selectedWord });
                console.log('Response from background script on double-click:', response);
                if (response && response.translation) {
                    translationBox.textContent = response.translation;
                }
            } catch (error) {
                console.error('Error during double-click translation:', error);
            }
        }
    });
}
