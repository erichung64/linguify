let pluginEnabled = true;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'togglePlugin') {
        pluginEnabled = request.enabled;
        sendResponse({ success: true });
    } else if (pluginEnabled && request.type === 'translate') {
        handleTranslate(request, sendResponse);
        return true; // Keeps the message channel open for sendResponse
    } else if (pluginEnabled && request.type === 'define') {
        handleDefine(request, sendResponse);
        return true; // Keeps the message channel open for sendResponse
    }
});

async function handleTranslate(request, sendResponse) {
    try {
        const targetLang = await getTargetLang();
        const translation = await translateText(request.text, targetLang);
        sendResponse({ translation });
    } catch (error) {
        console.error('Translation error:', error);
        sendResponse({ translation: 'Translation failed' });
    }
}

async function handleDefine(request, sendResponse) {
    try {
        const definition = await getWordDefinition(request.text);
        sendResponse({ definition });
    } catch (error) {
        console.error('Definition error:', error);
        sendResponse({ definition: 'Definition failed' });
    }
}

async function getTargetLang() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('targetLang', function(data) {
            resolve(data.targetLang || 'en');
        });
    });
}

async function translateText(text, targetLang) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    try {
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify({
                q: text,
                target: targetLang,
                format: 'text'
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error: ${response.status} - ${response.statusText} - ${errorText}`);
            return 'Translation failed';
        }

        const data = await response.json();
        if (data.data && data.data.translations && data.data.translations.length > 0) {
            return data.data.translations[0].translatedText;
        } else {
            console.error('Translation response error:', data);
            return 'Translation failed';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return 'Error occurred';
    }
}

async function getWordDefinition(word) {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error: ${response.status} - ${response.statusText} - ${errorText}`);
            return 'Definition failed';
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        return 'Error occurred';
    }
}
