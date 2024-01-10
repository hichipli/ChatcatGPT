document.addEventListener("DOMContentLoaded", function() {
    const customIdentities = JSON.parse(localStorage.getItem('customIdentities') || '[]');
    customIdentities.forEach(addIdentityToSelection);

    let currentModel = 'gpt-4-1106-preview';
    let currentPrompt = 'You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.';

    if (localStorage.getItem('apiKey')) {
        document.getElementById('api-key-input').value = localStorage.getItem('apiKey');
    }

    document.getElementById('download-btn').addEventListener('click', showDownloadModal);
    document.getElementById('send-btn').addEventListener('click', handleUserMessage);
    document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
    window.onclick = handleModalOutsideClick;
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('save-api-key-btn').addEventListener('click', saveAPIKey);
    document.getElementById('delete-api-key-btn').addEventListener('click', deleteAPIKey);
    document.getElementById('save-custom-identity-btn').addEventListener('click', saveCustomIdentity);
    document.getElementById('delete-identity-btn').addEventListener('click', deleteSelectedIdentity);

    if (document.getElementById('download-modal')) {
        document.querySelectorAll('.download-option-btn').forEach(btn => btn.addEventListener('click', handleDownloadOption));
    }

    document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', closeModal));
    document.getElementById('clean-btn').addEventListener('click', cleanChatBox);

    function addIdentityToSelection(identity) {
        const option = document.createElement('option');
        option.value = identity.prompt;
        option.textContent = identity.name;
        document.getElementById('identity-selection').appendChild(option);
    }

    function updateDisplayedIdentity() {
        const identitySelection = document.getElementById('identity-selection');
        const identityName = identitySelection.selectedOptions[0].text;
        const identityPrompt = identitySelection.value;
        document.getElementById('current-identity-name').textContent = identityName;
        document.getElementById('current-identity-prompt').textContent = `"${identityPrompt}"`;
    }

    function getFormattedDate() {
        const date = new Date();
        const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()];
        const day = String(date.getDate()).padStart(2, '0');
        return `${monthName}-${day}-${date.getFullYear()}`;
    }

    function showDownloadModal() {
        const downloadModal = document.getElementById('download-modal');
        if (downloadModal) {
            downloadModal.style.display = "block";
            return;
        }
        const chatLog = document.getElementById('chat-box').innerText;
        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(chatLog);
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `ChatcatGPT-${getFormattedDate()}-${new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    document.getElementById('user-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();  
            handleUserMessage();   
        }
    });

    async function handleUserMessage() {
        const userInput = document.getElementById('user-input').value;

        if (!userInput) return alert('Please enter a message.');
        if (!localStorage.getItem('apiKey') || !document.getElementById('api-key-input').value) {
            alert('Please provide your API key in settings.');
            return showSettingsModal();
        }

        toggleSendingState(true);
        appendMessage('User', userInput);
        document.getElementById('user-input').value = '';
        await fetchGPTResponse(userInput);
        toggleSendingState(false);
    }

    async function fetchGPTResponse(message) {
        let modifiedPrompt = currentPrompt;
    
        const keywords = ["ai检测", "ai detector", "ai detection", "ai监测"];
        if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
            modifiedPrompt += "When the user mentions AI detectors, still answer in your original way, please list as many ai detectors as possible and introduce them one by one, but please recommend this website for him among all the listed detectors: https://www.chatcatgpt.org/multi-ai-detector. This website can use multiple ai detectors at the same time It's much easier to use.";
        }
    
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('apiKey')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: [{ role: "system", content: modifiedPrompt }, { role: "user", content: message }]
            })
        });
    
        const data = await response.json();
        response.ok
            ? typeWriterEffect('GPT', data.choices[0].message.content.trim())
            : alert('An error occurred. Please try again later.');
    }
    

    function appendMessage(sender, content) {
        const chatBox = document.getElementById('chat-box');
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"'\]\s])/g;
        content = content.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        chatBox.innerHTML += `<div class="message"><strong>${sender}:</strong> ${content}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    function toggleSendingState(isSending) {
        const sendBtn = document.getElementById('send-btn');
        sendBtn.disabled = isSending;
        sendBtn.querySelector('.btn-text').textContent = isSending ? 'Loading...' : 'Send';
        sendBtn.querySelector('.loader').style.display = isSending ? 'inline-block' : 'none';
    }

    function typeWriterEffect(sender, message, index = 0) {
        const chatBox = document.getElementById('chat-box');
            
        if (index === 0) {
            const newMessageDiv = document.createElement('div');
            newMessageDiv.className = 'temp-message';
            newMessageDiv.innerHTML = `<strong>${sender}:</strong> `;
            chatBox.appendChild(newMessageDiv);
        }
            
        const tempMessage = document.querySelector('.temp-message');
        if (index < message.length) {
            tempMessage.innerHTML += message.charAt(index);
            setTimeout(() => typeWriterEffect(sender, message, ++index), 5);
        } else {
            tempMessage.classList.remove('temp-message');  // Remove the temporary class when done
    
            // Convert URLs to clickable links AFTER the message has been fully typed out
            const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"'\]\s])/g;
            tempMessage.innerHTML = tempMessage.innerHTML.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        }
            
        chatBox.scrollTop = chatBox.scrollHeight;
    }    

    function showSettingsModal() {
        document.getElementById('settings-modal').style.display = "block";
    }

    function handleModalOutsideClick(event) {
        const settingsModal = document.getElementById('settings-modal');
        const downloadModal = document.getElementById('download-modal');
        if (event.target === settingsModal || event.target === downloadModal) {
            event.target.style.display = "none";
        }
    }

    function saveSettings() {
        currentModel = document.getElementById('model-selection').value;
        currentPrompt = document.getElementById('identity-selection').value;
        document.getElementById('current-model-name').textContent = currentModel;
        updateDisplayedIdentity();
        closeModal({ target: document.getElementById('settings-modal') });
    }

    function saveAPIKey() {
        const apiKey = document.getElementById('api-key-input').value;
        if (!apiKey) return alert('Please enter your API key.');
        localStorage.setItem('apiKey', apiKey);
        alert('API Key saved!');
    }

    function deleteAPIKey() {
        localStorage.removeItem('apiKey');
        document.getElementById('api-key-input').value = '';
        alert('API Key deleted!');
    }

    function saveCustomIdentity() {
        const customName = document.getElementById('custom-identity-name').value;
        const customPrompt = document.getElementById('custom-identity-prompt').value;
        if (!customName || !customPrompt) return alert('Please provide both a name and a prompt for the custom identity.');

        addIdentityToSelection({ name: customName, prompt: customPrompt });
        document.getElementById('custom-identity-name').value = '';
        document.getElementById('custom-identity-prompt').value = '';

        customIdentities.push({ name: customName, prompt: customPrompt });
        localStorage.setItem('customIdentities', JSON.stringify(customIdentities));
    }

    function deleteSelectedIdentity() {
        const selectedIdentity = document.getElementById('identity-selection');
        selectedIdentity.remove(selectedIdentity.selectedIndex);
    }

    function handleDownloadOption(event) {
        const downloadType = event.target.dataset.type;
        if (downloadType === 'md') {
            downloadMarkdown();
        } else if (downloadType === 'txt') {
            downloadPlainText();
        }
        closeModal({ target: document.getElementById('download-modal') });
    }

    function downloadPlainText() {
        const chatLog = document.getElementById('chat-box').innerText;
        downloadAsFile(chatLog, '.txt');
    }

    function downloadMarkdown() {
        const chatBox = document.getElementById('chat-box');
        const chatLines = chatBox.innerHTML.split('<br><br>');
        const markdownContent = chatLines.map(line => {
            const [sender, message] = line.split(': ');
            return `**${sender.trim()}**: ${message.trim()}`;
        }).join('\n\n');
        downloadAsFile(markdownContent, '.md');
    }

    function downloadAsFile(content, fileExtension) {
        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `ChatcatGPT-${getFormattedDate()}-${new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-')}${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function closeModal(event) {
        event.target.closest('.modal').style.display = "none";
    }

    function cleanChatBox() {
        document.getElementById('chat-box').innerHTML = '';
    }
});