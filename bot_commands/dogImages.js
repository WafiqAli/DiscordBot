const fetch = require('node-fetch');

module.exports = {
    name: 'dog',
    description: 'Fetches a random image of a dog from an API',
    
    execute(message, args) {
        const fetchPromise = fetch("https://dog.ceo/api/breeds/image/random", 
        {
            headers : {
                Accept: "application/json",
            },
        });
        
        const streamPromise = fetchPromise.then((response) => response.json());
        streamPromise.then((data) => {
            if (data.status === 'success') {
                SendDogImage(data);
            }
            else {
                message.channel.send("Error: Unable to fetch dog image");
            }
            
        });

        function SendDogImage(data) {
            console.log(data);
            let url = data.message;
            url.replace('\\', ""); // This strips off backward slashes from url. Example url: https:\/\/images.dog.ceo\/breeds\/mastiff-tibetan\/n02108551_9391.jpg
            message.channel.send(url);   
        }
     }
}    

