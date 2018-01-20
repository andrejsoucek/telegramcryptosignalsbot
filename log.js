const chalk = require('chalk');
const PushBullet = require('pushbullet');
const config = require('config');
const fs = require('fs');

function log(type, message, push = false) {
    const formattedMsg = `${new Date} | ${type}: ${message}`;
    switch(type) {
        case 'INFO':
            console.log(chalk.blue(formattedMsg));
            break;
        case 'WARNING':
            console.log(chalk.yellow(formattedMsg));
            break;
        case 'ERROR':
            console.log(chalk.red(formattedMsg));
            break;
        default:
            console.log(formattedMsg);
            break;
    }

    const pbCfg = config.get('Pushbullet');
    if (push && pbCfg.notify === true) {
        const pusher = new PushBullet(pbCfg.accessToken);
        const email = pbCfg.email;
        pusher.note(email, "Signals Bot", formattedMsg, function(error, response) {
            if (error) {
                console.log(chalk.red(error))
            }
        });
    }

    fs.appendFileSync('bot.log', "\r\n" + formattedMsg)
}

module.exports = log;
