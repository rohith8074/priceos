const https = require('https');
const data = JSON.stringify({
  user_id: "test",
  agent_id: "699803c5849501fb4267fb54",
  session_id: "test-1234",
  message: "hi"
});
const options = {
  hostname: 'agent-prod.studio.lyzr.ai',
  port: 443,
  path: '/v3/inference/stream/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sk-default-S0OssWSJz7srVhD7HtJFDcsbA2FPmFk0',
    'Content-Length': data.length
  }
};
const req = https.request(options, (res) => {
  res.on('data', (d) => {
    console.log("CHUNK:", JSON.stringify(d.toString()));
  });
});
req.write(data);
req.end();
