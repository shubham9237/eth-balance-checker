import express from 'express';
import Web3 from 'web3';
import QRCodeReader from 'qrcode-reader';
import Jimp from 'jimp';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID'); // Replace with your Infura Project ID

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Serve static files
app.use(express.static('public'));

// Endpoint to fetch balance by address
app.get('/balance/:address', async (req, res) => {
    try {
        const address = req.params.address;
        const balance = await web3.eth.getBalance(address);
        const balanceInEth = web3.utils.fromWei(balance, 'ether');
        res.json({ balance: balanceInEth });
    } catch (error) {
        console.error('Error fetching balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// Endpoint to upload QR code image
app.post('/scan-qr', upload.single('qrImage'), async (req, res) => {
    try {
        const imgPath = req.file.path;
        const image = await Jimp.read(imgPath);
        const qr = new QRCodeReader();

        qr.callback = async (err, value) => {
            if (err) {
                res.status(500).send('Error reading QR code');
                return;
            }

            const ethAddress = value.result;
            const balance = await web3.eth.getBalance(ethAddress);
            const balanceInEth = web3.utils.fromWei(balance, 'ether');

            // Remove uploaded file after processing
            fs.unlinkSync(imgPath);

            res.json({
                address: ethAddress,
                balance: balanceInEth
            });
        };

        qr.decode(image.bitmap);
    } catch (error) {
        console.error('Error processing QR code', error);
        res.status(500).send('Internal Server Error');
    }
});

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is started at http://localhost:${PORT}`);
});
