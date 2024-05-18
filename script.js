// Function to visualize sound
function visualizeSound(stream) {
  // Create an audio context
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  // Create an audio source from the microphone stream
  const audioSource = audioContext.createMediaStreamSource(stream);
  
  // Create a new AnalyserNode
  const analyser = audioContext.createAnalyser();
  // Connect the audio source to the analyser
  audioSource.connect(analyser);
  
  // Set the size of the Fast Fourier Transform (FFT) to 256
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Get the sphere element
  const sphere = document.getElementById('sphere');
  
  // Define maximum scale factor
  const maxScaleFactor = 2; // Adjust as needed

  // Function to render the visualization
  function draw() {
    // Request animation frame to keep drawing
    requestAnimationFrame(draw);

    // Get the current frequency data
    analyser.getByteFrequencyData(dataArray);

    // Calculate the average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    // Scale the size of the sphere based on the average volume
    let scaleFactor = 1 + average / 100;
    scaleFactor = Math.min(scaleFactor, maxScaleFactor); // Limit to maxScaleFactor
    sphere.style.transform = `scale(${scaleFactor})`;
  }

  // Start drawing the visualization
  draw();

  // Web Speech API
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
  
    // Configure recognition settings if needed
    recognition.continuous = true;
    // recognition.interimResults = true;

  
    // Start recognition
    recognition.start();
  
    // Event handlers
    recognition.onresult = function(event) {
      const transcript = event.results[event.results.length - 1][0].transcript;
      console.log('Transcript:', transcript);
      console.log("type of translater",typeof JSON.stringify({ question: transcript}))
      fetch(`http://127.0.0.1:5000/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "question": transcript})
      })
      .then((res)=>{
        if (!res.ok){
            console.log("Error is fetching tthe answer")
        }
        return res.json();
      })
      .then((data)=>{
        answer = data.answer;
        similarity = data.similarity;
        console.log("Answer:", answer);
        console.log("Similarity:", similarity);
        // Text to speech
        if ('speechSynthesis' in window) {
          const synth = new SpeechSynthesisUtterance();
          synth.text = answer;
          speechSynthesis.speak(synth);
        } else {
          console.error("Speech Synthesis API not supported");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    };
  
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      // Restart recognition after an error
      // recognition.restart();
    };

    // recognition.onspeechend = () => {
    //   recognition.stop();
    //   console.log("Speech recognition has stopped.");
    // };
    // recognition.onend=()=>{
    //   recognition.start();
    // }
    
  } else {
    console.error('Web Speech API is not supported in this browser');
  }
}

// Event listener for when the "Start Visualization" button is clicked
document.getElementById('startButton').addEventListener('click', async () => {
  try {
    // Request access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }, { once: true });
    console.log("this is permisstion")
    // Start visualizing sound
    visualizeSound(stream);
  } catch (err) {
    console.error('Error accessing microphone:', err);
  }
});
