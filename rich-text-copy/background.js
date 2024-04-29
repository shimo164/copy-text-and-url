const isValidUrl = (url) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

function createContextMenuItem(id, title, contexts = ['selection']) {
  chrome.contextMenus.create({
    id: id,
    title: title,
    contexts: contexts,
  }, () => {
    if (chrome.runtime.lastError) {
      return
    }
  });
}

function updateContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.storage.local.get(['selectionTextRichText', 'selectionTextMarkdownLink', 'titleRichText', 'titleMarkdownLink'], function (items) {
      if (items.selectionTextRichText) {
        createContextMenuItem('copy-as-rich-text', 'Copy Selected Text as Rich Text');
      }
      if (items.selectionTextMarkdownLink) {
        createContextMenuItem('copy-as-markdown-link', 'Copy Selected Text as Markdown Link');
      }
      if (items.titleRichText) {
        createContextMenuItem('copy-title-as-rich-text', 'Copy Title as Rich Text', ['page']);
      }
      if (items.titleMarkdownLink) {
        createContextMenuItem('copy-title-as-markdown-link', 'Copy Title as Markdown Link', ['page']);
      }
    });
  });
}

// Set default values for the settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['selectionTextRichText', 'selectionTextMarkdownLink', 'titleRichText', 'titleMarkdownLink'], function (items) {
    let defaults = {};

    defaults.selectionTextRichText = items.selectionTextRichText !== undefined ? items.selectionTextRichText : true;
    defaults.selectionTextMarkdownLink = items.selectionTextMarkdownLink !== undefined ? items.selectionTextMarkdownLink : false;
    defaults.titleRichText = items.titleRichText !== undefined ? items.titleRichText : false;
    defaults.titleMarkdownLink = items.titleMarkdownLink !== undefined ? items.titleMarkdownLink : false;

    chrome.storage.local.set(defaults, function() {
      updateContextMenu();
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContextMenu') {
    updateContextMenu();
  }
});

const sendToClipboard = async (content, plainText, tabId) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js'],
    });
    chrome.tabs.sendMessage(tabId, {
      action: 'copyToClipboard',
      html: content,
      plainText: plainText,
    });
  } catch (error) {
    console.log("Error executing script or sending message:", error);
  }
};


const copySelectedText = (info, tab) => {
  const text = info.selectionText;
  if (!text) {
    return;
  }
  const url = tab.url;

  if (info.menuItemId === 'copy-as-rich-text') {
    const html = `<a href="${url}">${text}</a>`;
    sendToClipboard(html, `${text} - ${url}`, tab.id);
  } else if (info.menuItemId === 'copy-as-markdown-link') {
    const markdown = `[${text}](${url})`;
    sendToClipboard(null, markdown, tab.id);
  }
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = tab.url;
  if (!isValidUrl(url)) return;

  const title = tab.title;

  switch(info.menuItemId) {
    case 'copy-title-as-rich-text':
      const html = `<a href="${url}">${title}</a>`;
      sendToClipboard(html, `${title} - $url}`, tab.id);
      break;
    case 'copy-title-as-markdown-link':
      const markdownText = `[${title}](${url})`;
      sendToClipboard(null, markdownText, tab.id);
      break;
    default:
      copySelectedText(info, tab);
      break;
  }
});

chrome.action.onClicked.addListener((tab) => {
  const url = tab.url;
  if (!isValidUrl(url)) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['getSelection.js'],
  });
});

chrome.contextMenus.onClicked.addListener(copySelectedText);
