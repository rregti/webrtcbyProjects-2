const socket = io()
const fromSocket = document.getElementById('userId')
const localVideo = document.getElementById('localVideo')
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

//receive Offer
socket.on('offer', data => console.log('received Offer: ', data))

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
