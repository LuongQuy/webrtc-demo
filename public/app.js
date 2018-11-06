// Need to support old and mobile browsers but there's no time to
//    setup the babel and webpack thing to use new ES features
// Just write our old day javascript

(function() {
  // Init socket
  var socket = io();
  // Add log
  var oldOn = socket.on.bind(socket);
  var oldEmit = socket.emit.bind(socket);
  socket.on = function(eventName, fn) {
    oldOn(eventName, function() {
      console.log('on ' + eventName);
      fn.apply(null, arguments);
    });
  };
  socket.emit = function(eventName, data) {
    oldEmit(eventName, data);
    console.log('emit ' + eventName);
  };
  // Add events
  socket.on('created', onCreated);
  socket.on('joined', onJoined);
  socket.on('full', onFull);
  socket.on('ready', onReady);
  socket.on('offer', onOffer);
  socket.on('answer', onAnswer);
  socket.on('icecandidate', onIceCandidate);

  // Ask for user name and room
  askRoomName().then(joinRoom);

  var room = '';
  var isCaller = false;
  var rtcPeerConnection = null;
  var localVideo = document.getElementById('local-video');
  var localStream = null;
  var remoteVideo = document.getElementById('remote-video');
  var remoteStream = null;

  function askRoomName() {
    return swal({
      title: 'Join room',
      input: 'text',
      inputPlaceholder: 'Room name',
      confirmButtonText: 'JOIN',
      focusConfirm: false,
    }).then(function(res) {
      if (res.dismiss) {
        throw new Error('Invalid room name');
      }
      room = res.value;
    }).catch(askRoomName);
  }
  function joinRoom() {
    socket.emit('join', room);
  }

  function onCreated() {
    getUserMedia();
    isCaller = true;
  }
  function onJoined() {
    getUserMedia().then(function() {
      socket.emit('ready', room);
    });
  }
  function onFull() {
    showError('The room is full, please try again');
    console.error('Room ' + room + ' is full');
  }
  function onReady() {
    createPeerConnection();
  }
  function onOffer(offerSdp) {
    createPeerConnection(offerSdp);
  }
  function onAnswer(answerSdp) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
  }
  function onIceCandidate(candidate) {
    rtcPeerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  function getUserMedia() {
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function (stream) {
      setVideoStream(localVideo, stream);
      localStream = stream;
    }).catch(function (err) {
      showError('Can not access your microphone and webcam, please try again');
      console.error(err);
    });
  }

  function createPeerConnection(offerSdp) {
    rtcPeerConnection = new RTCPeerConnection({
      iceServers: [{
        urls: [
          'stun:128.199.169.96:3478',
          'stun:128.199.169.96:3479',
        ],
      }, {
        urls: [
          'turn:128.199.169.96:3478',
          'turn:128.199.169.96:3479',
        ],
        username: '0',
        credential: '0',
      }],
    });
    rtcPeerConnection.onicecandidate = onPeerIceCandidate;
    rtcPeerConnection.onaddstream = onPeerAddStream;
    rtcPeerConnection.onerror = onPeerError;
    rtcPeerConnection.addStream(localStream);
    if (!offerSdp) {
      rtcPeerConnection.createOffer(function(localSdp) {
        rtcPeerConnection.setLocalDescription(localSdp);
        socket.emit('offer', { room: room, sdp: localSdp });
      }, function(err) {
        console.error(err);
      });
    } else {
      rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));
      rtcPeerConnection.createAnswer(function(localSdp) {
        rtcPeerConnection.setLocalDescription(localSdp);
        socket.emit('answer', { room: room, sdp: localSdp });
      }, function(err) {
        console.error(err);
      });
    }
  }

  function onPeerIceCandidate(e) {
    if (!e.candidate) {
      return;
    }
    socket.emit('icecandidate', {
      room: room,
      candidate: {
        sdpMLineIndex: e.candidate.sdpMLineIndex,
        candidate: e.candidate.candidate
      }
    });
  }
  function onPeerAddStream(e) {
    setVideoStream(remoteVideo, e.stream);
    fixPositionRemoteVideo();
  }
  function onPeerError(err) {
    console.error(err);
  }

  function setVideoStream(video, stream) {
    try {
      video.srcObject = stream;
    } catch(err) {
      console.error(err);
      try {
        video.src = URL.createObjectURL(stream);
      } catch(err2) {
        console.error(err2);
        showError();
      }
    }
    video.style.display = 'block';
  }

  function showError(message) {
    swal({
      type: 'error',
      title: 'Error',
      text: message || 'An error occurred please try again'
    });
  }

  var container = document.getElementById('container');
  var isScreenRotated = false;
  function fixPositionRemoteVideo() {
    var cw = container[isScreenRotated ? 'clientHeight' : 'clientWidth'];
    var ch = container[isScreenRotated ? 'clientWidth' : 'clientHeight'];
    var vw = remoteVideo.clientWidth;
    var vh = remoteVideo.clientHeight;
    var nvw = cw, nvh = ch, t = 0, l = 0;

    var isWindowTaller = cw/ch < vw/vh;
    if (isWindowTaller) {
      nvh = ch;
      nvw = vw * nvh / vh;
      l = (cw - nvw) / 2;
    } else {
      nvw = cw
      nvh = vh * nvw / vw;
      t = (ch - nvh) / 2;
    }
    if (isScreenRotated) {
      var tTemp = t;
      t = l;
      l = tTemp;
      // l += nvh;
    }
    remoteVideo.style.width = nvw + 'px';
    remoteVideo.style.height = nvh + 'px';
    remoteVideo.style.top = t + 'px';
    remoteVideo.style.left = l + 'px';
    container.setAttribute('class', isScreenRotated ? 'screen-rotated' : undefined);
    window.removeEventListener('resize', fixPositionRemoteVideo);
    window.addEventListener('resize', fixPositionRemoteVideo);
  }
})();
