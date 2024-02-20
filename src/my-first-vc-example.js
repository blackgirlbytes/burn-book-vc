// import { VerifiableCredential, PresentationExchange } from '@web5/credentials';
// import { DidDht } from '@web5/dids';


// const fanClubIssuerDid = await DidDht.create();
// const aliceDid = await DidDht.create();

// class SwiftiesFanClub {
//     constructor(name, legit) {
//         this.name = name;
//         this.legit = legit;
//     }
// }

// const vc = await VerifiableCredential.create({
//     type: 'SwiftiesFanClub',
//     issuer: fanClubIssuerDid.uri,
//     subject: aliceDid.uri,
//     data: new SwiftiesFanClub('Stan', true)
// });

// console.log(vc)
// const signedVcJwt = await vc.sign({ did: fanClubIssuerDid });

// console.log(signedVcJwt)

// try {
//     await VerifiableCredential.verify({ vcJwt: signedVcJwt });
//     console.log('\nVC Verification successful!\n');
// } catch (err) {
//     console.log('\nVC Verification failed: ' + err.message + '\n');
// }

// const presentationDefinition = {
//     'id': 'presDefId123',
//     'name': 'T Swift Fan Club Presentation Definition',
//     'purpose': 'for getting into the fan club',
//     'input_descriptors': [
//         {
//             'id': 'legitness',
//             'purpose': 'are you legit or not?',
//             'constraints': {
//                 'fields': [
//                     {
//                         'path': [
//                             '$.credentialSubject.legit',
//                         ]
//                     }
//                 ]
//             }
//         }
//     ]
// };

// try {
//     PresentationExchange.validateDefinition({ presentationDefinition });
//     PresentationExchange.satisfiesPresentationDefinition({ vcJwts: [signedVcJwt], presentationDefinition: presentationDefinition });
//     console.log('\nVC Satisfies Presentation Definition!\n');
// } catch (err) {
//     console.log('VC does not satisfy Presentation Definition: ' + err.message);
// }

// const presentationResult = PresentationExchange.createPresentationFromCredentials({ vcJwts: [signedVcJwt], presentationDefinition: presentationDefinition });
// console.log(presentationResult)
