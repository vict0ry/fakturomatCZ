import { SESClient, GetIdentityVerificationAttributesCommand } from '@aws-sdk/client-ses';

console.log('🔍 KONTROLA DOMAIN VERIFIKACE V AMAZON SES');
console.log('==========================================');

const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const checkDomainVerification = async () => {
  try {
    const command = new GetIdentityVerificationAttributesCommand({
      Identities: ['doklad.ai']
    });
    
    const response = await sesClient.send(command);
    console.log('📋 Domain verification status:');
    console.log(JSON.stringify(response.VerificationAttributes, null, 2));
    
    if (response.VerificationAttributes['doklad.ai']) {
      const status = response.VerificationAttributes['doklad.ai'].VerificationStatus;
      console.log(`\n✅ Domain doklad.ai status: ${status}`);
      
      if (status !== 'Success') {
        console.log('\n❌ PROBLÉM IDENTIFIKOVÁN: Domain není verified!');
        console.log('\n🔧 ŘEŠENÍ:');
        console.log('1. AWS Console → SES → Verified identities');
        console.log('2. Create identity → Domain → doklad.ai');
        console.log('3. Přidejte TXT záznam do DNS');
        console.log('4. Počkejte na verifikaci (může trvat až 72 hodin)');
      }
    } else {
      console.log('\n❌ Domain doklad.ai není přidán do SES!');
      console.log('\n🔧 NUTNÉ KROKY:');
      console.log('1. AWS Console → SES → Verified identities');
      console.log('2. Create identity → Domain → doklad.ai');
      console.log('3. Přidejte DNS záznamy pro verifikaci');
    }
  } catch (error) {
    console.log('❌ Chyba při kontrole:', error.message);
    console.log('\n💡 ALTERNATIVNÍ RYCHLÉ ŘEŠENÍ:');
    console.log('Dokud není doména verified, můžeme použít Gmail SMTP');
  }
};

checkDomainVerification();