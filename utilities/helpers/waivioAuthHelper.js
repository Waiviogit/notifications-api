const axios = require('axios');
const config = require('../../config');

const validateAuthToken = async (token) => {
  try {
    const result = await axios.post(`${config.waivioUrl}/auth/validate_auth_token`, {}, { headers: { 'access-token': token } });
    return { result: result.data.user };
  } catch (error) {
    return { error };
  }
};

module.exports = { validateAuthToken };
