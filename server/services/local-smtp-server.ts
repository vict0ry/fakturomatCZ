import { SMTPServer } from 'smtp-server';
import * as fs from 'fs';
import * as path from 'path';

export class LocalSMTPServer {
  private server: SMTPServer;
  private port: number;
  private isRunning: boolean = false;

  constructor(port: number = 2525) {
    this.port = port;
    
    this.server = new SMTPServer({
      name: 'doklad.ai',
      banner: 'Doklad.ai Local SMTP Server',
      authOptional: true,
      secure: false,
      disabledCommands: ['STARTTLS'],
      
      onMailFrom(address: any, session: any, callback: any) {
        console.log(`📧 Mail from: ${address.address}`);
        callback();
      },
      
      onRcptTo(address: any, session: any, callback: any) {
        console.log(`📧 Mail to: ${address.address}`);
        callback();
      },
      
      onData(stream: any, session: any, callback: any) {
        let emailData = '';
        
        stream.on('data', (chunk: any) => {
          emailData += chunk.toString();
        });
        
        stream.on('end', () => {
          console.log('📧 Email received and processed:');
          console.log('-----------------------------------');
          
          // Parse basic email headers
          const lines = emailData.split('\n');
          let subject = '';
          let to = '';
          let from = '';
          
          lines.forEach(line => {
            if (line.startsWith('Subject:')) subject = line.substring(8).trim();
            if (line.startsWith('To:')) to = line.substring(3).trim();
            if (line.startsWith('From:')) from = line.substring(5).trim();
          });
          
          console.log(`From: ${from}`);
          console.log(`To: ${to}`);
          console.log(`Subject: ${subject}`);
          console.log('-----------------------------------');
          
          // Save email to file for debugging
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `email-${timestamp}.txt`;
          const emailsDir = path.join(process.cwd(), 'sent-emails');
          
          if (!fs.existsSync(emailsDir)) {
            fs.mkdirSync(emailsDir, { recursive: true });
          }
          
          fs.writeFileSync(path.join(emailsDir, filename), emailData);
          console.log(`💾 Email saved to: sent-emails/${filename}`);
          
          callback();
        });
      },
      
      onError(error: any) {
        console.error('❌ SMTP Server error:', error);
      }
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        this.isRunning = true;
        console.log(`🚀 Local SMTP Server running on port ${this.port}`);
        console.log(`📧 Ready to receive emails for doklad.ai`);
        resolve();
      });
      
      this.server.on('error', (error) => {
        console.error('❌ Failed to start SMTP server:', error);
        reject(error);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isRunning) {
        this.server.close(() => {
          this.isRunning = false;
          console.log('🛑 Local SMTP Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getPort(): number {
    return this.port;
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }
}