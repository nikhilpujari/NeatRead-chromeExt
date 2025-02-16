function extractTextFromPage() {
    return document.body.innerText.slice(0, 5000); // Get first 5000 characters
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractText") {
        sendResponse({ text: extractTextFromPage() });
    }
});
