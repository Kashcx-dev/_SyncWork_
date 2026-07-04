import React, { useState, useEffect, useContext, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { socket } from "../socket";
import {
	calculateSharedSecret,
	encryptMessage,
	decryptMessage,
} from "../utils/crypto";
import {
	Search,
	Send,
	Image,
	Lock,
	ShieldCheck,
	Loader2,
	ArrowLeft,
	Download,
	Paperclip,
} from "lucide-react";

const BACKEND_HOST = import.meta.env.VITE_BACKEND_HOST;
import noProfilePic from "../assets/no-profile-pic.png";

export default function Chat() {
	const { currentUser, myPrivateKey, handleLoginCryptoSetup } =
		useContext(AppContext);

	const [passwordInput, setPasswordInput] = useState("");
	const [unlockError, setUnlockError] = useState("");
	const [isUnlocking, setIsUnlocking] = useState(false);

	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [conversations, setConversations] = useState([]);
	const [activeConvo, setActiveConvo] = useState(null);

	const [messages, setMessages] = useState([]);
	const [inputText, setInputText] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const [sharedSecrets, setSharedSecrets] = useState({});

	const [showSidebar, setShowSidebar] = useState(true);

	const messagesEndRef = useRef(null);
	const fileInputRef = useRef(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Fetch conversations list when unlocked
	useEffect(() => {
		if (!myPrivateKey) return;
		fetchConversations();
	}, [myPrivateKey]);

	// Handle search input changes
	useEffect(() => {
		if (!myPrivateKey) return;
		if (searchTerm.trim() === "") {
			setSearchResults([]);
			return;
		}
		const delayDebounceFn = setTimeout(() => {
			searchUsers();
		}, 300);

		return () => clearTimeout(delayDebounceFn);
	}, [searchTerm, myPrivateKey]);

	useEffect(() => {
		if (!myPrivateKey || !activeConvo) return;

		// Fetch history
		loadHistory(activeConvo.id);

		// Join room via socket
		socket.emit("join", activeConvo.id);

		// Mark as read
		markAsRead(activeConvo);

		return () => {
			socket.emit("leave", activeConvo.id);
		};
	}, [activeConvo, myPrivateKey]);

	// Socket.io Real-time Message Listener
	useEffect(() => {
		if (!myPrivateKey) return;

		const handleIncomingMessage = async (msg) => {
			// Find if this conversation is active
			if (activeConvo && msg.conversation_id === activeConvo.id) {
				const secret = await getSharedSecretForUser(activeConvo.otherUser);
				const plainText = await decryptMessage(msg.message, secret);

				setMessages((prev) => [
					...prev,
					{
						id: msg.id,
						senderId: msg.sender_id,
						message: msg.message,
						timestamp: msg.timestamp,
						decryptedText: plainText,
					},
				]);

				// Mark read on socket receive
				markAsRead(activeConvo, msg.id);
			}

			// Refresh conversations list to show preview/badge
			fetchConversations();
		};

		socket.on("new_message", handleIncomingMessage);

		return () => {
			socket.off("new_message", handleIncomingMessage);
		};
	}, [activeConvo, myPrivateKey, sharedSecrets]);

	const getSharedSecretForUser = async (otherUser) => {
		if (!otherUser || !otherUser.publicKey) return "";
		if (sharedSecrets[otherUser.id]) {
			return sharedSecrets[otherUser.id];
		}

		// Calculate DH shared secret via Wasm
		const secret = calculateSharedSecret(otherUser.publicKey, myPrivateKey);
		setSharedSecrets((prev) => ({ ...prev, [otherUser.id]: secret }));
		return secret;
	};

	const fetchConversations = async () => {
		try {
			const token = sessionStorage.getItem("hrms_react_token");
			const res = await fetch(
				`${BACKEND_HOST}/api/chat/conversations`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			const data = await res.json();
			if (res.ok && data.conversations) {
				// Decrypt last message preview for each conversation
				const enriched = await Promise.all(
					data.conversations.map(async (convo) => {
						let preview = "No messages yet";
						if (convo.lastMessage) {
							const secret = await getSharedSecretForUser(
								convo.otherUser,
							);
							const decrypted = await decryptMessage(
								convo.lastMessage.message,
								secret,
							);

							try {
								const parsed = JSON.parse(decrypted);
								if (parsed._attachment) {
									preview = "📎 Attachment (File)";
								} else {
									preview = decrypted;
								}
							} catch (e) {
								preview = decrypted;
							}
						}
						return { ...convo, lastMessagePreview: preview };
					}),
				);

				setConversations(enriched);
			}
		} catch (err) {
			console.error("Error fetching conversations:", err);
		}
	};

	const searchUsers = async () => {
		try {
			const token = sessionStorage.getItem("hrms_react_token");
			const res = await fetch(
				`${BACKEND_HOST}/api/chat/users?search=${encodeURIComponent(searchTerm)}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			const data = await res.json();
			if (res.ok && data.users) {
				setSearchResults(data.users);
			}
		} catch (err) {
			console.error("Error searching users:", err);
		}
	};

	const loadHistory = async (convoId) => {
		try {
			const token = sessionStorage.getItem("hrms_react_token");
			const res = await fetch(
				`${BACKEND_HOST}/api/chat/history/${convoId}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			const data = await res.json();
			if (res.ok && data.messages) {
				const secret = await getSharedSecretForUser(activeConvo.otherUser);
				const decryptedHistory = await Promise.all(
					data.messages.map(async (msg) => {
						const plain = await decryptMessage(msg.message, secret);
						return { ...msg, decryptedText: plain };
					}),
				);
				setMessages(decryptedHistory);
			}
		} catch (err) {
			console.error("Error loading chat history:", err);
		}
	};

	const startDirectChat = async (targetUser) => {
		try {
			const token = sessionStorage.getItem("hrms_react_token");
			const res = await fetch(`${BACKEND_HOST}/api/chat/direct`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ targetUserId: targetUser.id }),
			});
			const data = await res.json();
			if (res.ok && data.conversation_id) {
				const mockConvo = {
					id: data.conversation_id,
					otherUser: {
						id: targetUser.id,
						displayName: targetUser.displayName,
						employeeId: targetUser.employeeId,
						publicKey: targetUser.publicKey,
						profilePicture: targetUser.profile?.profilePictureUrl,
					},
					unreadCount: 0,
				};
				setActiveConvo(mockConvo);
				setSearchTerm("");
				setSearchResults([]);
				setShowSidebar(false);
				fetchConversations();
			}
		} catch (err) {
			console.error("Error starting chat:", err);
		}
	};

	const handleSendMessage = async (e) => {
		if (e) e.preventDefault();
		if (inputText.trim() === "" || !activeConvo) return;

		setIsSending(true);
		try {
			const secret = await getSharedSecretForUser(activeConvo.otherUser);
			const encryptedBlob = await encryptMessage(inputText.trim(), secret);

			const token = sessionStorage.getItem("hrms_react_token");
			const res = await fetch(`${BACKEND_HOST}/api/chat/message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					conversation_id: activeConvo.id,
					message: encryptedBlob,
				}),
			});

			if (res.ok) {
				const data = await res.json();
				setMessages((prev) => [
					...prev,
					{
						id: data.id,
						senderId: currentUser.empId, // Map to display sender properly
						message: encryptedBlob,
						timestamp: data.timestamp,
						decryptedText: inputText.trim(),
					},
				]);
				setInputText("");
				fetchConversations();
			}
		} catch (err) {
			console.error("Error sending message:", err);
		} finally {
			setIsSending(false);
		}
	};

	const handleFileUpload = async (e) => {
		const files = e.target.files;
		if (!files || files.length === 0 || !activeConvo) return;

		setIsUploading(true);
		const formData = new FormData();
		formData.append("files", files[0]);

		try {
			const token = sessionStorage.getItem("hrms_react_token");
			const uploadRes = await fetch(
				`${BACKEND_HOST}/api/chat/upload`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				},
			);
			const uploadData = await uploadRes.json();

			if (uploadRes.ok && uploadData.files && uploadData.files[0]) {
				const attachmentPayload = JSON.stringify({
					_attachment: true,
					path: uploadData.files[0].path,
					filename: uploadData.files[0].filename,
				});

				const secret = await getSharedSecretForUser(activeConvo.otherUser);
				const encryptedBlob = await encryptMessage(
					attachmentPayload,
					secret,
				);

				const msgRes = await fetch(
					`${BACKEND_HOST}/api/chat/message`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({
							conversation_id: activeConvo.id,
							message: encryptedBlob,
						}),
					},
				);

				if (msgRes.ok) {
					const data = await msgRes.json();
					setMessages((prev) => [
						...prev,
						{
							id: data.id,
							senderId: currentUser.empId,
							message: encryptedBlob,
							timestamp: data.timestamp,
							decryptedText: attachmentPayload,
						},
					]);
					fetchConversations();
				}
			}
		} catch (err) {
			console.error("Upload error:", err);
		} finally {
			setIsUploading(false);
		}
	};

	const markAsRead = async (convo, lastMessageId) => {
		if (!convo.lastMessage && !lastMessageId) return;
		const msgId = lastMessageId || convo.lastMessage?.id;
		if (!msgId) return;

		try {
			const token = sessionStorage.getItem("hrms_react_token");
			await fetch(`${BACKEND_HOST}/api/chat/read`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					conversation_id: convo.id,
					last_read_message_id: msgId,
				}),
			});
		} catch (err) {
			console.error("Error marking read:", err);
		}
	};

	const handleUnlock = async (e) => {
		e.preventDefault();
		setUnlockError("");
		setIsUnlocking(true);

		const key = await handleLoginCryptoSetup(passwordInput);
		setIsUnlocking(false);

		if (!key) {
			setUnlockError(
				"Failed to decrypt your vault. Please verify your password.",
			);
		}
	};

	const formatTime = (ts) => {
		if (!ts) return "";
		const date = new Date(parseInt(ts));
		return date.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Render attachment helpers
	const renderMessageContent = (msg) => {
		try {
			const data = JSON.parse(msg.decryptedText);
			if (data._attachment) {
				const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(data.path);
				const fileUrl = `${BACKEND_HOST}${data.path}`;

				if (isImage) {
					return (
						<div className="space-y-2">
							<img
								src={fileUrl}
								alt="Shared Attachment"
								className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer border border-neutral-200 dark:border-neutral-800"
								onClick={() => window.open(fileUrl, "_blank")}
							/>
							<div className="flex items-center gap-1.5 text-xs opacity-75">
								<Paperclip size={12} />
								<span className="truncate max-w-[150px]">
									{data.filename}
								</span>
							</div>
						</div>
					);
				} else {
					return (
						<a
							href={fileUrl}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-xl transition-all"
						>
							<Download className="w-5 h-5 text-slate-500 dark:text-neutral-400" />
							<div className="text-left overflow-hidden">
								<p className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate">
									{data.filename}
								</p>
								<p className="text-[10px] text-slate-400 dark:text-neutral-500">
									Download attachment
								</p>
							</div>
						</a>
					);
				}
			}
		} catch (e) {}

		return (
			<p className="text-sm leading-relaxed whitespace-pre-wrap">
				{msg.decryptedText}
			</p>
		);
	};

	if (!myPrivateKey) {
		return (
			<div className="min-h-full flex items-center justify-center p-4">
				<div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-10 shadow-xl text-center">
					<div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6 shrink-0 animate-pulse">
						<Lock className="w-6 h-6 text-black dark:text-white" />
					</div>
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
						Unlock Secure Chat
					</h2>
					<p className=" mb-4 mt-4 text-sm text-slate-500 dark:text-neutral-400 leading-relaxed">
						To maintain zero-knowledge End-to-End Encryption, please enter
						your login password to decrypt your secure vault key.
					</p>

					<form onSubmit={handleUnlock} className="mt-12 space-y-5">
						<input
							type="password"
							required
							value={passwordInput}
							onChange={(e) => setPasswordInput(e.target.value)}
							placeholder="Enter your account password"
							className="w-full px-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
						/>

						{unlockError && (
							<p className="text-xs text-rose-600 dark:text-rose-450 font-bold">
								{unlockError}
							</p>
						)}

						<button
							type="submit"
							disabled={isUnlocking}
							className="w-full py-3 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 duration-150"
						>
							{isUnlocking ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Decrypting vault...
								</>
							) : (
								"Unlock Chat Vault"
							)}
						</button>
					</form>

					<div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-widest font-semibold">
						<ShieldCheck className="w-4 h-4 text-emerald-500" />
						AES-256-GCM zero-knowledge E2EE
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100vh-160px)] bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl shadow-sm flex overflow-hidden h-[650px]">
			{/* Sidebar List */}
			<div
				className={`w-full md:w-[320px] flex-shrink-0 border-r border-slate-100 dark:border-neutral-800/60 flex flex-col ${!showSidebar && "hidden md:flex"}`}
			>
				{/* Search Header */}
				<div className="p-4 border-b border-slate-100 dark:border-neutral-800/60">
					<div className="relative flex items-center">
						<Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-neutral-500 pointer-events-none" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search employee or ID..."
							className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-black dark:focus:border-white transition-all"
						/>
					</div>
				</div>

				{/* Search Results / Conversations List */}
				<div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-neutral-900">
					{searchTerm.trim() !== "" ? (
						<div>
							<p className="p-3 text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-wider">
								Search Results
							</p>
							{searchResults.length === 0 ? (
								<p className="p-4 text-xs text-slate-400 dark:text-neutral-500 text-center">
									No matching employees
								</p>
							) : (
								searchResults.map((user) => (
									<button
										key={user.id}
										onClick={() => startDirectChat(user)}
										className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-neutral-950 transition-colors text-left"
									>
										<img
											src={
												user.profile?.profilePictureUrl ||
												noProfilePic
											}
											className="w-10 h-10 rounded-full object-cover"
											alt="Avatar"
										/>
										<div>
											<p className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
												{user.displayName}
											</p>
											<p className="text-xs text-slate-400 dark:text-neutral-500">
												{user.profile?.department || "Operations"}
											</p>
										</div>
									</button>
								))
							)}
						</div>
					) : (
						<div>
							<p className="px-4 pt-4 pb-2 text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-500 tracking-wider">
								Conversations
							</p>
							{conversations.length === 0 ? (
								<div className="py-12 px-6 text-center flex flex-col items-center justify-center space-y-3">
									<div className="w-10 h-10 bg-slate-50 dark:bg-neutral-850 rounded-full flex items-center justify-center">
										<ShieldCheck className="w-5 h-5 text-slate-400 dark:text-neutral-500" />
									</div>
									<p className="text-xs text-slate-400 dark:text-neutral-500 leading-relaxed max-w-[200px]">
										No active secure chats. Search for an employee above to start.
									</p>
								</div>
							) : (
								conversations.map((convo) => {
									const isSelected =
										activeConvo && activeConvo.id === convo.id;
									return (
										<button
											key={convo.id}
											onClick={() => {
												setActiveConvo(convo);
												setShowSidebar(false);
											}}
											className={`w-full flex items-center gap-3 p-4 transition-all text-left ${isSelected ? "bg-slate-50 dark:bg-neutral-950/70 border-l-4 border-black dark:border-white" : "hover:bg-slate-50/50 dark:hover:bg-neutral-950/20"}`}
										>
											<img
												src={
													convo.otherUser.profilePicture ||
													noProfilePic
												}
												className="w-10 h-10 rounded-full object-cover"
												alt="Avatar"
											/>
											<div className="flex-1 min-w-0">
												<div className="flex justify-between items-baseline mb-0.5">
													<p
														className={`text-sm font-semibold truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-neutral-300"}`}
													>
														{convo.otherUser.displayName}
													</p>
													{convo.lastMessage && (
														<span className="text-[10px] text-slate-400 dark:text-neutral-500">
															{formatTime(
																convo.lastMessage.timestamp,
															)}
														</span>
													)}
												</div>
												<p className="text-xs text-slate-400 dark:text-neutral-500 truncate">
													{convo.lastMessagePreview}
												</p>
											</div>
											{convo.unreadCount > 0 && (
												<span className="w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 animate-pulse">
													{convo.unreadCount}
												</span>
											)}
										</button>
									);
								})
							)}
						</div>
					)}
				</div>
			</div>

			{/* Chat Conversation Pane */}
			<div
				className={`flex-1 flex flex-col bg-slate-50 dark:bg-neutral-950/20 ${showSidebar && "hidden md:flex"}`}
			>
				{activeConvo ? (
					<>
						{/* Conversation Header */}
						<div className="bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800/60 p-4 flex items-center gap-3">
							<button
								onClick={() => setShowSidebar(true)}
								className="md:hidden p-1.5 hover:bg-slate-50 dark:hover:bg-neutral-850 rounded-lg text-slate-500 dark:text-neutral-400"
							>
								<ArrowLeft className="w-5 h-5" />
							</button>
							<img
								src={
									activeConvo.otherUser.profilePicture ||
									noProfilePic
								}
								className="w-10 h-10 rounded-full object-cover"
								alt="Avatar"
							/>
							<div>
								<h3 className="text-sm font-bold text-slate-950 dark:text-white">
									{activeConvo.otherUser.displayName}
								</h3>
								<p className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium tracking-wider uppercase flex items-center gap-1.5">
									<ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
									Secure E2EE Channel
								</p>
							</div>
						</div>

						{/* Messages Body */}
						<div className="flex-1 overflow-y-auto p-6 space-y-6">
							{messages.map((msg, index) => {
								const isMe =
									msg.senderId !== activeConvo.otherUser.employeeId;
								return (
									<div
										key={msg.id || index}
										className={`flex ${isMe ? "justify-end" : "justify-start"}`}
									>
										<div
											className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm relative group ${isMe ? "bg-black text-white rounded-tr-none" : "bg-white border border-slate-200/60 dark:bg-neutral-900 dark:border-neutral-800/60 text-slate-900 dark:text-white rounded-tl-none"}`}
										>
											{renderMessageContent(msg)}
											<p
												className={`text-[9px] mt-1 text-right block select-none ${isMe ? "text-neutral-400" : "text-neutral-500"}`}
											>
												{formatTime(msg.timestamp)}
											</p>
										</div>
									</div>
								);
							})}
							<div ref={messagesEndRef} />
						</div>

						{/* Input Footer */}
						<form
							onSubmit={handleSendMessage}
							className="bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800/60 p-4 flex gap-3 items-center"
						>
							<input
								type="file"
								ref={fileInputRef}
								onChange={handleFileUpload}
								className="hidden"
								accept="image/*,.pdf,.doc,.docx"
							/>

							<button
								type="button"
								disabled={isUploading}
								onClick={() => fileInputRef.current?.click()}
								className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-950 dark:hover:bg-neutral-800/60 transition-all cursor-pointer"
							>
								{isUploading ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Image className="w-5 h-5" />
								)}
							</button>

							<input
								type="text"
								required
								value={inputText}
								onChange={(e) => setInputText(e.target.value)}
								placeholder="Type a secure message..."
								className="flex-1 px-4 py-2.5 border border-slate-100 dark:border-neutral-800 rounded-xl bg-slate-50 dark:bg-neutral-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-white transition-all"
							/>

							<button
								type="submit"
								disabled={isSending || inputText.trim() === ""}
								className="p-2.5 bg-black hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-95 duration-100 flex items-center justify-center"
							>
								{isSending ? (
									<Loader2 className="w-5 h-5 animate-spin" />
								) : (
									<Send className="w-5 h-5" />
								)}
							</button>
						</form>
					</>
				) : (
					<div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
						<div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center animate-pulse">
							<ShieldCheck className="w-8 h-8 text-emerald-500" />
						</div>
						<div className="space-y-2">
							<h3 className="font-bold text-slate-900 dark:text-white text-base">
								Select a conversation
							</h3>
							<p className="text-xs text-slate-400 dark:text-neutral-500 leading-relaxed max-w-sm mx-auto">
								All communication inside this channel is protected with
								End-to-End Encryption. Only you and the recipient can read
								its contents.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
