const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3002;


app.use(express.static('public')); // Папка для статических файлов

app.get('/get-formats', async (req, res) => {
    const videoURL = req.query.url;
    if (!ytdl.validateURL(videoURL)) {
        return res.status(400).send('Неверная URL');
    }

    try {
        const info = await ytdl.getInfo(videoURL);
        const videoLengthSeconds = parseInt(info.videoDetails.lengthSeconds);

        const formats = info.formats
            .filter(format => format.hasAudio && format.hasVideo && format.container === 'mp4') // Фильтр форматов с аудио и видео
            .map(format => {
                const sizeEstimate = estimateFileSize(format.bitrate, videoLengthSeconds);
                return {
                    itag: format.itag,
                    qualityLabel: format.qualityLabel,
                    container: format.container,
                    codecs: format.codecs,
                    sizeEstimate // Размер в МБ
                };
            });
        res.json(formats);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при получении информации о форматах');
    }
});

app.get('/download', async (req, res) => {
    const videoURL = req.query.url;
    if (!ytdl.validateURL(videoURL)) {
        return res.status(400).send('Неверная URL');
    }

    try {
        const info = await ytdl.getInfo(videoURL);
        const videoTitle = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_');
        
        const videoStream = ytdl(videoURL, { quality: 'highestvideo' });
        const audioStream = ytdl(videoURL, { quality: 'highestaudio' });
        const outputPath = path.join(__dirname, `${videoTitle}.mp4`);

        ffmpeg()
            .input(videoStream)
            .videoCodec('copy')
            .input(audioStream)
            .audioCodec('copy')
            .save(outputPath)
            .on('end', () => {
                res.download(outputPath, () => {
                    fs.unlinkSync(outputPath); // Удалить файл после отправки
                });
            });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при загрузке видео');
    }
});

function estimateFileSize(bitrate, lengthSeconds) {
    const bitrateKbps = bitrate / 1000; // Преобразование в килобиты в секунду
    const fileSizeKb = bitrateKbps * lengthSeconds; // Размер в килобитах
    return Math.round(fileSizeKb / 1024 / 8); // Преобразование в мегабайты
}

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
