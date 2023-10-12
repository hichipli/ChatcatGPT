document.addEventListener("DOMContentLoaded", function() {
    let customIdentities = JSON.parse(localStorage.getItem('customIdentities') || '[]');
    customIdentities.forEach(identity => {
        const option = document.createElement('option');
        option.value = identity.prompt;
        option.textContent = identity.name;
        document.getElementById('identity-selection').appendChild(option);
    });
    
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
    
    function getFormattedDate() {
        const date = new Date();
        const monthName = getMonthName(date.getMonth() + 1); 
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${monthName}-${day}-${year}`;
    }
    
    function getMonthName(monthNumber) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return months[monthNumber - 1];
    }
    
    document.getElementById('download-btn').addEventListener('click', function() {
        const downloadModal = document.getElementById('download-modal');
        if (downloadModal) {
            downloadModal.style.display = "block";
        } else {
            let chatLog = document.getElementById('chat-box').innerText;
            const formattedDate = getFormattedDate();
            const date = new Date();
            const time = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
            let dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(chatLog);
            let link = document.createElement('a');
            link.href = dataUri;
            link.download = `ChatcatGPT-${formattedDate}-${time}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });    
    
    document.getElementById('send-btn').addEventListener('click', async () => {
        const userInput = document.getElementById('user-input').value;

        if (!userInput) {
            alert('Please enter a message.');
            return;
        }

        if(!localStorage.getItem('apiKey') || !document.getElementById('api-key-input').value){
            alert('Please provide your API key in settings.');
            document.getElementById('settings-modal').style.display = 'block'; // Open settings if API key is missing
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
        const settingsModal = document.getElementById('settings-modal');
        settingsModal.style.display = "block";
    });
    
    document.getElementsByClassName('close-btn')[0].addEventListener('click', () => {
        const settingsModal = document.getElementById('settings-modal');
        settingsModal.style.display = "none";
    });
    
    window.onclick = function(event) {
        const settingsModal = document.getElementById('settings-modal');
        const downloadModal = document.getElementById('download-modal');
        if (event.target === settingsModal) {
            settingsModal.style.display = "none";
        }
        if (event.target === downloadModal) {
            downloadModal.style.display = "none";
        }
    }    

    document.getElementById('save-settings-btn').addEventListener('click', () => {
        currentModel = document.getElementById('model-selection').value;
        currentPrompt = document.getElementById('identity-selection').value;
        document.getElementById('current-model-name').textContent = currentModel;
        updateDisplayedIdentity();
        document.getElementById('settings-modal').style.display = 'none';
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

        let customIdentities = JSON.parse(localStorage.getItem('customIdentities') || '[]');
        customIdentities.push({
            name: customName,
            prompt: customPrompt
        });
        localStorage.setItem('customIdentities', JSON.stringify(customIdentities));
    });

    document.getElementById('delete-identity-btn').addEventListener('click', () => {
        const selectedIdentity = document.getElementById('identity-selection');
        selectedIdentity.remove(selectedIdentity.selectedIndex);
    });

    if (document.getElementById('download-modal')) {
        const closeBtn = document.getElementsByClassName('close-btn')[1]; // Assuming the second close-btn is for the download modal
        closeBtn.addEventListener('click', function() {
            const downloadModal = document.getElementById('download-modal');
            downloadModal.style.display = "none";
        });

        const downloadOptionBtns = document.querySelectorAll('.download-option-btn');
        downloadOptionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const fileType = btn.getAttribute('data-type');
                downloadChatLog(fileType);
            });
        });
    }

    function downloadChatLog(fileType) {
        let chatLog = document.getElementById('chat-box').innerText;
        const formattedDate = getFormattedDate(); 
        const date = new Date();
        const time = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
        const filename = `ChatcatGPT-${formattedDate}-${time}`;

        switch (fileType) {
            case 'txt':
                saveAsTextFile(chatLog, filename + '.txt');
                break;
            case 'md':
                saveAsTextFile(chatLog, filename + '.md');
                break;
            // TODO: Implement PDF and DOCX export
            default:
                alert('File type not supported yet.');
        }

        const downloadModal = document.getElementById('download-modal');
        if (downloadModal) {
            downloadModal.style.display = "none";
        }
    }

    function saveAsTextFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }
    
    const closeButtons = document.getElementsByClassName('close-btn');
    for (let btn of closeButtons) {
        btn.addEventListener('click', function() {
            const modal = btn.closest('.modal'); 
            if (modal) {
                modal.style.display = "none";
            }
        });
    }

    // Display privacy modal if the user hasn't made a choice before
    if (!localStorage.getItem('dataSharingPreference')) {
        document.getElementById('privacy-modal').style.display = 'block';
    }

    document.getElementById('agree-btn').addEventListener('click', function() {
        // User agrees to share data
        localStorage.setItem('dataSharingPreference', 'agree');
        document.getElementById('privacy-modal').style.display = 'none';
    });

    document.getElementById('disagree-btn').addEventListener('click', function() {
        // User disagrees to share data
        localStorage.setItem('dataSharingPreference', 'disagree');
        alert('We respect your choice. You can use this tool without sharing any data.');
        document.getElementById('privacy-modal').style.display = 'none';
    });

    // Send data based on user's choice
    function sendInteractionToServer(userMessage, aiResponse) {
        if (localStorage.getItem('dataSharingPreference') !== 'agree') {
            // Return directly if the user chose not to share
            return;
        }

        fetch('YOUR_BACKEND_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: userMessage,
                ai: aiResponse,
                timestamp: new Date().toISOString()
            })
        });
    }

    document.getElementById('data-sharing-checkbox').addEventListener('change', function(event) {
        if (event.target.checked) {
            // If checked, set to 'agree'
            localStorage.setItem('dataSharingPreference', 'agree');
        } else {
            // If unchecked, set to 'disagree'
            localStorage.setItem('dataSharingPreference', 'disagree');
        }
    });
    
    if (localStorage.getItem('dataSharingPreference') === 'agree') {
        document.getElementById('data-sharing-checkbox').checked = true;
    } else {
        document.getElementById('data-sharing-checkbox').checked = false;
    }
});
