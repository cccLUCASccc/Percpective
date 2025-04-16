let message = '';
let time1 = null;
let time2 = null;
let analyzed = false;
let lastAnalysisTime = 0;
let seuil = 30;
let controller = new AbortController();

document.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !analyzed) {
    event.preventDefault();
    event.stopPropagation();
    console.log(`Touche "${event.key}" désactivée`);
  }
  else if(event.key === 'Enter' && analyzed){
    time1 = null
    time2 = null
    message = ''
    analyzed = false
  }
  else if (event.key === 'Delete'){
    console.log('Delete')
    console.log(message)
    message = message.substring(0, message.length - 1)
    console.log(message)
  }
  else if (event.key.length === 1) {
    message += event.key;
    console.log(message.length);
   if(message.length > 2){
      if (time1 === null) {
        time1 = Date.now();
      } else if (time2 === null) {
        time2 = Date.now();
      } else {
        time1 = time2;
        time2 = Date.now();
        if((time2 - time1) > 1000){
          analyze(message)
          analyzed = true
        }
      }
   }
  }
  
  if (time1 !== null && time2 !== null) {
    console.log(`Difference : ${time2 - time1}`);
    console.log(`Time1 = ${time1}`);
    console.log(`Time2 = ${time2}`);
    console.log("\n\n");
  }
}, true);

const analyze = async (text) => {
  if (!text || text.trim() === '') return;
  
  try {
    controller = new AbortController();
    const response = await fetch("https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=AIzaSyAs3EeoKDFSXJwRuuvgN1Y97I4dhFBqtDw", 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          comment: { text },
          languages: ["fr"],          
          requestedAttributes: { TOXICITY: {} }
        })
      }
    );
    
    const result = await response.json();
    console.log("Analyse de toxicité:", result);
    
    const toxicityScore = result.attributeScores?.TOXICITY?.summaryScore?.value;
    if (toxicityScore !== undefined) {
      console.log(`Score de toxicité: ${toxicityScore * 100}%`);
    }

    if(toxicityScore > seuil / 100){
      return true
    }
    else return false
  }
  catch (error) {
    console.error("Erreur lors de l'analyse:", error);
  }
};

