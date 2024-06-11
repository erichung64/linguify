document.addEventListener('mouseup', async function(event) {
    // Check if the mouseup event happened within the translation box
    let isInsideTranslationBox = event.target.closest('.translation-box');
    if (isInsideTranslationBox) return;

    let selectedText = window.getSelection().toString().trim();
    // Remove any existing translation box
    removeExistingBox();

    if (selectedText) {
        try {
            const response = await sendMessageAsync({ type: 'translate', text: selectedText });
            if (response && response.translation) {
                createTranslationBox(event.pageX, event.pageY, response.translation, selectedText);
            }
        } catch (error) {
            console.error('Error during translation:', error);
        }
    }
});

document.addEventListener('mousedown', function(event) {
    // Check if the mousedown event happened within the translation box
    let isInsideTranslationBox = event.target.closest('.translation-box');
    if (isInsideTranslationBox) return;

    // Remove the translation box when starting a new selection
    removeExistingBox();
});

function removeExistingBox() {
    let existingBox = document.querySelector('.translation-box');
    if (existingBox) {
        existingBox.remove();
    }
}

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

function createTranslationBox(x, y, translation, originalText) {
    let translationBox = document.createElement('div');
    translationBox.className = 'translation-box';

    // Content sections
    let content = document.createElement('div');
    content.className = 'translation-content';

    let originalSection = document.createElement('div');
    originalSection.className = 'text-section';
    originalSection.textContent = originalText;

    let translatedSection = document.createElement('div');
    translatedSection.className = 'translated-section';
    translatedSection.textContent = translation;

    content.appendChild(originalSection);
    content.appendChild(translatedSection);
    translationBox.appendChild(content);

    // Actions
    let actions = document.createElement('div');
    actions.className = 'actions';

    let copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(originalText + ' - ' + translation).then(() => {
            alert('Copied to clipboard');
        });
    });

    let defineButton = document.createElement('button');
    defineButton.textContent = 'Define';
    defineButton.className = 'disabled';
    defineButton.addEventListener('click', async () => {
        if (!defineButton.classList.contains('disabled')) {
            let selectedWord = window.getSelection().toString().trim();
            if (selectedWord) {
                try {
                    const response = await sendMessageAsync({ type: 'define', text: selectedWord });
                    console.log('Response from background script on define:', response);
                    if (response && response.definition) {
                        createDefinitionSection(translationBox, selectedWord, response.definition);
                    }
                } catch (error) {
                    console.error('Error during definition lookup:', error);
                }
            }
        }
    });

    actions.appendChild(copyButton);
    actions.appendChild(defineButton);
    translationBox.appendChild(actions);

    // Event listener to enable the define button
    originalSection.addEventListener('mouseup', () => {
        let selectedWord = window.getSelection().toString().trim();
        if (selectedWord) {
            defineButton.classList.remove('disabled');
        } else {
            defineButton.classList.add('disabled');
        }
    });

    translationBox.style.position = 'absolute';
    translationBox.style.left = `${x}px`;
    translationBox.style.top = `${y}px`;

    document.body.appendChild(translationBox);
}

function createDefinitionSection(translationBox, word, definitionData) {
    // Remove any existing definition section
    let existingDefinitionSection = translationBox.querySelector('.definition');
    if (existingDefinitionSection) {
        existingDefinitionSection.remove();
    }

    let definitionSection = document.createElement('div');
    definitionSection.className = 'definition';
    
    let wordElement = document.createElement('h3');
    wordElement.textContent = word;
    definitionSection.appendChild(wordElement);
    
    if (definitionData[0].phonetic) {
        let phoneticsElement = document.createElement('p');
        phoneticsElement.innerHTML = `<strong>Phonetic:</strong> ${definitionData[0].phonetic}`;
        definitionSection.appendChild(phoneticsElement);
    }

    if (definitionData[0].phonetics && definitionData[0].phonetics.length > 0) {
        let phoneticsAudioElement = document.createElement('div');
        phoneticsAudioElement.innerHTML = '<strong>Phonetics:</strong>';
        definitionData[0].phonetics.forEach(phonetic => {
            if (phonetic.audio) {
                let audioElement = document.createElement('audio');
                audioElement.controls = true;
                audioElement.src = phonetic.audio;
                phoneticsAudioElement.appendChild(audioElement);
            } else {
                phoneticsAudioElement.innerHTML += ` ${phonetic.text}`;
            }
        });
        definitionSection.appendChild(phoneticsAudioElement);
    }

    if (definitionData[0].origin) {
        let originElement = document.createElement('p');
        originElement.innerHTML = `<strong>Origin:</strong> ${definitionData[0].origin}`;
        definitionSection.appendChild(originElement);
    }

    definitionData[0].meanings.forEach(meaning => {
        let partOfSpeechElement = document.createElement('h4');
        partOfSpeechElement.textContent = meaning.partOfSpeech;
        definitionSection.appendChild(partOfSpeechElement);

        meaning.definitions.forEach(def => {
            let definitionElement = document.createElement('p');
            definitionElement.innerHTML = `<strong>Definition:</strong> ${def.definition}`;
            definitionSection.appendChild(definitionElement);

            if (def.example) {
                let exampleElement = document.createElement('p');
                exampleElement.innerHTML = `<strong>Example:</strong> ${def.example}`;
                definitionSection.appendChild(exampleElement);
            }

            if (def.synonyms && def.synonyms.length > 0) {
                let synonymsElement = document.createElement('p');
                synonymsElement.innerHTML = `<strong>Synonyms:</strong> ${def.synonyms.join(', ')}`;
                definitionSection.appendChild(synonymsElement);
            }

            if (def.antonyms && def.antonyms.length > 0) {
                let antonymsElement = document.createElement('p');
                antonymsElement.innerHTML = `<strong>Antonyms:</strong> ${def.antonyms.join(', ')}`;
                definitionSection.appendChild(antonymsElement);
            }
        });
    });

    translationBox.appendChild(definitionSection);
}
