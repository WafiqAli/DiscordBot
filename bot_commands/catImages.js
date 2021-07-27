const fetch = require('node-fetch');

module.exports = {
    name: 'cat',
    description: 'Fetches a gif or image of a cat from an API',
    
    execute(message, args) {
        const fetchPromise = fetch("https://api.thecatapi.com/v1/images/search", 
        {
            headers : {
                Accept: "application/json",
            },
        });
        
        const streamPromise = fetchPromise.then((response) => response.json());
        streamPromise.then((data) => {
            console.log(data)
            message.channel.send(data[0].url)
        });
    }    
}
