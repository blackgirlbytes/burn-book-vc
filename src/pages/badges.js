// In badges.js
import { useEffect, useState, useCallback } from 'react';
import { VerifiableCredential } from "@web5/credentials";
import { useWeb5 } from "../Web5Context";
import html2canvas from 'html2canvas';
import axios from 'axios';

export default function Badges() {
    const [isUploading, setIsUploading] = useState(false);
    const styles = {
        container: {
            fontFamily: 'Arial, sans-serif',
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            flexDirection: 'column',
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
        buttonContainer: {
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
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
        }
    };

    const { web5Instance, myDid } = useWeb5();
    const [credentials, setCredentials] = useState([]);

    useEffect(() => {
        const getVcs = async () => {
            if (web5Instance && myDid) {
                await fetchStoredCredentials(myDid);
            }
        }
        getVcs();
    }, []);

    const fetchStoredCredentials = async (myDid) => {
        try {
            const response = await web5Instance.dwn.records.query({
                message: {
                    filter: {
                        schema: 'Web5LearnerCredential',
                        dataFormat: 'application/vc+jwt',
                    },
                },
            });

            if (response.status.code === 200) {
                const credentials = await Promise.all(
                    response.records.map(async (record) => {
                        console.log("Record:", record.data);
                        const vcJwt = await record.data.text(); 
                        const parsedVc = VerifiableCredential.parseJwt({ vcJwt });
                        console.log(parsedVc.vcDataModel.credentialSubject.message);
                        return {
                            parsedVc,
                            recordId: record.id
                        };
                    })
                );

                console.log("Fetched credentials:", credentials);
                setCredentials(credentials);
                return credentials;
            } else {
                console.error('Error fetching credentials:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error in fetchStoredCredentials:', error);
            return [];
        }
    };

    const handleDownloadImage = useCallback(async (id) => {
        const element = document.getElementById(id);
        const canvas = await html2canvas(element);
        const data = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");

        const link = document.createElement('a');
        link.href = data;
        link.download = 'downloaded-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const handleShareToTwitter = useCallback(async (id) => {
        setIsUploading(true); // Start loading
        console.log(id)
        const element = document.getElementById(id);
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

            const tweetText = 'Check out my credential from @blackgirlbytes!';
            const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(tweetText)}`;
            window.open(twitterUrl, '_blank');
        } catch (error) {
            console.error('Error uploading image:', error);
            setIsUploading(false);
        }
    }, []);


    return (
        <div>
            <h1 style={styles.header}>Your Badges</h1>
            <div style={styles.buttonContainer}>
                <button style={styles.button} onClick={() => fetchStoredCredentials(myDid)}>Get Credentials</button>
            </div>
            {credentials.map((credential, index) => (
                <div key={index}>
                    {credential.parsedVc && (
                        <div>
                        <div id={`print${index}`} style={styles.credentialCardStyles}>
                            <div style={styles.credentialHeader}>{credential.parsedVc.vcDataModel.type[1]}</div>
                                <div style={styles.credentialBody}>
                                    <p style={styles.credentialLabel}>Issue Date:</p>
                                    <p style={styles.credentialDetail}>{credential.parsedVc.vcDataModel.issuanceDate}</p>
                                    <p style={styles.credentialLabel}>Achievement:</p>
                                    <p style={styles.credentialDetail}>{credential.parsedVc.vcDataModel.credentialSubject.achievement}</p>
                                    <p style={styles.credentialLabel}>Workshop:</p>
                                    <p style={styles.credentialDetail}>{credential.parsedVc.vcDataModel.credentialSubject.workshop}</p>
                                    <p style={styles.credentialLabel}>Issued by:</p>
                                    <p style={styles.credentialDetail}>@blackgirlbytes</p>
                                </div>
                            </div>
                            <div style={styles.buttonContainer}>
                                <button style={styles.button} onClick={() => handleDownloadImage(`print${index}`)}>Download Credential</button>
                                <button style={styles.button} onClick={() => handleShareToTwitter(`print${index}`)}>Share to Twitter</button>
                            </div>
                        </div>
                    )}
 
                    {isUploading && <p>Loading...</p>}
                </div>
            ))}
        </div>
    );
}

