module.exports = {
    name: 'ping',
    description: 'The bot will respond with "pong!" to this command',
    execute(message, args) {
        console.log(message.author);
        message.channel.send('pong!');
    }   
}
