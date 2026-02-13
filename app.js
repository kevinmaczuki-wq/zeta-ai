export function initChat(user) {
    console.log('✅ Init chat for:', user?.email);
    
    // DOM Elements
    const chatList = document.getElementById('chatList');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtnSidebar');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Settings Elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');
    const settingsAvatar = document.getElementById('settingsAvatar');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const languageSearch = document.getElementById('languageSearch');
    const languageList = document.getElementById('languageList');
    const selectedLanguage = document.getElementById('selectedLanguage');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const enterToggle = document.getElementById('enterToggle');
    
    // Feedback Elements
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
    const cancelFeedbackBtn = document.getElementById('cancelFeedbackBtn');
    const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackRating = document.getElementById('feedbackRating');
    const screenshotInput = document.getElementById('screenshotInput');
    const screenshotBtn = document.getElementById('screenshotBtn');
    const screenshotName = document.getElementById('screenshotName');
    
    if (!messagesContainer || !chatInput || !sendBtn) {
        console.error('❌ Required DOM elements not found!');
        return;
    }
    
    // User ID for storage
    const userId = user?.uid || 'local';
    const storageKey = `zeta_chats_${userId}`;
    const settingsKey = `zeta_settings_${userId}`;
    const avatarKey = `zeta_avatar_${userId}`;
    const feedbackKey = `zeta_feedback_${userId}`;
    
    // User Info
    const displayName = user?.email?.split('@')[0] || user?.displayName || 'User';
    if (userInfo) {
        userInfo.innerHTML = `
            <div class="user-avatar">${displayName.charAt(0).toUpperCase()}</div>
            <span class="user-name">${displayName}</span>
        `;
    }
    
    // Load saved avatar
    const savedAvatar = localStorage.getItem(avatarKey);
    if (savedAvatar) {
        document.querySelectorAll('.user-avatar, .settings-avatar').forEach(el => {
            el.style.background = `url('${savedAvatar}') center/cover`;
            el.textContent = '';
        });
    }
    
    // Load sessions
    let sessions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (sessions.length === 0) {
        sessions = [{
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString()
        }];
        localStorage.setItem(storageKey, JSON.stringify(sessions));
    }
    
    let currentSessionIndex = 0;
    let loading = false;
    let currentScreenshot = null;
    
    function saveSessions() {
        localStorage.setItem(storageKey, JSON.stringify(sessions));
    }
    
    // ===== ESCAPE HTML =====
    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ===== TOAST NOTIFICATION =====
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // ===== SETTINGS FUNCTIONALITY =====
    if (settingsBtn && settingsOverlay) {
        settingsBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (usernameInput) usernameInput.value = displayName;
            if (emailInput) emailInput.value = user?.email || '';
            
            const savedAvatar = localStorage.getItem(avatarKey);
            if (savedAvatar && settingsAvatar) {
                settingsAvatar.style.background = `url('${savedAvatar}') center/cover`;
                settingsAvatar.textContent = '';
            }
            
            settingsOverlay.classList.add('visible');
        };
    }
    
    function closeSettings() {
        if (settingsOverlay) {
            settingsOverlay.classList.remove('visible');
        }
    }
    
    if (closeSettingsBtn) closeSettingsBtn.onclick = (e) => { e.preventDefault(); closeSettings(); };
    if (cancelSettingsBtn) cancelSettingsBtn.onclick = (e) => { e.preventDefault(); closeSettings(); };
    
    if (settingsOverlay) {
        settingsOverlay.onclick = (e) => {
            if (e.target === settingsOverlay) closeSettings();
        };
    }
    
    if (saveSettingsBtn) {
        saveSettingsBtn.onclick = (e) => {
            e.preventDefault();
            
            const newUsername = usernameInput?.value || displayName;
            const userNameSpan = document.querySelector('.user-name');
            const userAvatarDiv = document.querySelector('.user-avatar');
            
            if (userNameSpan) userNameSpan.textContent = newUsername;
            if (userAvatarDiv && !localStorage.getItem(avatarKey)) {
                userAvatarDiv.textContent = newUsername.charAt(0).toUpperCase();
            }
            
            const settings = {
                username: newUsername,
                darkMode: darkModeToggle?.classList.contains('active') || false,
                enterToSend: enterToggle?.classList.contains('active') !== false
            };
            localStorage.setItem(settingsKey, JSON.stringify(settings));
            
            closeSettings();
            showToast('Settings saved!', 'success');
        };
    }
    
    // ===== AVATAR UPLOAD =====
    if (changeAvatarBtn) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        changeAvatarBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        };
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target.result;
                
                document.querySelectorAll('.user-avatar, .settings-avatar').forEach(el => {
                    el.style.background = `url('${imageUrl}') center/cover`;
                    el.style.backgroundImage = `url('${imageUrl}')`;
                    el.textContent = '';
                });
                
                localStorage.setItem(avatarKey, imageUrl);
                showToast('Photo updated!', 'success');
            };
            reader.readAsDataURL(file);
        };
    }
    
    // ===== DARK MODE TOGGLE =====
    if (darkModeToggle) {
        const savedDarkMode = localStorage.getItem('zeta_darkmode') === 'true';
        if (savedDarkMode) {
            darkModeToggle.classList.add('active');
            document.body.classList.add('dark-mode');
        }
        
        darkModeToggle.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            darkModeToggle.classList.toggle('active');
            const isActive = darkModeToggle.classList.contains('active');
            document.body.classList.toggle('dark-mode', isActive);
            localStorage.setItem('zeta_darkmode', isActive);
        };
    }
    
    // ===== ENTER TOGGLE =====
    if (enterToggle) {
        const savedEnter = localStorage.getItem('zeta_enter') !== 'false';
        if (!savedEnter) {
            enterToggle.classList.remove('active');
        }
        
        enterToggle.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            enterToggle.classList.toggle('active');
            localStorage.setItem('zeta_enter', enterToggle.classList.contains('active'));
        };
    }
    
    // ===== LANGUAGE LIST =====
    const languages = [
        { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
        { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
        { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾' },
        { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
        { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
        { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
        { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
        { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
        { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
        { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
        { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
        { code: 'sv', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
        { code: 'da', name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
        { code: 'no', name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
        { code: 'fi', name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
        { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
        { code: 'cs', name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
        { code: 'hu', name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
        { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
        { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
        { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
        { code: 'he', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' }
    ];
    
    if (languageList) {
        function renderLanguages(search = '') {
            languageList.innerHTML = '';
            const filtered = languages.filter(lang => 
                lang.name.toLowerCase().includes(search.toLowerCase()) ||
                lang.native.toLowerCase().includes(search.toLowerCase())
            );
            
            filtered.forEach(lang => {
                const div = document.createElement('div');
                div.className = 'language-item';
                div.innerHTML = `
                    <div class="language-name">
                        <span>${lang.flag}</span>
                        ${lang.name}
                        <span class="language-native">${lang.native}</span>
                    </div>
                    <i class="fas fa-check" style="opacity: 0;"></i>
                `;
                
                div.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    document.querySelectorAll('.language-item i').forEach(i => i.style.opacity = '0');
                    div.querySelector('i').style.opacity = '1';
                    if (selectedLanguage) {
                        selectedLanguage.innerHTML = `
                            <i class="fas fa-check-circle"></i>
                            <span>${lang.name} (${lang.native})</span>
                        `;
                    }
                };
                
                languageList.appendChild(div);
            });
        }
        renderLanguages();
        
        if (languageSearch) {
            languageSearch.oninput = (e) => {
                renderLanguages(e.target.value);
            };
        }
    }
    
    // ===== FEEDBACK FUNCTIONALITY =====
    if (feedbackBtn && feedbackModal) {
        // Open feedback modal
        feedbackBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            feedbackModal.classList.add('visible');
            
            if (feedbackText) feedbackText.value = '';
            if (feedbackRating) feedbackRating.setAttribute('data-value', '5');
            
            const stars = document.querySelectorAll('.rating-star');
            stars.forEach((star, index) => {
                star.classList.toggle('active', index < 5);
            });
            
            currentScreenshot = null;
            if (screenshotName) screenshotName.textContent = '';
        };
        
        // Close feedback modal
        function closeFeedback() {
            feedbackModal.classList.remove('visible');
        }
        
        if (closeFeedbackBtn) {
            closeFeedbackBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeFeedback();
            };
        }
        
        if (cancelFeedbackBtn) {
            cancelFeedbackBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeFeedback();
            };
        }
        
        if (feedbackModal) {
            feedbackModal.onclick = (e) => {
                if (e.target === feedbackModal) {
                    closeFeedback();
                }
            };
        }
        
        // Star rating
        const ratingStars = document.querySelectorAll('.rating-star');
        if (ratingStars.length > 0) {
            ratingStars.forEach((star, index) => {
                star.onmouseover = () => {
                    ratingStars.forEach((s, i) => {
                        s.classList.toggle('hover', i <= index);
                    });
                };
                
                star.onmouseout = () => {
                    ratingStars.forEach(s => s.classList.remove('hover'));
                };
                
                star.onclick = () => {
                    const value = index + 1;
                    if (feedbackRating) feedbackRating.setAttribute('data-value', value);
                    
                    ratingStars.forEach((s, i) => {
                        s.classList.toggle('active', i < value);
                    });
                };
            });
        }
        
        // Screenshot upload
        if (screenshotBtn && screenshotInput) {
            screenshotBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                screenshotInput.click();
            };
            
            screenshotInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    currentScreenshot = file;
                    if (screenshotName) {
                        screenshotName.textContent = file.name;
                    }
                }
            };
        }
        
        // Submit feedback
        if (submitFeedbackBtn) {
            submitFeedbackBtn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const rating = parseInt(feedbackRating?.getAttribute('data-value') || '5');
                const text = feedbackText?.value || '';
                
                if (!text.trim()) {
                    showToast('Please enter your feedback', 'error');
                    return;
                }
                
                const originalText = submitFeedbackBtn.innerHTML;
                submitFeedbackBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                submitFeedbackBtn.disabled = true;
                
                try {
                    const feedback = {
                        rating,
                        text,
                        timestamp: new Date().toISOString(),
                        user: user?.email || 'anonymous',
                        sessionId: sessions[currentSessionIndex]?.id,
                        screenshot: currentScreenshot ? await fileToBase64(currentScreenshot) : null
                    };
                    
                    const existing = JSON.parse(localStorage.getItem(feedbackKey) || '[]');
                    existing.push(feedback);
                    localStorage.setItem(feedbackKey, JSON.stringify(existing));
                    
                    try {
                        await fetch('http://localhost:3000/api/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(feedback)
                        });
                    } catch (err) {
                        console.log('Server feedback failed');
                    }
                    
                    showToast('Thank you for your feedback!', 'success');
                    closeFeedback();
                    
                } catch (err) {
                    console.error('Feedback error:', err);
                    showToast('Failed to send feedback', 'error');
                } finally {
                    submitFeedbackBtn.innerHTML = originalText;
                    submitFeedbackBtn.disabled = false;
                }
            };
        }
    }
    
    // Helper: file to base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    // ===== GENERATE CHAT TITLE WITH GROQ =====
    async function generateChatTitle(firstMessage) {
        try {
            const res = await fetch('https://zeta-ai-backend.onrender.com/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Buat judul singkat (2-4 kata) untuk percakapan chat ini berdasarkan pesan pertama: "${firstMessage}". Judul harus kreatif dan relevan. Langsung judulnya saja.`
                })
            });
            
            const data = await response.json();
            let title = data.reply || 'New Chat';
            title = title.replace(/["'"]/g, '').trim();
            if (title.length > 30) title = title.substring(0, 30) + '...';
            return title;
        } catch (error) {
            console.error('Error generating title:', error);
            const words = firstMessage.split(' ').slice(0, 3).join(' ');
            return words.length > 20 ? words.substring(0, 20) + '...' : words;
        }
    }
    
    // ===== SYNTAX HIGHLIGHTING =====
    function highlightJavaScript(code) {
        return code
            .replace(/\b(const|let|var|function|if|else|for|while|return|import|export|from|class|extends|new|this|try|catch|finally|async|await|typeof|instanceof|switch|case|break|continue|throw|delete|void|yield)\b/g, '<span class="keyword">$1</span>')
            .replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span class="literal">$1</span>')
            .replace(/(["'`])(.*?)\1/g, '<span class="string">$&</span>')
            .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
            .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
            .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
            .replace(/\b([A-Za-z_$][A-Za-z0-9_$]*)\s*(?=\()/g, '<span class="function">$1</span>');
    }

    function highlightHTML(code) {
        return code
            .replace(/&lt;(\/)?([a-zA-Z0-9-]+)/g, '&lt;<span class="tag">$1$2</span>')
            .replace(/([a-zA-Z-]+)=/g, '<span class="attribute">$1</span>=')
            .replace(/&quot;(.*?)&quot;/g, '&quot;<span class="string">$1</span>&quot;')
            .replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="comment">$&</span>');
    }

    // ===== FORMAT MESSAGE WITH CODE =====
    function formatMessageWithCode(text) {
        if (!text) return '';
        
        let formatted = text;
        const codeBlocks = [];
        
        formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
            const index = codeBlocks.length;
            codeBlocks.push({
                language: language || 'plaintext',
                code: code.trim()
            });
            return `%%CODEBLOCK${index}%%`;
        });
        
        formatted = escapeHTML(formatted);
        
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
        formatted = formatted.replace(/~~(.*?)~~/g, '<del>$1</del>');
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        formatted = formatted.replace(/[\u{1F300}-\u{1F6FF}]/gu, '<span class="emoji">$&</span>');
        
        formatted = formatted.replace(/%%CODEBLOCK(\d+)%%/g, (match, index) => {
            const block = codeBlocks[parseInt(index)];
            if (!block) return match;
            
            const escapedCode = escapeHTML(block.code);
            let highlightedCode = escapedCode;
            
            if (block.language === 'javascript' || block.language === 'js') {
                highlightedCode = highlightJavaScript(escapedCode);
            } else if (block.language === 'html') {
                highlightedCode = highlightHTML(escapedCode);
            }
            
            return `
                <div class="code-block-wrapper">
                    <div class="code-header">
                        <span class="code-language">${block.language}</span>
                        <button class="copy-code-btn" data-code="${escapedCode.replace(/"/g, '&quot;')}">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre><code class="language-${block.language}">${highlightedCode}</code></pre>
                </div>
            `;
        });
        
        return formatted;
    }

    // ===== SETUP COPY BUTTONS =====
    function setupCopyButtons() {
        document.querySelectorAll('.copy-code-btn').forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const code = btn.getAttribute('data-code') ||
                    btn.closest('.code-block-wrapper')?.querySelector('code')?.textContent;
                
                if (code) {
                    navigator.clipboard.writeText(code).then(() => {
                        const original = btn.innerHTML;
                        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        btn.style.background = '#4CAF50';
                        btn.style.borderColor = '#45a049';
                        
                        setTimeout(() => {
                            btn.innerHTML = original;
                            btn.style.background = '';
                            btn.style.borderColor = '';
                        }, 2000);
                    });
                }
            };
        });
    }

    // ===== RENDER FUNCTIONS =====
    function renderChatList() {
        if (!chatList) return;
        chatList.innerHTML = '';
        
        sessions.forEach((session, index) => {
            const div = document.createElement('div');
            div.className = `chat-session ${index === currentSessionIndex ? 'active' : ''}`;
            
            const lastMsg = session.messages?.[session.messages.length - 1]?.text || 'No messages';
            const preview = lastMsg.length > 25 ? lastMsg.substring(0, 25) + '...' : lastMsg;
            
            div.innerHTML = `
                <div class="session-title">${escapeHTML(session.title)}</div>
                <div class="session-preview">${escapeHTML(preview)}</div>
            `;
            
            div.onclick = () => {
                currentSessionIndex = index;
                renderChatList();
                renderMessages();
            };
            
            chatList.appendChild(div);
        });
    }

    function renderMessages() {
        if (!messagesContainer) return;
        messagesContainer.innerHTML = '';
        
        const session = sessions[currentSessionIndex];
        
        if (!session?.messages?.length) {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>Welcome to Zeta AI</h3>
                    <p>Start a conversation</p>
                </div>
            `;
            return;
        }
        
        session.messages.forEach((msg) => {
            const div = document.createElement('div');
            div.className = `message ${msg.role}`;
            
            const time = msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
            
            const editedIndicator = msg.edited ? '<span class="edited-indicator"> (edited)</span>' : '';
            const formattedText = formatMessageWithCode(msg.text);
            
            div.innerHTML = `
                <div class="message-bubble">${formattedText}</div>
                <div class="message-time">${time}${editedIndicator}</div>
            `;
            
            messagesContainer.appendChild(div);
        });
        
        setupCopyButtons();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ===== ADD MESSAGE =====
    async function addMessage(role, text) {
        const session = sessions[currentSessionIndex];
        if (!session.messages) session.messages = [];
        
        session.messages.push({
            role,
            text,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random()
        });
        
        if (role === 'user' && session.messages.length === 1) {
            session.title = 'Generating...';
            saveSessions();
            renderChatList();
            
            const newTitle = await generateChatTitle(text);
            session.title = newTitle;
        }
        
        session.updatedAt = new Date().toISOString();
        saveSessions();
        renderMessages();
        renderChatList();
    }

    // ===== SEND MESSAGE =====
    async function sendMessage() {
        if (loading) return;
        
        const msg = chatInput.value.trim();
        if (!msg) return;
        
        loading = true;
        chatInput.value = '';
        chatInput.disabled = true;
        sendBtn.disabled = true;
        
        await addMessage('user', msg);
        
        const typing = document.createElement('div');
        typing.className = 'typing-indicator';
        typing.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typing);
        
        try {
            const res = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            
            messagesContainer.querySelector('.typing-indicator')?.remove();
            const data = await res.json();
            await addMessage('assistant', data.reply);
            
        } catch (err) {
            messagesContainer.querySelector('.typing-indicator')?.remove();
            await addMessage('assistant', 'Error: ' + err.message);
        } finally {
            loading = false;
            chatInput.disabled = false;
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    // ===== NEW CHAT =====
    function createNewChat() {
        sessions.push({
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString()
        });
        currentSessionIndex = sessions.length - 1;
        saveSessions();
        renderChatList();
        renderMessages();
        chatInput.focus();
    }

    // ===== EVENT LISTENERS =====
    sendBtn.onclick = sendMessage;
    chatInput.onkeypress = (e) => {
        if (e.key === 'Enter' && !loading && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    if (newChatBtn) newChatBtn.onclick = createNewChat;
    if (logoutBtn) logoutBtn.onclick = () => window.logout?.();

    // Initial render
    renderChatList();
    renderMessages();
    
    console.log('✅ Chat initialized');
}

window.chatInterface = { init: initChat };
