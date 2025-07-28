#!/usr/bin/env node

import { SESClient, GetIdentityVerificationAttributesCommand } from '@aws-sdk/client-ses';

async function checkSESStatus() {
  console.log('🔍 Kontrola Amazon SES stavu...\n');

  const sesClient = new SESClient({
    region: process.env.AWS_SES_REGION || 'eu-north-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    // Zkontrolovat stav verifikace domény
    const command = new GetIdentityVerificationAttributesCommand({
      Identities: ['doklad.ai'],
    });

    const response = await sesClient.send(command);
    const verificationStatus = response.VerificationAttributes['doklad.ai'];

    console.log('📧 Stav domény doklad.ai:');
    console.log('Status:', verificationStatus?.VerificationStatus || 'Not Found');
    console.log('Token:', verificationStatus?.VerificationToken || 'N/A');

    if (verificationStatus?.VerificationStatus === 'Success') {
      console.log('✅ Doména je úspěšně verifikovaná!');
      console.log('💡 Problem může být v SMTP credentials - možná potřebujete nové vygenerovat.');
    } else {
      console.log('❌ Doména ještě není verifikovaná');
    }

  } catch (error) {
    console.log('❌ SES API chyba:', error.message);
    if (error.message.includes('credentials')) {
      console.log('💡 Zkontrolujte AWS credentials v environment variables');
    }
  }
}

checkSESStatus().catch(console.error);