async function askAI() {
    const question = document.getElementById("chatQuestion").value;
    if (!question) return;
    document.getElementById("chatQuestion").value = "";

    const chatlog = document.getElementById("msgContainer");

    const userMsg = document.createElement("div");
    userMsg.className = "user-msg";
    const pUser = document.createElement("p");
    pUser.textContent = question;
    userMsg.appendChild(pUser);
    chatlog.append(userMsg);

    // Thinking indicator
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "msg";
    const pThink = document.createElement("p");
    pThink.textContent = "Tapi is thinking...";
    thinkingMsg.append(pThink)
    chatlog.append(thinkingMsg);
    chatlog.scrollTop = chatlog.scrollHeight;

    try {
        const aiRes = await fetch('/api/ask-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });

        const result = await aiRes.json();
        thinkingMsg.remove();

        const aiMsg = document.createElement("div");
        aiMsg.className = "msg";
        const pTapi = document.createElement("p");
        pTapi.textContent = result.success ? result.advice : "Sorry, something went wrong.";
        aiMsg.appendChild(pTapi);
        chatlog.append(aiMsg);

    } catch (err) {
        thinkingMsg.remove();
        const errMsg = document.createElement("div");
        errMsg.className = "msg";
        const pErr = document.createElement("p");
        pErr.textContent = "Network error. Please try again.";
        errMsg.append(pErr);
        chatlog.append(errMsg);
    }

    chatlog.scrollTop = chatlog.scrollHeight;
}

function openChatWindow() {
    document.getElementById("chatWindow").style.display = "block";
}

function closeChatWindow() {
    document.getElementById("chatWindow").style.display = "none";
}