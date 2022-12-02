const TelegramBot = require('node-telegram-bot-api');
const Crawler = require('crawler');
const axios = require('axios').default;

const token = '5643217280:AAGqS-uzDTRKncPstZ7Dcn7Tp69-oUrF0Ew';
const bot = new TelegramBot(token, { polling: true });
const crawler = new Crawler({
    maxConnections: 10,
});

async function sendTracks (msg) {
    const chatId = msg.chat.id;
    const name = msg.text.split('#')[0];
    const artist = msg.text.split('#')[1];
    var url = '';
    if (!name) return;
    if (!artist) url = 'https://api.musixmatch.com/ws/1.1/track.search?apikey=f6df39af0f75b05285896bd721a173de&q_track=' + name + '&s_track_rating=desc';
    else url = 'https://api.musixmatch.com/ws/1.1/track.search?apikey=f6df39af0f75b05285896bd721a173de&q_track=' + name + '&q_artist=' + artist + '&s_track_rating=desc';
    const response = await axios.get(url);
    const tracks = response.data.message.body.track_list;
    var songs = '';
    for (var i = 0; i < tracks.length; i++) {
        songs += '*' + tracks[i].track.track_name + '* by _' + tracks[i].track.artist_name + '_ from album _' + tracks[i].track.album_name + '_\n';
        songs += '/get' + tracks[i].track.track_id + '\n\n';
    }
    if (!songs) return;
    else {
        const opts = {
            parse_mode: 'Markdown'
        };
        bot.sendMessage(chatId, songs, opts);
    }
}

async function getTrack (id) {
    const response = await axios.get('https://api.musixmatch.com/ws/1.1/track.get?apikey=f6df39af0f75b05285896bd721a173de&track_id=' + id);
    const url = response.data.message.body.track.track_share_url.split('?')[0];
    return url;
}

async function sendTrack (msg) {
    const chatId = msg.chat.id;
    const url = await getTrack(msg.text.split('/get')[1]);
    var response = '';
    crawler.queue([{
        uri: url + '/translation/farsi',
        jQuery: true,
        callback: function (error, res, done) {
            if (error) console.log(error);
            else {
                var $ = res.$;
                $('.mxm-translatable-line-readonly').each(function (i, element) {
                    var original = $(this).find('.row .col-lg-6').eq(0).text();
                    var translated = $(this).find('.row .col-lg-6').eq(1).text();
                    if (!original) return;
                    response += original + '\n';
                    if (original == translated) translated = '';
                    response += translated + '\n';
                    response += '\n';
                });
            }
            bot.sendMessage(chatId, response);
            done();
        }
    }]);
}

bot.on('message', async (msg) => {
    if (!msg.text.startsWith('/get')) sendTracks(msg);
    else sendTrack(msg);
});