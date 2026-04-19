// amem — offscreen document for tabCapture + MediaRecorder.
// Service workers cannot use MediaRecorder, so we delegate to this document.

let mediaRecorder = null;
let recordedChunks = [];

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || !msg.type) return;
  if (msg.type === 'amem-offscreen-start') {
    startRecording(msg.streamId)
      .then(() => sendResponse({ started: true }))
      .catch((err) => sendResponse({ started: false, error: err.message }));
    return true;
  }
  if (msg.type === 'amem-offscreen-stop') {
    stopRecording()
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

async function startRecording(streamId) {
  if (mediaRecorder) throw new Error('Recorder already active in offscreen.');
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
  });
  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5_000_000,
  });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };
  mediaRecorder.start(1000);
  console.log('[amem:offscreen] recording started');
}

async function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    return { error: 'No active recording.' };
  }
  return new Promise((resolve) => {
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const buffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      let binary = '';
      const chunkSize = 32768;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
      }
      const base64 = btoa(binary);

      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      mediaRecorder = null;
      recordedChunks = [];

      console.log('[amem:offscreen] recording stopped, size:', blob.size);
      resolve({ base64, size: blob.size, mimeType: 'video/webm' });
    };
    mediaRecorder.stop();
  });
}
