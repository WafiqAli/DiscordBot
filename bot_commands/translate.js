/* API Endpoint: https://api.funtranslations.com/ */
const fetch = require('node-fetch');

const translators = { // An object that stores the endpoints (value) for each language (key). 
    Pirate: '/translate/pirate',
    Minion: '/translate/minion',
    Shakespeare: '/translate/shakespeare',
    ERMAHGERD: '/translate/ermahgerd',
    Yoda: '/translate/yoda', 
    Sith: '/translate/sith',
    Gungan: '/translate/gungan',
    Mandalorian: '/translate/mandalorian',
    Valley_Speak: '/translate/valspeak',
    Jive_Speak: '/translate/jive',
    Brooklyn_Speak: '/translate/brooklyn',
    Pig_Latin: '/translate/piglatin',
    Elvish_Sindarin: '/translate/sindarin',
    Elvish_Quneya: '/translate/quneya',
    Morse: '/translate/morse',
    Morse_To_English: '/translate/morse2english'
};
const langArray = Object.keys(translators); // an array with the keys in the 'translators' object.

module.exports = {
    name: 'translate',
    description: 'A fun translator that can translate English text into several fictional languages',


    async execute(message, args) {

        message.channel.send({
            embed: {
                title: 'Fun Translator',
                description: 'Please type in the text to be translated\n\nNOTE: ONLY FIVE TRANSLATION REQUESTS ARE ALLOWED PER DAY (RATE LIMITED DUE TO FREE VERSION)!'
            }
        }).catch(err => console.log(err));

        let filter = m => m.author.id === message.author.id; // filter ensures appropriate user input
        let authorsMessage = await message.channel.awaitMessages(filter, {max: 1}).catch(err => console.log(err));
        const inputText = authorsMessage.first().content;
        console.log(inputText);


        /* Prints out a numbered list of languages available to translate to */
        let listNum = 0;
        let languages = langArray.map(l => {
            listNum++;
            return listNum + ") " + l;
        });

        message.channel.send({
            embed: {
                title: 'Fun Translator: Select language',
                description: languages.join('\n') + '\n\n**Type in the number associated to the language you want to translate your text to and press Enter**'
            }
        }).catch(err => console.log(err));

        filter = m => m.author.id === message.author.id && m.content >= 1 && m.content <= langArray.length; // filter ensures appropriate user input
        authorsMessage = await message.channel.awaitMessages(filter, {max: 1}).catch(err => console.log(err));
        const langNum = authorsMessage.first().content;
        console.log(langNum);

        if (authorsMessage) {
            const langName = (langArray[langNum - 1]);
            console.log(translators[langName]);
            
            message.channel.send({
                embed: {
                    title: 'Fun Translator',
                    description: 'Translating input text to {' + langName + '} language...'
                }
            }).catch(err => console.log(err));

            const uri = "https://api.funtranslations.com" + translators[langName] + "?text=" + inputText;
            const encodedUri = encodeURI(uri);
            fetch(encodedUri, 
            {
                headers : {
                    Accept: "application/json",
                },
            })
            .then(response => response.json())
            .then(data => SendTranslatedMessage(data));
        }


        function SendTranslatedMessage(data) {
            
            try {
                message.channel.send(data.contents.translated).catch(err => console.log(err));
            } catch (TypeError) {
                message.channel.send(data.error.message);
            }
        }
    }
}