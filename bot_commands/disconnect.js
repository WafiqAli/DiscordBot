module.exports = {
    name: 'disconnect',
    description: 'Disconnects the bot from a voice channel',
    
    async execute(message) {

        message.guild.me.voice.channel.leave();
        return;
    }    
}
