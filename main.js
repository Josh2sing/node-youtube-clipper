const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/create-clip', (req, res) => {
    const { url, start, end } = req.body;
    console.log(`YouTube URL: ${url}`);
    console.log(`Start Time: ${start}`);
    console.log(`End Time: ${end}`);

    const outputFilename = "out.mp4"

    const command = `yt-dlp --remux-video mp4 --download-sections "*${start}-${end}" "${url}" -o "${outputFilename}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            // return res.status(500).send('An error occurred while creating the clip');
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        console.log(`stdout: ${stdout}`);

        // Wait until the file has been created
        if (fs.existsSync(outputFilename)) {
            // Send the file as a download to the user
            res.download(outputFilename, (err) => {
                if (err) {
                    console.error('Error while sending the file:', err);
                    res.status(500).send('An error occurred while downloading the file');
                }

                // Delete the file from the server after it's been downloaded
                fs.unlinkSync(outputFilename);
            });
        } else {
            res.status(500).send('An error occurred while processing the clip');
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


