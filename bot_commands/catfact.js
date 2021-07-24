const fetch = require('node-fetch');

module.exports = {
    name: 'catfact',
    description: 'Fetches cat facts from an API that can give random cat facts',
    
    execute(message, args) {
        const fetchPromise = fetch("https://cat-fact.herokuapp.com/facts/random", 
        {
            headers : {
                Accept: "application/json",
            },
        });
        
        const streamPromise = fetchPromise.then((response) => response.json());
        streamPromise.then((data) => message.channel.send(data.text));
    }    
}
