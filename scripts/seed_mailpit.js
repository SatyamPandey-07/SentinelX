const net = require('net');

function sendEmail(from, to, subject, body) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(1025, 'localhost', () => {
      let step = 0;
      client.on('data', (data) => {
        const str = data.toString();
        if (str.startsWith('220')) {
          client.write('HELO localhost\r\n');
        } else if (str.startsWith('250') && step === 0) {
          step++;
          client.write(`MAIL FROM:<${from}>\r\n`);
        } else if (str.startsWith('250') && step === 1) {
          step++;
          client.write(`RCPT TO:<${to}>\r\n`);
        } else if (str.startsWith('250') && step === 2) {
          step++;
          client.write('DATA\r\n');
        } else if (str.startsWith('354')) {
          const msg = [
            `From: SentinelX Alert <${from}>`,
            `To: <${to}>`,
            `Subject: ${subject}`,
            `Date: ${new Date().toUTCString()}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            body,
            '.\r\n'
          ].join('\r\n');
          client.write(msg);
          step++;
        } else if (str.startsWith('250') && step === 3) {
          client.write('QUIT\r\n');
          resolve(true);
        }
      });
    });
    client.on('error', reject);
  });
}

(async () => {
  try {
    await sendEmail(
      'dispatch@sentinelx.local',
      'afifasyed06@gmail.com',
      '[CRITICAL] Incident #INC-8924 Dispatched - Chemical Spill in Sector 4',
      '<h2>SENTINELX DISPATCH NOTIFICATION</h2><p><b>Priority:</b> <span style="color:red;">CRITICAL</span></p><p><b>Location:</b> Chemistry Lab Block B, Floor 2</p><p><b>Assigned Unit:</b> Hazmat Team Alpha</p><p><b>SLA Ack Target:</b> 60 seconds</p>'
    );
    await sendEmail(
      'sla-engine@sentinelx.local',
      'afifasyed06@gmail.com',
      '[RESOLVED] Incident #INC-8919 - Electrical Hazard Cleared',
      '<h2>SLA Engine Confirmation</h2><p>Incident #INC-8919 marked as RESOLVED within 4m 12s (Target: 15m 00s). SLA Compliance: 100%.</p>'
    );
    await sendEmail(
      'security@sentinelx.local',
      'pandeysatyam1802@gmail.com',
      '[SECURITY AUDIT] Super Admin Access Verified - Afifa Syed',
      '<h2>Audit Ledger Event</h2><p>Cryptographic hash verification passed. Session authenticated with Super Admin authority.</p>'
    );
    console.log('Seeded 3 emergency emails to Mailpit successfully!');
  } catch (err) {
    console.error('Mailpit seed error:', err);
  }
})();
