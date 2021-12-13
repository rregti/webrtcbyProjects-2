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

        //Send Answer to Server
        socket.emit('answer', {'answer': answer, 'destination': destination})

    } catch (error) {
        console.log(error)
    } 
}

//Receive Offer
socket.on('offer', data => {
    peer.setRemoteDescription(data.offer)
    console.log(peer)
    createAnswer(data.fromSocketId)
    peer.ontrack = e => {
        remoteVideo.srcObject = e.streams[0]
    }
})

//Receive Answer
socket.on('answer', data => {
    peer.setRemoteDescription(data.answer)
    peer.ontrack = e => {
        remoteVideo.srcObject = e.streams[0]
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
