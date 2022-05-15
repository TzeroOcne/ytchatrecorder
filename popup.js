// Initialize button with user's preferred color
// let changeColor = document.getElementById("changeColor");

// chrome.storage.sync.get("color", ({ color }) => {
//   changeColor.style.backgroundColor = color;
// });

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

function executeWithVideoId(callback) {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    const url = new URL(tabs[0].url);
    const urlParams = new URLSearchParams(url.search);
    const videoId = urlParams.get('v');
    if (videoId != null) {
      callback(videoId);
      return true;
    }
    return false;
  });
}

function sendStats(stats, videoId) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:5000/${stats}?v=${videoId}`, true)
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var json = JSON.parse(xhr.responseText);
      console.log(json);
    }
  };
  xhr.send();
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
  // chrome.storage.sync.get('recording', (result) => {
  //   console.log(result);
  // });
});

stopButton.addEventListener('click', (e) => {
  executeWithVideoId((videoId) => {
    stopRecord(videoId);
  });
});

recordButton.addEventListener('click', (e) => {
  toggleRecording();
});
