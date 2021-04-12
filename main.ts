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
video.on('end', () => { 
  sliceVideo(durationSecs);
});

const sliceVideo = (durationSecs: number, interval: number = 30) => {
  const startTimes = [];
  for (let i = 0; i < Math.ceil(durationSecs / interval); i++) startTimes.push(i * interval);
  const totalParts = startTimes.length;
  console.log(`Converting video into ${totalParts} parts of ${interval} seconds or less...`)

  let i = 1;
  let startTime = startTimes.shift();
  const callBack = () => { 
    process.stdout.write(`\rProgress: ${Math.round(i*100/totalParts)} %`);

    i++;
    startTime = startTimes.shift();
    if(startTime) {
      createSlice(startTime, interval, i, callBack)
    }
  }
  createSlice(startTime, interval, i, callBack)

}

const createSlice = (startTime: number, interval: number, index: number, cb) => {
  ffmpeg('video.mp4')
    .setStartTime(startTime)
    .setDuration(interval)
    .output(`video_part_${index}.mp4`)
    .on('end', function (err) {
      if (!err) {
        cb();
      }
    })
    .on('error', function (err) {
      console.log('error: ', err)
    }).run()
}