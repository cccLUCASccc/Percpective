let message = '';
let time1 = null;
let time2 = null;
let analyzed = false;
let lastAnalysisTime = 0;
let seuil = 30;
let controller = new AbortController();
let essais = 3

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
  
  // if (time1 !== null && time2 !== null) {
  //   console.log(`Difference : ${time2 - time1}`);
  //   console.log(`Time1 = ${time1}`);
  //   console.log(`Time2 = ${time2}`);
  //   console.log("\n\n");
  // }
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
      if(essais > 0){
        essais--
        showToast( `⚠ Message toxique détecté: Veuillez modifier votre message. Encore ${essais} tentatives avant le bloquage. ⚠` )
      }else{
        Blocage('💀 On vous avait prévenu. 💀')
      }
      return true
    }
    else return false
  }
  catch (error) {
    console.error("Erreur lors de l'analyse:", error);
  }
};

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = '#ff4d4d';
  toast.style.color = 'white';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '9999';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function Blocage(message) {
  const blocage = document.createElement('div');
  blocage.textContent = message;
  blocage.style.position = 'fixed';
  blocage.style.top = '0';
  blocage.style.left = '0';
  blocage.style.width = '100vw';
  blocage.style.height = '100vh';
  blocage.style.backgroundColor = 'rgba(255, 77, 77, 0.95)';
  blocage.style.color = 'white';
  blocage.style.display = 'flex';
  blocage.style.justifyContent = 'center';
  blocage.style.alignItems = 'center';
  blocage.style.fontSize = '1.5rem';
  blocage.style.textAlign = 'center';
  blocage.style.padding = '20px';
  blocage.style.zIndex = '9999';

  document.body.appendChild(blocage);
}

