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
            fontSize: '24px',
            marginBottom: '20px',
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
        buttonContainer: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
        },
        pre: {
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
        },
        clickable: {
            cursor: 'pointer',
        },
        credentialCardStyles: {
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
            padding: '20px',
            margin: '20px auto',
            borderRadius: '8px',
            backgroundColor: '#fff',
            color: '#333',
            textAlign: 'left',
            maxWidth: '420px',
            fontFamily: '"Segoe UI", sans-serif',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        },
        credentialHeader: {
            background: 'linear-gradient(135deg, #654ea3, #eaafc8)',
            color: 'white',
            padding: '20px',
            fontWeight: 'bold',
            fontSize: '1.2em',
            height: '50px', // Adjust the height as needed
            // position: 'relative',
            borderRadius: '10px 10px 0 0'
        },
        credentialBody: {
            padding: '20px',
            backgroundColor: '#f7f7f7',
            borderBottomLeftRadius: '7px',
            borderBottomRightRadius: '7px',
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        },
        credentialDetail: {
            color: '#333',
            margin: '10px 0',
            fontSize: '16px',
        },
        credentialLabel: {
            fontSize: '16px',
            margin: '5px 0',
            textTransform: 'uppercase',
            color: '#555',
            fontWeight: 'bold',
        },
        email: {
            textAlign: 'center',
            marginTop: '20px',
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
            <h1 style={styles.header}>Congratulations, you completed the workshop!</h1>
            <div style={styles.buttonContainer}>
                <button style={styles.button} onClick={redeemCredential}>Redeem Credential</button>
            </div>

            {credential && (
                <>
                    <div>
                        <div id={`share`} style={styles.credentialCardStyles}>
                            <div style={styles.credentialHeader}>Web5 Learner Credential</div>
                            <div style={styles.credentialBody}>
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
                    </div>
                    <div style={styles.buttonContainer}>
                        <button style={styles.button} onClick={handleDownloadImage}>Download Credential</button>
                        <button style={styles.button} onClick={handleShareToTwitter}>Share to Twitter</button>
                    </div>
                    <p style={styles.email}>Send your credential to <a href={`mailto:${email}`}>{email}</a> in exchange for your prize!</p>
                </>
            )}
        </div>
    );
};

export default Completed;
