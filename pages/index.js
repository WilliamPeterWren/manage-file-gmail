import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import axios from 'axios';


const arrayToUint8Array = (array) => {
  const len = array.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = array[i];
  }
  return bytes;
};


export default function Home() {
  const { data: session } = useSession();
  const [attachments, setAttachments] = useState([]);

  const fetchAttachments = async () => {
    if (session) {
      const res = await axios.get('/api/gmail', {
        params: { accessToken: session.accessToken },
      });
      // console.log(res)
      setAttachments(res.data.attachments);
    }
  };

  // Function to get MIME type based on file extension
  const getMimeType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    // console.log(extension)
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';  // Default for unknown types
    }
  };


  // Arrow function to handle downloading and creating blob
  const handleDownload = (attachment) => {
    try {
      // Decode Base64 to binary
      const base64String = attachment.data.data;
      const binaryString = Buffer.from(base64String, 'base64');
      const bytes = arrayToUint8Array(binaryString)
  
      // Create a Blob from the binary data
      const mimeType = getMimeType(attachment.filename);
      const blob = new Blob([bytes], { type: mimeType });
      
      // Create a download link and trigger a download
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = attachment.filename;
      link.click();
      window.URL.revokeObjectURL(link.href);  // Clean up the URL
    } catch (e) {
      console.error("Failed to download attachment:", e);
    }
  };

  return (
    <div>
      {!session ? (
        <button onClick={() => signIn()}>Sign in with Google</button>
      ) : (
        <>
          <button onClick={() => signOut()}>Sign out</button>
          <button onClick={fetchAttachments}>Fetch Attachments</button>
          {attachments.map((att, index) => (
            // console.log(att) && 
            <div key={index}>              
              <h4>{att.filename}</h4>
              <button onClick={() => handleDownload(att)}>Download</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
