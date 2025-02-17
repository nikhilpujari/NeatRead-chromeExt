chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["GOOGLE_TRANSLATE_API_KEY", "OPENAI_API_KEY"], (result) => {
        if (!result.GOOGLE_TRANSLATE_API_KEY) {
            chrome.storage.local.set({ "GOOGLE_TRANSLATE_API_KEY": "YOUR_GOOGLE_CLOUD_API_KEY" });
            console.log("Google Translate API Key set.");
        }
        if (!result.OPENAI_API_KEY) {
            chrome.storage.local.set({ "OPENAI_API_KEY": "YOUR_OPENAI_API_KEY" });
            console.log("OpenAI API Key set.");
        }
    });
});
