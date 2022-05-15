function sendData(data) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", 'http://localhost:5000/print', true)
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var json = JSON.parse(xhr.responseText);
    }
  };
  xhr.send(JSON.stringify(data));
}

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

function simpleObserver(target) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.target.localName == "yt-live-chat-text-message-renderer") {
        chrome.storage.sync.get('recording', ({recording}) => {
          if (recording[videoId] ?? false) {
            sendData({
              "rawhtml": `${mutation.target.outerHTML}`,
              "videoId": videoId
            });
          }
        });
      }
    });
  });
  ytrecprint('Observer created');

  observer.observe(target, {
    childList: true,
    subtree: true
  });
}

function ytrecprint(msg) {
  console.log(`[ytrec] ${msg}`)
};

const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('v');

document.addEventListener('DOMContentLoaded', () => {
  ytrecprint("Document loaded");
  waitForElm("#chatframe").then((elm) => {
    ytrecprint('Element found');
    ytrecprint('IFrame loading');
    elm.onload = () => {
      ytrecprint('IFrame loaded');
      waitForElmIns(elm.contentDocument, '#item-list.yt-live-chat-renderer').then((element) => {
        ytrecprint('Chat app found');
        simpleObserver(element);
      });
    };
  });
});
