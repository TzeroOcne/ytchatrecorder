// Initialize button with user's preferred color
// let changeColor = document.getElementById("changeColor");

// chrome.storage.sync.get("color", ({ color }) => {
//   changeColor.style.backgroundColor = color;
// });

const ytRegex = /https:\/\/.*youtube.com\/(watch|live_chat)\?.*v=/;

document.addEventListener('DOMContentLoaded', () => {

});

function updateRecordingStats(videoId, stats) {
  chrome.storage.sync.get('recording', ({ recording }) => {
    recording[videoId] = stats;
    chrome.storage.sync.set({ recording });
  });
}

function stopRecord(videoId) {
  recordButton.classList.remove('recording');
  updateRecordingStats(videoId, false);
  sendStats('stop', videoId);
}

function getVidId(url) {
  const urlParse = new URL(url);
  const urlParams = new URLSearchParams(urlParse.search);
  return urlParams.get('v');
}

function executeWithVideoId(callback) {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    const videoId = getVidId(tabs[0].url);
    if (videoId != null) {
      callback(videoId);
      return true;
    }
    return false;
  });
}

function sendStats(stats, videoId) {
  chrome.runtime.sendMessage({
    type: stats,
    data: {
      videoId
    }
  });
}

const messageBoard = document.querySelector('span#message-board');
const recordButton = document.querySelector('button#record-button');
const stopButton = document.querySelector('button#stop-button');
const tempButton = document.querySelector('button#temp-button');

function show(msg) {
  messageBoard.innerHTML = `${msg}`;
}

function toggleRecording() {
  executeWithVideoId((videoId) => {
    chrome.storage.sync.get('recording', ({ recording }) => {
      recording[videoId] = !recording[videoId];
      if (recording[videoId]) {
        sendStats('start', videoId);
        recordButton.classList.add('recording');
      } else {
        recordButton.classList.remove('recording');
      }
      chrome.storage.sync.set({ recording });
    });
  });
}

executeWithVideoId((videoId) => {
  chrome.storage.sync.get('recording', ({ recording }) => {
    console.log({ recording });
    if (recording[videoId] ?? false) {
      recordButton.classList.add('recording');
    } else {
      if (recording[videoId] == null) {
        recording[videoId] = false;
        chrome.storage.sync.set({ recording });
      }
      recordButton.classList.remove('recording');
    }
  });
});

tempButton.addEventListener('click', (e) => {
  chrome.tabs.query({
    currentWindow: true
  }, (tabs) => {
    const selectElm = document.querySelector('#vid-list');
    while (selectElm.firstElementChild) {
      selectElm.firstElementChild.remove();
    }
    const youtubeTabList = [];
    tabs.forEach(tab => {
      if (ytRegex.test(tab.url)) {
        console.log({tab});
        const vidId = getVidId(tab.url);
        if (!youtubeTabList.includes(vidId)) {
          youtubeTabList.push(vidId);
        }
      }
    });
    youtubeTabList.forEach(vidId => {
      const opt = document.createElement('option');
      opt.value = vidId;
      opt.innerText = vidId;
      selectElm.appendChild(opt);
    });
  });
});

stopButton.addEventListener('click', (e) => {
  executeWithVideoId((videoId) => {
    stopRecord(videoId);
  });
});

recordButton.addEventListener('click', (e) => {
  toggleRecording();
});
