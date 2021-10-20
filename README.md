# Discord Bot

The purpose of this discord bot was for me to familiarise myself in working with Discord.js and figuring out how to utilize different apis. A simple yet enjoyable project. 


## Description

There are currently 8 commands that this discord bot is able to execute. All commands must be prefixed with an exclamation mark (!) without spaces between. E.g. !help.
| Bot Command (!)       | Description |          
| ------------- |:-------------:| 
| help     | Sends a message listing all the features/commands that this bot can use |
| ping      | The bot will respond with "pong!" to this command (subject to change to an appropriate ping command)      | 
| dog | Fetches a random image of a dog from an API      |
| cat | Fetches a random gif or image of a cat from an API      |
| catfact | Fetches cat facts from an API that can give random cat facts      |
| ytp | Youtube Search & Play allows a user to search and play music using YouTube API services. This feature allows a user to add songs and playlists to a queue system which is able to pause/play, skip, shuffle, insert, loop and remove songs.     |
| bored | Uses an API which retrieves possible things you could do when you are bored     |
| translate | A fun translator that can translate English text into several fictional languages      |
## Getting Started

### Dependencies

* Install Node.js [here](https://nodejs.org/en/download/)
* Then install the following dependecies via the command line: 
* * `npm install discord.js`
* * `npm i node-fetch`
* * `npm i youtube-search`
* * `npm i ytdl-core`
* * `npm i ytpl`

### Executing program

* Using a Discord account, create a Discord bot via the Official Discord Developer Portal.
* Copy your Discord Bot's unique token via the 'Bot' tab.
* Download this repository and add another file called `token.js` in the same directory as `main.js`
* Add your unique token within the following code: `module.exports.botToken = "ABC123";`
* Create a Google Developer Profile and obtain a free YouTube API key. More information can be found online.
* Add your unique YouTube API Key in `token.js` within the following code: `module.exports.youtubeTokenAPI = "ABC123";`

## Help

More information and documentation about Discord.js can be found [here](https://discord.js.org/#/)
Detailed Guide for Discord.js can be found [here](https://discordjs.guide/)
