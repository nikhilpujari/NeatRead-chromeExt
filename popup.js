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
            const apiKey = await getAPIKey();  // Retrieve API key
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

// Function to retrieve API Key
async function getAPIKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get("OPENAI_API_KEY", (result) => {
            resolve(result.OPENAI_API_KEY || "");
        });
    });
}

// Function to call OpenAI API for summarization
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
                messages: [{ role: "user", content: `Summarize this in bullet points: ${text}` }],
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

// ✅ Function to Translate Text using MyMemory API (Always from Original English Summary)
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
        console.log("Splitting text into chunks...");
        const chunks = splitTextIntoChunks(originalSummary, 500); // Split text into 500-char chunks
        let translatedChunks = [];

        for (let chunk of chunks) {
            console.log("Sending request to MyMemory API for chunk:", chunk);

            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${selectedLanguage}`);
            const data = await response.json();

            console.log("MyMemory API Response:", data);

            if (data.responseData && data.responseData.translatedText) {
                translatedChunks.push(data.responseData.translatedText);
            } else {
                console.error("Error: No translated text returned for chunk:", chunk);
                translatedChunks.push("[Translation failed for this part]");
            }
        }

        // Combine translated chunks into final text
        const finalTranslatedText = translatedChunks.join(" ");
        document.getElementById("summary").innerText = finalTranslatedText;  // Replace summary with translated text
        console.log("Final translated text:", finalTranslatedText);

    } catch (error) {
        document.getElementById("summary").innerText = "Error: Unable to translate.";
        console.error("Error fetching translation from MyMemory API:", error);
    }
});

// ✅ Function to split long text into 500-character chunks
function splitTextIntoChunks(text, maxLength) {
    let chunks = [];
    for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.substring(i, i + maxLength));
    }
    return chunks;
}
