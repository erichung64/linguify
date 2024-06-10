chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'translate') {
        (async () => {
            try {
                const targetLang = await getTargetLang();
                const translation = await translateText(request.text, targetLang);
                sendResponse({ translation });
            } catch (error) {
                console.error('Translation error:', error);
                sendResponse({ translation: 'Translation failed' });
            }
        })();
        return true; // Keeps the message channel open for sendResponse
    }
});

async function getTargetLang() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('targetLang', function(data) {
            resolve(data.targetLang || 'en');
        });
    });
}

async function translateText(text, targetLang) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    console.log(`API Key: ${apiKey}`); // Log the API key to ensure it's being read correctly
    console.log(`Translating text: "${text}" to ${targetLang}`);

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
            console.log(`Translation successful: ${data.data.translations[0].translatedText}`);
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
