import React, { useRef, useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { initializeApp } from 'firebase/app';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/LSidebar';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD3s3ZcHjRfl3ntF6P1Az0bNRfW9ZQ-dr8",
  authDomain: "trainingplatform-48f63.firebaseapp.com",
  projectId: "trainingplatform-48f63",
  storageBucket: "trainingplatform-48f63.appspot.com",
  messagingSenderId: "784140665584",
  appId: "1:784140665584:web:67bf531e0e0e603f4d3835",
  measurementId: "G-34G8GJQFE1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function ChatRoom() {
  const dummy = useRef();
  const messagesRef = collection(firestore, 'messages');
  const q = query(messagesRef, orderBy('createdAt'), limit(25));
  const [messages] = useCollectionData(q, { idField: 'id' });
  const [formValue, setFormValue] = useState('');
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;

    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL
    });
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-grow bg-gray-800 text-center ml-16">
        <header className="bg-gray-900 h-16 min-h-[50px] text-white fixed w-[calc(100%-250px)] top-0 flex items-center justify-between z-50 p-2.5 box-border">
          <h1 className="text-xl">Chat Room</h1>
          <SignOut />
        </header>
        <section className="flex flex-col justify-center min-h-screen bg-gray-800">
          {user ? (
            <>
              <main className="p-2.5 h-[80vh] mt-16 mb-16 overflow-y-auto flex flex-col">
                {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                <div ref={dummy}></div>
              </main>
              <form onSubmit={sendMessage} className="h-16 fixed bottom-0 bg-gray-900 w-[calc(100%-250px)] flex text-xl">
                <input
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Type a message"
                  className="flex-grow text-white bg-gray-700 outline-none border-none p-2.5"
                />
                <button type="submit" disabled={!formValue} className="w-1/5 bg-indigo-700">
                  🕊️
                </button>
              </form>
            </>
          ) : (
            <SignIn />
          )}
        </section>
      </div>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  return (
    <button onClick={signInWithGoogle} className="bg-white text-gray-800 max-w-sm mx-auto px-4 py-2 rounded">
      Sign in with Google
    </button>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button onClick={() => signOut(auth)} className="bg-gray-800 text-white px-4 py-2 rounded">
        Sign Out
      </button>
    )
  );
}

function ChatMessage({ message }) {
  const { text, uid, photoURL } = message;
  const messageClass = uid === auth.currentUser.uid ? 'flex-row-reverse' : 'flex-row';

  return (
    <div className={`flex items-center ${messageClass}`}>
      <img src={photoURL} alt="User Avatar" className="w-10 h-10 rounded-full mx-1" />
      <p className={`max-w-xl mb-3 line-clamp-none p-2.5 rounded-xl ${uid === auth.currentUser.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
        {text}
      </p>
    </div>
  );
}

export default ChatRoom;
