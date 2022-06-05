 'use strict';

  const volume = document.getElementById('volume')
  const bass = document.getElementById('bass')
  const mid = document.getElementById('mid')
  const treble = document.getElementById('treble')
  const visualizer = document.getElementById('visualizer')

  const audioCtx = new AudioContext()
   
  var analyser = new AnalyserNode(audioCtx, { fftSize: 256 })
    

  setupContext();


    var svgHeight = 300,
        svgWidth = 600;

    var svg = d3.select('#visualizerBlock').append('svg')
        .attr("width", svgWidth)
        .attr("height", svgHeight)

  

  //Cvor za kontrolu pojacanja ulaznog signala
  const gainNode = new GainNode(audioCtx, {
     gain: volume.value})

  //Cvor za pojacanje svih frekvencija ulaznog signala ispod 500Hz
  const bassEQ = new BiquadFilterNode(audioCtx, {
    type: 'lowshelf',
    frequency: 500,
    gain: bass.value
  })

  //Cvor za pojacanje srednjih frekvencija ulaznog signala
  const midEQ = new BiquadFilterNode(audioCtx, {
    type: 'peaking',
    Q: Math.SQRT1_2,
    frequency: 1500,
    gain: mid.value
  })

  //Cvor za pojacanje svih frekvencija iznad 3KHz
  const trebleEQ = new BiquadFilterNode(audioCtx, {
    type: 'highshelf',
    frequency: 3000,
    gain: treble.value
  })


  //Funkcija za stvaranje Event listenera za rukovanje kliznim kontrolama pojačanja i vrijednosti filtera.
  function setupEventListeners() {

    window.addEventListener('resize', resize)

    volume.addEventListener('input', e => {
      const value = parseFloat(e.target.value)
      gainNode.gain.setTargetAtTime(value, audioCtx.currentTime, .01)
    })

    bass.addEventListener('input', e => {
      const value = parseInt(e.target.value)
      bassEQ.gain.setTargetAtTime(value, audioCtx.currentTime, .01)
    })

    mid.addEventListener('input', e => {
      const value = parseInt(e.target.value)
      midEQ.gain.setTargetAtTime(value, audioCtx.currentTime, .01)
    })

    treble.addEventListener('input', e => {
      const value = parseInt(e.target.value)
      trebleEQ.gain.setTargetAtTime(value, audioCtx.currentTime, .01)
    })

  }

  setupEventListeners();

  
  async function setupContext() {

    const audioSource = await getSource()

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }

    const source = audioCtx.createMediaStreamSource(audioSource)

    source
      .connect(bassEQ)
      .connect(midEQ)
      .connect(trebleEQ)
      .connect(gainNode)
      .connect(analyser)
      .connect(audioCtx.destination)
  }


  function getSource() {
      return navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          latency: 0
        }
      })
    }



    function resize() {
      svgWidth = visualizer.clientWidth * window.devicePixelRatio
      svgHeight = visualizer.clientHeight * window.devicePixelRatio
    }



  resize();

     
      function renderVisual() {
          requestAnimationFrame(renderVisual);

          var bufferLength= analyser.frequencyBinCount
       
          var frequencyData = new Uint8Array(bufferLength);

          analyser.getByteFrequencyData(frequencyData);
          

          // Definira veličinu radijusa koncentričnih kružnica ovisno o frekvenciji
          var radiusScale = d3.scaleLinear()
              .domain([0, d3.max(frequencyData)])
              .range([0, svgHeight -10]);

          // definira skalu boja kojom će biti obojene kružnice (u ovom slučaju potpuni prostor boja)
          var hueScale = d3.scaleLinear()
              .domain([0, d3.max(frequencyData)])
              .range([0, 360]);

        // update d3 chart with new data
        var circles = svg.selectAll('circle')
            .data(frequencyData);

          circles.enter().append('circle');

          circles
            .attr("r", function(d) { return radiusScale(d); } )
            .attr("cx", svgWidth)
            .attr("cy", svgHeight)
            .attr("fill", 'none')
            .attr("stroke-width", 6)
            .attr("stroke-opacity", 0.5)
            .attr("stroke", function(d) { return d3.hsl(hueScale(d), 1, 0.5); } );
    

          circles.exit().remove(); 
      }

      
      renderVisual();


