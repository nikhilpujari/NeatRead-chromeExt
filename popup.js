let originalSummary = "";  // Store the English summary for translations

document.getElementById("summarize").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    console.log("Summarize button clicked. Sending message to content script...");

    // Show loading animation
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("summary").innerText = "Fetching summary...";

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: "extractText" }, async (response) => {
        console.log("Response received from content script:", response);
        
        if (response && response.text) {
            const apiKey = await getAPIKey("OPENAI_API_KEY");  // Retrieve OpenAI API key
            console.log("OpenAI API Key retrieved:", apiKey ? "Yes" : "No");

            if (!apiKey) {
                document.getElementById("summary").innerText = "API Key not found!";
                document.getElementById("loading").classList.add("hidden");
                return;
            }

            console.log("Sending request to OpenAI for summarization...");
            const summary = await getSummaryFromOpenAI(response.text, apiKey);
            console.log("Summary received:", summary);

            // Save the original English summary
            originalSummary = summary;

            // Hide loading animation after fetching summary
            document.getElementById("loading").classList.add("hidden");
            document.getElementById("summary").innerText = summary || "Failed to summarize.";
        } else {
            console.log("Error: Could not extract text from content script.");
            document.getElementById("summary").innerText = "Could not extract text.";
            document.getElementById("loading").classList.add("hidden");
        }
    });
});

// ✅ Function to retrieve API Key from Chrome Storage
async function getAPIKey(keyName) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keyName, (result) => {
            resolve(result[keyName] || "");
        });
    });
}

// ✅ Function to call OpenAI API for summarization
async function getSummaryFromOpenAI(text, apiKey) {
    const url = "https://api.openai.com/v1/chat/completions";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "user", content: `Give a short Title and (in the next line) Summarize this in bullet points: ${text}` }],
                max_tokens: 150
            })
        });

        const data = await response.json();
        console.log("OpenAI API Response:", data);

        return data.choices?.[0]?.message?.content || "No summary available.";
    } catch (error) {
        console.error("Error fetching summary from OpenAI:", error);
        return "Error: Unable to summarize.";
    }
}

// ✅ Function to Translate Text using Google Translate API with Environment Variable
document.getElementById("translate").addEventListener("click", async () => {
    if (!originalSummary) {
        alert("Please generate a summary first!");
        return;
    }

    const selectedLanguage = document.getElementById("language").value;

    // ✅ Prevent translation if the selected language is English
    if (selectedLanguage === "en") {
        document.getElementById("summary").innerText = originalSummary;  // Restore the original summary
        console.log("Translation skipped. English selected. Restoring original summary.");
        return;
    }

    console.log("Translate button clicked. Language selected:", selectedLanguage);
    console.log("Translating from saved English summary:", originalSummary);

    try {
        console.log("Fetching Google Translate API Key...");
        const apiKey = await getAPIKey("GOOGLE_TRANSLATE_API_KEY");  // Retrieve Google Translate API Key

        if (!apiKey) {
            console.error("Google Translate API Key not found.");
            document.getElementById("summary").innerText = "Translation failed: API key missing.";
            return;
        }

        console.log("Sending request to Google Translate API...");

        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                q: originalSummary,
                target: selectedLanguage,
                source: "en",
                format: "text"
            })
        });

        const data = await response.json();
        console.log("Google Translate API Response:", data);

        if (data.data && data.data.translations.length > 0) {
            document.getElementById("summary").innerText = data.data.translations[0].translatedText;
        } else {
            document.getElementById("summary").innerText = "Translation failed.";
        }

    } catch (error) {
        document.getElementById("summary").innerText = "Error: Unable to translate.";
        console.error("Error fetching translation from Google Translate API:", error);
    }
});
