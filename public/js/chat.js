async function askAI() {
    const question = document.getElementById("chatQuestion").value;
    if (!question) return;
    document.getElementById("chatQuestion").value = "";

    const chatlog = document.getElementById("msgContainer");

    const userMsg = document.createElement("div");
    userMsg.className = "user-msg";
    userMsg.textContent = question;
    chatlog.append(userMsg);

    // Thinking indicator
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "msg";
    thinkingMsg.textContent = "Tapi is thinking...";
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
        aiMsg.textContent = result.success
            ? result.advice
            : "Sorry, something went wrong. Please try again.";
        chatlog.append(aiMsg);

    } catch (err) {
        thinkingMsg.remove();
        const errMsg = document.createElement("div");
        errMsg.className = "msg";
        errMsg.textContent = "Network error. Please try again.";
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