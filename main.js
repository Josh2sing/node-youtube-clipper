const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware to parse incoming form data
app.use(express.urlencoded({ extended: true }));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submission
app.post('/create-clip', (req, res) => {
    const { url, start, end } = req.body;

    // For now, simply print the form data to the console
    console.log(`YouTube URL: ${url}`);
    console.log(`Start Time: ${start}`);
    console.log(`End Time: ${end}`);

    // Send a response back to the user
    // res.send(`Clip request received for ${url} from ${start} to ${end}`);
    // Command to download a specific portion of the video using yt-dlp
    const outputFilename = "out"

    const command = `yt-dlp --http-chunk-size 10M --socket-timeout 120 --download-sections "*${start}-${end}" "${url}" -o "clip_%(id)s.%(ext)s"`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send('An error occurred while creating the clip');
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


