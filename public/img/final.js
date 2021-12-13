const socket = io()
const fromSocket = document.getElementById('userId')
const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')
const call = document.getElementById('call')
const mute = document.getElementById('mute')
const unMute = document.getElementById('unMute')
const stop = document.getElementById('stop')
const toSocket = document.getElementById('toSocket')
let tracks = []
configuration = {iceServers : [{urls : 'stun:stun.l.google.com:19302'}]}
let peer = new RTCPeerConnection(configuration)
let fromSocketId, toSocketId

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

//Create Offer
const createOffer = async() => {
    try {
        let stream = await  openMediaDevices()
        stream.getTracks().forEach( track => peer.addTrack(track))
        let offer = await peer.createOffer()
        peer.setLocalDescription (new RTCSessionDescription(offer))
        toSocketId = toSocket.value

        //send Offer to Server
        socket.emit('offer', {'offer': offer, "fromSocketId": fromSocketId, 'toSocketId': toSocketId})

        //Ice candidate
        peer.addEventListener('icecandidate', (e) => {
            if (e.candidate){
                socket.emit('callerCandidate', {'candidate': e.candidate,"fromSocketId": fromSocketId, 'toSocketId': toSocketId })
            }   
        })
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

        //Send Answer to Server
        socket.emit('answer', {'answer': answer, 'destination': destination})

        //Ice candidate
        peer.addEventListener('icecandidate', (e) => {
            if (e.candidate){
                socket.emit('calleeCandidate', {'candidate': e.candidate, 'destination': destination})
            }
        })

    } catch (error) {
        console.log(error)
    } 
}

//Receive Offer
socket.on('offer', data => {
    peer.setRemoteDescription(data.offer)
    let stream = new MediaStream()
    peer.ontrack = event => {
        stream.addTrack(event.track)
        console.log(event)
        remoteVideo.srcObject = stream
        remoteVideo.play()
    }
    createAnswer(data.fromSocketId)
})

//Receive Answer
socket.on('answer', data => {
    peer.setRemoteDescription(data.answer)
    let stream = new MediaStream()
    peer.ontrack = event => {
        stream.addTrack(event.track)
        remoteVideo.srcObject =  stream
        remoteVideo.play()
    }    
})

//Start a Call
call.addEventListener('click',() => {
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

socket.on('callerCandidate', data => {
    peer.addIceCandidate(data)
})

socket.on('calleeCandidate', data => {
    peer.addIceCandidate(data)
})