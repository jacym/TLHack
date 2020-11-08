require('dotenv').config();
let Wit = require('wit-js');
var http = require('http');

console.log('on')

const TwitchBot = require('twitch-bot')
client = new Wit.Client({apiToken: process.env.NODE_WIT});

var firstTeam
var secondTeam
var started = false;
var team1 = 0
var team2 = 0
let team1Supporters = new Set()
let team2Supporters = new Set()

//create a server object:
http.createServer(function (req, res) {
    res.write(team1.toString()); //write a response to the client
    res.end(); //end the response
  }).listen(8080); 
   

function fanwar(team1, team2){
    firstTeam = team1.toUpperCase();
    secondTeam = team2.toUpperCase();
    started = true
    console.log(`added teams to fanwar ${firstTeam} ,  ${secondTeam}`)
}

function manageSupporters(name, team){
    if (team === firstTeam){
        //add to supporters list of team1 and remove from supporters of team2
        if(team2Supporters.has(name)){
            team2Supporters.delete(name);
            team1Supporters.add(name);
        }
        else{
            team1Supporters.add(name);
        }
    }
    else if (team === secondTeam){
        //add to supporters list of team1 and remove from supporters of team2
        if(team1Supporters.has(name)){
            team1Supporters.delete(name);
            team2Supporters.add(name);
        }
        else{
            team2Supporters.add(name);
        }
    }
}

const Bot = new TwitchBot({
  username: 'hirivenge',
  oauth: process.env.NODE_AUTH,
  channels: ['jacydoesntwin']
})

Bot.on('join', channel => {
    console.log(`Joined channel: ${channel}`)
})

Bot.on('error', err => {
    console.log(err)
})

Bot.on('message', chatter => {
    if(chatter.message.includes('!test')) {
      Bot.say('Command executed! PogChamp')
      console.log(`${chatter.mod}`)
    }
    else if(chatter.message.includes('!start')){
        var parts = chatter.message.split(" ")
        if (parts.length === 3){
            Bot.say('good to go')
            fanwar(parts[1], parts[2]);
            Bot.say(`${parts[1]} vs ${parts[2]} fan war begins! Start supporting!`)
        }
        else{
            Bot.say('Failed to start a fanwar, use the formaT !start [team1] [team2]')
        }
    }
    else if(chatter.message.includes('!stopfanwar')){
        var parts = chatter.message.split(" ")
        var winner = ''
        var percentWin = 0
        if(team1 > team2){
            winner = firstTeam;
            percentWin = (team1 / (team1+team2)) * 100
            //reward winning supporters
            console.log(team1Supporters);
            console.log(team2Supporters);
        }
        else if(team1 < team2){
            winner = secondTeam;
            percentWin = (team2 / (team1+team2)) * 100
            //reward winning supporters
            console.log(team2Supporters);
            console.log(team1Supporters);
        }
        Bot.say(`Stopping the fanwar! Distributing rewards now to supporters of ${winner}! They won with ${percentWin}% of the positive sentiments`)
        started = false;
        team1 = 0;
        team2 = 0;
        team1Supporters.clear();
        team2Supporters.clear();

    }
    else if (started === true) {
        console.log('analyzing message');
        //sentiment analysis message for positive sentiment
        client.message(chatter.message, {})
        .then((response) => {
            console.log(response.entities);
            if(response.entities.sentiment[0].value === 'positive'){
                var input = response.entities
                console.log(typeof response.entities);
                console.log('added a point');
                if(firstTeam in response.entities){
                    team1 += 1  
                    manageSupporters(chatter.username, firstTeam)
                }
                else if (secondTeam in response.entities){
                    team2 += 1
                    manageSupporters(chatter.username, secondTeam)
                }

            }
        })
        .catch((err) => {
            console.error(err);
        });
        //add to dict a point if positive sentiment of a team
    }

  })