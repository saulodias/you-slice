import fs = require('fs')
import youtubedl = require('youtube-dl')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

const url = JSON.parse(process.env.npm_config_argv).remain[0];

const video = youtubedl(url, [], {
  cwd: __dirname
});

let duration: string;
let durationSecs: number;
video.on('info', info => {
  console.log('filename: ' + info._filename)
  console.log('size: ' + info.size)
  duration = info._duration_hms;
  durationSecs = info._duration_raw;
});
video.pipe(fs.createWriteStream('video.mp4'));
video.on('end', () => sliceVideo());

function sliceVideo(interval: number = 30) {
  const baseName = 'video';
  const startTimes = [];
  for (let i = 0; i < Math.ceil(durationSecs / interval); i++) startTimes.push(i * interval)
  console.log(`Converting ${duration} of video into ${startTimes.length} parts of ${interval} seconds or less...`)
  startTimes.forEach((startTime, i) => {
    ffmpeg('video.mp4')
      .setStartTime(startTime)
      .setDuration(interval)
      .output(`${baseName}_part_${i+1}.mp4`)
      .on('end', function (err) {
        if (!err) {
          console.log(`Converted part ${i+1}/${startTimes.length}`)
        }
      })
      .on('error', function (err) {
        console.log('error: ', err)
      }).run()
  });
}