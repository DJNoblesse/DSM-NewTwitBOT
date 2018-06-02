const information = require('./information.json');

const twitterBot = require('node-twitterbot').TwitterBot;
const request = require('request');
const app = require('express')();
const http = require('http').Server(app);
const bodyParser = require('body-parser');

const bot = new twitterBot({
    "consumer_key": information.twitter_consumer_key,
    "consumer_secret": information.twitter_consumer_secret,
    "access_token": information.twitter_token_key,
    "access_token_secret": information.twitter_token_secret
});

app.use(bodyParser.json());

app.post('/autobot', (req, res) => {
    if (req.body.botPassword === information.autobot_password) {
        let dt = new Date().toFormat('HH24시 MI분 SS초');
        let message = req.body.dsmMessage;
        let resBody = 'empty';
        try {
            let autoBlockObj = JSON.parse(message);
            let target = autoBlockObj.target;
            let ipAddress = autoBlockObj.ipAddress;

            if (target === 'AutoBlock') target = 'SMTP';

            let options = {
                method: 'GET',
                url: 'https://www.abuseipdb.com/report/json',
                qs: {
                    key: information.abuseipdb_api_token,
                    category: '18',
                    comment: 'Too Much Attempt ' + target + ' Login',
                    ip: ipAddress
                },
                headers: { 'cache-control': 'no-cache'}
            };

            request(options, (err, res, body) => {
                if (err) console.log(err);
                resBody = body;
            });

            bot.tweet('스토리지 센터 알림 : [' + ipAddress + ']로부터 ' + target + '에 대한 이-지붐 시도를 감지했습니다. (AbuseIPDB 자동 리포트) [' + dt + ']');
            res.json({echo: message, report: resBody, message: 'Request sent. check your account.'});
        } catch (e) {
            bot.tweet('스토리지 센터 알림 : ' + message + ' [' + dt + ']');

            res.json({echo: message, message: 'Request sent. check your account.'});
        }
    } else {
        res.body("FUCK YOU");
    }
});

app.post('/manualNotice', (req, res) => {
    if (req.body.botPassword === information.manualbot_password) {
        let message = req.body.manualMessage;

        bot.tweet('관리자 알림 : ' + message);
        res.json({echo: data, message: 'Request sent. check your account.'});
    } else {
        res.body('FUCK YOU');
    }
});

http.listen(information.server_port, () => {
    console.log('Listening on http port : ' + information.server_port)
});