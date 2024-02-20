// import { Web5 } from "@web5/api";
import { useWeb5 } from "./Web5Context";
import { VerifiableCredential } from "@web5/credentials";
import { DidDht } from "@web5/dids";
import { useState, useEffect } from "react";
import styles from '../styles/Home.module.css'


export default function Home() {
  const { web5Instance, myDid } = useWeb5();
  const [recipientDid, setRecipientDid] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageType, setMessageType] = useState('Secret');
  const [submitStatus, setSubmitStatus] = useState('');
  const [didCopied, setDidCopied] = useState(false);


  useEffect(() => {
    const initWeb5 = async () => {
      if (web5Instance && myDid) {
        console.log('Installing protocol...')
        await configureProtocol(web5Instance, myDid);
      }
    };
    initWeb5();
  }, []);


  
  const queryLocalProtocol = async (web5Instance) => {
    return await web5Instance.dwn.protocols.query({
      message: {
        filter: {
          protocol: "https://blackgirlbytes.dev/burn-book-finale",
        },
      },
    });
  };


  const queryRemoteProtocol = async (web5Instance, did) => {
    return await web5Instance.dwn.protocols.query({
      from: did,
      message: {
        filter: {
          protocol: "https://blackgirlbytes.dev/burn-book-finale",
        },
      },
    });
  };

  const installLocalProtocol = async (web5Instance, protocolDefinition) => {
    return await web5Instance.dwn.protocols.configure({
      message: {
        definition: protocolDefinition,
      },
    });
  };

  const installRemoteProtocol = async (web5Instance, did, protocolDefinition) => {
    const { protocol } = await web5Instance.dwn.protocols.configure({
      message: {
        definition: protocolDefinition,
      },
    });
    return await protocol.send(did);
  };


  const configureProtocol = async (web5Instance, did) => {
    console.log('Configuring protocol...')
    const protocolDefinition = defineNewProtocol();
    const protocolUrl = protocolDefinition.protocol;

    const { protocols: localProtocols, status: localProtocolStatus } = await queryLocalProtocol(web5Instance, protocolUrl);
    if (localProtocolStatus.code !== 202 || localProtocols.length === 0) {
      const result = await installLocalProtocol(web5Instance, protocolDefinition);
      console.log({ result })
      console.log("Protocol installed locally");
    }

    const { protocols: remoteProtocols, status: remoteProtocolStatus } = await queryRemoteProtocol(web5Instance, did, protocolUrl);
    console.log({ remoteProtocols, remoteProtocolStatus })
    if (remoteProtocolStatus.code !== 200 || remoteProtocols.length === 0) {
      const result = await installRemoteProtocol(web5Instance, did, protocolDefinition);
      console.log({ result })
      console.log("Protocol installed remotely");
    }
  };

  const defineNewProtocol = () => {
    return {
      protocol: "https://blackgirlbytes.dev/burn-book-finale",
      published: true,
      types: {
        secretMessage: {
          schema: "https://example.com/secretMessageSchema",
          dataFormats: ["application/json"],
        },
        directMessage: {
          schema: "https://example.com/directMessageSchema",
          dataFormats: ["application/json"],
        },
      },
      structure: {
        secretMessage: {
          $actions: [
            { who: "anyone", can: "write" },
            { who: "author", of: "secretMessage", can: "read" },
          ],
        },
        directMessage: {
          $actions: [
            { who: "author", of: "directMessage", can: "read" },
            { who: "recipient", of: "directMessage", can: "read" },
            { who: "anyone", can: "write" },
          ],
        },
      },
    };
  };

  const writeToDwnSecretMessage = async (messageObj) => {
    try {
      const secretMessageProtocol = defineNewProtocol();
      const { record, status } = await web5Instance.dwn.records.write({
        data: messageObj,
        message: {
          protocol: secretMessageProtocol.protocol,
          protocolPath: "secretMessage",
          schema: secretMessageProtocol.types.secretMessage.schema,
          recipient: myDid,
        },
      });

      if (status.code === 200) {
        return { ...messageObj, recordId: record.id };
      }

      console.log('Secret message written to DWN', { record, status });
      return record;
    } catch (error) {
      console.error('Error writing secret message to DWN', error);
    }
  };

  const writeToDwnDirectMessage = async (messageObj) => {
    console.log('IN DIRECT MESSAGE')
    try {
      const directMessageProtocol = defineNewProtocol();
      const { record, status } = await web5Instance.dwn.records.write({
        data: messageObj,
        message: {
          protocol: directMessageProtocol.protocol,
          protocolPath: "directMessage",
          schema: directMessageProtocol.types.directMessage.schema,
          recipient: messageObj.recipientDid,
        },
      });

      if (status.code === 200) {
        return { ...messageObj, recordId: record.id };
      }


      console.log('Direct message written to DWN', { record, status });
      return record;
    } catch (error) {
      console.error('Error writing direct message to DWN', error);
    }
  };

  const issueCredentialForDirectMessage = async (did) => {
    try {
      const credentialIssuerDid = await DidDht.create();
      const credentialData = {
        achievement: "I learned P2P DWN messaging!",
        workshop: "Beginner's Guide to Web5",
      };

      const vc = await VerifiableCredential.create({
        type: 'Web5LearnerCredential',
        issuer: credentialIssuerDid.uri,
        subject: did,
        data: credentialData
      });

      const signedVcJwt = await vc.sign({ did: credentialIssuerDid });

      console.log("Credential issued:", vc);
      console.log(signedVcJwt)
      const { record, status } = await web5Instance.dwn.records.create({
        data: signedVcJwt,
        message: {
          schema: 'Web5LearnerCredential',
          dataFormat: 'application/vc+jwt',
        },
      });
      console.log({ record, status })
      if (status.code === 202) {
        console.log("Credential stored in DWN:", record);
        // Handle the stored credential as needed
      } else {
        throw new Error('Failed to store credential in DWN');
      }
    } catch (error) {
      console.error("Error issuing credential:", error);
    }
  };

  const issueCredentialForSecretMessage = async (did) => {
    try {
      const credentialIssuerDid = await DidDht.create();
      const credentialData = {
        achievement: "I learned how to store records in my DWN!",
        workshop: "Beginner's Guide to Web5",
      };

      const vc = await VerifiableCredential.create({
        type: 'Web5LearnerCredential',
        issuer: credentialIssuerDid.uri,
        subject: did,
        data: credentialData
      });

      const signedVcJwt = await vc.sign({ did: credentialIssuerDid });

      console.log("Credential issued:", vc);
      console.log(signedVcJwt)
      const { record, status } = await web5Instance.dwn.records.create({
        data: signedVcJwt,
        message: {
          schema: 'Web5LearnerCredential',
          dataFormat: 'application/vc+jwt',
        },
      });
      console.log({ record, status })
      if (status.code === 202) {
        console.log("Credential stored in DWN:", record);
        // Handle the stored credential as needed
      } else {
        throw new Error('Failed to store credential in DWN');
      }
    } catch (error) {
      console.error("Error issuing credential:", error);
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Submitting message...');
    setSubmitStatus('Submitting...');

    try {
      const targetDid = messageType === 'Direct' ? recipientDid : myDid;
      let messageObj;
      let record;

      if (messageType === 'Direct') {
        console.log('Sending direct message...');
        messageObj = constructDirectMessage(recipientDid);
        record = await writeToDwnDirectMessage(messageObj);
       await issueCredentialForDirectMessage(myDid);
      } else {
        messageObj = constructSecretMessage();
        record = await writeToDwnSecretMessage(messageObj);
       await issueCredentialForSecretMessage(myDid);
      }

      if (record) {
        const { status } = await record.send(targetDid);
        console.log("Send record status in handleSubmit", status);
        setSubmitStatus('Message submitted successfully');
        await fetchMessages();
      } else {
        throw new Error('Failed to create record');
      }

      setMessage('');
      setImageUrl('');
    } catch (error) {
      console.error('Error in handleSubmit', error);
      setSubmitStatus('Error submitting message: ' + error.message);
    }
  };

  const constructDirectMessage = (recipientDid) => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    return {
      text: message,
      timestamp: `${currentDate} ${currentTime}`,
      sender: myDid,
      type: 'Direct',
      recipientDid: recipientDid,
      imageUrl: imageUrl,
    };
  };

  const constructSecretMessage = () => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    return {
      text: message,
      timestamp: `${currentDate} ${currentTime}`,
      sender: myDid,
      type: 'Secret',
      imageUrl: imageUrl,
    };
  };

  const fetchUserMessages = async () => {
    console.log('Fetching sent messages...');
    try {
      const response = await web5Instance.dwn.records.query({
        from: myDid,
        message: {
          filter: {
            protocol: "https://blackgirlbytes.dev/burn-book-finale",
            schema: "https://example.com/directMessageSchema",
          },
        },
      });

      if (response.status.code === 200) {
        const userMessages = await Promise.all(
          response.records.map(async (record) => {
            const data = await record.data.json();
            return {
              ...data,
              recordId: record.id
            };
          })
        );
        return userMessages
      } else {
        console.error('Error fetching sent messages:', response.status);
        return [];
      }

    } catch (error) {
      console.error('Error in fetchSentMessages:', error);
    }
  };

  const fetchDirectMessages = async () => {
    console.log('Fetching received direct messages...');
    try {
      const response = await web5Instance.dwn.records.query({
        message: {
          filter: {
            protocol: "https://blackgirlbytes.dev/burn-book-finale",
          },
        },
      });

      if (response.status.code === 200) {
        const directMessages = await Promise.all(
          response.records.map(async (record) => {
            const data = await record.data.json();
            return {
              ...data,
              recordId: record.id
            };
          })
        );
        return directMessages
      } else {
        console.error('Error fetching sent messages:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error in fetchReceivedDirectMessages:', error);
    }
  };

  const fetchMessages = async () => {
    const userMessages = await fetchUserMessages();
    const directMessages = await fetchDirectMessages();
    const allMessages = [...(userMessages || []), ...(directMessages || [])];
    setMessages(allMessages);
  };


  const handleCopyDid = async () => {
    if (myDid) {
      try {
        await navigator.clipboard.writeText(myDid);
        setDidCopied(true);
        setTimeout(() => {
          setDidCopied(false);
        }, 3000);
      } catch (err) {
        console.error("Failed to copy DID: " + err);
      }
    }
  };

  const deleteMessage = async (recordId, myDid) => {
    try {
      const response = await web5Instance.dwn.records.delete({
        from: myDid,
        message: {
          recordId: recordId
        },
      });

      if (response.status.code === 202) {
        console.log('Message deleted successfully');
        setMessages(prevMessages => prevMessages.filter(message => message.recordId !== recordId));
      }
    } catch (error) {
      console.error('Error in deleteMessage:', error);
    }
  };


  return (
    <div>
      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your secret message here"
          />
          <input
            className={styles.input}
            type="text"
            placeholder="Enter image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <select
            className={styles.select}
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
          >
            <option value="Secret">Secret</option>
            <option value="Direct">Direct</option>
          </select>
          {messageType === 'Direct' && (
            <input
              className={styles.input}
              type="text"
              value={recipientDid}
              onChange={e => setRecipientDid(e.target.value)}
              placeholder="Enter recipient's DID"
            />
          )}
          <div className={styles.buttonContainer}>
            <button className={styles.button} type="submit">Submit Message</button>
            <button className={styles.secondaryButton} type="button" onClick={fetchMessages}>Refresh Messages</button>
            <button className={styles.secondaryButton} type="button" onClick={() => configureProtocol(web5Instance, myDid)}>Install Protocol</button>
            <button className={styles.secondaryButton} type="button" onClick={handleCopyDid}>Copy DID</button>
          </div>
        </form>
        {didCopied && <p className={styles.alertText}>DID copied to clipboard!</p>}
      </div>
      {messages.map((message, index) => (
        <div key={index} className={styles.container}>
          <div className={styles.field}>
            <div className={styles.fieldName}>From:</div>
            <div className={styles.didContainer}>{message.sender}</div>
          </div>
          <div className={styles.field}>
            <div className={styles.fieldName}>Timestamp</div>
            <div>{message.timestamp}</div>
          </div>
          <div className={styles.messageRow}>
            <div className={styles.messageContent}>
              <div className={styles.fieldName}>Message</div>
              <div>{message.text}</div>
            </div>
            {message.sender === myDid && (
              <button
                className={styles.deleteButton}
                onClick={() => deleteMessage(message.recordId)}
              >
                Delete
              </button>
            )}
          </div>
          {message.imageUrl && (
            <div className={styles.imageContainer}>
              <img
                className={styles.image}
                src={message.imageUrl}
                alt="Uploaded content"
              />
            </div>
          )}
          <div className={`${styles.messageType} ${styles[message.type.toLowerCase()]}`}>
            {message.type}
          </div>
        </div>
      ))}

    </div>
  );
}