import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle file change event
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle file upload event
  const handleFileUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);  // 'file' is the field name in the backend

      setIsUploading(true);

      try {
        // Send the file to the backend
        const response = await fetch('http://localhost:5001/fileup', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          console.log('File uploaded successfully:', data);
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: 'bot', text: 'Your file has been uploaded successfully!' },
            { sender: 'bot', text: `AI Review: ${data.reply}` }, // Display AI response
          ]);
        } else {
          console.error('Error uploading file:', data);
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: 'bot', text: 'Error uploading your file.' },
          ]);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: 'Error uploading your file.' },
        ]);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Handle sending chat message
  const handleSendMessage = async () => {
    if (chatInput.trim()) {
      const newMessage = { sender: 'user', text: chatInput };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setIsLoading(true);

      try {
        const response = await axios.post('http://localhost:5001/chat', {
          message: chatInput,  // Send the message content
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const botMessage = { sender: 'bot', text: response.data.reply };
        setMessages((prevMessages) => [...prevMessages, newMessage, botMessage]);
      } catch (error) {
        console.error('Error in chat API call:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: 'Sorry, there was an error processing your request.' },
        ]);
      } finally {
        setIsLoading(false);
      }

      setChatInput('');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Fee's AI Agent!</h1>
        <p>Upload your PDF document and receive a review from Fee's point of view.</p>

        {/* File upload input */}
        <div className="file-upload">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
          />
          <button onClick={handleFileUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>

        {/* Chat box input */}
        <div className="chat-box">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={msg.sender === 'user' ? 'user-message' : 'bot-message'}>
                {msg.text}
              </div>
            ))}
          </div>

          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Fee anything..."
          />
          <button onClick={handleSendMessage} disabled={isLoading}>
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
