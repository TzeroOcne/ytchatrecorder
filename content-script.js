function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        ytrecprint("Observer found");
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });
    ytrecprint("Observer created");

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

function waitForElmIns(elm, selector) {
  return new Promise(resolve => {
    if (elm.querySelector(selector)) {
      return resolve(elm.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (elm.querySelector(selector)) {
        ytrecprint("Insider observer found");
        resolve(elm.querySelector(selector));
        observer.disconnect();
      }
    });
    ytrecprint("Insider observer created");

    observer.observe(elm, {
      childList: true,
      subtree: true
    });
  });
}

function observeChatWindow(target) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.target.localName == "yt-live-chat-text-message-renderer") {
        chrome.runtime.sendMessage({
          type: 'print',
          data: {
            "rawhtml": `${mutation.target.outerHTML}`,
            "videoId": videoId
          }
        });
      }
    });
  });
  ytrecprint('Observer created');

  function observe() {
    observer.observe(target, {
      childList: true,
      subtree: true
    });
  }

  chrome.storage.sync.get('recording', ({ recording }) => {
    if (recording[videoId] ?? false) {
      observe();
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key == 'recording') {
        if (newValue[videoId]) {
          observe();
        } else {
          observer.disconnect();
        }
      }
    }
  });
}

const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('v');

function ytrecprint(msg) {
  console.log(`[ytrec] ${msg}`)
};

chrome.storage.sync.get('recording', ({ recording }) => {
  if (!(recording[videoId] ?? false)) {
    if (recording[videoId] == null) {
      recording[videoId] = false;
      chrome.storage.sync.set({ recording });
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  ytrecprint("Document loaded");
  if (urlParams.has('is_popout') && urlParams.get('is_popout') == '1') {
    ytrecprint('Chat is popout');
    ytrecprint('Waiting renderer');
    waitForElm('#items.yt-live-chat-item-list-renderer').then((elm) => {
      ytrecprint('Renderer loaded');
      observeChatWindow(elm);
    });
  } else {
    waitForElm("#chatframe").then((elm) => {
      ytrecprint('Element found');
      ytrecprint('IFrame loading');
      elm.onload = () => {
        ytrecprint('IFrame loaded');
        waitForElmIns(elm.contentDocument, '#item-list.yt-live-chat-renderer').then((element) => {
          ytrecprint('Chat app found');
          observeChatWindow(element);
        });
      };
    });
  }
});
