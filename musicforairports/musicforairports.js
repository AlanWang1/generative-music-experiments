let audioContext = new AudioContext();


const SAMPLE_LIBRARY = {
    
    '1st-violin': [
        {note: 'A#', octave: 3, file: 'samples/1st Violins/1st-violins-sus-a#3.wav' },
        {note: 'A#', octave: 4, file: 'samples/1st Violins/1st-violins-sus-a#4.wav' },
        {note: 'A#', octave: 5, file: 'samples/1st Violins/1st-violins-sus-a#5.wav' },
        {note: 'A#', octave: 6, file: 'samples/1st Violins/1st-violins-sus-a#6.wav' },
        {note: 'C#', octave: 4, file: 'samples/1st Violins/1st-violins-sus-c#4.wav' },
        {note: 'C#', octave: 5, file: 'samples/1st Violins/1st-violins-sus-c#5.wav' },
        {note: 'C#', octave: 6, file: 'samples/1st Violins/1st-violins-sus-c#6.wav' },
        {note: 'E', octave: 4, file: 'samples/1st Violins/1st-violins-sus-e4.wav' },
        {note: 'E', octave: 5, file: 'samples/1st Violins/1st-violins-sus-e5.wav' },
        {note: 'E', octave: 6, file: 'samples/1st Violins/1st-violins-sus-e6.wav' },
        {note: 'G', octave: 3, file: 'samples/1st Violins/1st-violins-sus-e3.wav' },
        {note: 'G', octave: 4, file: 'samples/1st Violins/1st-violins-sus-e4.wav' },
        {note: 'G', octave: 5, file: 'samples/1st Violins/1st-violins-sus-e5.wav' },
        {note: 'G', octave: 6, file: 'samples/1st Violins/1st-violins-sus-e6.wav' },
    ],

    'chorus-female': [
        {note: 'A#4', octave: 3, file: 'samples/Chorus Female/chorus-female-a#4-PB-loop.wav' },
     
    ]
}

function getSample(instrument, noteAndOctave) {
    let [, requestedNote, requestedOctave] = /^(\w[b#]?)(\d)$/.exec(noteAndOctave)
    requestedOctave = parseInt(requestedOctave, 10);
    requestedNote = flatToSharp(requestedNote);
    let sampleBank = SAMPLE_LIBRARY[instrument];
    let sample = getNearestSample(sampleBank, requestedNote, requestedOctave);
    let distance = getNoteDistance(requestedNote, requestedOctave,  sample.note, sample.octave);

    return fetchSample(sample.file).then(audioBuffer => ({
        audioBuffer: audioBuffer,
        distance: distance,
    }))
}


function playSample(instrument, note, destination, delaySeconds = 0) {
    getSample(instrument, note).then(({audioBuffer, distance}) => {
        let playbackRate = Math.pow(2 , distance /12);
        let bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.playbackRate.value = playbackRate;
        bufferSource.connect(destination);
        bufferSource.start(audioContext.currentTime + delaySeconds);
    });


}



const OCTAVE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteValue(note, octave) {
    return octave * 12 + OCTAVE.indexOf(note)
}

function getNoteDistance(note1, octave1, note2, octave2) {
    return noteValue(note1, octave1) - noteValue(note2, octave2);
}


function flatToSharp(note) {
    switch(note) {
        case 'Bb' : return 'A#';
        case 'Db' : return 'C#';
        case 'Eb' : return 'D#';
        case 'Gb' : return 'F#';
        case 'Ab' : return 'G#';
        default: return note;
    }
}

function getNearestSample(sampleBank, note, octave) {
    let sortedBank = sampleBank.slice().sort((sampleA, sampleB) => {
      let distanceToA =
        Math.abs(getNoteDistance(note, octave, sampleA.note, sampleA.octave));
      let distanceToB =
        Math.abs(getNoteDistance(note, octave, sampleB.note, sampleB.octave));
      return distanceToA - distanceToB;
    });
    return sortedBank[0];
  }


function fetchSample(path) {
    // encodeUriComponent santizes the file path (because it may contain #s), which need to be escaped when used inside URLs
    return fetch(encodeURIComponent(path))
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer));
}

function startLoop (instrument, note, destination, loopLengthSeconds, delaySeconds) {
    playSample(instrument, note, destination, delaySeconds);
    return setInterval(() => playSample(instrument, note), loopLengthSeconds * 1000);
}

function playAudio () {
    fetchSample('AirportTerminal.wav').then(convolverBuffer => {
        let convolver = audioContext.createConvolver();
        convolver.buffer = convolverBuffer;
        convolver.connect(audioContext.destination);
        startLoop('chorus-female', 'Ab3', convolver, 17.7, 3.1);
        startLoop('1st-violin', 'F4',  convolver, 40, 2.0);
        startLoop('1st-violin', 'Ab4', convolver, 30, 8.1);
        startLoop('1st-violin', 'C5',  convolver, 21.3, 5.6);
        startLoop('1st-violin', 'Db5', convolver, 22.1, 12.6);
        startLoop('1st-violin', 'Eb5', convolver, 18.4, 9.2);
        startLoop('1st-violin', 'F5',  convolver, 30.0, 14.1);
        startLoop('1st-violin', 'Ab5', convolver, 17.7, 3.1);
      });
} 
