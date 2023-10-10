document.addEventListener("DOMContentLoaded", function() {
    
    let currentModel = 'gpt-4';  // Default model
    let currentPrompt = 'You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.'; // Default prompt

    function updateDisplayedIdentity() {
        const identityName = document.getElementById('identity-selection').selectedOptions[0].text;
        const identityPrompt = document.getElementById('identity-selection').value;
        document.getElementById('current-identity-name').textContent = identityName;
        document.getElementById('current-identity-prompt').textContent = `"${identityPrompt}"`;
    }

    // Load the API key if it's stored in localStorage
    if (localStorage.getItem('apiKey')) {
        document.getElementById('api-key-input').value = localStorage.getItem('apiKey');
    }
    
    document.getElementById('download-btn').addEventListener('click', function() {
        let chatLog = document.getElementById('chat-box').innerHTML;
        let blob = new Blob([chatLog], { type: 'text/html' });
        let link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'chat_log.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    document.getElementById('send-btn').addEventListener('click', async () => {
        const userInput = document.getElementById('user-input').value;

        if (!userInput) {
            alert('Please enter a message.');
            return;
        }

        if(!localStorage.getItem('apiKey') || !document.getElementById('api-key-input').value){
            alert('Please provide your API key in settings.');
            document.getElementById('settings-panel').style.display = 'block'; // Open settings if API key is missing
            return;
        }

        toggleSendingState(true);  // Change the state of the send button
        appendMessage('User', userInput);
        await fetchGPTResponse(userInput, currentModel);
        toggleSendingState(false);  // Restore the send button state
        document.getElementById('user-input').value = '';
    });

    async function fetchGPTResponse(message, model) {
        const endpoint = 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('apiKey')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {role: "system", content: currentPrompt},
                    {role: "user", content: message}
                ]
            })
        });
        const data = await response.json();
        const gptResponse = data.choices[0].message.content.trim();
        typeWriterEffect('GPT', gptResponse);
    }

    function appendMessage(sender, message) {
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML += `<strong>${sender}:</strong> ${message}<br><br>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function toggleSendingState(isSending) {
        const sendBtn = document.getElementById('send-btn');
        if (isSending) {
            sendBtn.setAttribute("disabled", "disabled");
            sendBtn.querySelector('.btn-text').textContent = 'Loading...';
            sendBtn.querySelector('.loader').style.display = 'inline-block';
        } else {
            sendBtn.removeAttribute("disabled");
            sendBtn.querySelector('.btn-text').textContent = 'Send';
            sendBtn.querySelector('.loader').style.display = 'none';
        }
    }

    function typeWriterEffect(sender, message, index = 0) {
        const chatBox = document.getElementById('chat-box');
        if (index === 0) {
            chatBox.innerHTML += `<strong>${sender}:</strong> `;
        }
        if (index < message.length) {
            chatBox.innerHTML += message.charAt(index);
            index++;
            setTimeout(() => typeWriterEffect(sender, message, index), 5);
        } else {
            chatBox.innerHTML += `<br><br>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    document.getElementById('settings-btn').addEventListener('click', () => {
        const settingsPanel = document.getElementById('settings-panel');
        settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
    });

    document.getElementById('save-settings-btn').addEventListener('click', () => {
        currentModel = document.getElementById('model-selection').value;
        currentPrompt = document.getElementById('identity-selection').value;
        updateDisplayedIdentity();
        document.getElementById('settings-panel').style.display = 'none';
    });

    document.getElementById('save-api-key-btn').addEventListener('click', () => {
        const apiKey = document.getElementById('api-key-input').value;
        if (!apiKey) {
            alert('Please enter your API key.');
            return;
        }
        localStorage.setItem('apiKey', apiKey);
        alert('API Key saved!');
    });

    document.getElementById('delete-api-key-btn').addEventListener('click', () => {
        localStorage.removeItem('apiKey');
        document.getElementById('api-key-input').value = '';
        alert('API Key deleted!');
    });

    document.getElementById('save-custom-identity-btn').addEventListener('click', () => {
        const customName = document.getElementById('custom-identity-name').value;
        const customPrompt = document.getElementById('custom-identity-prompt').value;
        if (!customName || !customPrompt) {
            alert('Please provide both a name and a prompt for the custom identity.');
            return;
        }
        const option = document.createElement('option');
        option.value = customPrompt;
        option.textContent = customName;
        document.getElementById('identity-selection').appendChild(option);
        document.getElementById('custom-identity-name').value = '';
        document.getElementById('custom-identity-prompt').value = '';
    });

    document.getElementById('delete-identity-btn').addEventListener('click', () => {
        const selectedIdentity = document.getElementById('identity-selection');
        selectedIdentity.remove(selectedIdentity.selectedIndex);
    });
});
