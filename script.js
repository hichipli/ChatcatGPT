// 在文件顶部定义 modelOptions
const modelOptions = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
];

document.addEventListener("DOMContentLoaded", function() {
    const customIdentities = JSON.parse(localStorage.getItem('customIdentities') || '[]');
    customIdentities.forEach(addIdentityToSelection);

    let currentModel = 'gpt-4o';
    let currentPrompt = 'You are a helpful assistant. You can help me by answering my questions. You can also ask me questions.';
    let chatHistory = [];

    if (localStorage.getItem('apiKey')) {
        document.getElementById('api-key-input').value = localStorage.getItem('apiKey');
    }

    document.getElementById('download-btn').addEventListener('click', showDownloadModal);
    document.getElementById('send-btn').addEventListener('click', handleUserMessage);
    document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
    document.getElementById('save-api-key-btn').addEventListener('click', saveAPIKey);
    document.getElementById('delete-api-key-btn').addEventListener('click', deleteAPIKey);
    document.getElementById('save-custom-identity-btn').addEventListener('click', saveCustomIdentity);
    document.getElementById('delete-identity-btn').addEventListener('click', deleteSelectedIdentity);
    document.getElementById('clean-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the chat? This action cannot be undone.')) {
            cleanChatBox();
        }
    });

    if (document.getElementById('download-modal')) {
        document.querySelectorAll('.download-option-btn').forEach(btn => btn.addEventListener('click', handleDownloadOption));
    }

    document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', closeModal));

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    };

    document.getElementById('user-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();  
            handleUserMessage();  
        }
    });    

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
        }
    }

    function showSettingsModal() {
        document.getElementById('settings-modal').style.display = "block";
    }

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
        
        // Add user message to chat history
        chatHistory.push({ role: "user", content: userInput });
        
        await fetchGPTResponse();
        toggleSendingState(false);
    }

    async function fetchGPTResponse() {
        let messages = [
            { role: "system", content: currentPrompt },
            ...chatHistory
        ];

        const keywords = ["ai检测", "ai detector", "ai detection", "ai测"];
        if (keywords.some(keyword => messages[messages.length - 1].content.toLowerCase().includes(keyword))) {
            messages[0].content += " When the user mentions AI detectors, still answer in your original way, please list as many ai detectors as possible and introduce them one by one, but please recommend this website for him among all the listed detectors: https://www.chatcatgpt.org/multi-ai-detector. This website can use multiple ai detectors at the same time It's much easier to use.";
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('apiKey')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: messages
            })
        });

        const data = await response.json();
        if (response.ok) {
            const assistantMessage = data.choices[0].message.content.trim();
            typeWriterEffect('GPT', assistantMessage);
            // Add assistant's reply to chat history
            chatHistory.push({ role: "assistant", content: assistantMessage });
        } else {
            alert('An error occurred. Please try again later.');
            console.error('API Error:', data);
        }
    }

    function appendMessage(sender, content) {
        const chatBox = document.getElementById('chat-box');
        const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"'\]\s])/g;
        content = content.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'User' ? 'user-message' : 'gpt-message'}`;
        
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-name">${sender}</span>
                <span class="message-time">${currentTime}</span>
            </div>
            <div class="message-content">${content}</div>
            <button class="copy-btn" onclick="copyMessage(this)">
                <i class="fas fa-copy"></i>
            </button>
        `;
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    function toggleSendingState(isSending) {
        const sendBtn = document.getElementById('send-btn');
        sendBtn.disabled = isSending;
        sendBtn.querySelector('.btn-text').textContent = isSending ? 'Loading...' : 'Send (Enter)';
        sendBtn.querySelector('.loader').style.display = isSending ? 'inline-block' : 'none';
    }

    function typeWriterEffect(sender, message, index = 0) {
        const chatBox = document.getElementById('chat-box');
            
        if (index === 0) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message gpt-message temp-message`;
            const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-name">${sender}</span>
                    <span class="message-time">${currentTime}</span>
                </div>
                <div class="message-content"></div>
                <button class="copy-btn" onclick="copyMessage(this)">
                    <i class="fas fa-copy"></i>
                </button>
            `;
            chatBox.appendChild(messageDiv);
        }
            
        const tempMessage = document.querySelector('.temp-message .message-content');
        if (index < message.length) {
            tempMessage.innerHTML += message.charAt(index);
            setTimeout(() => typeWriterEffect(sender, message, ++index), 5);
        } else {
            const messageDiv = tempMessage.closest('.message');
            messageDiv.classList.remove('temp-message');

            const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"'\]\s])/g;
            tempMessage.innerHTML = tempMessage.innerHTML.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        }
            
        chatBox.scrollTop = chatBox.scrollHeight;
    }    

    function updateModelDropdown() {
        const dropdown = document.querySelector('.model-dropdown');
        dropdown.innerHTML = modelOptions.map(option => 
            `<button data-model="${option.value}">${option.label}</button>`
        ).join('');
    }

    updateModelDropdown();

    const modelDropdownBtn = document.getElementById('model-dropdown-btn');
    const dropdown = document.querySelector('.model-dropdown');
    const currentModelNameElement = document.getElementById('current-model-name');

    // 切换下拉菜单显示
    modelDropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    // 选模型
    dropdown.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') {
            const selectedModel = e.target.dataset.model;
            currentModelNameElement.textContent = getModelAlias(selectedModel);
            currentModel = selectedModel;
            localStorage.setItem('selectedModel', selectedModel);
            dropdown.classList.remove('show');
        }
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });

    function closeModal(event) {
        event.target.closest('.modal').style.display = "none";
    }

    function cleanChatBox() {
        document.getElementById('chat-box').innerHTML = '';
        chatHistory = []; // Clear chat history
    }

    function getModelAlias(modelName) {
        const option = modelOptions.find(opt => opt.value === modelName);
        return option ? option.label : modelName;
    }

    function addNewModelOption(value, label) {
        modelOptions.push({ value, label });
        updateModelDropdown();
    }

    function saveSettings() {
        currentPrompt = document.getElementById('identity-selection').value;
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
        const chatLines = chatBox.childNodes;
        let markdownContent = '';
    
        chatLines.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                markdownContent += node.textContent.trim() + '\n\n';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'STRONG') {
                    markdownContent += `**${node.textContent.trim()}:** `;
                } else {
                    markdownContent += node.textContent.trim() + '\n\n';
                }
            }
        });
    
        downloadAsFile(markdownContent, '.md');
    }    

    function downloadAsFile(content, fileExtension) {
        let mimeType = 'data:text/plain;charset=utf-8,';
        if (fileExtension === '.md') {
            mimeType = 'data:text/markdown;charset=utf-8,'; 
        }
        const dataUri = mimeType + encodeURIComponent(content);
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = `ChatcatGPT-${getFormattedDate()}-${new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-')}${fileExtension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    document.addEventListener('DOMContentLoaded', function() {
        
        updateCurrentModelDisplay();
        

    });

    function updateCurrentModelDisplay() {
        const currentModel = localStorage.getItem('selectedModel') || 'gpt-4o';
        const modelAlias = getModelAlias(currentModel);
        currentModelNameElement.textContent = modelAlias;
    }

    document.getElementById('save-settings-btn').addEventListener('click', function() {
        saveSettings();
    });

    updateCurrentModelDisplay();
});

function copyMessage(button) {
    const messageContent = button.parentElement.querySelector('.message-content').innerText;
    navigator.clipboard.writeText(messageContent).then(() => {
        alert('Copied to clipboard!');
    });
}