const axios = require('axios');

const keys_to_test = [
    { name: 'ENV_KEY', value: 'e511dbc51455990865af139976c6584a21c8762d' }, // From .env
    { name: 'USER_CLIENT_SECRET', value: '5da76ebff74f4cdfb9701ea4eddaf00b9ebb3267' },
    { name: 'USER_CLIENT_ID', value: '9e42f037fa4c43f9' }
];

const BASE_URL = 'https://api.isthereanydeal.com';

async function testKey(keyItem) {
    console.log(`Testing ${keyItem.name}: ${keyItem.value.substring(0, 5)}...`);
    try {
        const response = await axios.get(`${BASE_URL}/deals/v2`, {
            params: {
                key: keyItem.value,
                shops: '61', // Steam
                limit: 5 // Just get 5 deals to verify access
            }
        });
        console.log(`✅ SUCCESS! Found ${response.data.list.length} deals.`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
        return false;
    }
}

(async () => {
    for (const k of keys_to_test) {
        await testKey(k);
    }
})();
