const axios = require('axios');
const key = 'e511dbc51455990865af139976c6584a21c8762d';

(async () => {
    try {
        const response = await axios.get('https://api.isthereanydeal.com/deals/v2', {
            params: { key, shops: '61', limit: 1, sort: '-cut' }
        });
        const item = response.data.list[0];
        console.log('Keys on item:', Object.keys(item));
        if (item.deal) {
            console.log('Keys on item.deal:', Object.keys(item.deal));
            console.log('Cut value:', item.deal.cut);
        } else {
            console.log('Cut value (top level):', item.cut);
        }
    } catch (e) { console.error(e.message); }
})();
