const chalk = require('chalk')
const PushBullet = require('pushbullet');
const config = require('config')

function log(type, message, push = false) {
    switch(type) {
        case 'INFO':
            console.log(chalk.blue("INFO: " + message))
            break;
        case 'WARNING':
            console.log(chalk.yellow("WARNING: " + message))
            break;
        case 'ERROR':
            console.log(chalk.red("ERROR: " + message))
            break;
        default:
            console.log("unknown")
            break;
    }

    const pbCfg = config.get('Pushbullet')
    if (push && pbCfg.notify === true) {
        const pusher = new PushBullet(pbCfg.accessToken)
        const email = pbCfg.email
        pusher.note(email, "Signals Bot", message, function(error, response) {
            if (error) {
                console.log(chalk.red(error))
            }
        });
    }
}

module.exports = log
