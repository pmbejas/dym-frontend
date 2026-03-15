const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'pmbejas@gmail.com',
      password: 'Pano+9417*'
    });
    const token = loginRes.data.token;
    console.log('Got token:', token ? 'yes' : 'no');

    const confRes = await axios.get('http://localhost:3001/api/configuracion', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Config fetch success:', confRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error body:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}
test();
