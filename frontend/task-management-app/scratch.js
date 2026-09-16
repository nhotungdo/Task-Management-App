const axios = require('axios');

async function run() {
  try {
    const loginRes = await axios.post('https://localhost:7070/api/Auth/login', {
      email: 'admin@example.com', // guess email or just create a user
      password: 'password'
    }, {
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
    console.log("Login success");
  } catch (e) {
    console.log("Login failed", e.response?.status, e.response?.data);
  }
}
run();
