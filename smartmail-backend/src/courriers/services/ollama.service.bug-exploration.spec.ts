import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { OllamaService } from './ollama.service';

describe('OllamaService - Bug Condition Exploration Tests', () => {
  let service: OllamaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OllamaService],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
  });

  /**
   * Property 1: Bug Condition - Génération Réponse Officielle Tunisie Telecom
   * **Validates: Requirements 2.1, 2.2**
   * 
   * CRITIQUE: Ce test DOIT ÉCHOUER sur le code non corrigé - l'échec confirme l'existence du bug
   * NE PAS tenter de corriger le test ou le code quand il échoue
   * 
   * Test que genererReponse(objet, contenu) génère une vraie réponse officielle Tunisie Telecom
   * avec accusé de réception et actions prévues, et NON une reformulation du problème client
   */
  describe('Property 1: Bug Condition - Génération Réponse Officielle Tunisie Telecom', () => {
    
    it('should generate official Tunisie Telecom response for technical complaint', async () => {
      // Skip if Ollama is not available
      const isAvailable = await service.isAvailable();
      if (!isAvailable) {
        console.log('Skipping test - Ollama service not available');
        return;
      }
      // GIVEN: Réclamation technique - "Panne réseau zone industrielle Ben Arous"
      const objet = 'Panne réseau zone industrielle Ben Arous';
      const contenu = 'Monsieur, je vous signale une panne réseau persistante dans la zone industrielle de Ben Arous depuis 3 jours. Nos équipements ne fonctionnent plus. Merci de votre intervention rapide.';

      // WHEN: Génération de réponse
      const response = await service.genererReponse(objet, contenu);

      // THEN: Doit générer une vraie réponse TT avec accusé réception + intervention programmée
      expect(response).toBeTruthy();
      
      // La réponse doit contenir des éléments de réponse officielle Tunisie Telecom
      const responseText = response!.toLowerCase();
      
      // Doit contenir un accusé de réception (pas juste reformuler le problème)
      const hasAcknowledgment = responseText.includes('suite à') || 
                                responseText.includes('accusons réception') || 
                                responseText.includes('avons bien reçu votre signalement');
      
      // Doit mentionner des actions concrètes de Tunisie Telecom
      const hasOfficialActions = responseText.includes('nos équipes') || 
                                 responseText.includes('intervention') || 
                                 responseText.includes('programmée') ||
                                 responseText.includes('24h') ||
                                 responseText.includes('48h');
      
      // Doit avoir une signature officielle Tunisie Telecom
      const hasOfficialSignature = responseText.includes('tunisie telecom') ||
                                   responseText.includes('équipe technique') ||
                                   responseText.includes('service client');
      
      // NE DOIT PAS simplement reformuler le problème du client
      const isNotClientReformulation = !responseText.includes('vous signalez une panne') &&
                                       !responseText.includes('votre problème de réseau') &&
                                       !responseText.includes('concernant la panne que vous mentionnez');
      
      // ASSERTION: Toutes ces conditions doivent être vraies pour une réponse officielle correcte
      expect(hasAcknowledgment).toBe(true);
      expect(hasOfficialActions).toBe(true);
      expect(hasOfficialSignature).toBe(true);
      expect(isNotClientReformulation).toBe(true);
    });

    it('should generate official Tunisie Telecom response for information request', async () => {
      // Skip if Ollama is not available
      const isAvailable = await service.isAvailable();
      if (!isAvailable) {
        console.log('Skipping test - Ollama service not available');
        return;
      }
      // GIVEN: Demande information - "Informations offres fibre"
      const objet = 'Informations sur vos offres fibre optique';
      const contenu = 'Madame, Monsieur, je souhaiterais avoir des informations détaillées sur vos offres fibre optique pour particuliers. Quels sont les débits et tarifs disponibles?';

      // WHEN: Génération de réponse
      const response = await service.genererReponse(objet, contenu);

      // THEN: Doit générer réponse TT avec informations + contact conseiller
      expect(response).toBeTruthy();
      
      const responseText = response!.toLowerCase();
      
      // Doit fournir des informations concrètes (pas juste reformuler la demande)
      const hasInformationProvision = responseText.includes('nos offres fibre') || 
                                      responseText.includes('catalogue') || 
                                      responseText.includes('nos conseillers');
      
      // Doit proposer un contact ou suivi
      const hasFollowUp = responseText.includes('contactera') || 
                          responseText.includes('rendez-vous') || 
                          responseText.includes('48h');
      
      // NE DOIT PAS reformuler la demande du client
      const isNotClientReformulation = !responseText.includes('vous souhaitez des informations') &&
                                       !responseText.includes('votre demande concerne');
      
      expect(hasInformationProvision).toBe(true);
      expect(hasFollowUp).toBe(true);
      expect(isNotClientReformulation).toBe(true);
    });

    it('should generate official Tunisie Telecom response for bill contestation', async () => {
      // Skip if Ollama is not available
      const isAvailable = await service.isAvailable();
      if (!isAvailable) {
        console.log('Skipping test - Ollama service not available');
        return;
      }
      // GIVEN: Contestation facture - "Facture janvier élevée"
      const objet = 'Contestation facture janvier anormalement élevée';
      const contenu = 'Bonjour, ma facture de janvier 2024 s\'élève à 180 DT au lieu des 45 DT habituels. Je conteste cette facture car je n\'ai pas changé mon utilisation. Merci de vérifier.';

      // WHEN: Génération de réponse
      const response = await service.genererReponse(objet, contenu);

      // THEN: Doit générer réponse TT avec vérification + geste commercial potentiel
      expect(response).toBeTruthy();
      
      const responseText = response!.toLowerCase();
      
      // Doit proposer une vérification concrète
      const hasVerification = responseText.includes('vérification') || 
                              responseText.includes('analyser votre dossier') || 
                              responseText.includes('examiner');
      
      // Doit mentionner un délai de traitement
      const hasProcessingTime = responseText.includes('5 jours') || 
                                responseText.includes('délai') || 
                                responseText.includes('sous');
      
      // NE DOIT PAS reformuler la contestation du client
      const isNotClientReformulation = !responseText.includes('votre facture est élevée') &&
                                       !responseText.includes('vous contestez votre facture');
      
      expect(hasVerification).toBe(true);
      expect(hasProcessingTime).toBe(true);
      expect(isNotClientReformulation).toBe(true);
    });

    /**
     * Property-based test: Pour tout courrier client valide, la réponse générée doit être 
     * une réponse officielle de Tunisie Telecom, pas une reformulation du problème client
     */
    it('should generate official responses for any valid courrier (property-based test)', async () => {
      // Skip if Ollama is not available to avoid false failures
      const isAvailable = await service.isAvailable();
      if (!isAvailable) {
        console.log('Skipping property test - Ollama service not available');
        return;
      }

      await fc.assert(
        fc.asyncProperty(
          // Generate various types of courriers
          fc.record({
            objet: fc.oneof(
              fc.constant('Panne internet depuis 2 jours'),
              fc.constant('Demande information forfait mobile'),
              fc.constant('Réclamation facturation erronée'),
              fc.constant('Problème ligne téléphonique fixe'),
              fc.constant('Demande résiliation contrat')
            ),
            contenu: fc.oneof(
              fc.constant('Monsieur, je rencontre des problèmes avec mon service internet depuis avant-hier.'),
              fc.constant('Madame, pouvez-vous m\'envoyer les détails de vos forfaits mobile actuels?'),
              fc.constant('Bonjour, je conteste ma dernière facture qui me semble incorrecte.'),
              fc.constant('Bonsoir, ma ligne fixe ne fonctionne plus depuis ce matin.'),
              fc.constant('Monsieur, je souhaite résilier mon contrat internet.')
            )
          }),
          async ({ objet, contenu }) => {
            // WHEN: Génération de réponse
            const response = await service.genererReponse(objet, contenu);
            
            // IF response is generated (service available)
            if (response) {
              const responseText = response.toLowerCase();
              
              // THEN: Response should be official, not a client problem reformulation
              const isOfficialResponse = (
                // Should have acknowledgment/reception
                (responseText.includes('suite à') || responseText.includes('accusons') || responseText.includes('avons reçu')) ||
                // Should have official actions/next steps  
                (responseText.includes('nos équipes') || responseText.includes('service') || responseText.includes('conseiller')) ||
                // Should have Tunisie Telecom branding/signature
                (responseText.includes('tunisie telecom') || responseText.includes('cordialement'))
              );
              
              // Should NOT be a reformulation of client problem
              const isNotReformulation = !(
                responseText.includes('vous rencontrez') ||
                responseText.includes('votre problème') ||
                responseText.includes('vous signalez') ||
                responseText.includes('selon votre message')
              );
              
              // Property assertion: Response must be official and not a reformulation
              expect(isOfficialResponse).toBe(true);
              expect(isNotReformulation).toBe(true);
            }
          }
        ),
        { numRuns: 10, timeout: 60000 } // Reduced runs for performance, increased timeout for Ollama calls
      );
    });
  });
});