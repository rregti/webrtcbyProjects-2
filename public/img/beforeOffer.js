const socket = io()
const fromSocket = document.getElementById('userId')
const localVideo = document.getElementById('localVideo')
const call = document.getElementById('call')
const mute = document.getElementById('mute')
const unMute = document.getElementById('unMute')
const stop = document.getElementById('stop')
let tracks = []

const configuration ={iceServers : [{urls: 'stun:stun.l.google.com:19302'}]}
let peer = new RTCPeerConnection(configuration)
console.log(peer)

//Get socket Id
socket.on('connect', () => {
    fromSocket.innerHTML = socket.id
})

//get Local Media
const openMediaDevices = async() => {
    try {
        let stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true})
        localVideo.srcObject = stream
        tracks = stream.getTracks()
    } catch (error) {
        console.log(error)
    }
}

//Start a Call
call.addEventListener('click',() => {
    openMediaDevices()
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
