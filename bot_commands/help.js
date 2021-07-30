module.exports = {
    name: 'help',
    description: 'Sends a message listing all the features/commands this bot can use',
    
    async execute(message, args) {

        message.channel.send({
            embed : {
                title: 'Bot Commands:',
                description: '**!ping** -> Pong?!.\n'
                            + '**!cat** -> Sends a random image or gif of a cat.\n'
                            + '**!catfact** -> Sends a random fact about cats.\n'
                            + '**!ytp** -> You can stream audio from YouTube videos and playlists using: YouTube Search and Play.\n'
                            + '**!bored** -> Sends you a random activity to do if you are bored.'
            }
        });
        return;
    }    
}
