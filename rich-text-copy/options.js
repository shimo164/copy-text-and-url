document.addEventListener('DOMContentLoaded', function () {
  const checkboxes = {
    selectionTextRichText: document.getElementById('selection-text-rich-text-toggle'),
    selectionTextMarkdownLink: document.getElementById('selection-text-markdown-link-toggle'),
    titleRichText: document.getElementById('title-rich-text-toggle'),
    titleMarkdownLink: document.getElementById('title-markdown-link-toggle')
  };
  const saveMessage = document.getElementById('saveMessage');

  // Load saved settings from storage
  chrome.storage.local.get(Object.keys(checkboxes), function (items) {
    Object.keys(checkboxes).forEach(key => {
      checkboxes[key].checked = !!items[key]; // Convert truthy/falsy to boolean
    });
  });

  // Save the settings and update the context menu
  document.getElementById('saveOptions').addEventListener('click', function () {
    const settings = {};
    Object.keys(checkboxes).forEach(key => {
      settings[key] = checkboxes[key].checked;
    });

    chrome.storage.local.set(settings, function () {
      saveMessage.innerHTML = `Settings saved at ${new Date().toLocaleString()}`;
      chrome.runtime.sendMessage({ action: 'updateContextMenu' }); // Notify background.js to update context menu
    });
  });
});
