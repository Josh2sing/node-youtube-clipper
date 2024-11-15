const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 4000;

app.use(express.static('public')); // Serve static files like HTML, JS, CSS from the "public" folder



app.get('/download-ytdlp', (req, res) => {
    const videoUrl = req.query.url;
    const startTime = req.query.start || "00:00:00";
    const endTime = req.query.end;

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    const outputFileName = `downloaded_video_${Date.now()}.mp4`;
    const outputFilePath = path.join(__dirname, outputFileName);

    // Construct the download-sections argument for yt-dlp
    let downloadSections = `*${startTime}-`;
    if (endTime) {
        downloadSections += `${endTime}`;
    }

    // Run yt-dlp to download and trim the video
    const ytdlp = spawn('yt-dlp', [
        '-f', 'best[ext=mp4]',          // Download the best quality video in mp4 format
        `--download-sections`, downloadSections, // Trim during download using yt-dlp
        '-o', outputFilePath,           // Set output file path
        videoUrl                        // The YouTube video URL
    ]);

    // Emit progress events to the client
    ytdlp.stdout.on('data', (data) => {
        const message = data.toString();
        const progressMatch = message.match(/(\d+\.\d+)%/);
        if (progressMatch) {
            const progress = parseFloat(progressMatch[1]);
            io.emit('download-progress', progress);
        }
        console.log(`stdout: ${message}`);
    });

    ytdlp.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    ytdlp.on('close', (code) => {
        if (code === 0) {
            // Send the trimmed video to the user
            res.download(outputFilePath, outputFileName, (err) => {
                if (err) {
                    console.error('Error while sending file:', err);
                    res.status(500).send('Error while sending the video file.');
                } else {
                    // Clean up the file after sending it to the client
                    fs.unlink(outputFilePath, (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error while deleting file:', unlinkErr);
                        }
                    });
                }
            });
        } else {
            res.status(500).send('Error downloading the video. Please try again.');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});
