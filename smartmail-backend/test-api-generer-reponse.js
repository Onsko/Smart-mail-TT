const fetch = require('node-fetch');

async function testAPIGenerateResponse() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('=== Test de l\'API de génération de réponse ===\n');
  
  try {
    // Test avec les données du courrier de Ben Arous
    const response = await fetch(`${baseUrl}/courriers/ia/generer-reponse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: En production, il faudrait un token JWT valide
      },
      body: JSON.stringify({
        objet: 'Panne réseau zone industrielle Ben Arous',
        contenu: 'Monsieur le Responsable Technique, Je me permets de vous signaler un incident technique de grande ampleur affectant la connectivité de plusieurs entreprises situées dans la zone industrielle de Ben Arous depuis ce matin.'
      })
    });
    
    console.log(`📡 Statut de réponse: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Réponse reçue:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.result) {
        console.log('\n🎯 Réponse générée par l\'IA:');
        console.log(data.result);
      } else if (data.error) {
        console.log('\n⚠️ Service IA indisponible:');
        console.log(data.error);
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Erreur API:');
      console.log(errorData);
    }
    
  } catch (error) {
    console.log('❌ Erreur de connexion:');
    console.log('Le serveur backend n\'est probablement pas démarré.');
    console.log('Démarrez-le avec: npm run start:dev');
    console.log(`Détails: ${error.message}`);
  }
}

testAPIGenerateResponse();