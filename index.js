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

app.use(bodyParser.urlencoded({ extended: true }));

// DSM SMS알림 기능으로 사용할 봇
app.post('/autobot', (req, res) => {
    if (req.body.botPassword === information.autobot_password) {
        let dt = new Date().toFormat('HH24시 MI분 SS초');
        let message = req.body.dsmMessage;
        let resBody = 'empty';

        /*
        DSM 자동 차단 메시지를 JSON으로 하면 AbuseIPDB에 리포트한 후 지정된 메시지를 사용하여 트위터에 트윗을 올린다.
        만약, JSON 파싱 중 문제가 생겼거나, 다른 알림이 있는 경우는 받아들인 메시지 그대로 트윗을 올린다.
         */
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

            // 메시지 예제 => 스토리지 센터 알림 : [127.0.0.1]로부터 DSM에 대한 이-지붐 시도를 감지했습니다. (AbuseIPDB 자동 리포트) [00시 00분 00초]
            bot.tweet('스토리지 센터 알림 : [' + ipAddress + ']로부터 ' + target + '에 대한 이-지붐 시도를 감지했습니다. (AbuseIPDB 자동 리포트) [' + dt + ']');
            res.json({echo: message, report: resBody, message: 'Request sent. check your account.'});
        } catch (e) {
            // 메시지 예제 => 스토리지 센터 알림 : DSM 메시지 내용 [00시 00분 00초]
            bot.tweet('스토리지 센터 알림 : ' + message + ' [' + dt + ']');

            res.json({echo: message, message: 'Request sent. check your account.'});
        }
    } else {
        res.body('저런! 서버가 당신의 요청을 꺼ㅡ억 해버렸죠?');
    }
});

//PostMan 등의 프로그램을 이용하여 수동 메시지를 날리기 위한 봇
app.post('/manualNotice', (req, res) => {
    if (req.body.botPassword === information.manualbot_password) {
        let message = req.body.manualMessage;

        bot.tweet('관리자 알림 : ' + message);
        res.json({echo: data, message: 'Request sent. check your account.'});
    } else {
        res.body('저런! 서버가 당신의 요청을 꺼ㅡ억 해버렸죠?');
    }
});

http.listen(information.server_port, () => {
    console.log('Listening on http port : ' + information.server_port);
});