const fetch = require('node-fetch');

module.exports = {
    name: 'bored',
    description: 'Uses an API which retrieves possible things you could do when you are bored',
    
    async execute(message, args) {
        
        message.channel.send({
            embed : {
                title: 'Unbored the Bored',
                description: 'Welcome to Unbored the Bored, a service to help you find something to do!'
            }
        });
        message.channel.send({
            embed : {
                title: 'Unbored the Bored: Select an Option',
                description: 'Type "-r" for a random activity or "-p" to pick something more specific!'
            }
        });
        
        let filter = m => (m.author.id === message.author.id) && (m.content === '-r' || m.content === '-p'); // filter used to ensure appropriate input from user
        const authorsMessageData = await message.channel.awaitMessages(filter, {max: 1}).catch(err => console.log(err));
        let authorsMessage = authorsMessageData.first().content;

        if (authorsMessageData) {
            if (authorsMessage === '-r') {
                
                fetch("https://www.boredapi.com/api/activity", 
                {
                    headers : {
                        Accept: "application/json",
                    },
                })
                .then(response => response.json())
                .then(data => RandomActivity(data));
        
            }
            else if (authorsMessage === '-p') {
                SelectActivity();
            }
        }
        
        function getAccessibilityString(data) {
            if (data.accessibility <= 0) {
                return '\n**Accessibility**: {' + data.accessibility + '} Easily Accessible, most people should be able to do this!' 
            }
            else if (data.accessibility <= 0.3) {
                return '\n**Accessibility**: {' + data.accessibility + '} Should be an accessible activity for the majority...' 
            }
            else if (data.accessibility <= 0.5) {
                return '\n**Accessibility**: {' + data.accessibility + '} Not that accessible...' 
            }
            else if (data.accessibility <= 0.8) {
                return '\n**Accessibility**: {' + data.accessibility + '} Hardly Accessible...' 
            }
            else if (data.accessibility <= 1.0) {
                return '\n**Accessibility**: {' + data.accessibility + '} GOODLUCK MATE! THIS MIGHT BE IMPOSSIBLE...' 
            }
        }

        function getPriceString(data) {
            if (data.price <= 0) {
                return '\n**Price**: {' + data.price + '} This activity is essentially FREE!!!' 
             }
             else if (data.price <= 0.3) {
                return '\n**Price**: {' + data.price + '} A very cheap activity...' 
             }
             else if (data.price <= 0.5) {
                return '\n**Price**: {' + data.price + '} Should be affordable for most people...' 
             }
             else if (data.price <= 0.8) {
                return '\n**Price**: {' + data.price + '} Quite an expensive activity...' 
             }
             else if (data.price <= 1.0) {
                return '\n**Price**: {' + data.price + '} YOU BETTER SAVE LOTS OF MONEY BECAUSE THIS WILL BURN YOUR WALLET!' 
             }
        }

        function RandomActivity(data) {
            
            let messageStr = '';

            messageStr +='**Activity**: ' + data.activity + '\n**Type**: ' + data.type + '\n**Participants**: ' + data.participants;
            messageStr += getPriceString(data);
            messageStr += getAccessibilityString(data);
            if (data.link) {
                messageStr += '\n**For More Information**: ' + data.link;
            }

            message.channel.send({
                embed : {
                    title: 'Unbored the Bored: Your Activity',
                    description: messageStr
                }
            });

        }

        function SelectActivity() {

        }
        
    }    
}
