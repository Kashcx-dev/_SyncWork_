# Developer Guide: E2E Encrypted Chat UI Integration

> [!IMPORTANT]
> **Project Status Notice:** The custom C++ modular exponentiation WebAssembly binary (`math_engine.wasm`), all backend routes (`/api/chat/*`), database models (`Conversation`, `Message`), and the cryptographic functions (`crypto.js`) are **already 100% written, configured, and functional**. 
> 
> Your ONLY task is to build the React UI layout (sidebar, chat history window, input field) and connect it to the pre-existing socket events and helper endpoints described below.

---

## 1. How E2E Encryption Works in this App

```
[Employee A]                                                       [Employee B]
     |                                                                   |
     |--- (1) Generate Private/Public Key pair --------------------------|
     |--- (2) Store encrypted Private Key in Vault (Server) -------------|
     |                                                                   |
     |--- (3) Request Employee B's Public Key -------------------------->|
     |                                                                   |
     |--- (4) Calculate Shared Secret (Wasm: B's Pub + A's Priv) --------|
     |--- (5) Encrypt message with AES-256-GCM using Shared Secret ------>|
     |--- (6) Send encrypted payload to Server ------------------------->|
     |                                                                   |
     |                                   (7) Push via Socket.io -------->|
     |                                                                   |
     |<-- (8) Calculate Shared Secret (Wasm: A's Pub + B's Priv) --------|
     |<-- (9) Decrypt message using Shared Secret -----------------------|
```

The server is **completely blind** to the chat contents. It only stores and passes encrypted JSON blobs:
```json
{
  "iv": "dGVzdF9pdl9zdHJpbmc=",
  "ct": "dGVzdF9jaXBoZXJ0ZXh0X3N0cmluZw=="
}
```

---

## 2. Setup Dependencies & Assets

1. **Install Socket.io Client**:
   ```bash
   npm install socket.io-client
   ```
2. **WebAssembly Binary**: 
   Ensure `math_engine.wasm` is placed inside the `frontend/public/` directory so it is served at `http://localhost:5173/math_engine.wasm`.
3. **Crypto Utilities**:
   The file `frontend/src/utils/crypto.js` is ready at `frontend/src/utils/crypto.js`. It contains all WebAssembly loading and encryption wrappers.

---

## 3. Step-by-Step Frontend Implementation

### Step A: Initialize the Socket Client
Create a file at `frontend/src/socket.js`:

```javascript
import { io } from "socket.io-client";

// Connect to the root server (which hosts Socket.io on /socket.io)
export const socket = io({
  path: '/socket.io',
  autoConnect: false,
  reconnection: true,
  auth: {
    token: localStorage.getItem('token') // Use whatever token storage key you have
  }
});

// Update the auth token on reconnects
socket.on("connect", () => {
  socket.auth.token = localStorage.getItem('token');
});
```

### Step B: Startup Logic (Init Crypto & Connect Sockets)
In your main app component or Context provider (`AppContext.jsx`):

1. **On login / app start**: Load the WebAssembly module and connect the socket.
2. **Manage active keys in React state**:
   - `myPrivateKey`: Kept in memory (never saved to database unencrypted).
   - `activeSharedSecrets`: A cache map of `userId -> sharedSecret` to avoid re-calculating DH math for every single message.

```javascript
import { initCryptoEngine, decryptPrivateKeyFromVault } from './utils/crypto';
import { socket } from './socket';

// In your initialization effect:
useEffect(() => {
  const setupChat = async () => {
    const isWasmLoaded = await initCryptoEngine();
    if (isWasmLoaded && isLoggedIn) {
      socket.connect();
    }
  };
  setupChat();
}, [isLoggedIn]);
```

### Step C: Signup & Vault Creation (First Time setup)
When a user signs up or logs in for the first time, they need to generate their cryptographic identity:

```javascript
import { 
  generateRandomPrivateKey, 
  getPublicKey, 
  encryptPrivateKeyForVault 
} from './utils/crypto';

async function handleFirstTimeCryptoSetup(password) {
  // 1. Generate a random private key (BigInt)
  const privateKey = generateRandomPrivateKey();
  const privateKeyStr = privateKey.toString();

  // 2. Derive the public key via WebAssembly modulation
  const publicKeyStr = getPublicKey(privateKey);

  // 3. Encrypt the private key using the user's password (AES-GCM)
  const vault = await encryptPrivateKeyForVault(privateKeyStr, password);

  // 4. Send keys to backend
  await fetch('/api/chat/vault', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      publicKey: publicKeyStr,
      encryptedPrivateKey: vault.encrypted_private_key,
      keySalt: vault.key_salt,
      keyIv: vault.key_iv
    })
  });

  return privateKey;
}
```

