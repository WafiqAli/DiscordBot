const Discord = require('discord.js');
const search = require('youtube-search');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const tokens = require('../tokens');

const YOUTUBE_API_KEY = tokens.youtubeTokenAPI;
const options = {
    maxResults: 10,
    key: YOUTUBE_API_KEY,
    type: 'video'
}

let servers = {};
let playing = false;

module.exports = {
    name: 'ytp',
    description: 'Searches through youtube using the message string without the bot command',
    async execute(message, args) {
        
        let embed = new Discord.MessageEmbed().setColor('#007E7D');
        //let filter = m => m.author.id === message.author.id;
        if (args.length == 0) {
            message.channel.send({
                embed : {
                    title: 'YouTube Search and Play',
                    description: 'Please type what you would like to search through YouTube after the bot command "!ytp". You can use "!ytp -help" for more information!'
                }
            });
            return;
        }

        if (!servers[message.guild.id]) {
            servers[message.guild.id] = {
                queue : [],
                connection: [],
            }
        }
        let server = servers[message.guild.id];

        if (args[0] === '-help') {
            message.channel.send({
                embed : {
                    title: 'YouTube Search and Play: Bot Commands',
                    description: '**!ytp [video title or link]** -> Main method to link, play or insert a video/song into the queue.\n'
                                + '**!ytp -pl [playlist url/link]** -> Adds all songs from the given playlist into the Queue.\n'
                                + '**!ytp -q** -> Shows the current songs in the Queue\n'
                                + '**!ytp -s** -> Skips the current song being played\n'
                                + '**!ytp -p** -> Pauses/Plays the current song\n'
                                + '**!ytp -r** -> Allows you to pick a song to Remove from the Queue\n'
                                + '**!ytp -d** -> Disconnects the Bot from the voice channel'
                }
            });
            return;
        }

        if (args[0] === '-pl' && args[1]) {
            
            let playlist = null;
            try {
                playlist = await ytpl(args[1]);
            } catch (err) {
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play: ERROR',
                        description: 'Invalid Playlist Link!' 
                    }
                }).catch(err => console.log(err));
                return;
            }
            
            playlist.items.forEach(item => {
                item.link = item.shortUrl;
                delete item.shortUrl;
                server.queue.push(item);
            });

            console.log(server.queue);
            await checkBotConnection();
            let connection = server.connection[0];
            
            if (!server.dispatcher) {
                play(connection, message);
            }

            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Added Playlist with {' + playlist.items.length + '} songs to the queue!' 
                }
            }).catch(err => console.log(err));
            
            return;
        }

        if (args[0] === '-q') {
            if (server.queue.length == 0) {
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: 'The Queue is Currently Empty!' 
                    }
                }).catch(err => console.log(err));
            }
            else {
                let indexNum = 0;
                let titles = server.queue.map(v => {
                    indexNum++;
                    return indexNum + ") " + v.title;
                });
                
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play: Queue List',
                        description: titles.join("\n") 
                    }
                }).catch(err => console.log(err));
            }
            return;
        }

        if (args[0] === '-s' && server.dispatcher) {
            let connection = server.connection[0];
            Skip(server, connection);
            return;
        }

        if (args[0] === '-p' && server.dispatcher) {
            
            if (server.dispatcher.paused) {
                server.dispatcher.resume();
                
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: 'Resuming Playback!' 
                    }
                }).catch(err => console.log(err));
            }
            else {
                server.dispatcher.pause();

                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: 'Pausing Playback!' 
                    }
                }).catch(err => console.log(err));
            }
            return;
        }

        if (args[0] === '-r' && server.queue.length != 0) {

            let indexNum = 0;

            let titles = server.queue.map(v => {
                indexNum++;
                return indexNum + ") " + v.title;
            });

            message.channel.send({
                embed: {
                    title: 'Please Select a Video To Remove from the Queue by typing the number and pressing Enter',
                    description: titles.join("\n")
                }
            }).catch(err => console.log(err));
           

            let filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= server.queue.length;
            let authorsMessage = await message.channel.awaitMessages(filter, {max: 1}).catch(err => console.log(err));
            const videoNum = authorsMessage.first().content;

            if (server.queue[videoNum - 1] === server.queue[0]) {

                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: 'Please use "!ytp -s" to remove/skip the current song instead of "!ytp -remove"'
                    }
                }).catch(err => console.log(err));

                return;
            }

            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Successfully Removed [' + server.queue[videoNum - 1].title + '] from the Queue!'
                }
            }).catch(err => console.log(err));

            server.queue.splice(videoNum - 1, 1);

            return;
        }

        if (args[0] === '-d' && server.dispatcher) {
            playing = false;
            message.guild.me.voice.channel.leave();
            delete servers[message.guild.id];

            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Successfully Disconnected!' 
                }
            }).catch(err => console.log(err));

            return;
        }

        //args.forEach((word) => { search_str += word + " ";});
        const search_str = args.join(" ");
        
        const results = await search(search_str, options).catch(err => console.log(err));
        
        if (results) {
            console.log(results);
            let youtubeResults = results.results;
            
            let resultNum = 0;
            let titles = youtubeResults.map(result => {
                resultNum++;
                return resultNum + ") " + result.title;
            });

            message.channel.send({
                embed: {
                    title: 'Please Select a Video by typing the number and pressing Enter',
                    description: titles.join("\n")
                }
            }).catch(err => console.log(err));
            
            let filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= youtubeResults.length;
            let authorsMessage = await message.channel.awaitMessages(filter, {max: 1}).catch(err => console.log(err));
            const videoNum = authorsMessage.first().content;
            
            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play - Select an Option:',
                    description: 'Type "l" to send the video link\n'
                               + 'Type "p" to play the song OR add it to the Queue\n'
                               + 'Type "i" to insert the song at a specific position in the Queue\n'
                               + '**For commands "p" or "i", ensure that you are in a voice channel**'
                }           
            }).catch(err => console.log(err));
            
            filter = m => (m.author.id === message.author.id) && (m.content === 'l' || m.content === 'p' || m.content === 'i');
            authorsMessage = await message.channel.awaitMessages(filter, {max: 1}).catch(err => console.log(err));

            const videoData = youtubeResults[videoNum - 1];
            const voiceChannel = message.member.voice.channel
            
            if (authorsMessage) {
                if (authorsMessage.first().content === 'l') {
                    console.log(authorsMessage.first().content);
                    message.channel.send(videoData.link);   
                }

                else if (authorsMessage.first().content === 'p') {
                    if (!voiceChannel) {
                        message.channel.send({
                            embed: {
                                title: 'YouTube Search and Play',
                                description: 'You need to be in a voice channel in order for me to play audio from the video!'
                            }
                        }).catch(err => console.log(err));
                        return;
                    }
                    PrepareToPlay(videoData);
                }

                else if (authorsMessage.first().content === 'i') {
                    if (!voiceChannel) {
                        message.channel.send({
                            embed: {
                                title: 'YouTube Search and Play',
                                description: 'You need to be in a voice channel in order for me to play audio from the video!'
                            }
                        }).catch(err => console.log(err));
                        return;
                    }
                    
                    if (server.queue.length == 0) {
                        message.channel.send({
                            embed: {
                                title: 'YouTube Search and Play',
                                description: 'The Queue is currently empty! Proceeding to append to Queue and Play'
                            }
                        }).catch(err => console.log(err));

                        PrepareToPlay(videoData);
                    }
                    else {

                        let indexNum = 0;
                        let titles = server.queue.map(v => {
                            indexNum++;
                            return indexNum + ") " + v.title;
                        });
            
                        message.channel.send({
                            embed: {
                                title: 'Please Select a Position in the Queue to add your song at by typing the number and pressing Enter',
                                description: titles.join("\n")
                            }
                        }).catch(err => console.log(err));
                        
                        let filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= server.queue.length;
                        let authorsMessage = await message.channel.awaitMessages(filter, {max: 1}).catch(err => console.log(err));
                        const videoNum = authorsMessage.first().content;

                        server.queue.splice(videoNum - 1, 0, videoData);

                        message.channel.send({
                            embed: {
                                title: 'YouTube Search and Play',
                                description: 'Successfully added: [' + videoData.title + '] at Position {' + videoNum +'} in the Queue!'
                            }
                        }).catch(err => console.log(err));
                    }
                }
            }
        }

        async function PrepareToPlay(videoData) {
            let server = servers[message.guild.id];
            let connection = null;

            server.queue.push(videoData);
            
            await checkBotConnection();
            connection = server.connection[0];

            if (!server.dispatcher) {
                play(connection, message);
            }
            else {
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: 'Added ' + videoData.title + ' to the queue!' 
                    }
                }).catch(err => console.log(err));
            }
        }            

        async function checkBotConnection() {
            const voiceChannel = message.member.voice.channel
            let server = servers[message.guild.id];
            
            const vcMembers = voiceChannel.members;
            
            isConnected = false;
            vcMembers.forEach(member => {
                if (member.user.id === '790527522206646303') {
                    isConnected = true;
                }
            });
            console.log(isConnected);
            
            if (!isConnected) {
                connection = await voiceChannel.join();
                server.connection.push(connection);
            }
        }

        function Skip(server, connection) {
            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Skipping: [' + server.queue[0].title + ']' 
                }
            }).catch(err => console.log(err));

            if (server.dispatcher) { onEnd(connection, message); };
            return;
        }
       
        async function play(connection, message) {
            let server = servers[message.guild.id];
            
            const stream = ytdl(server.queue[0].link, {filter : 'audioonly'});
            console.log(server.queue[0].link);
            if (!playing) {
                console.log(playing);
                playing = true;
                
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: 'Now Playing: [' + server.queue[0].title + ']' 
                    }
                }).catch(err => console.log(err));
                
                server.dispatcher = connection.play(stream);
                server.queue.shift();
            }
            //server.dispatcher = connection.play(stream);
            
            server.dispatcher.on("finish", () => {
                //console.log("pog1");
                //server.dispatcher = connection.play(stream);
                onEnd(connection, message);
            });
        }

        async function onEnd(connection, message) {
            let server = servers[message.guild.id];
            
            playing = false;

            console.log(server.queue)
            if (server.queue.length != 0) {
                play(connection, message);

            } else {
                connection.disconnect();
                server.dispatcher.destroy();
                delete servers[message.guild.id];

                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: `That's the end of the Queue! Successfully Disconnected! Cya soon ^_^` 
                    }
                }).catch(err => console.log(err));

                console.log("BAI BAI");
            }
        }
    }    
}
