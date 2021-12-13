const socket = io()
const fromSocket = document.getElementById('userId')
const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')
const videoEl = document.getElementById('videoEl')
const canvasEl = document.getElementById('canvasEl')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const call = document.getElementById('call')
const mute = document.getElementById('mute')
const unMute = document.getElementById('unMute')
const stop = document.getElementById('stop')
const toSocket = document.getElementById('toSocket')
let tracks = []
configuration = {iceServers : [{urls : ['stun:stun.l.google.com:19302']}],iceTransportPolicy: 'all'}
let peer = new RTCPeerConnection(configuration)
let fromSocketId, toSocketId
canvasEl.hidden = true
let x,y,z
var points = []

//Get socket Id
socket.on('connect', () => {
    fromSocket.innerHTML = socket.id
    fromSocketId = socket.id
})

//get Local Media
const openMediaDevices = async() => {
    try {
        let stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
        localVideo.srcObject = stream
        tracks = stream.getTracks()
        return stream
    } catch (error) {
        console.log(error)
    }
}

//Display localVideo on Canvas
localVideo.addEventListener('loadedmetadata', () => {
    canvas.width = localVideo.videoWidth
    canvas.height = localVideo.videoHeight
}) 
localVideo.addEventListener('play', () => {
    const loop = () => {
        if(!localVideo.paused && !localVideo.ended) {
            ctx.drawImage(localVideo,0,0)
            setTimeout(loop,30)
            draw()
        }
    }
    loop()
})

//Get Position
const getPosition = (e) => {
    let rect = canvas.getBoundingClientRect()
    let correctX = canvas.width / rect.width
    let correctY = canvas.height / rect.height
    if (e.buttons !== 1) return
    z=1
    x = (e.clientX - rect.left) * correctX
    y = (e.clientY - rect.top) * correctY
    points.push({x,y,z})
}

//get End Points
const getEndPoints = () => {
    points.slice(-1)[0].z =0
}
//Draw Function
const draw = () => {
    points.forEach( item => {
        let nextItem = points[points.indexOf(item)+1]
        ctx.beginPath()
        ctx.lineWidth = 5
        ctx.strokeStyle = 'red'
        if(item.z==1){
            ctx.moveTo(item.x,item.y)
            if(typeof nextItem !=='undefined'){
            ctx.lineTo(nextItem.x,nextItem.y)
            ctx.stroke()
            }          
        }
    })
}

//Erase
erase.addEventListener('click', () => points = [] )

//Draw with mouse on canvas
canvas.addEventListener('mousemove', getPosition)
canvas.addEventListener('mouseup', getEndPoints)


//get Canvas Media
const getCanvasStream = async() => {
    try {
        let stream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
        localVideo.srcObject = stream
        tracks = stream.getTracks()
        let canvasStream = canvas.captureStream()
        if (stream.getAudioTracks()[0]) {
            canvasStream.addTrack(stream.getAudioTracks()[0])
        }
        console.log('canvasStream tracks: ', canvasStream.getTracks())
        return canvasStream 
    } catch (error) {
        console.log(error)
    }
}

//Create Offer
const createOffer = async() => {
    try {
        let stream = await getCanvasStream()
        stream.getTracks().forEach( track => peer.addTrack(track))
        let offer = await peer.createOffer()
        peer.setLocalDescription (new RTCSessionDescription(offer))
        //Ice Candidate
        peer.addEventListener('icecandidate', e => {
            if (e.candidate){
                socket.emit('callerCandidate',{'candidate': e.candidate, "fromSocketId": fromSocketId, 'toSocketId': toSocketId})
            }     
        })
        //send Offer to Server
        toSocketId = toSocket.value
        socket.emit('offer', {'offer': offer, "fromSocketId": fromSocketId, 'toSocketId': toSocketId})
    } catch (error) {
        console.log(error)
    }
}

//create Answer
const createAnswer = async(destination) => {
    try {
        let stream = await  openMediaDevices()
        stream.getTracks().forEach( track => peer.addTrack(track))
        let answer = await peer.createAnswer()
        peer.setLocalDescription (new RTCSessionDescription(answer))
        //Ice Candidate
        peer.addEventListener('icecandidate', e => {
            if (e.candidate){
                socket.emit('calleeCandidate',{'candidate': e.candidate, 'destination': destination})
            }     
        })
        //Send Answer to Server
        socket.emit('answer', {'answer': answer, 'destination': destination})

    } catch (error) {
        console.log(error)
    } 
}

//Receive Offer
socket.on('offer', data => {
    peer.setRemoteDescription(data.offer)
    let stream = new MediaStream()
    createAnswer(data.fromSocketId)
    peer.ontrack = e => {
        stream.addTrack(e.track)
        remoteVideo.srcObject = stream
    }
})

//Receive Answer
socket.on('answer', data => {
    peer.setRemoteDescription(data.answer)
    let stream = new MediaStream()
    peer.ontrack = e => {
        stream.addTrack(e.track)
        remoteVideo.srcObject = stream
    }
})

//Start a Call
call.addEventListener('click',() => {
    canvasEl.hidden = false
    videoEl.hidden = true
    createOffer()
    mute.addEventListener('click',muteTracks)
    stop.addEventListener('click',stopTracks)
})

//Mute Tracks
const muteTracks = () => {
    tracks.forEach( track => track.enabled = false)
    unMute.addEventListener('click',unMuteTracks)
}

//unMute Tracks
const unMuteTracks = () => {
    tracks.forEach( track => track.enabled = true)
}

//Stop Tracks
const stopTracks = () => {
    tracks.forEach( track => track.stop())
}

//caller Candidates
socket.on('callerCandidate', data => {
    peer.addIceCandidate(data)
})

//callee Candidates
socket.on('calleeCandidate', data => {
    peer.addIceCandidate(data)
})