### Step D: Login & Vault Recovery
When logging in, fetch the vault from the server and decrypt the private key into memory using the user's password:

```javascript
import { decryptPrivateKeyFromVault } from './utils/crypto';

async function handleLoginCryptoSetup(password) {
  const res = await fetch('/api/chat/vault', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();

  if (data.hasVault) {
    const privateKeyStr = await decryptPrivateKeyFromVault(data.vault, password);
    const privateKeyBigInt = BigInt(privateKeyStr);
    
    // Save privateKeyBigInt in context/state for runtime decrypts
    return privateKeyBigInt;
  } else {
    // If they logged in but never set up a vault, trigger Step C!
    return await handleFirstTimeCryptoSetup(password);
  }
}
```

---

## 4. UI Layout & Component Guidelines

The chat interface should feel slick, modern, and responsive. Here is a recommended layout:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CHAT SYSTEM                               │
├───────────────────────┬────────────────────────────────────────────────┤
│  Search Employees     │  David Chen                                    │
│  [ Search...        ] │  online                                        │
├───────────────────────┼────────────────────────────────────────────────┤
│  CONVERSATIONS        │                                                │
│  ● Sarah Jenkins (HR) │       [Encrypted message from David]  10:05 AM │
│    "Hey David..."     │                                                │
│                       │  Hi Sarah, I applied for leaves!      10:06 AM │
│  ○ David Chen         │                                                │
│    [File Sent]        │                                                │
│                       │                                                │
├───────────────────────┼────────────────────────────────────────────────┤
│                       │  [📎] [ Type encrypted message...      ] [🚀]  │
└───────────────────────┴────────────────────────────────────────────────┘
```

### 1. The Conversations Sidebar (Left Panel)
- **Search Bar**: Query `GET /api/chat/users?search=name` to list employees. Clicking an employee triggers `POST /api/chat/direct` with `{ targetUserId }` to obtain/start a conversation.
- **Active Chats List**: Call `GET /api/chat/conversations` to fetch all chats you have going.
  - Displays: Display name, online status, unread count badge, and a decrypted snippet of the last message sent.
  - *Decrypting the preview*: Use the other user's `publicKey` and your `myPrivateKey` to derive the shared secret, then run `decryptMessage(lastMessageText, sharedSecret)`.

### 2. The Chat Window (Right Panel)
- **Fetch History**: On selecting a conversation, call `GET /api/chat/history/:conversationId`.
  - Loop through history and decrypt every message payload on the fly before displaying:
    ```javascript
    const secret = calculateSharedSecret(otherUserPublicKey, myPrivateKey);
    const plainText = await decryptMessage(encryptedMessageBlob, secret);
    ```
- **Real-Time Listener**: Keep a socket listener active to intercept incoming messages dynamically:
  ```javascript
  useEffect(() => {
    socket.on("new_message", async (msg) => {
      if (msg.conversation_id === activeConvoId) {
        // Calculate secret and decrypt incoming message
        const secret = calculateSharedSecret(otherUserPublicKey, myPrivateKey);
        const plainText = await decryptMessage(msg.message, secret);
        
        // Append decrypted message to messages list state
        setMessages(prev => [...prev, { ...msg, decryptedText: plainText }]);
      }
    });

    return () => socket.off("new_message");
  }, [activeConvoId, otherUserPublicKey, myPrivateKey]);
  ```

### 3. Message Sender Input
- When hitting **Send** or pressing **Enter**:
  1. Calculate the shared secret:
     ```javascript
     const secret = calculateSharedSecret(otherUserPublicKey, myPrivateKey);
     ```
  2. Encrypt the plaintext input:
     ```javascript
     const encryptedBlob = await encryptMessage(inputText, secret);
     ```
  3. Send to backend:
     ```javascript
     await fetch('/api/chat/message', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`
       },
       body: JSON.stringify({
         conversation_id: activeConvoId,
         message: encryptedBlob
       })
     });
     ```

### 4. File Upload (Attachments)
- If a user uploads an image/file:
  1. Send it via Multipart/FormData to `POST /api/chat/upload` to upload to the server.
  2. The server responds with `{ path: "/uploads/filename.png" }`.
  3. Construct an attachment payload: `{"_attachment":true, "path":"/uploads/filename.png"}`.
  4. Encrypt that JSON string as the message body, and send it via `POST /api/chat/message`.
  5. The receiver decrypts it, notices the `_attachment: true` property, and renders it as an `<img>` tag or download link!
