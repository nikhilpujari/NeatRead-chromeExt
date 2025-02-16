document.getElementById("summarize").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Show loading animation
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("summary").innerText = "Fetching summary...";

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: "extractText" }, async (response) => {
        if (response && response.text) {
            const apiKey = await getAPIKey();  // Retrieve API key
            if (!apiKey) {
                document.getElementById("summary").innerText = "API Key not found!";
                document.getElementById("loading").classList.add("hidden");
                return;
            }
            const summary = await getSummaryFromOpenAI(response.text, apiKey);

            // Hide loading animation after fetching summary
            document.getElementById("loading").classList.add("hidden");
            document.getElementById("summary").innerText = summary || "Failed to summarize.";
        } else {
            document.getElementById("summary").innerText = "Could not extract text.";
            document.getElementById("loading").classList.add("hidden");
        }
    });
});

// Function to retrieve API Key
async function getAPIKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get("OPENAI_API_KEY", (result) => {
            resolve(result.OPENAI_API_KEY || "");
        });
    });
}

// Function to call OpenAI API
async function getSummaryFromOpenAI(text, apiKey) {
    const url = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: `Summarize this in bullet points: ${text}` }],
            max_tokens: 150
        })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No summary available.";
}
