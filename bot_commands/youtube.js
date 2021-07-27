/**
* @author : Wafiq Ali
* Feature Name: YouTube Search and Play
*
*
* @description : 
* This file is used to execute a discord command that allows users to
* to stream audio from YouTube videos and YouTube Playlists in a voice channel. 
* Users are able to choose a song from the Top 10 search results using their input search criteria.
* Most typical audio manipulation functionalities are implemented for this feature
* These are: Play, Pause, Skip, Shuffle, Insert, Remove, Play Playlists...
**/

const Discord = require('discord.js');
const search = require('youtube-search');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const tokens = require('../tokens');


const YOUTUBE_API_KEY = tokens.youtubeTokenAPI;     //required to use YouTube Official API services such as youtube-search
const options = { 
    maxResults: 10,            // Gets the first 10 results from the search
    key: YOUTUBE_API_KEY,
    type: 'video'
}

let servers = {};
let playing = false;        // Used to indicate whether the streamDispatcher (server.dispatcher) is currently streaming audio to a voice channel

module.exports = {
    name: 'ytp',
    description: 'Searches through youtube using the message string without the bot command',
    async execute(message, args) {
        
        let embed = new Discord.MessageEmbed().setColor('#007E7D');
        
        if (args.length == 0) {     // triggered if there was no input argument after the command "!ytp" 
            message.channel.send({
                embed : {
                    title: 'YouTube Search and Play',
                    description: 'Please type what you would like to search through YouTube after the bot command "!ytp". You can use "!ytp -help" for more information!'
                }
            });
            return;
        }

        if (!servers[message.guild.id]) {       // Store a server by server ID. A key:value pair (server) is deleted once the Bot has finished streaming audio and disconnects.
            servers[message.guild.id] = {
                queue : [],                     // Datastructure where each element is a video Object that includes information such as title, url/link, etc.
                connection: [],
            }
        }
        let server = servers[message.guild.id];

        /* HELP COMMAND: Sends a message to help user understand how to use this feature */
        if (args[0] === '-help') {             
            message.channel.send({
                embed : {
                    title: 'YouTube Search and Play: Bot Commands',
                    description: '**!ytp [video title or link]** -> Main method to link, play or insert a video/song into the queue.\n'
                                + '**!ytp -pl [playlist url/link]** -> Adds all songs from the given playlist into the Queue.\n'
                                + '**!ytp -pl [playlist url/link] -shuffle** -> Shuffles and Adds all songs from the given playlist into the Queue.\n'
                                + '**!ytp -shuffle** -> Shuffles the entire Queue.\n'
                                + '**!ytp -q** -> Shows the current songs in the Queue.\n'
                                + '**!ytp -s** -> Skips the current song being played.\n'
                                + '**!ytp -p** -> Pauses/Plays the current song.\n'
                                + '**!ytp -r** -> Allows you to pick a song to Remove from the Queue.\n'
                                + '**!ytp -d** -> Disconnects the Bot from the voice channel.\n\n'
                                + '**For any voice channel related commands, please ensure that you are in the same voice channel as the Bot (or any if Bot is not connected)**'
                }
            });
            return;
        }

        /* PLAYLIST COMMAND: Takes in the URL of a YouTube Playlist and adds every video to the server's Queue. */
        if (args[0] === '-pl' && args[1]) {
            
            if (!(await CheckMemberInVoiceChannel())) {
                return;
            }

            let playlist = null;
            try {
                playlist = await ytpl(args[1]);     // This package takes the playlist URL and returns a promise. Then it returns a datastructure with the information necessary to add every song to the queue.
            } catch (err) {
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play: ERROR',
                        description: 'Invalid Playlist Link!' 
                    }
                }).catch(err => console.log(err));
                return;
            }
            
            if (args[2] === '-shuffle') {      // executed if user typed '-shuffle' after their playlist url link (only shuffles the playlist, not the current queue)
                playlist.items = ShufflePlaylist(playlist.items);
            }

            playlist.items.forEach(item => {       // adds every item to queue
                item.link = item.shortUrl;
                delete item.shortUrl;              // Renaming a key from 'shortUrl' to 'link' to make my life easier later on
                server.queue.push(item);
            });

            console.log(server.queue);

            let isConnected = await CheckBotConnection();
            if (!isConnected) {
                await ConnectBotToVoiceChannel();
            }

            let connection = server.connection[0];
            
            if (!server.dispatcher) {
                Play(connection, message);
            }

            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Added Playlist with {' + playlist.items.length + '} songs to the queue!' 
                }
            }).catch(err => console.log(err));
            
            return;
        }

        /* DISPLAY QUEUE COMMAND: Sends a message in the corresponding text channel which displays a numbered list of the entire queue at the current time */
        if (args[0] === '-q') {
            
            if (!(await CheckMemberInVoiceChannel())) {
                return;
            }

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

        /* SHUFFLE QUEUE COMMAND: Shuffles the current Queue for the server */
        if (args[0] === '-shuffle') {
            if (server.queue.length == 0) {
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: 'The Queue is Currently Empty!' 
                    }
                }).catch(err => console.log(err));
                return;
            }
            ShuffleQueue();
            return;
        }

        /* SKIP CURRENT SONG COMMAND: Skips the current song that is playing and plays the next one in the queue */
        if (args[0] === '-s' && server.dispatcher) {

            if (await CheckMemberInVoiceChannel()) {
                let connection = server.connection[0];
                Skip(server, connection);
            }
            return;
        }

        /* PAUSE/PLAY COMMAND: Pauses or Resumes the audio that is being streamed from the bot */
        if (args[0] === '-p' && server.dispatcher) {
            
            if (!(await CheckMemberInVoiceChannel())) {
                return;
            }

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

        /* REMOVE A SONG COMMAND: Allows a user to remove a song from the queue from any position in the queue (given as input by user) */
        if (args[0] === '-r' && server.queue.length != 0) {

            if (!(await CheckMemberInVoiceChannel())) {
                return;
            }

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
           

            let filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= server.queue.length; // filter used to ensure appropriate input from user
            let authorsMessage = await message.channel.awaitMessages(filter, {max: 1}).catch(err => console.log(err));
            const videoNum = authorsMessage.first().content;

            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Successfully Removed [' + server.queue[videoNum - 1].title + '] from the Queue!'
                }
            }).catch(err => console.log(err));

            server.queue.splice(videoNum - 1, 1); // Removes an element using Array.prototype.splice() function.

            return;
        }

        /* DISCONNECT BOT COMMAND: Disconnects the Bot from the voice channel that it is currently connected to */
        if (args[0] === '-d' && server.dispatcher) {
            
            if (!(await CheckMemberInVoiceChannel())) {
                return;
            }

            playing = false;
            message.guild.me.voice.channel.leave();  // Disconnects from voice channel
            delete servers[message.guild.id];       // Removes a server from the list of servers. When the bot is used again, it will add the server back.

            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Successfully Disconnected!' 
                }
            }).catch(err => console.log(err));

            return;
        }

        /* REST OF CODE: Searches through YouTube and displays the results to the user. The user then picks a video, and then decides whether the video is 
                         to be sent as a link in the corresponding text channel, added to the queue and played, or inserted into the queue and played.  */
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
            
            let filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= youtubeResults.length; // filter ensures appropriate user input
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

            const videoData = youtubeResults[videoNum - 1];         // Retrieves and stores the chosen video from the array
            
            if (authorsMessage) {                                   // Logic to determine what the user wants to do with their chosen video
                if (authorsMessage.first().content === 'l') {       // User chose to send a link of the video url in text channel
                    console.log(authorsMessage.first().content);
                    message.channel.send(videoData.link);   
                }

                else if (authorsMessage.first().content === 'p') {  // User chose to play the song (adds song to the queue if queue is not empty).
                    if (!(await CheckMemberInVoiceChannel())) {
                        return;
                    }

                    PrepareToPlay(videoData);
                }

                else if (authorsMessage.first().content === 'i') {  // User chose to insert the song at a specified position in the queue.
                    if (!(await CheckMemberInVoiceChannel())) {
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

        /* Function CheckMemberInVoiceChannel() checks if the user who sent the message is in a voice channel, and if the user is in a voice channel, then it
        *  also checks if the Bot is connected in the same voice channel. Returns True if user is in any voice channel while the bot is not 
        *  connected at all OR if the user is in the same voice channel as the bot.
        * 
        *  @params -> None
        *  @return -> {Boolean}  
        **/
        async function CheckMemberInVoiceChannel() {
            const voiceChannel = message.member.voice.channel;
            const server = servers[message.guild.id];
            
            if (!voiceChannel || (!(await CheckBotConnection()) && server.connection[0])) {
                message.channel.send({
                    embed: {
                        title: 'YouTube Search and Play',
                        description: 'You need to be in the same voice channel as the Bot to issue this command!'
                    }
                }).catch(err => console.log(err));
                return false;
            }

            return true;
        }

        /* Function PrepareToPlay() is called when user attempts to add a song normally. This function adds the song to the queue and 
        *  does some required checks to see if it is appropriate to call Play() or leave the song in the queue.
        *
        *  @params -> {videoData} This object holds information about a video, including its title and URL link.
        *  @return -> None   
        **/
        async function PrepareToPlay(videoData) {
            let server = servers[message.guild.id];
            let connection = null;

            server.queue.push(videoData);
            
            let isConnected = await CheckBotConnection();
            if (!isConnected) {
                await ConnectBotToVoiceChannel();
            }
            connection = server.connection[0];

            if (!server.dispatcher) {
                Play(connection, message);
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

        /* Function CheckBotConnection() checks if the bot is connected to the same voice channel as the user who sent the current message.
        *
        *  @params -> None
        *  @return -> {Boolean}   
        **/
        async function CheckBotConnection() {
            const voiceChannel = message.member.voice.channel            
            const vcMembers = voiceChannel.members;
            
            isConnected = false;
            vcMembers.forEach(member => {
                if (member.user.id === '790527522206646303') {
                    isConnected = true;
                }
            });

            return isConnected;
        }

        /* Function ConnectBotToVoiceChannel() connects the bot to the same voice channel as the user who sent the current message.
        *
        *  @params -> None
        *  @return -> None  
        **/
        async function ConnectBotToVoiceChannel() {
            const voiceChannel = message.member.voice.channel 
            let server = servers[message.guild.id];
            let connection = await voiceChannel.join();
            server.connection.push(connection);
        }

        /* Function ShufflePlaylist() shuffles a given playlist before being added to the current queue.
        *
        *  @params -> {playlistItems} Datastructure that holds information for every video in the playlist.
        *  @return -> {shuffledPlaylist} Array where each element is an object that holds information about a video.  
        **/
        function ShufflePlaylist(playlistItems) {
            let shuffledPlaylist = [];
            let range = playlistItems.length;

            while (playlistItems.length != 0) {
                let randNum = Math.floor(Math.random() * range);
                shuffledPlaylist.push(playlistItems[randNum]);
                playlistItems.splice(randNum, 1);
                range--;
            }

            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Playlist Shuffled!' 
                }
            }).catch(err => console.log(err));

            return shuffledPlaylist;
        }   

        /* Function ShuffleQueue() shuffles the entire queue.
        *
        *  @params -> None
        *  @return -> None
        **/
        function ShuffleQueue() {
            let server = servers[message.guild.id];
            let range = server.queue.length;
            let newQueue = [];

            while (server.queue.length != 0) {
                let randNum = Math.floor(Math.random() * range);
                newQueue.push(server.queue[randNum]);
                server.queue.splice(randNum, 1);
                range--;
            }
            server.queue = newQueue;

            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Queue Shuffled!' 
                }
            }).catch(err => console.log(err));

            return;
        }

        /* Function Skip() is called to skip the current song being played by calling OnEnd() function.
        *
        *  @params -> {server} Datastructure that holds the queue, connection and dispatcher objects
        *  @params => {connection} current connection object between the bot and voice channel
        *  @return -> None  
        **/
        function Skip(server, connection) {
            message.channel.send({
                embed: {
                    title: 'YouTube Search and Play',
                    description: 'Skipping: [' + server.queue[0].title + ']' 
                }
            }).catch(err => console.log(err));

            if (server.dispatcher) { OnEnd(connection, message); };
            return;
        }
        
        /* Function Play() is called to stream audio from a video using ytdl() and a streamDispatcher object.
        *
        *  @params -> {connection} current connection between the bot and voice channel
        *  @params -> {message} variable from main.js. Holds lots of valuable information
        *  @return -> None  
        **/
        async function Play(connection, message) {
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

            server.dispatcher.on("finish", () => {
                OnEnd(connection, message);
            });
        }

        /* Function OnEnd() is called after a video has finished streaming. Either the next song is played or the bot disconnects (because empty queue).
        *
        *  @params -> {connection} current connection between bot and voice channel
        *  @params -> {message} variable from main.js. Holds lots of valuable information
        *  @return -> None 
        **/
        async function OnEnd(connection, message) {
            let server = servers[message.guild.id];
            
            playing = false;

            console.log(server.queue)
            if (server.queue.length != 0) {
                Play(connection, message);

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
