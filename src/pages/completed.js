import { useState, useCallback } from 'react';
import { useWeb5 } from "../Web5Context";
import { VerifiableCredential } from "@web5/credentials";
import html2canvas from 'html2canvas';
import axios from 'axios';
import { DidDht } from "@web5/dids";


const Completed = () => {
    const { myDid } = useWeb5();
    const [credential, setCredential] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [email, setEmail] = useState('');

    const styles = {
        container: {
            fontFamily: 'Arial, sans-serif',
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            display: 'flex',
        },
        header: {
            textAlign: 'center',
            color: '#333',
        },
        button: {
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
        },
        label: {
            display: 'block',
            margin: '20px 0 10px',
        },
        textarea: {
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minHeight: '100px',
        },
        jwtContainer: {
            marginTop: '20px',
            backgroundColor: '#f7f7f7',
            border: '1px solid #ddd',
            padding: '10px',
        },
        button: {
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
        },
        pre: {
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
        },
        clickable: {
            cursor: 'pointer',
        },
        credentialCardStyles: {
            border: '1px solid #ff69b4',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
            padding: '20px',
            margin: '20px auto',
            borderRadius: '10px',
            backgroundColor: '#fff',
            color: '#333',
            textAlign: 'left',
            maxWidth: '420px',
            fontFamily: 'Segoe UI, sans-serif',
            position: 'relative',
            overflow: 'hidden',
        },
        credentialDetail: {
            color: '#ff69b4',
            margin: '10px 0',
            fontSize: '16px',
            color: '#ff69b4'
        },
        credentialLabel: {
            fontSize: '16px',
            margin: '5px 0',
            textTransform: 'uppercase',
            color: '#555',
            fontWeight: 'bold',
        },
        watermark: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: '0.1',
            fontSize: '3em',
            color: '#ff69b4',
        }
    };

    const redeemCredential = async () => {
        try {
            const credentialIssuerDid = await DidDht.create();
            const credentialData = {
                achievement: "Certified in Web5",
                workshop: "Beginner's Guide to Web5",
            };

            const vc = await VerifiableCredential.create({
                type: 'Web5LearnerCredential',
                issuer: credentialIssuerDid.uri,
                subject: myDid,
                data: credentialData,
                expirationDate: '2024-02-23T12:34:56Z',
            });

            const signedVcJwt = await vc.sign({ did: credentialIssuerDid });

            const parsedVc = await VerifiableCredential.parseJwt({ vcJwt: signedVcJwt });
  
            setCredential({
                type: parsedVc.vcDataModel.type[1],
                issueDate: parsedVc.vcDataModel.issuanceDate,
                achievement: parsedVc.vcDataModel.credentialSubject.achievement,
                workshop: parsedVc.vcDataModel.credentialSubject.workshop, 
            });
            setEmail('rizel@tbd.email');
        } catch (error) {
            console.error('Error redeeming credential:', error);
        }
    };

    const handleDownloadImage = useCallback(async () => {
        const element = document.getElementById('share');
        const canvas = await html2canvas(element);
        const data = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");

        const link = document.createElement('a');
        link.href = data;
        link.download = 'downloaded-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleShareToTwitter = useCallback(async () => {
        setIsUploading(true); // Start loading
        const element = document.getElementById('share');
        const canvas = await html2canvas(element);
        const data = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");

        const blob = await (await fetch(data)).blob();
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', 'vc_burn_book_workshop');

        try {
            const response = await axios.post('https://api.cloudinary.com/v1_1/dd8qwbjtv/image/upload', formData)
            const imageUrl = response.data.secure_url;
            setIsUploading(false);

            const tweetText = 'I just earned a prize for learning about Web5 with @blackgirlbytes!';
            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(tweetText)}`;
            window.open(twitterUrl, '_blank');
        } catch (error) {
            console.error('Error uploading image:', error);
            setIsUploading(false);
        }
    }, []);

    return (
        <div>
            <h1>Congratulations, you completed the workshop!</h1>
            <button style={styles.button}  onClick={redeemCredential}>Redeem Credential</button>
            {credential && (
                <>
                    <div>
                        <div id={`share`} style={styles.credentialCardStyles}>
                            <div style={styles.watermark}>@BLACKGIRLBYTES</div>
                            <p style={styles.credentialLabel}>Type:</p>
                            <p style={styles.credentialDetail}>{credential.type}</p>
                            <p style={styles.credentialLabel}>Issue Date:</p>
                            <p style={styles.credentialDetail}>{credential.issueDate}</p>
                            <p style={styles.credentialLabel}>Achievement:</p>
                            <p style={styles.credentialDetail}>{credential.achievement}</p>
                            <p style={styles.credentialLabel}>Workshop:</p>
                            <p style={styles.credentialDetail}>{credential.workshop}</p>
                            <p style={styles.credentialLabel}>Issued by:</p>
                            <p style={styles.credentialDetail}>@blackgirlbytes</p>
                        </div>
                    </div>
                    <button style={styles.button} onClick={handleDownloadImage}>Download Credential</button>
                    <button style={styles.button} onClick={handleShareToTwitter}>Share to Twitter</button>
                    <p>Send your credential to <a href={`mailto:${email}`}>{email}</a> in exchange for your prize!</p>
                </>
            )}
        </div>
    );
};

export default Completed;
