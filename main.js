const Discord = require('discord.js');
const tokens = require('./tokens');


const client = new Discord.Client();

const commandPrefix = '!';

const fs = require('fs');

client.bot_commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./bot_commands/').filter(file => file.endsWith('.js'));

commandFiles.forEach((file) => {
    const command = require(`./bot_commands/${file}`);
    
    client.bot_commands.set(command.name, command);
});


client.once('ready', () => {
    console.log("Hospital Boi is now online!");
});

client.on('message', message => {
    
    if (!message.content.startsWith(commandPrefix) || message.author.bot) {return;} //immediately returns if discord message doesn't start with '!' or if the message was from the discord bot

    const args = message.content.slice(commandPrefix.length).split(/ +/); //the code inside .split() is the same as .split(" "). 
    const command = args.shift().toLowerCase();
    
    
    var servers = {};

    switch(command) {
        case 'help': 
            client.bot_commands.get('help').execute(message, args);
            break;
        case 'ping':
            client.bot_commands.get('ping').execute(message, args);
            break;
        case 'cat':
            client.bot_commands.get('cat').execute(message, args);
            break;
        case 'catfact':
            client.bot_commands.get('catfact').execute(message, args);
            break;
        case 'ytp':
            client.bot_commands.get('ytp').execute(message, args);
            break;
        case 'bored':
            client.bot_commands.get('bored').execute(message, args);
            break;
        case 'translate':
            client.bot_commands.get('translate').execute(message, args);
            break;
            
        /*case 'disconnect':
            client.bot_commands.get('disconnect').execute(message);
            break;*/
    }

});


client.login(tokens.botToken); //ensure this is the last line of this program

